import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Eye, EyeOff, CheckCircle } from "lucide-react";

function ResetPasswordPage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleReset = async () => {
    setError("");

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      const BASE_URL =
        import.meta.env.VITE_API_URL || "http://localhost:5000/api";
      const res = await fetch(`${BASE_URL}/auth/reset-password/${token}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newPassword }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Something went wrong");
        setLoading(false);
        return;
      }

      setSuccess(true);
      setTimeout(() => navigate("/"), 2500);
    } catch (err) {
      setError("Unable to connect to the server");
    }
    setLoading(false);
  };

  return (
    <div
      className="min-h-screen bg-background flex items-center justify-center px-4"
      style={{ fontFamily: "Inter, sans-serif" }}
    >
      <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl border border-[#E2E8F0]">
        {success ? (
          <div className="text-center py-6">
            <div className="w-14 h-14 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-4">
              <CheckCircle size={28} className="text-success" />
            </div>
            <h3
              className="text-xl font-bold text-[#1E293B] mb-1"
              style={{ fontFamily: "Space Grotesk, sans-serif" }}
            >
              Password Reset!
            </h3>
            <p className="text-sm text-text-muted">
              Redirecting you to login...
            </p>
          </div>
        ) : (
          <>
            <p className="text-xs font-semibold tracking-widest uppercase text-primary">
              PlaceRise
            </p>
            <h3
              className="text-2xl font-bold text-[#1E293B] mt-1 mb-6"
              style={{ fontFamily: "Space Grotesk, sans-serif" }}
            >
              Set a new password
            </h3>

            <div className="flex flex-col gap-4">
              <div>
                <label className="text-sm font-medium text-[#1E293B] block mb-1">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    className="w-full px-4 py-3 pr-12 rounded-xl border border-[#CBD5E1] text-[#1E293B] placeholder-text-muted focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((p) => !p)}
                    className="absolute inset-y-0 right-0 flex items-center px-3 text-text-muted hover:text-[#1E293B]"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-[#1E293B] block mb-1">
                  Confirm Password
                </label>
                <input
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  className="w-full px-4 py-3 rounded-xl border border-[#CBD5E1] text-[#1E293B] placeholder-text-muted focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition"
                />
              </div>
            </div>

            {error && (
              <p className="text-xs text-danger text-center mt-4">{error}</p>
            )}

            <button
              onClick={handleReset}
              disabled={loading}
              className="w-full mt-5 py-3 rounded-xl bg-primary hover:bg-blue-600 text-white font-semibold transition-colors cursor-pointer disabled:opacity-50"
              style={{ fontFamily: "Space Grotesk, sans-serif" }}
            >
              {loading ? "Resetting..." : "Reset Password"}
            </button>

            <Link
              to="/"
              className="block text-center text-xs text-text-muted hover:text-[#1E293B] mt-4"
            >
              ← Back to login
            </Link>
          </>
        )}
      </div>
    </div>
  );
}

export default ResetPasswordPage;