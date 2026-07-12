"use client";

import { useEffect, useState, useRef } from "react";
import ReactDOM from "react-dom";
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

type AvailableItem = {
  id: string;
  name: string;
  label: string;
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

function textValue(value: any, fallback = "") {
  if (value == null) return fallback;
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (typeof value === "object") {
    return textValue(value.name || value.label || value.id, fallback);
  }
  return fallback;
}

// Some backends send location/site ids as plain strings, others as nested
// objects (e.g. { id, name }) or under a different key entirely. This pulls
// out something usable, preferring an explicit id but falling back to a name
// so lookups still have something to match against (see resolveLocation /
// resolveSite below).
function extractRefId(value: any): string {
  if (value == null) return "";
  if (typeof value === "string" || typeof value === "number") return String(value);
  if (typeof value === "object") {
    return textValue(
      value.id ?? value._id ?? value.siteId ?? value.locationId ?? value.code ?? value.name,
      ""
    );
  }
  return "";
}

// Resolve a location by id, falling back to matching on name if the id
// doesn't line up (covers backends that send inconsistent id fields).
function resolveLocation(locations: Location[], ref: string): Location | undefined {
  if (!ref) return undefined;
  return (
    locations.find((l) => l.id === ref) ||
    locations.find((l) => l.name === ref)
  );
}

// Resolve a site within a location by id, falling back to name.
function resolveSite(location: Location | undefined, ref: string): Site | undefined {
  if (!location || !ref) return undefined;
  return (
    location.sites.find((s) => s.id === ref) ||
    location.sites.find((s) => s.name === ref)
  );
}

// Defensive normalizer: guarantees every ReturnNote has a real `items` array
// and every expected field, regardless of what shape the API actually returns
// (e.g. a not-yet-fully-implemented endpoint, or a record missing some fields).
function normalizeReturnNote(raw: any, fallbackId: string): ReturnNote {
  return {
    id: raw?.id || raw?.docId || fallbackId,
    fromLocationId: extractRefId(raw?.fromLocationId ?? raw?.fromLocation),
    fromSiteId: extractRefId(raw?.fromSiteId ?? raw?.fromSite),
    toLocationId: extractRefId(raw?.toLocationId ?? raw?.toLocation),
    toSiteId: extractRefId(raw?.toSiteId ?? raw?.toSite),
    returnDate: raw?.returnDate || (raw?.createdAt ? new Date(raw.createdAt).toISOString().slice(0, 10) : ""),
    remarks: raw?.remarks || raw?.notes || "",
    items: Array.isArray(raw?.items)
      ? raw.items.map((item: any, index: number) => ({
          id: item?.id || `${raw?.id || fallbackId}-item-${index + 1}`,
          itemName: item?.itemName || item?.name || "",
          quantity: Number(item?.quantity || 0),
        }))
      : [],
  };
}

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
    const dropdownHeight = 224;
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
    const handleClickOutside = (event: MouseEvent) => {
      if (
        triggerRef.current?.contains(event.target as Node) ||
        dropdownRef.current?.contains(event.target as Node)
      ) return;
      setOpen(false);
      setSearch("");
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filtered = options.filter(opt => opt.toLowerCase().includes(search.toLowerCase()));

  const dropdown = (
    <div
      ref={dropdownRef}
      style={dropdownStyle}
      className="bg-white border border-slate-200 rounded-lg shadow-xl max-h-56 overflow-auto"
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
        className="flex items-center justify-between w-full border border-slate-200 rounded-lg px-3 py-2 text-sm cursor-pointer bg-white hover:border-slate-300 transition"
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
    items: [{ id: `ritem-${++itemIdCounter}`, itemName: "", quantity: 1 }],
  };
}

function ReturnNoteFormModal({
  initial,
  onClose,
  onSave,
  isEdit = false,
  locations,
  availableItems = [],
}: {
  initial?: ReturnNote;
  onClose: () => void;
  onSave: (data: ReturnNote) => void;
  isEdit?: boolean;
  locations: Location[];
  availableItems?: AvailableItem[];
}) {
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

  const itemOptions = availableItems.map((item) => item.label);

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
                        options={itemOptions}
                        value={item.itemName}
                        onChange={(val) => {
                          const matchedItem = availableItems.find((candidate) => candidate.label === val);
                          handleItemChange(index, "itemName", matchedItem?.name || val);
                        }}
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
function ReturnNoteDetail({ note, onUpdate, onClose, locations, availableItems }: {
  note: ReturnNote;
  onUpdate: (updated: ReturnNote | null) => void;
  onClose: () => void;
  locations: Location[];
  availableItems: AvailableItem[];
}) {
  const color = getNoteColor(note.id);
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);

  const fromLoc = resolveLocation(locations, note.fromLocationId);
  const fromSite = resolveSite(fromLoc, note.fromSiteId);
  const toLoc = resolveLocation(locations, note.toLocationId);
  const toSite = resolveSite(toLoc, note.toSiteId);
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
          availableItems={availableItems}
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
  const [notes, setNotes] = useState<ReturnNote[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [availableItems, setAvailableItems] = useState<AvailableItem[]>([]);
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
        // FIX: this was fetching "/transfer-notes" — wrong resource for a
        // Return Notes page. The backend exposes a dedicated "/return-notes"
        // endpoint (confirmed via server route log), so use that instead.
        const [notesResult, locResult, itemsResult] = await Promise.allSettled([
          apiFetch("/return-notes"),
          apiFetch("/site-locations"),
          apiFetch("/items"),
        ]);

        const notesData = notesResult.status === "fulfilled" ? notesResult.value : null;
        const locData = locResult.status === "fulfilled" ? locResult.value : null;
        const itemsData = itemsResult.status === "fulfilled" ? itemsResult.value : null;

        if (Array.isArray(notesData) && notesData.length > 0) {
          const normalized = notesData.map((n: any, index: number) => normalizeReturnNote(n, `IRN-${pad(index + 1)}`));
          setNotes(normalized);
          setSelectedId((current) =>
            current && normalized.some((n) => n.id === current) ? current : normalized[0]?.id ?? null
          );
        }
        if (Array.isArray(locData) && locData.length > 0) {
          // FIX: id fields on the location/site records aren't guaranteed to
          // be called "id" — fall back to other common id keys so sites
          // don't silently end up with an undefined id (which breaks lookup).
          const mapped = locData.map((l: any) => ({
            id: textValue(l.id ?? l._id ?? l.locationId, ""),
            name: l.siteName || l.name,
            sites: (Array.isArray(l.subLevels) ? l.subLevels : []).map((s: any) => ({
              id: textValue(s.id ?? s._id ?? s.siteId ?? s.code ?? s.name, ""),
              name: s.name,
            })),
          })).filter((l: Location) => l.id && l.name && l.sites.length > 0);
          if (mapped.length > 0) {
            setLocations(mapped);
          }
        }
        if (Array.isArray(itemsData) && itemsData.length > 0) {
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
        const failures = [notesResult, locResult, itemsResult].filter((result) => result.status === "rejected");
        if (failures.length > 0) {
          setApiError("Some live data is unavailable. Please check your connection and refresh.");
        }
      } catch (error: any) {
        console.warn("Unable to load return notes data", error);
        setApiError(error?.message || "Unable to load data.");
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const filtered = notes.filter((n) => {
    const q = search.toLowerCase();
    const fromLoc = resolveLocation(locations, n.fromLocationId);
    const fromSite = resolveSite(fromLoc, n.fromSiteId);
    const toLoc = resolveLocation(locations, n.toLocationId);
    const toSite = resolveSite(toLoc, n.toSiteId);
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

  const handleCreate = async (data: ReturnNote) => {
    const localId = `IRN-${pad(notes.length + 1)}`;
    const newNote: ReturnNote = { ...data, id: localId };

    try {
      // FIX: was posting to "/transfer-notes"
      const saved = await apiFetch("/return-notes", {
        method: "POST",
        body: JSON.stringify(data),
      });
      const normalized = normalizeReturnNote(saved, localId);
      setNotes((prev) => [normalized, ...prev]);
      setShowAdd(false);
      setSelectedId(normalized.id);
    } catch (error: any) {
      console.warn("API unavailable, using local state:", error);
      setNotes((prev) => [newNote, ...prev]);
      setShowAdd(false);
      setSelectedId(newNote.id);
      setApiError(error?.message || "Saved locally (API unavailable).");
    }
  };

  const handleUpdate = async (updated: ReturnNote | null) => {
    if (updated === null) {
      if (!selectedId) return;
      try {
        // FIX: was deleting via "/transfer-notes/:id"
        await apiFetch(`/return-notes/${selectedId}`, { method: "DELETE" });
      } catch (error: any) {
        console.warn("API delete failed, removing locally:", error);
        setApiError(error?.message || "Deleted locally (API unavailable).");
      } finally {
        setNotes((prev) => prev.filter((n) => n.id !== selectedId));
        setSelectedId(null);
      }
      return;
    }

    try {
      // FIX: was updating via "/transfer-notes/:id"
      const saved = await apiFetch(`/return-notes/${updated.id}`, {
        method: "PUT",
        body: JSON.stringify(updated),
      });
      const normalized = normalizeReturnNote(saved, updated.id);
      setNotes((prev) => prev.map((n) => (n.id === normalized.id ? normalized : n)));
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
            <div className="py-10 text-center text-sm text-slate-400">
            {notes.length === 0 ? "No return notes yet." : "No return notes match your search."}
          </div>
          ) : (
            filtered.map((n) => {
              const color = getNoteColor(n.id);
              const isSelected = selectedId === n.id;
              const fromLoc = resolveLocation(locations, n.fromLocationId);
              const fromSite = resolveSite(fromLoc, n.fromSiteId);
              const toLoc = resolveLocation(locations, n.toLocationId);
              const toSite = resolveSite(toLoc, n.toSiteId);
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
            availableItems={availableItems}
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
          availableItems={availableItems}
          onClose={() => setShowAdd(false)}
          onSave={handleCreate}
        />
      )}
    </div>
  );
}