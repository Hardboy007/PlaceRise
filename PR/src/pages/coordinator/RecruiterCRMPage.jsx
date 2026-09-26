import * as XLSX from "xlsx";
import { useState, useMemo, useEffect } from "react";
import {
  Search,
  Plus,
  Building2,
  Phone,
  Mail,
  Edit3,
  Trash2,
  X,
  Check,
  TrendingUp,
  Users,
  Clock,
  CheckCircle,
  Download,
} from "lucide-react";
import CompanyLogo from "../../components/common/CompanyLogo";
import { api } from "../../utils/api";
import { useIsReadOnly } from "../../utils/useIsReadOnly";

const STATUS_CONFIG = {
  Visited: {
    color: "#15803D",
    bg: "#F0FDF4",
    border: "#86EFAC",
    dot: "#22C55E",
  },
  "In Talk": {
    color: "#1a3a8f",
    bg: "#EFF3FA",
    border: "#B8C6E3",
    dot: "#1a3a8f",
  },
  "Confirmation Required": {
    color: "#92400E",
    bg: "#FFFBEB",
    border: "#FDE68A",
    dot: "#F59E0B",
  },
  "Not Contacted": {
    color: "#64748B",
    bg: "#F8FAFC",
    border: "#E2E8F0",
    dot: "#94A3B8",
  },
};

const STATUS_OPTIONS = [
  "Not Contacted",
  "Visited",
  "In Talk",
  "Confirmation Required",
];

const EMPTY_FORM = {
  companyName: "",
  pocName: "",
  managedBy: "",
  status: "Not Contacted",
  email: "",
  phone: "",
  notes: "",
};

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG["Not Contacted"];
  return (
    <span
      className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border"
      style={{
        color: cfg.color,
        backgroundColor: cfg.bg,
        borderColor: cfg.border,
      }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full shrink-0"
        style={{ backgroundColor: cfg.dot }}
      />
      {status}
    </span>
  );
}

function StatCard({ icon, label, value, color, bg }) {
  return (
    <div className="bg-white rounded-2xl border border-[#E2E8F0] p-4 shadow-sm flex items-center gap-3">
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
        style={{ backgroundColor: bg }}
      >
        {icon}
      </div>
      <div>
        <p className="text-xs text-text-muted font-medium">{label}</p>
        <p
          className="text-xl font-bold text-text-main"
          style={{ fontFamily: "Space Grotesk, sans-serif" }}
        >
          {value}
        </p>
      </div>
    </div>
  );
}

function POCModal({ poc, onClose, onSave }) {
  const [form, setForm] = useState(poc || EMPTY_FORM);
  const [showEmail, setShowEmail] = useState(false);
  const [showPhone, setShowPhone] = useState(false);

  const isValid = form.companyName.trim() && form.pocName.trim();

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{
        backgroundColor: "rgba(15,23,42,0.5)",
        backdropFilter: "blur(4px)",
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div
          className="px-4 sm:px-6 py-4 sm:py-5 border-b border-background flex items-center justify-between"
          style={{
            background:
              "linear-gradient(135deg, #0d1b5e 0%, #1a2d8a 25%, #3d1a6e 55%, #6b1040 80%, #7a0f35 100%)",
          }}
        >
          <div>
            <h2
              className="text-lg font-bold text-white"
              style={{ fontFamily: "Space Grotesk, sans-serif" }}
            >
              {poc ? "Edit POC" : "Add New POC"}
            </h2>
            <p className="text-xs text-white/60 mt-0.5">
              Point of Contact details
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
          >
            <X size={15} />
          </button>
        </div>

        <div className="p-4 sm:p-6 flex flex-col gap-4 overflow-y-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-text-muted uppercase tracking-widest block mb-1.5">
                Company Name <span className="text-red-400">*</span>
              </label>
              <input
                value={form.companyName}
                onChange={(e) =>
                  setForm({ ...form, companyName: e.target.value })
                }
                placeholder="e.g. Google"
                className="w-full px-3 py-2.5 text-sm border border-[#E2E8F0] rounded-xl bg-[#F8FAFC] focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-text-muted uppercase tracking-widest block mb-1.5">
                POC Name <span className="text-red-400">*</span>
              </label>
              <input
                value={form.pocName}
                onChange={(e) => setForm({ ...form, pocName: e.target.value })}
                placeholder="e.g. Priya Sharma"
                className="w-full px-3 py-2.5 text-sm border border-[#E2E8F0] rounded-xl bg-[#F8FAFC] focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-text-muted uppercase tracking-widest block mb-1.5">
                Managed By
              </label>
              <input
                value={form.managedBy}
                onChange={(e) =>
                  setForm({ ...form, managedBy: e.target.value })
                }
                placeholder="e.g. Anaya Singh"
                className="w-full px-3 py-2.5 text-sm border border-[#E2E8F0] rounded-xl bg-[#F8FAFC] focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-text-muted uppercase tracking-widest block mb-1.5">
                Status
              </label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="w-full px-3 py-2.5 text-sm border border-[#E2E8F0] rounded-xl bg-[#F8FAFC] focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition"
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-text-muted uppercase tracking-widest block mb-1.5">
                Email
              </label>
              <input
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="poc@company.com"
                className="w-full px-3 py-2.5 text-sm border border-[#E2E8F0] rounded-xl bg-[#F8FAFC] focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-text-muted uppercase tracking-widest block mb-1.5">
                Phone
              </label>
              <input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="+91 98765 43210"
                className="w-full px-3 py-2.5 text-sm border border-[#E2E8F0] rounded-xl bg-[#F8FAFC] focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-text-muted uppercase tracking-widest block mb-1.5">
              Notes
            </label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Any additional notes..."
              rows={3}
              className="w-full px-3 py-2.5 text-sm border border-[#E2E8F0] rounded-xl bg-[#F8FAFC] focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2 border-t border-background">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-[#E2E8F0] text-sm font-medium text-text-muted hover:bg-[#F8FAFC] transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => isValid && onSave(form)}
              disabled={!isValid}
              className="px-5 py-2 rounded-xl bg-[#1a3a8f] hover:bg-[#0d1b5e] text-white text-sm font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Check size={14} /> {poc ? "Save Changes" : "Add POC"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function RecruiterCRMPage() {
  const isReadOnly = useIsReadOnly();
  const [pocs, setPocs] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [showModal, setShowModal] = useState(false);
  const [editingPoc, setEditingPoc] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [openMenu, setOpenMenu] = useState(null);
  const [showEmailFor, setShowEmailFor] = useState(null);
  const [showPhoneFor, setShowPhoneFor] = useState(null);

  const loadCompanies = async () => {
    try {
      setLoading(true);
      setError("");
      const companyList = await api.get("/companies");
      console.log("companyList:", companyList);
      const flattened = (companyList || []).flatMap((company) =>
        (company.recruiterContacts || []).map((contact, index) => ({
          ...contact,
          id: contact._id || `${company._id}-${index}`,
          contactId: contact._id || `${company._id}-${index}`,
          companyId: company._id,
          companyName: contact.companyName || company.name || "",
          website: company.website || "",
        })),
      );

      setCompanies(companyList || []);
      setPocs(flattened);
    } catch (err) {
      setError(err.message || "Unable to load recruiter records.");
      setPocs([]);
      setCompanies([]);
    } finally {
      setLoading(false);
    }
  };

  const filtered = useMemo(() => {
    return pocs.filter((p) => {
      const companyName = (p.companyName || "").toLowerCase();
      const pocName = (p.pocName || "").toLowerCase();
      const managedBy = (p.managedBy || "").toLowerCase();
      const matchSearch =
        companyName.includes(search.toLowerCase()) ||
        pocName.includes(search.toLowerCase()) ||
        managedBy.includes(search.toLowerCase());
      const matchStatus = statusFilter === "All" || p.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [pocs, search, statusFilter]);

  const stats = useMemo(
    () => ({
      total: pocs.length,
      visited: pocs.filter((p) => p.status === "Visited").length,
      inTalk: pocs.filter((p) => p.status === "In Talk").length,
      confirmation: pocs.filter((p) => p.status === "Confirmation Required")
        .length,
    }),
    [pocs],
  );

  const refreshAfterMutation = async () => {
    await loadCompanies();
  };

  const handleSave = async (form) => {
    try {
      const normalizedForm = {
        ...form,
        companyName: form.companyName.trim(),
        pocName: form.pocName.trim(),
        managedBy: form.managedBy.trim(),
        status: STATUS_OPTIONS.includes(form.status)
          ? form.status
          : "Not Contacted",
      };

      const companyName = normalizedForm.companyName;

      // Sirf existing company mein dhundho
      let workingCompany = null;

      if (editingPoc?.companyId) {
        workingCompany = companies.find((c) => c._id === editingPoc.companyId);
      }

      if (!workingCompany) {
        workingCompany = companies.find(
          (c) => c.name && c.name.toLowerCase() === companyName.toLowerCase(),
        );
      }

      // Company exist nahi karti — error dikhaao, naya create mat karo
      if (!workingCompany) {
        setError(
          `"${companyName}" not found in Company Management. Please add the company there first.`,
        );
        return;
      }

      if (editingPoc) {
        // Existing contact update karo
        const updatedContacts = (workingCompany.recruiterContacts || []).map(
          (contact) =>
            contact._id === editingPoc.contactId
              ? { ...contact, ...normalizedForm, companyName }
              : contact,
        );
        await api.put(`/companies/${workingCompany._id}`, {
          ...workingCompany,
          recruiterContacts: updatedContacts,
        });
      } else {
        // Naya contact add karo existing company mein
        const updatedContacts = [
          ...(workingCompany.recruiterContacts || []),
          { ...normalizedForm, companyName },
        ];
        await api.put(`/companies/${workingCompany._id}`, {
          ...workingCompany,
          recruiterContacts: updatedContacts,
        });
      }

      await refreshAfterMutation();
      console.log("pocs after refresh:", pocs);
      setShowModal(false);
      setEditingPoc(null);
    } catch (err) {
      console.error("handleSave error:", err);
      setError(err.message || "Unable to save recruiter contact.");
    }
  };

  const handleDelete = async (id) => {
    try {
      const record = pocs.find((p) => p.id === id);
      if (!record || !record.companyId) {
        setPocs((prev) => prev.filter((p) => p.id !== id));
        setDeleteConfirm(null);
        return;
      }

      const company = companies.find((item) => item._id === record.companyId);
      if (!company) {
        setPocs((prev) => prev.filter((p) => p.id !== id));
        setDeleteConfirm(null);
        return;
      }

      const nextContacts = (company.recruiterContacts || []).filter(
        (contact) =>
          contact._id !== record.contactId && contact._id !== record.id,
      );

      await api.put(`/company/${company._id}`, {
        ...company,
        recruiterContacts: nextContacts,
      });

      await refreshAfterMutation();
      setDeleteConfirm(null);
    } catch (err) {
      setError(err.message || "Unable to delete recruiter contact.");
    }
  };

  const exportToExcel = (data, filename) => {
    const rows = data.map((p) => ({
      "Company Name": p.companyName,
      "POC Name": p.pocName,
      "Managed By": p.managedBy || "—",
      Status: p.status,
      Email: p.email || "—",
      Phone: p.phone || "—",
      Notes: p.notes || "—",
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);
    worksheet["!cols"] = [
      { wch: 20 },
      { wch: 18 },
      { wch: 18 },
      { wch: 22 },
      { wch: 26 },
      { wch: 16 },
      { wch: 30 },
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "POCs");
    XLSX.writeFile(workbook, `${filename}.xlsx`);
  };

  const exportAll = () => exportToExcel(filtered, "All_POCs");

  const exportSingle = (poc) => exportToExcel([poc], poc.companyName);

  const handleStatusChange = (id, newStatus) => {
    setPocs((prev) =>
      prev.map((p) => (p.id === id ? { ...p, status: newStatus } : p)),
    );
    setOpenMenu(null);
  };

  useEffect(() => {
    document.title = "Recruiter CRM — PlaceRise";
    loadCompanies();
  }, []);

  return (
    <div
      className="max-w-7xl mx-auto"
      style={{ fontFamily: "Inter, sans-serif" }}
    >
      {/* Hero */}
      <div
        className="relative rounded-3xl overflow-hidden mb-6 p-4 sm:p-6"
        style={{
          background:
            "linear-gradient(135deg, #0d1b5e 0%, #1a2d8a 25%, #3d1a6e 55%, #6b1040 80%, #7a0f35 100%)",
        }}
      >
        <svg
          className="absolute bottom-0 right-0 pointer-events-none"
          style={{ width: "260px", height: "130px" }}
          viewBox="0 0 260 130"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M260 130 Q180 60 80 100 Q20 120 0 130"
            stroke="url(#recruiterCrmRedOrangeGrad)"
            strokeWidth="3.5"
            fill="none"
            strokeLinecap="round"
          />
          <path
            d="M260 110 Q190 50 100 85 Q40 105 10 115"
            stroke="url(#recruiterCrmRedOrangeGrad)"
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
            opacity="0.5"
          />
          <defs>
            <linearGradient
              id="recruiterCrmRedOrangeGrad"
              x1="0"
              y1="0"
              x2="260"
              y2="0"
              gradientUnits="userSpaceOnUse"
            >
              <stop offset="0%" stopColor="#ff4e00" stopOpacity="0" />
              <stop offset="50%" stopColor="#ff4e00" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#ff9d00" stopOpacity="1" />
            </linearGradient>
          </defs>
        </svg>
        <div className="relative flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <div className="w-6 h-6 rounded-md bg-white/20 flex items-center justify-center">
                <Users size={13} className="text-[#f59e0b]" />
              </div>
              <span className="text-white/60 text-[10px] font-bold uppercase tracking-widest">
                Recruiter CRM
              </span>
            </div>
            <h1
              className="text-xl sm:text-2xl font-bold text-white"
              style={{ fontFamily: "Space Grotesk, sans-serif" }}
            >
              Point of Contact Manager
            </h1>
            <p className="text-white/55 text-xs mt-1">
              Track recruiter interactions, contacts, and engagement status
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0 mt-1 flex-wrap w-full sm:w-auto">
            {!isReadOnly && (
              <button
                onClick={exportAll}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white/15 text-white border border-white/25 text-sm font-semibold hover:bg-white/25 transition-colors flex-1 sm:flex-none"
              >
                <Download size={15} /> Export all POCs Excel
              </button>
            )}
            {!isReadOnly && (
              <button
                onClick={() => {
                  setEditingPoc(null);
                  setShowModal(true);
                }}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white text-[#1a3a8f] text-sm font-bold hover:bg-[#F1F5F9] transition-colors shadow-lg flex-1 sm:flex-none"
              >
                <Plus size={15} /> Add POC
              </button>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="relative grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Total POCs", value: stats.total, icon: Users },
            { label: "Visited", value: stats.visited, icon: CheckCircle },
            { label: "In Talk", value: stats.inTalk, icon: Clock },
            {
              label: "Confirmation Pending",
              value: stats.confirmation,
              icon: TrendingUp,
            },
          ].map(({ label, value, icon: Icon }) => (
            <div
              key={label}
              className="rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 border border-white/10"
              style={{ background: "rgba(255,255,255,0.12)" }}
            >
              <div className="flex items-center gap-1.5 mb-1">
                <Icon size={12} className="text-white/60" />
                <span className="text-white/55 text-[10px] font-semibold uppercase tracking-wider">
                  {label}
                </span>
              </div>
              <p
                className="text-white text-lg sm:text-2xl font-bold leading-none"
                style={{ fontFamily: "Space Grotesk, sans-serif" }}
              >
                {value}
              </p>
            </div>
          ))}
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] p-4 mb-5 shadow-sm flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]"
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search company, POC name, managed by..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-[#CBD5E1] text-sm text-[#1E293B] placeholder-[#94A3B8] focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition"
          />
        </div>
        <div className="flex items-center gap-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-1 flex-wrap">
          {["All", ...STATUS_OPTIONS].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                statusFilter === s
                  ? "bg-[#1a3a8f] text-white"
                  : "text-text-muted hover:text-[#1E293B]"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm overflow-hidden">
        {/* Header */}
        <div
          className="hidden sm:grid border-b border-background px-6 py-3"
          style={{
            gridTemplateColumns: "2fr 1.5fr 1.5fr 1.8fr 1fr 1fr 0.5fr",
            backgroundColor: "#F8FAFC",
          }}
        >
          {[
            "Company",
            "POC Name",
            "Managed By",
            "Status",
            "Email",
            "Phone",
            "",
          ].map((h) => (
            <span
              key={h}
              className="text-[10px] font-bold uppercase tracking-wider text-text-muted"
            >
              {h}
            </span>
          ))}
        </div>

        {/* Rows */}
        {loading ? (
          <div className="hidden sm:flex flex-col items-center py-16 gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#CBD5E1] border-t-[#1a3a8f]" />
            <p className="text-sm text-text-muted">
              Loading recruiter contacts...
            </p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="hidden sm:flex flex-col items-center py-16 gap-3">
            <Building2 size={36} className="text-[#CBD5E1]" />
            <p className="text-sm text-text-muted">No POCs found</p>
          </div>
        ) : (
          filtered.map((poc, idx) => (
            <div
              key={poc.id}
              className="hidden sm:grid px-6 py-4 hover:bg-[#F8FAFC] transition-colors border-b border-background last:border-b-0"
              style={{
                gridTemplateColumns: "2fr 1.5fr 1.5fr 1.8fr 1fr 1fr 0.5fr",
                alignItems: "center",
              }}
            >
              {/* Company */}
              <div className="flex items-center gap-3">
                <CompanyLogo
                  name={poc.companyName}
                  website={poc.website}
                  size={36}
                />
                <div>
                  <p className="text-sm font-bold text-[#1E293B]">
                    {poc.companyName}
                  </p>
                  {poc.notes && (
                    <p className="text-[10px] text-[#94A3B8] truncate max-w-35">
                      {poc.notes}
                    </p>
                  )}
                </div>
              </div>

              {/* POC Name */}
              <p className="text-sm font-medium text-[#1E293B]">
                {poc.pocName}
              </p>

              {/* Managed By */}
              <p className="text-sm text-text-muted">{poc.managedBy || "—"}</p>

              {/* Status — click to change (crc_head only) */}
              <div className="relative">
                {isReadOnly ? (
                  <StatusBadge status={poc.status} />
                ) : (
                  <>
                    <button
                      onClick={() =>
                        setOpenMenu(openMenu === poc.id ? null : poc.id)
                      }
                      className="hover:opacity-80 transition-opacity"
                    >
                      <StatusBadge status={poc.status} />
                    </button>
                    {openMenu === poc.id && (
                      <div
                        className={`absolute left-0 z-20 bg-white rounded-xl border border-[#E2E8F0] shadow-lg py-1 min-w-45 ${
                          idx >= filtered.length - 2 ? "bottom-8" : "top-8"
                        }`}
                      >
                        {STATUS_OPTIONS.map((s) => (
                          <button
                            key={s}
                            onClick={() => handleStatusChange(poc.id, s)}
                            className="w-full text-left px-4 py-2 text-xs font-semibold hover:bg-[#F8FAFC] transition-colors flex items-center gap-2"
                          >
                            <span
                              className="w-2 h-2 rounded-full shrink-0"
                              style={{ backgroundColor: STATUS_CONFIG[s].dot }}
                            />
                            {s}
                            {poc.status === s && (
                              <Check
                                size={11}
                                className="ml-auto text-primary"
                              />
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Email */}
              <div>
                {poc.email ? (
                  showEmailFor === poc.id ? (
                    <span className="text-xs text-primary font-medium">
                      {poc.email}
                    </span>
                  ) : (
                    <button
                      onClick={() => setShowEmailFor(poc.id)}
                      className="flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
                    >
                      <Mail size={12} /> Show Email
                    </button>
                  )
                ) : (
                  <span className="text-xs text-[#94A3B8]">—</span>
                )}
              </div>

              {/* Phone */}
              <div>
                {poc.phone ? (
                  showPhoneFor === poc.id ? (
                    <span className="text-xs text-primary font-medium">
                      {poc.phone}
                    </span>
                  ) : (
                    <button
                      onClick={() => setShowPhoneFor(poc.id)}
                      className="flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
                    >
                      <Phone size={12} /> Show Number
                    </button>
                  )
                ) : (
                  <span className="text-xs text-[#94A3B8]">—</span>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 justify-end">
                <button
                  onClick={() => exportSingle(poc)}
                  className="w-7 h-7 rounded-lg bg-background hover:bg-green-50 hover:text-green-600 text-text-muted flex items-center justify-center transition-colors"
                >
                  <Download size={13} />
                </button>
                {!isReadOnly && (
                  <button
                    onClick={() => {
                      setEditingPoc(poc);
                      setShowModal(true);
                    }}
                    className="w-7 h-7 rounded-lg bg-background hover:bg-blue-50 hover:text-primary text-text-muted flex items-center justify-center transition-colors"
                  >
                    <Edit3 size={13} />
                  </button>
                )}
                {!isReadOnly && (
                  <button
                    onClick={() => setDeleteConfirm(poc.id)}
                    className="w-7 h-7 rounded-lg bg-background hover:bg-red-50 hover:text-danger text-text-muted flex items-center justify-center transition-colors"
                  >
                    <Trash2 size={13} />
                  </button>
                )}
              </div>
            </div>
          ))
        )}
        {/* ── Mobile Card List (only below sm breakpoint) ── */}
        <div className="sm:hidden divide-y divide-background">
          {loading ? (
            <div className="flex flex-col items-center py-16 gap-3">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#CBD5E1] border-t-[#1a3a8f]" />
              <p className="text-sm text-text-muted">
                Loading recruiter contacts...
              </p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center py-16 gap-3">
              <Building2 size={36} className="text-[#CBD5E1]" />
              <p className="text-sm text-text-muted">No POCs found</p>
            </div>
          ) : (
            filtered.map((poc) => (
              <div key={poc.id} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <CompanyLogo
                      name={poc.companyName}
                      website={poc.website}
                      size={36}
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-[#1E293B] truncate">
                        {poc.companyName}
                      </p>
                      <p className="text-xs text-text-muted truncate">
                        {poc.pocName}
                      </p>
                    </div>
                  </div>
                  <div className="relative shrink-0">
                    {isReadOnly ? (
                      <StatusBadge status={poc.status} />
                    ) : (
                      <>
                        <button
                          onClick={() =>
                            setOpenMenu(openMenu === poc.id ? null : poc.id)
                          }
                          className="hover:opacity-80 transition-opacity"
                        >
                          <StatusBadge status={poc.status} />
                        </button>
                        {openMenu === poc.id && (
                          <div className="absolute right-0 top-8 z-20 bg-white rounded-xl border border-[#E2E8F0] shadow-lg py-1 min-w-45">
                            {STATUS_OPTIONS.map((s) => (
                              <button
                                key={s}
                                onClick={() => handleStatusChange(poc.id, s)}
                                className="w-full text-left px-4 py-2 text-xs font-semibold hover:bg-[#F8FAFC] transition-colors flex items-center gap-2"
                              >
                                <span
                                  className="w-2 h-2 rounded-full shrink-0"
                                  style={{
                                    backgroundColor: STATUS_CONFIG[s].dot,
                                  }}
                                />
                                {s}
                                {poc.status === s && (
                                  <Check
                                    size={11}
                                    className="ml-auto text-primary"
                                  />
                                )}
                              </button>
                            ))}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {poc.notes && (
                  <p className="text-xs text-[#94A3B8] mt-2 truncate">
                    {poc.notes}
                  </p>
                )}

                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-3">
                  <span className="text-xs text-text-muted">
                    Managed by{" "}
                    <span className="font-medium text-[#1E293B]">
                      {poc.managedBy || "—"}
                    </span>
                  </span>
                </div>

                <div className="flex items-center flex-wrap gap-4 mt-2">
                  {poc.email ? (
                    showEmailFor === poc.id ? (
                      <span className="text-xs text-primary font-medium">
                        {poc.email}
                      </span>
                    ) : (
                      <button
                        onClick={() => setShowEmailFor(poc.id)}
                        className="flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
                      >
                        <Mail size={12} /> Show Email
                      </button>
                    )
                  ) : (
                    <span className="text-xs text-[#94A3B8]">No email</span>
                  )}
                  {poc.phone ? (
                    showPhoneFor === poc.id ? (
                      <span className="text-xs text-primary font-medium">
                        {poc.phone}
                      </span>
                    ) : (
                      <button
                        onClick={() => setShowPhoneFor(poc.id)}
                        className="flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
                      >
                        <Phone size={12} /> Show Number
                      </button>
                    )
                  ) : (
                    <span className="text-xs text-[#94A3B8]">No phone</span>
                  )}
                </div>

                <div className="flex items-center gap-2 justify-end mt-3 pt-3 border-t border-background">
                  <button
                    onClick={() => exportSingle(poc)}
                    className="w-8 h-8 rounded-lg bg-background hover:bg-green-50 hover:text-green-600 text-text-muted flex items-center justify-center transition-colors"
                  >
                    <Download size={14} />
                  </button>
                  {!isReadOnly && (
                    <button
                      onClick={() => {
                        setEditingPoc(poc);
                        setShowModal(true);
                      }}
                      className="w-8 h-8 rounded-lg bg-background hover:bg-blue-50 hover:text-primary text-text-muted flex items-center justify-center transition-colors"
                    >
                      <Edit3 size={14} />
                    </button>
                  )}
                  {!isReadOnly && (
                    <button
                      onClick={() => setDeleteConfirm(poc.id)}
                      className="w-8 h-8 rounded-lg bg-background hover:bg-red-50 hover:text-danger text-text-muted flex items-center justify-center transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* POC Modal */}
      {showModal && (
        <POCModal
          poc={editingPoc}
          onClose={() => {
            setShowModal(false);
            setEditingPoc(null);
          }}
          onSave={handleSave}
        />
      )}

      {/* Delete Confirm */}
      {deleteConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{
            backgroundColor: "rgba(15,23,42,0.5)",
            backdropFilter: "blur(4px)",
          }}
        >
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-6 flex flex-col gap-4">
            <div className="flex flex-col items-center gap-3 text-center">
              <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center">
                <Trash2 size={22} className="text-red-500" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#1E293B]">
                  Delete POC?
                </h3>
                <p className="text-xs text-text-muted mt-1">
                  This will permanently remove this contact.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-[#E2E8F0] text-sm font-medium text-text-muted hover:bg-[#F8FAFC] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                className="flex-1 px-4 py-2.5 rounded-xl bg-red-500 text-white text-sm font-semibold hover:bg-red-600 transition-colors flex items-center justify-center gap-2"
              >
                <Trash2 size={14} /> Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
