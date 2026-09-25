import { useState, useRef, useEffect } from "react";
import { api } from "../../utils/api";
import ResumeBuilder from "../../components/student/ResumeBuilder";
import {
  User,
  GraduationCap,
  Zap,
  FileText,
  Edit3,
  Check,
  X,
  Plus,
  Target,
  CalendarDays,
  TrendingUp,
  PartyPopper,
  Sparkles,
} from "lucide-react";
import { getCurrentYear } from "../../utils/courseDuration";
import { getSemester } from "../../utils/semester";
import CertificationModal from "../../components/student/CertificationModal";

function Field({ label, name, value, editing, form, onChange, type = "text" }) {
  return (
    <div className="flex flex-col gap-1 mb-4 last:mb-0">
      <span className="text-xs font-semibold uppercase tracking-widest text-[#64748B]">
        {label}
      </span>
      {editing ? (
        <input
          type={type}
          name={name}
          value={form[name] || ""}
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

function SectionCard({
  title,
  icon: IconComponent,
  iconBg,
  borderColor = "border-l-primary",
  children,
}) {
  return (
    <div
      className={`bg-white rounded-2xl border border-[#E2E8F0] border-l-4 ${borderColor} p-4 sm:p-6 shadow-sm hover:shadow-md transition-shadow`}
    >
      <div className="flex items-center gap-3 mb-4 sm:mb-5 pb-3 sm:pb-4 border-b border-background">
        <div
          className={`w-8 h-8 rounded-lg flex items-center justify-center ${iconBg}`}
        >
          {IconComponent && <IconComponent size={16} />}
        </div>
        <h3
          className="text-sm font-bold text-[#1E293B]"
          style={{ fontFamily: "Space Grotesk, sans-serif" }}
        >
          {title}
        </h3>
      </div>
      {children}
    </div>
  );
}

export default function StudentProfilePage() {
  console.log("COMPONENT LOADED - NEW VERSION");
  const [student, setStudent] = useState(null);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(null);
  const [newSkill, setNewSkill] = useState("");
  const [saved, setSaved] = useState(false);
  const [uploadingResume, setUploadingResume] = useState(false);
  const resumeInputRef = useRef(null);
  const [showResumeBuilder, setShowResumeBuilder] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const photoInputRef = useRef(null);
  const [removingPhoto, setRemovingPhoto] = useState(false);
  const [showCertModal, setShowCertModal] = useState(false);
  const [savingCert, setSavingCert] = useState(false);
  const [certifications, setCertifications] = useState([]);
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);
  const [showBuildConfirm, setShowBuildConfirm] = useState(false);

  useEffect(() => {
    document.title = "Your Profile — PlaceRise";
    const fetchProfile = async () => {
      const data = await api.get("/students/me");
      setStudent(data);
      setCertifications(data.certifications || []);
      // localStorage bhi update karo taaki layout mein photo dikhe
      const stored = JSON.parse(localStorage.getItem("student") || "{}");
      localStorage.setItem(
        "student",
        JSON.stringify({ ...stored, profilePhoto: data.profilePhoto }),
      );
      setLoading(false);
    };
    fetchProfile();
  }, []);

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);
    setUploadingPhoto(true);
    try {
      const data = await api.post("/students/me/profile-photo", formData);
      if (data?.profilePhotoUrl) {
        const updated = { ...student, profilePhoto: data.profilePhotoUrl };
        setStudent(updated);
        localStorage.setItem("student", JSON.stringify(updated));
      }
    } catch (err) {
      console.error("Photo upload failed:", err);
    } finally {
      setUploadingPhoto(false);
      e.target.value = "";
    }
  };

  const handleEdit = () => {
    setForm({
      ...student,
      about: student.about || "",
      linkedinUrl: student.linkedinUrl || "",
    });
    setEditing(true);
  };

  const handleSave = async () => {
    if (
      form.backlogs !== "" &&
      (isNaN(Number(form.backlogs)) || Number(form.backlogs) < 0)
    ) {
      alert("Backlogs must be a valid number (0 or more)");
      return;
    }
    const updated = await api.put("/students/me", form);
    setStudent(updated);
    setForm(null);
    setEditing(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleCertSave = async (data) => {
    setSavingCert(true);
    try {
      const formData = new FormData();
      Object.entries(data).forEach(([key, val]) => {
        if (key === "file") {
          if (val) formData.append("file", val);
        } else if (key === "skills") {
          formData.append("skills", JSON.stringify(val));
        } else {
          formData.append(key, val ?? "");
        }
      });

      const updated = await api.post("/students/me/certifications", formData);
      setCertifications(updated);
      if (data.skills?.length > 0) {
        const currentSkills = student.skills || [];
        const newSkills = data.skills.filter(
          (s) => s && !currentSkills.includes(s),
        );
        if (newSkills.length > 0) {
          const mergedSkills = [...currentSkills, ...newSkills];
          const updatedStudent = await api.put("/students/me", {
            skills: mergedSkills,
          });
          setStudent(updatedStudent);
        }
      }
      setSavingCert(false);
      return true;
    } catch (err) {
      setSavingCert(false);
      return false;
    }
  };

  const handleCancel = () => {
    setForm(null);
    setEditing(false);
  };

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleResumeUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert("File size must be less than 5MB");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("source", "manual");

    setUploadingResume(true);
    try {
      const data = await api.post("/students/me/resume", formData);
      if (data?.resumeUrl) {
        setStudent({ ...student, resume: data.resumeUrl });
        if (form) setForm({ ...form, resume: data.resumeUrl });
        alert("Resume uploaded successfully!");
      } else {
        alert("Resume upload failed");
      }
    } catch (err) {
      console.error("Resume upload error:", err);
      alert("Resume upload failed");
    } finally {
      setUploadingResume(false);
      // Allow re-selecting the same file later.
      e.target.value = "";
    }
  };

  const addSkill = () => {
    const s = newSkill.trim();
    if (s && !form.skills.includes(s)) {
      setForm({ ...form, skills: [...form.skills, s] });
      setNewSkill("");
    }
  };

  const removeSkill = (skill) =>
    setForm({ ...form, skills: form.skills.filter((s) => s !== skill) });

  const displayData = editing ? form : student;
  if (loading)
    return <div className="text-center py-20 text-text-muted">Loading...</div>;
  if (!student)
    return (
      <div className="text-center py-20 text-text-muted">Profile not found</div>
    );
  const skills = displayData?.skills || [];
  const cgpaPercent = Math.min(
    (parseFloat(student.cgpa) / 10) * 100,
    100,
  ).toFixed(0);
  const fieldProps = { editing, form: form || student, onChange: handleChange };

  return (
    <div
      className="max-w-4xl mx-auto px-4 md:px-0"
      style={{ fontFamily: "Inter, sans-serif" }}
    >
      {/* Hero Card */}
      <div
        className="relative rounded-2xl sm:rounded-3xl overflow-hidden mb-5 sm:mb-6 border border-white/10"
        style={{
          background:
            "linear-gradient(135deg, #0d1b5e 0%, #1a2d8a 25%, #3d1a6e 55%, #6b1040 80%, #7a0f35 100%)",
        }}
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `radial-gradient(circle at 20% 50%, rgba(59,130,246,0.2) 0%, transparent 50%),
                         radial-gradient(circle at 80% 20%, rgba(34,197,94,0.1) 0%, transparent 40%)`,
          }}
        />

        <div className="relative z-10 p-5 sm:p-8 flex flex-wrap items-start sm:items-center gap-4 sm:gap-6">
          <div className="flex flex-col items-start">
            <div
              className="relative w-20 h-20 rounded-full shrink-0 group"
              style={{
                background: "linear-gradient(135deg, white, #f59e0b)",
                padding: "3px",
              }}
            >
              {student.profilePhoto && student.profilePhoto !== "" ? (
                <img
                  src={student.profilePhoto}
                  alt={student.name}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <div
                  className="w-full h-full rounded-full bg-[#1a3a8f] flex items-center justify-center text-2xl font-bold text-white cursor-pointer relative"
                  style={{ fontFamily: "Space Grotesk, sans-serif" }}
                  onClick={() => photoInputRef.current.click()}
                >
                  {student.name?.charAt(0)}
                  <div className="absolute bottom-0 right-0 w-5 h-5 bg-white rounded-full flex items-center justify-center shadow">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="10"
                      height="10"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#1a3a8f"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                  </div>
                </div>
              )}
              <div
                className={`absolute inset-0 rounded-full bg-black/40 flex items-center justify-center transition-opacity cursor-pointer ${uploadingPhoto ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}
                onClick={() => photoInputRef.current.click()}
              >
                <span className="text-white text-[10px] font-semibold">
                  {uploadingPhoto ? "Uploading..." : "Edit"}
                </span>
              </div>
              <input
                type="file"
                accept="image/*"
                ref={photoInputRef}
                onChange={handlePhotoUpload}
                className="hidden"
              />
            </div>
            {student.profilePhoto && !uploadingPhoto && (
              <div className="flex items-center gap-2 mt-1.5">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    photoInputRef.current.click();
                  }}
                  className="text-[10px] text-white/70 hover:text-white font-medium transition-colors cursor-pointer"
                >
                  Change
                </button>
                <span className="text-white/30 text-[10px]">·</span>
                <button
                  type="button"
                  onPointerDown={async (e) => {
                    e.stopPropagation();
                    setRemovingPhoto(true);
                    try {
                      await api.put("/students/me", { profilePhoto: null });
                      setStudent((prev) => {
                        const updated = { ...prev, profilePhoto: null };
                        localStorage.setItem(
                          "student",
                          JSON.stringify(updated),
                        );
                        return updated;
                      });
                    } catch (err) {
                      console.error("Remove failed:", err);
                    } finally {
                      setRemovingPhoto(false);
                    }
                  }}
                  className="text-[10px] text-red-300 hover:text-red-400 font-medium transition-colors cursor-pointer"
                >
                  {removingPhoto ? "Removing..." : "Remove"}
                </button>
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <h1
              className="text-xl sm:text-2xl font-bold text-white mb-1 truncate"
              style={{ fontFamily: "Space Grotesk, sans-serif" }}
            >
              {displayData?.name}
            </h1>
            <p className="text-sm text-white/60 mb-3">
              {displayData?.branch} · {displayData?.year}
            </p>
            <div className="flex flex-wrap gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-white/20 text-white border border-white/30">
                ERP ID: {student.userId?.erpId}
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-white/20 text-white border border-white/30">
                CGPA {student.cgpa}
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-white/20 text-white border border-white/30">
                {student.city}, {student.state}
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-2 w-full sm:w-auto shrink-0">
            {editing ? (
              <>
                <button
                  onClick={handleSave}
                  className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-[#22C55E] hover:bg-green-600 text-white text-sm font-semibold transition-colors"
                >
                  <Check size={14} /> Save Changes
                </button>
                <button
                  onClick={handleCancel}
                  className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white/80 text-sm font-medium transition-colors border border-white/10"
                >
                  <X size={14} /> Cancel
                </button>
              </>
            ) : (
              <button
                onClick={handleEdit}
                className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-white text-[#1a3a8f] hover:bg-white/90 text-sm font-semibold transition-colors shadow-md"
              >
                <Edit3 size={14} /> Edit Profile
              </button>
            )}
            {saved && (
              <span className="flex items-center justify-center gap-1 text-xs font-semibold text-green-400">
                <Check size={12} /> Saved
              </span>
            )}
          </div>
        </div>
        <svg
          className="absolute bottom-0 right-0 pointer-events-none"
          style={{ width: "260px", height: "130px" }}
          viewBox="0 0 260 130"
          fill="none"
        >
          <path
            d="M260 130 Q180 60 80 100 Q20 120 0 130"
            stroke="url(#redOrangeGrad3)"
            strokeWidth="3.5"
            fill="none"
            strokeLinecap="round"
          />
          <path
            d="M260 110 Q190 50 100 85 Q40 105 10 115"
            stroke="url(#redOrangeGrad3)"
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
            opacity="0.5"
          />
          <defs>
            <linearGradient
              id="redOrangeGrad3"
              x1="0"
              y1="0"
              x2="260"
              y2="0"
              gradientUnits="userSpaceOnUse"
            >
              <stop offset="0%" stopColor="#ff4e00" stopOpacity="0" />
              <stop offset="50%" stopColor="#ff4e00" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#ff9d00" stopOpacity="1" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-5 sm:mb-6">
        {[
          {
            label: "CGPA Score",
            value: student.cgpa,
            color: "border-t-primary",
            bg: "bg-[#eef1fb]",
            icon: Target,
            iconColor: "text-primary",
          },
          {
            label: "Skills Listed",
            value: skills.length,
            color: "border-t-[#22C55E]",
            bg: "bg-green-50",
            icon: Zap,
            iconColor: "text-[#22C55E]",
          },
          {
            label: "Current Year",
            value: student.batch
              ? `Year ${getCurrentYear(student.batch, student.course)}`
              : "—",
            color: "border-t-[#F59E0B]",
            bg: "bg-amber-50",
            icon: CalendarDays,
            iconColor: "text-[#F59E0B]",
          },
          {
            label: "Performance",
            value: cgpaPercent + "%",
            color: "border-t-[#EF4444]",
            bg: "bg-red-50",
            icon: TrendingUp,
            iconColor: "text-[#EF4444]",
          },
        ].map((stat) => {
          const StatIcon = stat.icon;
          return (
            <div
              key={stat.label}
              className={`bg-white rounded-2xl border border-[#E2E8F0] border-t-2 ${stat.color} p-3 sm:p-4 shadow-sm hover:shadow-md transition-shadow`}
            >
              <div
                className={`w-8 h-8 rounded-lg ${stat.bg} flex items-center justify-center mb-3`}
              >
                <StatIcon size={16} className={stat.iconColor} />
              </div>
              <p
                className="text-lg sm:text-xl font-bold text-[#1E293B]"
                style={{ fontFamily: "Space Grotesk, sans-serif" }}
              >
                {stat.value}
              </p>
              <p className="text-[10px] sm:text-xs uppercase tracking-wide sm:tracking-widest text-[#64748B] mt-1">
                {stat.label}
              </p>
            </div>
          );
        })}
      </div>

      {/* Personal + Academic */}
      <div className="grid md:grid-cols-2 gap-4 sm:gap-5 mb-5">
        <SectionCard
          icon={User}
          title="Personal Information"
          iconBg="bg-[#eef1fb] text-primary"
          borderColor="border-l-primary"
        >
          <Field
            label="ERP ID"
            name="erpId"
            value={student.userId?.erpId || "—"}
            editing={false}
            form={student}
            onChange={() => {}}
          />
          <Field
            label="Full Name"
            name="name"
            value={student.name}
            {...fieldProps}
            editing={false}
          />
          <Field
            label="Email"
            name="email"
            value={student.email}
            {...fieldProps}
          />
          <Field
            label="Phone"
            name="phone"
            value={student.phone}
            {...fieldProps}
          />
          <Field
            label="Date of Birth"
            name="dob"
            value={student.dob}
            type="date"
            {...fieldProps}
            editing={false}
          />
          <Field
            label="Gender"
            name="gender"
            value={student.gender}
            {...fieldProps}
            editing={false}
          />
          <Field
            label="City"
            name="city"
            value={student.city}
            {...fieldProps}
          />
          <Field
            label="State"
            name="state"
            value={student.state}
            {...fieldProps}
          />
        </SectionCard>

        <SectionCard
          icon={GraduationCap}
          title="Academic Information"
          iconBg="bg-[#eef1fb] text-primary"
          borderColor="border-l-[#22C55E]"
        >
          <Field
            label="College"
            name="college"
            value={student.college || "Dev Bhoomi Uttarakhand University"}
            {...fieldProps}
            editing={false}
          />
          <Field
            label="Branch"
            name="branch"
            value={student.branch}
            {...fieldProps}
            editing={false}
          />
          <Field
            label="Year"
            name="year"
            value={
              student.batch
                ? `Year ${getCurrentYear(student.batch, student.course)}`
                : "—"
            }
            {...fieldProps}
          />
          <Field
            label="Current Semester"
            name="semester"
            value={
              student.batch
                ? `Semester ${getSemester(student.batch, student.course) || "—"}`
                : "—"
            }
            {...fieldProps}
            editing={false}
          />
          <Field
            label="CGPA"
            name="cgpa"
            value={student.cgpa}
            {...fieldProps}
            editing={false}
          />
          <Field
            label="10th Marks (%)"
            name="tenthMarks"
            value={student.tenthMarks}
            {...fieldProps}
            editing={false}
          />
          <Field
            label="12th Marks (%)"
            name="twelfthMarks"
            value={student.twelfthMarks}
            {...fieldProps}
            editing={false}
          />
          <Field
            label={
              <>
                Active Backlogs <span className="text-red-500">*</span>
              </>
            }
            name="backlogs"
            value={form?.backlogs ?? student.backlogs ?? 0}
            {...fieldProps}
            type="number"
          />

          {!editing && (
            <div className="mt-4">
              <p className="text-xs font-semibold uppercase tracking-widest text-[#64748B] mb-2">
                Academic Performance
              </p>
              <div className="w-full bg-[#E2E8F0] rounded-full h-1.5 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-1000"
                  style={{
                    width: `${cgpaPercent}%`,
                    background: "linear-gradient(90deg, #1a3a8f, #22C55E)",
                  }}
                />
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-xs text-[#64748B]">0.0</span>
                <span className="text-xs text-[#64748B]">10.0</span>
              </div>
            </div>
          )}
        </SectionCard>
      </div>

      {/* About Section */}
      <div className="mt-5 mb-5">
        <SectionCard
          icon={User}
          title="About & Links"
          iconBg="bg-[#eef1fb] text-primary"
          borderColor="border-l-primary"
        >
          <div className="mb-4">
            <span className="text-xs font-semibold uppercase tracking-widest text-[#64748B] block mb-1.5">
              About
            </span>
            {editing ? (
              <textarea
                name="about"
                value={form?.about || ""}
                onChange={handleChange}
                rows={4}
                placeholder="Write a short bio about yourself..."
                className="w-full px-3 py-2 rounded-xl border border-[#CBD5E1] text-sm text-[#1E293B] bg-[#F8FAFC] focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition resize-none"
              />
            ) : (
              <p className="text-sm text-[#1E293B]">{student?.about || "—"}</p>
            )}
          </div>

          <div>
            <span className="text-xs font-semibold uppercase tracking-widest text-[#64748B] block mb-1.5">
              LinkedIn URL
            </span>
            {editing ? (
              <input
                name="linkedinUrl"
                value={form?.linkedinUrl || ""}
                onChange={handleChange}
                placeholder="https://linkedin.com/in/yourprofile"
                className="w-full px-3 py-2 rounded-xl border border-[#CBD5E1] text-sm text-[#1E293B] bg-[#F8FAFC] focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition"
              />
            ) : student?.linkedinUrl ? (
              <a
                href={
                  student.linkedinUrl?.startsWith("http")
                    ? student.linkedinUrl
                    : `https://${student.linkedinUrl}`
                }
                target="_blank"
                rel="noreferrer"
                className="text-sm font-medium text-primary hover:underline"
              >
                View LinkedIn Profile
              </a>
            ) : (
              <span className="text-sm font-medium text-[#1E293B]">—</span>
            )}
          </div>
          <div>
            <span className="text-xs font-semibold uppercase tracking-widest text-[#64748B] block mb-1.5">
              GitHub URL
            </span>
            {editing ? (
              <input
                name="githubUrl"
                value={form?.githubUrl || ""}
                onChange={handleChange}
                placeholder="https://github.com/username"
                className="w-full px-3 py-2 rounded-xl border border-[#CBD5E1] text-sm text-[#1E293B] bg-[#F8FAFC] focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition"
              />
            ) : student?.githubUrl ? (
              <a
                href={
                  student.githubUrl?.startsWith("http")
                    ? student.githubUrl
                    : `https://${student.githubUrl}`
                }
                target="_blank"
                rel="noreferrer"
                className="text-sm font-medium text-primary hover:underline"
              >
                View GitHub Profile
              </a>
            ) : (
              <span className="text-sm font-medium text-[#1E293B]">—</span>
            )}
          </div>

          <div>
            <span className="text-xs font-semibold uppercase tracking-widest text-[#64748B] block mb-1.5">
              Coding Profile URL
            </span>
            <p className="text-xs text-[#94A3B8] mb-1.5">
              LeetCode, CodeChef, Codeforces, etc.
            </p>
            {editing ? (
              <input
                name="codingProfileUrl"
                value={form?.codingProfileUrl || ""}
                onChange={handleChange}
                placeholder="https://leetcode.com/username"
                className="w-full px-3 py-2 rounded-xl border border-[#CBD5E1] text-sm text-[#1E293B] bg-[#F8FAFC] focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition"
              />
            ) : student?.codingProfileUrl ? (
              <a
                href={
                  student.codingProfileUrl?.startsWith("http")
                    ? student.codingProfileUrl
                    : `https://${student.codingProfileUrl}`
                }
                target="_blank"
                rel="noreferrer"
                className="text-sm font-medium text-primary hover:underline"
              >
                View Coding Profile
              </a>
            ) : (
              <span className="text-sm font-medium text-[#1E293B]">—</span>
            )}
          </div>
          <div>
            <span className="text-xs mt-6 font-semibold uppercase tracking-widest text-[#64748B] block mb-1.5">
              Parent / Guardian Email
            </span>
            {editing ? (
              <input
                name="parentEmail"
                value={form?.parentEmail || ""}
                onChange={handleChange}
                placeholder="Parent's email address"
                className="w-full px-3 py-2 rounded-xl border border-[#CBD5E1] text-sm text-[#1E293B] bg-[#F8FAFC] focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition"
              />
            ) : (
              <span className="text-sm font-medium text-[#1E293B]">
                {student?.parentEmail || "—"}
              </span>
            )}
          </div>
          <div>
            <span className="text-xs font-semibold uppercase tracking-widest text-[#64748B] block mb-1.5">
              Parent / Guardian Phone
            </span>
            {editing ? (
              <input
                name="parentPhone"
                value={form?.parentPhone || ""}
                onChange={handleChange}
                placeholder="Parent's phone number"
                className="w-full px-3 py-2 rounded-xl border border-[#CBD5E1] text-sm text-[#1E293B] bg-[#F8FAFC] focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition"
              />
            ) : (
              <span className="text-sm font-medium text-[#1E293B]">
                {student?.parentPhone || "—"}
              </span>
            )}
          </div>
          <div>
            <span className="text-xs font-semibold uppercase tracking-widest text-[#64748B] block mb-1.5">
              Parent / Guardian Name
            </span>
            {editing ? (
              <input
                name="parentName"
                value={form?.parentName || ""}
                onChange={handleChange}
                placeholder="Parent's Name"
                className="w-full px-3 py-2 rounded-xl border border-[#CBD5E1] text-sm text-[#1E293B] bg-[#F8FAFC] focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition"
              />
            ) : (
              <span className="text-sm font-medium text-[#1E293B]">
                {student?.parentName || "—"}
              </span>
            )}
          </div>
        </SectionCard>
      </div>

      {/* Skills */}
      <SectionCard
        icon={Zap}
        title="Skills & Technologies"
        iconBg="bg-green-50 text-[#22C55E]"
        borderColor="border-l-[#22C55E]"
      >
        <div className="flex flex-wrap gap-2">
          {skills.map((skill) => (
            <span
              key={skill}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-[#eef1fb] text-primary border border-blue-200"
            >
              {skill}
              {editing && (
                <button
                  onClick={() => removeSkill(skill)}
                  className="text-[#94A3B8] hover:text-[#EF4444] transition-colors"
                >
                  <X size={12} />
                </button>
              )}
            </span>
          ))}
          {skills.length === 0 && (
            <span className="text-sm text-[#64748B] italic">
              No skills added yet
            </span>
          )}
        </div>
        {editing && (
          <div className="flex flex-col sm:flex-row gap-2 mt-4">
            <input
              type="text"
              value={newSkill}
              onChange={(e) => setNewSkill(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addSkill()}
              placeholder="Type a skill and press Enter"
              className="flex-1 px-3 py-2 rounded-xl border border-[#CBD5E1] text-sm text-[#1E293B] focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition"
            />
            <button
              onClick={addSkill}
              className="flex items-center justify-center gap-1 px-4 py-2 rounded-xl bg-primary text-white text-sm font-medium hover:bg-blue-600 transition-colors"
            >
              <Plus size={14} /> Add
            </button>
          </div>
        )}

        {/* Certifications */}
        <div className="mt-5 pt-4 border-t border-[#E2E8F0]">
          <p className="text-xs font-semibold uppercase tracking-widest text-[#64748B] mb-3">
            Licenses & Certifications
          </p>
          {certifications.length === 0 ? (
            <p className="text-sm text-[#64748B] italic">
              No certifications added yet.
            </p>
          ) : (
            <div className="flex flex-col gap-3 mb-3">
              {certifications.map((cert, i) => (
                <div
                  key={i}
                  className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]"
                >
                  <p className="text-sm font-semibold text-[#1E293B]">
                    {cert.name}
                  </p>
                  <p className="text-xs text-[#64748B]">
                    {cert.issuingOrganization}
                  </p>
                  {cert.credentialUrl && (
                    <a
                      href={cert.credentialUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-primary hover:underline mt-1 inline-block"
                    >
                      View Certificate →
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
          <button
            onClick={() => setShowCertModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#eef1fb] text-primary text-sm font-semibold hover:bg-blue-100 transition-colors"
          >
            <Plus size={14} /> Add Certification
          </button>
        </div>
      </SectionCard>

      {/* Resume */}
      <div className="mt-5">
        <SectionCard
          icon={FileText}
          title="Resume / CV"
          iconBg="bg-amber-50 text-[#F59E0B]"
          borderColor="border-l-[#F59E0B]"
        >
          {displayData?.resume ? (
            <div className="flex flex-col gap-3">
              <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
                <div className="w-10 h-10 rounded-xl bg-[#eef1fb] border border-blue-100 flex items-center justify-center shrink-0">
                  <FileText size={18} className="text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[#1E293B] truncate">
                    Resume Uploaded
                  </p>
                  {displayData.resume &&
                  displayData.resume !== "dbuu-generated" ? (
                    <a
                      href={displayData.resume}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-primary hover:underline"
                    >
                      View Resume
                    </a>
                  ) : (
                    <span className="text-xs text-[#94A3B8]">
                      DBUU Template
                    </span>
                  )}
                  {student.resumeData?.template === "dbuu" && (
                    <button
                      onClick={async () => {
                        try {
                          const { generateDbuuPdf } =
                            await import("../../utils/generateDbuuPdf");
                          await generateDbuuPdf(student.resumeData);
                        } catch (err) {
                          console.error("PDF download failed:", err);
                          alert("Cannot download PDF, please try again.");
                        }
                      }}
                      className="text-xs text-[#22C55E] hover:underline font-semibold mt-0.5 block"
                    >
                      ↓ Download DBUU PDF
                    </button>
                  )}
                </div>
                <div className="ml-auto flex items-center gap-2 shrink-0">
                  {student.resumeData && (
                    <button
                      onClick={() => setShowResumeBuilder(true)}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#eef1fb] text-primary border border-blue-200 hover:bg-blue-100 transition-colors flex items-center gap-1"
                    >
                      <Sparkles size={12} /> Edit
                    </button>
                  )}
                  <button
                    onClick={() => resumeInputRef.current.click()}
                    disabled={uploadingResume}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium bg-background text-[#64748B] border border-[#E2E8F0] hover:bg-[#E2E8F0] transition-colors disabled:opacity-50"
                  >
                    {uploadingResume ? "Uploading..." : "Replace"}
                  </button>
                </div>
              </div>

              {/* Remove + Build option */}
              <div className="flex flex-wrap items-center gap-2 px-1">
                <span className="text-xs text-[#94A3B8]">
                  Want to start fresh?
                </span>
                <button
                  onClick={() => setShowRemoveConfirm(true)}
                  className="text-xs text-red-400 hover:text-red-500 font-semibold underline underline-offset-2 transition-colors"
                >
                  Remove Resume
                </button>
                <span className="text-[#E2E8F0] text-xs">|</span>
                <button
                  onClick={() =>
                    student.resumeData
                      ? setShowResumeBuilder(true)
                      : setShowBuildConfirm(true)
                  }
                  className="flex items-center gap-1 text-xs text-primary font-semibold hover:underline underline-offset-2 transition-colors"
                >
                  <Sparkles size={11} /> Build with PlaceRise
                </button>
              </div>
              {showRemoveConfirm && (
                <div className="flex flex-col gap-3 p-4 rounded-xl border border-red-100 bg-red-50">
                  <div className="flex items-start gap-2">
                    <div className="w-7 h-7 rounded-lg bg-red-100 flex items-center justify-center shrink-0 mt-0.5">
                      <FileText size={13} className="text-red-500" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[#1E293B]">
                        Remove Resume?
                      </p>
                      <p className="text-xs text-[#64748B] mt-0.5">
                        Your uploaded resume will be permanently removed. You
                        can upload a new one or build one with PlaceRise
                        anytime.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 justify-end">
                    <button
                      onClick={() => setShowRemoveConfirm(false)}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold text-[#64748B] bg-white border border-[#E2E8F0] hover:bg-[#F8FAFC] transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={async () => {
                        await api.put("/students/me", {
                          resume: null,
                          resumeData: null,
                        });
                        setStudent((prev) => ({
                          ...prev,
                          resume: null,
                          resumeData: null,
                        }));
                        setShowRemoveConfirm(false);
                      }}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-red-500 hover:bg-red-600 transition-colors"
                    >
                      Yes, Remove
                    </button>
                  </div>
                </div>
              )}
              {showBuildConfirm && (
                <div className="flex flex-col gap-3 p-4 rounded-xl border border-blue-100 bg-blue-50">
                  <div className="flex items-start gap-2">
                    <div className="w-7 h-7 rounded-lg bg-blue-100 flex items-center justify-center shrink-0 mt-0.5">
                      <Sparkles size={13} className="text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[#1E293B]">
                        Replace with PlaceRise Resume?
                      </p>
                      <p className="text-xs text-[#64748B] mt-0.5">
                        Your current resume will be replaced with a new one
                        built by PlaceRise. This cannot be undone.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 justify-end">
                    <button
                      onClick={() => setShowBuildConfirm(false)}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold text-[#64748B] bg-white border border-[#E2E8F0] hover:bg-[#F8FAFC] transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => {
                        setShowBuildConfirm(false);
                        setShowResumeBuilder(true);
                      }}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-primary hover:bg-blue-700 transition-colors flex items-center gap-1.5"
                    >
                      <Sparkles size={12} /> Yes, Build New
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-8 rounded-2xl border-2 border-dashed border-[#CBD5E1]">
              <FileText size={28} className="text-[#94A3B8]" />
              <p className="text-sm font-medium text-[#1E293B] mt-2">
                No resume uploaded yet
              </p>
              <p className="text-xs text-[#64748B] mt-1 mb-4">
                Have a resume ready, or want us to build one for you?
              </p>
              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                <button
                  onClick={() => resumeInputRef.current.click()}
                  disabled={uploadingResume}
                  className="px-4 py-2 rounded-xl bg-[#1a3a8f] text-white text-sm font-semibold hover:bg-[#152d73] transition-colors disabled:opacity-50"
                >
                  {uploadingResume ? "Uploading..." : "Upload My Resume"}
                </button>
                <button
                  onClick={() => setShowResumeBuilder(true)}
                  className="px-4 py-2 rounded-xl bg-white text-[#1a3a8f] border border-[#1a3a8f] text-sm font-semibold hover:bg-[#eef1fb] transition-colors flex items-center justify-center gap-1.5"
                >
                  <Sparkles size={14} /> Build My Resume
                </button>
              </div>
            </div>
          )}
          <input
            type="file"
            accept=".pdf"
            ref={resumeInputRef}
            onChange={handleResumeUpload}
            className="hidden"
          />
        </SectionCard>
      </div>

      {/* Placement Status */}
      {!editing && (
        <div className="mt-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-4 sm:px-5 py-3 rounded-2xl border border-[#E2E8F0] bg-white shadow-sm">
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{
                backgroundColor:
                  student.placementStatus === "Placed" ? "#F0FDF4" : "#FFFBEB",
              }}
            >
              {student.placementStatus === "Placed" ? (
                <PartyPopper size={16} className="text-[#22C55E]" />
              ) : (
                <Target size={16} className="text-[#F59E0B]" />
              )}
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-[#64748B]">
                Placement Status
              </p>
              {student.placementStatus === "Placed" &&
              student.selectedCompanies?.length > 0 ? (
                <p className="text-sm font-bold text-[#15803D]">
                  Selected in:{" "}
                  {student.selectedCompanies
                    .map((c) => c?.companyId?.name || c?.role || "—")
                    .join(", ")}
                </p>
              ) : (
                <p className="text-sm font-bold text-[#1E293B]">
                  {student.placementStatus || "Not Placed"}
                </p>
              )}
            </div>
          </div>
          <span
            className={`self-end sm:self-auto flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold border ${
              student.placementStatus === "Placed"
                ? "bg-green-50 text-green-700 border-green-200"
                : "bg-amber-50 text-[#F59E0B] border-amber-200"
            }`}
          >
            {student.placementStatus === "Placed" ? (
              <>
                <Check size={12} /> Placed
              </>
            ) : (
              "Pending"
            )}
          </span>
        </div>
      )}

      {showResumeBuilder && (
        <ResumeBuilder
          student={student}
          onClose={() => setShowResumeBuilder(false)}
          onGenerated={(updatedStudent) => {
            setStudent(updatedStudent); // ← poora fresh object, resumeData included
            setShowResumeBuilder(false);
            alert("Resume generated and saved successfully!");
          }}
        />
      )}
      <CertificationModal
        isOpen={showCertModal}
        onClose={() => setShowCertModal(false)}
        saving={savingCert}
        onSave={handleCertSave}
      />
    </div>
  );
}
