import { useState, useMemo } from "react";
import  mockStudents  from "../../data/mockStudents";

// ── Design Tokens ─────────────────────────────────────────────
const C = {
  primary:    "#3B82F6",
  accent:     "#60A5FA",
  background: "#F1F5F9",
  textMain:   "#0F172A",
  textMuted:  "#64748B",
  success:    "#22C55E",
  warning:    "#F59E0B",
  danger:     "#EF4444",
  white:      "#FFFFFF",
  border:     "#E2E8F0",
  cardBg:     "#FFFFFF",
};

const BRANCHES = ["All", "CSE", "IT", "ECE", "ME", "CE"];
const BATCHES  = ["All", "2024", "2025", "2026"];
const CGPA_RANGES = [
  { label: "All", min: 0,   max: 10  },
  { label: "9+",  min: 9,   max: 10  },
  { label: "8–9", min: 8,   max: 8.99},
  { label: "7–8", min: 7,   max: 7.99},
  { label: "< 7", min: 0,   max: 6.99},
];

// ── SVG Icons ─────────────────────────────────────────────────
const Icon = {
  search: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <circle cx="11" cy="11" r="8"/><path strokeLinecap="round" d="M21 21l-4.35-4.35"/>
    </svg>
  ),
  close: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" d="M6 18L18 6M6 6l12 12"/>
    </svg>
  ),
  students: (
    <svg className="w-5 h-5" fill="none" stroke={C.primary} strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/>
    </svg>
  ),
  placed: (
    <svg className="w-5 h-5" fill="none" stroke={C.success} strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
    </svg>
  ),
  notPlaced: (
    <svg className="w-5 h-5" fill="none" stroke={C.warning} strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
    </svg>
  ),
  cgpa: (
    <svg className="w-5 h-5" fill="none" stroke="#8B5CF6" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
    </svg>
  ),
  user: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
    </svg>
  ),
  mail: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
    </svg>
  ),
  phone: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
    </svg>
  ),
  building: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
    </svg>
  ),
  location: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0zM15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
    </svg>
  ),
  filter: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"/>
    </svg>
  ),
};

// ── Status Badge ──────────────────────────────────────────────
function StatusBadge({ status, size = "sm" }) {
  const isPlaced = status === "Placed";
  const pad = size === "lg" ? "px-4 py-1.5 text-sm" : "px-2.5 py-0.5 text-xs";
  return (
    <span
      style={{
        color:           isPlaced ? "#15803D" : "#B45309",
        backgroundColor: isPlaced ? "#F0FDF4" : "#FFFBEB",
        borderColor:     isPlaced ? "#86EFAC" : "#FDE68A",
      }}
      className={`inline-flex items-center gap-1.5 border font-semibold rounded-full ${pad}`}
    >
      <span style={{ width: 7, height: 7, borderRadius: "50%", backgroundColor: isPlaced ? C.success : C.warning, display: "inline-block" }} />
      {status}
    </span>
  );
}

// ── Select / Filter pill ──────────────────────────────────────
function FilterSelect({ label, value, options, onChange }) {
  return (
    <div className="flex flex-col gap-1">
      <label style={{ color: C.textMuted }} className="text-[11px] font-semibold uppercase tracking-wider pl-0.5">
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          color: C.textMain,
          backgroundColor: C.white,
          borderColor: C.border,
          outline: "none",
        }}
        className="border rounded-xl px-3 py-2 text-sm font-medium cursor-pointer focus:ring-2 focus:ring-blue-200 transition"
      >
        {options.map((o) => (
          <option key={o.label || o} value={o.label || o}>{o.label || o}</option>
        ))}
      </select>
    </div>
  );
}

// ── Stat Card ─────────────────────────────────────────────────
function StatCard({ icon, label, value, bg, border }) {
  return (
    <div
      style={{ backgroundColor: C.white, borderColor: border || C.border }}
      className="rounded-2xl border p-5 flex items-center gap-4 shadow-sm"
    >
      <div style={{ backgroundColor: bg }} className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div>
        <p style={{ color: C.textMuted }} className="text-xs font-medium">{label}</p>
        <p style={{ color: C.textMain }} className="text-2xl font-bold leading-tight">{value}</p>
      </div>
    </div>
  );
}

// ── Student Detail Modal ──────────────────────────────────────
function StudentModal({ student, onClose }) {
  if (!student) return null;

  const InfoRow = ({ icon, label, value }) => (
    <div className="flex items-start gap-3">
      <div style={{ color: C.textMuted }} className="mt-0.5 shrink-0">{icon}</div>
      <div>
        <p style={{ color: C.textMuted }} className="text-xs font-medium mb-0.5">{label}</p>
        <p style={{ color: C.textMain }} className="text-sm font-semibold">{value || "—"}</p>
      </div>
    </div>
  );

  const Section = ({ title, children }) => (
    <div>
      <h4 style={{ color: C.textMain, borderColor: C.border }}
        className="text-xs font-bold uppercase tracking-widest mb-4 pb-2 border-b">
        {title}
      </h4>
      <div className="grid grid-cols-2 gap-4">{children}</div>
    </div>
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(15,23,42,0.5)", backdropFilter: "blur(4px)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        style={{ backgroundColor: C.white, borderColor: C.border, maxHeight: "90vh" }}
        className="rounded-3xl border shadow-2xl w-full max-w-2xl overflow-y-auto"
      >
        {/* Modal Header */}
        <div style={{ borderColor: C.border }}
          className="flex items-center justify-between px-7 py-5 border-b sticky top-0 bg-white rounded-t-3xl z-10">
          <div className="flex items-center gap-4">
            <div
              style={{ background: `linear-gradient(135deg, ${C.primary}, ${C.accent})` }}
              className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold text-lg shrink-0"
            >
              {student.name.charAt(0)}
            </div>
            <div>
              <h2 style={{ color: C.textMain }} className="text-xl font-bold">{student.name}</h2>
              <p style={{ color: C.textMuted }} className="text-sm">{student.erpId} · {student.branch} · Batch {student.batch}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <StatusBadge status={student.placementStatus} size="lg" />
            <button
              onClick={onClose}
              style={{ color: C.textMuted, backgroundColor: C.background }}
              className="w-9 h-9 rounded-xl flex items-center justify-center hover:opacity-80 transition"
            >
              {Icon.close}
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="px-7 py-6 space-y-7">
          {/* Personal Info */}
          <Section title="Personal Information">
            <InfoRow icon={Icon.mail}     label="Email"   value={student.email}   />
            <InfoRow icon={Icon.phone}    label="Phone"   value={student.phone}   />
            <InfoRow icon={Icon.user}     label="Gender"  value={student.gender}  />
            <InfoRow icon={Icon.location} label="Address" value={student.address} />
          </Section>

          {/* Academic Info */}
          <Section title="Academic Details">
            <InfoRow icon={Icon.building} label="Branch"   value={student.branch}            />
            <InfoRow icon={Icon.cgpa}     label="Batch"    value={student.batch}             />
            <InfoRow
              icon={
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
                </svg>
              }
              label="CGPA"
              value={student.cgpa.toFixed(1)}
            />
            <InfoRow
              icon={
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                </svg>
              }
              label="Backlogs"
              value={student.backlogs === 0 ? "None" : student.backlogs}
            />
          </Section>

          {/* Skills */}
          <div>
            <h4 style={{ color: C.textMain, borderColor: C.border }}
              className="text-xs font-bold uppercase tracking-widest mb-4 pb-2 border-b">
              Skills
            </h4>
            <div className="flex flex-wrap gap-2">
              {student.skills.map((skill) => (
                <span key={skill}
                  style={{ color: C.primary, backgroundColor: "#EFF6FF", borderColor: "#BFDBFE" }}
                  className="border text-xs font-semibold px-3 py-1.5 rounded-full">
                  {skill}
                </span>
              ))}
            </div>
          </div>

          {/* Placement Info */}
          {student.placementStatus === "Placed" && (
            <div>
              <h4 style={{ color: C.textMain, borderColor: C.border }}
                className="text-xs font-bold uppercase tracking-widest mb-4 pb-2 border-b">
                Placement Details
              </h4>
              <div
                style={{ backgroundColor: "#F0FDF4", borderColor: "#86EFAC" }}
                className="rounded-2xl border p-5 grid grid-cols-3 gap-4"
              >
                <div>
                  <p style={{ color: "#64748B" }} className="text-xs font-medium mb-1">Company</p>
                  <p style={{ color: "#15803D" }} className="font-bold text-base">{student.company}</p>
                </div>
                <div>
                  <p style={{ color: "#64748B" }} className="text-xs font-medium mb-1">CTC</p>
                  <p style={{ color: "#15803D" }} className="font-bold text-base">{student.ctc}</p>
                </div>
                <div>
                  <p style={{ color: "#64748B" }} className="text-xs font-medium mb-1">Offer Date</p>
                  <p style={{ color: "#15803D" }} className="font-bold text-base">{student.offerDate}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────
export default function StudentDatabasePage() {
  const [search,      setSearch]      = useState("");
  const [branch,      setBranch]      = useState("All");
  const [batch,       setBatch]       = useState("All");
  const [cgpaRange,   setCgpaRange]   = useState("All");
  const [placement,   setPlacement]   = useState("All");
  const [selected,    setSelected]    = useState(null);

  const cgpaOpt = useMemo(() => CGPA_RANGES.find((r) => r.label === cgpaRange) || CGPA_RANGES[0], [cgpaRange]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return mockStudents.filter((s) => {
      if (q && !s.name.toLowerCase().includes(q) && !s.erpId.toLowerCase().includes(q)) return false;
      if (branch    !== "All" && s.branch !== branch)               return false;
      if (batch     !== "All" && s.batch  !== parseInt(batch))      return false;
      if (s.cgpa < cgpaOpt.min || s.cgpa > cgpaOpt.max)            return false;
      if (placement !== "All" && s.placementStatus !== placement)   return false;
      return true;
    });
  }, [search, branch, batch, cgpaOpt, placement]);

  const total    = mockStudents.length;
  const placed   = mockStudents.filter((s) => s.placementStatus === "Placed").length;
  const avgCgpa  = (mockStudents.reduce((a, s) => a + s.cgpa, 0) / total).toFixed(2);

  const hasFilters = search || branch !== "All" || batch !== "All" || cgpaRange !== "All" || placement !== "All";

  const resetFilters = () => {
    setSearch(""); setBranch("All"); setBatch("All"); setCgpaRange("All"); setPlacement("All");
  };

  return (
    <div style={{ backgroundColor: C.background }} className="min-h-screen p-6 space-y-6">

      {/* ── Page Title ── */}
      <div>
        <h1 style={{ color: C.textMain }} className="text-2xl font-bold">Student Database</h1>
        <p style={{ color: C.textMuted }} className="text-sm mt-0.5">
          Manage and track placement status of all registered students.
        </p>
      </div>

      {/* ── Stats Strip ── */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard
          icon={Icon.students}
          label="Total Students"
          value={total}
          bg="#EFF6FF"
          border="#BFDBFE"
        />
        <StatCard
          icon={Icon.placed}
          label="Placed"
          value={placed}
          bg="#F0FDF4"
          border="#86EFAC"
        />
        <StatCard
          icon={Icon.notPlaced}
          label="Not Placed"
          value={total - placed}
          bg="#FFFBEB"
          border="#FDE68A"
        />
        <StatCard
          icon={Icon.cgpa}
          label="Average CGPA"
          value={avgCgpa}
          bg="#F5F3FF"
          border="#DDD6FE"
        />
      </div>

      {/* ── Search + Filters ── */}
      <div style={{ backgroundColor: C.white, borderColor: C.border }}
        className="rounded-2xl border p-5 shadow-sm">
        <div className="flex flex-col gap-4">
          {/* Search bar */}
          <div className="relative">
            <span style={{ color: C.textMuted }} className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
              {Icon.search}
            </span>
            <input
              type="text"
              placeholder="Search by name or ERP ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                color: C.textMain,
                backgroundColor: C.background,
                borderColor: C.border,
                outline: "none",
              }}
              className="w-full border rounded-xl pl-10 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-200 transition"
            />
          </div>

          {/* Filters row */}
          <div className="flex items-end gap-4 flex-wrap">
            <div style={{ color: C.textMuted }} className="flex items-center gap-1.5 text-sm font-medium mr-1 mb-0.5">
              {Icon.filter} Filters
            </div>
            <FilterSelect label="Branch"    value={branch}    options={BRANCHES}    onChange={setBranch}   />
            <FilterSelect label="Batch"     value={batch}     options={BATCHES}     onChange={setBatch}    />
            <FilterSelect label="CGPA"      value={cgpaRange} options={CGPA_RANGES.map(r => r.label)} onChange={setCgpaRange} />
            <FilterSelect
              label="Status"
              value={placement}
              options={["All", "Placed", "Not Placed"]}
              onChange={setPlacement}
            />
            {hasFilters && (
              <button
                onClick={resetFilters}
                style={{ color: C.danger, backgroundColor: "#FFF1F2", borderColor: "#FECDD3" }}
                className="border text-xs font-semibold px-3 py-2 rounded-xl hover:opacity-80 transition self-end mb-0.5"
              >
                Clear Filters
              </button>
            )}
            <span style={{ color: C.textMuted }} className="ml-auto text-sm self-end mb-0.5">
              Showing <strong style={{ color: C.textMain }}>{filtered.length}</strong> of {total} students
            </span>
          </div>
        </div>
      </div>

      {/* ── Table ── */}
      <div style={{ backgroundColor: C.white, borderColor: C.border }}
        className="rounded-2xl border shadow-sm overflow-hidden">

        {/* Table Header */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "2fr 1fr 1fr 1fr 0.7fr 0.7fr 1.2fr",
            padding: "14px 24px",
            borderBottom: `1px solid ${C.border}`,
            backgroundColor: C.background,
          }}
        >
          {["Name", "ERP ID", "Branch", "Batch", "CGPA", "Backlogs", "Status"].map((h) => (
            <span key={h} style={{ color: C.textMuted }}
              className="text-[11px] font-bold uppercase tracking-wider">
              {h}
            </span>
          ))}
        </div>

        {/* Rows */}
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <svg className="w-12 h-12" fill="none" stroke={C.border} strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            <p style={{ color: C.textMuted }} className="text-sm font-medium">No students found matching your filters.</p>
            <button onClick={resetFilters} style={{ color: C.primary }} className="text-sm font-semibold hover:underline">
              Clear all filters
            </button>
          </div>
        ) : (
          filtered.map((student, idx) => {
            const isLast = idx === filtered.length - 1;
            return (
              <div
                key={student.id}
                onClick={() => setSelected(student)}
                style={{
                  display: "grid",
                  gridTemplateColumns: "2fr 1fr 1fr 1fr 0.7fr 0.7fr 1.2fr",
                  alignItems: "center",
                  padding: "16px 24px",
                  borderBottom: isLast ? "none" : `1px solid ${C.border}`,
                  cursor: "pointer",
                  transition: "background 0.15s",
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#F8FAFC"}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = C.white}
              >
                {/* Name */}
                <div className="flex items-center gap-3">
                  <div
                    style={{ background: `linear-gradient(135deg, ${C.primary}, ${C.accent})` }}
                    className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-sm shrink-0"
                  >
                    {student.name.charAt(0)}
                  </div>
                  <div>
                    <p style={{ color: C.textMain }} className="font-semibold text-sm leading-tight">{student.name}</p>
                    <p style={{ color: C.textMuted }} className="text-xs">{student.email}</p>
                  </div>
                </div>

                {/* ERP ID */}
                <span style={{ color: C.textMuted }} className="text-sm font-mono">{student.erpId}</span>

                {/* Branch */}
                <span
                  style={{ color: C.primary, backgroundColor: "#EFF6FF", borderColor: "#BFDBFE" }}
                  className="border text-xs font-semibold px-2.5 py-1 rounded-full w-fit"
                >
                  {student.branch}
                </span>

                {/* Batch */}
                <span style={{ color: C.textMuted }} className="text-sm">{student.batch}</span>

                {/* CGPA */}
                <span
                  style={{
                    color: student.cgpa >= 8.5 ? "#15803D" : student.cgpa >= 7 ? C.textMain : C.danger,
                    fontWeight: 700,
                  }}
                  className="text-sm"
                >
                  {student.cgpa.toFixed(1)}
                </span>

                {/* Backlogs */}
                <span
                  style={{
                    color: student.backlogs === 0 ? C.textMuted : C.danger,
                    fontWeight: student.backlogs > 0 ? 700 : 400,
                  }}
                  className="text-sm"
                >
                  {student.backlogs === 0 ? "—" : student.backlogs}
                </span>

                {/* Status */}
                <StatusBadge status={student.placementStatus} />
              </div>
            );
          })
        )}
      </div>

      {/* ── Student Detail Modal ── */}
      <StudentModal student={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
