import { Outlet, NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Building2,
  ClipboardList,
  User,
  Settings,
  Bell,
  LogOut,
  Sparkles,
  ChevronRight,
} from "lucide-react";

const navLinks = [
  { to: "/student/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/student/companies", label: "Companies", icon: Building2 },
  {
    to: "/student/applications",
    label: "My Applications",
    icon: ClipboardList,
  },
  { to: "/student/profile", label: "Profile", icon: User },
  { to: "/student/settings", label: "Settings", icon: Settings },
];

function StudentLayout() {
  const navigate = useNavigate();

  return (
    <div
      className="min-h-screen bg-background"
      style={{ fontFamily: "Inter, sans-serif" }}
    >
      {/* Navbar */}
      <nav
        className="fixed top-0 left-0 right-0 z-50 h-16
        bg-white/80 backdrop-blur border-b border-[#CBD5E1]
        px-6 flex items-center justify-between"
      >
        {/* Logo */}
        <div className="flex items-center gap-2.5">
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
        </div>

        {/* Right Side */}
        <div className="flex items-center gap-3">
          {/* Notification Bell */}
          <button className="relative w-9 h-9 rounded-xl bg-background hover:bg-[#E2E8F0] flex items-center justify-center transition-colors">
            <Bell size={16} className="text-text-muted" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-danger rounded-full" />
          </button>

          {/* Divider */}
          <div className="w-px h-6 bg-[#CBD5E1]" />

          {/* Avatar + Name */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-[#1E293B] flex items-center justify-center text-white text-xs font-bold">
              JD
            </div>
            <div className="hidden md:block">
              <p className="text-sm font-medium text-[#1E293B] leading-none">
                John Doe
              </p>
              <p className="text-xs text-text-muted mt-0.5">CSE · Batch 2025</p>
            </div>
          </div>

          {/* Logout */}
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium
              text-text-muted hover:text-danger hover:bg-red-50 transition-colors"
          >
            <LogOut size={14} />
            <span className="hidden md:block">Logout</span>
          </button>
        </div>
      </nav>

      {/* Body */}
      <div className="flex pt-16">
        {/* Sidebar */}
        <aside className="fixed top-16 left-0 bottom-0 w-56 bg-white border-r border-[#CBD5E1] flex flex-col p-3 gap-1 z-40">
          {/* Nav Links */}
          <div className="flex-1 flex flex-col gap-1 mt-2">
            {navLinks.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `group flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200
                  ${
                    isActive
                      ? "bg-primary text-white shadow-[0_4px_12px_rgba(59,130,246,0.3)]"
                      : "text-text-muted hover:bg-background hover:text-[#1E293B]"
                  }`
                }
              >
                <div className="flex items-center gap-3">
                  <Icon size={16} />
                  <span>{label}</span>
                </div>
                <ChevronRight
                  size={14}
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                />
              </NavLink>
            ))}
          </div>

          {/* Bottom - User Card */}
          <div className="mt-auto p-3 rounded-xl bg-background border border-[#CBD5E1]">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-[#1E293B] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                JD
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-[#1E293B] truncate">
                  John Doe
                </p>
                <p className="text-xs text-text-muted truncate">
                  ERP: 2021CSE001
                </p>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="ml-56 flex-1 min-h-screen p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default StudentLayout;
