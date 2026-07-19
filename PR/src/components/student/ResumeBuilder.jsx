import { useState } from "react";
import { X, Plus, Trash2, Check, Sparkles } from "lucide-react";

const TEMPLATES = [
  {
    id: "minimal",
    name: "Minimal",
    desc: "Clean & simple, ATS-friendly",
    accent: "#1E293B",
  },
  {
    id: "modern",
    name: "Modern",
    desc: "Bold header, color accents",
    accent: "#3B82F6",
  },
  {
    id: "classic",
    name: "Classic",
    desc: "Traditional serif style",
    accent: "#334155",
  },
];

const emptyEntry = () => ({
  id: Date.now() + Math.random(),
  title: "",
  subtitle: "",
  period: "",
  desc: "",
});

// ─── Mini visual mockup of each template — pure CSS, no image needed ───
function TemplatePreview({ id, accent }) {
  if (id === "modern") {
    return (
      <div className="w-full h-28 sm:h-32 rounded-lg overflow-hidden bg-white border border-[#E2E8F0] flex flex-col">
        <div
          style={{ backgroundColor: accent }}
          className="h-8 sm:h-9 px-3 py-1.5 flex flex-col justify-center gap-1"
        >
          <div className="h-1.5 w-16 bg-white/90 rounded-full" />
          <div className="h-1 w-10 bg-white/50 rounded-full" />
        </div>
        <div className="flex-1 p-2.5 flex flex-col gap-1.5">
          <div
            className="h-1 w-8 rounded-full"
            style={{ backgroundColor: accent }}
          />
          <div className="h-1 w-full bg-[#E2E8F0] rounded-full" />
          <div className="h-1 w-4/5 bg-[#E2E8F0] rounded-full" />
          <div
            className="h-1 w-8 mt-1 rounded-full"
            style={{ backgroundColor: accent }}
          />
          <div className="h-1 w-full bg-[#E2E8F0] rounded-full" />
          <div className="h-1 w-3/5 bg-[#E2E8F0] rounded-full" />
        </div>
      </div>
    );
  }

  if (id === "classic") {
    return (
      <div className="w-full h-28 sm:h-32 rounded-lg overflow-hidden bg-white border border-[#E2E8F0] flex flex-col items-center p-3 gap-1.5">
        <div
          className="h-1.5 w-20 rounded-full"
          style={{ backgroundColor: accent }}
        />
        <div className="h-1 w-24 bg-[#CBD5E1] rounded-full mb-1.5" />
        <div className="w-full h-px bg-[#E2E8F0]" />
        <div className="w-full flex flex-col gap-1.5 mt-1.5">
          <div
            className="h-1 w-10 rounded-full"
            style={{ backgroundColor: accent }}
          />
          <div className="h-1 w-full bg-[#E2E8F0] rounded-full" />
          <div className="h-1 w-4/5 bg-[#E2E8F0] rounded-full" />
        </div>
      </div>
    );
  }

  // minimal
  return (
    <div className="w-full h-28 sm:h-32 rounded-lg overflow-hidden bg-white border border-[#E2E8F0] p-3 flex flex-col gap-1.5">
      <div className="h-1.5 w-16 rounded-full bg-[#1E293B]" />
      <div className="h-1 w-20 bg-[#CBD5E1] rounded-full mb-1" />
      <div
        className="h-1 w-8 rounded-full"
        style={{ backgroundColor: accent }}
      />
      <div className="h-1 w-full bg-[#E2E8F0] rounded-full" />
      <div className="h-1 w-3/5 bg-[#E2E8F0] rounded-full" />
      <div
        className="h-1 w-8 mt-1 rounded-full"
        style={{ backgroundColor: accent }}
      />
      <div className="h-1 w-full bg-[#E2E8F0] rounded-full" />
    </div>
  );
}

export default function ResumeBuilder({ student, onClose, onGenerated }) {
  const existing = student?.resumeData || null;

  const [step, setStep] = useState(1); // 1: form, 2: template
  const [template, setTemplate] = useState(existing?.template || "modern");
  const [generating, setGenerating] = useState(false);

  const [form, setForm] = useState({
    name: existing?.name || student?.name || "",
    email: existing?.email || student?.email || "",
    phone: existing?.phone || student?.phone || "",
    city: existing?.city || student?.city || "",
    linkedinUrl: existing?.linkedinUrl || student?.linkedinUrl || "",
    about: existing?.about || student?.about || "",
    college:
      existing?.college ||
      student?.college ||
      "Dev Bhoomi Uttarakhand University",
    branch: existing?.branch || student?.branch || "",
    cgpa: existing?.cgpa || student?.cgpa || "",
    skills: existing?.skills || student?.skills || [],
    experience: (existing?.experience || []).map((e) => ({
      ...e,
      id: e.id || Date.now() + Math.random(),
    })),
    projects: (existing?.projects || []).map((p) => ({
      ...p,
      id: p.id || Date.now() + Math.random(),
    })),
  });

  const [newSkill, setNewSkill] = useState("");

  const update = (patch) => setForm((f) => ({ ...f, ...patch }));

  const addSkill = () => {
    const s = newSkill.trim();
    if (s && !form.skills.includes(s)) {
      update({ skills: [...form.skills, s] });
      setNewSkill("");
    }
  };
  const removeSkill = (s) =>
    update({ skills: form.skills.filter((x) => x !== s) });

  const addEntry = (field) =>
    update({ [field]: [...form[field], emptyEntry()] });
  const updateEntry = (field, id, patch) =>
    update({
      [field]: form[field].map((e) => (e.id === id ? { ...e, ...patch } : e)),
    });
  const removeEntry = (field, id) =>
    update({ [field]: form[field].filter((e) => e.id !== id) });

  const isValid = form.name.trim() && form.email.trim();

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/students/me/generate-resume`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({ ...form, template }),
        },
      );
      const data = await res.json();
      if (data.resumeUrl) {
        onGenerated(data.resumeUrl);
      } else {
        alert(data.message || "Something went wrong generating your resume.");
      }
    } catch (err) {
      console.error(err);
      alert("Failed to generate resume.");
    }
    setGenerating(false);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-3 sm:px-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] sm:max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-[#F1F5F9] sticky top-0 bg-white z-10">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
              <Sparkles size={14} className="text-[#3B82F6]" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#1E293B]">
                {step === 1
                  ? existing
                    ? "Edit Your Resume"
                    : "Build Your Resume"
                  : "Choose a Template"}
              </h2>
              <p className="text-xs text-[#94A3B8] mt-0.5">Step {step} of 2</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg bg-[#F1F5F9] flex items-center justify-center hover:bg-[#E2E8F0] transition-colors shrink-0"
          >
            <X size={14} className="text-[#64748B]" />
          </button>
        </div>

        {step === 1 && (
          <div className="p-4 sm:p-5 flex flex-col gap-5">
            {/* Personal */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-[#64748B] mb-2">
                Personal Info
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  placeholder="Full Name *"
                  value={form.name}
                  onChange={(e) => update({ name: e.target.value })}
                  className="px-3 py-2 rounded-xl border border-[#E2E8F0] text-sm bg-[#F8FAFC] focus:outline-none focus:border-[#3B82F6]"
                />
                <input
                  placeholder="Email *"
                  value={form.email}
                  onChange={(e) => update({ email: e.target.value })}
                  className="px-3 py-2 rounded-xl border border-[#E2E8F0] text-sm bg-[#F8FAFC] focus:outline-none focus:border-[#3B82F6]"
                />
                <input
                  placeholder="Phone"
                  value={form.phone}
                  onChange={(e) => update({ phone: e.target.value })}
                  className="px-3 py-2 rounded-xl border border-[#E2E8F0] text-sm bg-[#F8FAFC] focus:outline-none focus:border-[#3B82F6]"
                />
                <input
                  placeholder="City"
                  value={form.city}
                  onChange={(e) => update({ city: e.target.value })}
                  className="px-3 py-2 rounded-xl border border-[#E2E8F0] text-sm bg-[#F8FAFC] focus:outline-none focus:border-[#3B82F6]"
                />
                <input
                  placeholder="LinkedIn URL"
                  value={form.linkedinUrl}
                  onChange={(e) => update({ linkedinUrl: e.target.value })}
                  className="sm:col-span-2 px-3 py-2 rounded-xl border border-[#E2E8F0] text-sm bg-[#F8FAFC] focus:outline-none focus:border-[#3B82F6]"
                />
              </div>
              <textarea
                placeholder="Short summary about yourself..."
                value={form.about}
                onChange={(e) => update({ about: e.target.value })}
                rows={2}
                className="w-full mt-3 px-3 py-2 rounded-xl border border-[#E2E8F0] text-sm bg-[#F8FAFC] focus:outline-none focus:border-[#3B82F6] resize-none"
              />
            </div>

            {/* Education */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-[#64748B] mb-2">
                Education
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  placeholder="College"
                  value={form.college}
                  onChange={(e) => update({ college: e.target.value })}
                  className="sm:col-span-2 px-3 py-2 rounded-xl border border-[#E2E8F0] text-sm bg-[#F8FAFC] focus:outline-none focus:border-[#3B82F6]"
                />
                <input
                  placeholder="Branch / Course"
                  value={form.branch}
                  onChange={(e) => update({ branch: e.target.value })}
                  className="px-3 py-2 rounded-xl border border-[#E2E8F0] text-sm bg-[#F8FAFC] focus:outline-none focus:border-[#3B82F6]"
                />
                <input
                  placeholder="CGPA"
                  value={form.cgpa}
                  onChange={(e) => update({ cgpa: e.target.value })}
                  className="px-3 py-2 rounded-xl border border-[#E2E8F0] text-sm bg-[#F8FAFC] focus:outline-none focus:border-[#3B82F6]"
                />
              </div>
            </div>

            {/* Experience */}
            <EntryList
              label="Experience"
              entries={form.experience}
              onAdd={() => addEntry("experience")}
              onUpdate={(id, patch) => updateEntry("experience", id, patch)}
              onRemove={(id) => removeEntry("experience", id)}
              titlePlaceholder="Job Title / Company"
              subtitlePlaceholder="Company Name / Location"
            />

            {/* Projects */}
            <EntryList
              label="Projects"
              entries={form.projects}
              onAdd={() => addEntry("projects")}
              onUpdate={(id, patch) => updateEntry("projects", id, patch)}
              onRemove={(id) => removeEntry("projects", id)}
              titlePlaceholder="Project Title"
              subtitlePlaceholder="Tech Stack Used"
            />

            {/* Skills */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-[#64748B] mb-2">
                Skills
              </p>
              <div className="flex flex-wrap gap-2 mb-2">
                {form.skills.map((s) => (
                  <span
                    key={s}
                    className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-[#3B82F6] border border-blue-200"
                  >
                    {s}
                    <button onClick={() => removeSkill(s)}>
                      <X size={11} />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addSkill()}
                  placeholder="Type a skill and press Enter"
                  className="flex-1 px-3 py-2 rounded-xl border border-[#E2E8F0] text-sm bg-[#F8FAFC] focus:outline-none focus:border-[#3B82F6]"
                />
                <button
                  onClick={addSkill}
                  className="px-3 py-2 rounded-xl bg-[#3B82F6] text-white text-sm font-semibold flex items-center justify-center gap-1"
                >
                  <Plus size={14} /> Add
                </button>
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="p-4 sm:p-5">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {TEMPLATES.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTemplate(t.id)}
                  className={`text-left rounded-2xl border-2 p-3 sm:p-4 transition-all ${
                    template === t.id
                      ? "border-[#3B82F6] bg-blue-50/40"
                      : "border-[#E2E8F0] hover:border-[#93C5FD]"
                  }`}
                >
                  <div className="mb-3">
                    <TemplatePreview id={t.id} accent={t.accent} />
                  </div>
                  <p className="text-sm font-bold text-[#1E293B] flex items-center gap-1.5">
                    {t.name}
                    {template === t.id && (
                      <Check size={13} className="text-[#3B82F6] shrink-0" />
                    )}
                  </p>
                  <p className="text-xs text-[#64748B] mt-0.5">{t.desc}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between gap-3 p-4 sm:p-5 border-t border-[#F1F5F9]">
          {step === 1 ? (
            <>
              <button
                onClick={onClose}
                className="px-3 sm:px-4 py-2 rounded-xl border border-[#E2E8F0] text-sm font-medium text-[#64748B] hover:bg-[#F8FAFC]"
              >
                Cancel
              </button>
              <button
                onClick={() => isValid && setStep(2)}
                disabled={!isValid}
                className="px-3 sm:px-4 py-2 rounded-xl bg-[#3B82F6] text-white text-sm font-semibold hover:bg-[#2563EB] disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
              >
                Next: Choose Template
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setStep(1)}
                className="px-3 sm:px-4 py-2 rounded-xl border border-[#E2E8F0] text-sm font-medium text-[#64748B] hover:bg-[#F8FAFC]"
              >
                Back
              </button>
              <button
                onClick={handleGenerate}
                disabled={generating}
                className="px-3 sm:px-4 py-2 rounded-xl bg-[#22C55E] text-white text-sm font-semibold hover:bg-green-600 disabled:opacity-50 flex items-center gap-2 whitespace-nowrap"
              >
                {generating ? (
                  "Generating..."
                ) : (
                  <>
                    <Sparkles size={14} /> Generate & Save
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function EntryList({
  label,
  entries,
  onAdd,
  onUpdate,
  onRemove,
  titlePlaceholder,
  subtitlePlaceholder,
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-semibold uppercase tracking-widest text-[#64748B]">
          {label}
        </p>
        <button
          onClick={onAdd}
          className="text-xs font-semibold text-[#3B82F6] flex items-center gap-1 hover:underline"
        >
          <Plus size={12} /> Add
        </button>
      </div>
      {entries.length === 0 && (
        <p className="text-xs text-[#94A3B8] italic">None added yet</p>
      )}
      <div className="flex flex-col gap-3">
        {entries.map((e) => (
          <div
            key={e.id}
            className="border border-[#E2E8F0] rounded-xl p-3 relative"
          >
            <button
              onClick={() => onRemove(e.id)}
              className="absolute top-2 right-2 text-[#94A3B8] hover:text-red-500"
            >
              <Trash2 size={13} />
            </button>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-2 pr-6">
              <input
                placeholder={titlePlaceholder}
                value={e.title}
                onChange={(ev) => onUpdate(e.id, { title: ev.target.value })}
                className="px-2.5 py-1.5 rounded-lg border border-[#E2E8F0] text-xs bg-[#F8FAFC] focus:outline-none focus:border-[#3B82F6]"
              />
              <input
                placeholder="Period (e.g. Jun 2025 - Present)"
                value={e.period}
                onChange={(ev) => onUpdate(e.id, { period: ev.target.value })}
                className="px-2.5 py-1.5 rounded-lg border border-[#E2E8F0] text-xs bg-[#F8FAFC] focus:outline-none focus:border-[#3B82F6]"
              />
            </div>
            <input
              placeholder={subtitlePlaceholder}
              value={e.subtitle}
              onChange={(ev) => onUpdate(e.id, { subtitle: ev.target.value })}
              className="w-full mb-2 px-2.5 py-1.5 rounded-lg border border-[#E2E8F0] text-xs bg-[#F8FAFC] focus:outline-none focus:border-[#3B82F6]"
            />
            <textarea
              placeholder="Brief description..."
              value={e.desc}
              onChange={(ev) => onUpdate(e.id, { desc: ev.target.value })}
              rows={2}
              className="w-full px-2.5 py-1.5 rounded-lg border border-[#E2E8F0] text-xs bg-[#F8FAFC] focus:outline-none focus:border-[#3B82F6] resize-none"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
