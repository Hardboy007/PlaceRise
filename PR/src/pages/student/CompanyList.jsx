import { useState, useMemo, useEffect } from "react";
import universityStructure from "../../data/universityStructure";
import {
  Search,
  Building2,
  Briefcase,
  TrendingUp,
  Calendar,
  ChevronRight,
  Filter,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { api } from "../../utils/api";

const BRANCHES = [
  "All",
  ...new Set(
    universityStructure.flatMap((s) => s.departments.map((d) => d.name)),
  ),
];

function CompanyCard({ company, onViewDetails }) {
  const daysLeft = () => {
    const today = new Date();
    const last = new Date(company.lastDate);
    const diff = Math.ceil((last - today) / (1000 * 60 * 60 * 24));
    return diff;
  };

  const days = daysLeft();
  const urgency =
    days <= 3
      ? "text-[#EF4444] bg-red-50 border-red-200"
      : days <= 7
        ? "text-[#F59E0B] bg-amber-50 border-amber-200"
        : "text-[#22C55E] bg-green-50 border-green-200";

  return (
    <div className="bg-white rounded-2xl border border-[#E2E8F0] p-5 flex flex-col hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group">
      {/* Top */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#F1F5F9] border border-[#E2E8F0] flex items-center justify-center">
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
        <span
          className={`text-xs font-semibold px-2 py-1 rounded-lg border ${urgency}`}
        >
          {days > 0 ? `${days}d left` : "Expired"}
        </span>
      </div>

      {/* Divider */}
      <div className="h-px bg-[#F1F5F9] mb-3" />

      {/* Details */}
      <div className="flex flex-col gap-2 flex-1">
        <div className="flex items-center gap-2">
          <TrendingUp size={13} className="text-[#22C55E] flex-shrink-0" />
          <span className="text-xs text-[#64748B]">CTC:</span>
          <span className="text-xs font-bold text-[#22C55E]">
            ₹{company.ctc} LPA
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Briefcase size={13} className="text-[#3B82F6] flex-shrink-0" />
          <span className="text-xs text-[#64748B]">Branches:</span>
          <span className="text-xs font-medium text-[#1E293B]">
            {company.eligibleBranches?.includes("All")
              ? "All Branches"
              : company.eligibleBranches?.join(", ") || "—"}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-[#64748B]">Min CGPA:</span>
          <span className="text-xs font-medium text-[#1E293B]">
            {company.minCgpa}+
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Calendar size={13} className="text-[#F59E0B] flex-shrink-0" />
          <span className="text-xs text-[#64748B]">Last Date:</span>
          <span className="text-xs font-medium text-[#F59E0B]">
            {company.lastDate}
          </span>
        </div>
      </div>

      {/* Button */}
      <button
        onClick={() => onViewDetails(company._id)}
        className="mt-4 w-full py-2.5 rounded-xl text-sm font-semibold text-white bg-[#1E293B] hover:bg-[#3B82F6] transition-colors flex items-center justify-center gap-2 group-hover:bg-[#3B82F6]"
      >
        View Details
        <ChevronRight size={14} />
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

  useEffect(() => {
    const fetchJobs = async () => {
      const data = await api.get("/companies/jobs");
      setCompanies(Array.isArray(data) ? data : []);
      setLoading(false);
    };
    fetchJobs();
  }, []);

  const allRoles = useMemo(() => {
    return ["All", ...new Set(companies?.map((c) => c.role))];
  }, [companies]);

  const filteredCompanies = useMemo(() => {
    return companies.filter((c) => {
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
  }, [search, role, branch, companies]);

  const highestCTC = filteredCompanies.length
    ? Math.max(...filteredCompanies.map((c) => c.ctc || 0))
    : 0;

  const uniqueCompanies = new Set(
    filteredCompanies.map((c) => c.companyId?.name),
  ).size;

  const handleViewDetails = (id) => {
    navigate(`/student/companies/${id}`);
  };

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

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            {[
              {
                label: "Active Companies",
                value: uniqueCompanies,
                color: "text-white",
              },
              {
                label: "Open Roles",
                value: filteredCompanies.length,
                color: "text-white",
              },
              {
                label: "Highest CTC",
                value: `₹${highestCTC} LPA`,
                color: "text-white",
              },
              ,
            ].map((stat) => (
              <div
                key={stat.label}
                className="bg-white/10 backdrop-blur rounded-2xl p-4 border border-white/10"
              >
                <p
                  className={`text-xl font-bold ${stat.color}`}
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

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] p-4 mb-6 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <Filter size={14} className="text-[#64748B]" />
          <span className="text-xs font-semibold uppercase tracking-widest text-[#64748B]">
            Filters
          </span>
        </div>
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search */}
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

          {/* Branch Filter */}
          <select
            value={branch}
            onChange={(e) => setBranch(e.target.value)}
            className="px-4 py-2.5 rounded-xl border border-[#CBD5E1] text-sm text-[#1E293B] focus:outline-none focus:border-[#3B82F6] focus:ring-2 focus:ring-[#3B82F6]/20 transition bg-white"
          >
            {BRANCHES.map((b) => (
              <option key={b} value={b}>
                {b === "All" ? "All Branches" : b}
              </option>
            ))}
          </select>

          {/* Role Filter */}
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

      {/* Cards Grid */}
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
              onViewDetails={handleViewDetails}
            />
          ))}
        </div>
      )}
    </div>
  );
}
