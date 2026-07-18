import { useState } from "react";
import { Link } from "react-router-dom";

// ── TODO: replace with your real support contact details ──
const SUPPORT_EMAIL = "placerise.notifications@gmail.com";
const SUPPORT_PHONE = "+91 78915 79686";

// Icons - inline SVG (same style as RoleSelectionPage)
const SparklesIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
  </svg>
);
const ChevronIcon = ({ open }) => (
  <svg
    className={`w-5 h-5 shrink-0 transition-transform duration-300 ${open ? "rotate-180" : ""}`}
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    viewBox="0 0 24 24"
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
  </svg>
);
const MailIcon = () => (
  <svg
    className="w-5 h-5"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M3 8l9 6 9-6M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
    />
  </svg>
);
const PhoneIcon = () => (
  <svg
    className="w-5 h-5"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
    />
  </svg>
);
const BugIcon = () => (
  <svg
    className="w-5 h-5"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 20v-9m0 0a4 4 0 004-4V6a1 1 0 00-1-1h-6a1 1 0 00-1 1v1a4 4 0 004 4zm-7 4H3m4-4L4.5 8m2.5 3l-3 3m14-3h4m-4 0l2.5-3M17 11l3 3M8 20l-1.5-3M16 20l1.5-3"
    />
  </svg>
);

const FAQS = [
  {
    q: "I forgot my ERP ID or password — what do I do?",
    a: "Passwords can be reset from the login screen. If you've forgotten your ERP ID itself, reach out to your placement coordinator — they can look it up from the student database.",
  },
  {
    q: "Why can't I see a company I heard about from a classmate?",
    a: "Job postings are matched to your school and course automatically. If a listing doesn't show up for you, it's likely restricted to a different course — your coordinator can confirm the eligibility criteria.",
  },
  {
    q: "I applied to a company by mistake. Can it be removed?",
    a: "Yes — contact your placement coordinator with the company name and they can remove the application from their end.",
  },
  {
    q: "How do I know if I've been shortlisted or selected?",
    a: 'Check the "My Applications" page on your dashboard — status updates (Shortlisted, Selected, Rejected) reflect there as soon as your coordinator updates them.',
  },
  {
    q: "An announcement doesn't seem relevant to my course — why am I seeing it?",
    a: "Some announcements are sent to entire schools rather than individual courses. If you think it's a genuine mismatch, flag it to your coordinator.",
  },
  {
    q: "The site feels slow or a page won't load — what should I try first?",
    a: "Refresh the page and check your internet connection first. If the issue continues, use the bug report form below with as much detail as you can — screenshots help a lot.",
  },
];

function FaqItem({ item, isOpen, onToggle }) {
  return (
    <div className="border border-[#CBD5E1] rounded-2xl overflow-hidden bg-white">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left cursor-pointer"
        aria-expanded={isOpen}
      >
        <span className="font-semibold text-[#1E293B] text-sm sm:text-base">
          {item.q}
        </span>
        <span className="text-primary">
          <ChevronIcon open={isOpen} />
        </span>
      </button>
      <div
        style={{
          maxHeight: isOpen ? "220px" : "0px",
          transition: "max-height 0.35s ease",
        }}
        className="overflow-hidden"
      >
        <p className="px-6 pb-5 text-sm text-text-muted leading-relaxed">
          {item.a}
        </p>
      </div>
    </div>
  );
}

export default function SupportPage() {
  const [openFaq, setOpenFaq] = useState(null);

  const [issueType, setIssueType] = useState("General Question");
  const [name, setName] = useState("");
  const [erpId, setErpId] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [formError, setFormError] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!message.trim()) {
      setFormError("Please describe your issue before sending.");
      return;
    }
    setFormError("");

    const subject = encodeURIComponent(
      `[PlaceRise Support] ${issueType}${name ? ` — ${name}` : ""}`,
    );
    const body = encodeURIComponent(
      `Name: ${name || "—"}\nERP ID: ${erpId || "—"}\nEmail: ${email || "—"}\nType: ${issueType}\n\nMessage:\n${message}`,
    );
    window.location.href = `mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}`;
  };

  return (
    <div
      className="min-h-screen bg-background relative overflow-hidden"
      style={{ fontFamily: "Inter, sans-serif" }}
    >
      {/* Diagonal navy header panel — same treatment as RoleSelectionPage */}
      <div
        className="absolute top-0 left-0 right-0 pointer-events-none"
        style={{
          height: "420px",
          background:
            "linear-gradient(135deg, #0F172A 0%, #1E293B 50%, #1e3a5f 100%)",
          clipPath: "polygon(0 0, 100% 0, 100% 65%, 0 100%)",
        }}
      />
      <div
        className="absolute top-0 left-0 right-0 pointer-events-none opacity-60"
        style={{
          height: "420px",
          background: `
            radial-gradient(at 20% 30%, rgba(59,130,246,0.15), transparent 50%),
            radial-gradient(at 80% 70%, rgba(96,165,250,0.1), transparent 50%)
          `,
        }}
      />

      {/* Navbar */}
      <header className="relative z-10 px-6 py-6 md:px-12 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-primary flex items-center justify-center shadow-[0_20px_60px_-15px_rgba(59,130,246,0.4)]">
            <SparklesIcon />
          </div>
          <span
            className="text-xl font-bold"
            style={{ fontFamily: "Space Grotesk, sans-serif" }}
          >
            <span className="text-white">Place</span>
            <span className="text-accent">Rise</span>
          </span>
        </Link>
        <Link
          to="/"
          className="text-white/70 hover:text-white text-sm transition-colors"
        >
          ← Back to home
        </Link>
      </header>

      {/* Hero */}
      <section className="relative z-10 text-center px-6 pt-8 pb-16 max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur border border-white/20 mb-6">
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          <span className="text-white/80 text-sm">We're here to help</span>
        </div>
        <h1
          className="text-4xl md:text-5xl font-bold text-white mb-4 leading-tight"
          style={{
            fontFamily: "Space Grotesk, sans-serif",
            letterSpacing: "-0.02em",
          }}
        >
          Support Center
        </h1>
        <p className="text-white/70 text-base max-w-xl mx-auto">
          Answers to common questions, a direct line to the team, and a place to
          report anything that isn't working right.
        </p>
      </section>

      {/* Contact info cards */}
      <section className="relative z-10 max-w-4xl mx-auto px-6 -mt-2 mb-16">
        <div className="grid sm:grid-cols-2 gap-5">
          <a
            href={`mailto:${SUPPORT_EMAIL}`}
            className="bg-white rounded-3xl border border-[#CBD5E1] p-6 flex items-center gap-4 shadow-[0_10px_40px_-10px_rgba(15,23,42,0.15)] hover:-translate-y-1 transition-transform duration-300"
          >
            <div className="w-12 h-12 rounded-2xl bg-[#1E293B] text-white flex items-center justify-center shrink-0">
              <MailIcon />
            </div>
            <div>
              <p className="text-xs font-semibold tracking-widest uppercase text-primary mb-1">
                Email
              </p>
              <p className="text-[#1E293B] font-semibold text-sm">
                {SUPPORT_EMAIL}
              </p>
              <p className="text-text-muted text-xs mt-0.5">
                Usually replies within a day
              </p>
            </div>
          </a>

          <div className="bg-white rounded-3xl border border-[#CBD5E1] p-6 flex items-center gap-4 shadow-[0_10px_40px_-10px_rgba(15,23,42,0.15)]">
            <div className="w-12 h-12 rounded-2xl bg-[#1E293B] text-white flex items-center justify-center shrink-0">
              <PhoneIcon />
            </div>
            <div>
              <p className="text-xs font-semibold tracking-widest uppercase text-primary mb-1">
                Support Center
              </p>
              <p className="text-[#1E293B] font-semibold text-sm">
                {SUPPORT_PHONE}
              </p>
              <p className="text-text-muted text-xs mt-0.5">
                Mon – Sat, 10am – 8pm
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="relative z-10 max-w-3xl mx-auto px-6 mb-16">
        <div className="mb-8">
          <p className="text-xs font-semibold tracking-widest uppercase text-primary mb-2">
            Frequently Asked
          </p>
          <h2
            className="text-2xl md:text-3xl font-bold text-[#1E293B]"
            style={{ fontFamily: "Space Grotesk, sans-serif" }}
          >
            Common questions
          </h2>
        </div>
        <div className="flex flex-col gap-3">
          {FAQS.map((item, idx) => (
            <FaqItem
              key={item.q}
              item={item}
              isOpen={openFaq === idx}
              onToggle={() => setOpenFaq(openFaq === idx ? null : idx)}
            />
          ))}
        </div>
      </section>

      {/* Contact / Bug report form */}
      <section className="relative z-10 max-w-3xl mx-auto px-6 mb-20">
        <div className="bg-white rounded-3xl border border-[#CBD5E1] p-8 shadow-[0_10px_40px_-10px_rgba(15,23,42,0.15)]">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-2xl bg-primary text-white flex items-center justify-center shrink-0">
              <BugIcon />
            </div>
            <h2
              className="text-2xl font-bold text-[#1E293B]"
              style={{ fontFamily: "Space Grotesk, sans-serif" }}
            >
              Still stuck? Message us
            </h2>
          </div>
          <p className="text-text-muted text-sm mb-6 ml-13">
            This opens your email app with the details pre-filled — nothing gets
            typed twice.
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="text-sm font-medium text-[#1E293B] block mb-1">
                What's this about?
              </label>
              <select
                value={issueType}
                onChange={(e) => setIssueType(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-[#CBD5E1] text-[#1E293B] focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition bg-white"
              >
                <option>General Question</option>
                <option>Bug Report</option>
                <option>Account / Login Issue</option>
                <option>Application or Company Issue</option>
                <option>Feature Request</option>
              </select>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-[#1E293B] block mb-1">
                  Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  className="w-full px-4 py-3 rounded-xl border border-[#CBD5E1] text-[#1E293B] placeholder-text-muted focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-[#1E293B] block mb-1">
                  ERP ID{" "}
                  <span className="text-text-muted font-normal">
                    (optional)
                  </span>
                </label>
                <input
                  type="text"
                  value={erpId}
                  onChange={(e) => setErpId(e.target.value)}
                  placeholder="e.g. 20BSCN0020"
                  className="w-full px-4 py-3 rounded-xl border border-[#CBD5E1] text-[#1E293B] placeholder-text-muted focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-[#1E293B] block mb-1">
                Your email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-4 py-3 rounded-xl border border-[#CBD5E1] text-[#1E293B] placeholder-text-muted focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-[#1E293B] block mb-1">
                Message
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Tell us what's going on — the more detail, the faster we can help."
                rows={5}
                className="w-full px-4 py-3 rounded-xl border border-[#CBD5E1] text-[#1E293B] placeholder-text-muted focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition resize-none"
              />
            </div>

            {formError && <p className="text-xs text-danger">{formError}</p>}

            <button
              type="submit"
              className="w-full mt-2 py-3 rounded-xl bg-primary hover:bg-blue-600 text-white font-semibold transition-colors cursor-pointer"
              style={{ fontFamily: "Space Grotesk, sans-serif" }}
            >
              Send message →
            </button>
          </form>
        </div>
      </section>

      {/* Footer — same as RoleSelectionPage */}
      <footer className="relative z-10 max-w-4xl mx-auto px-6 py-8 mb-4">
        <div className="bg-white/70 backdrop-blur rounded-3xl border border-[#CBD5E1] px-8 py-5 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center">
              <SparklesIcon />
            </div>
            <div>
              <span
                className="font-bold text-[#1E293B]"
                style={{ fontFamily: "Space Grotesk, sans-serif" }}
              >
                Place<span className="text-primary">Rise</span>
              </span>
              <p className="text-xs text-text-muted">
                Your placement journey, simplified.
              </p>
            </div>
          </div>
          <span className="text-xs text-text-muted">© 2026 PlaceRise</span>
        </div>
      </footer>
    </div>
  );
}
