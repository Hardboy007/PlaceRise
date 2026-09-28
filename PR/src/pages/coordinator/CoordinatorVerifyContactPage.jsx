import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, Check, Shield, ArrowRight } from "lucide-react";
import { api } from "../../utils/api";

export default function CoordinatorVerifyContactPage() {
  const navigate = useNavigate();

  // Login ke time save hua coordinator ka email (prefill ke liye)
  const savedCoordinator = JSON.parse(
    localStorage.getItem("coordinator") || "{}",
  );
  const originalEmail = savedCoordinator.email || "";

  // Email locked hai: sirf registered email par hi OTP jayega
  const emailInput = originalEmail;
  const [otpSent, setOtpSent] = useState(false);
  const [otpInput, setOtpInput] = useState("");
  const [emailVerified, setEmailVerified] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpError, setOtpError] = useState("");
  const [resendTimer, setResendTimer] = useState(0);
  const [maskedEmail, setMaskedEmail] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  useEffect(() => {
    document.title = "Verify Email — PlaceRise";
  }, []);

  // Resend countdown
  useEffect(() => {
    if (resendTimer <= 0) return;
    const t = setTimeout(() => setResendTimer((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resendTimer]);

  const isValidEmail = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

  const handleSendOtp = async () => {
    setOtpLoading(true);
    setOtpError("");
    try {
      const res = await api.post("/auth/coordinator/send-otp", {});
      setMaskedEmail(res?.maskedEmail || "");
      setOtpSent(true);
      setResendTimer(30);
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
      await api.post("/auth/coordinator/verify-otp", { otp: otpInput });
      setEmailVerified(true);
      setOtpError("");
    } catch (err) {
      setOtpError(err.message || "Invalid OTP. Please try again.");
    }
    setOtpLoading(false);
  };

  const handleContinue = async () => {
    if (!emailVerified) return;
    setSaving(true);
    setSaveError("");
    try {
      localStorage.setItem("coordEmailVerified", "true");
      navigate("/coordinator/change-password", { replace: true });
    } catch (err) {
      setSaveError(err.message || "Failed to save. Please try again.");
    }
    setSaving(false);
  };

  return (
    <div
      className="min-h-screen bg-[#F1F5F9] flex flex-col items-center justify-center px-4 py-8 sm:py-12 relative overflow-hidden"
      style={{ fontFamily: "Inter, sans-serif" }}
    >
      <div className="absolute top-0 right-0 w-64 h-64 sm:w-96 sm:h-96 rounded-full bg-[#1a3a8f]/8 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-48 h-48 sm:w-80 sm:h-80 rounded-full bg-[#c0392b]/6 blur-3xl pointer-events-none" />

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
          Placement Team — Dev Bhoomi Uttarakhand University
        </p>
      </div>

      {/* Card */}
      <div className="w-full max-w-md bg-white rounded-2xl sm:rounded-3xl shadow-[0_20px_60px_-15px_rgba(15,23,42,0.15)] border border-[#E2E8F0] overflow-hidden z-10">
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
                Verify Your Email
              </h2>
              <p className="text-xs sm:text-sm text-[#64748B] mt-0.5 leading-relaxed">
                First login — verify your email with an OTP, then set your
                password.
              </p>
            </div>
          </div>

          <div className="h-px bg-[#F1F5F9]" />

          {/* EMAIL SECTION */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <Mail size={14} className="text-[#1a3a8f]" />
              <p className="text-xs font-semibold uppercase tracking-widest text-[#64748B]">
                Email Address
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="email"
                value={maskedEmail || emailInput}
                readOnly
                placeholder="Your registered email"
                className={`flex-1 px-4 py-2.5 rounded-xl border text-sm cursor-not-allowed select-none ${
                  emailVerified
                    ? "bg-[#F0FDF4] border-[#86EFAC] text-green-700"
                    : "bg-[#F8FAFC] border-[#CBD5E1] text-[#475569]"
                }`}
              />
              {!emailVerified && (
                <button
                  onClick={handleSendOtp}
                  disabled={otpLoading || resendTimer > 0}
                  className={`px-4 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition w-full sm:w-auto ${
                    otpLoading || resendTimer > 0
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

            {otpSent && !emailVerified && (
              <div className="flex flex-col gap-2">
                <p className="text-xs text-[#64748B]">
                  A 6-digit OTP has been sent to{" "}
                  <span className="font-semibold text-[#1E293B]">
                    {maskedEmail || emailInput || "your registered email"}
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
                    className={`px-4 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition w-full sm:w-auto ${
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
                An OTP will be sent to your registered email. Click{" "}
                <span className="font-medium">"Send OTP"</span> to verify.
              </p>
            )}
          </div>

          {saveError && (
            <div className="px-3 py-2 bg-red-50 rounded-xl border border-red-100">
              <p className="text-xs text-red-600">{saveError}</p>
            </div>
          )}

          {/* CONTINUE */}
          <button
            onClick={handleContinue}
            disabled={!emailVerified || saving}
            className={`w-full py-3 rounded-xl text-white font-semibold text-sm transition-all flex items-center justify-center gap-2 ${
              !emailVerified || saving
                ? "bg-[#CBD5E1] cursor-not-allowed"
                : "bg-gradient-to-r from-[#1a3a8f] to-[#1e4db7] hover:from-[#15307a] hover:to-[#1a3a8f] shadow-[0_4px_16px_rgba(26,58,143,0.3)] hover:-translate-y-0.5"
            }`}
            style={{ fontFamily: "Space Grotesk, sans-serif" }}
          >
            {saving ? (
              "Saving..."
            ) : (
              <>
                Continue to Set Password
                <ArrowRight size={16} />
              </>
            )}
          </button>

          <p className="text-center text-[10px] sm:text-xs text-[#94A3B8]">
            Your email is used only for account security and placement-related
            communication.
          </p>
        </div>
      </div>

      <p className="mt-6 text-xs text-[#94A3B8] text-center z-10">
        © {new Date().getFullYear()} PlaceRise · Dev Bhoomi Uttarakhand
        University
      </p>
    </div>
  );
}