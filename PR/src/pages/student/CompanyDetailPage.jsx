import { useState } from "react";

// ─── Data ─────────────────────────────────────────────────────────────────────
const skills = ["React.js", "TypeScript", "Tailwind CSS", "REST APIs", "Git", "Next.js", "Figma", "Jest"];
const techStack = ["React", "Node.js", "PostgreSQL", "AWS", "Docker", "TypeScript"];

const perks = [
  { label: "Flexible hours", icon: "ti-clock" },
  { label: "Work from home", icon: "ti-device-laptop" },
  { label: "Health insurance", icon: "ti-heart-rate-monitor" },
  { label: "Growth path", icon: "ti-chart-line" },
];

const workDetails = [
  { label: "Working days", value: "5 days / week", icon: "ti-calendar" },
  { label: "Job type", value: "In office", icon: "ti-building" },
  { label: "Timing", value: "Full time", icon: "ti-clock" },
  { label: "Shift", value: "Day shift", icon: "ti-sun" },
];

const salaryMeta = [
  { label: "Salary type", value: "Fixed + Variable", icon: "ti-refresh" },
  { label: "Appraisal", value: "Yearly", icon: "ti-chart-line" },
  { label: "Probation", value: "3 months", icon: "ti-calendar" },
  { label: "Notice period", value: "30 days", icon: "ti-clock" },
];

const aboutMeta = [
  { label: "Founded", value: "2016", icon: "ti-calendar" },
  { label: "HQ", value: "Coimbatore", icon: "ti-map-pin" },
  { label: "Industry", value: "SaaS / B2B", icon: "ti-code" },
  { label: "Team size", value: "50–200", icon: "ti-users" },
];

const similarJobs = [
  { role: "React Developer", company: "Zoho Corp", location: "Coimbatore", color: "#1a5fc8" },
  { role: "UI Engineer", company: "Freshworks", location: "Chennai", color: "#0d9e75" },
  { role: "Frontend Dev", company: "Infosys", location: "Pune", color: "#6b4fc8" },
];

// ─── Google-style Company Logo ─────────────────────────────────────────────
function CompanyLogo() {
  return (
    <div className="w-14 h-14 rounded-2xl border border-gray-100 bg-white flex items-center justify-center flex-shrink-0 p-1.5">
      <div className="grid grid-cols-2 gap-[3px] w-full h-full">
        <span className="rounded-tl-md" style={{ background: "#4285F4" }} />
        <span className="rounded-tr-md" style={{ background: "#EA4335" }} />
        <span className="rounded-bl-md" style={{ background: "#FBBC04" }} />
        <span className="rounded-br-md" style={{ background: "#34A853" }} />
      </div>
    </div>
  );
}

// ─── Section Label ─────────────────────────────────────────────────────────
function SectionLabel({ icon, text }) {
  return (
    <div className="flex items-center gap-1.5 text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-3">
      <i className={`ti ${icon} text-[13px]`} />
      {text}
    </div>
  );
}

// ─── Card with left accent bar ─────────────────────────────────────────────
function AccentCard({ accentColor, children, className = "" }) {
  return (
    <div
      className={`bg-white border border-gray-100 rounded-2xl p-4 shadow-sm relative overflow-hidden ${className}`}
    >
      <div
        className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl"
        style={{ background: accentColor }}
      />
      <div className="pl-2">{children}</div>
    </div>
  );
}

// ─── Meta Grid Item ────────────────────────────────────────────────────────
function MetaItem({ label, value, icon }) {
  return (
    <div className="bg-gray-50 rounded-xl p-2.5 border border-gray-100">
      <div className="text-[10px] text-gray-400 uppercase tracking-wide mb-1">{label}</div>
      <div className="flex items-center gap-1.5 text-[13px] font-medium text-gray-800">
        <i className={`ti ${icon} text-[14px] text-gray-400`} />
        {value}
      </div>
    </div>
  );
}

// ─── Apply Button ──────────────────────────────────────────────────────────
function ApplyButton({ applied, onClick, label, doneLabel }) {
  return (
    <button
      onClick={onClick}
      className={`w-full py-3 rounded-2xl text-[14px] font-semibold flex items-center justify-center gap-2 transition-all duration-300
        ${applied
          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
          : "bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white shadow-sm shadow-blue-200"
        }`}
    >
      <i className={`ti ${applied ? "ti-circle-check" : "ti-send"}`} />
      {applied ? doneLabel : label}
    </button>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────
export default function CompanyDetailPage() {
  const [applied, setApplied] = useState(false);
  const handleApply = () => setApplied(true);

  return (
    <div
      className="min-h-screen bg-slate-50"
      style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
    >
      {/* Hero */}
      <div className="bg-white border-b border-gray-100 px-4 pt-6 pb-4 rounded-b-3xl shadow-sm">
        <div className="flex items-start gap-3 mb-4">
          <CompanyLogo />
          <div className="flex-1 min-w-0">
            <h1 className="text-[18px] font-semibold text-gray-900 leading-snug">
              TechCraft Solutions
            </h1>
            <p className="text-[12px] text-gray-400 mt-0.5 mb-2">
              Building tomorrow's software, today
            </p>
            <div className="flex flex-wrap gap-1.5">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] bg-emerald-50 text-emerald-700 border border-emerald-200">
                <i className="ti ti-circle-check text-[12px]" /> Actively hiring
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] bg-blue-50 text-blue-700 border border-blue-200">
                <i className="ti ti-building text-[12px]" /> IT / Software
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] bg-gray-50 text-gray-600 border border-gray-200">
                <i className="ti ti-users text-[12px]" /> 50–200 emp
              </span>
            </div>
          </div>
        </div>
        <ApplyButton
          applied={applied}
          onClick={handleApply}
          label="Apply now"
          doneLabel="Applied successfully!"
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 px-3 pt-3">
        {[
          { num: "120+", label: "Employees", accent: "border-t-blue-500" },
          { num: "8 yrs", label: "Founded", accent: "border-t-teal-500" },
          { num: "4.3 ★", label: "Rating", accent: "border-t-amber-400" },
        ].map((s) => (
          <div
            key={s.label}
            className={`bg-white border border-gray-100 border-t-2 ${s.accent} rounded-xl p-2.5 text-center shadow-sm`}
          >
            <div className="text-[16px] font-semibold text-gray-900">{s.num}</div>
            <div className="text-[10px] text-gray-400 mt-0.5 uppercase tracking-wide">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-3 px-3 pt-3">

        {/* Role */}
        <AccentCard accentColor="#1a5fc8">
          <SectionLabel icon="ti-briefcase" text="Role" />
          <h2 className="text-[17px] font-semibold text-gray-900 mb-1.5">Frontend Developer</h2>
          <p className="text-[13px] text-gray-500 leading-relaxed">
            We're looking for a skilled frontend developer to build responsive, high-performance
            web applications used by thousands of users daily.
          </p>
        </AccentCard>

        {/* Salary */}
        <AccentCard accentColor="#0d9e75">
          <SectionLabel icon="ti-cash" text="Salary" />
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-3.5 mb-3 flex items-center justify-between">
            <div>
              <div className="text-[22px] font-semibold text-blue-800 leading-none">₹4L – ₹9L</div>
              <div className="text-[11px] text-blue-500 mt-1.5">Per annum · CTC</div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
              <i className="ti ti-wallet text-[20px] text-blue-600" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {salaryMeta.map((s) => (
              <MetaItem key={s.label} {...s} />
            ))}
          </div>
        </AccentCard>

        {/* About */}
        <AccentCard accentColor="#6b4fc8">
          <SectionLabel icon="ti-building-community" text="About the company" />
          <p className="text-[13px] text-gray-500 leading-relaxed mb-3">
            TechCraft Solutions is a product-focused software company building B2B SaaS tools
            for the logistics and supply chain industry. We ship fast, value clean code, and
            care deeply about developer experience.
          </p>
          <div className="grid grid-cols-2 gap-2 mb-3">
            {aboutMeta.map((a) => (
              <MetaItem key={a.label} {...a} />
            ))}
          </div>
          <div className="text-[10px] text-gray-400 uppercase tracking-widest font-semibold mb-2">
            Tech stack
          </div>
          <div className="flex flex-wrap gap-1.5">
            {techStack.map((t) => (
              <span
                key={t}
                className="px-2.5 py-1 rounded-full text-[11px] bg-gray-100 text-gray-600 border border-gray-200"
              >
                {t}
              </span>
            ))}
          </div>
        </AccentCard>

        {/* Skills */}
        <AccentCard accentColor="#e09400">
          <SectionLabel icon="ti-tools" text="Skills required" />
          <div className="flex flex-wrap gap-1.5">
            {skills.map((s) => (
              <span
                key={s}
                className="px-3 py-1 rounded-full text-[12px] bg-blue-50 text-blue-700 border border-blue-100"
              >
                {s}
              </span>
            ))}
          </div>
        </AccentCard>

        {/* Location */}
        <AccentCard accentColor="#d85a30">
          <SectionLabel icon="ti-map-pin" text="Job location" />
          <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-3 border border-gray-100">
            <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
              <i className="ti ti-map-pin text-[18px] text-blue-600" />
            </div>
            <div>
              <div className="text-[14px] font-semibold text-gray-900">Coimbatore</div>
              <div className="text-[11px] text-gray-400 mt-0.5">Tamil Nadu, India</div>
            </div>
          </div>
        </AccentCard>

        {/* Experience */}
        <AccentCard accentColor="#3b8c1c">
          <SectionLabel icon="ti-clock" text="Experience required" />
          <div className="bg-gray-50 rounded-xl p-4 flex items-center justify-between border border-gray-100">
            <div>
              <div className="text-[24px] font-semibold text-gray-900 leading-none">0 – 4 Years</div>
              <div className="text-[12px] text-gray-400 mt-1.5">Freshers & experienced both can apply</div>
            </div>
            <span className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-full text-[11px] px-3 py-1.5">
              <i className="ti ti-circle-check text-[13px]" /> Open to all
            </span>
          </div>
        </AccentCard>

        {/* Work Details */}
        <AccentCard accentColor="#1a5fc8">
          <SectionLabel icon="ti-calendar" text="Work details" />
          <div className="grid grid-cols-2 gap-2">
            {workDetails.map((w) => (
              <MetaItem key={w.label} label={w.label} value={w.value} icon={w.icon} />
            ))}
          </div>
        </AccentCard>

        {/* Perks */}
        <AccentCard accentColor="#c94b7a">
          <SectionLabel icon="ti-gift" text="Perks & benefits" />
          <div className="grid grid-cols-2 gap-2">
            {perks.map((p) => (
              <div
                key={p.label}
                className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2.5 border border-gray-100"
              >
                <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                  <i className={`ti ${p.icon} text-[15px] text-blue-600`} />
                </div>
                <span className="text-[12px] font-medium text-gray-800">{p.label}</span>
              </div>
            ))}
          </div>
        </AccentCard>

        {/* Similar Jobs */}
        <AccentCard accentColor="#0d9e75">
          <SectionLabel icon="ti-search" text="Similar jobs" />
          <div className="flex gap-2.5 overflow-x-auto pb-1">
            {similarJobs.map((j) => (
              <div
                key={j.role}
                className="flex-shrink-0 w-40 bg-gray-50 border border-gray-100 rounded-xl p-3"
                style={{ borderLeft: `3px solid ${j.color}` }}
              >
                <div className="text-[12px] font-semibold text-gray-800 mb-1">{j.role}</div>
                <div className="text-[11px] text-gray-400">
                  {j.company} · {j.location}
                </div>
              </div>
            ))}
          </div>
        </AccentCard>

        <ApplyButton
          applied={applied}
          onClick={handleApply}
          label="Apply for this role"
          doneLabel="Application submitted!"
        />
      </div>
    </div>
  );
}