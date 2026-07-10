import { useState, useEffect, useRef, useCallback } from "react";
import QRCode from "qrcode";
import { api } from "../../utils/api";
import {
  QrCode,
  Users,
  Search,
  Download,
  StopCircle,
  PlayCircle,
  Clock,
  CheckCircle2,
  UserPlus,
} from "lucide-react";

export default function AttendancePage() {
  // ── Drive selection ──
  const [jobs, setJobs] = useState([]);
  const [jobsLoading, setJobsLoading] = useState(true);
  const [selectedJobId, setSelectedJobId] = useState("");
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState("");

  // ── Session / QR ──
  const [session, setSession] = useState(null); // { _id/id, token, status, ... }
  const [sessionId, setSessionId] = useState(null);
  const [qrDataUrl, setQrDataUrl] = useState("");

  // ── Live records ──
  const [records, setRecords] = useState([]);
  const pollRef = useRef(null);

  // ── Manual mark ──
  const [allStudents, setAllStudents] = useState([]);
  const [studentSearch, setStudentSearch] = useState("");
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [isLate, setIsLate] = useState(false);
  const [marking, setMarking] = useState(false);

  // ── Close / export ──
  const [closing, setClosing] = useState(false);
  const [downloading, setDownloading] = useState(false);

  // A drive whose application deadline (lastDate) has already passed is
  // "closed" — attendance sessions only make sense for drives that are
  // still open/happening, so closed ones are filtered out of the dropdown
  // entirely rather than just being greyed out.
  const isJobStillOpen = (job) => {
    if (!job.lastDate) return true; // no deadline set => treat as open
    const deadline = new Date(job.lastDate);
    if (isNaN(deadline)) return true;
    const endOfDeadlineDay = new Date(
      deadline.getFullYear(),
      deadline.getMonth(),
      deadline.getDate(),
      23,
      59,
      59,
    );
    return endOfDeadlineDay >= new Date();
  };

  // ── Fetch active jobs for the dropdown ──
  useEffect(() => {
    const fetchJobs = async () => {
      try {
        setJobsLoading(true);
        const data = await api.get("/companies/jobs");
        const valid = (Array.isArray(data) ? data : [])
          .filter((j) => j.companyId && j.companyId.name) // drop orphaned jobs (deleted company)
          .filter(isJobStillOpen); // drop closed/expired drives
        setJobs(valid);
      } catch (err) {
        console.error("Failed to load jobs:", err);
        setError("Could not load drives. Please refresh.");
      } finally {
        setJobsLoading(false);
      }
    };
    fetchJobs();
  }, []);

  // ── Fetch students once, for manual-mark search ──
  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const data = await api.get("/students");
        setAllStudents(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Failed to load students:", err);
      }
    };
    fetchStudents();
  }, []);

  // ── Restore an in-progress session on mount (e.g. after navigating away
  // and coming back — component state resets on unmount, but the session
  // is still live on the backend, so we just need to reconnect to it) ──
  const [restoring, setRestoring] = useState(true);

  useEffect(() => {
    const restoreSession = async () => {
      const savedSessionId = localStorage.getItem("attendance_session_id");
      if (!savedSessionId) {
        setRestoring(false);
        return;
      }
      try {
        const data = await api.get(`/attendance/${savedSessionId}`);
        const restoredSession = data.session;

        // If the session was closed while we were away, don't restore it —
        // just clear the stale pointer and show the start screen again.
        if (!restoredSession || restoredSession.status === "closed") {
          localStorage.removeItem("attendance_session_id");
          setRestoring(false);
          return;
        }

        setSession(restoredSession);
        setSessionId(savedSessionId);
        setSelectedJobId(restoredSession.jobId?._id || restoredSession.jobId || "");
        setRecords(Array.isArray(data.records) ? data.records : []);

        const url = `https://placerise.vercel.app/attendance?token=${restoredSession.token}`;
        const dataUrl = await QRCode.toDataURL(url, { width: 480, margin: 2 });
        setQrDataUrl(dataUrl);
      } catch (err) {
        console.error("Failed to restore attendance session:", err);
        localStorage.removeItem("attendance_session_id");
      } finally {
        setRestoring(false);
      }
    };
    restoreSession();
  }, []);

  // ── Start session ──
  const handleStartSession = async () => {
    if (!selectedJobId || starting) return;
    setStarting(true);
    setError("");
    try {
      const res = await api.post("/attendance/start", {
        jobId: selectedJobId,
      });
      // Backend response shape isn't confirmed — support a couple of
      // reasonable shapes so this doesn't silently break.
      const newSession = res.session || res;
      const newSessionId = newSession._id || newSession.id || res.sessionId;
      setSession(newSession);
      setSessionId(newSessionId);
      localStorage.setItem("attendance_session_id", newSessionId);

      const url = `https://placerise.vercel.app/attendance?token=${newSession.token}`;
      const dataUrl = await QRCode.toDataURL(url, { width: 480, margin: 2 });
      setQrDataUrl(dataUrl);
      setRecords([]);
    } catch (err) {
      console.error("Failed to start session:", err);
      setError(err.message || "Failed to start attendance session.");
    } finally {
      setStarting(false);
    }
  };

  // ── Poll live attendance every 5s while session is active ──
  const pollAttendance = useCallback(async () => {
    if (!sessionId) return;
    try {
      const data = await api.get(`/attendance/${sessionId}`);
      setRecords(Array.isArray(data.records) ? data.records : []);
      if (data.session) setSession(data.session);
    } catch (err) {
      console.error("Failed to poll attendance:", err);
    }
  }, [sessionId]);

  useEffect(() => {
    if (!sessionId) return;
    pollAttendance(); // immediate first fetch
    pollRef.current = setInterval(pollAttendance, 5000);
    return () => clearInterval(pollRef.current);
  }, [sessionId, pollAttendance]);

  // ── Manual mark ──
  const filteredStudents = studentSearch.trim()
    ? allStudents.filter((s) =>
        (s.name || "").toLowerCase().includes(studentSearch.toLowerCase()),
      )
    : [];

  const handleManualMark = async () => {
    if (!selectedStudentId || !sessionId || marking) return;
    setMarking(true);
    try {
      await api.post(`/attendance/${sessionId}/manual`, {
        studentId: selectedStudentId,
        isLate,
      });
      await pollAttendance();
      setSelectedStudentId("");
      setStudentSearch("");
      setIsLate(false);
    } catch (err) {
      console.error("Failed to mark attendance:", err);
      alert(err.message || "Failed to mark attendance.");
    } finally {
      setMarking(false);
    }
  };

  // ── Close session ──
  const handleCloseSession = async () => {
    if (!sessionId || closing) return;
    if (!window.confirm("Close this attendance session? The QR will stop working.")) return;
    setClosing(true);
    try {
      const updated = await api.put(`/attendance/${sessionId}/close`);
      setSession(updated.session || updated);
      clearInterval(pollRef.current);
      localStorage.removeItem("attendance_session_id");
    } catch (err) {
      console.error("Failed to close session:", err);
      alert(err.message || "Failed to close session.");
    } finally {
      setClosing(false);
    }
  };

  // ── Download PDF ──
  const handleDownloadPDF = async () => {
    if (!sessionId || downloading) return;
    setDownloading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/attendance/${sessionId}/export`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `attendance_${sessionId}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Failed to download PDF:", err);
      alert("Failed to download PDF.");
    } finally {
      setDownloading(false);
    }
  };

  const isClosed = session?.status?.toLowerCase() === "closed";
  const selectedJob = jobs.find((j) => j._id === selectedJobId);

  return (
    <div className="max-w-5xl mx-auto" style={{ fontFamily: "Inter, sans-serif" }}>
      <div
        className="rounded-2xl px-6 py-8 mb-6 shadow-lg"
        style={{
          background:
            "linear-gradient(135deg, #3B82F6 0%, #60A5FA 60%, #818CF8 100%)",
        }}
      >
        <h1 className="text-2xl font-bold text-white flex items-center gap-2.5">
          <QrCode size={24} /> QR Attendance
        </h1>
        <p className="text-sm text-white/80 mt-1">
          Start a session, let students scan in, and export the final sheet.
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-700 text-sm border border-red-200">
          {error}
        </div>
      )}

      {restoring && (
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-10 shadow-sm mb-6 text-center">
          <p className="text-sm text-[#64748B]">Checking for an active session...</p>
        </div>
      )}

      {/* ── 1. Drive Select ── */}
      {!restoring && !sessionId && (
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 shadow-sm mb-6">
          <h2 className="text-sm font-bold text-[#1E293B] mb-4">
            Select Drive
          </h2>
          {jobsLoading ? (
            <p className="text-sm text-[#64748B]">Loading drives...</p>
          ) : jobs.length === 0 ? (
            <p className="text-sm text-[#64748B]">No active drives found.</p>
          ) : (
            <div className="flex flex-col sm:flex-row gap-3">
              <select
                value={selectedJobId}
                onChange={(e) => setSelectedJobId(e.target.value)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-[#CBD5E1] text-sm text-[#1E293B] bg-white focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition"
              >
                <option value="">Choose a drive...</option>
                {jobs.map((j) => (
                  <option key={j._id} value={j._id}>
                    {j.companyId?.name} — {j.role}
                  </option>
                ))}
              </select>
              <button
                onClick={handleStartSession}
                disabled={!selectedJobId || starting}
                className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <PlayCircle size={16} />
                {starting ? "Starting..." : "Start Session"}
              </button>
            </div>
          )}
        </div>
      )}

      {sessionId && (
        <>
          {/* ── Session header ── */}
          <div className="bg-white rounded-2xl border border-[#E2E8F0] p-5 shadow-sm mb-6 flex items-center justify-between flex-wrap gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-[#64748B]">
                Active Drive
              </p>
              <p className="text-sm font-bold text-[#1E293B] mt-0.5">
                {selectedJob
                  ? `${selectedJob.companyId?.name} — ${selectedJob.role}`
                  : "—"}
              </p>
            </div>
            <span
              className={`px-3 py-1 rounded-full text-xs font-semibold ${
                isClosed
                  ? "bg-gray-100 text-gray-600 border border-gray-300"
                  : "bg-green-100 text-green-700 border border-green-300"
              }`}
            >
              {isClosed ? "Closed" : "Live"}
            </span>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-6">
            {/* ── 2. QR Code Display ── */}
            <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 shadow-sm flex flex-col items-center">
              <h2 className="text-sm font-bold text-[#1E293B] mb-4 self-start flex items-center gap-2">
                <QrCode size={16} /> Scan to Mark Attendance
              </h2>
              {isClosed ? (
                <div className="w-full py-16 flex flex-col items-center gap-2 text-[#94A3B8]">
                  <QrCode size={40} className="opacity-40" />
                  <p className="text-sm">QR expired — session closed</p>
                </div>
              ) : qrDataUrl ? (
                <>
                  <img
                    src={qrDataUrl}
                    alt="Attendance QR Code"
                    className="w-72 h-72 rounded-xl border border-[#E2E8F0]"
                  />
                  <p className="text-xs text-[#94A3B8] mt-4">
                    Backup token (if scanning fails):
                  </p>
                  <p className="text-xs font-mono text-[#64748B] bg-[#F8FAFC] px-3 py-1.5 rounded-lg mt-1 break-all text-center">
                    {session?.token}
                  </p>
                </>
              ) : (
                <p className="text-sm text-[#64748B] py-16">
                  Generating QR code...
                </p>
              )}
            </div>

            {/* ── 4. Manual Mark ── */}
            <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 shadow-sm">
              <h2 className="text-sm font-bold text-[#1E293B] mb-4 flex items-center gap-2">
                <UserPlus size={16} /> Manual Mark
              </h2>
              <div className="relative mb-3">
                <Search
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]"
                />
                <input
                  type="text"
                  value={studentSearch}
                  onChange={(e) => {
                    setStudentSearch(e.target.value);
                    setSelectedStudentId("");
                  }}
                  placeholder="Search student by name..."
                  disabled={isClosed}
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-[#CBD5E1] text-sm text-[#1E293B] focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition disabled:opacity-50"
                />
              </div>

              {studentSearch.trim() && !selectedStudentId && (
                <div className="max-h-40 overflow-y-auto border border-[#E2E8F0] rounded-xl mb-3">
                  {filteredStudents.length === 0 ? (
                    <p className="text-xs text-[#94A3B8] text-center py-4">
                      No students found
                    </p>
                  ) : (
                    filteredStudents.slice(0, 8).map((s) => (
                      <button
                        key={s._id}
                        onClick={() => {
                          setSelectedStudentId(s._id);
                          setStudentSearch(s.name);
                        }}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-[#F8FAFC] transition-colors border-b border-[#F1F5F9] last:border-b-0"
                      >
                        <span className="font-medium text-[#1E293B]">
                          {s.name}
                        </span>
                        <span className="text-xs text-[#94A3B8] ml-2">
                          {s.course}
                        </span>
                      </button>
                    ))
                  )}
                </div>
              )}

              <label className="flex items-center gap-2 mb-4 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isLate}
                  onChange={(e) => setIsLate(e.target.checked)}
                  disabled={isClosed}
                  className="w-4 h-4 accent-primary"
                />
                <span className="text-sm text-[#64748B]">
                  Mark Present (Late)
                </span>
              </label>

              <button
                onClick={handleManualMark}
                disabled={!selectedStudentId || marking || isClosed}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#1E293B] text-white text-sm font-semibold hover:bg-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <CheckCircle2 size={15} />
                {marking ? "Marking..." : "Mark Attendance"}
              </button>
            </div>
          </div>

          {/* ── 3. Live Attendance List ── */}
          <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm mb-6 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#F1F5F9]">
              <h2 className="text-sm font-bold text-[#1E293B] flex items-center gap-2">
                <Users size={16} /> Live Attendance
              </h2>
              <span className="text-xs font-bold text-primary bg-blue-50 border border-blue-100 px-2.5 py-1 rounded-lg">
                {records.length} present
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200 text-left text-gray-500 text-xs uppercase tracking-wide">
                    <th className="px-6 py-3 font-medium">Name</th>
                    <th className="px-6 py-3 font-medium">ERP ID</th>
                    <th className="px-6 py-3 font-medium">Course</th>
                    <th className="px-6 py-3 font-medium">Time</th>
                    <th className="px-6 py-3 font-medium">Mode</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {records.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-6 py-10 text-center text-gray-400 text-sm"
                      >
                        No one has checked in yet.
                      </td>
                    </tr>
                  ) : (
                    records.map((r) => (
                      <tr key={r._id || r.id} className="hover:bg-gray-50">
                        <td className="px-6 py-3 font-medium text-gray-800">
                          {r.studentId?.name || "—"}
                        </td>
                        <td className="px-6 py-3 text-gray-500 font-mono text-xs">
                          {r.studentId?.userId?.erpId || "—"}
                        </td>
                        <td className="px-6 py-3 text-gray-600">
                          {r.studentId?.course || "—"}
                        </td>
                        <td className="px-6 py-3 text-gray-500 flex items-center gap-1.5">
                          <Clock size={12} />
                          {r.markedAt
                            ? new Date(r.markedAt).toLocaleTimeString(
                                "en-IN",
                                { hour: "2-digit", minute: "2-digit" },
                              )
                            : "—"}
                        </td>
                        <td className="px-6 py-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                              r.mode === "Manual"
                                ? "bg-amber-100 text-amber-700 border border-amber-300"
                                : "bg-blue-100 text-blue-700 border border-blue-300"
                            }`}
                          >
                            {r.mode === "Manual" && r.isLate
                              ? "Manual (Late)"
                              : r.mode || "QR"}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* ── 5. Close Session + Download PDF ── */}
          <div className="flex items-center justify-end gap-3 mb-10">
            {!isClosed && (
              <button
                onClick={handleCloseSession}
                disabled={closing}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-red-200 text-red-600 text-sm font-semibold hover:bg-red-50 transition-colors disabled:opacity-50"
              >
                <StopCircle size={16} />
                {closing ? "Closing..." : "Close Session"}
              </button>
            )}
            <button
              onClick={handleDownloadPDF}
              disabled={downloading}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-blue-600 transition-colors disabled:opacity-50"
            >
              <Download size={16} />
              {downloading ? "Downloading..." : "Download PDF"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}