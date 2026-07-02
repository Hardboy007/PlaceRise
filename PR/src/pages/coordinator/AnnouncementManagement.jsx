import { useState, useEffect } from "react";
import { api } from "../../utils/api";

const TYPE_CONFIG = {
  Urgent: {
    border: "border-l-rose-500",
    badge: "bg-rose-100 text-rose-700",
    glow: "#f43f5e",
    icon: (
      <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2a10 10 0 110 20A10 10 0 0112 2zm0 5a1 1 0 00-1 1v5a1 1 0 002 0V8a1 1 0 00-1-1zm0 10a1.25 1.25 0 110-2.5A1.25 1.25 0 0112 17z" />
      </svg>
    ),
  },
  Important: {
    border: "border-l-amber-500",
    badge: "bg-amber-100 text-amber-700",
    glow: "#f59e0b",
    icon: (
      <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
      </svg>
    ),
  },
  General: {
    border: "border-l-sky-500",
    badge: "bg-sky-100 text-sky-700",
    glow: "#0ea5e9",
    icon: (
      <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2a10 10 0 110 20A10 10 0 0112 2zm1 6h-2v6h2V8zm0 8h-2v2h2v-2z" />
      </svg>
    ),
  },
};

const TARGETS = ["All Students", "CSE", "IT", "ECE", "ME", "CE"];
const TYPES = ["General", "Important", "Urgent"];
const EMPTY_FORM = {
  title: "",
  description: "",
  type: "General",
  target: "All Students",
  status: "Draft",
};

export default function AnnouncementManagementPage() {
  const [announcements, setAnnouncements] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  useEffect(() => {
    const fetchAnnouncements = async () => {
      const data = await api.get("/announcements");
      setAnnouncements(Array.isArray(data) ? data : data?.data || []);
    };
    fetchAnnouncements();
  }, []);

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  };
  const openEdit = (ann) => {
    setEditingId(ann.id);
    setForm({
      title: ann.title,
      description: ann.description,
      type: ann.type,
      target: ann.target,
      status: ann.status,
    });
    setModalOpen(true);
  };
  const closeModal = () => {
    setModalOpen(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
  };

  const handleSave = async () => {
    if (!form.title.trim()) return;
    if (editingId !== null) {
      // update baad mein
      closeModal();
    } else {
      const newAnn = await api.post("/announcements", {
        ...form,
        date: new Date().toISOString().split("T")[0],
      });
      setAnnouncements((prev) => [newAnn, ...prev]);
      closeModal();
    }
  };

  const handleDelete = async (id) => {
    await api.delete(`/announcements/${id}`);
    setAnnouncements((prev) => prev.filter((a) => (a.id || a._id) !== id));
    setDeleteConfirm(null);
  };

  const published = announcements.filter(
    (a) => a.status === "Published",
  ).length;
  const draft = announcements.filter((a) => a.status === "Draft").length;

  return (
    <div style={{ fontFamily: "Inter, sans-serif" }}>
      <link
        href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&display=swap"
        rel="stylesheet"
      />

      {/* ── Header ── */}
      <div className="bg-white border-b border-slate-100 px-8 py-4 sticky top-0 z-20">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-[17px] font-bold text-slate-900 tracking-tight">
              Announcement Board
            </h1>
            <div className="flex items-center gap-2 mt-1.5">
              <StatPill bg="bg-slate-100" text="text-slate-500">
                {announcements.length} Total
              </StatPill>
              <StatPill bg="bg-emerald-50" text="text-emerald-700">
                {published} Live
              </StatPill>
              <StatPill bg="bg-amber-50" text="text-amber-700">
                {draft} Draft
              </StatPill>
            </div>
          </div>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 bg-slate-900 hover:bg-slate-700 text-white text-[13px] font-semibold px-4 py-2.5 rounded-xl transition-colors"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              strokeWidth={2.5}
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 4v16m8-8H4"
              />
            </svg>
            New Announcement
          </button>
        </div>
      </div>

      {/* ── Card Feed ── */}
      <div className="max-w-4xl mx-auto px-8 py-7 space-y-3">
        {announcements.length === 0 && (
          <div className="text-center py-24 text-slate-400 text-sm">
            No announcements yet. Create one!
          </div>
        )}

        {announcements.map((ann) => {
          const tc = TYPE_CONFIG[ann.type] || TYPE_CONFIG.General;
          const d = new Date(ann.date);
          return (
            <div
              key={ann.id || ann._id}
              className={`group bg-white rounded-2xl border border-slate-100 border-l-4 ${tc.border} shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200`}
            >
              <div className="flex items-stretch gap-0 px-5 py-4">
                {/* Date stamp */}
                <div className="hidden sm:flex flex-col items-center justify-center w-12 shrink-0 mr-4">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    {d.toLocaleDateString("en-IN", { month: "short" })}
                  </span>
                  <span className="text-[22px] font-bold text-slate-800 leading-none mt-0.5">
                    {d.getDate().toString().padStart(2, "0")}
                  </span>
                </div>

                <div className="hidden sm:block w-px bg-slate-100 mr-5" />

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-1.5 mb-2">
                    <span
                      className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full ${tc.badge}`}
                    >
                      {tc.icon} {ann.type}
                    </span>
                    <span className="text-[11px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                      {ann.target}
                    </span>
                    <span
                      className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                        ann.status === "Published"
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {ann.status === "Published" ? "● Live" : "○ Draft"}
                    </span>
                  </div>
                  <h3 className="text-[14.5px] font-bold text-slate-900 leading-snug">
                    {ann.title}
                  </h3>
                  <p className="text-[13px] text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                    {ann.description}
                  </p>
                </div>

                {/* Action buttons — appear on hover */}
                <div className="flex flex-col justify-center gap-2 ml-4 opacity-0 group-hover:opacity-100 transition-opacity duration-150 shrink-0">
                  <button
                    onClick={() => openEdit(ann)}
                    className="w-8 h-8 flex items-center justify-center rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-500 transition-colors"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2.2}
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z"
                      />
                    </svg>
                  </button>
                  <button
                    onClick={() => setDeleteConfirm(ann.id)}
                    className="w-8 h-8 flex items-center justify-center rounded-lg bg-red-50 hover:bg-red-100 text-red-400 transition-colors"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2.2}
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Modal ── */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
            onClick={closeModal}
          />
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden modal-pop">
            {/* Accent bar — changes colour with type */}
            <div
              className="h-1.5 w-full transition-colors duration-300"
              style={{ background: TYPE_CONFIG[form.type]?.glow ?? "#64748b" }}
            />

            <div className="px-7 py-6 space-y-5">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-[18px] font-bold text-slate-900">
                    {editingId ? "Edit Announcement" : "New Announcement"}
                  </h2>
                  <p className="text-[12px] text-slate-400 mt-0.5">
                    {editingId
                      ? "Edit the fields and save changes"
                      : "Fill in the fields to create"}
                  </p>
                </div>
                <button
                  onClick={closeModal}
                  className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-400 transition-colors"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2.5}
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              {/* Title */}
              <FormField label="Title" required>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. Amazon SDE Drive – 2025 Batch"
                  className="w-full px-4 py-2.5 text-[13.5px] border border-slate-200 rounded-xl outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 placeholder-slate-300 transition-all"
                />
              </FormField>

              {/* Description */}
              <FormField label="Description">
                <textarea
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  placeholder="Describe this announcement..."
                  rows={3}
                  className="w-full px-4 py-2.5 text-[13.5px] border border-slate-200 rounded-xl outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 placeholder-slate-300 resize-none transition-all"
                />
              </FormField>

              {/* Type + Target */}
              <div className="grid grid-cols-2 gap-3">
                <FormField label="Type">
                  <select
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value })}
                    className="w-full px-4 py-2.5 text-[13.5px] border border-slate-200 rounded-xl outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 bg-white transition-all"
                  >
                    {TYPES.map((t) => (
                      <option key={t}>{t}</option>
                    ))}
                  </select>
                </FormField>
                <FormField label="Target">
                  <select
                    value={form.target}
                    onChange={(e) =>
                      setForm({ ...form, target: e.target.value })
                    }
                    className="w-full px-4 py-2.5 text-[13.5px] border border-slate-200 rounded-xl outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 bg-white transition-all"
                  >
                    {TARGETS.map((t) => (
                      <option key={t}>{t}</option>
                    ))}
                  </select>
                </FormField>
              </div>

              {/* Status toggle */}
              <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
                <div>
                  <p className="text-[13px] font-semibold text-slate-700">
                    {form.status === "Published"
                      ? "Live — visible to students"
                      : "Draft — hidden from students"}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Toggle to change
                  </p>
                </div>
                <button
                  onClick={() =>
                    setForm({
                      ...form,
                      status:
                        form.status === "Published" ? "Draft" : "Published",
                    })
                  }
                  className={`relative w-12 h-6 rounded-full transition-colors duration-200 ${
                    form.status === "Published"
                      ? "bg-emerald-500"
                      : "bg-slate-300"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${
                      form.status === "Published" ? "translate-x-6" : ""
                    }`}
                  />
                </button>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
                <button
                  onClick={closeModal}
                  className="px-4 py-2 text-[13px] font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={!form.title.trim()}
                  className="px-5 py-2 text-[13px] font-semibold text-white rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{
                    background: TYPE_CONFIG[form.type]?.glow ?? "#1e293b",
                  }}
                >
                  {editingId ? "Save Changes" : "Create Announcement"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Confirm ── */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
            onClick={() => setDeleteConfirm(null)}
          />
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-sm p-7 text-center modal-pop">
            <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-7 h-7 text-red-500"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.8}
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
                />
              </svg>
            </div>
            <h3 className="text-[17px] font-bold text-slate-900 mb-1">
              Delete this announcement?
            </h3>
            <p className="text-[13px] text-slate-500 mb-6 leading-relaxed">
              This will be permanently removed and cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 py-2.5 text-[13px] font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                className="flex-1 py-2.5 text-[13px] font-semibold text-white bg-red-500 hover:bg-red-600 rounded-xl transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes modal-pop {
          from { opacity: 0; transform: scale(0.95) translateY(12px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
        .modal-pop { animation: modal-pop 0.2s cubic-bezier(0.16,1,0.3,1) forwards; }
      `}</style>
    </div>
  );
}

function StatPill({ bg, text, children }) {
  return (
    <span
      className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${bg} ${text}`}
    >
      {children}
    </span>
  );
}

function FormField({ label, required, children }) {
  return (
    <div>
      <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
        {label}
        {required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}
