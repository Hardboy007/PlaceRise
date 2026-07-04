import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Edit3,
  Check,
  X,
  Lock,
  Bell,
  Key,
  Users,
  Building2,
  Megaphone,
  TrendingUp,
  Shield,
  Mail,
  Phone,
  MapPin,
  Calendar,
  ExternalLink,
} from "lucide-react";
import { api } from "../../utils/api";

const notificationOptions = [
  {
    key: "emailNotifications",
    label: "Email Notifications",
    desc: "All updates to your inbox",
    color: "blue",
  },
  {
    key: "applicationUpdates",
    label: "Application Updates",
    desc: "Status changes on applications",
    color: "green",
  },
  {
    key: "newCompanyAlerts",
    label: "New Company Alerts",
    desc: "When a new company is added",
    color: "amber",
  },
  {
    key: "weeklyReport",
    label: "Weekly Report",
    desc: "Weekly placement summary",
    color: "blue",
  },
];

const toggleColors = {
  blue: "bg-primary",
  green: "bg-success",
  amber: "bg-warning",
};

function Toggle({ active, onToggle, color = "blue" }) {
  return (
    <button
      onClick={onToggle}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-200
        ${active ? toggleColors[color] : "bg-[#CBD5E1]"}`}
    >
      <span
        className={`inline-block h-4 w-4 rounded-full bg-white shadow-md transition-transform duration-200
        ${active ? "translate-x-6" : "translate-x-1"}`}
      />
    </button>
  );
}

function PasswordModal({ onClose, onSave }) {
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
  const [error, setError] = useState("");
  const handleChange = (e) => {
    setPasswords({ ...passwords, [e.target.name]: e.target.value });
    setError("");
  };
  const strength = Math.min(4, Math.floor(passwords.newPass.length / 3));
  const strengthColors = [
    "bg-danger",
    "bg-warning",
    "bg-primary",
    "bg-success",
  ];
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

  const handleSubmit = () => {
    if (!passwords.current) {
      setError("Enter current password.");
      return;
    }
    if (!passwords.newPass) {
      setError("Enter new password.");
      return;
    }
    if (passwords.newPass !== passwords.confirm) {
      setError("Passwords don't match!");
      return;
    }
    onSave();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md border border-[#E2E8F0]">
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-background">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center">
              <Lock size={16} className="text-primary" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#1E293B]">
                Change Password
              </h2>
              <p className="text-xs text-text-muted mt-0.5">
                Use symbols, numbers & uppercase
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-background hover:bg-[#E2E8F0] flex items-center justify-center text-text-muted transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="p-6 flex flex-col gap-4">
          {[
            { label: "Current Password", name: "current" },
            { label: "New Password", name: "newPass" },
            { label: "Confirm Password", name: "confirm" },
          ].map((field) => (
            <div key={field.name}>
              <label className="text-xs font-semibold uppercase tracking-widest text-text-muted block mb-1.5">
                {field.label}
              </label>
              <div className="relative">
                <input
                  type={showPass[field.name] ? "text" : "password"}
                  name={field.name}
                  value={passwords[field.name]}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="w-full bg-[#F8FAFC] border border-[#CBD5E1] text-[#1E293B] rounded-xl px-4 py-2.5 text-sm pr-14 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition"
                />
                <button
                  type="button"
                  onClick={() =>
                    setShowPass((p) => ({ ...p, [field.name]: !p[field.name] }))
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-text-muted hover:text-primary"
                >
                  {showPass[field.name] ? "Hide" : "Show"}
                </button>
              </div>
            </div>
          ))}

          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-danger text-xs font-medium rounded-xl px-4 py-2.5">
              ⚠️ {error}
            </div>
          )}

          {passwords.newPass && (
            <div className="bg-[#F8FAFC] rounded-xl p-4 border border-[#E2E8F0]">
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
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 px-6 pb-6">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold text-text-muted hover:bg-background transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="flex items-center gap-2 bg-[#1E293B] hover:bg-primary text-white text-sm font-semibold px-6 py-2.5 rounded-xl shadow-md transition-colors"
          >
            <Key size={14} /> Update Password
          </button>
        </div>
      </div>
    </div>
  );
}
function Field({ label, name, icon: Icon, editing, value, onChange }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs font-semibold uppercase tracking-widest text-text-muted flex items-center gap-1.5">
        <Icon size={11} /> {label}
      </span>
      {editing ? (
        <input
          name={name}
          value={value || ""}
          onChange={onChange}
          className="w-full px-3 py-2 rounded-xl border border-[#CBD5E1] text-sm text-[#1E293B] bg-[#F8FAFC] focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition"
        />
      ) : (
        <span className="text-sm font-medium text-[#1E293B]">
          {value || "—"}
        </span>
      )}
    </div>
  );
}
export default function CoordinatorProfile() {
  const navigate = useNavigate();
  const [coordinator, setCoordinator] = useState(null);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(null);
  const [showPassModal, setShowPassModal] = useState(false);
  const [saved, setSaved] = useState(false);
  const [notifSaved, setNotifSaved] = useState(false);
  const [placedCount, setPlacedCount] = useState(0);
  const [totalDrives, setTotalDrives] = useState(0);
  const [totalStudents, setTotalStudents] = useState(0);
  const [activityLog, setActivityLog] = useState([]);
  const [toggles, setToggles] = useState({
    emailNotifications: true,
    applicationUpdates: true,
    newCompanyAlerts: false,
    weeklyReport: true,
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const coordData = await api.get("/coordinators/me");
        setCoordinator(coordData);

        if (coordData.notificationPreferences) {
          setToggles(coordData.notificationPreferences);
        }

        const [students, jobs, activity] = await Promise.all([
          api.get("/students"),
          api.get("/companies/jobs"),
          api.get("/coordinators/me/activity"),
        ]);

        setTotalStudents(Array.isArray(students) ? students.length : 0);
        setPlacedCount(
          Array.isArray(students)
            ? students.filter((s) => s.placementStatus === "Placed").length
            : 0,
        );

        // FIXED: "Total Drives" was counting every job doc, including ones
        // whose company was deleted (companyId becomes null/undefined —
        // same orphan issue fixed earlier in ApplicationsManagementPage)
        // and ones whose application deadline has already passed. The
        // JobPosting.status field is just a default "Active" string that
        // never actually gets flipped to "Closed" anywhere, so a drive is
        // only "closed" in practice once its lastDate is in the past. Now
        // only counting live drives — company still exists AND (no
        // lastDate set, or lastDate is today/in the future).
        const now = new Date();
        const activeDrives = Array.isArray(jobs)
          ? jobs.filter((j) => {
              if (!j.companyId || !j.companyId.name) return false;
              if (!j.lastDate) return true;
              return new Date(j.lastDate) >= now;
            })
          : [];
        setTotalDrives(activeDrives.length);

        setActivityLog(Array.isArray(activity) ? activity : []);
      } catch (err) {
        console.error("Failed to load coordinator profile:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleEdit = () => {
    setForm({ ...coordinator });
    setEditing(true);
  };

  const handleSave = async () => {
    try {
      const updated = await api.put("/coordinators/me", {
        name: form.name,
        phone: form.phone,
        designation: form.designation,
        department: form.department,
        college: form.college,
      });
      setCoordinator(updated);
      setEditing(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error("Failed to save profile:", err);
    }
  };

  const handleCancel = () => {
    setForm(null);
    setEditing(false);
  };
  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });
  const handleToggle = (key) =>
    setToggles((prev) => ({ ...prev, [key]: !prev[key] }));

  const handleSaveNotifications = async () => {
    try {
      const updated = await api.put("/coordinators/me/notifications", toggles);
      setToggles(updated);
      setNotifSaved(true);
      setTimeout(() => setNotifSaved(false), 3000);
    } catch (err) {
      console.error("Failed to save notification preferences:", err);
    }
  };

  const displayData = editing ? form : coordinator;

  if (loading)
    return <div className="text-center py-20 text-text-muted">Loading...</div>;
  if (!coordinator)
    return (
      <div className="text-center py-20 text-text-muted">Profile not found</div>
    );
  return (
    <div
      className="max-w-3xl mx-auto"
      style={{ fontFamily: "Inter, sans-serif" }}
    >
      {/* Hero */}
      <div
        className="relative rounded-3xl overflow-hidden mb-6 border border-white/10"
        style={{
          background:
            "linear-gradient(135deg, #3B82F6 0%, #60A5FA 60%, #818CF8 100%)",
        }}
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `radial-gradient(circle at 20% 50%, rgba(255,255,255,0.1) 0%, transparent 50%),
                         radial-gradient(circle at 80% 20%, rgba(255,255,255,0.05) 0%, transparent 40%)`,
          }}
        />
        <div className="relative z-10 p-8 flex flex-wrap items-center gap-6">
          <div
            className="w-20 h-20 rounded-full shrink-0"
            style={{
              background: "linear-gradient(135deg, white, #E0E7FF)",
              padding: "3px",
            }}
          >
            <div
              className="w-full h-full rounded-full bg-primary flex items-center justify-center text-2xl font-bold text-white"
              style={{ fontFamily: "Space Grotesk, sans-serif" }}
            >
              {coordinator.name?.charAt(0)}
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <h1
              className="text-2xl font-bold text-white mb-1"
              style={{ fontFamily: "Space Grotesk, sans-serif" }}
            >
              {displayData.name}
            </h1>
            <p className="text-sm text-white/70 mb-3">
              {displayData.designation} · {displayData.department}
            </p>
            <div className="flex flex-wrap gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-white/20 text-white border border-white/30">
                {displayData.college}
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-white/20 text-white border border-white/30">
                Since {displayData.activeSince}
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-2 shrink-0">
            {editing ? (
              <>
                <button
                  onClick={handleSave}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white text-primary hover:bg-white/90 text-sm font-semibold transition-colors shadow-md"
                >
                  <Check size={14} /> Save Changes
                </button>
                <button
                  onClick={handleCancel}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/20 hover:bg-white/30 text-white text-sm font-medium transition-colors border border-white/20"
                >
                  <X size={14} /> Cancel
                </button>
              </>
            ) : (
              <button
                onClick={handleEdit}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white text-primary hover:bg-white/90 text-sm font-semibold transition-colors shadow-md"
              >
                <Edit3 size={14} /> Edit Profile
              </button>
            )}
            {saved && (
              <span className="text-xs font-semibold text-white/80 text-center">
                ✓ Saved
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Stats Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          {
            label: "Total Drives",
            value: totalDrives,
            icon: Building2,
            color: "border-t-primary",
            bg: "bg-blue-50",
            iconColor: "text-primary",
          },
          {
            label: "Students Placed",
            value: placedCount,
            icon: TrendingUp,
            color: "border-t-success",
            bg: "bg-green-50",
            iconColor: "text-success",
          },
          {
            label: "Total Students",
            value: totalStudents,
            icon: Users,
            color: "border-t-warning",
            bg: "bg-amber-50",
            iconColor: "text-warning",
          },
          {
            label: "Active Since",
            value: coordinator.activeSince,
            icon: Calendar,
            color: "border-t-[#818CF8]",
            bg: "bg-indigo-50",
            iconColor: "text-[#818CF8]",
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className={`bg-white rounded-2xl border border-[#E2E8F0] border-t-2 ${stat.color} p-4 shadow-sm`}
          >
            <div
              className={`w-8 h-8 rounded-lg ${stat.bg} flex items-center justify-center mb-3`}
            >
              <stat.icon size={16} className={stat.iconColor} />
            </div>
            <p
              className="text-xl font-bold text-[#1E293B]"
              style={{ fontFamily: "Space Grotesk, sans-serif" }}
            >
              {stat.value}
            </p>
            <p className="text-xs uppercase tracking-widest text-text-muted mt-1">
              {stat.label}
            </p>
          </div>
        ))}
      </div>

      {/* Profile Details */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] border-l-4 border-l-primary p-6 shadow-sm mb-5">
        <div className="flex items-center gap-2 mb-5 pb-4 border-b border-background">
          <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center">
            <Users size={14} className="text-primary" />
          </div>
          <h3
            className="text-sm font-bold text-[#1E293B]"
            style={{ fontFamily: "Space Grotesk, sans-serif" }}
          >
            Profile Information
          </h3>
        </div>
        <div className="grid grid-cols-2 gap-5">
          <Field
            label="Full Name"
            name="name"
            icon={Users}
            editing={editing}
            value={displayData.name}
            onChange={handleChange}
          />
          <Field
            label="Email"
            name="email"
            icon={Mail}
            editing={editing}
            value={displayData.email}
            onChange={handleChange}
          />
          <Field
            label="Phone"
            name="phone"
            icon={Phone}
            editing={editing}
            value={displayData.phone}
            onChange={handleChange}
          />
          <Field
            label="Designation"
            name="designation"
            icon={TrendingUp}
            editing={editing}
            value={displayData.designation}
            onChange={handleChange}
          />
          <Field
            label="Department"
            name="department"
            icon={Building2}
            editing={editing}
            value={displayData.department}
            onChange={handleChange}
          />
          <Field
            label="Active Since"
            name="activeSince"
            icon={Calendar}
            editing={editing}
            value={displayData.activeSince}
            onChange={handleChange}
          />
          <div className="col-span-2">
            <Field
              label="College"
              name="college"
              icon={MapPin}
              editing={editing}
              value={displayData.college}
              onChange={handleChange}
            />
          </div>
        </div>
      </div>

      {/* Quick Links */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] p-5 shadow-sm mb-5">
        <h3
          className="text-sm font-bold text-[#1E293B] mb-4"
          style={{ fontFamily: "Space Grotesk, sans-serif" }}
        >
          Quick Links
        </h3>
        <div className="flex flex-wrap gap-3">
          {[
            {
              label: "All Students",
              icon: Users,
              route: "/coordinator/students",
            },
            {
              label: "All Companies",
              icon: Building2,
              route: "/coordinator/companies",
            },
            {
              label: "Post Announcement",
              icon: Megaphone,
              route: "/coordinator/announcements",
            },
          ].map((link) => (
            <button
              key={link.label}
              onClick={() => navigate(link.route)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-background text-[#1E293B] hover:bg-[#E2E8F0] border border-[#CBD5E1] transition-colors"
            >
              <link.icon size={14} />
              {link.label}
              <ExternalLink size={12} className="text-[#94A3B8]" />
            </button>
          ))}
        </div>
      </div>

      {/* Activity Log */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] border-l-4 border-l-success p-5 shadow-sm mb-5">
        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-background">
          <div className="w-7 h-7 rounded-lg bg-green-50 flex items-center justify-center">
            <TrendingUp size={14} className="text-success" />
          </div>
          <h3
            className="text-sm font-bold text-[#1E293B]"
            style={{ fontFamily: "Space Grotesk, sans-serif" }}
          >
            Recent Activity
          </h3>
        </div>
        <div className="flex flex-col gap-2">
          {activityLog.length === 0 ? (
            <p className="text-sm text-text-muted px-1 py-2">
              No recent activity yet.
            </p>
          ) : (
            activityLog.map((log, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]"
              >
                <p className="text-sm text-[#1E293B]">{log.action}</p>
                <span className="text-xs text-text-muted shrink-0 ml-4">
                  {log.time}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Divider */}
      <div className="flex items-center gap-4 my-6">
        <div className="flex-1 h-px bg-[#E2E8F0]" />
        <span className="text-xs font-semibold uppercase tracking-widest text-text-muted">
          Settings
        </span>
        <div className="flex-1 h-px bg-[#E2E8F0]" />
      </div>

      {/* Security */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm mb-5">
        <div className="flex items-center gap-3 px-6 pt-6 pb-4 border-b border-background">
          <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
            <Shield size={15} className="text-primary" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-[#1E293B]">Security</h2>
            <p className="text-xs text-text-muted mt-0.5">
              Manage your account password
            </p>
          </div>
        </div>
        <div className="p-6">
          <div className="flex items-center justify-between bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-green-50 flex items-center justify-center">
                <Shield size={16} className="text-success" />
              </div>
              <div>
                <p className="text-sm font-semibold text-[#1E293B]">Password</p>
                <p className="text-xs text-text-muted mt-0.5">
                  Last updated recently · Protected
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowPassModal(true)}
              className="flex items-center gap-2 bg-[#1E293B] hover:bg-primary text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors"
            >
              <Key size={13} /> Change Password
            </button>
          </div>
        </div>
      </div>

      {/* Notifications */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm mb-6">
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-background">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
              <Bell size={15} className="text-warning" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#1E293B]">
                Notification Preferences
              </h2>
              <p className="text-xs text-text-muted mt-0.5">
                Choose what updates you want
              </p>
            </div>
          </div>
          <span className="text-xs font-bold text-primary bg-blue-50 border border-blue-100 px-2.5 py-1 rounded-lg">
            {Object.values(toggles).filter(Boolean).length} Active
          </span>
        </div>
        <div className="divide-y divide-background">
          {notificationOptions.map(({ key, label, desc, color }) => (
            <div
              key={key}
              className="flex items-center justify-between px-6 py-4 hover:bg-[#F8FAFC] transition-colors"
            >
              <div>
                <p
                  className={`text-sm font-semibold ${toggles[key] ? "text-[#1E293B]" : "text-[#94A3B8]"}`}
                >
                  {label}
                </p>
                <p className="text-xs text-text-muted mt-0.5">{desc}</p>
              </div>
              <Toggle
                active={toggles[key]}
                onToggle={() => handleToggle(key)}
                color={color}
              />
            </div>
          ))}
        </div>
        <div className="px-6 py-4 border-t border-background">
          <button
            onClick={handleSaveNotifications}
            className="flex items-center gap-2 bg-[#1E293B] hover:bg-primary text-white text-sm font-semibold px-6 py-2.5 rounded-xl shadow-md transition-colors"
          >
            {notifSaved ? (
              <>
                <Check size={14} /> Saved
              </>
            ) : (
              "Save Changes"
            )}
          </button>
        </div>
      </div>

      {showPassModal && (
        <PasswordModal
          onClose={() => setShowPassModal(false)}
          onSave={() => {
            setShowPassModal(false);
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
          }}
        />
      )}
    </div>
  );
}
