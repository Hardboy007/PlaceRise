import { useState } from "react";

// ─── Notification Options ─────────────────────────────────────────────────────
const notificationOptions = [
  {
    key: "emailNotifications",
    icon: "📧",
    label: "Email Notifications",
    desc: "All updates delivered to your inbox",
    color: "blue",
  },
  {
    key: "applicationUpdates",
    icon: "📋",
    label: "Application Updates",
    desc: "Status changes on your job applications",
    color: "green",
  },
  {
    key: "jobAlerts",
    icon: "💼",
    label: "Job Alerts",
    desc: "New postings matching your profile",
    color: "amber",
  },
  {
    key: "profileViews",
    icon: "👁",
    label: "Profile Views",
    desc: "When a recruiter views your profile",
    color: "blue",
  },
  {
    key: "weeklyDigest",
    icon: "📊",
    label: "Weekly Digest",
    desc: "A weekly summary of your activity",
    color: "green",
  },
  {
    key: "smsNotifications",
    icon: "📱",
    label: "SMS Notifications",
    desc: "Critical alerts sent to your phone",
    color: "amber",
  },
];

const toggleActiveColor = {
  blue:  "bg-blue-500",
  green: "bg-green-500",
  amber: "bg-amber-500",
};

// ─── Reusable Toggle ──────────────────────────────────────────────────────────
function Toggle({ active, onToggle, color = "blue" }) {
  return (
    <button
      onClick={onToggle}
      className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors duration-200 focus:outline-none
        ${active ? toggleActiveColor[color] : "bg-slate-300"}`}
    >
      <span
        className={`inline-block h-4 w-4 rounded-full bg-white shadow-md transition-transform duration-200
          ${active ? "translate-x-6" : "translate-x-1"}`}
      />
    </button>
  );
}

// ─── Password Input ────────────────────────────────────────────────────────────
function PasswordInput({ label, name, value, onChange, show, onToggleShow, placeholder = "••••••••" }) {
  return (
    <div className="mb-4">
      <label className="text-[10px] font-semibold uppercase tracking-widest text-slate-500 block mb-1.5">
        {label}
      </label>
      <div className="relative">
        <input
          type={show ? "text" : "password"}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className="w-full bg-slate-100 border border-slate-300 text-slate-900 rounded-xl px-4 py-2.5 text-sm pr-14 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 placeholder:text-slate-400"
        />
        <button
          type="button"
          onClick={onToggleShow}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-semibold text-slate-500 hover:text-blue-500 transition-colors"
        >
          {show ? "Hide" : "Show"}
        </button>
      </div>
    </div>
  );
}

// ─── Section Card ─────────────────────────────────────────────────────────────
function Card({ children, className = "" }) {
  return (
    <div className={`bg-white border border-slate-200 rounded-2xl shadow-sm hover:shadow-md hover:border-slate-300 transition-all duration-200 ${className}`}>
      {children}
    </div>
  );
}

// ─── Change Password Modal ─────────────────────────────────────────────────────
function ChangePasswordModal({ onClose, onSave }) {
  const [passwords, setPasswords] = useState({ current: "", newPass: "", confirm: "" });
  const [showPass, setShowPass]   = useState({ current: false, newPass: false, confirm: false });
  const [passError, setPassError] = useState("");

  const handleChange = (e) => {
    setPasswords({ ...passwords, [e.target.name]: e.target.value });
    setPassError("");
  };
  const handleToggleShow = (field) =>
    setShowPass((prev) => ({ ...prev, [field]: !prev[field] }));

  const strength = Math.min(4, Math.floor(passwords.newPass.length / 3));
  const strengthLabel =
    passwords.newPass.length === 0  ? ""
    : passwords.newPass.length < 4  ? "Too weak"
    : passwords.newPass.length < 7  ? "Could be stronger"
    : passwords.newPass.length < 10 ? "Looking good"
    : "Strong password 💪";
  const strengthColors = ["bg-red-400", "bg-amber-400", "bg-blue-400", "bg-green-500"];

  const handleSubmit = () => {
    if (!passwords.current) { setPassError("Please enter your current password."); return; }
    if (!passwords.newPass)  { setPassError("Please enter a new password."); return; }
    if (passwords.newPass !== passwords.confirm) {
      setPassError("New password and Confirm password don't match!");
      return;
    }
    onSave();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backdropFilter: "blur(4px)", backgroundColor: "rgba(15,23,42,0.45)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-slate-200"
        style={{ animation: "fadeSlideUp 0.2s ease-out" }}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-lg">🔒</div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Change Password</h2>
              <p className="text-[11px] text-slate-400 mt-0.5">Use symbols, numbers & uppercase for strength</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-700 transition-all font-bold"
          >✕</button>
        </div>

        {/* Body */}
        <div className="p-6">
          <PasswordInput label="Current Password" name="current" value={passwords.current}
            onChange={handleChange} show={showPass.current} onToggleShow={() => handleToggleShow("current")} />
          <PasswordInput label="New Password" name="newPass" value={passwords.newPass}
            onChange={handleChange} show={showPass.newPass} onToggleShow={() => handleToggleShow("newPass")} />
          <PasswordInput label="Confirm New Password" name="confirm" value={passwords.confirm}
            onChange={handleChange} show={showPass.confirm} onToggleShow={() => handleToggleShow("confirm")} />

          {passError && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-500 text-xs font-medium rounded-xl px-4 py-2.5 mt-1">
              <span className="text-base">⚠️</span> {passError}
            </div>
          )}

          {passwords.newPass && (
            <div className="mt-4 bg-slate-50 rounded-xl p-4 border border-slate-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">Password Strength</span>
                <span className={`text-[11px] font-semibold ${strength <= 1 ? "text-red-400" : strength <= 2 ? "text-amber-500" : strength <= 3 ? "text-blue-500" : "text-green-500"}`}>
                  {strengthLabel}
                </span>
              </div>
              <div className="flex gap-1.5">
                {[1,2,3,4].map((level) => (
                  <div key={level} className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${level <= strength ? strengthColors[strength - 1] : "bg-slate-200"}`} />
                ))}
              </div>
            </div>
          )}

          <div className="mt-4 grid grid-cols-2 gap-2">
            {[
              ["At least 8 characters", passwords.newPass.length >= 8],
              ["One uppercase letter",  /[A-Z]/.test(passwords.newPass)],
              ["One number",            /[0-9]/.test(passwords.newPass)],
              ["One special character", /[^a-zA-Z0-9]/.test(passwords.newPass)],
            ].map(([tip, met]) => (
              <div key={tip} className="flex items-center gap-2 text-[11px] text-slate-400">
                <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${met ? "bg-green-500" : "bg-slate-300"}`} />
                {tip}
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 pb-5">
          <button onClick={onClose}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-all">
            Cancel
          </button>
          <button onClick={handleSubmit}
            className="bg-slate-800 hover:bg-slate-700 active:scale-95 text-white text-sm font-semibold px-6 py-2.5 rounded-xl shadow-md hover:-translate-y-0.5 transition-all duration-150 flex items-center gap-2">
            <span>🔒</span> Update Password
          </button>
        </div>
      </div>

      <style>{`
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(14px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function StudentSettingsPage() {
  const [showPassModal, setShowPassModal] = useState(false);
  const [toggles, setToggles]     = useState({
    emailNotifications: true,
    applicationUpdates: true,
    jobAlerts: false,
    profileViews: true,
    weeklyDigest: false,
    smsNotifications: false,
  });
  const [saved, setSaved]           = useState(false);
  const [activeTab, setActiveTab]   = useState("security");
  const profileCompletion           = 70;

  const handleToggle = (key) =>
    setToggles((prev) => ({ ...prev, [key]: !prev[key] }));

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handlePasswordSave = () => {
    setShowPassModal(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const activeNotifs = Object.values(toggles).filter(Boolean).length;

  return (
    <div className="min-h-screen bg-slate-100 font-sans">

      {/* ── Navbar ── */}
      <nav className="sticky top-0 z-50 bg-slate-800 px-6 h-14 flex items-center justify-between shadow-md border-b border-white/5">
        <div className="flex items-center gap-2.5">
          <span className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)] animate-pulse" />
          <span className="font-bold text-white text-base tracking-tight">EduPortal</span>
        </div>
        <div className="flex items-center gap-3">
          {saved && (
            <span className="text-[11px] font-semibold text-green-500 bg-green-500/10 border border-green-500/30 px-3 py-1 rounded-full animate-bounce">
              ✓ Changes Saved
            </span>
          )}
          <span className="text-[11px] font-medium uppercase tracking-widest text-white/40">
            Settings
          </span>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">

        {/* ── Page Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Account Settings</h1>
            <p className="text-sm text-slate-500 mt-1">Manage your security and notification preferences</p>
          </div>

          {/* ── Tab Switcher (unique pill UI) ── */}
          <div className="flex items-center bg-white border border-slate-200 rounded-xl p-1 shadow-sm w-fit">
            {[
              { id: "security",      icon: "🔒", label: "Security"      },
              { id: "notifications", icon: "🔔", label: "Notifications" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200
                  ${activeTab === tab.id
                    ? "bg-slate-800 text-white shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                  }`}
              >
                <span>{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Quick Stats Row ── */}
        <div className="grid grid-cols-3 gap-4">

          {/* Card 1 — Password */}
          <Card className="p-4 relative overflow-hidden">
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-100 rounded-b-2xl">
              <div className="h-full rounded-b-2xl bg-green-500 w-full transition-all duration-500" />
            </div>
            <div className="text-xl mb-2">🔒</div>
            <div className="text-sm font-bold text-slate-900">Protected</div>
            <div className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 mt-0.5">Password</div>
          </Card>

          {/* Card 2 — Profile Completion % */}
          <Card className="p-4 relative overflow-hidden">
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-100 rounded-b-2xl">
              <div
                className="h-full rounded-b-2xl bg-blue-500 transition-all duration-700"
                style={{ width: `${profileCompletion}%` }}
              />
            </div>
            <div className="text-xl mb-2">👤</div>

            {/* circular-style % badge */}
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-sm font-bold text-slate-900">{profileCompletion}%</span>
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full
                ${profileCompletion === 100
                  ? "bg-green-100 text-green-600"
                  : profileCompletion >= 60
                  ? "bg-blue-100 text-blue-600"
                  : "bg-amber-100 text-amber-600"}`}>
                {profileCompletion === 100 ? "Complete ✓" : "Incomplete"}
              </span>
            </div>

            {/* thin progress bar */}
            <div className="w-full h-1 bg-slate-200 rounded-full overflow-hidden mt-2 mb-1">
              <div
                className={`h-full rounded-full transition-all duration-700
                  ${profileCompletion === 100 ? "bg-green-500"
                  : profileCompletion >= 60   ? "bg-blue-500"
                  : "bg-amber-500"}`}
                style={{ width: `${profileCompletion}%` }}
              />
            </div>

            <div className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">Profile</div>
          </Card>

          {/* Card 3 — Notifications */}
          <Card className="p-4 relative overflow-hidden">
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-100 rounded-b-2xl">
              <div
                className="h-full rounded-b-2xl bg-amber-500 transition-all duration-500"
                style={{ width: `${Math.round((activeNotifs / 6) * 100)}%` }}
              />
            </div>
            <div className="text-xl mb-2">🔔</div>
            <div className="text-sm font-bold text-slate-900">{activeNotifs} / 6 Active</div>
            <div className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 mt-0.5">Notifications</div>
          </Card>

        </div>

        {/* ── Security Tab ── */}
        {activeTab === "security" && (
          <Card>
            <div className="flex items-center gap-3 px-6 pt-6 pb-4 border-b border-slate-100">
              <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-lg">
                🔒
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900">Security Settings</h2>
                <p className="text-[11px] text-slate-400 mt-0.5">Manage your account password and security</p>
              </div>
            </div>

            <div className="p-6">
              <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-xl px-5 py-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-green-50 border border-green-100 flex items-center justify-center text-base">🛡️</div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Password</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Last updated recently · Protected</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowPassModal(true)}
                  className="bg-slate-800 hover:bg-slate-700 active:scale-95 text-white text-xs font-semibold px-4 py-2 rounded-lg shadow-sm hover:-translate-y-0.5 transition-all duration-150 flex items-center gap-1.5"
                >
                  <span>🔑</span> Change Password
                </button>
              </div>
            </div>
          </Card>
        )}

        {/* ── Notifications Tab ── */}
        {activeTab === "notifications" && (
          <Card>
            <div className="flex items-center gap-3 px-6 pt-6 pb-4 border-b border-slate-100">
              <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-lg">
                🔔
              </div>
              <div className="flex-1">
                <h2 className="text-sm font-bold text-slate-900">Notification Preferences</h2>
                <p className="text-[11px] text-slate-400 mt-0.5">Choose what updates you want to receive</p>
              </div>
              <span className="text-[11px] font-bold text-blue-500 bg-blue-50 border border-blue-100 px-2.5 py-1 rounded-lg">
                {activeNotifs} Active
              </span>
            </div>

            <div className="divide-y divide-slate-100">
              {notificationOptions.map(({ key, icon, label, desc, color }) => (
                <div
                  key={key}
                  className="flex items-center justify-between px-6 py-4 hover:bg-slate-50 transition-colors duration-150 group"
                >
                  <div className="flex items-center gap-4">
                    {/* icon bubble */}
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-base flex-shrink-0 transition-all duration-200
                      ${toggles[key]
                        ? color === "blue"  ? "bg-blue-50 border border-blue-100"
                        : color === "green" ? "bg-green-50 border border-green-100"
                        : "bg-amber-50 border border-amber-100"
                        : "bg-slate-100 border border-slate-200"
                      }`}>
                      {icon}
                    </div>
                    <div>
                      <p className={`text-sm font-semibold transition-colors duration-150
                        ${toggles[key] ? "text-slate-900" : "text-slate-400"}`}>
                        {label}
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">{desc}</p>
                    </div>
                  </div>
                  <Toggle active={toggles[key]} onToggle={() => handleToggle(key)} color={color} />
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* ── Save Button Row ── */}
        <div className="flex items-center justify-between bg-white border border-slate-200 rounded-2xl px-6 py-4 shadow-sm">
          <p className="text-xs text-slate-400 font-medium">
            {activeTab === "security" ? "Password changes apply immediately after saving." : "Toggle changes are saved instantly."}
          </p>
          <button
            onClick={handleSave}
            className="bg-slate-800 hover:bg-slate-700 active:scale-95 text-white text-sm font-semibold px-6 py-2.5 rounded-xl shadow-md hover:-translate-y-0.5 transition-all duration-150 flex items-center gap-2"
          >
            <span>💾</span>
            Save Changes
          </button>
        </div>

      </div>

      {/* ── Change Password Modal ── */}
      {showPassModal && (
        <ChangePasswordModal
          onClose={() => setShowPassModal(false)}
          onSave={handlePasswordSave}
        />
      )}
    </div>
  );
}
