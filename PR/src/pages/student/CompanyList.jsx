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
    <div ref={ref} className="relative min-w-[220px]">
      {/* Trigger */}
      <button
        type="button"
        onClick={() => {
          setOpen((o) => !o);
          setQuery("");
        }}
        className="w-full flex items-center justify-between gap-2 px-4 py-2.5 rounded-xl border border-[#CBD5E1] bg-white text-sm hover:border-[#3B82F6] transition focus:outline-none focus:border-[#3B82F6] focus:ring-2 focus:ring-[#3B82F6]/20"
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
        <div className="absolute z-50 mt-1 left-0 w-80 bg-white border border-[#E2E8F0] rounded-xl shadow-xl overflow-hidden">
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
                className="w-full pl-7 pr-3 py-1.5 rounded-lg border border-[#E2E8F0] text-xs text-[#1E293B] placeholder-[#94A3B8] focus:outline-none focus:border-[#3B82F6]"
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
                  ? "bg-blue-50 text-[#3B82F6]"
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
                          ? "bg-blue-50 text-[#3B82F6] font-semibold"
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

function BranchChips({ branches }) {
  if (!branches || branches.length === 0)
    return <span className="text-xs text-[#94A3B8]">—</span>;

  if (branches.includes("All"))
    return (
      <span className="text-xs px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-100 font-medium">
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

function CompanyCard({ company, onViewDetails, isSaved, onToggleSave }) {
  const deadline = new Date(company.lastDate);
  deadline.setHours(23, 59, 59, 999);

  const isExpired = deadline < new Date();

  const days = Math.ceil((deadline - new Date()) / (1000 * 60 * 60 * 24));
  const urgency =
    days <= 3
      ? "text-[#EF4444] bg-red-50 border-red-200"
      : days <= 7
        ? "text-[#F59E0B] bg-amber-50 border-amber-200"
        : "text-[#22C55E] bg-green-50 border-green-200";

  return (
    <div className="bg-white rounded-2xl border border-[#E2E8F0] p-5 flex flex-col hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#F1F5F9] border border-[#E2E8F0] flex items-center justify-center shrink-0">
            <Building2 size={18} className="text-[#3B82F6]" />
          </div>
          <div>
            <h3
              className="text-sm font-bold text-[#1E293B]"
              style={{ fontFamily: "Space Grotesk, sans-serif" }}
            >
              {company.companyId?.name || "Unknown Company"}
            </h3>
            <p className="text-xs text-[#64748B]">{company.role}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0 ml-2">
          <button
            onClick={onToggleSave}
            className={`p-1.5 rounded-lg border transition-all ${
              isSaved
                ? "bg-[#EFF6FF] border-[#3B82F6] text-[#3B82F6]"
                : "bg-white border-[#E2E8F0] text-[#94A3B8] hover:border-[#3B82F6] hover:text-[#3B82F6]"
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
            className={`text-xs font-semibold px-2 py-1 rounded-lg border ${urgency}`}
          >
            {days > 0 ? `${days}d left` : "Expired"}
          </span>
        </div>
      </div>

      <div className="h-px bg-[#F1F5F9] mb-3" />

      <div className="flex flex-col gap-2.5 flex-1">
        <div className="flex items-center gap-2">
          <TrendingUp size={13} className="text-[#22C55E] shrink-0" />
          <span className="text-xs text-[#64748B]">CTC:</span>
          <span className="text-xs font-bold text-[#22C55E]">
            ₹{company.ctc} LPA
          </span>
        </div>
        <div className="flex items-start gap-2">
          <Briefcase size={13} className="text-[#3B82F6] shrink-0 mt-0.5" />
          <div className="flex flex-col gap-1">
            <span className="text-xs text-[#64748B]">Branches:</span>
            <BranchChips branches={company.eligibleBranches} />
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
        className="mt-4 w-full py-2.5 rounded-xl text-sm font-semibold text-white bg-[#1E293B] hover:bg-[#3B82F6] transition-colors flex items-center justify-center gap-2 group-hover:bg-[#3B82F6]"
      >
        View Details <ChevronRight size={14} />
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
  const [loading, setLoading] = useState(true);
  const [savedJobIds, setSavedJobIds] = useState(new Set());
  const [activeTab, setActiveTab] = useState("all"); // "all" | "saved"

  useEffect(() => {
    const fetchData = async () => {
      const [jobsData, savedData] = await Promise.all([
        api.get("/companies/jobs"),
        api.get("/students/saved-jobs"),
      ]);
      const valid = (Array.isArray(jobsData) ? jobsData : []).filter(
        (j) => j.companyId && j.companyId._id && j.companyId.name,
      );
      setCompanies(valid);
      const savedIds = (Array.isArray(savedData) ? savedData : []).map(
        (j) => j._id,
      );
      setSavedJobIds(new Set(savedIds));
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

  const allRoles = useMemo(() => {
    return ["All", ...new Set(companies.map((c) => c.role).filter(Boolean))];
  }, [companies]);

  const filteredCompanies = useMemo(() => {
    return companies.filter((c) => {
      if (activeTab === "saved" && !savedJobIds.has(c._id)) return false;
      const companyName = c.companyId?.name || "";
      const matchesSearch =
        companyName.toLowerCase().includes(search.toLowerCase()) ||
        (c.role || "").toLowerCase().includes(search.toLowerCase());
      const matchesRole = role === "All" || c.role === role;
      const matchesBranch =
        branch === "All" ||
        c.eligibleBranches?.includes("All") ||
        c.eligibleBranches?.includes(branch);
      return matchesSearch && matchesRole && matchesBranch;
    });
  }, [search, role, branch, companies, activeTab, savedJobIds]);

  const highestCTC = filteredCompanies.length
    ? Math.max(...filteredCompanies.map((c) => c.ctc || 0))
    : 0;

  const uniqueCompanies = new Set(
    filteredCompanies.map((c) => c.companyId?.name),
  ).size;

  if (loading)
    return (
      <div className="flex items-center justify-center py-20 text-[#64748B] text-sm">
        Loading companies...
      </div>
    );

  return (
    <div
      className="max-w-6xl mx-auto"
      style={{ fontFamily: "Inter, sans-serif" }}
    >
      {/* Hero */}
      <div
        className="relative rounded-3xl overflow-hidden mb-6 border border-white/10"
        style={{
          background:
            "linear-gradient(135deg, #3B82F6 0%, #60A5FA 60%, #818CF8 100%)",
        }}
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `radial-gradient(circle at 20% 50%, rgba(59,130,246,0.2) 0%, transparent 50%),
                       radial-gradient(circle at 80% 20%, rgba(34,197,94,0.1) 0%, transparent 40%)`,
          }}
        />
        <div className="relative z-10 p-8">
          <p className="text-xs font-semibold uppercase tracking-widest text-white/70 mb-2">
            Placement Season 2025-26
          </p>
          <h1
            className="text-2xl font-bold text-white mb-1"
            style={{ fontFamily: "Space Grotesk, sans-serif" }}
          >
            Company Listings
          </h1>
          <p className="text-sm text-white/60 mb-6">
            Active placement opportunities — apply before deadline
          </p>
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: "Active Companies", value: uniqueCompanies },
              { label: "Open Roles", value: filteredCompanies.length },
              { label: "Highest CTC", value: `₹${highestCTC} LPA` },
            ].map((stat) => (
              <div
                key={stat.label}
                className="bg-white/10 backdrop-blur rounded-2xl p-4 border border-white/10"
              >
                <p
                  className="text-xl font-bold text-white"
                  style={{ fontFamily: "Space Grotesk, sans-serif" }}
                >
                  {stat.value}
                </p>
                <p className="text-xs text-white/60 mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
      {/* Tabs */}
      <div className="flex items-center gap-2 mb-5">
        {[
          { id: "all", label: "All Jobs" },
          { id: "saved", label: `Saved Jobs (${savedJobIds.size})` },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              activeTab === tab.id
                ? "bg-[#1E293B] text-white"
                : "bg-white border border-[#E2E8F0] text-[#64748B] hover:border-[#3B82F6]"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      {/* Filters */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] p-4 mb-6 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <Filter size={14} className="text-[#64748B]" />
          <span className="text-xs font-semibold uppercase tracking-widest text-[#64748B]">
            Filters
          </span>
        </div>
        <div className="flex flex-col md:flex-row gap-3">
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
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-[#CBD5E1] text-sm text-[#1E293B] placeholder-[#94A3B8] focus:outline-none focus:border-[#3B82F6] focus:ring-2 focus:ring-[#3B82F6]/20 transition"
            />
          </div>

          <BranchSearchDropdown value={branch} onChange={setBranch} />

          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="px-4 py-2.5 rounded-xl border border-[#CBD5E1] text-sm text-[#1E293B] focus:outline-none focus:border-[#3B82F6] focus:ring-2 focus:ring-[#3B82F6]/20 transition bg-white"
          >
            {allRoles.map((r) => (
              <option key={r} value={r}>
                {r === "All" ? "All Roles" : r}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Cards */}
      {filteredCompanies.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Building2 size={40} className="text-[#CBD5E1] mb-4" />
          <p className="text-sm font-medium text-[#64748B]">
            No companies found
          </p>
          <p className="text-xs text-[#94A3B8] mt-1">
            Try changing your filters
          </p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredCompanies.map((company) => (
            <CompanyCard
              key={company._id}
              company={company}
              isSaved={savedJobIds.has(company._id)}
              onToggleSave={(e) => toggleSave(company._id, e)}
              onViewDetails={(id) => navigate(`/student/companies/${id}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
