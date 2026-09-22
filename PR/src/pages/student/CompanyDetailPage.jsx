import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../../utils/api";
import {
  ArrowLeft,
  Building2,
  Calendar,
  Clock,
  Briefcase,
  TrendingUp,
  Users,
  CheckCircle,
  Send,
  Code,
  Gift,
  Star,
  AlertTriangle,
  Download,
  X,
  AlertCircle,
  FileText,
  ExternalLink,
} from "lucide-react";
import CompanyLogo from "../../components/common/CompanyLogo";

// ─── Role group helpers (student ke course/branch se matched roles) ───
const branchMatches = (eligibleBranches, student) =>
  !eligibleBranches?.length ||
  eligibleBranches.includes("All") ||
  eligibleBranches.includes(student?.course) ||
  eligibleBranches.includes(student?.branch);

const getRoleGroups = (job) => {
  if (job?.roleGroups?.length) return job.roleGroups;
  if (job?.role) {
    return [
      {
        _id: "legacy",
        role: job.role,
        ctc: job.ctc,
        eligibleBranches: job.eligibleBranches ?? [],
        skills: job.skills ?? [],
        selectionProcess: job.selectionProcess ?? [],
      },
    ];
  }
  return [];
};

const getMatchedRoleGroups = (job, student) =>
  getRoleGroups(job).filter((rg) =>
    branchMatches(rg.eligibleBranches, student),
  );

// Coordinator ka `<input type="time">` "17:00" (24h) bhejta hai -> "5:00 PM".
// Agar value pehle se kisi aur format me hai to jaisi hai waisi dikha do.
const formatTime = (t) => {
  const m = /^(\d{1,2}):(\d{2})$/.exec(String(t ?? "").trim());
  if (!m) return t || "";
  const h = Number(m[1]);
  const suffix = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${m[2]} ${suffix}`;
};

// Link ke aage https:// na ho to auto laga dega
const normalizeUrl = (url) => {
  const u = (url || "").trim();
  if (!u) return "";
  return /^https?:\/\//i.test(u) ? u : `https://${u}`;
};

export default function CompanyDetailPage() {
  const { companyId } = useParams();
  const navigate = useNavigate();
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const [applied, setApplied] = useState(false);
  const [existingStatus, setExistingStatus] = useState(null);
  const [applyLoading, setApplyLoading] = useState(false);
  const [isEligible, setIsEligible] = useState(true);
  const [ineligibilityReasons, setIneligibilityReasons] = useState([]);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [resumeConfirmed, setResumeConfirmed] = useState(false);
  const [studentProfile, setStudentProfile] = useState(null);
  const [selectedRoleGroupId, setSelectedRoleGroupId] = useState(null);
  const [appliedRoleIds, setAppliedRoleIds] = useState(new Set());
  const [selectedRoleGroupIds, setSelectedRoleGroupIds] = useState([]);

  const goBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate("/student/companies");
    }
  };

  useEffect(() => {
    document.title = "Job Details";
    const fetchJob = async () => {
      try {
        const [data, studentData] = await Promise.all([
          api.get(`/companies/jobs/${companyId}`),
          api.get("/students/me"),
        ]);
        setCompany(data);
        setStudentProfile(studentData);

        const reasons = [];

        // Branch check ab roleGroups par: kam se kam ek role me student ka
        // course/branch aana chahiye. (Saare roles ki branches user ko
        // dikhane ki zaroorat nahi, isliye generic message.)
        const matchedForStudent = getMatchedRoleGroups(data, studentData);
        if (matchedForStudent.length === 0) {
          reasons.push("Your course/branch is not eligible for this drive");
        }

        const cgpaOk =
          !data.minCgpa || (studentData?.cgpa ?? 0) >= data.minCgpa;
        if (!cgpaOk) {
          reasons.push(
            `CGPA ${studentData?.cgpa ?? 0} is below required ${data.minCgpa}`,
          );
        }

        const tenthOk =
          !data.minTenthPercentage ||
          (studentData?.tenthMarks ?? 0) >= data.minTenthPercentage;
        if (!tenthOk) {
          reasons.push(`10th marks below required ${data.minTenthPercentage}%`);
        }

        const twelfthOk =
          !data.minTwelfthPercentage ||
          (studentData?.twelfthMarks ?? 0) >= data.minTwelfthPercentage;
        if (!twelfthOk) {
          reasons.push(
            `12th marks below required ${data.minTwelfthPercentage}%`,
          );
        }

        const backlogOk =
          (studentData?.backlogs ?? 0) <= (data.maxBacklogs ?? 99);
        if (!backlogOk) {
          reasons.push(
            `Backlogs (${studentData?.backlogs ?? 0}) exceed max allowed (${data.maxBacklogs})`,
          );
        }

        setIsEligible(reasons.length === 0);
        setIneligibilityReasons(reasons);

        try {
          const myApps = await api.get("/applications/my");
          const jobApps = Array.isArray(myApps)
            ? myApps.filter((a) => a.jobId?._id === data._id)
            : [];

          if (jobApps.length > 0) {
            setExistingStatus(jobApps[0].status);
            const appliedIds = new Set(
              jobApps.map((a) => a.roleGroupId?.toString()).filter(Boolean),
            );
            setAppliedRoleIds(appliedIds);

            if (!data.allowMultipleRoleApplications) {
              setApplied(true);
            } else {
              const allRoleIds = getRoleGroups(data).map((rg) =>
                rg._id?.toString(),
              );
              const allApplied = allRoleIds.every((id) => appliedIds.has(id));
              setApplied(allApplied);
            }
          }
        } catch (e) {
          console.error("Could not verify existing application:", e);
        }
      } catch (err) {
        console.error(err);
      }
      setLoading(false);
    };
    fetchJob();
  }, [companyId]);

  const handleApply = () => {
    setResumeConfirmed(false);
    setShowApplyModal(true);
  };

  const submitApplication = async () => {
    setApplyLoading(true);
    try {
      const roleIds = company.allowMultipleRoleApplications
        ? selectedRoleGroupIds
        : [selectedRoleGroupId];

      for (const roleId of roleIds) {
        await api.post("/applications", {
          jobId: company._id,
          roleGroupId: roleId,
        });
      }
      setApplied(true);
      setShowApplyModal(false);
    } catch (err) {
      alert(err.message || "Something went wrong");
    }
    setApplyLoading(false);
  };

  const handleDownloadPDF = () => {
    if (!company.jdPdfUrl) {
      alert("No JD PDF available for this job yet.");
      return;
    }

    const companyName = (companyInfo.name || "JD").replace(
      /[^a-zA-Z0-9_-]/g,
      "_",
    );

    const downloadUrl = company.jdPdfUrl.replace(
      "/upload/",
      `/upload/fl_attachment:${companyName}/`,
    );

    window.open(downloadUrl, "_blank");
  };

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-64">
        <p className="text-sm text-[#64748B]">Loading...</p>
      </div>
    );

  if (!company)
    return (
      <div className="flex flex-col items-center justify-center min-h-64 gap-4">
        <Building2 size={48} className="text-[#CBD5E1]" />
        <p className="text-sm text-[#64748B]">Job not found</p>
        <button
          onClick={goBack}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#3B82F6] text-white text-sm font-medium"
        >
          <ArrowLeft size={14} /> Back
        </button>
      </div>
    );

  const companyInfo = company.companyId || {};
  const deadline = new Date(company.lastDate);
  deadline.setHours(23, 59, 59, 999);
  const isExpired = deadline < new Date();

  // Coordinator ne bond / registration link daala ho tabhi dikhega
  const registrationLink = normalizeUrl(company.registrationLink);
  const bondDetails = (company.bondDetails || "").trim();

  // ── Sirf is student ke matched role(s) ──
  const matchedRoles = getMatchedRoleGroups(company, studentProfile);
  const multiRole = matchedRoles.length > 1;
  const roleTitle = matchedRoles
    .map((r) => r.role)
    .filter(Boolean)
    .join(" / ");

  const ctcNums = matchedRoles
    .map((r) => Number(r.ctc))
    .filter((n) => !isNaN(n) && n > 0);
  const ctcMin = ctcNums.length ? Math.min(...ctcNums) : 0;
  const ctcMax = ctcNums.length ? Math.max(...ctcNums) : 0;
  const ctcLabel = !ctcNums.length
    ? null
    : ctcMin === ctcMax
      ? `₹${ctcMax} LPA`
      : `₹${ctcMin}–${ctcMax} LPA`;

  const eligibleBranchList = [
    ...new Set(matchedRoles.flatMap((r) => r.eligibleBranches ?? [])),
  ];
  const rolesWithSkills = matchedRoles.filter((r) => r.skills?.length > 0);
  const rolesWithProcess = matchedRoles.filter(
    (r) => r.selectionProcess?.length > 0,
  );

  // Baaki pages jaisa: dono dates ko local midnight par normalize karke
  // whole-day gap. 0 = aaj hi last date, negative = deadline nikal chuki.
  const daysLeft = () => {
    const now = new Date();
    const todayMid = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const last = new Date(company.lastDate);
    const lastMid = new Date(
      last.getFullYear(),
      last.getMonth(),
      last.getDate(),
    );
    return Math.round((lastMid - todayMid) / 86400000);
  };

  const days = daysLeft();
  const deadlineLabel =
    days < 0 ? "Expired" : days === 0 ? "Today · Last day" : `${days}d left`;
  const deadlineColor =
    days <= 3
      ? "border-t-[#EF4444]"
      : days <= 7
        ? "border-t-[#F59E0B]"
        : "border-t-[#22C55E]";

  return (
    <div
      className="max-w-3xl mx-auto px-4 sm:px-0"
      style={{ fontFamily: "Inter, sans-serif" }}
    >
      <div className="flex items-center justify-between mb-5">
        <button
          onClick={goBack}
          className="flex items-center gap-2 text-sm text-[#64748B] hover:text-[#1E293B] transition-colors"
        >
          <ArrowLeft size={15} /> Back
        </button>

        <button
          onClick={handleDownloadPDF}
          disabled={!company.jdPdfUrl}
          className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl text-sm font-semibold bg-[#1E293B] hover:bg-[#3B82F6] text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-[#1E293B]"
        >
          <Download size={14} />
          <span className="hidden sm:inline">Download JD</span>
          <span className="sm:hidden">JD</span>
        </button>
      </div>

      {/* Hero */}
      <div
        className="relative rounded-3xl overflow-hidden mb-5 border border-white/10"
        style={{
          background:
            "linear-gradient(135deg, #0d1b5e 0%, #1a2d8a 25%, #3d1a6e 55%, #6b1040 80%, #7a0f35 100%)",
        }}
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `radial-gradient(circle at 20% 50%, rgba(255,255,255,0.1) 0%, transparent 50%),
                         radial-gradient(circle at 80% 20%, rgba(255,255,255,0.05) 0%, transparent 40%)`,
          }}
        />
        <div className="relative z-10 p-5 sm:p-7">
          <div className="flex items-start gap-3 sm:gap-4 mb-5">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-white flex items-center justify-center flex-shrink-0 shadow-md p-1.5">
              <CompanyLogo
                name={companyInfo.name}
                website={companyInfo.website}
                size={44}
              />
            </div>
            <div className="flex-1 min-w-0">
              <h1
                className="text-lg sm:text-xl font-bold text-white mb-1 break-words"
                style={{ fontFamily: "Space Grotesk, sans-serif" }}
              >
                {companyInfo.name || "Company"}
              </h1>
              <p className="text-sm text-white/70 mb-3">
                {roleTitle || "No role open for your course"}
              </p>
              <div className="flex flex-wrap gap-2">
                {ctcLabel && (
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-white/20 text-white border border-white/30">
                    {ctcLabel}
                  </span>
                )}
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-white/20 text-white border border-white/30">
                  {company.location}
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-white/20 text-white border border-white/30">
                  {company.jobType}
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={handleApply}
            disabled={applied || applyLoading || isExpired || !isEligible}
            className={`w-full py-3 rounded-2xl text-sm font-semibold flex items-center justify-center gap-2 transition-all
    ${
      applied
        ? "bg-white/20 text-white border border-white/30 cursor-not-allowed"
        : isExpired
          ? "bg-white/20 text-white border border-white/30 cursor-not-allowed"
          : !isEligible
            ? "bg-white/20 text-white border border-white/30 cursor-not-allowed"
            : "bg-white text-[#1a3a8f] hover:bg-white/90 shadow-md"
    }`}
          >
            {applied ? (
              <>
                <CheckCircle size={16} /> Applied Successfully
              </>
            ) : applyLoading ? (
              "Applying..."
            ) : isExpired ? (
              "Deadline Passed"
            ) : !isEligible ? (
              "Not Eligible for This Role"
            ) : (
              <>
                <Send size={16} /> Apply Now
              </>
            )}
          </button>
          {!isEligible && ineligibilityReasons.length > 0 && (
            <div className="mt-3 bg-white/10 border border-white/20 rounded-xl px-3 py-2.5">
              {ineligibilityReasons.map((reason, i) => (
                <p
                  key={i}
                  className="text-xs text-white/90 leading-relaxed flex items-start gap-1.5"
                >
                  <span>•</span>
                  <span>{reason}</span>
                </p>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Company Registration Link (sirf tab jab coordinator ne link daala ho) */}
      {registrationLink && isEligible && !isExpired && (
        <div className="rounded-2xl border border-[#B8C6E3] bg-[#EFF3FA] p-4 sm:p-5 mb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-white border border-[#B8C6E3] flex items-center justify-center flex-shrink-0">
              <ExternalLink size={16} className="text-[#1a3a8f]" />
            </div>
            <div className="min-w-0">
              <p
                className="text-sm font-bold text-[#1E293B]"
                style={{ fontFamily: "Space Grotesk, sans-serif" }}
              >
                Register on Company Website
              </p>
              <p className="text-xs text-[#64748B] mt-0.5 leading-relaxed">
                This company wants you to register on its own website as well.
                Complete that form, then apply here so the placement cell can
                track your application.
              </p>
            </div>
          </div>
          <a
            href={registrationLink}
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#1a3a8f] text-white text-sm font-semibold hover:bg-[#0d1b5e] transition-colors flex-shrink-0"
          >
            Open Registration Form <ExternalLink size={13} />
          </a>
        </div>
      )}

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-5">
        {[
          {
            label: "Min CGPA",
            value: `${company.minCgpa}+`,
            icon: Star,
            color: "border-t-[#3B82F6]",
          },
          {
            label: "Job Type",
            value: company.jobType,
            icon: Clock,
            color: "border-t-[#22C55E]",
          },
          {
            label: "Deadline",
            value: deadlineLabel,
            icon: Calendar,
            color: deadlineColor,
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className={`bg-white rounded-2xl border border-[#E2E8F0] border-t-2 ${stat.color} p-4 shadow-sm`}
          >
            <stat.icon size={16} className="text-[#64748B] mb-2" />
            <p
              className="text-sm font-bold text-[#1E293B]"
              style={{ fontFamily: "Space Grotesk, sans-serif" }}
            >
              {stat.value}
            </p>
            <p className="text-xs text-[#64748B] mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Eligibility */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] border-l-4 border-l-[#3B82F6] p-4 sm:p-5 mb-4 shadow-sm">
        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-[#F1F5F9]">
          <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center">
            <CheckCircle size={14} className="text-[#3B82F6]" />
          </div>
          <h3
            className="text-sm font-bold text-[#1E293B]"
            style={{ fontFamily: "Space Grotesk, sans-serif" }}
          >
            Eligibility Criteria
          </h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { label: "Min CGPA", value: `${company.minCgpa}+` },
            {
              label: "Eligible Branches",
              value:
                eligibleBranchList.length === 0
                  ? "—"
                  : eligibleBranchList.includes("All")
                    ? "All Branches"
                    : eligibleBranchList.join(", "),
            },
            {
              label: "Max Backlogs",
              value:
                company.maxBacklogs === 0
                  ? "None allowed"
                  : `${company.maxBacklogs}`,
            },
            { label: "Job Type", value: company.jobType },
          ].map((item) => (
            <div
              key={item.label}
              className="bg-[#F8FAFC] rounded-xl p-3 border border-[#E2E8F0]"
            >
              <p className="text-xs text-[#64748B] uppercase tracking-widest mb-1">
                {item.label}
              </p>
              <p className="text-sm font-semibold text-[#1E293B] break-words">
                {item.value}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* About Company */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] border-l-4 border-l-[#818CF8] p-4 sm:p-5 mb-4 shadow-sm">
        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-[#F1F5F9]">
          <div className="w-7 h-7 rounded-lg bg-indigo-50 flex items-center justify-center">
            <Building2 size={14} className="text-[#818CF8]" />
          </div>
          <h3
            className="text-sm font-bold text-[#1E293B]"
            style={{ fontFamily: "Space Grotesk, sans-serif" }}
          >
            About {companyInfo.name}
          </h3>
        </div>
        <p className="text-sm text-[#64748B] leading-relaxed">
          {companyInfo.about || "—"}
        </p>
      </div>

      {/* Skills Required (sirf matched role ke) */}
      {rolesWithSkills.length > 0 && (
        <div className="bg-white rounded-2xl border border-[#E2E8F0] border-l-4 border-l-[#F59E0B] p-4 sm:p-5 mb-4 shadow-sm">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-[#F1F5F9]">
            <div className="w-7 h-7 rounded-lg bg-amber-50 flex items-center justify-center">
              <Code size={14} className="text-[#F59E0B]" />
            </div>
            <h3
              className="text-sm font-bold text-[#1E293B]"
              style={{ fontFamily: "Space Grotesk, sans-serif" }}
            >
              Skills Required
            </h3>
          </div>
          <div className="flex flex-col gap-4">
            {rolesWithSkills.map((rg, ri) => (
              <div key={rg._id || ri}>
                {multiRole && (
                  <p className="text-xs font-semibold text-[#64748B] mb-2">
                    {rg.role}
                  </p>
                )}
                <div className="flex flex-wrap gap-2">
                  {rg.skills.map((s) => (
                    <span
                      key={s}
                      className="px-3 py-1.5 rounded-full text-xs font-semibold bg-blue-50 text-[#3B82F6] border border-blue-200"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Work Details */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] border-l-4 border-l-[#22C55E] p-4 sm:p-5 mb-4 shadow-sm">
        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-[#F1F5F9]">
          <div className="w-7 h-7 rounded-lg bg-green-50 flex items-center justify-center">
            <Briefcase size={14} className="text-[#22C55E]" />
          </div>
          <h3
            className="text-sm font-bold text-[#1E293B]"
            style={{ fontFamily: "Space Grotesk, sans-serif" }}
          >
            Work Details
          </h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { label: "Job Type", value: company.jobType },
            { label: "Location", value: company.location },
            {
              label: "Last Date",
              value: company.lastDate
                ? `${new Date(company.lastDate).toLocaleDateString("en-IN")}${
                    company.lastTime ? ` · ${formatTime(company.lastTime)}` : ""
                  }`
                : "—",
            },
            { label: "Batch", value: company.batch || "—" },
          ].map((item) => (
            <div
              key={item.label}
              className="bg-[#F8FAFC] rounded-xl p-3 border border-[#E2E8F0]"
            >
              <p className="text-xs text-[#64748B] uppercase tracking-widest mb-1">
                {item.label}
              </p>
              <p className="text-sm font-semibold text-[#1E293B] break-words">
                {item.value}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Perks */}
      {company.perks?.length > 0 && (
        <div className="bg-white rounded-2xl border border-[#E2E8F0] border-l-4 border-l-[#EF4444] p-4 sm:p-5 mb-4 shadow-sm">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-[#F1F5F9]">
            <div className="w-7 h-7 rounded-lg bg-red-50 flex items-center justify-center">
              <Gift size={14} className="text-[#EF4444]" />
            </div>
            <h3
              className="text-sm font-bold text-[#1E293B]"
              style={{ fontFamily: "Space Grotesk, sans-serif" }}
            >
              Perks & Benefits
            </h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {company.perks.map((p) => (
              <div
                key={p}
                className="flex items-center gap-2 bg-[#F8FAFC] rounded-xl px-3 py-2.5 border border-[#E2E8F0]"
              >
                <CheckCircle
                  size={14}
                  className="text-[#22C55E] flex-shrink-0"
                />
                <span className="text-xs font-medium text-[#1E293B]">{p}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bond / Fee (sirf tab jab coordinator ne likha ho) */}
      {bondDetails && (
        <div className="bg-white rounded-2xl border border-[#E2E8F0] border-l-4 border-l-[#F59E0B] p-4 sm:p-5 mb-4 shadow-sm">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-[#F1F5F9]">
            <div className="w-7 h-7 rounded-lg bg-amber-50 flex items-center justify-center">
              <FileText size={14} className="text-[#F59E0B]" />
            </div>
            <h3
              className="text-sm font-bold text-[#1E293B]"
              style={{ fontFamily: "Space Grotesk, sans-serif" }}
            >
              Bond / Fee Details
            </h3>
          </div>
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
            <p className="text-sm text-[#1E293B] leading-relaxed whitespace-pre-line break-words">
              {bondDetails}
            </p>
          </div>
        </div>
      )}

      {/* Selection Process (sirf matched role ka) */}
      {rolesWithProcess.length > 0 && (
        <div className="bg-white rounded-2xl border border-[#E2E8F0] border-l-4 border-l-[#3B82F6] p-4 sm:p-5 mb-4 shadow-sm">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-[#F1F5F9]">
            <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center">
              <TrendingUp size={14} className="text-[#3B82F6]" />
            </div>
            <h3
              className="text-sm font-bold text-[#1E293B]"
              style={{ fontFamily: "Space Grotesk, sans-serif" }}
            >
              Selection Process
            </h3>
          </div>
          {rolesWithProcess.map((rg, ri) => (
            <div
              key={rg._id || ri}
              className={
                ri > 0 ? "mt-4 pt-4 border-t border-[#F1F5F9]" : undefined
              }
            >
              {multiRole && (
                <p className="text-xs font-semibold text-[#64748B] mb-3">
                  {rg.role}
                </p>
              )}
              <div className="flex flex-col">
                {rg.selectionProcess.map((step, index) => (
                  <div key={index} className="flex items-start gap-3 relative">
                    {index < rg.selectionProcess.length - 1 && (
                      <div className="absolute left-[15px] top-8 w-0.5 h-full bg-[#E2E8F0] z-0" />
                    )}
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 z-10 mt-1 bg-blue-100 text-[#3B82F6]">
                      {index + 1}
                    </div>
                    <div className="pb-5 flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[#1E293B]">
                        {step.title || step}
                      </p>
                      {step.description && (
                        <p className="text-xs text-[#64748B] leading-relaxed mt-0.5">
                          {step.description}
                        </p>
                      )}
                      {step.type && (
                        <span className="inline-block mt-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-[#3B82F6] border border-blue-200">
                          {step.type}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Disclaimer */}
      <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 mb-5">
        <AlertTriangle
          size={15}
          className="text-amber-500 flex-shrink-0 mt-0.5"
        />
        <p className="text-xs text-amber-700 leading-relaxed">
          <span className="font-semibold">Important: </span>
          Bond or fee details, if any, are listed above by the placement cell.
          If this employer asks you to pay any other fee, please notify us
          immediately.
        </p>
      </div>

      {/* Bottom Apply Button */}
      <button
        onClick={handleApply}
        disabled={applied || applyLoading || isExpired || !isEligible}
        className={`w-full py-3.5 rounded-2xl text-sm font-semibold flex items-center justify-center gap-2 transition-all mb-6
          ${
            applied
              ? "bg-green-50 text-green-600 border border-green-200 cursor-not-allowed"
              : isExpired
                ? "bg-[#F1F5F9] text-[#94A3B8] border border-[#E2E8F0] cursor-not-allowed"
                : !isEligible
                  ? "bg-[#F1F5F9] text-[#94A3B8] border border-[#E2E8F0] cursor-not-allowed"
                  : "bg-[#1a3a8f] text-white hover:bg-[#152d73] shadow-md"
          }`}
      >
        {applied ? (
          <>
            <CheckCircle size={16} /> Application Submitted
          </>
        ) : applyLoading ? (
          "Applying..."
        ) : isExpired ? (
          "Deadline Passed"
        ) : !isEligible ? (
          "Not Eligible for This Role"
        ) : (
          <>
            <Send size={16} /> Apply for this Role
          </>
        )}
      </button>

      {showApplyModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
          onClick={(e) =>
            e.target === e.currentTarget && setShowApplyModal(false)
          }
        >
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-5 sm:p-6 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-bold text-[#1E293B]">
                Confirm Application
              </h2>
              <button
                onClick={() => setShowApplyModal(false)}
                className="w-7 h-7 rounded-lg bg-[#F1F5F9] flex items-center justify-center hover:bg-[#E2E8F0] transition-colors"
              >
                <X size={14} className="text-[#64748B]" />
              </button>
            </div>

            {/* Job Info */}
            <div className="bg-[#F8FAFC] rounded-xl p-4 border border-[#E2E8F0] mb-4">
              <p className="text-xs text-[#64748B] mb-1">Applying for</p>
              <p className="text-sm font-bold text-[#1E293B]">{roleTitle}</p>
              <p className="text-xs text-[#64748B] mt-0.5">
                {company?.companyId?.name}
                {ctcLabel ? ` · ${ctcLabel}` : ""}
              </p>
            </div>

            {/* Bond / Fee reminder (sirf tab jab bond likha ho) */}
            {bondDetails && (
              <div className="flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 mb-4">
                <AlertTriangle
                  size={14}
                  className="text-amber-500 flex-shrink-0 mt-0.5"
                />
                <p className="text-xs text-amber-700 leading-relaxed">
                  <span className="font-semibold">Bond / Fee: </span>
                  This role has a bond or fee condition. Please read the details
                  on this page before applying.
                </p>
              </div>
            )}
            {/* Role Selection */}
            {matchedRoles.length > 1 && (
              <div className="border border-[#E2E8F0] rounded-xl p-4 mb-4">
                <p className="text-xs font-semibold text-[#64748B] uppercase tracking-widest mb-3">
                  Select Role(s) to Apply
                </p>
                <div className="flex flex-col gap-2">
                  {matchedRoles.map((rg) => {
                    const alreadyApplied = appliedRoleIds.has(rg._id?.toString());
                    const isDisabled =
                      alreadyApplied ||
                      (!company.allowMultipleRoleApplications &&
                        appliedRoleIds.size > 0);
                    const isChecked = selectedRoleGroupIds?.includes(rg._id);
                    return (
                      <label
                        key={rg._id}
                        className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                          isChecked
                            ? "border-[#1a3a8f] bg-[#EFF3FA]"
                            : isDisabled
                              ? "border-[#E2E8F0] bg-[#F8FAFC] opacity-50 cursor-not-allowed"
                              : "border-[#E2E8F0] hover:border-[#1a3a8f]"
                        }`}
                      >
                        <input
                          type={
                            company.allowMultipleRoleApplications
                              ? "checkbox"
                              : "radio"
                          }
                          name="roleGroup"
                          value={rg._id}
                          disabled={isDisabled}
                          checked={
                            company.allowMultipleRoleApplications
                              ? isChecked
                              : selectedRoleGroupId === rg._id
                          }
                          onChange={() => {
                            if (company.allowMultipleRoleApplications) {
                              setSelectedRoleGroupIds((prev) =>
                                prev.includes(rg._id)
                                  ? prev.filter((id) => id !== rg._id)
                                  : [...prev, rg._id],
                              );
                            } else {
                              setSelectedRoleGroupId(rg._id);
                            }
                          }}
                          className="accent-[#1a3a8f]"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-[#1E293B]">
                            {rg.role}
                          </p>
                          {rg.ctc && (
                            <p className="text-xs text-[#64748B]">
                              ₹{rg.ctc} LPA
                            </p>
                          )}
                          {alreadyApplied && (
                            <p className="text-xs text-green-600 font-medium">
                              Already applied
                            </p>
                          )}
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}
            {/* Resume Section */}
            {studentProfile?.resume ? (
              <div className="border border-[#E2E8F0] rounded-xl p-4 mb-4">
                <p className="text-xs font-semibold text-[#64748B] uppercase tracking-widest mb-3">
                  Your Resume
                </p>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
                    <FileText size={18} className="text-[#3B82F6]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[#1E293B]">
                      Resume uploaded
                    </p>
                    <a
                      href={studentProfile.resume}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-[#3B82F6] hover:underline"
                    >
                      View Resume →
                    </a>
                  </div>
                </div>

                {/* Checkbox */}
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={resumeConfirmed}
                    onChange={(e) => setResumeConfirmed(e.target.checked)}
                    className="w-4 h-4 rounded accent-blue-500"
                  />
                  <span className="text-sm text-[#1E293B]">
                    My resume is up to date
                  </span>
                </label>
              </div>
            ) : (
              <div className="border border-red-200 bg-red-50 rounded-xl p-4 mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle size={16} className="text-red-500" />
                  <p className="text-sm font-semibold text-red-600">
                    No resume uploaded
                  </p>
                </div>
                <p className="text-xs text-red-500 mb-3">
                  Please upload your resume before applying.
                </p>
                <button
                  onClick={() => {
                    setShowApplyModal(false);
                    navigate("/student/profile");
                  }}
                  className="text-xs font-semibold text-[#3B82F6] hover:underline"
                >
                  Go to Profile →
                </button>
              </div>
            )}

            {/* Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 mt-2">
              <button
                onClick={() => setShowApplyModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-[#E2E8F0] text-sm font-medium text-[#64748B] hover:bg-[#F8FAFC] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={submitApplication}
                disabled={
                  !studentProfile?.resume ||
                  !resumeConfirmed ||
                  applyLoading ||
                  (matchedRoles.length > 1 &&
                    (company.allowMultipleRoleApplications
                      ? selectedRoleGroupIds.length === 0
                      : !selectedRoleGroupId))
                }
                className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2
            ${
              !studentProfile?.resume ||
              !resumeConfirmed ||
              applyLoading ||
              (matchedRoles.length > 1 &&
                (company.allowMultipleRoleApplications
                  ? selectedRoleGroupIds.length === 0
                  : !selectedRoleGroupId))
                ? "bg-[#CBD5E1] text-white cursor-not-allowed"
                : "bg-[#3B82F6] text-white hover:bg-[#2563EB]"
            }`}
              >
                {applyLoading ? (
                  "Applying..."
                ) : (
                  <>
                    <Send size={14} /> Confirm & Apply
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
