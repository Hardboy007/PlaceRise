import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Lock, Key, Check, Eye, EyeOff } from "lucide-react";
import { api } from "../../utils/api";

export default function ChangePasswordPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ newPassword: "", confirmPassword: "" });
  const [show, setShow] = useState({ new: false, confirm: false });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const strength = Math.min(4, Math.floor(form.newPassword.length / 3));
  const strengthColors = [
    "bg-[#EF4444]",
    "bg-[#F59E0B]",
    "bg-[#3B82F6]",
    "bg-[#22C55E]",
  ];
  const strengthLabel =
    form.newPassword.length === 0
      ? ""
      : form.newPassword.length < 4
        ? "Too weak"
        : form.newPassword.length < 7
          ? "Could be stronger"
          : form.newPassword.length < 10
            ? "Looking good"
            : "Strong 💪";

  const handleSubmit = async () => {
    setError("");

    if (!form.newPassword) {
      setError("Enter new password");
      return;
    }
    if (form.newPassword.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    if (form.newPassword !== form.confirmPassword) {
      setError("Passwords don't match");
      return;
    }

    setLoading(true);
    try {
      const res = await api.put("/auth/change-password", {
        newPassword: form.newPassword,
      });

      if (res.message === "Password changed successfully") {
        localStorage.setItem("isFirstLogin", "false");
        navigate("/student/onboarding");
      } else {
        setError(res.message || "Something went wrong");
      }
    } catch (err) {
      setError("Server se connect nahi ho pa raha");
    }
    setLoading(false);
  };

  return (
    <div
      className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-8 sm:py-12 relative overflow-hidden"
      style={{ fontFamily: "Inter, sans-serif" }}
    >
      {/* Background Orbs */}
      <div className="absolute top-4 right-0 w-40 h-40 sm:top-10 sm:right-10 sm:w-72 sm:h-72 rounded-full bg-blue-400/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-4 left-0 w-36 h-36 sm:bottom-10 sm:left-10 sm:w-56 sm:h-56 rounded-full bg-blue-300/10 blur-3xl pointer-events-none" />

      {/* Logo */}
      <div className="mb-6 sm:mb-8 text-center">
        <span
          className="text-2xl font-bold"
          style={{ fontFamily: "Space Grotesk, sans-serif" }}
        >
          <span className="text-[#1E293B]">Place</span>
          <span className="text-primary">Rise</span>
        </span>
        <p className="text-sm text-text-muted mt-1">
          Set your new password to continue
        </p>
      </div>

      {/* Card */}
      <div className="w-full max-w-md bg-white rounded-2xl sm:rounded-3xl shadow-[0_10px_40px_-10px_rgba(15,23,42,0.15)] border border-[#CBD5E1] overflow-hidden">
        <div className="h-1.5 w-full bg-linear-to-r from-[#1E293B] via-primary to-accent" />

        <div className="p-5 sm:p-8">
          <div className="flex items-center gap-2.5 sm:gap-3 mb-5 sm:mb-6">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
              <Lock size={18} className="text-primary" />
            </div>
            <div>
              <h2
                className="text-lg sm:text-xl font-bold text-[#1E293B]"
                style={{ fontFamily: "Space Grotesk, sans-serif" }}
              >
                Set New Password
              </h2>
              <p className="text-xs text-text-muted mt-0.5 leading-relaxed">
                First time login — please set a secure password
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            {/* New Password */}
            <div>
              <label className="text-xs font-semibold uppercase tracking-widest text-text-muted block mb-1.5">
                New Password
              </label>
              <div className="relative">
                <input
                  type={show.new ? "text" : "password"}
                  value={form.newPassword}
                  onChange={(e) =>
                    setForm({ ...form, newPassword: e.target.value })
                  }
                  placeholder="Enter new password"
                  className="w-full px-3 sm:px-4 py-3 rounded-xl border border-[#CBD5E1] text-sm text-[#1E293B] placeholder-[#94A3B8] focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShow((s) => ({ ...s, new: !s.new }))}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-primary"
                >
                  {show.new ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Strength Indicator */}
            {form.newPassword && (
              <div className="bg-[#F8FAFC] rounded-xl p-3 sm:p-4 border border-[#E2E8F0]">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold uppercase tracking-widest text-text-muted">
                    Strength
                  </span>
                  <span
                    className={`text-xs font-semibold ${strength <= 1 ? "text-danger" : strength <= 2 ? "text-warning" : strength <= 3 ? "text-primary" : "text-success"}`}
                  >
                    {strengthLabel}
                  </span>
                </div>
                <div className="flex gap-1.5">
                  {[1, 2, 3, 4].map((level) => (
                    <div
                      key={level}
                      className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${level <= strength ? strengthColors[strength - 1] : "bg-[#E2E8F0]"}`}
                    />
                  ))}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3">
                  {[
                    ["6+ characters", form.newPassword.length >= 6],
                    ["Uppercase letter", /[A-Z]/.test(form.newPassword)],
                    ["Number", /[0-9]/.test(form.newPassword)],
                    [
                      "Special character",
                      /[^a-zA-Z0-9]/.test(form.newPassword),
                    ],
                  ].map(([tip, met]) => (
                    <div
                      key={tip}
                      className="flex items-center gap-2 text-xs text-text-muted"
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full shrink-0 ${met ? "bg-success" : "bg-[#CBD5E1]"}`}
                      />
                      {tip}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Confirm Password */}
            <div>
              <label className="text-xs font-semibold uppercase tracking-widest text-text-muted block mb-1.5">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  type={show.confirm ? "text" : "password"}
                  value={form.confirmPassword}
                  onChange={(e) =>
                    setForm({ ...form, confirmPassword: e.target.value })
                  }
                  placeholder="Confirm new password"
                  className="w-full px-3 sm:px-4 py-3 rounded-xl border border-[#CBD5E1] text-sm text-[#1E293B] placeholder-[#94A3B8] focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition pr-12"
                />
                <button
                  type="button"
                  onClick={() =>
                    setShow((s) => ({ ...s, confirm: !s.confirm }))
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-primary"
                >
                  {show.confirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
          </div>

          {error && (
            <div className="mt-4 text-xs text-danger bg-red-50 border border-red-200 rounded-xl px-4 py-2.5">
              ⚠️ {error}
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full mt-5 sm:mt-6 py-3 rounded-xl bg-[#1E293B] cursor-pointer hover:bg-primary text-white font-semibold text-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            style={{ fontFamily: "Space Grotesk, sans-serif" }}
          >
            {loading ? (
              "Setting password..."
            ) : (
              <>
                <Key size={16} /> Set Password & Continue
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
