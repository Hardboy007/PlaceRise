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
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm shrink-0"
        style={{ background: "linear-gradient(135deg,#1a3a8f,#3d1a6e)" }}
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
}) {
  const branchList = selectedJob?.eligibleBranches?.includes("All")
    ? ["All Branches"]
    : selectedJob?.eligibleBranches || [];
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
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: "linear-gradient(135deg,#1a3a8f,#3d1a6e)" }}
          >
            <Briefcase size={18} color="white" />
          </div>
          <div className="min-w-0 w-full sm:w-auto">
            <p
              className="text-[10px] font-semibold uppercase tracking-widest mb-1"
              style={{ color: "rgba(255,255,255,0.7)" }}
            >
              Select Drive
            </p>
            {jobs.length === 0 ? (
              <p className="text-sm font-bold" style={{ color: "#0F172A" }}>
                No {driveFilter !== "All" ? driveFilter.toLowerCase() : ""}{" "}
                drives{driveFilter !== "All" ? "" : " posted yet"}
              </p>
            ) : (
              <div className="flex items-center gap-2 flex-wrap min-w-0 w-full">
                <select
                  value={selectedJobId || ""}
                  onChange={(e) => setSelectedJobId(e.target.value)}
                  className="text-sm font-bold border border-white/25 rounded-lg px-2 py-1 bg-white/10 text-white focus:outline-none focus:border-white/50 w-full sm:w-auto sm:max-w-xs truncate"
                >
                  {jobs.map((j) => (
                    <option
                      key={j._id}
                      value={j._id}
                      style={{ color: "#0F172A", backgroundColor: "#fff" }}
                    >
                      {j.companyId?.name || "Unknown"} — {j.role}
                      {isJobClosed(j) ? " (Closed)" : ""}
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
              className="rounded-xl px-3 py-1.5 border border-white/25 bg-white/10 flex items-start gap-1.5 shrink-0"
            >
              <span className="mt-0.5" style={{ color: "#1a3a8f" }}>
                {icon}
              </span>
              <div>
                <p
                  className="text-[10px] font-semibold uppercase tracking-wide text-white/65"
                >
                  {label}
                </p>
                <p className="text-xs font-bold text-white">
                  {value}
                </p>
              </div>
            </div>
          ))}

          {/* Eligible courses - own row, wraps as individual pills */}
          <div
            className="rounded-xl px-3 py-1.5 border border-white/25 bg-white/10 flex items-start gap-1.5 flex-1 min-w-[240px]"
          >
            <span className="mt-0.5 shrink-0" style={{ color: "#f59e0b" }}>
              <GraduationCap size={12} />
            </span>
            <div className="min-w-0">
              <p
                className="text-[10px] font-semibold uppercase tracking-wide mb-1 text-white/65"
              >
                Eligible Courses
              </p>
              <div className="flex flex-wrap gap-1">
                {branchList.length === 0 ? (
                  <span
                    className="text-xs font-bold text-white"
                  >
                    —
                  </span>
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

function EligibleTab({ selectedJob, allStudents, refreshKey }) {
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
  const jobName = `${selectedJob?.companyId?.name || "Company"} — ${selectedJob?.role || "Role"}`;

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

function AppliedTab({ selectedJobId, readOnly, jobName }) {
  const [applications, setApplications] = useState([]);
  const [filterStatus, setFilterStatus] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [exporting, setExporting] = useState(false);

  // Remove-application flow — for the "I applied by mistake" case. Holds
  // the application currently pending confirmation (or null when closed).
  const [removeTarget, setRemoveTarget] = useState(null);
  const [removing, setRemoving] = useState(false);

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

  const filtered = useMemo(() => {
    const byStatus =
      filterStatus === "All"
        ? applications
        : applications.filter((a) => a.status === filterStatus);
    const q = searchQuery.trim().toLowerCase();
    if (!q) return byStatus;
    return byStatus.filter((a) => {
      const student = a.studentId;
      const name = (student?.name || "").toLowerCase();
      const erp = (student?.userId?.erpId || "").toLowerCase();
      return name.includes(q) || erp.includes(q);
    });
  }, [applications, filterStatus, searchQuery]);

  const updateStatus = async (appId, newStatus) => {
    const updated = await api.put(`/applications/${appId}/status`, {
      status: newStatus,
    });
    setApplications((prev) =>
      prev.map((a) => (a._id === appId ? { ...a, status: updated.status } : a)),
    );
  };

  // Permanently deletes a mistaken/duplicate application.
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
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (!response.ok) throw new Error("Export failed");

      // Backend se filename lo Content-Disposition header se
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
      a.download = filename; // backend wala filename use karo
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert("Export failed");
    } finally {
      setExporting(false);
    }
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
          Results for this drive have been finalized — status changes are
          disabled, showing final results only.
        </div>
      )}

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

      <div className="bg-white rounded-2xl border border-gray-100 p-3 sm:p-4 shadow-sm flex items-center gap-2 flex-wrap">
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
                color: active ? (s ? s.color : "#1a3a8f") : "#64748B",
                backgroundColor: active ? (s ? s.bg : "#EFF6FF") : "#F8FAFC",
                borderColor: active ? (s ? s.border : "#BFDBFE") : "#E2E8F0",
              }}
            >
              {opt} (
              {opt === "All" ? counts.total : (counts[opt.toLowerCase()] ?? 0)})
            </button>
          );
        })}

        <span
          className="w-full sm:w-auto sm:ml-auto text-sm"
          style={{ color: "#64748B" }}
        >
          Showing{" "}
          <strong style={{ color: "#0F172A" }}>{filtered.length}</strong> of{" "}
          {counts.total}
        </span>
        <button
          onClick={handleExport}
          disabled={exporting}
          className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all border w-full sm:w-auto"
          style={{
            background: exporting
              ? "#94A3B8"
              : "linear-gradient(135deg, #1a3a8f, #3d1a6e)",
            color: "white",
            borderColor: "transparent",
            boxShadow: exporting ? "none" : "0 2px 8px rgba(59,130,246,0.3)",
            cursor: exporting ? "not-allowed" : "pointer",
          }}
        >
          {exporting ? (
            <>
              <LoaderCircle size={13} className="animate-spin" />
              Preparing Excel...
            </>
          ) : (
            <>
              <Download size={13} />
              Ready to share with Company? — Download Excel
            </>
          )}
        </button>
      </div>

      {/* Name / ERP ID search */}
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
            {applications.length === 0 ? (
              <>
                <ClipboardList size={36} color="#E2E8F0" />
                <p className="text-sm" style={{ color: "#64748B" }}>
                  No applications found.
                </p>
              </>
            ) : (
              <>
                <Search size={36} color="#E2E8F0" />
                <p className="text-sm" style={{ color: "#64748B" }}>
                  No students match "{searchQuery}"
                  {filterStatus !== "All" ? ` in ${filterStatus}` : ""}.
                </p>
              </>
            )}
          </div>
        ) : (
          filtered.map((app, idx) => {
            const student = app.studentId;
            const s = STATUS_STYLE[app.status] || STATUS_STYLE.Applied;
            return (
              <div
                key={app._id}
                onClick={() => setSelectedStudent(student)}
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
                }}
                className="hover:bg-[#F8FAFC] transition-colors"
              >
                <div className="flex flex-col gap-0.5 min-w-0">
                  <NameCell student={student} />
                  {app.appliedVia === "bulk-coordinator" && (
                    <span className="text-[10px] font-medium text-[#1a3a8f] ml-10 truncate block max-w-[140px] sm:max-w-none">
                      Applied by coordinator
                    </span>
                  )}
                  {(student?.selectedCount ?? 0) > 0 ? (
                    <span
                      className="text-[10px] font-semibold text-success ml-10 truncate max-w-[140px] sm:max-w-55 block"
                      title={student.selectedCompanies?.join(", ")}
                    >
                      ✓ Selected in: {student.selectedCompanies?.join(", ")}
                    </span>
                  ) : (
                    <span className="text-[10px] font-medium text-[#94A3B8] ml-10 truncate block max-w-[140px] sm:max-w-none">
                      Not selected anywhere yet
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
                  className="text-xs font-semibold"
                  style={{ color: "#0F172A" }}
                >
                  {getSemester(student?.batch, student?.course) ?? "—"}
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
                      onClick={() => setRemoveTarget(app)}
                      title="Remove this application (e.g. applied by mistake)"
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

      <RemoveApplicationModal
        application={removeTarget ? { ...removeTarget, jobName } : null}
        onClose={() => setRemoveTarget(null)}
        onConfirm={handleRemoveApplication}
        loading={removing}
      />

      {/* Student Detail Modal */}
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
            {/* Close button — pinned to the top-right corner so it never
                wraps down next to the status badges on narrower widths. */}
            <button
              onClick={() => setSelectedStudent(null)}
              className="absolute top-4 right-4 sm:top-5 sm:right-7 w-9 h-9 rounded-xl flex items-center justify-center bg-[#F1F5F9] text-[#64748B] hover:opacity-80 transition z-10"
            >
              <X size={16} />
            </button>

            {/* Header */}
            <div className="flex items-center flex-wrap justify-between gap-3 px-4 sm:px-7 py-4 sm:py-5 border-b border-[#E2E8F0] sticky top-0 bg-white rounded-t-3xl z-0">
              <div className="flex items-center gap-3 sm:gap-4 min-w-0 pr-10 sm:pr-12">
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold text-lg shrink-0"
                  style={{
                    background: "linear-gradient(135deg, #1a3a8f, #3d1a6e)",
                  }}
                >
                  {selectedStudent.name?.charAt(0) || "?"}
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
                  <span
                    className="text-xs font-semibold px-3 py-1.5 rounded-full bg-green-50 text-green-700 border border-green-200"
                    title={selectedStudent.selectedCompanies?.join(", ")}
                  >
                    ✓ Selected in:{" "}
                    {selectedStudent.selectedCompanies?.join(", ")}
                  </span>
                ) : (
                  <span className="text-xs font-medium px-3 py-1.5 rounded-full bg-slate-50 text-slate-500 border border-slate-200">
                    Not selected anywhere yet
                  </span>
                )}
                <span
                  className={`text-xs font-semibold px-3 py-1.5 rounded-full border ${
                    selectedStudent.placementStatus === "Placed"
                      ? "bg-green-50 text-green-700 border-green-200"
                      : "bg-amber-50 text-amber-700 border-amber-200"
                  }`}
                >
                  {selectedStudent.placementStatus || "Not Placed"}
                </span>
              </div>
            </div>

            {/* Body */}
            <div className="px-4 sm:px-7 py-5 sm:py-6 space-y-6 sm:space-y-7">
              {/* Personal */}
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

              {/* Academic */}
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

              {/* Skills */}
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
  const [driveFilter, setDriveFilter] = useState("Active"); // Active | Closed | All
  const [loading, setLoading] = useState(true);
  const [finalizing, setFinalizing] = useState(false);

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
    // A deleted company leaves companyId as null/undefined on the job doc.
    const jobList = Array.isArray(jobsData)
      ? jobsData.filter((j) => j.companyId && j.companyId.name)
      : [];

    setJobs(jobList);
    setAllStudents(Array.isArray(studentsData) ? studentsData : []);
  };

  useEffect(() => {
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
  useEffect(() => {
    if (visibleJobs.length === 0) {
      setSelectedJobId(null);
      return;
    }
    const stillVisible = visibleJobs.some((j) => j._id === selectedJobId);
    if (!stillVisible) setSelectedJobId(visibleJobs[0]._id);
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
            />
          ) : (
            <AppliedTab
              selectedJobId={selectedJobId}
              readOnly={resultsFinalized}
              jobName={`${selectedJob?.companyId?.name || "Company"} — ${selectedJob?.role || "Role"}`}
            />
          )}
        </>
      )}
    </div>
  );
}
