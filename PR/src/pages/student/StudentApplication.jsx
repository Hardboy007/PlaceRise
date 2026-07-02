import { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../utils/api";

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
};

// ── Status config (aligned with coordinator's ApplicationsManagementPage) ──
// FIXED: "Selected" status was missing entirely before — app.status === "Selected"
// had no matching config and would render undefined styles.
const statusConfig = {
  Applied: {
    color: "#1D4ED8",
    bg: "#EFF6FF",
    border: "#BFDBFE",
    Icon: () => (
      <svg
        className="w-3.5 h-3.5 shrink-0"
        fill="none"
        stroke="#1D4ED8"
        strokeWidth={2}
        viewBox="0 0 24 24"
      >
        <circle cx="12" cy="12" r="10" />
        <polyline
          strokeLinecap="round"
          strokeLinejoin="round"
          points="12 6 12 12 16 14"
        />
      </svg>
    ),
  },
  Shortlisted: {
    color: "#92400E",
    bg: "#FFFBEB",
    border: "#FDE68A",
    Icon: () => (
      <svg
        className="w-3.5 h-3.5 shrink-0"
        fill="none"
        stroke="#D97706"
        strokeWidth={2}
        viewBox="0 0 24 24"
      >
        <circle cx="12" cy="12" r="10" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4" />
      </svg>
    ),
  },
  Selected: {
    color: "#14532D",
    bg: "#F0FDF4",
    border: "#86EFAC",
    Icon: () => (
      <svg
        className="w-3.5 h-3.5 shrink-0"
        fill="none"
        stroke="#16A34A"
        strokeWidth={2}
        viewBox="0 0 24 24"
      >
        <circle cx="12" cy="12" r="10" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 12l3 3 5-6" />
      </svg>
    ),
  },
  Rejected: {
    color: "#991B1B",
    bg: "#FFF1F2",
    border: "#FECDD3",
    Icon: () => (
      <svg
        className="w-3.5 h-3.5 shrink-0"
        fill="none"
        stroke="#DC2626"
        strokeWidth={2}
        viewBox="0 0 24 24"
      >
        <circle cx="12" cy="12" r="10" />
        <line x1="15" y1="9" x2="9" y2="15" strokeLinecap="round" />
        <line x1="9" y1="9" x2="15" y2="15" strokeLinecap="round" />
      </svg>
    ),
  },
};

// ── SVG Icons ─────────────────────────────────────────────────
function BriefcaseIcon() {
  return (
    <svg
      className="w-6 h-6"
      fill="none"
      stroke={C.white}
      strokeWidth={2}
      viewBox="0 0 24 24"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="2" y="7" width="20" height="14" rx="2" />
      <path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" />
    </svg>
  );
}

function BuildingIcon() {
  return (
    <svg
      className="w-5 h-5"
      fill="none"
      stroke={C.textMuted}
      strokeWidth={1.7}
      viewBox="0 0 24 24"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M9 3v18M15 3v18M3 9h18M3 15h18" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg
      className="w-4 h-4 inline-block mr-1.5 -mt-0.5"
      fill="none"
      stroke={C.textMuted}
      strokeWidth={1.7}
      viewBox="0 0 24 24"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

// FIXED: fixed DD/MM/YYYY format instead of toLocaleDateString(), which
// changes shape depending on the browser/OS locale (some show MM/DD/YYYY).
function formatDate(dateValue) {
  if (!dateValue) return "—";
  const d = new Date(dateValue);
  if (isNaN(d.getTime())) return "—";
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

// ── Main Component ────────────────────────────────────────────
export default function StudentApplication() {
  const navigate = useNavigate();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("All");
  const [fetchError, setFetchError] = useState(null);
  const isFirstLoad = useRef(true);

  // FIXED: pulled into its own function so it can be called both on mount
  // and repeatedly via polling (for live updates from the coordinator side).
  const fetchApplications = async () => {
    try {
      const data = await api.get("/applications/my");
      const raw = Array.isArray(data) ? data : [];

      // FIXED: drop applications whose job or company no longer exists
      // (coordinator deleted the company -> jobId.companyId becomes null/undefined,
      // which previously rendered as "Unknown Company"). We simply hide these
      // rather than showing a broken row.
      const valid = raw.filter(
        (app) => app.jobId && app.jobId.companyId && app.jobId.companyId.name,
      );

      setApplications(valid);
      setFetchError(null);
    } catch (err) {
      // FIXED: previously an unhandled rejection here (e.g. 401 because
      // there's no auth token) left the page stuck on "Loading..." forever.
      // Now we surface the actual error instead.
      console.error("Failed to fetch applications:", err);
      setFetchError(
        err?.response?.status === 401 || err?.status === 401
          ? "You're not logged in — please log in as a student to see your applications."
          : "Couldn't load applications. Check the console/network tab for details.",
      );
    } finally {
      if (isFirstLoad.current) {
        setLoading(false);
        isFirstLoad.current = false;
      }
    }
  };

  useEffect(() => {
    fetchApplications();

    // FIXED: live update — poll every 6s in the background (no loading
    // spinner on refetches) so that when a coordinator shortlists/selects/
    // rejects from ApplicationsManagementPage, the student sees it here
    // without needing to manually refresh.
    const interval = setInterval(fetchApplications, 6000);

    // Also refetch immediately when the student switches back to this tab.
    const onFocus = () => fetchApplications();
    window.addEventListener("focus", onFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", onFocus);
    };
  }, []);

  const totalCount = applications.length;
  const appliedCount = applications.filter((a) => a.status === "Applied").length;
  const shortlistedCount = applications.filter(
    (a) => a.status === "Shortlisted",
  ).length;
  const selectedCount = applications.filter((a) => a.status === "Selected").length;
  const rejectedCount = applications.filter((a) => a.status === "Rejected").length;

  // FIXED: filter tabs so a student can see just their Shortlisted / Selected /
  // Rejected / Applied companies — same pattern as coordinator's filter bar.
  const filtered = useMemo(
    () =>
      filterStatus === "All"
        ? applications
        : applications.filter((a) => a.status === filterStatus),
    [applications, filterStatus],
  );

  const filterTabs = [
    { label: "All", value: "All", count: totalCount },
    { label: "Applied", value: "Applied", count: appliedCount },
    { label: "Shortlisted", value: "Shortlisted", count: shortlistedCount },
    { label: "Selected", value: "Selected", count: selectedCount },
    { label: "Rejected", value: "Rejected", count: rejectedCount },
  ];

  if (loading)
    return (
      <div
        style={{ backgroundColor: C.background }}
        className="min-h-screen flex items-center justify-center"
      >
        <p style={{ color: C.textMuted }}>Loading your applications...</p>
      </div>
    );

  // FIXED: show the real reason instead of an endless "Loading..." spinner
  if (fetchError)
    return (
      <div
        style={{ backgroundColor: C.background }}
        className="min-h-screen flex items-center justify-center p-10"
      >
        <div
          className="rounded-2xl border p-6 max-w-md text-center shadow-sm"
          style={{ backgroundColor: C.white, borderColor: C.border }}
        >
          <p style={{ color: C.danger }} className="font-semibold mb-1">
            Couldn't load applications
          </p>
          <p style={{ color: C.textMuted }} className="text-sm">
            {fetchError}
          </p>
        </div>
      </div>
    );

  return (
    <div
      style={{ backgroundColor: C.background }}
      className="min-h-screen p-10 font-sans"
    >
      {/* ── Page Header ── */}
      <div className="flex items-start justify-between mb-6 flex-wrap gap-4">
        {/* Left: icon + title */}
        <div className="flex items-center gap-4">
          <div
            style={{ backgroundColor: C.textMain }}
            className="w-13 h-13 rounded-2xl flex items-center justify-center shrink-0 shadow-sm"
          >
            <BriefcaseIcon />
          </div>
          <div>
            <h1
              style={{ color: C.textMain }}
              className="text-[28px] font-bold leading-tight tracking-tight"
            >
              My Applications
            </h1>
            <p style={{ color: C.textMuted }} className="text-sm mt-0.5">
              Track the status of every job you've applied to.
            </p>
          </div>
        </div>

        {/* Right: live total counter */}
        <div
          className="flex items-center gap-2.5 rounded-2xl border px-5 py-3 shadow-sm"
          style={{ backgroundColor: C.white, borderColor: C.border }}
        >
          <span
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: C.success, animation: "pulse 2s infinite" }}
          />
          <div>
            <p
              className="text-[10px] font-semibold uppercase tracking-widest"
              style={{ color: C.textMuted }}
            >
              Total Applied
            </p>
            <p className="text-xl font-bold leading-tight" style={{ color: C.textMain }}>
              {totalCount}
            </p>
          </div>
        </div>
      </div>

      {/* ── Filter tabs ── */}
      <div
        className="flex items-center gap-2 flex-wrap mb-6 rounded-2xl border p-2 shadow-sm w-fit"
        style={{ backgroundColor: C.white, borderColor: C.border }}
      >
        {filterTabs.map((tab) => {
          const active = filterStatus === tab.value;
          const s = tab.value !== "All" ? statusConfig[tab.value] : null;
          return (
            <button
              key={tab.value}
              onClick={() => setFilterStatus(tab.value)}
              className="text-[13px] font-semibold px-4 py-1.5 rounded-xl border transition-all"
              style={{
                color: active ? (s ? s.color : C.primary) : C.textMuted,
                backgroundColor: active ? (s ? s.bg : "#EFF6FF") : "transparent",
                borderColor: active ? (s ? s.border : "#BFDBFE") : "transparent",
              }}
            >
              {tab.label} ({tab.count})
            </button>
          );
        })}
      </div>

      {/* ── Table Card ── */}
      <div
        style={{ backgroundColor: C.white, borderColor: C.border }}
        className="rounded-2xl border shadow-sm overflow-hidden"
      >
        {/* Column headers */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "2.2fr 2fr 1.6fr 1.2fr",
            paddingLeft: "24px",
            paddingRight: "24px",
            paddingTop: "16px",
            paddingBottom: "16px",
            borderBottom: `1px solid ${C.border}`,
          }}
        >
          {["COMPANY", "ROLE", "APPLIED DATE", "STATUS"].map((h) => (
            <span
              key={h}
              style={{ color: C.textMuted }}
              className="text-[11px] font-semibold tracking-widest uppercase"
            >
              {h}
            </span>
          ))}
        </div>

        {/* Rows */}
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center py-16 gap-2">
            <p style={{ color: C.textMuted }} className="text-sm">
              {filterStatus === "All"
                ? "You haven't applied to any jobs yet."
                : `No applications with status "${filterStatus}".`}
            </p>
          </div>
        ) : (
          filtered.map((app, idx) => {
            const s = statusConfig[app.status] || statusConfig.Applied;
            const isLast = idx === filtered.length - 1;

            return (
              <div
                key={app._id}
                style={{
                  display: "grid",
                  gridTemplateColumns: "2.2fr 2fr 1.6fr 1.2fr",
                  alignItems: "center",
                  paddingLeft: "24px",
                  paddingRight: "24px",
                  paddingTop: "22px",
                  paddingBottom: "22px",
                  borderBottom: isLast ? "none" : `1px solid ${C.border}`,
                  backgroundColor: C.white,
                  transition: "background 0.15s",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.backgroundColor = "#F8FAFC")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.backgroundColor = C.white)
                }
              >
                {/* Company - FIXED: clickable now, navigates to CompanyDetailPage */}
                <div
                  className="flex items-center gap-3 cursor-pointer group w-fit"
                  onClick={() =>
                    navigate(`/student/companies/${app.jobId.companyId._id}`)
                  }
                >
                  <div
                    style={{
                      backgroundColor: "#F1F5F9",
                      border: `1px solid ${C.border}`,
                      borderRadius: "12px",
                      width: "40px",
                      height: "40px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <BuildingIcon />
                  </div>
                  <span
                    className="font-bold text-[15px] text-[#0F172A] group-hover:text-[#1D4ED8] group-hover:underline transition-colors"
                  >
                    {app.jobId.companyId.name}
                  </span>
                </div>

                {/* Role */}
                <span style={{ color: C.textMuted }} className="text-[14px]">
                  {app.jobId?.role || "—"}
                </span>

                {/* Applied Date */}
                <span
                  style={{ color: C.textMuted }}
                  className="text-[14px] flex items-center"
                >
                  <CalendarIcon />
                  {formatDate(app.appliedDate)}
                </span>

                {/* Status badge */}
                <div>
                  <span
                    style={{
                      color: s.color,
                      backgroundColor: s.bg,
                      borderColor: s.border,
                      border: `1px solid`,
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      fontSize: "13px",
                      fontWeight: 600,
                      padding: "5px 14px",
                      borderRadius: "9999px",
                    }}
                  >
                    <s.Icon />
                    {app.status}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}