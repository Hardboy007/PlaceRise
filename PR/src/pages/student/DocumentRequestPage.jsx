import { useState, useEffect } from "react";
import {
  FileText,
  Download,
  Building2,
  GraduationCap,
  Info,
} from "lucide-react";
import { api } from "../../utils/api";

const NOC_PLACEHOLDER =
  "e.g. Appearing for campus recruitment at [Company Name]";
const LOR_PLACEHOLDER =
  "e.g. Applying for Masters program at [University Name]";

// Shown under the NOC/LOR toggle so students never have to guess which one
// they need — the #1 source of confusion on this page before this pass.
const TYPE_INFO = {
  NOC: {
    icon: Building2,
    hint: "For companies or internships — a No Objection Certificate confirms the university has no objection to you joining.",
  },
  LOR: {
    icon: GraduationCap,
    hint: "For higher studies — a Letter of Recommendation supports your application to a university or program.",
  },
};

const STATUS_CONFIG = {
  Pending: {
    dot: "bg-warning",
    dotRing: "ring-warning/20",
    badge: "bg-warning/10 text-warning border-warning/30",
  },
  Approved: {
    dot: "bg-success",
    dotRing: "ring-success/20",
    badge: "bg-success/10 text-success border-success/30",
  },
  Rejected: {
    dot: "bg-danger",
    dotRing: "ring-danger/20",
    badge: "bg-danger/10 text-danger border-danger/30",
  },
};

const StatusBadge = ({ status }) => {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.Pending;
  return (
    <span
      className={`inline-flex items-center gap-1.5 pl-2 pr-3 py-1 rounded-full text-xs font-semibold border whitespace-nowrap ${cfg.badge}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {status}
    </span>
  );
};

// Large translucent icon used as a quiet decorative signature in the hero
// — replaces the stat strip, which repeated info already visible in the
// timeline and wasn't meaningful at the scale of one student's requests.
const HeroIllustration = () => (
  <FileText
    size={168}
    strokeWidth={1}
    className="pointer-events-none absolute -right-6 -bottom-10 text-white/10 hidden sm:block"
    aria-hidden="true"
  />
);

const DocumentRequestPage = () => {
  const [requests, setRequests] = useState([]);
  const [type, setType] = useState("NOC");
  const [purpose, setPurpose] = useState("");
  const [proofFile, setProofFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        setLoading(true);
        const data = await api.get("/noc/my");
        setRequests(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error(err);
        setError("Failed to load requests.");
      } finally {
        setLoading(false);
      }
    };
    fetchRequests();
  }, []);

  const handleSubmit = async () => {
    if (!purpose.trim() || submitting) return;
    if (type === "NOC" && !proofFile) {
      setError("Please upload a proof document for NOC.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("type", type);
      formData.append("purpose", purpose);
      if (type === "NOC" && proofFile) {
        formData.append("proof", proofFile);
      }

      const newRequest = await api.post("/noc", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setRequests((prev) => [newRequest, ...prev]);
      setPurpose("");
      setProofFile(null);
    } catch (err) {
      console.error(err);
      setError(
        err?.response?.data?.message ||
          "Couldn't submit your request. Please try again.",
      );
    }
    setSubmitting(false);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const activeTypeInfo = TYPE_INFO[type];

  return (
    <div className="min-h-screen bg-background px-3 sm:px-4 md:px-8 py-8 sm:py-10 relative overflow-hidden">
      {/* Decorative floating blobs */}
      <div className="absolute top-10 -left-16 w-64 h-64 bg-primary/10 rounded-full blur-3xl animate-float-slow pointer-events-none" />
      <div className="absolute bottom-10 -right-16 w-72 h-72 bg-accent/10 rounded-full blur-3xl animate-float-slow-delayed pointer-events-none" />

      <div className="relative max-w-4xl mx-auto space-y-6 sm:space-y-8">
        {/* Hero */}
        <div
          className="animate-slide-up relative overflow-hidden rounded-2xl px-4 sm:px-6 py-7 sm:py-9 md:py-10 shadow-lg shadow-primary/20"
          style={{
            background:
              "linear-gradient(135deg, #0d1b5e 0%, #1a2d8a 25%, #3d1a6e 55%, #6b1040 80%, #7a0f35 100%)",
          }}
        >
          <div
            className="pointer-events-none absolute -top-24 -right-24 w-72 h-72 rounded-full opacity-20 blur-3xl"
            style={{
              background: "radial-gradient(circle, #FFFFFF, transparent 70%)",
            }}
            aria-hidden="true"
          />
          <HeroIllustration />
          <span className="relative inline-block text-[11px] font-semibold tracking-widest uppercase text-white/60 mb-2">
            Placement Cell
          </span>
          <h1
            className="relative text-xl sm:text-2xl md:text-3xl font-bold text-white tracking-tight"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            Document Requests
          </h1>
          <p className="relative text-sm text-white/75 mt-1.5 max-w-md">
            Request an NOC or LOR in a few clicks, and track exactly where it
            stands — no need to follow up with your coordinator.
          </p>
        </div>

        {/* New Request Form */}
        <div className="animate-slide-up bg-white rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm ring-1 ring-slate-200/70">
          <h2
            className="text-lg sm:text-xl font-semibold text-text-main"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            New Request
          </h2>
          <p className="text-text-muted text-sm mt-1 mb-5 sm:mb-6">
            NOC or LOR, sent in seconds.
          </p>

          <div className="space-y-5">
            {/* Request Type Toggle */}
            <div>
              <label className="block text-sm font-medium text-text-muted mb-2">
                Request Type
              </label>
              <div className="inline-flex bg-slate-100 rounded-lg p-1 gap-1 w-full sm:w-auto">
                {["NOC", "LOR"].map((t) => {
                  const TIcon = TYPE_INFO[t].icon;
                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setType(t)}
                      className={`flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3 sm:px-5 py-2 rounded-md text-sm font-semibold transition-all ${
                        type === t
                          ? "bg-primary text-white shadow"
                          : "text-text-muted hover:text-text-main"
                      }`}
                    >
                      <TIcon size={14} />
                      {t}
                    </button>
                  );
                })}
              </div>

              {/* Clarifying hint so students never have to guess which
                  document they actually need */}
              <div className="flex items-start gap-1.5 mt-2.5 text-xs text-text-muted">
                <Info size={13} className="mt-0.5 flex-shrink-0 text-primary" />
                <span>{activeTypeInfo.hint}</span>
              </div>
            </div>

            {/* Purpose Textarea */}
            <div>
              <label className="block text-sm font-medium text-text-muted mb-2">
                Purpose
              </label>
              <textarea
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                placeholder={type === "NOC" ? NOC_PLACEHOLDER : LOR_PLACEHOLDER}
                rows={4}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base text-text-main placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition resize-none"
              />
              <p className="text-[11px] text-slate-400 mt-1.5">
                Be specific — the company/university name and program help your
                coordinator approve this faster.
              </p>
            </div>

            {/* Proof Upload (Only for NOC) */}
            {type === "NOC" && (
              <div>
                <label className="block text-sm font-medium text-text-muted mb-2">
                  Upload Proof (Required)
                </label>
                <input
                  type="file"
                  accept="image/png, image/jpeg, image/jpg"
                  onChange={(e) => setProofFile(e.target.files[0])}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 sm:px-4 py-2.5 text-sm sm:text-base text-text-main focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                />
                <p className="text-[11px] text-slate-400 mt-1.5">
                  Upload an image (PNG, JPG) as proof for your request.
                </p>
              </div>
            )}

            {error && (
              <div className="flex items-start gap-1.5 text-danger text-sm font-medium bg-danger/5 border border-danger/20 rounded-lg px-3 py-2 break-words">
                <span>{error}</span>
              </div>
            )}

            <button
              onClick={handleSubmit}
              disabled={submitting || !purpose.trim()}
              className="w-full sm:w-auto px-6 py-2.5 rounded-lg font-semibold text-white bg-primary hover:bg-primary/90 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed transition shadow-sm shadow-primary/30"
            >
              {submitting ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Submitting...
                </span>
              ) : (
                `Submit ${type} Request`
              )}
            </button>
          </div>
        </div>

        {/* Request Timeline */}
        <div className="animate-slide-up">
          <h2
            className="text-lg sm:text-xl font-semibold text-text-main mb-4 sm:mb-5"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            Request Timeline
          </h2>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-20 bg-white/60 border border-slate-200/70 rounded-xl animate-pulse"
                />
              ))}
            </div>
          ) : requests.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200/70 text-center py-10 px-4">
              <p className="text-text-muted">No requests yet.</p>
              <p className="text-slate-400 text-sm mt-1">
                Submit your first NOC or LOR request above.
              </p>
            </div>
          ) : (
            <div className="relative pl-5 sm:pl-6">
              {/* vertical line */}
              <div className="absolute left-[5px] top-1.5 bottom-1.5 w-0.5 bg-slate-200" />

              <div className="space-y-4">
                {requests.map((req) => {
                  const cfg =
                    STATUS_CONFIG[req.status] || STATUS_CONFIG.Pending;
                  return (
                    <div key={req._id} className="relative">
                      {/* timeline dot */}
                      <span
                        className={`absolute -left-6 sm:-left-6 top-1.5 w-3.5 h-3.5 rounded-full ring-4 ${cfg.dot} ${cfg.dotRing}`}
                      />

                      <div className="bg-white rounded-xl border border-slate-200/70 p-3.5 sm:p-4 md:p-5">
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 sm:gap-3 mb-1">
                          <span className="text-sm font-semibold text-text-main break-words">
                            {req.type} · {req.purpose}
                          </span>
                          <StatusBadge status={req.status} />
                        </div>

                        <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-slate-400 mb-2">
                          <span>Submitted {formatDate(req.createdAt)}</span>
                          {req.status === "Pending" && (
                            <span className="text-warning font-medium">
                              · awaiting coordinator review
                            </span>
                          )}
                          {req.status === "Approved" && req.updatedAt && (
                            <span className="text-success font-medium">
                              · Approved {formatDate(req.updatedAt)}
                            </span>
                          )}
                          {req.status === "Rejected" && req.updatedAt && (
                            <span className="text-danger font-medium">
                              · Rejected {formatDate(req.updatedAt)}
                            </span>
                          )}
                        </div>

                        {req.status === "Approved" && req.pdfUrl && (
                          <a
                            href={req.pdfUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 text-primary border border-primary/30 hover:bg-primary/20 transition text-xs font-semibold"
                          >
                            <Download size={13} />
                            Download PDF
                          </a>
                        )}

                        {req.status === "Rejected" && (
                          <div className="space-y-1">
                            {req.rejectionReason && (
                              <p className="text-danger text-xs break-words">
                                Reason: {req.rejectionReason}
                              </p>
                            )}
                            {/* Explicit next step so a rejected request
                                doesn't feel like a dead end */}
                            <p className="text-slate-400 text-[11px]">
                              You can submit a new request above with an updated
                              purpose.
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DocumentRequestPage;
