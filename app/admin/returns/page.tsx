"use client";

import { useEffect, useState, useRef } from "react";
import { apiFetch } from "@/lib/api";
import {
  Plus, Search, Edit2, Trash2, X, Calendar,
  Package, Building2, FileText, ChevronDown,
  Check, ArrowRight, Home, AlertTriangle, List,
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

type ReturnItem = {
  id: string;
  itemName: string;
  quantity: number;
};

type ReturnNote = {
  id: string;
  fromLocationId: string;
  fromSiteId: string;
  toLocationId: string;
  toSiteId: string;
  returnDate: string;
  remarks: string;
  items: ReturnItem[];
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

const SEED_RETURNS: ReturnNote[] = [
  {
    id: "IRN-0001",
    fromLocationId: "LOC-OP-0001",
    fromSiteId: "SITE-OP-COL",
    toLocationId: "LOC-ADM-0001",
    toSiteId: "SITE-ADM-WH1",
    returnDate: "2025-03-20",
    remarks: "Return of surplus cement after tower completion",
    items: [
      { id: "ritem-1", itemName: "Cement (50kg bags)", quantity: 20 },
      { id: "ritem-2", itemName: "Steel Rebars (12mm)", quantity: 10 },
    ],
  },
  {
    id: "IRN-0002",
    fromLocationId: "LOC-OP-0001",
    fromSiteId: "SITE-OP-NBO",
    toLocationId: "LOC-ADM-0001",
    toSiteId: "SITE-ADM-WH2",
    returnDate: "2025-03-18",
    remarks: "Return of unused materials from phase 1",
    items: [
      { id: "ritem-3", itemName: "Sand (cubic meter)", quantity: 5 },
      { id: "ritem-4", itemName: "Aggregate (20mm)", quantity: 8 },
    ],
  },
  {
    id: "IRN-0003",
    fromLocationId: "LOC-ADM-0001",
    fromSiteId: "SITE-ADM-RS1",
    toLocationId: "LOC-OP-0001",
    toSiteId: "SITE-OP-COL",
    returnDate: "2025-03-16",
    remarks: "Repaired tools returned to site",
    items: [
      { id: "ritem-5", itemName: "Power Drill", quantity: 1 },
      { id: "ritem-6", itemName: "Angle Grinder", quantity: 1 },
    ],
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
function buildDefaultForm() {
  return {
    fromLocationId: "",
    fromSiteId: "",
    toLocationId: "",
    toSiteId: "",
    returnDate: new Date().toISOString().slice(0, 10),
    remarks: "",
    // FIX: itemIdCounter increment isolated here, not at render time
    items: [{ id: `ritem-${++itemIdCounter}`, itemName: "", quantity: 1 }],
  };
}

function ReturnNoteFormModal({
  initial,
  onClose,
  onSave,
  isEdit = false,
  locations,
}: {
  initial?: ReturnNote;
  onClose: () => void;
  onSave: (data: ReturnNote) => void;
  isEdit?: boolean;
  locations: Location[];
}) {
  // FIX: lazy initialiser so the factory runs exactly once on mount
  const [form, setForm] = useState(() =>
    initial
      ? { ...initial, items: initial.items.length ? initial.items : [{ id: `ritem-${++itemIdCounter}`, itemName: "", quantity: 1 }] }
      : buildDefaultForm()
  );

  const fromLoc = locations.find((l) => l.id === form.fromLocationId);
  const fromSites = fromLoc ? fromLoc.sites : [];
  const toLoc = locations.find((l) => l.id === form.toLocationId);
  const toSites = toLoc ? toLoc.sites : [];

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleItemChange = (index: number, field: keyof ReturnItem, value: string | number) => {
    setForm((prev) => {
      const newItems = [...prev.items];
      newItems[index] = { ...newItems[index], [field]: value };
      return { ...prev, items: newItems };
    });
  };

  const addItem = () => {
    setForm((prev) => ({
      ...prev,
      items: [...prev.items, { id: `ritem-${++itemIdCounter}`, itemName: "", quantity: 1 }],
    }));
  };

  const removeItem = (index: number) => {
    setForm((prev) => {
      if (prev.items.length <= 1) {
        const newItems = [...prev.items];
        newItems[index] = { ...newItems[index], itemName: "", quantity: 1 };
        return { ...prev, items: newItems };
      }
      // FIX: use ReturnItem (not RepairItem) — correct type for this file
      return { ...prev, items: prev.items.filter((_: ReturnItem, i: number) => i !== index) };
    });
  };

  const isValid =
    form.fromLocationId &&
    form.fromSiteId &&
    form.toLocationId &&
    form.toSiteId &&
    form.items.length > 0 &&
    form.items.every((item) => item.itemName.trim() && item.quantity > 0);

  return (
    <Modal title={isEdit ? "Edit Return Note" : "New Return Note"} onClose={onClose}>
      <div className="space-y-5">
        {/* From Section */}
        <div>
          <p className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
            <Building2 size={16} /> Returning From
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-600 mb-1.5">Location *</label>
              <select
                value={form.fromLocationId}
                onChange={(e) => {
                  // FIX: reset fromSiteId when fromLocation changes
                  setForm((prev) => ({ ...prev, fromLocationId: e.target.value, fromSiteId: "" }));
                }}
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="">Select Location</option>
                {locations.map((loc) => (
                  <option key={loc.id} value={loc.id}>{loc.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-600 mb-1.5">Site *</label>
              <select
                value={form.fromSiteId}
                onChange={(e) => handleChange("fromSiteId", e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-slate-100 disabled:cursor-not-allowed"
                disabled={!form.fromLocationId}
              >
                <option value="">Select Site</option>
                {fromSites.map((site) => (
                  <option key={site.id} value={site.id}>{site.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* To Section */}
        <div>
          <p className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
            <Home size={16} /> Returning To
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-600 mb-1.5">Location *</label>
              <select
                value={form.toLocationId}
                onChange={(e) => {
                  // FIX: reset toSiteId when toLocation changes
                  setForm((prev) => ({ ...prev, toLocationId: e.target.value, toSiteId: "" }));
                }}
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="">Select Location</option>
                {locations.map((loc) => (
                  <option key={loc.id} value={loc.id}>{loc.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-600 mb-1.5">Site *</label>
              <select
                value={form.toSiteId}
                onChange={(e) => handleChange("toSiteId", e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-slate-100 disabled:cursor-not-allowed"
                disabled={!form.toLocationId}
              >
                <option value="">Select Site</option>
                {toSites.map((site) => (
                  <option key={site.id} value={site.id}>{site.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Return Date */}
        <div>
          <label className="block text-sm font-semibold text-slate-600 mb-1.5">Return Date</label>
          <input
            type="date"
            value={form.returnDate}
            onChange={(e) => handleChange("returnDate", e.target.value)}
            className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>

        {/* Items Table */}
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
                {form.items.map((item, index) => (
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
          {form.items.some((item) => !item.itemName.trim() || item.quantity <= 0) && (
            <p className="mt-1 text-xs text-rose-500">All items must have a name and positive quantity.</p>
          )}
        </div>

        {/* Remarks */}
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
            onClick={() => { if (isValid) onSave(form as ReturnNote); }}
            disabled={!isValid}
            className={`btn btn-primary ${!isValid ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            {isEdit ? "Save Changes" : "Create Return Note"}
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ─── Detail Panel ──────────────────────────────────────────────────────────
function ReturnNoteDetail({ note, onUpdate, onClose, locations }: {
  note: ReturnNote;
  onUpdate: (updated: ReturnNote | null) => void;
  onClose: () => void;
  locations: Location[];
}) {
  const color = getNoteColor(note.id);
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);

  const fromLoc = locations.find((l) => l.id === note.fromLocationId);
  const fromSite = fromLoc?.sites.find((s) => s.id === note.fromSiteId);
  const toLoc = locations.find((l) => l.id === note.toLocationId);
  const toSite = toLoc?.sites.find((s) => s.id === note.toSiteId);
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
                <List size={14} /> {totalItems} item{totalItems > 1 ? "s" : ""}
              </span>
            </div>
            <h2 className="text-2xl font-bold text-slate-800 leading-tight">
              {fromSite?.name || "—"} <ArrowRight size={18} className="inline mx-1 text-slate-400" /> {toSite?.name || "—"}
            </h2>
            <p className="text-sm text-slate-500 mt-1">{note.returnDate}</p>
          </div>
        </div>
        <button onClick={onClose} className="p-1 rounded-lg hover:bg-white/70 text-slate-400"><X size={18} /></button>
      </div>

      <div className="flex-1 p-6 space-y-6 overflow-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex items-start gap-3">
            <Building2 size={18} className="text-slate-400 mt-1 flex-shrink-0" />
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Return From</p>
              <p className="text-slate-700 font-medium">{fromLoc?.name || "—"}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Home size={18} className="text-slate-400 mt-1 flex-shrink-0" />
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Return From Site</p>
              <p className="text-slate-700 font-medium">{fromSite?.name || "—"}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Building2 size={18} className="text-slate-400 mt-1 flex-shrink-0" />
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Return To</p>
              <p className="text-slate-700 font-medium">{toLoc?.name || "—"}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Home size={18} className="text-slate-400 mt-1 flex-shrink-0" />
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Return To Site</p>
              <p className="text-slate-700 font-medium">{toSite?.name || "—"}</p>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-100 pt-4">
          <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
            <Package size={16} /> Returned Items
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
                {note.items.map((item) => (
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
        <ReturnNoteFormModal
          isEdit
          initial={note}
          locations={locations}
          onClose={() => setShowEdit(false)}
          onSave={(data) => { onUpdate({ ...note, ...data }); setShowEdit(false); }}
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
export default function ReturnNotesPage() {
  const [notes, setNotes] = useState<ReturnNote[]>(SEED_RETURNS);
  const [locations, setLocations] = useState<Location[]>(SAMPLE_LOCATIONS);
  const [selectedId, setSelectedId] = useState<string | null>(SEED_RETURNS[0]?.id ?? null);
  const [search, setSearch] = useState("");
  const [apiError, setApiError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showAdd, setShowAdd] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setApiError("");
        const notesData = await apiFetch("/return-notes");
        if (Array.isArray(notesData)) {
          setNotes(notesData);
          setSelectedId((current) =>
            current && notesData.some((n: ReturnNote) => n.id === current) ? current : notesData[0]?.id ?? null
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
    const fromLoc = locations.find((l) => l.id === n.fromLocationId);
    const fromSite = fromLoc?.sites.find((s) => s.id === n.fromSiteId);
    const toLoc = locations.find((l) => l.id === n.toLocationId);
    const toSite = toLoc?.sites.find((s) => s.id === n.toSiteId);
    const fromName = fromSite?.name || "";
    const toName = toSite?.name || "";
    const itemNames = n.items.map((i) => i.itemName).join(" ").toLowerCase();
    return (
      n.id.toLowerCase().includes(q) ||
      fromName.toLowerCase().includes(q) ||
      toName.toLowerCase().includes(q) ||
      itemNames.includes(q)
    );
  });

  const selectedNote = notes.find((n) => n.id === selectedId);

  // FIX: generate local ID and fall back to local state when API is unavailable
  const handleCreate = async (data: ReturnNote) => {
    const localId = `IRN-${pad(notes.length + 1)}`;
    const newNote: ReturnNote = { ...data, id: localId };

    try {
      const saved = await apiFetch("/return-notes", {
        method: "POST",
        body: JSON.stringify(data),
      });
      setNotes((prev) => [saved, ...prev]);
      setShowAdd(false);
      setSelectedId(saved.id);
    } catch (error: any) {
      console.warn("API unavailable, using local state:", error);
      setNotes((prev) => [newNote, ...prev]);
      setShowAdd(false);
      setSelectedId(newNote.id);
      setApiError(error?.message || "Saved locally (API unavailable).");
    }
  };

  // FIX: fall back to local state mutations when API fails
  const handleUpdate = async (updated: ReturnNote | null) => {
    if (updated === null) {
      if (!selectedId) return;
      try {
        await apiFetch(`/return-notes/${selectedId}`, { method: "DELETE" });
      } catch (error: any) {
        console.warn("API delete failed, removing locally:", error);
        setApiError(error?.message || "Deleted locally (API unavailable).");
      } finally {
        // Always remove from local state regardless of API result
        setNotes((prev) => prev.filter((n) => n.id !== selectedId));
        setSelectedId(null);
      }
      return;
    }

    try {
      const saved = await apiFetch(`/return-notes/${updated.id}`, {
        method: "PUT",
        body: JSON.stringify(updated),
      });
      setNotes((prev) => prev.map((n) => (n.id === saved.id ? saved : n)));
    } catch (error: any) {
      console.warn("API update failed, updating locally:", error);
      setNotes((prev) => prev.map((n) => (n.id === updated.id ? updated : n)));
      setApiError(error?.message || "Saved locally (API unavailable).");
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
              placeholder="Search return notes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 text-sm border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          <button onClick={() => setShowAdd(true)} className="btn btn-primary w-full mt-4">
            <Plus size={14} /> New Return Note
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {loading ? (
            <div className="py-10 text-center text-sm text-slate-400">Loading...</div>
          ) : filtered.length === 0 ? (
            <div className="py-10 text-center text-sm text-slate-400">No return notes found.</div>
          ) : (
            filtered.map((n) => {
              const color = getNoteColor(n.id);
              const isSelected = selectedId === n.id;
              const fromLoc = locations.find((l) => l.id === n.fromLocationId);
              const fromSite = fromLoc?.sites.find((s) => s.id === n.fromSiteId);
              const toLoc = locations.find((l) => l.id === n.toLocationId);
              const toSite = toLoc?.sites.find((s) => s.id === n.toSiteId);
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
                        <div className="min-w-0">
                          <div className={`font-mono text-[10px] font-semibold ${color.accent}`}>{n.id}</div>
                          <div className="font-semibold text-slate-800 text-sm leading-tight truncate">
                            {fromSite?.name || "—"} <ArrowRight size={12} className="inline mx-0.5" /> {toSite?.name || "—"}
                          </div>
                          <div className="text-xs text-slate-500 mt-0.5">
                            {n.items.length} item{n.items.length > 1 ? "s" : ""}
                          </div>
                        </div>
                      </div>
                      <div className="text-xs text-slate-400 mt-1">
                        {n.returnDate}
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
          <ReturnNoteDetail
            note={selectedNote}
            locations={locations}
            onUpdate={handleUpdate}
            onClose={() => setSelectedId(null)}
          />
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm h-full flex flex-col items-center justify-center text-slate-400">
            <Package size={48} className="mb-3 opacity-30" />
            <p className="text-sm font-medium">Select a return note to view details</p>
          </div>
        )}
      </div>

      {showAdd && (
        <ReturnNoteFormModal
          locations={locations}
          onClose={() => setShowAdd(false)}
          onSave={handleCreate}
        />
      )}
    </div>
  );
}