import { useState, useEffect } from "react";
import { api } from "../../utils/api";

const NOC_PLACEHOLDER =
  "e.g. Appearing for campus recruitment at [Company Name]";
const LOR_PLACEHOLDER =
  "e.g. Applying for Masters program at [University Name]";

const StatusBadge = ({ status }) => {
  const styles = {
    Pending: "bg-amber-500/15 text-amber-400 border-amber-500/30",
    Approved: "bg-green-500/15 text-green-400 border-green-500/30",
    Rejected: "bg-red-500/15 text-red-400 border-red-500/30",
  };
  return (
    <span
      className={`px-3 py-1 rounded-full text-xs font-medium border ${
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
    <div className="min-h-screen bg-gray-950 text-white px-4 md:px-8 py-10 space-y-10">
      {/* Heading */}
      <div>
        <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">
          Document Requests
        </h1>
        <p className="text-gray-400 mt-1">
          Request NOC or LOR and track their status.
        </p>
      </div>

      {/* New Request Form */}
      <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 md:p-8 shadow-lg">
        <h2 className="text-xl font-semibold mb-5">New Request</h2>

        <div className="space-y-5">
          {/* Request Type Dropdown */}
          <div>
            <label className="block text-sm text-gray-400 mb-2">
              Request Type
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full md:w-64 bg-gray-900 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition"
            >
              <option value="NOC">NOC</option>
              <option value="LOR">LOR</option>
            </select>
          </div>

          {/* Purpose Textarea */}
          <div>
            <label className="block text-sm text-gray-400 mb-2">Purpose</label>
            <textarea
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              placeholder={type === "NOC" ? NOC_PLACEHOLDER : LOR_PLACEHOLDER}
              rows={4}
              className="w-full bg-gray-900 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition resize-none"
            />
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="px-6 py-2.5 rounded-lg font-medium bg-gradient-to-r from-cyan-500 to-purple-600 hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition"
          >
            {submitting ? "Submitting..." : "Submit Request"}
          </button>
        </div>
      </div>

      {/* My Requests Table */}
      <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 md:p-8 shadow-lg overflow-x-auto">
        <h2 className="text-xl font-semibold mb-5">My Requests</h2>

        {loading ? (
          <p className="text-gray-400">Loading requests...</p>
        ) : requests.length === 0 ? (
          <p className="text-gray-400">No requests yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-400 border-b border-white/10">
                <th className="pb-3 pr-4">Type</th>
                <th className="pb-3 pr-4">Purpose</th>
                <th className="pb-3 pr-4">Date</th>
                <th className="pb-3 pr-4">Status</th>
                <th className="pb-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((req) => (
                <tr
                  key={req._id}
                  className="border-b border-white/5 hover:bg-white/5 transition"
                >
                  <td className="py-3 pr-4 font-medium">{req.type}</td>
                  <td className="py-3 pr-4 text-gray-300 max-w-xs">
                    <span className="line-clamp-2">{req.purpose}</span>
                    {req.status === "Rejected" && req.rejectionReason && (
                      <p className="text-red-400 text-xs mt-1">
                        Reason: {req.rejectionReason}
                      </p>
                    )}
                  </td>
                  <td className="py-3 pr-4 text-gray-400">
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
                        className="px-3 py-1.5 rounded-lg bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-500/25 transition text-xs font-medium"
                      >
                        Download PDF
                      </a>
                    ) : (
                      <span className="text-gray-600 text-xs">-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default DocumentRequestPage;
