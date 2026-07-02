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

type TransferItem = {
  id: string;
  itemId?: string;
  itemName: string;
  quantity: number;
};

type AvailableItem = {
  id: string;
  name: string;
  label: string;
};

type TransferNote = {
  id: string;
  fromLocationId: string;
  fromSiteId: string;
  toLocationId: string;
  toSiteId: string;
  transferDate: string;
  remarks: string;
  items: TransferItem[];
};

// ─── Sample data ──────────────────────────────────────────────────────────
function textValue(value: any, fallback = "") {
  if (value == null) return fallback;
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (typeof value === "object") {
    return textValue(value.itemName || value.name || value.model || value.label || value.id, fallback);
  }
  return fallback;
}

function normalizeTransferItem(item: any, index: number): TransferItem {
  return {
    id: textValue(item?.id, `item-${index + 1}`),
    itemId: item?.itemId ? textValue(item.itemId) : undefined,
    itemName: textValue(item?.itemName || item?.name || item?.item || item, `Item ${index + 1}`),
    quantity: Number(item?.quantity || 1),
  };
}

function normalizeTransferNote(note: any, fallbackIndex = 0): TransferNote {
  const items = Array.isArray(note?.items) ? note.items : [];
  return {
    id: textValue(note?.id, `ITN-${pad(fallbackIndex + 1)}`),
    fromLocationId: textValue(note?.fromLocationId),
    fromSiteId: textValue(note?.fromSiteId),
    toLocationId: textValue(note?.toLocationId),
    toSiteId: textValue(note?.toSiteId),
    transferDate: textValue(note?.transferDate, new Date().toISOString().slice(0, 10)),
    remarks: textValue(note?.remarks),
    items: items.map(normalizeTransferItem),
  };
}

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

function mapInventoryOptions(itemsData: any[]): AvailableItem[] {
  return itemsData
    .map((entry: any) => {
      const item = entry?.item ?? entry;
      const name = textValue(
        item?.itemName || item?.name || item?.model || item?.id || ""
      ).trim();
      const id = textValue(item?.id || entry?.id || name).trim();
      if (!name || !id) return null;
      return {
        id,
        name,
        label: name,
      } as AvailableItem;
    })
    .filter(Boolean) as AvailableItem[];
}

function getItemOptions(availableItems: AvailableItem[]) {
  const liveOptions = availableItems.map((item) => item.label).filter(Boolean);
  return liveOptions.length ? liveOptions : SAMPLE_ITEMS;
}

const SEED_NOTES: TransferNote[] = [
  {
    id: "ITN-0001",
    fromLocationId: "LOC-ADM-0001",
    fromSiteId: "SITE-ADM-WH1",
    toLocationId: "LOC-OP-0001",
    toSiteId: "SITE-OP-COL",
    transferDate: "2025-03-15",
    remarks: "Transfer for tower construction",
    items: [
      { id: "item-1", itemName: "Cement (50kg bags)", quantity: 100 },
      { id: "item-2", itemName: "Steel Rebars (12mm)", quantity: 50 },
    ],
  },
  {
    id: "ITN-0002",
    fromLocationId: "LOC-ADM-0001",
    fromSiteId: "SITE-ADM-WH2",
    toLocationId: "LOC-OP-0001",
    toSiteId: "SITE-OP-NBO",
    transferDate: "2025-03-14",
    remarks: "For phase 1 foundation",
    items: [
      { id: "item-3", itemName: "Steel Rebars (16mm)", quantity: 30 },
      { id: "item-4", itemName: "Sand (cubic meter)", quantity: 20 },
    ],
  },
  {
    id: "ITN-0003",
    fromLocationId: "LOC-OP-0001",
    fromSiteId: "SITE-OP-COL",
    toLocationId: "LOC-ADM-0001",
    toSiteId: "SITE-ADM-RS1",
    transferDate: "2025-03-13",
    remarks: "Returned for repair",
    items: [
      { id: "item-5", itemName: "Power Drill", quantity: 2 },
      { id: "item-6", itemName: "Angle Grinder", quantity: 1 },
    ],
  },
];

// ─── Combobox (portal-based — escapes overflow clipping) ──────────────────
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

  // Recalculate position whenever open state changes
  useEffect(() => {
    if (open && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const dropdownHeight = 224;
      const showAbove = spaceBelow < dropdownHeight && rect.top > dropdownHeight;
      setDropdownStyle({
        position: "fixed",
        top: showAbove ? rect.top - dropdownHeight - 4 : rect.bottom + 4,
        left: rect.left,
        width: rect.width,
        zIndex: 9999,
      });
      // Auto-focus search input
      setTimeout(() => searchRef.current?.focus(), 10);
    }
  }, [open]);

  // Close on outside click
  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      if (
        triggerRef.current?.contains(e.target as Node) ||
        dropdownRef.current?.contains(e.target as Node)
      )
        return;
      setOpen(false);
      setSearch("");
    };
    document.addEventListener("mousedown", handleMouseDown);
    return () => document.removeEventListener("mousedown", handleMouseDown);
  }, []);

  const filtered = options.filter((opt) =>
    opt.toLowerCase().includes(search.toLowerCase())
  );

  const dropdown = (
    <div
      ref={dropdownRef}
      style={dropdownStyle}
      className="bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden"
    >
      {/* Search input */}
      <div className="p-2 bg-white border-b border-slate-100">
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
      {/* Options list */}
      <div className="overflow-y-auto max-h-44">
        {filtered.length === 0 ? (
          <div className="px-4 py-3 text-sm text-slate-400 text-center">
            No options found
          </div>
        ) : (
          filtered.map((opt) => (
            <div
              key={opt}
              onMouseDown={(e) => {
                // preventDefault stops blur firing before selection
                e.preventDefault();
                onChange(opt);
                setOpen(false);
                setSearch("");
              }}
              className={`px-4 py-2 text-sm cursor-pointer flex items-center justify-between transition-colors ${
                value === opt
                  ? "bg-blue-50 text-blue-700 font-medium"
                  : "hover:bg-slate-50 text-slate-700"
              }`}
            >
              <span className="truncate">{opt}</span>
              {value === opt && (
                <Check size={14} className="text-blue-600 flex-shrink-0 ml-2" />
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Trigger button */}
      <div
        ref={triggerRef}
        onClick={() => setOpen((o) => !o)}
        className={`flex items-center justify-between w-full border rounded-lg px-3 py-2 text-sm cursor-pointer bg-white transition-all select-none ${
          open
            ? "border-blue-400 ring-2 ring-blue-100"
            : "border-slate-200 hover:border-slate-300"
        }`}
      >
        <span className={`truncate ${value ? "text-slate-800" : "text-slate-400"}`}>
          {value || placeholder}
        </span>
        <ChevronDown
          size={15}
          className={`flex-shrink-0 ml-2 text-slate-400 transition-transform duration-150 ${
            open ? "rotate-180" : ""
          }`}
        />
      </div>

      {/* Portal dropdown — renders into document.body, no clipping */}
      {typeof document !== "undefined" &&
        open &&
        ReactDOM.createPortal(dropdown, document.body)}
    </>
  );
}

// ─── Shared modals ─────────────────────────────────────────────────────────
function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-xl font-bold text-slate-800">{title}</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-100 text-slate-400"
          >
            <X size={18} />
          </button>
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
        Are you sure you want to delete{" "}
        <strong className="text-rose-600">{name}</strong>? This action cannot be
        undone.
      </p>
      <div className="flex justify-end gap-3 mt-6">
        <button onClick={onClose} className="btn">
          Cancel
        </button>
        <button onClick={onConfirm} className="btn btn-danger">
          Delete
        </button>
      </div>
    </Modal>
  );
}

// ─── Form Modal ────────────────────────────────────────────────────────────
function TransferNoteFormModal({
  initial,
  onClose,
  onSave,
  isEdit = false,
  locations,
  availableItems = [],
}: any) {
  const defaultItems =
    initial?.items?.length
      ? initial.items
      : [{ id: `item-${++itemIdCounter}`, itemName: "", quantity: 1 }];

  const [form, setForm] = useState(
    initial || {
      fromLocationId: "",
      fromSiteId: "",
      toLocationId: "",
      toSiteId: "",
      transferDate: new Date().toISOString().slice(0, 10),
      remarks: "",
      items: defaultItems,
    }
  );

  const fromLoc = locations.find((l: Location) => l.id === form.fromLocationId);
  const fromSites = fromLoc ? fromLoc.sites : [];
  const toLoc = locations.find((l: Location) => l.id === form.toLocationId);
  const toSites = toLoc ? toLoc.sites : [];

  const handleChange = (field: string, value: any) => {
    setForm((prev: any) => ({ ...prev, [field]: value }));
  };

  const handleItemChange = (
    index: number,
    field: keyof TransferItem,
    value: any
  ) => {
    const newItems = [...form.items];
    newItems[index] = { ...newItems[index], [field]: value };
    setForm((prev: any) => ({ ...prev, items: newItems }));
  };

  const addItem = () => {
    setForm((prev: any) => ({
      ...prev,
      items: [
        ...prev.items,
        { id: `item-${++itemIdCounter}`, itemName: "", quantity: 1 },
      ],
    }));
  };

  const removeItem = (index: number) => {
    if (form.items.length <= 1) {
      // Clear instead of remove when only one row remains
      const newItems = [...form.items];
      newItems[index] = { ...newItems[index], itemName: "", quantity: 1 };
      setForm((prev: any) => ({ ...prev, items: newItems }));
      return;
    }
    setForm((prev: any) => ({
      ...prev,
      items: prev.items.filter((_: any, i: number) => i !== index),
    }));
  };

  const isValid =
    form.fromLocationId &&
    form.fromSiteId &&
    form.toLocationId &&
    form.toSiteId &&
    form.items.length > 0 &&
    form.items.every(
      (item: TransferItem) => item.itemName.trim() && item.quantity > 0
    );

  const hasItemErrors = form.items.some(
    (item: TransferItem) => !item.itemName.trim() || item.quantity <= 0
  );

  const itemOptions = getItemOptions(availableItems);

  return (
    <Modal
      title={isEdit ? "Edit Transfer Note" : "New Transfer Note"}
      onClose={onClose}
    >
      <div className="space-y-5">
        {/* ── From ── */}
        <div>
          <p className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
            <Building2 size={16} /> From
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-600 mb-1.5">
                Location *
              </label>
              <select
                value={form.fromLocationId}
                onChange={(e) => {
                  handleChange("fromLocationId", e.target.value);
                  handleChange("fromSiteId", "");
                }}
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="">Select Location</option>
                {locations.map((loc: Location) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-600 mb-1.5">
                Site *
              </label>
              <select
                value={form.fromSiteId}
                onChange={(e) => handleChange("fromSiteId", e.target.value)}
                disabled={!form.fromLocationId}
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-slate-100 disabled:cursor-not-allowed"
              >
                <option value="">Select Site</option>
                {fromSites.map((site: Site) => (
                  <option key={site.id} value={site.id}>
                    {site.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* ── To ── */}
        <div>
          <p className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
            <Home size={16} /> To
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-600 mb-1.5">
                Location *
              </label>
              <select
                value={form.toLocationId}
                onChange={(e) => {
                  handleChange("toLocationId", e.target.value);
                  handleChange("toSiteId", "");
                }}
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="">Select Location</option>
                {locations.map((loc: Location) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-600 mb-1.5">
                Site *
              </label>
              <select
                value={form.toSiteId}
                onChange={(e) => handleChange("toSiteId", e.target.value)}
                disabled={!form.toLocationId}
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-slate-100 disabled:cursor-not-allowed"
              >
                <option value="">Select Site</option>
                {toSites.map((site: Site) => (
                  <option key={site.id} value={site.id}>
                    {site.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* ── Transfer Date ── */}
        <div>
          <label className="block text-sm font-semibold text-slate-600 mb-1.5">
            Transfer Date
          </label>
          <input
            type="date"
            value={form.transferDate}
            onChange={(e) => handleChange("transferDate", e.target.value)}
            className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>

        {/* ── Items (card-per-row, portal combobox) ── */}
        <div>
          <div className="flex justify-between items-center mb-3">
            <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <Package size={16} /> Items *
              <span className="text-slate-400 font-normal text-xs">
                ({form.items.length} row{form.items.length !== 1 ? "s" : ""})
              </span>
            </label>
            <button
              type="button"
              onClick={addItem}
              className="text-sm bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 active:bg-blue-800 transition flex items-center gap-1.5 font-medium"
            >
              <Plus size={14} /> Add Item
            </button>
          </div>

          <div className="space-y-2">
            {form.items.map((item: TransferItem, index: number) => {
              const rowError =
                !item.itemName.trim() || item.quantity <= 0;
              return (
                <div
                  key={item.id}
                  className={`flex items-center gap-3 px-3 py-3 rounded-xl border transition-colors ${
                    rowError
                      ? "border-rose-200 bg-rose-50/40"
                      : "border-slate-200 bg-slate-50/50 hover:border-slate-300"
                  }`}
                >
                  {/* Row index badge */}
                  <div className="w-6 h-6 rounded-full bg-slate-200 text-slate-500 text-xs font-bold flex items-center justify-center flex-shrink-0 select-none">
                    {index + 1}
                  </div>

                  {/* Item combobox — takes remaining space */}
                  <div className="flex-1 min-w-0">
                    <Combobox
                      options={itemOptions}
                      value={item.itemName}
                      onChange={(val) => {
                        const matchedItem = availableItems.find((candidate: AvailableItem) => candidate.label === val);
                        handleItemChange(index, "itemName", matchedItem?.name || val);
                        handleItemChange(index, "itemId", matchedItem?.id || undefined);
                      }}
                      placeholder="Select or search item..."
                    />
                  </div>

                  {/* Quantity stepper */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      type="button"
                      onClick={() =>
                        handleItemChange(
                          index,
                          "quantity",
                          Math.max(1, item.quantity - 1)
                        )
                      }
                      className="w-7 h-7 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 active:bg-slate-200 flex items-center justify-center text-slate-500 transition text-base font-bold select-none"
                      aria-label="Decrease quantity"
                    >
                      −
                    </button>
                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) =>
                        handleItemChange(
                          index,
                          "quantity",
                          parseInt(e.target.value) || 0
                        )
                      }
                      className={`w-14 border rounded-lg px-2 py-1.5 text-sm text-center focus:ring-2 outline-none transition ${
                        item.quantity <= 0
                          ? "border-rose-300 focus:ring-rose-100 bg-rose-50"
                          : "border-slate-200 focus:ring-blue-500 bg-white"
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() =>
                        handleItemChange(index, "quantity", item.quantity + 1)
                      }
                      className="w-7 h-7 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 active:bg-slate-200 flex items-center justify-center text-slate-500 transition text-base font-bold select-none"
                      aria-label="Increase quantity"
                    >
                      +
                    </button>
                  </div>

                  {/* Remove / clear button */}
                  <button
                    type="button"
                    onClick={() => removeItem(index)}
                    title={
                      form.items.length <= 1 ? "Clear item" : "Remove item"
                    }
                    className="w-7 h-7 rounded-lg hover:bg-rose-100 flex items-center justify-center text-slate-400 hover:text-rose-600 transition flex-shrink-0"
                  >
                    <X size={15} />
                  </button>
                </div>
              );
            })}
          </div>

          {/* Inline validation hint */}
          {hasItemErrors && (
            <p className="mt-2 text-xs text-rose-500 flex items-center gap-1">
              <AlertTriangle size={12} />
              All items must have a name and a quantity of at least 1.
            </p>
          )}
        </div>

        {/* ── Remarks ── */}
        <div>
          <label className="block text-sm font-semibold text-slate-600 mb-1.5">
            Remarks
          </label>
          <textarea
            rows={2}
            value={form.remarks}
            onChange={(e) => handleChange("remarks", e.target.value)}
            className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none"
            placeholder="Additional details..."
          />
        </div>

        {/* ── Actions ── */}
        <div className="flex justify-end gap-3 pt-2">
          <button onClick={onClose} className="btn">
            Cancel
          </button>
          <button
            onClick={() => {
              if (isValid) onSave(form);
            }}
            disabled={!isValid}
            className={`btn btn-primary ${
              !isValid ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            {isEdit ? "Save Changes" : "Create Note"}
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ─── Detail Panel ──────────────────────────────────────────────────────────
function TransferNoteDetail({ note, onUpdate, onClose, locations, availableItems }: any) {
  const color = getNoteColor(note.id);
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);

  const fromLoc = locations.find((l: Location) => l.id === note.fromLocationId);
  const fromSite = fromLoc?.sites.find((s: Site) => s.id === note.fromSiteId);
  const toLoc = locations.find((l: Location) => l.id === note.toLocationId);
  const toSite = toLoc?.sites.find((s: Site) => s.id === note.toSiteId);

  const totalItems = note.items.length;

  return (
    <div
      className={`bg-white rounded-2xl border ${color.border} shadow-sm h-full flex flex-col overflow-hidden`}
    >
      {/* Header */}
      <div
        className={`px-6 py-5 border-b ${color.headerBorder} ${color.headerBg} flex justify-between items-start`}
      >
        <div className="flex items-start gap-4">
          <div
            className={`w-12 h-12 rounded-xl ${color.avatarBg} ${color.avatarText} flex items-center justify-center text-lg font-black shadow-sm flex-shrink-0`}
          >
            {note.id.slice(-4)}
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span
                className={`font-mono text-xs px-2 py-0.5 rounded-lg font-semibold ${color.idChip}`}
              >
                {note.id}
              </span>
              <span className="text-xs text-slate-500 flex items-center gap-1">
                <List size={14} /> {totalItems} item{totalItems > 1 ? "s" : ""}
              </span>
            </div>
            <h2 className="text-2xl font-bold text-slate-800 leading-tight">
              {fromSite?.name || "—"}{" "}
              <ArrowRight size={18} className="inline mx-1 text-slate-400" />{" "}
              {toSite?.name || "—"}
            </h2>
            <p className="text-sm text-slate-500 mt-1">{note.transferDate}</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-lg hover:bg-white/70 text-slate-400"
        >
          <X size={18} />
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 p-6 space-y-6 overflow-auto">
        {/* Location / site grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex items-start gap-3">
            <Building2 size={18} className="text-slate-400 mt-1 flex-shrink-0" />
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                From Location
              </p>
              <p className="text-slate-700 font-medium">{fromLoc?.name || "—"}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Home size={18} className="text-slate-400 mt-1 flex-shrink-0" />
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                From Site
              </p>
              <p className="text-slate-700 font-medium">{fromSite?.name || "—"}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Building2 size={18} className="text-slate-400 mt-1 flex-shrink-0" />
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                To Location
              </p>
              <p className="text-slate-700 font-medium">{toLoc?.name || "—"}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Home size={18} className="text-slate-400 mt-1 flex-shrink-0" />
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                To Site
              </p>
              <p className="text-slate-700 font-medium">{toSite?.name || "—"}</p>
            </div>
          </div>
        </div>

        {/* Items table */}
        <div className="border-t border-slate-100 pt-4">
          <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
            <Package size={16} /> Transferred Items
          </h3>
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-2 text-left font-semibold text-slate-600">
                    Item
                  </th>
                  <th className="px-4 py-2 text-left font-semibold text-slate-600 w-24">
                    Quantity
                  </th>
                </tr>
              </thead>
              <tbody>
                {note.items.map((item: TransferItem) => (
                  <tr
                    key={item.id}
                    className="border-b border-slate-100 last:border-0"
                  >
                    <td className="px-4 py-2">{textValue(item.itemName)}</td>
                    <td className="px-4 py-2">{Number(item.quantity || 0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Remarks */}
        {note.remarks && (
          <div className="border-t border-slate-100 pt-4">
            <div className="flex items-start gap-3">
              <FileText
                size={18}
                className="text-slate-400 mt-1 flex-shrink-0"
              />
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Remarks
                </p>
                <p className="text-slate-700">{note.remarks}</p>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-4 border-t border-slate-100">
          <button onClick={() => setShowEdit(true)} className="btn btn-primary">
            <Edit2 size={14} /> Edit
          </button>
          <button onClick={() => setShowDelete(true)} className="btn btn-danger">
            <Trash2 size={14} /> Delete
          </button>
        </div>
      </div>

      {showEdit && (
        <TransferNoteFormModal
          isEdit
          initial={note}
          locations={locations}
          availableItems={availableItems}
          onClose={() => setShowEdit(false)}
          onSave={(data: any) => {
            onUpdate({ ...note, ...data });
            setShowEdit(false);
          }}
        />
      )}
      {showDelete && (
        <ConfirmModal
          name={`${note.id} (${note.items.length} items)`}
          onClose={() => setShowDelete(false)}
          onConfirm={() => {
            onUpdate(null);
            setShowDelete(false);
          }}
        />
      )}
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────
export default function TransferNotesPage() {
  const [notes, setNotes] = useState<TransferNote[]>(SEED_NOTES);
  const [locations, setLocations] = useState<Location[]>(SAMPLE_LOCATIONS);
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
        const [notesResult, locResult, itemsResult] = await Promise.allSettled([
          apiFetch("/transfer-notes"),
          apiFetch("/site-locations"),
          apiFetch("/items"),
        ]);

        const notesData = notesResult.status === "fulfilled" ? notesResult.value : null;
        const locData = locResult.status === "fulfilled" ? locResult.value : null;
        const itemsData = itemsResult.status === "fulfilled" ? itemsResult.value : null;

        if (Array.isArray(notesData) && notesData.length > 0) {
          const mappedNotes = notesData.map(normalizeTransferNote);
          setNotes(mappedNotes);
          setSelectedId((current) =>
            current && mappedNotes.some((n: any) => n.id === current)
              ? current
              : mappedNotes[0]?.id || null
          );
        }
        if (Array.isArray(locData) && locData.length > 0) {
          const mapped = locData.map((l: any) => ({
            id: l.id,
            name: l.siteName || l.name,
            sites: (Array.isArray(l.subLevels) ? l.subLevels : []).map((s: any) => ({
              id: s.id,
              name: s.name,
            })),
          })).filter((l: Location) => l.id && l.name && l.sites.length > 0);
          if (mapped.length > 0) {
            setLocations(mapped);
          }
        }
        if (Array.isArray(itemsData) && itemsData.length > 0) {
          const mappedItems = mapInventoryOptions(itemsData);
          setAvailableItems(mappedItems);
        }
        const failures = [notesResult, locResult, itemsResult].filter((result) => result.status === "rejected");
        if (failures.length > 0) {
          setApiError("Some live data is unavailable; showing saved and sample options.");
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
    const itemNames = n.items.map((i) => textValue(i.itemName)).join(" ").toLowerCase();
    return (
      textValue(n.id).toLowerCase().includes(q) ||
      (fromSite?.name || "").toLowerCase().includes(q) ||
      (toSite?.name || "").toLowerCase().includes(q) ||
      itemNames.includes(q)
    );
  });

  const selectedNote = notes.find((n) => n.id === selectedId);

  const handleCreate = async (data: any) => {
    try {
      const newNote = await apiFetch("/transfer-notes", {
        method: "POST",
        body: JSON.stringify(data),
      });
      const mappedNote = normalizeTransferNote(newNote);
      setNotes((prev) => [mappedNote, ...prev]);
      setShowAdd(false);
      setSelectedId(mappedNote.id);
    } catch (error: any) {
      setApiError(error?.message || "Unable to create note.");
    }
  };

  const handleUpdate = async (updated: TransferNote | null) => {
    if (updated === null) {
      if (!selectedId) return;
      try {
        await apiFetch(`/transfer-notes/${selectedId}`, { method: "DELETE" });
        setNotes((prev) => prev.filter((n) => n.id !== selectedId));
        setSelectedId(null);
      } catch (error: any) {
        setApiError(error?.message || "Unable to delete.");
      }
      return;
    }
    try {
      const saved = await apiFetch(`/transfer-notes/${updated.id}`, {
        method: "PUT",
        body: JSON.stringify(updated),
      });
      const mappedNote = normalizeTransferNote(saved);
      setNotes((prev) => prev.map((n) => (n.id === mappedNote.id ? mappedNote : n)));
    } catch (error: any) {
      setApiError(error?.message || "Unable to update.");
    }
  };

  return (
    <div className="h-full flex gap-5">
      {/* ── Left panel – list ── */}
      <div className="w-96 flex-shrink-0 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
        <div className="p-4 border-b border-slate-100">
          {apiError && (
            <div className="mb-3 flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700">
              <AlertTriangle size={14} className="mt-0.5 flex-shrink-0" />
              <span>{apiError}</span>
            </div>
          )}
          <div className="relative">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              placeholder="Search notes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 text-sm border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          <button
            onClick={() => setShowAdd(true)}
            className="btn btn-primary w-full mt-4"
          >
            <Plus size={14} /> New Transfer Note
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {loading ? (
            <div className="py-10 text-center text-sm text-slate-400">
              Loading...
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-10 text-center text-sm text-slate-400">
              No transfer notes found.
            </div>
          ) : (
            filtered.map((n) => {
              const color = getNoteColor(n.id);
              const isSelected = selectedId === n.id;
              const fromLoc = locations.find((l) => l.id === n.fromLocationId);
              const fromSite = fromLoc?.sites.find(
                (s) => s.id === n.fromSiteId
              );
              const toLoc = locations.find((l) => l.id === n.toLocationId);
              const toSite = toLoc?.sites.find((s) => s.id === n.toSiteId);
              return (
                <div
                  key={n.id}
                  onClick={() => setSelectedId(n.id)}
                  className={`p-3 rounded-xl border cursor-pointer transition-all hover:shadow-sm ${
                    isSelected
                      ? color.activeCard
                      : "border-slate-200 hover:border-slate-300 bg-white"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-9 h-9 rounded-lg ${color.avatarBg} ${color.avatarText} flex items-center justify-center text-[13px] font-black flex-shrink-0 shadow-sm`}
                    >
                      {n.id.slice(-4)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start gap-1">
                        <div>
                          <div
                            className={`font-mono text-[10px] font-semibold ${color.accent}`}
                          >
                            {n.id}
                          </div>
                          <div className="font-semibold text-slate-800 text-sm leading-tight truncate">
                            {fromSite?.name || "—"}{" "}
                            <ArrowRight size={12} className="inline mx-0.5" />{" "}
                            {toSite?.name || "—"}
                          </div>
                          <div className="text-xs text-slate-500 mt-0.5">
                            {n.items.length} item
                            {n.items.length > 1 ? "s" : ""}
                          </div>
                        </div>
                      </div>
                      <div className="text-xs text-slate-400 mt-1">
                        {n.transferDate}
                      </div>
                    </div>
                  </div>
                  {isSelected && (
                    <div
                      className={`mt-2 h-0.5 rounded-full ${color.avatarBg} opacity-50`}
                    />
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ── Right panel – detail ── */}
      <div className="flex-1 min-w-0">
        {selectedNote ? (
          <TransferNoteDetail
            note={selectedNote}
            locations={locations}
            availableItems={availableItems}
            onUpdate={handleUpdate}
            onClose={() => setSelectedId(null)}
          />
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm h-full flex flex-col items-center justify-center text-slate-400">
            <Package size={48} className="mb-3 opacity-30" />
            <p className="text-sm font-medium">
              Select a transfer note to view details
            </p>
          </div>
        )}
      </div>

      {/* ── Add modal ── */}
      {showAdd && (
        <TransferNoteFormModal
          locations={locations}
          availableItems={availableItems}
          onClose={() => setShowAdd(false)}
          onSave={handleCreate}
        />
      )}
    </div>
  );
}
