import React, { useEffect, useState, useRef, useMemo } from "react";
import {
  CheckCircle2,
  XCircle,
  Download,
  Filter,
  Loader2,
  FileText,
  X,
  ClipboardList,
  Clock,
  GraduationCap,
  Search,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  ExternalLink,
} from "lucide-react";
import { api } from "../../utils/api";
import universityStructure from "../../data/universityStructure";
// Flatten universityStructure once into a course -> school lookup,
// so we can group/roll up NOC/LOR requests by school without
// re-walking the nested structure on every render.
const COURSE_TO_SCHOOL = universityStructure.reduce(
  (acc, { school, departments }) => {
    departments.forEach((dept) => {
      dept.courses.forEach((course) => {
        acc[course] = school;
      });
    });
    return acc;
  },
  {},
);

// Shorten "School of Engineering & Computing (SoEC)" -> "SoEC" for compact pills
const shortSchoolName = (school) => {
  const match = school.match(/\(([^)]+)\)/);
  return match ? match[1] : school;
};

// How many days ago a request was submitted — used to flag stale
// Pending requests so the coordinator doesn't lose track of older ones.
const daysAgo = (dateStr) => {
  if (!dateStr) return null;
  const diffMs = Date.now() - new Date(dateStr).getTime();
  return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
};

// Pull a readable message out of whatever shape the API error has
// (axios-style err.response.data.message, a plain Error, or a string)
// so the coordinator sees *why* an action failed instead of a generic line.
const getErrorMessage = (err, fallback) => {
  return (
    err?.response?.data?.message ||
    err?.data?.message ||
    err?.message ||
    (typeof err === "string" ? err : null) ||
    fallback
  );
};

const ROWS_PER_PAGE = 10;

// ---------- Small helper components ----------

const STATUS_META = {
  Pending: {
    dot: "bg-amber-500",
    bg: "bg-amber-50",
    text: "text-amber-700",
    ring: "ring-amber-600/20",
  },
  Approved: {
    dot: "bg-emerald-500",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    ring: "ring-emerald-600/20",
  },
  Rejected: {
    dot: "bg-rose-500",
    bg: "bg-rose-50",
    text: "text-rose-700",
    ring: "ring-rose-600/20",
  },
};

function StatusBadge({ status, createdAt }) {
  const age = status === "Pending" ? daysAgo(createdAt) : null;
  const meta = STATUS_META[status] || {
    dot: "bg-gray-400",
    bg: "bg-gray-50",
    text: "text-gray-600",
    ring: "ring-gray-400/20",
  };
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className={`inline-flex items-center gap-1.5 pl-2 pr-2.5 py-1 rounded-full ring-1 ring-inset text-xs font-semibold whitespace-nowrap ${meta.bg} ${meta.text} ${meta.ring}`}
      >
        <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
        {status}
      </span>
      {/* Flag Pending requests that have been sitting for 3+ days */}
      {age !== null && age >= 3 && (
        <span
          className="text-[10px] font-semibold text-rose-600"
          title={`Submitted ${age} days ago`}
        >
          {age}d
        </span>
      )}
    </span>
  );
}

function TypeBadge({ type }) {
  return (
    <span className="px-2.5 py-1 rounded-full ring-1 ring-inset ring-[#1a3a8f]/20 text-xs font-semibold tracking-wide bg-[#EFF3FA] text-[#1a3a8f] whitespace-nowrap">
      {type}
    </span>
  );
}

function StatPill({ icon: Icon, label, value, tone = "white" }) {
  const TONE_STYLES = {
    white: "bg-white/15",
    amber: "bg-amber-400",
    emerald: "bg-emerald-400",
    rose: "bg-rose-400",
  };
  return (
    <div className="relative flex items-center gap-2 sm:gap-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl pl-3 pr-3 py-2 sm:pl-5 sm:pr-4 sm:py-3 min-w-32.5 sm:min-w-37.5 overflow-hidden">
      <span
        className={`absolute inset-y-0 left-0 w-1 ${TONE_STYLES[tone]}`}
        aria-hidden="true"
      />
      <div className={`p-2 rounded-lg ${TONE_STYLES[tone]} shadow-inner`}>
        <Icon size={18} className="text-white" />
      </div>
      <div>
        <div className="text-lg sm:text-xl font-bold text-white leading-none tracking-tight">
          {value}
        </div>
        <div className="text-xs text-white/70 mt-1 font-medium">{label}</div>
      </div>
    </div>
  );
}

// ---------- Document cell ----------
// PDF download used to live inside Actions, which meant Approved rows had
// 2 buttons while Rejected rows had 1 — uneven row heights/widths made the
// whole column look messy. Pulling it into its own column fixes that.
function DocumentCell({ request, onDownload }) {
  if (request.status !== "Approved") {
    return <span className="text-gray-300 text-xs">—</span>;
  }
  return (
    <button
      onClick={() => onDownload(request)}
      disabled={!request.pdfUrl}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-[#1a3a8f] hover:bg-[#0d1b5e] active:scale-95 shadow-sm shadow-[#1a3a8f]/25 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
    >
      <Download size={14} />
      PDF
    </button>
  );
}

function ProofCell({ request }) {
  if (!request.proofUrl) {
    return <span className="text-gray-300 text-xs">—</span>;
  }
  return (
    <a
      href={request.proofUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900 transition-colors text-[11px] font-semibold"
    >
      <ExternalLink size={12} />
      View
    </a>
  );
}

// ---------- Actions cell ----------
// Redesigned so every action is a labeled pill, not a bare icon.
// A lone green tick on a Rejected row used to be ambiguous (approve? undo?
// something else?) — now it always reads "Re-approve" in text. Each status
// renders exactly one consistent row of buttons (2 for Pending, 1 for
// Approved/Rejected) so the column doesn't zig-zag between rows.
function ActionsCell({ request, onApprove, onReject }) {
  const { status } = request;

  return (
    <div className="flex items-center justify-center gap-2">
      {status === "Pending" && (
        <>
          <button
            onClick={() => onApprove(request)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-95 shadow-sm shadow-emerald-600/25 transition-all"
          >
            <CheckCircle2 size={14} />
            Approve
          </button>
          <button
            onClick={() => onReject(request)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 active:scale-95 ring-1 ring-inset ring-rose-200 transition-all"
          >
            <XCircle size={14} />
            Reject
          </button>
        </>
      )}

      {status === "Approved" && (
        <button
          onClick={() => onReject(request)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-rose-600 bg-rose-50 hover:bg-rose-100 active:scale-95 ring-1 ring-inset ring-rose-200 transition-all"
          title="Revoke this approval"
        >
          <RotateCcw size={13} />
          Revoke
        </button>
      )}

      {status === "Rejected" && (
        <button
          onClick={() => onApprove(request)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-95 shadow-sm shadow-emerald-600/25 transition-all"
          title="Approve this request even though it was rejected before"
        >
          <RotateCcw size={14} />
          Re-approve
        </button>
      )}
    </div>
  );
}

// View full request details — lets the coordinator read the complete
// purpose text (and everything else) for ANY request, any time, not just
// while approving/rejecting. Fixes the truncated-purpose-with-only-a-
// hover-tooltip problem in the table.
function ViewModal({ open, request, onClose }) {
  if (!open || !request) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-2xl shadow-2xl shadow-gray-900/10 ring-1 ring-gray-100 w-full max-w-lg p-4 sm:p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Request Details
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">
              Submitted{" "}
              {request.createdAt
                ? new Date(request.createdAt).toLocaleDateString("en-IN", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })
                : "—"}
            </p>
            {(request.status === "Approved" || request.status === "Rejected") &&
              request.updatedAt && (
                <p className="text-xs text-gray-400 mt-0.5">
                  {request.status === "Approved" ? "Approved" : "Rejected"}{" "}
                  {new Date(request.updatedAt).toLocaleDateString("en-IN", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                </p>
              )}
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={18} />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4 text-sm sm:text-base">
          <div>
            <p className="text-xs text-gray-400 mb-0.5">Student</p>
            <p className="text-sm font-medium text-gray-800">
              {request.studentName}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-0.5">ERP ID</p>
            <p className="text-sm font-medium text-gray-800">
              {request.erpId || "—"}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-0.5">Course</p>
            <p className="text-sm font-medium text-gray-800">
              {request.course || "—"}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-0.5">Type</p>
            <TypeBadge type={request.requestType} />
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-0.5">Status</p>
            <StatusBadge
              status={request.status}
              createdAt={request.createdAt}
            />
          </div>
        </div>

        <div className="mb-2">
          <p className="text-xs text-gray-400 mb-1">Purpose</p>
          <p className="text-sm text-gray-700 bg-gray-50 border border-gray-200 rounded-lg p-3 leading-relaxed whitespace-pre-wrap">
            {request.purpose || "—"}
          </p>
        </div>

        {request.proofUrl && (
          <div className="mb-4">
            <p className="text-xs text-gray-400 mb-1">Proof Document</p>
            <a
              href={request.proofUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-[#1a3a8f] hover:underline"
            >
              <ExternalLink size={14} /> View Proof
            </a>
          </div>
        )}

        {request.status === "Rejected" && request.rejectionReason && (
          <div className="mb-2">
            <p className="text-xs text-gray-400 mb-1">Rejection Reason</p>
            <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg p-3 leading-relaxed whitespace-pre-wrap">
              {request.rejectionReason}
            </p>
          </div>
        )}

        {request.status === "Approved" && request.pdfUrl && (
          <a
            href={request.pdfUrl}
            target="_blank"
            rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 mt-2 text-sm font-medium text-[#1a3a8f] hover:underline"
          >
            <Download size={14} /> Download PDF
          </a>
        )}

        <div className="flex justify-end mt-5">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// Confirm modal for Approve action — now shows the full purpose text so
// the coordinator actually reads what they're approving, instead of
// deciding based on just the student's name and request type.
function ApproveModal({
  open,
  request,
  onCancel,
  onConfirm,
  loading,
  errorMessage,
}) {
  if (!open) return null;
  const isReapprove = request?.status === "Rejected";
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-2xl shadow-2xl shadow-gray-900/10 ring-1 ring-gray-100 w-full max-w-md p-4 sm:p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          {isReapprove ? "Re-approve Request?" : "Approve Request?"}
        </h3>
        <p className="text-sm text-gray-600 mb-3">
          You're about to {isReapprove ? "re-approve" : "approve"}{" "}
          <span className="font-medium">{request?.studentName}</span>'s{" "}
          <span className="font-medium">{request?.requestType}</span> request.
          {isReapprove
            ? " This request was previously rejected — approving it will generate a fresh document."
            : " The status will update immediately after you confirm."}
        </p>

        <div className="mb-5">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">
            Purpose
          </p>
          <p className="text-sm text-gray-700 bg-gray-50 border border-gray-200 rounded-lg p-3 leading-relaxed whitespace-pre-wrap max-h-40 overflow-y-auto">
            {request?.purpose || "—"}
          </p>
        </div>

        {request?.proofUrl && (
          <div className="mb-4">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">
              Proof Document
            </p>
            <a
              href={request.proofUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-[#1a3a8f] hover:underline"
            >
              <ExternalLink size={14} /> View Proof
            </a>
          </div>
        )}

        {errorMessage && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-700 text-sm border border-red-200">
            {errorMessage}
          </div>
        )}

        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 sm:gap-3">
          <button
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
          >
            {loading && <Loader2 size={16} className="animate-spin" />}
            Confirm Approve
          </button>
        </div>
      </div>
    </div>
  );
}

// Reason input modal for Reject action — same fix, full purpose shown
// before the coordinator writes a rejection reason.
function RejectModal({
  open,
  request,
  onCancel,
  onSubmit,
  loading,
  errorMessage,
}) {
  const [reason, setReason] = useState("");

  useEffect(() => {
    if (open) setReason("");
  }, [open]);

  if (!open) return null;

  const isRevoke = request?.status === "Approved";
  const canSubmit = reason.trim().length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-2xl shadow-2xl shadow-gray-900/10 ring-1 ring-gray-100 w-full max-w-md p-4 sm:p-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold text-gray-900">
            {isRevoke ? "Revoke Approval" : "Reject Request"}
          </h3>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={18} />
          </button>
        </div>
        <p className="text-sm text-gray-600 mb-3">
          <span className="font-medium">{request?.studentName}</span>'s{" "}
          <span className="font-medium">{request?.requestType}</span> request.
          {isRevoke &&
            " This request was previously approved — revoking will invalidate the generated document."}
        </p>

        <div className="mb-4">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">
            Purpose
          </p>
          <p className="text-sm text-gray-700 bg-gray-50 border border-gray-200 rounded-lg p-3 leading-relaxed whitespace-pre-wrap max-h-40 overflow-y-auto">
            {request?.purpose || "—"}
          </p>
        </div>

        {request?.proofUrl && (
          <div className="mb-4">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">
              Proof Document
            </p>
            <a
              href={request.proofUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-[#1a3a8f] hover:underline"
            >
              <ExternalLink size={14} /> View Proof
            </a>
          </div>
        )}

        <p className="text-sm text-gray-600 mb-2">
          {isRevoke
            ? "Please provide a reason for revoking this approval."
            : "Please provide a reason for rejecting this request."}
        </p>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={4}
          placeholder="Type rejection reason..."
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 resize-none"
        />

        {errorMessage && (
          <div className="mt-3 p-3 rounded-lg bg-red-50 text-red-700 text-sm border border-red-200">
            {errorMessage}
          </div>
        )}

        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 sm:gap-3 mt-5">
          <button
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={() => onSubmit(reason.trim())}
            disabled={!canSubmit || loading}
            className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
          >
            {loading && <Loader2 size={16} className="animate-spin" />}
            Submit Rejection
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------- Main Page ----------

const FILTERS = ["All", "NOC", "LOR", "Pending", "Approved", "Rejected"];

export default function NOCManagementPage() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");
  const [schoolFilter, setSchoolFilter] = useState("All"); // school pill selection
  const [courseFilter, setCourseFilter] = useState("All"); // specific course dropdown
  const [searchQuery, setSearchQuery] = useState(""); // student name / ERP ID search
  const [currentPage, setCurrentPage] = useState(1);

  // modal state
  const [approveTarget, setApproveTarget] = useState(null); // request object
  const [rejectTarget, setRejectTarget] = useState(null); // request object
  const [viewTarget, setViewTarget] = useState(null); // request object being viewed in full
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState(""); // surfaced inside the modal, not a generic alert

  const fetchRequests = async (isInitialLoad = false) => {
    try {
      if (isInitialLoad) setLoading(true);
      setError("");
      const data = await api.get("/noc");
      setRequests(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch NOC/LOR requests:", err);
      if (isInitialLoad) {
        setError(
          "Failed to load requests. Please refresh the page and try again.",
        );
        setRequests([]);
      }
    } finally {
      if (isInitialLoad) setLoading(false);
    }
  };

  // Refs so the polling interval can check current modal state
  // without needing to restart the interval on every open/close.
  const approveTargetRef = useRef(null);
  const rejectTargetRef = useRef(null);
  approveTargetRef.current = approveTarget;
  rejectTargetRef.current = rejectTarget;

  useEffect(() => {
    fetchRequests(true);

    // Live polling every 6 seconds so new student requests show up
    // without needing a manual refresh. Paused while a modal is open
    // so an in-progress approve/reject action isn't disrupted.
    const intervalId = setInterval(() => {
      if (approveTargetRef.current || rejectTargetRef.current) return;
      fetchRequests(false);
    }, 6000);

    return () => clearInterval(intervalId);
  }, []);

  const stats = {
    total: requests.length,
    pending: requests.filter((r) => r.status === "Pending").length,
    approved: requests.filter((r) => r.status === "Approved").length,
    rejected: requests.filter((r) => r.status === "Rejected").length,
  };

  // School-wise breakdown: how many NOC/LOR requests came from each school.
  // Resolved via the course -> school lookup built from universityStructure.
  const schoolBreakdown = useMemo(() => {
    const counts = {};
    requests.forEach((r) => {
      const school = COURSE_TO_SCHOOL[r.course] || "Other";
      counts[school] = (counts[school] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([school, count]) => ({ school, count }))
      .sort((a, b) => b.count - a.count);
  }, [requests]);

  // Courses to show in the dropdown, grouped by school, limited to
  // courses that actually have at least one request (keeps the list short
  // instead of showing all 100+ courses from universityStructure).
  const groupedCourseOptions = useMemo(() => {
    const courseCounts = {};
    requests.forEach((r) => {
      if (!r.course) return;
      courseCounts[r.course] = (courseCounts[r.course] || 0) + 1;
    });

    const bySchool = {};
    Object.entries(courseCounts).forEach(([course, count]) => {
      const school = COURSE_TO_SCHOOL[course] || "Other";
      if (!bySchool[school]) bySchool[school] = [];
      bySchool[school].push({ course, count });
    });

    // If a school pill is active, only show that school's courses
    const schools =
      schoolFilter === "All" ? Object.keys(bySchool) : [schoolFilter];

    return schools
      .filter((school) => bySchool[school])
      .map((school) => ({
        school,
        courses: bySchool[school].sort((a, b) => b.count - a.count),
      }))
      .sort((a, b) => a.school.localeCompare(b.school));
  }, [requests, schoolFilter]);

  const filteredRequests = useMemo(() => {
    return requests.filter((req) => {
      // Type/Status pill filter (existing)
      const matchesTypeStatus =
        activeFilter === "All"
          ? true
          : activeFilter === "NOC" || activeFilter === "LOR"
            ? req.requestType === activeFilter
            : req.status === activeFilter;

      // School pill filter
      const reqSchool = COURSE_TO_SCHOOL[req.course] || "Other";
      const matchesSchool =
        schoolFilter === "All" || reqSchool === schoolFilter;

      // Specific course dropdown filter
      const matchesCourse =
        courseFilter === "All" || req.course === courseFilter;

      // Student name OR ERP ID search (case-insensitive, trimmed)
      const query = searchQuery.trim().toLowerCase();
      const matchesSearch =
        query === "" ||
        (req.studentName || "").toLowerCase().includes(query) ||
        (req.erpId || "").toString().toLowerCase().includes(query);

      return (
        matchesTypeStatus && matchesSchool && matchesCourse && matchesSearch
      );
    });
  }, [requests, activeFilter, schoolFilter, courseFilter, searchQuery]);

  // Reset to page 1 whenever filters/search change the result set, so the
  // coordinator doesn't get stuck on an empty page after narrowing down.
  useEffect(() => {
    setCurrentPage(1);
  }, [activeFilter, schoolFilter, courseFilter, searchQuery]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredRequests.length / ROWS_PER_PAGE),
  );
  const paginatedRequests = filteredRequests.slice(
    (currentPage - 1) * ROWS_PER_PAGE,
    currentPage * ROWS_PER_PAGE,
  );

  const handleSchoolFilterChange = (school) => {
    setSchoolFilter(school);
    setCourseFilter("All"); // reset course selection when switching schools
  };

  // ----- Approve flow -----
  const handleApproveConfirm = async () => {
    if (!approveTarget) return;
    try {
      setActionLoading(true);
      setActionError("");
      await api.put(`/noc/${approveTarget._id}/status`, { status: "Approved" });
      setRequests((prev) =>
        prev.map((r) =>
          r._id === approveTarget._id ? { ...r, status: "Approved" } : r,
        ),
      );
      setApproveTarget(null);
      // Re-fetch so the coordinator's own list picks up the freshly
      // generated pdfUrl right away (backend generates it synchronously
      // during the approve call, but the local optimistic update above
      // doesn't include it).
      fetchRequests(false);
    } catch (err) {
      console.error("Approve failed:", err);
      // Show the real reason (e.g. "PDF template missing", "Unauthorized",
      // a validation message) inside the modal instead of a blind
      // "Failed to approve" alert — that's the only way to actually
      // diagnose why it's failing.
      setActionError(
        getErrorMessage(err, "Failed to approve. Please try again."),
      );
    } finally {
      setActionLoading(false);
    }
  };

  // ----- Reject flow -----
  const handleRejectSubmit = async (reason) => {
    if (!rejectTarget) return;
    try {
      setActionLoading(true);
      setActionError("");
      await api.put(`/noc/${rejectTarget._id}/status`, {
        status: "Rejected",
        rejectionReason: reason,
      });
      setRequests((prev) =>
        prev.map((r) =>
          r._id === rejectTarget._id
            ? { ...r, status: "Rejected", rejectionReason: reason }
            : r,
        ),
      );
      setRejectTarget(null);
    } catch (err) {
      console.error("Reject failed:", err);
      setActionError(
        getErrorMessage(err, "Failed to reject. Please try again."),
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleDownload = (request) => {
    if (!request.pdfUrl) return;
    const link = document.createElement("a");
    link.href = request.pdfUrl;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.download = `${request.requestType}_${request.studentName || "student"}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Gradient Hero */}
      <div
        className="relative overflow-hidden rounded-2xl px-4 py-6 sm:px-6 sm:py-8 mb-6 shadow-lg shadow-blue-900/10"
        style={{
          background:
            "linear-gradient(135deg, #0d1b5e 0%, #1a2d8a 25%, #3d1a6e 55%, #6b1040 80%, #7a0f35 100%)",
        }}
      >
        {/* Faint corner glow — subtle texture instead of a flat fill */}
        <div
          className="pointer-events-none absolute -top-24 -right-24 w-72 h-72 rounded-full opacity-20 blur-3xl"
          style={{
            background: "radial-gradient(circle, #FFFFFF, transparent 70%)",
          }}
          aria-hidden="true"
        />
        <svg
          className="absolute bottom-0 right-0 pointer-events-none"
          style={{ width: "260px", height: "130px" }}
          viewBox="0 0 260 130"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M260 130 Q180 60 80 100 Q20 120 0 130"
            stroke="url(#nocLorRedOrangeGrad)"
            strokeWidth="3.5"
            fill="none"
            strokeLinecap="round"
          />
          <path
            d="M260 110 Q190 50 100 85 Q40 105 10 115"
            stroke="url(#nocLorRedOrangeGrad)"
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
            opacity="0.5"
          />
          <defs>
            <linearGradient
              id="nocLorRedOrangeGrad"
              x1="0"
              y1="0"
              x2="260"
              y2="0"
              gradientUnits="userSpaceOnUse"
            >
              <stop offset="0%" stopColor="#ff4e00" stopOpacity="0" />
              <stop offset="50%" stopColor="#ff4e00" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#ff9d00" stopOpacity="1" />
            </linearGradient>
          </defs>
        </svg>
        <h1 className="relative text-xl sm:text-2xl font-bold text-white tracking-tight">
          NOC / LOR Requests
        </h1>
        <p className="relative text-sm text-white/75 mt-1 mb-5">
          Review and approve or reject students' NOC and LOR requests here.
        </p>

        {/* Stat strip */}
        <div className="relative flex flex-wrap gap-3">
          <StatPill
            icon={ClipboardList}
            label="Total Requests"
            value={stats.total}
            tone="white"
          />
          <StatPill
            icon={Clock}
            label="Pending"
            value={stats.pending}
            tone="amber"
          />
          <StatPill
            icon={CheckCircle2}
            label="Approved"
            value={stats.approved}
            tone="emerald"
          />
          <StatPill
            icon={XCircle}
            label="Rejected"
            value={stats.rejected}
            tone="rose"
          />
        </div>
      </div>

      <div className="px-4 pb-4 sm:px-6 sm:pb-6">
        {/* School-wise breakdown */}
        {schoolBreakdown.length > 0 && (
          <div className="mb-4">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              <GraduationCap size={14} />
              Requests by School
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => handleSchoolFilterChange("All")}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  schoolFilter === "All"
                    ? "bg-[#1a3a8f] text-white shadow-sm"
                    : "bg-white text-gray-600 ring-1 ring-inset ring-gray-200 hover:ring-gray-300 hover:text-gray-900"
                }`}
              >
                All Schools ({stats.total})
              </button>
              {schoolBreakdown.map(({ school, count }) => (
                <button
                  key={school}
                  onClick={() => handleSchoolFilterChange(school)}
                  title={school}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                    schoolFilter === school
                      ? "bg-[#1a3a8f] text-white shadow-sm"
                      : "bg-white text-gray-600 ring-1 ring-inset ring-gray-200 hover:ring-gray-300 hover:text-gray-900"
                  }`}
                >
                  {shortSchoolName(school)} ({count})
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 mb-5">
          <Filter size={16} className="text-gray-400 mr-1" />
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              className={`px-3.5 py-1.5 rounded-full text-sm font-semibold transition-all ${
                activeFilter === f
                  ? "bg-[#1a3a8f] text-white shadow-sm shadow-[#1a3a8f]/25"
                  : "bg-white text-gray-600 ring-1 ring-inset ring-gray-200 hover:ring-gray-300 hover:text-gray-900"
              }`}
            >
              {f}
            </button>
          ))}

          {/* Search by student name or ERP ID */}
          <div className="relative w-full sm:w-auto sm:ml-auto mt-2 sm:mt-0">
            <Search
              size={15}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search name or ERP ID..."
              className="pl-8 pr-7 py-1.5 rounded-lg text-sm bg-white text-gray-700 ring-1 ring-inset ring-gray-200 focus:outline-none focus:ring-2 focus:ring-[#1a3a8f] transition-shadow w-full sm:w-56"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                title="Clear search"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Course dropdown, grouped by school — reads as a refinement
              step after the school pills above, not a duplicate filter */}
          <div className="flex items-center gap-1.5 w-full sm:w-auto">
            <span className="text-xs font-medium text-gray-400 hidden sm:inline">
              Course:
            </span>
            <select
              value={courseFilter}
              onChange={(e) => setCourseFilter(e.target.value)}
              className="w-full sm:w-auto px-3 py-1.5 rounded-lg text-sm bg-gray-50 text-gray-600 ring-1 ring-inset ring-gray-200 focus:outline-none focus:ring-2 focus:ring-[#1a3a8f] focus:bg-white transition-all"
            >
              <option value="All">
                {schoolFilter === "All"
                  ? "All Courses"
                  : `All ${shortSchoolName(schoolFilter)} Courses`}
              </option>
              {groupedCourseOptions.map(({ school, courses }) => (
                <optgroup key={school} label={shortSchoolName(school)}>
                  {courses.map(({ course, count }) => (
                    <option key={course} value={course}>
                      {course} ({count})
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>
        </div>

        {/* Error state */}
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-700 text-sm border border-red-200">
            {error}
          </div>
        )}

        {/* Table */}
        <div className="bg-white rounded-xl shadow-sm shadow-gray-200/60 ring-1 ring-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50/80 border-b border-gray-200 text-left text-gray-500 text-[11px] font-semibold uppercase tracking-wider">
                  <th className="px-2 sm:px-3 py-2 sm:py-3 font-medium">
                    Student
                  </th>
                  <th className="px-2 sm:px-3 py-2 sm:py-3 font-medium">
                    ERP ID
                  </th>
                  <th className="px-2 sm:px-3 py-2 sm:py-3 font-medium">
                    Course
                  </th>
                  <th className="px-2 sm:px-3 py-2 sm:py-3 font-medium">
                    Type
                  </th>
                  <th className="px-2 sm:px-3 py-2 sm:py-3 font-medium">
                    Purpose
                  </th>
                  <th className="px-2 sm:px-3 py-2 sm:py-3 font-medium">
                    Proof
                  </th>
                  <th className="px-2 sm:px-3 py-2 sm:py-3 font-medium">
                    Status
                  </th>
                  <th className="px-2 sm:px-3 py-2 sm:py-3 font-medium text-center">
                    Document
                  </th>
                  <th className="px-2 sm:px-3 py-2 sm:py-3 font-medium text-center">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td
                      colSpan={9}
                      className="px-4 py-10 text-center text-gray-400"
                    >
                      <Loader2
                        size={20}
                        className="animate-spin inline-block mr-2"
                      />
                      Loading requests...
                    </td>
                  </tr>
                ) : filteredRequests.length === 0 ? (
                  <tr>
                    <td
                      colSpan={9}
                      className="px-4 py-10 text-center text-gray-400"
                    >
                      <FileText
                        size={22}
                        className="inline-block mb-2 opacity-50"
                      />
                      <div>No requests found.</div>
                      {(activeFilter !== "All" ||
                        schoolFilter !== "All" ||
                        courseFilter !== "All" ||
                        searchQuery) && (
                        <div className="text-xs mt-1">
                          Try adjusting your filters or search.
                        </div>
                      )}
                    </td>
                  </tr>
                ) : (
                  paginatedRequests.map((req) => (
                    <tr
                      key={req._id}
                      className="hover:bg-[#EFF3FA] transition-colors"
                    >
                      <td
                        className="px-2 sm:px-3 py-2.5 font-medium text-gray-800 max-w-[120px] truncate"
                        title={req.studentName}
                      >
                        {req.studentName}
                      </td>
                      <td className="px-2 sm:px-3 py-2.5 text-gray-500 whitespace-nowrap">
                        {req.erpId || "—"}
                      </td>
                      <td
                        className="px-2 sm:px-3 py-2.5 text-gray-600 max-w-[120px] truncate"
                        title={req.course}
                      >
                        {req.course}
                      </td>
                      <td className="px-2 sm:px-3 py-2.5">
                        <TypeBadge type={req.requestType} />
                      </td>
                      <td className="px-2 sm:px-3 py-2.5 text-gray-600 max-w-28 sm:max-w-40">
                        <button
                          onClick={() => setViewTarget(req)}
                          className="truncate block w-full text-left hover:text-[#1a3a8f] hover:underline"
                          title="Click to read full purpose"
                        >
                          {req.purpose}
                        </button>
                      </td>
                      <td className="px-2 sm:px-3 py-2.5">
                        <ProofCell request={req} />
                      </td>
                      <td className="px-2 sm:px-3 py-2.5">
                        <StatusBadge
                          status={req.status}
                          createdAt={req.createdAt}
                        />
                      </td>
                      <td className="px-2 sm:px-3 py-2.5 text-center">
                        <DocumentCell
                          request={req}
                          onDownload={handleDownload}
                        />
                      </td>
                      <td className="px-2 sm:px-3 py-2.5">
                        <ActionsCell
                          request={req}
                          onApprove={(r) => {
                            setActionError("");
                            setApproveTarget(r);
                          }}
                          onReject={(r) => {
                            setActionError("");
                            setRejectTarget(r);
                          }}
                        />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination footer */}
          {!loading && filteredRequests.length > ROWS_PER_PAGE && (
            <div className="flex flex-col sm:flex-row items-center sm:justify-between gap-2 px-4 py-3 border-t border-gray-100 bg-slate-50/50 text-sm text-gray-500">
              <span>
                Showing{" "}
                <span className="font-semibold text-gray-700">
                  {(currentPage - 1) * ROWS_PER_PAGE + 1}–
                  {Math.min(
                    currentPage * ROWS_PER_PAGE,
                    filteredRequests.length,
                  )}
                </span>{" "}
                of {filteredRequests.length}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-1.5 rounded-lg bg-white ring-1 ring-inset ring-gray-200 text-gray-500 hover:text-gray-900 hover:ring-gray-300 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronLeft size={16} />
                </button>
                <span className="px-2.5 py-1 rounded-md bg-white ring-1 ring-inset ring-gray-200 text-gray-700 font-semibold text-xs">
                  {currentPage} / {totalPages}
                </span>
                <button
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
                  disabled={currentPage === totalPages}
                  className="p-1.5 rounded-lg bg-white ring-1 ring-inset ring-gray-200 text-gray-500 hover:text-gray-900 hover:ring-gray-300 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modals */}
        <ViewModal
          open={!!viewTarget}
          request={viewTarget}
          onClose={() => setViewTarget(null)}
        />
        <ApproveModal
          open={!!approveTarget}
          request={approveTarget}
          loading={actionLoading}
          errorMessage={actionError}
          onCancel={() => {
            if (actionLoading) return;
            setApproveTarget(null);
            setActionError("");
          }}
          onConfirm={handleApproveConfirm}
        />
        <RejectModal
          open={!!rejectTarget}
          request={rejectTarget}
          loading={actionLoading}
          errorMessage={actionError}
          onCancel={() => {
            if (actionLoading) return;
            setRejectTarget(null);
            setActionError("");
          }}
          onSubmit={handleRejectSubmit}
        />
      </div>
    </div>
  );
}
