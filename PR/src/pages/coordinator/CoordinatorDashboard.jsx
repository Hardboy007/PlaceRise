import { useNavigate } from "react-router-dom";
import {
  Users,
  Building2,
  TrendingUp,
  Clock,
  ChevronRight,
  Plus,
  Megaphone,
  AlertCircle,
} from "lucide-react";
import { useEffect, useState } from "react";
import { api } from "../../utils/api";

// Greeting
// FIXED: was using new Date().getHours() with a plain hour<12/hour<17 check,
// which called "6 PM" onward "Good Evening" forever and never said anything
// for late night — so at, say, 9 PM it still fell through to "Good Evening"
// but nothing matched past 22:xx or before 4 AM, silently defaulting to
// whatever the last branch was. Rewritten to the requested precise ranges,
// using total minutes so the 4:30 PM / 10 PM boundaries are exact, and takes
// the live "now" value passed in instead of grabbing a fresh Date itself, so
// it stays in sync with the ticking clock in the component below.
// 4:00–11:59  -> Good Morning
// 12:00–16:30 -> Good Afternoon
// 16:31–22:00 -> Good Evening
// 22:01–3:59  -> Good Moon
const getGreeting = (date) => {
  const totalMinutes = date.getHours() * 60 + date.getMinutes();
  if (totalMinutes >= 4 * 60 && totalMinutes <= 11 * 60 + 59) {
    return "Good Morning";
  }
  if (totalMinutes >= 12 * 60 && totalMinutes <= 16 * 60 + 30) {
    return "Good Afternoon";
  }
  if (totalMinutes >= 16 * 60 + 31 && totalMinutes <= 22 * 60) {
    return "Good Evening";
  }
  return "Good Moon";
};

const formatDate = (date) => {
  return date.toLocaleDateString("en-IN", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

// FIXED: coordinator.name is rendered exactly as stored in the DB. Whoever
// last saved the profile via the edit form could type any casing —
// "Rajesh kumar", "rajesh KUMAR" etc — and that's what showed up here,
// looking "random" across visits. The backend now normalizes casing on
// every save going forward, but that doesn't fix names already saved with
// bad casing, so this display-only helper title-cases whatever comes back
// from the API before rendering, regardless of what's actually in the DB.
const toDisplayName = (name = "") =>
  name
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .map((word) => (word ? word.charAt(0).toUpperCase() + word.slice(1) : word))
    .join(" ");

export default function CoordinatorDashboard() {
  const navigate = useNavigate();

  const [coordinator, setCoordinator] = useState(null);
  const [students, setStudents] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  // FIXED: getGreeting() and "today" were only ever computed once per
  // render (page load / navigate), so if the page stayed open across
  // 12:00 PM or 5:00 PM the "Good Morning"/"Good Afternoon"/"Good Evening"
  // text and date would silently go stale. now/greeting are tracked in
  // state and refreshed every minute so they update live while the tab
  // stays open, without needing a full reload.
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60 * 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const [coordData, studentData, jobsData] = await Promise.all([
          api.get("/coordinators/me"),
          api.get("/students"),
          api.get("/companies/jobs"),
        ]);
        setCoordinator(coordData);
        setStudents(Array.isArray(studentData) ? studentData : []);
        setJobs(Array.isArray(jobsData) ? jobsData : []);
      } catch (error) {
        console.error("Failed to load dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  const totalStudents = students.length;
  const placedStudents = students.filter(
    (s) => s.placementStatus === "Placed",
  ).length;
  const placementPercent = totalStudents
    ? Math.round((placedStudents / totalStudents) * 100)
    : 0;

  const today = now;

  // FIXED: only jobs with a real (non-deleted) company are ever considered
  // "live" anywhere below. A deleted company leaves companyId null/undefined
  // on the job doc.
  const liveJobs = jobs.filter((j) => j.companyId && j.companyId.name);

  // FIXED: a job is only actually "closed" once its lastDate has passed —
  // JobPosting.status just defaults to "Active" and is never flipped in the
  // backend, so it can't be trusted. No lastDate set = treated as still open.
  //
  // FIXED (contradiction bug): lastDate is stored at midnight (00:00:00).
  // The old check compared `lastDate >= now` using the exact time — so on
  // the deadline day itself, as soon as it passed midnight (e.g. by
  // evening), lastDate (00:00 today) became "earlier than" now and the job
  // flipped to "Closed" here — while upcomingDeadlines below (which works
  // in whole days via daysLeft) still correctly showed it as "Today". Same
  // job, two different verdicts. Now compares against the END of the
  // deadline day (23:59:59.999), so a job stays "Active" for its entire
  // last day, matching the day-based daysLeft logic.
  const isJobOpen = (job) => {
    if (!job.lastDate) return true;
    const last = new Date(job.lastDate);
    last.setHours(23, 59, 59, 999);
    return last >= today;
  };

  // FIXED: "Active Companies" was counting every distinct company with any
  // job posting ever, including deleted companies and companies whose only
  // postings have already closed. Now counts distinct companies that have
  // at least one still-open posting.
  const activeCompanies = Array.from(
    new Set(liveJobs.filter(isJobOpen).map((j) => j.companyId.name)),
  ).length;

  // FIXED: "Active Jobs" stat card removed per request — dropped from the
  // stats strip below entirely.

  const upcomingDeadlines = liveJobs
    .map((c) => {
      const last = new Date(c.lastDate);
      const diff = Math.ceil((last - today) / (1000 * 60 * 60 * 24));
      return { ...c, daysLeft: diff };
    })
    .filter(
      (c) => !Number.isNaN(c.daysLeft) && c.daysLeft >= 0 && c.daysLeft <= 7,
    )
    .sort((a, b) => a.daysLeft - b.daysLeft);

  // FIXED: "Recent Job Postings" was sorting by createdAt (so an edited old
  // posting never bubbled up) and included deleted-company jobs. Now sorts
  // by updatedAt (JobPosting has timestamps: true, so this always exists)
  // over liveJobs only, and shows a status computed from the live deadline
  // instead of the static, never-updated job.status field.
  const recentJobPostings = liveJobs
    .slice()
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
    .slice(0, 5)
    .map((job) => ({
      id: job._id,
      company: job.companyId?.name || "Unknown",
      role: job.role,
      status: isJobOpen(job) ? "Active" : "Closed",
    }));

  if (loading) {
    return (
      <div className="text-center py-20 text-text-muted">
        Loading dashboard…
      </div>
    );
  }

  return (
    <div
      className="max-w-6xl mx-auto"
      style={{ fontFamily: "Inter, sans-serif" }}
    >
      {/* Hero */}
      <div
        className="relative rounded-3xl overflow-hidden mb-6 border border-white/10"
        style={{
          background:
            "linear-gradient(135deg, #3B82F6 0%, #60A5FA 60%, #818CF8 100%)",
        }}
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `radial-gradient(circle at 20% 50%, rgba(255,255,255,0.1) 0%, transparent 50%),
                         radial-gradient(circle at 80% 20%, rgba(255,255,255,0.05) 0%, transparent 40%)`,
          }}
        />
        {/* FIXED: this content block used to live INSIDE the decorative
            pointer-events-none overlay div above, with no flex/padding
            layout at all — so the greeting text rendered unstyled and
            unclickable. Moved out as its own positioned, padded sibling,
            matching the hero pattern used on the profile page. */}
        <div className="relative z-10 p-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-white/70 mb-1">
              {getGreeting(now)}
            </p>
            <h1
              className="text-2xl font-bold text-white mb-1"
              style={{ fontFamily: "Space Grotesk, sans-serif" }}
            >
              {toDisplayName(coordinator.name) || "Coordinator"}
            </h1>
            <p className="text-sm text-white/60">{formatDate(today)}</p>
          </div>
          <span className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 border border-white/30 text-white text-sm font-semibold">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            Placement Season 2025-26 Active
          </span>
        </div>
      </div>

      {/* Stats Strip */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
        {[
          {
            label: "Total Students",
            value: totalStudents,
            icon: Users,
            color: "border-t-primary",
            bg: "bg-blue-50",
            iconColor: "text-primary",
          },
          {
            label: "Placed Students",
            value: `${placedStudents} (${placementPercent}%)`,
            icon: TrendingUp,
            color: "border-t-[#22C55E]",
            bg: "bg-green-50",
            iconColor: "text-[#22C55E]",
          },
          {
            label: "Active Companies",
            value: activeCompanies,
            icon: Building2,
            color: "border-t-[#F59E0B]",
            bg: "bg-amber-50",
            iconColor: "text-[#F59E0B]",
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className={`bg-white rounded-2xl border border-[#E2E8F0] border-t-2 ${stat.color} p-4 shadow-sm hover:shadow-md transition-shadow`}
          >
            <div
              className={`w-8 h-8 rounded-lg ${stat.bg} flex items-center justify-center mb-3`}
            >
              <stat.icon size={16} className={stat.iconColor} />
            </div>
            <p
              className="text-xl font-bold text-[#1E293B]"
              style={{ fontFamily: "Space Grotesk, sans-serif" }}
            >
              {stat.value}
            </p>
            <p className="text-xs uppercase tracking-widest text-text-muted mt-1">
              {stat.label}
            </p>
          </div>
        ))}
      </div>

      {/* Middle Section */}
      <div className="grid md:grid-cols-2 gap-5 mb-6">
        {/* Upcoming Deadlines */}
        <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm">
          <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-background">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-red-50 flex items-center justify-center">
                <AlertCircle size={14} className="text-danger" />
              </div>
              <h3
                className="text-sm font-bold text-[#1E293B]"
                style={{ fontFamily: "Space Grotesk, sans-serif" }}
              >
                Upcoming Deadlines
              </h3>
            </div>
            <span className="text-xs text-text-muted">Next 7 days</span>
          </div>

          <div className="p-4 flex flex-col gap-2">
            {upcomingDeadlines.length === 0 ? (
              <p className="text-sm text-text-muted text-center py-6">
                No deadlines in next 7 days
              </p>
            ) : (
              upcomingDeadlines.map((c) => (
                <div
                  key={c._id}
                  className="flex items-center justify-between p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]"
                >
                  <div>
                    <p className="text-sm font-semibold text-[#1E293B]">
                      {c.companyId?.name || "Unknown"}
                    </p>
                    <p className="text-xs text-text-muted">{c.role}</p>
                  </div>
                  <span
                    className={`text-xs font-bold px-2.5 py-1 rounded-full border
                    ${
                      c.daysLeft <= 3
                        ? "text-danger bg-red-50 border-red-200"
                        : "text-warning bg-amber-50 border-amber-200"
                    }`}
                  >
                    {c.daysLeft === 0 ? "Today" : `${c.daysLeft}d left`}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Job Postings */}
        <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm">
          <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-background">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center">
                <Clock size={14} className="text-primary" />
              </div>
              <h3
                className="text-sm font-bold text-[#1E293B]"
                style={{ fontFamily: "Space Grotesk, sans-serif" }}
              >
                Recent Job Postings
              </h3>
            </div>
            <button
              onClick={() => navigate("/coordinator/companies")}
              className="text-xs text-primary font-semibold hover:underline"
            >
              View Companies
            </button>
          </div>
          <div className="p-4 flex flex-col gap-2">
            {recentJobPostings.length === 0 ? (
              <p className="text-sm text-text-muted text-center py-6">
                No recent job postings yet
              </p>
            ) : (
              recentJobPostings.map((job) => (
                <div
                  key={job.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-linear-to-br from-primary to-[#1E293B] flex items-center justify-center text-white text-xs font-bold shrink-0">
                      {job.company.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[#1E293B]">
                        {job.company}
                      </p>
                      <p className="text-xs text-text-muted">{job.role}</p>
                    </div>
                  </div>
                  <span
                    className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${
                      job.status === "Active"
                        ? "bg-blue-50 text-primary border-blue-200"
                        : "bg-[#F1F5F9] text-text-muted border-[#E2E8F0]"
                    }`}
                  >
                    {job.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm p-5">
        <h3
          className="text-sm font-bold text-[#1E293B] mb-4"
          style={{ fontFamily: "Space Grotesk, sans-serif" }}
        >
          Quick Actions
        </h3>
        <div className="flex flex-wrap gap-3">
          {[
            {
              label: "Add Company",
              icon: Plus,
              color: "bg-[#1E293B] text-white hover:bg-primary",
              route: "/coordinator/companies",
            },
            {
              label: "Post Announcement",
              icon: Megaphone,
              color:
                "bg-background text-[#1E293B] hover:bg-[#E2E8F0] border border-[#CBD5E1]",
              route: "/coordinator/announcements",
            },
            {
              label: "View All Students",
              icon: Users,
              color:
                "bg-background text-[#1E293B] hover:bg-[#E2E8F0] border border-[#CBD5E1]",
              route: "/coordinator/students",
            },
            {
              label: "View Applications",
              icon: ChevronRight,
              color:
                "bg-background text-[#1E293B] hover:bg-[#E2E8F0] border border-[#CBD5E1]",
              route: "/coordinator/applications",
            },
          ].map((action) => (
            <button
              key={action.label}
              onClick={() => navigate(action.route)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors ${action.color}`}
            >
              <action.icon size={15} />
              {action.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}