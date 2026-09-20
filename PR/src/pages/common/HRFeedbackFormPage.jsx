import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import universityStructure from "../../data/universityStructure";

const ROUNDS = ["Aptitude", "Technical", "Coding", "GD", "HR", "Managerial"];
const RESULTS = ["Selected", "Rejected", "On Hold"];
const REJECTION_REASONS = [
  "Weak technical/DSA",
  "Poor communication",
  "Lack of confidence",
  "Weak project knowledge",
  "Behavioral fit",
  "Other",
];
const RATING_FIELDS = [
  { key: "technical", label: "Technical / DSA knowledge" },
  { key: "communication", label: "Communication & confidence" },
  { key: "problemSolving", label: "Problem-solving approach" },
];

function RatingInput({ value, onChange }) {
  return (
    <div className="flex gap-2">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          className={`w-10 h-10 rounded-xl text-sm font-semibold border transition-colors cursor-pointer ${
            value === n
              ? "bg-primary text-white border-primary"
              : "bg-white text-text-muted border-[#CBD5E1] hover:border-primary"
          }`}
        >
          {n}
        </button>
      ))}
    </div>
  );
}

const emptyForm = {
  school: "",
  course: "",
  feedbackType: "Individual",
  studentIdentifier: "",
  round: "",
  result: "",
  ratings: { technical: 0, communication: 0, problemSolving: 0 },
  overallRating: 0,
  candidatesInterviewed: "",
  rejectionReasons: [],
  otherReasonNote: "",
  oneLineFeedback: "",
  recurringIssue: "",
  recommendForFuture: null,
};

export default function HRFeedbackFormPage() {
  const navigate = useNavigate();
  const [companyName, setCompanyName] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    document.title = "HR Feedback — PlaceRise"
    const token = sessionStorage.getItem("hrGuestToken");
    const company = sessionStorage.getItem("hrGuestCompany");
    if (!token || !company) {
      navigate("/hr-login");
      return;
    }
    setCompanyName(company);
  }, [navigate]);

  const availableCourses = form.school
    ? (
        universityStructure.find((s) => s.school === form.school)
          ?.departments || []
      ).flatMap((d) => d.courses || [])
    : [];

  const update = (patch) => setForm((f) => ({ ...f, ...patch }));

  const toggleReason = (reason) => {
    const has = form.rejectionReasons.includes(reason);
    update({
      rejectionReasons: has
        ? form.rejectionReasons.filter((r) => r !== reason)
        : [...form.rejectionReasons, reason],
    });
  };

  const isIndividual = form.feedbackType === "Individual";

  const isValid =
    form.school &&
    form.course &&
    form.round &&
    form.oneLineFeedback.trim() &&
    (isIndividual
      ? form.studentIdentifier.trim() &&
        form.result &&
        form.ratings.technical &&
        form.ratings.communication &&
        form.ratings.problemSolving
      : form.overallRating);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!isValid) {
      setError("Please fill in all required fields before submitting.");
      return;
    }

    setSubmitting(true);
    try {
      const BASE_URL =
        import.meta.env.VITE_API_URL || "http://localhost:5000/api";
      const res = await fetch(`${BASE_URL}/hr-feedback/submit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sessionStorage.getItem("hrGuestToken")}`,
        },
        body: JSON.stringify({
          ...form,
          candidatesInterviewed: form.candidatesInterviewed
            ? Number(form.candidatesInterviewed)
            : undefined,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Something went wrong submitting feedback.");
        setSubmitting(false);
        return;
      }
      setSubmitted(true);
    } catch (err) {
      setError("Unable to connect to the server.");
    }
    setSubmitting(false);
  };

  const submitAnother = () => {
    setForm({
      ...emptyForm,
      school: form.school,
      course: form.course,
      feedbackType: form.feedbackType,
    });
    setSubmitted(false);
  };

  if (submitted) {
    return (
      <div
        className="min-h-screen bg-background flex items-center justify-center px-6"
        style={{ fontFamily: "Inter, sans-serif" }}
      >
        <div className="w-full max-w-sm bg-white rounded-3xl border border-[#E2E8F0] p-8 text-center shadow-[0_10px_40px_-10px_rgba(15,23,42,0.1)]">
          <div className="w-14 h-14 rounded-2xl bg-green-50 flex items-center justify-center mx-auto mb-5">
            <svg
              className="w-7 h-7 text-success"
              fill="none"
              stroke="currentColor"
              strokeWidth={2.2}
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h2
            className="text-lg font-bold text-[#1E293B] mb-2"
            style={{ fontFamily: "Space Grotesk, sans-serif" }}
          >
            Feedback submitted
          </h2>
          <p className="text-text-muted text-sm mb-6">
            Thanks — this goes straight to the placement cell.
          </p>
          <button
            onClick={submitAnother}
            className="w-full py-3 rounded-xl bg-primary hover:bg-blue-600 text-white font-semibold transition-colors cursor-pointer"
            style={{ fontFamily: "Space Grotesk, sans-serif" }}
          >
            Submit feedback for another
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-background px-6 py-10"
      style={{ fontFamily: "Inter, sans-serif" }}
    >
      <div className="max-w-lg mx-auto">
        <div className="mb-6">
          <p className="text-xs font-semibold tracking-widest uppercase text-primary mb-2">
            {companyName}
          </p>
          <h1
            className="text-2xl font-bold text-[#1E293B] mb-1"
            style={{ fontFamily: "Space Grotesk, sans-serif" }}
          >
            Quick interview feedback
          </h1>
          <p className="text-text-muted text-sm">
            Takes about a minute — helps students know what to improve.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-3xl border border-[#E2E8F0] p-6 shadow-[0_10px_40px_-10px_rgba(15,23,42,0.1)] flex flex-col gap-6"
        >
          <div>
            <label className="text-sm font-medium text-[#1E293B] block mb-2">
              This feedback is for
            </label>
            <div className="grid grid-cols-2 gap-2">
              {["Individual", "Batch"].map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => update({ feedbackType: t })}
                  className={`py-2.5 rounded-xl text-sm font-semibold border transition-colors cursor-pointer ${
                    form.feedbackType === t
                      ? "bg-primary text-white border-primary"
                      : "bg-white text-text-muted border-[#CBD5E1] hover:border-primary"
                  }`}
                >
                  {t === "Individual" ? "One candidate" : "Whole batch"}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-[#1E293B] block mb-1.5">
                School
              </label>
              <select
                value={form.school}
                onChange={(e) => update({ school: e.target.value, course: "" })}
                className="w-full px-3 py-2.5 rounded-xl border border-[#CBD5E1] text-sm text-[#1E293B] bg-white focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition"
              >
                <option value="">Select school</option>
                {universityStructure.map((s) => (
                  <option key={s.school} value={s.school}>
                    {s.school}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-[#1E293B] block mb-1.5">
                Course
              </label>
              <select
                value={form.course}
                onChange={(e) => update({ course: e.target.value })}
                disabled={!form.school}
                className="w-full px-3 py-2.5 rounded-xl border border-[#CBD5E1] text-sm text-[#1E293B] bg-white focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition disabled:bg-background disabled:text-text-muted"
              >
                <option value="">Select course</option>
                {availableCourses.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {isIndividual && (
            <div>
              <label className="text-sm font-medium text-[#1E293B] block mb-1.5">
                Candidate name / ERP ID
              </label>
              <input
                type="text"
                value={form.studentIdentifier}
                onChange={(e) => update({ studentIdentifier: e.target.value })}
                placeholder="As shown on their resume or attendance sheet"
                className="w-full px-3 py-2.5 rounded-xl border border-[#CBD5E1] text-sm text-[#1E293B] focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition"
              />
            </div>
          )}

          {!isIndividual && (
            <div>
              <label className="text-sm font-medium text-[#1E293B] block mb-1.5">
                Candidates interviewed{" "}
                <span className="text-text-muted font-normal">(optional)</span>
              </label>
              <input
                type="number"
                min="1"
                value={form.candidatesInterviewed}
                onChange={(e) =>
                  update({ candidatesInterviewed: e.target.value })
                }
                placeholder="e.g. 18"
                className="w-full px-3 py-2.5 rounded-xl border border-[#CBD5E1] text-sm text-[#1E293B] focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition"
              />
            </div>
          )}

          <div>
            <label className="text-sm font-medium text-[#1E293B] block mb-2">
              Round
            </label>
            <div className="flex flex-wrap gap-2">
              {ROUNDS.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => update({ round: r })}
                  className={`px-3.5 py-2 rounded-full text-sm font-medium border transition-colors cursor-pointer ${
                    form.round === r
                      ? "bg-primary text-white border-primary"
                      : "bg-white text-text-muted border-[#CBD5E1] hover:border-primary"
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {isIndividual && (
            <>
              <div>
                <label className="text-sm font-medium text-[#1E293B] block mb-2">
                  Result
                </label>
                <div className="flex flex-wrap gap-2">
                  {RESULTS.map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => update({ result: r })}
                      className={`px-3.5 py-2 rounded-full text-sm font-medium border transition-colors cursor-pointer ${
                        form.result === r
                          ? r === "Selected"
                            ? "bg-green-500 text-white border-green-500"
                            : r === "Rejected"
                              ? "bg-red-500 text-white border-red-500"
                              : "bg-amber-500 text-white border-amber-500"
                          : "bg-white text-text-muted border-[#CBD5E1] hover:border-primary"
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-4">
                <p className="text-sm font-medium text-[#1E293B]">
                  Ratings (1–5)
                </p>
                {RATING_FIELDS.map((f) => (
                  <div key={f.key}>
                    <p className="text-xs text-text-muted mb-2">{f.label}</p>
                    <RatingInput
                      value={form.ratings[f.key]}
                      onChange={(n) =>
                        update({ ratings: { ...form.ratings, [f.key]: n } })
                      }
                    />
                  </div>
                ))}
              </div>
            </>
          )}

          {!isIndividual && (
            <div>
              <p className="text-sm font-medium text-[#1E293B] mb-2">
                Overall batch quality (1–5)
              </p>
              <RatingInput
                value={form.overallRating}
                onChange={(n) => update({ overallRating: n })}
              />
            </div>
          )}

          {(isIndividual
            ? form.result === "Rejected" || form.result === "On Hold"
            : true) && (
            <div>
              <label className="text-sm font-medium text-[#1E293B] block mb-2">
                {isIndividual
                  ? "Reason (pick any that apply)"
                  : "Most common issues observed (optional)"}
              </label>
              <div className="flex flex-col gap-2">
                {REJECTION_REASONS.map((reason) => (
                  <label
                    key={reason}
                    className="flex items-center gap-2.5 text-sm text-[#1E293B] cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={form.rejectionReasons.includes(reason)}
                      onChange={() => toggleReason(reason)}
                      className="w-4 h-4 rounded accent-primary"
                    />
                    {reason}
                  </label>
                ))}
              </div>
              {form.rejectionReasons.includes("Other") && (
                <input
                  type="text"
                  value={form.otherReasonNote}
                  onChange={(e) => update({ otherReasonNote: e.target.value })}
                  placeholder="Briefly describe"
                  className="w-full mt-2.5 px-3 py-2 rounded-xl border border-[#CBD5E1] text-sm text-[#1E293B] focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition"
                />
              )}
            </div>
          )}

          <div>
            <label className="text-sm font-medium text-[#1E293B] block mb-1.5">
              One-line feedback
            </label>
            <p className="text-xs text-text-muted mb-2">
              What should this {isIndividual ? "student" : "batch"} improve?
            </p>
            <textarea
              value={form.oneLineFeedback}
              onChange={(e) => update({ oneLineFeedback: e.target.value })}
              rows={2}
              placeholder="e.g. Solid fundamentals, but needs to explain thought process more clearly."
              className="w-full px-3 py-2.5 rounded-xl border border-[#CBD5E1] text-sm text-[#1E293B] focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition resize-none"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-[#1E293B] block mb-1.5">
              Recurring issue across candidates?{" "}
              <span className="text-text-muted font-normal">(optional)</span>
            </label>
            <textarea
              value={form.recurringIssue}
              onChange={(e) => update({ recurringIssue: e.target.value })}
              rows={2}
              placeholder="e.g. Most candidates struggled with system design basics."
              className="w-full px-3 py-2.5 rounded-xl border border-[#CBD5E1] text-sm text-[#1E293B] focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition resize-none"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-[#1E293B] block mb-2">
              Would you consider PlaceRise students for future drives?{" "}
              <span className="text-text-muted font-normal">(optional)</span>
            </label>
            <div className="flex gap-2">
              {[
                { label: "Yes", value: true },
                { label: "Not sure yet", value: false },
              ].map((opt) => (
                <button
                  key={opt.label}
                  type="button"
                  onClick={() => update({ recommendForFuture: opt.value })}
                  className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors cursor-pointer ${
                    form.recommendForFuture === opt.value
                      ? "bg-primary text-white border-primary"
                      : "bg-white text-text-muted border-[#CBD5E1] hover:border-primary"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {error && <p className="text-xs text-danger">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 rounded-xl bg-primary hover:bg-blue-600 text-white font-semibold transition-colors cursor-pointer disabled:opacity-50"
            style={{ fontFamily: "Space Grotesk, sans-serif" }}
          >
            {submitting ? "Submitting..." : "Submit feedback"}
          </button>
        </form>
      </div>
    </div>
  );
}
