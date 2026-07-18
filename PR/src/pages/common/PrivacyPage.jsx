import { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "react-router-dom";

// TODO: replace with your real contact/entity details
const SUPPORT_EMAIL = "placerise.notifications@gmail.com";
const LAST_UPDATED = "18 July 2026";

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

const SECTIONS = [
  { id: "collect", title: "Information we collect" },
  { id: "use", title: "How we use it" },
  { id: "sharing", title: "Information sharing" },
  { id: "storage", title: "Data storage and security" },
  { id: "cookies", title: "Cookies and local storage" },
  { id: "rights", title: "Your rights and choices" },
  { id: "retention", title: "Data retention" },
  { id: "changes", title: "Changes to this policy" },
  { id: "contact", title: "Contact us" },
];

function Section({ id, title, children }) {
  return (
    <section id={id} className="scroll-mt-28 mb-12">
      <h2
        className="text-xl md:text-2xl font-bold text-[#1E293B] mb-4"
        style={{ fontFamily: "Space Grotesk, sans-serif" }}
      >
        {title}
      </h2>
      <div className="text-text-muted text-sm leading-relaxed flex flex-col gap-3">
        {children}
      </div>
    </section>
  );
}

function PrivacyPolicyPage() {
  const [activeSection, setActiveSection] = useState(SECTIONS[0].id);
  const sectionRefs = useRef(new Map());

  const setSectionRef = useCallback(
    (id) => (node) => {
      if (node) sectionRefs.current.set(id, node);
      else sectionRefs.current.delete(id);
    },
    [],
  );

  useEffect(() => {
  const handleScroll = () => {
    const referenceLine = window.scrollY + window.innerHeight * 0.25;
    let current = SECTIONS[0].id;

    for (const s of SECTIONS) {
      const node = sectionRefs.current.get(s.id);
      if (!node) continue;
      if (node.getBoundingClientRect().top + window.scrollY <= referenceLine) {
        current = s.id;
      }
    }
    setActiveSection(current);
  };

  handleScroll(); // set correct state on mount too
  window.addEventListener("scroll", handleScroll, { passive: true });
  return () => window.removeEventListener("scroll", handleScroll);
}, []);

  const scrollToSection = (id) => {
    sectionRefs.current.get(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div
      className="min-h-screen bg-background"
      style={{ fontFamily: "Inter, sans-serif" }}
    >
      {/* Navbar */}
      <header
        style={{ borderColor: "#E2E8F0" }}
        className="border-b bg-white/70 backdrop-blur sticky top-0 z-30 px-6 py-4 md:px-12 flex items-center justify-between"
      >
        <Link to="/" className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
            <SparklesIcon />
          </div>
          <span
            className="text-lg font-bold text-[#1E293B]"
            style={{ fontFamily: "Space Grotesk, sans-serif" }}
          >
            Place<span className="text-primary">Rise</span>
          </span>
        </Link>
        <Link
          to="/"
          className="text-text-muted hover:text-[#1E293B] text-sm transition-colors"
        >
          ← Back to home
        </Link>
      </header>

      {/* Title block */}
      <section className="max-w-5xl mx-auto px-6 pt-14 pb-10">
        <p className="text-xs font-semibold tracking-widest uppercase text-primary mb-3">
          Legal
        </p>
        <h1
          className="text-3xl md:text-4xl font-bold text-[#1E293B] mb-3"
          style={{ fontFamily: "Space Grotesk, sans-serif" }}
        >
          Privacy Policy
        </h1>
        <p className="text-text-muted text-sm">Last updated: {LAST_UPDATED}</p>
        <p className="text-text-muted text-sm leading-relaxed mt-4 max-w-2xl">
          This policy explains what information PlaceRise collects from students
          and placement coordinators who use the platform, how it's used, and
          the choices you have. It applies to everyone using PlaceRise, whether
          logged in as a student or a coordinator.
        </p>
      </section>

      {/* Body — sidebar nav + content */}
      <div className="max-w-5xl mx-auto px-6 pb-20 grid md:grid-cols-[220px_1fr] gap-12">
        {/* Sticky section nav — desktop only */}
        <nav className="hidden md:block">
          <div className="sticky top-24 flex flex-col gap-1">
            {SECTIONS.map((s) => (
              <button
                key={s.id}
                onClick={() => scrollToSection(s.id)}
                className={`text-left text-sm px-3 py-2 rounded-lg transition-colors cursor-pointer ${
                  activeSection === s.id
                    ? "bg-primary/10 text-primary font-semibold"
                    : "text-text-muted hover:text-[#1E293B] hover:bg-background"
                }`}
              >
                {s.title}
              </button>
            ))}
          </div>
        </nav>

        {/* Content */}
        <div>
          <Section id="collect" title="Information we collect">
            <p>
              To create and run your account, we collect the details you provide
              during onboarding and use of the platform — your name, ERP ID,
              school and course, contact details, resume, and any academic or
              application information you submit.
            </p>
            <p>
              We also collect information generated as you use PlaceRise: which
              companies you view or apply to, your application status, and login
              activity. Coordinators additionally see aggregated student and
              drive data needed to run placement season.
            </p>
          </Section>

          <Section id="use" title="How we use it">
            <p>
              We use your information to match you with eligible job postings,
              keep your application status up to date, send you relevant
              announcements, and let coordinators manage drives and shortlist
              candidates.
            </p>
            <p>
              We don't use your data for advertising, and we don't sell it to
              third parties.
            </p>
          </Section>

          <Section id="sharing" title="Information sharing">
            <p>
              Your academic and application details are visible to your
              placement coordinators, since they manage the drives you apply to.
              Information relevant to a specific application (such as your
              resume and eligibility details) may be shared with the recruiting
              company for that drive.
            </p>
            <p>
              We don't share your personal information with any other third
              party except where required by law or to operate the platform
              itself (for example, our hosting and database providers).
            </p>
          </Section>

          <Section id="storage" title="Data storage and security">
            <p>
              Your data is stored in a managed database with access restricted
              to authorized platform administrators and coordinators. We use
              standard security practices, including authentication tokens and
              encrypted connections, to protect your information in transit.
            </p>
            <p>
              No system is perfectly secure, and we can't guarantee absolute
              security — but we take reasonable steps to protect your data and
              will let you know if we become aware of a breach affecting your
              account.
            </p>
          </Section>

          <Section id="cookies" title="Cookies and local storage">
            <p>
              PlaceRise uses your browser's local storage to keep you logged in
              and to remember light preferences (like your last-seen
              announcement). We don't use third-party advertising cookies or
              tracking pixels.
            </p>
          </Section>

          <Section id="rights" title="Your rights and choices">
            <p>
              You can view and update most of your profile information directly
              from your dashboard. If you'd like a copy of your data, want a
              mistaken application removed, or have any other request about your
              information, reach out to your placement coordinator or contact us
              directly (see below).
            </p>
          </Section>

          <Section id="retention" title="Data retention">
            <p>
              We retain your account and application data for as long as you're
              an active student on the platform, and for a reasonable period
              afterward to support placement records and reporting. If you'd
              like your data removed sooner, contact us and we'll evaluate the
              request.
            </p>
          </Section>

          <Section id="changes" title="Changes to this policy">
            <p>
              We may update this policy as the platform evolves. If we make
              material changes, we'll update the "Last updated" date above and,
              where appropriate, notify you through an in-app announcement.
            </p>
          </Section>

          <Section id="contact" title="Contact us">
            <p>
              If you have questions about this policy or how your information is
              handled, reach out at{" "}
              <a
                href={`mailto:${SUPPORT_EMAIL}`}
                className="text-primary font-medium hover:underline"
              >
                {SUPPORT_EMAIL}
              </a>{" "}
              or visit our{" "}
              <Link
                to="/support"
                className="text-primary font-medium hover:underline"
              >
                Support Center
              </Link>
              .
            </p>
          </Section>

          <div
            style={{ borderColor: "#E2E8F0" }}
            className="border-t pt-6 mt-4"
          >
            <p className="text-xs text-text-muted leading-relaxed">
              This policy is a general description of our practices and isn't a
              substitute for legal advice. If PlaceRise is deployed for real
              student data, have this reviewed by someone qualified to confirm
              it meets your institution's and jurisdiction's requirements.
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="max-w-4xl mx-auto px-6 py-8 mb-4">
        <div
          style={{ borderColor: "#CBD5E1" }}
          className="bg-white/70 backdrop-blur rounded-3xl border px-8 py-5 flex flex-col md:flex-row items-center justify-between gap-4"
        >
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

export default PrivacyPolicyPage;