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
        select: "name course",
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
    const companySelections = {};
    applications
      .filter((a) => a.status === "Selected")
      .forEach((a) => {
        const name = a.jobId?.companyId?.name || "Unknown";
        if (!companySelections[name]) {
          companySelections[name] = { count: 0, students: [] };
        }
        companySelections[name].count += 1;
        companySelections[name].students.push(studentInfo(a));
      });
    const companyData = Object.entries(companySelections)
      .map(([name, data]) => ({
        name,
        Selected: data.count,
        students: data.students,
      }))
      .sort((a, b) => b.Selected - a.Selected);

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
    const applications = await Application.find({
      studentId: { $in: students.map((s) => s._id) },
    })
      .populate("studentId", "name")
      .populate({
        path: "jobId",
        populate: { path: "companyId", select: "name" },
      });

    const workbook = new ExcelJS.Workbook();

    const summarySheet = workbook.addWorksheet("Summary");
    const placed = students.filter(
      (s) => s.placementStatus === "Placed",
    ).length;
    summarySheet.addRow(["Metric", "Value"]);
    summarySheet.addRow(["Total Students", students.length]);
    summarySheet.addRow(["Placed", placed]);
    summarySheet.addRow(["Not Placed", students.length - placed]);
    summarySheet.addRow([
      "Placement %",
      students.length > 0
        ? ((placed / students.length) * 100).toFixed(1) + "%"
        : "0%",
    ]);

    const studentSheet = workbook.addWorksheet("Student Details");
    studentSheet.addRow([
      "Name",
      "ERP ID",
      "Course",
      "School",
      "Batch",
      "CGPA",
      "Placement Status",
    ]);
    students.forEach((s) => {
      studentSheet.addRow([
        s.name,
        s.userId?.erpId || "",
        s.course,
        s.school,
        s.batch,
        s.cgpa,
        s.placementStatus,
      ]);
    });

    const companySheet = workbook.addWorksheet("Company Data");
    companySheet.addRow(["Company", "Role", "Student Name", "Status"]);
    applications.forEach((a) => {
      companySheet.addRow([
        a.jobId?.companyId?.name || "",
        a.jobId?.role || "",
        a.studentId?.name || "",
        a.status,
      ]);
    });

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    res.setHeader("Content-Disposition", "attachment; filename=analytics.xlsx");
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getAnalytics, exportAnalyticsExcel };