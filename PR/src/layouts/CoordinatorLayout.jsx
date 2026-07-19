import { useState, useEffect } from "react";
import {
  Outlet,
  NavLink,
  useNavigate,
  Link,
  useLocation,
} from "react-router-dom";
import { api } from "../utils/api";
import {
  LayoutDashboard,
  Users,
  Building2,
  FileCheck,
  Megaphone,
  User,
  LogOut,
  Sparkles,
  Calendar,
  FileText,
  QrCode,
  Bell,
  X,
  LineChart,
  MoreHorizontal,
} from "lucide-react";

const navLinks = [
  { to: "/coordinator/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/coordinator/students", label: "Students", icon: Users },
  {
    label: "Jobs",
    icon: Building2,
    children: [
      { to: "/coordinator/jobs/all", label: "All Jobs" },
      { to: "/coordinator/recruiter-crm", label: "Recruiter CRM" },
    ],
  },
  { to: "/coordinator/calendar", label: "Calendar", icon: Calendar },
  { to: "/coordinator/applications", label: "Applications", icon: FileCheck },
  { to: "/coordinator/announcements", label: "Announcements", icon: Megaphone },
  { to: "/coordinator/profile", label: "Profile & Settings", icon: User },
  { to: "/coordinator/noc", label: "NOC / LOR", icon: FileText },
  { to: "/coordinator/attendance", label: "Attendance", icon: QrCode },
  { to: "/coordinator/analytics", label: "Analytics", icon: LineChart },
];

// Bottom bar pe sirf ye 4 sabse zyada use hone wale pages, 5th "More"
const bottomTabs = [
  { to: "/coordinator/dashboard", label: "Home", icon: LayoutDashboard },
  { to: "/coordinator/calendar", label: "Calendar", icon: Calendar },
  { to: "/coordinator/jobs/all", label: "Companies", icon: Building2 },
  { to: "/coordinator/profile", label: "Profile", icon: User },
];

// "More" sheet mein baaki saare links — har ek ko alag accent color
const moreLinks = [
  {
    to: "/coordinator/students",
    label: "Students",
    icon: Users,
    color: "blue",
  },
  {
    to: "/coordinator/recruiter-crm",
    label: "Recruiter CRM",
    icon: Building2,
    color: "purple",
  },
  {
    to: "/coordinator/applications",
    label: "Applications",
    icon: FileCheck,
    color: "green",
  },
  {
    to: "/coordinator/announcements",
    label: "Announcements",
    icon: Megaphone,
    color: "amber",
  },
  { to: "/coordinator/noc", label: "NOC / LOR", icon: FileText, color: "pink" },
  {
    to: "/coordinator/attendance",
    label: "Attendance",
    icon: QrCode,
    color: "teal",
  },
  {
    to: "/coordinator/analytics",
    label: "Analytics",
    icon: LineChart,
    color: "orange",
  },
];

const moreColorMap = {
  blue: { bg: "bg-blue-50", text: "text-blue-600" },
  purple: { bg: "bg-purple-50", text: "text-purple-600" },
  green: { bg: "bg-green-50", text: "text-green-600" },
  amber: { bg: "bg-amber-50", text: "text-amber-600" },
  pink: { bg: "bg-pink-50", text: "text-pink-600" },
  teal: { bg: "bg-teal-50", text: "text-teal-600" },
  orange: { bg: "bg-orange-50", text: "text-orange-600" },
};

function CoordinatorLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [expanded, setExpanded] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifs, setShowNotifs] = useState(false);
  const [openGroup, setOpenGroup] = useState(null);
  const [showMore, setShowMore] = useState(false);
  const coordinator = JSON.parse(localStorage.getItem("coordinator") || "{}");

  const initials = coordinator.name
    ? coordinator.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "MK";

  // Poll unread notification count every 30s
  useEffect(() => {
    const fetchCount = async () => {
      const data = await api.get("/notifications/unread-count");
      setUnreadCount(data.count || 0);
    };
    fetchCount();
    const interval = setInterval(() => {
      if (!document.hidden) fetchCount();
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleBellClick = async () => {
    setShowNotifs(!showNotifs);
    if (!showNotifs) {
      const data = await api.get("/notifications");
      setNotifications(Array.isArray(data) ? data : []);
      // Saari read mark karo
      await api.put("/notifications/mark-all-read");
      setUnreadCount(0);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("coordinator");
    localStorage.removeItem("student");
    localStorage.removeItem("isFirstLogin");
    navigate("/");
  };

  const isMoreActive = moreLinks.some((l) =>
    location.pathname.startsWith(l.to),
  );

  return (
    <div
      className="min-h-screen bg-background overflow-x-hidden"
      style={{ fontFamily: "Inter, sans-serif" }}
    >
      {/* ── Navbar ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 h-16 bg-white/80 backdrop-blur border-b border-[#CBD5E1] px-3 sm:px-6 flex items-center justify-between gap-2">
        <Link
          to="/"
          className="flex items-center gap-2 sm:gap-2.5 min-w-0 shrink-0"
        >
          <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center shadow-[0_4px_12px_rgba(59,130,246,0.4)] shrink-0">
            <Sparkles size={14} className="text-white" />
          </div>
          <span
            className="text-base sm:text-lg font-bold whitespace-nowrap"
            style={{ fontFamily: "Space Grotesk, sans-serif" }}
          >
            <span className="text-[#1E293B]">Place</span>
            <span className="text-primary">Rise</span>
          </span>
          <span className="hidden sm:inline-block ml-1 sm:ml-2 px-2 py-0.5 rounded-full text-xs font-semibold bg-[#1E293B] text-white whitespace-nowrap">
            Coordinator
          </span>
        </Link>

        <div className="flex items-center gap-1 sm:gap-3 shrink-0">
          {/* Notification Bell */}
          <div className="relative">
            <button
              onClick={handleBellClick}
              className="relative w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#F1F5F9] hover:bg-[#E2E8F0] flex items-center justify-center transition-colors shrink-0"
            >
              <Bell size={15} className="text-[#64748B]" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-[#EF4444] text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>
            {/* Notification Dropdown */}
            {showNotifs && (
              <div className="fixed left-3 right-3 top-16 sm:absolute sm:left-auto sm:right-0 sm:top-11 sm:w-80 max-w-full bg-white rounded-2xl shadow-xl border border-[#E2E8F0] z-50 overflow-hidden">
                <div className="px-4 py-3 border-b border-[#F1F5F9] flex items-center justify-between">
                  <p className="text-sm font-bold text-[#1E293B]">
                    Notifications
                  </p>
                  <button
                    onClick={() => setShowNotifs(false)}
                    className="p-1.5 rounded-full text-[#64748B] hover:text-[#EF4444] hover:bg-red-50 transition-all duration-300 hover:rotate-90"
                  >
                    <X size={16} />
                  </button>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <p className="text-sm text-[#64748B] text-center py-8">
                      No notifications
                    </p>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n._id}
                        className={`px-4 py-3 border-b border-[#F8FAFC] hover:bg-[#F8FAFC] cursor-pointer ${!n.isRead ? "bg-blue-50/50" : ""}`}
                      >
                        <p className="text-sm font-semibold text-[#1E293B]">
                          {n.title}
                        </p>
                        <p className="text-xs text-[#64748B] mt-0.5">
                          {n.message}
                        </p>
                        <p className="text-xs text-[#94A3B8] mt-1">
                          {new Date(n.createdAt).toLocaleString("en-IN")}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-linear-to-br from-primary to-[#1E293B] flex items-center justify-center text-white text-xs font-bold shrink-0">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="text-xs sm:text-sm font-medium text-[#1E293B] leading-none truncate max-w-[130px] sm:max-w-[180px]">
                {coordinator.name || "Coordinator"}
              </p>
              <p className="text-[10px] sm:text-xs text-text-muted mt-0.5 hidden sm:block">
                Placement Coordinator
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-1.5 sm:px-3 py-1.5 rounded-xl text-xs font-medium text-text-muted hover:text-danger hover:bg-red-50 transition-colors shrink-0"
          >
            <LogOut size={14} />
            <span className="hidden md:block">Logout</span>
          </button>
        </div>
      </nav>

      {/* ── Body ── */}
      <div className="pt-16">
        {/* ── Sidebar — DESKTOP ONLY (sm and above), hover to expand ── */}
        <aside
          onMouseEnter={() => setExpanded(true)}
          onMouseLeave={() => setExpanded(false)}
          className={`hidden sm:flex fixed top-16 left-0 bottom-0 z-40 flex-col bg-white border-r border-[#CBD5E1] transition-all duration-300 ease-in-out overflow-hidden ${expanded ? "w-60" : "w-15"}`}
        >
          <div className="flex-1 flex flex-col gap-1 p-2 mt-2 overflow-hidden">
            {navLinks.map(({ to, label, icon: Icon, children }) => {
              if (children) {
                const isGroupActive = children.some((c) =>
                  location.pathname.startsWith(c.to),
                );
                const isOpen = openGroup === label;

                return (
                  <div key={label}>
                    {/* Group Header */}
                    <button
                      onClick={() => setOpenGroup(isOpen ? null : label)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 whitespace-nowrap
              ${
                isGroupActive
                  ? "bg-primary/10 text-primary"
                  : "text-text-muted hover:bg-background hover:text-[#1E293B]"
              }`}
                    >
                      <Icon size={18} className="shrink-0" />
                      <span
                        className={`flex-1 text-left transition-all duration-200 ${expanded ? "opacity-100" : "opacity-0 w-0 overflow-hidden"}`}
                      >
                        {label}
                      </span>
                      {expanded && (
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          className={`shrink-0 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M19 9l-7 7-7-7"
                          />
                        </svg>
                      )}
                    </button>

                    {/* Children */}
                    {isOpen && expanded && (
                      <div className="ml-4 mt-1 flex flex-col gap-1 border-l-2 border-[#E2E8F0] pl-3">
                        {children.map(({ to: childTo, label: childLabel }) => (
                          <NavLink
                            key={childTo}
                            to={childTo}
                            className={({ isActive }) =>
                              `flex items-center px-3 py-2 rounded-xl text-xs font-medium transition-all duration-200 whitespace-nowrap
                    ${
                      isActive
                        ? "bg-primary text-white shadow-[0_4px_12px_rgba(59,130,246,0.3)]"
                        : "text-text-muted hover:bg-background hover:text-[#1E293B]"
                    }`
                            }
                          >
                            {childLabel}
                          </NavLink>
                        ))}
                      </div>
                    )}
                  </div>
                );
              }

              return (
                <NavLink
                  key={to}
                  to={to}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 whitespace-nowrap
          ${
            isActive
              ? "bg-primary text-white shadow-[0_4px_12px_rgba(59,130,246,0.3)]"
              : "text-text-muted hover:bg-background hover:text-[#1E293B]"
          }`
                  }
                >
                  <Icon size={18} className="shrink-0" />
                  <span
                    className={`transition-all duration-200 ${expanded ? "opacity-100" : "opacity-0 w-0 overflow-hidden"}`}
                  >
                    {label}
                  </span>
                </NavLink>
              );
            })}
          </div>

          {/* Bottom user card */}
          <div className="mb-2 px-2">
            <div
              className={`rounded-xl bg-background border border-[#CBD5E1] flex items-center overflow-hidden transition-all duration-200 ${
                expanded ? "gap-2.5 p-3" : "justify-center p-1.5"
              }`}
            >
              <div className="w-8 h-8 rounded-full bg-linear-to-br from-primary to-[#1E293B] flex items-center justify-center text-white text-xs font-bold shrink-0">
                {initials}
              </div>
              <div
                className={`min-w-0 flex-1 transition-all duration-200 ${expanded ? "opacity-100" : "opacity-0 w-0 overflow-hidden"}`}
              >
                <p className="text-sm font-semibold text-[#1E293B] leading-tight truncate">
                  {coordinator.name || "Coordinator"}
                </p>
                <p className="text-xs text-text-muted truncate mt-0.5">
                  Placement Cell · DBUU
                </p>
              </div>
            </div>
          </div>
        </aside>

        {/* ── Main Content — desktop pe sidebar ke hisaab se margin, mobile pe full width ── */}
        <main
          className={`min-h-screen p-3 sm:p-6 pb-28 sm:pb-6 transition-all duration-300 ease-in-out ml-0 ${expanded ? "sm:ml-60" : "sm:ml-15"}`}
        >
          <Outlet />
        </main>
      </div>

      {/* ── Floating Bottom Tab Bar — MOBILE ONLY ── */}
      <nav className="sm:hidden fixed bottom-4 left-3 right-3 z-40 h-16 bg-white/95 backdrop-blur border border-[#E2E8F0] rounded-3xl shadow-[0_8px_24px_rgba(15,23,42,0.12)] flex items-center justify-around px-1">
        {bottomTabs.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            onClick={() => setShowMore(false)}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center gap-0.5 flex-1 h-full text-[10px] font-medium rounded-2xl ${
                isActive ? "text-primary" : "text-text-muted"
              }`
            }
          >
            <Icon size={20} />
            {label}
          </NavLink>
        ))}
        <button
          onClick={() => setShowMore(true)}
          className={`flex flex-col items-center justify-center gap-0.5 flex-1 h-full text-[10px] font-medium rounded-2xl ${
            isMoreActive ? "text-primary" : "text-text-muted"
          }`}
        >
          <MoreHorizontal size={20} />
          More
        </button>
      </nav>

      {/* ── "More" bottom sheet — MOBILE ONLY ── */}
      {showMore && (
        <div className="sm:hidden fixed inset-0 z-50">
          <div
            onClick={() => setShowMore(false)}
            className="absolute inset-0 bg-black/40"
          />
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl max-h-[70vh] overflow-y-auto pb-4">
            <div className="px-4 py-3 border-b border-[#F1F5F9] flex items-center justify-between sticky top-0 bg-white">
              <p className="text-sm font-bold text-[#1E293B]">More</p>
              <button
                onClick={() => setShowMore(false)}
                className="p-1.5 rounded-full text-[#64748B] hover:text-[#EF4444] hover:bg-red-50"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-3 flex flex-wrap gap-2">
              {moreLinks.map(({ to, label, icon: Icon, color }) => {
                const c = moreColorMap[color];
                return (
                  <NavLink
                    key={to}
                    to={to}
                    onClick={() => setShowMore(false)}
                    className={({ isActive }) =>
                      `flex flex-col items-center justify-center gap-1.5 w-[100px] h-[84px] p-2 rounded-xl border shrink-0 transition-all duration-150 ${
                        isActive
                          ? "border-primary bg-primary/5"
                          : "border-[#E2E8F0] hover:border-[#CBD5E1] hover:bg-background"
                      }`
                    }
                  >
                    <div
                      className={`w-7 h-7 rounded-lg ${c.bg} flex items-center justify-center shrink-0`}
                    >
                      <Icon size={14} className={c.text} />
                    </div>
                    <p className="text-[11px] font-semibold text-[#1E293B] leading-tight text-center">
                      {label}
                    </p>
                  </NavLink>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CoordinatorLayout;
