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
} from "lucide-react";

export default function CompanyDetailPage() {
  const { companyId } = useParams();
  const navigate = useNavigate();
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const [applied, setApplied] = useState(false);
  const [existingStatus, setExistingStatus] = useState(null); // FIXED: tracks Shortlisted/Selected/Rejected too
  const [applyLoading, setApplyLoading] = useState(false);

  // FIXED: goes back to whichever page the student actually came from
  // (StudentApplication, CompanyList, etc.) instead of always jumping to
  // the Company List page. Falls back to Company List only if there's no
  // history to go back to (e.g. page opened directly via URL).
  const goBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate("/student/companies");
    }
  };

  useEffect(() => {
    const fetchJob = async () => {
      try {
        const data = await api.get(`/companies/jobs/${companyId}`);
        setCompany(data);

        // FIXED: check if the student has already applied to THIS job,
        // instead of always assuming applied=false. Without this, a
        // student clicking through from StudentApplication (where they
        // are, by definition, already applied) would incorrectly see
        // "Apply Now" again and could submit a duplicate application.
        try {
          const myApps = await api.get("/applications/my");
          const existing = Array.isArray(myApps)
            ? myApps.find((a) => a.jobId?._id === data._id)
            : null;
          if (existing) {
            setApplied(true);
            setExistingStatus(existing.status);
          }
        } catch (e) {
          // non-fatal — if this check fails, worst case student sees
          // "Apply Now" and backend should still reject a true duplicate
          console.error("Could not verify existing application:", e);
        }
      } catch (err) {
        console.error(err);
      }
      setLoading(false);
    };
    fetchJob();
  }, [companyId]);

  const isExpired = new Date(company.lastDate) < new Date();

  const handleApply = async () => {
    setApplyLoading(true);
    try {
      const res = await api.post("/applications", { jobId: company._id });
      if (res.message) {
        alert(res.message);
      } else {
        setApplied(true);
      }
    } catch (err) {
      alert("Something went wrong");
    }
    setApplyLoading(false);
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

  // Company info — JobPosting mein companyId populate hua hai
  const companyInfo = company.companyId || {};

  const daysLeft = () => {
    const today = new Date();
    const last = new Date(company.lastDate);
    return Math.ceil((last - today) / (1000 * 60 * 60 * 24));
  };

  const days = daysLeft();
  const deadlineColor =
    days <= 3
      ? "border-t-[#EF4444]"
      : days <= 7
        ? "border-t-[#F59E0B]"
        : "border-t-[#22C55E]";

  return (
    <div
      className="max-w-3xl mx-auto"
      style={{ fontFamily: "Inter, sans-serif" }}
    >
      <button
        onClick={goBack}
        className="flex items-center gap-2 text-sm text-[#64748B] hover:text-[#1E293B] transition-colors mb-5"
      >
        <ArrowLeft size={15} /> Back
      </button>

      {/* Hero */}
      <div
        className="relative rounded-3xl overflow-hidden mb-5 border border-white/10"
        style={{
          background:
            "linear-gradient(135deg, #3B82F6 0%, #60A5FA 60%, #818CF8 100%)",
        }}
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `radial-gradient(circle at 20% 50%, rgba(255,255,255,0.1) 0%, transparent 50%),
                         radial-gradient(circle at 80% 20%, rgba(255,255,255,0.05) 0%, transparent 40%)`,
          }}
        />
        <div className="relative z-10 p-7">
          <div className="flex items-start gap-4 mb-5">
            <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center flex-shrink-0 shadow-md">
              <Building2 size={24} className="text-[#3B82F6]" />
            </div>
            <div className="flex-1">
              <h1
                className="text-xl font-bold text-white mb-1"
                style={{ fontFamily: "Space Grotesk, sans-serif" }}
              >
                {companyInfo.name || "Company"}
              </h1>
              <p className="text-sm text-white/70 mb-3">{company.role}</p>
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-white/20 text-white border border-white/30">
                  ₹{company.ctc} LPA
                </span>
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
            disabled={applied || applyLoading || isExpired}
            className={`w-full py-3 rounded-2xl text-sm font-semibold flex items-center justify-center gap-2 transition-all
    ${
      applied
        ? "bg-white/20 text-white border border-white/30 cursor-not-allowed"
        : isExpired
          ? "bg-white/20 text-white border border-white/30 cursor-not-allowed"
          : "bg-white text-[#3B82F6] hover:bg-white/90 shadow-md"
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
            ) : (
              <>
                <Send size={16} /> Apply Now
              </>
            )}
          </button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-4 mb-5">
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
            value: days > 0 ? `${days}d left` : "Expired",
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
      <div className="bg-white rounded-2xl border border-[#E2E8F0] border-l-4 border-l-[#3B82F6] p-5 mb-4 shadow-sm">
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
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: "Min CGPA", value: `${company.minCgpa}+` },
            {
              label: "Eligible Branches",
              value: company.eligibleBranches?.includes("All")
                ? "All Branches"
                : company.eligibleBranches?.join(", ") || "—",
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
              <p className="text-sm font-semibold text-[#1E293B]">
                {item.value}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* About Company */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] border-l-4 border-l-[#818CF8] p-5 mb-4 shadow-sm">
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
        {company.techStack?.length > 0 && (
          <div className="mt-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-[#64748B] mb-2">
              Tech Stack
            </p>
            <div className="flex flex-wrap gap-2">
              {company.techStack.map((t) => (
                <span
                  key={t}
                  className="px-3 py-1 rounded-full text-xs font-medium bg-[#F1F5F9] text-[#1E293B] border border-[#E2E8F0]"
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Skills Required */}
      {company.skills?.length > 0 && (
        <div className="bg-white rounded-2xl border border-[#E2E8F0] border-l-4 border-l-[#F59E0B] p-5 mb-4 shadow-sm">
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
          <div className="flex flex-wrap gap-2">
            {company.skills.map((s) => (
              <span
                key={s}
                className="px-3 py-1.5 rounded-full text-xs font-semibold bg-blue-50 text-[#3B82F6] border border-blue-200"
              >
                {s}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Work Details */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] border-l-4 border-l-[#22C55E] p-5 mb-4 shadow-sm">
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
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: "Job Type", value: company.jobType },
            { label: "Location", value: company.location },
            {
              label: "Last Date",
              value: company.lastDate
                ? new Date(company.lastDate).toLocaleDateString("en-IN")
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
              <p className="text-sm font-semibold text-[#1E293B]">
                {item.value}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Perks */}
      {company.perks?.length > 0 && (
        <div className="bg-white rounded-2xl border border-[#E2E8F0] border-l-4 border-l-[#EF4444] p-5 mb-4 shadow-sm">
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
          <div className="grid grid-cols-2 gap-2">
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

      {/* Selection Process */}
      {company.selectionProcess?.length > 0 && (
        <div className="bg-white rounded-2xl border border-[#E2E8F0] border-l-4 border-l-[#3B82F6] p-5 mb-4 shadow-sm">
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
          <div className="flex flex-col">
            {company.selectionProcess.map((step, index) => (
              <div key={index} className="flex items-start gap-3 relative">
                {index < company.selectionProcess.length - 1 && (
                  <div className="absolute left-[15px] top-8 w-0.5 h-full bg-[#E2E8F0] z-0" />
                )}
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 z-10 mt-1 bg-blue-100 text-[#3B82F6]">
                  {index + 1}
                </div>
                <div className="pb-5 flex-1">
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
      )}

      {/* Disclaimer */}
      <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 mb-5">
        <AlertTriangle
          size={15}
          className="text-amber-500 flex-shrink-0 mt-0.5"
        />
        <p className="text-xs text-amber-700 leading-relaxed">
          <span className="font-semibold">Important: </span>
          If this employer asks you to pay any kind of fee, please notify us
          immediately.
        </p>
      </div>

      {/* Bottom Apply Button */}
      <button
        onClick={handleApply}
        disabled={applied || applyLoading || isExpired}
        className={`w-full py-3.5 rounded-2xl text-sm font-semibold flex items-center justify-center gap-2 transition-all mb-6
          ${
            applied
              ? "bg-white/20 text-white border border-white/30 cursor-not-allowed"
              : isExpired
                ? "bg-white/20 text-white border border-white/30 cursor-not-allowed"
                : "bg-white text-[#3B82F6] hover:bg-white/90 shadow-md"
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
        ) : (
          <>
            <Send size={16} /> Apply for this Role
          </>
        )}
      </button>
    </div>
  );
}
