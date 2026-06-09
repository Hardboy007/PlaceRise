import { useState } from "react";
import { useNavigate } from "react-router-dom";

// Icons - inline SVG
const GraduationIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
    <path d="M6 12v5c3 3 9 3 12 0v-5" />
  </svg>
);
const BriefcaseIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect width="20" height="14" x="2" y="7" rx="2" />
    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
  </svg>
);
const ArrowIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M7 7h10v10" />
    <path d="M7 17 17 7" />
  </svg>
);
const SparklesIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
  </svg>
);

// Role Card Component
function RoleCard({
  icon,
  number,
  label,
  description,
  tags,
  variant,
  onSelect,
}) {
  const [hovered, setHovered] = useState(false);
  const isDark = variant === "dark";

  return (
    <div
      onClick={onSelect}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`relative overflow-hidden rounded-3xl p-8 cursor-pointer
        transition-all duration-500 select-none
        ${isDark ? "text-white" : "text-[#1E293B] border border-[#CBD5E1] bg-white"}
        ${hovered ? "-translate-y-2 rotate-0" : isDark ? "-rotate-2" : "rotate-2"}
        ${hovered ? "shadow-[0_20px_60px_-15px_rgba(59,130,246,0.4)]" : isDark ? "shadow-[0_25px_50px_-12px_rgba(15,23,42,0.5)]" : "shadow-[0_10px_40px_-10px_rgba(15,23,42,0.15)]"}
      `}
      style={
        isDark
          ? {
              background:
                "linear-gradient(135deg, #0F172A 0%, #1E293B 50%, #1e3a5f 100%)",
            }
          : {}
      }
    >
      {/* Watermark Number */}
      <span
        className={`absolute top-4 right-6 font-bold select-none pointer-events-none
          ${isDark ? "text-white" : "text-[#1E293B]"}
        `}
        style={{
          fontSize: "8rem",
          lineHeight: 1,
          opacity: 0.05,
          fontFamily: "Space Grotesk, sans-serif",
        }}
      >
        {number}
      </span>

      {/* Decorative Orb */}
      <div
        className={`absolute -bottom-8 -right-8 w-48 h-48 rounded-full blur-2xl
          transition-transform duration-500
          ${hovered ? "scale-125" : "scale-100"}
          ${isDark ? "bg-blue-500/30" : "bg-blue-400/20"}
        `}
      />

      {/* Top Row */}
      <div className="relative flex items-center justify-between mb-10">
        {/* Icon Title */}
        <div
          className={`w-12 h-12 rounded-2xl flex items-center justify-center
          ${isDark ? "bg-primary" : "bg-[#1E293B] text-white"}
        `}
        >
          {icon}
        </div>

        {/* Arrow Button */}
        <div
          className={`w-11 h-11 rounded-full flex items-center justify-center
          transition-transform duration-300
          ${hovered ? "rotate-45" : "rotate-0"}
          ${isDark ? "bg-white/10 text-white" : "bg-[#1E293B] text-white"}
        `}
        >
          <ArrowIcon />
        </div>
      </div>

      {/* Body */}
      <div className="relative">
        <p
          className={`text-xs font-semibold tracking-widest uppercase mb-2
          ${isDark ? "text-primary" : "text-primary"}
        `}
        >
          Continue As
        </p>
        <h2
          className="text-3xl font-bold mb-3"
          style={{ fontFamily: "Space Grotesk, sans-serif" }}
        >
          {label}
        </h2>
        <p
          className={`text-sm leading-relaxed ${isDark ? "text-white/70" : "text-text-muted"}`}
        >
          {description}
        </p>

        {/* Tags */}
        <div className="flex flex-wrap gap-2 mt-8">
          {tags.map((tag) => (
            <span
              key={tag}
              className={`px-3 py-1 rounded-full text-xs font-medium border
                ${
                  isDark
                    ? "border-white/20 text-white/80 bg-white/5"
                    : "border-[#CBD5E1] text-text-muted bg-background"
                }
              `}
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

// Main Page
function RoleSelectionPage() {
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const [modalRole, setModalRole] = useState(null);
  const [erpId, setErpId] = useState("");
  const [password, setPassword] = useState("");

  const handleRoleSelect = (role) => {
    setModalRole(role);
    setShowModal(true);
  };

  const handleLogin = () => {
    if (modalRole === "student") {
      navigate("/student/onboarding");
    } else {
      navigate("/coordinator/dashboard");
    }
  };

  return (
    <div
      className="min-h-screen bg-background relative overflow-hidden"
      style={{ fontFamily: "Inter, sans-serif" }}
    >
      {/* Background - Diagonal Navy Panel */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "linear-gradient(135deg, #0F172A 0%, #1E293B 50%, #1e3a5f 100%)",
          clipPath: "polygon(0 0, 100% 0, 100% 38%, 0 78%)",
        }}
      />

      {/* Mesh Glow */}
      <div
        className="absolute inset-0 pointer-events-none opacity-60"
        style={{
          background: `
            radial-gradient(at 20% 30%, rgba(59,130,246,0.15), transparent 50%),
            radial-gradient(at 80% 70%, rgba(96,165,250,0.1), transparent 50%)
          `,
        }}
      />

      {/* Floating Orbs */}
      <div className="absolute top-10 right-20 w-64 h-64 rounded-full bg-blue-500/20 blur-3xl animate-float-slow pointer-events-none" />
      <div className="absolute bottom-20 left-10 w-48 h-48 rounded-full bg-blue-400/20 blur-3xl animate-float-slow-delayed pointer-events-none" />

      {/* Navbar */}
      <header className="relative z-10 px-6 py-6 md:px-12 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="relative w-10 h-10 rounded-2xl bg-primary flex items-center justify-center shadow-[0_20px_60px_-15px_rgba(59,130,246,0.4)]">
            <SparklesIcon />
            <div className="absolute inset-0 rounded-2xl border-2 border-primary animate-pulse-ring" />
          </div>
          <span
            className="text-xl font-bold"
            style={{ fontFamily: "Space Grotesk, sans-serif" }}
          >
            <span className="text-white">Place</span>
            <span className="text-accent">Rise</span>
          </span>
        </div>

        {/* Nav Links */}
        <nav className="hidden md:flex items-center gap-8">
          {["About", "Companies", "Support"].map((link) => (
            <a
              key={link}
              href="#"
              className="text-white/70 hover:text-white text-sm transition-colors"
            >
              {link}
            </a>
          ))}
        </nav>

        {/* Status Pill */}
        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur border border-white/20">
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span className="text-white/80 text-xs font-medium">
            Season 2026 live
          </span>
        </div>
      </header>

      {/* Hero */}
      <section className="relative z-10 text-center px-6 pt-10 md:pt-16 max-w-5xl mx-auto animate-slide-up">
        {/* Eyebrow */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur border border-white/20 mb-6">
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          <span className="text-white/80 text-sm">
            Powering placements at DBUU
          </span>
        </div>

        {/* H1 */}
        <h1
          className="text-5xl md:text-7xl font-bold text-white mb-4 leading-none"
          style={{
            fontFamily: "Space Grotesk, sans-serif",
            letterSpacing: "-0.03em",
          }}
        >
          Your placement journey,{" "}
          <span className="italic text-accent inline-block">
            simplified.
            {/* SVG Underline */}
            <svg
              viewBox="0 0 200 12"
              className="w-full mt-1"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M2 8 Q 50 2, 100 6 T 198 4"
                stroke="#60A5FA"
                strokeWidth="3"
                strokeLinecap="round"
                fill="none"
              />
            </svg>
          </span>
        </h1>
        <p
          className="text-white/70 text-lg max-w-xl mx-auto mt-4"
          style={{ animationDelay: "200ms" }}
        >
          One platform for students and placement teams to connect, collaborate,
          and close every drive.
        </p>
      </section>

      {/* Role Cards */}
      <section className="relative z-10 max-w-4xl mx-auto px-6 mt-16">
        <div className="grid md:grid-cols-2 gap-8 relative">
          {/* Student Card */}
          <div>
            <RoleCard
              number="01"
              icon={<GraduationIcon />}
              label="I'm a Student"
              description="Browse drives, apply in clicks, and track every stage of your journey."
              tags={["Live Drives", "Application Tracker", "Announcements"]}
              variant="dark"
              onSelect={() => handleRoleSelect("student")}
            />
          </div>

          {/* OR Badge */}
          <div
            className="hidden md:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10
            w-16 h-16 rounded-full bg-white items-center justify-center
            shadow-[0_10px_40px_-10px_rgba(15,23,42,0.15)]"
          >
            <div className="absolute inset-0 rounded-full border-2 border-dashed border-primary animate-pulse-ring" />
            <span
              className="text-sm font-bold tracking-widest text-[#1E293B]"
              style={{ fontFamily: "Space Grotesk, sans-serif" }}
            >
              OR
            </span>
          </div>

          {/* Coordinator Card */}
          <div className="md:mt-32">
            <RoleCard
              number="02"
              icon={<BriefcaseIcon />}
              label="Placement Team"
              description="Manage drives, shortlist students, and coordinate with recruiters effortlessly."
              tags={["Drive Manager", "Analytics", "Student Database"]}
              variant="light"
              onSelect={() => handleRoleSelect("coordinator")}
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 max-w-4xl mx-auto px-6 py-8 mt-4 mb-4">
        <div className="bg-white/70 backdrop-blur rounded-3xl border border-[#CBD5E1] px-8 py-5 flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Left - Logo + Tagline */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center">
              <SparklesIcon />
            </div>
            <div>
              <span
                className="font-bold text-[#1E293B]"
                style={{ fontFamily: "Space Grotesk, sans-serif" }}
              >
                Place<span className="text-primary">Rise</span>
              </span>
              <p className="text-xs text-text-muted">
                Your placement journey, simplified.
              </p>
            </div>
          </div>

          {/* Right - Links */}
          <div className="flex items-center gap-6">
            {["Privacy Policy", "Contact", "Help"].map((link) => (
              <a
                key={link}
                href="#"
                className="text-xs text-text-muted hover:text-[#1E293B] transition-colors"
              >
                {link}
              </a>
            ))}
            <span className="text-xs text-text-muted">© 2026 PlaceRise</span>
          </div>
        </div>
      </footer>
      {/* Login Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-8 w-full max-w-md mx-4 shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-xs font-semibold tracking-widest uppercase text-primary">
                  {modalRole === "student"
                    ? "Student Login"
                    : "Coordinator Login"}
                </p>
                <h3
                  className="text-2xl font-bold text-[#1E293B] mt-1"
                  style={{ fontFamily: "Space Grotesk, sans-serif" }}
                >
                  Welcome back
                </h3>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="w-9 h-9 rounded-full bg-background flex items-center justify-center text-text-muted hover:bg-[#E2E8F0] transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Fields */}
            <div className="flex flex-col gap-4">
              <div>
                <label className="text-sm font-medium text-[#1E293B] block mb-1">
                  {modalRole === "student" ? "ERP ID" : "ERP ID"}
                </label>
                <input
                  type="text"
                  value={erpId}
                  onChange={(e) => setErpId(e.target.value)}
                  placeholder={
                    modalRole === "student"
                      ? "Enter your ERP ID"
                      : "Enter your ERP ID"
                  }
                  className="w-full px-4 py-3 rounded-xl border border-[#CBD5E1] text-[#1E293B] placeholder-text-muted focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-[#1E293B] block mb-1">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full px-4 py-3 rounded-xl border border-[#CBD5E1] text-[#1E293B] placeholder-text-muted focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition"
                />
              </div>
            </div>

            {/* Login Button */}
            <button
              onClick={handleLogin}
              className="w-full mt-6 py-3 rounded-xl bg-primary hover:bg-blue-600 text-white font-semibold transition-colors cursor-pointer"
              style={{ fontFamily: "Space Grotesk, sans-serif" }}
            >
              Login →
            </button>

            {modalRole === "student" && (
              <p className="text-center text-xs text-text-muted mt-4">
                Having trouble? Contact your placement coordinator.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default RoleSelectionPage;
