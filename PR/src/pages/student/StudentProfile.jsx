import { useState, useRef } from "react";
import {
  User,
  GraduationCap,
  Zap,
  FileText,
  Edit3,
  Check,
  X,
  Plus,
} from "lucide-react";

const defaultStudent = {
  name: "Harsh Rathore",
  email: "harsh.rathore@example.com",
  phone: "+91 98765 43210",
  dob: "2002-05-15",
  gender: "Male",
  city: "Dehradun",
  state: "Uttarakhand",
  college: "Dev Bhoomi Uttarakhand University",
  branch: "Computer Science Engineering",
  year: "3rd Year",
  cgpa: "8.4",
  rollNo: "CSE2022041",
  skills: ["React", "Node.js", "Python", "Tailwind CSS", "MongoDB"],
  resume: null,
  erpId: "23BTCSE0096",
  tenthMarks: "85",
  twelfthMarks: "78",
  backlogs: "0",
  placementStatus: "Not Placed",
};

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
      className={`bg-white rounded-2xl border border-[#E2E8F0] border-l-4 ${borderColor} p-6 shadow-sm hover:shadow-md transition-shadow`}
    >
      <div className="flex items-center gap-3 mb-5 pb-4 border-b border-background">
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
  const [student, setStudent] = useState(defaultStudent);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(null);
  const [newSkill, setNewSkill] = useState("");
  const [saved, setSaved] = useState(false);
  const resumeInputRef = useRef(null);

  const handleEdit = () => {
    setForm({ ...student });
    setEditing(true);
  };

  const handleSave = () => {
    setStudent({ ...form });
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

  const handleResumeUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setForm({
      ...form,
      resume: { name: file.name, size: (file.size / 1024).toFixed(0) + " KB" },
    });
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
  const skills = displayData?.skills || [];
  const cgpaPercent = Math.min(
    (parseFloat(student.cgpa) / 10) * 100,
    100,
  ).toFixed(0);
  const fieldProps = { editing, form: form || student, onChange: handleChange };

  return (
    <div
      className="max-w-4xl mx-auto"
      style={{ fontFamily: "Inter, sans-serif" }}
    >
      {/* Hero Card */}
      <div
        className="relative rounded-3xl overflow-hidden mb-6 border border-white/10"
        style={{
          background:
            "linear-gradient(135deg, #3B82F6 0%, #60A5FA 60%, #818CF8 100%)",
        }}
      >
        {/* Background Effects */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `radial-gradient(circle at 20% 50%, rgba(59,130,246,0.2) 0%, transparent 50%),
                         radial-gradient(circle at 80% 20%, rgba(34,197,94,0.1) 0%, transparent 40%)`,
          }}
        />

        <div className="relative z-10 p-8 flex flex-wrap items-center gap-6">
          {/* Avatar */}
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center text-white text-3xl font-bold flex-shrink-0"
            style={{
              background: 'linear-gradient(135deg, white, #E0E7FF)', padding: '3px',
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

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h1
              className="text-2xl font-bold text-white mb-1"
              style={{ fontFamily: "Space Grotesk, sans-serif" }}
            >
              {displayData?.name}
            </h1>
            <p className="text-sm text-white/60 mb-3">
              {displayData?.branch} · {displayData?.year}
            </p>
            <div className="flex flex-wrap gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-white/20 text-white border border-white/30">
                Roll: {student.rollNo}
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-white/20 text-white border border-white/30">
                CGPA {student.cgpa}
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-white/20 text-white border border-white/30">
                {student.city}, {student.state}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-2 shrink-0">
            {editing ? (
              <>
                <button
                  onClick={handleSave}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#22C55E] hover:bg-green-600 text-white text-sm font-semibold transition-colors"
                >
                  <Check size={14} /> Save Changes
                </button>
                <button
                  onClick={handleCancel}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white/80 text-sm font-medium transition-colors border border-white/10"
                >
                  <X size={14} /> Cancel
                </button>
              </>
            ) : (
              <button
                onClick={handleEdit}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white text-[#3B82F6] hover:bg-white/90 text-sm font-semibold transition-colors shadow-md"
              >
                <Edit3 size={14} /> Edit Profile
              </button>
            )}
            {saved && (
              <span className="text-xs font-semibold text-green-400 text-center">
                ✓ Saved
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          {
            label: "CGPA Score",
            value: student.cgpa,
            color: "border-t-primary",
            bg: "bg-blue-50",
            icon: "🎯",
          },
          {
            label: "Skills Listed",
            value: skills.length,
            color: "border-t-[#22C55E]",
            bg: "bg-green-50",
            icon: "⚡",
          },
          {
            label: "Current Year",
            value: student.year?.split(" ")[0],
            color: "border-t-[#F59E0B]",
            bg: "bg-amber-50",
            icon: "📅",
          },
          {
            label: "Performance",
            value: cgpaPercent + "%",
            color: "border-t-[#EF4444]",
            bg: "bg-red-50",
            icon: "📊",
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className={`bg-white rounded-2xl border border-[#E2E8F0] border-t-2 ${stat.color} p-4 shadow-sm hover:shadow-md transition-shadow`}
          >
            <div
              className={`w-8 h-8 rounded-lg ${stat.bg} flex items-center justify-center text-base mb-3`}
            >
              {stat.icon}
            </div>
            <p
              className="text-xl font-bold text-[#1E293B]"
              style={{ fontFamily: "Space Grotesk, sans-serif" }}
            >
              {stat.value}
            </p>
            <p className="text-xs uppercase tracking-widest text-[#64748B] mt-1">
              {stat.label}
            </p>
          </div>
        ))}
      </div>

      {/* Personal + Academic */}
      <div className="grid md:grid-cols-2 gap-5 mb-5">
        <SectionCard
          icon={User}
          title="Personal Information"
          iconBg="bg-blue-50 text-primary"
          borderColor="border-l-primary"
        >
          <Field
            label="ERP ID"
            name="erpId"
            value={student.erpId}
            editing={false}
            form={student}
            onChange={() => {}}
          />
          <Field
            label="Full Name"
            name="name"
            value={student.name}
            {...fieldProps}
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
          />
          <Field
            label="Gender"
            name="gender"
            value={student.gender}
            {...fieldProps}
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
            value={student.college}
            {...fieldProps}
          />
          <Field
            label="Branch"
            name="branch"
            value={student.branch}
            {...fieldProps}
          />
          <Field
            label="Year"
            name="year"
            value={student.year}
            {...fieldProps}
          />
          <Field
            label="CGPA"
            name="cgpa"
            value={student.cgpa}
            {...fieldProps}
          />
          <Field
            label="10th Marks (%)"
            name="tenthMarks"
            value={student.tenthMarks}
            {...fieldProps}
          />
          <Field
            label="12th Marks (%)"
            name="twelfthMarks"
            value={student.twelfthMarks}
            {...fieldProps}
          />
          <Field
            label="Active Backlogs"
            name="backlogs"
            value={student.backlogs}
            {...fieldProps}
          />
          <Field
            label="Roll Number"
            name="rollNo"
            value={student.rollNo}
            {...fieldProps}
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
          <div className="flex gap-2 mt-4">
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
              className="flex items-center gap-1 px-4 py-2 rounded-xl bg-primary text-white text-sm font-medium hover:bg-blue-600 transition-colors"
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
            <div className="flex items-center gap-4 p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
              <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center">
                <FileText size={18} className="text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-[#1E293B] truncate">
                  {displayData.resume.name}
                </p>
                <p className="text-xs text-[#64748B]">
                  Uploaded · {displayData.resume.size}
                </p>
              </div>
              {editing && (
                <button
                  onClick={() => resumeInputRef.current.click()}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium bg-background text-[#64748B] border border-[#E2E8F0] hover:bg-[#E2E8F0] transition-colors"
                >
                  Replace
                </button>
              )}
            </div>
          ) : (
            <div
              onClick={() => editing && resumeInputRef.current.click()}
              className={`flex flex-col items-center justify-center p-8 rounded-2xl border-2 border-dashed transition-all
                ${editing ? "border-primary bg-blue-50/50 cursor-pointer hover:bg-blue-50" : "border-[#CBD5E1]"}`}
            >
              <FileText
                size={28}
                className={editing ? "text-primary" : "text-[#94A3B8]"}
              />
              <p className="text-sm font-medium text-[#1E293B] mt-2">
                {editing ? "Click to upload resume" : "No resume uploaded yet"}
              </p>
              <p className="text-xs text-[#64748B] mt-1">PDF only · Max 5MB</p>
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
        <div className="mt-5 flex items-center justify-between px-5 py-3 rounded-2xl border border-[#E2E8F0] bg-white shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
              <span className="text-sm">🎯</span>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-[#64748B]">
                Placement Status
              </p>
              <p className="text-sm font-bold text-[#1E293B]">
                {student.placementStatus}
              </p>
            </div>
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-[#F59E0B] border border-amber-200">
            Pending
          </span>
        </div>
      )}
    </div>
  );
}
