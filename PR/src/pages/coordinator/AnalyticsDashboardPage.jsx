import { useState, useEffect } from "react";
import { api } from "../../utils/api";
import {
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import universityStructure from "../../data/universityStructure";
import {
  BranchChart,
  PlacementDonut,
} from "../../components/coordinator/AnalyticsCharts";

// ---- Consistent color palette across whole dashboard ----
const COLORS = {
  selected: "#3B82F6",
  placed: "#10B981",
  notPlaced: "#EF4444",
  applied: "#3B82F6",
  shortlisted: "#F59E0B",
};

// Company-wise bars ke liye — ek hi blue ki jagah alag-alag vibrant colors
// taaki chart "flat" na lage, cycle through hoga jitni bhi companies ho
const COMPANY_PALETTE = [
  "#6366F1", // indigo
  "#EC4899", // pink
  "#F59E0B", // amber
  "#10B981", // emerald
  "#3B82F6", // blue
  "#8B5CF6", // violet
  "#EF4444", // red
  "#14B8A6", // teal
];

// ---- Small reusable count-up hook (no extra dependency needed) ----
const useCountUp = (target, duration = 800) => {
  const [value, setValue] = useState(0);

  useEffect(() => {
    const numericTarget = parseFloat(target);
    if (isNaN(numericTarget)) {
      setValue(target);
      return;
    }
    let startTime = null;
    const step = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      setValue(
        (numericTarget * progress).toFixed(
          Number.isInteger(numericTarget) ? 0 : 1,
        ),
      );
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration]);

  return value;
};

// ---- Custom tooltip, reused by Company / CTC / Funnel bar charts ----
const CustomTooltip = ({ active, payload, label, valueLabel = "Selected" }) => {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="bg-white rounded-lg shadow-lg border border-[#E2E8F0] px-3 py-2">
      <p className="text-xs font-semibold text-[#1E293B]">{label}</p>
      <p className="text-xs text-primary">
        {valueLabel}: <span className="font-semibold">{payload[0].value}</span>
      </p>
    </div>
  );
};

// ---- Skeleton components ----
const SkeletonCard = () => (
  <div className="bg-white rounded-xl border border-[#E2E8F0] p-4 animate-pulse">
    <div className="h-3 w-20 bg-[#E2E8F0] rounded mb-3"></div>
    <div className="h-6 w-14 bg-[#E2E8F0] rounded"></div>
  </div>
);

const SkeletonChart = () => (
  <div className="bg-white rounded-xl border border-[#E2E8F0] p-4 animate-pulse">
    <div className="h-4 w-40 bg-[#E2E8F0] rounded mb-4"></div>
    <div className="h-65 w-full bg-background rounded"></div>
  </div>
);

// ---- Icons (inline SVG, no extra dependency) ----
const icons = {
  students: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="w-5 h-5"
    >
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  placed: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="w-5 h-5"
    >
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  ),
  percent: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="w-5 h-5"
    >
      <line x1="19" y1="5" x2="5" y2="19" />
      <circle cx="6.5" cy="6.5" r="2.5" />
      <circle cx="17.5" cy="17.5" r="2.5" />
    </svg>
  ),
  ctcHigh: (
    <span
      className="text-base font-bold leading-none"
      style={{ fontFamily: "system-ui, sans-serif" }}
    >
      ₹
    </span>
  ),
  ctcAvg: (
    <span
      className="text-base font-bold leading-none"
      style={{ fontFamily: "system-ui, sans-serif" }}
    >
      ₹
    </span>
  ),
  company: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="w-5 h-5"
    >
      <rect x="3" y="7" width="18" height="14" rx="2" />
      <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  ),
};

const AnalyticsDashboardPage = () => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [exporting, setExporting] = useState(false);
  const [toast, setToast] = useState(null);

  // Generalized drill-down state — used by Company-wise, CTC Distribution,
  // AND Application Funnel now, so all three share one modal shape:
  // { title, subtitle, students }
  const [drilldown, setDrilldown] = useState(null);

  const [filters, setFilters] = useState({
    batch: "",
    school: "",
    jobType: "",
  });
  const [appliedFilters, setAppliedFilters] = useState({
    batch: "",
    school: "",
    jobType: "",
  });

  const batchOptions = ["2024", "2025", "2026", "2027"];
  const jobTypeOptions = ["Full Time", "Internship"];
  const schoolOptions = (universityStructure || []).map((item) => item.school);

  const fetchAnalytics = async (activeFilters) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (activeFilters.batch) params.append("batch", activeFilters.batch);
      if (activeFilters.school) params.append("school", activeFilters.school);
      if (activeFilters.jobType)
        params.append("jobType", activeFilters.jobType);

      const data = await api.get(`/analytics?${params.toString()}`);
      setAnalytics(data);
    } catch (err) {
      console.error("Failed to fetch analytics:", err);
      setError("Failed to load analytics data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics(appliedFilters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const showToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(null), 3000);
  };

  const handleApply = () => {
    setAppliedFilters(filters);
    fetchAnalytics(filters);
  };

  const handleReset = () => {
    const cleared = { batch: "", school: "", jobType: "" };
    setFilters(cleared);
    setAppliedFilters(cleared);
    fetchAnalytics(cleared);
  };

  const removeFilterChip = (key) => {
    const updated = { ...appliedFilters, [key]: "" };
    setFilters(updated);
    setAppliedFilters(updated);
    fetchAnalytics(updated);
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const token = localStorage.getItem("token");
      const params = new URLSearchParams();
      if (appliedFilters.batch) params.append("batch", appliedFilters.batch);
      if (appliedFilters.school) params.append("school", appliedFilters.school);

      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/analytics/export?${params.toString()}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );

      if (!res.ok) throw new Error("Export failed");

      const blob = await res.blob();

      const contentDisposition = res.headers.get("Content-Disposition");
      let filename = "analytics.xlsx";

      if (contentDisposition) {
        const match = contentDisposition.match(/filename="?([^"]+)"?/);
        if (match) filename = match[1];
      }

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      window.URL.revokeObjectURL(url);
      showToast("Excel file downloaded successfully");
    } catch (err) {
      console.error("Export failed:", err);
      showToast("Excel export failed. Please try again.");
    } finally {
      setExporting(false);
    }
  };

  // ---- Error state ----
  if (error) {
    return (
      <div className="p-6">
        <div className="text-center py-20 bg-white rounded-xl border border-[#E2E8F0]">
          <p className="text-red-500 mb-3">{error}</p>
          <button
            onClick={() => fetchAnalytics(appliedFilters)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // ---- Derived insight: top performing branch (only when data exists) ----
  const topBranch =
    analytics?.branchData && analytics.branchData.length > 0
      ? [...analytics.branchData].sort((a, b) => b.rate - a.rate)[0]
      : null;

  const activeFilterChips = [
    appliedFilters.batch && {
      key: "batch",
      label: `Batch: ${appliedFilters.batch}`,
    },
    appliedFilters.school && {
      key: "school",
      label: `School: ${appliedFilters.school}`,
    },
    appliedFilters.jobType && {
      key: "jobType",
      label: `Type: ${appliedFilters.jobType}`,
    },
  ].filter(Boolean);

  const RUPEE = "\u20B9";

  const summaryCards = analytics
    ? [
        {
          key: "totalStudents",
          label: "Total Students",
          value: analytics.summary.totalStudents,
          icon: icons.students,
          gradient: "from-blue-500 to-indigo-500",
          glow: "shadow-blue-200",
        },
        {
          key: "placed",
          label: "Placed",
          value: analytics.summary.placed,
          icon: icons.placed,
          gradient: "from-emerald-500 to-green-500",
          glow: "shadow-green-200",
        },
        {
          key: "placementPercent",
          label: "Placement %",
          value: analytics.summary.placementPercent,
          suffix: "%",
          icon: icons.percent,
          gradient: "from-purple-500 to-fuchsia-500",
          glow: "shadow-purple-200",
        },
        {
          key: "highestCTC",
          label: "Highest CTC",
          value: analytics.summary.highestCTC,
          prefix: RUPEE,
          suffix: " LPA",
          icon: icons.ctcHigh,
          gradient: "from-amber-500 to-orange-500",
          glow: "shadow-amber-200",
        },
        {
          key: "avgCTC",
          label: "Avg CTC",
          value: analytics.summary.avgCTC,
          prefix: RUPEE,
          suffix: " LPA",
          icon: icons.ctcAvg,
          gradient: "from-orange-500 to-red-500",
          glow: "shadow-orange-200",
        },
        {
          key: "totalCompanies",
          label: "Total Companies",
          value: analytics.summary.totalCompanies,
          icon: icons.company,
          gradient: "from-teal-500 to-cyan-500",
          glow: "shadow-teal-200",
        },
      ]
    : [];

  // Application Funnel, reshaped into chart-friendly rows so it can use
  // the same clickable BarChart pattern as Company-wise Selections.
  const funnelRows = analytics
    ? [
        {
          name: "Applied",
          Count: analytics.funnel.totalApplied,
          students: analytics.funnel.appliedStudents || [],
          fill: "#6366F1",
        },
        {
          name: "Shortlisted",
          Count: analytics.funnel.totalShortlisted,
          students: analytics.funnel.shortlistedStudents || [],
          fill: "#F59E0B",
        },
        {
          name: "Selected",
          Count: analytics.funnel.totalSelected,
          students: analytics.funnel.selectedStudents || [],
          fill: "#10B981",
        },
      ]
    : [];

  return (
    <div className="pb-10">
      {/* ---- Toast ---- */}
      {toast && (
        <div className="fixed top-4 sm:top-6 right-4 sm:right-6 left-4 sm:left-auto z-50 bg-[#1E293B] text-white text-sm px-4 py-3 rounded-lg shadow-lg">
          {toast}
        </div>
      )}

      {/* ---- Hero Section ---- */}
      <div
        className="rounded-b-2xl px-4 sm:px-6 py-6 sm:py-8 mb-6"
        style={{
          background:
            "linear-gradient(135deg, #1D4ED8 0%, #2563EB 45%, #0EA5E9 100%)",
        }}
      >
        <p className="text-blue-100 text-xs font-medium tracking-wide uppercase mb-1">
          Placement Insights
        </p>
        <h1 className="text-xl sm:text-2xl font-bold text-white mb-1">
          Analytics Dashboard
        </h1>
        <p className="text-blue-100 text-sm">
          Track placement performance, company trends, and CTC breakdown — all
          in one place.
        </p>
      </div>

      <div className="px-3 sm:px-6 space-y-4 sm:space-y-6">
        {/* ---- Filter Bar (sticky) ---- */}
        <div className="sticky top-0 z-30 bg-white rounded-xl border border-[#E2E8F0] p-3 sm:p-4 shadow-sm">
          <div className="flex flex-wrap items-center gap-3">
            <select
              value={filters.batch}
              onChange={(e) =>
                setFilters({ ...filters, batch: e.target.value })
              }
              className="px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm flex-1 min-w-[45%] sm:flex-none sm:min-w-0"
            >
              <option value="">All Batches</option>
              {batchOptions.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>

            <select
              value={filters.school}
              onChange={(e) =>
                setFilters({ ...filters, school: e.target.value })
              }
              className="px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm flex-1 min-w-[45%] sm:flex-none sm:max-w-55"
            >
              <option value="">All Schools</option>
              {schoolOptions.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>

            <select
              value={filters.jobType}
              onChange={(e) =>
                setFilters({ ...filters, jobType: e.target.value })
              }
              className="px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm flex-1 min-w-[45%] sm:flex-none sm:min-w-0"
            >
              <option value="">All Job Types</option>
              {jobTypeOptions.map((j) => (
                <option key={j} value={j}>
                  {j}
                </option>
              ))}
            </select>

            <button
              onClick={handleApply}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 flex-1 sm:flex-none"
            >
              Apply
            </button>

            <button
              onClick={handleReset}
              className="px-4 py-2 bg-background text-[#334155] rounded-lg text-sm font-medium hover:bg-[#E2E8F0] flex-1 sm:flex-none"
            >
              Reset
            </button>

            <div className="ml-auto relative group w-full sm:w-auto">
              <button
                onClick={handleExport}
                disabled={exporting || !analytics}
                className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
              >
                {exporting ? "Exporting..." : "Export Excel"}
              </button>
              {analytics && !exporting && (
                <div className="absolute right-0 top-full mt-1 hidden group-hover:block bg-[#1E293B] text-white text-xs rounded-md px-2 py-1 whitespace-nowrap z-40">
                  Exporting {analytics.summary.totalStudents} students
                  {appliedFilters.batch
                    ? ` · Batch ${appliedFilters.batch}`
                    : ""}
                  {appliedFilters.school ? ` · ${appliedFilters.school}` : ""}
                </div>
              )}
            </div>
          </div>

          {/* ---- Applied Filter Chips ---- */}
          {activeFilterChips.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-[#E2E8F0]">
              <span className="text-xs text-text-muted">Showing:</span>
              {activeFilterChips.map((chip) => (
                <span
                  key={chip.key}
                  className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 text-xs font-medium px-2.5 py-1 rounded-full"
                >
                  {chip.label}
                  <button
                    onClick={() => removeFilterChip(chip.key)}
                    className="hover:text-blue-900"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {loading ? (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <SkeletonChart key={i} />
              ))}
            </div>
          </>
        ) : !analytics ? (
          <div className="text-center py-20 bg-white rounded-xl border border-[#E2E8F0]">
            <p className="text-text-muted">No data available</p>
          </div>
        ) : (
          <>
            {/* ---- Summary Cards ---- */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-4">
              {summaryCards.map((card) => (
                <SummaryCard key={card.key} card={card} />
              ))}
            </div>

            {/* ---- Insight line ---- */}
            {topBranch && (
              <div className="bg-blue-50 border border-blue-100 rounded-lg px-4 py-2.5 text-sm text-blue-800">
                💡 <span className="font-medium">{topBranch.name}</span> has the
                highest placement rate at{" "}
                <span className="font-semibold">{topBranch.rate}%</span> in the
                current selection.
              </div>
            )}

            {/* ---- Charts Grid ---- */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              {/* Company-wise Selections */}
              <div className="bg-white rounded-xl border border-[#E2E8F0] p-3 sm:p-4 hover:shadow-md transition-shadow">
                <h3 className="text-sm font-semibold text-[#1E293B] mb-1">
                  Company-wise Selections
                </h3>
                {analytics.companyData && analytics.companyData.length > 0 ? (
                  <>
                    <p className="text-xs text-[#94A3B8] mb-3">
                      Click a bar to see student names
                    </p>
                    <ResponsiveContainer width="100%" height={280}>
                      <BarChart data={analytics.companyData}>
                        <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                        <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                        <Tooltip
                          content={<CustomTooltip valueLabel="Selected" />}
                          cursor={{ fill: "#F1F5F9" }}
                        />
                        <Bar
                          dataKey="Selected"
                          radius={[8, 8, 0, 0]}
                          cursor="pointer"
                          onClick={(data) =>
                            setDrilldown({
                              title: data.name,
                              subtitle: `${data.Selected} students selected`,
                              students: data.students,
                            })
                          }
                        >
                          {analytics.companyData.map((entry, index) => (
                            <Cell
                              key={entry.name}
                              fill={
                                COMPANY_PALETTE[index % COMPANY_PALETTE.length]
                              }
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </>
                ) : (
                  <EmptyState message="No selections data available for this filter combination." />
                )}
              </div>

              {/* Branch-wise Placement */}
              <div className="bg-white rounded-xl border border-[#E2E8F0] p-3 sm:p-4 hover:shadow-md transition-shadow">
                <h3 className="text-sm font-semibold text-[#1E293B] mb-3">
                  Branch-wise Placement
                </h3>
                {analytics.branchData && analytics.branchData.length > 0 ? (
                  <BranchChart data={analytics.branchData} />
                ) : (
                  <EmptyState message="No branch data available for this filter combination." />
                )}
              </div>

              {/* CTC Distribution — clickable. Each bucket carries its own
                  student list from the backend, and each student now also
                  carries their own CTC (package) for the drilldown. */}
              <div className="bg-white rounded-xl border border-[#E2E8F0] p-3 sm:p-4 hover:shadow-md transition-shadow">
                <h3 className="text-sm font-semibold text-[#1E293B] mb-1">
                  CTC Distribution
                </h3>
                {analytics.ctcDistribution &&
                analytics.ctcDistribution.length > 0 &&
                analytics.ctcDistribution.some((r) => r.Students > 0) ? (
                  <>
                    <p className="text-xs text-[#94A3B8] mb-3">
                      Click a bar to see student names
                    </p>
                    <ResponsiveContainer width="100%" height={280}>
                      <BarChart data={analytics.ctcDistribution}>
                        <defs>
                          <linearGradient
                            id="ctcGradient"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop
                              offset="0%"
                              stopColor="#8B5CF6"
                              stopOpacity={1}
                            />
                            <stop
                              offset="100%"
                              stopColor="#3B82F6"
                              stopOpacity={0.8}
                            />
                          </linearGradient>
                        </defs>
                        <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                        <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                        <Tooltip
                          content={<CustomTooltip valueLabel="Students" />}
                          cursor={{ fill: "#F1F5F9" }}
                        />
                        <Bar
                          dataKey="Students"
                          fill="url(#ctcGradient)"
                          radius={[8, 8, 0, 0]}
                          cursor="pointer"
                          onClick={(data) =>
                            setDrilldown({
                              title: data.name,
                              subtitle: `${data.Students} students`,
                              students: data.students,
                            })
                          }
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </>
                ) : (
                  <EmptyState message="No CTC data available for this filter combination." />
                )}
              </div>

              {/* Placement Donut */}
              <div className="bg-white rounded-xl border border-[#E2E8F0] p-3 sm:p-4 hover:shadow-md transition-shadow">
                <h3 className="text-sm font-semibold text-[#1E293B] mb-3">
                  Placement Overview
                </h3>
                <PlacementDonut summary={analytics.summary} />
              </div>

              {/* Application Funnel — clickable. Applied / Shortlisted /
                  Selected each carry their own student list from the
                  backend, and each student now also carries the company
                  name of the job they applied to / were shortlisted or
                  selected for. */}
              <div className="bg-white rounded-xl border border-[#E2E8F0] p-3 sm:p-4 hover:shadow-md transition-shadow md:col-span-2">
                <h3 className="text-sm font-semibold text-[#1E293B] mb-1">
                  Application Funnel
                </h3>
                {funnelRows.some((r) => r.Count > 0) ? (
                  <>
                    <p className="text-xs text-[#94A3B8] mb-3">
                      Click a bar to see student names
                    </p>
                    <ResponsiveContainer width="100%" height={260}>
                      <BarChart data={funnelRows} layout="vertical">
                        <XAxis
                          type="number"
                          tick={{ fontSize: 12 }}
                          allowDecimals={false}
                        />
                        <YAxis
                          type="category"
                          dataKey="name"
                          tick={{ fontSize: 12 }}
                          width={90}
                        />
                        <Tooltip
                          content={<CustomTooltip valueLabel="Count" />}
                          cursor={{ fill: "#F1F5F9" }}
                        />
                        <Bar
                          dataKey="Count"
                          radius={[0, 8, 8, 0]}
                          cursor="pointer"
                          onClick={(data) =>
                            setDrilldown({
                              title: data.name,
                              subtitle: `${data.Count} students`,
                              students: data.students,
                            })
                          }
                        >
                          {funnelRows.map((row) => (
                            <Cell key={row.name} fill={row.fill} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </>
                ) : (
                  <EmptyState message="No funnel data available for this filter combination." />
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* ---- Generalized drill-down modal — shared by Company-wise,
          CTC Distribution, and Application Funnel clicks ---- */}
      <DrilldownModal
        drilldown={drilldown}
        onClose={() => setDrilldown(null)}
      />
    </div>
  );
};

// ---- Extracted Summary Card with count-up ----
const SummaryCard = ({ card }) => {
  const animatedValue = useCountUp(card.value);
  return (
    <div
      className={`bg-white rounded-2xl border border-[#E2E8F0] p-3 sm:p-4 hover:shadow-xl ${card.glow} hover:-translate-y-1 transition-all duration-300`}
    >
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-medium text-text-muted">{card.label}</p>
        <span
          className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-linear-to-br ${card.gradient} text-white flex items-center justify-center shadow-md`}
        >
          {card.icon}
        </span>
      </div>
      <p
        className="text-lg sm:text-2xl font-bold text-[#1E293B]"
        style={{ fontFamily: "Space Grotesk, sans-serif" }}
      >
        {card.prefix || ""}
        {animatedValue}
        {card.suffix || ""}
      </p>
    </div>
  );
};

// ---- Reusable empty state ----
const EmptyState = ({ message }) => (
  <div className="flex flex-col items-center justify-center py-12 text-center">
    <p className="text-sm text-text-muted">{message}</p>
    <p className="text-xs text-[#94A3B8] mt-1">
      Try changing the filters and search again.
    </p>
  </div>
);

// ---- Generalized drill-down modal (was CompanyStudentsModal — renamed
// and made generic since it's now used by 3 different charts, not just
// company selections). Shape: { title, subtitle, students }
// Each student may optionally carry `ctc` (CTC Distribution drilldown)
// or `company` (Application Funnel drilldown) — shown inline when present.
const DrilldownModal = ({ drilldown, onClose }) => {
  if (!drilldown) return null;
  return (
    <div
      className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl max-w-lg w-full max-h-[80vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-4 sm:px-5 py-3 sm:py-4 border-b border-[#E2E8F0] flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-[#1E293B]">
              {drilldown.title}
            </h3>
            <p className="text-xs text-text-muted">{drilldown.subtitle}</p>
          </div>
          <button
            onClick={onClose}
            className="text-[#94A3B8] hover:text-[#1E293B] text-xl leading-none"
          >
            ×
          </button>
        </div>
        <div className="overflow-y-auto px-5 py-3">
          {drilldown.students && drilldown.students.length > 0 ? (
            <ul className="space-y-2">
              {drilldown.students.map((student, i) => (
                <li
                  key={i}
                  className="flex items-center gap-3 py-2 border-b border-background last:border-0"
                >
                  <span className="w-7 h-7 shrink-0 rounded-full bg-blue-50 text-blue-600 text-xs font-medium flex items-center justify-center">
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-[#334155] truncate">
                      {student.name}
                    </p>
                    <p className="text-xs text-text-muted">
                      ERP: {student.erpId} · {student.course}
                      {student.company ? ` · ${student.company}` : ""}
                    </p>
                  </div>
                  {student.ctc !== undefined && (
                    <span className="shrink-0 text-xs font-semibold text-green-700 bg-green-50 px-2 py-1 rounded-full">
                      ₹{student.ctc} LPA
                    </span>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-text-muted text-center py-6">
              No student details available.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboardPage;
