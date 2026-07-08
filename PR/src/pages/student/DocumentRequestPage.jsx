import { useState, useEffect } from "react";
import { api } from "../../utils/api";

const NOC_PLACEHOLDER =
  "e.g. Appearing for campus recruitment at [Company Name]";
const LOR_PLACEHOLDER =
  "e.g. Applying for Masters program at [University Name]";

const StatusBadge = ({ status }) => {
  const styles = {
    Pending: "bg-warning/10 text-warning border-warning/30",
    Approved: "bg-success/10 text-success border-success/30",
    Rejected: "bg-danger/10 text-danger border-danger/30",
  };
  return (
    <span
      className={`px-3 py-1 rounded-full text-xs font-semibold border ${
        styles[status] || styles.Pending
      }`}
    >
      {status}
    </span>
  );
};

const DocumentRequestPage = () => {
  const [requests, setRequests] = useState([]);
  const [type, setType] = useState("NOC");
  const [purpose, setPurpose] = useState("");
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
    setSubmitting(true);
    try {
      const newRequest = await api.post("/noc", { type, purpose });
      setRequests((prev) => [newRequest, ...prev]);
      setPurpose("");
    } catch (err) {
      console.error(err);
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

  return (
    <div className="min-h-screen bg-background px-4 md:px-8 py-10 relative overflow-hidden">
      {/* Decorative floating blobs */}
      <div className="absolute top-10 -left-16 w-64 h-64 bg-primary/10 rounded-full blur-3xl animate-float-slow pointer-events-none" />
      <div className="absolute bottom-10 -right-16 w-72 h-72 bg-accent/10 rounded-full blur-3xl animate-float-slow-delayed pointer-events-none" />

      <div className="relative max-w-5xl mx-auto space-y-8">
        {/* Heading */}
        <div className="animate-slide-up">
          <h1
            className="text-3xl md:text-4xl font-bold text-text-main"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            Document Requests
          </h1>
          <p className="text-text-muted mt-1">
            Request an NOC or LOR and track their status here.
          </p>
        </div>

        {/* New Request Form */}
        <div className="animate-slide-up bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-slate-200/70">
          <h2
            className="text-xl font-semibold text-text-main mb-5"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            New Request
          </h2>

          <div className="space-y-5">
            {/* Request Type Toggle */}
            <div>
              <label className="block text-sm font-medium text-text-muted mb-2">
                Request Type
              </label>
              <div className="inline-flex bg-slate-100 rounded-lg p-1 gap-1">
                {["NOC", "LOR"].map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setType(t)}
                    className={`px-5 py-2 rounded-md text-sm font-semibold transition-all ${
                      type === t
                        ? "bg-primary text-white shadow"
                        : "text-text-muted hover:text-text-main"
                    }`}
                  >
                    {t}
                  </button>
                ))}
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
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-text-main placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition resize-none"
              />
            </div>

            {error && (
              <p className="text-danger text-sm font-medium">{error}</p>
            )}

            <button
              onClick={handleSubmit}
              disabled={submitting || !purpose.trim()}
              className="relative px-6 py-2.5 rounded-lg font-semibold text-white bg-primary hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition shadow-sm"
            >
              {submitting ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Submitting...
                </span>
              ) : (
                "Submit Request"
              )}
            </button>
          </div>
        </div>

        {/* My Requests Table */}
        <div className="animate-slide-up bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-slate-200/70 overflow-x-auto">
          <h2
            className="text-xl font-semibold text-text-main mb-5"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            My Requests
          </h2>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-12 bg-slate-100 rounded-lg animate-pulse"
                />
              ))}
            </div>
          ) : requests.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-text-muted">No requests yet.</p>
              <p className="text-slate-400 text-sm mt-1">
                Submit your first NOC or LOR request above.
              </p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-text-muted border-b border-slate-200">
                  <th className="pb-3 pr-4 font-medium">Type</th>
                  <th className="pb-3 pr-4 font-medium">Purpose</th>
                  <th className="pb-3 pr-4 font-medium">Date</th>
                  <th className="pb-3 pr-4 font-medium">Status</th>
                  <th className="pb-3 font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((req) => (
                  <tr
                    key={req._id}
                    className="border-b border-slate-100 hover:bg-slate-50 transition"
                  >
                    <td className="py-3 pr-4 font-semibold text-text-main">
                      {req.type}
                    </td>
                    <td className="py-3 pr-4 text-text-muted max-w-xs">
                      <span className="line-clamp-2">{req.purpose}</span>
                      {req.status === "Rejected" && req.rejectionReason && (
                        <p className="text-danger text-xs mt-1">
                          Reason: {req.rejectionReason}
                        </p>
                      )}
                    </td>
                    <td className="py-3 pr-4 text-text-muted">
                      {formatDate(req.createdAt)}
                    </td>
                    <td className="py-3 pr-4">
                      <StatusBadge status={req.status} />
                    </td>
                    <td className="py-3">
                      {req.status === "Approved" && req.pdfUrl ? (
                        <a
                          href={req.pdfUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 rounded-lg bg-primary/10 text-primary border border-primary/30 hover:bg-primary/20 transition text-xs font-semibold"
                        >
                          Download PDF
                        </a>
                      ) : (
                        <span className="text-slate-300 text-xs">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default DocumentRequestPage;
