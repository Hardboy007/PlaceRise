import { useState, useEffect } from "react";
import {
  Outlet,
  NavLink,
  useNavigate,
  Link,
  useLocation,
} from "react-router-dom";
import {
  LayoutDashboard,
  Building2,
  ClipboardList,
  User,
  Settings,
  Bell,
  LogOut,
  Sparkles,
  FileText,
  X,
  MoreHorizontal,
} from "lucide-react";
import { api } from "../utils/api";
const navLinks = [
  { to: "/student/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/student/companies", label: "Companies", icon: Building2 },
  {
    to: "/student/applications",
    label: "My Applications",
    icon: ClipboardList,
  },
  { to: "/student/documents", label: "My Documents", icon: FileText },
  { to: "/student/profile", label: "Profile", icon: User },
  { to: "/student/settings", label: "Settings", icon: Settings },
];

// Bottom bar pe sirf 4 sabse zyada use hone wale pages, 5th "More"
const bottomTabs = [
  { to: "/student/dashboard", label: "Home", icon: LayoutDashboard },
  { to: "/student/companies", label: "Companies", icon: Building2 },
  { to: "/student/applications", label: "Applications", icon: ClipboardList },
  { to: "/student/profile", label: "Profile", icon: User },
];

// "More" sheet mein baaki links — har ek ko alag accent color
const moreLinks = [
  {
    to: "/student/documents",
    label: "My Documents",
    icon: FileText,
    color: "blue",
  },
  {
    to: "/student/settings",
    label: "Settings",
    icon: Settings,
    color: "purple",
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

function StudentLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [expanded, setExpanded] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifs, setShowNotifs] = useState(false);
  const [showMore, setShowMore] = useState(false);
  const student = JSON.parse(localStorage.getItem("student") || "{}");
  const initials = student.name
    ? student.name
        .split(" ")
        .map((word) => word[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "ST";

  useEffect(() => {
    const fetchCount = async () => {
      try {
        const data = await api.get("/notifications/unread-count");
        setUnreadCount(data.count || 0);
      } catch {
        /* empty */
      }
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
      await api.put("/notifications/mark-all-read");
      setUnreadCount(0);
    }
  };

  const handleNotifClick = async (notif) => {
    await api.put(`/notifications/${notif._id}/read`);
    setShowNotifs(false);
    if (notif.link) navigate(notif.link);
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
      {/* Thin, subtle scrollbar for the sidebar nav list */}
      <style>{`
        .sidebar-nav-scroll::-webkit-scrollbar {
          width: 4px;
        }
        .sidebar-nav-scroll::-webkit-scrollbar-thumb {
          background: #CBD5E1;
          border-radius: 4px;
        }
        .sidebar-nav-scroll::-webkit-scrollbar-track {
          background: transparent;
        }
        .sidebar-nav-scroll {
          scrollbar-width: thin;
          scrollbar-color: #CBD5E1 transparent;
        }
      `}</style>

      {/* ── Navbar ── */}
      <nav
        className="fixed top-0 left-0 right-0 z-50 h-16
        bg-white/80 backdrop-blur border-b border-[#CBD5E1]
        px-3 sm:px-6 flex items-center justify-between gap-2"
      >
        {/* Logo */}
        <Link
          to="/"
          className="flex items-center gap-2 sm:gap-2.5 min-w-0 shrink-0"
        >
          <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center shadow-[0_4px_12px_rgba(59,130,246,0.4)] shrink-0">
            <img
              src="/images/logo-transparent.png"
              alt="PlaceRise"
              className="w-full h-full object-contain"
            />
          </div>
          <span
            className="hidden sm:inline text-base sm:text-lg font-bold whitespace-nowrap"
            style={{ fontFamily: "Space Grotesk, sans-serif" }}
          >
            <span className="text-[#1E293B]">Place</span>
            <span className="text-primary">Rise</span>
          </span>
        </Link>

        {/* Right Side */}
        <div className="flex items-center gap-1 sm:gap-3 shrink-0">
          {/* Notification Bell */}
          <div className="relative">
            <button
              onClick={handleBellClick}
              className="relative w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-background hover:bg-[#E2E8F0] flex items-center justify-center transition-colors shrink-0"
            >
              <Bell size={16} className="text-text-muted" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-[#EF4444] text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>
            {showNotifs && (
              <div className="fixed left-3 right-3 top-16 lg:absolute lg:left-auto lg:right-0 lg:top-11 lg:w-80 lg:max-w-[calc(100vw-2rem)] max-w-full bg-white rounded-2xl shadow-xl border border-[#E2E8F0] z-50 overflow-hidden">
                <div className="px-4 py-3 border-b border-[#F1F5F9] flex items-center justify-between">
                  <p className="text-sm font-bold text-[#1E293B]">
                    Notifications
                  </p>
                  <button
                    onClick={() => setShowNotifs(false)}
                    className="p-1.5 rounded-full text-[#64748B] hover:text-[#EF4444] hover:bg-red-50 transition-all duration-300 hover:rotate-90"
                  >
                    <X size={14} />
                  </button>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <p className="text-sm text-[#64748B] text-center py-8">
                      No notifications yet
                    </p>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n._id}
                        onClick={() => handleNotifClick(n)}
                        className={`px-4 py-3 border-b border-[#F8FAFC] hover:bg-[#F8FAFC] cursor-pointer transition-colors ${!n.isRead ? "bg-blue-50/50 border-l-2 border-l-[#3B82F6]" : ""}`}
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

          {/* Divider */}
          <div className="hidden sm:block w-px h-6 bg-[#CBD5E1]" />

          {/* Avatar + Name */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-linear-to-br from-primary to-[#1E293B] flex items-center justify-center text-white text-xs font-bold shrink-0">
              {initials}
            </div>
            <div className="block min-w-0 max-w-[130px] sm:max-w-[180px] md:max-w-[320px]">
              <p className="text-xs sm:text-sm font-semibold text-[#1E293B] leading-tight truncate">
                {student.name || "Student"}
              </p>
              <p className="text-[10px] sm:text-xs text-text-muted mt-0.5 truncate whitespace-nowrap">
                {student.branch || ""}
                {student.branch && student.erpId ? " · " : ""}
                {student.erpId || ""}
              </p>
            </div>
          </div>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-1.5 sm:px-3 py-1.5 rounded-xl text-xs font-medium
              text-text-muted hover:text-danger hover:bg-red-50 transition-colors shrink-0"
          >
            <LogOut size={14} />
            <span className="hidden md:block">Logout</span>
          </button>
        </div>
      </nav>

      {/* ── Body ── */}
      <div className="flex pt-16">
        {/* ── Sidebar — DESKTOP ONLY (sm and above), hover to expand ── */}
        <aside
          onMouseEnter={() => setExpanded(true)}
          onMouseLeave={() => setExpanded(false)}
          className={`hidden sm:flex fixed top-16 left-0 bottom-0 z-40 flex-col bg-white border-r border-[#CBD5E1] transition-all duration-300 ease-in-out overflow-hidden ${expanded ? "w-60" : "w-16"}`}
        >
          <div className="sidebar-nav-scroll flex-1 flex flex-col gap-1 p-2 mt-2 overflow-y-auto overflow-x-hidden">
            {navLinks.map(({ to, label, icon: NavIcon }) => (
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
                <NavIcon size={18} className="shrink-0" />
                <span
                  className={`transition-all duration-200 ${expanded ? "opacity-100" : "opacity-0 w-0 overflow-hidden"}`}
                >
                  {label}
                </span>
              </NavLink>
            ))}
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
                  {student.name || "Student"}
                </p>
                <p className="text-xs text-text-muted truncate mt-0.5">
                  {student.branch || ""} · {student.erpId || ""}
                </p>
              </div>
            </div>
          </div>
        </aside>

        {/* ── Main Content — desktop pe sidebar ke hisaab se margin, mobile pe full width ── */}
        <main
          className={`flex-1 min-h-screen p-3 sm:p-6 pb-28 sm:pb-6 transition-all duration-300 ease-in-out ml-0 ${expanded ? "sm:ml-60" : "sm:ml-16"}`}
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

export default StudentLayout;
