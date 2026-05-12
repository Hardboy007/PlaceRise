import { useState, useMemo } from "react";
import {
  Calendar,
  Clock,
  Building2,
  Bell,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  X,
  MapPin,
  IndianRupee,
  Briefcase,
  GraduationCap,
  Users,
  Monitor,
  Shield,
  Coffee,
  Wifi,
  TrendingUp,
  CheckCircle2,
} from "lucide-react";
import mockCompanies from "../../data/mockCompanies";

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

const AVATAR_COLORS = {
  Google: { bg: "bg-blue-50", text: "text-blue-700" },
  Amazon: { bg: "bg-amber-50", text: "text-amber-700" },
  Microsoft: { bg: "bg-violet-50", text: "text-violet-700" },
  Infosys: { bg: "bg-emerald-50", text: "text-emerald-700" },
  TCS: { bg: "bg-rose-50", text: "text-rose-700" },
};

const PERK_ICONS = {
  "Health Insurance": Shield,
  "Work From Home": Wifi,
  "Flexible Hours": Clock,
  "Stock Options": TrendingUp,
  Meals: Coffee,
  "Laptop Provided": Monitor,
  Transport: Briefcase,
};

const PROCESS_COLORS = {
  Online: { bg: "bg-blue-50", text: "text-blue-700" },
  Technical: { bg: "bg-violet-50", text: "text-violet-700" },
  HR: { bg: "bg-emerald-50", text: "text-emerald-700" },
  "Case Study": { bg: "bg-amber-50", text: "text-amber-700" },
};

const getAvatarColors = (company) =>
  AVATAR_COLORS[company] ?? { bg: "bg-gray-100", text: "text-gray-600" };

const parseDate = (str) => {
  const [d, m, y] = str.trim().split(" ");
  return new Date(parseInt(y), SHORT.indexOf(m), parseInt(d));
};

const dateKey = (d) => `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
const initials = (name) => name.slice(0, 2).toUpperCase();
const daysUntil = (date, ref) => Math.ceil((date - ref) / 86400000);

function DaysBadge({ diff }) {
  const base =
    "text-[10px] px-2.5 py-0.5 rounded-full font-medium whitespace-nowrap flex-shrink-0 border";
  if (diff < 0)
    return (
      <span className={`${base} bg-gray-50 text-gray-400 border-gray-200`}>
        Closed
      </span>
    );
  if (diff === 0)
    return (
      <span className={`${base} bg-red-50 text-red-700 border-red-200`}>
        Today
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
      className={`${base} bg-emerald-50 text-emerald-700 border-emerald-200`}
    >
      {diff}d left
    </span>
  );
}

function CompanyAvatar({ company, size = "md" }) {
  const { bg, text } = getAvatarColors(company);
  const sz =
    size === "sm"
      ? "w-7 h-7 text-[10px]"
      : size === "lg"
        ? "w-11 h-11 text-[13px]"
        : "w-8 h-8 text-[11px]";
  return (
    <div
      className={`${sz} ${bg} ${text} rounded-xl flex items-center justify-center font-semibold shrink-0`}
    >
      {initials(company)}
    </div>
  );
}

function JobTypeBadge({ type }) {
  return (
    <span
      className={`text-[10px] px-2 py-0.5 rounded-md border font-medium ${
        type === "Internship"
          ? "bg-violet-50 text-violet-700 border-violet-200"
          : "bg-blue-50 text-blue-700 border-blue-200"
      }`}
    >
      {type === "Internship" ? "Internship" : "Full Time"}
    </span>
  );
}

function CompanyDetailModal({ company, onClose }) {
  const [activeTab, setActiveTab] = useState("overview");
  if (!company) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.45)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden border border-gray-100 flex flex-col max-h-[90vh]">
        <div
          className="px-6 pt-6 pb-5 relative overflow-hidden"
          style={{
            background:
              "linear-gradient(135deg, #3B82F6 0%, #60A5FA 60%, #818CF8 100%)",
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
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center text-white font-semibold text-sm border border-white/30">
              {initials(company.company)}
            </div>
            <div>
              <p className="text-white font-semibold text-base leading-tight">
                {company.company}
              </p>
              <p className="text-white/75 text-[12px] mt-0.5">{company.role}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 mt-4">
            {[
              { icon: MapPin, label: company.location },
              { icon: IndianRupee, label: `${company.ctc} LPA` },
              { icon: GraduationCap, label: `CGPA ${company.cgpa}+` },
              { icon: Briefcase, label: company.jobType },
            ].map(({ icon: Icon, label }) => (
              <span
                key={label}
                className="text-[11px] px-2.5 py-1 rounded-lg bg-white/20 text-white border border-white/25 flex items-center gap-1.5"
              >
                <Icon size={11} /> {label}
              </span>
            ))}
          </div>
        </div>

        <div className="flex border-b border-gray-100 px-4">
          {["overview", "process", "perks"].map((t) => (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              className={`px-4 py-3 text-[12px] font-medium capitalize transition-colors border-b-2 -mb-px ${
                activeTab === t
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-400 hover:text-gray-600"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="overflow-y-auto flex-1 p-5">
          {activeTab === "overview" && (
            <div className="space-y-4">
              <p className="text-[13px] text-gray-500 leading-relaxed">
                {company.about}
              </p>

              {[
                {
                  label: "Tech Stack",
                  items: company.techStack,
                  cls: "bg-blue-50 text-blue-700 border-blue-100 font-medium",
                },
                {
                  label: "Required Skills",
                  items: company.skills,
                  cls: "bg-gray-50 text-gray-600 border-gray-200",
                },
              ].map(({ label, items, cls }) => (
                <div key={label}>
                  <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider mb-2">
                    {label}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {items.map((item) => (
                      <span
                        key={item}
                        className={`text-[11px] px-2.5 py-1 rounded-lg border ${cls}`}
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              ))}

              <div className="grid grid-cols-2 gap-3">
                {[
                  { icon: Clock, label: "Work Days", val: company.workDays },
                  { icon: Monitor, label: "Shift", val: company.shift },
                  { icon: Users, label: "Experience", val: company.experience },
                  {
                    icon: GraduationCap,
                    label: "Branches",
                    val: company.branches.join(", "),
                  },
                ].map(({ icon: Icon, label, val }) => (
                  <div
                    key={label}
                    className="bg-gray-50 rounded-xl p-3 border border-gray-100"
                  >
                    <div className="flex items-center gap-1.5 mb-1">
                      <Icon size={12} className="text-gray-400" />
                      <span className="text-[10px] text-gray-400 font-medium">
                        {label}
                      </span>
                    </div>
                    <p className="text-[12px] text-gray-700 font-medium">
                      {val}
                    </p>
                  </div>
                ))}
              </div>

              <div className="bg-red-50 border border-red-100 rounded-xl p-3 flex items-center gap-2.5">
                <Bell size={14} className="text-red-500 shrink-0" />
                <div>
                  <p className="text-[11px] font-medium text-red-700">
                    Application deadline
                  </p>
                  <p className="text-[12px] text-red-800 font-semibold">
                    {company.lastDate}
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === "process" && (
            <div className="space-y-3">
              {company.selectionProcess.map((step, i) => {
                const cfg = PROCESS_COLORS[step.type] ?? PROCESS_COLORS.Online;
                return (
                  <div key={i} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div
                        className={`w-7 h-7 rounded-full ${cfg.bg} ${cfg.text} flex items-center justify-center text-[11px] font-semibold border border-current/20 shrink-0`}
                      >
                        {i + 1}
                      </div>
                      {i < company.selectionProcess.length - 1 && (
                        <div className="w-px flex-1 bg-gray-100 my-1" />
                      )}
                    </div>
                    <div className="pb-3 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-[13px] font-medium text-gray-800">
                          {step.title}
                        </p>
                        <span
                          className={`text-[9px] px-2 py-0.5 rounded-full font-medium ${cfg.bg} ${cfg.text} border border-current/20`}
                        >
                          {step.type}
                        </span>
                      </div>
                      <p className="text-[12px] text-gray-500 leading-relaxed">
                        {step.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {activeTab === "perks" && (
            <div className="grid grid-cols-2 gap-2.5">
              {company.perks.map((perk) => {
                const Icon = PERK_ICONS[perk] ?? CheckCircle2;
                return (
                  <div
                    key={perk}
                    className="bg-gray-50 border border-gray-100 rounded-xl p-3 flex items-center gap-2.5"
                  >
                    <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center border border-gray-200 shrink-0">
                      <Icon size={15} className="text-blue-500" />
                    </div>
                    <span className="text-[12px] text-gray-700 font-medium">
                      {perk}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function DayPopupModal({
  selectedDay,
  selectedMonth,
  selectedYear,
  companies,
  onClose,
  onSelectCompany,
}) {
  if (!selectedDay) return null;

  return (
    <div
      className="fixed inset-0 bg-black/40 z-50 flex items-start justify-center pt-20"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl border border-gray-100 w-90 overflow-hidden">
        <div
          className="px-5 py-4 border-b border-gray-100 flex items-start justify-between"
          style={{ background: "linear-gradient(135deg,#3B82F6,#818CF8)" }}
        >
          <div>
            <p className="text-[14px] font-semibold text-white">
              {selectedDay} {MONTHS[selectedMonth]} {selectedYear}
            </p>
            <p className="text-[11px] text-white/70 mt-0.5">
              {companies.length} compan{companies.length === 1 ? "y" : "ies"}{" "}
              with deadline
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
          {companies.map((c) => (
            <button
              key={c.id}
              onClick={() => {
                onClose();
                onSelectCompany(c);
              }}
              className="bg-gray-50 border border-gray-100 hover:border-blue-200 hover:bg-blue-50/50 rounded-xl p-3 text-left transition-all group"
            >
              <div className="flex items-center gap-2.5 mb-2.5">
                <CompanyAvatar company={c.company} />
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-semibold text-gray-900">
                    {c.company}
                  </p>
                  <p className="text-[11px] text-gray-500">{c.role}</p>
                </div>
                <JobTypeBadge type={c.jobType} />
              </div>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { icon: MapPin, label: c.location },
                  { icon: IndianRupee, label: `${c.ctc} LPA` },
                ].map(({ icon: Icon, label }) => (
                  <span
                    key={label}
                    className="text-[10px] px-2 py-0.5 rounded-md bg-white text-gray-500 border border-gray-200 flex items-center gap-1"
                  >
                    <Icon size={9} /> {label}
                  </span>
                ))}
                <span className="text-[10px] px-2 py-0.5 rounded-md bg-white text-gray-500 border border-gray-200">
                  CGPA {c.cgpa}+
                </span>
              </div>
              <p className="text-[10px] text-blue-500 mt-2 opacity-0 group-hover:opacity-100 transition-opacity font-medium">
                Click to view details →
              </p>
            </button>
          ))}
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
  const [detailCompany, setDetailCompany] = useState(null);
  const [filter, setFilter] = useState("upcoming");

  const dateMap = useMemo(() => {
    const map = {};
    mockCompanies.forEach((c) => {
      const k = dateKey(parseDate(c.lastDate));
      if (!map[k]) map[k] = [];
      map[k].push(c);
    });
    return map;
  }, []);

  const sortedCompanies = useMemo(
    () =>
      [...mockCompanies]
        .map((c) => ({ ...c, parsedDate: parseDate(c.lastDate) }))
        .sort((a, b) => a.parsedDate - b.parsedDate),
    [],
  );

  const upcomingCount = sortedCompanies.filter(
    (c) => c.parsedDate >= todayMid,
  ).length;
  const thisMonthCount = sortedCompanies.filter(
    (c) =>
      c.parsedDate.getMonth() === curMonth &&
      c.parsedDate.getFullYear() === curYear,
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

  return (
    <div className="flex flex-col h-full">
      {/* Hero */}
      <div
        className="relative overflow-hidden px-6 pt-6 pb-0 mx-4 mt-4 rounded-2xl"
        style={{
          background:
            "linear-gradient(135deg, #3B82F6 0%, #60A5FA 60%, #818CF8 100%)",
        }}
      >
        <div className="absolute -top-10 -right-10 w-52 h-52 rounded-full bg-white/[0.07]" />
        <div className="absolute top-15 right-20 w-28 h-28 rounded-full bg-white/5" />
        <div className="absolute bottom-0 left-7.5 w-44 h-44 rounded-full bg-white/4" />

        <div className="relative z-10 flex items-start justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center border border-white/25">
                <CalendarDays size={16} className="text-white" />
              </div>
              <span className="text-[11px] text-white/70 font-medium tracking-widest uppercase">
                Placement tracker
              </span>
            </div>
            <h1 className="text-[26px] font-semibold text-white leading-tight tracking-tight">
              Placement calendar
            </h1>
            <p className="text-[12px] text-white/60 mt-1 flex items-center gap-1.5">
              <Clock size={12} /> {todayLabel}
            </p>
          </div>
          <button
            onClick={() => {
              setCurYear(today.getFullYear());
              setCurMonth(today.getMonth());
            }}
            className="flex items-center gap-1.5 bg-white border border-white/30 text-blue-600 rounded-xl px-4 py-2 text-[12px] font-medium hover:bg-blue-50 transition-colors shrink-0"
          >
            <Calendar size={13} /> Today
          </button>
        </div>

        <div className="relative z-10 grid grid-cols-3 gap-3">
          {[
            { icon: Building2, label: "Companies", val: mockCompanies.length },
            { icon: Bell, label: "Deadlines ahead", val: upcomingCount },
            { icon: CalendarDays, label: "This month", val: thisMonthCount },
          ].map(({ icon: Icon, label, val }) => (
            <div
              key={label}
              className="bg-white/15 border border-white/25 rounded-t-2xl px-4 pt-4 pb-5 flex items-center gap-3 backdrop-blur-sm"
            >
              <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center border border-white/20 shrink-0">
                <Icon size={17} className="text-white" />
              </div>
              <div>
                <div className="text-[24px] font-semibold text-white leading-none">
                  {val}
                </div>
                <div className="text-[11px] text-white/65 mt-1">{label}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Layout */}
      <div className="flex flex-1 mx-4 mb-4">
        {/* Calendar */}
        <div className="flex-1 flex flex-col overflow-auto pt-4 pr-4">
          <div className="bg-white border border-gray-200 rounded-2xl p-5 flex-1">
            <div className="flex items-center justify-between mb-5">
              <span className="text-[15px] font-semibold text-gray-900">
                {MONTHS[curMonth]} {curYear}
              </span>
              <div className="flex gap-1.5">
                <button
                  onClick={() => changeMonth(-1)}
                  aria-label="Previous month"
                  className="w-8 h-8 flex items-center justify-center border border-gray-200 rounded-xl text-gray-400 hover:bg-gray-50 hover:text-gray-700 transition-colors"
                >
                  <ChevronLeft size={15} />
                </button>
                <button
                  onClick={() => changeMonth(1)}
                  aria-label="Next month"
                  className="w-8 h-8 flex items-center justify-center border border-gray-200 rounded-xl text-gray-400 hover:bg-gray-50 hover:text-gray-700 transition-colors"
                >
                  <ChevronRight size={15} />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-7 border-b-2 border-gray-200 pb-2">
              {WDAYS.map((d) => (
                <div
                  key={d}
                  className="text-center text-[10px] font-semibold text-gray-400 tracking-wider py-1 uppercase"
                >
                  {d}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 divide-x divide-y divide-gray-100">
              {Array.from({ length: firstDay }).map((_, i) => (
                <div key={`e-${i}`} className="min-h-17" />
              ))}
              {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(
                (day) => {
                  const cos =
                    dateMap[`${curYear}-${curMonth + 1}-${day}`] || [];
                  const isToday =
                    today.getFullYear() === curYear &&
                    today.getMonth() === curMonth &&
                    today.getDate() === day;
                  return (
                    <div
                      key={day}
                      onClick={() =>
                        cos.length && setDayPopup({ day, companies: cos })
                      }
                      className={`min-h-17 p-2 transition-all ${cos.length ? "cursor-pointer hover:bg-gray-50" : "cursor-default"} ${isToday ? "bg-blue-50" : ""}`}
                    >
                      <span
                        className={`text-[12px] block mb-1.5 leading-none font-medium ${isToday ? "text-blue-600" : "text-gray-400"}`}
                      >
                        {day}
                      </span>
                      {cos.length > 0 && (
                        <div className="flex flex-col gap-0.75">
                          {cos.slice(0, 2).map((c, i) => (
                            <div
                              key={i}
                              className="text-[9px] font-semibold px-1.5 py-0.75 rounded-md bg-red-50 text-red-700 border border-red-100 truncate leading-none"
                            >
                              {c.company}
                            </div>
                          ))}
                          {cos.length > 2 && (
                            <span className="text-[9px] text-gray-400 px-0.5 font-medium">
                              +{cos.length - 2} more
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  );
                },
              )}
            </div>

            <div className="flex gap-5 mt-4 pt-4 border-t border-gray-100">
              <div className="flex items-center gap-1.5 text-[11px] text-gray-400">
                <div className="w-2.5 h-2.5 rounded bg-red-50 border border-red-200" />{" "}
                Application deadline
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-gray-400">
                <div className="w-2.5 h-2.5 rounded-sm bg-blue-50 border border-blue-300" />{" "}
                Today
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="w-67 border border-gray-200 bg-white rounded-2xl flex flex-col shrink-0 mt-4 overflow-hidden">
          <div className="px-4 py-3.5 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <p className="text-[13px] font-semibold text-gray-900">
                Deadlines
              </p>
              <div className="flex items-center bg-gray-100 rounded-lg p-0.5">
                {["upcoming", "closed", "all"].map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`px-2.5 py-1 rounded-md text-[10px] font-medium capitalize transition-colors ${filter === f ? "bg-white text-blue-600 shadow-sm" : "text-gray-400 hover:text-gray-600"}`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>
            <p className="text-[11px] text-gray-400 mt-1">
              {upcomingCount} deadline{upcomingCount !== 1 ? "s" : ""} remaining
            </p>
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
            {sortedCompanies
              .filter((c) =>
                filter === "all"
                  ? true
                  : filter === "closed"
                    ? c.parsedDate < todayMid
                    : c.parsedDate >= todayMid,
              )
              .map((c) => {
                const diff = daysUntil(c.parsedDate, todayMid);
                const dateStr = `${c.parsedDate.getDate()} ${SHORT[c.parsedDate.getMonth()]}`;
                return (
                  <div
                    key={c.id}
                    onClick={() => {
                      setCurYear(c.parsedDate.getFullYear());
                      setCurMonth(c.parsedDate.getMonth());
                      setDetailCompany(c);
                    }}
                    className="px-4 py-3 flex items-start gap-3 hover:bg-gray-50 transition-colors cursor-pointer group"
                  >
                    <CompanyAvatar company={c.company} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] font-semibold text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                        {c.company}
                      </p>
                      <p className="text-[11px] text-gray-500 truncate mt-0.5">
                        {c.role}
                      </p>
                      <p className="text-[10px] text-gray-400 mt-1 flex items-center gap-1">
                        <Calendar size={9} /> {dateStr} · ₹{c.ctc} LPA
                      </p>
                    </div>
                    <DaysBadge diff={diff} />
                  </div>
                );
              })}
          </div>
        </div>
      </div>

      {dayPopup && (
        <DayPopupModal
          selectedDay={dayPopup.day}
          selectedMonth={curMonth}
          selectedYear={curYear}
          companies={dayPopup.companies}
          onClose={() => setDayPopup(null)}
          onSelectCompany={(c) => {
            setDayPopup(null);
            setDetailCompany(c);
          }}
        />
      )}

      {detailCompany && (
        <CompanyDetailModal
          company={detailCompany}
          onClose={() => setDetailCompany(null)}
        />
      )}
    </div>
  );
}
