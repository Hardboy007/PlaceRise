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

// ---------- Small helper components ----------

const STATUS_STYLES = {
  Pending: "bg-amber-100 text-amber-700 border border-amber-300",
  Approved: "bg-green-100 text-green-700 border border-green-300",
  Rejected: "bg-red-100 text-red-700 border border-red-300",
};

function StatusBadge({ status }) {
  return (
    <span
      className={`px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
        STATUS_STYLES[status] ||
        "bg-gray-100 text-gray-700 border border-gray-300"
      }`}
    >
      {status}
    </span>
  );
}

function TypeBadge({ type }) {
  return (
    <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 border border-blue-300 whitespace-nowrap">
      {type}
    </span>
  );
}

function StatPill({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl px-4 py-3 min-w-[140px]">
      <div className="p-2 rounded-lg bg-white/15">
        <Icon size={18} className="text-white" />
      </div>
      <div>
        <div className="text-xl font-bold text-white leading-none">{value}</div>
        <div className="text-xs text-white/70 mt-1">{label}</div>
      </div>
    </div>
  );
}

// Confirm modal for Approve action
function ApproveModal({ open, request, onCancel, onConfirm, loading }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Approve Request?
        </h3>
        <p className="text-sm text-gray-600 mb-5">
          You're about to approve{" "}
          <span className="font-medium">{request?.studentName}</span>'s{" "}
          <span className="font-medium">{request?.requestType}</span> request.
          The status will update immediately after you confirm.
        </p>
        <div className="flex justify-end gap-3">
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

// Reason input modal for Reject action
function RejectModal({ open, request, onCancel, onSubmit, loading }) {
  const [reason, setReason] = useState("");

  useEffect(() => {
    if (open) setReason("");
  }, [open]);

  if (!open) return null;

  const canSubmit = reason.trim().length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold text-gray-900">
            Reject Request
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
          Please provide a reason for rejecting this request.
        </p>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={4}
          placeholder="Type rejection reason..."
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 resize-none"
        />
        <div className="flex justify-end gap-3 mt-5">
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

  // modal state
  const [approveTarget, setApproveTarget] = useState(null); // request object
  const [rejectTarget, setRejectTarget] = useState(null); // request object
  const [actionLoading, setActionLoading] = useState(false);

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

  const filteredRequests = requests.filter((req) => {
    // Type/Status pill filter (existing)
    const matchesTypeStatus =
      activeFilter === "All"
        ? true
        : activeFilter === "NOC" || activeFilter === "LOR"
          ? req.requestType === activeFilter
          : req.status === activeFilter;

    // School pill filter
    const reqSchool = COURSE_TO_SCHOOL[req.course] || "Other";
    const matchesSchool = schoolFilter === "All" || reqSchool === schoolFilter;

    // Specific course dropdown filter
    const matchesCourse = courseFilter === "All" || req.course === courseFilter;

    return matchesTypeStatus && matchesSchool && matchesCourse;
  });

  const handleSchoolFilterChange = (school) => {
    setSchoolFilter(school);
    setCourseFilter("All"); // reset course selection when switching schools
  };

  // ----- Approve flow -----
  const handleApproveConfirm = async () => {
    if (!approveTarget) return;
    try {
      setActionLoading(true);
      await api.put(`/noc/${approveTarget._id}/status`, { status: "Approved" });
      setRequests((prev) =>
        prev.map((r) =>
          r._id === approveTarget._id ? { ...r, status: "Approved" } : r,
        ),
      );
      setApproveTarget(null);
    } catch (err) {
      console.error("Approve failed:", err);
      alert("Failed to approve. Please try again.");
    } finally {
      setActionLoading(false);
    }
  };

  // ----- Reject flow -----
  const handleRejectSubmit = async (reason) => {
    if (!rejectTarget) return;
    try {
      setActionLoading(true);
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
      alert("Failed to reject. Please try again.");
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
        className="rounded-2xl px-6 py-8 mb-6 shadow-lg"
        style={{
          background:
            "linear-gradient(135deg, #3B82F6 0%, #60A5FA 60%, #818CF8 100%)",
        }}
      >
        <h1 className="text-2xl font-bold text-white">NOC / LOR Requests</h1>
        <p className="text-sm text-white/80 mt-1 mb-5">
          Review and approve or reject students' NOC and LOR requests here.
        </p>

        {/* Stat strip */}
        <div className="flex flex-wrap gap-3">
          <StatPill
            icon={ClipboardList}
            label="Total Requests"
            value={stats.total}
          />
          <StatPill icon={Clock} label="Pending" value={stats.pending} />
          <StatPill
            icon={CheckCircle2}
            label="Approved"
            value={stats.approved}
          />
          <StatPill icon={XCircle} label="Rejected" value={stats.rejected} />
        </div>
      </div>

      <div className="px-6 pb-6">
        {/* School-wise breakdown */}
        {schoolBreakdown.length > 0 && (
          <div className="mb-4">
            <div className="flex items-center gap-1.5 text-xs font-medium text-gray-500 mb-2">
              <GraduationCap size={14} />
              Requests by School
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => handleSchoolFilterChange("All")}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  schoolFilter === "All"
                    ? "bg-gray-900 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                All Schools ({stats.total})
              </button>
              {schoolBreakdown.map(({ school, count }) => (
                <button
                  key={school}
                  onClick={() => handleSchoolFilterChange(school)}
                  title={school}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                    schoolFilter === school
                      ? "bg-gray-900 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
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
              className={`px-3.5 py-1.5 rounded-full text-sm font-medium transition-colors ${
                activeFilter === f
                  ? "bg-[#3B82F6] text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {f}
            </button>
          ))}

          {/* Course dropdown, grouped by school */}
          <select
            value={courseFilter}
            onChange={(e) => setCourseFilter(e.target.value)}
            className="ml-auto px-3 py-1.5 rounded-lg text-sm border border-gray-300 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            <option value="All">All Courses</option>
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

        {/* Error state */}
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-700 text-sm border border-red-200">
            {error}
          </div>
        )}

        {/* Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-left text-gray-500 text-xs uppercase tracking-wide">
                  <th className="px-4 py-3 font-medium">Student</th>
                  <th className="px-4 py-3 font-medium">Course</th>
                  <th className="px-4 py-3 font-medium">Type</th>
                  <th className="px-4 py-3 font-medium">Purpose</th>
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td
                      colSpan={7}
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
                      colSpan={7}
                      className="px-4 py-10 text-center text-gray-400"
                    >
                      <FileText
                        size={22}
                        className="inline-block mb-2 opacity-50"
                      />
                      <div>No requests found.</div>
                    </td>
                  </tr>
                ) : (
                  filteredRequests.map((req) => (
                    <tr key={req._id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-800">
                        {req.studentName}
                      </td>
                      <td className="px-4 py-3 text-gray-600">{req.course}</td>
                      <td className="px-4 py-3">
                        <TypeBadge type={req.requestType} />
                      </td>
                      <td
                        className="px-4 py-3 text-gray-600 max-w-xs truncate"
                        title={req.purpose}
                      >
                        {req.purpose}
                      </td>
                      <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                        {req.createdAt
                          ? new Date(req.createdAt).toLocaleDateString(
                              "en-IN",
                              {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              },
                            )
                          : "-"}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={req.status} />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          {req.status === "Pending" && (
                            <>
                              <button
                                onClick={() => setApproveTarget(req)}
                                className="p-1.5 rounded-lg text-green-600 hover:bg-green-50"
                                title="Approve"
                              >
                                <CheckCircle2 size={18} />
                              </button>
                              <button
                                onClick={() => setRejectTarget(req)}
                                className="p-1.5 rounded-lg text-red-600 hover:bg-red-50"
                                title="Reject"
                              >
                                <XCircle size={18} />
                              </button>
                            </>
                          )}
                          {req.status === "Approved" && (
                            <button
                              onClick={() => handleDownload(req)}
                              disabled={!req.pdfUrl}
                              className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1"
                              title="Download PDF"
                            >
                              <Download size={18} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modals */}
        <ApproveModal
          open={!!approveTarget}
          request={approveTarget}
          loading={actionLoading}
          onCancel={() => !actionLoading && setApproveTarget(null)}
          onConfirm={handleApproveConfirm}
        />
        <RejectModal
          open={!!rejectTarget}
          request={rejectTarget}
          loading={actionLoading}
          onCancel={() => !actionLoading && setRejectTarget(null)}
          onSubmit={handleRejectSubmit}
        />
      </div>
    </div>
  );
}
