import { useState, useEffect, useCallback, useRef } from "react";
import { api } from "../../utils/api";
import {
  KeyRound,
  Copy,
  MessageSquareText,
  ChevronDown,
  ChevronUp,
  X,
  Star,
  Users,
  User,
  ThumbsUp,
  Search,
} from "lucide-react";

const POLL_INTERVAL_MS = 8000;
const ITEMS_PREVIEW_COUNT = 3;

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

// Direct `fill` prop instead of a Tailwind className — lucide icons ship
// with their own fill="none" attribute, and relying on a "fill-*" utility
// class to override it depends on Tailwind config specifics that don't
// always cooperate. Setting fill directly guarantees the stars render.
function StarRow({ value }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          size={12}
          fill={n <= value ? "#FBBF24" : "none"}
          stroke={n <= value ? "#FBBF24" : "#CBD5E1"}
          strokeWidth={1.5}
        />
      ))}
    </div>
  );
}

function FeedbackCard({ item }) {
  const isIndividual = item.feedbackType === "Individual";
  return (
    <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-4">
      <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
              isIndividual
                ? "bg-blue-50 text-primary border border-blue-200"
                : "bg-purple-50 text-purple-600 border border-purple-200"
            }`}
          >
            {isIndividual ? <User size={10} /> : <Users size={10} />}
            {isIndividual ? "Individual" : "Batch"}
          </span>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-white text-[#64748B] border border-[#E2E8F0]">
            {item.round}
          </span>
          {isIndividual && item.result && (
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                item.result === "Selected"
                  ? "bg-green-50 text-green-600 border border-green-200"
                  : item.result === "Rejected"
                    ? "bg-red-50 text-red-500 border border-red-200"
                    : "bg-amber-50 text-amber-600 border border-amber-200"
              }`}
            >
              {item.result}
            </span>
          )}
          {!item.seen && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary text-white">
              New
            </span>
          )}
        </div>
        <span className="text-[10px] text-[#94A3B8] shrink-0">
          {timeAgo(item.createdAt)}
        </span>
      </div>

      <p className="text-xs text-[#64748B] mb-2">
        {item.school} · {item.course}
        {isIndividual && item.studentIdentifier && (
          <>
            {" "}
            ·{" "}
            <span className="font-semibold text-[#1E293B]">
              {item.studentIdentifier}
            </span>
          </>
        )}
        {!isIndividual && item.candidatesInterviewed && (
          <> · {item.candidatesInterviewed} candidates</>
        )}
      </p>

      {isIndividual ? (
        <div className="grid grid-cols-3 gap-3 mb-3">
          {[
            ["Technical", item.ratings?.technical],
            ["Communication", item.ratings?.communication],
            ["Problem-solving", item.ratings?.problemSolving],
          ].map(([label, val]) => (
            <div key={label}>
              <p className="text-[9px] text-[#94A3B8] uppercase tracking-wide mb-1">
                {label}
              </p>
              <StarRow value={val || 0} />
            </div>
          ))}
        </div>
      ) : (
        <div className="mb-3">
          <p className="text-[9px] text-[#94A3B8] uppercase tracking-wide mb-1">
            Overall rating
          </p>
          <StarRow value={item.overallRating || 0} />
        </div>
      )}

      {item.rejectionReasons?.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {item.rejectionReasons.map((r) => (
            <span
              key={r}
              className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-white text-[#64748B] border border-[#E2E8F0]"
            >
              {r}
            </span>
          ))}
        </div>
      )}

      <p className="text-xs text-[#1E293B] leading-relaxed mb-1">
        <span className="font-semibold">Feedback: </span>
        {item.oneLineFeedback}
      </p>
      {item.recurringIssue && (
        <p className="text-xs text-[#64748B] leading-relaxed mb-1">
          <span className="font-semibold text-[#1E293B]">Recurring: </span>
          {item.recurringIssue}
        </p>
      )}
      {item.recommendForFuture !== null &&
        item.recommendForFuture !== undefined && (
          <p className="flex items-center gap-1.5 text-xs mt-2">
            <ThumbsUp
              size={12}
              className={
                item.recommendForFuture ? "text-green-500" : "text-[#CBD5E1]"
              }
              fill={item.recommendForFuture ? "#22C55E" : "none"}
            />
            <span className="text-[#64748B]">
              {item.recommendForFuture
                ? "Open to future drives"
                : "Not sure about future drives"}
            </span>
          </p>
        )}
    </div>
  );
}

function CompanyRow({
  company,
  items,
  isExpanded,
  onToggleExpand,
  onGenerateCode,
}) {
  const [showAll, setShowAll] = useState(false);
  const unseenCount = items.filter((f) => !f.seen).length;
  const visibleItems = showAll ? items : items.slice(0, ITEMS_PREVIEW_COUNT);

  return (
    <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm overflow-hidden">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-4 sm:p-5">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3
              className="text-sm font-bold text-[#1E293B]"
              style={{ fontFamily: "Space Grotesk, sans-serif" }}
            >
              {company.name}
            </h3>
            {unseenCount > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary text-white">
                {unseenCount} new
              </span>
            )}
            {company.hrAccessCode && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#F1F5F9] text-[#64748B] border border-[#E2E8F0]">
                Code active
              </span>
            )}
          </div>
          <p className="text-xs text-text-muted mt-0.5">
            {items.length} feedback {items.length === 1 ? "entry" : "entries"}{" "}
            received
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
          <button
            onClick={() => onGenerateCode(company)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 text-amber-600 border border-amber-200 text-xs font-semibold hover:bg-amber-100 transition-colors"
          >
            <KeyRound size={12} />
            {company.hrAccessCode ? "Share code" : "Generate code"}
          </button>
          <button
            onClick={onToggleExpand}
            disabled={items.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E2E8F0] text-xs font-medium text-[#64748B] hover:border-primary hover:text-primary transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isExpanded ? "Hide" : "View"} feedback
            {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </button>
        </div>
      </div>

      {isExpanded && items.length > 0 && (
        <div className="border-t border-[#F1F5F9] p-4 sm:p-5 bg-[#FAFBFC] flex flex-col gap-3">
          {visibleItems.map((item) => (
            <FeedbackCard key={item._id} item={item} />
          ))}
          {items.length > ITEMS_PREVIEW_COUNT && (
            <button
              onClick={() => setShowAll((s) => !s)}
              className="text-xs font-semibold text-primary hover:underline self-start"
            >
              {showAll
                ? "Show less"
                : `Show ${items.length - ITEMS_PREVIEW_COUNT} more`}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default function HRFeedbackManagementPage() {
  const [companies, setCompanies] = useState([]);
  const [feedback, setFeedback] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedCompany, setExpandedCompany] = useState(null);
  const [search, setSearch] = useState("");
  const isFirstLoad = useRef(true);

  const [showCodeModal, setShowCodeModal] = useState(false);
  const [codeTargetCompany, setCodeTargetCompany] = useState(null);
  const [generatedCode, setGeneratedCode] = useState("");
  const [generatingCode, setGeneratingCode] = useState(false);
  const [copied, setCopied] = useState(false);

  const fetchData = useCallback(async () => {
    if (isFirstLoad.current) setLoading(true);
    try {
      const [companiesData, feedbackData] = await Promise.all([
        api.get("/companies"),
        api.get("/hr-feedback"),
      ]);
      setCompanies(Array.isArray(companiesData) ? companiesData : []);
      setFeedback(Array.isArray(feedbackData) ? feedbackData : []);
    } finally {
      if (isFirstLoad.current) {
        setLoading(false);
        isFirstLoad.current = false;
      }
    }
  }, []);

  // Auto-refresh so a coordinator sitting on this page sees new feedback
  // the moment it comes in — without this, a feedback submitted after the
  // page was loaded would never appear until a manual reload.
  useEffect(() => {
    fetchData();
    const interval = setInterval(() => {
      if (!document.hidden) fetchData();
    }, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [fetchData]);

  const feedbackByCompany = (companyId) =>
    feedback.filter((f) => f.companyId?._id === companyId);

  const openGenerateCode = async (company) => {
    setCodeTargetCompany(company);
    setGeneratedCode("");
    setCopied(false);
    setShowCodeModal(true);
    setGeneratingCode(true);
    try {
      const res = await api.post(`/hr-feedback/generate-code/${company._id}`);
      setGeneratedCode(res.code);
      setCompanies((prev) =>
        prev.map((c) =>
          c._id === company._id ? { ...c, hrAccessCode: res.code } : c,
        ),
      );
    } catch (err) {
      alert("Could not generate a code right now");
      setShowCodeModal(false);
    }
    setGeneratingCode(false);
  };

  const shareMessage = (company, code) =>
    `Hi! Please share quick interview feedback for ${company?.name || ""} candidates on PlaceRise:\n\n` +
    `Link: ${window.location.origin}/hr-login\n` +
    `Company: ${company?.name || ""}\n` +
    `Access Code: ${code}\n\n` +
    `Takes about a minute per round.`;

  const copyShareMessage = async () => {
    await navigator.clipboard.writeText(
      shareMessage(codeTargetCompany, generatedCode),
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleExpand = async (companyId) => {
    if (expandedCompany === companyId) {
      setExpandedCompany(null);
      return;
    }
    setExpandedCompany(companyId);
    const unseenCount = feedbackByCompany(companyId).filter(
      (f) => !f.seen,
    ).length;
    if (unseenCount > 0) {
      try {
        await api.patch(`/hr-feedback/mark-seen/${companyId}`);
        setFeedback((prev) =>
          prev.map((f) =>
            f.companyId?._id === companyId ? { ...f, seen: true } : f,
          ),
        );
      } catch (err) {
        // non-critical — badge just won't clear until next poll
      }
    }
  };

  if (loading)
    return <div className="text-center py-20 text-text-muted">Loading...</div>;

  const totalUnseen = feedback.filter((f) => !f.seen).length;

  // Search filter, then sort: companies with unseen feedback float to the
  // top (most unseen first), then by most recent feedback activity — so
  // as this list grows across many companies, what needs attention stays
  // near the top instead of getting buried.
  const companyMeta = companies.map((company) => {
    const items = feedbackByCompany(company._id);
    const unseenCount = items.filter((f) => !f.seen).length;
    const lastActivity = items.length
      ? Math.max(...items.map((f) => new Date(f.createdAt).getTime()))
      : 0;
    return { company, items, unseenCount, lastActivity };
  });

  const filtered = companyMeta
    .filter(({ company }) =>
      company.name.toLowerCase().includes(search.toLowerCase()),
    )
    .sort((a, b) => {
      if (a.unseenCount !== b.unseenCount) return b.unseenCount - a.unseenCount;
      return b.lastActivity - a.lastActivity;
    });

  return (
    <div
      className="max-w-5xl mx-auto px-1"
      style={{ fontFamily: "Inter, sans-serif" }}
    >
      <div
        className="relative rounded-2xl overflow-hidden mb-6 p-4 sm:p-6"
        style={{
          background:
            "linear-gradient(135deg, #1D4ED8 0%, #2563EB 45%, #0EA5E9 100%)",
        }}
      >
        <div
          className="absolute top-0 right-0 w-72 h-72 rounded-full pointer-events-none"
          style={{
            background: "rgba(255,255,255,0.08)",
            transform: "translate(35%,-45%)",
          }}
        />
        <div className="relative flex items-center gap-2 mb-1.5">
          <div className="w-6 h-6 rounded-md bg-white/20 flex items-center justify-center">
            <MessageSquareText size={13} className="text-white" />
          </div>
          <span className="text-white/60 text-[10px] font-bold uppercase tracking-widest">
            Placement Portal
          </span>
        </div>
        <h1
          className="relative text-xl sm:text-2xl font-bold text-white"
          style={{ fontFamily: "Space Grotesk, sans-serif" }}
        >
          HR Feedback
        </h1>
        <p className="relative text-white/55 text-xs mt-1">
          Generate recruiter access codes and review interview feedback
          {totalUnseen > 0 && (
            <span className="ml-2 px-2 py-0.5 rounded-full bg-white/20 text-white text-[10px] font-bold">
              {totalUnseen} new
            </span>
          )}
        </p>
      </div>

      {companies.length > 0 && (
        <div className="relative mb-4">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]"
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search company name..."
            className="w-full pl-9 pr-4 py-2.5 text-sm border border-[#E2E8F0] rounded-xl bg-white focus:outline-none focus:border-primary transition-colors text-[#1E293B] placeholder:text-[#94A3B8]"
          />
        </div>
      )}

      {companies.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <MessageSquareText size={40} className="text-[#CBD5E1]" />
          <p className="text-sm text-text-muted">
            Add a company first to start collecting HR feedback.
          </p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Search size={32} className="text-[#CBD5E1]" />
          <p className="text-sm text-text-muted">
            No companies match your search.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map(({ company, items }) => (
            <CompanyRow
              key={company._id}
              company={company}
              items={items}
              isExpanded={expandedCompany === company._id}
              onToggleExpand={() => toggleExpand(company._id)}
              onGenerateCode={openGenerateCode}
            />
          ))}
        </div>
      )}

      {showCodeModal && codeTargetCompany && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 px-4"
          onClick={() => setShowCodeModal(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
                  <KeyRound size={16} className="text-amber-600" />
                </div>
                <div>
                  <h3
                    className="text-sm font-bold text-[#1E293B]"
                    style={{ fontFamily: "Space Grotesk, sans-serif" }}
                  >
                    Recruiter Access Code
                  </h3>
                  <p className="text-xs text-[#64748B]">
                    {codeTargetCompany.name}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowCodeModal(false)}
                className="w-7 h-7 rounded-lg bg-[#F1F5F9] flex items-center justify-center hover:bg-[#E2E8F0] transition-colors shrink-0"
              >
                <X size={14} className="text-[#64748B]" />
              </button>
            </div>

            {generatingCode ? (
              <p className="text-sm text-text-muted text-center py-6">
                Generating code...
              </p>
            ) : (
              <>
                <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-4 mb-4">
                  <p className="text-[10px] font-semibold text-[#94A3B8] uppercase tracking-widest mb-2">
                    Access Code
                  </p>
                  <p
                    className="text-2xl font-bold text-[#1E293B] tracking-widest"
                    style={{ fontFamily: "Space Grotesk, sans-serif" }}
                  >
                    {generatedCode}
                  </p>
                </div>

                <p className="text-xs text-text-muted mb-2">
                  Copy this and send it to the recruiter via WhatsApp or email:
                </p>
                <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-3 mb-4">
                  <p className="text-xs text-[#475569] whitespace-pre-line leading-relaxed">
                    {shareMessage(codeTargetCompany, generatedCode)}
                  </p>
                </div>

                <button
                  onClick={copyShareMessage}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-blue-600 transition-colors"
                >
                  <Copy size={14} />
                  {copied ? "Copied!" : "Copy message"}
                </button>
              </>
            )}

            <button
              onClick={() => setShowCodeModal(false)}
              className="w-full mt-2 py-2.5 rounded-xl border border-[#E2E8F0] text-sm font-medium text-[#64748B] hover:bg-[#F8FAFC] transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
