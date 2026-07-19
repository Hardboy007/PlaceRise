import { useState, useEffect, useRef, useLayoutEffect } from "react";
import {
  Lock,
  Bell,
  Shield,
  User,
  Save,
  Key,
  Check,
  X,
  Mail,
  ClipboardList,
  Briefcase,
  ChartNoAxesCombined,
} from "lucide-react";
import { api } from "../../utils/api";

const notificationOptions = [
  {
    key: "emailNotifications",
    icon: <Mail size={17} strokeWidth={1.8} />,
    label: "Email Notifications",
    desc: "All updates delivered to your inbox",
    color: "blue",
  },
  {
    key: "applicationUpdates",
    icon: <ClipboardList size={17} strokeWidth={1.8} />,
    label: "Application Updates",
    desc: "Status changes on your job applications",
    color: "green",
  },
  {
    key: "jobAlerts",
    icon: <Briefcase size={17} strokeWidth={1.8} />,
    label: "Job Alerts",
    desc: "New postings matching your profile",
    color: "amber",
  },
  {
    key: "weeklyDigest",
    icon: <ChartNoAxesCombined size={17} strokeWidth={1.8} />,
    label: "Weekly Digest",
    desc: "A weekly summary of your activity",
    color: "green",
  },
];

const colorTokens = {
  blue: {
    solid: "bg-[#3B82F6]",
    ring: "ring-blue-100",
    grad: "from-blue-50 to-blue-100/40",
    text: "text-[#3B82F6]",
    glow: "shadow-blue-200/60",
  },
  green: {
    solid: "bg-[#22C55E]",
    ring: "ring-green-100",
    grad: "from-green-50 to-green-100/40",
    text: "text-[#22C55E]",
    glow: "shadow-green-200/60",
  },
  amber: {
    solid: "bg-[#F59E0B]",
    ring: "ring-amber-100",
    grad: "from-amber-50 to-amber-100/40",
    text: "text-[#F59E0B]",
    glow: "shadow-amber-200/60",
  },
};

function Toggle({ active, onToggle, color = "blue" }) {
  const c = colorTokens[color];
  return (
    <button
      onClick={onToggle}
      aria-pressed={active}
      className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#3B82F6]
        ${active ? `${c.solid} shadow-md ${c.glow}` : "bg-[#CBD5E1]"}`}
    >
      <span
        className={`flex items-center justify-center h-4 w-4 rounded-full bg-white shadow-md transition-transform duration-300 ease-out
        ${active ? "translate-x-6" : "translate-x-1"}`}
      >
        {active ? (
          <Check size={9} strokeWidth={3.5} className={c.text} />
        ) : (
          <X size={9} strokeWidth={3.5} className="text-[#94A3B8]" />
        )}
      </span>
    </button>
  );
}

function PasswordInput({ label, name, value, onChange, show, onToggleShow }) {
  return (
    <div className="mb-4">
      <label className="text-xs font-semibold uppercase tracking-widest text-[#64748B] block mb-1.5">
        {label}
      </label>
      <div className="relative">
        <input
          type={show ? "text" : "password"}
          name={name}
          value={value}
          onChange={onChange}
          placeholder="••••••••"
          className="w-full bg-[#F8FAFC] border border-[#CBD5E1] text-[#1E293B] rounded-xl px-4 py-2.5 text-sm pr-14 outline-none transition focus:border-[#3B82F6] focus:ring-2 focus:ring-[#3B82F6]/20 placeholder:text-[#94A3B8]"
        />
        <button
          type="button"
          onClick={onToggleShow}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-[#64748B] hover:text-[#3B82F6] transition-colors"
        >
          {show ? "Hide" : "Show"}
        </button>
      </div>
    </div>
  );
}

function ChangePasswordModal({ onClose, onSave }) {
  const [passwords, setPasswords] = useState({
    current: "",
    newPass: "",
    confirm: "",
  });
  const [showPass, setShowPass] = useState({
    current: false,
    newPass: false,
    confirm: false,
  });
  const [passError, setPassError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    setPasswords({ ...passwords, [e.target.name]: e.target.value });
    setPassError("");
  };

  const strength = Math.min(4, Math.floor(passwords.newPass.length / 3));
  const strengthLabel =
    passwords.newPass.length === 0
      ? ""
      : passwords.newPass.length < 4
        ? "Too weak"
        : passwords.newPass.length < 7
          ? "Could be stronger"
          : passwords.newPass.length < 10
            ? "Looking good"
            : "Strong 💪";

  const strengthColors = [
    "bg-[#EF4444]",
    "bg-[#F59E0B]",
    "bg-[#3B82F6]",
    "bg-[#22C55E]",
  ];

  const handleSubmit = async () => {
    if (!passwords.current) {
      setPassError("Enter your current password.");
      return;
    }
    if (!passwords.newPass) {
      setPassError("Enter a new password.");
      return;
    }
    if (passwords.newPass !== passwords.confirm) {
      setPassError("Passwords don't match!");
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.put("/auth/change-password", {
        currentPassword: passwords.current,
        newPassword: passwords.newPass,
      });

      if (res.message && res.message.toLowerCase().includes("incorrect")) {
        setPassError(res.message);
        setSubmitting(false);
        return;
      }

      onSave();
    } catch (err) {
      console.error("Failed to change password:", err);
      setPassError("Something went wrong. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-md max-h-[calc(100vh-2rem)] overflow-y-auto border border-[#E2E8F0]"
        style={{ animation: "fadeSlideUp 0.2s ease-out" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-5 pb-4 sm:px-6 sm:pt-6 border-b border-[#F1F5F9]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100/40 ring-1 ring-blue-100 flex items-center justify-center">
              <Lock size={16} className="text-[#3B82F6]" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#1E293B]">
                Change Password
              </h2>
              <p className="text-xs text-[#64748B] mt-0.5">
                Use symbols, numbers & uppercase
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-[#F1F5F9] hover:bg-[#E2E8F0] flex items-center justify-center text-[#64748B] transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-6">
          <PasswordInput
            label="Current Password"
            name="current"
            value={passwords.current}
            onChange={handleChange}
            show={showPass.current}
            onToggleShow={() =>
              setShowPass((p) => ({ ...p, current: !p.current }))
            }
          />
          <PasswordInput
            label="New Password"
            name="newPass"
            value={passwords.newPass}
            onChange={handleChange}
            show={showPass.newPass}
            onToggleShow={() =>
              setShowPass((p) => ({ ...p, newPass: !p.newPass }))
            }
          />
          <PasswordInput
            label="Confirm New Password"
            name="confirm"
            value={passwords.confirm}
            onChange={handleChange}
            show={showPass.confirm}
            onToggleShow={() =>
              setShowPass((p) => ({ ...p, confirm: !p.confirm }))
            }
          />

          {passError && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-[#EF4444] text-xs font-medium rounded-xl px-4 py-2.5 mt-1">
              ⚠️ {passError}
            </div>
          )}

          {passwords.newPass && (
            <div className="mt-4 bg-[#F8FAFC] rounded-xl p-3 sm:p-4 border border-[#E2E8F0]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold uppercase tracking-widest text-[#64748B]">
                  Strength
                </span>
                <span
                  className={`text-xs font-semibold ${strength <= 1 ? "text-[#EF4444]" : strength <= 2 ? "text-[#F59E0B]" : strength <= 3 ? "text-[#3B82F6]" : "text-[#22C55E]"}`}
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
                  ["8+ characters", passwords.newPass.length >= 8],
                  ["Uppercase letter", /[A-Z]/.test(passwords.newPass)],
                  ["Number", /[0-9]/.test(passwords.newPass)],
                  ["Special character", /[^a-zA-Z0-9]/.test(passwords.newPass)],
                ].map(([tip, met]) => (
                  <div
                    key={tip}
                    className="flex items-center gap-2 text-xs text-[#64748B]"
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${met ? "bg-[#22C55E]" : "bg-[#CBD5E1]"}`}
                    />
                    {tip}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 sm:gap-3 px-4 pb-5 sm:px-6 sm:pb-6">
          <button
            onClick={onClose}
            className="px-3 sm:px-5 py-2.5 rounded-xl text-sm font-semibold text-[#64748B] hover:bg-[#F1F5F9] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="flex items-center gap-1 sm:gap-2 bg-[#1E293B] hover:bg-[#3B82F6] text-white text-sm font-semibold px-3 sm:px-6 py-2.5 rounded-xl shadow-md transition-all disabled:opacity-60"
          >
            <Key size={14} /> {submitting ? "Updating..." : "Update Password"}
          </button>
        </div>
      </div>
      <style>{`@keyframes fadeSlideUp { from { opacity:0; transform:translateY(14px) scale(0.97); } to { opacity:1; transform:translateY(0) scale(1); } }`}</style>
    </div>
  );
}

export default function StudentSettingsPage() {
  const [showPassModal, setShowPassModal] = useState(false);
  const [toggles, setToggles] = useState({
    emailNotifications: true,
    applicationUpdates: true,
    jobAlerts: false,
    weeklyDigest: false,
  });
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState("security");
  const [profileCompletion, setProfileCompletion] = useState(0);

  // Sliding pill indicator for the tab switcher
  const tabRefs = useRef({});
  const [indicator, setIndicator] = useState({ left: 0, width: 0 });

  useLayoutEffect(() => {
    const el = tabRefs.current[activeTab];
    if (el) {
      setIndicator({ left: el.offsetLeft, width: el.offsetWidth });
    }
  }, [activeTab, loading]);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const student = await api.get("/students/me");
        if (student.notificationPreferences) {
          setToggles(student.notificationPreferences);
        }

        const fields = [
          "name",
          "email",
          "phone",
          "dob",
          "gender",
          "address",
          "college",
          "rollNo",
          "school",
          "branch",
          "course",
          "batch",
          "cgpa",
        ];
        const filled = fields.filter((f) => student[f]).length;
        setProfileCompletion(Math.round((filled / fields.length) * 100));
      } catch (err) {
        console.error("Failed to load student settings:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleToggle = (key) =>
    setToggles((prev) => ({ ...prev, [key]: !prev[key] }));
  const activeNotifs = notificationOptions.filter(
    ({ key }) => toggles[key],
  ).length;
  const totalNotifs = notificationOptions.length;

  const handleSave = async () => {
    if (activeTab === "notifications") {
      try {
        const updated = await api.put("/students/me/notifications", toggles);
        setToggles(updated);
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      } catch (err) {
        console.error("Failed to save notification preferences:", err);
      }
    } else {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
  };

  const handlePasswordSave = () => {
    setShowPassModal(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 md:px-0 py-24 flex flex-col items-center gap-3">
        <div className="w-8 h-8 rounded-full border-2 border-[#E2E8F0] border-t-[#3B82F6] animate-spin" />
        <p className="text-sm text-[#94A3B8]">Loading your settings…</p>
      </div>
    );
  }

  return (
    <div
      className="max-w-3xl mx-auto px-4 md:px-0 pb-36 sm:pb-28"
      style={{ fontFamily: "Inter, sans-serif" }}
    >
      {/* Hero Header */}
      <div
        className="relative overflow-hidden rounded-2xl sm:rounded-3xl mb-5 sm:mb-6 px-5 py-6 sm:px-8 sm:py-8 shadow-lg shadow-blue-900/10"
        style={{
          background:
            "linear-gradient(135deg, #1D4ED8 0%, #2563EB 45%, #0EA5E9 100%)",
        }}
      >
        {/* Decorative ambient glows — restrained, not busy */}
        <div className="pointer-events-none absolute -top-12 -right-8 w-48 h-48 rounded-full bg-white/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 -left-10 w-56 h-56 rounded-full bg-white/10 blur-3xl" />

        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-5">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-white/15 backdrop-blur-sm ring-1 ring-white/25 flex items-center justify-center">
              <Shield size={20} className="text-white" strokeWidth={1.8} />
            </div>
            <div>
              <h1
                className="text-xl font-bold text-white tracking-tight"
                style={{ fontFamily: "Space Grotesk, sans-serif" }}
              >
                Account Settings
              </h1>
              <p className="text-sm text-blue-100 mt-0.5">
                Manage your security and notification preferences
              </p>
            </div>
          </div>

          {/* Tab Switcher — glass pill on gradient */}
          <div className="relative flex items-center w-full sm:w-auto bg-white/15 backdrop-blur-sm ring-1 ring-white/25 rounded-xl p-1">
            <div
              className="absolute top-1 bottom-1 rounded-lg bg-white shadow-sm transition-all duration-300 ease-out"
              style={{ left: indicator.left, width: indicator.width }}
            />
            {[
              { id: "security", icon: <Lock size={13} />, label: "Security" },
              {
                id: "notifications",
                icon: <Bell size={13} />,
                label: "Notifications",
              },
            ].map((tab) => (
              <button
                key={tab.id}
                ref={(el) => (tabRefs.current[tab.id] = el)}
                onClick={() => setActiveTab(tab.id)}
                className={`relative z-10 flex flex-1 sm:flex-none justify-center items-center gap-1.5 sm:gap-2 px-2 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-colors duration-200
                  ${activeTab === tab.id ? "text-[#1D4ED8]" : "text-white/85 hover:text-white"}`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-5 sm:mb-6">
        {[
          {
            icon: <Shield size={18} className="text-[#3B82F6]" />,
            label: "Password",
            value: "Protected",
            color: "blue",
            width: "100%",
          },
          {
            icon: <User size={18} className="text-[#22C55E]" />,
            label: "Profile",
            value: `${profileCompletion}%`,
            color: "green",
            width: `${profileCompletion}%`,
          },
          {
            icon: <Bell size={18} className="text-[#F59E0B]" />,
            label: "Notifications",
            value: `${activeNotifs}/${totalNotifs} Active`,
            color: "amber",
            width: `${Math.round((activeNotifs / totalNotifs) * 100)}%`,
          },
        ].map((stat) => {
          const c = colorTokens[stat.color];
          return (
            <div
              key={stat.label}
              className="group bg-white rounded-2xl border border-[#E2E8F0] p-3 sm:p-4 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 relative overflow-hidden"
            >
              <div
                className={`w-9 h-9 rounded-xl bg-gradient-to-br ${c.grad} ring-1 ${c.ring} flex items-center justify-center mb-3 transition-transform duration-300 group-hover:scale-105`}
              >
                {stat.icon}
              </div>
              <p className="text-sm font-bold text-[#1E293B]">{stat.value}</p>
              <p className="text-xs uppercase tracking-widest text-[#64748B] mt-0.5">
                {stat.label}
              </p>
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#F1F5F9]">
                <div
                  className={`h-full ${c.solid} transition-all duration-500`}
                  style={{ width: stat.width }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Security Tab */}
      {activeTab === "security" && (
        <div
          className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm"
          style={{ animation: "fadeSlideUp 0.25s ease-out" }}
        >
          <div className="flex items-center gap-3 px-4 pt-5 pb-4 sm:px-6 sm:pt-6 border-b border-[#F1F5F9]">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-50 to-blue-100/40 ring-1 ring-blue-100 flex items-center justify-center">
              <Lock size={15} className="text-[#3B82F6]" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#1E293B]">
                Security Settings
              </h2>
              <p className="text-xs text-[#64748B] mt-0.5">
                Manage your account password
              </p>
            </div>
          </div>
          <div className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-4 sm:px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-green-50 to-green-100/40 ring-1 ring-green-100 flex items-center justify-center">
                  <Shield size={16} className="text-[#22C55E]" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#1E293B]">
                    Password
                  </p>
                  <p className="text-xs text-[#64748B] mt-0.5">
                    Last updated recently · Protected
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowPassModal(true)}
                className="flex w-full sm:w-auto justify-center items-center gap-2 bg-[#1E293B] hover:bg-[#3B82F6] text-white text-xs font-semibold px-4 py-2 rounded-lg shadow-sm hover:shadow-md transition-all"
              >
                <Key size={13} /> Change Password
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notifications Tab */}
      {activeTab === "notifications" && (
        <div
          className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm"
          style={{ animation: "fadeSlideUp 0.25s ease-out" }}
        >
          <div className="flex items-start sm:items-center justify-between gap-3 px-4 pt-5 pb-4 sm:px-6 sm:pt-6 border-b border-[#F1F5F9]">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-50 to-amber-100/40 ring-1 ring-amber-100 flex items-center justify-center">
                <Bell size={15} className="text-[#F59E0B]" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-[#1E293B]">
                  Notification Preferences
                </h2>
                <p className="text-xs text-[#64748B] mt-0.5">
                  Choose what updates you want to receive
                </p>
              </div>
            </div>
            <span className="text-xs font-bold text-[#3B82F6] bg-blue-50 border border-blue-100 px-2.5 py-1 rounded-lg">
              {activeNotifs} Active
            </span>
          </div>
          <div className="divide-y divide-[#F1F5F9]">
            {notificationOptions.map(({ key, icon, label, desc, color }) => {
              const c = colorTokens[color];
              return (
                <div
                  key={key}
                  className="flex items-center justify-between gap-3 px-4 sm:px-6 py-4 hover:bg-[#F8FAFC] transition-colors"
                >
                  <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-300
                      ${
                        toggles[key]
                          ? `bg-gradient-to-br ${c.grad} ring-1 ${c.ring} ${c.text}`
                          : "bg-[#F1F5F9] border border-[#E2E8F0] text-[#94A3B8]"
                      }`}
                    >
                      {icon}
                    </div>
                    <div className="min-w-0">
                      <p
                        className={`text-sm font-semibold transition-colors ${toggles[key] ? "text-[#1E293B]" : "text-[#94A3B8]"}`}
                      >
                        {label}
                      </p>
                      <p className="text-xs text-[#64748B] mt-0.5 leading-relaxed">
                        {desc}
                      </p>
                    </div>
                  </div>
                  <Toggle
                    active={toggles[key]}
                    onToggle={() => handleToggle(key)}
                    color={color}
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Save Bar — sticky, glass-blur. Sits above the mobile bottom navbar
          (bottom-16) on small screens; snaps back to the page edge on sm+
          where there's usually no fixed bottom nav. */}
      <div className="fixed bottom-16 sm:bottom-0 left-0 right-0 z-20 bg-white/80 backdrop-blur-md border-t border-[#E2E8F0]">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-3 px-4 md:px-0 py-3 sm:py-4">
          <div className="flex items-center gap-2 min-h-[18px] min-w-0">
            {saved ? (
              <span
                className="flex items-center gap-1.5 text-xs font-semibold text-[#22C55E]"
                style={{ animation: "fadeSlideUp 0.2s ease-out" }}
              >
                <Check size={13} /> Changes Saved
              </span>
            ) : (
              <p className="text-xs text-[#64748B] leading-relaxed">
                {activeTab === "security"
                  ? "Password changes apply immediately."
                  : "Toggle changes are saved instantly."}
              </p>
            )}
          </div>
          <button
            onClick={handleSave}
            className="flex shrink-0 items-center gap-1 sm:gap-2 bg-[#1E293B] hover:bg-[#3B82F6] text-white text-sm font-semibold px-3 sm:px-6 py-2.5 rounded-xl shadow-md hover:shadow-lg transition-all"
          >
            <Save size={14} /> Save Changes
          </button>
        </div>
      </div>

      {/* Modal */}
      {showPassModal && (
        <ChangePasswordModal
          onClose={() => setShowPassModal(false)}
          onSave={handlePasswordSave}
        />
      )}

      <style>{`@keyframes fadeSlideUp { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }`}</style>
    </div>
  );
}
