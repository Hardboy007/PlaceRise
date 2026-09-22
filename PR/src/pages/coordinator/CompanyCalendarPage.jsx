import { useState, useMemo, useEffect } from "react";
import {
  Calendar,
  Clock,
  Building2,
  Bell,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  X,
  MapPin,
  IndianRupee,
  Briefcase,
  GraduationCap,
  Monitor,
  Shield,
  Coffee,
  Wifi,
  TrendingUp,
  CheckCircle2,
  ExternalLink,
} from "lucide-react";
import { api } from "../../utils/api";
import CompanyLogo from "../../components/common/CompanyLogo";

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
const SHORT = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];
const WDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const FULL_DAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

const PERK_ICONS = {
  "Health Insurance": Shield,
  "Work From Home": Wifi,
  "Flexible Hours": Clock,
  "Stock Options": TrendingUp,
  Meals: Coffee,
  "Laptop Provided": Monitor,
  Transport: Briefcase,
};

const getAvatarColors = () => ({ bg: "bg-[#EFF3FA]", text: "text-[#1a3a8f]" });
const dateKey = (d) => `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
const initials = (name) => (name || "??").slice(0, 2).toUpperCase();
const daysUntil = (date, ref) => Math.ceil((date - ref) / 86400000);

// A job can carry its packages in one of two shapes:
//   new: job.roleGroups = [{ role, ctc, eligibleBranches, skills, selectionProcess }, ...]
//   old: flat job.role / job.ctc / job.eligibleBranches / job.skills / job.selectionProcess
// This always returns the new shape (an array of role groups), so every
// place that reads role/CTC/branches/skills/selection-process can just use
// roleGroups[i].xyz without caring which shape the job came in as.
function getRoleGroups(job) {
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
}

// "₹11 LPA" for a single package, or "₹11–12 LPA" for a range across roles.
function packageLabel(roleGroups) {
  const nums = roleGroups
    .map((r) => Number(r.ctc))
    .filter((n) => !isNaN(n) && n > 0);
  if (!nums.length) return null;
  const min = Math.min(...nums);
  const max = Math.max(...nums);
  return min === max ? `₹${max} LPA` : `₹${min}–${max} LPA`;
}

// FIXED: job.lastDate is a calendar DAY the coordinator picked (e.g. "3
// July"), not a precise moment in time. It comes back from the API as a
// full ISO timestamp (Mongoose Date, serialized to UTC midnight for that
// day). Reading it with LOCAL getters (getFullYear/getMonth/getDate)
// reinterprets that UTC instant in the viewer's own timezone, which can
// silently shift the date forward or backward by a day — e.g. a deadline
// stored as "3 July 00:00 UTC" could read back as "4 July" locally
// depending on the viewer's offset. This pulls the date out using UTC
// components instead (so "3 July" always means the 3rd, everywhere), then
// builds a genuine local midnight Date from those same numbers so all the
// existing local-time comparisons (daysUntil, todayMid, calendar grid
// cells) keep working unchanged.
function toDeadlineDate(rawDate) {
  if (!rawDate) return null;
  const d = new Date(rawDate);
  if (isNaN(d.getTime())) return null;
  return new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
}

// Days-left counting starts from TOMORROW, not today — "diff" (from
// daysUntil) is the exclusive gap between today and the deadline (0 =
// deadline is today, negative = already past). If today is the deadline
// day, we show "Today · Last day" instead of a plain "Today" badge so
// it's unambiguous that this is the final day to apply.
function DaysBadge({ diff }) {
  const base =
    "text-[10px] px-2.5 py-0.5 rounded-full font-medium whitespace-nowrap flex-shrink-0 border tabular-nums";
  if (diff < 0)
    return (
      <span className={`${base} bg-gray-50 text-gray-400 border-gray-200`}>
        Closed
      </span>
    );
  if (diff === 0)
    return (
      <span className={`${base} bg-red-50 text-red-700 border-red-200`}>
        Today · Last day
      </span>
    );
  if (diff <= 3)
    return (
      <span className={`${base} bg-red-50 text-red-700 border-red-200`}>
        {diff}d left
      </span>
    );
  if (diff <= 7)
    return (
      <span className={`${base} bg-amber-50 text-amber-700 border-amber-200`}>
        {diff}d left
      </span>
    );
  return (
    <span
      className={`${base} bg-emerald-50 text-emerald-700 border-emerald-100`}
    >
      {diff}d left
    </span>
  );
}

function CompanyAvatar({ company, website, size = "md" }) {
  const px = size === "sm" ? 28 : size === "lg" ? 44 : 32;
  return <CompanyLogo name={company} website={website} size={px} />;
}

function JobTypeBadge({ type }) {
  return (
    <span
      className={`text-[10px] px-2 py-0.5 rounded-md border font-medium ${
        type === "Internship"
          ? "bg-violet-50 text-violet-700 border-violet-200"
          : "bg-[#EFF3FA] text-[#1a3a8f] border-[#B8C6E3]"
      }`}
    >
      {type === "Internship" ? "Internship" : "Full Time"}
    </span>
  );
}

// job: the job posting. roleIndex: which role group to show first — a job
// can have several roles (e.g. "Frontend" and "Backend" at different CTCs),
// each with its own branches/skills/selection process, so the modal shows
// a role switcher whenever there's more than one and lets the coordinator
// flip between them without closing the modal.
function JobDetailModal({ job, roleIndex = 0, onClose }) {
  const [activeTab, setActiveTab] = useState("overview");
  const [activeRoleIndex, setActiveRoleIndex] = useState(roleIndex);

  // Reset to the role that was clicked (and back to the Overview tab)
  // whenever a different job/role is opened.
  useEffect(() => {
    setActiveRoleIndex(roleIndex);
    setActiveTab("overview");
  }, [job?._id, roleIndex]);

  if (!job) return null;

  const roleGroups = getRoleGroups(job);
  const role = roleGroups[activeRoleIndex] || roleGroups[0] || {};
  const multiRole = roleGroups.length > 1;

  const companyName = job.companyId?.name || "Unknown";
  // FIXED: use the timezone-safe deadline instead of new Date(job.lastDate)
  // directly, so the modal shows the same day as everywhere else.
  const deadlineDate = toDeadlineDate(job.lastDate);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.45)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="bg-white rounded-2xl w-full max-w-lg overflow-hidden border border-gray-100 shadow-2xl flex flex-col max-h-[90vh] animate-[modalIn_0.18s_ease-out]"
        style={{ animationFillMode: "backwards" }}
      >
        {/*
          FIXED: header + tabs were missing `shrink-0`. The outer wrapper is
          a flex-column capped at max-h-[90vh] — when the Overview tab's
          content (long about-text, tech stack, grid boxes, deadline card)
          pushed total height past that cap, flexbox tried to shrink EVERY
          child to fit, including this header. Because the header also has
          `overflow-hidden` (for the decorative circle), the browser treats
          its flex "minimum size" as 0 instead of its real content height —
          so it was allowed to shrink below the badges row, clipping/
          overlapping them into the tabs bar right below. The Process tab
          has far less content, never hit the cap, so it never shrank and
          looked fine. `shrink-0` on both header and tabs bar means only the
          actual scrollable content area (which already has flex-1 +
          overflow-y-auto, built to absorb overflow) gives up space.
        */}
        <div
          className="px-4 sm:px-6 pt-5 sm:pt-6 pb-5 relative overflow-hidden shrink-0"
          style={{
            background:
              "linear-gradient(135deg, #0d1b5e 0%, #1a2d8a 25%, #3d1a6e 55%, #6b1040 80%, #7a0f35 100%)",
            boxShadow: "inset 0 -20px 40px -20px rgba(0,0,0,0.15)",
          }}
        >
          <div
            className="absolute top-0 right-0 w-40 h-40 rounded-full opacity-10 bg-white"
            style={{ transform: "translate(30%,-30%)" }}
          />
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/70 hover:text-white hover:bg-white/20 rounded-lg p-1.5 transition-colors"
          >
            <X size={16} />
          </button>
          <div className="flex items-center gap-3 pr-8">
            <CompanyLogo
              name={companyName}
              website={job.companyId?.website}
              size={48}
            />
            <div className="min-w-0">
              <p className="text-white font-semibold text-base leading-tight tracking-tight truncate">
                {companyName}
              </p>
              <p className="text-white/75 text-[12px] mt-0.5 truncate">
                {role.role || "Role not specified"}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 mt-4">
            {[
              { icon: MapPin, label: job.location },
              role.ctc ? { icon: IndianRupee, label: `${role.ctc} LPA` } : null,
              { icon: GraduationCap, label: `CGPA ${job.minCgpa || 0}+` },
              { icon: Briefcase, label: job.jobType },
            ]
              .filter(Boolean)
              .map(({ icon: Icon, label }) => (
                <span
                  key={label}
                  className="text-[11px] px-2.5 py-1 rounded-lg bg-white/20 text-white border border-white/25 inline-flex items-center gap-1.5 whitespace-nowrap"
                >
                  <Icon size={11} /> {label}
                </span>
              ))}
          </div>

          {/* Role switcher — only shown when this company posted more than
              one role for this drive. Switching roles updates everything
              below (branches, skills, package, selection process) without
              closing the modal. */}
          {multiRole && (
            <div className="flex flex-wrap gap-1.5 mt-3.5 pt-3.5 border-t border-white/15">
              {roleGroups.map((r, i) => (
                <button
                  key={r._id || i}
                  onClick={() => setActiveRoleIndex(i)}
                  className={`text-[11px] px-2.5 py-1 rounded-lg border font-medium transition-colors ${
                    i === activeRoleIndex
                      ? "bg-white text-[#1a3a8f] border-white"
                      : "bg-white/10 text-white/80 border-white/25 hover:bg-white/20"
                  }`}
                >
                  {r.role}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex border-b border-gray-100 px-4 shrink-0">
          {["overview", "process", "perks"].map((t) => (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              className={`px-3 sm:px-4 py-3 text-[12px] font-medium capitalize transition-colors border-b-2 -mb-px ${
                activeTab === t
                  ? "border-[#1a3a8f] text-[#1a3a8f]"
                  : "border-transparent text-gray-400 hover:text-gray-600"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="overflow-y-auto flex-1 p-4 sm:p-5">
          {activeTab === "overview" && (
            <div className="space-y-4">
              {job.companyId?.about && (
                <p className="text-[13px] text-gray-500 leading-relaxed">
                  {job.companyId.about}
                </p>
              )}

              {(role.skills || []).length > 0 && (
                <div>
                  <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider mb-2">
                    Required Skills
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {role.skills.map((item) => (
                      <span
                        key={item}
                        className="text-[11px] px-2.5 py-1 rounded-lg border bg-gray-50 text-gray-600 border-gray-200"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2 sm:gap-3">
                {[
                  { icon: Briefcase, label: "Job Type", val: job.jobType },
                  {
                    icon: GraduationCap,
                    label: "Batch",
                    val: job.batch || "—",
                  },
                  {
                    icon: GraduationCap,
                    label: "Branches",
                    val: (role.eligibleBranches || []).join(", ") || "All",
                  },
                  {
                    icon: Clock,
                    label: "Max Backlogs",
                    val: job.maxBacklogs ?? 0,
                  },
                ].map(({ icon: Icon, label, val }) => (
                  <div
                    key={label}
                    className="bg-gray-50 rounded-xl p-2.5 sm:p-3 border border-gray-100 min-w-0"
                  >
                    <div className="flex items-center gap-1.5 mb-1">
                      <Icon size={12} className="text-gray-400 shrink-0" />
                      <span className="text-[10px] text-gray-400 font-medium">
                        {label}
                      </span>
                    </div>
                    <p className="text-[12px] text-gray-700 font-medium wrap-break-word">
                      {val}
                    </p>
                  </div>
                ))}
              </div>

              {/* Registration link — only shown when the coordinator has
                  added one for this job. */}
              {job.registrationLink && (
                <div className="rounded-xl p-3 border border-[#B8C6E3] bg-[#EFF3FA] flex items-start gap-2.5">
                  <ExternalLink
                    size={14}
                    className="text-[#1a3a8f] shrink-0 mt-0.5"
                  />
                  <div className="min-w-0">
                    <p className="text-[11px] font-medium text-[#1a3a8f]">
                      Company registration
                    </p>
                    <a
                      href={job.registrationLink}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[12px] font-semibold text-[#1a3a8f] hover:underline break-all"
                    >
                      {job.registrationLink}
                    </a>
                  </div>
                </div>
              )}

              {/* Bond / fee — only shown when the coordinator has added
                  details for this job. */}
              {job.bondDetails && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
                  <p className="text-[11px] font-medium text-amber-700 mb-1">
                    Bond / Fee
                  </p>
                  <p className="text-[12px] text-amber-800 leading-relaxed whitespace-pre-line">
                    {job.bondDetails}
                  </p>
                </div>
              )}

              <div className="bg-red-50 border border-red-100 rounded-xl p-3 flex items-center gap-2.5">
                <Bell size={14} className="text-red-500 shrink-0" />
                <div>
                  <p className="text-[11px] font-medium text-red-700">
                    Application deadline
                  </p>
                  <p className="text-[12px] text-red-800 font-semibold">
                    {deadlineDate
                      ? deadlineDate.toLocaleDateString("en-GB")
                      : "—"}
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === "process" && (
            <div className="space-y-3">
              {(role.selectionProcess || []).length === 0 ? (
                <p className="text-[12px] text-gray-400 text-center py-6">
                  No selection process listed for this role.
                </p>
              ) : (
                role.selectionProcess.map((step, i) => (
                  <div key={i} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className="w-7 h-7 rounded-full bg-[#EFF3FA] text-[#1a3a8f] flex items-center justify-center text-[11px] font-semibold border border-[#B8C6E3] shrink-0">
                        {i + 1}
                      </div>
                      {i < role.selectionProcess.length - 1 && (
                        <div className="w-px flex-1 bg-gray-100 my-1" />
                      )}
                    </div>
                    <div className="pb-3 flex-1">
                      <p className="text-[13px] font-medium text-gray-800">
                        {step}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === "perks" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {(job.perks || []).length === 0 ? (
                <p className="text-[12px] text-gray-400 text-center py-6 col-span-1 sm:col-span-2">
                  No perks listed.
                </p>
              ) : (
                job.perks.map((perk) => {
                  const Icon = PERK_ICONS[perk] ?? CheckCircle2;
                  return (
                    <div
                      key={perk}
                      className="bg-gray-50 border border-gray-100 rounded-xl p-3 flex items-center gap-2.5"
                    >
                      <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center border border-gray-200 shrink-0">
                        <Icon size={15} className="text-[#1a3a8f]" />
                      </div>
                      <span className="text-[12px] text-gray-700 font-medium">
                        {perk}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// jobs: postings whose deadline falls on the clicked day. Each posting can
// carry several roles — if it does, the company row expands into a list of
// its roles instead of opening the detail modal directly, so a coordinator
// can pick which role's details they want to see.
function DayPopupModal({
  selectedDay,
  selectedMonth,
  selectedYear,
  jobs,
  onClose,
  onSelectJob,
}) {
  const [expandedId, setExpandedId] = useState(null);
  if (!selectedDay) return null;

  return (
    <div
      className="fixed inset-0 bg-black/40 z-50 flex items-start justify-center pt-16 sm:pt-20 px-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl border border-gray-100 shadow-2xl w-full max-w-90 sm:w-90 overflow-hidden animate-[modalIn_0.18s_ease-out]">
        <div
          className="px-4 sm:px-5 py-4 border-b border-gray-100 flex items-start justify-between"
          style={{
            background:
              "linear-gradient(135deg, #0d1b5e 0%, #1a2d8a 25%, #3d1a6e 55%, #6b1040 80%, #7a0f35 100%)",
          }}
        >
          <div>
            <p className="text-[14px] font-semibold text-white tracking-tight">
              {selectedDay} {MONTHS[selectedMonth]} {selectedYear}
            </p>
            <p className="text-[11px] text-white/70 mt-0.5">
              {jobs.length} job{jobs.length === 1 ? "" : "s"} with deadline
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-white/70 hover:text-white hover:bg-white/20 rounded-lg p-1.5 transition-colors"
          >
            <X size={14} />
          </button>
        </div>
        <div className="p-3 flex flex-col gap-2 max-h-100 overflow-y-auto">
          {jobs.map((j) => {
            const roleGroups = getRoleGroups(j);
            const multiRole = roleGroups.length > 1;
            const pkg = packageLabel(roleGroups);
            const isExpanded = expandedId === j._id;

            return (
              <div
                key={j._id}
                className="bg-gray-50 border border-gray-100 rounded-xl overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() => {
                    if (multiRole) {
                      setExpandedId(isExpanded ? null : j._id);
                    } else {
                      onClose();
                      onSelectJob(j, 0);
                    }
                  }}
                  className="w-full text-left p-3 hover:border-[#B8C6E3] hover:bg-[#EFF3FA] hover:shadow-sm transition-all duration-150 group"
                >
                  <div className="flex items-center gap-2.5 mb-2.5">
                    <CompanyAvatar
                      company={j.companyId?.name}
                      website={j.companyId?.website}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-semibold text-gray-900 truncate">
                        {j.companyId?.name || "Unknown"}
                      </p>
                      <p className="text-[11px] text-gray-500 truncate">
                        {multiRole
                          ? `${roleGroups.length} roles`
                          : roleGroups[0]?.role || "Role not specified"}
                      </p>
                    </div>
                    <JobTypeBadge type={j.jobType} />
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-white text-gray-500 border border-gray-200 flex items-center gap-1">
                      <MapPin size={9} /> {j.location}
                    </span>
                    {pkg && (
                      <span className="text-[10px] px-2 py-0.5 rounded-md bg-white text-gray-500 border border-gray-200 flex items-center gap-1">
                        <IndianRupee size={9} /> {pkg}
                      </span>
                    )}
                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-white text-gray-500 border border-gray-200">
                      CGPA {j.minCgpa || 0}+
                    </span>
                  </div>
                  {multiRole ? (
                    <p className="text-[10px] text-[#1a3a8f] mt-2 font-medium flex items-center gap-1">
                      {isExpanded ? "Hide roles" : "View roles"}
                      <ChevronDown
                        size={11}
                        className={`transition-transform ${isExpanded ? "rotate-180" : ""}`}
                      />
                    </p>
                  ) : (
                    <p className="text-[10px] text-[#1a3a8f] mt-2 opacity-0 group-hover:opacity-100 transition-opacity font-medium">
                      Click to view details →
                    </p>
                  )}
                </button>

                {multiRole && isExpanded && (
                  <div className="border-t border-gray-200 divide-y divide-gray-200">
                    {roleGroups.map((r, i) => (
                      <button
                        key={r._id || i}
                        type="button"
                        onClick={() => {
                          onClose();
                          onSelectJob(j, i);
                        }}
                        className="w-full text-left px-3 py-2.5 bg-white hover:bg-[#EFF3FA] transition-colors flex items-center justify-between gap-2"
                      >
                        <span className="text-[12px] font-medium text-gray-800 truncate">
                          {r.role}
                        </span>
                        {r.ctc && (
                          <span className="text-[11px] font-semibold text-[#1a3a8f] shrink-0">
                            ₹{r.ctc} LPA
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function CompanyCalendarPage() {
  const today = new Date();
  const todayMid = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  );

  const [curYear, setCurYear] = useState(today.getFullYear());
  const [curMonth, setCurMonth] = useState(today.getMonth());
  const [dayPopup, setDayPopup] = useState(null);
  const [detailJob, setDetailJob] = useState(null);
  const [detailRoleIndex, setDetailRoleIndex] = useState(0);
  const [filter, setFilter] = useState("upcoming");
  const [search, setSearch] = useState("");
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = "Placement Calendar";
    const fetchJobs = async () => {
      const data = await api.get("/companies/jobs");
      const valid = (Array.isArray(data) ? data : []).filter(
        // Only keep jobs that have a deadline AND still have a valid,
        // non-deleted company attached. If a company was removed from
        // Company Management, its jobs may still exist in the DB but
        // companyId will be null/missing after population — drop those.
        (j) => j.lastDate && j.companyId && j.companyId._id && j.companyId.name,
      );
      setJobs(valid);
      setLoading(false);
    };
    fetchJobs();
  }, []);

  // FIXED: group jobs into calendar cells using the timezone-safe deadline
  // date (toDeadlineDate) instead of raw `new Date(j.lastDate)` — this is
  // what was placing a "3 July" deadline into the "4 July" cell for
  // viewers in certain timezones.
  const dateMap = useMemo(() => {
    const map = {};
    jobs.forEach((j) => {
      const d = toDeadlineDate(j.lastDate);
      if (!d) return;
      const k = dateKey(d);
      if (!map[k]) map[k] = [];
      map[k].push(j);
    });
    return map;
  }, [jobs]);

  // FIXED: same timezone-safe parsing used for the sidebar list, so
  // "upcoming" vs "closed" classification and the displayed date always
  // agree with the calendar grid.
  const sortedJobs = useMemo(
    () =>
      jobs
        .map((j) => ({ ...j, parsedDate: toDeadlineDate(j.lastDate) }))
        .filter((j) => j.parsedDate)
        .sort((a, b) => a.parsedDate - b.parsedDate),
    [jobs],
  );

  const upcomingCount = sortedJobs.filter(
    (j) => j.parsedDate >= todayMid,
  ).length;
  const thisMonthCount = sortedJobs.filter(
    (j) =>
      j.parsedDate.getMonth() === curMonth &&
      j.parsedDate.getFullYear() === curYear,
  ).length;

  const daysInMonth = new Date(curYear, curMonth + 1, 0).getDate();
  const firstDay = new Date(curYear, curMonth, 1).getDay();
  const todayLabel = `${FULL_DAYS[today.getDay()]}, ${today.getDate()} ${SHORT[today.getMonth()]} ${today.getFullYear()}`;

  function changeMonth(dir) {
    let m = curMonth + dir,
      y = curYear;
    if (m > 11) {
      m = 0;
      y++;
    }
    if (m < 0) {
      m = 11;
      y--;
    }
    setCurMonth(m);
    setCurYear(y);
  }

  // Returns tailwind classes for a deadline chip in the calendar grid,
  // based on how many days remain until that job's lastDate (relative
  // to today). >7 days => green, <=7 days (and not yet closed) => red,
  // already past => muted gray. cellDate is already the timezone-safe,
  // correctly-grouped day (see dateMap above), so this now agrees with
  // the sidebar's Closed/Today/Nd-left badges.
  function calendarChipClasses(jobDate) {
    const diff = daysUntil(jobDate, todayMid);
    if (diff < 0) return "bg-gray-50 text-gray-400 border-gray-200";
    if (diff <= 7) return "bg-red-50 text-red-700 border-red-100";
    return "bg-emerald-50 text-emerald-700 border-emerald-100";
  }

  // Solid, high-contrast color for the small mobile "event dot" — the
  // pale bg-*-50 tones used for desktop chips are too faint to read as a
  // 6px dot, so mobile gets its own solid palette instead.
  function calendarDotColor(jobDate) {
    const diff = daysUntil(jobDate, todayMid);
    if (diff < 0) return "bg-gray-300";
    if (diff <= 7) return "bg-red-500";
    return "bg-emerald-500";
  }

  function openJobDetail(job, roleIndex = 0) {
    setCurYear(job.parsedDate ? job.parsedDate.getFullYear() : curYear);
    setCurMonth(job.parsedDate ? job.parsedDate.getMonth() : curMonth);
    setDetailJob(job);
    setDetailRoleIndex(roleIndex);
  }

  if (loading)
    return (
      <div className="p-4 space-y-4 animate-pulse">
        <div
          className="h-44 rounded-2xl mx-0"
          style={{
            background:
              "linear-gradient(135deg, #0d1b5e 0%, #1a2d8a 25%, #3d1a6e 55%, #6b1040 80%, #7a0f35 100%)",
            opacity: 0.25,
          }}
        />
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 h-96 bg-gray-100 rounded-2xl" />
          <div className="w-full lg:w-67 h-96 bg-gray-100 rounded-2xl shrink-0" />
        </div>
      </div>
    );
  return (
    <div className="flex flex-col h-full">
      <style>{`
        @keyframes modalIn {
          from { opacity: 0; transform: scale(0.97) translateY(4px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>

      <div
        className="relative overflow-hidden rounded-2xl mx-2 sm:mx-4 mt-2 sm:mt-4 p-4 sm:p-6"
        style={{
          background:
            "linear-gradient(135deg, #0d1b5e 0%, #1a2d8a 25%, #3d1a6e 55%, #6b1040 80%, #7a0f35 100%)",
          boxShadow: "inset 0 -20px 40px -20px rgba(0,0,0,0.15)",
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
            stroke="url(#calendarRedOrangeGrad)"
            strokeWidth="3.5"
            fill="none"
            strokeLinecap="round"
          />
          <path
            d="M260 110 Q190 50 100 85 Q40 105 10 115"
            stroke="url(#calendarRedOrangeGrad)"
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
            opacity="0.5"
          />
          <defs>
            <linearGradient
              id="calendarRedOrangeGrad"
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
        <div className="relative z-10 flex items-start justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1.5">
              <div className="w-6 h-6 rounded-md bg-white/20 flex items-center justify-center shrink-0">
                <CalendarDays size={13} className="text-[#f59e0b]" />
              </div>
              <span className="text-white/60 text-[10px] font-bold uppercase tracking-widest">
                Placement Tracker
              </span>
            </div>
            <h1
              className="text-lg sm:text-2xl font-bold text-white tracking-tight"
              style={{ fontFamily: "Space Grotesk, sans-serif" }}
            >
              Placement Calendar
            </h1>
            <p className="text-white/55 text-[11px] sm:text-xs mt-1 flex items-center gap-1.5">
              <Clock size={12} className="shrink-0" /> {todayLabel}
            </p>
          </div>
          <button
            onClick={() => {
              setCurYear(today.getFullYear());
              setCurMonth(today.getMonth());
            }}
            className="flex items-center gap-1.5 bg-white text-[#1a3a8f] rounded-xl px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-bold hover:bg-[#F1F5F9] transition-colors shadow-lg shrink-0 mt-1"
          >
            <Calendar size={14} /> Today
          </button>
        </div>

        <div className="relative z-10 grid grid-cols-3 gap-2 sm:gap-3">
          {[
            {
              icon: Building2,
              label: "Active JDs",
              shortLabel: "Active JDs",
              val: jobs.length,
            },
            {
              icon: Bell,
              label: "Deadlines Ahead",
              shortLabel: "Deadlines",
              val: upcomingCount,
              highlight: upcomingCount > 0,
            },
            {
              icon: CalendarDays,
              label: "This Month",
              shortLabel: "This Month",
              val: thisMonthCount,
            },
          ].map(({ icon: Icon, label, shortLabel, val, highlight }) => (
            <div
              key={label}
              className="rounded-xl px-2 sm:px-4 py-2.5 sm:py-3 border border-white/10 min-w-0"
              style={{
                background: highlight
                  ? "rgba(239,68,68,0.20)"
                  : "rgba(255,255,255,0.12)",
              }}
            >
              <div className="flex items-center gap-1 mb-1">
                <Icon size={12} className="text-white/60 shrink-0" />
                <span className="text-white/55 text-[8.5px] sm:text-[10px] font-semibold uppercase tracking-wider leading-tight sm:whitespace-nowrap">
                  <span className="sm:hidden">{shortLabel}</span>
                  <span className="hidden sm:inline">{label}</span>
                </span>
              </div>
              <p
                className="text-white text-lg sm:text-2xl font-bold leading-none tabular-nums"
                style={{ fontFamily: "Space Grotesk, sans-serif" }}
              >
                {val}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col lg:flex-row flex-1 mx-2 sm:mx-4 mb-4">
        <div className="flex-1 flex flex-col overflow-auto pt-3 sm:pt-4 lg:pr-4">
          <div className="bg-white border border-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_8px_24px_-8px_rgba(29,78,216,0.10)] rounded-2xl p-3 sm:p-5 flex-1">
            <div className="flex items-center justify-between mb-3 sm:mb-5">
              <span className="text-[13px] sm:text-[15px] font-semibold text-gray-900 tracking-tight">
                {MONTHS[curMonth]} {curYear}
              </span>
              <div className="flex gap-1.5">
                <button
                  onClick={() => changeMonth(-1)}
                  className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center border border-gray-200 rounded-xl text-gray-400 hover:bg-gray-50 hover:text-gray-700 transition-colors"
                >
                  <ChevronLeft size={15} />
                </button>
                <button
                  onClick={() => changeMonth(1)}
                  className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center border border-gray-200 rounded-xl text-gray-400 hover:bg-gray-50 hover:text-gray-700 transition-colors"
                >
                  <ChevronRight size={15} />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-7 border-b-2 border-gray-200 pb-2">
              {WDAYS.map((d) => (
                <div
                  key={d}
                  className="text-center text-[9px] sm:text-[10px] font-semibold text-gray-400 tracking-wider py-1 uppercase"
                >
                  {d}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 divide-x divide-y divide-gray-100">
              {Array.from({ length: firstDay }).map((_, i) => (
                <div key={`e-${i}`} className="min-h-12 sm:min-h-17" />
              ))}
              {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(
                (day) => {
                  const dayJobs =
                    dateMap[`${curYear}-${curMonth + 1}-${day}`] || [];
                  const isToday =
                    today.getFullYear() === curYear &&
                    today.getMonth() === curMonth &&
                    today.getDate() === day;
                  const cellDate = new Date(curYear, curMonth, day);
                  const hasJobs = dayJobs.length > 0;
                  // Mobile gets a persistent light tint on any date that
                  // has a deadline, so you can see at a glance which dates
                  // have companies without needing to tap each one.
                  const mobileTint = !hasJobs
                    ? ""
                    : daysUntil(cellDate, todayMid) < 0
                      ? "sm:bg-transparent bg-gray-50"
                      : daysUntil(cellDate, todayMid) <= 7
                        ? "sm:bg-transparent bg-red-50/70"
                        : "sm:bg-transparent bg-emerald-50/70";
                  return (
                    <div
                      key={day}
                      onClick={() =>
                        dayJobs.length && setDayPopup({ day, jobs: dayJobs })
                      }
                      className={`min-h-12 sm:min-h-17 p-1 sm:p-2 transition-all duration-200 ${mobileTint} ${
                        dayJobs.length
                          ? "cursor-pointer hover:bg-[#EFF3FA] hover:-translate-y-0.5 hover:shadow-sm hover:z-10 relative rounded-lg"
                          : "cursor-default"
                      } ${isToday ? "bg-[#EFF3FA] ring-1 ring-inset ring-[#B8C6E3] rounded-lg" : ""}`}
                    >
                      <span
                        className={`text-[10px] sm:text-[12px] block mb-1 sm:mb-1.5 leading-none font-medium tabular-nums ${isToday ? "text-[#1a3a8f]" : "text-gray-400"}`}
                      >
                        {day}
                      </span>
                      {dayJobs.length > 0 && (
                        <div className="flex flex-col gap-0.75">
                          {dayJobs.slice(0, 2).map((j, i) => (
                            <div
                              key={i}
                              className={`hidden sm:flex text-[9px] font-semibold px-1.5 py-0.75 rounded-md border truncate leading-none items-center gap-1 ${calendarChipClasses(cellDate)}`}
                            >
                              <span className="w-1 h-1 rounded-full bg-current shrink-0" />
                              {j.companyId?.name || "—"}
                            </div>
                          ))}
                          {dayJobs.length > 2 && (
                            <span className="hidden sm:inline text-[9px] text-gray-400 px-0.5 font-medium">
                              +{dayJobs.length - 2} more
                            </span>
                          )}
                          {/* Mobile: solid dots (one per job, up to 3) + count, since full
                              chips don't fit a 7-column grid on a phone screen. Tap the
                              day to see the full list in the popup. */}
                          <div className="sm:hidden flex items-center gap-0.5 flex-wrap">
                            {dayJobs.slice(0, 3).map((j, i) => (
                              <span
                                key={i}
                                className={`w-1.5 h-1.5 rounded-full ${calendarDotColor(cellDate)}`}
                              />
                            ))}
                            {dayJobs.length > 1 && (
                              <span className="text-[8px] font-bold text-gray-500 ml-0.5 tabular-nums">
                                {dayJobs.length}
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                },
              )}
            </div>

            <div className="flex flex-wrap gap-3 sm:gap-5 mt-4 pt-4 border-t border-gray-100">
              <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] text-gray-400">
                <div className="w-2.5 h-2.5 rounded bg-emerald-50 border border-emerald-200 shrink-0" />{" "}
                More than 7 days left
              </div>
              <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] text-gray-400">
                <div className="w-2.5 h-2.5 rounded bg-red-50 border border-red-200 shrink-0" />{" "}
                7 days or fewer left
              </div>
              <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] text-gray-400">
                <div className="w-2.5 h-2.5 rounded-sm bg-[#EFF3FA] border border-[#B8C6E3] shrink-0" />{" "}
                Today
              </div>
            </div>
          </div>
        </div>

        <div className="w-full lg:w-67 border border-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_8px_24px_-8px_rgba(29,78,216,0.10)] bg-white rounded-2xl flex flex-col shrink-0 mt-3 lg:mt-4 overflow-hidden">
          <div className="px-4 py-3.5 border-b border-gray-100">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <p className="text-[13px] font-semibold text-gray-900 tracking-tight">
                Deadlines
              </p>
              <div className="flex items-center bg-gray-100 rounded-lg p-0.5">
                {["upcoming", "closed", "all"].map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`px-2.5 py-1 rounded-md text-[10px] font-medium capitalize transition-colors ${filter === f ? "bg-white text-[#1a3a8f] shadow-sm" : "text-gray-400 hover:text-gray-600"}`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>
            <p className="text-[11px] text-gray-400 mt-1 tabular-nums">
              {upcomingCount} deadline{upcomingCount !== 1 ? "s" : ""} remaining
            </p>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search company or role..."
              className="w-full mt-2.5 px-2.5 py-1.5 text-[11px] border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:border-blue-400 placeholder:text-gray-400"
            />
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-gray-100 max-h-80 lg:max-h-none">
            {sortedJobs.length === 0 ? (
              <p className="text-[12px] text-gray-400 text-center py-10">
                No active job postings yet.
              </p>
            ) : (
              sortedJobs
                .filter((j) =>
                  filter === "all"
                    ? true
                    : filter === "closed"
                      ? j.parsedDate < todayMid
                      : j.parsedDate >= todayMid,
                )
                .filter((j) => {
                  const q = search.toLowerCase().trim();
                  if (!q) return true;
                  const roleGroups = getRoleGroups(j);
                  const roleMatch = roleGroups.some((r) =>
                    (r.role || "").toLowerCase().includes(q),
                  );
                  return (
                    (j.companyId?.name || "").toLowerCase().includes(q) ||
                    roleMatch
                  );
                })
                .map((j) => {
                  const diff = daysUntil(j.parsedDate, todayMid);
                  const dateStr = `${j.parsedDate.getDate()} ${SHORT[j.parsedDate.getMonth()]}`;
                  const roleGroups = getRoleGroups(j);
                  const multiRole = roleGroups.length > 1;
                  const pkg = packageLabel(roleGroups);
                  const roleLabel = multiRole
                    ? `${roleGroups.length} roles`
                    : roleGroups[0]?.role || "Role not specified";
                  return (
                    <div
                      key={j._id}
                      onClick={() => openJobDetail(j, 0)}
                      className={`px-4 py-3 flex items-start gap-3 hover:bg-gray-50 hover:shadow-sm transition-all duration-150 cursor-pointer group ${
                        j._id ===
                        sortedJobs.find((x) => x.parsedDate >= todayMid)?._id
                          ? "border-l-2 border-[#1a3a8f] bg-[#EFF3FA]"
                          : ""
                      }`}
                    >
                      <CompanyAvatar
                        company={j.companyId?.name}
                        website={j.companyId?.website}
                        size="sm"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-[12px] font-semibold text-gray-900 truncate group-hover:text-[#1a3a8f] transition-colors">
                          {j.companyId?.name || "—"}
                        </p>
                        <p className="text-[11px] text-gray-500 truncate mt-0.5">
                          {roleLabel}
                        </p>
                        <p className="text-[10px] text-gray-400 mt-1 flex items-center gap-1 tabular-nums">
                          <Calendar size={9} /> {dateStr}
                          {pkg ? ` · ${pkg}` : ""}
                        </p>
                      </div>
                      <DaysBadge diff={diff} />
                    </div>
                  );
                })
            )}
          </div>
        </div>
      </div>

      {dayPopup && (
        <DayPopupModal
          selectedDay={dayPopup.day}
          selectedMonth={curMonth}
          selectedYear={curYear}
          jobs={dayPopup.jobs}
          onClose={() => setDayPopup(null)}
          onSelectJob={(j, roleIdx) => {
            setDayPopup(null);
            setDetailJob(j);
            setDetailRoleIndex(roleIdx ?? 0);
          }}
        />
      )}

      {detailJob && (
        <JobDetailModal
          job={detailJob}
          roleIndex={detailRoleIndex}
          onClose={() => setDetailJob(null)}
        />
      )}
    </div>
  );
}
