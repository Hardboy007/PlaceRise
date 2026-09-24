import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, Phone, Check, Shield, ArrowRight } from "lucide-react";
import { api } from "../../utils/api";

export default function VerifyContactPage() {
  const navigate = useNavigate();

  const [emailInput, setEmailInput] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpInput, setOtpInput] = useState("");
  const [emailVerified, setEmailVerified] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpError, setOtpError] = useState("");
  const [resendTimer, setResendTimer] = useState(0);

  const [mobile, setMobile] = useState("");
  const [mobileError, setMobileError] = useState("");

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    document.title = "Verify Contact — PlaceRise";
  }, []);

  const isValidEmail = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

  const handleSendOtp = async () => {
    if (!isValidEmail(emailInput)) {
      setOtpError("Please enter a valid email address.");
      return;
    }
    setOtpLoading(true);
    setOtpError("");
    try {
      await api.post("/auth/send-email-otp", { email: emailInput });
      setOtpSent(true);
      setResendTimer(30);
      const interval = setInterval(() => {
        setResendTimer((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (err) {
      setOtpError(err.message || "Failed to send OTP. Please try again.");
    }
    setOtpLoading(false);
  };

  const handleVerifyOtp = async () => {
    if (otpInput.length !== 6) {
      setOtpError("Please enter the 6-digit OTP sent to your email.");
      return;
    }
    setOtpLoading(true);
    setOtpError("");
    try {
      await api.post("/auth/verify-email-otp", {
        email: emailInput,
        otp: otpInput,
      });
      setEmailVerified(true);
      setOtpError("");
    } catch (err) {
      setOtpError(err.message || "Invalid OTP. Please try again.");
    }
    setOtpLoading(false);
  };

  const handleContinue = async () => {
    if (!emailVerified) return;
    if (!mobile || mobile.length !== 10 || isNaN(mobile)) {
      setMobileError("Please enter a valid 10-digit mobile number.");
      return;
    }
    setSaving(true);
    try {
      await api.put("/students/me", { email: emailInput, phone: mobile });
      navigate("/student/change-password");
    } catch (err) {
      setMobileError(err.message || "Failed to save. Please try again.");
    }
    setSaving(false);
  };

  return (
    <div
      className="min-h-screen bg-[#F1F5F9] flex flex-col items-center justify-center px-4 py-8 sm:py-12 relative overflow-hidden"
      style={{ fontFamily: "Inter, sans-serif" }}
    >
      {/* Background orbs */}
      <div className="absolute top-0 right-0 w-64 h-64 sm:w-96 sm:h-96 rounded-full bg-[#1a3a8f]/8 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-48 h-48 sm:w-80 sm:h-80 rounded-full bg-[#c0392b]/6 blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 sm:w-64 sm:h-64 rounded-full bg-[#1a3a8f]/5 blur-2xl pointer-events-none" />

      {/* Logo */}
      <div className="mb-6 sm:mb-8 text-center z-10">
        <span
          className="text-2xl sm:text-3xl font-bold"
          style={{ fontFamily: "Space Grotesk, sans-serif" }}
        >
          <span className="text-[#1E293B]">Place</span>
          <span className="text-[#1a3a8f]">Rise</span>
        </span>
        <p className="text-sm text-[#64748B] mt-1">
          Placement Portal — Dev Bhoomi Uttarakhand University
        </p>
      </div>

      {/* Card */}
      <div className="w-full max-w-md bg-white rounded-2xl sm:rounded-3xl shadow-[0_20px_60px_-15px_rgba(15,23,42,0.15)] border border-[#E2E8F0] overflow-hidden z-10">
        {/* Top color strip */}
        <div className="flex h-1 w-full">
          <div style={{ backgroundColor: "#0d1b5e", flex: 1 }} />
          <div style={{ backgroundColor: "#c0392b", flex: 1 }} />
          <div style={{ backgroundColor: "#f59e0b", flex: 1 }} />
        </div>

        <div className="p-5 sm:p-8 flex flex-col gap-6">
          {/* Header */}
          <div className="flex items-start gap-4">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#1a3a8f]/10 to-[#1a3a8f]/20 flex items-center justify-center shrink-0">
              <Shield size={20} className="text-[#1a3a8f]" />
            </div>
            <div>
              <h2
                className="text-lg sm:text-xl font-bold text-[#1E293B]"
                style={{ fontFamily: "Space Grotesk, sans-serif" }}
              >
                Verify Your Contact Details
              </h2>
              <p className="text-xs sm:text-sm text-[#64748B] mt-0.5 leading-relaxed">
                Verify your email address to continue setting up your PlaceRise account.
              </p>
            </div>
          </div>

          {/* Divider */}
          <div className="h-px bg-[#F1F5F9]" />

          {/* ── EMAIL SECTION ── */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <Mail size={14} className="text-[#1a3a8f]" />
              <p className="text-xs font-semibold uppercase tracking-widest text-[#64748B]">
                Email Address
              </p>
            </div>

            {/* Email input + Send OTP */}
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="email"
                value={emailInput}
                onChange={(e) => {
                  setEmailInput(e.target.value);
                  setEmailVerified(false);
                  setOtpSent(false);
                  setOtpInput("");
                  setOtpError("");
                }}
                disabled={emailVerified}
                placeholder="your@email.com"
                className={`flex-1 px-4 py-2.5 rounded-xl border text-sm text-[#1E293B] placeholder-[#94A3B8] focus:outline-none focus:ring-2 transition
                  ${
                    emailVerified
                      ? "bg-[#F0FDF4] border-[#86EFAC] text-green-700"
                      : "border-[#CBD5E1] focus:border-[#1a3a8f] focus:ring-[#1a3a8f]/20"
                  }`}
              />
              {!emailVerified && (
                <button
                  onClick={handleSendOtp}
                  disabled={otpLoading || !emailInput || resendTimer > 0}
                  className={`px-4 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition w-full sm:w-auto
                    ${
                      otpLoading || !emailInput || resendTimer > 0
                        ? "bg-[#F1F5F9] text-[#94A3B8] cursor-not-allowed border border-[#E2E8F0]"
                        : "bg-[#1a3a8f] text-white hover:bg-[#15307a] shadow-[0_4px_12px_rgba(26,58,143,0.25)]"
                    }`}
                >
                  {otpLoading && !otpSent
                    ? "Sending..."
                    : resendTimer > 0
                      ? `Resend in ${resendTimer}s`
                      : otpSent
                        ? "Resend OTP"
                        : "Send OTP"}
                </button>
              )}
            </div>

            {/* Verified badge */}
            {emailVerified && (
              <div className="flex items-center gap-2 px-3 py-2 bg-green-50 rounded-xl border border-green-100">
                <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center shrink-0">
                  <Check size={11} className="text-white" />
                </div>
                <p className="text-xs text-green-700 font-semibold">
                  Email verified successfully
                </p>
              </div>
            )}

            {/* OTP input + Verify */}
            {otpSent && !emailVerified && (
              <div className="flex flex-col gap-2">
                <p className="text-xs text-[#64748B]">
                  A 6-digit OTP has been sent to{" "}
                  <span className="font-semibold text-[#1E293B]">
                    {emailInput}
                  </span>
                  . Please check your inbox.
                </p>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={otpInput}
                    onChange={(e) => {
                      setOtpInput(e.target.value.replace(/\D/g, ""));
                      setOtpError("");
                    }}
                    placeholder="Enter 6-digit OTP"
                    className="flex-1 px-4 py-2.5 rounded-xl border border-[#CBD5E1] text-sm text-[#1E293B] placeholder-[#94A3B8] focus:outline-none focus:border-[#1a3a8f] focus:ring-2 focus:ring-[#1a3a8f]/20 transition font-mono tracking-[0.3em] text-center"
                  />
                  <button
                    onClick={handleVerifyOtp}
                    disabled={otpLoading || otpInput.length !== 6}
                    className={`px-4 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition w-full sm:w-auto
                      ${
                        otpLoading || otpInput.length !== 6
                          ? "bg-[#F1F5F9] text-[#94A3B8] cursor-not-allowed border border-[#E2E8F0]"
                          : "bg-[#22C55E] text-white hover:bg-[#16A34A] shadow-[0_4px_12px_rgba(34,197,94,0.25)]"
                      }`}
                  >
                    {otpLoading ? "Verifying..." : "Verify OTP"}
                  </button>
                </div>
              </div>
            )}

            {otpError && (
              <div className="flex items-center gap-2 px-3 py-2 bg-red-50 rounded-xl border border-red-100">
                <p className="text-xs text-red-600">{otpError}</p>
              </div>
            )}

            {!otpSent && !emailVerified && (
              <p className="text-xs text-[#94A3B8]">
                Enter your email address and click{" "}
                <span className="font-medium">"Send OTP"</span> to verify.
              </p>
            )}
          </div>

          {/* ── MOBILE SECTION ── */}
          {emailVerified && (
            <>
              <div className="h-px bg-[#F1F5F9]" />
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <Phone size={14} className="text-[#1a3a8f]" />
                  <p className="text-xs font-semibold uppercase tracking-widest text-[#64748B]">
                    Mobile Number
                  </p>
                </div>

                <div
                  className={`flex items-center gap-3 border rounded-xl px-4 py-2.5 transition focus-within:ring-2
                  ${mobileError ? "border-red-300 focus-within:border-red-400 focus-within:ring-red-100" : "border-[#CBD5E1] focus-within:border-[#1a3a8f] focus-within:ring-[#1a3a8f]/20"}`}
                >
                  <span className="text-sm text-[#64748B] font-medium shrink-0 border-r border-[#E2E8F0] pr-3">
                    +91
                  </span>
                  <input
                    type="tel"
                    inputMode="numeric"
                    maxLength={10}
                    value={mobile}
                    onChange={(e) => {
                      setMobile(e.target.value.replace(/\D/g, ""));
                      setMobileError("");
                    }}
                    placeholder="10-digit mobile number"
                    className="flex-1 text-sm text-[#1E293B] placeholder-[#94A3B8] outline-none bg-transparent"
                  />
                </div>

                {mobileError && (
                  <p className="text-xs text-red-500">{mobileError}</p>
                )}

                <p className="text-xs text-[#94A3B8]">
                  Your mobile number will be used for placement-related
                  notifications.
                </p>
              </div>
            </>
          )}

          {/* ── CONTINUE BUTTON ── */}
          <button
            onClick={handleContinue}
            disabled={!emailVerified || saving}
            className={`w-full py-3 rounded-xl text-white font-semibold text-sm transition-all flex items-center justify-center gap-2
              ${
                !emailVerified || saving
                  ? "bg-[#CBD5E1] cursor-not-allowed"
                  : "bg-gradient-to-r from-[#1a3a8f] to-[#1e4db7] hover:from-[#15307a] hover:to-[#1a3a8f] shadow-[0_4px_16px_rgba(26,58,143,0.3)] hover:shadow-[0_6px_20px_rgba(26,58,143,0.4)] hover:-translate-y-0.5"
              }`}
            style={{ fontFamily: "Space Grotesk, sans-serif" }}
          >
            {saving ? (
              <span className="flex items-center gap-2">
                <svg
                  className="animate-spin h-4 w-4"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v8z"
                  />
                </svg>
                Saving...
              </span>
            ) : (
              <>
                Continue to Set Password
                <ArrowRight size={16} />
              </>
            )}
          </button>

          {/* Footer note */}
          <p className="text-center text-[10px] sm:text-xs text-[#94A3B8]">
            Your information is securely stored and will only be used for
            placement-related communications.
          </p>
        </div>
      </div>

      {/* Bottom branding */}
      <p className="mt-6 text-xs text-[#94A3B8] text-center z-10">
        © {new Date().getFullYear()} PlaceRise · Dev Bhoomi Uttarakhand
        University
      </p>
    </div>
  );
}
