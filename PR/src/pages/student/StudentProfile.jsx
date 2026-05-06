import { useState, useRef } from "react";

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
  photo: null,
  resume: null,
};

function loadStudent() {
  try {
    const saved = localStorage.getItem("studentProfile");
    return saved ? JSON.parse(saved) : defaultStudent;
  } catch {
    return defaultStudent;
  }
}

function saveStudent(data) {
  try {
    localStorage.setItem("studentProfile", JSON.stringify(data));
  } catch {
    console.error("Save failed");
  }
}

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,300&display=swap');

  * { box-sizing: border-box; margin: 0; padding: 0; }

  /* ── Theme Variables ── */
  :root {
    --color-primary:    #1E293B;
    --color-accent:     #3B82F6;
    --color-background: #F1F5F9;
    --color-text-main:  #0F172A;
    --color-text-muted: #64748B;
    --color-success:    #22C55E;
    --color-warning:    #F59E0B;
    --color-danger:     #EF4444;
  }

  .sp-root {
    min-height: 100vh;
    background: var(--color-background);
    font-family: 'DM Sans', sans-serif;
    color: var(--color-text-main);
    position: relative;
    overflow-x: hidden;
  }

  /* subtle accent blobs — light theme ke liye softer */
  .sp-root::before {
    content: '';
    position: fixed;
    top: -30%;
    right: -20%;
    width: 600px;
    height: 600px;
    background: radial-gradient(circle, rgba(59,130,246,0.08) 0%, transparent 70%);
    pointer-events: none;
    z-index: 0;
  }

  .sp-root::after {
    content: '';
    position: fixed;
    bottom: -20%;
    left: -15%;
    width: 500px;
    height: 500px;
    background: radial-gradient(circle, rgba(34,197,94,0.06) 0%, transparent 70%);
    pointer-events: none;
    z-index: 0;
  }

  /* ── Navbar ── */
  .sp-nav {
    position: sticky;
    top: 0;
    z-index: 100;
    background: var(--color-primary);
    border-bottom: 1px solid rgba(255,255,255,0.06);
    padding: 0 32px;
    height: 58px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    box-shadow: 0 1px 12px rgba(15,23,42,0.15);
  }

  .sp-nav-logo {
    font-family: 'Syne', sans-serif;
    font-weight: 800;
    font-size: 17px;
    color: #fff;
    letter-spacing: -0.5px;
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .sp-nav-logo-dot {
    width: 8px; height: 8px;
    background: var(--color-accent);
    border-radius: 50%;
    box-shadow: 0 0 8px rgba(59,130,246,0.8);
    animation: pulse-dot 2s ease-in-out infinite;
  }

  @keyframes pulse-dot {
    0%, 100% { box-shadow: 0 0 8px rgba(59,130,246,0.8); transform: scale(1); }
    50%       { box-shadow: 0 0 16px rgba(59,130,246,1);  transform: scale(1.3); }
  }

  .sp-nav-right {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .sp-badge-saved {
    font-size: 11px;
    font-weight: 600;
    color: var(--color-success);
    background: rgba(34,197,94,0.12);
    border: 1px solid rgba(34,197,94,0.3);
    padding: 4px 12px;
    border-radius: 999px;
    letter-spacing: 0.03em;
    animation: fadeIn 0.3s ease;
  }

  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(-4px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  .sp-nav-tag {
    font-size: 12px;
    color: rgba(255,255,255,0.45);
    letter-spacing: 0.06em;
    text-transform: uppercase;
    font-weight: 500;
  }

  .sp-content {
    max-width: 940px;
    margin: 0 auto;
    padding: 36px 20px 60px;
    position: relative;
    z-index: 1;
  }

  /* ── Hero ── */
  .sp-hero {
    position: relative;
    border-radius: 24px;
    overflow: hidden;
    margin-bottom: 24px;
    background: var(--color-primary);
    border: 1px solid rgba(255,255,255,0.05);
    box-shadow: 0 20px 50px rgba(15,23,42,0.2);
  }

  .sp-hero-bg-pattern {
    position: absolute;
    inset: 0;
    opacity: 0.5;
    background-image:
      radial-gradient(circle at 20% 50%, rgba(59,130,246,0.25) 0%, transparent 50%),
      radial-gradient(circle at 80% 20%, rgba(34,197,94,0.15) 0%, transparent 40%);
  }

  .sp-hero-grid-lines {
    position: absolute;
    inset: 0;
    opacity: 0.03;
    background-image: linear-gradient(rgba(255,255,255,1) 1px, transparent 1px),
                      linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px);
    background-size: 40px 40px;
  }

  .sp-hero-inner {
    position: relative;
    z-index: 1;
    padding: 36px 36px 32px;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 28px;
  }

  /* ── Avatar ── */
  .sp-avatar-wrap {
    position: relative;
    flex-shrink: 0;
  }

  .sp-avatar-ring {
    width: 110px;
    height: 110px;
    border-radius: 50%;
    padding: 3px;
    background: linear-gradient(135deg, var(--color-accent), var(--color-success));
    position: relative;
  }

  .sp-avatar-inner {
    width: 100%;
    height: 100%;
    border-radius: 50%;
    overflow: hidden;
    background: #1E2A3A;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: 'Syne', sans-serif;
    font-size: 40px;
    font-weight: 800;
    color: #fff;
  }

  .sp-avatar-inner img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .sp-avatar-edit-btn {
    position: absolute;
    bottom: 2px;
    right: 2px;
    width: 30px;
    height: 30px;
    border-radius: 50%;
    background: var(--color-accent);
    border: 2px solid var(--color-primary);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 13px;
    transition: transform 0.2s, background 0.2s;
    box-shadow: 0 2px 8px rgba(59,130,246,0.4);
  }

  .sp-avatar-edit-btn:hover {
    transform: scale(1.1);
    background: #2563EB;
  }

  /* ── Hero info ── */
  .sp-hero-info {
    flex: 1;
    min-width: 200px;
  }

  .sp-hero-name {
    font-family: 'Syne', sans-serif;
    font-size: 32px;
    font-weight: 800;
    color: #fff;
    letter-spacing: -1px;
    line-height: 1.1;
    margin-bottom: 8px;
  }

  .sp-hero-sub {
    font-size: 13px;
    color: rgba(255,255,255,0.5);
    margin-bottom: 4px;
    font-weight: 400;
  }

  .sp-hero-college {
    font-size: 13px;
    color: rgba(255,255,255,0.35);
  }

  .sp-hero-chips {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-top: 16px;
  }

  .sp-chip {
    font-size: 11px;
    font-weight: 600;
    padding: 4px 12px;
    border-radius: 999px;
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }

  /* chips use accent / success / warning */
  .sp-chip-indigo {
    background: rgba(59,130,246,0.18);
    color: #93C5FD;
    border: 1px solid rgba(59,130,246,0.35);
  }

  .sp-chip-green {
    background: rgba(34,197,94,0.14);
    color: #86EFAC;
    border: 1px solid rgba(34,197,94,0.3);
  }

  .sp-chip-amber {
    background: rgba(245,158,11,0.14);
    color: #FCD34D;
    border: 1px solid rgba(245,158,11,0.3);
  }

  /* ── Buttons ── */
  .sp-hero-actions {
    display: flex;
    flex-direction: column;
    gap: 10px;
    flex-shrink: 0;
  }

  .sp-btn-primary {
    background: var(--color-accent);
    color: #fff;
    font-family: 'DM Sans', sans-serif;
    font-weight: 600;
    font-size: 13px;
    padding: 10px 22px;
    border-radius: 10px;
    border: none;
    cursor: pointer;
    transition: transform 0.15s, box-shadow 0.15s, background 0.15s;
    box-shadow: 0 4px 14px rgba(59,130,246,0.35);
    letter-spacing: 0.02em;
    white-space: nowrap;
  }

  .sp-btn-primary:hover {
    background: #2563EB;
    transform: translateY(-1px);
    box-shadow: 0 8px 20px rgba(59,130,246,0.45);
  }

  .sp-btn-primary:active { transform: translateY(0); }

  .sp-btn-ghost {
    background: rgba(255,255,255,0.08);
    color: rgba(255,255,255,0.75);
    font-family: 'DM Sans', sans-serif;
    font-weight: 600;
    font-size: 13px;
    padding: 10px 22px;
    border-radius: 10px;
    border: 1px solid rgba(255,255,255,0.12);
    cursor: pointer;
    transition: background 0.15s, border-color 0.15s;
    white-space: nowrap;
  }

  .sp-btn-ghost:hover {
    background: rgba(255,255,255,0.13);
    border-color: rgba(255,255,255,0.22);
  }

  .sp-btn-save {
    background: var(--color-success);
    color: #fff;
    font-family: 'DM Sans', sans-serif;
    font-weight: 600;
    font-size: 13px;
    padding: 10px 22px;
    border-radius: 10px;
    border: none;
    cursor: pointer;
    box-shadow: 0 4px 14px rgba(34,197,94,0.35);
    transition: transform 0.15s, background 0.15s;
    white-space: nowrap;
  }

  .sp-btn-save:hover {
    background: #16A34A;
    transform: translateY(-1px);
  }

  /* ── Stats Row ── */
  .sp-stats-row {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 14px;
    margin-bottom: 24px;
  }

  .sp-stat-card {
    background: #fff;
    border: 1px solid #E2E8F0;
    border-radius: 16px;
    padding: 18px 20px;
    transition: border-color 0.2s, box-shadow 0.2s;
    position: relative;
    overflow: hidden;
    box-shadow: 0 1px 4px rgba(15,23,42,0.06);
  }

  .sp-stat-card::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 3px;
    border-radius: 3px 3px 0 0;
  }

  .sp-stat-card.indigo::before { background: linear-gradient(90deg, var(--color-accent), transparent); }
  .sp-stat-card.green::before  { background: linear-gradient(90deg, var(--color-success), transparent); }
  .sp-stat-card.amber::before  { background: linear-gradient(90deg, var(--color-warning), transparent); }
  .sp-stat-card.rose::before   { background: linear-gradient(90deg, var(--color-danger), transparent); }

  .sp-stat-card:hover {
    border-color: #CBD5E1;
    box-shadow: 0 4px 16px rgba(15,23,42,0.1);
  }

  .sp-stat-icon { font-size: 20px; margin-bottom: 10px; }

  .sp-stat-value {
    font-family: 'Syne', sans-serif;
    font-size: 22px;
    font-weight: 700;
    color: var(--color-text-main);
    line-height: 1;
    margin-bottom: 4px;
  }

  .sp-stat-label {
    font-size: 11px;
    color: var(--color-text-muted);
    text-transform: uppercase;
    letter-spacing: 0.07em;
    font-weight: 500;
  }

  /* ── Sections ── */
  .sp-grid-2col {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
    margin-bottom: 20px;
  }

  .sp-section {
    background: #fff;
    border: 1px solid #E2E8F0;
    border-radius: 20px;
    padding: 26px;
    transition: border-color 0.2s, box-shadow 0.2s;
    box-shadow: 0 1px 4px rgba(15,23,42,0.05);
  }

  .sp-section:hover {
    border-color: #CBD5E1;
    box-shadow: 0 4px 16px rgba(15,23,42,0.08);
  }

  .sp-section-full {
    background: #fff;
    border: 1px solid #E2E8F0;
    border-radius: 20px;
    padding: 26px;
    margin-bottom: 20px;
    transition: border-color 0.2s, box-shadow 0.2s;
    box-shadow: 0 1px 4px rgba(15,23,42,0.05);
  }

  .sp-section-full:hover {
    border-color: #CBD5E1;
    box-shadow: 0 4px 16px rgba(15,23,42,0.08);
  }

  .sp-section-header {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 22px;
    padding-bottom: 16px;
    border-bottom: 1px solid #F1F5F9;
  }

  .sp-section-icon {
    width: 32px;
    height: 32px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 15px;
    flex-shrink: 0;
  }

  .sp-section-icon.indigo { background: rgba(59,130,246,0.1);  }
  .sp-section-icon.green  { background: rgba(34,197,94,0.1);   }
  .sp-section-icon.amber  { background: rgba(245,158,11,0.1);  }
  .sp-section-icon.blue   { background: rgba(59,130,246,0.1);  }

  .sp-section-title {
    font-family: 'Syne', sans-serif;
    font-size: 14px;
    font-weight: 700;
    color: var(--color-text-main);
    letter-spacing: 0.01em;
  }

  /* ── Fields ── */
  .sp-field { margin-bottom: 18px; }
  .sp-field:last-child { margin-bottom: 0; }

  .sp-field-label {
    font-size: 10px;
    font-weight: 600;
    color: var(--color-text-muted);
    text-transform: uppercase;
    letter-spacing: 0.1em;
    margin-bottom: 5px;
  }

  .sp-field-value {
    font-size: 14px;
    font-weight: 500;
    color: var(--color-text-main);
  }

  .sp-field-input {
    width: 100%;
    background: var(--color-background);
    border: 1.5px solid #CBD5E1;
    color: var(--color-text-main);
    border-radius: 10px;
    padding: 9px 13px;
    font-size: 13px;
    font-family: 'DM Sans', sans-serif;
    outline: none;
    transition: border-color 0.2s, background 0.2s, box-shadow 0.2s;
  }

  .sp-field-input:focus {
    border-color: var(--color-accent);
    background: #fff;
    box-shadow: 0 0 0 3px rgba(59,130,246,0.1);
  }

  .sp-field-input::placeholder { color: #94A3B8; }

  /* ── Skills ── */
  .sp-skills-wrap {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .sp-skill-tag {
    font-size: 12px;
    font-weight: 600;
    padding: 6px 14px;
    border-radius: 999px;
    background: rgba(59,130,246,0.08);
    color: var(--color-accent);
    border: 1px solid rgba(59,130,246,0.2);
    display: flex;
    align-items: center;
    gap: 6px;
    transition: background 0.15s, border-color 0.15s;
    letter-spacing: 0.01em;
  }

  .sp-skill-tag:hover {
    background: rgba(59,130,246,0.15);
    border-color: rgba(59,130,246,0.35);
  }

  .sp-skill-remove {
    background: none;
    border: none;
    color: #94A3B8;
    cursor: pointer;
    font-size: 16px;
    line-height: 1;
    padding: 0;
    display: flex;
    align-items: center;
    transition: color 0.15s;
  }

  .sp-skill-remove:hover { color: var(--color-danger); }

  .sp-skill-add-row {
    display: flex;
    gap: 10px;
    margin-top: 16px;
  }

  /* ── Resume ── */
  .sp-resume-card {
    background: var(--color-background);
    border: 1px solid #E2E8F0;
    border-radius: 14px;
    padding: 16px 18px;
    display: flex;
    align-items: center;
    gap: 16px;
  }

  .sp-resume-icon {
    width: 44px;
    height: 44px;
    border-radius: 10px;
    background: rgba(59,130,246,0.1);
    border: 1px solid rgba(59,130,246,0.2);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;
    flex-shrink: 0;
  }

  .sp-resume-info { flex: 1; min-width: 0; }

  .sp-resume-name {
    font-size: 13px;
    font-weight: 600;
    color: var(--color-text-main);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    margin-bottom: 3px;
  }

  .sp-resume-meta {
    font-size: 11px;
    color: var(--color-text-muted);
    letter-spacing: 0.02em;
  }

  .sp-resume-actions {
    display: flex;
    gap: 8px;
    flex-shrink: 0;
  }

  .sp-btn-sm {
    font-size: 12px;
    font-weight: 600;
    padding: 7px 14px;
    border-radius: 8px;
    border: none;
    cursor: pointer;
    font-family: 'DM Sans', sans-serif;
    transition: transform 0.15s, opacity 0.15s;
  }

  .sp-btn-sm:hover { opacity: 0.85; transform: translateY(-1px); }

  .sp-btn-sm.indigo {
    background: rgba(59,130,246,0.12);
    color: var(--color-accent);
    border: 1px solid rgba(59,130,246,0.25);
  }

  .sp-btn-sm.ghost {
    background: #F1F5F9;
    color: var(--color-text-muted);
    border: 1px solid #E2E8F0;
  }

  /* ── Upload Zone ── */
  .sp-upload-zone {
    border: 2px dashed #CBD5E1;
    border-radius: 14px;
    padding: 32px 20px;
    text-align: center;
    cursor: default;
    transition: all 0.2s;
  }

  .sp-upload-zone.active {
    border-color: var(--color-accent);
    background: rgba(59,130,246,0.04);
    cursor: pointer;
  }

  .sp-upload-zone.active:hover {
    border-color: #2563EB;
    background: rgba(59,130,246,0.07);
  }

  .sp-upload-emoji { font-size: 32px; margin-bottom: 10px; }

  .sp-upload-title {
    font-size: 14px;
    font-weight: 600;
    color: var(--color-text-main);
    margin-bottom: 4px;
  }

  .sp-upload-sub {
    font-size: 12px;
    color: var(--color-text-muted);
  }

  /* CGPA bar */
  .sp-cgpa-bar-bg {
    background: #E2E8F0;
    border-radius: 999px;
    height: 6px;
    overflow: hidden;
  }

  .sp-cgpa-bar-fill {
    height: 100%;
    border-radius: 999px;
    background: linear-gradient(90deg, var(--color-accent), var(--color-success));
    transition: width 1s ease;
  }

  .sp-cgpa-bar-labels {
    display: flex;
    justify-content: space-between;
    margin-top: 5px;
    font-size: 10px;
    color: var(--color-text-muted);
  }

  .sp-perf-label {
    font-size: 10px;
    color: var(--color-text-muted);
    text-transform: uppercase;
    letter-spacing: 0.1em;
    margin-bottom: 8px;
    font-weight: 600;
  }

  /* ── Responsive ── */
  @media (max-width: 700px) {
    .sp-stats-row { grid-template-columns: repeat(2, 1fr); }
    .sp-grid-2col { grid-template-columns: 1fr; }
    .sp-hero-name { font-size: 24px; }
    .sp-hero-inner { padding: 24px 20px; }
    .sp-content { padding: 20px 14px 50px; }
  }

  @media (max-width: 440px) {
    .sp-stats-row { grid-template-columns: repeat(2, 1fr); }
    .sp-hero-actions { flex-direction: row; }
  }
`;

function Field({ label, name, value, editing, form, onChange, type = "text" }) {
  return (
    <div className="sp-field">
      <div className="sp-field-label">{label}</div>
      {editing ? (
        <input
          type={type}
          name={name}
          value={form[name] || ""}
          onChange={onChange}
          className="sp-field-input"
        />
      ) : (
        <div className="sp-field-value">{value || "—"}</div>
      )}
    </div>
  );
}

export default function StudentProfilePage() {
  const [student, setStudent] = useState(loadStudent);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(null);
  const [previewPhoto, setPreviewPhoto] = useState(null);
  const [pendingResume, setPendingResume] = useState(null);
  const [newSkill, setNewSkill] = useState("");
  const [saved, setSaved] = useState(false);

  const photoInputRef = useRef(null);
  const resumeInputRef = useRef(null);

  const handleEdit = () => {
    setForm({ ...student });
    setPreviewPhoto(student.photo);
    setPendingResume(student.resume);
    setEditing(true);
  };

  const handleSave = () => {
    const updated = { ...form, photo: previewPhoto, resume: pendingResume };
    setStudent(updated);
    saveStudent(updated);
    setEditing(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleCancel = () => {
    setForm(null);
    setPreviewPhoto(null);
    setPendingResume(null);
    setEditing(false);
  };

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setPreviewPhoto(ev.target.result);
    reader.readAsDataURL(file);
  };

  const handleResumeUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const sizeText = file.size > 1024 * 1024
        ? (file.size / (1024 * 1024)).toFixed(1) + " MB"
        : (file.size / 1024).toFixed(0) + " KB";
      setPendingResume({ name: file.name, base64: ev.target.result, size: sizeText, type: file.type });
    };
    reader.readAsDataURL(file);
  };

  const handleViewResume = (resume) => {
    if (!resume?.base64) return;
    const byteString = atob(resume.base64.split(",")[1]);
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) ia[i] = byteString.charCodeAt(i);
    const blob = new Blob([ab], { type: resume.type || "application/pdf" });
    window.open(URL.createObjectURL(blob), "_blank");
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

  const displayPhoto  = editing ? previewPhoto  : student.photo;
  const displayResume = editing ? pendingResume : student.resume;
  const displayData   = editing ? form          : student;
  const fieldProps    = { editing, form: form || student, onChange: handleChange };
  const skills        = (editing ? form?.skills : student.skills) || [];
  const cgpaPercent   = Math.min(parseFloat(student.cgpa) / 10 * 100, 100).toFixed(0);

  return (
    <>
      <style>{styles}</style>
      <div className="sp-root">

        {/* ── Navbar ── */}
        <nav className="sp-nav">
          <div className="sp-nav-logo">
            <div className="sp-nav-logo-dot" />
            EduPortal
          </div>
          <div className="sp-nav-right">
            {saved && <span className="sp-badge-saved">✓ Changes Saved</span>}
            <span className="sp-nav-tag">My Profile</span>
          </div>
        </nav>

        <div className="sp-content">

          {/* ── Hero Card ── */}
          <div className="sp-hero">
            <div className="sp-hero-bg-pattern" />
            <div className="sp-hero-grid-lines" />
            <div className="sp-hero-inner">

              {/* ✅ Avatar with photo upload */}
              <div className="sp-avatar-wrap">
                <div className="sp-avatar-ring">
                  <div className="sp-avatar-inner">
                    {displayPhoto
                      ? <img src={displayPhoto} alt="Profile" />
                      : student.name?.charAt(0)}
                  </div>
                </div>
                {editing && (
                  <button className="sp-avatar-edit-btn" onClick={() => photoInputRef.current.click()}>
                    📷
                  </button>
                )}
                <input type="file" accept="image/*" ref={photoInputRef} onChange={handlePhotoChange} style={{ display: "none" }} />
              </div>

              {/* Info */}
              <div className="sp-hero-info">
                <div className="sp-hero-name">{displayData?.name}</div>
                <div className="sp-hero-sub">{displayData?.branch} · {displayData?.year}</div>
                <div className="sp-hero-college">{displayData?.college}</div>
                <div className="sp-hero-chips">
                  <span className="sp-chip sp-chip-indigo">Roll No: {student.rollNo}</span>
                  <span className="sp-chip sp-chip-green">CGPA {student.cgpa}</span>
                  <span className="sp-chip sp-chip-amber">{student.city}, {student.state}</span>
                </div>
              </div>

              {/* Buttons */}
              <div className="sp-hero-actions">
                {editing ? (
                  <>
                    <button className="sp-btn-save" onClick={handleSave}>✓ Save Changes</button>
                    <button className="sp-btn-ghost" onClick={handleCancel}>Cancel</button>
                  </>
                ) : (
                  <button className="sp-btn-primary" onClick={handleEdit}>✎ Edit Profile</button>
                )}
              </div>

            </div>
          </div>

          {/* ── Stats Row ── */}
          <div className="sp-stats-row">
            <div className="sp-stat-card indigo">
              <div className="sp-stat-icon">🎯</div>
              <div className="sp-stat-value">{student.cgpa}</div>
              <div className="sp-stat-label">CGPA Score</div>
            </div>
            <div className="sp-stat-card green">
              <div className="sp-stat-icon">⚡</div>
              <div className="sp-stat-value">{skills.length}</div>
              <div className="sp-stat-label">Skills Listed</div>
            </div>
            <div className="sp-stat-card amber">
              <div className="sp-stat-icon">📅</div>
              <div className="sp-stat-value">{student.year?.split(" ")[0] || "3rd"}</div>
              <div className="sp-stat-label">Current Year</div>
            </div>
            <div className="sp-stat-card rose">
              <div className="sp-stat-icon">📊</div>
              <div className="sp-stat-value">{cgpaPercent}%</div>
              <div className="sp-stat-label">Performance</div>
            </div>
          </div>

          {/* ── Personal + Academic 2-col ── */}
          <div className="sp-grid-2col">

            <div className="sp-section">
              <div className="sp-section-header">
                <div className="sp-section-icon indigo">👤</div>
                <div className="sp-section-title">Personal Information</div>
              </div>
              <Field label="Full Name"     name="name"   value={student.name}   {...fieldProps} />
              <Field label="Email Address" name="email"  value={student.email}  {...fieldProps} />
              <Field label="Phone Number"  name="phone"  value={student.phone}  {...fieldProps} />
              <Field label="Date of Birth" name="dob"    value={student.dob}    type="date" {...fieldProps} />
              <Field label="Gender"        name="gender" value={student.gender} {...fieldProps} />
              <Field label="City"          name="city"   value={student.city}   {...fieldProps} />
              <Field label="State"         name="state"  value={student.state}  {...fieldProps} />
            </div>

            <div className="sp-section">
              <div className="sp-section-header">
                <div className="sp-section-icon blue">🏫</div>
                <div className="sp-section-title">Academic Information</div>
              </div>
              <Field label="College / University" name="college" value={student.college} {...fieldProps} />
              <Field label="Branch"               name="branch"  value={student.branch}  {...fieldProps} />
              <Field label="Current Year"         name="year"    value={student.year}    {...fieldProps} />
              <Field label="CGPA"                 name="cgpa"    value={student.cgpa}    {...fieldProps} />
              <Field label="Roll Number"          name="rollNo"  value={student.rollNo}  {...fieldProps} />

              {!editing && (
                <div style={{ marginTop: "18px" }}>
                  <div className="sp-perf-label">Academic Performance</div>
                  <div className="sp-cgpa-bar-bg">
                    <div className="sp-cgpa-bar-fill" style={{ width: `${cgpaPercent}%` }} />
                  </div>
                  <div className="sp-cgpa-bar-labels">
                    <span>0.0</span><span>5.0</span><span>10.0</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ── Skills ── */}
          <div className="sp-section-full">
            <div className="sp-section-header">
              <div className="sp-section-icon green">⚡</div>
              <div className="sp-section-title">Skills & Technologies</div>
            </div>
            <div className="sp-skills-wrap">
              {skills.map((skill) => (
                <span key={skill} className="sp-skill-tag">
                  {skill}
                  {editing && (
                    <button className="sp-skill-remove" onClick={() => removeSkill(skill)}>×</button>
                  )}
                </span>
              ))}
              {skills.length === 0 && (
                <span style={{ fontSize: "13px", color: "var(--color-text-muted)", fontStyle: "italic" }}>
                  No skills added yet
                </span>
              )}
            </div>
            {editing && (
              <div className="sp-skill-add-row">
                <input
                  type="text"
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addSkill()}
                  placeholder="Type a skill and press Enter…"
                  className="sp-field-input"
                  style={{ flex: 1 }}
                />
                <button className="sp-btn-primary" onClick={addSkill} style={{ padding: "9px 18px" }}>
                  + Add
                </button>
              </div>
            )}
          </div>

          {/* ── Resume ── */}
          <div className="sp-section-full">
            <div className="sp-section-header">
              <div className="sp-section-icon amber">📄</div>
              <div className="sp-section-title">Resume / CV</div>
            </div>
            {displayResume ? (
              <div className="sp-resume-card">
                <div className="sp-resume-icon">📎</div>
                <div className="sp-resume-info">
                  <div className="sp-resume-name">{displayResume.name}</div>
                  <div className="sp-resume-meta">Uploaded · {displayResume.size}</div>
                </div>
                <div className="sp-resume-actions">
                  <button className="sp-btn-sm indigo" onClick={() => handleViewResume(displayResume)}>
                    👁 View
                  </button>
                  {editing && (
                    <button className="sp-btn-sm ghost" onClick={() => resumeInputRef.current.click()}>
                      🔄 Replace
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div
                className={`sp-upload-zone${editing ? " active" : ""}`}
                onClick={() => editing && resumeInputRef.current.click()}
              >
                <div className="sp-upload-emoji">📂</div>
                <div className="sp-upload-title">
                  {editing ? "Click to Upload Your Resume" : "No Resume Uploaded Yet"}
                </div>
                {editing && <div className="sp-upload-sub">PDF or DOCX · Max 5MB</div>}
                {editing && (
                  <button
                    className="sp-btn-primary"
                    style={{ marginTop: "14px", fontSize: "12px", padding: "8px 20px" }}
                    onClick={(e) => { e.stopPropagation(); resumeInputRef.current.click(); }}
                  >
                    📤 Upload File
                  </button>
                )}
              </div>
            )}
            <input type="file" accept=".pdf,.doc,.docx" ref={resumeInputRef} onChange={handleResumeUpload} style={{ display: "none" }} />
          </div>

        </div>
      </div>
    </>
  );
}
