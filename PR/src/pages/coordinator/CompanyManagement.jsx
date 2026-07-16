import { useState, useEffect } from "react";
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

// ─────────────────────────────────────────────────────────────
//  CONSTANTS
// ─────────────────────────────────────────────────────────────
const inputCls =
  "w-full px-3 py-2 text-sm text-[#1E293B] border border-[#E2E8F0] rounded-xl bg-[#F8FAFC] focus:outline-none focus:border-[#3B82F6] transition-colors placeholder:text-[#94A3B8]";

const emptyCompany = {
  name: "",
  about: "",
  industry: "",
  location: "",
  website: "",
  establishedYear: "",
};

const emptyJD = {
  role: "",
  ctc: "",
  jobType: "Full Time",
  lastDate: "",
  minCgpa: "",
  eligibleBranches: [],
  maxBacklogs: "0",
  techStack: [],
  skills: [],
  perks: [],
  selectionProcess: [],
};

const daysLeft = (lastDate) => {
  if (!lastDate) return null;
  const d = new Date(lastDate);
  if (isNaN(d.getTime())) return null;
  return Math.ceil((d - new Date()) / (1000 * 60 * 60 * 24));
};

const isExpired = (lastDate) => {
  const d = daysLeft(lastDate);
  return d !== null && d < 0;
};

// FIXED: plain `.toLocaleDateString()` (no locale arg) renders mm/dd/yyyy
// or dd/mm/yyyy depending on the visiting browser's own locale setting —
// so the same date showed differently for different users/machines.
// Forcing "en-GB" always gives dd/mm/yyyy regardless of the browser.
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
//  BRANCH SELECTOR — flat accordion with smart quick-select
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
            ? "border-[#3B82F6] bg-blue-50/30"
            : "border-[#E2E8F0] bg-[#F8FAFC] hover:border-[#3B82F6]"
        }`}
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <GraduationCap
              size={15}
              className={
                selected.length > 0
                  ? "text-[#3B82F6] flex-shrink-0"
                  : "text-[#94A3B8] flex-shrink-0"
              }
            />
            <span
              className={`text-sm truncate ${selected.length > 0 ? "text-[#3B82F6] font-medium" : "text-[#94A3B8]"}`}
            >
              {triggerLabel}
            </span>
          </div>
          <span className="flex items-center gap-1 text-xs text-[#3B82F6] flex-shrink-0 font-medium">
            <Pencil size={11} />
            {selected.length > 0 ? "Edit" : "Select"}
          </span>
        </div>

        {selected.length > 0 && selected.length <= 4 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {selected.map((c) => (
              <span
                key={c}
                className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-blue-100 text-[#3B82F6] border border-blue-200"
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
                className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-blue-100 text-[#3B82F6] border border-blue-200"
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
            <div className="p-5 border-b border-[#F1F5F9] flex-shrink-0">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center">
                    <GraduationCap size={14} className="text-[#3B82F6]" />
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
                        ? "bg-[#3B82F6] text-white border-[#3B82F6]"
                        : "bg-[#F8FAFC] text-[#64748B] border-[#E2E8F0] hover:border-[#3B82F6] hover:text-[#3B82F6]"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2 border border-[#E2E8F0] rounded-xl px-3 py-2 bg-[#F8FAFC] focus-within:border-[#3B82F6] transition-colors">
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
                          className="w-4 h-4 accent-[#3B82F6] flex-shrink-0 cursor-pointer"
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
                                    className="w-3.5 h-3.5 accent-[#3B82F6] flex-shrink-0 cursor-pointer"
                                  />
                                  <span className="text-xs font-medium text-[#64748B]">
                                    {dept.name}
                                  </span>
                                  <span className="text-[10px] text-[#CBD5E1] ml-auto">
                                    {dept.courses.length} courses
                                  </span>
                                </div>
                                <div className="grid grid-cols-2 gap-1 pl-6">
                                  {dept.courses.map((course) => (
                                    <label
                                      key={course}
                                      className="flex items-start gap-2 px-2 py-1.5 rounded-lg cursor-pointer hover:bg-[#F1F5F9] transition-colors"
                                    >
                                      <input
                                        type="checkbox"
                                        checked={tempSel.includes(course)}
                                        onChange={() => toggleCourse(course)}
                                        className="w-3 h-3 accent-[#3B82F6] flex-shrink-0 mt-0.5 cursor-pointer"
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

            <div className="flex items-center justify-between px-5 py-4 border-t border-[#F1F5F9] flex-shrink-0">
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
                  className="px-4 py-1.5 rounded-xl bg-[#3B82F6] text-white text-xs font-semibold hover:bg-[#2563EB] transition-colors flex items-center gap-1.5"
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
      <div className="grid grid-cols-2 gap-4">
        <Field label="Role / Position" required error={errors.role}>
          <input
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value })}
            placeholder="e.g. Software Engineer"
            className={inputCls}
          />
        </Field>
        <Field label="CTC (LPA)" required error={errors.ctc}>
          <input
            type="number"
            value={form.ctc}
            onChange={(e) => setForm({ ...form, ctc: e.target.value })}
            placeholder="e.g. 12"
            className={inputCls}
          />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-4">
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

      {/* ── Eligible Branches — replaced with modal selector ── */}
      <Field
        label="Eligible Branches & Courses"
        required
        error={errors.eligibleBranches}
      >
        <BranchSelectorModal
          selected={form.eligibleBranches}
          onChange={(eligibleBranches) =>
            setForm({ ...form, eligibleBranches })
          }
        />
      </Field>

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

      <Field label="Tech Stack">
        <TagInput
          tags={form.techStack}
          setTags={(t) => setForm({ ...form, techStack: t })}
          placeholder="Type and press Enter (e.g. React, Node.js)"
        />
      </Field>

      <Field label="Skills Required">
        <TagInput
          tags={form.skills}
          setTags={(t) => setForm({ ...form, skills: t })}
          placeholder="Type and press Enter (e.g. DSA, SQL)"
        />
      </Field>

      <Field label="Perks & Benefits">
        <TagInput
          tags={form.perks}
          setTags={(t) => setForm({ ...form, perks: t })}
          placeholder="Type and press Enter (e.g. Health Insurance)"
        />
      </Field>

      <Field label="Selection Process">
        <TagInput
          tags={form.selectionProcess}
          setTags={(t) => setForm({ ...form, selectionProcess: t })}
          placeholder="Type and press Enter (e.g. Aptitude, Technical Round, HR)"
        />
        <p className="text-[10px] text-[#94A3B8] mt-1">
          Each entry will be shown as Round 1, Round 2... in order
        </p>
      </Field>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
//  MAIN PAGE COMPONENT
// ─────────────────────────────────────────────────────────────
export default function CompanyManagementPage() {
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

  const [showViewModal, setShowViewModal] = useState(false);
  const [viewingCompany, setViewingCompany] = useState(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deletingCompany, setDeletingCompany] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    const [companiesData, jobsData] = await Promise.all([
      api.get("/companies"),
      api.get("/companies/jobs"),
    ]);
    setCompanies(Array.isArray(companiesData) ? companiesData : []);
    setJobs(Array.isArray(jobsData) ? jobsData : []);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  // ── FIX: jobs ko sirf un companies ke liye consider karo jo
  // current "companies" list me actually maujood hain. Pehle
  // stats (fullTime/internships/urgent) seedhe raw `jobs` array
  // se nikal rahe the, jisme dusri companies/coordinators ke
  // stale ya unrelated jobs bhi count ho rahe the.
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
    if (!form.role.trim()) errs.role = "Role is required";
    if (!form.ctc) errs.ctc = "CTC is required";
    if (!form.lastDate) errs.lastDate = "Last date is required";
    if (!form.eligibleBranches.length)
      errs.eligibleBranches = "Select at least one branch";
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

  const goToStep2 = async () => {
    const errs = validateCompany();
    if (Object.keys(errs).length) {
      setCompanyErrors(errs);
      return;
    }
    if (createdCompanyId) {
      // Edit mode — update existing
      await api.put(`/companies/${createdCompanyId}`, companyForm);
    } else {
      // Add mode — create new
      const newCompany = await api.post("/companies", companyForm);
      setCreatedCompanyId(newCompany._id);
    }
    setAddStep(2);
  };

  const saveCompanyOnly = async () => {
    await fetchData();
    setShowCompanyModal(false);
  };

  // location ab JD form mein nahi — company ka location use hoga
  const saveCompanyWithJD = async () => {
    const errs = validateJD(addJDForm);
    if (Object.keys(errs).length) {
      setAddJDErrors(errs);
      return;
    }
    await api.post("/jobs", {
      companyId: createdCompanyId,
      role: addJDForm.role,
      ctc: parseFloat(addJDForm.ctc),
      jobType: addJDForm.jobType,
      location: companyForm.location,
      lastDate: addJDForm.lastDate,
      minCgpa: addJDForm.minCgpa ? parseFloat(addJDForm.minCgpa) : 0,
      eligibleBranches: addJDForm.eligibleBranches,
      maxBacklogs: addJDForm.maxBacklogs ? parseInt(addJDForm.maxBacklogs) : 0,
      techStack: addJDForm.techStack,
      skills: addJDForm.skills,
      perks: addJDForm.perks,
      selectionProcess: addJDForm.selectionProcess,
    });
    await fetchData();
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
      role: job.role || "",
      ctc: job.ctc || "",
      jobType: job.jobType || "Full Time",
      lastDate: job.lastDate ? job.lastDate.split("T")[0] : "",
      minCgpa: job.minCgpa || "",
      eligibleBranches: job.eligibleBranches || [],
      maxBacklogs: job.maxBacklogs ?? "0",
      techStack: job.techStack || [],
      skills: job.skills || [],
      perks: job.perks || [],
      selectionProcess: job.selectionProcess || [],
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
      role: jdForm.role,
      ctc: parseFloat(jdForm.ctc),
      jobType: jdForm.jobType,
      location: jdTargetCompany.location,
      lastDate: jdForm.lastDate,
      minCgpa: jdForm.minCgpa ? parseFloat(jdForm.minCgpa) : 0,
      eligibleBranches: jdForm.eligibleBranches,
      maxBacklogs: jdForm.maxBacklogs ? parseInt(jdForm.maxBacklogs) : 0,
      techStack: jdForm.techStack,
      skills: jdForm.skills,
      perks: jdForm.perks,
      selectionProcess: jdForm.selectionProcess,
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

      // PDF select ki hui hai to usko bhi save karte hi upload kar do
      if (pdfFile && jobId) {
        const formData = new FormData();
        formData.append("pdf", pdfFile);
        await api.post(`/companies/jobs/${jobId}/upload-pdf`, formData);
      }

      setPdfFile(null);
      await fetchData();
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

  if (loading)
    return <div className="text-center py-20 text-text-muted">Loading...</div>;

  return (
    <div
      className="max-w-6xl mx-auto px-1"
      style={{ fontFamily: "Inter, sans-serif" }}
    >
      {/* ══ HERO ══ */}
      <div
        className="relative rounded-2xl overflow-hidden mb-6 p-6"
        style={{
          background:
            "linear-gradient(135deg, #1D4ED8 0%, #2563EB 45%, #0EA5E9 100%)",
        }}
      >
        <div
          className="absolute top-0 right-0 w-72 h-72 rounded-full pointer-events-none"
          style={{
            background: "rgba(255,255,255,0.08)",
            transform: "translate(35%,-45%)",
          }}
        />
        <div
          className="absolute bottom-0 left-0 w-52 h-52 rounded-full pointer-events-none"
          style={{
            background: "rgba(255,255,255,0.06)",
            transform: "translate(-30%,40%)",
          }}
        />

        <div className="relative flex items-start justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <div className="w-6 h-6 rounded-md bg-white/20 flex items-center justify-center">
                <Building2 size={13} className="text-white" />
              </div>
              <span className="text-white/60 text-[10px] font-bold uppercase tracking-widest">
                Placement Portal
              </span>
            </div>
            <h1
              className="text-2xl font-bold text-white"
              style={{ fontFamily: "Space Grotesk, sans-serif" }}
            >
              Company Management
            </h1>
            <p className="text-white/55 text-xs mt-1">
              Manage recruiters, post JDs, and track placement drives
            </p>
          </div>
          <button
            onClick={openAddCompany}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-[#1D4ED8] text-sm font-bold hover:bg-blue-50 transition-colors shadow-lg shrink-0 mt-1"
          >
            <Plus size={15} /> Add Company
          </button>
        </div>

        <div className="relative grid grid-cols-4 gap-3">
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
              className="rounded-xl px-4 py-3 border border-white/10"
              style={{
                background: highlight
                  ? "rgba(239,68,68,0.25)"
                  : "rgba(255,255,255,0.12)",
              }}
            >
              <div className="flex items-center gap-1.5 mb-1">
                <Icon size={12} className="text-white/60" />
                <span className="text-white/55 text-[10px] font-semibold uppercase tracking-wider">
                  {label}
                </span>
              </div>
              <p
                className="text-white text-2xl font-bold leading-none"
                style={{ fontFamily: "Space Grotesk, sans-serif" }}
              >
                {value}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Search + Filter ── */}
      <div className="flex items-center gap-3 mb-5">
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
        <div className="flex items-center gap-2 bg-white border border-[#E2E8F0] rounded-xl p-1">
          {["All", "Active", "Closed"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${filter === f ? "bg-primary text-white" : "text-text-muted hover:text-[#1E293B]"}`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* ── Company Cards ── */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Building2 size={40} className="text-[#CBD5E1]" />
          <p className="text-sm text-text-muted">No companies found</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map(({ company, job }) => {
            const days = job ? daysLeft(job.lastDate) : null;
            const expired = job ? isExpired(job.lastDate) : false;
            const isUrgent = !expired && days !== null && days <= 7;

            return (
              <div
                key={company._id}
                className="bg-white rounded-2xl border border-[#E2E8F0] border-l-4 border-l-primary p-5 shadow-sm hover:shadow-md transition-all"
              >
                <div className="flex items-start gap-4">
                  <CompanyLogo
                    name={company.name}
                    website={company.website}
                    size={44}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h3
                        className="text-sm font-bold text-[#1E293B]"
                        style={{ fontFamily: "Space Grotesk, sans-serif" }}
                      >
                        {company.name}
                      </h3>
                      {job?.role && (
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-primary border border-blue-200">
                          {job.role}
                        </span>
                      )}
                      {job && (
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                            job.jobType === "Internship"
                              ? "bg-purple-50 text-purple-600 border border-purple-200"
                              : "bg-green-50 text-green-600 border border-green-200"
                          }`}
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
                      {job?.ctc > 0 && (
                        <span className="flex items-center gap-1 text-xs text-text-muted">
                          <Briefcase size={11} /> ₹{job.ctc} LPA
                        </span>
                      )}
                      {job?.lastDate && (
                        <span
                          className={`flex items-center gap-1 text-xs font-medium ${expired ? "text-red-400" : isUrgent ? "text-red-500" : "text-text-muted"}`}
                        >
                          <Calendar size={11} />
                          {formatDDMMYYYY(job.lastDate)}
                          {isUrgent && (
                            <span className="ml-1 px-1.5 py-0.5 rounded-full bg-red-50 text-red-500 border border-red-200 text-[10px] font-bold">
                              {days}d left
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
                    {(job?.eligibleBranches ?? []).length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {job.eligibleBranches.slice(0, 3).map((b) => (
                          <span
                            key={b}
                            className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-background text-[#64748B] border border-[#E2E8F0]"
                          >
                            {b.length > 35 ? b.slice(0, 33) + "…" : b}
                          </span>
                        ))}
                        {job.eligibleBranches.length > 3 && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-background text-[#94A3B8] border border-[#E2E8F0]">
                            +{job.eligibleBranches.length - 3} more
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => {
                        setViewingCompany({ company, job });
                        setShowViewModal(true);
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E2E8F0] text-xs font-medium text-[#64748B] hover:border-[#8B5CF6] hover:text-[#8B5CF6] transition-all"
                    >
                      <Eye size={12} /> View
                    </button>
                    <button
                      onClick={() => openEditCompany(company)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#F1F5F9] text-[#475569] border border-[#E2E8F0] text-xs font-semibold hover:bg-[#E2E8F0] transition-colors"
                    >
                      <Pencil size={12} /> Edit Company Info
                    </button>
                    {job ? (
                      <button
                        onClick={() => openEditJD(company, job)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#F1F5F9] text-[#475569] border border-[#E2E8F0] text-xs font-semibold hover:bg-[#E2E8F0] transition-colors"
                      >
                        <Pencil size={12} /> Edit JD
                      </button>
                    ) : (
                      <button
                        onClick={() => openPostJD(company)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#3B82F6] text-white text-xs font-semibold hover:bg-[#2563EB] transition-colors"
                      >
                        <FileText size={12} /> Post JD
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
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
            <div className="flex items-center justify-between p-5 border-b border-[#F1F5F9]">
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

            <div className="p-5 flex flex-col gap-5">
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
                    <Building2 size={22} className="text-[#3B82F6]" />
                  </div>
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
                  <a
                    href={viewingCompany.company.website}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 text-xs text-[#3B82F6] hover:underline"
                  >
                    <ExternalLink size={11} /> {viewingCompany.company.website}
                  </a>
                )}
              </div>

              <div className="border-t border-[#F1F5F9]" />

              {viewingCompany.job ? (
                <>
                  <div>
                    <p className="text-[10px] font-semibold text-[#94A3B8] uppercase tracking-widest mb-3">
                      Job Details
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-[#F8FAFC] rounded-xl p-3 border border-[#E2E8F0]">
                        <p className="text-[10px] text-[#94A3B8] mb-1">Role</p>
                        <p className="text-xs font-semibold text-[#1E293B]">
                          {viewingCompany.job.role}
                        </p>
                      </div>
                      <div className="bg-[#F8FAFC] rounded-xl p-3 border border-[#E2E8F0]">
                        <p className="text-[10px] text-[#94A3B8] mb-1">CTC</p>
                        <p className="text-xs font-semibold text-[#1E293B]">
                          ₹{viewingCompany.job.ctc} LPA
                        </p>
                      </div>
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
                            className={`text-xs font-semibold ${(daysLeft(viewingCompany.job.lastDate) ?? 999) <= 7 ? "text-red-500" : "text-[#1E293B]"}`}
                          >
                            {formatDDMMYYYY(viewingCompany.job.lastDate)}
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

                  {(viewingCompany.job.eligibleBranches ?? []).length > 0 && (
                    <div>
                      <p className="text-[10px] font-semibold text-[#94A3B8] uppercase tracking-widest mb-2">
                        Eligible Branches & Courses
                        <span className="ml-2 normal-case font-normal text-[#CBD5E1]">
                          ({viewingCompany.job.eligibleBranches.length}{" "}
                          selected)
                        </span>
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {viewingCompany.job.eligibleBranches.map((b) => (
                          <span
                            key={b}
                            className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-blue-50 text-[#3B82F6] border border-blue-200"
                          >
                            {b}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {(viewingCompany.job.selectionProcess ?? []).length > 0 && (
                    <div>
                      <p className="text-[10px] font-semibold text-[#94A3B8] uppercase tracking-widest mb-2">
                        Selection Process
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {viewingCompany.job.selectionProcess.map((s, i) => (
                          <span
                            key={i}
                            className="px-3 py-1 rounded-full text-xs font-medium bg-blue-50 text-[#3B82F6] border border-blue-200"
                          >
                            Round {i + 1}: {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {(viewingCompany.job.techStack ?? []).length > 0 && (
                    <div>
                      <p className="text-[10px] font-semibold text-[#94A3B8] uppercase tracking-widest mb-2">
                        Tech Stack
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {viewingCompany.job.techStack.map((t) => (
                          <span
                            key={t}
                            className="px-3 py-1 rounded-full text-xs font-medium bg-purple-50 text-purple-600 border border-purple-200"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {(viewingCompany.job.skills ?? []).length > 0 && (
                    <div>
                      <p className="text-[10px] font-semibold text-[#94A3B8] uppercase tracking-widest mb-2">
                        Skills Required
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {viewingCompany.job.skills.map((s) => (
                          <span
                            key={s}
                            className="px-3 py-1 rounded-full text-xs font-medium bg-[#F1F5F9] text-[#475569] border border-[#E2E8F0]"
                          >
                            {s}
                          </span>
                        ))}
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

            <div className="flex items-center justify-between gap-3 p-5 border-t border-[#F1F5F9]">
              <button
                onClick={() => {
                  setShowViewModal(false);
                  openDeleteDialog(viewingCompany.company);
                }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-red-200 text-xs font-medium text-red-500 hover:bg-red-50 hover:border-red-400 transition-all"
              >
                <Trash2 size={13} /> Delete
              </button>
              <div className="flex items-center gap-2">
                {viewingCompany.job ? (
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
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[#E2E8F0] text-xs font-medium text-[#64748B] hover:border-[#3B82F6] hover:text-[#3B82F6] transition-all"
                  >
                    <FileText size={13} /> Post JD
                  </button>
                )}
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
            <div className="flex items-center justify-between p-5 border-b border-[#F1F5F9]">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                  <Building2 size={15} className="text-[#3B82F6]" />
                </div>
                <div>
                  <h2
                    className="text-sm font-bold text-[#1E293B]"
                    style={{ fontFamily: "Space Grotesk, sans-serif" }}
                  >
                    {addStep === 1
                      ? createdCompanyId
                        ? "Edit Company"
                        : "Add New Company"
                      : "Post Job Description"}
                  </h2>
                  <p className="text-xs text-[#94A3B8] mt-0.5">
                    Step {addStep} of 2 —{" "}
                    {addStep === 1 ? "Company Info" : "JD Details (optional)"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 mr-3">
                <div
                  className={`w-6 h-6 rounded-full text-[10px] font-bold flex items-center justify-center ${addStep === 1 ? "bg-[#3B82F6] text-white" : "bg-green-500 text-white"}`}
                >
                  {addStep > 1 ? <Check size={11} /> : "1"}
                </div>
                <div className="w-5 h-px bg-[#E2E8F0]" />
                <div
                  className={`w-6 h-6 rounded-full text-[10px] font-bold flex items-center justify-center ${addStep === 2 ? "bg-[#3B82F6] text-white" : "bg-[#E2E8F0] text-[#94A3B8]"}`}
                >
                  2
                </div>
              </div>
              <button
                onClick={() => setShowCompanyModal(false)}
                className="w-7 h-7 rounded-lg bg-[#F1F5F9] flex items-center justify-center hover:bg-[#E2E8F0] transition-colors"
              >
                <X size={14} className="text-[#64748B]" />
              </button>
            </div>

            <div className="p-5 flex flex-col gap-4">
              {addStep === 1 && (
                <>
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
                    <p className="text-xs text-blue-600 leading-relaxed">
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

            <div className="flex items-center justify-between gap-3 p-5 border-t border-[#F1F5F9]">
              {addStep === 1 && (
                <>
                  <button
                    onClick={() => setShowCompanyModal(false)}
                    className="px-4 py-2 rounded-xl border border-[#E2E8F0] text-sm font-medium text-[#64748B] hover:bg-[#F8FAFC] transition-colors"
                  >
                    Cancel
                  </button>
                  <div className="flex items-center gap-2">
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
                      className="px-4 py-2 rounded-xl bg-[#3B82F6] text-white text-sm font-semibold hover:bg-[#2563EB] transition-colors flex items-center gap-2"
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
                  <div className="flex items-center gap-2">
                    <button
                      onClick={saveCompanyOnly}
                      className="px-4 py-2 rounded-xl border border-[#E2E8F0] text-sm font-medium text-[#64748B] hover:bg-[#F8FAFC] transition-colors"
                    >
                      Skip, Save Company
                    </button>
                    <button
                      onClick={saveCompanyWithJD}
                      className="px-4 py-2 rounded-xl bg-[#3B82F6] text-white text-sm font-semibold hover:bg-[#2563EB] transition-colors flex items-center gap-2"
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
            <div className="flex items-center justify-between p-5 border-b border-[#F1F5F9]">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                  <FileText size={15} className="text-[#3B82F6]" />
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
            <div className="p-5">
              <JDFields form={jdForm} setForm={setJdForm} errors={jdErrors} />

              {jdTargetJob && (
                <div className="mt-5 pt-4 border-t border-[#F1F5F9]">
                  <label className="block text-xs font-semibold text-text-muted uppercase tracking-widest mb-2">
                    Job Description PDF
                  </label>

                  {jdTargetJob.jdPdfUrl && (
                    <a
                      href={jdTargetJob.jdPdfUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1.5 text-xs text-[#3B82F6] hover:underline mb-2"
                    >
                      <FileText size={12} />
                      View current PDF
                    </a>
                  )}

                  <label className="flex items-center gap-3 cursor-pointer">
                    <span className="px-3 py-1.5 rounded-lg bg-blue-50 text-[#3B82F6] text-xs font-semibold border border-blue-200 hover:bg-blue-100 transition-colors flex-shrink-0">
                      Choose File
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
                      Selected: {pdfFile.name} (will upload on Save)
                    </p>
                  )}
                </div>
              )}
            </div>
            <div className="flex items-center justify-end gap-3 p-5 border-t border-[#F1F5F9]">
              <button
                onClick={() => setShowJDModal(false)}
                className="px-4 py-2 rounded-xl border border-[#E2E8F0] text-sm font-medium text-[#64748B] hover:bg-[#F8FAFC] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={submitJD}
                disabled={savingJD}
                className="px-4 py-2 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-[#2563EB] transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
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
