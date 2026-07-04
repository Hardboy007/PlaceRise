import { useState, useEffect, useRef, useCallback } from "react";
import { api } from "../../utils/api";
import universityStructure from "../../data/universityStructure";

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

const TYPES = ["General", "Important", "Urgent"];
const HOURS = Array.from({ length: 12 }, (_, i) =>
  String(i + 1).padStart(2, "0"),
); // 01-12
const MINUTES = Array.from({ length: 60 }, (_, i) =>
  String(i).padStart(2, "0"),
); // 00-59
const PERIODS = ["AM", "PM"];

// Short label for a school name, e.g. "School of Engineering & Computing (SoEC)" -> "SoEC"
function schoolShort(name) {
  return name?.match(/\(([^)]+)\)/)?.[1] || name || "";
}

// Flattens every course under a school (across all its departments) into
// a single array. Used both to "select everything" when a school
// checkbox is ticked, and to know what "fully selected" means.
function allCoursesOfSchool(schoolObj) {
  return (schoolObj?.departments || []).flatMap((d) => d.courses || []);
}

// Normalizes whatever shape `target.schools` happens to be into
// `[{ school, courses }]`. Handles the new shape (array of objects),
// the old shape (array of plain school-name strings), and the legacy
// single-`school` field, so old announcements still render/edit fine.
function normalizeTargetSchools(target) {
  if (!target) return [];
  if (Array.isArray(target.schools) && target.schools.length) {
    return target.schools.map((s) =>
      typeof s === "string" ? { school: s, courses: [] } : s,
    );
  }
  if (target.school) return [{ school: target.school, courses: [] }];
  return [];
}

// Human readable summary of who an announcement targets.
function targetLabel(target) {
  if (!target || target.all) return "All Students";
  const schools = normalizeTargetSchools(target);
  if (!schools.length) return "All Students";
  if (schools.length === 1) return schoolShort(schools[0].school);
  return `${schools.length} Schools`;
}

// Parses a "YYYY-MM-DD" date string as LOCAL time (avoids the classic
// `new Date("2026-10-09")` UTC-parsing bug that can shift the day back
// by one depending on the user's timezone) and returns "Monday, 09/10/2026".
function formatDayDate(dateStr) {
  if (!dateStr) return "—";
  const [y, m, d] = dateStr.split("-").map(Number);
  if (!y || !m || !d) return "—";
  const dt = new Date(y, m - 1, d);
  if (isNaN(dt)) return "—";
  const day = dt.toLocaleDateString("en-IN", { weekday: "long" });
  const dd = String(d).padStart(2, "0");
  const mm = String(m).padStart(2, "0");
  return `${day}, ${dd}/${mm}/${y}`;
}

// Splits a stored time string into 12hr picker parts. Handles both the
// new "hh:mm AM/PM" format and legacy 24hr "HH:mm" values so old
// announcements still edit correctly.
function to12HourParts(timeStr) {
  if (!timeStr) return null;
  const ampm = timeStr.match(/^(\d{1,2}):(\d{2})\s?(AM|PM)$/i);
  if (ampm) {
    return {
      hour: ampm[1].padStart(2, "0"),
      minute: ampm[2],
      period: ampm[3].toUpperCase(),
    };
  }
  const legacy = timeStr.match(/^(\d{1,2}):(\d{2})$/);
  if (legacy) {
    let h = Number(legacy[1]);
    const period = h >= 12 ? "PM" : "AM";
    let hour12 = h % 12;
    if (hour12 === 0) hour12 = 12;
    return { hour: String(hour12).padStart(2, "0"), minute: legacy[2], period };
  }
  return null;
}

function formatTime12(hour, minute, period) {
  return `${hour}:${minute} ${period}`;
}

function defaultDateTime() {
  const now = new Date();
  const date = now.toISOString().split("T")[0];
  let h = now.getHours();
  const period = h >= 12 ? "PM" : "AM";
  let hour12 = h % 12;
  if (hour12 === 0) hour12 = 12;
  const minute = String(now.getMinutes()).padStart(2, "0");
  return { date, hour: String(hour12).padStart(2, "0"), minute, period };
}

// Unwraps whatever envelope shape the backend happens to respond with
// (`{data:{...}}`, `{announcement:{...}}`, or the plain object itself)
// so callers always get the real announcement fields. Previously this
// only handled `{data:{...}}` — if the API used a different key the
// unwrapped object came back with no title/date/type at all, which is
// why some cards were rendering blank.
function unwrap(res) {
  if (!res || typeof res !== "object") return res;
  if ("data" in res && res.data && typeof res.data === "object") {
    return unwrap(res.data);
  }
  if (
    "announcement" in res &&
    res.announcement &&
    typeof res.announcement === "object"
  ) {
    return res.announcement;
  }
  return res;
}

// Same idea but for list responses.
function unwrapList(res) {
  if (Array.isArray(res)) return res;
  if (!res || typeof res !== "object") return [];
  if (Array.isArray(res.data)) return res.data;
  if (Array.isArray(res.announcements)) return res.announcements;
  return [];
}

// The backend's id field name isn't guaranteed to be `id` or `_id` —
// this checks every common variant. Getting this wrong is exactly what
// caused "delete" to wipe out every card: when the id resolves to
// `undefined` for every item, the filter `x !== undefined` is false for
// ALL of them, so everything gets removed instead of just the one row.
function getAnnId(ann) {
  return ann?.id ?? ann?._id ?? ann?.announcementId ?? ann?.uuid ?? null;
}

const EMPTY_FORM = {
  title: "",
  description: "",
  type: "General",
  targetAll: true,
  // { [schoolName]: string[] of selected course names under that school }
  targetSelections: {},
  room: "",
  ...defaultDateTime(),
};

// Live current date + time, ticks every second so it rolls over to the
// next day/minute on its own without needing a page refresh.
function useLiveClock() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return now;
}

function LiveDateTimeBar() {
  const now = useLiveClock();
  const dayDate = now.toLocaleDateString("en-IN", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
  const time = now.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  return (
    <div className="max-w-4xl mx-auto px-8 pb-4">
      <div className="flex items-center justify-center gap-2 text-[12.5px] font-semibold text-slate-500 bg-slate-50 border border-slate-100 rounded-xl px-4 py-2.5">
        <svg
          className="w-3.5 h-3.5 text-slate-400"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <span>{dayDate}</span>
        <span className="text-slate-300">•</span>
        <span className="tabular-nums">{time}</span>
      </div>
    </div>
  );
}

export default function AnnouncementManagementPage() {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Pulled out so it can be re-run after create/update/delete. Re-fetching
  // from the server (instead of patching local state with whatever the
  // mutation endpoint happened to return) guarantees the cards always show
  // exactly what's actually saved — this is what fixes the "I filled in
  // details but nothing shows" bug, since it no longer matters how the
  // backend shapes its create/update response.
  const fetchAnnouncements = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const data = await api.get("/announcements");
      setAnnouncements(unwrapList(data));
    } catch (err) {
      console.error("Failed to load announcements:", err);
      setError("Could not load announcements. Please refresh the page.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnnouncements();
  }, [fetchAnnouncements]);

  const openCreate = () => {
    setEditingId(null);
    setForm({ ...EMPTY_FORM, ...defaultDateTime() });
    setModalOpen(true);
  };

  const openEdit = (ann) => {
    const id = getAnnId(ann);
    setEditingId(id);
    const dt = defaultDateTime();
    const parts = to12HourParts(ann.time) || {
      hour: dt.hour,
      minute: dt.minute,
      period: dt.period,
    };

    // Rebuild the { school: [courses] } selection map from whatever the
    // server stored. Legacy / whole-school entries (no explicit course
    // list) are expanded to every course under that school so the UI
    // shows the school as fully ticked.
    const schools = normalizeTargetSchools(ann.target);
    const targetSelections = {};
    schools.forEach(({ school, courses }) => {
      if (courses && courses.length) {
        targetSelections[school] = courses;
      } else {
        const schoolObj = universityStructure.find((s) => s.school === school);
        targetSelections[school] = allCoursesOfSchool(schoolObj);
      }
    });

    setForm({
      title: ann.title || "",
      description: ann.description || "",
      type: ann.type || "General",
      targetAll: ann.target?.all ?? true,
      targetSelections,
      room: ann.room || "",
      date: ann.date || dt.date,
      hour: parts.hour,
      minute: parts.minute,
      period: parts.period,
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
  };

  const updateForm = (patch) => setForm((prev) => ({ ...prev, ...patch }));

  // Title AND description are both required by the backend schema
  // (Announcement.description has `required: true`). Previously only
  // title was validated on the frontend — leaving description blank
  // made Mongoose reject the create on the server, but since api.js
  // didn't throw on non-2xx responses, that failure was silently
  // swallowed and the modal just closed as if it had worked. Validating
  // both fields here stops the broken request from ever being sent.
  const isFormValid = form.title.trim() && form.description.trim();

  const handleSave = async () => {
    if (!isFormValid || saving) return;
    setSaving(true);
    setError("");

    // Only include schools that actually have at least one course
    // selected. Each entry always carries its explicit course list —
    // whether that's "all courses" (whole school ticked) or a partial
    // subset — so there's no ambiguity on the reading side (student
    // dashboard) about what "selecting a school" means.
    const schoolsPayload = Object.entries(form.targetSelections)
      .filter(([, courses]) => courses && courses.length > 0)
      .map(([school, courses]) => ({ school, courses }));

    const payload = {
      title: form.title,
      description: form.description,
      type: form.type,
      status: "Published",
      target: form.targetAll
        ? { all: true, schools: [] }
        : { all: false, schools: schoolsPayload },
      room: form.room,
      date: form.date,
      time: formatTime12(form.hour, form.minute, form.period),
    };

    try {
      let savedAnnouncement = null;
      if (editingId !== null) {
        savedAnnouncement = unwrap(await api.put(`/announcements/${editingId}`, payload));
      } else {
        savedAnnouncement = unwrap(await api.post("/announcements", payload));
      }

      if (savedAnnouncement) {
        const savedId = getAnnId(savedAnnouncement);
        setAnnouncements((prev) => {
          if (!savedId) return [savedAnnouncement, ...prev];
          const exists = prev.some((item) => getAnnId(item) === savedId);
          if (exists) {
            return prev.map((item) =>
              getAnnId(item) === savedId ? savedAnnouncement : item,
            );
          }
          return [savedAnnouncement, ...prev];
        });
      }

      // Re-fetch so the list is always the source of truth from the server.
      await fetchAnnouncements();
      closeModal();
    } catch (err) {
      console.error("Failed to save announcement:", err);
      // api.js now throws on non-2xx responses with the backend's actual
      // message (e.g. a Mongoose validation error), so show that instead
      // of a generic string whenever we have one.
      setError(
        err.message || "Could not save the announcement. Please try again.",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    // Guard against the "delete everything" bug: if we can't resolve a
    // real id for this card, refuse to call the delete endpoint at all
    // instead of silently deleting the wrong (or every) row.
    if (id === null || id === undefined) {
      console.error(
        "Refusing to delete: this announcement has no resolvable id.",
      );
      setError(
        "Couldn't identify this announcement to delete it. Please refresh and try again.",
      );
      setDeleteConfirm(null);
      return;
    }
    setDeletingId(id);
    try {
      await api.delete(`/announcements/${id}`);
      await fetchAnnouncements();
    } catch (err) {
      console.error("Failed to delete announcement:", err);
      setError(
        err.message || "Could not delete the announcement. Please try again.",
      );
    } finally {
      setDeletingId(null);
      setDeleteConfirm(null);
    }
  };

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
            <h1
              className="text-[18px] font-extrabold tracking-tight"
              style={{ color: "#0f172a" }}
            >
              Announcement Board
            </h1>
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

      {/* ── Error banner ── */}
      {error && (
        <div className="max-w-4xl mx-auto px-8 pt-4">
          <div className="flex items-center justify-between gap-3 text-[12.5px] font-semibold text-rose-600 bg-rose-50 border border-rose-100 rounded-xl px-4 py-2.5">
            <span>{error}</span>
            <button
              onClick={() => setError("")}
              className="text-rose-400 hover:text-rose-600"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* ── Live date/time bar, ticks every second so it rolls to the next day on its own ── */}
      <LiveDateTimeBar />

      {/* ── Card Feed ── */}
      <div className="max-w-4xl mx-auto px-8 pb-7 space-y-3">
        {loading && announcements.length === 0 && (
          <div className="text-center py-24 text-slate-400 text-sm">
            Loading announcements…
          </div>
        )}

        {!loading && announcements.length === 0 && (
          <div className="text-center py-24 text-slate-400 text-sm">
            No announcements yet. Create one!
          </div>
        )}

        {announcements.map((ann) => {
          const id = getAnnId(ann);
          const tc = TYPE_CONFIG[ann.type] || TYPE_CONFIG.General;
          const isDeleting = deletingId === id;
          return (
            <div
              key={id ?? `${ann.title}-${ann.date}-${ann.time}`}
              className={`group bg-white rounded-2xl border border-slate-100 border-l-4 ${tc.border} shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 ${isDeleting ? "opacity-40" : ""}`}
            >
              <div className="flex items-stretch gap-0 px-5 py-4">
                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-1.5 mb-2">
                    <span
                      className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full ${tc.badge}`}
                    >
                      {tc.icon} {ann.type || "General"}
                    </span>
                    <span className="text-[11px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                      {targetLabel(ann.target)}
                    </span>
                    {ann.room && (
                      <span className="text-[11px] font-medium text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                        📍 {ann.room}
                      </span>
                    )}
                    {/* Date/time badge — always visible now (previously only
                        shown on mobile, since there used to be a separate
                        date-stamp column on desktop; that column was removed
                        so this is now the only place date/time is shown). */}
                    <span className="text-[11px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                      {formatDayDate(ann.date)}
                      {ann.time ? ` · ${ann.time}` : ""}
                    </span>
                  </div>
                  <h3 className="text-[14.5px] font-bold text-slate-900 leading-snug">
                    {ann.title || "(untitled announcement)"}
                  </h3>
                  {ann.description && (
                    <p className="text-[13px] text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                      {ann.description}
                    </p>
                  )}
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
                    onClick={() => setDeleteConfirm(id)}
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
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden modal-pop max-h-[90vh] flex flex-col">
            {/* Accent bar — changes colour with type */}
            <div
              className="h-1.5 w-full shrink-0 transition-colors duration-300"
              style={{ background: TYPE_CONFIG[form.type]?.glow ?? "#64748b" }}
            />

            <div className="px-7 py-6 space-y-5 overflow-y-auto">
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
                  onChange={(e) => updateForm({ title: e.target.value })}
                  placeholder="e.g. Amazon SDE Drive – 2025 Batch"
                  className="w-full px-4 py-2.5 text-[13.5px] border border-slate-200 rounded-xl outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 placeholder-slate-300 transition-all"
                />
              </FormField>

              {/* Description — required by the backend schema, so marked
                  required here too and validated before the request is sent */}
              <FormField label="Description" required>
                <textarea
                  value={form.description}
                  onChange={(e) => updateForm({ description: e.target.value })}
                  placeholder="Describe this announcement..."
                  rows={3}
                  className="w-full px-4 py-2.5 text-[13.5px] border border-slate-200 rounded-xl outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 placeholder-slate-300 resize-none transition-all"
                />
              </FormField>

              {/* Room / Venue */}
              <FormField label="Room / Venue">
                <input
                  type="text"
                  value={form.room}
                  onChange={(e) => updateForm({ room: e.target.value })}
                  placeholder="e.g. 1012, SOMC Building, First Floor"
                  className="w-full px-4 py-2.5 text-[13.5px] border border-slate-200 rounded-xl outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 placeholder-slate-300 transition-all"
                />
              </FormField>

              {/* Type + Date */}
              <div className="grid grid-cols-2 gap-3">
                <FormField label="Type">
                  <select
                    value={form.type}
                    onChange={(e) => updateForm({ type: e.target.value })}
                    className="w-full px-3 py-2.5 text-[13.5px] border border-slate-200 rounded-xl outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 bg-white transition-all"
                  >
                    {TYPES.map((t) => (
                      <option key={t}>{t}</option>
                    ))}
                  </select>
                </FormField>
                <FormField label="Date">
                  <input
                    type="date"
                    value={form.date}
                    onChange={(e) => updateForm({ date: e.target.value })}
                    className="w-full px-3 py-2.5 text-[13.5px] border border-slate-200 rounded-xl outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 bg-white transition-all"
                  />
                </FormField>
              </div>

              {/* Time — 12hr with AM/PM (cycles 1-12, not 0-23) */}
              <FormField label="Time">
                <div className="grid grid-cols-3 gap-2">
                  <select
                    value={form.hour}
                    onChange={(e) => updateForm({ hour: e.target.value })}
                    className="w-full px-3 py-2.5 text-[13.5px] border border-slate-200 rounded-xl outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 bg-white transition-all"
                  >
                    {HOURS.map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                  <select
                    value={form.minute}
                    onChange={(e) => updateForm({ minute: e.target.value })}
                    className="w-full px-3 py-2.5 text-[13.5px] border border-slate-200 rounded-xl outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 bg-white transition-all"
                  >
                    {MINUTES.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                  <select
                    value={form.period}
                    onChange={(e) => updateForm({ period: e.target.value })}
                    className="w-full px-3 py-2.5 text-[13.5px] border border-slate-200 rounded-xl outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 bg-white transition-all"
                  >
                    {PERIODS.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>
              </FormField>

              {/* Target Audience — All, or expand a school to tick individual
                  courses. Ticking a school ticks all its courses; ticking
                  just a course leaves the rest of the school untouched. */}
              <TargetAudience
                targetAll={form.targetAll}
                targetSelections={form.targetSelections}
                onChange={updateForm}
              />

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
                  disabled={!isFormValid || saving}
                  className="px-5 py-2 text-[13px] font-semibold text-white rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{
                    background: TYPE_CONFIG[form.type]?.glow ?? "#1e293b",
                  }}
                >
                  {saving
                    ? "Saving…"
                    : editingId
                      ? "Save Changes"
                      : "Create Announcement"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Confirm ── */}
      {deleteConfirm !== null && (
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

// ── Target Audience: All Students, or expand a school to see its
// departments/courses and tick them individually.
//
// Behaviour:
// - Ticking the SCHOOL checkbox selects every course under it in one go.
// - Unticking the SCHOOL checkbox clears every course under it.
// - Ticking/unticking an individual COURSE only affects that course —
//   e.g. picking just 2 out of SoEC's 5 courses leaves the other 3 untouched
//   and the school checkbox shows as partially selected (indeterminate).
// - Only ONE school's dropdown stays open at a time.
function TargetAudience({ targetAll, targetSelections, onChange }) {
  const [expandedSchool, setExpandedSchool] = useState(null);

  const setAll = (checked) => {
    onChange({
      targetAll: checked,
      targetSelections: checked ? {} : targetSelections,
    });
  };

  const isSchoolFullySelected = (schoolObj) => {
    const selected = targetSelections[schoolObj.school] || [];
    const total = allCoursesOfSchool(schoolObj);
    return total.length > 0 && selected.length === total.length;
  };

  const isSchoolPartiallySelected = (schoolObj) => {
    const selected = targetSelections[schoolObj.school] || [];
    return selected.length > 0 && !isSchoolFullySelected(schoolObj);
  };

  const toggleSchool = (schoolObj) => {
    const fully = isSchoolFullySelected(schoolObj);
    const next = { ...targetSelections };
    if (fully) {
      delete next[schoolObj.school];
    } else {
      next[schoolObj.school] = allCoursesOfSchool(schoolObj);
    }
    onChange({ targetAll: false, targetSelections: next });
  };

  const toggleCourse = (school, course) => {
    const current = targetSelections[school] || [];
    const next = { ...targetSelections };
    if (current.includes(course)) {
      const updated = current.filter((c) => c !== course);
      if (updated.length) next[school] = updated;
      else delete next[school];
    } else {
      next[school] = [...current, course];
    }
    onChange({ targetAll: false, targetSelections: next });
  };

  const toggleExpand = (school) => {
    setExpandedSchool((prev) => (prev === school ? null : school));
  };

  const selectAllSchools = () => {
    const next = {};
    universityStructure.forEach((s) => {
      next[s.school] = allCoursesOfSchool(s);
    });
    onChange({ targetAll: false, targetSelections: next });
  };

  const selectedSchoolCount = Object.values(targetSelections).filter(
    (courses) => courses && courses.length > 0,
  ).length;

  return (
    <div>
      <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
        Target Audience
      </label>

      <label className="flex items-center gap-2.5 px-3.5 py-2.5 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors">
        <input
          type="checkbox"
          checked={targetAll}
          onChange={(e) => setAll(e.target.checked)}
          className="w-4 h-4 accent-slate-900"
        />
        <span className="text-[13px] font-semibold text-slate-700">
          All Students
        </span>
      </label>

      {!targetAll && (
        <div className="mt-2.5 border border-slate-200 rounded-xl p-3 max-h-72 overflow-y-auto">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10.5px] font-bold text-slate-400 uppercase tracking-widest">
              Schools
              {selectedSchoolCount > 0 && ` (${selectedSchoolCount})`}
            </span>
            <button
              type="button"
              onClick={selectAllSchools}
              className="text-[11px] font-semibold text-indigo-500 hover:underline"
            >
              Select all
            </button>
          </div>

          <div className="space-y-0.5">
            {universityStructure.map((s) => {
              const isExpanded = expandedSchool === s.school;
              const departments = s.departments || [];
              const selectedCourses = targetSelections[s.school] || [];
              const fully = isSchoolFullySelected(s);
              const partial = isSchoolPartiallySelected(s);

              return (
                <div key={s.school} className="rounded-lg overflow-hidden">
                  <div className="flex items-center gap-2.5 px-1 py-1.5 text-[13px] text-slate-700 hover:bg-slate-50 rounded-lg transition-colors">
                    <SchoolCheckbox
                      checked={fully}
                      indeterminate={partial}
                      onChange={() => toggleSchool(s)}
                    />
                    <span
                      className="flex-1 cursor-pointer"
                      onClick={() => toggleSchool(s)}
                    >
                      {s.school}
                      {partial && (
                        <span className="ml-1.5 text-[10.5px] font-semibold text-indigo-500">
                          ({selectedCourses.length}/
                          {allCoursesOfSchool(s).length})
                        </span>
                      )}
                    </span>
                    {departments.length > 0 && (
                      <button
                        type="button"
                        onClick={() => toggleExpand(s.school)}
                        className="w-6 h-6 flex items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors shrink-0"
                      >
                        <svg
                          className={`w-3.5 h-3.5 transition-transform duration-200 ${
                            isExpanded ? "rotate-180" : ""
                          }`}
                          fill="none"
                          stroke="currentColor"
                          strokeWidth={2.5}
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M19 9l-7 7-7-7"
                          />
                        </svg>
                      </button>
                    )}
                  </div>

                  {/* Expanded course list — tick individual courses to
                      target only part of a school. The school checkbox
                      above stays in sync automatically (checked when
                      every course is picked, dash/indeterminate when
                      only some are). */}
                  {isExpanded && departments.length > 0 && (
                    <div className="ml-8 mb-1.5 pl-3 border-l-2 border-slate-100 space-y-2">
                      {departments.map((dept) => (
                        <div key={dept.name}>
                          <div className="text-[11px] font-bold text-slate-500 mb-1">
                            {dept.name}
                          </div>
                          <div className="flex flex-wrap gap-x-3 gap-y-1.5">
                            {(dept.courses || []).map((c) => (
                              <label
                                key={c}
                                className="flex items-center gap-1.5 cursor-pointer"
                              >
                                <input
                                  type="checkbox"
                                  checked={selectedCourses.includes(c)}
                                  onChange={() => toggleCourse(s.school, c)}
                                  className="w-3.5 h-3.5 accent-indigo-500"
                                />
                                <span className="text-[11.5px] text-slate-600">
                                  {c}
                                </span>
                              </label>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// Native checkboxes can't express an indeterminate (dash) state through
// props — it has to be set imperatively on the DOM node via a ref.
function SchoolCheckbox({ checked, indeterminate, onChange }) {
  const ref = useRef(null);
  useEffect(() => {
    if (ref.current) ref.current.indeterminate = indeterminate && !checked;
  }, [indeterminate, checked]);
  return (
    <input
      ref={ref}
      type="checkbox"
      checked={checked}
      onChange={onChange}
      className="w-4 h-4 accent-indigo-500 shrink-0"
    />
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

