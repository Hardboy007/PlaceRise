import { useState, useMemo } from "react";

const companies = [
  { id: 1, company: "Google", role: "Software Engineer", ctc: 25, lastDate: "10 May 2026", branches: ["CSE", "ECE"], cgpa: 7.5 },
  { id: 2, company: "Google", role: "Backend Developer", ctc: 24, lastDate: "10 May 2026", branches: ["CSE"], cgpa: 7.5 },
  { id: 3, company: "Google", role: "Frontend Developer", ctc: 23, lastDate: "10 May 2026", branches: ["CSE"] },
  { id: 4, company: "Amazon", role: "SDE Intern", ctc: 12, lastDate: "15 May 2026", branches: ["All"] },
  { id: 5, company: "Microsoft", role: "Product Engineer", ctc: 22, lastDate: "20 May 2026", branches: ["ECE"], cgpa: 8.0 },
  { id: 6, company: "Infosys", role: "System Engineer", ctc: 8, lastDate: "18 May 2026", branches: ["CSE"], cgpa: 6.5 },
  { id: 7, company: "TCS", role: "Business Analyst", ctc: 7, lastDate: "22 May 2026", branches: ["MBA"] },
];

export default function CompanyListPage() {
  const [search, setSearch] = useState("");
  const [branch, setBranch] = useState("All");
  const [role, setRole] = useState("All");

  const allRoles = useMemo(() => {
    return ["All Role", ...new Set(companies.map((c) => c.role))];
  }, []);

  const roleCountMap = useMemo(() => {
    const map = {};
    companies.forEach((c) => {
      map[c.company] = (map[c.company] || 0) + 1;
    });
    return map;
  }, []);

  const filteredCompanies = useMemo(() => {
    return companies.filter((c) => {
      const matchesSearch =
        c.company.toLowerCase().includes(search.toLowerCase()) ||
        c.role.toLowerCase().includes(search.toLowerCase());

      const matchesRole = role === "All" || c.role === role;

      const matchesBranch =
        branch === "All" ||
        c.branches.includes("All") ||
        c.branches.includes(branch);

      return matchesSearch && matchesRole && matchesBranch;
    });
  }, [search, role, branch]);

  const highestCTC = filteredCompanies.length
    ? Math.max(...filteredCompanies.map((c) => c.ctc || 0))
    : 0;

  const uniqueCompanies = new Set(
    filteredCompanies.map((c) => c.company)
  ).size;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-blue-100 to-indigo-100">

      {/* Navbar */}
      <div className="flex justify-between items-center px-6 py-4 bg-gradient-to-r from-indigo-600 via-blue-600 to-indigo-700 text-white shadow-lg">
        <h1 className="text-2xl font-bold tracking-wide">PlaceRise</h1>
      </div>

      {/* Hero Section */}
      <div className="p-6">
        <div className="relative rounded-3xl p-6 bg-white/60 backdrop-blur-xl border border-white/40 shadow-xl overflow-hidden">

          {/* Glow Effects */}
          <div className="absolute -top-10 -left-10 w-40 h-40 bg-blue-300 rounded-full blur-3xl opacity-30"></div>
          <div className="absolute bottom-0 right-0 w-40 h-40 bg-indigo-400 rounded-full blur-3xl opacity-30"></div>

          <h2 className="text-3xl font-bold text-slate-900 mb-2 relative z-10">Company Listings</h2>
          <p className="text-slate-600 mb-6 relative z-10">Active placement opportunities — apply before deadline</p>

          <div className="grid md:grid-cols-3 gap-4 relative z-10">
            <div className="bg-white rounded-xl p-4 text-center border shadow-sm hover:shadow-md transition">
              <p className="text-sm text-slate-500">Active Companies</p>
              <h3 className="text-xl font-bold text-indigo-600">{uniqueCompanies}</h3>
            </div>

            <div className="bg-white rounded-xl p-4 text-center border shadow-sm hover:shadow-md transition">
              <p className="text-sm text-slate-500">Open Opportunities</p>
              <h3 className="text-xl font-bold text-blue-600">{filteredCompanies.length}</h3>
            </div>

            <div className="bg-white rounded-xl p-4 text-center border shadow-sm hover:shadow-md transition">
              <p className="text-sm text-slate-500">Highest CTC</p>
              <h3 className="text-xl font-bold text-green-600">₹{highestCTC} LPA</h3>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="px-6 mb-6">
        <div className="bg-white/80 backdrop-blur-md p-4 rounded-2xl shadow border flex flex-col md:flex-row gap-4">
          <input
            type="text"
            placeholder="Search company or role..."
            className="flex-1 p-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-400"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <select
            value={branch}
            onChange={(e) => setBranch(e.target.value)}
            className="p-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            <option value="All">All Branch</option>
            <option value="CSE">CSE</option>
            <option value="ECE">ECE</option>
            <option value="MBA">MBA</option>
          </select>

          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="p-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            {allRoles.map((r, i) => (
              <option key={i} value={r}>{r}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Cards */}
      <div className="px-6 grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCompanies.length === 0 ? (
          <div className="col-span-full text-center text-slate-600 py-10">
            No companies found 😔
          </div>
        ) : (
          filteredCompanies.map((company) => {
            const hasMultipleRoles = (roleCountMap[company.company] || 0) > 1;

            return (
              <div
                key={company.id}
                className="relative bg-white rounded-2xl border border-slate-200 p-5 flex flex-col transition-all duration-300 hover:shadow-xl hover:-translate-y-2 hover:border-blue-400"
              >
                <div className="flex justify-between items-start mb-2">
                  <h2 className="text-lg font-semibold text-slate-900">{company.company}</h2>
                  {hasMultipleRoles && (
                    <span className="text-xs px-3 py-1 rounded-full bg-blue-100 text-blue-700 font-medium">
                      +roles
                    </span>
                  )}
                </div>

                <span className="inline-block text-xs font-medium px-3 py-1 rounded-md mb-3 bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-700">
                  {company.role}
                </span>

                <p className="text-sm text-slate-600">
                  Branch: {company.branches.includes("All") ? "All Branches" : company.branches.join(", ")}
                </p>

                {company.cgpa && (
                  <p className="text-sm text-slate-600">Min CGPA: {company.cgpa}+</p>
                )}

                <p className="text-sm text-slate-600">
                  CTC: <span className="text-green-600 font-semibold">₹{company.ctc} LPA</span>
                </p>

                <p className="text-sm text-slate-600 mb-4">
                  Last Date: <span className="text-amber-500 font-semibold">{company.lastDate}</span>
                </p>

                <button
                  className="mt-auto w-full py-2 rounded-xl text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-indigo-600 hover:to-blue-600 transition"
                >
                  More Details
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
