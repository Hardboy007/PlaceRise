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
} from "lucide-react";

// ─────────────────────────────────────────────────────────────
//  CONSTANTS
// ─────────────────────────────────────────────────────────────
const BRANCHES = [
  ...new Set(
    universityStructure.flatMap((s) => s.departments.map((d) => d.name)),
  ),
  "All",
];

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
  location: "",
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

const toggleBranch = (b, form, setForm) => {
  if (b === "All") {
    setForm({
      ...form,
      eligibleBranches: form.eligibleBranches.includes("All") ? [] : ["All"],
    });
    return;
  }
  const cur = form.eligibleBranches.filter((x) => x !== "All");
  setForm({
    ...form,
    eligibleBranches: cur.includes(b)
      ? cur.filter((x) => x !== b)
      : [...cur, b],
  });
};

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
        <Field label="Location">
          <input
            value={form.location}
            onChange={(e) => setForm({ ...form, location: e.target.value })}
            placeholder="e.g. Bangalore"
            className={inputCls}
          />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Last Date to Apply" required error={errors.lastDate}>
          <input
            type="date"
            value={form.lastDate}
            onChange={(e) => setForm({ ...form, lastDate: e.target.value })}
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
      </div>

      <Field label="Eligible Branches" required error={errors.eligibleBranches}>
        <div className="flex flex-wrap gap-2 mt-1">
          {BRANCHES.map((b) => (
            <button
              key={b}
              type="button"
              onClick={() => toggleBranch(b, form, setForm)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                form.eligibleBranches.includes(b)
                  ? "bg-primary text-white border-primary"
                  : "bg-[#F8FAFC] text-text-muted border-[#E2E8F0] hover:border-primary"
              }`}
            >
              {b}
            </button>
          ))}
        </div>
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

  // Merge: har company ke saath uska job dhoondo (agar hai)
  const merged = companies.map((c) => {
    const job = jobs.find((j) => j.companyId?._id === c._id);
    return { company: c, job: job || null };
  });

  const totalCompanies = companies.length;
  const fullTime = jobs.filter((j) => j.jobType === "Full Time").length;
  const internships = jobs.filter((j) => j.jobType === "Internship").length;
  const urgent = jobs.filter((j) => {
    const d = daysLeft(j.lastDate);
    return d !== null && d <= 7 && d >= 0;
  }).length;

  const filtered = merged.filter(({ company, job }) => {
    const matchSearch = company.name
      .toLowerCase()
      .includes(search.toLowerCase());
    const matchFilter =
      filter === "All" ? true : filter === "Active" ? !!job : !job;
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
    // Company yahin save karo, JD baad mein link hoga
    const newCompany = await api.post("/companies", companyForm);
    setCreatedCompanyId(newCompany._id);
    setAddStep(2);
  };

  const saveCompanyOnly = async () => {
    await fetchData();
    setShowCompanyModal(false);
  };

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
      location: addJDForm.location || companyForm.location,
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
      location: job.location || "",
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
      location: jdForm.location || jdTargetCompany.location,
      lastDate: jdForm.lastDate,
      minCgpa: jdForm.minCgpa ? parseFloat(jdForm.minCgpa) : 0,
      eligibleBranches: jdForm.eligibleBranches,
      maxBacklogs: jdForm.maxBacklogs ? parseInt(jdForm.maxBacklogs) : 0,
      techStack: jdForm.techStack,
      skills: jdForm.skills,
      perks: jdForm.perks,
      selectionProcess: jdForm.selectionProcess,
    };

    if (jdTargetJob) {
      await api.put(`/jobs/${jdTargetJob._id}`, payload);
    } else {
      await api.post("/jobs", payload);
    }
    await fetchData();
    setShowJDModal(false);
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
            const isUrgent = days !== null && days <= 7;

            return (
              <div
                key={company._id}
                className="bg-white rounded-2xl border border-[#E2E8F0] border-l-4 border-l-primary p-5 shadow-sm hover:shadow-md transition-all"
              >
                <div className="flex items-start gap-4">
                  <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                    <Building2 size={20} className="text-primary" />
                  </div>
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
                          className={`flex items-center gap-1 text-xs font-medium ${isUrgent ? "text-red-500" : "text-text-muted"}`}
                        >
                          <Calendar size={11} />
                          {new Date(job.lastDate).toLocaleDateString()}
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
                        {job.eligibleBranches.map((b) => (
                          <span
                            key={b}
                            className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-background text-[#64748B] border border-[#E2E8F0]"
                          >
                            {b}
                          </span>
                        ))}
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
                            {new Date(
                              viewingCompany.job.lastDate,
                            ).toLocaleDateString()}
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
                        Eligible Branches
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {viewingCompany.job.eligibleBranches.map((b) => (
                          <span
                            key={b}
                            className="px-3 py-1 rounded-full text-xs font-medium bg-[#F1F5F9] text-[#475569] border border-[#E2E8F0]"
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
                    {addStep === 1 ? "Add New Company" : "Post Job Description"}
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
                  <button
                    onClick={goToStep2}
                    className="px-4 py-2 rounded-xl bg-[#3B82F6] text-white text-sm font-semibold hover:bg-[#2563EB] transition-colors flex items-center gap-2"
                  >
                    Next: Add JD <ChevronRight size={14} />
                  </button>
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
                className="px-4 py-2 rounded-xl bg-[#3B82F6] text-white text-sm font-semibold hover:bg-[#2563EB] transition-colors flex items-center gap-2"
              >
                <FileText size={14} /> {jdTargetJob ? "Save JD" : "Post JD"}
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
