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
  ChevronDown,
} from "lucide-react";

export default function AttendancePage() {
  // ── Drive selection ──
  const [jobs, setJobs] = useState([]);
  const [jobsLoading, setJobsLoading] = useState(true);
  const [selectedJobIds, setSelectedJobIds] = useState([]);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState("");
  const [driveDropdownOpen, setDriveDropdownOpen] = useState(false);
  const driveDropdownRef = useRef(null);

  // ── Checking if selected drive already has a live session ──
  const [checkingSession, setCheckingSession] = useState(false);

  // ── Session / QR ──
  const [session, setSession] = useState(null);
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

  const [selectedCompanyName, setSelectedCompanyName] = useState("");
  const [companyDropdownOpen, setCompanyDropdownOpen] = useState(false);
  const companyDropdownRef = useRef(null);

  const isJobStillOpen = (job) => {
    if (!job.lastDate) return true;
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
    document.title = "Attendance — PlaceRise";
    const fetchJobs = async () => {
      try {
        setJobsLoading(true);
        const data = await api.get("/companies/jobs");
        const valid = (Array.isArray(data) ? data : [])
          .filter((j) => j.companyId && j.companyId.name)
          .filter(isJobStillOpen);
        setJobs(valid);
        console.log("job0 full:", JSON.stringify(valid[0], null, 2));
        console.log("jobs:", valid); // ADD
        console.log("job[0]:", valid[0]); // ADD
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
        setAllStudents(list);
      } catch (err) {
        console.error("Failed to load students:", err);
      }
    };
    fetchStudents();
  }, []);

  // ── Close the custom drive dropdown when clicking outside it ──
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        driveDropdownRef.current &&
        !driveDropdownRef.current.contains(e.target)
      ) {
        setDriveDropdownOpen(false);
      }
      if (
        companyDropdownRef.current &&
        !companyDropdownRef.current.contains(e.target)
      ) {
        setCompanyDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ── Load QR + records for a session object (shared by join/start) ──
  const hydrateSession = async (sess) => {
    const id = sess._id || sess.id;
    setSession(sess);
    setSessionId(id);

    const data = await api.get(`/attendance/${id}`);
    setRecords(Array.isArray(data.records) ? data.records : []);

    const url = `https://placerise.vercel.app/attendance?token=${sess.token}`;
    const dataUrl = await QRCode.toDataURL(url, { width: 480, margin: 2 });
    setQrDataUrl(dataUrl);
  };

  // ── FIX: job-wise session check ──
  // Jab bhi coordinator koi drive select karta hai, backend se poochte
  // hain "iss job ka koi active session hai kya" — agar haan, toh usी
  // mein join ho jao (kisi ne bhi start kiya ho, kisi bhi device se).
  // Agar nahi, toh "Start Session" button enable rahega us job ke liye.
  useEffect(() => {
    if (selectedJobIds.length === 0 || !selectedJob) return;

    let cancelled = false;
    const checkExisting = async () => {
      setCheckingSession(true);
      setError("");
      try {
        const found = await api.get(
          `/attendance/active?jobId=${selectedJob._id}`, // selectedJob._id, roleGroup nahi
        );
        if (!cancelled && found && found.status !== "closed") {
          await hydrateSession(found);
        }
      } catch (err) {
        // 404 = normal
      } finally {
        if (!cancelled) setCheckingSession(false);
      }
    };
    checkExisting();

    return () => {
      cancelled = true;
    };
  }, [selectedJobIds]);

  // ── Start session ──
  const handleStartSession = async () => {
    if (selectedJobIds.length === 0 || starting) return;
    setStarting(true);
    setError("");
    try {
      // Pehla selected job ka session start karo (ya join karo)
      const res = await api.post("/attendance/start", {
        jobId: selectedJob?._id, // job ka _id
        roleGroupIds: selectedJobIds,
      });
      const newSession = res.session || res;
      await hydrateSession(newSession);
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
    pollAttendance();
    pollRef.current = setInterval(pollAttendance, 5000);
    return () => clearInterval(pollRef.current);
  }, [sessionId, pollAttendance]);

  const isClosed = session?.status?.toLowerCase() === "closed";
  const uniqueCourses = [
    ...new Set(records.map((r) => r.studentId?.course).filter(Boolean)),
  ];

  // ── FIX: QR token har 10s pe rotate karo, taaki screenshot/forwarded ──
  // QR expire ho jaaye aur proxy attendance na lag paaye. Server current
  // + prev token dono accept karta hai, isliye exact rotation ke waqt
  // scan karne wale student ka request fail nahi hoga.
  useEffect(() => {
    if (!sessionId || isClosed) return;

    const rotateQR = async () => {
      try {
        const res = await api.put(`/attendance/${sessionId}/rotate-token`);
        const url = `https://placerise.vercel.app/attendance?token=${res.token}`;
        const dataUrl = await QRCode.toDataURL(url, { width: 480, margin: 2 });
        setQrDataUrl(dataUrl);
        setSession((prev) => (prev ? { ...prev, token: res.token } : prev));
      } catch (err) {
        console.error("Failed to rotate QR token:", err);
      }
    };
    const qrInterval = setInterval(rotateQR, 20000);
    return () => clearInterval(qrInterval);
  }, [sessionId, isClosed]);

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
    if (
      !window.confirm(
        "Close this attendance session? The QR will stop working.",
      )
    )
      return;
    setClosing(true);
    try {
      const updated = await api.put(`/attendance/${sessionId}/close`);
      setSession(updated.session || updated);
      clearInterval(pollRef.current);
      // Session band ho gaya — wapas drive-select flow pe le jao,
      // taaki chahe toh isi job ka naya session ya koi aur drive select kare
      setSessionId(null);
      setQrDataUrl("");
      setRecords([]);
    } catch (err) {
      console.error("Failed to close session:", err);
      alert(err.message || "Failed to close session.");
    } finally {
      setClosing(false);
    }
  };

  // ── Download PDF ──
  // handleDownloadPDF ab course accept karega
  const handleDownloadPDF = async (course = null) => {
    if (!sessionId || downloading) return;
    setDownloading(true);
    try {
      const token = localStorage.getItem("token");
      const courseParam = course ? `?course=${encodeURIComponent(course)}` : "";
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/attendance/${sessionId}/export${courseParam}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `attendance_${course ? course + "_" : ""}${sessionId}.pdf`;
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

  const uniqueCompanies = [
    ...new Map(jobs.map((j) => [j.companyId?._id, j.companyId])).values(),
  ].filter(Boolean);
  const selectedJob = jobs.find(
    (j) => j.companyId?.name === selectedCompanyName,
  );
  const rolesForCompany = selectedJob?.roleGroups || [];

  return (
    <div
      className="max-w-5xl mx-auto"
      style={{ fontFamily: "Inter, sans-serif" }}
    >
      <div
        className="relative overflow-hidden rounded-2xl px-4 sm:px-6 py-6 sm:py-8 mb-6 shadow-lg"
        style={{
          background:
            "linear-gradient(135deg, #0d1b5e 0%, #1a2d8a 25%, #3d1a6e 55%, #6b1040 80%, #7a0f35 100%)",
        }}
      >
        <svg
          className="absolute bottom-0 right-0 pointer-events-none"
          style={{ width: "260px", height: "130px" }}
          viewBox="0 0 260 130"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M260 130 Q180 60 80 100 Q20 120 0 130"
            stroke="url(#attendanceRedOrangeGrad)"
            strokeWidth="3.5"
            fill="none"
            strokeLinecap="round"
          />
          <path
            d="M260 110 Q190 50 100 85 Q40 105 10 115"
            stroke="url(#attendanceRedOrangeGrad)"
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
            opacity="0.5"
          />
          <defs>
            <linearGradient
              id="attendanceRedOrangeGrad"
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
        <h1 className="relative z-10 text-xl sm:text-2xl font-bold text-white flex items-center gap-2.5">
          <QrCode size={22} className="shrink-0 text-[#f59e0b]" /> QR Attendance
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

      {/* ── 1. Drive Select — always visible jab tak session join na ho ── */}
      {!sessionId && (
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-4 sm:p-6 shadow-sm mb-6">
          <h2 className="text-sm font-bold text-[#1E293B] mb-4">
            Select Drive
          </h2>
          {jobsLoading ? (
            <p className="text-sm text-[#64748B]">Loading drives...</p>
          ) : jobs.length === 0 ? (
            <p className="text-sm text-[#64748B]">No active drives found.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {/* Step 1 — Company select */}
              <div>
                <p className="text-xs font-semibold text-[#64748B] uppercase tracking-widest mb-2">
                  Step 1 — Select Company
                </p>
                <div className="relative" ref={companyDropdownRef}>
                  <button
                    type="button"
                    onClick={() => setCompanyDropdownOpen((o) => !o)}
                    className="w-full flex items-center justify-between gap-2 px-4 py-2.5 rounded-xl border border-[#CBD5E1] text-sm text-left bg-white focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition"
                  >
                    <span
                      className={
                        selectedCompanyName
                          ? "text-[#1E293B]"
                          : "text-[#94A3B8]"
                      }
                    >
                      {selectedCompanyName || "Choose a company..."}
                    </span>
                    <ChevronDown
                      size={15}
                      className={`text-[#94A3B8] shrink-0 transition-transform ${companyDropdownOpen ? "rotate-180" : ""}`}
                    />
                  </button>
                  {companyDropdownOpen && (
                    <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-[#E2E8F0] rounded-xl shadow-xl z-30 max-h-56 overflow-y-auto">
                      {uniqueCompanies.map((c) => (
                        <button
                          key={c._id}
                          type="button"
                          onClick={() => {
                            setSelectedCompanyName(c.name);
                            setSelectedJobIds([]); // roles reset
                            setCompanyDropdownOpen(false);
                          }}
                          className={`w-full text-left px-4 py-2.5 text-sm transition-colors border-b border-[#F1F5F9] last:border-b-0
                  ${
                    c.name === selectedCompanyName
                      ? "bg-[#EFF3FA] text-[#1a3a8f] font-semibold"
                      : "text-[#1E293B] hover:bg-[#F8FAFC]"
                  }`}
                        >
                          {c.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Step 2 — Role select (sirf tab dikhao jab company select ho) */}
              {selectedCompanyName && (
                <div>
                  <p className="text-xs font-semibold text-[#64748B] uppercase tracking-widest mb-2">
                    Step 2 — Select Role(s)
                  </p>
                  <div className="flex flex-col gap-2">
                    {rolesForCompany.map((rg) => (
                      <label
                        key={rg._id}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl border cursor-pointer transition-all
    ${
      selectedJobIds.includes(rg._id)
        ? "border-[#1a3a8f] bg-[#EFF3FA]"
        : "border-[#E2E8F0] bg-white hover:border-[#1a3a8f]/40"
    }`}
                      >
                        <input
                          type="checkbox"
                          checked={selectedJobIds.includes(rg._id)}
                          onChange={(e) => {
                            setSelectedJobIds((prev) =>
                              e.target.checked
                                ? [...prev, rg._id]
                                : prev.filter((id) => id !== rg._id),
                            );
                          }}
                          className="w-4 h-4 accent-[#1a3a8f]"
                        />
                        <span className="text-sm font-medium text-[#1E293B]">
                          {rg.role}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Start button */}
              <button
                onClick={handleStartSession}
                disabled={
                  selectedJobIds.length === 0 || starting || checkingSession
                }
                className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#1a3a8f] text-white text-sm font-semibold hover:bg-[#0d1b5e] transition-colors disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto self-end"
              >
                <PlayCircle size={16} />
                {checkingSession
                  ? "Checking..."
                  : starting
                    ? "Starting..."
                    : "Start Session"}
              </button>
            </div>
          )}
          {checkingSession && (
            <p className="text-xs text-[#94A3B8] mt-2">
              Checking if this drive already has a live session...
            </p>
          )}
        </div>
      )}

      {sessionId && (
        <>
          {/* ── Session header ── */}
          <div className="bg-white rounded-2xl border border-[#E2E8F0] p-4 sm:p-5 shadow-sm mb-6 flex items-center justify-between flex-wrap gap-3">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-widest text-[#64748B]">
                Active Drive
              </p>
              <p className="text-sm font-bold text-[#1E293B] mt-0.5 break-words">
                {selectedCompanyName
                  ? `${selectedCompanyName} — ${rolesForCompany
                      .filter((rg) => selectedJobIds.includes(rg._id))
                      .map((rg) => rg.role)
                      .join(", ")}`
                  : "—"}
              </p>
            </div>
            <span
              className={`px-3 py-1 rounded-full text-xs font-semibold shrink-0 ${
                isClosed
                  ? "bg-gray-100 text-gray-600 border border-gray-300"
                  : "bg-green-100 text-green-700 border border-green-300"
              }`}
            >
              {isClosed ? "Closed" : "Live"}
            </span>
          </div>

          <div className="grid md:grid-cols-2 gap-4 sm:gap-6 mb-6">
            {/* ── 2. QR Code Display ── */}
            <div className="bg-white rounded-2xl border border-[#E2E8F0] p-4 sm:p-6 shadow-sm flex flex-col items-center">
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
                    className="w-56 h-56 sm:w-72 sm:h-72 rounded-xl border border-[#E2E8F0]"
                  />
                  <p className="text-xs text-[#94A3B8] mt-4">
                    QR refreshes automatically every 10 seconds
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
            <div className="bg-white rounded-2xl border border-[#E2E8F0] p-4 sm:p-6 shadow-sm">
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
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#1a3a8f] text-white text-sm font-semibold hover:bg-[#0d1b5e] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <CheckCircle2 size={15} />
                {marking ? "Marking..." : "Mark Attendance"}
              </button>
            </div>
          </div>

          {/* ── 3. Live Attendance List ── */}
          <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm mb-6 overflow-hidden">
            <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-[#F1F5F9] gap-2">
              <h2 className="text-sm font-bold text-[#1E293B] flex items-center gap-2">
                <Users size={16} /> Live Attendance
              </h2>
              <span className="text-xs font-bold text-[#1a3a8f] bg-[#EFF3FA] border border-[#B8C6E3] px-2.5 py-1 rounded-lg shrink-0">
                {records.length} present
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[520px]">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200 text-left text-gray-500 text-xs uppercase tracking-wide">
                    <th className="px-3 sm:px-6 py-3 font-medium">Name</th>
                    <th className="px-3 sm:px-6 py-3 font-medium hidden sm:table-cell">
                      ERP ID
                    </th>
                    <th className="px-3 sm:px-6 py-3 font-medium hidden sm:table-cell">
                      Course
                    </th>
                    <th className="px-3 sm:px-6 py-3 font-medium">Time</th>
                    <th className="px-3 sm:px-6 py-3 font-medium">Mode</th>
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
                        <td className="px-3 sm:px-6 py-3 font-medium text-gray-800">
                          {r.studentId?.name || "—"}
                        </td>
                        <td className="px-3 sm:px-6 py-3 text-gray-500 font-mono text-xs hidden sm:table-cell">
                          {r.studentId?.userId?.erpId || "—"}
                        </td>
                        <td className="px-3 sm:px-6 py-3 text-gray-600 hidden sm:table-cell">
                          {r.studentId?.course || "—"}
                        </td>
                        <td className="px-3 sm:px-6 py-3 text-gray-500">
                          <span className="flex items-center gap-1.5 whitespace-nowrap">
                            <Clock size={12} />
                            {r.markedAt
                              ? new Date(r.markedAt).toLocaleTimeString(
                                  "en-IN",
                                  {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  },
                                )
                              : "—"}
                          </span>
                        </td>
                        <td className="px-3 sm:px-6 py-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${
                              r.mode === "Manual"
                                ? "bg-amber-100 text-amber-700 border border-amber-300"
                                : "bg-[#EFF3FA] text-[#1a3a8f] border border-[#B8C6E3]"
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
          <div className="flex flex-col gap-3 mb-10">
            {/* Course-wise buttons */}
            {uniqueCourses.length > 1 && (
              <div className="bg-white rounded-2xl border border-[#E2E8F0] p-4 shadow-sm">
                <p className="text-xs font-semibold text-[#64748B] uppercase tracking-widest mb-3">
                  Download by Course
                </p>
                <div className="flex flex-wrap gap-2">
                  {uniqueCourses.map((course) => (
                    <button
                      key={course}
                      onClick={() => handleDownloadPDF(course)}
                      disabled={downloading}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#CBD5E1] text-xs font-medium text-[#1E293B] hover:bg-[#F8FAFC] transition-colors disabled:opacity-50"
                    >
                      <Download size={12} />
                      {course}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Main actions */}
            <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-3">
              {!isClosed && (
                <button
                  onClick={handleCloseSession}
                  disabled={closing}
                  className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-red-200 text-red-600 text-sm font-semibold hover:bg-red-50 transition-colors disabled:opacity-50"
                >
                  <StopCircle size={16} />
                  {closing ? "Closing..." : "Close Session"}
                </button>
              )}
              <button
                onClick={() => handleDownloadPDF()}
                disabled={downloading}
                className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#1a3a8f] text-white text-sm font-semibold hover:bg-[#0d1b5e] transition-colors disabled:opacity-50"
              >
                <Download size={16} />
                {downloading ? "Downloading..." : "Download All PDF"}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
