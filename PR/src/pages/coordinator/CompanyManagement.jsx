import { useState, useEffect, createElement } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { api } from "../../utils/api";
import universityStructure from "../../data/universityStructure";
import {
  Building2,
  Search,
  Plus,
  FileText,
  X,
  Check,
  MapPin,
  Download,
  Calendar,
  Briefcase,
  AlertCircle,
  CheckCircle,
  XCircle,
  Eye,
  ExternalLink,
  Trash2,
  Users,
  Clock,
  ChevronRight,
  ChevronLeft,
  Pencil,
  GraduationCap,
  ChevronDown,
} from "lucide-react";
import CompanyLogo from "../../components/common/CompanyLogo";
import { useIsReadOnly } from "../../utils/useIsReadOnly";
import { sendBulkWhatsApp } from "../../utils/whatsapp";

const ExtLink = ({ href, className, children }) =>
  createElement(
    "a",
    { href, target: "_blank", rel: "noreferrer", className },
    children,
  );

// ─────────────────────────────────────────────────────────────
//  CONSTANTS
// ─────────────────────────────────────────────────────────────
const inputCls =
  "w-full px-3 py-2 text-sm text-[#1E293B] border border-[#E2E8F0] rounded-xl bg-[#F8FAFC] focus:outline-none focus:border-[#1a3a8f] transition-colors placeholder:text-[#94A3B8]";

const emptyCompany = {
  name: "",
  about: "",
  industry: "",
  location: "",
  website: "",
  establishedYear: "",
};

const emptyRoleGroup = () => ({
  id: `rg-${Date.now()}-${Math.random().toString(36).slice(2)}`,
  eligibleBranches: [],
  role: "",
  ctc: "",
  skills: [],
  selectionProcess: [],
  saved: false,
});

const emptyJD = {
  jobType: "Full Time",
  lastDate: "",
  lastTime: "",
  minCgpa: "",
  minTenthPercentage: "",
  minTwelfthPercentage: "",
  maxBacklogs: "0",
  perks: [],
  bondDetails: "", // NEW (optional)
  registrationLink: "", // NEW (optional)
  roleGroups: [emptyRoleGroup()],
  allowMultipleRoleApplications: false,
};

// NEW: link ke aage https:// na ho to auto laga dega
const normalizeUrl = (url) => {
  const u = (url || "").trim();
  if (!u) return "";
  return /^https?:\/\//i.test(u) ? u : `https://${u}`;
};

const isValidUrl = (url) => {
  try {
    return new URL(normalizeUrl(url)).hostname.includes(".");
  } catch {
    return false;
  }
};

const daysLeft = (lastDate) => {
  if (!lastDate) return null;
  const d = new Date(lastDate);
  if (isNaN(d.getTime())) return null;
  const today = new Date();
  const todayMid = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  );
  const deadlineMid = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  return Math.round((deadlineMid - todayMid) / (1000 * 60 * 60 * 24));
};

const isExpired = (lastDate) => {
  const d = daysLeft(lastDate);
  return d !== null && d < 0;
};

const daysLeftLabel = (days) => {
  if (days === null) return "";
  if (days < 0) return "Closed";
  if (days === 0) return "Today · Last day";
  return `${days}d left`;
};

const formatDDMMYYYY = (date) => {
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

// ─────────────────────────────────────────────────────────────
//  BRANCH SELECTOR
// ─────────────────────────────────────────────────────────────
const allCourses = () =>
  universityStructure.flatMap((s) => s.departments.flatMap((d) => d.courses));

const isBTech = (c) => /^B\.Tech/i.test(c);
const isUG = (c) =>
  /^B\.|^BCA|^BBA|^B\.Com|^Bachelor|^LLB|^Five Year|^Pharm\.D|^Diploma/i.test(
    c,
  );
const isPG = (c) =>
  /^M\.|^MBA|^MCA|^Masters|^Ph\.D/i.test(c) && !/^B\./.test(c);

function BranchSelectorModal({ selected, onChange }) {
  const [open, setOpen] = useState(false);
  const [openSchools, setOpenSchools] = useState({});
  const [search, setSearch] = useState("");
  const [activeQuick, setActiveQuick] = useState(null);
  const [tempSel, setTempSel] = useState([]);

  const openModal = () => {
    setTempSel([...selected]);
    setSearch("");
    setActiveQuick(null);
    setOpenSchools({});
    setOpen(true);
  };

  const closeModal = () => setOpen(false);

  const confirm = () => {
    onChange(tempSel);
    setOpen(false);
  };

  const quickSel = (mode) => {
    setActiveQuick(mode);
    if (mode === "all") setTempSel([...allCourses()]);
    else if (mode === "btech") setTempSel(allCourses().filter(isBTech));
    else if (mode === "ug") setTempSel(allCourses().filter(isUG));
    else if (mode === "pg") setTempSel(allCourses().filter(isPG));
    else setTempSel([]);
  };

  const toggleCourse = (course) => {
    setActiveQuick(null);
    setTempSel((prev) =>
      prev.includes(course)
        ? prev.filter((x) => x !== course)
        : [...prev, course],
    );
  };

  const toggleDept = (courses) => {
    setActiveQuick(null);
    const allIn = courses.every((c) => tempSel.includes(c));
    setTempSel((prev) =>
      allIn
        ? prev.filter((x) => !courses.includes(x))
        : [...new Set([...prev, ...courses])],
    );
  };

  const toggleSchool = (courses) => {
    setActiveQuick(null);
    const allIn = courses.every((c) => tempSel.includes(c));
    setTempSel((prev) =>
      allIn
        ? prev.filter((x) => !courses.includes(x))
        : [...new Set([...prev, ...courses])],
    );
  };

  const toggleOpenSchool = (si) =>
    setOpenSchools((prev) => ({ ...prev, [si]: !prev[si] }));

  const schoolState = (si) => {
    const courses = universityStructure[si].departments.flatMap(
      (d) => d.courses,
    );
    const n = courses.filter((c) => tempSel.includes(c)).length;
    return n === 0 ? "none" : n === courses.length ? "all" : "partial";
  };

  const deptState = (courses) => {
    const n = courses.filter((c) => tempSel.includes(c)).length;
    return n === 0 ? "none" : n === courses.length ? "all" : "partial";
  };

  const q = search.toLowerCase().trim();
  const visibleStructure = universityStructure
    .map((school) => ({
      ...school,
      departments: school.departments
        .map((dept) => ({
          ...dept,
          courses: dept.courses.filter(
            (c) =>
              !q ||
              c.toLowerCase().includes(q) ||
              dept.name.toLowerCase().includes(q) ||
              school.school.toLowerCase().includes(q),
          ),
        }))
        .filter((dept) => dept.courses.length > 0),
    }))
    .filter((school) => school.departments.length > 0);

  const triggerLabel =
    selected.length === 0
      ? "Click to select eligible branches & courses"
      : `${selected.length} course${selected.length > 1 ? "s" : ""} selected`;

  return (
    <>
      <div
        onClick={openModal}
        className={`cursor-pointer border rounded-xl p-3 transition-all ${
          selected.length > 0
            ? "border-[#1a3a8f] bg-[#EFF3FA]"
            : "border-[#E2E8F0] bg-[#F8FAFC] hover:border-[#1a3a8f]"
        }`}
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <GraduationCap
              size={15}
              className={
                selected.length > 0
                  ? "text-[#1a3a8f] flex-shrink-0"
                  : "text-[#94A3B8] flex-shrink-0"
              }
            />
            <span
              className={`text-sm truncate ${selected.length > 0 ? "text-[#1a3a8f] font-medium" : "text-[#94A3B8]"}`}
            >
              {triggerLabel}
            </span>
          </div>
          <span className="flex items-center gap-1 text-xs text-[#1a3a8f] flex-shrink-0 font-medium">
            <Pencil size={11} />
            {selected.length > 0 ? "Edit" : "Select"}
          </span>
        </div>

        {selected.length > 0 && selected.length <= 4 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {selected.map((c) => (
              <span
                key={c}
                className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#EFF3FA] text-[#1a3a8f] border border-[#B8C6E3]"
              >
                {c.length > 30 ? c.slice(0, 28) + "…" : c}
              </span>
            ))}
          </div>
        )}
        {selected.length > 4 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {selected.slice(0, 3).map((c) => (
              <span
                key={c}
                className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#EFF3FA] text-[#1a3a8f] border border-[#B8C6E3]"
              >
                {c.length > 30 ? c.slice(0, 28) + "…" : c}
              </span>
            ))}
            <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#F1F5F9] text-[#64748B] border border-[#E2E8F0]">
              +{selected.length - 3} more
            </span>
          </div>
        )}
      </div>

      {open && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 px-4"
          onClick={closeModal}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col"
            style={{ maxHeight: "85vh" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 sm:p-5 border-b border-[#F1F5F9] flex-shrink-0">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                    <GraduationCap size={14} className="text-[#f59e0b]" />
                  </div>
                  <div>
                    <h3
                      className="text-sm font-bold text-[#1E293B]"
                      style={{ fontFamily: "Space Grotesk, sans-serif" }}
                    >
                      Select Eligible Branches & Courses
                    </h3>
                    <p className="text-[10px] text-[#94A3B8] mt-0.5">
                      Choose which students are eligible to apply
                    </p>
                  </div>
                </div>
                <button
                  onClick={closeModal}
                  className="w-7 h-7 rounded-lg bg-[#F1F5F9] flex items-center justify-center hover:bg-[#E2E8F0] transition-colors"
                >
                  <X size={13} className="text-[#64748B]" />
                </button>
              </div>

              <div className="flex flex-wrap gap-2 mb-3">
                {[
                  { key: "all", label: "All Courses" },
                  { key: "btech", label: "B.Tech Only" },
                  { key: "ug", label: "UG Only" },
                  { key: "pg", label: "PG Only" },
                ].map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => quickSel(key)}
                    className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all ${
                      activeQuick === key
                        ? "bg-[#1a3a8f] text-white border-[#1a3a8f]"
                        : "bg-[#F8FAFC] text-[#64748B] border-[#E2E8F0] hover:border-[#1a3a8f] hover:text-[#1a3a8f]"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2 border border-[#E2E8F0] rounded-xl px-3 py-2 bg-[#F8FAFC] focus-within:border-[#1a3a8f] transition-colors">
                <Search size={13} className="text-[#94A3B8] flex-shrink-0" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search courses, departments..."
                  className="flex-1 bg-transparent text-sm text-[#1E293B] outline-none placeholder:text-[#94A3B8]"
                />
                {search && (
                  <button onClick={() => setSearch("")}>
                    <X
                      size={12}
                      className="text-[#94A3B8] hover:text-[#64748B]"
                    />
                  </button>
                )}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {visibleStructure.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 gap-2">
                  <Search size={28} className="text-[#CBD5E1]" />
                  <p className="text-sm text-[#94A3B8]">No courses found</p>
                </div>
              ) : (
                visibleStructure.map((school) => {
                  const realSi = universityStructure.findIndex(
                    (s) => s.school === school.school,
                  );
                  const schoolCourses = school.departments.flatMap(
                    (d) => d.courses,
                  );
                  const sState = schoolState(realSi);
                  const isOpen = !!openSchools[realSi] || !!q;

                  return (
                    <div
                      key={school.school}
                      className="border-b border-[#F1F5F9] last:border-b-0"
                    >
                      <div
                        className="flex items-center gap-3 px-5 py-3 cursor-pointer hover:bg-[#F8FAFC] transition-colors"
                        onClick={() => toggleOpenSchool(realSi)}
                      >
                        <input
                          type="checkbox"
                          checked={sState === "all"}
                          ref={(el) => {
                            if (el) el.indeterminate = sState === "partial";
                          }}
                          onChange={() => toggleSchool(schoolCourses)}
                          onClick={(e) => e.stopPropagation()}
                          className="w-4 h-4 accent-[#1a3a8f] flex-shrink-0 cursor-pointer"
                        />
                        <span className="flex-1 text-xs font-semibold text-[#1E293B]">
                          {school.school}
                        </span>
                        <span className="text-[10px] text-[#94A3B8] mr-1">
                          {
                            schoolCourses.filter((c) => tempSel.includes(c))
                              .length
                          }
                          /{schoolCourses.length}
                        </span>
                        <ChevronDown
                          size={14}
                          className={`text-[#94A3B8] transition-transform ${isOpen ? "rotate-180" : ""}`}
                        />
                      </div>

                      {isOpen && (
                        <div className="pb-2">
                          {school.departments.map((dept) => {
                            const dState = deptState(dept.courses);
                            return (
                              <div key={dept.name} className="px-5 mb-1">
                                <div className="flex items-center gap-2.5 py-1.5">
                                  <input
                                    type="checkbox"
                                    checked={dState === "all"}
                                    ref={(el) => {
                                      if (el)
                                        el.indeterminate = dState === "partial";
                                    }}
                                    onChange={() => toggleDept(dept.courses)}
                                    className="w-3.5 h-3.5 accent-[#1a3a8f] flex-shrink-0 cursor-pointer"
                                  />
                                  <span className="text-xs font-medium text-[#64748B]">
                                    {dept.name}
                                  </span>
                                  <span className="text-[10px] text-[#CBD5E1] ml-auto">
                                    {dept.courses.length} courses
                                  </span>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 pl-6">
                                  {dept.courses.map((course) => (
                                    <label
                                      key={course}
                                      className="flex items-start gap-2 px-2 py-1.5 rounded-lg cursor-pointer hover:bg-[#F1F5F9] transition-colors"
                                    >
                                      <input
                                        type="checkbox"
                                        checked={tempSel.includes(course)}
                                        onChange={() => toggleCourse(course)}
                                        className="w-3 h-3 accent-[#1a3a8f] flex-shrink-0 mt-0.5 cursor-pointer"
                                      />
                                      <span className="text-[11px] text-[#1E293B] leading-snug">
                                        {course}
                                      </span>
                                    </label>
                                  ))}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 px-4 sm:px-5 py-4 border-t border-[#F1F5F9] flex-shrink-0">
              <div className="text-xs text-[#64748B]">
                <span className="font-bold text-[#1E293B]">
                  {tempSel.length}
                </span>{" "}
                courses selected
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setTempSel([]);
                    setActiveQuick(null);
                  }}
                  className="px-3 py-1.5 rounded-xl border border-[#E2E8F0] text-xs font-medium text-[#64748B] hover:bg-[#F8FAFC] transition-colors"
                >
                  Clear All
                </button>
                <button
                  onClick={confirm}
                  className="px-4 py-1.5 rounded-xl bg-[#1a3a8f] text-white text-xs font-semibold hover:bg-[#0d1b5e] transition-colors flex items-center gap-1.5"
                >
                  <Check size={13} /> Confirm Selection
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ─────────────────────────────────────────────────────────────
//  TagInput
// ─────────────────────────────────────────────────────────────
function TagInput({ tags, setTags, placeholder }) {
  const [input, setInput] = useState("");

  const handleKey = (e) => {
    if ((e.key === "Enter" || e.key === ",") && input.trim()) {
      e.preventDefault();
      if (!tags.includes(input.trim())) setTags([...tags, input.trim()]);
      setInput("");
    }
  };

  return (
    <div className="flex flex-wrap gap-1.5 p-2 border border-[#E2E8F0] rounded-xl bg-[#F8FAFC] min-h-10.5 focus-within:border-primary transition-colors">
      {tags.map((t) => (
        <span
          key={t}
          className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 text-primary border border-blue-200 text-xs font-medium"
        >
          {t}
          <button
            onClick={() => setTags(tags.filter((x) => x !== t))}
            className="hover:text-red-500 transition-colors"
          >
            <X size={10} />
          </button>
        </span>
      ))}
      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKey}
        placeholder={tags.length === 0 ? placeholder : ""}
        className="flex-1 min-w-30 bg-transparent text-xs text-[#1E293B] outline-none placeholder:text-[#94A3B8]"
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
//  ROLE GROUP BOX  (ek role/CTC/branches box, JD form ke andar)
// ─────────────────────────────────────────────────────────────
function RoleGroupBox({ index, roleGroup, onChange, onRemove, error }) {
  const update = (patch) => onChange({ ...roleGroup, ...patch });

  if (roleGroup.saved) {
    return (
      <div className="flex items-center justify-between gap-3 border border-[#E2E8F0] rounded-xl p-3 bg-[#F8FAFC]">
        <div className="min-w-0">
          <p className="text-xs font-semibold text-[#1E293B] truncate">
            {roleGroup.role || `Role ${index + 1}`} · ₹{roleGroup.ctc || 0} LPA
          </p>
          <p className="text-[10px] text-[#94A3B8] truncate">
            {roleGroup.eligibleBranches.length} course(s) selected
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            type="button"
            onClick={() => update({ saved: false })}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-[#E2E8F0] text-[11px] font-medium text-[#64748B] hover:border-[#1a3a8f] hover:text-[#1a3a8f]"
          >
            <Pencil size={11} /> Edit
          </button>
          {onRemove && (
            <button
              type="button"
              onClick={onRemove}
              className="w-6 h-6 rounded-lg flex items-center justify-center text-[#94A3B8] hover:text-red-500 hover:bg-red-50"
            >
              <Trash2 size={12} />
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="border border-[#E2E8F0] rounded-xl p-3 sm:p-4 bg-white flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-[#1a3a8f]">
          Role {index + 1}
        </span>
        {onRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="text-[#94A3B8] hover:text-red-500"
          >
            <Trash2 size={13} />
          </button>
        )}
      </div>

      <Field
        label="Eligible Branches & Courses"
        required
        error={error?.eligibleBranches}
      >
        <BranchSelectorModal
          selected={roleGroup.eligibleBranches}
          onChange={(eligibleBranches) => update({ eligibleBranches })}
        />
      </Field>

      <Field label="Role / Position" required error={error?.role}>
        <input
          value={roleGroup.role}
          onChange={(e) => update({ role: e.target.value })}
          placeholder="e.g. Software Engineer"
          className={inputCls}
        />
      </Field>

      <Field label="CTC (LPA)" required error={error?.ctc}>
        <input
          type="number"
          value={roleGroup.ctc}
          onChange={(e) => update({ ctc: e.target.value })}
          placeholder="e.g. 12"
          className={inputCls}
        />
      </Field>

      <Field label="Skills Required">
        <TagInput
          tags={roleGroup.skills}
          setTags={(t) => update({ skills: t })}
          placeholder="Type and press Enter (e.g. DSA, SQL)"
        />
      </Field>

      <Field label="Selection Process">
        <TagInput
          tags={roleGroup.selectionProcess}
          setTags={(t) => update({ selectionProcess: t })}
          placeholder="Type and press Enter (e.g. Aptitude, Technical, HR)"
        />
      </Field>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => update({ saved: true })}
          className="px-3 py-1.5 rounded-lg bg-[#1a3a8f] text-white text-xs font-semibold hover:bg-[#0d1b5e]"
        >
          Save Role
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
//  COMPANY CARD  (list view, expand/collapse multi-role)
// ─────────────────────────────────────────────────────────────
function CompanyCard({
  company,
  job,
  onView,
  onEditCompany,
  onEditJD,
  onPostJD,
  isReadOnly,
}) {
  const [expanded, setExpanded] = useState(false);
  const days = job ? daysLeft(job.lastDate) : null;
  const expired = job ? isExpired(job.lastDate) : false;
  const isUrgent = !expired && days !== null && days <= 7;
  const roleGroups = job?.roleGroups ?? [];
  const multiRole = roleGroups.length > 1;

  return (
    <div className="bg-white rounded-2xl border border-[#E2E8F0] border-l-4 border-l-primary p-4 sm:p-5 shadow-sm hover:shadow-md transition-all">
      <div className="flex flex-col sm:flex-row items-start gap-4">
        <CompanyLogo name={company.name} website={company.website} size={44} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h3
              className="text-sm font-bold text-[#1E293B]"
              style={{ fontFamily: "Space Grotesk, sans-serif" }}
            >
              {company.name}
            </h3>
            {roleGroups.length === 1 && (
              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-primary border border-blue-200">
                {roleGroups[0].role}
              </span>
            )}
            {job && (
              <span
                className={`px-2 py-0.5 rounded-full text-xs font-semibold ${job.jobType === "Internship" ? "bg-purple-50 text-purple-600 border border-purple-200" : "bg-green-50 text-green-600 border border-green-200"}`}
              >
                {job.jobType}
              </span>
            )}
            {expired && (
              <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-red-50 text-red-500 border border-red-200">
                Closed
              </span>
            )}
          </div>

          <div className="flex items-center gap-4 flex-wrap">
            <span className="flex items-center gap-1 text-xs text-text-muted">
              <MapPin size={11} /> {company.location}
            </span>
            {job?.lastDate && (
              <span
                className={`flex items-center gap-1 text-xs font-medium ${expired ? "text-red-400" : isUrgent ? "text-red-500" : "text-text-muted"}`}
              >
                <Calendar size={11} />
                {formatDDMMYYYY(job.lastDate)}
                {isUrgent && (
                  <span className="ml-1 px-1.5 py-0.5 rounded-full bg-red-50 text-red-500 border border-red-200 text-[10px] font-bold whitespace-nowrap">
                    {daysLeftLabel(days)}
                  </span>
                )}
              </span>
            )}
            {job?.minCgpa > 0 && (
              <span className="text-xs text-text-muted">
                CGPA {job.minCgpa}+
              </span>
            )}
          </div>

          {roleGroups.length === 1 && (
            <div className="flex items-center gap-3 flex-wrap mt-2">
              {roleGroups[0].ctc > 0 && (
                <span className="flex items-center gap-1 text-xs text-text-muted">
                  <Briefcase size={11} /> ₹{roleGroups[0].ctc} LPA
                </span>
              )}
              {(roleGroups[0].eligibleBranches ?? []).slice(0, 3).map((b) => (
                <span
                  key={b}
                  className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-background text-[#64748B] border border-[#E2E8F0]"
                >
                  {b.length > 35 ? b.slice(0, 33) + "…" : b}
                </span>
              ))}
              {(roleGroups[0].eligibleBranches ?? []).length > 3 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-background text-[#94A3B8] border border-[#E2E8F0]">
                  +{roleGroups[0].eligibleBranches.length - 3} more
                </span>
              )}
            </div>
          )}

          {multiRole && (
            <button
              onClick={() => setExpanded((v) => !v)}
              className="flex items-center gap-1.5 mt-2 px-2.5 py-1 rounded-lg bg-[#EFF3FA] text-[#1a3a8f] border border-[#B8C6E3] text-xs font-semibold hover:bg-[#E2E8F0] transition-colors"
            >
              <Briefcase size={11} /> {roleGroups.length} Roles
              <ChevronDown
                size={12}
                className={`transition-transform ${expanded ? "rotate-180" : ""}`}
              />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap sm:flex-shrink-0 w-full sm:w-auto">
          <button
            onClick={onView}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E2E8F0] text-xs font-medium text-[#64748B] hover:border-[#8B5CF6] hover:text-[#8B5CF6] transition-all"
          >
            <Eye size={12} /> View
          </button>
          {!isReadOnly && (
            <button
              onClick={onEditCompany}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#F1F5F9] text-[#475569] border border-[#E2E8F0] text-xs font-semibold hover:bg-[#E2E8F0] transition-colors"
            >
              <Pencil size={12} /> Edit Company Info
            </button>
          )}
          {!isReadOnly &&
            (job ? (
              <button
                onClick={onEditJD}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#F1F5F9] text-[#475569] border border-[#E2E8F0] text-xs font-semibold hover:bg-[#E2E8F0] transition-colors"
              >
                <Pencil size={12} /> Edit JD
              </button>
            ) : (
              <button
                onClick={onPostJD}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1a3a8f] text-white text-xs font-semibold hover:bg-[#0d1b5e] transition-colors"
              >
                <FileText size={12} /> Post JD
              </button>
            ))}
        </div>
      </div>

      {multiRole && expanded && (
        <div className="mt-4 pt-4 border-t border-[#F1F5F9] flex flex-col gap-2.5">
          {roleGroups.map((rg, i) => (
            <div
              key={rg._id || i}
              className="bg-[#F8FAFC] rounded-xl p-3 border border-[#E2E8F0]"
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold text-[#1E293B]">
                  {rg.role}
                </span>
                <span className="text-xs font-semibold text-[#1a3a8f]">
                  ₹{rg.ctc} LPA
                </span>
              </div>
              <div className="flex flex-wrap gap-1 mb-1.5">
                {(rg.eligibleBranches ?? []).slice(0, 4).map((b) => (
                  <span
                    key={b}
                    className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-white text-[#64748B] border border-[#E2E8F0]"
                  >
                    {b.length > 30 ? b.slice(0, 28) + "…" : b}
                  </span>
                ))}
                {(rg.eligibleBranches ?? []).length > 4 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-white text-[#94A3B8] border border-[#E2E8F0]">
                    +{rg.eligibleBranches.length - 4} more
                  </span>
                )}
              </div>
              {(rg.skills ?? []).length > 0 && (
                <p className="text-[10px] text-[#94A3B8]">
                  Skills: {rg.skills.join(", ")}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Field({ label, required, optional, error, children }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-text-muted uppercase tracking-widest mb-1.5">
        {label} {required && <span className="text-red-400">*</span>}
        {optional && (
          <span className="text-[#94A3B8] normal-case tracking-normal font-normal">
            {" "}
            (optional)
          </span>
        )}
      </label>
      {children}
      {error && (
        <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
          <AlertCircle size={11} /> {error}
        </p>
      )}
    </div>
  );
}

function JDFields({ form, setForm, errors }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Job Type">
          <select
            value={form.jobType}
            onChange={(e) => setForm({ ...form, jobType: e.target.value })}
            className={inputCls}
          >
            <option>Full Time</option>
            <option>Internship</option>
            <option>Part Time</option>
          </select>
        </Field>
        <Field label="Last Date to Apply" required error={errors.lastDate}>
          <input
            type="date"
            value={form.lastDate}
            onChange={(e) => setForm({ ...form, lastDate: e.target.value })}
            className={inputCls}
          />
        </Field>
      </div>

      <Field label="Application End Time" optional>
        <input
          type="time"
          value={form.lastTime}
          onChange={(e) => setForm({ ...form, lastTime: e.target.value })}
          className={inputCls}
        />
      </Field>

      <Field label="Min CGPA" optional>
        <input
          type="number"
          step="0.1"
          min="0"
          max="10"
          value={form.minCgpa}
          onChange={(e) => setForm({ ...form, minCgpa: e.target.value })}
          placeholder="Leave blank if no requirement"
          className={inputCls}
        />
      </Field>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Min 10th Percentage" optional>
          <input
            type="number"
            step="0.1"
            min="0"
            max="100"
            value={form.minTenthPercentage}
            onChange={(e) =>
              setForm({ ...form, minTenthPercentage: e.target.value })
            }
            placeholder="Leave blank if no requirement"
            className={inputCls}
          />
        </Field>
        <Field label="Min 12th Percentage" optional>
          <input
            type="number"
            step="0.1"
            min="0"
            max="100"
            value={form.minTwelfthPercentage}
            onChange={(e) =>
              setForm({ ...form, minTwelfthPercentage: e.target.value })
            }
            placeholder="Leave blank if no requirement"
            className={inputCls}
          />
        </Field>
      </div>

      <Field label="Max Backlogs Allowed">
        <input
          type="number"
          min="0"
          value={form.maxBacklogs}
          onChange={(e) => setForm({ ...form, maxBacklogs: e.target.value })}
          placeholder="0"
          className={inputCls}
        />
      </Field>

      <Field label="Registration Link" optional error={errors.registrationLink}>
        <input
          type="url"
          value={form.registrationLink}
          onChange={(e) =>
            setForm({ ...form, registrationLink: e.target.value })
          }
          placeholder="https://company.com/careers/register"
          className={inputCls}
        />
        <p className="text-[10px] text-[#94A3B8] mt-1">
          If the company wants students to register on its own website, paste
          the link here. Students will see a button that opens the form
          directly.
        </p>
      </Field>

      <Field label="Perks & Benefits">
        <TagInput
          tags={form.perks}
          setTags={(t) => setForm({ ...form, perks: t })}
          placeholder="Type and press Enter (e.g. Health Insurance)"
        />
      </Field>
      <Field label="Any Bond or Fee" optional>
        <textarea
          value={form.bondDetails}
          onChange={(e) => setForm({ ...form, bondDetails: e.target.value })}
          placeholder={
            "e.g. 2 Years\n(Please specify clearly)\nBond-breach compensation: if a candidate leaves before completing the two-year service period, the candidate shall be liable to pay ₹3,00,000."
          }
          rows={4}
          className={`${inputCls} resize-y`}
        />
      </Field>
      <Field label="Allow Multiple Role Applications" optional>
        <div className="flex items-center gap-3 p-3 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC]">
          <button
            type="button"
            onClick={() =>
              setForm({
                ...form,
                allowMultipleRoleApplications:
                  !form.allowMultipleRoleApplications,
              })
            }
            className={`relative w-10 h-5 rounded-full transition-colors ${
              form.allowMultipleRoleApplications
                ? "bg-[#1a3a8f]"
                : "bg-[#CBD5E1]"
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                form.allowMultipleRoleApplications
                  ? "translate-x-5"
                  : "translate-x-0"
              }`}
            />
          </button>
          <span className="text-sm text-[#1E293B]">
            {form.allowMultipleRoleApplications
              ? "Students can apply to multiple roles"
              : "Students can apply to one role only"}
          </span>
        </div>
        <p className="text-[10px] text-[#94A3B8] mt-1">
          If the company allows students to apply for more than one role in this
          drive, enable this toggle.
        </p>
      </Field>
      <div className="border-t border-[#F1F5F9] pt-4 mt-1">
        <h4 className="text-[14px] font-bold text-[#464a50] uppercase tracking-widest">
          Role-wise Packages
        </h4>
        <p className="text-[13px] text-[#94A3B8] mt-0.5 mb-3">
          If different courses have different roles or packages, add a separate
          role box for each one.
        </p>

        <div className="flex flex-col gap-3">
          {form.roleGroups.map((rg, idx) => (
            <RoleGroupBox
              key={rg.id}
              index={idx}
              roleGroup={rg}
              error={
                Array.isArray(errors.roleGroups) ? errors.roleGroups[idx] : null
              }
              onChange={(updated) => {
                const next = [...form.roleGroups];
                next[idx] = updated;
                setForm({ ...form, roleGroups: next });
              }}
              onRemove={
                form.roleGroups.length > 1
                  ? () => {
                      const next = form.roleGroups.filter((_, i) => i !== idx);
                      setForm({ ...form, roleGroups: next });
                    }
                  : null
              }
            />
          ))}
        </div>

        <button
          type="button"
          onClick={() =>
            setForm({
              ...form,
              roleGroups: [...form.roleGroups, emptyRoleGroup()],
            })
          }
          className="mt-3 flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-dashed border-[#B8C6E3] text-xs font-semibold text-[#1a3a8f] hover:bg-[#EFF3FA] transition-colors"
        >
          <Plus size={13} /> Add Another Role
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
//  MAIN PAGE COMPONENT
// ─────────────────────────────────────────────────────────────
export default function CompanyManagementPage() {
  const isReadOnly = useIsReadOnly();
  const location = useLocation();
  const navigate = useNavigate();

  const [companies, setCompanies] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");

  const [showCompanyModal, setShowCompanyModal] = useState(false);
  const [companyForm, setCompanyForm] = useState(emptyCompany);
  const [companyErrors, setCompanyErrors] = useState({});
  const [addStep, setAddStep] = useState(1);
  const [addJDForm, setAddJDForm] = useState(emptyJD);
  const [addJDErrors, setAddJDErrors] = useState({});
  const [createdCompanyId, setCreatedCompanyId] = useState(null);

  const [showJDModal, setShowJDModal] = useState(false);
  const [jdTargetCompany, setJdTargetCompany] = useState(null);
  const [jdTargetJob, setJdTargetJob] = useState(null);
  const [jdForm, setJdForm] = useState(emptyJD);
  const [jdErrors, setJdErrors] = useState({});
  const [pdfFile, setPdfFile] = useState(null);
  const [savingJD, setSavingJD] = useState(false);
  const [lastCreatedJob, setLastCreatedJob] = useState(() => {
    try {
      const saved = localStorage.getItem("lastCreatedJob");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [allStudents, setAllStudents] = useState([]);

  const [showViewModal, setShowViewModal] = useState(false);
  const [viewingCompany, setViewingCompany] = useState(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deletingCompany, setDeletingCompany] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    const [companiesData, jobsData, studentsData] = await Promise.all([
      api.get("/companies"),
      api.get("/companies/jobs"),
      api.get("/students?page=1&limit=100000"),
    ]);
    setCompanies(Array.isArray(companiesData) ? companiesData : []);
    setJobs(Array.isArray(jobsData) ? jobsData : []);
    setAllStudents(
      Array.isArray(studentsData?.students) ? studentsData.students : [],
    );
    setLoading(false);
  };

  useEffect(() => {
    document.title = "Manage Companies — PlaceRise";
    fetchData();
  }, []);

  const merged = companies.map((c) => {
    const job = jobs.find((j) => j.companyId?._id === c._id);
    return { company: c, job: job || null };
  });

  const totalCompanies = companies.length;

  const fullTime = merged.filter(
    ({ job }) => job?.jobType === "Full Time",
  ).length;

  const internships = merged.filter(
    ({ job }) => job?.jobType === "Internship",
  ).length;

  const urgent = merged.filter(({ job }) => {
    if (!job) return false;
    const d = daysLeft(job.lastDate);
    return d !== null && d <= 7 && d >= 0;
  }).length;

  const filtered = merged.filter(({ company, job }) => {
    const matchSearch = company.name
      .toLowerCase()
      .includes(search.toLowerCase());
    const expired = job ? isExpired(job.lastDate) : false;
    const matchFilter =
      filter === "All"
        ? true
        : filter === "Active"
          ? !!job && !expired
          : !job || expired;
    return matchSearch && matchFilter;
  });

  const validateCompany = () => {
    const errs = {};
    if (!companyForm.name.trim()) errs.name = "Company name is required";
    if (!companyForm.location.trim()) errs.location = "Location is required";
    return errs;
  };

  const validateJD = (form) => {
    const errs = {};
    if (!form.lastDate) errs.lastDate = "Last date is required";
    if (form.registrationLink?.trim() && !isValidUrl(form.registrationLink)) {
      errs.registrationLink =
        "Please enter a valid link (e.g. https://company.com/register)";
    }

    const rgErrors = (form.roleGroups || []).map((rg) => {
      const e = {};
      if (!rg.role.trim()) e.role = "Role is required";
      if (!rg.ctc) e.ctc = "CTC is required";
      if (!rg.eligibleBranches.length)
        e.eligibleBranches = "Select at least one branch";
      return e;
    });
    if (
      !form.roleGroups?.length ||
      rgErrors.some((e) => Object.keys(e).length)
    ) {
      errs.roleGroups = rgErrors;
    }
    return errs;
  };

  const openAddCompany = () => {
    setCompanyForm(emptyCompany);
    setCompanyErrors({});
    setAddStep(1);
    setAddJDForm(emptyJD);
    setAddJDErrors({});
    setCreatedCompanyId(null);
    setShowCompanyModal(true);
  };

  useEffect(() => {
    if (location.state?.openAddCompany) {
      openAddCompany();
      navigate(location.pathname, { replace: true, state: null });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const goToStep2 = async () => {
    const errs = validateCompany();
    if (Object.keys(errs).length) {
      setCompanyErrors(errs);
      return;
    }
    if (createdCompanyId) {
      await api.put(`/companies/${createdCompanyId}`, companyForm);
    } else {
      const newCompany = await api.post("/companies", companyForm);
      setCreatedCompanyId(newCompany._id);
    }
    setAddStep(2);
  };

  const saveCompanyOnly = async () => {
    await fetchData();
    setShowCompanyModal(false);
  };

  // WITH
  const saveCompanyWithJD = async () => {
    const errs = validateJD(addJDForm);
    if (Object.keys(errs).length) {
      setAddJDErrors(errs);
      return;
    }
    const newJob = await api.post("/jobs", {
      companyId: createdCompanyId,
      jobType: addJDForm.jobType,
      location: companyForm.location,
      lastDate: addJDForm.lastDate,
      lastTime: addJDForm.lastTime,
      minCgpa: addJDForm.minCgpa ? parseFloat(addJDForm.minCgpa) : 0,
      minTenthPercentage: addJDForm.minTenthPercentage
        ? parseFloat(addJDForm.minTenthPercentage)
        : 0,
      minTwelfthPercentage: addJDForm.minTwelfthPercentage
        ? parseFloat(addJDForm.minTwelfthPercentage)
        : 0,
      maxBacklogs: addJDForm.maxBacklogs ? parseInt(addJDForm.maxBacklogs) : 0,
      bondDetails: addJDForm.bondDetails.trim(),
      registrationLink: normalizeUrl(addJDForm.registrationLink),
      perks: addJDForm.perks,
      allowMultipleRoleApplications:
        addJDForm.allowMultipleRoleApplications || false,
      roleGroups: addJDForm.roleGroups.map((rg) => ({
        eligibleBranches: rg.eligibleBranches,
        role: rg.role,
        ctc: parseFloat(rg.ctc),
        skills: rg.skills,
        selectionProcess: rg.selectionProcess,
      })),
    });

    // PDF upload — job create hone ke baad
    if (pdfFile && newJob._id) {
      const formData = new FormData();
      formData.append("pdf", pdfFile);
      await api.post(`/companies/jobs/${newJob._id}/upload-pdf`, formData);
      setPdfFile(null);
    }

    await fetchData();
    const createdJobData = { ...addJDForm, companyName: companyForm.name };
    setLastCreatedJob(createdJobData);
    localStorage.setItem("lastCreatedJob", JSON.stringify(createdJobData));
    setShowCompanyModal(false);
  };

  const openPostJD = (company) => {
    setJdTargetCompany(company);
    setJdTargetJob(null);
    setJdForm(emptyJD);
    setJdErrors({});
    setShowJDModal(true);
  };

  const openEditJD = (company, job) => {
    setJdTargetCompany(company);
    setJdTargetJob(job);
    setJdForm({
      jobType: job.jobType || "Full Time",
      lastDate: job.lastDate ? job.lastDate.split("T")[0] : "",
      lastTime: job.lastTime || "",
      minCgpa: job.minCgpa || "",
      minTenthPercentage: job.minTenthPercentage || "",
      minTwelfthPercentage: job.minTwelfthPercentage || "",
      maxBacklogs: job.maxBacklogs ?? "0",
      bondDetails: job.bondDetails || "",
      registrationLink: job.registrationLink || "",
      perks: job.perks || [],
      allowMultipleRoleApplications: job.allowMultipleRoleApplications || false,
      roleGroups: (job.roleGroups?.length ? job.roleGroups : [{}]).map(
        (rg) => ({
          id:
            rg._id || `rg-${Date.now()}-${Math.random().toString(36).slice(2)}`,
          eligibleBranches: rg.eligibleBranches || [],
          role: rg.role || "",
          ctc: rg.ctc || "",
          skills: rg.skills || [],
          selectionProcess: rg.selectionProcess || [],
          saved: true,
        }),
      ),
    });
    setJdErrors({});
    setShowJDModal(true);
  };

  const openEditCompany = (company) => {
    setCompanyForm({
      name: company.name || "",
      about: company.about || "",
      industry: company.industry || "",
      location: company.location || "",
      website: company.website || "",
      establishedYear: company.establishedYear || "",
    });
    setCompanyErrors({});
    setCreatedCompanyId(company._id);
    setAddStep(1);
    setAddJDForm(emptyJD);
    setAddJDErrors({});
    setShowCompanyModal(true);
  };

  const submitJD = async () => {
    const errs = validateJD(jdForm);
    if (Object.keys(errs).length) {
      setJdErrors(errs);
      return;
    }

    const payload = {
      companyId: jdTargetCompany._id,
      jobType: jdForm.jobType,
      location: jdTargetCompany.location,
      lastDate: jdForm.lastDate,
      lastTime: jdForm.lastTime,
      minCgpa: jdForm.minCgpa ? parseFloat(jdForm.minCgpa) : 0,
      minTenthPercentage: jdForm.minTenthPercentage
        ? parseFloat(jdForm.minTenthPercentage)
        : 0,
      minTwelfthPercentage: jdForm.minTwelfthPercentage
        ? parseFloat(jdForm.minTwelfthPercentage)
        : 0,
      maxBacklogs: jdForm.maxBacklogs ? parseInt(jdForm.maxBacklogs) : 0,
      bondDetails: jdForm.bondDetails.trim(),
      registrationLink: normalizeUrl(jdForm.registrationLink),
      perks: jdForm.perks,
      allowMultipleRoleApplications:
        jdForm.allowMultipleRoleApplications || false,
      roleGroups: jdForm.roleGroups.map((rg) => ({
        eligibleBranches: rg.eligibleBranches,
        role: rg.role,
        ctc: parseFloat(rg.ctc),
        skills: rg.skills,
        selectionProcess: rg.selectionProcess,
      })),
    };

    setSavingJD(true);
    try {
      let jobId = jdTargetJob?._id;

      if (jdTargetJob) {
        await api.put(`/jobs/${jdTargetJob._id}`, payload);
      } else {
        const newJob = await api.post("/jobs", payload);
        jobId = newJob._id;
      }

      if (pdfFile && jobId) {
        const formData = new FormData();
        formData.append("pdf", pdfFile);
        await api.post(`/companies/jobs/${jobId}/upload-pdf`, formData);
      }

      setPdfFile(null);
      await fetchData();
      if (!jdTargetJob) {
        setLastCreatedJob({ ...jdForm, companyName: jdTargetCompany?.name });
      }
      setShowJDModal(false);
    } catch (err) {
      alert("Something went wrong while saving JD");
    }
    setSavingJD(false);
  };

  const openDeleteDialog = (company) => {
    setDeletingCompany(company);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    await api.delete(`/companies/${deletingCompany._id}`);
    await fetchData();
    setShowDeleteDialog(false);
    setDeletingCompany(null);
    if (viewingCompany?._id === deletingCompany._id) {
      setShowViewModal(false);
      setViewingCompany(null);
    }
  };

  const handleBulkWhatsApp = () => {
    if (!lastCreatedJob) return;
    setLastCreatedJob(null);
    localStorage.removeItem("lastCreatedJob");
    const { roleGroups, companyName, lastDate } = lastCreatedJob;

    const formattedDate = lastDate
      ? new Date(lastDate).toLocaleDateString("en-IN", {
          day: "numeric",
          month: "short",
          year: "numeric",
        })
      : "—";

    // Har role ke students count karo pehle — delay calculate karne ke liye
    let totalDelay = 0;

    (roleGroups || []).forEach((rg) => {
      const eligibleBranches = rg.eligibleBranches || [];
      const eligibleStudents = allStudents.filter((s) => {
        const course = s.course || s.branch || "";
        return (
          eligibleBranches.length === 0 ||
          eligibleBranches.includes("All") ||
          eligibleBranches.includes(course)
        );
      });

      const message =
        `🎯 New Placement Drive on PlaceRise!\n\n` +
        `Company: ${companyName}\n` +
        `Role: ${rg.role || "—"}\n` +
        `Package: ₹${rg.ctc || "—"} LPA\n` +
        `Last Date: ${formattedDate}\n\n` +
        `Login to PlaceRise to apply: https://placerise.vercel.app`;

      // Is role ka send totalDelay ke baad start hoga
      setTimeout(() => {
        sendBulkWhatsApp(eligibleStudents, message);
      }, totalDelay);

      // Agla role tab shuru hoga jab is role ke saare students ho jaayein
      totalDelay += eligibleStudents.length * 500 + 1000; // 1s extra gap roles ke beech
    });
  };

  if (loading)
    return <div className="text-center py-20 text-text-muted">Loading...</div>;

  return (
    <div
      className="max-w-6xl mx-auto px-1 sm:px-1"
      style={{ fontFamily: "Inter, sans-serif" }}
    >
      {/* ══ HERO ══ */}
      <div
        className="relative rounded-2xl overflow-hidden mb-6 p-4 sm:p-6"
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
            stroke="url(#companyManagementRedOrangeGrad)"
            strokeWidth="3.5"
            fill="none"
            strokeLinecap="round"
          />
          <path
            d="M260 110 Q190 50 100 85 Q40 105 10 115"
            stroke="url(#companyManagementRedOrangeGrad)"
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
            opacity="0.5"
          />
          <defs>
            <linearGradient
              id="companyManagementRedOrangeGrad"
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

        <div className="relative flex flex-col sm:flex-row items-start sm:items-start justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <div className="w-6 h-6 rounded-md bg-white/20 flex items-center justify-center">
                <Building2 size={13} className="text-[#f59e0b]" />
              </div>
              <span className="text-white/60 text-[10px] font-bold uppercase tracking-widest">
                Placement Portal
              </span>
            </div>
            <h1
              className="text-xl sm:text-2xl font-bold text-white"
              style={{ fontFamily: "Space Grotesk, sans-serif" }}
            >
              Company Management
            </h1>
            <p className="text-white/55 text-xs mt-1">
              Manage recruiters, post JDs, and track placement drives
            </p>
          </div>
          {!isReadOnly && (
            <button
              onClick={openAddCompany}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-[#1a3a8f] text-sm font-bold hover:bg-[#F1F5F9] transition-colors shadow-lg shrink-0 mt-1 w-full sm:w-auto justify-center"
            >
              <Plus size={15} /> Add Company
            </button>
          )}
        </div>

        <div className="relative grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
          {[
            {
              label: "Total Companies",
              value: totalCompanies,
              icon: Building2,
            },
            { label: "Full Time", value: fullTime, icon: Briefcase },
            { label: "Internships", value: internships, icon: Users },
            {
              label: "Closing Soon",
              value: urgent,
              icon: Clock,
              highlight: urgent > 0,
            },
          ].map(({ label, value, icon: Icon, highlight }) => (
            <div
              key={label}
              className="rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 border border-white/10"
              style={{
                background: highlight
                  ? "rgba(239,68,68,0.25)"
                  : "rgba(255,255,255,0.12)",
              }}
            >
              <div className="flex items-center gap-1.5 mb-1">
                <Icon size={12} className="text-white/60 flex-shrink-0" />
                <span className="text-white/55 text-[9px] sm:text-[10px] font-semibold uppercase tracking-wider truncate">
                  {label}
                </span>
              </div>
              <p
                className="text-white text-lg sm:text-2xl font-bold leading-none"
                style={{ fontFamily: "Space Grotesk, sans-serif" }}
              >
                {value}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Search + Filter ── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-5">
        <div className="flex-1 relative">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]"
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search company name..."
            className="w-full pl-9 pr-4 py-2.5 text-sm border border-[#E2E8F0] rounded-xl bg-white focus:outline-none focus:border-primary transition-colors text-[#1E293B] placeholder:text-[#94A3B8]"
          />
        </div>
        <div className="flex items-center gap-2 bg-white border border-[#E2E8F0] rounded-xl p-1 overflow-x-auto">
          {["All", "Active", "Closed"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${filter === f ? "bg-primary text-white" : "text-text-muted hover:text-[#1E293B]"}`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* ── Bulk WhatsApp button — JD create hone ke baad dikhega ── */}
      {lastCreatedJob && (
        <div className="flex items-center justify-between gap-3 bg-green-50 border border-green-200 rounded-2xl px-4 py-3 mb-2 flex-wrap">
          <div className="min-w-0">
            <p className="text-sm font-bold text-green-800">
              ✓ JD saved for {lastCreatedJob.companyName}
            </p>
            <p className="text-xs text-green-600 mt-0.5">
              Send WhatsApp notification to all eligible students now
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleBulkWhatsApp}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90"
              style={{ backgroundColor: "#22C55E" }}
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
                <path d="M12 0C5.373 0 0 5.373 0 12c0 2.124.558 4.115 1.535 5.84L.057 23.428a.5.5 0 00.609.61l5.652-1.463A11.945 11.945 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.9a9.878 9.878 0 01-5.031-1.378l-.36-.214-3.733.966.994-3.637-.235-.374A9.861 9.861 0 012.1 12C2.1 6.533 6.533 2.1 12 2.1c5.467 0 9.9 4.433 9.9 9.9 0 5.467-4.433 9.9-9.9 9.9z" />
              </svg>
              Send WhatsApp to Eligible Students
            </button>
            <button
              onClick={() => {
                setLastCreatedJob(null);
                localStorage.removeItem("lastCreatedJob");
              }}
              className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center text-green-600 hover:bg-green-200 transition-colors"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      {/* ── Company Cards ── */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Building2 size={40} className="text-[#CBD5E1]" />
          <p className="text-sm text-text-muted">No companies found</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map(({ company, job }) => (
            <CompanyCard
              key={company._id}
              company={company}
              job={job}
              onView={() => {
                setViewingCompany({ company, job });
                setShowViewModal(true);
              }}
              onEditCompany={() => openEditCompany(company)}
              onEditJD={() => openEditJD(company, job)}
              onPostJD={() => openPostJD(company)}
              isReadOnly={isReadOnly}
            />
          ))}
        </div>
      )}

      {/* ══ View Modal ══ */}
      {showViewModal && viewingCompany && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
          onClick={() => setShowViewModal(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 sm:p-5 border-b border-[#F1F5F9]">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center">
                  <Eye size={15} className="text-purple-500" />
                </div>
                <div>
                  <h2
                    className="text-sm font-bold text-[#1E293B]"
                    style={{ fontFamily: "Space Grotesk, sans-serif" }}
                  >
                    Company Details
                  </h2>
                  <p className="text-xs text-[#64748B]">
                    {viewingCompany.company.name}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowViewModal(false)}
                className="w-7 h-7 rounded-lg bg-[#F1F5F9] flex items-center justify-center hover:bg-[#E2E8F0] transition-colors"
              >
                <X size={14} className="text-[#64748B]" />
              </button>
            </div>

            <div className="p-4 sm:p-5 flex flex-col gap-5">
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <CompanyLogo
                    name={viewingCompany.company.name}
                    website={viewingCompany.company.website}
                    size={48}
                  />
                  <div>
                    <h3
                      className="text-base font-bold text-[#1E293B]"
                      style={{ fontFamily: "Space Grotesk, sans-serif" }}
                    >
                      {viewingCompany.company.name}
                    </h3>
                    <p className="text-xs text-[#64748B]">
                      {viewingCompany.company.industry || "—"} ·{" "}
                      {viewingCompany.company.location}
                    </p>
                  </div>
                </div>
                {viewingCompany.company.about && (
                  <p className="text-xs text-[#64748B] leading-relaxed mb-2">
                    {viewingCompany.company.about}
                  </p>
                )}
                {viewingCompany.company.website && (
                  <ExtLink
                    href={viewingCompany.company.website}
                    className="flex items-center gap-1 text-xs text-[#1a3a8f] hover:underline"
                  >
                    <ExternalLink size={11} /> {viewingCompany.company.website}
                  </ExtLink>
                )}
              </div>

              <div className="border-t border-[#F1F5F9]" />

              {viewingCompany.job ? (
                <>
                  {viewingCompany.job.jdPdfUrl && (
                    <a
                      href={viewingCompany.job.jdPdfUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#B8C6E3] bg-[#EFF3FA] text-xs font-semibold text-[#1a3a8f] hover:bg-[#E2E8F0] transition-colors w-fit"
                    >
                      <Download size={13} /> Download JD PDF
                    </a>
                  )}
                  <div>
                    <p className="text-[10px] font-semibold text-[#94A3B8] uppercase tracking-widest mb-3">
                      Job Details
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="bg-[#F8FAFC] rounded-xl p-3 border border-[#E2E8F0]">
                        <p className="text-[10px] text-[#94A3B8] mb-1">
                          Job Type
                        </p>
                        <p className="text-xs font-semibold text-[#1E293B]">
                          {viewingCompany.job.jobType}
                        </p>
                      </div>
                      {viewingCompany.job.lastDate && (
                        <div className="bg-[#F8FAFC] rounded-xl p-3 border border-[#E2E8F0]">
                          <p className="text-[10px] text-[#94A3B8] mb-1">
                            Last Date
                          </p>
                          <p
                            className={`text-xs font-semibold flex items-center gap-1.5 flex-wrap ${(daysLeft(viewingCompany.job.lastDate) ?? 999) <= 7 ? "text-red-500" : "text-[#1E293B]"}`}
                          >
                            {formatDDMMYYYY(viewingCompany.job.lastDate)}
                            {(() => {
                              const d = daysLeft(viewingCompany.job.lastDate);
                              if (d === null || d < 0) return null;
                              return (
                                <span className="px-1.5 py-0.5 rounded-full bg-red-50 text-red-500 border border-red-200 text-[10px] font-bold whitespace-nowrap">
                                  {daysLeftLabel(d)}
                                </span>
                              );
                            })()}
                          </p>
                        </div>
                      )}
                      <div className="bg-[#F8FAFC] rounded-xl p-3 border border-[#E2E8F0]">
                        <p className="text-[10px] text-[#94A3B8] mb-1">
                          Min CGPA
                        </p>
                        <p className="text-xs font-semibold text-[#1E293B]">
                          {viewingCompany.job.minCgpa > 0
                            ? `${viewingCompany.job.minCgpa} and above`
                            : "No requirement"}
                        </p>
                      </div>
                      <div className="bg-[#F8FAFC] rounded-xl p-3 border border-[#E2E8F0]">
                        <p className="text-[10px] text-[#94A3B8] mb-1">
                          Max Backlogs
                        </p>
                        <p className="text-xs font-semibold text-[#1E293B]">
                          {viewingCompany.job.maxBacklogs}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* ── Role-wise breakdown ── */}
                  {(viewingCompany.job.roleGroups ?? []).length > 0 && (
                    <div>
                      <p className="text-[10px] font-semibold text-[#94A3B8] uppercase tracking-widest mb-3">
                        Role-wise Packages
                      </p>
                      <div className="flex flex-col gap-3">
                        {viewingCompany.job.roleGroups.map((rg, i) => (
                          <div
                            key={rg._id || i}
                            className="bg-[#F8FAFC] rounded-xl p-3 border border-[#E2E8F0]"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs font-bold text-[#1E293B]">
                                {rg.role}
                              </span>
                              <span className="text-xs font-semibold text-[#1a3a8f]">
                                ₹{rg.ctc} LPA
                              </span>
                            </div>
                            {(rg.eligibleBranches ?? []).length > 0 && (
                              <div className="flex flex-wrap gap-1.5 mb-2">
                                {rg.eligibleBranches.map((b) => (
                                  <span
                                    key={b}
                                    className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-[#EFF3FA] text-[#1a3a8f] border border-[#B8C6E3]"
                                  >
                                    {b}
                                  </span>
                                ))}
                              </div>
                            )}
                            {(rg.skills ?? []).length > 0 && (
                              <div className="flex flex-wrap gap-1.5 mb-2">
                                {rg.skills.map((s) => (
                                  <span
                                    key={s}
                                    className="px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-[#F1F5F9] text-[#475569] border border-[#E2E8F0]"
                                  >
                                    {s}
                                  </span>
                                ))}
                              </div>
                            )}
                            {(rg.selectionProcess ?? []).length > 0 && (
                              <div className="flex flex-wrap gap-1.5">
                                {rg.selectionProcess.map((s, si) => (
                                  <span
                                    key={si}
                                    className="px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-white text-[#1a3a8f] border border-[#B8C6E3]"
                                  >
                                    Round {si + 1}: {s}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {viewingCompany.job.registrationLink && (
                    <div className="rounded-xl p-3 border border-[#B8C6E3] bg-[#EFF3FA]">
                      <p className="text-[10px] font-semibold text-[#94A3B8] uppercase tracking-widest mb-1.5">
                        Registration Link
                      </p>
                      <ExtLink
                        href={viewingCompany.job.registrationLink}
                        className="flex items-center gap-1.5 text-xs font-semibold text-[#1a3a8f] hover:underline break-all"
                      >
                        <ExternalLink size={12} className="flex-shrink-0" />
                        {viewingCompany.job.registrationLink}
                      </ExtLink>
                    </div>
                  )}

                  {viewingCompany.job.bondDetails && (
                    <div>
                      <p className="text-[10px] font-semibold text-[#94A3B8] uppercase tracking-widest mb-2">
                        Bond / Fee
                      </p>
                      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
                        <p className="text-xs text-[#1E293B] leading-relaxed whitespace-pre-line">
                          {viewingCompany.job.bondDetails}
                        </p>
                      </div>
                    </div>
                  )}

                  {(viewingCompany.job.perks ?? []).length > 0 && (
                    <div>
                      <p className="text-[10px] font-semibold text-[#94A3B8] uppercase tracking-widest mb-2">
                        Perks & Benefits
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {viewingCompany.job.perks.map((p) => (
                          <span
                            key={p}
                            className="px-3 py-1 rounded-full text-xs font-medium bg-green-50 text-green-600 border border-green-200"
                          >
                            {p}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-xs text-[#94A3B8] text-center py-4">
                  No JD posted for this company yet.
                </p>
              )}
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 sm:p-5 border-t border-[#F1F5F9]">
              {!isReadOnly && (
                <button
                  onClick={() => {
                    setShowViewModal(false);
                    openDeleteDialog(viewingCompany.company);
                  }}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-red-200 text-xs font-medium text-red-500 hover:bg-red-50 hover:border-red-400 transition-all"
                >
                  <Trash2 size={13} /> Delete
                </button>
              )}
              <div className="flex items-center gap-2">
                {!isReadOnly &&
                  (viewingCompany.job ? (
                    <button
                      onClick={() => {
                        setShowViewModal(false);
                        openEditJD(viewingCompany.company, viewingCompany.job);
                      }}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[#E2E8F0] text-xs font-medium text-[#64748B] hover:border-[#8B5CF6] hover:text-[#8B5CF6] transition-all"
                    >
                      <FileText size={13} /> Edit JD Details
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        setShowViewModal(false);
                        openPostJD(viewingCompany.company);
                      }}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[#E2E8F0] text-xs font-medium text-[#64748B] hover:border-[#1a3a8f] hover:text-[#1a3a8f] transition-all"
                    >
                      <FileText size={13} /> Post JD
                    </button>
                  ))}
                <button
                  onClick={() => setShowViewModal(false)}
                  className="px-3 py-2 rounded-xl bg-[#F1F5F9] text-xs font-medium text-[#64748B] hover:bg-[#E2E8F0] transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══ Add Company Modal (2-step) ══ */}
      {showCompanyModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
          onClick={() => setShowCompanyModal(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 sm:p-5 border-b border-[#F1F5F9] gap-2">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                  <Building2 size={15} className="text-[#f59e0b]" />
                </div>
                <div className="min-w-0">
                  <h2
                    className="text-sm font-bold text-[#1E293B] truncate"
                    style={{ fontFamily: "Space Grotesk, sans-serif" }}
                  >
                    {addStep === 1
                      ? createdCompanyId
                        ? "Edit Company"
                        : "Add New Company"
                      : "Post Job Description"}
                  </h2>
                  <p className="text-xs text-[#94A3B8] mt-0.5 truncate">
                    Step {addStep} of 2 —{" "}
                    {addStep === 1 ? "Company Info" : "JD Details (optional)"}
                  </p>
                </div>
              </div>
              <div className="hidden sm:flex items-center gap-2 mr-3 flex-shrink-0">
                <div
                  className={`w-6 h-6 rounded-full text-[10px] font-bold flex items-center justify-center ${addStep === 1 ? "bg-[#1a3a8f] text-white" : "bg-green-500 text-white"}`}
                >
                  {addStep > 1 ? <Check size={11} /> : "1"}
                </div>
                <div className="w-5 h-px bg-[#E2E8F0]" />
                <div
                  className={`w-6 h-6 rounded-full text-[10px] font-bold flex items-center justify-center ${addStep === 2 ? "bg-[#1a3a8f] text-white" : "bg-[#E2E8F0] text-[#94A3B8]"}`}
                >
                  2
                </div>
              </div>
              <button
                onClick={() => setShowCompanyModal(false)}
                className="w-7 h-7 rounded-lg bg-[#F1F5F9] flex items-center justify-center hover:bg-[#E2E8F0] transition-colors flex-shrink-0"
              >
                <X size={14} className="text-[#64748B]" />
              </button>
            </div>

            <div className="p-4 sm:p-5 flex flex-col gap-4">
              {addStep === 1 && (
                <>
                  {!createdCompanyId && (
                    <div className="pb-4 border-b border-background">
                      <label className="block text-xs font-semibold text-text-muted uppercase tracking-widest mb-2">
                        Job Description PDF{" "}
                        <span className="normal-case font-normal text-[#94A3B8]">
                          (optional)
                        </span>
                      </label>
                      <label className="flex items-center gap-3 cursor-pointer">
                        <span className="px-3 py-1.5 rounded-lg bg-[#EFF3FA] text-primary text-xs font-semibold border border-[#B8C6E3] hover:bg-[#E2E8F0] transition-colors flex-shrink-0">
                          Choose PDF
                        </span>
                        <span className="text-xs text-[#94A3B8] truncate">
                          {pdfFile ? pdfFile.name : "No file chosen"}
                        </span>
                        <input
                          type="file"
                          accept="application/pdf"
                          onChange={(e) => setPdfFile(e.target.files[0])}
                          className="hidden"
                        />
                      </label>
                      {pdfFile && (
                        <p className="text-[10px] text-[#94A3B8] mt-1.5">
                          Selected: {pdfFile.name}
                        </p>
                      )}
                    </div>
                  )}
                  <Field
                    label="Company Name"
                    required
                    error={companyErrors.name}
                  >
                    <input
                      value={companyForm.name}
                      onChange={(e) =>
                        setCompanyForm({ ...companyForm, name: e.target.value })
                      }
                      placeholder="e.g. Google"
                      className={inputCls}
                    />
                  </Field>
                  <Field label="Industry">
                    <input
                      value={companyForm.industry}
                      onChange={(e) =>
                        setCompanyForm({
                          ...companyForm,
                          industry: e.target.value,
                        })
                      }
                      placeholder="e.g. Technology"
                      className={inputCls}
                    />
                  </Field>
                  <Field
                    label="Location"
                    required
                    error={companyErrors.location}
                  >
                    <input
                      value={companyForm.location}
                      onChange={(e) =>
                        setCompanyForm({
                          ...companyForm,
                          location: e.target.value,
                        })
                      }
                      placeholder="e.g. Bangalore"
                      className={inputCls}
                    />
                  </Field>
                  <Field label="Website URL">
                    <input
                      value={companyForm.website}
                      onChange={(e) =>
                        setCompanyForm({
                          ...companyForm,
                          website: e.target.value,
                        })
                      }
                      placeholder="https://company.com"
                      className={inputCls}
                    />
                  </Field>
                  <Field label="Established Year" optional>
                    <input
                      type="number"
                      value={companyForm.establishedYear}
                      onChange={(e) =>
                        setCompanyForm({
                          ...companyForm,
                          establishedYear: e.target.value,
                        })
                      }
                      placeholder="e.g. 1998"
                      className={inputCls}
                    />
                  </Field>
                  <Field label="About Company">
                    <textarea
                      value={companyForm.about}
                      onChange={(e) =>
                        setCompanyForm({
                          ...companyForm,
                          about: e.target.value,
                        })
                      }
                      placeholder="Brief description about the company..."
                      rows={3}
                      className={`${inputCls} resize-none`}
                    />
                  </Field>
                </>
              )}

              {addStep === 2 && (
                <>
                  <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 flex gap-2.5">
                    <AlertCircle
                      size={14}
                      className="text-blue-400 flex-shrink-0 mt-0.5"
                    />
                    <p className="text-xs text-[#1a3a8f] leading-relaxed">
                      You can skip this and add JD details later from the
                      company card.
                    </p>
                  </div>
                  <JDFields
                    form={addJDForm}
                    setForm={setAddJDForm}
                    errors={addJDErrors}
                  />
                </>
              )}
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 sm:p-5 border-t border-[#F1F5F9]">
              {addStep === 1 && (
                <>
                  <button
                    onClick={() => setShowCompanyModal(false)}
                    className="px-4 py-2 rounded-xl border border-[#E2E8F0] text-sm font-medium text-[#64748B] hover:bg-[#F8FAFC] transition-colors"
                  >
                    Cancel
                  </button>
                  <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                    {createdCompanyId && (
                      <button
                        onClick={async () => {
                          const errs = validateCompany();
                          if (Object.keys(errs).length) {
                            setCompanyErrors(errs);
                            return;
                          }
                          await api.put(
                            `/companies/${createdCompanyId}`,
                            companyForm,
                          );
                          await fetchData();
                          setShowCompanyModal(false);
                        }}
                        className="px-4 py-2 rounded-xl border border-[#E2E8F0] text-sm font-medium text-[#64748B] hover:bg-[#F8FAFC] transition-colors"
                      >
                        Save Company Info
                      </button>
                    )}
                    <button
                      onClick={goToStep2}
                      className="px-4 py-2 rounded-xl bg-[#1a3a8f] text-white text-sm font-semibold hover:bg-[#0d1b5e] transition-colors flex items-center gap-2"
                    >
                      {createdCompanyId ? "Next: Edit JD" : "Next: Add JD"}{" "}
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </>
              )}
              {addStep === 2 && (
                <>
                  <button
                    onClick={() => setAddStep(1)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-[#E2E8F0] text-sm font-medium text-[#64748B] hover:bg-[#F8FAFC] transition-colors"
                  >
                    <ChevronLeft size={14} /> Back
                  </button>
                  <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                    <button
                      onClick={saveCompanyOnly}
                      className="px-4 py-2 rounded-xl border border-[#E2E8F0] text-sm font-medium text-[#64748B] hover:bg-[#F8FAFC] transition-colors"
                    >
                      Skip, Save Company
                    </button>
                    <button
                      onClick={saveCompanyWithJD}
                      className="px-4 py-2 rounded-xl bg-[#1a3a8f] text-white text-sm font-semibold hover:bg-[#0d1b5e] transition-colors flex items-center gap-2"
                    >
                      <FileText size={14} /> Save with JD
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ══ JD Modal (Post / Edit) ══ */}
      {showJDModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
          onClick={() => setShowJDModal(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 sm:p-5 border-b border-[#F1F5F9]">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                  <FileText size={15} className="text-[#f59e0b]" />
                </div>
                <div>
                  <h2
                    className="text-sm font-bold text-[#1E293B]"
                    style={{ fontFamily: "Space Grotesk, sans-serif" }}
                  >
                    {jdTargetJob ? "Edit JD Details" : "Post Job Description"}
                  </h2>
                  <p className="text-xs text-[#64748B]">
                    {jdTargetCompany?.name}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowJDModal(false)}
                className="w-7 h-7 rounded-lg bg-[#F1F5F9] flex items-center justify-center hover:bg-[#E2E8F0] transition-colors"
              >
                <X size={14} className="text-[#64748B]" />
              </button>
            </div>
            <div className="p-4 sm:p-5 flex flex-col gap-4">
              {/* PDF Upload */}
              <div className="pb-4 border-b border-[#F1F5F9]">
                <label className="block text-xs font-semibold text-text-muted uppercase tracking-widest mb-2">
                  Job Description PDF{" "}
                  <span className="normal-case font-normal text-[#94A3B8]">
                    (optional)
                  </span>
                </label>
                {jdTargetJob?.jdPdfUrl && (
                  <a
                    href={jdTargetJob.jdPdfUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 text-xs text-[#1a3a8f] hover:underline mb-2"
                  >
                    <FileText size={12} /> View current PDF
                  </a>
                )}
                <label className="flex items-center gap-3 cursor-pointer">
                  <span className="px-3 py-1.5 rounded-lg bg-[#EFF3FA] text-primary text-xs font-semibold border border-[#B8C6E3] hover:bg-[#E2E8F0] transition-colors flex-shrink-0">
                    Choose PDF
                  </span>
                  <span className="text-xs text-[#94A3B8] truncate">
                    {pdfFile ? pdfFile.name : "No file chosen"}
                  </span>
                  <input
                    type="file"
                    accept="application/pdf"
                    onChange={(e) => setPdfFile(e.target.files[0] || null)}
                    className="hidden"
                  />
                </label>
                {pdfFile && (
                  <p className="text-[10px] text-[#94A3B8] mt-1.5">
                    Selected: {pdfFile.name}
                  </p>
                )}
              </div>

              <JDFields form={jdForm} setForm={setJdForm} errors={jdErrors} />
            </div>
            <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-3 p-4 sm:p-5 border-t border-[#F1F5F9]">
              <button
                onClick={() => setShowJDModal(false)}
                className="px-4 py-2 rounded-xl border border-[#E2E8F0] text-sm font-medium text-[#64748B] hover:bg-[#F8FAFC] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={submitJD}
                disabled={savingJD}
                className="px-4 py-2 rounded-xl bg-[#1a3a8f] text-white text-sm font-semibold hover:bg-[#0d1b5e] transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FileText size={14} />
                {savingJD ? "Saving..." : jdTargetJob ? "Save JD" : "Post JD"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══ Delete Dialog ══ */}
      {showDeleteDialog && deletingCompany && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 px-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 flex flex-col gap-4">
            <div className="flex flex-col items-center gap-3 text-center">
              <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center">
                <Trash2 size={22} className="text-red-500" />
              </div>
              <div>
                <h3
                  className="text-sm font-bold text-[#1E293B]"
                  style={{ fontFamily: "Space Grotesk, sans-serif" }}
                >
                  Delete Company?
                </h3>
                <p className="text-xs text-[#64748B] mt-1">
                  Are you sure you want to delete{" "}
                  <span className="font-semibold text-[#1E293B]">
                    {deletingCompany.name}
                  </span>
                  ?
                </p>
              </div>
            </div>
            <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 flex gap-2.5">
              <AlertCircle
                size={14}
                className="text-red-400 flex-shrink-0 mt-0.5"
              />
              <p className="text-xs text-red-600 leading-relaxed">
                This will permanently remove the company. Associated JD details
                will remain orphaned in the database.
              </p>
            </div>
            <div className="flex gap-3 mt-1">
              <button
                onClick={() => {
                  setShowDeleteDialog(false);
                  setDeletingCompany(null);
                }}
                className="flex-1 px-4 py-2.5 rounded-xl border border-[#E2E8F0] text-sm font-medium text-text-muted hover:bg-[#F8FAFC] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 px-4 py-2.5 rounded-xl bg-red-500 text-white text-sm font-semibold hover:bg-red-600 transition-colors flex items-center justify-center gap-2"
              >
                <Trash2 size={14} /> Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
