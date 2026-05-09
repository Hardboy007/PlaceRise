import { useState } from "react";
import mockCompanies from '../../data/mockCompanies'
import { useParams, useNavigate } from "react-router-dom";
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
  AlertTriangle
} from "lucide-react";

export default function CompanyDetailPage() {
  const { companyId } = useParams();
  const navigate = useNavigate();
  const [appliedIds, setAppliedIds] = useState([]);

  const company = mockCompanies.find((c) => c.id === parseInt(companyId));
  const applied = appliedIds.includes(parseInt(companyId));

  if (!company) {
    return (
      <div className="flex flex-col items-center justify-center min-h-64 gap-4">
        <Building2 size={48} className="text-[#CBD5E1]" />
        <p className="text-sm text-[#64748B]">Company not found</p>
        <button
          onClick={() => navigate("/student/companies")}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#3B82F6] text-white text-sm font-medium"
        >
          <ArrowLeft size={14} /> Back to Companies
        </button>
      </div>
    );
  }

  const daysLeft = () => {
    const today = new Date();
    const last = new Date(company.lastDate);
    const diff = Math.ceil((last - today) / (1000 * 60 * 60 * 24));
    return diff;
  };

  const days = daysLeft();
  const deadlineColor =
    days <= 3
      ? "text-[#3B82F6] bg-red-50 border-red-200"
      : days <= 7
        ? "text-[#F59E0B] bg-amber-50 border-amber-200"
        : "text-[#22C55E] bg-green-50 border-green-200";

  return (
    <div className="max-w-3xl mx-auto" style={{ fontFamily: "Inter, sans-serif" }}>

      {/* Back Button */}
      <button
        onClick={() => navigate("/student/companies")}
        className="flex items-center gap-2 text-sm text-[#64748B] hover:text-[#1E293B] transition-colors mb-5"
      >
        <ArrowLeft size={15} />
        Back to Companies
      </button>

      {/* Hero */}
      <div
        className="relative rounded-3xl overflow-hidden mb-5 border border-white/10"
        style={{ background: "linear-gradient(135deg, #3B82F6 0%, #60A5FA 60%, #818CF8 100%)" }}
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
              <h1 className="text-xl font-bold text-white mb-1" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
                {company.company}
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
            onClick={() => setAppliedIds((prev) => [...prev, parseInt(companyId)])}
            disabled={applied}
            className={`w-full py-3 rounded-2xl text-sm font-semibold flex items-center justify-center gap-2 transition-all
              ${applied
                ? "bg-white/20 text-white border border-white/30 cursor-not-allowed"
                : "bg-white text-[#3B82F6] hover:bg-white/90 shadow-md"
              }`}
          >
            {applied ? <><CheckCircle size={16} /> Applied Successfully</> : <><Send size={16} /> Apply Now</>}
          </button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-4 mb-5">
        {[
          { label: "Min CGPA", value: `${company.cgpa}+`, icon: Star, color: "border-t-[#3B82F6]" },
          { label: "Experience", value: company.experience, icon: Clock, color: "border-t-[#3B82F6]" },
          {
            label: "Deadline", value: `${days}d left`, icon: Calendar,
            color: deadlineColor.includes("red") ? "border-t-[#3B82F6]" : deadlineColor.includes("amber") ? "border-t-[#F59E0B]" : "border-t-[#3B82F6]",
          },
        ].map((stat) => (
          <div key={stat.label} className={`bg-white rounded-2xl border border-[#E2E8F0] border-t-2 ${stat.color} p-4 shadow-sm`}>
            <stat.icon size={16} className="text-[#3B82F6] mb-2" />
            <p className="text-sm font-bold text-[#1E293B]" style={{ fontFamily: "Space Grotesk, sans-serif" }}>{stat.value}</p>
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
          <h3 className="text-sm font-bold text-[#1E293B]" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
            Eligibility Criteria
          </h3>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: "Min CGPA", value: `${company.cgpa}+` },
            { label: "Eligible Branches", value: company.branches.includes("All") ? "All Branches" : company.branches.join(", ") },
            { label: "Experience", value: company.experience },
            { label: "Job Type", value: company.jobType },
          ].map((item) => (
            <div key={item.label} className="bg-[#F8FAFC] rounded-xl p-3 border border-[#E2E8F0]">
              <p className="text-xs text-[#64748B] uppercase tracking-widest mb-1">{item.label}</p>
              <p className="text-sm font-semibold text-[#1E293B]">{item.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* About Company */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] border-l-4 border-l-[#3B82F6] p-5 mb-4 shadow-sm">
        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-[#F1F5F9]">
          <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center">
            <Building2 size={14} className="text-[#3B82F6]" />
          </div>
          <h3 className="text-sm font-bold text-[#1E293B]" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
            About {company.company}
          </h3>
        </div>
        <p className="text-sm text-[#64748B] leading-relaxed">{company.about}</p>
        <div className="mt-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-[#64748B] mb-2">Tech Stack</p>
          <div className="flex flex-wrap gap-2">
            {company.techStack.map((t) => (
              <span key={t} className="px-3 py-1 rounded-full text-xs font-medium bg-[#F1F5F9] text-[#1E293B] border border-[#E2E8F0]">{t}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Skills Required */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] border-l-4 border-l-[#3B82F6] p-5 mb-4 shadow-sm">
        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-[#F1F5F9]">
          <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center">
            <Code size={14} className="text-[#3B82F6]" />
          </div>
          <h3 className="text-sm font-bold text-[#1E293B]" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
            Skills Required
          </h3>
        </div>
        <div className="flex flex-wrap gap-2">
          {company.skills.map((s) => (
            <span key={s} className="px-3 py-1.5 rounded-full text-xs font-semibold bg-blue-50 text-[#3B82F6] border border-blue-200">{s}</span>
          ))}
        </div>
      </div>

      {/* Work Details */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] border-l-4 border-l-[#3B82F6] p-5 mb-4 shadow-sm">
        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-[#F1F5F9]">
          <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center">
            <Briefcase size={14} className="text-[#3B82F6]" />
          </div>
          <h3 className="text-sm font-bold text-[#1E293B]" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
            Work Details
          </h3>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: "Working Days", value: company.workDays },
            { label: "Job Type", value: company.jobType },
            { label: "Shift", value: company.shift },
            { label: "Location", value: company.location },
          ].map((item) => (
            <div key={item.label} className="bg-[#F8FAFC] rounded-xl p-3 border border-[#E2E8F0]">
              <p className="text-xs text-[#64748B] uppercase tracking-widest mb-1">{item.label}</p>
              <p className="text-sm font-semibold text-[#1E293B]">{item.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Perks */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] border-l-4 border-l-[#3B82F6] p-5 mb-4 shadow-sm">
        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-[#F1F5F9]">
          <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center">
            <Gift size={14} className="text-[#3B82F6]" />
          </div>
          <h3 className="text-sm font-bold text-[#1E293B]" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
            Perks & Benefits
          </h3>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {company.perks.map((p) => (
            <div key={p} className="flex items-center gap-2 bg-[#F8FAFC] rounded-xl px-3 py-2.5 border border-[#E2E8F0]">
              <CheckCircle size={14} className="text-[#3B82F6] flex-shrink-0" />
              <span className="text-xs font-medium text-[#1E293B]">{p}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Selection Process */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] border-l-4 border-l-[#3B82F6] p-5 mb-4 shadow-sm">
        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-[#F1F5F9]">
          <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center">
            <TrendingUp size={14} className="text-[#3B82F6]" />
          </div>
          <h3 className="text-sm font-bold text-[#1E293B]" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
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
                <p className="text-sm font-semibold text-[#1E293B]">{step.title}</p>
                <p className="text-xs text-[#64748B] leading-relaxed mt-0.5">{step.description}</p>
                <span className="inline-block mt-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-[#3B82F6] border border-blue-200">
                  {step.type}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Disclaimer */}
      <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 mb-5">
        <AlertTriangle size={15} className="text-amber-500 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-amber-700 leading-relaxed">
          <span className="font-semibold">Important: </span>
          If this employer asks you to pay any kind of fee, please notify us immediately. We do not charge any fee from applicants and do not allow companies to do so either.
        </p>
      </div>

      {/* Related Opportunities */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] border-l-4 border-l-[#3B82F6] p-5 mb-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-[#F1F5F9]">
          <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center">
            <Users size={14} className="text-[#3B82F6]" />
          </div>
          <h3 className="text-sm font-bold text-[#1E293B]" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
            Related Opportunities
          </h3>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {mockCompanies
            .filter((c) => c.id !== company.id)
            .slice(0, 3)
            .map((c) => (
              <div
                key={c.id}
                onClick={() => navigate(`/student/companies/${c.id}`)}
                className="rounded-xl border border-[#E2E8F0] p-3 cursor-pointer hover:border-[#3B82F6] hover:bg-blue-50/30 transition-all flex flex-col gap-2"
              >
                <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center">
                  <Building2 size={15} className="text-[#3B82F6]" />
                </div>
                <div>
                  <p className="text-xs font-bold text-[#1E293B] truncate" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
                    {c.company}
                  </p>
                  <p className="text-xs text-[#64748B] truncate mt-0.5">{c.role}</p>
                  <p className="text-xs text-[#94A3B8] truncate mt-0.5">{c.location}</p>
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* Bottom Apply Button */}
      <button
        onClick={() => setAppliedIds((prev) => [...prev, parseInt(companyId)])}
        disabled={applied}
        className={`w-full py-3.5 rounded-2xl text-sm font-semibold flex items-center justify-center gap-2 transition-all mb-6
          ${applied
            ? "bg-[#22C55E] text-white cursor-not-allowed"
            : "bg-[#1E293B] hover:bg-[#3B82F6] text-white shadow-md"
          }`}
      >
        {applied ? <><CheckCircle size={16} /> Application Submitted</> : <><Send size={16} /> Apply for this Role</>}
      </button>

    </div>
  );
}