import { useState, useMemo, useEffect } from "react";
import {
  Users,
  CheckCircle,
  Clock,
  XCircle,
  Filter,
  Briefcase,
  ClipboardList,
  BadgeCheck,
  Building2,
  CalendarDays,
  Hash,
  GraduationCap,
  TrendingUp,
  Lock,
} from "lucide-react";
import { api } from "../../utils/api";

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

// A drive is "Closed" once its application deadline (lastDate) has passed —
// same rule used on CompanyManagementPage's Active/Closed filter, so the
// two pages agree on what "closed" means.
function isJobClosed(job) {
  if (!job?.lastDate) return false;
  const d = new Date(job.lastDate);
  if (isNaN(d.getTime())) return false;
  return d < new Date();
}

function StatCard({ icon, label, value, bg, borderColor }) {
  return (
    <div
      style={{ borderColor, backgroundColor: "#fff" }}
      className="rounded-2xl border p-4 flex items-center gap-3 shadow-sm min-w-0"
    >
      <div
        style={{ backgroundColor: bg }}
        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
      >
        {icon}
      </div>
      <div className="min-w-0">
        <p
          className="text-xs font-medium truncate"
          style={{ color: "#64748B" }}
        >
          {label}
        </p>
        <p
          className="text-xl font-bold leading-tight truncate"
          style={{ color: "#0F172A" }}
        >
          {value}
        </p>
      </div>
    </div>
  );
}

// erpId lives on the User model, not the Student model. Backend populates
// userId with "erpId email", so the correct path is student.userId?.erpId.
function NameCell({ student }) {
  if (!student)
    return <span className="text-xs text-[#94A3B8]">Unknown student</span>;
  return (
    <div className="flex items-center gap-2.5 min-w-0">
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm shrink-0"
        style={{ background: "linear-gradient(135deg,#3B82F6,#60A5FA)" }}
      >
        {student.name?.charAt(0) || "?"}
      </div>
      <div className="min-w-0">
        <p
          className="font-semibold text-sm leading-tight truncate"
          style={{ color: "#0F172A" }}
        >
          {student.name || "—"}
        </p>
        <p className="text-xs truncate" style={{ color: "#64748B" }}>
          {student.email || "—"}
        </p>
      </div>
    </div>
  );
}

function StatusActions({ current, onChange, disabled }) {
  const actions = [
    {
      label: "Shortlist",
      value: "Shortlisted",
      activeColor: "bg-amber-500 text-white",
      inactiveColor: "bg-amber-50 text-amber-600 border border-amber-200",
    },
    {
      label: "Select",
      value: "Selected",
      activeColor: "bg-green-500 text-white",
      inactiveColor: "bg-green-50 text-green-600 border border-green-200",
    },
    {
      label: "Reject",
      value: "Rejected",
      activeColor: "bg-red-500 text-white",
      inactiveColor: "bg-red-50 text-red-600 border border-red-200",
    },
  ];
  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {actions.map((action) => (
        <button
          key={action.value}
          onClick={() => onChange(action.value)}
          disabled={disabled}
          className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${current === action.value ? action.activeColor : action.inactiveColor} ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
        >
          {action.label}
        </button>
      ))}
    </div>
  );
}

// Small segmented control — lets the coordinator narrow the drive dropdown
// to Active / Closed / All. Defaults to Active so the dropdown stays short
// day-to-day, but Closed drives' data (who applied/was selected) is never
// lost — it's just one click away instead of cluttering the default view.
function DriveFilterTabs({ value, onChange, counts }) {
  const options = [
    { key: "Active", label: "Active", count: counts.active },
    { key: "Closed", label: "Closed", count: counts.closed },
    { key: "All", label: "All", count: counts.all },
  ];
  return (
    <div className="flex items-center gap-1 bg-white border border-[#E2E8F0] rounded-xl p-1 w-fit">
      {options.map((opt) => (
        <button
          key={opt.key}
          onClick={() => onChange(opt.key)}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            value === opt.key
              ? "bg-[#3B82F6] text-white"
              : "text-[#64748B] hover:text-[#0F172A]"
          }`}
        >
          {opt.label} ({opt.count})
        </button>
      ))}
    </div>
  );
}

// --- Branches/courses shown as individual pills instead of one long string ---
function JDBanner({
  jobs,
  selectedJobId,
  setSelectedJobId,
  selectedJob,
  driveFilter,
  onDriveFilterChange,
  driveCounts,
}) {
  const branchList = selectedJob?.eligibleBranches?.includes("All")
    ? ["All Branches"]
    : selectedJob?.eligibleBranches || [];
  const closed = isJobClosed(selectedJob);

  return (
    <div
      className="rounded-2xl border p-4 flex flex-col gap-4"
      style={{
        background: "linear-gradient(135deg,#EFF6FF,#F0F9FF)",
        borderColor: "#BFDBFE",
      }}
    >
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: "linear-gradient(135deg,#3B82F6,#60A5FA)" }}
          >
            <Briefcase size={18} color="white" />
          </div>
          <div className="min-w-0">
            <p
              className="text-[10px] font-semibold uppercase tracking-widest mb-1"
              style={{ color: "#64748B" }}
            >
              Select Drive
            </p>
            {jobs.length === 0 ? (
              <p className="text-sm font-bold" style={{ color: "#0F172A" }}>
                No {driveFilter !== "All" ? driveFilter.toLowerCase() : ""}{" "}
                drives{driveFilter !== "All" ? "" : " posted yet"}
              </p>
            ) : (
              <div className="flex items-center gap-2 flex-wrap">
                <select
                  value={selectedJobId || ""}
                  onChange={(e) => setSelectedJobId(e.target.value)}
                  className="text-sm font-bold border border-blue-200 rounded-lg px-2 py-1 bg-white focus:outline-none focus:border-blue-400 max-w-full"
                  style={{ color: "#0F172A" }}
                >
                  {jobs.map((j) => (
                    <option key={j._id} value={j._id}>
                      {j.companyId?.name || "Unknown"} — {j.role}
                      {isJobClosed(j) ? " (Closed)" : ""}
                    </option>
                  ))}
                </select>
                {closed && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">
                    <Lock size={10} /> Closed — read only
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Active / Closed / All switch — keeps the dropdown short by
            default without hiding closed-drive data permanently. */}
        <DriveFilterTabs
          value={driveFilter}
          onChange={onDriveFilterChange}
          counts={driveCounts}
        />
      </div>

      {selectedJob && (
        <div className="flex items-start gap-3 flex-wrap">
          {[
            {
              label: "Min CGPA",
              value: selectedJob.minCgpa || "No requirement",
              icon: <TrendingUp size={12} />,
            },
            {
              label: "Backlogs",
              value:
                selectedJob.maxBacklogs === 0
                  ? "None"
                  : `≤ ${selectedJob.maxBacklogs}`,
              icon: <Hash size={12} />,
            },
          ].map(({ label, value, icon }) => (
            <div
              key={label}
              className="rounded-xl px-3 py-1.5 border flex items-start gap-1.5 shrink-0"
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

          {/* Eligible courses - own row, wraps as individual pills */}
          <div
            className="rounded-xl px-3 py-1.5 border flex items-start gap-1.5 flex-1 min-w-[240px]"
            style={{ backgroundColor: "#fff", borderColor: "#BFDBFE" }}
          >
            <span className="mt-0.5 shrink-0" style={{ color: "#3B82F6" }}>
              <GraduationCap size={12} />
            </span>
            <div className="min-w-0">
              <p
                className="text-[10px] font-semibold uppercase tracking-wide mb-1"
                style={{ color: "#64748B" }}
              >
                Eligible Courses
              </p>
              <div className="flex flex-wrap gap-1">
                {branchList.length === 0 ? (
                  <span
                    className="text-xs font-bold"
                    style={{ color: "#1D4ED8" }}
                  >
                    —
                  </span>
                ) : (
                  branchList.map((b) => (
                    <span
                      key={b}
                      className="text-[11px] font-bold px-2 py-0.5 rounded-full"
                      style={{ color: "#1D4ED8", backgroundColor: "#EFF6FF" }}
                    >
                      {b}
                    </span>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function EligibleTab({ selectedJob, allStudents }) {
  // Matching against s.course (not s.branch) — eligibleBranches actually
  // stores full COURSE name strings (e.g. "B.Tech Computer Science
  // Engineering") as selected via BranchSelectorModal in
  // CompanyManagementPage.jsx, which use the same universityStructure
  // course-name strings as Student.course.
  const eligible = useMemo(() => {
    if (!selectedJob) return [];
    return allStudents.filter((s) => {
      const branchOk =
        !selectedJob.eligibleBranches?.length ||
        selectedJob.eligibleBranches?.includes(s.course);
      const cgpaOk = (s.cgpa ?? 0) >= (selectedJob.minCgpa || 0);
      const backlogOk = (s.backlogs ?? 0) <= (selectedJob.maxBacklogs ?? 0);
      return branchOk && cgpaOk && backlogOk;
    });
  }, [selectedJob, allStudents]);

  const cols = "2fr 1.2fr 1.4fr 0.8fr 0.8fr";

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
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
          label="Courses"
          value={selectedJob?.eligibleBranches?.length || 0}
          bg="#F5F3FF"
          borderColor="#DDD6FE"
        />
        <StatCard
          icon={<TrendingUp size={20} color="#F59E0B" />}
          label="Min CGPA Required"
          value={selectedJob?.minCgpa || 0}
          bg="#FFFBEB"
          borderColor="#FDE68A"
        />
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-x-auto">
        <div
          className="border-b border-gray-100"
          style={{
            display: "grid",
            gridTemplateColumns: cols,
            padding: "12px 20px",
            backgroundColor: "#F1F5F9",
            minWidth: "650px",
          }}
        >
          {["Name", "ERP ID", "Course", "CGPA", "Backlogs"].map((h) => (
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
              key={student._id}
              style={{
                display: "grid",
                gridTemplateColumns: cols,
                alignItems: "center",
                padding: "14px 20px",
                borderBottom:
                  idx !== eligible.length - 1 ? "1px solid #F1F5F9" : "none",
                minWidth: "650px",
              }}
            >
              <NameCell student={student} />
              <span className="text-xs font-mono" style={{ color: "#64748B" }}>
                {student.userId?.erpId || "—"}
              </span>
              <span
                className="border text-xs font-semibold px-2.5 py-0.5 rounded-full w-fit"
                style={{
                  color: "#3B82F6",
                  backgroundColor: "#EFF6FF",
                  borderColor: "#BFDBFE",
                }}
              >
                {student.course || "—"}
              </span>
              <span
                className="text-sm font-bold"
                style={{
                  color:
                    (student.cgpa ?? 0) >= 8.5
                      ? "#15803D"
                      : (student.cgpa ?? 0) >= 7.5
                        ? "#0F172A"
                        : "#EF4444",
                }}
              >
                {(student.cgpa ?? 0).toFixed(1)}
              </span>
              <span
                className="text-sm"
                style={{
                  color: (student.backlogs ?? 0) === 0 ? "#64748B" : "#EF4444",
                  fontWeight: (student.backlogs ?? 0) > 0 ? 700 : 400,
                }}
              >
                {(student.backlogs ?? 0) === 0 ? "—" : student.backlogs}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function AppliedTab({ selectedJobId, readOnly }) {
  const [applications, setApplications] = useState([]);
  const [filterStatus, setFilterStatus] = useState("All");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!selectedJobId) return;
    const fetchApps = async () => {
      setLoading(true);
      const data = await api.get(`/applications/job/${selectedJobId}`);
      setApplications(Array.isArray(data) ? data : []);
      setLoading(false);
    };
    fetchApps();
  }, [selectedJobId]);

  const filtered = useMemo(
    () =>
      filterStatus === "All"
        ? applications
        : applications.filter((a) => a.status === filterStatus),
    [applications, filterStatus],
  );

  const updateStatus = async (appId, newStatus) => {
    const updated = await api.put(`/applications/${appId}/status`, {
      status: newStatus,
    });
    setApplications((prev) =>
      prev.map((a) => (a._id === appId ? { ...a, status: updated.status } : a)),
    );
  };

  const counts = useMemo(
    () => ({
      total: applications.length,
      applied: applications.filter((a) => a.status === "Applied").length,
      shortlisted: applications.filter((a) => a.status === "Shortlisted")
        .length,
      selected: applications.filter((a) => a.status === "Selected").length,
      rejected: applications.filter((a) => a.status === "Rejected").length,
    }),
    [applications],
  );

  const cols = readOnly
    ? "2fr 1.2fr 1.4fr 0.8fr 1.1fr 1fr"
    : "2fr 1.2fr 1.4fr 0.8fr 1.1fr 1.8fr";

  if (loading)
    return (
      <div className="text-center py-10 text-text-muted">
        Loading applications...
      </div>
    );

  return (
    <div className="space-y-4">
      {readOnly && (
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 bg-slate-50 border border-slate-100 rounded-xl px-4 py-2.5">
          <Lock size={13} />
          This drive is closed — status changes are disabled, showing final
          results only.
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
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

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-x-auto">
        <div
          className="border-b border-gray-100"
          style={{
            display: "grid",
            gridTemplateColumns: cols,
            padding: "12px 20px",
            backgroundColor: "#F1F5F9",
            minWidth: "850px",
          }}
        >
          {[
            "Name",
            "ERP ID",
            "Course",
            "CGPA",
            "Applied Date",
            readOnly ? "Final Status" : "Status",
          ].map((h) => (
            <span
              key={h}
              className="text-[10px] font-bold uppercase tracking-wider"
              style={{ color: "#64748B" }}
            >
              {h}
            </span>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center py-14 gap-2">
            <ClipboardList size={36} color="#E2E8F0" />
            <p className="text-sm" style={{ color: "#64748B" }}>
              No applications found.
            </p>
          </div>
        ) : (
          filtered.map((app, idx) => {
            const student = app.studentId;
            const s = STATUS_STYLE[app.status] || STATUS_STYLE.Applied;
            return (
              <div
                key={app._id}
                style={{
                  display: "grid",
                  gridTemplateColumns: cols,
                  alignItems: "center",
                  padding: "14px 20px",
                  borderBottom:
                    idx !== filtered.length - 1 ? "1px solid #F1F5F9" : "none",
                  minWidth: "850px",
                }}
              >
                <NameCell student={student} />
                <span
                  className="text-xs font-mono"
                  style={{ color: "#64748B" }}
                >
                  {student?.userId?.erpId || "—"}
                </span>
                <span
                  className="border text-xs font-semibold px-2.5 py-0.5 rounded-full w-fit"
                  style={{
                    color: "#3B82F6",
                    backgroundColor: "#EFF6FF",
                    borderColor: "#BFDBFE",
                  }}
                >
                  {student?.course || "—"}
                </span>
                <span
                  className="text-sm font-bold"
                  style={{
                    color:
                      (student?.cgpa ?? 0) >= 8.5
                        ? "#15803D"
                        : (student?.cgpa ?? 0) >= 7.5
                          ? "#0F172A"
                          : "#EF4444",
                  }}
                >
                  {(student?.cgpa ?? 0).toFixed(1)}
                </span>
                <div
                  className="flex items-center gap-1.5 text-sm"
                  style={{ color: "#64748B" }}
                >
                  <CalendarDays size={13} />
                  {app.appliedDate
                    ? new Date(app.appliedDate).toLocaleDateString()
                    : "—"}
                </div>

                {readOnly ? (
                  // Closed drive: final status shown as a plain badge, no
                  // action buttons — this is what preserves "who was
                  // selected in this closed company" without letting the
                  // coordinator accidentally re-open decisions.
                  <span
                    className="text-xs font-semibold px-2.5 py-1 rounded-full w-fit border"
                    style={{ color: s.color, backgroundColor: s.bg, borderColor: s.border }}
                  >
                    {app.status}
                  </span>
                ) : (
                  <StatusActions
                    current={app.status}
                    onChange={(val) => updateStatus(app._id, val)}
                  />
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default function ApplicationsManagementPage() {
  const [activeTab, setActiveTab] = useState("eligible");
  const [jobs, setJobs] = useState([]);
  const [allStudents, setAllStudents] = useState([]);
  const [selectedJobId, setSelectedJobId] = useState(null);
  const [driveFilter, setDriveFilter] = useState("Active"); // Active | Closed | All
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const jobsData = await api.get("/companies/jobs");
      const studentsData = await api.get("/students");

      // Filter out jobs whose company has been deleted (orphaned jobs).
      // A deleted company leaves companyId as null/undefined on the job doc.
      const jobList = Array.isArray(jobsData)
        ? jobsData.filter((j) => j.companyId && j.companyId.name)
        : [];

      setJobs(jobList);
      setAllStudents(Array.isArray(studentsData) ? studentsData : []);
      setLoading(false);
    };
    fetchData();
  }, []);

  // Drive counts for the Active/Closed/All tabs, computed from the full
  // (unfiltered) job list so the numbers stay accurate regardless of which
  // tab is currently active.
  const driveCounts = useMemo(
    () => ({
      active: jobs.filter((j) => !isJobClosed(j)).length,
      closed: jobs.filter((j) => isJobClosed(j)).length,
      all: jobs.length,
    }),
    [jobs],
  );

  // The dropdown only ever lists jobs matching the current Active/Closed/All
  // tab — this is what keeps "Select Drive" short day-to-day instead of
  // growing forever as more companies close.
  const visibleJobs = useMemo(
    () =>
      jobs.filter((j) => {
        if (driveFilter === "Active") return !isJobClosed(j);
        if (driveFilter === "Closed") return isJobClosed(j);
        return true;
      }),
    [jobs, driveFilter],
  );

  // If the currently selected drive isn't in the visible list anymore
  // (e.g. coordinator switched from Active to Closed), fall back to the
  // first visible job instead of showing a stale/invisible selection.
  useEffect(() => {
    if (visibleJobs.length === 0) {
      setSelectedJobId(null);
      return;
    }
    const stillVisible = visibleJobs.some((j) => j._id === selectedJobId);
    if (!stillVisible) setSelectedJobId(visibleJobs[0]._id);
  }, [visibleJobs, selectedJobId]);

  const selectedJob = jobs.find((j) => j._id === selectedJobId);
  const driveIsClosed = isJobClosed(selectedJob);

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

  if (loading)
    return <div className="text-center py-20 text-text-muted">Loading...</div>;

  return (
    <div
      className="space-y-5 p-6"
      style={{ fontFamily: "Inter, system-ui, sans-serif" }}
    >
      <div>
        <h1 className="text-2xl font-bold" style={{ color: "#0F172A" }}>
          Applications Management
        </h1>
        <p className="text-sm mt-0.5" style={{ color: "#64748B" }}>
          Manage eligible and applied students for a job opening.
        </p>
      </div>

      <JDBanner
        jobs={visibleJobs}
        selectedJobId={selectedJobId}
        setSelectedJobId={setSelectedJobId}
        selectedJob={selectedJob}
        driveFilter={driveFilter}
        onDriveFilterChange={setDriveFilter}
        driveCounts={driveCounts}
      />

      {jobs.length > 0 && selectedJob && (
        <>
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
                    boxShadow: active
                      ? "0 1px 6px rgba(59,130,246,0.3)"
                      : "none",
                  }}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              );
            })}
          </div>

          {activeTab === "eligible" ? (
            <EligibleTab selectedJob={selectedJob} allStudents={allStudents} />
          ) : (
            <AppliedTab
              selectedJobId={selectedJobId}
              readOnly={driveIsClosed}
            />
          )}
        </>
      )}
    </div>
  );
}