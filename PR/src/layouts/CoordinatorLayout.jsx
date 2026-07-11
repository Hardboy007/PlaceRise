import { useState, useEffect } from "react";
import { Outlet, NavLink, useNavigate, Link } from "react-router-dom";
import { api } from "../utils/api";
import {
  LayoutDashboard,
  Users,
  Building2,
  BarChart3,
  Megaphone,
  User,
  LogOut,
  Sparkles,
  Calendar,
  FileText,
  QrCode,
  Bell,
  X,
} from "lucide-react";

const navLinks = [
  { to: "/coordinator/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/coordinator/students", label: "Students", icon: Users },
  { to: "/coordinator/companies", label: "Companies", icon: Building2 },
  { to: "/coordinator/calendar", label: "Calendar", icon: Calendar },
  { to: "/coordinator/applications", label: "Applications", icon: BarChart3 },
  { to: "/coordinator/announcements", label: "Announcements", icon: Megaphone },
  { to: "/coordinator/profile", label: "Profile & Settings", icon: User },
  { to: '/coordinator/noc', label: 'NOC / LOR', icon: FileText },
  { to: '/coordinator/attendance', label: 'Attendance', icon: QrCode },
];

function CoordinatorLayout() {
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifs, setShowNotifs] = useState(false);
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
      const data = await api.get('/notifications/unread-count');
      setUnreadCount(data.count || 0);
    };
    fetchCount();
    const interval = setInterval(fetchCount, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleBellClick = async () => {
    setShowNotifs(!showNotifs);
    if (!showNotifs) {
      const data = await api.get('/notifications');
      setNotifications(Array.isArray(data) ? data : []);
      // Saari read mark karo
      await api.put('/notifications/mark-all-read');
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

  return (
    <div
      className="min-h-screen bg-background"
      style={{ fontFamily: "Inter, sans-serif" }}
    >
      {/* ── Navbar ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 h-16 bg-white/80 backdrop-blur border-b border-[#CBD5E1] px-6 flex items-center justify-between">
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
          <span className="ml-2 px-2 py-0.5 rounded-full text-xs font-semibold bg-[#1E293B] text-white">
            Coordinator
          </span>
        </Link>

        <div className="flex items-center gap-3">
          {/* Notification Bell */}
          <div className="relative">
            <button
              onClick={handleBellClick}
              className="relative w-9 h-9 rounded-xl bg-[#F1F5F9] hover:bg-[#E2E8F0] flex items-center justify-center transition-colors"
            >
              <Bell size={16} className="text-[#64748B]" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-[#EF4444] text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
            {/* Notification Dropdown */}
            {showNotifs && (
              <div className="absolute right-0 top-11 w-80 bg-white rounded-2xl shadow-xl border border-[#E2E8F0] z-50 overflow-hidden">
                <div className="px-4 py-3 border-b border-[#F1F5F9] flex items-center justify-between">
                  <p className="text-sm font-bold text-[#1E293B]">Notifications</p>
                  <button
                    onClick={() => setShowNotifs(false)}
                    className="p-1.5 rounded-full text-[#64748B] hover:text-[#EF4444] hover:bg-red-50 transition-all duration-300 hover:rotate-90"
                  >
                    <X size={16} />
                  </button>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <p className="text-sm text-[#64748B] text-center py-8">No notifications</p>
                  ) : (
                    notifications.map(n => (
                      <div key={n._id} className={`px-4 py-3 border-b border-[#F8FAFC] hover:bg-[#F8FAFC] cursor-pointer ${!n.isRead ? 'bg-blue-50/50' : ''}`}>
                        <p className="text-sm font-semibold text-[#1E293B]">{n.title}</p>
                        <p className="text-xs text-[#64748B] mt-0.5">{n.message}</p>
                        <p className="text-xs text-[#94A3B8] mt-1">{new Date(n.createdAt).toLocaleString('en-IN')}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-linear-to-br from-primary to-[#1E293B] flex items-center justify-center text-white text-xs font-bold">
              {initials}
            </div>
            <div className="hidden md:block">
              <p className="text-sm font-medium text-[#1E293B] leading-none">
                {coordinator.name || "Coordinator"}
              </p>
              <p className="text-xs text-text-muted mt-0.5">
                Placement Coordinator
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-text-muted hover:text-danger hover:bg-red-50 transition-colors"
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
            {navLinks.map(({ to, label, icon: Icon }) => (
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
                  {coordinator.name || "Coordinator"}
                </p>
                <p className="text-xs text-text-muted truncate mt-0.5">
                  Placement Cell · DBUU
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

export default CoordinatorLayout;