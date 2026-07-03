import { useState, useEffect } from "react";
import { Lock, Bell, Shield, User, Save, Key, Check } from "lucide-react";
import { api } from "../../utils/api";

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

const toggleColors = {
  blue: "bg-[#3B82F6]",
  green: "bg-[#22C55E]",
  amber: "bg-[#F59E0B]",
};

function Toggle({ active, onToggle, color = "blue" }) {
  return (
    <button
      onClick={onToggle}
      className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors duration-200 focus:outline-none
        ${active ? toggleColors[color] : "bg-[#CBD5E1]"}`}
    >
      <span
        className={`inline-block h-4 w-4 rounded-full bg-white shadow-md transition-transform duration-200
        ${active ? "translate-x-6" : "translate-x-1"}`}
      />
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
        className="bg-white rounded-3xl shadow-2xl w-full max-w-md border border-[#E2E8F0]"
        style={{ animation: "fadeSlideUp 0.2s ease-out" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-[#F1F5F9]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center">
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
        <div className="p-6">
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
            <div className="mt-4 bg-[#F8FAFC] rounded-xl p-4 border border-[#E2E8F0]">
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
              <div className="grid grid-cols-2 gap-2 mt-3">
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
        <div className="flex items-center justify-end gap-3 px-6 pb-6">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold text-[#64748B] hover:bg-[#F1F5F9] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="flex items-center gap-2 bg-[#1E293B] hover:bg-[#3B82F6] text-white text-sm font-semibold px-6 py-2.5 rounded-xl shadow-md transition-all disabled:opacity-60"
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
    profileViews: true,
    weeklyDigest: false,
    smsNotifications: false,
  });
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState("security");
  const [profileCompletion, setProfileCompletion] = useState(0);

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
  const activeNotifs = Object.values(toggles).filter(Boolean).length;

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
    return <div className="text-center py-20 text-[#64748B]">Loading...</div>;
  }

  return (
    <div
      className="max-w-3xl mx-auto"
      style={{ fontFamily: "Inter, sans-serif" }}
    >
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1
            className="text-xl font-bold text-[#1E293B]"
            style={{ fontFamily: "Space Grotesk, sans-serif" }}
          >
            Account Settings
          </h1>
          <p className="text-sm text-[#64748B] mt-1">
            Manage your security and notification preferences
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center bg-white border border-[#E2E8F0] rounded-xl p-1 shadow-sm">
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
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200
                ${activeTab === tab.id ? "bg-[#1E293B] text-white shadow-sm" : "text-[#64748B] hover:text-[#1E293B]"}`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          {
            icon: <Shield size={18} className="text-[#3B82F6]" />,
            label: "Password",
            value: "Protected",
            bg: "bg-blue-50",
            bar: "bg-[#3B82F6]",
            width: "100%",
          },
          {
            icon: <User size={18} className="text-[#22C55E]" />,
            label: "Profile",
            value: `${profileCompletion}%`,
            bg: "bg-green-50",
            bar: "bg-[#22C55E]",
            width: `${profileCompletion}%`,
          },
          {
            icon: <Bell size={18} className="text-[#F59E0B]" />,
            label: "Notifications",
            value: `${activeNotifs}/6 Active`,
            bg: "bg-amber-50",
            bar: "bg-[#F59E0B]",
            width: `${Math.round((activeNotifs / 6) * 100)}%`,
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="bg-white rounded-2xl border border-[#E2E8F0] p-4 shadow-sm relative overflow-hidden"
          >
            <div
              className={`w-8 h-8 rounded-lg ${stat.bg} flex items-center justify-center mb-3`}
            >
              {stat.icon}
            </div>
            <p className="text-sm font-bold text-[#1E293B]">{stat.value}</p>
            <p className="text-xs uppercase tracking-widest text-[#64748B] mt-0.5">
              {stat.label}
            </p>
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#F1F5F9]">
              <div
                className={`h-full ${stat.bar} transition-all duration-500`}
                style={{ width: stat.width }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Security Tab */}
      {activeTab === "security" && (
        <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm">
          <div className="flex items-center gap-3 px-6 pt-6 pb-4 border-b border-[#F1F5F9]">
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
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
          <div className="p-6">
            <div className="flex items-center justify-between bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-green-50 flex items-center justify-center">
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
                className="flex items-center gap-2 bg-[#1E293B] hover:bg-[#3B82F6] text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors"
              >
                <Key size={13} /> Change Password
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notifications Tab */}
      {activeTab === "notifications" && (
        <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm">
          <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-[#F1F5F9]">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
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
            {notificationOptions.map(({ key, icon, label, desc, color }) => (
              <div
                key={key}
                className="flex items-center justify-between px-6 py-4 hover:bg-[#F8FAFC] transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center text-base flex-shrink-0
                    ${
                      toggles[key]
                        ? color === "blue"
                          ? "bg-blue-50 border border-blue-100"
                          : color === "green"
                            ? "bg-green-50 border border-green-100"
                            : "bg-amber-50 border border-amber-100"
                        : "bg-[#F1F5F9] border border-[#E2E8F0]"
                    }`}
                  >
                    {icon}
                  </div>
                  <div>
                    <p
                      className={`text-sm font-semibold ${toggles[key] ? "text-[#1E293B]" : "text-[#94A3B8]"}`}
                    >
                      {label}
                    </p>
                    <p className="text-xs text-[#64748B] mt-0.5">{desc}</p>
                  </div>
                </div>
                <Toggle
                  active={toggles[key]}
                  onToggle={() => handleToggle(key)}
                  color={color}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Save Button */}
      <div className="flex items-center justify-between bg-white border border-[#E2E8F0] rounded-2xl px-6 py-4 shadow-sm mt-5">
        <div className="flex items-center gap-2">
          {saved && (
            <span className="flex items-center gap-1.5 text-xs font-semibold text-[#22C55E]">
              <Check size={13} /> Changes Saved
            </span>
          )}
          {!saved && (
            <p className="text-xs text-[#64748B]">
              {activeTab === "security"
                ? "Password changes apply immediately."
                : "Toggle changes are saved instantly."}
            </p>
          )}
        </div>
        <button
          onClick={handleSave}
          className="flex items-center gap-2 bg-[#1E293B] hover:bg-[#3B82F6] text-white text-sm font-semibold px-6 py-2.5 rounded-xl shadow-md transition-colors"
        >
          <Save size={14} /> Save Changes
        </button>
      </div>

      {/* Modal */}
      {showPassModal && (
        <ChangePasswordModal
          onClose={() => setShowPassModal(false)}
          onSave={handlePasswordSave}
        />
      )}
    </div>
  );
}
