import { useState, useMemo, useEffect, useRef } from "react";
import { api } from "../../utils/api";
import universityStructure from "../../data/universityStructure";
import { Download, Upload } from "lucide-react";
// ── Design Tokens ─────────────────────────────────────────────
const C = {
  primary: "#3B82F6",
  accent: "#60A5FA",
  background: "#F1F5F9",
  textMain: "#0F172A",
  textMuted: "#64748B",
  success: "#22C55E",
  warning: "#F59E0B",
  danger: "#EF4444",
  white: "#FFFFFF",
  border: "#E2E8F0",
  cardBg: "#FFFFFF",
};

// ── School / Course helpers ─────────────────────────────────
// Flat, school-grouped course list used by the combined Course filter.
// Each entry: { school: "School of Engineering", courses: ["B.Tech CSE", "M.Tech CSE", ...] }
const COURSE_GROUPS = universityStructure.map((s) => ({
  school: s.school,
  courses: s.departments.flatMap((d) => d.courses),
}));

const BATCHES = ["All", "2024", "2025", "2026", "2027"];
const CGPA_RANGES = [
  { label: "All", min: 0, max: 10 },
  { label: "9+", min: 9, max: 10 },
  { label: "8–9", min: 8, max: 8.99 },
  { label: "7–8", min: 7, max: 7.99 },
  { label: "< 7", min: 0, max: 6.99 },
];
const SELECTED_IN = [
  "All",
  "0 companies",
  "1 company",
  "2 companies",
  "3+ companies",
];

const getStudentCourse = (student) => student?.course || student?.branch || "";
const getStudentErpId = (student) =>
  student?.userId?.erpId || student?.erpId || "";
const getPlacementStatus = (student) =>
  student?.placementStatus === "Placed" ||
  (Array.isArray(student?.selectedCompanies) &&
    student.selectedCompanies.length > 0)
    ? "Placed"
    : "Not Placed";
const getSelectedCompanyCount = (student) =>
  Array.isArray(student?.selectedCompanies)
    ? student.selectedCompanies.length
    : Number(student?.selectedCompanies ?? 0) || 0;

// ── SVG Icons ─────────────────────────────────────────────────
const Icon = {
  search: (
    <svg
      className="w-4 h-4"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      viewBox="0 0 24 24"
    >
      <circle cx="11" cy="11" r="8" />
      <path strokeLinecap="round" d="M21 21l-4.35-4.35" />
    </svg>
  ),
  close: (
    <svg
      className="w-5 h-5"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      viewBox="0 0 24 24"
    >
      <path strokeLinecap="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
  chevronDown: (
    <svg
      className="w-4 h-4"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      viewBox="0 0 24 24"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  ),
  check: (
    <svg
      className="w-3.5 h-3.5"
      fill="none"
      stroke="currentColor"
      strokeWidth={3}
      viewBox="0 0 24 24"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  ),
  students: (
    <svg
      className="w-5 h-5"
      fill="none"
      stroke={C.primary}
      strokeWidth={2}
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
      />
    </svg>
  ),
  placed: (
    <svg
      className="w-5 h-5"
      fill="none"
      stroke={C.success}
      strokeWidth={2}
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  ),
  notPlaced: (
    <svg
      className="w-5 h-5"
      fill="none"
      stroke={C.warning}
      strokeWidth={2}
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  ),
  cgpa: (
    <svg
      className="w-5 h-5"
      fill="none"
      stroke="#8B5CF6"
      strokeWidth={2}
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
      />
    </svg>
  ),
  user: (
    <svg
      className="w-5 h-5"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
      />
    </svg>
  ),
  mail: (
    <svg
      className="w-4 h-4"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
      />
    </svg>
  ),
  phone: (
    <svg
      className="w-4 h-4"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
      />
    </svg>
  ),
  building: (
    <svg
      className="w-4 h-4"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
      />
    </svg>
  ),
  location: (
    <svg
      className="w-4 h-4"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0zM15 11a3 3 0 11-6 0 3 3 0 016 0z"
      />
    </svg>
  ),
  filter: (
    <svg
      className="w-4 h-4"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
      />
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
        color: isPlaced ? "#15803D" : "#B45309",
        backgroundColor: isPlaced ? "#F0FDF4" : "#FFFBEB",
        borderColor: isPlaced ? "#86EFAC" : "#FDE68A",
      }}
      className={`inline-flex items-center gap-1.5 border font-semibold rounded-full ${pad}`}
    >
      <span
        style={{
          width: 7,
          height: 7,
          borderRadius: "50%",
          backgroundColor: isPlaced ? C.success : C.warning,
          display: "inline-block",
        }}
      />
      {status}
    </span>
  );
}

// ── Course Badge (used in the table) ────────────────────────
function CourseBadge({ course }) {
  return (
    <span
      style={{
        color: C.primary,
        backgroundColor: "#EFF6FF",
        borderColor: "#BFDBFE",
      }}
      className="border text-xs font-semibold px-2.5 py-1.5 rounded-full inline-flex items-center justify-center text-center leading-snug break-words max-w-full"
    >
      {course || "—"}
    </span>
  );
}

// ── Select / Filter pill (single-select) ────────────────────
function FilterSelect({ label, value, options, onChange, disabled = false }) {
  return (
    <div className="flex flex-col gap-1">
      <label
        style={{ color: C.textMuted }}
        className="text-[11px] font-semibold uppercase tracking-wider pl-0.5"
      >
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        style={{
          color: disabled ? C.textMuted : C.textMain,
          backgroundColor: disabled ? C.background : C.white,
          borderColor: C.border,
          outline: "none",
          cursor: disabled ? "not-allowed" : "pointer",
        }}
        className="border rounded-xl px-3 py-2 text-sm font-medium focus:ring-2 focus:ring-blue-200 transition"
      >
        {options.map((o) => (
          <option key={o.label || o} value={o.label || o}>
            {o.label || o}
          </option>
        ))}
      </select>
    </div>
  );
}

// ── Combined School+Course multi-select (accordion) ─────────
// Single dropdown, grouped by school.
// - Clicking a school row expands its courses; clicking another
//   school collapses the previous one (accordion — one open at a time).
// - Each school row has its own checkbox to select/deselect ALL of
//   that school's courses in one click.
// - The overall selection is still multi: courses from any number of
//   different schools can be ticked at the same time.
function SchoolGroupRow({
  group,
  selected,
  onToggleCourse,
  onToggleAll,
  isOpen,
  onToggleOpen,
}) {
  const checkboxRef = useRef(null);
  const selectedCount = group.courses.filter((c) =>
    selected.includes(c),
  ).length;
  const allSelected =
    selectedCount === group.courses.length && group.courses.length > 0;
  const someSelected = selectedCount > 0 && !allSelected;

  useEffect(() => {
    if (checkboxRef.current) checkboxRef.current.indeterminate = someSelected;
  }, [someSelected]);

  return (
    <div className="border-b last:border-b-0" style={{ borderColor: C.border }}>
      {/* School header row */}
      <div
        role="button"
        onClick={() => onToggleOpen(group.school)}
        style={{ backgroundColor: isOpen ? C.background : C.white }}
        className="flex items-center gap-2.5 px-3.5 py-2.5 cursor-pointer hover:bg-slate-50 transition select-none"
      >
        <input
          ref={checkboxRef}
          type="checkbox"
          checked={allSelected}
          onClick={(e) => e.stopPropagation()}
          onChange={() => onToggleAll(group)}
          style={{ accentColor: C.primary }}
          className="w-4 h-4 shrink-0 rounded cursor-pointer"
        />
        <span
          style={{ color: C.textMain }}
          className="text-sm font-bold flex-1 truncate"
        >
          {group.school}
        </span>
        {selectedCount > 0 && (
          <span
            style={{ color: C.primary, backgroundColor: "#EFF6FF" }}
            className="text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0"
          >
            {selectedCount}
          </span>
        )}
        <span
          style={{
            color: C.textMuted,
            transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.15s",
          }}
          className="shrink-0"
        >
          {Icon.chevronDown}
        </span>
      </div>

      {/* Courses (collapsible) */}
      {isOpen && (
        <div className="pb-1">
          {group.courses.map((opt) => {
            const isChecked = selected.includes(opt);
            return (
              <label
                key={`${group.school}-${opt}`}
                className="flex items-center gap-2.5 pl-9 pr-3.5 py-2 text-sm cursor-pointer hover:bg-slate-50 transition"
              >
                <span
                  style={{
                    backgroundColor: isChecked ? C.primary : C.white,
                    borderColor: isChecked ? C.primary : C.border,
                    color: C.white,
                  }}
                  className="w-4.5 h-4.5 shrink-0 rounded-md border flex items-center justify-center"
                >
                  {isChecked && Icon.check}
                </span>
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => onToggleCourse(opt)}
                  className="hidden"
                />
                <span style={{ color: C.textMain }} className="leading-tight">
                  {opt}
                </span>
              </label>
            );
          })}
        </div>
      )}
    </div>
  );
}

function CourseGroupSelectFilter({
  label = "Course",
  groups,
  selected,
  onChange,
  placeholder = "All courses",
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [openSchool, setOpenSchool] = useState(null); // accordion: one school expanded at a time
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
        setQuery("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const toggleOption = (opt) => {
    if (selected.includes(opt)) {
      onChange(selected.filter((o) => o !== opt));
    } else {
      onChange([...selected, opt]);
    }
  };

  // Select/deselect every course belonging to one school in one go.
  const toggleAllInSchool = (group) => {
    const selectedCount = group.courses.filter((c) =>
      selected.includes(c),
    ).length;
    const allSelected = selectedCount === group.courses.length;
    if (allSelected) {
      onChange(selected.filter((c) => !group.courses.includes(c)));
    } else {
      const merged = new Set([...selected, ...group.courses]);
      onChange(Array.from(merged));
    }
  };

  const toggleOpenSchool = (school) => {
    setOpenSchool((prev) => (prev === school ? null : school));
  };

  const summary =
    selected.length === 0
      ? placeholder
      : selected.length === 1
        ? selected[0]
        : `${selected.length} selected`;

  const filteredGroups = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return groups;
    return groups
      .map((g) => ({
        school: g.school,
        courses: g.courses.filter(
          (c) =>
            c.toLowerCase().includes(q) || g.school.toLowerCase().includes(q),
        ),
      }))
      .filter((g) => g.courses.length > 0);
  }, [groups, query]);

  // While searching, auto-expand every matching school so results are visible.
  const isSearching = query.trim().length > 0;

  return (
    <div className="flex flex-col gap-1 relative" ref={ref}>
      <label
        style={{ color: C.textMuted }}
        className="text-[11px] font-semibold uppercase tracking-wider pl-0.5"
      >
        {label}
      </label>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        style={{
          color: C.textMain,
          backgroundColor: C.white,
          borderColor: open ? C.primary : C.border,
          outline: "none",
          cursor: "pointer",
        }}
        className="border rounded-xl px-3 py-2 text-sm font-medium focus:ring-2 focus:ring-blue-200 transition flex items-center justify-between gap-2 min-w-[190px]"
      >
        <span
          className="truncate"
          style={{ color: selected.length > 0 ? C.primary : undefined }}
        >
          {summary}
        </span>
        <span style={{ color: C.textMuted }} className="shrink-0">
          {Icon.chevronDown}
        </span>
      </button>

      {open && (
        <div
          style={{ borderColor: C.border, backgroundColor: C.white }}
          className="absolute top-full left-0 mt-1.5 w-80 max-h-96 overflow-y-auto border rounded-xl shadow-lg z-20"
        >
          {/* Search within courses/schools */}
          <div
            style={{ borderColor: C.border }}
            className="px-2.5 py-2 sticky top-0 bg-white z-10 border-b"
          >
            <div className="relative">
              <span
                style={{ color: C.textMuted }}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
              >
                {Icon.search}
              </span>
              <input
                autoFocus
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search school or course..."
                style={{
                  color: C.textMain,
                  backgroundColor: C.background,
                  borderColor: C.border,
                  outline: "none",
                }}
                className="w-full border rounded-lg pl-8 pr-3 py-1.5 text-xs focus:ring-2 focus:ring-blue-200 transition"
              />
            </div>
            {selected.length > 0 && (
              <button
                type="button"
                onClick={() => onChange([])}
                style={{ color: C.danger }}
                className="mt-1.5 text-xs font-semibold hover:underline"
              >
                Clear selection ({selected.length})
              </button>
            )}
          </div>

          {filteredGroups.length === 0 ? (
            <p style={{ color: C.textMuted }} className="px-3.5 py-2.5 text-sm">
              No matching courses
            </p>
          ) : (
            filteredGroups.map((group) => (
              <SchoolGroupRow
                key={group.school}
                group={group}
                selected={selected}
                onToggleCourse={toggleOption}
                onToggleAll={toggleAllInSchool}
                isOpen={isSearching ? true : openSchool === group.school}
                onToggleOpen={toggleOpenSchool}
              />
            ))
          )}
        </div>
      )}
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
      <div
        style={{ backgroundColor: bg }}
        className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
      >
        {icon}
      </div>
      <div>
        <p style={{ color: C.textMuted }} className="text-xs font-medium">
          {label}
        </p>
        <p
          style={{ color: C.textMain }}
          className="text-2xl font-bold leading-tight"
        >
          {value}
        </p>
      </div>
    </div>
  );
}

// ── Student Detail Modal ──────────────────────────────────────
function StudentModal({ student, onClose }) {
  if (!student) return null;

  const InfoRow = ({ icon, label, value }) => (
    <div className="flex items-start gap-3">
      <div style={{ color: C.textMuted }} className="mt-0.5 shrink-0">
        {icon}
      </div>
      <div>
        <p
          style={{ color: C.textMuted }}
          className="text-xs font-medium mb-0.5"
        >
          {label}
        </p>
        <p style={{ color: C.textMain }} className="text-sm font-semibold">
          {value || "—"}
        </p>
      </div>
    </div>
  );

  const Section = ({ title, children }) => (
    <div>
      <h4
        style={{ color: C.textMain, borderColor: C.border }}
        className="text-xs font-bold uppercase tracking-widest mb-4 pb-2 border-b"
      >
        {title}
      </h4>
      <div className="grid grid-cols-2 gap-4">{children}</div>
    </div>
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{
        backgroundColor: "rgba(15,23,42,0.5)",
        backdropFilter: "blur(4px)",
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        style={{
          backgroundColor: C.white,
          borderColor: C.border,
          maxHeight: "90vh",
        }}
        className="rounded-3xl border shadow-2xl w-full max-w-2xl overflow-y-auto"
      >
        {/* Modal Header */}
        <div
          style={{ borderColor: C.border }}
          className="flex items-center justify-between px-7 py-5 border-b sticky top-0 bg-white rounded-t-3xl z-10"
        >
          <div className="flex items-center gap-4">
            <div
              style={{
                background: `linear-gradient(135deg, ${C.primary}, ${C.accent})`,
              }}
              className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold text-lg shrink-0"
            >
              {student.name.charAt(0)}
            </div>
            <div>
              <h2 style={{ color: C.textMain }} className="text-xl font-bold">
                {student.name}
              </h2>
              <p style={{ color: C.textMuted }} className="text-sm">
                {getStudentErpId(student)} · {getStudentCourse(student)} · Batch{" "}
                {student.batch}
              </p>
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
            <InfoRow icon={Icon.mail} label="Email" value={student.email} />
            <InfoRow icon={Icon.phone} label="Phone" value={student.phone} />
            <InfoRow icon={Icon.user} label="Gender" value={student.gender} />
            <InfoRow
              icon={Icon.location}
              label="Address"
              value={student.address}
            />
          </Section>

          {/* Academic Info */}
          <Section title="Academic Details">
            <InfoRow
              icon={Icon.building}
              label="Course"
              value={getStudentCourse(student)}
            />
            <InfoRow icon={Icon.cgpa} label="Batch" value={student.batch} />
            <InfoRow
              icon={
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
              }
              label="CGPA"
              value={(student.cgpa ?? 0).toFixed(1)}
            />
            <InfoRow
              icon={
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              }
              label="Backlogs"
              value={student.backlogs === 0 ? "None" : student.backlogs}
            />
          </Section>

          {/* Skills */}
          <div>
            <h4
              style={{ color: C.textMain, borderColor: C.border }}
              className="text-xs font-bold uppercase tracking-widest mb-4 pb-2 border-b"
            >
              Skills
            </h4>
            <div className="flex flex-wrap gap-2">
              {student.skills.map((skill) => (
                <span
                  key={skill}
                  style={{
                    color: C.primary,
                    backgroundColor: "#EFF6FF",
                    borderColor: "#BFDBFE",
                  }}
                  className="border text-xs font-semibold px-3 py-1.5 rounded-full"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>

          {/* Placement Info */}
          {student.placementStatus === "Placed" && (
            <div>
              <h4
                style={{ color: C.textMain, borderColor: C.border }}
                className="text-xs font-bold uppercase tracking-widest mb-4 pb-2 border-b"
              >
                Placement Details
              </h4>
              <div
                style={{ backgroundColor: "#F0FDF4", borderColor: "#86EFAC" }}
                className="rounded-2xl border p-5 grid grid-cols-3 gap-4"
              >
                <div>
                  <p
                    style={{ color: "#64748B" }}
                    className="text-xs font-medium mb-1"
                  >
                    Company
                  </p>
                  <p
                    style={{ color: "#15803D" }}
                    className="font-bold text-base"
                  >
                    {student.company}
                  </p>
                </div>
                <div>
                  <p
                    style={{ color: "#64748B" }}
                    className="text-xs font-medium mb-1"
                  >
                    CTC
                  </p>
                  <p
                    style={{ color: "#15803D" }}
                    className="font-bold text-base"
                  >
                    {student.ctc}
                  </p>
                </div>
                <div>
                  <p
                    style={{ color: "#64748B" }}
                    className="text-xs font-medium mb-1"
                  >
                    Offer Date
                  </p>
                  <p
                    style={{ color: "#15803D" }}
                    className="font-bold text-base"
                  >
                    {student.offerDate}
                  </p>
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
  const [search, setSearch] = useState("");
  // Combined school+course multi-select: coordinator can tick courses
  // from any number of different schools at the same time.
  const [selectedCourses, setSelectedCourses] = useState([]);
  const [batch, setBatch] = useState("All");
  const [cgpaRange, setCgpaRange] = useState("All");
  const [placement, setPlacement] = useState("All");
  const [selected, setSelected] = useState(null);
  const [selectedIn, setSelectedIn] = useState("All");
  const [students, setStudents] = useState([]);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStudents = async () => {
      const data = await api.get("/students");
      setStudents(Array.isArray(data) ? data : []);
      setLoading(false);
    };
    fetchStudents();
  }, []);

  const handleImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImporting(true);
    setImportResult(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const token = localStorage.getItem("token");
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/students/bulk-import`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        },
      );
      const data = await res.json();
      setImportResult(data);
      // Students refresh karo
      const updated = await api.get("/students");
      setStudents(Array.isArray(updated) ? updated : []);
    } catch (err) {
      setImportResult({ error: "Import failed" });
    }
    setImporting(false);
  };

  const handleExport = async () => {
    const token = localStorage.getItem("token");
    const res = await fetch(`${import.meta.env.VITE_API_URL}/students/export`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "students.xlsx";
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const cgpaOpt = useMemo(
    () => CGPA_RANGES.find((r) => r.label === cgpaRange) || CGPA_RANGES[0],
    [cgpaRange],
  );

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();

    return students.filter((s) => {
      const studentName = String(s.name || "").toLowerCase();
      const studentErpId = String(getStudentErpId(s)).toLowerCase();
      const studentCourse = String(getStudentCourse(s)).toLowerCase();

      if (q && !studentName.includes(q) && !studentErpId.includes(q)) {
        return false;
      }

      if (
        selectedCourses.length > 0 &&
        !selectedCourses.some(
          (option) => option.toLowerCase() === studentCourse,
        )
      ) {
        return false;
      }

      if (batch !== "All" && String(s.batch) !== batch) return false;

      const numericCgpa = Number(s.cgpa);
      if (cgpaRange !== "All") {
        if (!Number.isFinite(numericCgpa) || numericCgpa <= 0) return false;
        if (numericCgpa < cgpaOpt.min || numericCgpa > cgpaOpt.max)
          return false;
      }

      const normalizedPlacement = getPlacementStatus(s);
      if (placement !== "All" && normalizedPlacement !== placement)
        return false;

      if (selectedIn !== "All") {
        const count = getSelectedCompanyCount(s);
        if (selectedIn === "0 companies" && count !== 0) return false;
        if (selectedIn === "1 company" && count !== 1) return false;
        if (selectedIn === "2 companies" && count !== 2) return false;
        if (selectedIn === "3+ companies" && count < 3) return false;
      }

      return true;
    });
  }, [
    students,
    search,
    selectedCourses,
    batch,
    cgpaOpt,
    placement,
    selectedIn,
  ]);

  const total = students.length;
  const placed = students.filter(
    (s) => getPlacementStatus(s) === "Placed",
  ).length;
  const avgCgpa =
    total > 0
      ? (students.reduce((a, s) => a + (s.cgpa || 0), 0) / total).toFixed(2)
      : "0.00";

  const hasFilters =
    search ||
    selectedCourses.length > 0 ||
    batch !== "All" ||
    cgpaRange !== "All" ||
    placement !== "All" ||
    selectedIn !== "All";

  const resetFilters = () => {
    setSearch("");
    setSelectedCourses([]);
    setBatch("All");
    setCgpaRange("All");
    setPlacement("All");
    setSelectedIn("All");
  };

  return (
    <div
      style={{ backgroundColor: C.background }}
      className="min-h-screen p-6 space-y-6"
    >
      {/* ── Page Title ── */}
      <div className="flex items-center justify-between">
        {/* Left Side */}
        <div>
          <h1 style={{ color: C.textMain }} className="text-2xl font-bold">
            Student Database
          </h1>

          <p style={{ color: C.textMuted }} className="text-sm mt-0.5">
            Manage and track placement status of all registered students.
          </p>
        </div>

        {/* Right Side - Import / Export */}
        <div className="flex flex-col items-end gap-2">
          <p className="text-xs text-[#64748B] text-right">
            Import new student database or export current database to Excel
          </p>

          <div className="flex items-center gap-3">
            {importResult && (
              <span
                className={`text-xs font-medium ${
                  importResult.error ? "text-red-500" : "text-green-600"
                }`}
              >
                {importResult.error
                  ? `❌ ${importResult.error}`
                  : `✓ ${importResult.imported} imported, ${importResult.skipped} skipped`}
              </span>
            )}

            <label
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold cursor-pointer transition
      ${
        importing
          ? "bg-slate-200 text-slate-400 cursor-not-allowed"
          : "bg-slate-900 hover:bg-blue-600 text-white"
      }`}
            >
              <Upload size={14} />
              {importing ? "Importing..." : "Import CSV"}

              <input
                type="file"
                accept=".csv,.xlsx"
                className="hidden"
                onChange={handleImport}
                disabled={importing}
              />
            </label>

            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-slate-100 hover:bg-slate-200 text-slate-900 border border-slate-300 transition"
            >
              <Download size={14} />
              Export Excel
            </button>
          </div>
        </div>
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
      <div
        style={{ backgroundColor: C.white, borderColor: C.border }}
        className="rounded-2xl border p-5 shadow-sm"
      >
        <div className="flex flex-col gap-4">
          {/* Search bar */}
          <div className="relative">
            <span
              style={{ color: C.textMuted }}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
            >
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
            <div
              style={{ color: C.textMuted }}
              className="flex items-center gap-1.5 text-sm font-medium mr-1 mb-0.5"
            >
              {Icon.filter} Filters
            </div>

            {/* Combined School+Course filter (multi-select, cross-school) */}
            <CourseGroupSelectFilter
              label="Course"
              groups={COURSE_GROUPS}
              selected={selectedCourses}
              onChange={setSelectedCourses}
              placeholder="All courses"
            />

            <FilterSelect
              label="Batch"
              value={batch}
              options={BATCHES}
              onChange={setBatch}
            />
            <FilterSelect
              label="CGPA"
              value={cgpaRange}
              options={CGPA_RANGES.map((r) => r.label)}
              onChange={setCgpaRange}
            />
            <FilterSelect
              label="Status"
              value={placement}
              options={["All", "Placed", "Not Placed"]}
              onChange={setPlacement}
            />
            <FilterSelect
              label="Selected In"
              value={selectedIn}
              options={SELECTED_IN}
              onChange={setSelectedIn}
            />
            {hasFilters && (
              <button
                onClick={resetFilters}
                style={{
                  color: C.danger,
                  backgroundColor: "#FFF1F2",
                  borderColor: "#FECDD3",
                }}
                className="border text-xs font-semibold px-3 py-2 rounded-xl hover:opacity-80 transition self-end mb-0.5"
              >
                Clear Filters
              </button>
            )}
            <span
              style={{ color: C.textMuted }}
              className="ml-auto text-sm self-end mb-0.5"
            >
              Showing{" "}
              <strong style={{ color: C.textMain }}>{filtered.length}</strong>{" "}
              of {total} students
            </span>
          </div>

          {/* Selected course chips */}
          {selectedCourses.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-1">
              {selectedCourses.map((c) => (
                <span
                  key={c}
                  style={{
                    color: C.primary,
                    backgroundColor: "#EFF6FF",
                    borderColor: "#BFDBFE",
                  }}
                  className="border text-xs font-semibold pl-3 pr-2 py-1.5 rounded-full inline-flex items-center gap-1.5"
                >
                  {c}
                  <button
                    onClick={() =>
                      setSelectedCourses((prev) => prev.filter((x) => x !== c))
                    }
                    style={{ color: C.primary }}
                    className="hover:opacity-70 transition"
                    aria-label={`Remove ${c}`}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Table ── */}
      <div
        style={{ backgroundColor: C.white, borderColor: C.border }}
        className="rounded-2xl border shadow-sm overflow-hidden"
      >
        {/* Table Header */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "2fr 1fr 1.4fr 0.8fr 0.7fr 0.7fr 1.2fr 1.2fr",
            padding: "14px 24px",
            borderBottom: `1px solid ${C.border}`,
            backgroundColor: C.background,
          }}
        >
          {[
            "Name",
            "ERP ID",
            "Course",
            "Batch",
            "CGPA",
            "Backlogs",
            "Selected In",
            "Status",
          ].map((h) => (
            <span
              key={h}
              style={{ color: C.textMuted }}
              className="text-[11px] font-bold uppercase tracking-wider"
            >
              {h}
            </span>
          ))}
        </div>

        {/* Rows */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <p style={{ color: C.textMuted }} className="text-sm font-medium">
              Loading students…
            </p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <svg
              className="w-12 h-12"
              fill="none"
              stroke={C.border}
              strokeWidth={1.5}
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <p style={{ color: C.textMuted }} className="text-sm font-medium">
              No students found matching your filters.
            </p>
            <button
              onClick={resetFilters}
              style={{ color: C.primary }}
              className="text-sm font-semibold hover:underline"
            >
              Clear all filters
            </button>
          </div>
        ) : (
          filtered.map((student, idx) => {
            const isLast = idx === filtered.length - 1;
            return (
              <div
                key={student._id}
                onClick={() => setSelected(student)}
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "2fr 1fr 1.4fr 0.8fr 0.7fr 0.7fr 1.2fr 1.2fr",
                  alignItems: "center",
                  padding: "16px 24px",
                  borderBottom: isLast ? "none" : `1px solid ${C.border}`,
                  cursor: "pointer",
                  transition: "background 0.15s",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.backgroundColor = "#F8FAFC")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.backgroundColor = C.white)
                }
              >
                {/* Name */}
                <div className="flex items-center gap-3">
                  <div
                    style={{
                      background: `linear-gradient(135deg, ${C.primary}, ${C.accent})`,
                    }}
                    className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-sm shrink-0"
                  >
                    {student.name.charAt(0)}
                  </div>
                  <div>
                    <p
                      style={{ color: C.textMain }}
                      className="font-semibold text-sm leading-tight"
                    >
                      {student.name}
                    </p>
                    <p style={{ color: C.textMuted }} className="text-xs">
                      {student.email}
                    </p>
                  </div>
                </div>

                {/* ERP ID */}
                <span
                  style={{ color: C.textMuted }}
                  className="text-sm font-mono"
                >
                  {getStudentErpId(student)}
                </span>

                {/* Course */}
                <CourseBadge course={getStudentCourse(student)} />

                {/* Batch */}
                <span style={{ color: C.textMuted }} className="text-sm">
                  {student.batch}
                </span>

                {/* CGPA */}
                <span
                  style={{
                    color:
                      student.cgpa >= 8.5
                        ? "#15803D"
                        : student.cgpa >= 7
                          ? C.textMain
                          : C.danger,
                    fontWeight: 700,
                  }}
                  className="text-sm"
                >
                  {(student.cgpa ?? 0).toFixed(1)}
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
                {/* Selected In */}
                <div className="flex flex-wrap gap-1">
                  {getSelectedCompanyCount(student) === 0 ? (
                    <span style={{ color: C.textMuted }} className="text-sm">
                      —
                    </span>
                  ) : (
                    <span
                      style={{
                        color: "#15803D",
                        backgroundColor: "#F0FDF4",
                        borderColor: "#86EFAC",
                      }}
                      className="border text-xs font-semibold px-2 py-0.5 rounded-full"
                    >
                      {getSelectedCompanyCount(student)}{" "}
                      {getSelectedCompanyCount(student) === 1
                        ? "company"
                        : "companies"}
                    </span>
                  )}
                </div>
                {/* Status */}
                <StatusBadge status={getPlacementStatus(student)} />
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
