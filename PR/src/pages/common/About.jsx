import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";

// ─── Design tokens — deliberately separate from the app's light theme.
// This page is a one-off narrative moment, not a dashboard surface. ───
const D = {
  bg: "#05070B",
  bgPanel: "#0D111C",
  text: "#ECEEF3",
  textMuted: "#8A93A6",
  textFaint: "#4B5266",
  accent: "#4C8DFF",
  accentSoft: "rgba(76, 141, 255, 0.12)",
  accentGlow: "rgba(76, 141, 255, 0.16)",
  border: "rgba(255, 255, 255, 0.08)",
  borderStrong: "rgba(255, 255, 255, 0.14)",
};

const SERIF = "'Playfair Display', Georgia, serif";
const SANS =
  "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";

const CHAPTERS = [
  { key: "truth", number: "01", label: "The Truth" },
  { key: "shift", number: "02", label: "The Shift" },
  { key: "system", number: "03", label: "The System" },
  { key: "builders", number: "04", label: "The Builders" },
  { key: "start", number: "05", label: "Start Here" },
];

const CAPABILITIES = [
  "Eligibility matched to your course, automatically.",
  "Every announcement lands the moment it's posted.",
  "Applications tracked end to end — apply to offer.",
  "Coordinators see the whole batch. Students see what's theirs.",
];

const TEAM = [
  {
    number: "01",
    name: "Hardik Srivastava",
    role: "Product Lead · Founding Engineer",
    quote: "Believes products earn trust through details nobody notices.",
    photo: "/images/hard.png",
    linkedin: "https://www.linkedin.com/in/hardik-srivastava033/",
  },
  {
    number: "02",
    name: "Ayyan Ahmad",
    role: "Backend Engineer · Infrastructure",
    quote: "Makes complexity disappear behind reliable systems.",
    photo: "/images/ayyan.png",
    linkedin: "https://www.linkedin.com/in/ayyan-ahmad-5a58a628a/",
  },
  {
    number: "03",
    name: "Himanshu Kr. Tiwari",
    role: "Frontend Engineer · User Experience",
    quote: "Turns operational chaos into interfaces people enjoy using.",
    photo: "/images/him.jpg",
    linkedin: "https://www.linkedin.com/in/himanshu-tiwari-a33373287/",
  },
  {
    number: "04",
    name: "Harsh Rathore",
    role: "QA Engineer · Documentation",
    quote:
      "Connects ideas, features, and documentation into one seamless experience.",
    photo: "/images/rath.jpg",
    linkedin: "https://www.linkedin.com/in/harsh-rathore-772124294/",
  },
];

function getInitials(name) {
  const parts = name.split(" ").filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
function LinkedinIcon({ size = 16, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.03-1.85-3.03-1.85 0-2.14 1.45-2.14 2.94v5.66H9.34V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.38-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12zM7.12 20.45H3.56V9h3.56v11.45z" />
    </svg>
  );
}
function ContactCTA({ email = "team@placerise.com" }) {
  const [copied, setCopied] = useState(false);
  const [hovered, setHovered] = useState(false);

  const handleClick = async () => {
    try {
      await navigator.clipboard.writeText(email);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // clipboard blocked — fall back to mailto
      window.location.href = `mailto:${email}`;
    }
  };

  return (
    <span className="relative inline-block">
      <button
        onClick={handleClick}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{ color: D.accent, fontWeight: 600 }}
        className="pr-focusable underline underline-offset-2 hover:opacity-80 transition-opacity cursor-pointer bg-transparent border-none p-0"
      >
        get in touch
      </button>
      {(hovered || copied) && (
        <span
          style={{
            backgroundColor: D.bgPanel,
            border: `1px solid ${D.border}`,
            color: copied ? D.accent : D.textMuted,
            fontSize: "12px",
            whiteSpace: "nowrap",
          }}
          className="absolute left-1/2 -translate-x-1/2 -top-9 px-3 py-1.5 rounded-md pointer-events-none"
        >
          {copied ? "Copied to clipboard ✓" : email}
        </span>
      )}
    </span>
  );
}

// ─── Scroll-reveal primitive ───────────────────────────────────
function useInView(threshold = 0.3) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.unobserve(node);
        }
      },
      { threshold },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [threshold]);

  return [ref, inView];
}

function Reveal({
  children,
  delay = 0,
  reducedMotion,
  as: Tag = "div",
  className = "",
  style = {},
}) {
  const [ref, inView] = useInView(0.25);
  return (
    <Tag
      ref={ref}
      className={className}
      style={{
        opacity: inView ? 1 : 0,
        transform: reducedMotion
          ? "none"
          : inView
            ? "translateY(0)"
            : "translateY(26px)",
        transition: reducedMotion
          ? `opacity 0.4s ease ${delay}s`
          : `opacity 0.9s cubic-bezier(.16,1,.3,1) ${delay}s, transform 0.9s cubic-bezier(.16,1,.3,1) ${delay}s`,
        ...style,
      }}
    >
      {children}
    </Tag>
  );
}

function ChevronDown() {
  return (
    <svg
      className="w-4 h-4"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 5v14m0 0l6-6m-6 6l-6-6"
      />
    </svg>
  );
}

function AboutPage() {
  const navigate = useNavigate();
  const [progress, setProgress] = useState(0);
  const [activeChapter, setActiveChapter] = useState(0);
  const [reducedMotion] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  const chapterRefs = useRef(new Map());

  // Inject the two display/body faces once, remove on unmount.
  useEffect(() => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href =
      "https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,500;0,600;1,500;1,600&family=Inter:wght@400;500;600&display=swap";
    document.head.appendChild(link);
    return () => {
      document.head.removeChild(link);
    };
  }, []);

  // Top progress line.
  useEffect(() => {
    const handleScroll = () => {
      const doc = document.documentElement;
      const scrollTop = doc.scrollTop || document.body.scrollTop;
      const scrollHeight =
        (doc.scrollHeight || document.body.scrollHeight) - doc.clientHeight;
      setProgress(scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Which chapter is centered in the viewport right now.
  useEffect(() => {
    const ratios = new Map();

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const idx = Number(entry.target.dataset.chapterIndex);
          ratios.set(idx, entry.isIntersecting ? entry.intersectionRatio : 0);
        });

        // Jo section sabse zyada visible hai, wahi active chapter hai.
        let bestIdx = 0;
        let bestRatio = -1;
        ratios.forEach((ratio, idx) => {
          if (ratio > bestRatio) {
            bestRatio = ratio;
            bestIdx = idx;
          }
        });
        if (bestRatio > 0) {
          setActiveChapter(bestIdx);
        }
      },
      { threshold: [0, 0.25, 0.5, 0.75, 1] },
    );

    chapterRefs.current.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, []);

  const setChapterRef = useCallback(
    (index) => (node) => {
      if (node) chapterRefs.current.set(index, node);
      else chapterRefs.current.delete(index);
    },
    [],
  );

  const scrollToChapter = (index) => {
    const node = chapterRefs.current.get(index);
    if (node)
      node.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth" });
  };
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "ArrowDown" || e.key === "PageDown") {
        e.preventDefault();
        scrollToChapter(Math.min(activeChapter + 1, CHAPTERS.length - 1));
      } else if (e.key === "ArrowUp" || e.key === "PageUp") {
        e.preventDefault();
        scrollToChapter(Math.max(activeChapter - 1, 0));
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeChapter, reducedMotion]);

  return (
    <div
      style={{ backgroundColor: D.bg, fontFamily: SANS }}
      className="min-h-screen"
    >
      <style>{`
        .pr-focusable:focus-visible {
          outline: 2px solid ${D.accent};
          outline-offset: 3px;
          border-radius: 4px;
        }
        @keyframes prScrollLine {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(220%); }
        }
        .pr-scroll-line-fill {
          animation: ${reducedMotion ? "none" : "prScrollLine 1.9s ease-in-out infinite"};
        }
      `}</style>

      {/* ── Top bar: progress line + eyebrow + live chapter label ── */}
      <div className="fixed top-0 left-0 right-0 z-40">
        <div
          style={{ height: 2, backgroundColor: D.border }}
          className="w-full"
        >
          <div
            style={{
              width: `${progress}%`,
              backgroundColor: D.accent,
              height: "100%",
              transition: "width 0.15s linear",
            }}
          />
        </div>
        <div className="flex items-center justify-between px-6 sm:px-10 py-4">
          <span
            style={{ color: D.textMuted, letterSpacing: "0.22em" }}
            className="text-[10px] sm:text-[11px] uppercase font-medium"
          >
            PlaceRise / About
          </span>
          <span
            style={{ color: D.textMuted, letterSpacing: "0.22em" }}
            className="text-[10px] sm:text-[11px] uppercase font-medium text-right"
          >
            Chapter {CHAPTERS[activeChapter].number} —{" "}
            {CHAPTERS[activeChapter].label}
          </span>
        </div>
      </div>

      {/* ── Right-hand chapter rail (desktop only) ── */}
      <div className="hidden md:flex flex-col gap-5 fixed right-8 top-1/2 -translate-y-1/2 z-40">
        {CHAPTERS.map((c, i) => (
          <button
            key={c.key}
            onClick={() => scrollToChapter(i)}
            aria-label={`Go to chapter ${c.number}, ${c.label}`}
            className="pr-focusable relative flex items-center justify-center cursor-pointer p-1"
          >
            <span
              style={{
                width: i === activeChapter ? 9 : 5,
                height: i === activeChapter ? 9 : 5,
                backgroundColor: i === activeChapter ? D.accent : D.border,
                boxShadow:
                  i === activeChapter ? `0 0 0 4px ${D.accentSoft}` : "none",
                transition: "all 0.3s ease",
              }}
              className="rounded-full block"
            />
          </button>
        ))}
      </div>
      {/* ── Mobile chapter dots (bottom, horizontal) ── */}
      <div className="flex md:hidden gap-3 fixed bottom-6 left-1/2 -translate-x-1/2 z-40">
        {CHAPTERS.map((c, i) => (
          <button
            key={c.key}
            onClick={() => scrollToChapter(i)}
            aria-label={`Go to chapter ${c.number}, ${c.label}`}
            className="pr-focusable p-1"
          >
            <span
              style={{
                width: i === activeChapter ? 8 : 5,
                height: i === activeChapter ? 8 : 5,
                backgroundColor: i === activeChapter ? D.accent : D.border,
                boxShadow:
                  i === activeChapter ? `0 0 0 3px ${D.accentSoft}` : "none",
                transition: "all 0.3s ease",
              }}
              className="rounded-full block"
            />
          </button>
        ))}
      </div>

      <main className="relative">
        {/* ── Chapter 01 — The Truth ── */}
        <section
          ref={setChapterRef(0)}
          data-chapter-index={0}
          className="relative min-h-screen flex items-center px-6 sm:px-10 lg:px-24 overflow-hidden"
        >
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: `radial-gradient(circle at 70% 30%, ${D.accentGlow}, transparent 55%)`,
            }}
          />
          <div className="relative z-10 max-w-4xl">
            <Reveal reducedMotion={reducedMotion}>
              <span
                style={{ color: D.accent, letterSpacing: "0.25em" }}
                className="text-[11px] uppercase font-semibold"
              >
                Chapter 01 — The Truth
              </span>
            </Reveal>

            <h1
              style={{ fontFamily: SERIF, color: D.text }}
              className="mt-6 leading-[1.1]"
            >
              <Reveal reducedMotion={reducedMotion} delay={0.1}>
                <span
                  style={{
                    fontSize: "clamp(2rem, 5.2vw, 4.2rem)",
                    fontWeight: 600,
                  }}
                  className="block"
                >
                  Most students don't miss placements
                </span>
              </Reveal>
              <Reveal reducedMotion={reducedMotion} delay={0.25}>
                <span
                  style={{
                    fontSize: "clamp(2rem, 5.2vw, 4.2rem)",
                    fontStyle: "italic",
                    fontWeight: 500,
                    color: D.textMuted,
                  }}
                  className="block"
                >
                  because they weren't good enough.
                </span>
              </Reveal>
              <Reveal reducedMotion={reducedMotion} delay={0.45}>
                <span
                  style={{
                    fontSize: "clamp(2rem, 5.2vw, 4.2rem)",
                    fontWeight: 600,
                  }}
                  className="block mt-3"
                >
                  They miss them because
                </span>
              </Reveal>
              <Reveal reducedMotion={reducedMotion} delay={0.6}>
                <span
                  style={{
                    fontSize: "clamp(2rem, 5.2vw, 4.2rem)",
                    fontWeight: 600,
                    color: D.accent,
                  }}
                  className="block"
                >
                  no one showed them where to look.
                </span>
              </Reveal>
            </h1>
          </div>

          <div
            className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3"
            style={{
              opacity: activeChapter === 0 ? 1 : 0,
              transition: "opacity 0.6s ease",
            }}
          >
            <span
              style={{ color: D.textFaint, letterSpacing: "0.3em" }}
              className="text-[10px] uppercase"
            >
              Scroll
            </span>
            <div
              style={{ width: 1, height: 40, backgroundColor: D.border }}
              className="relative overflow-hidden"
            >
              <div
                className="pr-scroll-line-fill absolute top-0 left-0 w-full"
                style={{ height: "50%", backgroundColor: D.accent }}
              />
            </div>
          </div>
        </section>

        {/* ── Chapter 02 — The Shift ── */}
        <section
          ref={setChapterRef(1)}
          data-chapter-index={1}
          className="relative min-h-screen flex items-center px-6 sm:px-10 lg:px-24"
        >
          <div className="max-w-3xl">
            <Reveal reducedMotion={reducedMotion}>
              <span
                style={{ color: D.accent, letterSpacing: "0.25em" }}
                className="text-[11px] uppercase font-semibold"
              >
                Chapter 02 — The Shift
              </span>
            </Reveal>
            <Reveal reducedMotion={reducedMotion} delay={0.15}>
              <h2
                style={{
                  fontFamily: SERIF,
                  color: D.text,
                  fontSize: "clamp(1.75rem, 4vw, 3rem)",
                  fontWeight: 600,
                }}
                className="mt-6 leading-[1.15]"
              >
                So we stopped waiting for
                <span style={{ fontStyle: "italic", color: D.textMuted }}>
                  {" "}
                  someone else
                </span>{" "}
                to fix it.
              </h2>
            </Reveal>
            <Reveal reducedMotion={reducedMotion} delay={0.35}>
              <p
                style={{
                  color: D.textMuted,
                  fontSize: "20px",
                  lineHeight: 1.9,
                }}
                className="mt-8 max-w-xl"
              >
                Four of us, same campus, watched the same thing happen every
                placement season — a real offer lost to a WhatsApp forward
                nobody saw, or a form buried three folders deep in someone's
                inbox. Not a talent problem. A visibility problem. So we built
                the system we wished had existed for us.
              </p>
            </Reveal>
          </div>
        </section>

        {/* ── Chapter 03 — The System ── */}
        <section
          ref={setChapterRef(2)}
          data-chapter-index={2}
          className="relative min-h-screen flex items-center px-6 sm:px-10 lg:px-24"
        >
          <div className="max-w-4xl w-full">
            <Reveal reducedMotion={reducedMotion}>
              <span
                style={{ color: D.accent, letterSpacing: "0.25em" }}
                className="text-[11px] uppercase font-semibold"
              >
                Chapter 03 — The System
              </span>
            </Reveal>
            <Reveal reducedMotion={reducedMotion} delay={0.15}>
              <h2
                style={{
                  fontFamily: SERIF,
                  color: D.text,
                  fontSize: "clamp(1.75rem, 4vw, 3rem)",
                  fontWeight: 600,
                }}
                className="mt-6 mb-12 leading-[1.15] max-w-2xl"
              >
                One dashboard. Every deadline, every drive, every decision.
              </h2>
            </Reveal>

            <div style={{ borderTop: `1px solid ${D.border}` }}>
              {CAPABILITIES.map((line, i) => (
                <Reveal
                  reducedMotion={reducedMotion}
                  delay={0.1 * i}
                  key={line}
                >
                  <div
                    style={{ borderBottom: `1px solid ${D.border}` }}
                    className="flex items-center gap-6 py-6"
                  >
                    <span
                      style={{
                        fontFamily: SERIF,
                        color: D.textFaint,
                        fontSize: "1.1rem",
                      }}
                    >
                      0{i + 1}
                    </span>
                    <p style={{ color: D.text, fontSize: "19px" }}>{line}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ── Chapter 04 — The Builders ── */}
        <section
          ref={setChapterRef(3)}
          data-chapter-index={3}
          className="relative min-h-screen flex items-center px-6 sm:px-10 lg:px-24 py-24"
        >
          <div className="max-w-5xl w-full">
            <Reveal reducedMotion={reducedMotion}>
              <span
                style={{ color: D.accent, letterSpacing: "0.25em" }}
                className="text-[11px] uppercase font-semibold"
              >
                Chapter 04 — The Builders
              </span>
            </Reveal>
            <Reveal reducedMotion={reducedMotion} delay={0.15}>
              <h2
                style={{
                  fontFamily: SERIF,
                  color: D.text,
                  fontSize: "clamp(1.75rem, 4vw, 3rem)",
                  fontWeight: 600,
                }}
                className="mt-6 mb-14 leading-[1.15]"
              >
                Four students. One campus. No excuses.
              </h2>
            </Reveal>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {TEAM.map((member, idx) => (
                <Reveal
                  reducedMotion={reducedMotion}
                  delay={0.25 * idx}
                  key={member.name}
                >
                  <div
                    style={{
                      backgroundColor: D.bgPanel,
                      border: `1px solid ${D.border}`,
                    }}
                    className="relative rounded-2xl p-10 overflow-hidden h-full max-w-2xl mx-auto"
                  >
                    <span
                      style={{
                        fontFamily: SERIF,
                        color: "rgba(76, 141, 255, 0.08)",
                        fontSize: "5.5rem",
                        fontWeight: 600,
                      }}
                      className="absolute -top-3 -right-1 select-none pointer-events-none"
                      aria-hidden="true"
                    >
                      {member.number}
                    </span>

                    <div className="relative z-10">
                      <div
                        style={{
                          backgroundColor: D.accentSoft,
                          border: `1px solid ${D.border}`,
                          color: D.accent,
                          overflow: "hidden",
                        }}
                        className="w-40 h-40 rounded-full flex items-center justify-center font-semibold text-2xl mb-7"
                      >
                        {member.photo ? (
                          <img
                            src={member.photo}
                            alt={member.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          getInitials(member.name)
                        )}
                      </div>
                      <h3
                        style={{
                          fontFamily: SERIF,
                          color: D.text,
                          fontWeight: 600,
                        }}
                        className="text-3xl mb-2"
                      >
                        {member.name}
                      </h3>
                      <p
                        style={{ color: D.accent, letterSpacing: "0.08em" }}
                        className="text-[13px] uppercase font-semibold mb-5"
                      >
                        {member.role}
                      </p>
                      <p
                        style={{
                          fontFamily: SERIF,
                          color: D.textMuted,
                          fontStyle: "italic",
                          fontSize: "21px",
                          lineHeight: 1.8,
                        }}
                      >
                        “{member.quote}”
                      </p>
                      {member.linkedin && (
                        <div className="flex items-center gap-3 mt-6">
                          {member.linkedin && (
                            <a
                              href={member.linkedin}
                              target="_blank"
                              rel="noopener noreferrer"
                              aria-label={`${member.name} on LinkedIn`}
                              style={{
                                color: D.textMuted,
                                border: `1px solid ${D.border}`,
                              }}
                              className="pr-focusable w-9 h-9 rounded-full flex items-center justify-center hover:opacity-80 transition-opacity"
                            >
                              <LinkedinIcon size={16} color="#0A66C2" />
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
            {/* ── Chapter 04 — The Builders (existing grid stays as-is) ── */}

            {/* ── Mentor card — separate section, not competing with the 4 ── */}
            <Reveal reducedMotion={reducedMotion} delay={0.16 * TEAM.length}>
              <div className="mt-10">
                <div className="flex items-center gap-4 mb-6">
                  <div
                    style={{ height: 1, backgroundColor: D.border, flex: 1 }}
                  />
                  <span
                    style={{ color: D.textFaint, letterSpacing: "0.25em" }}
                    className="text-[11px] uppercase font-medium"
                  >
                    With Guidance From
                  </span>
                  <div
                    style={{ height: 1, backgroundColor: D.border, flex: 1 }}
                  />
                </div>

                <div className="max-w-5xl mx-auto w-full grid gap-8 md:grid-cols-2">
                  {/* Dhjvir — Mentor */}
                  <div
                    style={{
                      backgroundColor: D.bgPanel,
                      border: `1px solid ${D.borderStrong}`,
                    }}
                    className="relative rounded-2xl p-10 overflow-hidden flex items-center gap-8"
                  >
                    <span
                      style={{
                        fontFamily: SERIF,
                        color: "rgba(76, 141, 255, 0.08)",
                        fontSize: "6rem",
                        fontWeight: 600,
                      }}
                      className="absolute -top-3 -right-1 select-none pointer-events-none"
                      aria-hidden="true"
                    >
                      05
                    </span>

                    <div
                      style={{
                        backgroundColor: D.accentSoft,
                        border: `1px solid ${D.border}`,
                        color: D.accent,
                        overflow: "hidden",
                      }}
                      className="w-40 h-40 rounded-full flex items-center justify-center font-semibold text-3xl mb-0 shrink-0 relative z-10"
                    >
                      <img
                        src="/images/Dhjvir.png"
                        alt="Dhjvir"
                        className="w-full h-full object-cover"
                      />
                    </div>

                    <div className="relative z-10 text-center sm:text-left">
                      <h3
                        style={{
                          fontFamily: SERIF,
                          color: D.text,
                          fontWeight: 600,
                        }}
                        className="text-3xl mb-1"
                      >
                        Dhajvir Singh Rai
                      </h3>
                      <p
                        style={{ color: D.accent, letterSpacing: "0.08em" }}
                        className="text-[13px] uppercase font-semibold mb-5"
                      >
                        Advisor · Student Mentor
                      </p>
                      <p
                        style={{
                          fontFamily: SERIF,
                          color: D.textMuted,
                          fontStyle: "italic",
                          fontSize: "21px",
                          lineHeight: 1.8,
                        }}
                      >
                        "Guides early-stage thinking and connects students to
                        opportunities."
                      </p>
                    </div>
                  </div>

                  {/* Mukesh — Mentor */}
                  <div
                    style={{
                      backgroundColor: D.bgPanel,
                      border: `1px solid ${D.borderStrong}`,
                    }}
                    className="relative rounded-2xl p-10 overflow-hidden flex items-center gap-8"
                  >
                    <span
                      style={{
                        fontFamily: SERIF,
                        color: "rgba(76, 141, 255, 0.08)",
                        fontSize: "6rem",
                        fontWeight: 600,
                      }}
                      className="absolute -top-3 -right-1 select-none pointer-events-none"
                      aria-hidden="true"
                    >
                      06
                    </span>

                    <div
                      style={{
                        backgroundColor: D.accentSoft,
                        border: `1px solid ${D.border}`,
                        color: D.accent,
                        overflow: "hidden",
                      }}
                      className="w-40 h-40 rounded-full flex items-center justify-center font-semibold text-3xl mb-0 shrink-0 relative z-10"
                    >
                      <img
                        src="/images/mukesh.png"
                        alt="Mukesh Kumar"
                        className="w-full h-full object-cover"
                      />
                    </div>

                    <div className="relative z-10 text-center sm:text-left">
                      <h3
                        style={{
                          fontFamily: SERIF,
                          color: D.text,
                          fontWeight: 600,
                        }}
                        className="text-3xl mb-1"
                      >
                        Mukesh Kumar
                      </h3>
                      <p
                        style={{ color: D.accent, letterSpacing: "0.08em" }}
                        className="text-[13px] uppercase font-semibold mb-5"
                      >
                        Mentor · Idea to Execution
                      </p>
                      <p
                        style={{
                          fontFamily: SERIF,
                          color: D.textMuted,
                          fontStyle: "italic",
                          fontSize: "21px",
                          lineHeight: 1.8,
                        }}
                      >
                        "Shaped the idea, laid the foundation, guided every
                        feature that followed."
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        </section>

        {/* ── Chapter 05 — Start Here ── */}
        <section
          ref={setChapterRef(4)}
          data-chapter-index={4}
          className="relative min-h-screen flex items-center justify-center px-6 sm:px-10 lg:px-24"
        >
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: `radial-gradient(circle at 50% 50%, ${D.accentGlow}, transparent 60%)`,
            }}
          />
          <div className="relative z-10 max-w-2xl text-center">
            <Reveal reducedMotion={reducedMotion}>
              <span
                style={{ color: D.accent, letterSpacing: "0.25em" }}
                className="text-[11px] uppercase font-semibold"
              >
                Chapter 05 — Start Here
              </span>
            </Reveal>
            <Reveal reducedMotion={reducedMotion} delay={0.15}>
              <h2
                style={{
                  fontFamily: SERIF,
                  color: D.text,
                  fontSize: "clamp(2.2rem, 6vw, 4rem)",
                  fontWeight: 600,
                }}
                className="mt-6 mb-4"
              >
                This is PlaceRise.
              </h2>
            </Reveal>
            <Reveal reducedMotion={reducedMotion} delay={0.3}>
              <p
                style={{ color: D.textMuted, fontSize: "18px" }}
                className="mb-10"
              >
                Built on campus, for the campus.
              </p>
            </Reveal>
            <Reveal reducedMotion={reducedMotion} delay={0.4}>
              <p style={{ color: D.text, fontSize: "16px" }} className="mb-10">
                We're currently looking to hire developers and other talented
                folks to join us —{" "}
                <ContactCTA email="placerise.notifications@gmail.com" />.
              </p>
            </Reveal>
            <Reveal reducedMotion={reducedMotion} delay={0.45}>
              <button
                onClick={() => navigate("/")}
                style={{ backgroundColor: D.accent, color: "#03060D" }}
                className="pr-focusable cursor-pointer inline-flex items-center gap-2 font-semibold px-7 py-3 rounded-full text-sm hover:opacity-90 transition-opacity"
              >
                Enter PlaceRise
                <ChevronDown />
              </button>
            </Reveal>
          </div>
        </section>
      </main>
    </div>
  );
}

export default AboutPage;
