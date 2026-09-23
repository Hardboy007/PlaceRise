import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../../utils/api";
import {
  ArrowLeft,
  Download,
  FileText,
  GraduationCap,
  User,
  Zap,
  Phone,
  Mail,
  MapPin,
  Award,
} from "lucide-react";

const C = {
  primary: "#1a3a8f",
  textMain: "#0F172A",
  textMuted: "#64748B",
  border: "#E2E8F0",
  white: "#FFFFFF",
  background: "#F1F5F9",
};

function InfoRow({ label, value }) {
  return (
    <div className="flex flex-col gap-0.5">
      <p
        className="text-xs font-semibold uppercase tracking-widest"
        style={{ color: C.textMuted }}
      >
        {label}
      </p>
      <p className="text-sm font-medium" style={{ color: C.textMain }}>
        {value || "—"}
      </p>
    </div>
  );
}

function Section({ title, icon: Icon, color, children }) {
  return (
    <div
      className="bg-white rounded-2xl border p-5 shadow-sm"
      style={{ borderColor: C.border }}
    >
      <div
        className="flex items-center gap-2 mb-4 pb-3 border-b"
        style={{ borderColor: C.border }}
      >
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: color + "20" }}
        >
          <Icon size={16} style={{ color }} />
        </div>
        <h3 className="text-sm font-bold" style={{ color: C.textMain }}>
          {title}
        </h3>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">{children}</div>
    </div>
  );
}

export default function CoordinatorStudentProfilePage() {
  const { studentId } = useParams();
  const navigate = useNavigate();
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const data = await api.get(`/students/${studentId}`);
        setStudent(data);
      } catch (err) {
        console.error(err);
      }
      setLoading(false);
    };
    fetch();
  }, [studentId]);

  if (loading)
    return (
      <div className="text-center py-20 text-sm" style={{ color: C.textMuted }}>
        Loading...
      </div>
    );
  if (!student)
    return (
      <div className="text-center py-20 text-sm" style={{ color: C.textMuted }}>
        Student not found
      </div>
    );

  const erpId = student.userId?.erpId || student.erpId || "—";

  return (
    <div
      className="max-w-3xl mx-auto px-4 py-6 space-y-5"
      style={{ fontFamily: "Inter, sans-serif" }}
    >
      {/* Back */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-sm"
        style={{ color: C.textMuted }}
      >
        <ArrowLeft size={15} /> Back
      </button>

      {/* Hero */}
      <div
        className="relative rounded-3xl overflow-hidden p-6 text-white"
        style={{
          background:
            "linear-gradient(135deg, #0d1b5e 0%, #1a2d8a 25%, #3d1a6e 55%, #6b1040 80%, #7a0f35 100%)",
        }}
      >
        <div className="flex items-center gap-4 mb-4">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold shrink-0"
            style={{
              background:
                "linear-gradient(135deg, rgba(255,255,255,0.2), rgba(255,255,255,0.1))",
            }}
          >
            {student.profilePhoto ? (
              <img
                src={student.profilePhoto}
                alt={student.name}
                className="w-full h-full rounded-2xl object-cover"
              />
            ) : (
              student.name?.charAt(0)
            )}
          </div>
          <div>
            <h1 className="text-xl font-bold">{student.name}</h1>
            <p className="text-white/70 text-sm">
              {student.course} · Batch {student.batch}
            </p>
            <p className="text-white/60 text-xs mt-0.5">ERP: {erpId}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-white/20 border border-white/30">
            CGPA {student.cgpa}
          </span>
          <span
            className={`px-3 py-1 rounded-full text-xs font-semibold border ${student.placementStatus === "Placed" ? "bg-green-500/30 border-green-400" : "bg-amber-500/30 border-amber-400"}`}
          >
            {student.placementStatus || "Not Placed"}
          </span>
          {student.backlogs > 0 && (
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-red-500/30 border border-red-400">
              {student.backlogs} Backlog{student.backlogs > 1 ? "s" : ""}
            </span>
          )}
        </div>
      </div>

      {/* Personal */}
      <Section title="Personal Information" icon={User} color={C.primary}>
        <InfoRow label="Email" value={student.email} />
        <InfoRow label="Phone" value={student.phone} />
        <InfoRow label="Gender" value={student.gender} />
        <InfoRow label="Date of Birth" value={student.dob} />
        <InfoRow label="City" value={student.city} />
        <InfoRow label="State" value={student.state} />
        <InfoRow label="Address" value={student.address} />
        <InfoRow label="Parent Email" value={student.parentEmail} />
        <InfoRow label="Parent Phone" value={student.parentPhone} />
        <InfoRow label="Parent Name" value={student.parentName} />
      </Section>

      {/* Academic */}
      <Section title="Academic Details" icon={GraduationCap} color="#22C55E">
        <InfoRow label="Course" value={student.course} />
        <InfoRow label="Branch" value={student.branch} />
        <InfoRow label="School" value={student.school} />
        <InfoRow label="Batch" value={student.batch} />
        <InfoRow label="CGPA" value={student.cgpa} />
        <InfoRow
          label="10th Marks"
          value={student.tenthMarks ? `${student.tenthMarks}%` : null}
        />
        <InfoRow
          label="12th Marks"
          value={student.twelfthMarks ? `${student.twelfthMarks}%` : null}
        />
        <InfoRow
          label="Backlogs"
          value={student.backlogs === 0 ? "None" : student.backlogs}
        />
      </Section>

      {/* Marksheets */}
      <div
        className="bg-white rounded-2xl border p-5 shadow-sm"
        style={{ borderColor: C.border }}
      >
        <div
          className="flex items-center gap-2 mb-4 pb-3 border-b"
          style={{ borderColor: C.border }}
        >
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: "#F59E0B20" }}
          >
            <FileText size={16} style={{ color: "#F59E0B" }} />
          </div>
          <h3 className="text-sm font-bold" style={{ color: C.textMain }}>
            Marksheets
          </h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { label: "10th Marksheet", url: student.tenthMarksheet },
            { label: "12th Marksheet", url: student.twelfthMarksheet },
          ].map(({ label, url }) => (
            <div
              key={label}
              className="flex items-center justify-between p-3 rounded-xl border"
              style={{ borderColor: C.border, backgroundColor: C.background }}
            >
              <p className="text-sm font-medium" style={{ color: C.textMain }}>
                {label}
              </p>
              {url ? (
                <a
                  href={url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white"
                  style={{ backgroundColor: C.primary }}
                >
                  <Download size={12} /> View
                </a>
              ) : (
                <span className="text-xs" style={{ color: C.textMuted }}>
                  Not uploaded
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Resume */}
      <div
        className="bg-white rounded-2xl border p-5 shadow-sm"
        style={{ borderColor: C.border }}
      >
        <div
          className="flex items-center gap-2 mb-4 pb-3 border-b"
          style={{ borderColor: C.border }}
        >
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: "#8B5CF620" }}
          >
            <FileText size={16} style={{ color: "#8B5CF6" }} />
          </div>
          <h3 className="text-sm font-bold" style={{ color: C.textMain }}>
            Resume
          </h3>
        </div>
        {student.resume ? (
          <a
            href={student.resume}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white w-fit"
            style={{ backgroundColor: C.primary }}
          >
            <Download size={14} /> View / Download Resume
          </a>
        ) : (
          <p className="text-sm" style={{ color: C.textMuted }}>
            No resume uploaded
          </p>
        )}
      </div>

      {/* Skills */}
      <div
        className="bg-white rounded-2xl border p-5 shadow-sm"
        style={{ borderColor: C.border }}
      >
        <div
          className="flex items-center gap-2 mb-4 pb-3 border-b"
          style={{ borderColor: C.border }}
        >
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: "#22C55E20" }}
          >
            <Zap size={16} style={{ color: "#22C55E" }} />
          </div>
          <h3 className="text-sm font-bold" style={{ color: C.textMain }}>
            Skills
          </h3>
        </div>
        <div className="flex flex-wrap gap-2">
          {(student.skills || []).length === 0 ? (
            <p className="text-sm" style={{ color: C.textMuted }}>
              No skills added
            </p>
          ) : (
            student.skills.map((s) => (
              <span
                key={s}
                className="px-3 py-1.5 rounded-full text-xs font-semibold border"
                style={{
                  color: C.primary,
                  backgroundColor: "#EFF3FA",
                  borderColor: "#B8C6E3",
                }}
              >
                {s}
              </span>
            ))
          )}
        </div>
      </div>

      {/* Certifications */}
      {(student.certifications || []).length > 0 && (
        <div
          className="bg-white rounded-2xl border p-5 shadow-sm"
          style={{ borderColor: C.border }}
        >
          <div
            className="flex items-center gap-2 mb-4 pb-3 border-b"
            style={{ borderColor: C.border }}
          >
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: "#F59E0B20" }}
            >
              <Award size={16} style={{ color: "#F59E0B" }} />
            </div>
            <h3 className="text-sm font-bold" style={{ color: C.textMain }}>
              Certifications
            </h3>
          </div>
          <div className="flex flex-col gap-3">
            {student.certifications.map((cert, i) => (
              <div
                key={i}
                className="p-3 rounded-xl border"
                style={{ borderColor: C.border, backgroundColor: C.background }}
              >
                <p
                  className="text-sm font-semibold"
                  style={{ color: C.textMain }}
                >
                  {cert.name}
                </p>
                <p className="text-xs" style={{ color: C.textMuted }}>
                  {cert.issuingOrganization}
                </p>
                {cert.credentialUrl && (
                  <a
                    href={cert.credentialUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-medium mt-1 inline-block"
                    style={{ color: C.primary }}
                  >
                    View Certificate →
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Placement */}
      {student.placementStatus === "Placed" &&
        (student.selectedCompanies || []).length > 0 && (
          <div
            className="bg-white rounded-2xl border p-5 shadow-sm"
            style={{ borderColor: C.border }}
          >
            <h3
              className="text-sm font-bold mb-4 pb-3 border-b"
              style={{ color: C.textMain, borderColor: C.border }}
            >
              Placement Details
            </h3>
            <div className="flex flex-col gap-3">
              {student.selectedCompanies.map((offer, i) => (
                <div
                  key={i}
                  className="p-4 rounded-xl border"
                  style={{ backgroundColor: "#F0FDF4", borderColor: "#86EFAC" }}
                >
                  <p className="text-sm font-bold" style={{ color: "#15803D" }}>
                    {offer?.companyId?.name || "—"}
                  </p>
                  {offer?.ctc && (
                    <p className="text-xs" style={{ color: "#64748B" }}>
                      ₹{offer.ctc} LPA
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
    </div>
  );
}
