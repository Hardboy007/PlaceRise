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
import mockCompanies from "../../data/mockCompanies";
import mockStudents from "../../data/mockStudents";

// Derived Stats
const totalStudents = mockStudents.length;
const placedStudents = mockStudents.filter(
  (s) => s.placementStatus === "Placed",
).length;
const placementPercent = Math.round((placedStudents / totalStudents) * 100);
const activeCompanies = mockCompanies.length;
const pendingApplications = mockStudents.reduce(
  (acc, s) => acc + s.appliedCompanies.length,
  0,
);

//Upcoming Deadlines
const today = new Date();
const upcomingDeadlines = mockCompanies
  .map((c) => {
    const last = new Date(c.lastDate);
    const diff = Math.ceil((last - today) / (1000 * 60 * 60 * 24));
    return { ...c, daysLeft: diff };
  })
  .filter((c) => c.daysLeft >= 0 && c.daysLeft <= 7)
  .sort((a, b) => a.daysLeft - b.daysLeft);

//Recent Applications - Last 5
const recentApplications = mockStudents
  .flatMap((s) =>
    s.appliedCompanies.map((cId) => {
      const company = mockCompanies.find((c) => c.id === cId);
      return company
        ? {
            student: s.name,
            company: company.company,
            role: company.role,
            status: "Applied",
          }
        : null;
    }),
  )
  .filter(Boolean)
  .slice(0, 5);

// Greeting
const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return "Good Morning";
  if (hour < 17) return "Good Afternoon";
  return "Good Evening";
};

const formatDate = () => {
  return today.toLocaleDateString("en-IN", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

export default function CoordinatorDashboard() {
  const navigate = useNavigate();
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
        >
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-white/70 mb-1">
              {getGreeting()}
            </p>
            <h1
              className="text-2xl font-bold text-white mb-1"
              style={{ fontFamily: "Space Grotesk, sans-serif" }}
            >
              Mr. Mukesh Kumar
            </h1>
            <p className="text-sm text-white/60">{formatDate()}</p>
          </div>
          <span className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 border border-white/30 text-white text-sm font-semibold">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            Placement Season 2025-26 Active
          </span>
        </div>
      </div>

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
            iconColor: "text-[#F59E0B]",
          },
          {
            label: "Pending Applications",
            value: pendingApplications,
            icon: Clock,
            color: "border-t-[#EF4444]",
            bg: "bg-red-50",
            iconColor: "text-[#EF4444]",
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
                  key={c.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]"
                >
                  <div>
                    <p className="text-sm font-semibold text-[#1E293B]">
                      {c.company}
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

        {/* Recent Applications */}
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
                Recent Applications
              </h3>
            </div>
            <button
              onClick={() => navigate("/coordinator/applications")}
              className="text-xs text-primary font-semibold hover:underline"
            >
              View All
            </button>
          </div>
          <div className="p-4 flex flex-col gap-2">
            {recentApplications.length === 0 ? (
              <p className="text-sm text-text-muted text-center py-6">
                No applications yet
              </p>
            ) : (
              recentApplications.map((app, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-linear-to-br from-primary to-[#1E293B] flex items-center justify-center text-white text-xs font-bold shrink-0">
                      {app.student.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[#1E293B]">
                        {app.student}
                      </p>
                      <p className="text-xs text-text-muted">
                        {app.company} · {app.role}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-50 text-primary border border-blue-200">
                    {app.status}
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
