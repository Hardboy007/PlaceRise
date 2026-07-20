import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";

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
      className={`relative overflow-hidden rounded-3xl p-5 sm:p-8 cursor-pointer
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
        className={`absolute top-4 right-6 font-bold select-none pointer-events-none text-[4rem] sm:text-[8rem]
    ${isDark ? "text-white" : "text-[#1E293B]"}
  `}
        style={{
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
      <div className="relative flex items-center justify-between mb-6 sm:mb-10">
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
          className="text-2xl sm:text-3xl font-bold mb-3"
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
        <div className="flex flex-wrap gap-2 mt-5 sm:mt-8">
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
  const [showPassword, setShowPassword] = useState(false);
  const [modalView, setModalView] = useState("login"); // "login" | "forgot"
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotMessage, setForgotMessage] = useState("");

  const handleRoleSelect = (role) => {
    setModalRole(role);
    setErpId("");
    setPassword("");
    setError("");
    setModalView("login");
    setForgotEmail("");
    setForgotMessage("");
    setShowModal(true);
  };

  const handleModalClose = () => {
    setShowModal(false);
    setErpId("");
    setPassword("");
    setError("");
    setModalView("login");
    setForgotEmail("");
    setForgotMessage("");
  };

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setError("");

    // ERP ID ko trim karo — case ko chhedna nahi, jo user ne type
    // kiya wahi bhejo. Case-insensitive matching ab backend
    // (authController.js) handle karta hai, taaki UI mein koi
    // silent/unexpected case-change na dikhe.
    const normalizedErpId = erpId.trim();
    if (!normalizedErpId) {
      setError("ERP ID is required");
      return;
    }

    setErpId(normalizedErpId);
    setLoading(true);

    try {
      const BASE_URL =
        import.meta.env.VITE_API_URL || "http://localhost:5000/api";

      const endpoint =
        modalRole === "student"
          ? `${BASE_URL}/auth/student/login`
          : `${BASE_URL}/auth/coordinator/login`;

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          erpId: normalizedErpId,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Login failed");
        setLoading(false);
        return;
      }

      // Token save karo
      localStorage.setItem("token", data.token);
      localStorage.setItem("role", modalRole);

      const searchParams = new URLSearchParams(window.location.search);
      const redirect = searchParams.get("redirect");

      if (modalRole === "student") {
        localStorage.setItem("student", JSON.stringify(data.student));
        localStorage.setItem("isFirstLogin", data.isFirstLogin);
        if (data.isFirstLogin) {
          navigate("/student/change-password");
        } else if (redirect) {
          navigate(redirect);
        } else {
          navigate("/student/dashboard");
        }
      } else {
        localStorage.setItem("coordinator", JSON.stringify(data.coordinator));
        navigate("/coordinator/dashboard");
      }
    } catch (err) {
      setError("Unable to connect to the server");
    }

    setLoading(false);
  };

  const handleForgotPassword = async () => {
    setForgotMessage("");
    const trimmedEmail = forgotEmail.trim();
    if (!trimmedEmail) {
      setForgotMessage("Please enter your email");
      return;
    }

    setForgotLoading(true);
    try {
      const BASE_URL =
        import.meta.env.VITE_API_URL || "http://localhost:5000/api";
      const response = await fetch(`${BASE_URL}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmedEmail }),
      });
      const data = await response.json();
      setForgotMessage(
        data.message ||
          "If that email is registered, a reset link has been sent.",
      );
    } catch (err) {
      setForgotMessage("Unable to connect to the server");
    }
    setForgotLoading(false);
  };

  return (
    <div
      className="min-h-screen bg-background relative overflow-hidden"
      style={{
        fontFamily: "Inter, sans-serif",
        paddingTop: "env(safe-area-inset-top)",
      }}
    >
      <div className="relative">
        {/* Background - Diagonal Navy Panel */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "linear-gradient(135deg, #0F172A 0%, #1E293B 50%, #1e3a5f 100%)",
            clipPath: "polygon(0 0, 100% 0, 100% 60%, 0 100%)",
          }}
        />
        {/* Building ab yahi andar hai — isi clip-path se cut hogi */}
        <img
          src="/images/building 2.png"
          alt=""
          className="absolute hidden sm:block"
          style={{
            top: "240px",
            right: "0px",
            width: "500px",
            height: "500px",
            opacity: 0.4,
            objectFit: "cover",
            clipPath: "polygon(0% 0%, 100% 0%, 100% 67%, 0% 93%)",
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
        <div className="absolute top-10 right-20 w-40 h-40 sm:w-64 sm:h-64 rounded-full bg-blue-500/20 blur-3xl animate-float-slow pointer-events-none" />
        <div className="hidden sm:block absolute bottom-20 left-10 w-48 h-48 rounded-full bg-blue-400/20 blur-3xl animate-float-slow-delayed pointer-events-none" />
        {/* Navbar */}
        <header className="relative z-10 px-6 py-6 md:px-12 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="relative w-10 h-10 rounded-2xl bg-white flex items-center justify-center shadow-[0_20px_60px_-15px_rgba(59,130,246,0.4)] overflow-hidden">
              <img
                src="/images/logo-transparent.png"
                alt="PlaceRise"
                className="w-full h-full object-contain"
              />
              <div className="absolute inset-0 rounded-2xl border-3 border-primary animate-pulse-ring" />
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
            <Link
              to="/about"
              className="text-white/70 hover:text-white text-[18px] transition-colors"
            >
              About
            </Link>

            <Link
              to="/support"
              className="text-white/70 hover:text-white text-[18px] transition-colors"
            >
              Support
            </Link>
          </nav>

          {/* Status Pill */}
          <div className="flex items-center gap-1.5 sm:gap-2 px-2.5 py-1.5 sm:px-4 sm:py-2 rounded-full bg-white/10 backdrop-blur border border-white/20">
            <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-green-400 animate-pulse shrink-0" />
            <span className="text-white/80 text-[10px] sm:text-xs font-medium whitespace-nowrap">
              Season 2026 live
            </span>
          </div>
        </header>

        {/* Hero */}
        <section className="relative z-10 text-center px-6 pt-10 md:pt-16 max-w-5xl mx-auto animate-slide-up">
          {/* Mobile-only nav pills — About / Support, same capsule style as eyebrow below */}
          <div className="flex md:hidden items-center justify-center gap-3 mb-4">
            <Link
              to="/about"
              className="inline-flex items-center px-4 py-2 rounded-full bg-white/10 backdrop-blur border border-white/20 text-white/80 hover:text-white text-sm transition-colors"
            >
              About
            </Link>
            <Link
              to="/support"
              className="inline-flex items-center px-4 py-2 rounded-full bg-white/10 backdrop-blur border border-white/20 text-white/80 hover:text-white text-sm transition-colors"
            >
              Support
            </Link>
          </div>

          {/* Eyebrow */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur border border-white/20 mb-6">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="text-white/80 text-sm">
              Powering placements at DBUU
            </span>
          </div>

          {/* H1 */}
          <h1
            className="text-3xl sm:text-5xl md:text-7xl font-bold text-white mb-4 leading-tight sm:leading-none"
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
            className="text-white/70 text-sm sm:text-lg max-w-xl mx-auto mt-4 px-2"
            style={{ animationDelay: "200ms" }}
          >
            One platform for students and placement teams to connect,
            collaborate, and close every drive.
          </p>
        </section>

        {/* Role Cards */}
        <section className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 mt-10 sm:mt-16">
          <div className="grid md:grid-cols-2 gap-6 sm:gap-8 relative">
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

            {/* OR Badge — desktop, centered over both cards */}
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

            {/* OR divider — mobile only, sits between the stacked cards */}
            <div className="flex md:hidden items-center gap-3 -my-1">
              <span className="flex-1 h-px bg-[#CBD5E1]" />
              <span className="text-xs font-bold tracking-widest text-text-muted px-2">
                OR
              </span>
              <span className="flex-1 h-px bg-[#CBD5E1]" />
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
      </div>
      {/* Background texture for the white section — city skyline, very faint */}
      <div
        className="absolute pointer-events-none overflow-hidden hidden sm:block"
        style={{ top: "950px", left: 0, right: 0, height: "1000px" }}
      >
        {/* Blueprint grid — halka texture, optional rakh sakte ho */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `
        linear-gradient(rgba(15,23,42,0.04) 1px, transparent 1px),
        linear-gradient(90deg, rgba(15,23,42,0.04) 1px, transparent 1px)
      `,
            backgroundSize: "48px 48px",
          }}
        />

        {/* City skyline — full width, sitting at the bottom, fading upward */}
        <img
          src="/images/building 3.png"
          alt=""
          className="absolute bottom-0 left-0 right-0"
          style={{
            width: "100%",
            height: "auto",
            opacity: 0.1,
            filter: "grayscale(100%)",
            mixBlendMode: "multiply",
            WebkitMaskImage:
              "linear-gradient(to top, black 40%, transparent 100%)",
            maskImage: "linear-gradient(to top, black 40%, transparent 100%)",
          }}
        />
      </div>
      {/* Feature Highlights — bento grid */}
      <section className="relative z-10 max-w-5xl mx-auto px-6 mt-24 mb-4">
        <div className="text-center mb-12">
          <p className="text-xs font-semibold tracking-widest uppercase text-primary mb-2">
            Why PlaceRise
          </p>
          <h2
            className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#1E293B] px-2"
            style={{ fontFamily: "Space Grotesk, sans-serif" }}
          >
            Everything placement season needs
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 lg:grid-rows-2 gap-5">
          {/* Featured card — big, dark, spans 2x2 */}
          <div
            className="sm:col-span-2 lg:col-span-2 lg:row-span-2 relative overflow-hidden rounded-3xl p-5 sm:p-8 text-white
        -rotate-1 hover:rotate-0 hover:-translate-y-1 transition-all duration-500
        shadow-[0_25px_50px_-12px_rgba(15,23,42,0.5)] hover:shadow-[0_20px_60px_-15px_rgba(59,130,246,0.4)]"
            style={{
              backgroundImage: `linear-gradient(180deg, #0F172A 0%, #0F172A 45%, rgba(15,23,42,0.75) 75%, rgba(15,23,42,0.35) 100%), url("/images/building.png")`,
              backgroundSize: "auto 140%",
              backgroundPosition: "center bottom",
              backgroundRepeat: "no-repeat",
            }}
          >
            <span
              className="absolute top-2 right-4 font-bold select-none pointer-events-none text-white text-[4.5rem] sm:text-[9rem]"
              style={{
                lineHeight: 1,
                opacity: 0.06,
                fontFamily: "Space Grotesk, sans-serif",
              }}
            >
              01
            </span>
            <div className="absolute -bottom-10 -right-10 w-56 h-56 rounded-full bg-blue-500/30 blur-2xl" />
            {/* Building — bottom-right corner, full image visible */}
            <img
              src="/images/building.png"
              alt=""
              className="absolute pointer-events-none"
              style={{
                bottom: "80px",
                right: "0px",
                width: "60%",
                height: "auto",
                opacity: 0.45,
                mixBlendMode: "lighten",
              }}
            />
            <div className="relative flex flex-col h-full justify-between min-h-55 lg:min-h-80">
              <div>
                <div className="flex items-center gap-2 mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center">
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15 17h5l-1.4-1.4A2 2 0 0118 14.2V11a6 6 0 00-4-5.65V5a2 2 0 10-4 0v.35A6 6 0 006 11v3.2a2 2 0 01-.6 1.4L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                      />
                    </svg>
                  </div>
                  <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-xs text-white/80">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                    Live
                  </span>
                </div>
                <h3
                  className="text-xl sm:text-2xl font-bold mb-3"
                  style={{ fontFamily: "Space Grotesk, sans-serif" }}
                >
                  Real-time Announcements
                </h3>
                <p className="text-white/70 text-sm leading-relaxed max-w-sm">
                  Every update from your placement cell reaches you the moment
                  it's posted — no missed forwards, no buried messages.
                </p>
              </div>
            </div>
          </div>

          {/* Application Tracking — wide */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-[#CBD5E1] p-6 hover:-translate-y-1 hover:shadow-[0_10px_40px_-10px_rgba(15,23,42,0.15)] transition-all duration-300 relative overflow-hidden">
            <span
              className="absolute top-1 right-3 font-bold select-none pointer-events-none text-[#1E293B] text-[2.5rem] sm:text-[5rem]"
              style={{
                lineHeight: 1,
                opacity: 0.05,
                fontFamily: "Space Grotesk, sans-serif",
              }}
            >
              02
            </span>
            <div className="relative">
              <div className="w-11 h-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-5">
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  viewBox="0 0 24 24"
                >
                  <rect x="4" y="4" width="16" height="18" rx="2" />
                  <path strokeLinecap="round" d="M8 9h8M8 13h8M8 17h5" />
                </svg>
              </div>
              <h3
                className="text-[#1E293B] font-bold text-base mb-2"
                style={{ fontFamily: "Space Grotesk, sans-serif" }}
              >
                Application Tracking
              </h3>
              <p className="text-text-muted text-sm leading-relaxed">
                Track every application from applied to selected, in one place,
                without chasing anyone for updates.
              </p>
            </div>
          </div>

          {/* Eligibility Matching — small */}
          <div className="bg-white rounded-2xl border border-[#CBD5E1] p-6 hover:-translate-y-1 hover:shadow-[0_10px_40px_-10px_rgba(15,23,42,0.15)] transition-all duration-300 relative overflow-hidden">
            <span
              className="absolute top-1 right-2 font-bold select-none pointer-events-none text-[#1E293B] text-[2rem] sm:text-[4rem]"
              style={{
                lineHeight: 1,
                opacity: 0.05,
                fontFamily: "Space Grotesk, sans-serif",
              }}
            >
              03
            </span>
            <div className="relative">
              <div className="w-11 h-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-5">
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  viewBox="0 0 24 24"
                >
                  <circle cx="12" cy="12" r="9" />
                  <circle cx="12" cy="12" r="5" />
                  <circle cx="12" cy="12" r="1" fill="currentColor" />
                </svg>
              </div>
              <h3
                className="text-[#1E293B] font-bold text-base mb-2"
                style={{ fontFamily: "Space Grotesk, sans-serif" }}
              >
                Eligibility Matching
              </h3>
              <p className="text-text-muted text-sm leading-relaxed">
                See only what applies to your school and course.
              </p>
            </div>
          </div>

          {/* Coordinator Dashboard — small */}
          <div className="bg-white rounded-2xl border border-[#CBD5E1] p-6 hover:-translate-y-1 hover:shadow-[0_10px_40px_-10px_rgba(15,23,42,0.15)] transition-all duration-300 relative overflow-hidden">
            <span
              className="absolute top-1 right-2 font-bold select-none pointer-events-none text-[#1E293B] text-[2rem] sm:text-[4rem]"
              style={{
                lineHeight: 1,
                opacity: 0.05,
                fontFamily: "Space Grotesk, sans-serif",
              }}
            >
              04
            </span>
            <div className="relative">
              <div className="w-11 h-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-5">
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3 3v18h18M8 17V10m5 7V6m5 11v-4"
                  />
                </svg>
              </div>
              <h3
                className="text-[#1E293B] font-bold text-base mb-2"
                style={{ fontFamily: "Space Grotesk, sans-serif" }}
              >
                Coordinator Dashboard
              </h3>
              <p className="text-text-muted text-sm leading-relaxed">
                Manage drives, shortlist candidates, message the batch — one
                screen.
              </p>
            </div>
          </div>
        </div>
      </section>
      {/* Footer */}
      <footer className="relative z-10 max-w-4xl mx-auto px-6 py-8 mt-4 mb-4">
        <div className="bg-white/70 backdrop-blur rounded-3xl border border-[#CBD5E1] px-5 py-5 sm:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Left - Logo + Tagline */}
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-white flex items-center justify-center">
              <img
                src="/images/logo-transparent.png"
                alt="PlaceRise"
                className="w-full h-full object-contain"
              />
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
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-6">
            {[
              { label: "Privacy Policy", href: "/privacy" },
              { label: "Support", href: "/support" },
            ].map(({ label, href }) => (
              <a
                key={label}
                href={href}
                className="text-xs text-text-muted hover:text-[#1E293B] transition-colors py-2 px-1 -m-1"
              >
                {label}
              </a>
            ))}
            <span className="text-xs text-text-muted">© 2026 PlaceRise</span>
          </div>
        </div>
      </footer>
      {/* Login Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-5 sm:p-8 w-full max-w-md mx-4 shadow-2xl">
            {modalView === "login" ? (
              <>
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
                    onClick={handleModalClose}
                    className="w-9 h-9 rounded-full bg-background flex items-center justify-center text-text-muted hover:bg-[#E2E8F0] transition-colors cursor-pointer"
                  >
                    ✕
                  </button>
                </div>

                {/* Fields */}
                <div className="flex flex-col gap-4">
                  <div>
                    <label className="text-sm font-medium text-[#1E293B] block mb-1">
                      ERP ID
                    </label>
                    <input
                      type="text"
                      value={erpId}
                      onChange={(e) => setErpId(e.target.value)}
                      placeholder="Enter your ERP ID"
                      className="w-full px-4 py-3 rounded-xl border border-[#CBD5E1] text-[#1E293B] placeholder-text-muted focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition"
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-sm font-medium text-[#1E293B]">
                        Password
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setModalView("forgot");
                          setError("");
                        }}
                        className="text-xs font-semibold text-primary hover:underline"
                      >
                        Forgot password?
                      </button>
                    </div>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter your password"
                        className="w-full px-4 py-3 pr-12 rounded-xl border border-[#CBD5E1] text-[#1E293B] placeholder-text-muted focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((prev) => !prev)}
                        className="absolute inset-y-0 right-0 flex items-center px-3 -mr-1 text-text-muted hover:text-[#1E293B]"
                        aria-label={
                          showPassword ? "Hide password" : "Show password"
                        }
                      >
                        {showPassword ? (
                          <EyeOff size={18} />
                        ) : (
                          <Eye size={18} />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {error && (
                  <p className="text-xs text-danger text-center mt-4">
                    {error}
                  </p>
                )}

                <button
                  onClick={handleLogin}
                  disabled={loading}
                  className="w-full mt-4 py-3 rounded-xl bg-primary hover:bg-blue-600 text-white font-semibold transition-colors cursor-pointer disabled:opacity-50"
                  style={{ fontFamily: "Space Grotesk, sans-serif" }}
                >
                  {loading ? "Logging in..." : "Login →"}
                </button>

                {modalRole === "student" && (
                  <p className="text-center text-xs text-text-muted mt-4">
                    Having trouble? Contact your placement coordinator.
                  </p>
                )}
              </>
            ) : (
              <>
                {/* Forgot Password view */}
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <p className="text-xs font-semibold tracking-widest uppercase text-primary">
                      Reset Password
                    </p>
                    <h3
                      className="text-2xl font-bold text-[#1E293B] mt-1"
                      style={{ fontFamily: "Space Grotesk, sans-serif" }}
                    >
                      Forgot password?
                    </h3>
                  </div>
                  <button
                    onClick={handleModalClose}
                    className="w-9 h-9 rounded-full bg-background flex items-center justify-center text-text-muted hover:bg-[#E2E8F0] transition-colors cursor-pointer"
                  >
                    ✕
                  </button>
                </div>

                <p className="text-sm text-text-muted mb-4">
                  Enter your registered email — we'll send you a link to reset
                  your password.
                </p>

                <div>
                  <label className="text-sm font-medium text-[#1E293B] block mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full px-4 py-3 rounded-xl border border-[#CBD5E1] text-[#1E293B] placeholder-text-muted focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition"
                  />
                </div>

                {forgotMessage && (
                  <p className="text-xs text-center mt-4 text-[#1E293B]">
                    {forgotMessage}
                  </p>
                )}

                <button
                  onClick={handleForgotPassword}
                  disabled={forgotLoading}
                  className="w-full mt-4 py-3 rounded-xl bg-primary hover:bg-blue-600 text-white font-semibold transition-colors cursor-pointer disabled:opacity-50"
                  style={{ fontFamily: "Space Grotesk, sans-serif" }}
                >
                  {forgotLoading ? "Sending..." : "Send Reset Link"}
                </button>

                <button
                  onClick={() => {
                    setModalView("login");
                    setForgotMessage("");
                  }}
                  className="w-full mt-3 text-center text-xs font-semibold text-text-muted hover:text-[#1E293B]"
                >
                  ← Back to login
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default RoleSelectionPage;
