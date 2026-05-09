import { useState } from "react";
import { useNavigate } from "react-router-dom";
// ─── Design Tokens ───────────────────────────────────────────
const C = {
  primary:    "#3B82F6",
  accent:     "#60A5FA",
  background: "#F1F5F9",
  textMain:   "#0F172A",
  textMuted:  "#64748B",
  success:    "#22C55E",
  warning:    "#F59E0B",
  danger:     "#EF4444",
  white:      "#FFFFFF",
  border:     "#E2E8F0",
};

// ─── Data ────────────────────────────────────────────────────
const companies = [
  { id: 1, name: "Google",    role: "Software Engineer Intern", location: "Bengaluru",      date: "May 18, 2026", package: "₹24 LPA", color: "#3B82F6", initial: "G" },
  { id: 2, name: "Microsoft", role: "SDE I",                   location: "Hyderabad",       date: "May 22, 2026", package: "₹22 LPA", color: "#0EA5E9", initial: "M" },
  { id: 3, name: "Amazon",    role: "Cloud Support Associate",  location: "Remote",          date: "May 25, 2026", package: "₹18 LPA", color: "#F59E0B", initial: "A" },
  { id: 4, name: "Razorpay",  role: "Frontend Engineer",        location: "Bengaluru",       date: "May 28, 2026", package: "₹20 LPA", color: "#6366F1", initial: "R" },
  { id: 5, name: "Atlassian", role: "Product Engineer",         location: "Sydney (Remote)", date: "Jun 02, 2026", package: "₹26 LPA", color: "#60A5FA", initial: "A" },
  { id: 6, name: "Zomato",    role: "Data Analyst",             location: "Gurugram",        date: "Jun 05, 2026", package: "₹14 LPA", color: "#EF4444", initial: "Z" },
];

const announcements = [
  { id: 1, title: "Pre-placement talk: Google",        time: "Today · 4:00 PM", desc: "Auditorium A. Attendance mandatory for shortlisted students." },
  { id: 2, title: "Resume deadline extended",          time: "Yesterday",       desc: "Final submission window now closes on May 10." },
  { id: 3, title: "Mock interview drive",              time: "2 days ago",      desc: "Sign up for 1:1 mock sessions with industry mentors." },
  { id: 4, title: "New: Atlassian opens applications", time: "3 days ago",      desc: "Eligible CSE & ECE branches with CGPA ≥ 7.5." },
];

// Announcement icons as SVGs
const announcementIcons = [
  // megaphone
  <svg key="1" viewBox="0 0 24 24" fill="none" stroke={C.primary} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
    <path d="M3 11l19-9-9 19-2-8-8-2z"/>
  </svg>,
  // clock
  <svg key="2" viewBox="0 0 24 24" fill="none" stroke={C.warning} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
  </svg>,
  // graduation cap
  <svg key="3" viewBox="0 0 24 24" fill="none" stroke={C.accent} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
    <path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/>
  </svg>,
  // bell
  <svg key="4" viewBox="0 0 24 24" fill="none" stroke={C.success} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
    <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/>
  </svg>,
];

const stats = [
  {
    label: "Selected",
    value: "2/3",
    bg: "#DCFCE7",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke={C.success} strokeWidth={2.5} viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="10"/>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4"/>
      </svg>
    ),
  },
  {
    label: "Applied",
    value: "8",
    bg: "#DBEAFE",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke={C.primary} strokeWidth={2} viewBox="0 0 24 24">
        <rect x="2" y="7" width="20" height="14" rx="2"/>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"/>
      </svg>
    ),
  },
  {
    label: "Interviews",
    value: "4",
    bg: "#FEF3C7",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke={C.warning} strokeWidth={2} viewBox="0 0 24 24">
        <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/>
        <polyline points="16 7 22 7 22 13"/>
      </svg>
    ),
  },
  {
    label: "Profile Score",
    value: "92%",
    bg: "#EDE9FE",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="#8B5CF6" strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.196-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"/>
      </svg>
    ),
  },
];

const navIcons = [
  { id: "dashboard", path: <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/> },
  { id: "companies", path: <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/> },
  { id: "applications", path: <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/> },
  { id: "profile", path: <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/> },
];

// ─── Sub-components ──────────────────────────────────────────
function LocationIcon() {
  return (
    <svg className="w-3.5 h-3.5 inline mr-1" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg className="w-3.5 h-3.5 inline mr-1" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
      <line x1="16" y1="2" x2="16" y2="6"/>
      <line x1="8" y1="2" x2="8" y2="6"/>
      <line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
  );
}

function CompanyCard({ company }) {
  const navigate = useNavigate()
  return (
    <div style={{ backgroundColor: C.white, borderColor: C.border }}
      className="rounded-2xl p-5 shadow-sm border hover:shadow-md transition-shadow duration-200">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div style={{ backgroundColor: company.color }}
            className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg shrink-0">
            {company.initial}
          </div>
          <div>
            <h3 style={{ color: C.textMain }} className="font-semibold text-base leading-tight">{company.name}</h3>
            <p style={{ color: C.textMuted }} className="text-sm">{company.role}</p>
          </div>
        </div>
        <span style={{ color: C.success, borderColor: "#BBF7D0", backgroundColor: "#F0FDF4" }}
          className="text-xs font-medium border px-2.5 py-1 rounded-full">
          Eligible
        </span>
      </div>

      {/* Meta */}
      <div style={{ color: C.textMuted }} className="flex items-center gap-4 text-sm mb-4">
        <span><LocationIcon />{company.location}</span>
        <span><CalendarIcon />{company.date}</span>
      </div>

      {/* Footer */}
      <div style={{ borderColor: C.background }} className="flex items-center justify-between pt-3 border-t">
        <div>
          <p style={{ color: C.textMuted }} className="text-xs mb-0.5">Package</p>
          <p style={{ color: C.textMain }} className="font-bold text-base">{company.package}</p>
        </div>
        <button onClick={() => navigate(`/student/companies/${company.id}`)} style={{ backgroundColor: C.primary }}
          className="hover:opacity-90 text-white cursor-pointer px-5 py-2.5 rounded-full text-sm font-medium flex items-center gap-1.5 transition-opacity duration-150">
          View Details
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/>
          </svg>
        </button>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────
export default function PlacementDashboard() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState("dashboard");

  return (
    <div style={{ backgroundColor: C.background }} className="min-h-screen font-sans">
      <div className="flex">

        {/* ── Sidebar ── */}
        <aside style={{ backgroundColor: C.white, borderColor: C.border }}
          className="w-16 border-r min-h-screen flex flex-col items-center py-6 gap-6 fixed left-0 top-0 z-10">

          {/* Logo */}
          <div style={{ backgroundColor: C.primary }}
            className="w-9 h-9 rounded-xl flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 3L1 9l4 2.18v6L12 21l7-3.82v-6l2-1.09V17h2V9L12 3zm6.82 6L12 12.72 5.18 9 12 5.28 18.82 9zM17 15.99l-5 2.73-5-2.73v-3.72L12 15l5-2.73v3.72z"/>
            </svg>
          </div>

          {/* Nav Items */}
          {navIcons.map((item) => (
            <button key={item.id} onClick={() => setActiveTab(item.id)}
              style={activeTab === item.id
                ? { backgroundColor: "#DBEAFE", color: C.primary }
                : { color: C.textMuted }}
              className="w-10 h-10 rounded-xl flex items-center justify-center transition-colors hover:opacity-80">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                {item.path}
              </svg>
            </button>
          ))}
        </aside>

        {/* ── Main Content ── */}
        <main className="ml-16 flex-1 p-8 max-w-7xl">

          {/* Hero Banner */}
          <div style={{ background: `linear-gradient(135deg, ${C.primary} 0%, ${C.accent} 60%, #818CF8 100%)` }}
            className="rounded-3xl p-8 mb-6 relative overflow-hidden">
            <div className="relative z-10">
              <span className="inline-flex items-center gap-1.5 bg-white/20 text-white text-xs font-medium px-3 py-1.5 rounded-full mb-4">
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.196-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"/>
                </svg>
                Placement Season 2026
              </span>
              <h1 className="text-4xl font-bold text-white mb-2">Hey Aarav,</h1>
              <p className="text-white/90 text-lg mb-6">
                <span className="font-semibold">12 companies</span> are open for you right now
              </p>
              <div className="flex gap-3">
                <button onClick={() => navigate('/student/companies')} style={{ backgroundColor: C.white, color: C.primary }}
                  className="font-semibold cursor-pointer px-6 py-2.5 rounded-full text-sm flex items-center gap-2 hover:opacity-90 transition-opacity">
                  Browse Companies
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/>
                  </svg>
                </button>
                <button onClick={() => navigate('/student/applications')} className="bg-white/20 cursor-pointer border border-white/40 text-white font-semibold px-6 py-2.5 rounded-full text-sm hover:bg-white/30 transition-colors">
                  My Applications
                </button>
              </div>
            </div>

            {/* Decorative cap */}
            <div className="absolute right-8 top-1/2 -translate-y-1/2">
              <div className="w-28 h-28 bg-white/10 rounded-2xl flex items-center justify-center">
                <svg className="w-14 h-14 text-white/70" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5"/>
                </svg>
              </div>
            </div>

            <div className="absolute top-0 right-48 w-40 h-40 bg-white/5 rounded-full -translate-y-1/2"/>
            <div className="absolute bottom-0 left-64 w-24 h-24 bg-white/5 rounded-full translate-y-1/2"/>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-4 gap-4 mb-8">
            {stats.map((stat) => (
              <div key={stat.label}
                style={{ backgroundColor: C.white, borderColor: C.border }}
                className="rounded-2xl px-5 py-4 shadow-sm border flex items-center gap-4">
                <div style={{ backgroundColor: stat.bg }}
                  className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0">
                  {stat.icon}
                </div>
                <div>
                  <p style={{ color: C.textMuted }} className="text-xs font-medium">{stat.label}</p>
                  <p style={{ color: C.textMain }} className="text-2xl font-bold">{stat.value}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Bottom Grid */}
          <div className="grid grid-cols-3 gap-6">

            {/* Eligible Companies — 2/3 */}
            <div className="col-span-2">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 style={{ color: C.textMain }} className="text-xl font-bold">Eligible Companies</h2>
                  <p style={{ color: C.textMuted }} className="text-sm">Curated openings matching your profile</p>
                </div>
                <button style={{ color: C.primary }} className="text-sm font-medium hover:opacity-80">
                  View all
                </button>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {companies.map((company) => (
                  <CompanyCard key={company.id} company={company}/>
                ))}
              </div>
            </div>

            {/* Announcements — 1/3 */}
            <div>
              <div className="mb-4">
                <h2 style={{ color: C.textMain }} className="text-xl font-bold">Announcements</h2>
                <p style={{ color: C.textMuted }} className="text-sm">Latest from your placement cell</p>
              </div>

              <div style={{ backgroundColor: C.white, borderColor: C.border }}
                className="rounded-2xl shadow-sm border p-5 mb-4">
                <div className="space-y-5">
                  {announcements.map((a, idx) => (
                    <div key={a.id}
                      style={idx !== announcements.length - 1 ? { borderColor: C.border } : {}}
                      className={`flex gap-3 ${idx !== announcements.length - 1 ? "pb-5 border-b" : ""}`}>
                      <div style={{ backgroundColor: C.background }}
                        className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0">
                        {announcementIcons[idx]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <p style={{ color: C.textMain }} className="font-semibold text-sm leading-tight">{a.title}</p>
                          <span style={{ color: C.textMuted }} className="text-xs shrink-0">{a.time}</span>
                        </div>
                        <p style={{ color: C.textMuted }} className="text-xs leading-relaxed">{a.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Need Help */}
              <div style={{ backgroundColor: "#EFF6FF", borderColor: "#BFDBFE" }}
                className="border rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-2">
                  <svg className="w-5 h-5" fill="none" stroke={C.primary} strokeWidth={1.8} viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/>
                    <rect x="9" y="3" width="6" height="4" rx="1"/>
                    <line x1="9" y1="12" x2="15" y2="12"/>
                    <line x1="9" y1="16" x2="13" y2="16"/>
                  </svg>
                  <p style={{ color: C.textMain }} className="font-semibold">Need help?</p>
                </div>
                <p style={{ color: C.primary }} className="text-sm leading-relaxed mb-4">
                  Reach out to your placement coordinator for guidance on applications and interviews.
                </p>
                <button style={{ borderColor: C.border, backgroundColor: C.white, color: C.textMain }}
                  className="border text-sm font-medium px-4 py-2 rounded-lg hover:opacity-80 transition-opacity">
                  Contact Cell
                </button>
              </div>
            </div>

          </div>
        </main>
      </div>
    </div>
  );
}
