import { useState } from "react";
import { useNavigate } from "react-router-dom";

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

function HRLoginPage() {
  const navigate = useNavigate();
  const [companyName, setCompanyName] = useState("");
  const [accessCode, setAccessCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!companyName.trim() || !accessCode.trim()) {
      setError("Enter both your company name and access code.");
      return;
    }

    setLoading(true);
    try {
      const BASE_URL =
        import.meta.env.VITE_API_URL || "http://localhost:5000/api";
      const res = await fetch(`${BASE_URL}/hr-feedback/verify-code`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName: companyName.trim(),
          accessCode: accessCode.trim(),
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Invalid company name or access code.");
        setLoading(false);
        return;
      }

      // Guest session — sessionStorage on purpose, so it clears when the
      // HR closes the tab rather than lingering on a shared/borrowed device.
      sessionStorage.setItem("hrGuestToken", data.token);
      sessionStorage.setItem("hrGuestCompany", data.companyName);
      navigate("/hr-feedback");
    } catch (err) {
      setError("Unable to connect to the server.");
    }
    setLoading(false);
  };

  return (
    <div
      className="min-h-screen bg-background flex items-center justify-center px-6 py-12"
      style={{ fontFamily: "Inter, sans-serif" }}
    >
      <div className="w-full max-w-sm">
        <div className="flex items-center justify-center gap-2.5 mb-8">
          <div className="w-11 h-11 rounded-xl bg-white flex items-center justify-center">
            <img
                src="/images/logo-transparent.png"
                alt="PlaceRise"
                className="w-full h-full object-contain"
              />
          </div>
          <span
            className="text-lg font-bold text-[#1E293B]"
            style={{ fontFamily: "Space Grotesk, sans-serif" }}
          >
            Place<span className="text-primary">Rise</span>
          </span>
        </div>

        <div className="bg-white rounded-3xl border border-[#E2E8F0] p-7 shadow-[0_10px_40px_-10px_rgba(15,23,42,0.1)]">
          <p className="text-xs font-semibold tracking-widest uppercase text-primary mb-2">
            Recruiter Access
          </p>
          <h1
            className="text-xl font-bold text-[#1E293B] mb-2"
            style={{ fontFamily: "Space Grotesk, sans-serif" }}
          >
            Interview feedback
          </h1>
          <p className="text-text-muted text-sm leading-relaxed mb-6">
            Enter the access code shared by the placement cell to leave quick
            feedback after your rounds — takes about a minute.
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="text-sm font-medium text-[#1E293B] block mb-1.5">
                Company name
              </label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="e.g. HDFC Bank"
                autoComplete="organization"
                className="w-full px-4 py-3 rounded-xl border border-[#CBD5E1] text-[#1E293B] placeholder-text-muted focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-[#1E293B] block mb-1.5">
                Access code
              </label>
              <input
                type="text"
                value={accessCode}
                onChange={(e) => setAccessCode(e.target.value.toUpperCase())}
                placeholder="e.g. A1B2C3D4"
                autoComplete="off"
                className="w-full px-4 py-3 rounded-xl border border-[#CBD5E1] text-[#1E293B] placeholder-text-muted uppercase tracking-wider focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition"
              />
            </div>

            {error && <p className="text-xs text-danger">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-1 py-3 rounded-xl bg-primary hover:bg-blue-600 text-white font-semibold transition-colors cursor-pointer disabled:opacity-50"
              style={{ fontFamily: "Space Grotesk, sans-serif" }}
            >
              {loading ? "Checking..." : "Continue →"}
            </button>
          </form>

          <p className="text-center text-xs text-text-muted mt-5">
            Don't have a code? Ask your placement cell contact for one.
          </p>
        </div>
      </div>
    </div>
  );
}

export default HRLoginPage;