"use client";

import { useEffect, useState, useRef } from "react";
import { apiFetch } from "@/lib/api";
import {
  Plus, Search, Edit2, Trash2, X, Calendar,
  Package, Building2, FileText, ChevronDown,
  Check, ArrowRight, Home, AlertTriangle, List,
  Wrench, Clock,
} from "lucide-react";

// ─── Helpers ────────────────────────────────────────────────────────────────
const pad = (n: number, width = 4) => String(n).padStart(width, "0");

let itemIdCounter = 0;

// ─── Color palette ──────────────────────────────────────────────────────────
const NOTE_COLORS = [
  { dot: "bg-violet-500", ring: "ring-violet-300", border: "border-violet-300", cardBg: "bg-violet-50/40", headerBg: "bg-violet-50", headerBorder: "border-violet-200", avatarBg: "bg-violet-500", avatarText: "text-white", accent: "text-violet-600", activeCard: "border-violet-400 bg-violet-50/50", filterActive: "bg-violet-600", idChip: "bg-violet-100 text-violet-700", subBorder: "border-violet-100" },
  { dot: "bg-sky-500", ring: "ring-sky-300", border: "border-sky-300", cardBg: "bg-sky-50/40", headerBg: "bg-sky-50", headerBorder: "border-sky-200", avatarBg: "bg-sky-500", avatarText: "text-white", accent: "text-sky-600", activeCard: "border-sky-400 bg-sky-50/50", filterActive: "bg-sky-600", idChip: "bg-sky-100 text-sky-700", subBorder: "border-sky-100" },
  { dot: "bg-emerald-500", ring: "ring-emerald-300", border: "border-emerald-300", cardBg: "bg-emerald-50/40", headerBg: "bg-emerald-50", headerBorder: "border-emerald-200", avatarBg: "bg-emerald-500", avatarText: "text-white", accent: "text-emerald-600", activeCard: "border-emerald-400 bg-emerald-50/50", filterActive: "bg-emerald-600", idChip: "bg-emerald-100 text-emerald-700", subBorder: "border-emerald-100" },
  { dot: "bg-rose-500", ring: "ring-rose-300", border: "border-rose-300", cardBg: "bg-rose-50/40", headerBg: "bg-rose-50", headerBorder: "border-rose-200", avatarBg: "bg-rose-500", avatarText: "text-white", accent: "text-rose-600", activeCard: "border-rose-400 bg-rose-50/50", filterActive: "bg-rose-600", idChip: "bg-rose-100 text-rose-700", subBorder: "border-rose-100" },
  { dot: "bg-amber-500", ring: "ring-amber-300", border: "border-amber-300", cardBg: "bg-amber-50/40", headerBg: "bg-amber-50", headerBorder: "border-amber-200", avatarBg: "bg-amber-500", avatarText: "text-white", accent: "text-amber-600", activeCard: "border-amber-400 bg-amber-50/50", filterActive: "bg-amber-600", idChip: "bg-amber-100 text-amber-700", subBorder: "border-amber-100" },
  { dot: "bg-indigo-500", ring: "ring-indigo-300", border: "border-indigo-300", cardBg: "bg-indigo-50/40", headerBg: "bg-indigo-50", headerBorder: "border-indigo-200", avatarBg: "bg-indigo-500", avatarText: "text-white", accent: "text-indigo-600", activeCard: "border-indigo-400 bg-indigo-50/50", filterActive: "bg-indigo-600", idChip: "bg-indigo-100 text-indigo-700", subBorder: "border-indigo-100" },
  { dot: "bg-teal-500", ring: "ring-teal-300", border: "border-teal-300", cardBg: "bg-teal-50/40", headerBg: "bg-teal-50", headerBorder: "border-teal-200", avatarBg: "bg-teal-500", avatarText: "text-white", accent: "text-teal-600", activeCard: "border-teal-400 bg-teal-50/50", filterActive: "bg-teal-600", idChip: "bg-teal-100 text-teal-700", subBorder: "border-teal-100" },
  { dot: "bg-pink-500", ring: "ring-pink-300", border: "border-pink-300", cardBg: "bg-pink-50/40", headerBg: "bg-pink-50", headerBorder: "border-pink-200", avatarBg: "bg-pink-500", avatarText: "text-white", accent: "text-pink-600", activeCard: "border-pink-400 bg-pink-50/50", filterActive: "bg-pink-600", idChip: "bg-pink-100 text-pink-700", subBorder: "border-pink-100" },
];

function noteColorIndex(id: string): number {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  return hash % NOTE_COLORS.length;
}
function getNoteColor(id: string) { return NOTE_COLORS[noteColorIndex(id)]; }

// ─── Data types ────────────────────────────────────────────────────────────
type Site = { id: string; name: string };
type Location = { id: string; name: string; sites: Site[] };

type RepairItem = {
  id: string;
  itemName: string;
  quantity: number;
};

type RepairNote = {
  id: string;
  locationId: string;     // Which location/site is sending
  siteId: string;
  items: RepairItem[];
  vendor: string;
  repairStatus: "Pending" | "In Progress" | "Completed" | "Returned" | "Cancelled";
  expectedReturnDate: string;
  remarks: string;
  createdDate: string;    // when the note was created
};

// ─── Sample data ──────────────────────────────────────────────────────────
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

const SAMPLE_VENDORS = [
  "ABC Tools & Equipment",
  "XYZ Machinery Services",
  "Fix-It Repairs Ltd",
  "Industrial Maintenance Co.",
  "Power Tools Plus",
  "Generator Services Inc.",
  "Safety Gear Repairs",
];

const REPAIR_STATUSES = ["Pending", "In Progress", "Completed", "Returned", "Cancelled"];

const STATUS_STYLES: Record<string, "green" | "amber" | "gray" | "blue" | "red"> = {
  "Pending": "amber",
  "In Progress": "blue",
  "Completed": "green",
  "Returned": "gray",
  "Cancelled": "red",
};

const SEED_REPAIRS: RepairNote[] = [
  {
    id: "RMN-0001",
    locationId: "LOC-OP-0001",
    siteId: "SITE-OP-COL",
    items: [
      { id: "ritem-1", itemName: "Power Drill", quantity: 2 },
      { id: "ritem-2", itemName: "Angle Grinder", quantity: 1 },
    ],
    vendor: "ABC Tools & Equipment",
    repairStatus: "In Progress",
    expectedReturnDate: "2025-04-10",
    remarks: "Regular maintenance and blade replacement",
    createdDate: "2025-03-25",
  },
  {
    id: "RMN-0002",
    locationId: "LOC-ADM-0001",
    siteId: "SITE-ADM-WH1",
    items: [
      { id: "ritem-3", itemName: "Generator", quantity: 1 },
    ],
    vendor: "Generator Services Inc.",
    repairStatus: "Pending",
    expectedReturnDate: "2025-04-15",
    remarks: "Electrical fault, needs full service",
    createdDate: "2025-03-28",
  },
  {
    id: "RMN-0003",
    locationId: "LOC-OP-0001",
    siteId: "SITE-OP-NBO",
    items: [
      { id: "ritem-4", itemName: "Concrete Mixer", quantity: 1 },
      { id: "ritem-5", itemName: "Power Drill", quantity: 3 },
    ],
    vendor: "Industrial Maintenance Co.",
    repairStatus: "Completed",
    expectedReturnDate: "2025-04-02",
    remarks: "All repaired and tested",
    createdDate: "2025-03-20",
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
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filtered = options.filter(opt => opt.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="relative" ref={containerRef}>
      <div
        className="flex items-center justify-between w-full border border-slate-200 rounded-lg px-3 py-2 text-sm cursor-pointer bg-white hover:border-slate-300 transition"
        onClick={() => setOpen(!open)}
      >
        <span className={value ? "text-slate-800" : "text-slate-400"}>
          {value || placeholder}
        </span>
        <ChevronDown size={16} className="text-slate-400" />
      </div>
      {open && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-lg max-h-48 overflow-auto">
          <div className="p-2 sticky top-0 bg-white border-b border-slate-100">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="Type to filter..."
              onClick={(e) => e.stopPropagation()}
            />
          </div>
          {filtered.length === 0 ? (
            <div className="p-3 text-sm text-slate-500">No options</div>
          ) : (
            filtered.map(opt => (
              <div
                key={opt}
                className="px-4 py-2 hover:bg-slate-50 cursor-pointer text-sm flex items-center justify-between"
                onClick={() => { onChange(opt); setOpen(false); setSearch(""); }}
              >
                {opt}
                {value === opt && <Check size={16} className="text-blue-600" />}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

// ─── Shared modals ─────────────────────────────────────────────────────────
function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-xl font-bold text-slate-800">{title}</h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-100 text-slate-400"><X size={18} /></button>
        </div>
        <div className="overflow-y-auto p-6">{children}</div>
      </div>
    </div>
  );
}

function ConfirmModal({ name, onClose, onConfirm }: any) {
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
function RepairNoteFormModal({
  initial,
  onClose,
  onSave,
  isEdit = false,
  locations,
}: any) {
  const defaultItems = initial?.items?.length ? initial.items : [{ id: `ritem-${++itemIdCounter}`, itemName: "", quantity: 1 }];
  const [form, setForm] = useState(initial || {
    locationId: "",
    siteId: "",
    items: defaultItems,
    vendor: "",
    repairStatus: "Pending",
    expectedReturnDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10), // 2 weeks from now
    remarks: "",
  });

  const loc = locations.find((l: Location) => l.id === form.locationId);
  const sites = loc ? loc.sites : [];

  const handleChange = (field: string, value: any) => {
    setForm({ ...form, [field]: value });
  };

  const handleItemChange = (index: number, field: keyof RepairItem, value: any) => {
    const newItems = [...form.items];
    newItems[index] = { ...newItems[index], [field]: value };
    setForm({ ...form, items: newItems });
  };

  const addItem = () => {
    setForm({
      ...form,
      items: [...form.items, { id: `ritem-${++itemIdCounter}`, itemName: "", quantity: 1 }],
    });
  };

  const removeItem = (index: number) => {
    if (form.items.length <= 1) {
      const newItems = [...form.items];
      newItems[index] = { ...newItems[index], itemName: "", quantity: 1 };
      setForm({ ...form, items: newItems });
      return;
    }
    const newItems = form.items.filter((_, i) => i !== index);
    setForm({ ...form, items: newItems });
  };

  const isValid =
    form.locationId &&
    form.siteId &&
    form.vendor.trim() &&
    form.items.length > 0 &&
    form.items.every((item: RepairItem) => item.itemName.trim() && item.quantity > 0) &&
    form.expectedReturnDate;

  return (
    <Modal title={isEdit ? "Edit Repair Note" : "New Repair Note"} onClose={onClose}>
      <div className="space-y-5">
        {/* Location & Site */}
        <div>
          <p className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
            <Building2 size={16} /> Site Location
          </p>
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
                {sites.map((site: Site) => (
                  <option key={site.id} value={site.id}>{site.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Items */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="block text-sm font-semibold text-slate-600">Items *</label>
            <button
              type="button"
              onClick={addItem}
              className="text-sm bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition flex items-center gap-1"
            >
              <Plus size={16} /> Add Item
            </button>
          </div>
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-2 text-left font-semibold text-slate-600">Item</th>
                  <th className="px-4 py-2 text-left font-semibold text-slate-600 w-24">Qty</th>
                  <th className="px-4 py-2 text-center font-semibold text-slate-600 w-12">Action</th>
                </tr>
              </thead>
              <tbody>
                {form.items.map((item: RepairItem, index: number) => (
                  <tr key={item.id} className="border-b border-slate-100 last:border-0">
                    <td className="px-4 py-2">
                      <Combobox
                        options={SAMPLE_ITEMS}
                        value={item.itemName}
                        onChange={(val) => handleItemChange(index, "itemName", val)}
                        placeholder="Select item..."
                      />
                    </td>
                    <td className="px-4 py-2">
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(index, "quantity", parseInt(e.target.value) || 0)}
                        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </td>
                    <td className="px-4 py-2 text-center">
                      <button
                        type="button"
                        onClick={() => removeItem(index)}
                        className="text-rose-500 hover:text-rose-700 transition"
                        title={form.items.length <= 1 ? "Clear item" : "Remove item"}
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {form.items.some((item: RepairItem) => !item.itemName.trim() || item.quantity <= 0) && (
            <p className="mt-1 text-xs text-rose-500">All items must have a name and positive quantity.</p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-slate-600 mb-1.5">Vendor *</label>
            <Combobox
              options={SAMPLE_VENDORS}
              value={form.vendor}
              onChange={(val) => handleChange("vendor", val)}
              placeholder="Select vendor..."
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-600 mb-1.5">Repair Status</label>
            <select
              value={form.repairStatus}
              onChange={(e) => handleChange("repairStatus", e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            >
              {REPAIR_STATUSES.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-600 mb-1.5">Expected Return Date *</label>
          <input
            type="date"
            value={form.expectedReturnDate}
            onChange={(e) => handleChange("expectedReturnDate", e.target.value)}
            className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-600 mb-1.5">Remarks</label>
          <textarea
            rows={2}
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
            {isEdit ? "Save Changes" : "Create Repair Note"}
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ─── Detail Panel ──────────────────────────────────────────────────────────
function RepairNoteDetail({ note, onUpdate, onClose, locations }: any) {
  const color = getNoteColor(note.id);
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);

  const loc = locations.find((l: Location) => l.id === note.locationId);
  const site = loc?.sites.find((s: Site) => s.id === note.siteId);

  const totalItems = note.items.length;

  return (
    <div className={`bg-white rounded-2xl border ${color.border} shadow-sm h-full flex flex-col overflow-hidden`}>
      <div className={`px-6 py-5 border-b ${color.headerBorder} ${color.headerBg} flex justify-between items-start`}>
        <div className="flex items-start gap-4">
          <div className={`w-12 h-12 rounded-xl ${color.avatarBg} ${color.avatarText} flex items-center justify-center text-lg font-black shadow-sm flex-shrink-0`}>
            {note.id.slice(-4)}
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className={`font-mono text-xs px-2 py-0.5 rounded-lg font-semibold ${color.idChip}`}>{note.id}</span>
              <span className="text-xs text-slate-500 flex items-center gap-1">
                <List size={14} /> {totalItems} item{totalItems > 1 ? 's' : ''}
              </span>
            </div>
            <h2 className="text-2xl font-bold text-slate-800 leading-tight">
              {site?.name || "—"}
            </h2>
            <div className="flex items-center gap-2 mt-1">
              <Wrench size={14} className="text-slate-400" />
              <span className="text-sm font-medium text-slate-600">{note.vendor}</span>
            </div>
          </div>
        </div>
        <button onClick={onClose} className="p-1 rounded-lg hover:bg-white/70 text-slate-400"><X size={18} /></button>
      </div>

      <div className="flex-1 p-6 space-y-6 overflow-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Vendor</p>
              <p className="text-slate-700 font-medium">{note.vendor}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Clock size={18} className="text-slate-400 mt-1 flex-shrink-0" />
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</p>
              <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                note.repairStatus === "Pending" ? "bg-amber-100 text-amber-700" :
                note.repairStatus === "In Progress" ? "bg-blue-100 text-blue-700" :
                note.repairStatus === "Completed" ? "bg-green-100 text-green-700" :
                note.repairStatus === "Returned" ? "bg-gray-100 text-gray-700" :
                "bg-red-100 text-red-700"
              }`}>
                {note.repairStatus}
              </span>
            </div>
          </div>
          <div className="flex items-start gap-3 col-span-1 sm:col-span-2">
            <Calendar size={18} className="text-slate-400 mt-1 flex-shrink-0" />
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Expected Return Date</p>
              <p className="text-slate-700 font-medium">{note.expectedReturnDate}</p>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-100 pt-4">
          <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
            <Package size={16} /> Items for Repair
          </h3>
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-2 text-left font-semibold text-slate-600">Item</th>
                  <th className="px-4 py-2 text-left font-semibold text-slate-600 w-24">Quantity</th>
                </tr>
              </thead>
              <tbody>
                {note.items.map((item: RepairItem) => (
                  <tr key={item.id} className="border-b border-slate-100 last:border-0">
                    <td className="px-4 py-2">{item.itemName}</td>
                    <td className="px-4 py-2">{item.quantity}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {note.remarks && (
          <div className="border-t border-slate-100 pt-4">
            <div className="flex items-start gap-3">
              <FileText size={18} className="text-slate-400 mt-1 flex-shrink-0" />
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Remarks</p>
                <p className="text-slate-700">{note.remarks}</p>
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
        <RepairNoteFormModal
          isEdit
          initial={note}
          locations={locations}
          onClose={() => setShowEdit(false)}
          onSave={(data: any) => { onUpdate({ ...note, ...data }); setShowEdit(false); }}
        />
      )}
      {showDelete && (
        <ConfirmModal
          name={`${note.id} (${note.items.length} items)`}
          onClose={() => setShowDelete(false)}
          onConfirm={() => { onUpdate(null); setShowDelete(false); }}
        />
      )}
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────
export default function RepairNotesPage() {
  const [notes, setNotes] = useState<RepairNote[]>(SEED_REPAIRS);
  const [locations, setLocations] = useState<Location[]>(SAMPLE_LOCATIONS);
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
        const notesData = await apiFetch("/repair-notes");
        if (Array.isArray(notesData)) {
          setNotes(notesData);
          setSelectedId((current) =>
            current && notesData.some((n: any) => n.id === current) ? current : notesData[0]?.id || null
          );
        }
        const locData = await apiFetch("/site-locations");
        if (Array.isArray(locData)) {
          const mapped = locData.map((l: any) => ({
            id: l.id,
            name: l.siteName || l.name,
            sites: (l.subLevels || []).map((s: any) => ({ id: s.id, name: s.name })),
          }));
          setLocations(mapped);
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

  const filtered = notes.filter((n) => {
    const q = search.toLowerCase();
    const loc = locations.find(l => l.id === n.locationId);
    const site = loc?.sites.find(s => s.id === n.siteId);
    const siteName = site?.name || "";
    const itemNames = n.items.map(i => i.itemName).join(" ").toLowerCase();
    return (
      n.id.toLowerCase().includes(q) ||
      siteName.toLowerCase().includes(q) ||
      n.vendor.toLowerCase().includes(q) ||
      itemNames.includes(q) ||
      n.repairStatus.toLowerCase().includes(q)
    );
  });

  const selectedNote = notes.find((n) => n.id === selectedId);

  const handleCreate = async (data: any) => {
    try {
      const newNote = await apiFetch("/repair-notes", {
        method: "POST",
        body: JSON.stringify({ ...data, createdDate: new Date().toISOString().slice(0, 10) }),
      });
      setNotes((prev) => [newNote, ...prev]);
      setShowAdd(false);
      setSelectedId(newNote.id);
    } catch (error: any) {
      setApiError(error?.message || "Unable to create repair note.");
    }
  };

  const handleUpdate = async (updated: RepairNote | null) => {
    if (updated === null) {
      if (!selectedId) return;
      try {
        await apiFetch(`/repair-notes/${selectedId}`, { method: "DELETE" });
        setNotes((prev) => prev.filter((n) => n.id !== selectedId));
        setSelectedId(null);
      } catch (error: any) {
        setApiError(error?.message || "Unable to delete.");
      }
      return;
    }
    try {
      const saved = await apiFetch(`/repair-notes/${updated.id}`, {
        method: "PUT",
        body: JSON.stringify(updated),
      });
      setNotes((prev) => prev.map((n) => n.id === saved.id ? saved : n));
    } catch (error: any) {
      setApiError(error?.message || "Unable to update.");
    }
  };

  return (
    <div className="h-full flex gap-5">
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
              placeholder="Search repair notes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 text-sm border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          <button onClick={() => setShowAdd(true)} className="btn btn-primary w-full mt-4">
            <Plus size={14} /> New Repair Note
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {loading ? (
            <div className="py-10 text-center text-sm text-slate-400">Loading...</div>
          ) : filtered.length === 0 ? (
            <div className="py-10 text-center text-sm text-slate-400">No repair notes found.</div>
          ) : (
            filtered.map((n) => {
              const color = getNoteColor(n.id);
              const isSelected = selectedId === n.id;
              const loc = locations.find(l => l.id === n.locationId);
              const site = loc?.sites.find(s => s.id === n.siteId);
              return (
                <div
                  key={n.id}
                  onClick={() => setSelectedId(n.id)}
                  className={`p-3 rounded-xl border cursor-pointer transition-all hover:shadow-sm ${
                    isSelected ? color.activeCard : "border-slate-200 hover:border-slate-300 bg-white"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-9 h-9 rounded-lg ${color.avatarBg} ${color.avatarText} flex items-center justify-center text-[13px] font-black flex-shrink-0 shadow-sm`}>
                      {n.id.slice(-4)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start gap-1">
                        <div>
                          <div className={`font-mono text-[10px] font-semibold ${color.accent}`}>{n.id}</div>
                          <div className="font-semibold text-slate-800 text-sm leading-tight truncate">
                            {site?.name || "—"}
                          </div>
                          <div className="text-xs text-slate-500 mt-0.5">
                            {n.items.length} item{n.items.length > 1 ? 's' : ''} • {n.vendor}
                          </div>
                        </div>
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                          n.repairStatus === "Pending" ? "bg-amber-100 text-amber-700" :
                          n.repairStatus === "In Progress" ? "bg-blue-100 text-blue-700" :
                          n.repairStatus === "Completed" ? "bg-green-100 text-green-700" :
                          n.repairStatus === "Returned" ? "bg-gray-100 text-gray-700" :
                          "bg-red-100 text-red-700"
                        }`}>
                          {n.repairStatus}
                        </span>
                      </div>
                      <div className="text-xs text-slate-400 mt-1">
                        Return: {n.expectedReturnDate}
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

      <div className="flex-1 min-w-0">
        {selectedNote ? (
          <RepairNoteDetail
            note={selectedNote}
            locations={locations}
            onUpdate={handleUpdate}
            onClose={() => setSelectedId(null)}
          />
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm h-full flex flex-col items-center justify-center text-slate-400">
            <Wrench size={48} className="mb-3 opacity-30" />
            <p className="text-sm font-medium">Select a repair note to view details</p>
          </div>
        )}
      </div>

      {showAdd && (
        <RepairNoteFormModal
          locations={locations}
          onClose={() => setShowAdd(false)}
          onSave={handleCreate}
        />
      )}
    </div>
  );
}