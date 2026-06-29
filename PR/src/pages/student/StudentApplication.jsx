import { useState, useEffect } from "react";
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

// ── Status config ─────────────────────────────────────────────
const statusConfig = {
  Shortlisted: {
    color: "#16A34A",
    bg: "#F0FDF4",
    border: "#BBF7D0",
    Icon: () => (
      <svg
        className="w-3.5 h-3.5 shrink-0"
        fill="none"
        stroke="#16A34A"
        strokeWidth={2}
        viewBox="0 0 24 24"
      >
        <circle cx="12" cy="12" r="10" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4" />
      </svg>
    ),
  },
  Applied: {
    color: "#B45309",
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
        <polyline
          strokeLinecap="round"
          strokeLinejoin="round"
          points="12 6 12 12 16 14"
        />
      </svg>
    ),
  },
  Rejected: {
    color: "#DC2626",
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

// ── Summary pills ─────────────────────────────────────────────
const summaryPills = [
  { label: "Total 7", color: C.textMain, bg: C.white, border: C.border },
  { label: "Applied 3", color: "#B45309", bg: "#FFFBEB", border: "#FDE68A" },
  {
    label: "Shortlisted 2",
    color: "#16A34A",
    bg: "#F0FDF4",
    border: "#BBF7D0",
  },
  { label: "Rejected 2", color: "#DC2626", bg: "#FFF1F2", border: "#FECDD3" },
];

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

// ── Main Component ────────────────────────────────────────────
export default function StudentApplication() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchApplications = async () => {
      const data = await api.get("/applications/my");
      setApplications(Array.isArray(data) ? data : []);
      setLoading(false);
    };
    fetchApplications();
  }, []);
  return (
    <div
      style={{ backgroundColor: C.background }}
      className="min-h-screen p-10 font-sans"
    >
      {/* ── Page Header ── */}
      <div className="flex items-start justify-between mb-8">
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

        {/* Right: summary pills */}
        <div className="flex items-center gap-2">
          {summaryPills.map((pill) => (
            <span
              key={pill.label}
              style={{
                color: pill.color,
                backgroundColor: pill.bg,
                borderColor: pill.border,
              }}
              className="border text-[13px] font-semibold px-4 py-1.5 rounded-full"
            >
              {pill.label}
            </span>
          ))}
        </div>
      </div>

      {/* ── Table Card ── */}
      <div
        style={{ backgroundColor: C.white, borderColor: C.border }}
        className="rounded-2xl border shadow-sm overflow-hidden"
      >
        {/* Column headers */}
        <div
          className="grid border-b px-6 py-4"
          style={{
            borderColor: C.border,
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
        {applications.map((app, idx) => {
          const s = statusConfig[app.status];
          const isLast = idx === applications.length - 1;

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
              {/* Company */}
              <div className="flex items-center gap-3">
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
                  style={{ color: C.textMain }}
                  className="font-bold text-[15px]"
                >
                  {app.jobId?.companyId?.name || "Unknown Company"}
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
                {app.appliedDate
                  ? new Date(app.appliedDate).toLocaleDateString()
                  : "—"}
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
        })}
      </div>
    </div>
  );
}
