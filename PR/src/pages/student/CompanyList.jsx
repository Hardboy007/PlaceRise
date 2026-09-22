import { useState, useMemo, useEffect, useRef } from "react";
import universityStructure from "../../data/universityStructure";
import {
  Search,
  Building2,
  Briefcase,
  TrendingUp,
  Calendar,
  ChevronRight,
  Filter,
  ChevronDown,
  X,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { api } from "../../utils/api";
import CompanyLogo from "../../components/common/CompanyLogo";

const branchMatches = (eligibleBranches, student) =>
  !eligibleBranches?.length ||
  eligibleBranches.includes("All") ||
  eligibleBranches.includes(student?.course) ||
  eligibleBranches.includes(student?.branch);

const getRoleGroups = (job) => {
  if (job?.roleGroups?.length) return job.roleGroups;
  if (job?.role) {
    return [
      {
        _id: "legacy",
        role: job.role,
        ctc: job.ctc,
        eligibleBranches: job.eligibleBranches ?? [],
        skills: job.skills ?? [],
        selectionProcess: job.selectionProcess ?? [],
      },
    ];
  }
  return [];
};

const getMatchedRoleGroups = (job, student) =>
  getRoleGroups(job).filter((rg) =>
    branchMatches(rg.eligibleBranches, student),
  );

// All courses from universityStructure — these match DB eligibleBranches values
const ALL_COURSES = universityStructure.flatMap((school) =>
  school.departments.flatMap((dept) =>
    dept.courses.map((course) => ({
      school: school.school,
      course,
    })),
  ),
);

function formatDate(dateStr) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// Searchable + grouped branch dropdown
function BranchSearchDropdown({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
        setQuery("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Group courses by school, filtered by search query
  const groupedFiltered = useMemo(() => {
    const q = query.toLowerCase().trim();
    const result = {};
    ALL_COURSES.forEach(({ school, course }) => {
      if (
        q &&
        !course.toLowerCase().includes(q) &&
        !school.toLowerCase().includes(q)
      )
        return;
      if (!result[school]) result[school] = [];
      result[school].push(course);
    });
    return result;
  }, [query]);

  const totalFiltered = Object.values(groupedFiltered).flat().length;
  const displayLabel = value === "All" ? null : value;

  return (
    <div ref={ref} className="relative w-full sm:min-w-[220px] sm:w-auto">
      {/* Trigger */}
      <button
        type="button"
        onClick={() => {
          setOpen((o) => !o);
          setQuery("");
        }}
        className="w-full flex items-center justify-between gap-2 px-4 py-2.5 rounded-xl border border-[#CBD5E1] bg-white text-sm hover:border-[#1a3a8f] transition focus:outline-none focus:border-[#1a3a8f] focus:ring-2 focus:ring-[#1a3a8f]/20"
      >
        <span
          className={`truncate max-w-[160px] ${displayLabel ? "text-[#1E293B] font-medium text-xs" : "text-[#94A3B8]"}`}
        >
          {displayLabel || "All Branches"}
        </span>
        <div className="flex items-center gap-1 shrink-0">
          {value !== "All" && (
            <span
              onClick={(e) => {
                e.stopPropagation();
                onChange("All");
              }}
              className="text-[#94A3B8] hover:text-[#EF4444] cursor-pointer"
            >
              <X size={13} />
            </span>
          )}
          <ChevronDown
            size={14}
            className={`text-[#94A3B8] transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          />
        </div>
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute z-50 mt-1 left-0 w-[calc(100vw-2.5rem)] sm:w-80 max-w-80 bg-white border border-[#E2E8F0] rounded-xl shadow-xl overflow-hidden">
          {/* Search */}
          <div className="p-2.5 border-b border-[#F1F5F9] sticky top-0 bg-white">
            <div className="relative">
              <Search
                size={13}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#94A3B8]"
              />
              <input
                autoFocus
                type="text"
                placeholder="Search branch or course..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full pl-7 pr-3 py-1.5 rounded-lg border border-[#E2E8F0] text-xs text-[#1E293B] placeholder-[#94A3B8] focus:outline-none focus:border-[#1a3a8f]"
              />
            </div>
          </div>

          <div className="max-h-64 overflow-y-auto">
            {/* All Branches option */}
            <button
              type="button"
              onClick={() => {
                onChange("All");
                setOpen(false);
                setQuery("");
              }}
              className={`w-full text-left px-4 py-2 text-xs font-semibold border-b border-[#F1F5F9] transition-colors ${
                value === "All"
                  ? "bg-[#eef1fb] text-[#1a3a8f]"
                  : "text-[#1E293B] hover:bg-[#F8FAFC]"
              }`}
            >
              All Branches
            </button>

            {totalFiltered === 0 ? (
              <div className="text-xs text-[#94A3B8] text-center py-6">
                No results found
              </div>
            ) : (
              Object.entries(groupedFiltered).map(([school, courses]) => (
                <div key={school}>
                  {/* School group header */}
                  <div className="px-4 py-1.5 bg-[#F8FAFC] border-y border-[#F1F5F9]">
                    <p className="text-[10px] font-semibold text-[#94A3B8] uppercase tracking-wider truncate">
                      {school.replace(/\(.*?\)/g, "").trim()}
                    </p>
                  </div>
                  {/* Courses */}
                  {courses.map((course) => (
                    <button
                      key={course}
                      type="button"
                      onClick={() => {
                        onChange(course);
                        setOpen(false);
                        setQuery("");
                      }}
                      className={`w-full text-left px-4 py-2 text-xs transition-colors ${
                        value === course
                          ? "bg-[#eef1fb] text-[#1a3a8f] font-semibold"
                          : "text-[#475569] hover:bg-[#F8FAFC] hover:text-[#1E293B]"
                      }`}
                    >
                      {course}
                    </button>
                  ))}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Self-contained role dropdown — replaces native <select> so the option
// list always renders inside the app's own width (native <select> menus
// are OS-rendered and ignore any container/viewport sizing, which made
// the list blow out past the card on narrow / emulated mobile screens).
//
// FIXED: the option list could still overflow past the bottom of the
// screen on mobile because the height cap and the rounded-corner clip
// were both on the SAME element (`overflow-hidden` + `max-h-64
// overflow-y-auto` together), which is fragile — the list is now split
// into an outer wrapper (rounded corners + shadow + overflow-hidden,
// never scrolls) and an inner div that alone owns the max-height +
// scroll, so clipping and scrolling can't step on each other. The mobile
// cap is also shorter (max-h-52 ≈ 208px) so the list reliably fits
// within a phone viewport instead of running off the bottom edge.
function RoleDropdown({ value, onChange, options }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative w-full md:w-auto md:min-w-[180px]">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-2 px-4 py-2.5 rounded-xl border border-[#CBD5E1] bg-white text-sm text-[#1E293B] hover:border-[#1a3a8f] transition focus:outline-none focus:border-[#1a3a8f] focus:ring-2 focus:ring-[#1a3a8f]/20"
      >
        <span className="truncate">
          {value === "All" ? "All Roles" : value}
        </span>
        <ChevronDown
          size={14}
          className={`text-[#94A3B8] shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="absolute z-50 mt-1 left-0 right-0 md:left-auto md:right-0 md:w-56 bg-white border border-[#E2E8F0] rounded-xl shadow-xl overflow-hidden">
          <div className="max-h-52 sm:max-h-64 overflow-y-auto overscroll-contain">
            {options.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => {
                  onChange(r);
                  setOpen(false);
                }}
                className={`w-full text-left px-4 py-2 text-sm transition-colors border-b border-[#F1F5F9] last:border-b-0 ${
                  value === r
                    ? "bg-[#eef1fb] text-[#1a3a8f] font-semibold"
                    : "text-[#1E293B] hover:bg-[#F8FAFC]"
                }`}
              >
                {r === "All" ? "All Roles" : r}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function BranchChips({ branches }) {
  if (!branches || branches.length === 0)
    return <span className="text-xs text-[#94A3B8]">—</span>;

  if (branches.includes("All"))
    return (
      <span className="text-xs px-2 py-0.5 rounded-md bg-[#eef1fb] text-[#1a3a8f] border-[#c7d0f0] border font-medium">
        All Branches
      </span>
    );

  const shorten = (name) =>
    name
      .replace("B.Tech - ", "")
      .replace("M.Tech - ", "M.Tech ")
      .replace("B.Sc - ", "B.Sc ")
      .replace("BCA - ", "BCA ");

  const visible = branches.slice(0, 3);
  const extra = branches.length - 3;

  return (
    <div className="flex flex-wrap gap-1">
      {visible.map((b) => (
        <span
          key={b}
          className="text-[10px] px-1.5 py-0.5 rounded-md bg-[#F1F5F9] text-[#475569] border border-[#E2E8F0] font-medium leading-tight"
        >
          {shorten(b)}
        </span>
      ))}
      {extra > 0 && (
        <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-[#EFF6FF] text-[#3B82F6] border border-blue-100 font-semibold">
          +{extra} more
        </span>
      )}
    </div>
  );
}

// `company` = poora job document, `roles` = is student ke liye matched
// role group(s) (kabhi khaali nahi hoga, parent filter kar deta hai).
function CompanyCard({ company, roles, onViewDetails, isSaved, onToggleSave }) {
  // Days-left counting starts from TOMORROW, not today. Both dates are
  // normalized to local midnight first so the comparison is a clean
  // whole-day difference, independent of what time it currently is.
  // `diff` is the exclusive gap (0 = deadline is today, negative =
  // already past). When diff is 0 we show "Today · Last day" instead of
  // a plain days-left number, so it's unambiguous this is the final day.
  const now = new Date();
  const todayMid = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const deadlineRaw = new Date(company.lastDate);
  const deadlineMid = new Date(
    deadlineRaw.getFullYear(),
    deadlineRaw.getMonth(),
    deadlineRaw.getDate(),
  );
  const diff = Math.round((deadlineMid - todayMid) / 86400000);
  const isExpired = diff < 0;

  const urgency =
    diff <= 3
      ? "text-[#EF4444] bg-red-50 border-red-200"
      : diff <= 7
        ? "text-[#F59E0B] bg-amber-50 border-amber-200"
        : "text-[#22C55E] bg-green-50 border-green-200";

  // Matched role(s) ke branches (usually ek hi role hota hai)
  const branches = [...new Set(roles.flatMap((r) => r.eligibleBranches ?? []))];

  return (
    <div className="bg-white rounded-2xl border border-[#E2E8F0] p-4 sm:p-5 flex flex-col hover:shadow-xl hover:shadow-blue-100 hover:-translate-y-1.5 hover:border-blue-200 transition-all duration-300 group">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-3">
        <div className="flex items-center gap-3 min-w-0">
          <CompanyLogo
            name={company.companyId?.name}
            website={company.companyId?.website}
            size={40}
          />
          <div className="min-w-0 flex-1">
            <h3
              className="text-sm font-bold text-[#1E293B] leading-snug break-words"
              style={{ fontFamily: "Space Grotesk, sans-serif" }}
            >
              {company.companyId?.name || "Unknown Company"}
            </h3>
            <p className="text-xs text-[#64748B] break-words">
              {roles.map((r) => r.role).join(" · ")}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0 sm:ml-2">
          <button
            onClick={onToggleSave}
            className={`p-1.5 rounded-lg border transition-all duration-200 hover:scale-110 active:scale-95 ${
              isSaved
                ? "bg-[#eef1fb] border-[#1a3a8f] text-[#1a3a8f]"
                : "bg-white border-[#E2E8F0] text-[#94A3B8] hover:border-[#1a3a8f] hover:text-[#1a3a8f]"
            }`}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill={isSaved ? "currentColor" : "none"}
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
            </svg>
          </button>
          <span
            className={`text-xs font-semibold px-2 py-1 rounded-lg border whitespace-nowrap ${urgency}`}
          >
            {isExpired
              ? "Expired"
              : diff === 0
                ? "Today · Last day"
                : `${diff}d left`}
          </span>
        </div>
      </div>

      <div className="h-px bg-[#F1F5F9] mb-3" />

      <div className="flex flex-col gap-2.5 flex-1">
        {roles.length === 1 ? (
          <div className="flex items-center gap-2 bg-green-50 border border-green-100 rounded-lg px-2.5 py-1.5 w-fit">
            <TrendingUp size={13} className="text-[#22C55E] shrink-0" />
            <span className="text-sm font-bold text-[#15803D]">
              ₹{roles[0].ctc} LPA
            </span>
          </div>
        ) : (
          <div className="flex flex-col gap-1.5">
            {roles.map((r, i) => (
              <div
                key={r._id || i}
                className="flex items-center gap-2 bg-green-50 border border-green-100 rounded-lg px-2.5 py-1.5 w-fit max-w-full"
              >
                <TrendingUp size={13} className="text-[#22C55E] shrink-0" />
                <span className="text-xs font-bold text-[#15803D] break-words">
                  {r.role}: ₹{r.ctc} LPA
                </span>
              </div>
            ))}
          </div>
        )}
        <div className="flex items-start gap-2">
          <Briefcase size={13} className="text-[#3B82F6] shrink-0 mt-0.5" />
          <div className="flex flex-col gap-1">
            <span className="text-xs text-[#64748B]">Branches:</span>
            <BranchChips branches={branches} />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-[#64748B]">Min CGPA:</span>
          <span className="text-xs font-semibold text-[#1E293B] bg-[#F1F5F9] px-2 py-0.5 rounded-md border border-[#E2E8F0]">
            {company.minCgpa}+
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Calendar size={13} className="text-[#F59E0B] shrink-0" />
          <span className="text-xs text-[#64748B]">Last Date:</span>
          <span className="text-xs font-medium text-[#F59E0B]">
            {formatDate(company.lastDate)}
          </span>
        </div>
      </div>

      <button
        onClick={() => onViewDetails(company._id)}
        className="mt-4 w-full h-12 rounded-[14px] cursor-pointer text-base font-semibold text-white bg-[#1a3a8f] hover:bg-[#152d73] shadow-[0_4px_12px_rgba(26,58,143,0.25)] hover:shadow-[0_6px_18px_rgba(26,58,143,0.35)] hover:-translate-y-0.5 transition-all duration-[250ms] flex items-center justify-center gap-2"
      >
        View Details
        <ChevronRight
          size={16}
          className="text-white transition-transform duration-200 group-hover:translate-x-1"
        />
      </button>
    </div>
  );
}

export default function CompanyListPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [branch, setBranch] = useState("All");
  const [role, setRole] = useState("All");
  const [companies, setCompanies] = useState([]);
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [savedJobIds, setSavedJobIds] = useState(new Set());
  const [activeTab, setActiveTab] = useState("all"); // "all" | "saved"

  useEffect(() => {
    document.title = "Companies List — PlaceRise";
    const fetchData = async () => {
      try {
        const [jobsData, savedData, studentData] = await Promise.all([
          api.get("/companies/jobs"),
          api.get("/students/saved-jobs"),
          api.get("/students/me"),
        ]);
        const valid = (Array.isArray(jobsData) ? jobsData : []).filter(
          (j) => j.companyId && j.companyId._id && j.companyId.name,
        );
        setCompanies(valid);
        const savedIds = (Array.isArray(savedData) ? savedData : []).map(
          (j) => j._id,
        );
        setSavedJobIds(new Set(savedIds));
        setStudent(studentData);
      } catch (err) {
        console.error("Could not load companies:", err);
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  const toggleSave = async (jobId, e) => {
    e.stopPropagation();
    const isSaved = savedJobIds.has(jobId);
    if (isSaved) {
      await api.delete(`/students/save-job/${jobId}`);
      setSavedJobIds((prev) => {
        const next = new Set(prev);
        next.delete(jobId);
        return next;
      });
    } else {
      await api.post(`/students/save-job/${jobId}`);
      setSavedJobIds((prev) => new Set([...prev, jobId]));
    }
  };

  // Kis "nazar" se roles match karne hain:
  //  - Branch filter "All" hai  -> student ka apna course/branch
  //  - Koi branch select ki hai -> wo branch (us branch ke liye kaun se roles open hain)
  const viewer = useMemo(
    () => (branch === "All" ? student : { course: branch, branch }),
    [branch, student],
  );

  // Har job ke saath uske matched role(s). Jis job me koi role match nahi
  // karta wo list me aata hi nahi (poori roleGroups list kabhi nahi dikhti).
  const entries = useMemo(
    () =>
      companies
        .map((job) => ({ job, roles: getMatchedRoleGroups(job, viewer) }))
        .filter((e) => e.roles.length > 0),
    [companies, viewer],
  );

  const hiddenCount = companies.length - entries.length;

  const allRoles = useMemo(() => {
    return [
      "All",
      ...new Set(
        entries.flatMap((e) => e.roles.map((r) => r.role)).filter(Boolean),
      ),
    ];
  }, [entries]);

  const filteredEntries = useMemo(() => {
    const q = search.toLowerCase();
    return entries
      .filter(({ job, roles }) => {
        if (activeTab === "saved" && !savedJobIds.has(job._id)) return false;
        const companyName = job.companyId?.name || "";
        const matchesSearch =
          companyName.toLowerCase().includes(q) ||
          roles.some((r) => (r.role || "").toLowerCase().includes(q));
        const matchesRole =
          role === "All" || roles.some((r) => r.role === role);
        return matchesSearch && matchesRole;
      })
      .map((e) =>
        role === "All"
          ? e
          : { ...e, roles: e.roles.filter((r) => r.role === role) },
      );
  }, [search, role, entries, activeTab, savedJobIds]);

  const openRoles = filteredEntries.reduce((n, e) => n + e.roles.length, 0);

  const highestCTC = Math.max(
    0,
    ...filteredEntries.flatMap((e) => e.roles.map((r) => Number(r.ctc) || 0)),
  );

  const uniqueCompanies = new Set(
    filteredEntries.map((e) => e.job.companyId?.name),
  ).size;

  if (loading)
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <div className="w-8 h-8 border-2 border-blue-200 border-t-blue-500 rounded-full animate-spin" />
        <p className="text-sm text-[#64748B]">Loading companies...</p>
      </div>
    );

  return (
    <div
      className="max-w-6xl mx-auto px-4 sm:px-0"
      style={{ fontFamily: "Inter, sans-serif" }}
    >
      {/* Hero */}
      <div
        className="relative rounded-3xl overflow-hidden mb-6 border border-white/10"
        style={{
          background:
            "linear-gradient(135deg, #0d1b5e 0%, #1a2d8a 25%, #3d1a6e 55%, #6b1040 80%, #7a0f35 100%)",
        }}
      >
        <div
          className="absolute top-0 right-0 w-80 h-80 rounded-full pointer-events-none"
          style={{
            background: "rgba(255,255,255,0.08)",
            transform: "translate(30%,-40%)",
          }}
        />
        <div
          className="absolute bottom-0 left-0 w-56 h-56 rounded-full pointer-events-none"
          style={{
            background: "rgba(255,255,255,0.06)",
            transform: "translate(-30%,40%)",
          }}
        />
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage:
              "radial-gradient(circle, rgba(255,255,255,0.25) 1px, transparent 1px)",
            backgroundSize: "24px 24px",
            opacity: 0.3,
          }}
        />
        <div className="relative z-10 p-4 sm:p-8">
          <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-widest text-white/70 mb-1 sm:mb-2">
            Placement Season 2025-26
          </p>
          <h1
            className="text-lg sm:text-2xl font-bold text-white mb-1"
            style={{ fontFamily: "Space Grotesk, sans-serif" }}
          >
            Company Listings
          </h1>
          <p className="text-xs sm:text-sm text-white/60 mb-3 sm:mb-6">
            Active placement opportunities — apply before deadline
          </p>
          <div className="grid grid-cols-3 gap-2 sm:gap-4">
            {[
              { label: "Active Companies", value: uniqueCompanies },
              { label: "Open Roles", value: openRoles },
              { label: "Highest CTC", value: `₹${highestCTC} LPA` },
            ].map((stat) => (
              <div
                key={stat.label}
                className="bg-white/10 backdrop-blur rounded-xl sm:rounded-2xl p-2.5 sm:p-4 border border-white/10 hover:bg-white/15 hover:-translate-y-0.5 transition-all duration-200"
              >
                <p
                  className="text-sm sm:text-xl font-bold text-white truncate"
                  style={{ fontFamily: "Space Grotesk, sans-serif" }}
                >
                  {stat.value}
                </p>
                <p className="text-[10px] sm:text-xs text-white/60 mt-0.5 sm:mt-1 leading-tight">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
          <svg
            className="absolute bottom-0 right-0 pointer-events-none"
            style={{ width: "260px", height: "130px" }}
            viewBox="0 0 260 130"
            fill="none"
          >
            <path
              d="M260 130 Q180 60 80 100 Q20 120 0 130"
              stroke="url(#redOrangeGrad)"
              strokeWidth="3.5"
              fill="none"
              strokeLinecap="round"
            />
            <path
              d="M260 110 Q190 50 100 85 Q40 105 10 115"
              stroke="url(#redOrangeGrad)"
              strokeWidth="2"
              fill="none"
              strokeLinecap="round"
              opacity="0.5"
            />
            <defs>
              <linearGradient
                id="redOrangeGrad"
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
        </div>
      </div>
      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-2 mb-3 sm:mb-5">
        {[
          { id: "all", label: "All Jobs" },
          { id: "saved", label: `Saved Jobs (${savedJobIds.size})` },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
              activeTab === tab.id
                ? "bg-[#1a3a8f] text-white shadow-md scale-[1.02]"
                : "bg-white border border-[#E2E8F0] text-[#64748B] hover:border-[#1a3a8f] hover:-translate-y-0.5"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      {/* Filters */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] p-3 sm:p-4 mb-4 sm:mb-6 shadow-sm">
        <div className="flex items-center gap-2 mb-2 sm:mb-3">
          <Filter size={14} className="text-[#64748B]" />
          <span className="text-xs font-semibold uppercase tracking-widest text-[#64748B]">
            Filters
          </span>
        </div>
        <div className="flex flex-col md:flex-row gap-2 sm:gap-3">
          <div className="relative flex-1">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]"
            />
            <input
              type="text"
              placeholder="Search company or role..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-[#CBD5E1] text-sm text-[#1E293B] placeholder-[#94A3B8] focus:outline-none focus:border-[#1a3a8f] focus:ring-2 focus:ring-[#1a3a8f]/20 transition"
            />
          </div>

          <BranchSearchDropdown
            value={branch}
            onChange={(b) => {
              setBranch(b);
              setRole("All"); // branch badalne par purana role filter invalid ho sakta hai
            }}
          />

          <RoleDropdown value={role} onChange={setRole} options={allRoles} />
        </div>
      </div>

      {branch === "All" && hiddenCount > 0 && (
        <p className="text-xs text-[#94A3B8] mb-3">
          {hiddenCount} {hiddenCount === 1 ? "job" : "jobs"} not shown — none of
          their roles are open to your course.
        </p>
      )}

      {/* Cards */}
      {filteredEntries.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center mb-4">
            <Building2 size={28} className="text-[#3B82F6]" />
          </div>
          <p className="text-sm font-semibold text-[#1E293B]">
            No companies found
          </p>
          <p className="text-xs text-[#94A3B8] mt-1">
            Try changing your filters or search term
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredEntries.map(({ job, roles }) => (
            <CompanyCard
              key={job._id}
              company={job}
              roles={roles}
              isSaved={savedJobIds.has(job._id)}
              onToggleSave={(e) => toggleSave(job._id, e)}
              onViewDetails={(id) => navigate(`/student/companies/${id}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
