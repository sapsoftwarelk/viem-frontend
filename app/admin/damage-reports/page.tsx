"use client";

import { useEffect, useState, useRef } from "react";
import ReactDOM from "react-dom";
import { apiFetch } from "@/lib/api";
import {
  Plus, Search, Edit2, Trash2, X, AlertTriangle, Calendar,
  Package, Building2, Users, FileText, ChevronDown,
  Check, Home,
} from "lucide-react";

// ─── Helpers ────────────────────────────────────────────────────────────────
const pad = (n: number, width = 4) => String(n).padStart(width, "0");

const DAMAGE_TYPES = [
  "Physical Damage",
  "Theft / Loss",
  "Obsolescence",
  "Wear & Tear",
  "Other",
];

// ─── Color palette ──────────────────────────────────────────────────────────
const REPORT_COLORS = [
  { dot: "bg-violet-500", ring: "ring-violet-300", border: "border-violet-300", cardBg: "bg-violet-50/40", headerBg: "bg-violet-50", headerBorder: "border-violet-200", avatarBg: "bg-violet-500", avatarText: "text-white", accent: "text-violet-600", activeCard: "border-violet-400 bg-violet-50/50", filterActive: "bg-violet-600", idChip: "bg-violet-100 text-violet-700", subBorder: "border-violet-100" },
  { dot: "bg-sky-500", ring: "ring-sky-300", border: "border-sky-300", cardBg: "bg-sky-50/40", headerBg: "bg-sky-50", headerBorder: "border-sky-200", avatarBg: "bg-sky-500", avatarText: "text-white", accent: "text-sky-600", activeCard: "border-sky-400 bg-sky-50/50", filterActive: "bg-sky-600", idChip: "bg-sky-100 text-sky-700", subBorder: "border-sky-100" },
  { dot: "bg-emerald-500", ring: "ring-emerald-300", border: "border-emerald-300", cardBg: "bg-emerald-50/40", headerBg: "bg-emerald-50", headerBorder: "border-emerald-200", avatarBg: "bg-emerald-500", avatarText: "text-white", accent: "text-emerald-600", activeCard: "border-emerald-400 bg-emerald-50/50", filterActive: "bg-emerald-600", idChip: "bg-emerald-100 text-emerald-700", subBorder: "border-emerald-100" },
  { dot: "bg-rose-500", ring: "ring-rose-300", border: "border-rose-300", cardBg: "bg-rose-50/40", headerBg: "bg-rose-50", headerBorder: "border-rose-200", avatarBg: "bg-rose-500", avatarText: "text-white", accent: "text-rose-600", activeCard: "border-rose-400 bg-rose-50/50", filterActive: "bg-rose-600", idChip: "bg-rose-100 text-rose-700", subBorder: "border-rose-100" },
  { dot: "bg-amber-500", ring: "ring-amber-300", border: "border-amber-300", cardBg: "bg-amber-50/40", headerBg: "bg-amber-50", headerBorder: "border-amber-200", avatarBg: "bg-amber-500", avatarText: "text-white", accent: "text-amber-600", activeCard: "border-amber-400 bg-amber-50/50", filterActive: "bg-amber-600", idChip: "bg-amber-100 text-amber-700", subBorder: "border-amber-100" },
  { dot: "bg-indigo-500", ring: "ring-indigo-300", border: "border-indigo-300", cardBg: "bg-indigo-50/40", headerBg: "bg-indigo-50", headerBorder: "border-indigo-200", avatarBg: "bg-indigo-500", avatarText: "text-white", accent: "text-indigo-600", activeCard: "border-indigo-400 bg-indigo-50/50", filterActive: "bg-indigo-600", idChip: "bg-indigo-100 text-indigo-700", subBorder: "border-indigo-100" },
  { dot: "bg-teal-500", ring: "ring-teal-300", border: "border-teal-300", cardBg: "bg-teal-50/40", headerBg: "bg-teal-50", headerBorder: "border-teal-200", avatarBg: "bg-teal-500", avatarText: "text-white", accent: "text-teal-600", activeCard: "border-teal-400 bg-teal-50/50", filterActive: "bg-teal-600", idChip: "bg-teal-100 text-teal-700", subBorder: "border-teal-100" },
  { dot: "bg-pink-500", ring: "ring-pink-300", border: "border-pink-300", cardBg: "bg-pink-50/40", headerBg: "bg-pink-50", headerBorder: "border-pink-200", avatarBg: "bg-pink-500", avatarText: "text-white", accent: "text-pink-600", activeCard: "border-pink-400 bg-pink-50/50", filterActive: "bg-pink-600", idChip: "bg-pink-100 text-pink-700", subBorder: "border-pink-100" },
];

function reportColorIndex(id: string): number {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  return hash % REPORT_COLORS.length;
}
function getReportColor(id: string) { return REPORT_COLORS[reportColorIndex(id)]; }

// ─── Data types ────────────────────────────────────────────────────────────
type Site = { id: string; name: string };
type Location = { id: string; name: string; sites: Site[] };

type DamageReport = {
  id: string;
  locationId: string;
  siteId: string;
  itemName: string;
  quantity: number;
  damageType: string;
  responsiblePerson: string;
  reportDate: string;
  remarks: string;
};

type AvailableItem = {
  id: string;
  name: string;
  label: string;
};


type Employee = {
  id: string;
  name: string;
  label: string;
};

type DamageReportForm = {
  locationId: string;
  siteId: string;
  itemName: string;
  quantity: number;
  damageType: string;
  responsiblePerson: string;
  reportDate: string;
  remarks: string;
};

// ─── Construction sample data ──────────────────────────────────────────────
const SAMPLE_LOCATIONS: Location[] = [
  {
    id: "LOC-ADM-0001",
    name: "Administrative Sites",
    sites: [
      { id: "SITE-ADM-WH1", name: "Warehouse 1" },
      { id: "SITE-ADM-WH2", name: "Warehouse 2" },
      { id: "SITE-ADM-WH3", name: "Warehouse 3" },
      { id: "SITE-ADM-RS1", name: "Repair Shop 1" },
      { id: "SITE-ADM-RS2", name: "Repair Shop 2" },
      { id: "SITE-ADM-RS3", name: "Repair Shop 3" },
      { id: "SITE-ADM-TS1", name: "Trash Site 1" },
      { id: "SITE-ADM-TS2", name: "Trash Site 2" },
      { id: "SITE-ADM-TS3", name: "Trash Site 3" },
    ],
  },
  {
    id: "LOC-OP-0001",
    name: "Operational Sites",
    sites: [
      { id: "SITE-OP-COL", name: "Colombo City Tower" },
      { id: "SITE-OP-NBO", name: "Nairobi Business Park" },
    ],
  },
];

const SAMPLE_ITEMS = [
  "Cement (50kg bags)",
  "Steel Rebars (12mm)",
  "Steel Rebars (16mm)",
  "Plywood Sheets (4x8 ft)",
  "Timber Lumber (2x4)",
  "Nails (3 inch)",
  "Screws (self-tapping)",
  "Concrete Blocks",
  "Bricks",
  "Sand (cubic meter)",
  "Aggregate (20mm)",
  "Paint (5L buckets)",
  "Roofing Sheets",
  "Insulation Panels",
  "Electrical Cables (2.5mm)",
  "PVC Pipes (4 inch)",
  "Safety Helmets",
  "Safety Gloves",
  "Safety Boots",
  "Power Drill",
  "Angle Grinder",
  "Concrete Mixer",
  "Generator",
  "Water Pump",
];

const SEED_REPORTS: DamageReport[] = [
  {
    id: "DLR-0001",
    locationId: "LOC-ADM-0001",
    siteId: "SITE-ADM-WH1",
    itemName: "Cement (50kg bags)",
    quantity: 20,
    damageType: "Physical Damage",
    responsiblePerson: "Store Keeper",
    reportDate: "2025-03-10",
    remarks: "Bags torn during unloading, cement exposed to moisture.",
  },
  {
    id: "DLR-0002",
    locationId: "LOC-OP-0001",
    siteId: "SITE-OP-COL",
    itemName: "Steel Rebars (12mm)",
    quantity: 50,
    damageType: "Wear & Tear",
    responsiblePerson: "Site Supervisor",
    reportDate: "2025-02-28",
    remarks: "Rust due to improper storage.",
  },
  {
    id: "DLR-0003",
    locationId: "LOC-ADM-0001",
    siteId: "SITE-ADM-RS1",
    itemName: "Power Drill",
    quantity: 1,
    damageType: "Theft / Loss",
    responsiblePerson: "Electrician",
    reportDate: "2025-03-05",
    remarks: "Disappeared from toolbox after weekend.",
  },
  {
    id: "DLR-0004",
    locationId: "LOC-OP-0001",
    siteId: "SITE-OP-NBO",
    itemName: "Safety Helmets",
    quantity: 12,
    damageType: "Obsolescence",
    responsiblePerson: "Safety Officer",
    reportDate: "2025-03-01",
    remarks: "Expired certification, need replacement.",
  },
];

// ─── Combobox component ────────────────────────────────────────────────────
function Combobox({
  options,
  value,
  onChange,
  placeholder = "Search...",
}: {
  options: string[];
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const triggerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});

  useEffect(() => {
    if (!open || !triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const dropdownHeight = 240;
    const spaceBelow = window.innerHeight - rect.bottom;
    const showAbove = spaceBelow < dropdownHeight && rect.top > dropdownHeight;
    setDropdownStyle({
      position: "fixed",
      top: showAbove ? rect.top - dropdownHeight - 4 : rect.bottom + 4,
      left: rect.left,
      width: rect.width,
      zIndex: 9999,
    });
    setTimeout(() => searchRef.current?.focus(), 10);
  }, [open]);

  useEffect(() => {
    const handleMouseDown = (event: MouseEvent) => {
      if (
        triggerRef.current?.contains(event.target as Node) ||
        dropdownRef.current?.contains(event.target as Node)
      ) return;
      setOpen(false);
      setSearch("");
    };
    document.addEventListener("mousedown", handleMouseDown);
    return () => document.removeEventListener("mousedown", handleMouseDown);
  }, []);

  const filtered = options.filter(opt => opt.toLowerCase().includes(search.toLowerCase()));

  const dropdown = (
    <div
      ref={dropdownRef}
      style={dropdownStyle}
      className="bg-white border border-slate-200 rounded-xl shadow-xl max-h-60 overflow-auto"
    >
      <div className="p-2 sticky top-0 bg-white border-b border-slate-100">
        <input
          ref={searchRef}
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          placeholder="Type to filter..."
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              setOpen(false);
              setSearch("");
            }
            if (e.key === "Enter" && filtered.length === 1) {
              onChange(filtered[0]);
              setOpen(false);
              setSearch("");
            }
          }}
        />
      </div>
      {filtered.length === 0 ? (
        <div className="p-3 text-sm text-slate-500">No options</div>
      ) : (
        filtered.map(opt => (
          <div
            key={opt}
            className="px-4 py-2 hover:bg-slate-50 cursor-pointer text-sm flex items-center justify-between"
            onMouseDown={(e) => {
              e.preventDefault();
              onChange(opt);
              setOpen(false);
              setSearch("");
            }}
          >
            <span className="truncate">{opt}</span>
            {value === opt && <Check size={16} className="text-blue-600 flex-shrink-0 ml-2" />}
          </div>
        ))
      )}
    </div>
  );

  return (
    <>
      <div
        ref={triggerRef}
        className="flex items-center justify-between w-full border border-slate-200 rounded-xl px-4 py-3 text-sm cursor-pointer bg-white hover:border-slate-300 transition"
        onClick={() => setOpen(!open)}
      >
        <span className={value ? "text-slate-800" : "text-slate-400"}>
          {value || placeholder}
        </span>
        <ChevronDown size={16} className="text-slate-400" />
      </div>
      {typeof document !== "undefined" && open && ReactDOM.createPortal(dropdown, document.body)}
    </>
  );
}

// ─── Shared modals ─────────────────────────────────────────────────────────
function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-xl font-bold text-slate-800">{title}</h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-100 text-slate-400"><X size={18} /></button>
        </div>
        <div className="overflow-y-auto p-6">{children}</div>
      </div>
    </div>
  );
}

function ConfirmModal({ name, onClose, onConfirm }: { name: string; onClose: () => void; onConfirm: () => void }) {
  return (
    <Modal title="Confirm Delete" onClose={onClose}>
      <p className="text-slate-600">
        Are you sure you want to delete <strong className="text-rose-600">{name}</strong>? This action cannot be undone.
      </p>
      <div className="flex justify-end gap-3 mt-6">
        <button onClick={onClose} className="btn">Cancel</button>
        <button onClick={onConfirm} className="btn btn-danger">Delete</button>
      </div>
    </Modal>
  );
}

// ─── Form Modal ────────────────────────────────────────────────────────────
function DamageReportFormModal({
  initial,
  onClose,
  onSave,
  isEdit = false,
  locations,
  availableItems = [],
  availablePersons = [],
}: {
  initial?: DamageReportForm;
  onClose: () => void;
  onSave: (data: DamageReportForm) => void;
  isEdit?: boolean;
  locations: Location[];
  availableItems?: AvailableItem[];
  availablePersons?: Employee[];
}) {
  const [form, setForm] = useState<DamageReportForm>(initial ?? {
    locationId: "",
    siteId: "",
    itemName: "",
    quantity: 1,
    damageType: DAMAGE_TYPES[0],
    responsiblePerson: "",
    reportDate: new Date().toISOString().slice(0, 10),
    remarks: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [availableSites, setAvailableSites] = useState<Site[]>([]);

  useEffect(() => {
    const loc = locations.find((l: Location) => l.id === form.locationId);
    const sites = loc ? loc.sites : [];
    setAvailableSites(sites);
    if (form.siteId && !sites.some((s: Site) => s.id === form.siteId)) {
      setForm((prev: DamageReportForm) => ({ ...prev, siteId: "" }));
    }
  }, [form.locationId, locations]);

  const handleChange = (field: string, value: string | number) => {
    setForm((prev: DamageReportForm) => ({ ...prev, [field]: value }));
    if (field === "quantity" && (Number(value) <= 0 || isNaN(Number(value)))) {
      setErrors(prev => ({ ...prev, quantity: "Quantity must be positive" }));
    } else {
      setErrors(prev => { const next = { ...prev }; delete next[field]; return next; });
    }
  };

  const isValid =
    form.locationId &&
    form.siteId &&
    form.itemName.trim() &&
    form.quantity > 0 &&
    form.responsiblePerson.trim();

  const itemOptions = availableItems.length
    ? availableItems.map((item) => item.label)
    : SAMPLE_ITEMS;

  const personOptions = availablePersons.map((person) => person.label);

  return (
    <Modal title={isEdit ? "Edit Damage Report" : "New Damage Report"} onClose={onClose}>
      <div className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-slate-600 mb-1.5">Location *</label>
            <select
              value={form.locationId}
              onChange={(e) => handleChange("locationId", e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="">Select Location</option>
              {locations.map((loc: Location) => (
                <option key={loc.id} value={loc.id}>{loc.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-600 mb-1.5">Site *</label>
            <select
              value={form.siteId}
              onChange={(e) => handleChange("siteId", e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-slate-100 disabled:cursor-not-allowed"
              disabled={!form.locationId}
            >
              <option value="">Select Site</option>
              {availableSites.map((site: Site) => (
                <option key={site.id} value={site.id}>{site.name}</option>
              ))}
            </select>
            {!form.locationId && <p className="mt-1 text-xs text-slate-400">Please select a location first.</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-slate-600 mb-1.5">Item *</label>
            <Combobox
              options={itemOptions}
              value={form.itemName}
              onChange={(val) => {
                const matchedItem = availableItems.find((candidate) => candidate.label === val);
                handleChange("itemName", matchedItem?.name || val);
              }}
              placeholder="Search or select an item..."
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-600 mb-1.5">Quantity *</label>
            <input
              type="number" min="1"
              value={form.quantity}
              onChange={(e) => handleChange("quantity", parseInt(e.target.value) || 0)}
              className={`w-full border rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none ${errors.quantity ? "border-red-500" : "border-slate-200"}`}
            />
            {errors.quantity && <p className="mt-1 text-xs text-red-500">{errors.quantity}</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-slate-600 mb-1.5">Damage Type</label>
            <select
              value={form.damageType}
              onChange={(e) => handleChange("damageType", e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            >
              {DAMAGE_TYPES.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-600 mb-1.5">Responsible Person *</label>
            <Combobox
              options={personOptions}
              value={form.responsiblePerson}
              onChange={(val) => {
                const matchedPerson = availablePersons.find((candidate) => candidate.label === val);
                handleChange("responsiblePerson", matchedPerson?.name || val);
              }}
              placeholder={personOptions.length ? "Search or select a person..." : "No employees found — type a name..."}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-600 mb-1.5">Report Date</label>
          <input
            type="date"
            value={form.reportDate}
            onChange={(e) => handleChange("reportDate", e.target.value)}
            className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-600 mb-1.5">Remarks</label>
          <textarea
            rows={3}
            value={form.remarks}
            onChange={(e) => handleChange("remarks", e.target.value)}
            className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none"
            placeholder="Additional details..."
          />
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button onClick={onClose} className="btn">Cancel</button>
          <button
            onClick={() => { if (isValid) onSave(form); }}
            disabled={!isValid}
            className={`btn btn-primary ${!isValid ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            {isEdit ? "Save Changes" : "Create Report"}
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ─── Detail Panel ──────────────────────────────────────────────────────────
function DamageReportDetail({
  report,
  onUpdate,
  onClose,
  locations,
  availableItems,
  availablePersons,
}: {
  report: DamageReport;
  onUpdate: (updated: DamageReport | null) => void;
  onClose: () => void;
  locations: Location[];
  availableItems: AvailableItem[];
  availablePersons: Employee[];
}) {
  const color = getReportColor(report.id);
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);

  const loc = locations.find((l: Location) => l.id === report.locationId);
  const site = loc?.sites.find((s: Site) => s.id === report.siteId);

  return (
    <div className={`bg-white rounded-2xl border ${color.border} shadow-sm h-full flex flex-col overflow-hidden`}>
      <div className={`px-6 py-5 border-b ${color.headerBorder} ${color.headerBg} flex justify-between items-start`}>
        <div className="flex items-start gap-4">
          <div className={`w-12 h-12 rounded-xl ${color.avatarBg} ${color.avatarText} flex items-center justify-center text-lg font-black shadow-sm flex-shrink-0`}>
            {report.id.slice(-4)}
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className={`font-mono text-xs px-2 py-0.5 rounded-lg font-semibold ${color.idChip}`}>{report.id}</span>
            </div>
            <h2 className="text-2xl font-bold text-slate-800 leading-tight">{report.itemName}</h2>
            <p className={`text-sm font-medium ${color.accent} mt-1`}>{report.damageType}</p>
          </div>
        </div>
        <button onClick={onClose} className="p-1 rounded-lg hover:bg-white/70 text-slate-400"><X size={18} /></button>
      </div>

      <div className="flex-1 p-6 space-y-6 overflow-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="flex items-start gap-3">
            <Building2 size={18} className="text-slate-400 mt-1 flex-shrink-0" />
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Location</p>
              <p className="text-slate-700 font-medium">{loc?.name || "—"}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Home size={18} className="text-slate-400 mt-1 flex-shrink-0" />
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Site</p>
              <p className="text-slate-700 font-medium">{site?.name || "—"}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Package size={18} className="text-slate-400 mt-1 flex-shrink-0" />
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Quantity</p>
              <p className="text-slate-700 font-medium">{report.quantity}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Users size={18} className="text-slate-400 mt-1 flex-shrink-0" />
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Responsible Person</p>
              <p className="text-slate-700 font-medium">{report.responsiblePerson}</p>
            </div>
          </div>
          <div className="flex items-start gap-3 col-span-1 sm:col-span-2">
            <Calendar size={18} className="text-slate-400 mt-1 flex-shrink-0" />
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Report Date</p>
              <p className="text-slate-700 font-medium">{report.reportDate}</p>
            </div>
          </div>
        </div>

        {report.remarks && (
          <div className="border-t border-slate-100 pt-4">
            <div className="flex items-start gap-3">
              <FileText size={18} className="text-slate-400 mt-1 flex-shrink-0" />
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Remarks</p>
                <p className="text-slate-700">{report.remarks}</p>
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-3 pt-4 border-t border-slate-100">
          <button onClick={() => setShowEdit(true)} className="btn btn-primary"><Edit2 size={14} /> Edit</button>
          <button onClick={() => setShowDelete(true)} className="btn btn-danger"><Trash2 size={14} /> Delete</button>
        </div>
      </div>

      {showEdit && (
        <DamageReportFormModal
          isEdit
          initial={report}
          locations={locations}
          availableItems={availableItems}
          availablePersons={availablePersons}
          onClose={() => setShowEdit(false)}
          onSave={(data: DamageReportForm) => { onUpdate({ ...report, ...data }); setShowEdit(false); }}
        />
      )}
      {showDelete && (
        <ConfirmModal
          name={report.itemName}
          onClose={() => setShowDelete(false)}
          onConfirm={() => { onUpdate(null); setShowDelete(false); }}
        />
      )}
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────
export default function DamageReportsPage() {
  const [reports, setReports] = useState<DamageReport[]>(SEED_REPORTS);
  const [locations, setLocations] = useState<Location[]>(SAMPLE_LOCATIONS);
  const [availableItems, setAvailableItems] = useState<AvailableItem[]>([]);
  const [availablePersons, setAvailablePersons] = useState<Employee[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [apiError, setApiError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showAdd, setShowAdd] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setApiError("");
        const [reportsData, locData, itemsData, employeesData] = await Promise.all([
          apiFetch("/damage-reports"),
          apiFetch("/site-locations"),
          apiFetch("/items"),
          apiFetch("/employees"),
        ]);
        if (Array.isArray(reportsData)) {
          setReports(reportsData);
          setSelectedId((current) =>
            current && reportsData.some((r: DamageReport) => r.id === current) ? current : reportsData[0]?.id || null
          );
        }
        if (Array.isArray(locData)) {
          const mapped: Location[] = locData.map((l: any) => ({
            id: l.id,
            name: l.siteName || l.name,
            sites: (l.subLevels || []).map((s: any) => ({ id: s.id, name: s.name })),
          }));
          setLocations(mapped);
        }
        if (Array.isArray(itemsData)) {
          const mappedItems = itemsData
            .map((entry: any) => {
              const item = entry?.item ?? entry;
              const name = String(item?.itemName || item?.name || item?.model || item?.id || "").trim();
              const id = String(item?.id || entry?.id || "").trim();
              return name && id ? { id, name, label: name } : null;
            })
            .filter(Boolean) as AvailableItem[];
          setAvailableItems(mappedItems);
        }
        if (Array.isArray(employeesData)) {
          const mappedPersons = employeesData
            .map((entry: any) => {
              const name = String(
                entry?.fullName || entry?.name ||
                [entry?.firstName, entry?.lastName].filter(Boolean).join(" ") ||
                ""
              ).trim();
              const id = String(entry?.id || "").trim();
              const role = entry?.role?.name || entry?.designation || entry?.jobTitle;
              const label = role ? `${name} (${role})` : name;
              return name && id ? { id, name, label } : null;
            })
            .filter(Boolean) as Employee[];
          setAvailablePersons(mappedPersons);
        }
      } catch (error: any) {
        console.warn("Using seed data", error);
        setApiError(error?.message || "Unable to load data.");
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const filtered = reports.filter((r) => {
    const q = search.toLowerCase();
    const loc = locations.find(l => l.id === r.locationId);
    const site = loc?.sites.find(s => s.id === r.siteId);
    const locationName = loc?.name || "";
    const siteName = site?.name || "";
    return (
      r.id.toLowerCase().includes(q) ||
      r.itemName.toLowerCase().includes(q) ||
      locationName.toLowerCase().includes(q) ||
      siteName.toLowerCase().includes(q) ||
      r.responsiblePerson.toLowerCase().includes(q)
    );
  });

  const selectedReport = reports.find((r) => r.id === selectedId);

  const handleCreate = async (data: DamageReportForm) => {
    try {
      const newReport = await apiFetch("/damage-reports", {
        method: "POST",
        body: JSON.stringify(data),
      });
      setReports((prev) => [newReport, ...prev]);
      setShowAdd(false);
      setSelectedId(newReport.id);
    } catch (error: any) {
      setApiError(error?.message || "Unable to create report.");
    }
  };

  const handleUpdate = async (updated: DamageReport | null) => {
    if (updated === null) {
      if (!selectedId) return;
      try {
        await apiFetch(`/damage-reports/${selectedId}`, { method: "DELETE" });
        setReports((prev) => prev.filter((r) => r.id !== selectedId));
        setSelectedId(null);
      } catch (error: any) {
        setApiError(error?.message || "Unable to delete.");
      }
      return;
    }
    try {
      const saved: DamageReport = await apiFetch(`/damage-reports/${updated.id}`, {
        method: "PUT",
        body: JSON.stringify(updated),
      });
      setReports((prev) => prev.map((r) => r.id === saved.id ? saved : r));
    } catch (error: any) {
      setApiError(error?.message || "Unable to update.");
    }
  };

  return (
    <div className="h-full flex gap-5">
      {/* Left panel – list */}
      <div className="w-96 flex-shrink-0 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
        <div className="p-4 border-b border-slate-100">
          {apiError && (
            <div className="mb-3 flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700">
              <AlertTriangle size={14} className="mt-0.5 flex-shrink-0" /><span>{apiError}</span>
            </div>
          )}
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search reports..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 text-sm border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          <button onClick={() => setShowAdd(true)} className="btn btn-primary w-full mt-4">
            <Plus size={14} /> New Report
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {loading ? (
            <div className="py-10 text-center text-sm text-slate-400">Loading...</div>
          ) : filtered.length === 0 ? (
            <div className="py-10 text-center text-sm text-slate-400">No reports found.</div>
          ) : (
            filtered.map((r) => {
              const color = getReportColor(r.id);
              const isSelected = selectedId === r.id;
              const loc = locations.find(l => l.id === r.locationId);
              const site = loc?.sites.find(s => s.id === r.siteId);
              return (
                <div
                  key={r.id}
                  onClick={() => setSelectedId(r.id)}
                  className={`p-3 rounded-xl border cursor-pointer transition-all hover:shadow-sm ${
                    isSelected ? color.activeCard : "border-slate-200 hover:border-slate-300 bg-white"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-9 h-9 rounded-lg ${color.avatarBg} ${color.avatarText} flex items-center justify-center text-[13px] font-black flex-shrink-0 shadow-sm`}>
                      {r.id.slice(-4)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start gap-1">
                        <div>
                          <div className={`font-mono text-[10px] font-semibold ${color.accent}`}>{r.id}</div>
                          <div className="font-semibold text-slate-800 text-sm leading-tight truncate">{r.itemName}</div>
                          <div className="text-xs text-slate-500 mt-0.5">
                            {loc?.name || ""} › {site?.name || ""}
                          </div>
                        </div>
                      </div>
                      <div className="text-xs text-slate-400 mt-1">
                        Qty: {r.quantity} • {r.damageType} • {r.responsiblePerson}
                      </div>
                    </div>
                  </div>
                  {isSelected && <div className={`mt-2 h-0.5 rounded-full ${color.avatarBg} opacity-50`} />}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Right panel – detail */}
      <div className="flex-1 min-w-0">
        {selectedReport ? (
          <DamageReportDetail
            report={selectedReport}
            locations={locations}
            availableItems={availableItems}
            availablePersons={availablePersons}
            onUpdate={handleUpdate}
            onClose={() => setSelectedId(null)}
          />
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm h-full flex flex-col items-center justify-center text-slate-400">
            <AlertTriangle size={48} className="mb-3 opacity-30" />
            <p className="text-sm font-medium">Select a damage report to view details</p>
          </div>
        )}
      </div>

      {showAdd && (
        <DamageReportFormModal
          locations={locations}
          availableItems={availableItems}
          availablePersons={availablePersons}
          onClose={() => setShowAdd(false)}
          onSave={handleCreate}
        />
      )}
    </div>
  );
}