import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, Phone, Check } from "lucide-react";
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
      setOtpError("Valid email daalo");
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
      setOtpError(err.message || "OTP send nahi hua, try again");
    }
    setOtpLoading(false);
  };

  const handleVerifyOtp = async () => {
    if (otpInput.length !== 6) {
      setOtpError("6-digit OTP daalo");
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
      setOtpError(err.message || "Invalid OTP");
    }
    setOtpLoading(false);
  };

  const handleContinue = async () => {
    if (!emailVerified) return;
    if (!mobile || mobile.length !== 10 || isNaN(mobile)) {
      setMobileError("Valid 10-digit mobile number daalo");
      return;
    }
    setSaving(true);
    try {
      await api.put("/students/me", {
        email: emailInput,
        phone: mobile,
      });
      navigate("/student/change-password");
    } catch (err) {
      setMobileError(err.message || "Save nahi hua, try again");
    }
    setSaving(false);
  };

  const inputCls =
    "w-full px-4 py-2.5 rounded-xl border border-[#CBD5E1] text-sm text-[#1E293B] placeholder-[#94A3B8] focus:outline-none focus:border-[#1a3a8f] focus:ring-2 focus:ring-[#1a3a8f]/20 transition";

  return (
    <div
      className="min-h-screen bg-[#F1F5F9] flex flex-col items-center justify-center px-4 py-8 sm:py-12 relative overflow-hidden"
      style={{ fontFamily: "Inter, sans-serif" }}
    >
      <div className="absolute top-4 right-0 w-40 h-40 sm:top-10 sm:right-10 sm:w-72 sm:h-72 rounded-full bg-[#1a3a8f]/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-4 left-0 w-36 h-36 sm:bottom-10 sm:left-10 sm:w-56 sm:h-56 rounded-full bg-[#c0392b]/8 blur-3xl pointer-events-none" />

      {/* Logo */}
      <div className="mb-6 sm:mb-8 text-center">
        <span
          className="text-2xl font-bold"
          style={{ fontFamily: "Space Grotesk, sans-serif" }}
        >
          <span className="text-[#1E293B]">Place</span>
          <span className="text-[#1a3a8f]">Rise</span>
        </span>
        <p className="text-sm text-[#64748B] mt-1">
          Apna email aur mobile verify karo
        </p>
      </div>

      <div className="w-full max-w-md bg-white rounded-2xl sm:rounded-3xl shadow-[0_10px_40px_-10px_rgba(15,23,42,0.15)] border border-[#CBD5E1] overflow-hidden">
        {/* Top strip */}
        <div className="flex h-[3px] w-full">
          <div style={{ backgroundColor: "#0d1b5e", flex: 1 }} />
          <div style={{ backgroundColor: "#c0392b", flex: 1 }} />
          <div style={{ backgroundColor: "#f59e0b", flex: 1 }} />
        </div>

        <div className="p-5 sm:p-8 flex flex-col gap-6">
          {/* Header */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
              <Mail size={18} className="text-[#1a3a8f]" />
            </div>
            <div>
              <h2
                className="text-lg sm:text-xl font-bold text-[#1E293B]"
                style={{ fontFamily: "Space Grotesk, sans-serif" }}
              >
                Verify Your Contact
              </h2>
              <p className="text-xs text-[#64748B] mt-0.5">
                Email verify karo aur mobile number save karo
              </p>
            </div>
          </div>

          {/* Email Section */}
          <div className="flex flex-col gap-3">
            <p className="text-xs font-semibold uppercase tracking-widest text-[#64748B]">
              Email Address
            </p>

            <div className="flex gap-2">
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
                className={`flex-1 px-4 py-2.5 rounded-xl border text-sm text-[#1E293B] placeholder-[#94A3B8] focus:outline-none focus:border-[#1a3a8f] focus:ring-2 focus:ring-[#1a3a8f]/20 transition ${emailVerified ? "bg-[#F0FDF4] border-[#86EFAC]" : "border-[#CBD5E1]"}`}
              />
              {!emailVerified && (
                <button
                  onClick={handleSendOtp}
                  disabled={otpLoading || !emailInput || resendTimer > 0}
                  className={`px-4 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition ${
                    otpLoading || !emailInput || resendTimer > 0
                      ? "bg-[#E2E8F0] text-[#94A3B8] cursor-not-allowed"
                      : "bg-[#1a3a8f] text-white hover:bg-[#15307a]"
                  }`}
                >
                  {otpLoading && !otpSent
                    ? "Sending..."
                    : resendTimer > 0
                      ? `${resendTimer}s`
                      : otpSent
                        ? "Resend"
                        : "Send OTP"}
                </button>
              )}
            </div>

            {emailVerified && (
              <p className="text-xs text-green-600 font-semibold flex items-center gap-1">
                <Check size={12} /> Email verified
              </p>
            )}

            {otpSent && !emailVerified && (
              <div className="flex gap-2">
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={otpInput}
                  onChange={(e) => {
                    setOtpInput(e.target.value.replace(/\D/g, ""));
                    setOtpError("");
                  }}
                  placeholder="6-digit OTP"
                  className="flex-1 px-4 py-2.5 rounded-xl border border-[#CBD5E1] text-sm text-[#1E293B] placeholder-[#94A3B8] focus:outline-none focus:border-[#1a3a8f] focus:ring-2 focus:ring-[#1a3a8f]/20 transition font-mono tracking-widest"
                />
                <button
                  onClick={handleVerifyOtp}
                  disabled={otpLoading || otpInput.length !== 6}
                  className={`px-4 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition ${
                    otpLoading || otpInput.length !== 6
                      ? "bg-[#E2E8F0] text-[#94A3B8] cursor-not-allowed"
                      : "bg-[#22C55E] text-white hover:bg-[#16A34A]"
                  }`}
                >
                  {otpLoading ? "Verifying..." : "Verify"}
                </button>
              </div>
            )}

            {otpError && <p className="text-xs text-red-500">{otpError}</p>}
          </div>

          {/* Mobile Section — sirf tab dikhao jab email verify ho */}
          {emailVerified && (
            <div className="flex flex-col gap-3">
              <p className="text-xs font-semibold uppercase tracking-widest text-[#64748B]">
                Mobile Number
              </p>
              <div className="flex items-center gap-2 border border-[#CBD5E1] rounded-xl px-4 py-2.5 focus-within:border-[#1a3a8f] focus-within:ring-2 focus-within:ring-[#1a3a8f]/20 transition">
                <Phone size={15} className="text-[#94A3B8] shrink-0" />
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
            </div>
          )}

          {/* Continue Button */}
          <button
            onClick={handleContinue}
            disabled={!emailVerified || saving}
            className={`w-full py-3 rounded-xl text-white font-semibold text-sm transition flex items-center justify-center gap-2 ${
              !emailVerified || saving
                ? "bg-[#CBD5E1] cursor-not-allowed"
                : "bg-[#1E293B] hover:bg-[#1a3a8f]"
            }`}
            style={{ fontFamily: "Space Grotesk, sans-serif" }}
          >
            {saving ? (
              "Saving..."
            ) : (
              <>
                <Check size={16} /> Continue
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
