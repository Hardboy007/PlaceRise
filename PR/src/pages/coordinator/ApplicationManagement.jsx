import { useState, useMemo, useEffect, useRef } from "react";
import {
  Users,
  CheckCircle,
  Check,
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
  ShieldCheck,
  RotateCcw,
  RotateCw,
  X,
  Download,
  FileWarning,
  Search,
  Trash2,
  AlertTriangle,
  Info,
  LoaderCircle,
} from "lucide-react";
import { api } from "../../utils/api";
import { getSemester } from "../../utils/semester";

const STATUS_OPTIONS = ["Applied", "Shortlisted", "Selected", "Rejected"];

const STATUS_STYLE = {
  Applied: {
    color: "#1a3a8f",
    bg: "#EFF3FA",
    border: "#B8C6E3",
    dot: "#1a3a8f",
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

// Compares dates as IST (Asia/Kolkata) calendar days, not the browser's
// local timezone — using getFullYear/getMonth/getDate on plain Date
// objects reads the BROWSER's local timezone, which is fragile in
// general and doesn't match the backend's own IST-based check (the
// backend is what actually matters since hosting servers usually run in
// UTC). en-CA locale gives YYYY-MM-DD, which sorts/compares correctly as
// a string.
function toISTDateString(date) {
  return date.toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
}

// A drive is "Closed" once its application deadline (lastDate) DAY has
// fully passed — this ONLY controls whether new students can apply, and
// which Active/Closed/All tab the drive shows up under. It no longer
// controls whether the coordinator can update student statuses — rounds
// (interviews, tests, etc.) routinely continue well after the apply
// deadline.
//
// IMPORTANT: this compares IST CALENDAR DAYS, not exact timestamps.
// Comparing `new Date(job.lastDate) < new Date()` directly was wrong —
// job.lastDate is normally stored at midnight (00:00:00), so the very
// first second of the deadline day made the drive look "Closed" even
// though students/coordinators should still have the entire day to
// apply. Today == lastDate's day must still count as OPEN/Active; only
// once today is AFTER that day does the drive count as Closed. This
// mirrors getBulkApplyWindowStatus below, so "Active" tab + bulk-apply
// window agree on what "today" means.
function isJobClosed(job) {
  if (!job?.lastDate) return false;
  const d = new Date(job.lastDate);
  if (isNaN(d.getTime())) return false;
  const lastDayStr = toISTDateString(d);
  const todayStr = toISTDateString(new Date());
  return todayStr > lastDayStr;
}

// Bulk-apply is intentionally tied to the SAME date as the students' own
// apply deadline (job.lastDate) — there's exactly one cutoff for everyone,
// not a separate "coordinator" deadline.
//   "before"  -> deadline day hasn't arrived yet, bulk apply not open yet
//   "open"    -> today IS the deadline day, bulk apply works
//   "after"   -> deadline day has passed, permanently frozen for anyone
//                who hasn't applied (mirrors createApplication's own
//                deadline check on the student-apply side)
//   "unknown" -> job has no lastDate at all
function getBulkApplyWindowStatus(job) {
  if (!job?.lastDate) return "unknown";
  const last = new Date(job.lastDate);
  if (isNaN(last.getTime())) return "unknown";
  const now = new Date();
  const lastDayStr = toISTDateString(last);
  const todayStr = toISTDateString(now);
  if (todayStr === lastDayStr) return "open";
  if (todayStr < lastDayStr) return "before";
  return "after";
}

function StatCard({ icon, label, value, bg, borderColor }) {
  return (
    <div
      style={{ borderColor, backgroundColor: "#fff" }}
      className="rounded-2xl border p-3 sm:p-4 flex items-center gap-2.5 sm:gap-3 shadow-sm min-w-0"
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
          className="text-base sm:text-xl font-bold leading-tight truncate"
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
      <div className="w-8 h-8 rounded-lg overflow-hidden shrink-0">
        {student.profilePhoto ? (
          <img
            src={student.profilePhoto}
            alt={student.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div
            className="w-full h-full rounded-lg flex items-center justify-center text-white font-bold text-sm"
            style={{ background: "linear-gradient(135deg,#1a3a8f,#3d1a6e)" }}
          >
            {student.name?.charAt(0) || "?"}
          </div>
        )}
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
    <div className="flex items-center gap-1 bg-white/10 border border-white/20 rounded-xl p-1 w-fit">
      {options.map((opt) => (
        <button
          key={opt.key}
          onClick={() => onChange(opt.key)}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            value === opt.key
              ? "bg-white text-[#1a3a8f]"
              : "text-white/75 hover:text-white"
          }`}
        >
          {opt.label} ({opt.count})
        </button>
      ))}
    </div>
  );
}

// --- Branches/courses shown as individual pills instead of one long string ---
// WITH
function JDBanner({
  jobs,
  selectedJobId,
  setSelectedJobId,
  selectedJob,
  driveFilter,
  onDriveFilterChange,
  driveCounts,
  onToggleFinalize,
  finalizing,
  selectedCompanyId,
  onCompanyChange,
  selectedRoleGroupId,
  setSelectedRoleGroupId,
}) {
  const selectedRoleGroup = selectedJob?.roleGroups?.find(
    (rg) => rg._id?.toString() === selectedRoleGroupId,
  );
  const branchList = selectedRoleGroup?.eligibleBranches?.includes("All")
    ? ["All Branches"]
    : selectedRoleGroup?.eligibleBranches || [];
  const applicationsClosed = isJobClosed(selectedJob);
  const resultsFinalized = !!selectedJob?.resultsFinalized;

  return (
    <div
      className="relative overflow-hidden rounded-2xl border p-3 sm:p-4 flex flex-col gap-4"
      style={{
        background:
          "linear-gradient(135deg, #0d1b5e 0%, #1a2d8a 25%, #3d1a6e 55%, #6b1040 80%, #7a0f35 100%)",
        borderColor: "rgba(255,255,255,0.12)",
      }}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3 flex-wrap">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: "linear-gradient(135deg,#1a3a8f,#3d1a6e)" }}
          >
            <Briefcase size={18} color="white" />
          </div>

          {/* Company dropdown */}
          <div className="min-w-0">
            <p
              className="text-[10px] font-semibold uppercase tracking-widest mb-1"
              style={{ color: "rgba(255,255,255,0.7)" }}
            >
              Company
            </p>
            {jobs.length === 0 ? (
              <p className="text-sm font-bold text-white">
                No {driveFilter !== "All" ? driveFilter.toLowerCase() : ""}{" "}
                drives
              </p>
            ) : (
              <select
                value={selectedCompanyId || ""}
                onChange={(e) => onCompanyChange(e.target.value)}
                className="text-sm font-bold border border-white/25 rounded-lg px-2 py-1 bg-white/10 text-white focus:outline-none focus:border-white/50 sm:max-w-[200px] truncate"
              >
                {[
                  ...new Map(
                    jobs.map((j) => [j.companyId?._id, j.companyId?.name]),
                  ).entries(),
                ]
                  .filter(([id]) => id)
                  .map(([id, name]) => (
                    <option
                      key={id}
                      value={id}
                      style={{ color: "#0F172A", backgroundColor: "#fff" }}
                    >
                      {name}
                    </option>
                  ))}
              </select>
            )}
          </div>

          {/* Role dropdown */}
          {selectedCompanyId &&
            (() => {
              const companyJobs = jobs.filter(
                (j) => j.companyId?._id === selectedCompanyId,
              );
              const allRoleGroups = companyJobs.flatMap((j) =>
                (j.roleGroups?.length
                  ? j.roleGroups
                  : [{ _id: j._id, role: j.role || "Drive", _jobId: j._id }]
                ).map((rg) => ({
                  ...rg,
                  _jobId: j._id,
                  _closed: isJobClosed(j),
                })),
              );
              return (
                <div className="min-w-0">
                  <p
                    className="text-[10px] font-semibold uppercase tracking-widest mb-1"
                    style={{ color: "rgba(255,255,255,0.7)" }}
                  >
                    Role
                  </p>
                  <div className="flex items-center gap-2 flex-wrap">
                    <select
                      value={selectedRoleGroupId || ""}
                      onChange={(e) => {
                        const rgId = e.target.value;
                        setSelectedRoleGroupId(rgId);
                        const found = allRoleGroups.find(
                          (rg) => rg._id?.toString() === rgId,
                        );
                        if (found) setSelectedJobId(found._jobId);
                      }}
                      className="text-sm font-bold border border-white/25 rounded-lg px-2 py-1 bg-white/10 text-white focus:outline-none focus:border-white/50 sm:max-w-[220px] truncate"
                    >
                      {allRoleGroups.map((rg) => (
                        <option
                          key={rg._id}
                          value={rg._id?.toString()}
                          style={{ color: "#0F172A", backgroundColor: "#fff" }}
                        >
                          {rg.role}
                          {rg._closed ? " (Closed)" : ""}
                        </option>
                      ))}
                    </select>
                    {applicationsClosed && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/15 text-white/75">
                        <Lock size={10} /> Applications Closed
                      </span>
                    )}
                    {resultsFinalized && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/15 text-white">
                        <ShieldCheck size={10} /> Results Finalized
                      </span>
                    )}
                  </div>
                </div>
              );
            })()}
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
              className="rounded-xl px-3 py-1.5 border border-white/25 bg-white/10 flex items-start gap-1.5 shrink-0"
            >
              <span className="mt-0.5" style={{ color: "#1a3a8f" }}>
                {icon}
              </span>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-white/65">
                  {label}
                </p>
                <p className="text-xs font-bold text-white">{value}</p>
              </div>
            </div>
          ))}

          {/* Eligible courses - own row, wraps as individual pills */}
          <div className="rounded-xl px-3 py-1.5 border border-white/25 bg-white/10 flex items-start gap-1.5 flex-1 min-w-[240px]">
            <span className="mt-0.5 shrink-0" style={{ color: "#f59e0b" }}>
              <GraduationCap size={12} />
            </span>
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-wide mb-1 text-white/65">
                Eligible Courses
              </p>
              <div className="flex flex-wrap gap-1">
                {branchList.length === 0 ? (
                  <span className="text-xs font-bold text-white">—</span>
                ) : (
                  branchList.map((b) => (
                    <span
                      key={b}
                      className="text-[11px] font-bold px-2 py-0.5 rounded-full text-white bg-white/15"
                    >
                      {b}
                    </span>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Finalize / Reopen results toggle — coordinator's manual gate
              on whether status buttons are editable. Independent of the
              apply deadline (lastDate) so rounds can continue after it. */}
          <button
            onClick={onToggleFinalize}
            disabled={finalizing}
            className={`rounded-xl px-3 py-1.5 border flex items-center gap-1.5 shrink-0 text-xs font-bold transition-all ${
              finalizing ? "opacity-60 cursor-not-allowed" : ""
            } ${
              resultsFinalized
                ? "bg-white/10 border-white/25 text-white/75 hover:text-white"
                : "bg-emerald-500 border-emerald-300 text-white hover:bg-emerald-600"
            }`}
          >
            {resultsFinalized ? (
              <>
                <RotateCcw size={12} /> Reopen
              </>
            ) : (
              <>
                <ShieldCheck size={12} /> Mark Results as Final
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}

// Confirmation modal — driven by the coordinator's actual checkbox
// selection instead of "every eligible student". willApply reflects only
// the checked, not-yet-applied students that will actually get a new
// Application document.
function BulkApplyModal({
  show,
  onClose,
  onConfirm,
  loading,
  selectedCount,
  eligibleCount,
  appliedCount,
  jobName,
}) {
  if (!show) return null;
  const willApply = selectedCount;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{
        backgroundColor: "rgba(15,23,42,0.55)",
        backdropFilter: "blur(6px)",
      }}
      onClick={(e) => e.target === e.currentTarget && !loading && onClose()}
    >
      <div
        className="bg-white rounded-3xl shadow-2xl border border-[#E2E8F0] w-full max-w-md overflow-hidden"
        style={{ animation: "fadeInScale 0.2s ease-out" }}
      >
        {/* Header */}
        <div
          className="px-6 py-5 flex items-center gap-3"
          style={{
            background:
              "linear-gradient(135deg, #0d1b5e 0%, #1a2d8a 25%, #3d1a6e 55%, #6b1040 80%, #7a0f35 100%)",
          }}
        >
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
            <Users size={20} color="white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">
              Bulk Apply Confirmation
            </h3>
            <p className="text-xs text-white/70">Review before proceeding</p>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          <div
            className="rounded-xl border p-4 space-y-3"
            style={{ backgroundColor: "#FFFBEB", borderColor: "#FDE68A" }}
          >
            <div className="flex items-center gap-2">
              <AlertTriangle size={18} color="#F59E0B" strokeWidth={2.5} />
              <span className="text-sm font-bold" style={{ color: "#92400E" }}>
                Are you sure?
              </span>
            </div>
            <p className="text-xs leading-relaxed" style={{ color: "#78350F" }}>
              This will create <strong>{willApply}</strong> new application
              {willApply !== 1 ? "s" : ""} with &quot;Applied&quot; status for
              the students you've selected below. Students with no resume
              uploaded will be skipped automatically.
            </p>
          </div>

          <div className="space-y-2">
            <p
              className="text-xs font-semibold uppercase tracking-wider"
              style={{ color: "#64748B" }}
            >
              Drive Details
            </p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: "Drive", value: jobName, full: true },
                { label: "Total Eligible", value: eligibleCount },
                { label: "Already Applied", value: appliedCount },
                {
                  label: "Selected to Apply",
                  value: willApply,
                  highlight: true,
                },
              ].map(({ label, value, full, highlight }) => (
                <div
                  key={label}
                  className={`rounded-xl border px-3 py-2.5 ${full ? "col-span-2" : ""}`}
                  style={{
                    backgroundColor: highlight ? "#EFF3FA" : "#F8FAFC",
                    borderColor: highlight ? "#B8C6E3" : "#E2E8F0",
                  }}
                >
                  <p
                    className="text-[10px] font-semibold uppercase tracking-wider"
                    style={{ color: "#64748B" }}
                  >
                    {label}
                  </p>
                  <p
                    className="text-sm font-bold truncate"
                    style={{ color: highlight ? "#1a3a8f" : "#0F172A" }}
                  >
                    {value}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[#E2E8F0] flex items-center gap-3 justify-end bg-[#F8FAFC]">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold border border-[#E2E8F0] bg-white text-[#64748B] hover:text-[#0F172A] transition-all disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading || willApply === 0}
            className="px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            style={{
              background: loading
                ? "#94A3B8"
                : "linear-gradient(135deg, #1a3a8f, #3d1a6e)",
              boxShadow: loading ? "none" : "0 2px 10px rgba(26,58,143,0.35)",
            }}
          >
            {loading ? (
              <>
                <LoaderCircle size={14} className="animate-spin" />
                Applying...
              </>
            ) : (
              <>
                <Users size={14} />
                Yes, Bulk Apply ({willApply})
              </>
            )}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes fadeInScale {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}

function EligibleTab({
  selectedJob,
  allStudents,
  refreshKey,
  selectedRoleGroupId,
}) {
  // Matching against s.course (not s.branch) — eligibleBranches actually
  // stores full COURSE name strings (e.g. "B.Tech Computer Science
  // Engineering") as selected via BranchSelectorModal in
  // CompanyManagementPage.jsx, which use the same universityStructure
  // course-name strings as Student.course.
  const selectedRoleGroup = selectedJob?.roleGroups?.find(
    (rg) => rg._id?.toString() === selectedRoleGroupId,
  );
  const eligible = useMemo(() => {
    if (!selectedJob) return [];
    return allStudents.filter((s) => {
      const eligibleBranches = selectedRoleGroup?.eligibleBranches || [];
      const branchOk =
        eligibleBranches.length === 0 ||
        eligibleBranches.includes("All") ||
        eligibleBranches.includes(s.course);
      const cgpaOk = (s.cgpa ?? 0) >= (selectedJob.minCgpa || 0);
      const backlogOk = (s.backlogs ?? 0) <= (selectedJob.maxBacklogs ?? 0);
      return branchOk && cgpaOk && backlogOk;
    });
  }, [selectedJob, allStudents, selectedRoleGroupId]);

  // Whether today is the drive's bulk-apply day (== job.lastDate).
  const bulkApplyStatus = useMemo(
    () => getBulkApplyWindowStatus(selectedJob),
    [selectedJob],
  );
  const bulkApplyOpen = bulkApplyStatus === "open";
  const lastDateLabel = selectedJob?.lastDate
    ? new Date(selectedJob.lastDate).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : null;

  // Which eligible students have already applied to this drive
  const [appliedIds, setAppliedIds] = useState(new Set());
  // studentId -> appliedVia ("self" | "bulk-coordinator") — lets the row
  // show WHO applied, not just that they applied, so a coordinator can
  // tell apart students they bulk-applied vs students who applied
  // themselves.
  const [appliedViaMap, setAppliedViaMap] = useState({});
  const [appliedLoading, setAppliedLoading] = useState(true);

  // Checkbox selection state for bulk-apply — keyed by student._id.
  // Starts EMPTY. The coordinator must explicitly tick students (or use
  // "Select All", which itself only ticks non-applied / has-resume
  // students). We deliberately do NOT pre-check anyone here — pre-checking
  // "everyone eligible" meant a coordinator could hit "Bulk Apply" without
  // reviewing and silently apply for students they never intended to.
  // No-resume / already-applied students can NEVER end up in this set —
  // enforced both in toggleStudent / toggleSelectAll below, so there's no
  // path (including "Select All") that can sneak them in.
  const [selectedIds, setSelectedIds] = useState(new Set());

  // Name / ERP ID search — narrows what's rendered in the table only.
  // Selection state (selectedIds) is intentionally untouched by search so
  // a coordinator can search, tick a student, clear the search, and their
  // pick is still checked.
  const [searchQuery, setSearchQuery] = useState("");

  const [bulkApplyModal, setBulkApplyModal] = useState(false);
  const [bulkApplyLoading, setBulkApplyLoading] = useState(false);
  const [bulkApplyResult, setBulkApplyResult] = useState(null);

  useEffect(() => {
    if (!selectedJob?._id) {
      setAppliedIds(new Set());
      setAppliedViaMap({});
      setAppliedLoading(false);
      return;
    }
    const fetchApplied = async () => {
      setAppliedLoading(true);
      try {
        const apps = await api.get(`/applications/job/${selectedJob._id}`);
        const list = Array.isArray(apps) ? apps : [];
        const ids = new Set(
          list.map(
            (a) => a.studentId?._id?.toString?.() || a.studentId?.toString?.(),
          ),
        );
        const viaMap = {};
        list.forEach((a) => {
          const sid =
            a.studentId?._id?.toString?.() || a.studentId?.toString?.();
          if (sid) viaMap[sid] = a.appliedVia || "self";
        });
        setAppliedIds(ids);
        setAppliedViaMap(viaMap);
      } catch {
        setAppliedIds(new Set());
        setAppliedViaMap({});
      } finally {
        setAppliedLoading(false);
      }
    };
    fetchApplied();
    // refreshKey bumps whenever the coordinator hits the page-level
    // "Refresh" button, so applied status gets pulled fresh too, not just
    // the student list.
  }, [selectedJob?._id, refreshKey]);

  // Reset the checkbox selection to EMPTY whenever the drive changes (or
  // the applied set is refreshed for a different drive) — switching drives
  // with a carried-over selection from the previous drive was another way
  // students could end up bulk-applied without the coordinator meaning to.
  // Within the SAME drive, selectedIds is left alone (e.g. a resume upload
  // refresh shouldn't wipe out what the coordinator already picked) —
  // toggleStudent/toggleSelectAll already guard against no-resume
  // students sneaking in.
  useEffect(() => {
    setSelectedIds(new Set());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedJob?._id]);

  // Belt-and-suspenders: whenever the eligible list or applied set
  // changes (resume just uploaded, a fresh "applied" fetch comes back),
  // strip out any id sitting in selectedIds that is NOT currently
  // selectable — no resume, or already applied.
  // toggleStudent/toggleSelectAll already prevent these from being ADDED,
  // but this guarantees the checkbox UI can never render a no-resume
  // student as checked even if some other code path (or stale state from
  // a previous render) put its id in there.
  useEffect(() => {
    setSelectedIds((prev) => {
      if (prev.size === 0) return prev;
      const validIds = new Set(
        eligible
          .filter((s) => !appliedIds.has(s._id?.toString?.()) && !!s.resume)
          .map((s) => s._id?.toString?.()),
      );
      let changed = false;
      const next = new Set();
      prev.forEach((id) => {
        if (validIds.has(id)) next.add(id);
        else changed = true;
      });
      return changed ? next : prev;
    });
  }, [eligible, appliedIds]);

  const appliedCount = useMemo(
    () => eligible.filter((s) => appliedIds.has(s._id?.toString?.())).length,
    [eligible, appliedIds],
  );
  const notAppliedCount = eligible.length - appliedCount;

  // Students matching the current search box — filters what's rendered,
  // nothing else (stats/bulk-apply counts stay based on the full eligible
  // list so numbers don't jump around as the coordinator types).
  const displayedEligible = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return eligible;
    return eligible.filter((s) => {
      const name = (s.name || "").toLowerCase();
      const erp = (s.userId?.erpId || "").toLowerCase();
      return name.includes(q) || erp.includes(q);
    });
  }, [eligible, searchQuery]);

  // Only students that are ACTUALLY selectable count toward "select all":
  // not yet applied and has a resume. This is the fix for the bug where
  // "Select All" was ticking no-resume students too — it used to just
  // filter by "not applied" and nothing else.
  const displayedSelectable = useMemo(
    () =>
      displayedEligible.filter(
        (s) => !appliedIds.has(s._id?.toString?.()) && !!s.resume,
      ),
    [displayedEligible, appliedIds],
  );
  const allDisplayedChecked =
    displayedSelectable.length > 0 &&
    displayedSelectable.every((s) => selectedIds.has(s._id?.toString?.()));

  // Guarded here too (not just via the disabled checkbox in the UI) so
  // there's no code path — present or future — that can select a student
  // who has no resume.
  const toggleStudent = (student) => {
    if (!bulkApplyOpen) return;
    const id = student._id?.toString?.();
    if (!id) return;
    if (!student.resume) return;
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (!bulkApplyOpen) return;
    if (allDisplayedChecked) {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        displayedSelectable.forEach((s) => next.delete(s._id?.toString?.()));
        return next;
      });
    } else {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        displayedSelectable.forEach((s) => next.add(s._id?.toString?.()));
        return next;
      });
    }
  };

  const selectedCount = selectedIds.size;

  const handleBulkApply = async () => {
    setBulkApplyLoading(true);
    try {
      // Re-filter right before sending — belt-and-suspenders against
      // sending a no-resume/already-applied id even if one somehow
      // slipped into selectedIds.
      const validIds = new Set(
        eligible
          .filter((s) => !appliedIds.has(s._id?.toString?.()) && !!s.resume)
          .map((s) => s._id?.toString?.()),
      );
      const payloadIds = Array.from(selectedIds).filter((id) =>
        validIds.has(id),
      );

      const result = await api.post(
        `/applications/job/${selectedJob._id}/bulk-apply`,
        { studentIds: payloadIds },
      );
      setBulkApplyResult(result);
      setBulkApplyModal(false);
      // Refresh applied set with whichever students actually got created
      // (skips students with no resume even if they were checked).
      const apps = await api.get(`/applications/job/${selectedJob._id}`);
      const list = Array.isArray(apps) ? apps : [];
      const ids = new Set(
        list.map(
          (a) => a.studentId?._id?.toString?.() || a.studentId?.toString?.(),
        ),
      );
      const viaMap = {};
      list.forEach((a) => {
        const sid = a.studentId?._id?.toString?.() || a.studentId?.toString?.();
        if (sid) viaMap[sid] = a.appliedVia || "self";
      });
      setAppliedIds(ids);
      setAppliedViaMap(viaMap);
      // The students that just got applied should no longer sit in the
      // selection set (they're now disabled/applied rows anyway, but this
      // keeps selectedCount honest if the coordinator reopens the modal).
      setSelectedIds((prev) => {
        const next = new Set(prev);
        ids.forEach((id) => next.delete(id));
        return next;
      });
    } catch (err) {
      setBulkApplyResult({ error: err.message });
    } finally {
      setBulkApplyLoading(false);
    }
  };

  const cols = "34px 2fr 1.2fr 1.4fr 0.8fr 0.8fr 0.8fr 1.4fr";
  const jobName = `${selectedJob?.companyId?.name || "Company"} — ${selectedRoleGroup?.role || "Role"}`;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          icon={<Users size={20} color="#1a3a8f" />}
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
          value={selectedRoleGroup?.eligibleBranches?.length || 0}
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

      {/* Bulk Apply action bar — count reflects the checkbox selection,
          and the button itself is gated to the drive's last date. */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-3 sm:p-4 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: "linear-gradient(135deg, #1a3a8f, #3d1a6e)" }}
          >
            <Users size={16} color="white" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold" style={{ color: "#0F172A" }}>
              {notAppliedCount > 0
                ? `${notAppliedCount} eligible student${notAppliedCount !== 1 ? "s" : ""} haven't applied yet`
                : "All eligible students have applied ✓"}
            </p>
            <p className="text-xs" style={{ color: "#64748B" }}>
              {appliedCount} of {eligible.length} already applied ·{" "}
              {selectedCount} selected for bulk apply
            </p>

            {/* Deadline-window messaging — tells the coordinator exactly
                why the button is locked, and when it will open/closed. */}
            {bulkApplyStatus === "before" && lastDateLabel && (
              <p
                className="text-xs mt-1 flex items-center gap-1"
                style={{ color: "#92400E" }}
              >
                <Info size={11} className="shrink-0" />
                Bulk apply opens on <strong>{lastDateLabel}</strong> — the
                drive's last date to apply.
              </p>
            )}
            {bulkApplyStatus === "after" && lastDateLabel && (
              <p
                className="text-xs mt-1 flex items-center gap-1"
                style={{ color: "#991B1B" }}
              >
                <Lock size={11} className="shrink-0" />
                Bulk apply window closed — deadline ({lastDateLabel}) has
                passed.
              </p>
            )}
            {bulkApplyStatus === "unknown" && (
              <p
                className="text-xs mt-1 flex items-center gap-1"
                style={{ color: "#991B1B" }}
              >
                <Info size={11} className="shrink-0" />
                This drive has no deadline set, so bulk apply is unavailable.
              </p>
            )}
          </div>
        </div>
        <button
          onClick={() => {
            setBulkApplyResult(null);
            setBulkApplyModal(true);
          }}
          disabled={selectedCount === 0 || !bulkApplyOpen}
          title={
            !bulkApplyOpen
              ? bulkApplyStatus === "before"
                ? `Opens on ${lastDateLabel}`
                : bulkApplyStatus === "after"
                  ? "Deadline has passed"
                  : "No deadline set"
              : undefined
          }
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
          style={{
            background:
              selectedCount === 0 || !bulkApplyOpen
                ? "#94A3B8"
                : "linear-gradient(135deg, #1a3a8f, #3d1a6e)",
            boxShadow:
              selectedCount === 0 || !bulkApplyOpen
                ? "none"
                : "0 2px 10px rgba(59,130,246,0.35)",
          }}
        >
          <Users size={14} />
          Bulk Apply {selectedCount > 0 ? `(${selectedCount})` : ""}
        </button>
      </div>

      {/* Success / Error toast — also surfaces resume-missing skips */}
      {bulkApplyResult && (
        <div
          className="rounded-xl border px-4 py-3 flex items-start justify-between gap-3"
          style={{
            backgroundColor: bulkApplyResult.error ? "#FFF1F2" : "#F0FDF4",
            borderColor: bulkApplyResult.error ? "#FECDD3" : "#86EFAC",
          }}
        >
          <div className="flex items-start gap-2 min-w-0">
            {bulkApplyResult.error ? (
              <XCircle size={16} color="#EF4444" className="shrink-0 mt-0.5" />
            ) : (
              <CheckCircle
                size={16}
                color="#22C55E"
                className="shrink-0 mt-0.5"
              />
            )}
            <div className="min-w-0">
              <p
                className="text-sm font-semibold"
                style={{ color: bulkApplyResult.error ? "#991B1B" : "#14532D" }}
              >
                {bulkApplyResult.error || bulkApplyResult.message}
              </p>
              {!bulkApplyResult.error &&
                bulkApplyResult.skippedNoResume > 0 && (
                  <p
                    className="text-xs mt-1 flex items-start gap-1"
                    style={{ color: "#92400E" }}
                  >
                    <FileWarning size={12} className="shrink-0 mt-0.5" />
                    Skipped (no resume):{" "}
                    {bulkApplyResult.skippedNoResumeNames?.join(", ")}
                  </p>
                )}
            </div>
          </div>
          <button
            onClick={() => setBulkApplyResult(null)}
            className="text-[#94A3B8] hover:text-[#0F172A] transition shrink-0"
          >
            <X size={14} />
          </button>
        </div>
      )}

      <BulkApplyModal
        show={bulkApplyModal}
        onClose={() => setBulkApplyModal(false)}
        onConfirm={handleBulkApply}
        loading={bulkApplyLoading}
        selectedCount={selectedCount}
        eligibleCount={eligible.length}
        appliedCount={appliedCount}
        jobName={jobName}
      />

      {/* Name / ERP ID search — filters the table below only */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-3 flex items-center gap-2">
        <Search size={15} color="#94A3B8" className="shrink-0" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by name or ERP ID..."
          className="flex-1 text-sm outline-none bg-transparent"
          style={{ color: "#0F172A" }}
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery("")}
            className="text-[#94A3B8] hover:text-[#0F172A] transition shrink-0"
          >
            <X size={14} />
          </button>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-x-auto">
        <div
          className="border-b border-gray-100"
          style={{
            display: "grid",
            gridTemplateColumns: cols,
            columnGap: "12px",
            padding: "12px 20px",
            backgroundColor: "#F1F5F9",
            minWidth: "780px",
          }}
        >
          <input
            type="checkbox"
            checked={allDisplayedChecked}
            onChange={toggleSelectAll}
            disabled={displayedSelectable.length === 0 || !bulkApplyOpen}
            className="w-3.5 h-3.5 accent-[#1a3a8f]"
            title={
              !bulkApplyOpen
                ? "Selection is locked until the drive's apply deadline day"
                : "Select / deselect all visible (skips no-resume students)"
            }
          />
          {[
            "Name",
            "ERP ID",
            "Course",
            "Sem",
            "CGPA",
            "Backlogs",
            "Status",
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

        {appliedLoading ? (
          <div className="flex flex-col items-center py-14 gap-2">
            <p className="text-sm" style={{ color: "#64748B" }}>
              Loading applied status...
            </p>
          </div>
        ) : eligible.length === 0 ? (
          <div className="flex flex-col items-center py-14 gap-2">
            <Users size={36} color="#E2E8F0" />
            <p className="text-sm" style={{ color: "#64748B" }}>
              No eligible students found.
            </p>
          </div>
        ) : displayedEligible.length === 0 ? (
          <div className="flex flex-col items-center py-14 gap-2">
            <Search size={36} color="#E2E8F0" />
            <p className="text-sm" style={{ color: "#64748B" }}>
              No students match "{searchQuery}".
            </p>
          </div>
        ) : (
          displayedEligible.map((student, idx) => {
            const sid = student._id?.toString?.();
            const hasApplied = appliedIds.has(sid);
            const appliedVia = appliedViaMap[sid]; // "self" | "bulk-coordinator"
            const isBulkApplied =
              hasApplied && appliedVia === "bulk-coordinator";
            const noResume = !student.resume;
            // Already-applied rows show as ticked (still disabled) so the
            // checkbox itself communicates "already in", instead of
            // looking unticked/empty next to an easy-to-miss badge.
            // IMPORTANT: no-resume rows are FORCED unchecked here,
            // regardless of what selectedIds contains — this is the
            // actual source of truth for the checkbox, not just a guard
            // on how selectedIds gets populated. Even if a stray id ever
            // ends up in selectedIds, the box itself can never render as
            // ticked for a student who isn't selectable.
            const checked = hasApplied
              ? true
              : !noResume && selectedIds.has(sid);
            return (
              <div
                key={student._id}
                style={{
                  display: "grid",
                  gridTemplateColumns: cols,
                  columnGap: "12px",
                  alignItems: "center",
                  padding: "14px 20px",
                  borderBottom:
                    idx !== displayedEligible.length - 1
                      ? "1px solid #F1F5F9"
                      : "none",
                  minWidth: "780px",
                  opacity: hasApplied ? 0.6 : 1,
                }}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggleStudent(student)}
                  disabled={hasApplied || noResume || !bulkApplyOpen}
                  className="w-3.5 h-3.5 accent-[#1a3a8f]"
                  title={
                    !hasApplied && !noResume && !bulkApplyOpen
                      ? "Selection is locked until the drive's apply deadline day"
                      : undefined
                  }
                />
                <NameCell student={student} />
                <span
                  className="text-xs font-mono"
                  style={{ color: "#64748B" }}
                >
                  {student.userId?.erpId || "—"}
                </span>
                <span
                  className="border text-xs font-semibold px-2.5 py-0.5 rounded-full w-fit"
                  style={{
                    color: "#1a3a8f",
                    backgroundColor: "#EFF3FA",
                    borderColor: "#B8C6E3",
                  }}
                >
                  {student.course || "—"}
                </span>
                <span
                  className="text-xs font-semibold"
                  style={{ color: "#0F172A" }}
                >
                  {getSemester(student.batch, student.course) ?? "—"}
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
                    color:
                      (student.backlogs ?? 0) === 0 ? "#64748B" : "#EF4444",
                    fontWeight: (student.backlogs ?? 0) > 0 ? 700 : 400,
                  }}
                >
                  {(student.backlogs ?? 0) === 0 ? "—" : student.backlogs}
                </span>

                {/* Status column: applied badge / no-resume warning.
                    Bulk-applied students get a distinct purple badge so
                    the coordinator can tell them apart from students who
                    applied themselves. */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  {isBulkApplied && (
                    <span
                      className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-violet-50 text-violet-600 border border-violet-200"
                      title="This student was applied by the coordinator via Bulk Apply"
                    >
                      Applied by you
                    </span>
                  )}
                  {hasApplied && !isBulkApplied && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#EFF3FA] text-[#1a3a8f] border border-[#B8C6E3]">
                      Applied
                    </span>
                  )}
                  {!hasApplied && noResume && (
                    <span
                      className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200"
                      title="Missing resume — excluded from bulk apply"
                    >
                      <FileWarning size={10} /> No resume
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

// Confirmation modal for permanently removing an application — e.g. a
// student applied to the wrong drive by mistake. This is a hard delete
// (not a status change), so it gets its own explicit "are you sure" step
// rather than firing straight off a click.
function RemoveApplicationModal({ application, onClose, onConfirm, loading }) {
  if (!application) return null;
  const student = application.studentId;
  const jobName = `${application.jobName || "this drive"}`;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{
        backgroundColor: "rgba(15,23,42,0.55)",
        backdropFilter: "blur(6px)",
      }}
      onClick={(e) => e.target === e.currentTarget && !loading && onClose()}
    >
      <div className="bg-white rounded-3xl shadow-2xl border border-[#E2E8F0] w-full max-w-md overflow-hidden">
        <div
          className="px-6 py-5 flex items-center gap-3"
          style={{ background: "linear-gradient(135deg, #DC2626, #EF4444)" }}
        >
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
            <Trash2 size={20} color="white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Remove Application</h3>
            <p className="text-xs text-white/70">This can't be undone</p>
          </div>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div
            className="rounded-xl border p-4 space-y-2"
            style={{ backgroundColor: "#FFF1F2", borderColor: "#FECDD3" }}
          >
            <div className="flex items-center gap-2">
              <AlertTriangle size={16} color="#DC2626" />
              <span className="text-sm font-bold" style={{ color: "#991B1B" }}>
                Are you sure?
              </span>
            </div>
            <p className="text-xs leading-relaxed" style={{ color: "#7F1D1D" }}>
              This will permanently delete{" "}
              <strong>{student?.name || "this student"}'s</strong> application
              for <strong>{jobName}</strong>. If this application had "Selected"
              status, the student's placement status will be recalculated
              automatically. The student will be notified that it was removed.
            </p>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-[#E2E8F0] flex items-center gap-3 justify-end bg-[#F8FAFC]">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold border border-[#E2E8F0] bg-white text-[#64748B] hover:text-[#0F172A] transition-all disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-50 flex items-center gap-2"
            style={{
              background: loading
                ? "#94A3B8"
                : "linear-gradient(135deg, #DC2626, #EF4444)",
            }}
          >
            {loading ? (
              <>
                <LoaderCircle size={14} className="animate-spin" />
                Removing...
              </>
            ) : (
              <>
                <Trash2 size={14} />
                Yes, Remove
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

function ImportPreviewModal({ data, onConfirm, onClose }) {
  const [resolvedPossible, setResolvedPossible] = useState({});

  const handleConfirm = () => {
    const confidentIds = data.confident.map((c) => c.app._id);
    const resolvedIds = Object.values(resolvedPossible);
    onConfirm([...confidentIds, ...resolvedIds]);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{
        backgroundColor: "rgba(15,23,42,0.55)",
        backdropFilter: "blur(6px)",
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="bg-white rounded-3xl shadow-2xl border border-[#E2E8F0] w-full max-w-lg overflow-hidden flex flex-col"
        style={{ maxHeight: "85vh" }}
      >
        <div className="px-6 py-5 border-b border-[#F1F5F9]">
          <h3 className="text-sm font-bold text-[#1E293B]">Import Preview</h3>
          <div className="flex gap-4 mt-2">
            <span className="text-xs font-semibold text-green-600">
              ✓ {data.confident.length} confident
            </span>
            <span className="text-xs font-semibold text-amber-600">
              ⚠ {data.possible.length} review needed
            </span>
            <span className="text-xs font-semibold text-red-500">
              ✕ {data.notFound.length} not found
            </span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {data.confident.length > 0 && (
            <div>
              <p className="text-xs font-bold text-green-700 mb-2">
                Confident Matches — will be auto-selected
              </p>
              <div className="space-y-1.5">
                {data.confident.map(({ app }, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl bg-green-50 border border-green-100"
                  >
                    <span className="text-[10px] font-bold text-green-600">
                      ✓
                    </span>
                    <span className="text-xs font-semibold text-[#1E293B]">
                      {app.studentId?.name}
                    </span>
                    <span className="text-[10px] text-[#64748B]">
                      {app.studentId?.userId?.erpId}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {data.possible.length > 0 && (
            <div>
              <p className="text-xs font-bold text-amber-700 mb-2">
                Review Needed — select the correct student
              </p>
              <div className="space-y-3">
                {data.possible.map(({ matches, rowData }, i) => (
                  <div
                    key={i}
                    className="p-3 rounded-xl bg-amber-50 border border-amber-100"
                  >
                    <p className="text-[10px] text-[#64748B] mb-2">
                      File says: <strong>{rowData.nameVal}</strong>
                      {rowData.erpVal && ` (${rowData.erpVal})`}
                    </p>
                    <div className="space-y-1">
                      {matches.map((app) => (
                        <label
                          key={app._id}
                          className="flex items-center gap-2 cursor-pointer"
                        >
                          <input
                            type="radio"
                            name={`possible-${i}`}
                            value={app._id}
                            checked={resolvedPossible[i] === app._id}
                            onChange={() =>
                              setResolvedPossible((prev) => ({
                                ...prev,
                                [i]: app._id,
                              }))
                            }
                            className="accent-[#1a3a8f]"
                          />
                          <span className="text-xs font-semibold text-[#1E293B]">
                            {app.studentId?.name}
                          </span>
                          <span className="text-[10px] text-[#64748B]">
                            {app.studentId?.course}
                          </span>
                          <span className="text-[10px] font-mono text-[#94A3B8]">
                            {app.studentId?.userId?.erpId}
                          </span>
                        </label>
                      ))}
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name={`possible-${i}`}
                          value=""
                          checked={
                            resolvedPossible[i] === "" ||
                            resolvedPossible[i] === undefined
                          }
                          onChange={() =>
                            setResolvedPossible((prev) => ({
                              ...prev,
                              [i]: "",
                            }))
                          }
                          className="accent-[#1a3a8f]"
                        />
                        <span className="text-xs text-[#94A3B8]">
                          Skip this entry
                        </span>
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {data.notFound.length > 0 && (
            <div>
              <p className="text-xs font-bold text-red-600 mb-2">
                Not Found — will be skipped
              </p>
              <div className="space-y-1.5">
                {data.notFound.map(({ rowData }, i) => (
                  <div
                    key={i}
                    className="px-3 py-2 rounded-xl bg-red-50 border border-red-100"
                  >
                    <span className="text-xs text-[#64748B]">
                      {rowData.nameVal || rowData.erpVal || "Unknown entry"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-[#F1F5F9] flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl border border-[#E2E8F0] text-sm font-medium text-[#64748B] hover:bg-[#F8FAFC]"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            className="px-5 py-2.5 rounded-xl text-sm font-bold text-white"
            style={{ background: "linear-gradient(135deg, #1a3a8f, #3d1a6e)" }}
          >
            Select{" "}
            {data.confident.length +
              Object.values(resolvedPossible).filter(Boolean).length}{" "}
            Students
          </button>
        </div>
      </div>
    </div>
  );
}

function AppliedTab({
  selectedJobId,
  selectedJob,
  readOnly,
  jobName,
  selectedRoleGroupId,
}) {
  const selectedRoleGroup = selectedJob?.roleGroups?.find(
    (rg) => rg._id?.toString() === selectedRoleGroupId,
  );
  const rounds = selectedRoleGroup?.selectionProcess || [];

  const [applications, setApplications] = useState([]);
  const [activeRound, setActiveRound] = useState(0);
  const [filterStatus, setFilterStatus] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [exporting, setExporting] = useState(false);
  const [removeTarget, setRemoveTarget] = useState(null);
  const [removing, setRemoving] = useState(false);

  // Drag select state
  const [selectedAppIds, setSelectedAppIds] = useState(new Set());
  const isDraggingRef = useRef(false);
  const dragStartIdRef = useRef(null);
  const hasDraggedRef = useRef(false);
  const [bulkActionLoading, setBulkActionLoading] = useState(false);
  const [bulkConfirm, setBulkConfirm] = useState(null); // { status, count }
  const [singleConfirm, setSingleConfirm] = useState(null);
  const touchStartIdRef = useRef(null);
  const touchDragActiveRef = useRef(false);
  const longPressTimerRef = useRef(null);
  const touchScrolledRef = useRef(false);

  // Excel import state
  const [importLoading, setImportLoading] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [showImportPreview, setShowImportPreview] = useState(false);
  const [importPreviewData, setImportPreviewData] = useState(null);
  const fileInputRef = useRef(null);

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

  // Round change hone pe selection clear karo
  useEffect(() => {
    setSelectedAppIds(new Set());
    setFilterStatus("All");
    setSearchQuery("");
    hasDraggedRef.current = false;
    isDraggingRef.current = false;
    dragStartIdRef.current = null;
  }, [activeRound]);

  // Is round mein har application ka status
  const getRoundStatus = (app, roundIndex) => {
    const rs = app.roundStatuses?.find((r) => r.roundIndex === roundIndex);
    return rs?.status || "Pending";
  };

  const roleFiltered = useMemo(() => {
    const roleGroups = selectedJob?.roleGroups || [];
    // Single-role drives (jaise Google — sirf ek role) me filter ki zaroorat nahi.
    // Multi-role drives me bhi, jin applications ka roleGroupId set nahi hai
    // (purana data, ya student ne role choose kiye bina apply kiya) unhe
    // hide mat karo — warna wo applied hote hue bhi list se gayab dikhenge.
    if (!selectedRoleGroupId || roleGroups.length <= 1) return applications;
    return applications.filter((a) => {
      const rgId = a.roleGroupId?.toString();
      return !rgId || rgId === selectedRoleGroupId;
    });
  }, [applications, selectedRoleGroupId, selectedJob]);

  const roundApplications = useMemo(() => {
    if (rounds.length === 0) return roleFiltered;
    if (activeRound === 0) return roleFiltered;
    return roleFiltered.filter((app) => {
      for (let i = 0; i < activeRound; i++) {
        const rs = app.roundStatuses?.find((r) => r.roundIndex === i);
        if (!rs || rs.status !== "Cleared") return false;
      }
      return true;
    });
  }, [roleFiltered, activeRound, rounds]);

  const filtered = useMemo(() => {
    let result = roundApplications;

    if (filterStatus !== "All") {
      result = result.filter((app) => {
        if (rounds.length === 0) return app.status === filterStatus;
        const rs = getRoundStatus(app, activeRound);
        const statusMap = {
          Shortlisted: "Cleared",
          Selected: "Cleared",
          Rejected: "Eliminated",
          Applied: "Pending",
        };
        return rs === (statusMap[filterStatus] || filterStatus);
      });
    }

    const q = searchQuery.trim().toLowerCase();
    if (q) {
      result = result.filter((app) => {
        const name = (app.studentId?.name || "").toLowerCase();
        const erp = (app.studentId?.userId?.erpId || "").toLowerCase();
        return name.includes(q) || erp.includes(q);
      });
    }

    return result;
  }, [roundApplications, filterStatus, searchQuery, activeRound, rounds]);

  // Round stats
  const roundStats = useMemo(() => {
    const apps = roundApplications;
    return {
      total: apps.length,
      pending: apps.filter((a) => getRoundStatus(a, activeRound) === "Pending")
        .length,
      cleared: apps.filter((a) => getRoundStatus(a, activeRound) === "Cleared")
        .length,
      eliminated: apps.filter(
        (a) => getRoundStatus(a, activeRound) === "Eliminated",
      ).length,
    };
  }, [roundApplications, activeRound]);
  // Role group filter
  const counts = useMemo(
    () => ({
      total: roleFiltered.length,
      applied: roleFiltered.filter((a) => a.status === "Applied").length,
      shortlisted: roleFiltered.filter((a) => a.status === "Shortlisted")
        .length,
      selected: roleFiltered.filter((a) => a.status === "Selected").length,
      rejected: roleFiltered.filter((a) => a.status === "Rejected").length,
    }),
    [roleFiltered],
  );

  // Single round status update
  const updateRoundStatus = async (appId, roundIndex, roundName, status) => {
    try {
      const updated = await api.put(`/applications/${appId}/round-status`, {
        roundIndex,
        roundName,
        status,
      });
      setApplications((prev) =>
        prev.map((a) =>
          a._id === appId
            ? {
                ...a,
                roundStatuses: updated.roundStatuses,
                status: updated.status,
              }
            : a,
        ),
      );
    } catch (err) {
      alert("Failed to update round status");
    }
  };

  // Overall status update — rounds nahi hain tab use hoga
  const updateStatus = async (appId, newStatus) => {
    const updated = await api.put(`/applications/${appId}/status`, {
      status: newStatus,
    });
    setApplications((prev) =>
      prev.map((a) => (a._id === appId ? { ...a, status: updated.status } : a)),
    );
  };

  // Bulk round status update
  const handleBulkAction = async (status) => {
    if (selectedAppIds.size === 0) return;
    setBulkActionLoading(true);
    try {
      const roundName = rounds[activeRound] || `Round ${activeRound + 1}`;
      await api.put(`/applications/job/${selectedJobId}/bulk-round-status`, {
        applicationIds: Array.from(selectedAppIds),
        roundIndex: activeRound,
        roundName,
        status,
      });
      // Refresh applications
      const data = await api.get(`/applications/job/${selectedJobId}`);
      setApplications(Array.isArray(data) ? data : []);
      setSelectedAppIds(new Set());
      setBulkConfirm(null);
    } catch (err) {
      alert("Bulk update failed");
    } finally {
      setBulkActionLoading(false);
    }
  };

  // Drag select handlers
  const handleMouseDown = (appId, e) => {
    if (e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();
    dragStartIdRef.current = appId;
    hasDraggedRef.current = false;
    isDraggingRef.current = true;
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
    dragStartIdRef.current = null;
  };

  const touchStartPosRef = useRef({ x: 0, y: 0 });

  const handleTouchStart = (appId, e) => {
    touchStartIdRef.current = appId;
    touchDragActiveRef.current = false;
    touchScrolledRef.current = false;
    hasDraggedRef.current = false;
    touchStartPosRef.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
    };
    longPressTimerRef.current = setTimeout(() => {
      touchDragActiveRef.current = true;
      hasDraggedRef.current = true;
      setSelectedAppIds((prev) => {
        const next = new Set(prev);
        next.add(appId);
        return next;
      });
      if (navigator.vibrate) navigator.vibrate(40);
    }, 300);
  };

  const handleTouchMove = (e) => {
    if (!touchDragActiveRef.current) {
      const dx = Math.abs(e.touches[0].clientX - touchStartPosRef.current.x);
      const dy = Math.abs(e.touches[0].clientY - touchStartPosRef.current.y);
      if (dx > 5 || dy > 5) {
        clearTimeout(longPressTimerRef.current);
        touchScrolledRef.current = true; // scroll hua — modal mat kholo
      }
      return;
    }

    e.preventDefault();
    const touch = e.touches[0];
    const el = document.elementFromPoint(touch.clientX, touch.clientY);
    const row = el?.closest("[data-appid]");
    if (!row) return;
    const currentAppId = row.dataset.appid;
    if (!currentAppId) return;

    const startIdx = filtered.findIndex(
      (a) => a._id === touchStartIdRef.current,
    );
    const currentIdx = filtered.findIndex((a) => a._id === currentAppId);
    if (startIdx === -1 || currentIdx === -1) return;

    const from = Math.min(startIdx, currentIdx);
    const to = Math.max(startIdx, currentIdx);

    setSelectedAppIds((prev) => {
      const next = new Set(prev);
      for (let i = from; i <= to; i++) {
        next.add(filtered[i]._id);
      }
      return next;
    });
  };

  const handleTouchEnd = (appId, e) => {
    clearTimeout(longPressTimerRef.current);
    if (!touchDragActiveRef.current && !touchScrolledRef.current) {
      setSelectedStudent(
        filtered.find((a) => a._id === appId)?.studentId || null,
      );
    }
    touchDragActiveRef.current = false;
    touchStartIdRef.current = null;
    touchScrolledRef.current = false;
    hasDraggedRef.current = false;
  };

  useEffect(() => {
    const handleGlobalMouseMove = (e) => {
      if (!isDraggingRef.current || !dragStartIdRef.current) return;
      if (e.buttons !== 1) {
        isDraggingRef.current = false;
        dragStartIdRef.current = null;
        return;
      }
      const el = document.elementFromPoint(e.clientX, e.clientY);
      const row = el?.closest("[data-appid]");
      if (!row) return;
      const appId = row.dataset.appid;
      if (appId === dragStartIdRef.current) return;
      hasDraggedRef.current = true;
      setSelectedAppIds((prev) => {
        const next = new Set(prev);
        next.add(dragStartIdRef.current);
        next.add(appId);
        return next;
      });
    };

    window.addEventListener("mousemove", handleGlobalMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleGlobalMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, []);

  // Excel import — smart matching
  const handleFileImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    e.target.value = "";

    setImportLoading(true);
    try {
      const XLSX = await import("xlsx");
      const buffer = await file.arrayBuffer();
      const wb = XLSX.read(buffer, { type: "array" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(ws, { header: 1 });

      // Header row dhundho
      const headerRow =
        rows[0]?.map((h) =>
          String(h || "")
            .toLowerCase()
            .trim(),
        ) || [];

      const erpCol = headerRow.findIndex(
        (h) => h.includes("erp") || h.includes("enrollment"),
      );
      const nameCol = headerRow.findIndex((h) => h.includes("name"));
      const branchCol = headerRow.findIndex(
        (h) =>
          h.includes("branch") || h.includes("course") || h.includes("dept"),
      );

      const dataRows = rows.slice(1).filter((r) => r.some((c) => c));

      const confident = [];
      const possible = [];
      const notFound = [];

      dataRows.forEach((row) => {
        const erpVal = erpCol >= 0 ? String(row[erpCol] || "").trim() : "";
        const nameVal =
          nameCol >= 0
            ? String(row[nameCol] || "")
                .trim()
                .toLowerCase()
            : "";
        const branchVal =
          branchCol >= 0
            ? String(row[branchCol] || "")
                .trim()
                .toLowerCase()
            : "";

        // ERP ID match — 100% confident
        if (erpVal) {
          const matched = applications.find(
            (app) =>
              (app.studentId?.userId?.erpId || "").toLowerCase() ===
              erpVal.toLowerCase(),
          );
          if (matched) {
            confident.push({
              app: matched,
              rowData: { erpVal, nameVal, branchVal },
            });
            return;
          }
        }

        // Naam + branch match — possible
        if (nameVal) {
          const nameMatches = applications.filter(
            (app) =>
              (app.studentId?.name || "").toLowerCase().includes(nameVal) ||
              nameVal.includes((app.studentId?.name || "").toLowerCase()),
          );

          if (nameMatches.length === 1) {
            if (branchVal) {
              const branchMatch = (nameMatches[0].studentId?.course || "")
                .toLowerCase()
                .includes(branchVal);
              if (branchMatch) {
                confident.push({
                  app: nameMatches[0],
                  rowData: { erpVal, nameVal, branchVal },
                });
              } else {
                possible.push({
                  matches: nameMatches,
                  rowData: { erpVal, nameVal, branchVal },
                });
              }
            } else {
              possible.push({
                matches: nameMatches,
                rowData: { erpVal, nameVal, branchVal },
              });
            }
          } else if (nameMatches.length > 1) {
            possible.push({
              matches: nameMatches,
              rowData: { erpVal, nameVal, branchVal },
            });
          } else {
            notFound.push({ rowData: { erpVal, nameVal, branchVal } });
          }
        } else {
          notFound.push({ rowData: { erpVal, nameVal, branchVal } });
        }
      });

      setImportPreviewData({ confident, possible, notFound });
      setShowImportPreview(true);
    } catch (err) {
      alert("Failed to read file: " + err.message);
    } finally {
      setImportLoading(false);
    }
  };

  const confirmImport = (finalAppIds) => {
    setSelectedAppIds(new Set(finalAppIds));
    setShowImportPreview(false);
    setImportPreviewData(null);
  };

  const handleRemoveApplication = async () => {
    if (!removeTarget) return;
    setRemoving(true);
    try {
      await api.delete(`/applications/${removeTarget._id}`);
      setApplications((prev) => prev.filter((a) => a._id !== removeTarget._id));
      setRemoveTarget(null);
    } catch (err) {
      alert(`Could not remove application: ${err.message}`);
    } finally {
      setRemoving(false);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/applications/job/${selectedJobId}/export`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      if (!response.ok) throw new Error("Export failed");
      const disposition = response.headers.get("Content-Disposition");
      let filename = "Applications.xlsx";
      if (disposition) {
        const match = disposition.match(/filename=(.+)/);
        if (match) filename = match[1];
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert("Export failed");
    } finally {
      setExporting(false);
    }
  };

  const cols = readOnly
    ? "26px 2fr 1.2fr 1fr 0.8fr 1fr"
    : "26px 2fr 1.2fr 1fr 0.8fr 1.6fr";

  if (loading)
    return (
      <div className="text-center py-10 text-text-muted">
        Loading applications...
      </div>
    );

  return (
    <div className="space-y-4" onMouseUp={handleMouseUp}>
      {readOnly && (
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 bg-slate-50 border border-slate-100 rounded-xl px-4 py-2.5">
          <Lock size={13} />
          Results for this drive have been finalized — status changes are
          disabled.
        </div>
      )}

      {/* Overall stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-2.5 sm:gap-3">
        <StatCard
          icon={<Users size={20} color="#1a3a8f" />}
          label="Total Applied"
          value={counts.total}
          bg="#EFF6FF"
          borderColor="#BFDBFE"
        />
        <StatCard
          icon={<ClipboardList size={20} color="#1a3a8f" />}
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

      {/* Round Tabs — sirf tab dikhao jab selectionProcess defined ho */}
      {rounds.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-3">
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#64748B] mb-2.5 px-1">
            Selection Rounds
          </p>
          <div className="flex gap-2 flex-wrap">
            {rounds.map((roundName, idx) => {
              const isActive = activeRound === idx;
              // Is round mein kitne cleared/eliminated
              const appsInRound =
                idx === 0
                  ? applications
                  : applications.filter((app) => {
                      for (let i = 0; i < idx; i++) {
                        const rs = app.roundStatuses?.find(
                          (r) => r.roundIndex === i,
                        );
                        if (!rs || rs.status !== "Cleared") return false;
                      }
                      return true;
                    });
              const clearedCount = appsInRound.filter(
                (a) =>
                  a.roundStatuses?.find((r) => r.roundIndex === idx)?.status ===
                  "Cleared",
              ).length;
              const eliminatedCount = appsInRound.filter(
                (a) =>
                  a.roundStatuses?.find((r) => r.roundIndex === idx)?.status ===
                  "Eliminated",
              ).length;

              return (
                <button
                  key={idx}
                  onClick={() => setActiveRound(idx)}
                  className="flex flex-col items-start px-4 py-2.5 rounded-xl border text-left transition-all"
                  style={{
                    backgroundColor: isActive ? "#1a3a8f" : "#F8FAFC",
                    borderColor: isActive ? "#1a3a8f" : "#E2E8F0",
                    color: isActive ? "white" : "#64748B",
                  }}
                >
                  <span className="text-[10px] font-bold uppercase tracking-wider opacity-70">
                    Round {idx + 1}
                  </span>
                  <span className="text-xs font-semibold mt-0.5">
                    {roundName}
                  </span>
                  <div className="flex gap-2 mt-1.5">
                    <span
                      className="text-[10px]"
                      style={{
                        color: isActive ? "rgba(255,255,255,0.7)" : "#22C55E",
                      }}
                    >
                      ✓ {clearedCount}
                    </span>
                    <span
                      className="text-[10px]"
                      style={{
                        color: isActive ? "rgba(255,255,255,0.7)" : "#EF4444",
                      }}
                    >
                      ✕ {eliminatedCount}
                    </span>
                    <span
                      className="text-[10px]"
                      style={{
                        color: isActive ? "rgba(255,255,255,0.7)" : "#64748B",
                      }}
                    >
                      · {appsInRound.length} appearing
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Current round stats */}
          <div className="flex gap-3 mt-3 flex-wrap">
            {[
              { label: "Appearing", value: roundStats.total, color: "#1a3a8f" },
              { label: "Pending", value: roundStats.pending, color: "#64748B" },
              { label: "Cleared", value: roundStats.cleared, color: "#22C55E" },
              {
                label: "Eliminated",
                value: roundStats.eliminated,
                color: "#EF4444",
              },
            ].map(({ label, value, color }) => (
              <div key={label} className="flex items-center gap-1.5">
                <span className="text-lg font-bold" style={{ color }}>
                  {value}
                </span>
                <span className="text-xs text-[#64748B]">{label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bulk actions bar — drag select ke baad dikhega */}
      {!readOnly && selectedAppIds.size > 0 && (
        <div
          className="flex items-center justify-between gap-3 px-4 py-3 rounded-2xl border flex-wrap"
          style={{ backgroundColor: "#EFF3FA", borderColor: "#B8C6E3" }}
        >
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold" style={{ color: "#1a3a8f" }}>
              {selectedAppIds.size} selected
            </span>
            <button
              onClick={() => setSelectedAppIds(new Set())}
              className="text-xs text-[#64748B] hover:text-[#1a3a8f] transition-colors"
            >
              Clear
            </button>
          </div>
          <div className="flex gap-2 flex-wrap">
            {rounds.length > 0 ? (
              <>
                <button
                  onClick={() =>
                    setBulkConfirm({
                      status: "Cleared",
                      count: selectedAppIds.size,
                    })
                  }
                  disabled={bulkActionLoading}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white transition-all disabled:opacity-50"
                  style={{ backgroundColor: "#22C55E" }}
                >
                  ✓ Advance to Round {activeRound + 2}
                </button>
                <button
                  onClick={() =>
                    setBulkConfirm({
                      status: "Eliminated",
                      count: selectedAppIds.size,
                    })
                  }
                  disabled={bulkActionLoading}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white transition-all disabled:opacity-50"
                  style={{ backgroundColor: "#EF4444" }}
                >
                  ✕ Eliminate
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() =>
                    setBulkConfirm({
                      status: "Shortlisted",
                      count: selectedAppIds.size,
                    })
                  }
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 text-white"
                >
                  Shortlist All
                </button>
                <button
                  onClick={() =>
                    setBulkConfirm({
                      status: "Selected",
                      count: selectedAppIds.size,
                    })
                  }
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-green-500 text-white"
                >
                  Select All
                </button>
                <button
                  onClick={() =>
                    setBulkConfirm({
                      status: "Rejected",
                      count: selectedAppIds.size,
                    })
                  }
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-red-500 text-white"
                >
                  Reject All
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Bulk confirm modal */}
      {bulkConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{
            backgroundColor: "rgba(15,23,42,0.55)",
            backdropFilter: "blur(6px)",
          }}
          onClick={(e) => e.target === e.currentTarget && setBulkConfirm(null)}
        >
          <div className="bg-white rounded-3xl shadow-2xl border border-[#E2E8F0] w-full max-w-sm p-6 flex flex-col gap-4">
            <div className="flex flex-col items-center gap-3 text-center">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center text-white text-xl font-bold"
                style={{
                  backgroundColor:
                    bulkConfirm.status === "Cleared" ||
                    bulkConfirm.status === "Shortlisted" ||
                    bulkConfirm.status === "Selected"
                      ? "#22C55E"
                      : "#EF4444",
                }}
              >
                {bulkConfirm.status === "Cleared" ||
                bulkConfirm.status === "Shortlisted" ||
                bulkConfirm.status === "Selected"
                  ? "✓"
                  : "✕"}
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#1E293B]">
                  Confirm Bulk Action
                </h3>
                <p className="text-xs text-[#64748B] mt-1">
                  {bulkConfirm.status === "Cleared"
                    ? `Advance ${bulkConfirm.count} students to Round ${activeRound + 2}?`
                    : bulkConfirm.status === "Eliminated"
                      ? `Eliminate ${bulkConfirm.count} students from this drive?`
                      : `Mark ${bulkConfirm.count} students as ${bulkConfirm.status}?`}
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setBulkConfirm(null)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-[#E2E8F0] text-sm font-medium text-[#64748B] hover:bg-[#F8FAFC]"
              >
                Cancel
              </button>
              <button
                onClick={() => handleBulkAction(bulkConfirm.status)}
                disabled={bulkActionLoading}
                className="flex-1 px-4 py-2.5 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-50"
                style={{
                  backgroundColor:
                    bulkConfirm.status === "Cleared" ||
                    bulkConfirm.status === "Shortlisted" ||
                    bulkConfirm.status === "Selected"
                      ? "#22C55E"
                      : "#EF4444",
                }}
              >
                {bulkActionLoading ? "Processing..." : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}

      {singleConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{
            backgroundColor: "rgba(15,23,42,0.55)",
            backdropFilter: "blur(6px)",
          }}
          onClick={(e) =>
            e.target === e.currentTarget && setSingleConfirm(null)
          }
        >
          <div className="bg-white rounded-3xl shadow-2xl border border-[#E2E8F0] w-full max-w-sm p-6 flex flex-col gap-4">
            <div className="flex flex-col items-center gap-3 text-center">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center text-white text-xl font-bold"
                style={{
                  backgroundColor:
                    singleConfirm.status === "Cleared" ? "#22C55E" : "#EF4444",
                }}
              >
                {singleConfirm.status === "Cleared" ? "✓" : "✕"}
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#1E293B]">
                  Confirm Action
                </h3>
                <p className="text-xs text-[#64748B] mt-1">
                  Mark <strong>{singleConfirm.studentName}</strong> as{" "}
                  <strong
                    style={{
                      color:
                        singleConfirm.status === "Cleared"
                          ? "#22C55E"
                          : "#EF4444",
                    }}
                  >
                    {singleConfirm.status === "Cleared"
                      ? "Cleared"
                      : "Eliminated"}
                  </strong>{" "}
                  in Round {singleConfirm.roundIndex + 1} —{" "}
                  {singleConfirm.roundName}?
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setSingleConfirm(null)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-[#E2E8F0] text-sm font-medium text-[#64748B] hover:bg-[#F8FAFC]"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  updateRoundStatus(
                    singleConfirm.appId,
                    singleConfirm.roundIndex,
                    singleConfirm.roundName,
                    singleConfirm.status,
                  );
                  setSingleConfirm(null);
                }}
                className="flex-1 px-4 py-2.5 rounded-xl text-sm font-bold text-white"
                style={{
                  backgroundColor:
                    singleConfirm.status === "Cleared" ? "#22C55E" : "#EF4444",
                }}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filter + Export + Import bar */}
      <div className="bg-white rounded-2xl border border-gray-100 p-3 sm:p-4 shadow-sm flex items-center gap-2 flex-wrap">
        <div
          className="flex items-center gap-1.5 text-sm font-medium mr-1"
          style={{ color: "#64748B" }}
        >
          <Filter size={14} /> Filter
        </div>
        {["All", "Pending", "Cleared", "Eliminated"].map((opt) => {
          if (rounds.length === 0) return null;
          const active = filterStatus === opt;
          return (
            <button
              key={opt}
              onClick={() => setFilterStatus(opt)}
              className="text-xs font-semibold px-3 py-1.5 rounded-full border transition-all"
              style={{
                color: active ? "#1a3a8f" : "#64748B",
                backgroundColor: active ? "#EFF6FF" : "#F8FAFC",
                borderColor: active ? "#BFDBFE" : "#E2E8F0",
              }}
            >
              {opt}
            </button>
          );
        })}
        {rounds.length === 0 &&
          ["All", ...STATUS_OPTIONS].map((opt) => {
            const active = filterStatus === opt;
            const s = opt !== "All" ? STATUS_STYLE[opt] : null;
            return (
              <button
                key={opt}
                onClick={() => setFilterStatus(opt)}
                className="text-xs font-semibold px-3 py-1.5 rounded-full border transition-all"
                style={{
                  color: active ? (s ? s.color : "#1a3a8f") : "#64748B",
                  backgroundColor: active ? (s ? s.bg : "#EFF6FF") : "#F8FAFC",
                  borderColor: active ? (s ? s.border : "#BFDBFE") : "#E2E8F0",
                }}
              >
                {opt} (
                {opt === "All"
                  ? counts.total
                  : (counts[opt.toLowerCase()] ?? 0)}
                )
              </button>
            );
          })}

        <span
          className="w-full sm:w-auto sm:ml-auto text-sm"
          style={{ color: "#64748B" }}
        >
          Showing{" "}
          <strong style={{ color: "#0F172A" }}>{filtered.length}</strong> of{" "}
          {roundStats.total}
        </span>

        {/* Excel Import button */}
        {!readOnly && (
          <>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileImport}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={importLoading}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold border transition-all"
              style={{
                backgroundColor: "#F8FAFC",
                borderColor: "#E2E8F0",
                color: "#1a3a8f",
              }}
            >
              {importLoading ? (
                <>
                  <LoaderCircle size={13} className="animate-spin" /> Reading...
                </>
              ) : (
                <>
                  <Download size={13} style={{ transform: "rotate(180deg)" }} />{" "}
                  Import Shortlist
                </>
              )}
            </button>
          </>
        )}

        <button
          onClick={handleExport}
          disabled={exporting}
          className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all border"
          style={{
            background: exporting
              ? "#94A3B8"
              : "linear-gradient(135deg, #1a3a8f, #3d1a6e)",
            color: "white",
            borderColor: "transparent",
          }}
        >
          {exporting ? (
            <>
              <LoaderCircle size={13} className="animate-spin" /> Preparing...
            </>
          ) : (
            <>
              <Download size={13} /> Download Excel
            </>
          )}
        </button>
      </div>

      {/* Search */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-3 flex items-center gap-2">
        <Search size={15} color="#94A3B8" className="shrink-0" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search name or ERP ID..."
          className="flex-1 text-sm outline-none bg-transparent"
          style={{ color: "#0F172A" }}
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery("")}
            className="text-[#94A3B8] hover:text-[#0F172A] transition shrink-0"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-x-auto">
        <div
          className="border-b border-gray-100"
          style={{
            display: "grid",
            gridTemplateColumns: cols,
            columnGap: "12px",
            padding: "12px 20px",
            backgroundColor: "#F1F5F9",
            minWidth: "850px",
          }}
        >
          {[
            "",
            "Name",
            "ERP ID",
            "Course",
            "CGPA",
            rounds.length > 0
              ? `Round ${activeRound + 1} Status`
              : readOnly
                ? "Final Status"
                : "Status",
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
              {applications.length === 0
                ? "No applications found."
                : `No students match current filter.`}
            </p>
          </div>
        ) : (
          filtered.map((app, idx) => {
            const student = app.studentId;
            const s = STATUS_STYLE[app.status] || STATUS_STYLE.Applied;
            const roundStatus = getRoundStatus(app, activeRound);
            const isSelected = selectedAppIds.has(app._id);

            const roundStatusStyle = {
              Pending: { color: "#64748B", bg: "#F8FAFC", border: "#E2E8F0" },
              Cleared: { color: "#15803D", bg: "#F0FDF4", border: "#86EFAC" },
              Eliminated: {
                color: "#991B1B",
                bg: "#FFF1F2",
                border: "#FECDD3",
              },
            };
            const rStyle =
              roundStatusStyle[roundStatus] || roundStatusStyle.Pending;

            return (
              <div
                key={app._id}
                data-appid={app._id}
                onMouseDown={(e) => !readOnly && handleMouseDown(app._id, e)}
                onMouseUp={(e) => {
                  if (hasDraggedRef.current) return;
                  if (
                    e.target.closest("button") ||
                    e.target.closest("[data-nmodal]")
                  )
                    return;
                  setSelectedStudent(student);
                }}
                onTouchStart={(e) => !readOnly && handleTouchStart(app._id, e)}
                onTouchMove={(e) => !readOnly && handleTouchMove(e)}
                onTouchEnd={(e) => !readOnly && handleTouchEnd(app._id, e)}
                style={{
                  display: "grid",
                  gridTemplateColumns: cols,
                  columnGap: "12px",
                  alignItems: "center",
                  padding: "14px 20px",
                  borderBottom:
                    idx !== filtered.length - 1 ? "1px solid #F1F5F9" : "none",
                  minWidth: "850px",
                  cursor: "pointer",
                  userSelect: "none",
                  backgroundColor: isSelected ? "#EFF3FA" : "transparent",
                }}
                className="hover:bg-[#F8FAFC] transition-colors"
              >
                {/* Checkbox */}
                <div
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    if (readOnly) return;
                    hasDraggedRef.current = true;
                    isDraggingRef.current = false;
                    setSelectedAppIds((prev) => {
                      const next = new Set(prev);
                      if (next.has(app._id)) next.delete(app._id);
                      else next.add(app._id);
                      return next;
                    });
                  }}
                  onTouchEnd={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    if (readOnly) return;
                    clearTimeout(longPressTimerRef.current);
                    touchDragActiveRef.current = false;
                    hasDraggedRef.current = true;
                    setSelectedAppIds((prev) => {
                      const next = new Set(prev);
                      if (next.has(app._id)) next.delete(app._id);
                      else next.add(app._id);
                      return next;
                    });
                  }}
                  className="w-6 h-6 rounded border flex items-center justify-center shrink-0 cursor-pointer transition-all"
                  style={{
                    backgroundColor: isSelected ? "#1a3a8f" : "white",
                    borderColor: isSelected ? "#1a3a8f" : "#CBD5E1",
                  }}
                >
                  {isSelected && (
                    <Check size={10} color="white" strokeWidth={3} />
                  )}
                </div>

                <div className="flex flex-col gap-0.5 min-w-0">
                  <NameCell student={student} />
                  {app.appliedVia === "bulk-coordinator" && (
                    <span className="text-[10px] font-medium text-[#1a3a8f] ml-10 truncate block">
                      Applied by coordinator
                    </span>
                  )}
                  {(student?.selectedCount ?? 0) > 0 && (
                    <span
                      className="text-[10px] font-semibold text-success ml-10 truncate block"
                      title={student.selectedCompanies?.join(", ")}
                    >
                      ✓ Selected in: {student.selectedCompanies?.join(", ")}
                    </span>
                  )}
                </div>

                <span
                  className="text-xs font-mono"
                  style={{ color: "#64748B" }}
                >
                  {student?.userId?.erpId || "—"}
                </span>

                <span
                  className="border text-xs font-semibold px-2.5 py-0.5 rounded-full w-fit"
                  style={{
                    color: "#1a3a8f",
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

                {/* Status column */}
                {rounds.length > 0 ? (
                  readOnly ? (
                    <span
                      className="text-xs font-semibold px-2.5 py-1 rounded-full w-fit border"
                      style={{
                        color: rStyle.color,
                        backgroundColor: rStyle.bg,
                        borderColor: rStyle.border,
                      }}
                    >
                      {roundStatus}
                    </span>
                  ) : (
                    <div
                      data-nmodal="true"
                      onClick={(e) => e.stopPropagation()}
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        hasDraggedRef.current = true;
                      }}
                      onTouchStart={(e) => {
                        e.stopPropagation();
                        clearTimeout(longPressTimerRef.current);
                        hasDraggedRef.current = true;
                      }}
                      onTouchEnd={(e) => {
                        e.stopPropagation();
                      }}
                      className="flex items-center gap-1.5 flex-wrap"
                    >
                      {["Cleared", "Eliminated"].map((st) => (
                        <button
                          key={st}
                          onClick={() =>
                            setSingleConfirm({
                              appId: app._id,
                              roundIndex: activeRound,
                              roundName: rounds[activeRound],
                              status: st,
                              studentName: student?.name,
                            })
                          }
                          className="px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all"
                          style={{
                            backgroundColor:
                              roundStatus === st
                                ? st === "Cleared"
                                  ? "#22C55E"
                                  : "#EF4444"
                                : st === "Cleared"
                                  ? "#F0FDF4"
                                  : "#FFF1F2",
                            color:
                              roundStatus === st
                                ? "white"
                                : st === "Cleared"
                                  ? "#15803D"
                                  : "#991B1B",
                            border: `1px solid ${st === "Cleared" ? "#86EFAC" : "#FECDD3"}`,
                          }}
                        >
                          {st === "Cleared" ? "✓ Clear" : "✕ Eliminate"}
                        </button>
                      ))}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setRemoveTarget(app);
                        }}
                        onTouchStart={(e) => {
                          e.stopPropagation();
                          clearTimeout(longPressTimerRef.current);
                          hasDraggedRef.current = true;
                        }}
                        onTouchEnd={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          setRemoveTarget(app);
                        }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  )
                ) : readOnly ? (
                  <span
                    className="text-xs font-semibold px-2.5 py-1 rounded-full w-fit border"
                    style={{
                      color: s.color,
                      backgroundColor: s.bg,
                      borderColor: s.border,
                    }}
                  >
                    {app.status}
                  </span>
                ) : (
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center gap-1.5 flex-wrap"
                  >
                    <StatusActions
                      current={app.status}
                      onChange={(val) => updateStatus(app._id, val)}
                    />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setRemoveTarget(app);
                      }}
                      onTouchStart={(e) => {
                        e.stopPropagation();
                        clearTimeout(longPressTimerRef.current);
                        hasDraggedRef.current = true;
                      }}
                      onTouchEnd={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        setRemoveTarget(app);
                      }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Excel Import Preview Modal */}
      {showImportPreview && importPreviewData && (
        <ImportPreviewModal
          data={importPreviewData}
          onConfirm={confirmImport}
          onClose={() => {
            setShowImportPreview(false);
            setImportPreviewData(null);
          }}
        />
      )}

      <RemoveApplicationModal
        application={removeTarget ? { ...removeTarget, jobName } : null}
        onClose={() => setRemoveTarget(null)}
        onConfirm={handleRemoveApplication}
        loading={removing}
      />

      {/* Student Detail Modal — same as before */}
      {selectedStudent && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4"
          style={{
            backgroundColor: "rgba(15,23,42,0.5)",
            backdropFilter: "blur(4px)",
          }}
          onClick={(e) =>
            e.target === e.currentTarget && setSelectedStudent(null)
          }
        >
          <div
            className="rounded-3xl border shadow-2xl w-full max-w-2xl overflow-y-auto bg-white border-[#E2E8F0] flex flex-col relative"
            style={{ maxHeight: "90vh" }}
          >
            <button
              onClick={() => setSelectedStudent(null)}
              className="absolute top-4 right-4 sm:top-5 sm:right-7 w-9 h-9 rounded-xl flex items-center justify-center bg-[#F1F5F9] text-[#64748B] hover:opacity-80 transition z-10"
            >
              <X size={16} />
            </button>
            <div className="flex items-center flex-wrap justify-between gap-3 px-4 sm:px-7 py-4 sm:py-5 border-b border-[#E2E8F0] sticky top-0 bg-white rounded-t-3xl z-0">
              <div className="flex items-center gap-3 sm:gap-4 min-w-0 pr-10 sm:pr-12">
                <div className="w-12 h-12 rounded-2xl overflow-hidden shrink-0">
                  {selectedStudent.profilePhoto ? (
                    <img
                      src={selectedStudent.profilePhoto}
                      alt={selectedStudent.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div
                      className="w-full h-full rounded-2xl flex items-center justify-center text-white font-bold text-lg"
                      style={{
                        background: "linear-gradient(135deg, #1a3a8f, #3d1a6e)",
                      }}
                    >
                      {selectedStudent.name?.charAt(0) || "?"}
                    </div>
                  )}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-[#0F172A]">
                    {selectedStudent.name}
                  </h2>
                  <p className="text-sm text-[#64748B]">
                    {selectedStudent.userId?.erpId || "—"} ·{" "}
                    {selectedStudent.course || "—"} · Batch{" "}
                    {selectedStudent.batch || "—"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 pr-10 sm:pr-0">
                {(selectedStudent.selectedCount ?? 0) > 0 ? (
                  <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-green-50 text-green-700 border border-green-200">
                    ✓ Selected in:{" "}
                    {selectedStudent.selectedCompanies?.join(", ")}
                  </span>
                ) : (
                  <span className="text-xs font-medium px-3 py-1.5 rounded-full bg-slate-50 text-slate-500 border border-slate-200">
                    Not selected anywhere yet
                  </span>
                )}
                <span
                  className={`text-xs font-semibold px-3 py-1.5 rounded-full border ${selectedStudent.placementStatus === "Placed" ? "bg-green-50 text-green-700 border-green-200" : "bg-amber-50 text-amber-700 border-amber-200"}`}
                >
                  {selectedStudent.placementStatus || "Not Placed"}
                </span>
              </div>
            </div>
            <div className="px-4 sm:px-7 py-5 sm:py-6 space-y-6 sm:space-y-7">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-widest mb-4 pb-2 border-b border-[#E2E8F0] text-[#0F172A]">
                  Personal Information
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    { label: "Email", value: selectedStudent.email },
                    { label: "Phone", value: selectedStudent.phone },
                    { label: "Gender", value: selectedStudent.gender },
                    { label: "Address", value: selectedStudent.address },
                  ].map(({ label, value }) => (
                    <div key={label}>
                      <p className="text-xs font-medium text-[#64748B] mb-0.5">
                        {label}
                      </p>
                      <p className="text-sm font-semibold text-[#0F172A]">
                        {value || "—"}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="text-xs font-bold uppercase tracking-widest mb-4 pb-2 border-b border-[#E2E8F0] text-[#0F172A]">
                  Academic Details
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    { label: "Course", value: selectedStudent.course },
                    { label: "Batch", value: selectedStudent.batch },
                    {
                      label: "Current Semester",
                      value:
                        getSemester(
                          selectedStudent.batch,
                          selectedStudent.course,
                        ) ?? "—",
                    },
                    {
                      label: "CGPA",
                      value: (selectedStudent.cgpa ?? 0).toFixed(1),
                    },
                    {
                      label: "Backlogs",
                      value:
                        selectedStudent.backlogs === 0
                          ? "None"
                          : selectedStudent.backlogs,
                    },
                    {
                      label: "10th Marks",
                      value: selectedStudent.tenthMarks
                        ? `${selectedStudent.tenthMarks}%`
                        : "—",
                    },
                    {
                      label: "12th Marks",
                      value: selectedStudent.twelfthMarks
                        ? `${selectedStudent.twelfthMarks}%`
                        : "—",
                    },
                  ].map(({ label, value }) => (
                    <div key={label}>
                      <p className="text-xs font-medium text-[#64748B] mb-0.5">
                        {label}
                      </p>
                      <p className="text-sm font-semibold text-[#0F172A]">
                        {value || "—"}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="text-xs font-bold uppercase tracking-widest mb-4 pb-2 border-b border-[#E2E8F0] text-[#0F172A]">
                  Skills
                </h4>
                <div className="flex flex-wrap gap-2">
                  {(selectedStudent.skills || []).length === 0 ? (
                    <span className="text-sm text-[#64748B]">
                      No skills added yet
                    </span>
                  ) : (
                    (selectedStudent.skills || []).map((skill) => (
                      <span
                        key={skill}
                        className="border text-xs font-semibold px-3 py-1.5 rounded-full text-[#1a3a8f] bg-[#EFF3FA] border-[#B8C6E3]"
                      >
                        {skill}
                      </span>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ApplicationsManagementPage() {
  const [activeTab, setActiveTab] = useState("eligible");
  const [jobs, setJobs] = useState([]);
  const [allStudents, setAllStudents] = useState([]);
  const [selectedJobId, setSelectedJobId] = useState(null);
  const [selectedCompanyId, setSelectedCompanyId] = useState(null);
  const [driveFilter, setDriveFilter] = useState("Active"); // Active | Closed | All
  const [loading, setLoading] = useState(true);
  const [finalizing, setFinalizing] = useState(false);
  const [selectedRoleGroupId, setSelectedRoleGroupId] = useState(null);

  // Manual "Refresh" support — jobs/students are only fetched once on
  // mount by default, so if a student uploads a resume (or a job's data
  // changes) after the coordinator opened this page, it goes stale until
  // they refresh. `refreshing` drives the button's spinner; `refreshKey`
  // is bumped so EligibleTab's own per-drive "applied" fetch reruns too.
  const [refreshing, setRefreshing] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const fetchData = async () => {
    const jobsData = await api.get("/companies/jobs");
    const studentsData = await api.get("/students");

    // Filter out jobs whose company has been deleted (orphaned jobs).
    const jobList = Array.isArray(jobsData)
      ? jobsData.filter((j) => j.companyId && j.companyId.name)
      : [];
    setJobs(jobList);

    const studentList = Array.isArray(studentsData)
      ? studentsData
      : Array.isArray(studentsData?.students)
        ? studentsData.students
        : [];
    setAllStudents(studentList);
  };

  useEffect(() => {
    document.title = "Applications Management";
    const init = async () => {
      await fetchData();
      setLoading(false);
    };
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchData();
      setRefreshKey((k) => k + 1);
    } finally {
      setRefreshing(false);
    }
  };

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
  // REPLACE this entire useEffect
  useEffect(() => {
    if (visibleJobs.length === 0) {
      setSelectedJobId(null);
      setSelectedCompanyId(null);
      setSelectedRoleGroupId(null);
      return;
    }
    const stillVisible = visibleJobs.some((j) => j._id === selectedJobId);
    if (!stillVisible) {
      const firstJob = visibleJobs[0];
      setSelectedCompanyId(firstJob.companyId?._id);
      setSelectedJobId(firstJob._id);
      setSelectedRoleGroupId(firstJob.roleGroups?.[0]?._id?.toString() || null);
    }
  }, [visibleJobs, selectedJobId]);

  const selectedJob = jobs.find((j) => j._id === selectedJobId);

  // Manual, coordinator-controlled gate — independent of the apply
  // deadline. Status buttons stay editable through all interview rounds
  // and only lock once the coordinator explicitly finalizes results.
  const resultsFinalized = !!selectedJob?.resultsFinalized;

  const handleToggleFinalize = async () => {
    if (!selectedJob) return;
    setFinalizing(true);
    try {
      const updated = await api.put(`/jobs/${selectedJob._id}`, {
        resultsFinalized: !selectedJob.resultsFinalized,
      });
      setJobs((prev) =>
        prev.map((j) =>
          j._id === updated._id
            ? { ...j, resultsFinalized: updated.resultsFinalized }
            : j,
        ),
      );
    } finally {
      setFinalizing(false);
    }
  };

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
      className="space-y-4 sm:space-y-5 p-3 sm:p-6"
      style={{ fontFamily: "Inter, system-ui, sans-serif" }}
    >
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1
            className="text-xl sm:text-2xl font-bold"
            style={{ color: "#0F172A" }}
          >
            Applications Management
          </h1>
          <p className="text-sm mt-0.5" style={{ color: "#64748B" }}>
            Manage eligible and applied students for a job opening.
          </p>
        </div>

        {/* Refresh — re-fetches jobs + students (resumes, eligibility
            fields) so the page doesn't go stale between the time it was
            opened and now. */}
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border transition-all shrink-0 disabled:opacity-60 disabled:cursor-not-allowed"
          style={{
            backgroundColor: "#fff",
            borderColor: "#E2E8F0",
            color: "#0F172A",
          }}
        >
          <RotateCw size={14} className={refreshing ? "animate-spin" : ""} />
          {refreshing ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      <JDBanner
        jobs={visibleJobs}
        selectedJobId={selectedJobId}
        setSelectedJobId={setSelectedJobId}
        selectedJob={selectedJob}
        driveFilter={driveFilter}
        onDriveFilterChange={setDriveFilter}
        driveCounts={driveCounts}
        onToggleFinalize={handleToggleFinalize}
        finalizing={finalizing}
        selectedCompanyId={selectedCompanyId}
        selectedRoleGroupId={selectedRoleGroupId}
        setSelectedRoleGroupId={setSelectedRoleGroupId}
        onCompanyChange={(companyId) => {
          setSelectedCompanyId(companyId);
          const firstRole = visibleJobs.find(
            (j) => j.companyId?._id === companyId,
          );
          if (firstRole) {
            setSelectedJobId(firstRole._id);
            setSelectedRoleGroupId(
              firstRole.roleGroups?.[0]?._id?.toString() || null,
            );
          }
        }}
      />

      {jobs.length > 0 && selectedJob && (
        <>
          <div className="flex items-center gap-1 bg-white rounded-2xl border border-gray-100 p-1.5 shadow-sm w-full sm:w-fit overflow-x-auto">
            {tabs.map((tab) => {
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all"
                  style={{
                    backgroundColor: active ? "#1a3a8f" : "transparent",
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
            <EligibleTab
              selectedJob={selectedJob}
              allStudents={allStudents}
              refreshKey={refreshKey}
              selectedRoleGroupId={selectedRoleGroupId}
            />
          ) : (
            <AppliedTab
              selectedJobId={selectedJobId}
              selectedJob={selectedJob}
              selectedRoleGroupId={selectedRoleGroupId}
              readOnly={resultsFinalized}
              jobName={`${selectedJob?.companyId?.name || "Company"} — ${selectedJob?.role || "Role"}`}
            />
          )}
        </>
      )}
    </div>
  );
}
