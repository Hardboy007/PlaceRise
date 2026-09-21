import { useState } from "react";

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 50 }, (_, i) => currentYear + 10 - i);

const emptyForm = {
  name: "",
  issuingOrganization: "",
  issueMonth: "",
  issueYear: "",
  expMonth: "",
  expYear: "",
  credentialId: "",
  credentialUrl: "",
  skills: [],
  file: null,
};

const inputCls =
  "w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";

const FieldError = ({ msg }) =>
  msg ? <p className="mt-1 text-xs text-red-600">{msg}</p> : null;

const CertificationModal = ({ isOpen, onClose, onSave, saving = false }) => {
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [skillInput, setSkillInput] = useState("");

  if (!isOpen) return null;

  const set = (key, value) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const addSkill = () => {
    const s = skillInput.trim();
    if (!s) return;
    if (form.skills.some((x) => x.toLowerCase() === s.toLowerCase())) {
      setSkillInput("");
      return;
    }
    set("skills", [...form.skills, s]);
    setSkillInput("");
  };

  const removeSkill = (s) =>
    set(
      "skills",
      form.skills.filter((x) => x !== s),
    );

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = "Certification name is a required field";
    if (!form.issuingOrganization.trim())
      e.issuingOrganization = "Issuing organization is a required field";
    if (form.skills.length < 1) e.skills = "Add at least 1 skill";
    if (form.credentialId.length > 80) e.credentialId = "Max 80 characters";
    if (form.credentialUrl && !/^https?:\/\//i.test(form.credentialUrl))
      e.credentialUrl = "URL must start with http:// or https://";
    if (
      form.issueYear &&
      form.expYear &&
      Number(form.expYear) * 12 + Number(form.expMonth || 1) <
        Number(form.issueYear) * 12 + Number(form.issueMonth || 1)
    ) {
      e.expYear = "Expiration date cannot be before issue date";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    const ok = await onSave(form);
    if (ok !== false) {
      setForm(emptyForm);
      setErrors({});
      setSkillInput("");
      onClose();
    }
  };

  const handleClose = () => {
    setForm(emptyForm);
    setErrors({});
    setSkillInput("");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="flex max-h-[90vh] w-full max-w-lg flex-col rounded-lg bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-5 py-4">
          <h2 className="text-lg font-semibold">
            Add license or certification
          </h2>
          <button
            type="button"
            onClick={handleClose}
            className="text-2xl leading-none text-gray-500 hover:text-gray-800"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
          <p className="text-xs text-gray-500">* Indicates required</p>

          <div>
            <label className="mb-1 block text-sm font-medium">Name*</label>
            <input
              className={`${inputCls} ${errors.name ? "border-red-500" : ""}`}
              placeholder="Ex: Microsoft certified network associate security"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
            />
            <FieldError msg={errors.name} />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">
              Issuing organization*
            </label>
            <input
              className={`${inputCls} ${
                errors.issuingOrganization ? "border-red-500" : ""
              }`}
              placeholder="Ex: Microsoft"
              value={form.issuingOrganization}
              onChange={(e) => set("issuingOrganization", e.target.value)}
            />
            <FieldError msg={errors.issuingOrganization} />
          </div>

          {/* Issue date */}
          <div>
            <label className="mb-1 block text-sm font-medium">Issue date</label>
            <div className="grid grid-cols-2 gap-3">
              <select
                className={inputCls}
                value={form.issueMonth}
                onChange={(e) => set("issueMonth", e.target.value)}
              >
                <option value="">Month</option>
                {MONTHS.map((m, i) => (
                  <option key={m} value={i + 1}>
                    {m}
                  </option>
                ))}
              </select>
              <select
                className={inputCls}
                value={form.issueYear}
                onChange={(e) => set("issueYear", e.target.value)}
              >
                <option value="">Year</option>
                {YEARS.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Expiration date */}
          <div>
            <label className="mb-1 block text-sm font-medium">
              Expiration date
            </label>
            <div className="grid grid-cols-2 gap-3">
              <select
                className={inputCls}
                value={form.expMonth}
                onChange={(e) => set("expMonth", e.target.value)}
              >
                <option value="">Month</option>
                {MONTHS.map((m, i) => (
                  <option key={m} value={i + 1}>
                    {m}
                  </option>
                ))}
              </select>
              <select
                className={`${inputCls} ${errors.expYear ? "border-red-500" : ""}`}
                value={form.expYear}
                onChange={(e) => set("expYear", e.target.value)}
              >
                <option value="">Year</option>
                {YEARS.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
            <FieldError msg={errors.expYear} />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">
              Credential ID
            </label>
            <input
              className={inputCls}
              maxLength={80}
              value={form.credentialId}
              onChange={(e) => set("credentialId", e.target.value)}
            />
            <p className="mt-1 text-right text-xs text-gray-500">
              {form.credentialId.length}/80
            </p>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">
              Credential URL
            </label>
            <input
              className={`${inputCls} ${errors.credentialUrl ? "border-red-500" : ""}`}
              placeholder="https://"
              value={form.credentialUrl}
              onChange={(e) => set("credentialUrl", e.target.value)}
            />
            <FieldError msg={errors.credentialUrl} />
          </div>

          {/* Skills */}
          <div>
            <h3 className="text-base font-semibold">Skills</h3>
            <p className="mb-2 text-sm text-gray-600">
              Associate at least 1 skill to this certification. It'll also
              appear in your Skills section.
            </p>
            <div className="flex gap-2">
              <input
                className={inputCls}
                placeholder="Ex: React"
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addSkill();
                  }
                }}
              />
              <button
                type="button"
                onClick={addSkill}
                className="whitespace-nowrap rounded-full border border-blue-600 px-4 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-50"
              >
                + Add skill
              </button>
            </div>
            {form.skills.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {form.skills.map((s) => (
                  <span
                    key={s}
                    className="flex items-center gap-1 rounded-full bg-blue-50 px-3 py-1 text-sm text-blue-700"
                  >
                    {s}
                    <button
                      type="button"
                      onClick={() => removeSkill(s)}
                      className="text-blue-700 hover:text-red-600"
                      aria-label={`Remove ${s}`}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
            <FieldError msg={errors.skills} />
          </div>

          {/* Media */}
          <div>
            <h3 className="text-base font-semibold">Media (optional)</h3>
            <p className="mb-2 text-sm text-gray-600">
              image or pdf of certifications (max 5MB).
            </p>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 px-4 py-2 rounded-full border border-blue-600 text-sm font-medium text-blue-600 hover:bg-blue-50 cursor-pointer transition-colors">
                📎 Choose File
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0] || null;
                    if (f && f.size > 5 * 1024 * 1024) {
                      setErrors((er) => ({
                        ...er,
                        file: "File must be under 5MB",
                      }));
                      return;
                    }
                    set("file", f);
                  }}
                />
              </label>
              {form.file && (
                <span className="text-sm text-gray-600 truncate max-w-[180px]">
                  {form.file.name}
                </span>
              )}
            </div>
            <FieldError msg={errors.file} />
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end border-t px-5 py-3">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="rounded-full bg-blue-600 px-6 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CertificationModal;
