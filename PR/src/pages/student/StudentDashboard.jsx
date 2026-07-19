import { useNavigate } from "react-router-dom";
import { useState, useEffect, useCallback, useRef } from "react";
import { api } from "../../utils/api";
import universityStructure from "../../data/universityStructure";

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

// How many announcements show in the dashboard's compact panel before the
// person has to open "View All" to see the rest.
const ANNOUNCEMENTS_PREVIEW_COUNT = 5;

// Rotates through a small set of icons/colors for however many
// announcements come back from the server (server has no icon field).
const announcementIconPool = [
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke={C.primary}
    strokeWidth={1.8}
    strokeLinecap="round"
    strokeLinejoin="round"
    className="w-5 h-5"
  >
    <path d="M3 11l19-9-9 19-2-8-8-2z" />
  </svg>,
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke={C.warning}
    strokeWidth={1.8}
    strokeLinecap="round"
    strokeLinejoin="round"
    className="w-5 h-5"
  >
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>,
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke={C.accent}
    strokeWidth={1.8}
    strokeLinecap="round"
    strokeLinejoin="round"
    className="w-5 h-5"
  >
    <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
    <path d="M6 12v5c3 3 9 3 12 0v-5" />
  </svg>,
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke={C.success}
    strokeWidth={1.8}
    strokeLinecap="round"
    strokeLinejoin="round"
    className="w-5 h-5"
  >
    <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.73 21a2 2 0 01-3.46 0" />
  </svg>,
];

// Colors cycled for company avatar tiles since job postings usually
// don't carry a hex color from the backend.
const companyColorPool = [
  "#3B82F6",
  "#0EA5E9",
  "#F59E0B",
  "#6366F1",
  "#EF4444",
  "#10B981",
  "#8B5CF6",
  "#EC4899",
];

// ─── Sub-components ──────────────────────────────────────────
function LocationIcon() {
  return (
    <svg
      className="w-3.5 h-3.5 inline mr-1"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
      />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg
      className="w-3.5 h-3.5 inline mr-1"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      viewBox="0 0 24 24"
    >
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
  const [logoError, setLogoError] = useState(false);
  const navigate = useNavigate();
  const color = companyColorPool[index % companyColorPool.length];
  const name = job.companyId?.name || "Company";
  const role = job.role || "Open Position";
  const location = job.location || "—";
  const ctcLabel = formatCtc(job.ctc);
  const dateLabel = job.lastDate
    ? new Date(job.lastDate).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";
  const jobId = job._id;
  const initial = name.charAt(0).toUpperCase();
  const logoUrl = job.companyId?.website
    ? `https://www.google.com/s2/favicons?domain=${job.companyId.website}&sz=64`
    : null;

  return (
    <div
      style={{ backgroundColor: C.white, borderColor: C.border }}
      className="rounded-xl sm:rounded-2xl p-3 sm:p-5 shadow-sm border hover:shadow-lg hover:-translate-y-1 transition-all duration-200"
    >
      <div className="flex items-start justify-between mb-3 gap-2 flex-wrap">
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
          {logoUrl && !logoError ? (
            <img
              src={logoUrl}
              alt={name}
              onError={() => setLogoError(true)}
              className="w-8 h-8 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl object-contain bg-white border border-[#E2E8F0] p-1 sm:p-2 shrink-0"
            />
          ) : (
            <div
              style={{ backgroundColor: color }}
              className="w-8 h-8 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl flex items-center justify-center text-white font-bold text-sm sm:text-lg shrink-0"
            >
              {initial}
            </div>
          )}
          <div className="min-w-0">
            <h3
              style={{ color: C.textMain }}
              className="font-semibold text-sm sm:text-base leading-tight truncate"
            >
              {name}
            </h3>
            <p
              style={{ color: C.textMuted }}
              className="text-xs sm:text-sm truncate"
            >
              {role}
            </p>
          </div>
        </div>
        {(() => {
          // Days-left counting starts from TOMORROW, not today. `daysLeft`
          // (from getDaysLeft) is the raw exclusive gap — 0 means the
          // deadline is today. That raw value drives both the urgency
          // classification and what's shown; when it's 0 we show
          // "Today · Last day" instead of a bare "Today".
          const daysLeft = job.lastDate ? getDaysLeft(job.lastDate) : null;
          const urgent = daysLeft !== null && daysLeft >= 0 && daysLeft <= 3;
          return (
            <span
              style={
                urgent
                  ? {
                      color: C.danger,
                      borderColor: "#FECACA",
                      backgroundColor: "#FEF2F2",
                    }
                  : {
                      color: C.success,
                      borderColor: "#BBF7D0",
                      backgroundColor: "#F0FDF4",
                    }
              }
              className="text-xs font-medium border px-2.5 py-1 rounded-full whitespace-nowrap shrink-0"
            >
              {urgent
                ? daysLeft === 0
                  ? "Today · Last day"
                  : `${daysLeft}d left`
                : "Eligible"}
            </span>
          );
        })()}
      </div>

      <div
        style={{ color: C.textMuted }}
        className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm mb-4"
      >
        <span>
          <LocationIcon />
          {location}
        </span>
        <span>
          <CalendarIcon />
          {dateLabel}
        </span>
      </div>

      <div
        style={{ borderColor: C.background }}
        className="flex flex-col xs:flex-row xs:items-center justify-between gap-2 pt-3 border-t"
      >
        <div>
          <p style={{ color: C.textMuted }} className="text-xs mb-0.5">
            Package
          </p>
          <p
            style={{ color: C.textMain }}
            className="font-bold text-sm sm:text-base"
          >
            {ctcLabel}
          </p>
        </div>
        <button
          onClick={() => navigate(`/student/companies/${jobId}`)}
          style={{ backgroundColor: C.primary }}
          className="hover:opacity-90 text-white cursor-pointer px-3 py-2 sm:px-5 sm:py-2.5 rounded-full text-xs sm:text-sm font-medium flex items-center justify-center gap-1 sm:gap-1.5 transition-all duration-200 group whitespace-nowrap w-full xs:w-auto"
        >
          View Details
          <svg
            className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.5}
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 5l7 7-7 7"
            />
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
    return target.schools.map((s) =>
      typeof s === "string" ? { school: s, courses: [] } : s,
    );
  }
  if (target.school) return [{ school: target.school, courses: [] }];
  return [];
}

// Human readable summary of who an announcement targets — same logic as
// the coordinator's own card, so students see exactly what was set.
// - A school that's fully selected (every course under it) shows as its
//   short name, e.g. "SoEC".
// - A school that's only partially selected (a subset of its courses)
//   shows those individual course names instead, e.g. "B.Tech CSE, BBA".
// - Multiple entries are joined with commas — never a generic "3 Schools".
function targetLabel(target) {
  if (!target || target.all) return "All Students";
  const schools = normalizeTargetSchools(target);
  if (!schools.length) return "All Students";

  const parts = [];
  schools.forEach(({ school, courses }) => {
    const schoolObj = universityStructure.find((s) => s.school === school);
    const total = schoolObj
      ? (schoolObj.departments || []).flatMap((d) => d.courses || [])
      : [];
    // Legacy entries with no explicit course list are treated as "whole school".
    const selected = courses && courses.length ? courses : total;

    if (total.length > 0 && selected.length === total.length) {
      parts.push(schoolShort(school));
    } else {
      parts.push(...selected);
    }
  });

  return parts.length ? parts.join(", ") : "All Students";
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

// Job eligibility: JobPosting has BOTH eligibleSchools and eligibleCourses
// arrays (separate restrictions). A job is open to this student only if it
// passes both checks — school-only matching (what was here before) was
// letting through jobs open for the student's school but restricted to a
// different course, which is why the "X companies open" count was too high.
// Each check independently: empty array or missing student field => that
// particular restriction doesn't apply (open to everyone on that axis).
function isJobForStudent(job, student) {
  const schoolTargets = job.eligibleSchools;
  const schoolOk =
    !Array.isArray(schoolTargets) ||
    schoolTargets.length === 0 ||
    !student?.school ||
    schoolTargets.includes(student.school);

  const courseTargets = job.eligibleCourses;
  const courseOk =
    !Array.isArray(courseTargets) ||
    courseTargets.length === 0 ||
    !student?.course ||
    courseTargets.includes(student.course);

  return schoolOk && courseOk;
}

function jobSortDate(job) {
  const raw = job.createdAt;
  const d = raw ? new Date(raw) : null;
  return d && !isNaN(d) ? d.getTime() : 0;
}

function isStillOpen(job) {
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
}
const getDaysLeft = (lastDate) => {
  const now = new Date();
  const deadline = new Date(lastDate);
  // Last date ka end of day — 23:59:59
  deadline.setHours(23, 59, 59, 999);
  const diff = deadline - now;
  if (diff < 0) return -1; // expired
  return Math.floor(diff / 86400000); // floor, ceil nahi
};
const POLL_INTERVAL_MS = 6000; // matches the polling interval used on StudentApplication
// Rotating, time-of-day-aware greeting — mirrors "Claude-style" personality
// touches. Picks a random line from the matching time bucket each time the
// dashboard mounts, occasionally swapping in a placement-specific line for
// variety. Memoized so it doesn't change on every re-render/poll tick.
const GREETINGS = {
  morning: [
    "Early start? Nice",
    "Ready to make progress?",
    "Fresh day, fresh opportunities",
  ],
  afternoon: [
    "Back at it?",
    "Making the most of the day?",
    "What's next on the agenda?",
  ],
  evening: [
    "Wrapping up with one more win?",
    "Evening grind?",
    "Let's end the day on a productive note",
  ],
  lateNight: [
    "Night owl?",
    "Burning the midnight oil?",
    "Late-night hustle?",
    "Still chasing that dream offer?",
    "One last task before calling it a day?",
  ],
};

const PLACEMENT_LINES = [
  "Which company are we aiming for today?",
  "Another step toward your placement",
  "Ready to land your next opportunity?",
  "Let's move closer to your dream company",
  "Opportunities are waiting",
  "What's your next career move?",
];

const DAILY_TIPS = [
  "Tailor your resume for each company — recruiters spot generic ones instantly.",
  "Research the company before your interview — ask questions that show it.",
  "Keep your LinkedIn updated, recruiters check it before shortlisting.",
  "Mock interviews reduce nerves more than any amount of reading.",
  "Follow up politely after interviews — it shows genuine interest.",
  "A clean, one-page resume beats a cluttered two-pager.",
  "Learn to explain your projects or work in 60 seconds — recruiters are busy.",
  "Apply broadly early on, then narrow down as offers come in.",
  "Dress and speak the way the role expects — first impressions matter.",
  "Ask thoughtful questions at the end of every interview.",
  "Confidence comes from preparation — know your own resume inside out.",
  "Small talk before an interview counts too — be genuinely present.",
  "Don't undersell your internships or projects — quantify your impact.",
  "Punctuality signals reliability — always join interviews a few minutes early.",
];

function pickDailyTip() {
  return DAILY_TIPS[Math.floor(Math.random() * DAILY_TIPS.length)];
}

function getTimeBucket(date) {
  const h = date.getHours();
  if (h >= 5 && h < 12) return "morning";
  if (h >= 12 && h < 17) return "afternoon";
  if (h >= 17 && h < 21) return "evening";
  return "lateNight";
}

function pickGreeting() {
  const bucket = getTimeBucket(new Date());
  // ~35% chance to show a placement-specific line instead of the
  // time-bucket one, for variety without losing the time-of-day feel.
  const pool = Math.random() < 0.35 ? PLACEMENT_LINES : GREETINGS[bucket];
  return pool[Math.floor(Math.random() * pool.length)];
}

function AnnouncementItem({ a, isLast }) {
  const isNew =
    a.createdAt &&
    Date.now() - new Date(a.createdAt).getTime() < 24 * 60 * 60 * 1000;
  const tc = ANN_TYPE_CONFIG[a.type] || ANN_TYPE_CONFIG.General;
  return (
    <div
      style={!isLast ? { borderColor: C.border } : {}}
      className={`flex gap-3 ${!isLast ? "pb-5 border-b" : ""}`}
    >
      <div
        style={{ backgroundColor: C.background }}
        className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
      >
        {announcementIconPool[0]}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
          <span
            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${tc.badge}`}
          >
            {a.type || "General"}
          </span>
          {isNew && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-600 text-white animate-pulse">
              New
            </span>
          )}
          <span
            style={{
              color: C.textMuted,
              backgroundColor: C.background,
            }}
            className="text-[10px] font-medium px-2 py-0.5 rounded-full"
          >
            {targetLabel(a.target)}
          </span>
        </div>

        <p
          style={{ color: C.textMain }}
          className="font-semibold text-sm leading-tight mb-1"
        >
          {a.title}
        </p>

        {a.description && (
          <p
            style={{ color: C.textMuted }}
            className="text-xs leading-relaxed mb-1.5"
          >
            {a.description}
          </p>
        )}

        {a.room && (
          <p
            style={{ color: C.textMuted }}
            className="text-xs leading-relaxed mb-1"
          >
            📍 {a.room}
          </p>
        )}

        <p style={{ color: C.textMuted }} className="text-[11px] font-medium">
          {formatDayDate(a.date)}
          {a.time ? ` · ${a.time}` : ""}
        </p>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────
export default function PlacementDashboard() {
  const navigate = useNavigate();

  const [announcements, setAnnouncements] = useState([]);
  const [announcementsLoading, setAnnouncementsLoading] = useState(true);
  const [announcementsError, setAnnouncementsError] = useState("");
  const [showAnnouncementHistory, setShowAnnouncementHistory] = useState(false);

  const [jobs, setJobs] = useState([]);
  const [jobsLoading, setJobsLoading] = useState(true);
  const [jobsError, setJobsError] = useState("");

  const [applications, setApplications] = useState([]);
  const [applicationsLoading, setApplicationsLoading] = useState(true);
  const [greeting] = useState(() => {
    const cached = sessionStorage.getItem("placerise_greeting");
    if (cached) return cached;
    const fresh = pickGreeting();
    sessionStorage.setItem("placerise_greeting", fresh);
    return fresh;
  });
  const [dailyTip] = useState(() => {
    const cached = sessionStorage.getItem("placerise_tip");
    if (cached) return cached;
    const fresh = pickDailyTip();
    sessionStorage.setItem("placerise_tip", fresh);
    return fresh;
  });

  const student = JSON.parse(localStorage.getItem("student") || "{}");
  const currentYear = new Date().getFullYear();
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

      const [annRes, jobsRes, appsRes, studentRes] = await Promise.allSettled([
        api.get("/announcements"),
        api.get("/companies/jobs"),
        api.get("/applications/my"),
        api.get("/students/me"),
      ]);

      if (annRes.status === "fulfilled") {
        setAnnouncements(unwrapList(annRes.value, "announcements"));
      } else {
        setAnnouncementsError("Could not load announcements.");
      }

      if (jobsRes.status === "fulfilled" && studentRes.status === "fulfilled") {
        const allJobs = unwrapList(jobsRes.value, "jobs");
        const studentData = studentRes.value; // direct value, unwrap nahi

        const eligible = allJobs.filter((j) => {
          if (!j.companyId || !j.companyId._id) return false;
          if (!j.eligibleBranches || j.eligibleBranches.length === 0)
            return true;
          if (j.eligibleBranches.includes("All")) return true;
          return (
            j.eligibleBranches.includes(studentData?.course) ||
            j.eligibleBranches.includes(studentData?.branch)
          );
        });

        setJobs(eligible);
      } else {
        setJobsError("Could not load companies.");
      }

      if (appsRes.status === "fulfilled") {
        const raw = unwrapList(appsRes.value, "applications");
        // Same guard as StudentApplication.jsx: drop applications whose
        // job/company reference is broken (e.g. company was deleted).
        const valid = raw.filter(
          (a) => a.jobId && a.jobId.companyId && a.jobId.companyId.name,
        );
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
    const interval = setInterval(() => {
      if (!document.hidden) fetchAll();
    }, POLL_INTERVAL_MS);
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

  // Compact dashboard panel only shows the most recent few — the rest are
  // one click away in the "View All" history modal, not gone.
  const previewAnnouncements = visibleAnnouncements.slice(
    0,
    ANNOUNCEMENTS_PREVIEW_COUNT,
  );
  const hasMoreAnnouncements =
    visibleAnnouncements.length > ANNOUNCEMENTS_PREVIEW_COUNT;

  // A job posting whose company was deleted still exists in the DB, but
  // populate("companyId") comes back null for it — those must never show
  // up or count as "open", so this drops them before anything else runs.
  const isCompanyStillActive = (job) =>
    Boolean(job.companyId && job.companyId.name);

  // Only jobs eligible for this student's school+course, AND whose
  // application deadline (lastDate) hasn't passed yet — a job posting past
  // its lastDate shouldn't count as "open" even if status is still Active
  // in the DB (coordinator may not always flip status to Closed manually).
  const eligibleJobs = jobs
    .filter(isCompanyStillActive)
    .filter((j) => isJobForStudent(j, student))
    .filter(isStillOpen)
    .sort((a, b) => jobSortDate(b) - jobSortDate(a));

  const trendingSkills = (() => {
    const counts = {};
    eligibleJobs.forEach((j) => {
      (j.skills || []).forEach((s) => {
        counts[s] = (counts[s] || 0) + 1;
      });
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
  })();

  const closingSoonJobs = eligibleJobs.filter((j) => {
    if (!j.lastDate) return false;

    const days = getDaysLeft(j.lastDate);
    return days >= 0 && days <= 2;
  });

  const nearestClosingDays = closingSoonJobs.length
    ? Math.min(...closingSoonJobs.map((j) => getDaysLeft(j.lastDate)))
    : 0;

  const latestFourJobs = eligibleJobs.slice(0, 4);

  // "X companies are open" counts each eligible, still-open job posting —
  // if the same company has 2 roles matching the student's course, that's
  // 2 separate listings the student can apply to, so it counts as 2.

  // "Applied" = total number of applications submitted, regardless of
  // current status (mirrors the "Applied" tab logic in StudentApplication.jsx).
  const appliedCount = applications.length;
  const selectedCount = applications.filter(
    (a) => a.status === "Selected",
  ).length;

  return (
    <div
      style={{ backgroundColor: C.background }}
      className="min-h-screen font-sans"
    >
      <main className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto">
        {/* Hero Banner */}
        <div
          style={{
            background:
              "linear-gradient(135deg, #1D4ED8 0%, #2563EB 45%, #0EA5E9 100%)",
          }}
          className="relative overflow-hidden rounded-2xl sm:rounded-3xl mb-6 px-4 py-6 sm:px-6 sm:py-7 md:px-8 md:py-8 shadow-lg shadow-blue-900/10"
        >
          {/* Subtle dot-grid pattern — professional, low-opacity texture */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage:
                "radial-gradient(circle, rgba(255,255,255,0.35) 1px, transparent 1px)",
              backgroundSize: "22px 22px",
              opacity: 0.35,
            }}
          />
          {/* Soft diagonal line accent, bottom-right */}
          <svg
            className="absolute bottom-0 right-0 w-72 h-72 pointer-events-none opacity-[0.08]"
            viewBox="0 0 200 200"
            fill="none"
          >
            <path d="M0 150 L200 0" stroke="white" strokeWidth="1" />
            <path d="M0 170 L200 20" stroke="white" strokeWidth="1" />
            <path d="M0 190 L200 40" stroke="white" strokeWidth="1" />
            <path d="M0 130 L180 0" stroke="white" strokeWidth="1" />
          </svg>
          <div className="relative z-10">
            <span className="inline-flex items-center gap-1.5 bg-white/20 text-white text-[10px] sm:text-xs font-medium px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full mb-3 sm:mb-4">
              <svg
                className="w-3.5 h-3.5"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.196-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
              Placement Season {currentYear}
            </span>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-1">
              {greeting}, {student.name}
            </h1>
            <p className="text-white/70 text-sm mb-3">{todayLabel}</p>
            <p className="text-white/90 text-sm sm:text-base md:text-lg mb-6">
              <span className="font-semibold">
                {eligibleJobs.length} companies
              </span>{" "}
              are open for you right now
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => navigate("/student/companies")}
                style={{ backgroundColor: C.white, color: C.primary }}
                className="font-semibold cursor-pointer px-6 py-2.5 rounded-full text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-opacity whitespace-nowrap w-full sm:w-auto"
              >
                Browse Companies
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2.5}
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>
              <button
                onClick={() => navigate("/student/applications")}
                className="bg-white/20 cursor-pointer border border-white/40 text-white font-semibold px-6 py-2.5 rounded-full text-sm hover:bg-white/30 transition-colors whitespace-nowrap w-full sm:w-auto"
              >
                My Applications
              </button>
            </div>

            {!applicationsLoading && selectedCount > 0 && (
              <button
                onClick={() => navigate("/student/applications")}
                className="mt-4 flex items-center gap-2.5 bg-white/15 hover:bg-white/25 border border-white/25 text-white text-sm font-medium px-4 py-2.5 rounded-xl transition-colors cursor-pointer w-fit"
              >
                <svg
                  className="w-4 h-4 shrink-0"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.196-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
                <span>
                  You're selected in{" "}
                  <span className="font-bold">{selectedCount}</span>{" "}
                  {selectedCount === 1 ? "company" : "companies"}
                </span>
              </button>
            )}
          </div>

          <div className="absolute right-8 top-1/2 -translate-y-1/2 hidden md:block">
            <div className="w-28 h-28 bg-white/10 rounded-2xl flex items-center justify-center">
              <svg
                className="w-14 h-14 text-white/70"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.5}
                viewBox="0 0 24 24"
              >
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

        {closingSoonJobs.length > 0 && (
          <div
            style={{ backgroundColor: "#FEF2F2", borderColor: "#FECACA" }}
            className="border rounded-2xl px-4 py-3 sm:px-5 mb-6 flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3"
          >
            <span className="text-xl shrink-0">⏰</span>
            <p
              style={{ color: "#991B1B" }}
              className="text-xs sm:text-sm flex-1"
            >
              <span className="font-bold">
                {closingSoonJobs.length}{" "}
                {closingSoonJobs.length === 1
                  ? "opening closes"
                  : "openings close"}{" "}
                {nearestClosingDays === 0
                  ? "today"
                  : nearestClosingDays === 1
                    ? "tomorrow"
                    : `in ${nearestClosingDays} days`}
              </span>{" "}
              —{" "}
              {closingSoonJobs
                .slice(0, 2)
                .map((j) => j.companyId?.name)
                .filter(Boolean)
                .join(", ")}
              {closingSoonJobs.length > 2
                ? ` +${closingSoonJobs.length - 2} more`
                : ""}
            </p>
            <button
              onClick={() => navigate("/student/companies")}
              style={{ color: "#DC2626" }}
              className="text-xs font-bold shrink-0 hover:underline"
            >
              View →
            </button>
          </div>
        )}

        {/* Stats Row — Interviews box removed, values now come from real data */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-4 mb-6 sm:mb-8">
          <div
            style={{ backgroundColor: C.white, borderColor: C.border }}
            className="rounded-xl sm:rounded-2xl px-3 py-3 sm:px-5 sm:py-4 shadow-sm border-l-4 flex items-center gap-2.5 sm:gap-4 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
          >
            <div
              style={{ backgroundColor: "#DCFCE7" }}
              className="w-8 h-8 sm:w-11 sm:h-11 rounded-lg sm:rounded-xl flex items-center justify-center shrink-0"
            >
              <svg
                className="w-4 h-4 sm:w-6 sm:h-6"
                fill="none"
                stroke={C.success}
                strokeWidth={2.5}
                viewBox="0 0 24 24"
              >
                <circle cx="12" cy="12" r="10" />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12l2 2 4-4"
                />
              </svg>
            </div>
            <div>
              <p
                style={{ color: C.textMuted }}
                className="text-[10px] sm:text-xs font-medium truncate"
              >
                Selected
              </p>
              <p
                style={{ color: C.textMain }}
                className="text-base sm:text-2xl font-bold"
              >
                {applicationsLoading ? "—" : selectedCount}
              </p>
            </div>
          </div>

          <div
            style={{ backgroundColor: C.white, borderColor: C.border }}
            className="rounded-xl sm:rounded-2xl px-3 py-3 sm:px-5 sm:py-4 shadow-sm border-l-4 flex items-center gap-2.5 sm:gap-4 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
          >
            <div
              style={{ backgroundColor: "#DBEAFE" }}
              className="w-8 h-8 sm:w-11 sm:h-11 rounded-lg sm:rounded-xl flex items-center justify-center shrink-0"
            >
              <svg
                className="w-4 h-4 sm:w-6 sm:h-6"
                fill="none"
                stroke={C.primary}
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                <rect x="2" y="7" width="20" height="14" rx="2" />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"
                />
              </svg>
            </div>
            <div>
              <p
                style={{ color: C.textMuted }}
                className="text-[10px] sm:text-xs font-medium truncate"
              >
                Applied
              </p>
              <p
                style={{ color: C.textMain }}
                className="text-base sm:text-2xl font-bold"
              >
                {applicationsLoading ? "—" : appliedCount}
              </p>
            </div>
          </div>

          <div
            style={{ backgroundColor: C.white, borderColor: C.border }}
            className="rounded-xl sm:rounded-2xl px-3 py-3 sm:px-5 sm:py-4 shadow-sm border-l-4 flex items-center gap-2.5 sm:gap-4 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
          >
            <div
              style={{ backgroundColor: "#EDE9FE" }}
              className="w-8 h-8 sm:w-11 sm:h-11 rounded-lg sm:rounded-xl flex items-center justify-center shrink-0"
            >
              <svg
                className="w-4 h-4 sm:w-6 sm:h-6"
                fill="none"
                stroke="#8B5CF6"
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.196-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                />
              </svg>
            </div>
            <div>
              <p
                style={{ color: C.textMuted }}
                className="text-[10px] sm:text-xs font-medium truncate"
              >
                Profile Score
              </p>
              {/* NOTE: no dedicated endpoint for this was specified — using
                  student.profileScore if backend provides it, else a dash. */}
              {student.profileScore != null ? (
                <p
                  style={{ color: C.textMain }}
                  className="text-base sm:text-2xl font-bold"
                >
                  {student.profileScore}%
                </p>
              ) : (
                <button
                  onClick={() => navigate("/student/profile")}
                  style={{ color: "#8B5CF6" }}
                  className="text-[10px] sm:text-xs font-semibold hover:underline"
                >
                  Complete →
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6">
          {/* Eligible Companies — latest 4 for this student's school */}
          <div className="md:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 style={{ color: C.textMain }} className="text-xl font-bold">
                  Eligible Companies
                </h2>
                <p style={{ color: C.textMuted }} className="text-sm">
                  Curated openings matching your profile
                </p>
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
              <p
                style={{ color: C.textMuted }}
                className="text-sm py-6 text-center"
              >
                Loading companies…
              </p>
            )}
            {!jobsLoading && jobsError && (
              <p
                style={{ color: C.danger }}
                className="text-sm py-6 text-center"
              >
                {jobsError}
              </p>
            )}
            {!jobsLoading && !jobsError && latestFourJobs.length === 0 && (
              <p
                style={{ color: C.textMuted }}
                className="text-sm py-6 text-center"
              >
                No eligible companies right now.
              </p>
            )}
            {!jobsLoading && !jobsError && latestFourJobs.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                {latestFourJobs.map((job, idx) => (
                  <CompanyCard key={job._id} job={job} index={idx} />
                ))}
              </div>
            )}

            {trendingSkills.length > 0 && (
              <div
                style={{ backgroundColor: C.white, borderColor: C.border }}
                className="rounded-2xl border p-5 mt-4 shadow-sm"
              >
                <p
                  style={{ color: C.textMuted }}
                  className="text-xs font-medium mb-3"
                >
                  🔥 Trending Skills — most in-demand right now
                </p>
                <div className="flex flex-wrap gap-2">
                  {trendingSkills.map(([skill, count]) => (
                    <span
                      key={skill}
                      style={{
                        backgroundColor: "#EFF6FF",
                        color: C.primary,
                        borderColor: "#BFDBFE",
                      }}
                      className="text-xs font-semibold px-3 py-1.5 rounded-full border flex items-center gap-1.5"
                    >
                      {skill}
                      <span
                        style={{ color: C.textMuted }}
                        className="font-normal"
                      >
                        · {count}
                      </span>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Announcements — live, polled every 6s, filtered to student's school */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 style={{ color: C.textMain }} className="text-xl font-bold">
                  Announcements
                </h2>
                <p style={{ color: C.textMuted }} className="text-sm">
                  Latest from your placement cell
                </p>
              </div>
              {!announcementsLoading &&
                !announcementsError &&
                visibleAnnouncements.length > 0 && (
                  <button
                    onClick={() => setShowAnnouncementHistory(true)}
                    style={{ color: C.primary }}
                    className="text-sm font-medium hover:opacity-80 shrink-0"
                  >
                    History
                  </button>
                )}
            </div>

            <div
              style={{ backgroundColor: C.white, borderColor: C.border }}
              className="rounded-2xl shadow-sm border p-5 mb-4"
            >
              {announcementsLoading && (
                <p
                  style={{ color: C.textMuted }}
                  className="text-sm text-center py-4"
                >
                  Loading announcements…
                </p>
              )}

              {!announcementsLoading && announcementsError && (
                <p
                  style={{ color: C.danger }}
                  className="text-sm text-center py-4"
                >
                  {announcementsError}
                </p>
              )}

              {!announcementsLoading &&
                !announcementsError &&
                visibleAnnouncements.length === 0 && (
                  <p
                    style={{ color: C.textMuted }}
                    className="text-sm text-center py-4"
                  >
                    No announcements yet.
                  </p>
                )}

              {!announcementsLoading &&
                !announcementsError &&
                previewAnnouncements.length > 0 && (
                  <div className="space-y-5">
                    {previewAnnouncements.map((a, idx) => (
                      <AnnouncementItem
                        key={getAnnId(a) ?? `${a.title}-${idx}`}
                        a={a}
                        isLast={idx === previewAnnouncements.length - 1}
                      />
                    ))}
                  </div>
                )}

              {/* Fallback link at the bottom of the card too, in case there
                  are more than the preview count but the header button is
                  easy to miss */}
              {hasMoreAnnouncements && (
                <button
                  onClick={() => setShowAnnouncementHistory(true)}
                  style={{ color: C.primary, borderColor: C.border }}
                  className="w-full mt-4 pt-3 border-t text-xs font-semibold hover:opacity-80 transition-opacity"
                >
                  View all {visibleAnnouncements.length} announcements
                </button>
              )}
            </div>
            <div
              style={{ backgroundColor: "#FFFBEB", borderColor: "#FDE68A" }}
              className="border rounded-2xl p-4 mb-4 flex items-start gap-2.5"
            >
              <span className="text-lg shrink-0">💡</span>
              <div>
                <p
                  style={{ color: "#92400E" }}
                  className="text-xs font-bold mb-0.5"
                >
                  Tip of the day
                </p>
                <p
                  style={{ color: "#B45309" }}
                  className="text-xs leading-relaxed"
                >
                  {dailyTip}
                </p>
              </div>
            </div>

            {/* Need Help */}
            <div
              style={{ backgroundColor: "#EFF6FF", borderColor: "#BFDBFE" }}
              className="border rounded-2xl p-5"
            >
              <div className="flex items-center gap-2 mb-2">
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke={C.primary}
                  strokeWidth={1.8}
                  viewBox="0 0 24 24"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
                  <rect x="9" y="3" width="6" height="4" rx="1" />
                  <line x1="9" y1="12" x2="15" y2="12" />
                  <line x1="9" y1="16" x2="13" y2="16" />
                </svg>
                <p style={{ color: C.textMain }} className="font-semibold">
                  Need help?
                </p>
              </div>
              <p
                style={{ color: C.primary }}
                className="text-sm leading-relaxed mb-4"
              >
                Reach out to your placement coordinator for guidance on
                applications and interviews.
              </p>
              <button
                style={{
                  borderColor: C.border,
                  backgroundColor: C.white,
                  color: C.textMain,
                }}
                className="border text-sm font-medium px-4 py-2 rounded-lg hover:opacity-80 transition-opacity"
              >
                Contact Cell
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* ── Announcement History Modal — shows every announcement ever
          published for this student, not just the latest N ── */}
      {showAnnouncementHistory && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
          onClick={() => setShowAnnouncementHistory(false)}
        >
          <div
            style={{ backgroundColor: C.white }}
            className="rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{ borderColor: C.border }}
              className="flex items-center justify-between p-5 border-b shrink-0"
            >
              <div>
                <h2
                  style={{ color: C.textMain }}
                  className="text-base font-bold"
                >
                  All Announcements
                </h2>
                <p style={{ color: C.textMuted }} className="text-xs mt-0.5">
                  {visibleAnnouncements.length} total
                </p>
              </div>
              <button
                onClick={() => setShowAnnouncementHistory(false)}
                style={{ backgroundColor: C.background }}
                className="w-8 h-8 rounded-lg flex items-center justify-center hover:opacity-80 transition-opacity"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke={C.textMuted}
                  strokeWidth={2.2}
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="p-5 overflow-y-auto">
              {visibleAnnouncements.length === 0 ? (
                <p
                  style={{ color: C.textMuted }}
                  className="text-sm text-center py-8"
                >
                  No announcements yet.
                </p>
              ) : (
                <div className="space-y-5">
                  {visibleAnnouncements.map((a, idx) => (
                    <AnnouncementItem
                      key={getAnnId(a) ?? `${a.title}-${idx}`}
                      a={a}
                      isLast={idx === visibleAnnouncements.length - 1}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
