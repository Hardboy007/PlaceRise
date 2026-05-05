import { useState } from "react";


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
  cardBg:     "#FFFFFF",
  subtleBg:   "#F8FAFC",
};

const companies = [
  { id: 1, name: "Google",    role: "Software Engineer Intern", location: "Bengaluru",       date: "May 18, 2026", package: "₹24 LPA", color: C.primary, initial: "G" },
  { id: 2, name: "Microsoft", role: "SDE I",                   location: "Hyderabad",        date: "May 22, 2026", package: "₹22 LPA", color: C.textMain, initial: "M" },
  { id: 3, name: "Amazon",    role: "Cloud Support Associate",  location: "Remote",           date: "May 25, 2026", package: "₹18 LPA", color: C.warning,  initial: "A" },
  { id: 4, name: "Razorpay",  role: "Frontend Engineer",        location: "Bengaluru",        date: "May 28, 2026", package: "₹20 LPA", color: "#6366F1",  initial: "R" },
  { id: 5, name: "Atlassian", role: "Product Engineer",         location: "Sydney (Remote)",  date: "Jun 02, 2026", package: "₹26 LPA", color: C.accent,   initial: "A" },
  { id: 6, name: "Zomato",    role: "Data Analyst",             location: "Gurugram",         date: "Jun 05, 2026", package: "₹14 LPA", color: C.danger,   initial: "Z" },
];

const announcements = [
  { id: 1, icon: "📢", title: "Pre-placement talk: Google",       time: "Today · 4:00 PM", desc: "Auditorium A. Attendance mandatory for shortlisted students." },
  { id: 2, icon: "🕐", title: "Resume deadline extended",         time: "Yesterday",       desc: "Final submission window now closes on May 10." },
  { id: 3, icon: "🎓", title: "Mock interview drive",             time: "2 days ago",      desc: "Sign up for 1:1 mock sessions with industry mentors." },
  { id: 4, icon: "🔔", title: "New: Atlassian opens applications",time: "3 days ago",      desc: "Eligible CSE & ECE branches with CGPA ≥ 7.5." },
];

const stats = [
  { label: "Selected",      value: "2/3", emoji: "✅", bg: "#DCFCE7", },
  { label: "Applied",       value: "8",   emoji: "💼", bg: "#DBEAFE", },
  { label: "Interviews",    value: "4",   emoji: "📈", bg: "#FEF3C7", },
  { label: "Profile Score", value: "92%", emoji: "⭐", bg: "#EDE9FE", },
];

const navItems = [
  { id: "dashboard",    emoji: "🏠" },
  { id: "companies",    emoji: "🏢" },
  { id: "applications", emoji: "📄" },
  { id: "profile",      emoji: "👤" },
];

function CompanyCard({ company }) {
  return (
    <div
      style={{ backgroundColor: C.cardBg, borderColor: C.border }}
      className="rounded-2xl p-5 shadow-sm border hover:shadow-md transition-shadow duration-200"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div
            style={{ backgroundColor: company.color }}
            className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg flex-shrink-0"
          >
            {company.initial}
          </div>
          <div>
            <h3 style={{ color: C.textMain }} className="font-semibold text-base leading-tight">{company.name}</h3>
            <p style={{ color: C.textMuted }} className="text-sm">{company.role}</p>
          </div>
        </div>
        <span
          style={{ color: C.success, borderColor: "#BBF7D0", backgroundColor: "#F0FDF4" }}
          className="text-xs font-medium border px-2.5 py-1 rounded-full"
        >
          Eligible
        </span>
      </div>

      {/* Meta */}
      <div style={{ color: C.textMuted }} className="flex items-center gap-4 text-sm mb-4">
        <span>📍 {company.location}</span>
        <span>📅 {company.date}</span>
      </div>

      {/* Footer */}
      <div style={{ borderColor: C.background }} className="flex items-center justify-between pt-3 border-t">
        <div>
          <p style={{ color: C.textMuted }} className="text-xs mb-0.5">Package</p>
          <p style={{ color: C.textMain }} className="font-bold text-base">{company.package}</p>
        </div>
        <button
          style={{ backgroundColor: C.primary }}
          className="hover:opacity-90 text-white px-5 py-2.5 rounded-full text-sm font-medium transition-opacity duration-150"
        >
          View Details →
        </button>
      </div>
    </div>
  );
}

export default function PlacementDashboard() {
  const [activeTab, setActiveTab] = useState("dashboard");

  return (
    <div style={{ backgroundColor: C.background }} className="min-h-screen font-sans">
      <div className="flex">

       
       

        {/* Main */}
        <main className="ml-16 flex-1 p-8 max-w-7xl">

          {/* Hero Banner */}
          <div
            style={{ background: `linear-gradient(135deg, ${C.textMain} 0%, ${C.primary} 55%, ${C.accent} 100%)` }}
            className="rounded-3xl p-8 mb-6 relative overflow-hidden"
          >
            <div className="relative z-10">
              <span className="inline-flex items-center gap-1.5 bg-white/20 text-white text-xs font-medium px-3 py-1.5 rounded-full mb-4">
                ⭐ Placement Season 2026
              </span>
              <h1 className="text-4xl font-bold text-white mb-2">Hey Aarav,</h1>
              <p className="text-white/90 text-lg mb-6">
                <span className="font-semibold">12 companies</span> are open for you right now
              </p>
              <div className="flex gap-3">
                <button
                  style={{ backgroundColor: C.white, color: C.primary }}
                  className="font-semibold px-6 py-2.5 rounded-full text-sm hover:opacity-90 transition-opacity"
                >
                  Browse Companies →
                </button>
                <button className="bg-white/20 border border-white/40 text-white font-semibold px-6 py-2.5 rounded-full text-sm hover:bg-white/30 transition-colors">
                  My Applications
                </button>
              </div>
            </div>

            {/* Deco cap */}
            <div className="absolute right-8 top-1/2 -translate-y-1/2">
              <div className="w-28 h-28 bg-white/10 rounded-2xl flex items-center justify-center text-6xl">
                🎓
              </div>
            </div>

            <div className="absolute top-0 right-48 w-40 h-40 bg-white/5 rounded-full -translate-y-1/2" />
            <div className="absolute bottom-0 left-64 w-24 h-24 bg-white/5 rounded-full translate-y-1/2" />
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-4 gap-4 mb-8">
            {stats.map((stat) => (
              <div
                key={stat.label}
                style={{ backgroundColor: C.cardBg, borderColor: C.border }}
                className="rounded-2xl px-5 py-4 shadow-sm border flex items-center gap-4"
              >
                <div
                  style={{ backgroundColor: stat.bg }}
                  className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 text-2xl"
                >
                  {stat.emoji}
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

            {/* Companies */}
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
                  <CompanyCard key={company.id} company={company} />
                ))}
              </div>
            </div>

            {/* Announcements */}
            <div>
              <div className="mb-4">
                <h2 style={{ color: C.textMain }} className="text-xl font-bold">Announcements</h2>
                <p style={{ color: C.textMuted }} className="text-sm">Latest from your placement cell</p>
              </div>

              <div
                style={{ backgroundColor: C.cardBg, borderColor: C.border }}
                className="rounded-2xl shadow-sm border p-5 mb-4"
              >
                <div className="space-y-5">
                  {announcements.map((a, idx) => (
                    <div
                      key={a.id}
                      style={idx !== announcements.length - 1 ? { borderColor: C.border } : {}}
                      className={`flex gap-3 ${idx !== announcements.length - 1 ? "pb-5 border-b" : ""}`}
                    >
                      <div
                        style={{ backgroundColor: C.background }}
                        className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-base"
                      >
                        {a.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <p style={{ color: C.textMain }} className="font-semibold text-sm leading-tight">{a.title}</p>
                          <span style={{ color: C.textMuted }} className="text-xs flex-shrink-0">{a.time}</span>
                        </div>
                        <p style={{ color: C.textMuted }} className="text-xs leading-relaxed">{a.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Need Help */}
              <div
                style={{ backgroundColor: "#DBEAFE", borderColor: "#BFDBFE" }}
                className="border rounded-2xl p-5"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">📋</span>
                  <p style={{ color: C.textMain }} className="font-semibold">Need help?</p>
                </div>
                <p style={{ color: C.primary }} className="text-sm leading-relaxed mb-4">
                  Reach out to your placement coordinator for guidance on applications and interviews.
                </p>
                <button
                  style={{ borderColor: C.border, backgroundColor: C.white, color: C.textMain }}
                  className="border text-sm font-medium px-4 py-2 rounded-lg hover:opacity-80 transition-opacity"
                >
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