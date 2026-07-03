import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../utils/api";

// ─── Design Tokens ───────────────────────────────────────────
const C = {
  primary: "#3B82F6",
  accent: "#60A5FA",
  background: "#F1F5F9",
  textMain: "#0F172A",
  textMuted: "#64748B",
  success: "#22C55E",
  warning: "#F59E0B",
  danger: "#EF4444",
  white: "#FFFFFF",
  border: "#E2E8F0",
};

// Rotates through a small set of icons/colors for however many
// announcements come back from the server (server has no icon field).
const announcementIconPool = [
  (
    <svg viewBox="0 0 24 24" fill="none" stroke={C.primary} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <path d="M3 11l19-9-9 19-2-8-8-2z" />
    </svg>
  ),
  (
    <svg viewBox="0 0 24 24" fill="none" stroke={C.warning} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  ),
  (
    <svg viewBox="0 0 24 24" fill="none" stroke={C.accent} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
      <path d="M6 12v5c3 3 9 3 12 0v-5" />
    </svg>
  ),
  (
    <svg viewBox="0 0 24 24" fill="none" stroke={C.success} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 01-3.46 0" />
    </svg>
  ),
];

// Colors cycled for company avatar tiles since job postings usually
// don't carry a hex color from the backend.
const companyColorPool = ["#3B82F6", "#0EA5E9", "#F59E0B", "#6366F1", "#EF4444", "#10B981", "#8B5CF6", "#EC4899"];

// ─── Sub-components ──────────────────────────────────────────
function LocationIcon() {
  return (
    <svg className="w-3.5 h-3.5 inline mr-1" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg className="w-3.5 h-3.5 inline mr-1" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

// ctc is stored as a plain Number on JobPosting with no fixed unit. If it's
// a large number (>=1000) it's almost certainly an absolute annual rupee
// figure, so convert to LPA; otherwise assume it's already in LPA.
function formatCtc(ctc) {
  if (ctc === undefined || ctc === null) return "Not disclosed";
  const lpa = ctc >= 1000 ? ctc / 100000 : ctc;
  const formatted = Number.isInteger(lpa) ? lpa : lpa.toFixed(1);
  return `₹${formatted} LPA`;
}

function CompanyCard({ job, index }) {
  const navigate = useNavigate();
  const color = companyColorPool[index % companyColorPool.length];
  const name = job.companyId?.name || "Company";
  const role = job.role || "Open Position";
  const location = job.location || "—";
  const ctcLabel = formatCtc(job.ctc);
  const dateLabel = job.lastDate
    ? new Date(job.lastDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
    : "—";
  const jobId = job._id;
  const initial = name.charAt(0).toUpperCase();

  return (
    <div style={{ backgroundColor: C.white, borderColor: C.border }} className="rounded-2xl p-5 shadow-sm border hover:shadow-md transition-shadow duration-200">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div style={{ backgroundColor: color }} className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg shrink-0">
            {initial}
          </div>
          <div>
            <h3 style={{ color: C.textMain }} className="font-semibold text-base leading-tight">{name}</h3>
            <p style={{ color: C.textMuted }} className="text-sm">{role}</p>
          </div>
        </div>
        <span style={{ color: C.success, borderColor: "#BBF7D0", backgroundColor: "#F0FDF4" }} className="text-xs font-medium border px-2.5 py-1 rounded-full">
          Eligible
        </span>
      </div>

      <div style={{ color: C.textMuted }} className="flex items-center gap-4 text-sm mb-4">
        <span><LocationIcon />{location}</span>
        <span><CalendarIcon />{dateLabel}</span>
      </div>

      <div style={{ borderColor: C.background }} className="flex items-center justify-between pt-3 border-t">
        <div>
          <p style={{ color: C.textMuted }} className="text-xs mb-0.5">Package</p>
          <p style={{ color: C.textMain }} className="font-bold text-base">{ctcLabel}</p>
        </div>
        <button
          onClick={() => navigate(`/student/companies/${jobId}`)}
          style={{ backgroundColor: C.primary }}
          className="hover:opacity-90 text-white cursor-pointer px-5 py-2.5 rounded-full text-sm font-medium flex items-center gap-1.5 transition-opacity duration-150"
        >
          View Details
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
}

// ─── Response-shape helpers ───────────────────────────────────
// jobController/applicationController return raw arrays directly
// (res.json(jobs)), so this mainly guards against a failed/odd response.
// Announcement route's exact shape isn't confirmed, so it stays flexible.
function unwrapList(res, key) {
  if (Array.isArray(res)) return res;
  if (!res || typeof res !== "object") return [];
  if (Array.isArray(res.data)) return res.data;
  if (key && Array.isArray(res[key])) return res[key];
  return [];
}

// ── Announcement display helpers (mirrors AnnouncementManagementPage.jsx) ──
const ANN_TYPE_CONFIG = {
  Urgent: { badge: "bg-rose-100 text-rose-700", dot: "#f43f5e" },
  Important: { badge: "bg-amber-100 text-amber-700", dot: "#f59e0b" },
  General: { badge: "bg-sky-100 text-sky-700", dot: "#0ea5e9" },
};

// Short label for a school name, e.g. "School of Engineering & Computing (SoEC)" -> "SoEC"
function schoolShort(name) {
  return name?.match(/\(([^)]+)\)/)?.[1] || name || "";
}

function normalizeTargetSchools(target) {
  if (!target) return [];
  if (Array.isArray(target.schools) && target.schools.length) {
    return target.schools.map((s) => (typeof s === "string" ? { school: s, courses: [] } : s));
  }
  if (target.school) return [{ school: target.school, courses: [] }];
  return [];
}

// Human readable summary of who an announcement targets — same logic as
// the coordinator's own card, so students see exactly what was set.
function targetLabel(target) {
  if (!target || target.all) return "All Students";
  const schools = normalizeTargetSchools(target);
  if (!schools.length) return "All Students";
  if (schools.length === 1) return schoolShort(schools[0].school);
  return `${schools.length} Schools`;
}

// Parses a "YYYY-MM-DD" date string as LOCAL time (avoids the UTC-parsing
// day-shift bug) and returns "Friday, 03/07/2026".
function formatDayDate(dateStr) {
  if (!dateStr) return "—";
  const [y, m, d] = dateStr.split("-").map(Number);
  if (!y || !m || !d) return "—";
  const dt = new Date(y, m - 1, d);
  if (isNaN(dt)) return "—";
  const day = dt.toLocaleDateString("en-IN", { weekday: "long" });
  const dd = String(d).padStart(2, "0");
  const mm = String(m).padStart(2, "0");
  return `${day}, ${dd}/${mm}/${y}`;
}

function getAnnId(ann) {
  return ann?.id ?? ann?._id ?? ann?.announcementId ?? ann?.uuid ?? null;
}

// Announcement targeting per the real schema:
//   target: { all: Boolean, schools: [{ school: String, courses: [String] }] }
// If target.all is true (or target is missing), it's meant for everyone.
// Otherwise only show it if the student's school appears in target.schools.
// (Course-level targeting inside each school is available as
// `entry.courses` if you later want to also match student.course.)
function isAnnouncementForStudent(ann, student) {
  const target = ann.target;
  if (!target || target.all) return true;
  const schoolEntries = Array.isArray(target.schools) ? target.schools : [];
  if (schoolEntries.length === 0) return true; // nothing configured => open to all
  if (!student?.school) return true;
  return schoolEntries.some((entry) => entry.school === student.school);
}

// Job eligibility: JobPosting.eligibleSchools is an array of school names.
// Empty array => coordinator didn't restrict by school => open to everyone.
function isJobForStudent(job, student) {
  const targets = job.eligibleSchools;
  if (!Array.isArray(targets) || targets.length === 0) return true;
  if (!student?.school) return true;
  return targets.includes(student.school);
}

function jobSortDate(job) {
  const raw = job.createdAt;
  const d = raw ? new Date(raw) : null;
  return d && !isNaN(d) ? d.getTime() : 0;
}

const POLL_INTERVAL_MS = 6000; // matches the polling interval used on StudentApplication

// ─── Main Component ───────────────────────────────────────────
export default function PlacementDashboard() {
  const navigate = useNavigate();

  const [announcements, setAnnouncements] = useState([]);
  const [announcementsLoading, setAnnouncementsLoading] = useState(true);
  const [announcementsError, setAnnouncementsError] = useState("");

  const [jobs, setJobs] = useState([]);
  const [jobsLoading, setJobsLoading] = useState(true);
  const [jobsError, setJobsError] = useState("");

  const [applications, setApplications] = useState([]);
  const [applicationsLoading, setApplicationsLoading] = useState(true);

  const student = JSON.parse(localStorage.getItem("student") || "{}");
  const todayLabel = new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
  const isFirstLoad = useRef(true);

  const fetchAll = useCallback(async () => {
    try {
      if (isFirstLoad.current) {
        setAnnouncementsLoading(true);
        setJobsLoading(true);
        setApplicationsLoading(true);
      }
      setAnnouncementsError("");
      setJobsError("");

      const [annRes, jobsRes, appsRes] = await Promise.allSettled([
        api.get("/announcements"),
        api.get("/jobs"),
        api.get("/applications/my"),
      ]);

      if (annRes.status === "fulfilled") {
        setAnnouncements(unwrapList(annRes.value, "announcements"));
      } else {
        setAnnouncementsError("Could not load announcements.");
      }

      if (jobsRes.status === "fulfilled") {
        setJobs(unwrapList(jobsRes.value, "jobs"));
      } else {
        setJobsError("Could not load companies.");
      }

      if (appsRes.status === "fulfilled") {
        const raw = unwrapList(appsRes.value, "applications");
        // Same guard as StudentApplication.jsx: drop applications whose
        // job/company reference is broken (e.g. company was deleted).
        const valid = raw.filter((a) => a.jobId && a.jobId.companyId && a.jobId.companyId.name);
        setApplications(valid);
      }
    } finally {
      if (isFirstLoad.current) {
        setAnnouncementsLoading(false);
        setJobsLoading(false);
        setApplicationsLoading(false);
        isFirstLoad.current = false;
      }
    }
  }, []);

  useEffect(() => {
    fetchAll();
    const interval = setInterval(fetchAll, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [fetchAll]);

  // Sorted by createdAt (newest published first) — sorting by the raw
  // date+time strings was unreliable since time is stored as 12hr
  // "hh:mm AM/PM" text, which doesn't compare correctly as a string
  // (e.g. "10:15 AM" sorts after "02:30 PM" lexicographically even
  // though 10:15 AM is earlier in the day).
  const visibleAnnouncements = announcements
    .filter((a) => a.status === "Published")
    .filter((a) => isAnnouncementForStudent(a, student))
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  // Only jobs eligible for this student's school, latest 4 for the dashboard.
  const eligibleJobs = jobs
    .filter((j) => isJobForStudent(j, student))
    .sort((a, b) => jobSortDate(b) - jobSortDate(a));
  const latestFourJobs = eligibleJobs.slice(0, 4);

  // "Applied" = total number of applications submitted, regardless of
  // current status (mirrors the "Applied" tab logic in StudentApplication.jsx).
  const appliedCount = applications.length;
  const selectedCount = applications.filter((a) => a.status === "Selected").length;

  return (
    <div style={{ backgroundColor: C.background }} className="min-h-screen font-sans">
      <main className="p-8 max-w-7xl mx-auto">
        {/* Hero Banner */}
        <div
          style={{ background: `linear-gradient(135deg, ${C.primary} 0%, ${C.accent} 60%, #818CF8 100%)` }}
          className="rounded-3xl p-8 mb-6 relative overflow-hidden"
        >
          <div className="relative z-10">
            <span className="inline-flex items-center gap-1.5 bg-white/20 text-white text-xs font-medium px-3 py-1.5 rounded-full mb-4">
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.196-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
              Placement Season 2026
            </span>
            <h1 className="text-4xl font-bold text-white mb-1">Hey {student.name},</h1>
            <p className="text-white/80 text-sm mb-3">{todayLabel}</p>
            <p className="text-white/90 text-lg mb-6">
              <span className="font-semibold">{eligibleJobs.length} companies</span> are open for you right now
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => navigate("/student/companies")}
                style={{ backgroundColor: C.white, color: C.primary }}
                className="font-semibold cursor-pointer px-6 py-2.5 rounded-full text-sm flex items-center gap-2 hover:opacity-90 transition-opacity"
              >
                Browse Companies
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
              <button
                onClick={() => navigate("/student/applications")}
                className="bg-white/20 cursor-pointer border border-white/40 text-white font-semibold px-6 py-2.5 rounded-full text-sm hover:bg-white/30 transition-colors"
              >
                My Applications
              </button>
            </div>
          </div>

          <div className="absolute right-8 top-1/2 -translate-y-1/2">
            <div className="w-28 h-28 bg-white/10 rounded-2xl flex items-center justify-center">
              <svg className="w-14 h-14 text-white/70" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5"
                />
              </svg>
            </div>
          </div>

          <div className="absolute top-0 right-48 w-40 h-40 bg-white/5 rounded-full -translate-y-1/2" />
          <div className="absolute bottom-0 left-64 w-24 h-24 bg-white/5 rounded-full translate-y-1/2" />
        </div>

        {/* Stats Row — Interviews box removed, values now come from real data */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div style={{ backgroundColor: C.white, borderColor: C.border }} className="rounded-2xl px-5 py-4 shadow-sm border flex items-center gap-4">
            <div style={{ backgroundColor: "#DCFCE7" }} className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0">
              <svg className="w-6 h-6" fill="none" stroke={C.success} strokeWidth={2.5} viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4" />
              </svg>
            </div>
            <div>
              <p style={{ color: C.textMuted }} className="text-xs font-medium">Selected</p>
              <p style={{ color: C.textMain }} className="text-2xl font-bold">
                {applicationsLoading ? "—" : selectedCount}
              </p>
            </div>
          </div>

          <div style={{ backgroundColor: C.white, borderColor: C.border }} className="rounded-2xl px-5 py-4 shadow-sm border flex items-center gap-4">
            <div style={{ backgroundColor: "#DBEAFE" }} className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0">
              <svg className="w-6 h-6" fill="none" stroke={C.primary} strokeWidth={2} viewBox="0 0 24 24">
                <rect x="2" y="7" width="20" height="14" rx="2" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" />
              </svg>
            </div>
            <div>
              <p style={{ color: C.textMuted }} className="text-xs font-medium">Applied</p>
              <p style={{ color: C.textMain }} className="text-2xl font-bold">
                {applicationsLoading ? "—" : appliedCount}
              </p>
            </div>
          </div>

          <div style={{ backgroundColor: C.white, borderColor: C.border }} className="rounded-2xl px-5 py-4 shadow-sm border flex items-center gap-4">
            <div style={{ backgroundColor: "#EDE9FE" }} className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0">
              <svg className="w-6 h-6" fill="none" stroke="#8B5CF6" strokeWidth={2} viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.196-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                />
              </svg>
            </div>
            <div>
              <p style={{ color: C.textMuted }} className="text-xs font-medium">Profile Score</p>
              {/* NOTE: no dedicated endpoint for this was specified — using
                  student.profileScore if backend provides it, else a dash. */}
              <p style={{ color: C.textMain }} className="text-2xl font-bold">
                {student.profileScore != null ? `${student.profileScore}%` : "—"}
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Grid */}
        <div className="grid grid-cols-3 gap-6">
          {/* Eligible Companies — latest 4 for this student's school */}
          <div className="col-span-2">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 style={{ color: C.textMain }} className="text-xl font-bold">Eligible Companies</h2>
                <p style={{ color: C.textMuted }} className="text-sm">Curated openings matching your profile</p>
              </div>
              <button
                onClick={() => navigate("/student/companies")}
                style={{ color: C.primary }}
                className="text-sm font-medium hover:opacity-80"
              >
                View all
              </button>
            </div>

            {jobsLoading && (
              <p style={{ color: C.textMuted }} className="text-sm py-6 text-center">Loading companies…</p>
            )}
            {!jobsLoading && jobsError && (
              <p style={{ color: C.danger }} className="text-sm py-6 text-center">{jobsError}</p>
            )}
            {!jobsLoading && !jobsError && latestFourJobs.length === 0 && (
              <p style={{ color: C.textMuted }} className="text-sm py-6 text-center">
                No eligible companies right now.
              </p>
            )}
            {!jobsLoading && !jobsError && latestFourJobs.length > 0 && (
              <div className="grid grid-cols-2 gap-4">
                {latestFourJobs.map((job, idx) => (
                  <CompanyCard key={job._id} job={job} index={idx} />
                ))}
              </div>
            )}
          </div>

          {/* Announcements — live, polled every 6s, filtered to student's school */}
          <div>
            <div className="mb-4">
              <h2 style={{ color: C.textMain }} className="text-xl font-bold">Announcements</h2>
              <p style={{ color: C.textMuted }} className="text-sm">Latest from your placement cell</p>
            </div>

            <div style={{ backgroundColor: C.white, borderColor: C.border }} className="rounded-2xl shadow-sm border p-5 mb-4">
              {announcementsLoading && (
                <p style={{ color: C.textMuted }} className="text-sm text-center py-4">Loading announcements…</p>
              )}

              {!announcementsLoading && announcementsError && (
                <p style={{ color: C.danger }} className="text-sm text-center py-4">{announcementsError}</p>
              )}

              {!announcementsLoading && !announcementsError && visibleAnnouncements.length === 0 && (
                <p style={{ color: C.textMuted }} className="text-sm text-center py-4">No announcements yet.</p>
              )}

              {!announcementsLoading && !announcementsError && visibleAnnouncements.length > 0 && (
                <div className="space-y-5">
                  {visibleAnnouncements.map((a, idx) => {
                    const id = getAnnId(a);
                    const isLast = idx === visibleAnnouncements.length - 1;
                    const tc = ANN_TYPE_CONFIG[a.type] || ANN_TYPE_CONFIG.General;
                    return (
                      <div
                        key={id ?? `${a.title}-${idx}`}
                        style={!isLast ? { borderColor: C.border } : {}}
                        className={`flex gap-3 ${!isLast ? "pb-5 border-b" : ""}`}
                      >
                        <div style={{ backgroundColor: C.background }} className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0">
                          {announcementIconPool[idx % announcementIconPool.length]}
                        </div>
                        <div className="flex-1 min-w-0">
                          {/* Type + Target badges — everything the coordinator set, visible here too */}
                          <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${tc.badge}`}>
                              {a.type || "General"}
                            </span>
                            <span style={{ color: C.textMuted, backgroundColor: C.background }} className="text-[10px] font-medium px-2 py-0.5 rounded-full">
                              {targetLabel(a.target)}
                            </span>
                          </div>

                          <p style={{ color: C.textMain }} className="font-semibold text-sm leading-tight mb-1">{a.title}</p>

                          {a.description && (
                            <p style={{ color: C.textMuted }} className="text-xs leading-relaxed mb-1.5">{a.description}</p>
                          )}

                          {a.room && (
                            <p style={{ color: C.textMuted }} className="text-xs leading-relaxed mb-1">📍 {a.room}</p>
                          )}

                          {/* Exact date + time, exactly as the coordinator entered it */}
                          <p style={{ color: C.textMuted }} className="text-[11px] font-medium">
                            {formatDayDate(a.date)}
                            {a.time ? ` · ${a.time}` : ""}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Need Help */}
            <div style={{ backgroundColor: "#EFF6FF", borderColor: "#BFDBFE" }} className="border rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-2">
                <svg className="w-5 h-5" fill="none" stroke={C.primary} strokeWidth={1.8} viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
                  <rect x="9" y="3" width="6" height="4" rx="1" />
                  <line x1="9" y1="12" x2="15" y2="12" />
                  <line x1="9" y1="16" x2="13" y2="16" />
                </svg>
                <p style={{ color: C.textMain }} className="font-semibold">Need help?</p>
              </div>
              <p style={{ color: C.primary }} className="text-sm leading-relaxed mb-4">
                Reach out to your placement coordinator for guidance on applications and interviews.
              </p>
              <button
                style={{ borderColor: C.border, backgroundColor: C.white, color: C.textMain }}
                className="border text-sm font-medium px-4 py-2 rounded-lg hover:opacity-80 transition-opacity"
              >
                Contact Cell
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}