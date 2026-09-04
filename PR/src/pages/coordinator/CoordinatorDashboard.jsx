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
import CompanyLogo from "../../components/common/CompanyLogo";

// Greeting
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
  const todayMid = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  );

  const liveJobs = jobs.filter((j) => j.companyId && j.companyId.name);
  const highestCTC = liveJobs.reduce(
    (max, j) => (j.ctc > max ? j.ctc : max),
    0,
  );

  const isJobOpen = (job) => {
    if (!job.lastDate) return true;
    const last = new Date(job.lastDate);
    last.setHours(23, 59, 59, 999);
    return last >= today;
  };

  const activeCompanies = Array.from(
    new Set(liveJobs.filter(isJobOpen).map((j) => j.companyId.name)),
  ).length;

  // Days-left counting starts from TOMORROW, not today. Both dates are
  // normalized to local midnight first, so `diff` is a clean whole-day gap
  // (0 = deadline is today, negative = already past), independent of what
  // time it currently is. Same `diff` also drives the "next 7 days" window
  // below. When diff is 0, the UI shows "Today · Last day" instead of a
  // days-left number.
  const upcomingDeadlines = liveJobs
    .map((c) => {
      const lastRaw = new Date(c.lastDate);
      const lastMid = new Date(
        lastRaw.getFullYear(),
        lastRaw.getMonth(),
        lastRaw.getDate(),
      );
      const diff = Math.round((lastMid - todayMid) / 86400000);
      return { ...c, diff };
    })
    .filter((c) => !Number.isNaN(c.diff) && c.diff >= 0 && c.diff <= 7)
    .sort((a, b) => a.diff - b.diff);

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
      website: job.companyId?.website,
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
            "linear-gradient(135deg, #0d1b5e 0%, #1a2d8a 25%, #3d1a6e 55%, #6b1040 80%, #7a0f35 100%)",
        }}
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `radial-gradient(circle at 20% 50%, rgba(255,255,255,0.1) 0%, transparent 50%),
                         radial-gradient(circle at 80% 20%, rgba(255,255,255,0.05) 0%, transparent 40%)`,
          }}
        />
        <div className="relative z-10 p-5 sm:p-8">
          <div className="flex items-center justify-between gap-3 mb-4 sm:mb-5">
            <div className="flex items-center gap-2.5 min-w-0">
              <img
                src="/images/dbuu-logo.jpeg"
                alt="University Logo"
                className="w-8 h-8 sm:w-10 sm:h-10 rounded-full object-contain bg-white/10 p-0.5 shrink-0"
              />
              <span className="text-white/80 text-xs sm:text-sm font-medium leading-tight">
                Dev Bhoomi Uttarakhand University
              </span>
            </div>
            <span className="flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full bg-white/20 border border-white/30 text-white text-xs sm:text-sm font-semibold whitespace-nowrap shrink-0">
              <span className="w-2 h-2 rounded-full bg-[#f59e0b] animate-pulse shrink-0" />
              Placement Season 2025-26 Active
            </span>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-white/70 mb-1">
              {getGreeting(now)}
            </p>
            <h1
              className="text-xl sm:text-2xl font-bold text-white mb-1"
              style={{ fontFamily: "Space Grotesk, sans-serif" }}
            >
              {toDisplayName(coordinator.name) || "Coordinator"}
            </h1>
            <p className="text-sm text-white/60">{formatDate(today)}</p>
          </div>
        </div>
        <svg
          className="absolute bottom-0 right-0 pointer-events-none"
          style={{ width: "260px", height: "130px" }}
          viewBox="0 0 260 130"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M260 130 Q180 60 80 100 Q20 120 0 130"
            stroke="url(#redOrangeGrad)"
            strokeWidth="3.5"
            fill="none"
            strokeLinecap="round"
          />
          <path
            d="M260 110 Q190 50 100 85 Q40 105 10 115"
            stroke="url(#redOrangeGrad)"
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
            opacity="0.5"
          />
          <defs>
            <linearGradient
              id="redOrangeGrad"
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
      </div>
      {recentJobPostings.length > 0 && (
        <div className="flex items-start sm:items-center gap-2 bg-blue-50 border border-blue-100 rounded-xl px-3 py-2 sm:px-4 sm:py-2.5 mb-6 text-xs sm:text-sm text-blue-800">
          <span>💡</span>
          <span>
            <span className="font-semibold">
              {recentJobPostings[0].company}
            </span>{" "}
            posted the most recent opening —{" "}
            <span className="font-semibold">{recentJobPostings[0].role}</span>
          </span>
        </div>
      )}
      {/* Stats Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
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
            iconColor: "text-[#f59e0b]",
          },
          {
            label: "Highest Package",
            value: highestCTC > 0 ? `₹${highestCTC} LPA` : "—",
            icon: TrendingUp,
            color: "border-t-[#8B5CF6]",
            bg: "bg-purple-50",
            iconColor: "text-[#8B5CF6]",
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className={`bg-white rounded-2xl border border-[#E2E8F0] border-t-2 ${stat.color} p-3 sm:p-4 shadow-sm hover:shadow-md transition-shadow`}
          >
            <div
              className={`w-8 h-8 rounded-lg ${stat.bg} flex items-center justify-center mb-3`}
            >
              <stat.icon size={16} className={stat.iconColor} />
            </div>
            <p
              className="text-lg sm:text-xl font-bold text-[#1E293B] truncate"
              style={{ fontFamily: "Space Grotesk, sans-serif" }}
            >
              {stat.value}
            </p>
            <p className="text-xs uppercase tracking-widest text-text-muted mt-1">
              {stat.label}
            </p>
            {stat.label === "Placed Students" && (
              <div className="w-full h-1.5 rounded-full bg-background mt-2.5 overflow-hidden">
                <div
                  className="h-full rounded-full bg-success transition-all duration-700"
                  style={{ width: `${placementPercent}%` }}
                />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Middle Section */}
      <div className="grid md:grid-cols-2 gap-5 mb-6">
        {/* Upcoming Deadlines */}
        <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm">
          <div className="flex items-center justify-between px-4 pt-4 pb-3 sm:px-5 sm:pt-5 sm:pb-4 border-b border-background">
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
                  className="flex items-center justify-between gap-2 p-2.5 sm:p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[#1E293B] truncate">
                      {c.companyId?.name || "Unknown"}
                    </p>
                    <p className="text-xs text-text-muted truncate">{c.role}</p>
                  </div>
                  <span
                    className={`text-xs font-bold px-2.5 py-1 rounded-full border shrink-0 whitespace-nowrap
    ${
      c.diff <= 3
        ? "text-danger bg-red-50 border-red-200"
        : "text-warning bg-amber-50 border-amber-200"
    }`}
                  >
                    {c.diff === 0 ? "Today · Last day" : `${c.diff}d left`}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Job Postings */}
        <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm">
          <div className="flex items-center justify-between px-4 pt-4 pb-3 sm:px-5 sm:pt-5 sm:pb-4 border-b border-background">
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
              onClick={() => navigate("/coordinator/jobs/all")}
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
                  className="flex items-center justify-between gap-2 p-2.5 sm:p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]"
                >
                  <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                    <CompanyLogo
                      name={job.company}
                      website={job.website}
                      size={32}
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[#1E293B] truncate">
                        {job.company}
                      </p>
                      <p className="text-xs text-text-muted truncate">
                        {job.role}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`text-xs font-semibold px-2.5 py-1 rounded-full border shrink-0 whitespace-nowrap ${
                      job.status === "Active"
                        ? "bg-blue-50 text-primary border-blue-200"
                        : "bg-background text-text-muted border-[#E2E8F0]"
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
      <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm p-4 sm:p-5">
        <h3
          className="text-sm font-bold text-[#1E293B] mb-4"
          style={{ fontFamily: "Space Grotesk, sans-serif" }}
        >
          Quick Actions
        </h3>
        <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2 sm:gap-3">
          {[
            {
              label: "Add Company",
              icon: Plus,
              color: "bg-[#1E293B] text-white hover:bg-primary",
              route: "/coordinator/jobs/all",
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
              className={`flex items-center justify-center sm:justify-start gap-2 px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all hover:-translate-y-0.5 hover:shadow-md ${action.color}`}
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
