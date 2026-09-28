import * as XLSX from "xlsx";
import { useState, useMemo, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../utils/api";
import universityStructure from "../../data/universityStructure";
import { Download, Upload } from "lucide-react";
import { getSemester } from "../../utils/semester";
import { useIsReadOnly } from "../../utils/useIsReadOnly";
import { sendWhatsAppMessage } from "../../utils/whatsapp";
// ── Design Tokens ─────────────────────────────────────────────
const C = {
  primary: "#1a3a8f",
  accent: "#3d1a6e",
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
const SEMESTERS = ["All", "1", "2", "3", "4", "5", "6", "7", "8"];
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
      className="border text-xs font-semibold px-2.5 py-1.5 rounded-full inline-flex items-center justify-center text-center leading-snug wrap-break-word max-w-full"
    >
      {course || "—"}
    </span>
  );
}

// ── Select / Filter pill (single-select) ────────────────────
function FilterSelect({ label, value, options, onChange, disabled = false }) {
  return (
    <div className="flex flex-col gap-1 flex-1 min-w-[46%] sm:min-w-0 sm:flex-none">
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
        className="border rounded-xl px-3 py-2 text-sm font-medium focus:ring-2 focus:ring-blue-200 transition w-full sm:w-auto"
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
    <div className="flex flex-col gap-1 relative w-full sm:w-auto" ref={ref}>
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
        className="border rounded-xl px-3 py-2 text-sm font-medium focus:ring-2 focus:ring-blue-200 transition flex items-center justify-between gap-2 w-full sm:min-w-47.5 sm:w-auto"
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
          className="absolute top-full left-0 mt-1.5 w-[92vw] max-w-[92vw] sm:w-80 sm:max-w-none max-h-96 overflow-y-auto border rounded-xl shadow-lg z-20"
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
      className="rounded-2xl border p-3 sm:p-5 flex items-center gap-3 sm:gap-4 shadow-sm"
    >
      <div
        style={{ backgroundColor: bg }}
        className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center shrink-0"
      >
        {icon}
      </div>
      <div>
        <p style={{ color: C.textMuted }} className="text-xs font-medium">
          {label}
        </p>
        <p
          style={{ color: C.textMain }}
          className="text-lg sm:text-2xl font-bold leading-tight"
        >
          {value}
        </p>
      </div>
    </div>
  );
}

function ImportingLabel({ estimatedTime, importStart }) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - importStart) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [importStart]);

  const remaining = Math.max(0, estimatedTime - elapsed);

  return (
    <span className="flex items-center gap-1.5">
      <svg
        className="animate-spin w-3.5 h-3.5 shrink-0"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8v8z"
        />
      </svg>
      {remaining > 0 ? `~${remaining}s left` : "Almost done..."}
    </span>
  );
}
// ── CGPA Import ────────────────────────────────────────────────────────

function parseCgpaExcel(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const wb = XLSX.read(e.target.result, { type: "array" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(ws, { defval: "" });
        const normalized = rows.map((r) => {
          const obj = {};
          Object.keys(r).forEach((k) => {
            obj[k.trim().toLowerCase()] = r[k];
          });
          return obj;
        });
        resolve(normalized);
      } catch (err) {
        reject(err);
      }
    };
    reader.readAsArrayBuffer(file);
  });
}
// ── Student Detail Modal ──────────────────────────────────────
function StudentModal({ student, onClose }) {
  const navigate = useNavigate();
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
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">{children}</div>
    </div>
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4"
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
          className="flex items-start justify-between gap-2 px-4 sm:px-7 py-4 sm:py-5 border-b sticky top-0 bg-white rounded-t-3xl z-10"
        >
          {/* Left: avatar + name */}
          <div className="flex items-center gap-3 min-w-0">
            <div
              style={{
                background: `linear-gradient(135deg, ${C.primary}, ${C.accent})`,
              }}
              className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center text-white font-bold text-base sm:text-lg shrink-0"
            >
              {student.name.charAt(0)}
            </div>
            <div className="min-w-0">
              <h2
                style={{ color: C.textMain }}
                className="text-base sm:text-xl font-bold leading-tight truncate"
              >
                {student.name}
              </h2>
              <p
                style={{ color: C.textMuted }}
                className="text-xs sm:text-sm truncate"
              >
                {getStudentErpId(student)} · {getStudentCourse(student)} · Batch{" "}
                {student.batch}
              </p>
              {/* Status badge — mobile mein naam ke neeche */}
              <div className="mt-1 sm:hidden">
                <StatusBadge status={student.placementStatus} />
              </div>
            </div>
          </div>

          {/* Right: status + action buttons + close */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 flex-wrap justify-end">
            {/* Status badge — sirf desktop pe yahan dikhao */}
            <div className="hidden sm:block">
              <StatusBadge status={student.placementStatus} size="lg" />
            </div>

            {student.phone && (
              <button
                onClick={() => sendWhatsAppMessage(student.phone, "")}
                style={{ backgroundColor: "#22C55E", color: C.white }}
                className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 sm:py-2 rounded-xl text-xs font-semibold hover:opacity-90 transition"
              >
                <svg
                  className="w-3.5 h-3.5 shrink-0"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
                  <path d="M12 0C5.373 0 0 5.373 0 12c0 2.124.558 4.115 1.535 5.84L.057 23.428a.5.5 0 00.609.61l5.652-1.463A11.945 11.945 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.9a9.878 9.878 0 01-5.031-1.378l-.36-.214-3.733.966.994-3.637-.235-.374A9.861 9.861 0 012.1 12C2.1 6.533 6.533 2.1 12 2.1c5.467 0 9.9 4.433 9.9 9.9 0 5.467-4.433 9.9-9.9 9.9z" />
                </svg>
                <span className="hidden sm:inline">WhatsApp</span>
              </button>
            )}

            <button
              onClick={() => {
                onClose();
                navigate(`/coordinator/students/${student._id}`);
              }}
              style={{ backgroundColor: C.primary, color: C.white }}
              className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 sm:py-2 rounded-xl text-xs font-semibold hover:opacity-90 transition"
            >
              <svg
                className="w-3.5 h-3.5 shrink-0"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                />
              </svg>
              <span className="hidden sm:inline">View Full Profile</span>
            </button>

            <button
              onClick={onClose}
              style={{ color: C.textMuted, backgroundColor: C.background }}
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center hover:opacity-80 transition shrink-0"
            >
              {Icon.close}
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="px-4 sm:px-7 py-5 sm:py-6 space-y-6 sm:space-y-7">
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
          {/* About */}
          {student.about && (
            <div>
              <h4
                style={{ color: C.textMain, borderColor: C.border }}
                className="text-xs font-bold uppercase tracking-widest mb-4 pb-2 border-b"
              >
                About
              </h4>
              <p
                style={{ color: C.textMuted }}
                className="text-sm leading-relaxed"
              >
                {student.about}
              </p>
              {student.linkedinUrl && (
                <a
                  href={student.linkedinUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 mt-3 text-xs font-medium text-primary hover:underline"
                >
                  View LinkedIn Profile →
                </a>
              )}
            </div>
          )}
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
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              }
              label="Current Semester"
              value={
                getSemester(student.batch, student.course)
                  ? `Semester ${getSemester(student.batch, student.course)}`
                  : "—"
              }
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
              {(student.skills || []).length === 0 ? (
                <span style={{ color: C.textMuted }} className="text-sm">
                  No skills added yet
                </span>
              ) : (
                (student.skills || []).map((skill) => (
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
                ))
              )}
            </div>
          </div>

          {/* Placement Info — shows EVERY company the student is selected
              in, not just the first one. A student can have multiple
              offers, so each gets its own card instead of overwriting
              the previous one. */}
          {student.placementStatus === "Placed" &&
            Array.isArray(student.selectedCompanies) &&
            student.selectedCompanies.length > 0 && (
              <div>
                <h4
                  style={{ color: C.textMain, borderColor: C.border }}
                  className="text-xs font-bold uppercase tracking-widest mb-4 pb-2 border-b flex items-center justify-between"
                >
                  <span>Placement Details</span>
                  {student.selectedCompanies.length > 1 && (
                    <span
                      style={{ color: C.primary, backgroundColor: "#EFF6FF" }}
                      className="text-[10px] font-bold px-2 py-0.5 rounded-full normal-case tracking-normal"
                    >
                      {student.selectedCompanies.length} offers
                    </span>
                  )}
                </h4>
                <div className="flex flex-col gap-3">
                  {student.selectedCompanies.map((offer, idx) => (
                    <div
                      key={offer._id || offer.companyId?._id || idx}
                      style={{
                        backgroundColor: "#F0FDF4",
                        borderColor: "#86EFAC",
                      }}
                      className="rounded-2xl border p-4 sm:p-5 grid grid-cols-1 sm:grid-cols-3 gap-4"
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
                          {offer?.companyId?.name || "—"}
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
                          {offer?.ctc ? `₹${offer.ctc} LPA` : "—"}
                        </p>
                      </div>
                      <div>
                        <p
                          style={{ color: "#64748B" }}
                          className="text-xs font-medium mb-1"
                        >
                          Selected Date
                        </p>
                        <p
                          style={{ color: "#15803D" }}
                          className="font-bold text-base"
                        >
                          {offer?.lastDate
                            ? new Date(offer.lastDate).toLocaleDateString(
                                "en-GB",
                              )
                            : "—"}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
        </div>
      </div>
    </div>
  );
}
function CgpaImportModal({
  matches,
  setMatches,
  students,
  onClose,
  onConfirm,
  updating,
  updateResult,
}) {
  const confident = matches.filter((m) => m.status === "confident");
  const review = matches.filter((m) => m.status === "review");

  const handleManualSelect = (idx, studentId) => {
    setMatches((prev) =>
      prev.map((m, i) =>
        i === idx ? { ...m, selectedStudentId: studentId } : m,
      ),
    );
  };

  const selectedCount = matches.filter(
    (m) =>
      m.status === "confident" ||
      (m.status === "review" && m.selectedStudentId),
  ).length;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4"
      style={{
        backgroundColor: "rgba(15,23,42,0.6)",
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
        className="rounded-3xl border shadow-2xl w-full max-w-3xl flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div
          style={{ borderColor: C.border }}
          className="flex items-center justify-between px-6 py-4 border-b shrink-0"
        >
          <div>
            <h2 style={{ color: C.textMain }} className="text-lg font-bold">
              CGPA Import Preview
            </h2>
            <p style={{ color: C.textMuted }} className="text-xs mt-0.5">
              Review matches before applying changes to the database.
            </p>
          </div>
          <button
            onClick={onClose}
            style={{ color: C.textMuted, backgroundColor: C.background }}
            className="w-9 h-9 rounded-xl flex items-center justify-center hover:opacity-80 transition shrink-0"
          >
            {Icon.close}
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-6">
          {/* Confident Matches */}
          {confident.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span
                  style={{
                    backgroundColor: "#F0FDF4",
                    borderColor: "#86EFAC",
                    color: "#15803D",
                  }}
                  className="border text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1.5"
                >
                  <span
                    style={{
                      width: 7,
                      height: 7,
                      borderRadius: "50%",
                      backgroundColor: C.success,
                      display: "inline-block",
                    }}
                  />
                  Confident Matches — {confident.length}
                </span>
                <span style={{ color: C.textMuted }} className="text-xs">
                  Auto-selected · will update directly
                </span>
              </div>
              <div
                style={{ borderColor: C.border }}
                className="rounded-2xl border overflow-hidden"
              >
                {confident.map((m, i) => (
                  <div
                    key={i}
                    style={{
                      borderColor: C.border,
                      backgroundColor: i % 2 === 0 ? C.white : C.background,
                    }}
                    className="grid grid-cols-4 gap-3 px-4 py-3 text-sm border-b last:border-b-0 items-center"
                  >
                    <span
                      style={{ color: C.textMain }}
                      className="font-semibold truncate"
                    >
                      {m.student.name}
                    </span>
                    <span
                      style={{ color: C.textMuted }}
                      className="font-mono text-xs"
                    >
                      {getStudentErpId(m.student)}
                    </span>
                    <span
                      style={{ color: C.textMuted }}
                      className="text-xs truncate"
                    >
                      {getStudentCourse(m.student)}
                    </span>
                    <div className="flex items-center gap-2">
                      <span
                        style={{ color: C.textMuted }}
                        className="text-xs line-through"
                      >
                        {(m.student.cgpa ?? 0).toFixed(2)}
                      </span>
                      <span>→</span>
                      <span style={{ color: "#15803D", fontWeight: 700 }}>
                        {Number(m.row.cgpa).toFixed(2)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Review Needed */}
          {review.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span
                  style={{
                    backgroundColor: "#FFFBEB",
                    borderColor: "#FDE68A",
                    color: "#B45309",
                  }}
                  className="border text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1.5"
                >
                  <span
                    style={{
                      width: 7,
                      height: 7,
                      borderRadius: "50%",
                      backgroundColor: C.warning,
                      display: "inline-block",
                    }}
                  />
                  Review Needed — {review.length}
                </span>
                <span style={{ color: C.textMuted }} className="text-xs">
                  Select correct student manually
                </span>
              </div>
              <div className="space-y-3">
                {review.map((m, i) => {
                  const globalIdx = matches.findIndex((x) => x === m);
                  return (
                    <div
                      key={i}
                      style={{
                        borderColor: "#FDE68A",
                        backgroundColor: "#FFFBEB",
                      }}
                      className="rounded-2xl border p-4"
                    >
                      <div className="flex items-start justify-between gap-3 flex-wrap mb-3">
                        <div>
                          <p
                            style={{ color: "#B45309" }}
                            className="text-xs font-bold uppercase tracking-wider mb-1"
                          >
                            From Excel
                          </p>
                          <p
                            style={{ color: C.textMain }}
                            className="text-sm font-semibold"
                          >
                            {String(m.row.name || "—")}
                          </p>
                          <p
                            style={{ color: C.textMuted }}
                            className="text-xs font-mono"
                          >
                            {String(
                              m.row["erp id"] ||
                                m.row.erpid ||
                                m.row.erp ||
                                "—",
                            )}
                          </p>
                        </div>
                        <div className="text-right">
                          <p
                            style={{ color: C.textMuted }}
                            className="text-xs mb-0.5"
                          >
                            New CGPA
                          </p>
                          <p
                            style={{ color: "#B45309", fontWeight: 700 }}
                            className="text-base"
                          >
                            {Number(m.row.cgpa).toFixed(2)}
                          </p>
                        </div>
                      </div>
                      <label
                        style={{ color: C.textMuted }}
                        className="text-[11px] font-semibold uppercase tracking-wider block mb-1.5"
                      >
                        Select Correct Student
                      </label>
                      <select
                        value={m.selectedStudentId || ""}
                        onChange={(e) =>
                          handleManualSelect(globalIdx, e.target.value)
                        }
                        style={{
                          borderColor: C.border,
                          color: C.textMain,
                          backgroundColor: C.white,
                          outline: "none",
                        }}
                        className="w-full border rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-200 transition"
                      >
                        <option value="">— Skip this row —</option>
                        {students.map((s) => (
                          <option key={s._id} value={s._id}>
                            {s.name} · {getStudentErpId(s)} ·{" "}
                            {getStudentCourse(s)}
                          </option>
                        ))}
                      </select>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {confident.length === 0 && review.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <p style={{ color: C.textMuted }} className="text-sm font-medium">
                No valid rows found in the file.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{ borderColor: C.border, backgroundColor: C.background }}
          className="px-6 py-4 border-t flex items-center justify-between gap-3 flex-wrap shrink-0"
        >
          <div>
            {updateResult && (
              <span
                style={{ color: updateResult.error ? C.danger : "#15803D" }}
                className="text-sm font-semibold"
              >
                {updateResult.error
                  ? `❌ ${updateResult.error}`
                  : `✓ ${updateResult.updated} students updated successfully`}
              </span>
            )}
            {!updateResult && (
              <span style={{ color: C.textMuted }} className="text-sm">
                <strong style={{ color: C.textMain }}>{selectedCount}</strong>{" "}
                students will be updated
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              style={{
                color: C.textMuted,
                borderColor: C.border,
                backgroundColor: C.white,
              }}
              className="border px-4 py-2 rounded-xl text-sm font-semibold hover:opacity-80 transition"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={updating || selectedCount === 0}
              style={{
                backgroundColor: selectedCount === 0 ? C.border : C.primary,
                color: C.white,
                cursor: selectedCount === 0 ? "not-allowed" : "pointer",
              }}
              className="px-5 py-2 rounded-xl text-sm font-semibold transition flex items-center gap-2"
            >
              {updating && (
                <svg
                  className="animate-spin w-3.5 h-3.5"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v8z"
                  />
                </svg>
              )}
              {updating
                ? "Updating…"
                : `Update ${selectedCount} Students' CGPA`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────
export default function StudentDatabasePage() {
  const isReadOnly = useIsReadOnly();
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
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const observerRef = useRef(null);
  const sentinelRef = useRef(null);
  const [importing, setImporting] = useState(false);
  const [estimatedTime, setEstimatedTime] = useState(null);
  const [importStart, setImportStart] = useState(null);
  const [importResult, setImportResult] = useState(null);
  const [semester, setSemester] = useState("All");
  const [cgpaImportModal, setCgpaImportModal] = useState(false);
  const [cgpaImportRows, setCgpaImportRows] = useState([]);
  const [cgpaMatches, setCgpaMatches] = useState([]);
  const [cgpaUpdating, setCgpaUpdating] = useState(false);
  const [cgpaUpdateResult, setCgpaUpdateResult] = useState(null);
  const [cgpaAllStudents, setCgpaAllStudents] = useState([]);
  const [cgpaFileLoading, setCgpaFileLoading] = useState(false);
  useEffect(() => {
    document.title = "Manage Students Database — PlaceRise";

    const fetchInitial = async () => {
      setLoading(true);
      const data = await api.get("/students?page=1&limit=50");
      setStudents(Array.isArray(data.students) ? data.students : []);
      setTotalCount(data.totalCount || 0);
      setHasMore(data.hasMore || false);
      setPage(1);
      setLoading(false);
    };

    fetchInitial();
  }, []);

  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect();

    observerRef.current = new IntersectionObserver(
      async (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore && !loading) {
          setLoadingMore(true);
          const nextPage = page + 1;
          const data = await api.get(`/students?page=${nextPage}&limit=50`);
          setStudents((prev) => [
            ...prev,
            ...(Array.isArray(data.students) ? data.students : []),
          ]);
          setHasMore(data.hasMore || false);
          setPage(nextPage);
          setLoadingMore(false);
        }
      },
      { threshold: 0.1 },
    );

    if (sentinelRef.current) {
      observerRef.current.observe(sentinelRef.current);
    }

    return () => {
      if (observerRef.current) observerRef.current.disconnect();
    };
  }, [hasMore, loadingMore, loading, page]);

  const handleImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const estimatedSeconds = Math.max(
      15,
      Math.round((file.size / 1024) * 0.78),
    );
    setEstimatedTime(estimatedSeconds);
    setImportStart(Date.now());
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
      const updated = await api.get("/students?page=1&limit=50");
      setStudents(Array.isArray(updated.students) ? updated.students : []);
      setTotalCount(updated.totalCount || 0);
      setHasMore(updated.hasMore || false);
      setPage(1);
    } catch (err) {
      setImportResult({ error: "Import failed" });
    }
    setImporting(false);
    setEstimatedTime(null);
    setImportStart(null);
  };

  const handleExport = () => {
    const exportData = filtered.map((s) => ({
      Name: s.name,
      "ERP ID": s.userId?.erpId || "",
      Email: s.email || "",
      Phone: s.phone || "",
      School: s.school || "",
      Course: s.course || "",
      Batch: s.batch || "",
      CGPA: s.cgpa || "",
      Backlogs: s.backlogs ?? 0,
      "Placement Status": s.placementStatus || "Not Placed",
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Students");
    const fileName = `students_${filtered.length}_${new Date().toLocaleDateString("en-IN").replace(/\//g, "-")}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };
  const handleCgpaFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    e.target.value = "";
    setCgpaFileLoading(true);
    try {
      const rows = await parseCgpaExcel(file);

      // Pagination se load hue students ki jagah, DB ke SAARE students
      // ek baar fetch karo — CGPA match total students se hona chahiye,
      // sirf page pe jitne load hain unse nahi.
      const allData = await api.get("/students?page=1&limit=100000");
      const allStudents = Array.isArray(allData.students)
        ? allData.students
        : [];
      setCgpaAllStudents(allStudents);

      const matched = rows
        .filter((r) => r.cgpa !== "" && r.cgpa !== undefined)
        .map((r) => {
          const erpFromRow = String(r["erp id"] || r.erpid || r.erp || "")
            .trim()
            .toLowerCase();
          const nameFromRow = String(r.name || "")
            .trim()
            .toLowerCase();
          const byErp = allStudents.find(
            (s) =>
              String(getStudentErpId(s)).trim().toLowerCase() === erpFromRow &&
              erpFromRow !== "",
          );
          if (byErp)
            return {
              row: r,
              student: byErp,
              status: "confident",
              selectedStudentId: byErp._id,
            };
          const byName = allStudents.filter(
            (s) =>
              s.name.trim().toLowerCase() === nameFromRow && nameFromRow !== "",
          );
          if (byName.length === 1)
            return {
              row: r,
              student: byName[0],
              status: "confident",
              selectedStudentId: byName[0]._id,
            };
          return {
            row: r,
            student: null,
            status: "review",
            selectedStudentId: "",
          };
        });
      setCgpaImportRows(rows);
      setCgpaMatches(matched);
      setCgpaUpdateResult(null);
      setCgpaImportModal(true);
      setCgpaFileLoading(false);
    } catch (err) {
      alert("Could not parse file. Please check the format.");
      setCgpaFileLoading(false);
    }
  };
  const handleCgpaUpdate = async () => {
    setCgpaUpdating(true);
    setCgpaUpdateResult(null);
    try {
      const updates = cgpaMatches
        .filter((m) => m.selectedStudentId)
        .map((m) => ({
          studentId: m.selectedStudentId,
          cgpa: Number(m.row.cgpa),
        }));
      const token = localStorage.getItem("token");
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/students/bulk-cgpa-update`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ updates }),
        },
      );
      const data = await res.json();
      setCgpaUpdateResult(data);
      const updated = await api.get("/students?page=1&limit=50");
      setStudents(Array.isArray(updated.students) ? updated.students : []);
      setTotalCount(updated.totalCount || 0);
      setHasMore(updated.hasMore || false);
      setPage(1);
    } catch (err) {
      setCgpaUpdateResult({ error: "Update failed. Please try again." });
    }
    setCgpaUpdating(false);
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
      if (
        semester !== "All" &&
        String(getSemester(s.batch, s.course)) !== semester
      )
        return false;

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
    semester,
    cgpaOpt,
    placement,
    selectedIn,
  ]);

  const total = totalCount;
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
    semester !== "All" ||
    cgpaRange !== "All" ||
    placement !== "All" ||
    selectedIn !== "All";

  const resetFilters = () => {
    setSearch("");
    setSelectedCourses([]);
    setBatch("All");
    setSemester("All");
    setCgpaRange("All");
    setPlacement("All");
    setSelectedIn("All");
  };

  return (
    <div
      style={{ backgroundColor: C.background }}
      className="min-h-screen p-3 sm:p-4 md:p-6 space-y-4 md:space-y-6"
    >
      {/* ── Hero Header ── */}
      <div
        className="relative overflow-hidden rounded-3xl p-5 sm:p-8 text-white"
        style={{
          background:
            "linear-gradient(135deg, #0d1b5e 0%, #1a2d8a 25%, #3d1a6e 55%, #6b1040 80%, #7a0f35 100%)",
        }}
      >
        <svg
          className="absolute bottom-0 right-0 pointer-events-none"
          style={{ width: "260px", height: "130px" }}
          viewBox="0 0 260 130"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M260 130 Q180 60 80 100 Q20 120 0 130"
            stroke="url(#studentDatabaseRedOrangeGrad)"
            strokeWidth="3.5"
            fill="none"
            strokeLinecap="round"
          />
          <path
            d="M260 110 Q190 50 100 85 Q40 105 10 115"
            stroke="url(#studentDatabaseRedOrangeGrad)"
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
            opacity="0.5"
          />
          <defs>
            <linearGradient
              id="studentDatabaseRedOrangeGrad"
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

        <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
          {/* Left — icon + title */}
          <div className="flex items-start gap-3 sm:gap-4">
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-white/15 backdrop-blur flex items-center justify-center shrink-0">
              <svg
                className="w-5 h-5 sm:w-6 sm:h-6"
                fill="none"
                stroke="#f59e0b"
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-white/70 mb-1">
                Placement Records
              </p>
              <h1 className="text-2xl sm:text-3xl font-bold leading-tight">
                Student Database
              </h1>
              <p className="text-white/75 text-sm mt-1 max-w-md">
                Manage and track placement status of all registered students.
              </p>
            </div>
          </div>

          {/* Right — Import / Export */}
          <div className="flex flex-col items-start lg:items-end gap-2 w-full lg:w-auto">
            <p className="text-xs text-white/70 text-left lg:text-right">
              {isReadOnly
                ? "Export current database to Excel"
                : "Bulk student database Upload or Export current database to Excel"}
            </p>

            <div className="flex items-center gap-2 sm:gap-3 flex-wrap w-full lg:w-auto">
              {!isReadOnly && importResult && (
                <span
                  className={`text-xs font-semibold px-2.5 py-1 rounded-lg backdrop-blur ${
                    importResult.error
                      ? "bg-red-500/20 text-red-100"
                      : "bg-white/15 text-white"
                  }`}
                >
                  {importResult.error
                    ? `❌ ${importResult.error}`
                    : `✓ ${importResult.imported} imported, ${importResult.skipped} skipped`}
                </span>
              )}

              {!isReadOnly && (
                <label
                  className={`flex items-center justify-center gap-2 px-3 sm:px-4 py-2 rounded-xl text-sm font-semibold cursor-pointer transition flex-1 lg:flex-none
          ${
            importing
              ? "bg-white/20 text-white/50 cursor-not-allowed"
              : "bg-white text-[#1a3a8f] hover:bg-[#F1F5F9]"
          }`}
                >
                  <Upload size={14} />
                  {importing ? (
                    <ImportingLabel
                      estimatedTime={estimatedTime}
                      importStart={importStart}
                    />
                  ) : (
                    "Import CSV"
                  )}
                  <input
                    type="file"
                    accept=".csv,.xlsx"
                    className="hidden"
                    onChange={handleImport}
                    disabled={importing}
                  />
                </label>
              )}

              <button
                onClick={handleExport}
                className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 rounded-xl text-sm font-semibold bg-white/15 hover:bg-white/25 text-white border border-white/25 backdrop-blur transition flex-1 lg:flex-none"
              >
                <Download size={14} />
                Export Excel
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Stats Strip ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
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
      {/* ── CGPA Bulk Import Card ── */}
      {!isReadOnly && (
        <div
          style={{ backgroundColor: C.white, borderColor: C.border }}
          className="rounded-2xl border shadow-sm p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-5"
        >
          <div className="flex items-start gap-4">
            <div
              style={{ backgroundColor: "#F5F3FF" }}
              className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
            >
              {Icon.cgpa}
            </div>
            <div>
              <h3
                style={{ color: C.textMain }}
                className="text-base font-bold mb-1"
              >
                Semester CGPA Update
              </h3>
              <p
                style={{ color: C.textMuted }}
                className="text-sm leading-relaxed max-w-lg"
              >
                To update students' CGPA for the current semester, import an
                Excel file below.{" "}
                <span className="text-xs">
                  (Required columns:{" "}
                  <strong style={{ color: C.textMain }}>Name</strong>,{" "}
                  <strong style={{ color: C.textMain }}>ERP ID</strong>,{" "}
                  <strong style={{ color: C.textMain }}>CGPA</strong>)
                </span>
              </p>
            </div>
          </div>
          <label
            style={{
              backgroundColor: cgpaFileLoading ? C.border : C.primary,
              color: C.white,
              cursor: cgpaFileLoading ? "not-allowed" : "pointer",
              whiteSpace: "nowrap",
            }}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold hover:opacity-90 transition shrink-0 self-start sm:self-auto"
          >
            {cgpaFileLoading ? (
              <>
                <svg
                  className="animate-spin w-3.5 h-3.5"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v8z"
                  />
                </svg>
                Processing…
              </>
            ) : (
              <>
                <Upload size={15} />
                Import CSV for CGPA
              </>
            )}
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={handleCgpaFileSelect}
              disabled={cgpaFileLoading}
            />
          </label>
        </div>
      )}
      {/* ── Search + Filters ── */}
      <div
        style={{ backgroundColor: C.white, borderColor: C.border }}
        className="rounded-2xl border p-3 sm:p-5 shadow-sm"
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
          <div className="flex items-end gap-3 sm:gap-4 flex-wrap">
            <div
              style={{ color: C.textMuted }}
              className="flex items-center gap-1.5 text-sm font-medium mr-1 mb-0.5 w-full sm:w-auto"
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
              label="Semester"
              value={semester}
              options={SEMESTERS}
              onChange={setSemester}
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
                className="border text-xs font-semibold px-3 py-2 rounded-xl hover:opacity-80 transition self-end mb-0.5 w-full sm:w-auto"
              >
                Clear Filters
              </button>
            )}
            <span
              style={{ color: C.textMuted }}
              className="w-full sm:w-auto sm:ml-auto text-sm self-end mb-0.5"
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
        <div className="overflow-x-auto">
          <div style={{ minWidth: 900 }}>
            {/* Table Header */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "2fr 1fr 1.4fr 0.8fr 0.6fr 0.8fr 0.7fr 1.2fr 1.2fr",
                columnGap: "12px",
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
                "Semester",
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
                <p
                  style={{ color: C.textMuted }}
                  className="text-sm font-medium"
                >
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
                <p
                  style={{ color: C.textMuted }}
                  className="text-sm font-medium"
                >
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
                        "2fr 1fr 1.4fr 0.8fr 0.6fr 0.8fr 0.7fr 1.2fr 1.2fr",
                      alignItems: "center",
                      columnGap: "12px",
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
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        style={{
                          background: `linear-gradient(135deg, ${C.primary}, ${C.accent})`,
                        }}
                        className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-sm shrink-0"
                      >
                        {student.name.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <p
                          style={{ color: C.textMain }}
                          className="font-semibold text-sm leading-tight truncate"
                        >
                          {student.name}
                        </p>
                        <p
                          style={{ color: C.textMuted }}
                          className="text-xs truncate"
                        >
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

                    {/* Semester */}
                    <span style={{ color: C.textMuted }} className="text-sm">
                      {getSemester(student.batch, student.course)
                        ? `Sem ${getSemester(student.batch, student.course)}`
                        : "—"}
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
                        <span
                          style={{ color: C.textMuted }}
                          className="text-sm"
                        >
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
        </div>
      </div>
      {/* Infinite scroll sentinel */}
      <div ref={sentinelRef} className="py-4 flex items-center justify-center">
        {loadingMore && (
          <div className="flex items-center gap-2">
            <svg
              className="animate-spin w-4 h-4 text-blue-500"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v8z"
              />
            </svg>
            <span style={{ color: C.textMuted }} className="text-sm">
              Loading more students...
            </span>
          </div>
        )}
        {!hasMore && students.length > 0 && !loading && (
          <span style={{ color: C.textMuted }} className="text-xs">
            All {totalCount} students loaded
          </span>
        )}
      </div>

      {/* ── Student Detail Modal ── */}
      <StudentModal student={selected} onClose={() => setSelected(null)} />
      {cgpaImportModal && (
        <CgpaImportModal
          matches={cgpaMatches}
          setMatches={setCgpaMatches}
          students={cgpaAllStudents}
          onClose={() => {
            setCgpaImportModal(false);
            setCgpaUpdateResult(null);
          }}
          onConfirm={handleCgpaUpdate}
          updating={cgpaUpdating}
          updateResult={cgpaUpdateResult}
        />
      )}
    </div>
  );
}
