import { useState, useEffect } from "react";
import { api } from "../../utils/api";
import { X, Mail, Phone, User, Briefcase } from "lucide-react";

export default function ContactCellModal({ onClose }) {
  const [coordinators, setCoordinators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchContacts = async () => {
      try {
        const data = await api.get("/coordinators/contact");
        setCoordinators(Array.isArray(data) ? data : []);
      } catch (err) {
        setError("Could not load coordinator contact info.");
      }
      setLoading(false);
    };
    fetchContacts();
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-background">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center">
              <User size={16} className="text-primary" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#1E293B]">
                Placement Cell Contacts
              </h2>
              <p className="text-xs text-[#94A3B8] mt-0.5">
                Reach out for guidance
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg bg-background flex items-center justify-center hover:bg-[#E2E8F0] transition-colors"
          >
            <X size={14} className="text-text-muted" />
          </button>
        </div>

        <div className="p-5 flex flex-col gap-3 max-h-[60vh] overflow-y-auto">
          {loading && (
            <p className="text-sm text-[#94A3B8] text-center py-6">
              Loading contacts...
            </p>
          )}

          {!loading && error && (
            <p className="text-sm text-red-500 text-center py-6">{error}</p>
          )}

          {!loading && !error && coordinators.length === 0 && (
            <p className="text-sm text-[#94A3B8] text-center py-6">
              No coordinator contacts available right now.
            </p>
          )}

          {!loading &&
            !error &&
            coordinators.map((c) => (
              <div
                key={c._id}
                className="rounded-xl border border-[#E2E8F0] p-4 bg-[#F8FAFC]"
              >
                <p className="text-sm font-bold text-[#1E293B]">{c.name}</p>
                <p className="text-xs text-text-muted flex items-center gap-1.5 mt-0.5">
                  <Briefcase size={12} />
                  {c.designation}
                  {c.department ? ` · ${c.department}` : ""}
                </p>

                <div className="flex flex-col gap-1.5 mt-3">
                  <a
                    href={`mailto:${c.email}`}
                    className="flex items-center gap-2 text-xs font-medium text-primary hover:underline"
                  >
                    <Mail size={13} /> {c.email}
                  </a>
                  {c.phone && (
                    <a
                      href={`tel:${c.phone}`}
                      className="flex items-center gap-2 text-xs font-medium text-primary hover:underline"
                    >
                      <Phone size={13} /> {c.phone}
                    </a>
                  )}
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
