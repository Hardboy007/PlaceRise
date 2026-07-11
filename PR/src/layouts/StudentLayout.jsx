import { useState, useEffect } from "react";
import { Outlet, NavLink, useNavigate, Link } from "react-router-dom";
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
  { to: '/student/documents', label: 'My Documents', icon: FileText },
  { to: "/student/profile", label: "Profile", icon: User },
  { to: "/student/settings", label: "Settings", icon: Settings },
];

function StudentLayout() {
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifs, setShowNotifs] = useState(false);
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
      } catch { /* empty */ }
    };
    fetchCount();
    const interval = setInterval(fetchCount, 30000);
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

  return (
    <div
      className="min-h-screen bg-background"
      style={{ fontFamily: "Inter, sans-serif" }}
    >
      {/* ── Navbar ── */}
      <nav
        className="fixed top-0 left-0 right-0 z-50 h-16
        bg-white/80 backdrop-blur border-b border-[#CBD5E1]
        px-6 flex items-center justify-between"
      >
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center shadow-[0_4px_12px_rgba(59,130,246,0.4)]">
            <Sparkles size={14} className="text-white" />
          </div>
          <span
            className="text-lg font-bold"
            style={{ fontFamily: "Space Grotesk, sans-serif" }}
          >
            <span className="text-[#1E293B]">Place</span>
            <span className="text-primary">Rise</span>
          </span>
        </Link>

        {/* Right Side */}
        <div className="flex items-center gap-3">
          {/* Notification Bell */}
          <div className="relative">
            <button
              onClick={handleBellClick}
              className="relative w-9 h-9 rounded-xl bg-background hover:bg-[#E2E8F0] flex items-center justify-center transition-colors"
            >
              <Bell size={16} className="text-text-muted" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-[#EF4444] text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>
            {showNotifs && (
              <div className="absolute right-0 top-11 w-80 bg-white rounded-2xl shadow-xl border border-[#E2E8F0] z-50 overflow-hidden">
                <div className="px-4 py-3 border-b border-[#F1F5F9] flex items-center justify-between">
                  <p className="text-sm font-bold text-[#1E293B]">
                    Notifications
                  </p>
                  <button
                    onClick={() => setShowNotifs(false)}
                    className="text-[#64748B] hover:text-[#1E293B] text-xs"
                  >
                    Close
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
          <div className="w-px h-6 bg-[#CBD5E1]" />

          {/* Avatar + Name */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-linear-to-br from-primary to-[#1E293B] flex items-center justify-center text-white text-xs font-bold shrink-0">
              {initials}
            </div>
            <div className="hidden md:block">
              <p className="text-sm font-medium text-[#1E293B] leading-none">
                {student.name || "Student"}
              </p>
              <p className="text-xs text-text-muted mt-0.5">
                {student.branch || ""} · {student.erpId || ""}
              </p>
            </div>
          </div>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium
              text-text-muted hover:text-danger hover:bg-red-50 transition-colors"
          >
            <LogOut size={14} />
            <span className="hidden md:block">Logout</span>
          </button>
        </div>
      </nav>

      {/* ── Body ── */}
      <div className="flex pt-16">
        {/* ── Sidebar — hover to expand, pushes content ── */}
        <aside
          onMouseEnter={() => setExpanded(true)}
          onMouseLeave={() => setExpanded(false)}
          className={`fixed top-16 left-0 bottom-0 z-40 flex flex-col bg-white border-r border-[#CBD5E1] transition-all duration-300 ease-in-out overflow-hidden ${expanded ? "w-60" : "w-15"}`}
        >
          <div className="flex-1 flex flex-col gap-1 p-2 mt-2 overflow-hidden">
            // eslint-disable-next-line no-unused-vars
            {navLinks.map(({ to, label }) => (
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

        {/* ── Main Content — shrinks/expands with sidebar ── */}
        <main
          className={`flex-1 min-h-screen p-6 transition-all duration-300 ease-in-out ${expanded ? "ml-60" : "ml-15"}`}
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default StudentLayout;