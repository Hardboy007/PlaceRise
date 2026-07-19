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
  icon: Icon,
  title,
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
          <Icon size={16} />
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
  const [student, setStudent] = useState(null);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(null);
  const [newSkill, setNewSkill] = useState("");
  const [saved, setSaved] = useState(false);
  const resumeInputRef = useRef(null);
  const [showResumeBuilder, setShowResumeBuilder] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      const storedStudent = JSON.parse(localStorage.getItem("student") || "{}");
      const data = await api.get("/students/me");
      setStudent(data);
      setLoading(false);
    };
    fetchProfile();
  }, []);

  const handleEdit = () => {
    setForm({
      ...student,
      about: student.about || "",
      linkedinUrl: student.linkedinUrl || "",
    });
    setEditing(true);
  };

  const handleSave = async () => {
    const updated = await api.put("/students/me", form);
    setStudent(updated);
    setForm(null);
    setEditing(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
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

    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/students/me/resume`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: formData,
        },
      );
      const data = await res.json();
      if (data.resumeUrl) {
        setStudent({ ...student, resume: data.resumeUrl });
        setForm({ ...form, resume: data.resumeUrl });
        alert("Resume uploaded successfully!");
      }
    } catch (err) {
      alert("Resume upload failed");
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
            "linear-gradient(135deg, #3B82F6 0%, #60A5FA 60%, #818CF8 100%)",
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
          <div
            className="w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center text-white text-3xl font-bold flex-shrink-0"
            style={{
              background: "linear-gradient(135deg, white, #E0E7FF)",
              padding: "3px",
            }}
          >
            <div
              className="w-full h-full rounded-full bg-[#3B82F6] flex items-center justify-center text-2xl font-bold text-white"
              style={{ fontFamily: "Space Grotesk, sans-serif" }}
            >
              {student.name?.charAt(0)}
            </div>
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
                className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-white text-[#3B82F6] hover:bg-white/90 text-sm font-semibold transition-colors shadow-md"
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
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-5 sm:mb-6">
        {[
          {
            label: "CGPA Score",
            value: student.cgpa,
            color: "border-t-primary",
            bg: "bg-blue-50",
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
          iconBg="bg-blue-50 text-primary"
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
          iconBg="bg-blue-50 text-primary"
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
            label="Active Backlogs"
            name="backlogs"
            value={student.backlogs ?? 0}
            {...fieldProps}
            editing={false}
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
                    background: "linear-gradient(90deg, #3B82F6, #22C55E)",
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
          iconBg="bg-blue-50 text-primary"
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
                href={student.linkedinUrl}
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
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-blue-50 text-primary border border-blue-200"
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
            <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
              <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
                <FileText size={18} className="text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-[#1E293B] truncate">
                  Resume Uploaded
                </p>
                <a
                  href={displayData.resume}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-primary hover:underline"
                >
                  View Resume
                </a>
              </div>
              <div className="ml-auto flex items-center gap-2 shrink-0">
                {student.resumeData && (
                  <button
                    onClick={() => setShowResumeBuilder(true)}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-50 text-primary border border-blue-200 hover:bg-blue-100 transition-colors flex items-center gap-1"
                  >
                    <Sparkles size={12} /> Edit
                  </button>
                )}
                {editing && (
                  <button
                    onClick={() => resumeInputRef.current.click()}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium bg-background text-[#64748B] border border-[#E2E8F0] hover:bg-[#E2E8F0] transition-colors"
                  >
                    Replace
                  </button>
                )}
              </div>
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
                  className="px-4 py-2 rounded-xl bg-[#3B82F6] text-white text-sm font-semibold hover:bg-[#2563EB] transition-colors"
                >
                  Upload My Resume
                </button>
                <button
                  onClick={() => setShowResumeBuilder(true)}
                  className="px-4 py-2 rounded-xl bg-white text-[#3B82F6] border border-[#3B82F6] text-sm font-semibold hover:bg-blue-50 transition-colors flex items-center justify-center gap-1.5"
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
    </div>
  );
}
