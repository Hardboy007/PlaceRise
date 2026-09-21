const Student = require("../models/Student");
const Application = require("../models/Application");
const JobPosting = require("../models/JobPosting");
const Company = require("../models/company");
const ExcelJS = require("exceljs");

// Pulls { name, erpId, course } out of a populated Application document.
// Shared by companyData, ctcDistribution, and funnel so all three drill-
// down modals show the same student info shape.
const studentInfo = (application) => ({
  name: application.studentId?.name || "Unknown Student",
  erpId: application.studentId?.userId?.erpId || "N/A",
  course: application.studentId?.course || "N/A",
});

// studentInfo + company name — used by the funnel drilldown so each
// student in Applied/Shortlisted/Selected also shows which company
// they applied to / were shortlisted or selected by.
const studentWithCompany = (application) => ({
  ...studentInfo(application),
  company: application.jobId?.companyId?.name || "Unknown",
});

const getAnalytics = async (req, res) => {
  try {
    const { batch, school, jobType } = req.query;

    const studentFilter = {};
    if (batch) studentFilter.batch = batch;
    if (school) studentFilter.school = school;

    const students = await Student.find(studentFilter);
    const studentIds = students.map((s) => s._id);

    const applications = await Application.find({
      studentId: { $in: studentIds },
    })
      .populate({
        path: "studentId",
        select: "name course school",
        populate: { path: "userId", select: "erpId" },
      })
      .populate({
        path: "jobId",
        populate: { path: "companyId", select: "name" },
      });

    const placedStudents = students.filter(
      (s) => s.placementStatus === "Placed",
    );

    const selectedApps = applications.filter(
      (a) => a.status === "Selected" && a.jobId?.ctc,
    );
    const ctcs = selectedApps.map((a) => a.jobId.ctc);
    const highestCTC = ctcs.length ? Math.max(...ctcs) : 0;
    const avgCTC = ctcs.length
      ? (ctcs.reduce((a, b) => a + b, 0) / ctcs.length).toFixed(1)
      : 0;

    const jobs = await JobPosting.find(jobType ? { jobType } : {}).populate(
      "companyId",
      "name",
    );
    const uniqueCompanies = new Set(
      jobs.map((j) => j.companyId?._id?.toString()).filter(Boolean),
    ).size;

    // Branch-wise
    const branchMap = {};
    students.forEach((s) => {
      const key = s.course || "Unknown";
      if (!branchMap[key]) branchMap[key] = { total: 0, placed: 0 };
      branchMap[key].total++;
      if (s.placementStatus === "Placed") branchMap[key].placed++;
    });
    const branchData = Object.entries(branchMap).map(([name, d]) => ({
      name,
      Total: d.total,
      Placed: d.placed,
      "Not Placed": d.total - d.placed,
      rate: d.total > 0 ? ((d.placed / d.total) * 100).toFixed(1) : 0,
    }));

    // CTC Distribution — each bucket carries the list of selected students
    // that fall into it, and now each student also carries their own CTC
    // so the drilldown modal can show exactly what package they got.
    const ctcRanges = [
      { label: "0-5 LPA", min: 0, max: 5 },
      { label: "5-10 LPA", min: 5, max: 10 },
      { label: "10-15 LPA", min: 10, max: 15 },
      { label: "15+ LPA", min: 15, max: Infinity },
    ];
    const ctcDistribution = ctcRanges.map((r) => {
      const appsInRange = selectedApps.filter(
        (a) => a.jobId.ctc >= r.min && a.jobId.ctc < r.max,
      );
      return {
        name: r.label,
        Students: appsInRange.length,
        students: appsInRange.map((a) => ({
          ...studentInfo(a),
          ctc: a.jobId.ctc,
        })),
      };
    });

    // Funnel — each stage now carries its own student list for drill-down,
    // with each student also carrying the company name of the job they
    // applied to / were shortlisted or selected for.
    const appliedApps = applications;
    const shortlistedApps = applications.filter((a) =>
      ["Shortlisted", "Selected"].includes(a.status),
    );
    const selectedStageApps = applications.filter(
      (a) => a.status === "Selected",
    );

    const totalApplied = appliedApps.length;
    const totalShortlisted = shortlistedApps.length;
    const totalSelected = selectedStageApps.length;

    // Company selections (with student details)
    const companyStudentMap = {};

    applications
      .filter((a) => a.status === "Selected")
      .forEach((a) => {
        const name = a.jobId?.companyId?.name || "Unknown";

        if (!companyStudentMap[name]) {
          companyStudentMap[name] = [];
        }

        companyStudentMap[name].push({
          ...studentInfo(a),
          ctc: a.jobId?.ctc || 0,
        });
      });

    const companyData = Object.entries(companyStudentMap)
      .map(([name, studs]) => ({
        name,
        Selected: studs.length,
        students: studs,
      }))
      .sort((a, b) => b.Selected - a.Selected);

    // School-wise companies — kitni unique companies ne us school ke students ko select kiya
    const schoolCompanyMap = {};
    applications
      .filter((a) => a.status === "Selected")
      .forEach((a) => {
        const schoolName = a.studentId?.school || "Unknown";
        const companyName = a.jobId?.companyId?.name;
        if (!companyName) return;
        if (!schoolCompanyMap[schoolName])
          schoolCompanyMap[schoolName] = new Set();
        schoolCompanyMap[schoolName].add(companyName);
      });

    const schoolWiseCompanies = Object.entries(schoolCompanyMap)
      .map(([name, companies]) => ({
        name,
        Companies: companies.size,
        companyList: Array.from(companies),
      }))
      .sort((a, b) => b.Companies - a.Companies);

    res.json({
      summary: {
        totalStudents: students.length,
        placed: placedStudents.length,
        notPlaced: students.length - placedStudents.length,
        placementPercent:
          students.length > 0
            ? ((placedStudents.length / students.length) * 100).toFixed(1)
            : 0,
        highestCTC,
        avgCTC,
        totalCompanies: uniqueCompanies,
        totalDrives: jobs.length,
      },
      branchData,
      ctcDistribution,
      companyData,
      schoolWiseCompanies,
      funnel: {
        totalApplied,
        totalShortlisted,
        totalSelected,
        appliedStudents: appliedApps.map(studentWithCompany),
        shortlistedStudents: shortlistedApps.map(studentWithCompany),
        selectedStudents: selectedStageApps.map(studentWithCompany),
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const exportAnalyticsExcel = async (req, res) => {
  try {
    const { batch, school } = req.query;
    const studentFilter = {};
    if (batch) studentFilter.batch = batch;
    if (school) studentFilter.school = school;

    const students = await Student.find(studentFilter).populate(
      "userId",
      "erpId",
    );
    const placed = students.filter(
      (s) => s.placementStatus === "Placed",
    ).length;
    const notPlaced = students.length - placed;
    const placementPct =
      students.length > 0
        ? ((placed / students.length) * 100).toFixed(1) + "%"
        : "0%";

    const applications = await Application.find({
      studentId: { $in: students.map((s) => s._id) },
    })
      .populate("studentId", "name course school batch cgpa")
      .populate({
        path: "jobId",
        populate: { path: "companyId", select: "name" },
      });

    const selectedApps = applications.filter((a) => a.status === "Selected");

    // School wise stats
    const schoolMap = {};
    students.forEach((s) => {
      if (!s.school) return;
      if (!schoolMap[s.school])
        schoolMap[s.school] = { total: 0, placed: 0, ctcs: [] };
      schoolMap[s.school].total++;
      if (s.placementStatus === "Placed") schoolMap[s.school].placed++;
    });
    selectedApps.forEach((a) => {
      const school = a.studentId?.school;
      if (school && schoolMap[school] && a.jobId?.ctc) {
        schoolMap[school].ctcs.push(a.jobId.ctc);
      }
    });

    // Company wise stats
    const companyMap = {};
    applications.forEach((a) => {
      const name = a.jobId?.companyId?.name;
      if (!name) return;
      if (!companyMap[name]) companyMap[name] = { offers: 0, ctcs: [] };
      if (a.status === "Selected") {
        companyMap[name].offers++;
        if (a.jobId?.ctc) companyMap[name].ctcs.push(a.jobId.ctc);
      }
    });

    const workbook = new ExcelJS.Workbook();
    workbook.creator = "PlaceRise";
    workbook.created = new Date();

    // ── Sheet 1 — Summary ──
    const summarySheet = workbook.addWorksheet("Summary");
    summarySheet.columns = [{ width: 30 }, { width: 20 }];

    const addHeader = (sheet, title) => {
      const row = sheet.addRow([title]);
      row.font = { bold: true, size: 13, color: { argb: "FFFFFFFF" } };
      row.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF1D4ED8" },
      };
      row.height = 22;
      sheet.addRow([]);
    };

    const addTableHeader = (sheet, headers) => {
      const row = sheet.addRow(headers);
      row.font = { bold: true, color: { argb: "FFFFFFFF" } };
      row.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF3B82F6" },
      };
      row.height = 18;
    };

    addHeader(summarySheet, "PlaceRise — Placement Analytics Summary");

    const filterInfo = [
      batch ? `Batch: ${batch}` : "Batch: All",
      school ? `School: ${school}` : "School: All",
      `Generated: ${new Date().toLocaleDateString("en-IN")}`,
    ].join("   |   ");
    const filterRow = summarySheet.addRow([filterInfo]);
    filterRow.font = { italic: true, color: { argb: "FF64748B" } };
    summarySheet.addRow([]);

    // Overall stats table
    addTableHeader(summarySheet, ["Metric", "Value"]);
    [
      ["Total Students", students.length],
      ["Students Placed", placed],
      ["Students Not Placed", notPlaced],
      ["Placement Rate", placementPct],
      [
        "Total Drives",
        new Set(applications.map((a) => a.jobId?._id?.toString())).size,
      ],
      [
        "Total Companies",
        new Set(
          applications.map((a) => a.jobId?.companyId?.name).filter(Boolean),
        ).size,
      ],
      [
        "Average CTC (LPA)",
        selectedApps.length > 0
          ? (
              selectedApps.reduce((s, a) => s + (a.jobId?.ctc || 0), 0) /
              selectedApps.length
            ).toFixed(2)
          : "N/A",
      ],
      [
        "Highest CTC (LPA)",
        selectedApps.length > 0
          ? Math.max(...selectedApps.map((a) => a.jobId?.ctc || 0))
          : "N/A",
      ],
    ].forEach(([metric, value]) => {
      const row = summarySheet.addRow([metric, value]);
      row.getCell(1).font = { bold: true };
    });

    summarySheet.addRow([]);
    summarySheet.addRow([]);

    // School wise table
    addTableHeader(summarySheet, [
      "School",
      "Total Students",
      "Placed",
      "Placement %",
      "Avg CTC (LPA)",
      "Highest CTC (LPA)",
    ]);
    Object.entries(schoolMap).forEach(([schoolName, data]) => {
      const pct =
        data.total > 0
          ? ((data.placed / data.total) * 100).toFixed(1) + "%"
          : "0%";
      const avgCtc =
        data.ctcs.length > 0
          ? (data.ctcs.reduce((a, b) => a + b, 0) / data.ctcs.length).toFixed(2)
          : "N/A";
      const highCtc = data.ctcs.length > 0 ? Math.max(...data.ctcs) : "N/A";
      summarySheet.addRow([
        schoolName,
        data.total,
        data.placed,
        pct,
        avgCtc,
        highCtc,
      ]);
    });

    summarySheet.columns = [
      { width: 35 },
      { width: 18 },
      { width: 12 },
      { width: 15 },
      { width: 16 },
      { width: 18 },
    ];

    // ── Sheet 2 — Company Data ──
    const companySheet = workbook.addWorksheet("Company Data");
    addHeader(companySheet, "Company-wise Placement Data");
    addTableHeader(companySheet, [
      "Company",
      "Total Offers",
      "Avg CTC (LPA)",
      "Highest CTC (LPA)",
    ]);
    Object.entries(companyMap).forEach(([name, data]) => {
      const avgCtc =
        data.ctcs.length > 0
          ? (data.ctcs.reduce((a, b) => a + b, 0) / data.ctcs.length).toFixed(2)
          : "N/A";
      const highCtc = data.ctcs.length > 0 ? Math.max(...data.ctcs) : "N/A";
      companySheet.addRow([name, data.offers, avgCtc, highCtc]);
    });
    companySheet.columns = [
      { width: 30 },
      { width: 15 },
      { width: 16 },
      { width: 18 },
    ];

    // ── Sheet 3 — Student Details ──
    const studentSheet = workbook.addWorksheet("Student Details");
    addHeader(studentSheet, "Student-wise Placement Details");
    addTableHeader(studentSheet, [
      "Name",
      "ERP ID",
      "Course",
      "School",
      "Batch",
      "CGPA",
      "Placement Status",
    ]);
    students.forEach((s) => {
      const row = studentSheet.addRow([
        s.name,
        s.userId?.erpId || "",
        s.course,
        s.school,
        s.batch,
        s.cgpa,
        s.placementStatus,
      ]);
      if (s.placementStatus === "Placed") {
        row.getCell(7).font = { color: { argb: "FF16A34A" }, bold: true };
      }
    });
    studentSheet.columns = [
      { width: 25 },
      { width: 15 },
      { width: 25 },
      { width: 30 },
      { width: 10 },
      { width: 8 },
      { width: 16 },
    ];

    // ── Sheet 4 — Applications ──
    const appSheet = workbook.addWorksheet("Applications");
    addHeader(appSheet, "Application Details");
    addTableHeader(appSheet, [
      "Student Name",
      "ERP ID",
      "Course",
      "Company",
      "Role",
      "CTC (LPA)",
      "Status",
    ]);
    applications.forEach((a) => {
      const row = appSheet.addRow([
        a.studentId?.name || "",
        a.studentId?.userId?.erpId || "",
        a.studentId?.course || "",
        a.jobId?.companyId?.name || "",
        a.jobId?.role || "",
        a.jobId?.ctc || "",
        a.status,
      ]);
      const statusColors = {
        Selected: "FF16A34A",
        Shortlisted: "FFF59E0B",
        Rejected: "FFEF4444",
        Applied: "FF3B82F6",
      };
      if (statusColors[a.status]) {
        row.getCell(7).font = {
          color: { argb: statusColors[a.status] },
          bold: true,
        };
      }
    });
    appSheet.columns = [
      { width: 25 },
      { width: 15 },
      { width: 25 },
      { width: 20 },
      { width: 20 },
      { width: 12 },
      { width: 12 },
    ];

    // Dynamic filename
    const label = [
      batch ? `Batch_${batch}` : "All_Batches",
      school ? school.replace(/\s+/g, "_") : "All_Schools",
    ].join("_");

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=PlaceRise_Analytics_${label}_${new Date().getFullYear()}.xlsx`,
    );
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getAnalytics, exportAnalyticsExcel };
