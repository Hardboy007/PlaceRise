import { useState, useMemo } from "react";
import {
  Users,
  CheckCircle,
  Clock,
  XCircle,
  Filter,
  ChevronDown,
  Briefcase,
  ClipboardList,
  BadgeCheck,
  Building2,
  CalendarDays,
  Hash,
  GraduationCap,
  TrendingUp,
} from "lucide-react";
import mockStudents from "../../data/mockStudents";

// ── JD Config ─────────────────────────────────────────────────
const JD = {
  title: "Software Engineer Intern",
  company: "Google",
  minCgpa: 7.5,
  maxBacklogs: 0,
  eligibleBranches: ["CSE", "ECE", "BSc.IT"],
};

// ── Applied Data (simulate DB — studentId matches mockStudents ids) ──
const INITIAL_APPLIED = [
  { studentId: 2, appliedDate: "May 1, 2026", status: "Shortlisted" },
  { studentId: 7, appliedDate: "May 1, 2026", status: "Selected" },
  { studentId: 1, appliedDate: "May 2, 2026", status: "Applied" },
  { studentId: 8, appliedDate: "May 3, 2026", status: "Applied" },
  { studentId: 3, appliedDate: "May 4, 2026", status: "Rejected" },
];

const STATUS_OPTIONS = ["Applied", "Shortlisted", "Selected", "Rejected"];

const STATUS_STYLE = {
  Applied: {
    color: "#1D4ED8",
    bg: "#EFF6FF",
    border: "#BFDBFE",
    dot: "#3B82F6",
  },
  Shortlisted: {
    color: "#92400E",
    bg: "#FFFBEB",
    border: "#FDE68A",
    dot: "#F59E0B",
  },
  Selected: {
    color: "#14532D",
    bg: "#F0FDF4",
    border: "#86EFAC",
    dot: "#22C55E",
  },
  Rejected: {
    color: "#991B1B",
    bg: "#FFF1F2",
    border: "#FECDD3",
    dot: "#EF4444",
  },
};

// ── Stat Card ─────────────────────────────────────────────────
function StatCard({ icon, label, value, bg, borderColor }) {
  return (
    <div
      style={{ borderColor, backgroundColor: "#fff" }}
      className="rounded-2xl border p-4 flex items-center gap-3 shadow-sm"
    >
      <div
        style={{ backgroundColor: bg }}
        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
      >
        {icon}
      </div>
      <div>
        <p className="text-xs font-medium" style={{ color: "#64748B" }}>
          {label}
        </p>
        <p
          className="text-xl font-bold leading-tight"
          style={{ color: "#0F172A" }}
        >
          {value}
        </p>
      </div>
    </div>
  );
}

// ── Name Cell ─────────────────────────────────────────────────
function NameCell({ student }) {
  return (
    <div className="flex items-center gap-2.5">
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm shrink-0"
        style={{ background: "linear-gradient(135deg,#3B82F6,#60A5FA)" }}
      >
        {student.name.charAt(0)}
      </div>
      <div>
        <p
          className="font-semibold text-sm leading-tight"
          style={{ color: "#0F172A" }}
        >
          {student.name}
        </p>
        <p className="text-xs" style={{ color: "#64748B" }}>
          {student.email}
        </p>
      </div>
    </div>
  );
}

// ── Status Dropdown ───────────────────────────────────────────
function StatusDropdown({ current, onChange }) {
  const [open, setOpen] = useState(false);
  const s = STATUS_STYLE[current] || STATUS_STYLE.Applied;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((p) => !p)}
        className="inline-flex items-center gap-1.5 border text-xs font-semibold rounded-full px-2.5 py-1 hover:opacity-80 transition-opacity"
        style={{ color: s.color, backgroundColor: s.bg, borderColor: s.border }}
      >
        <span
          className="w-1.5 h-1.5 rounded-full"
          style={{ backgroundColor: s.dot }}
        />
        {current}
        <ChevronDown size={12} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-8 z-999 bg-white border border-gray-100 rounded-xl shadow-lg py-1 min-w-32.5">
            {STATUS_OPTIONS.map((opt) => {
              const os = STATUS_STYLE[opt];
              return (
                <button
                  key={opt}
                  onClick={() => {
                    onChange(opt);
                    setOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 text-xs font-semibold flex items-center gap-2 hover:bg-slate-50"
                  style={{ color: os.color }}
                >
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: os.dot }}
                  />
                  {opt}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

// ── JD Banner ─────────────────────────────────────────────────
function JDBanner() {
  return (
    <div
      className="rounded-2xl border p-4 flex items-center justify-between flex-wrap gap-3"
      style={{
        background: "linear-gradient(135deg,#EFF6FF,#F0F9FF)",
        borderColor: "#BFDBFE",
      }}
    >
      <div className="flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: "linear-gradient(135deg,#3B82F6,#60A5FA)" }}
        >
          <Briefcase size={18} color="white" />
        </div>
        <div>
          <p className="font-bold text-sm" style={{ color: "#0F172A" }}>
            {JD.title}
          </p>
          <p className="text-xs" style={{ color: "#64748B" }}>
            {JD.company}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        {[
          {
            label: "Min CGPA",
            value: JD.minCgpa,
            icon: <TrendingUp size={12} />,
          },
          {
            label: "Backlogs",
            value: JD.maxBacklogs === 0 ? "None" : `≤ ${JD.maxBacklogs}`,
            icon: <Hash size={12} />,
          },
          {
            label: "Branches",
            value: JD.eligibleBranches.join(", "),
            icon: <GraduationCap size={12} />,
          },
        ].map(({ label, value, icon }) => (
          <div
            key={label}
            className="rounded-xl px-3 py-1.5 border flex items-start gap-1.5"
            style={{ backgroundColor: "#fff", borderColor: "#BFDBFE" }}
          >
            <span className="mt-0.5" style={{ color: "#3B82F6" }}>
              {icon}
            </span>
            <div>
              <p
                className="text-[10px] font-semibold uppercase tracking-wide"
                style={{ color: "#64748B" }}
              >
                {label}
              </p>
              <p className="text-xs font-bold" style={{ color: "#1D4ED8" }}>
                {value}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Tab 1 — Eligible Students ─────────────────────────────────
function EligibleTab() {
  const eligible = useMemo(
    () =>
      mockStudents.filter(
        (s) =>
          JD.eligibleBranches.includes(s.branch) &&
          s.cgpa >= JD.minCgpa &&
          s.backlogs <= JD.maxBacklogs,
      ),
    [],
  );

  const cols = "2fr 1.2fr 1fr 0.8fr 0.8fr";

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-4 gap-4">
        <StatCard
          icon={<Users size={20} color="#3B82F6" />}
          label="Total Eligible"
          value={eligible.length}
          bg="#EFF6FF"
          borderColor="#BFDBFE"
        />
        <StatCard
          icon={<CheckCircle size={20} color="#22C55E" />}
          label="Already Placed"
          value={eligible.filter((s) => s.placementStatus === "Placed").length}
          bg="#F0FDF4"
          borderColor="#86EFAC"
        />
        <StatCard
          icon={<Building2 size={20} color="#8B5CF6" />}
          label="Branches"
          value={JD.eligibleBranches.length}
          bg="#F5F3FF"
          borderColor="#DDD6FE"
        />
        <StatCard
          icon={<TrendingUp size={20} color="#F59E0B" />}
          label="Min CGPA Required"
          value={JD.minCgpa}
          bg="#FFFBEB"
          borderColor="#FDE68A"
        />
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-visible">
        <div
          className="border-b border-gray-100"
          style={{
            display: "grid",
            gridTemplateColumns: cols,
            padding: "12px 20px",
            backgroundColor: "#F1F5F9",
          }}
        >
          {["Name", "ERP ID", "Branch", "CGPA", "Backlogs"].map((h) => (
            <span
              key={h}
              className="text-[10px] font-bold uppercase tracking-wider"
              style={{ color: "#64748B" }}
            >
              {h}
            </span>
          ))}
        </div>

        {eligible.length === 0 ? (
          <div className="flex flex-col items-center py-14 gap-2">
            <Users size={36} color="#E2E8F0" />
            <p className="text-sm" style={{ color: "#64748B" }}>
              No eligible students found.
            </p>
          </div>
        ) : (
          eligible.map((student, idx) => (
            <div
              key={student.id}
              style={{
                display: "grid",
                gridTemplateColumns: cols,
                alignItems: "center",
                padding: "14px 20px",
                borderBottom:
                  idx !== eligible.length - 1 ? "1px solid #F1F5F9" : "none",
                transition: "background 0.12s",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.backgroundColor = "#F8FAFC")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.backgroundColor = "#fff")
              }
            >
              <NameCell student={student} />
              <span className="text-xs font-mono" style={{ color: "#64748B" }}>
                {student.erpId}
              </span>
              <span
                className="border text-xs font-semibold px-2.5 py-0.5 rounded-full w-fit"
                style={{
                  color: "#3B82F6",
                  backgroundColor: "#EFF6FF",
                  borderColor: "#BFDBFE",
                }}
              >
                {student.branch}
              </span>
              <span
                className="text-sm font-bold"
                style={{
                  color:
                    student.cgpa >= 8.5
                      ? "#15803D"
                      : student.cgpa >= 7.5
                        ? "#0F172A"
                        : "#EF4444",
                }}
              >
                {student.cgpa.toFixed(1)}
              </span>
              <span
                className="text-sm"
                style={{
                  color: student.backlogs === 0 ? "#64748B" : "#EF4444",
                  fontWeight: student.backlogs > 0 ? 700 : 400,
                }}
              >
                {student.backlogs === 0 ? "—" : student.backlogs}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ── Tab 2 — Applied Students ──────────────────────────────────
function AppliedTab() {
  const [applications, setApplications] = useState(INITIAL_APPLIED);
  const [filterStatus, setFilterStatus] = useState("All");

  const enriched = useMemo(
    () =>
      applications
        .map((app) => ({
          ...app,
          student: mockStudents.find((s) => s.id === app.studentId),
        }))
        .filter((a) => a.student),
    [applications],
  );

  const filtered = useMemo(
    () =>
      filterStatus === "All"
        ? enriched
        : enriched.filter((a) => a.status === filterStatus),
    [enriched, filterStatus],
  );

  const updateStatus = (studentId, newStatus) =>
    setApplications((prev) =>
      prev.map((a) =>
        a.studentId === studentId ? { ...a, status: newStatus } : a,
      ),
    );

  const counts = useMemo(
    () => ({
      total: enriched.length,
      applied: enriched.filter((a) => a.status === "Applied").length,
      shortlisted: enriched.filter((a) => a.status === "Shortlisted").length,
      selected: enriched.filter((a) => a.status === "Selected").length,
      rejected: enriched.filter((a) => a.status === "Rejected").length,
    }),
    [enriched],
  );

  const cols = "2fr 1.2fr 1fr 0.8fr 1.1fr 1.4fr";

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-5 gap-3">
        <StatCard
          icon={<Users size={20} color="#3B82F6" />}
          label="Total Applied"
          value={counts.total}
          bg="#EFF6FF"
          borderColor="#BFDBFE"
        />
        <StatCard
          icon={<ClipboardList size={20} color="#3B82F6" />}
          label="Applied"
          value={counts.applied}
          bg="#EFF6FF"
          borderColor="#BFDBFE"
        />
        <StatCard
          icon={<Clock size={20} color="#F59E0B" />}
          label="Shortlisted"
          value={counts.shortlisted}
          bg="#FFFBEB"
          borderColor="#FDE68A"
        />
        <StatCard
          icon={<BadgeCheck size={20} color="#22C55E" />}
          label="Selected"
          value={counts.selected}
          bg="#F0FDF4"
          borderColor="#86EFAC"
        />
        <StatCard
          icon={<XCircle size={20} color="#EF4444" />}
          label="Rejected"
          value={counts.rejected}
          bg="#FFF1F2"
          borderColor="#FECDD3"
        />
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm flex items-center gap-2 flex-wrap">
        <div
          className="flex items-center gap-1.5 text-sm font-medium mr-1"
          style={{ color: "#64748B" }}
        >
          <Filter size={14} /> Filter by Status
        </div>
        {["All", ...STATUS_OPTIONS].map((opt) => {
          const active = filterStatus === opt;
          const s = opt !== "All" ? STATUS_STYLE[opt] : null;
          return (
            <button
              key={opt}
              onClick={() => setFilterStatus(opt)}
              className="text-xs font-semibold px-3 py-1.5 rounded-full border transition-all"
              style={{
                color: active ? (s ? s.color : "#1D4ED8") : "#64748B",
                backgroundColor: active ? (s ? s.bg : "#EFF6FF") : "#F8FAFC",
                borderColor: active ? (s ? s.border : "#BFDBFE") : "#E2E8F0",
              }}
            >
              {opt} (
              {opt === "All" ? counts.total : (counts[opt.toLowerCase()] ?? 0)})
            </button>
          );
        })}
        <span className="ml-auto text-sm" style={{ color: "#64748B" }}>
          Showing{" "}
          <strong style={{ color: "#0F172A" }}>{filtered.length}</strong> of{" "}
          {counts.total}
        </span>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div
          className="border-b border-gray-100"
          style={{
            display: "grid",
            gridTemplateColumns: cols,
            padding: "12px 20px",
            backgroundColor: "#F1F5F9",
          }}
        >
          {["Name", "ERP ID", "Branch", "CGPA", "Applied Date", "Status"].map(
            (h) => (
              <span
                key={h}
                className="text-[10px] font-bold uppercase tracking-wider"
                style={{ color: "#64748B" }}
              >
                {h}
              </span>
            ),
          )}
        </div>

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center py-14 gap-2">
            <ClipboardList size={36} color="#E2E8F0" />
            <p className="text-sm" style={{ color: "#64748B" }}>
              No applications found.
            </p>
          </div>
        ) : (
          filtered.map((app, idx) => (
            <div
              key={app.studentId}
              style={{
                display: "grid",
                gridTemplateColumns: cols,
                alignItems: "center",
                padding: "14px 20px",
                borderBottom:
                  idx !== filtered.length - 1 ? "1px solid #F1F5F9" : "none",
                transition: "background 0.12s",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.backgroundColor = "#F8FAFC")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.backgroundColor = "#fff")
              }
            >
              <NameCell student={app.student} />
              <span className="text-xs font-mono" style={{ color: "#64748B" }}>
                {app.student.erpId}
              </span>
              <span
                className="border text-xs font-semibold px-2.5 py-0.5 rounded-full w-fit"
                style={{
                  color: "#3B82F6",
                  backgroundColor: "#EFF6FF",
                  borderColor: "#BFDBFE",
                }}
              >
                {app.student.branch}
              </span>
              <span
                className="text-sm font-bold"
                style={{
                  color:
                    app.student.cgpa >= 8.5
                      ? "#15803D"
                      : app.student.cgpa >= 7.5
                        ? "#0F172A"
                        : "#EF4444",
                }}
              >
                {app.student.cgpa.toFixed(1)}
              </span>
              <div
                className="flex items-center gap-1.5 text-sm"
                style={{ color: "#64748B" }}
              >
                <CalendarDays size={13} />
                {app.appliedDate}
              </div>
              <StatusDropdown
                current={app.status}
                onChange={(val) => updateStatus(app.studentId, val)}
              />
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────
export default function ApplicationsManagementPage() {
  const [activeTab, setActiveTab] = useState("eligible");

  const tabs = [
    {
      id: "eligible",
      label: "Eligible Students",
      icon: <BadgeCheck size={16} />,
    },
    {
      id: "applied",
      label: "Applied Students",
      icon: <ClipboardList size={16} />,
    },
  ];

  return (
    <div
      className="space-y-5"
      style={{
        backgroundColor: "#F1F5F9",
        fontFamily: "Inter, system-ui, sans-serif",
      }}
    >
      <div>
        <h1 className="text-2xl font-bold" style={{ color: "#0F172A" }}>
          Applications Management
        </h1>
        <p className="text-sm mt-0.5" style={{ color: "#64748B" }}>
          Manage eligible and applied students for a job opening.
        </p>
      </div>

      <JDBanner />

      <div className="flex items-center gap-1 bg-white rounded-2xl border border-gray-100 p-1.5 shadow-sm w-fit">
        {tabs.map((tab) => {
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all"
              style={{
                backgroundColor: active ? "#3B82F6" : "transparent",
                color: active ? "#fff" : "#64748B",
                boxShadow: active ? "0 1px 6px rgba(59,130,246,0.3)" : "none",
              }}
            >
              {tab.icon}
              {tab.label}
            </button>
          );
        })}
      </div>

      {activeTab === "eligible" ? <EligibleTab /> : <AppliedTab />}
    </div>
  );
}
