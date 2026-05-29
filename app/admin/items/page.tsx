"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  Plus, Search, Eye, Pencil, Trash2, X, AlertCircle,
  QrCode, Package, Wrench, RefreshCw, ChevronDown,
  Hash, Calendar, Download, Filter, Layers, Tag,
  CheckCircle, Clock, Archive, Boxes
} from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

const ITEM_TYPES = ["Tool", "Reusable", "Consumable"];

const TOOL_CATEGORIES = [
  { code: "CUT", label: "Cutting Machines",       fields: ["maxHours","serialNo","bladeType"] },
  { code: "DRL", label: "Drilling Machines",       fields: ["maxHours","chuckSize","serialNo"] },
  { code: "MIX", label: "Concrete Mixers",         fields: ["drumHours","capacityLitres"] },
  { code: "GEN", label: "Generators",              fields: ["runningHours","outputKVA"] },
  { code: "PMP", label: "Pumps",                   fields: ["runningHours","flowRate"] },
  { code: "WLD", label: "Welding Machines",        fields: ["arcHours","amperageRange"] },
  { code: "LEV", label: "Laser Levels / Surveying",fields: ["calibrationDate","range"] },
  { code: "EXC", label: "Excavators",              fields: ["engineHours","bucketCapacity"] },
  { code: "CRN", label: "Cranes",                  fields: ["liftHours","maxLoadRating"] },
  { code: "SCF", label: "Scaffolding Systems",     fields: ["serialNo"] },
];

const REUSABLE_CATEGORIES = [
  { code: "SCF",  label: "Scaffolding Frames",          defaultPieces: 5,  unit: "frames" },
  { code: "PROP", label: "Acrow Props / Steel Props",   defaultPieces: 10, unit: "props" },
  { code: "FWK",  label: "Formwork / Shuttering Panels",defaultPieces: 4,  unit: "panels" },
  { code: "PLK",  label: "Scaffold Planks / Boards",    defaultPieces: 6,  unit: "planks" },
  { code: "CPLA", label: "Column Plates",               defaultPieces: 1,  unit: "plates", individualTracking: true },
  { code: "SAFE", label: "Safety Netting",              defaultPieces: 1,  unit: "rolls" },
];

const CONSUMABLE_CATEGORIES = [
  { code: "CEM",  label: "Cement (bagged)",               unit: "Bags" },
  { code: "SND",  label: "Sand (bulk)",                   unit: "Cubic metres" },
  { code: "STN",  label: "Crushed Stone / Aggregate",     unit: "Cubic metres" },
  { code: "SBK",  label: "Sandbags",                      unit: "Units" },
  { code: "RBR",  label: "Rebar / Steel Reinforcement",   unit: "Length (m) or kg" },
  { code: "PNT",  label: "Paint",                         unit: "Litres" },
  { code: "PVC",  label: "PVC / Plumbing Materials",      unit: "Units or metres" },
  { code: "CONC", label: "Ready-mix Concrete",            unit: "Cubic metres" },
];

const STATUS_OPTIONS = ["Active", "In Use", "Under Maintenance", "Retired", "Out of Stock"];

const STATUS_STYLES = {
  "Active":            { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", dot: "bg-emerald-500" },
  "Available":         { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", dot: "bg-emerald-500" },
  "In Warehouse":      { bg: "bg-sky-50",     text: "text-sky-700",    border: "border-sky-200",    dot: "bg-sky-500"    },
  "Ready":             { bg: "bg-teal-50",    text: "text-teal-700",   border: "border-teal-200",   dot: "bg-teal-500"   },
  "On Site":           { bg: "bg-blue-50",    text: "text-blue-700",   border: "border-blue-200",   dot: "bg-blue-500"   },
  "Returning":         { bg: "bg-amber-50",   text: "text-amber-700",  border: "border-amber-200",  dot: "bg-amber-500"  },
  "Damaged":           { bg: "bg-rose-50",    text: "text-rose-600",   border: "border-rose-200",   dot: "bg-rose-500"   },
  "Expired":           { bg: "bg-rose-50",    text: "text-rose-600",   border: "border-rose-200",   dot: "bg-rose-500"   },
  "Depleted":          { bg: "bg-slate-100",  text: "text-slate-500",  border: "border-slate-200",  dot: "bg-slate-400"  },
  "Under Maintenance": { bg: "bg-amber-50",   text: "text-amber-700",  border: "border-amber-200",  dot: "bg-amber-500"  },
  "Retired":           { bg: "bg-rose-50",    text: "text-rose-600",   border: "border-rose-200",   dot: "bg-rose-500"   },
  "Out of Stock":      { bg: "bg-slate-100",  text: "text-slate-500",  border: "border-slate-200",  dot: "bg-slate-400"  },
};

const TYPE_STYLES = {
  Tool:       { bg: "bg-violet-50", text: "text-violet-700", border: "border-violet-200", icon: Wrench,   accent: "#7c3aed" },
  Reusable:   { bg: "bg-teal-50",   text: "text-teal-700",   border: "border-teal-200",   icon: RefreshCw,accent: "#0f766e" },
  Consumable: { bg: "bg-orange-50", text: "text-orange-700", border: "border-orange-200", icon: Boxes,    accent: "#c2410c" },
};

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function uid() { return Math.random().toString(36).slice(2, 9); }

function pad(n, len = 4) { return String(n).padStart(len, "0"); }

function todayStr() { return new Date().toISOString().slice(0, 10); }

function formatDate(d) {
  return d ? new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—";
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

const STATUS_DISPLAY = {
  ACTIVE: "Active",
  AVAILABLE: "Available",
  IN_WAREHOUSE: "In Warehouse",
  READY: "Ready",
  ON_SITE: "On Site",
  IN_TRANSIT: "In Transit",
  RETURNING: "Returning",
  DAMAGED: "Damaged",
  IN_REPAIR: "In Repair",
  EXPIRED: "Expired",
  DEPLETED: "Depleted",
  PROCURED: "Procured",
  SCRAPPED: "Scrapped",
  INSPECTION: "Inspection",
};

function normalizeStatus(value) {
  if (!value) return "Active";
  const key = String(value).trim().toUpperCase();
  return STATUS_DISPLAY[key] || value.replace(/_/g, " ").replace(/\b\w/g, (ch) => ch.toUpperCase());
}

function normalizeType(value) {
  if (!value) return "Tool";
  const type = String(value).trim().toLowerCase();
  return type === "consumable" ? "Consumable" : type === "reusable" ? "Reusable" : "Tool";
}

function parseCategoryCode(item) {
  if (item.subCategory?.code) return item.subCategory.code;
  if (item.id?.startsWith("REUS-")) {
    const parts = item.id.split("-");
    return parts[1] || "REUS";
  }
  if (item.id?.startsWith("CONS-")) {
    const parts = item.id.split("-");
    return parts[1] || "CONS";
  }
  if (item.id?.startsWith("TOOL-")) {
    const parts = item.id.split("-");
    return parts[1] || "TOOL";
  }
  return "";
}

function getCategoryLabel(type, code) {
  const itemType = normalizeType(type);
  const category = getCategoryByCode(itemType, code);
  return category?.label || code || "Unknown";
}

function mapBackendItem(itemRecord) {
  const item = itemRecord.item || itemRecord;
  const type = normalizeType(itemRecord.type || item.type);
  const categoryCode = parseCategoryCode(item);
  const categoryLabel = getCategoryLabel(type, categoryCode);
  return {
    id: item.id,
    itemId: item.id,
    type,
    categoryCode,
    categoryLabel,
    name: item.itemName || item.model || item.bundleId || item.id,
    status: normalizeStatus(item.status),
    location: item.location?.siteName || item.location?.siteName || item.location?.name || item.locationId || "",
    supplier: item.supplier || "",
    purchaseDate: item.purchaseDate ? item.purchaseDate.split("T")[0] : "",
    warrantyExp: item.warrantyExpiry ? item.warrantyExpiry.split("T")[0] : "",
    quantity: item.quantity ?? item.pieceNum ?? item.pieceCount ?? 1,
    unit: item.unit || (type === "Reusable" ? "pcs" : ""),
    batchDate: item.batchDate ? item.batchDate.split("T")[0] : "",
    pieceCount: item.pieceCount ?? item.pieceNum ?? "",
    registeredDate: item.receivedDate ? item.receivedDate.split("T")[0] : item.purchaseDate ? item.purchaseDate.split("T")[0] : todayStr(),
    meta: {
      maxHours: item.maxHours || "",
      serialNo: item.serialNumber || "",
      bladeType: item.bladeType || "",
      ...item.meta,
    },
    description: item.description || "",
  };
}

async function apiFetch(path, options = {}) {
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  if (typeof window !== "undefined") {
    const token = localStorage.getItem("admin_token");
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  const body = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(body?.message || body?.error || response.statusText || "API request failed");
  }
  return body;
}

function createItemPayload(form, subCategories) {
  const subCategory = subCategories.find((cat) => cat.code === form.categoryCode);

  const payload = {
    type: form.type.toLowerCase(),
    subCategoryId: subCategory?.id,
    subCategoryCode: subCategory ? undefined : form.categoryCode,
    itemName: form.name,
    description: form.description || undefined,
    supplier: form.supplier || undefined,
    location: form.location || undefined,
    status: form.status || undefined,
    purchaseDate: form.purchaseDate ? new Date(form.purchaseDate).toISOString() : undefined,
    warrantyExpiry: form.warrantyExp ? new Date(form.warrantyExp).toISOString() : undefined,
  };

  if (form.type === "Tool") {
    payload.quantity = Number(form.quantity) || 1;
    payload.maxHours = form.meta?.maxHours ? Number(form.meta.maxHours) : undefined;
    payload.serialNumber = form.meta?.serialNo || undefined;
    payload.bladeType = form.meta?.bladeType || undefined;
  }

  if (form.type === "Consumable") {
    payload.batchDate = form.batchDate ? new Date(form.batchDate).toISOString() : undefined;
    payload.quantity = Number(form.quantity) || 0;
    payload.unit = form.unit || undefined;
    payload.expiryDate = form.expiryDate ? new Date(form.expiryDate).toISOString() : undefined;
  }

  if (form.type === "Reusable") {
    payload.pieceCount = Number(form.pieceCount) || 1;
    payload.individualTracking = form.individualTracking === "Yes";
    payload.bundleId = form.bundleId || undefined;
  }

  return payload;
}

// Counters per category — used to auto-increment IDs
const counters = {};
function nextSeq(key) {
  counters[key] = (counters[key] || 0) + 1;
  return counters[key];
}

function generateItemId(type, catCode, date) {
  if (type === "Tool") {
    const seq = nextSeq(`TOOL-${catCode}`);
    return `TOOL-${catCode}-${pad(seq)}`;
  }
  if (type === "Reusable") {
    const seq = nextSeq(`REUS-${catCode}`);
    return `REUS-${catCode}-${pad(seq)}`;
  }
  if (type === "Consumable") {
    const d = date || todayStr();
    const [y, m, day] = d.split("-");
    const seq = nextSeq(`CONS-${catCode}-${d}`);
    return `CONS-${catCode}-${y}-${m}-${day}-${pad(seq, 2)}`;
  }
  return `ITEM-${uid()}`;
}

function getCategoryList(type) {
  if (type === "Tool")       return TOOL_CATEGORIES;
  if (type === "Reusable")   return REUSABLE_CATEGORIES;
  if (type === "Consumable") return CONSUMABLE_CATEGORIES;
  return [];
}

function getCategoryByCode(type, code) {
  return getCategoryList(type).find((c) => c.code === code) || null;
}

// ─────────────────────────────────────────────────────────────────────────────
// QR CODE — pure canvas, no external lib
// Encodes text as a simple visual placeholder QR-style grid using a hash
// For production, swap canvas draw with a real QR library like qrcode.js
// ─────────────────────────────────────────────────────────────────────────────

function hashCode(str) {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = (h * 0x01000193) >>> 0;
  }
  return h;
}

function QRCanvas({ value, size = 120 }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !value) return;
    const ctx = canvas.getContext("2d");
    const N = 21; // 21×21 grid (QR version 1 style)
    const cell = Math.floor(size / N);
    const total = cell * N;
    canvas.width = total;
    canvas.height = total;

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, total, total);

    // Deterministic "module" generator from value string
    const seed = hashCode(value);
    const rng = (() => { let s = seed; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 0xffffffff; }; })();

    // Pre-compute modules
    const mod = Array.from({ length: N }, () => Array(N).fill(0));

    // Finder patterns (top-left, top-right, bottom-left)
    const finder = (r, c) => {
      for (let i = 0; i < 7; i++) for (let j = 0; j < 7; j++) {
        const onBorder = i === 0 || i === 6 || j === 0 || j === 6;
        const onInner  = i >= 2 && i <= 4 && j >= 2 && j <= 4;
        if (r + i < N && c + j < N) mod[r+i][c+j] = (onBorder || onInner) ? 1 : 2;
      }
    };
    finder(0, 0); finder(0, N - 7); finder(N - 7, 0);

    // Separators (already in finder, mark as reserved)
    // Timing patterns
    for (let i = 8; i < N - 8; i++) { mod[6][i] = i % 2 === 0 ? 1 : 2; mod[i][6] = i % 2 === 0 ? 1 : 2; }

    // Data modules — fill with hash-seeded bits
    for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
      if (mod[r][c] === 0) mod[r][c] = rng() > 0.5 ? 1 : 2;
    }

    // Draw
    ctx.fillStyle = "#1e1b4b";
    for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
      if (mod[r][c] === 1) ctx.fillRect(c * cell, r * cell, cell, cell);
    }

    // Label below
  }, [value, size]);

  return (
    <canvas
      ref={canvasRef}
      style={{ display: "block", imageRendering: "pixelated" }}
      title={value}
    />
  );
}

function QRModal({ open, item, onClose }) {
  const canvasRef = useRef(null);
  if (!open || !item) return null;

  const downloadQR = () => {
    // find the canvas inside the modal
    const canvas = document.querySelector("#qr-download-canvas");
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = `${item.itemId}-QR.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <QrCode size={16} className="text-slate-600" />
            <h2 className="text-[15px] font-bold text-slate-800">Item QR Code</h2>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 transition-colors"><X size={16} /></button>
        </div>
        <div className="p-6 flex flex-col items-center gap-4">
          <div className="p-3 bg-white border-2 border-slate-200 rounded-xl">
            <QRCanvas value={item.itemId} size={160} id="qr-download-canvas" />
          </div>
          <div className="text-center">
            <p className="text-[13px] font-bold text-slate-800 font-mono">{item.itemId}</p>
            <p className="text-[12px] text-slate-500 mt-0.5">{item.name}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">{item.type} · {item.categoryCode}</p>
          </div>
          <div className="w-full grid grid-cols-2 gap-3 text-[11px] text-slate-600 bg-slate-50 rounded-xl p-3">
            <div><span className="text-slate-400 block">Registered</span>{formatDate(item.registeredDate)}</div>
            <div><span className="text-slate-400 block">Status</span>{item.status}</div>
          </div>
          <button
            onClick={downloadQR}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-slate-800 text-white text-[13px] font-semibold hover:bg-slate-700 transition-colors"
          >
            <Download size={13} /> Download QR PNG
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// BADGES
// ─────────────────────────────────────────────────────────────────────────────

function TypeBadge({ type }) {
  const s = TYPE_STYLES[type] || TYPE_STYLES.Tool;
  const Icon = s.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 text-[10px] px-2 py-0.5 rounded-full font-semibold border ${s.bg} ${s.text} ${s.border}`}>
      <Icon size={9} /> {type}
    </span>
  );
}

function StatusBadge({ status }) {
  const s = STATUS_STYLES[status] || STATUS_STYLES["Active"];
  return (
    <span className={`inline-flex items-center gap-1.5 text-[10px] px-2 py-0.5 rounded-full font-semibold border ${s.bg} ${s.text} ${s.border}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {status}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// DYNAMIC METADATA FIELDS
// ─────────────────────────────────────────────────────────────────────────────

const FIELD_LABELS = {
  maxHours:        "Max Hours",
  serialNo:        "Serial No.",
  bladeType:       "Blade Type",
  chuckSize:       "Chuck Size",
  drumHours:       "Drum Hours",
  capacityLitres:  "Capacity (L)",
  runningHours:    "Running Hours",
  outputKVA:       "Output KVA",
  flowRate:        "Flow Rate",
  arcHours:        "Arc Hours",
  amperageRange:   "Amperage Range",
  calibrationDate: "Calibration Date",
  range:           "Range",
  engineHours:     "Engine Hours",
  bucketCapacity:  "Bucket Capacity",
  liftHours:       "Lift Hours",
  maxLoadRating:   "Max Load Rating",
};

const DATE_FIELDS = ["calibrationDate"];

function MetaFields({ fields, values, onChange, inputCls }) {
  if (!fields || !fields.length) return null;
  return (
    <>
      {fields.map((f) => (
        <div key={f}>
          <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1.5 tracking-wider">
            {FIELD_LABELS[f] || f}
          </label>
          <input
            type={DATE_FIELDS.includes(f) ? "date" : "text"}
            value={values[f] || ""}
            onChange={(e) => onChange(f, e.target.value)}
            placeholder={FIELD_LABELS[f] || f}
            className={inputCls}
          />
        </div>
      ))}
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ITEM FORM
// ─────────────────────────────────────────────────────────────────────────────

function ItemForm({ initial, onSubmit, onCancel }) {
  const defaultForm = {
    type: "Tool",
    categoryCode: "CUT",
    name: "",
    description: "",
    status: "Active",
    quantity: 1,
    unit: "",
    location: "",
    supplier: "",
    purchaseDate: "",
    warrantyExp: "",
    batchDate: todayStr(),
    pieceCount: "",
    meta: {},
  };
  const [form, setForm] = useState(initial ? { ...defaultForm, ...initial } : defaultForm);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const setMeta = (k, v) => setForm((f) => ({ ...f, meta: { ...f.meta, [k]: v } }));

  // When type changes, reset category to first of that type
  const handleTypeChange = (t) => {
    const cats = getCategoryList(t);
    set("type", t);
    set("categoryCode", cats[0]?.code || "");
    set("meta", {});
  };

  const catList = getCategoryList(form.type);
  const catObj  = getCategoryByCode(form.type, form.categoryCode);
  const isReusable   = form.type === "Reusable";
  const isConsumable = form.type === "Consumable";
  const isTool       = form.type === "Tool";

  const valid = form.name.trim() && form.categoryCode;

  const inputCls = "w-full border border-slate-200 rounded-xl px-4 py-2.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white text-slate-700";

  const Field = ({ label, children, span = 1 }) => (
    <div className={span === 2 ? "col-span-2" : ""}>
      <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1.5 tracking-wider">{label}</label>
      {children}
    </div>
  );

  const handleSubmit = () => {
    if (!valid) return;
    const date = isConsumable ? form.batchDate : form.purchaseDate;
    const itemId = initial?.itemId || generateItemId(form.type, form.categoryCode, date || todayStr());
    const catLabel = catObj?.label || form.categoryCode;
    const unit = isConsumable ? (catObj?.unit || form.unit) : (isReusable ? catObj?.unit : form.unit);
    onSubmit({ ...form, itemId, categoryLabel: catLabel, unit, registeredDate: todayStr() });
  };

  return (
    <div className="p-6 space-y-4">
      {/* Type selector */}
      <div className="flex gap-2 p-1 bg-slate-100 rounded-xl">
        {ITEM_TYPES.map((t) => {
          const s = TYPE_STYLES[t];
          const Icon = s.icon;
          return (
            <button
              key={t}
              onClick={() => handleTypeChange(t)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-[12px] font-semibold transition-all ${
                form.type === t
                  ? "bg-white shadow-sm text-slate-800"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <Icon size={12} style={{ color: form.type === t ? s.accent : undefined }} />
              {t}
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Category */}
        <Field label="Category" span={2}>
          <select value={form.categoryCode} onChange={(e) => { set("categoryCode", e.target.value); set("meta", {}); }} className={inputCls}>
            {catList.map((c) => (
              <option key={c.code} value={c.code}>{c.code} — {c.label}</option>
            ))}
          </select>
        </Field>

        {/* Name */}
        <Field label="Item Name *" span={2}>
          <input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder={`e.g. ${catObj?.label || "Item name"}`} className={inputCls} />
        </Field>

        {/* Description */}
        <Field label="Description" span={2}>
          <textarea value={form.description} onChange={(e) => set("description", e.target.value)} rows={2} placeholder="Brief description…" className={`${inputCls} resize-none`} />
        </Field>

        {/* Status */}
        <Field label="Status">
          <select value={form.status} onChange={(e) => set("status", e.target.value)} className={inputCls}>
            {STATUS_OPTIONS.map((s) => <option key={s}>{s}</option>)}
          </select>
        </Field>

        {/* Location */}
        <Field label="Location / Site">
          <input value={form.location} onChange={(e) => set("location", e.target.value)} placeholder="Site / Warehouse" className={inputCls} />
        </Field>

        {/* Supplier */}
        <Field label="Supplier">
          <input value={form.supplier} onChange={(e) => set("supplier", e.target.value)} placeholder="Supplier name" className={inputCls} />
        </Field>

        {/* Purchase date */}
        {!isConsumable && (
          <Field label="Purchase Date">
            <input value={form.purchaseDate} onChange={(e) => set("purchaseDate", e.target.value)} type="date" className={inputCls} />
          </Field>
        )}

        {/* Warranty */}
        {isTool && (
          <Field label="Warranty Expiry">
            <input value={form.warrantyExp} onChange={(e) => set("warrantyExp", e.target.value)} type="date" className={inputCls} />
          </Field>
        )}

        {/* Reusable-specific */}
        {isReusable && (
          <>
            <Field label="Piece Count">
              <input
                value={form.pieceCount || catObj?.defaultPieces || ""}
                onChange={(e) => set("pieceCount", e.target.value)}
                type="number" min="1"
                placeholder={String(catObj?.defaultPieces || 1)}
                className={inputCls}
              />
            </Field>
            <Field label="Individual Tracking">
              <select value={form.individualTracking || (catObj?.individualTracking ? "Yes" : "No")} onChange={(e) => set("individualTracking", e.target.value)} className={inputCls}>
                <option>No</option>
                <option>Yes</option>
              </select>
            </Field>
          </>
        )}

        {/* Consumable-specific */}
        {isConsumable && (
          <>
            <Field label="Batch Date">
              <input value={form.batchDate} onChange={(e) => set("batchDate", e.target.value)} type="date" className={inputCls} />
            </Field>
            <Field label="Quantity">
              <input value={form.quantity} onChange={(e) => set("quantity", e.target.value)} type="number" min="1" placeholder="Qty" className={inputCls} />
            </Field>
            <Field label={`Unit (${catObj?.unit || "unit"})`} span={2}>
              <input value={form.unit || catObj?.unit || ""} onChange={(e) => set("unit", e.target.value)} placeholder={catObj?.unit || "Unit"} className={inputCls} />
            </Field>
          </>
        )}

        {/* Tool quantity */}
        {isTool && (
          <Field label="Quantity">
            <input value={form.quantity} onChange={(e) => set("quantity", e.target.value)} type="number" min="1" className={inputCls} />
          </Field>
        )}

        {/* Dynamic metadata */}
        {catObj?.fields?.length > 0 && (
          <div className="col-span-2 bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Tracked Metadata</p>
            <div className="grid grid-cols-2 gap-3">
              <MetaFields fields={catObj.fields} values={form.meta} onChange={setMeta} inputCls={inputCls} />
            </div>
          </div>
        )}
      </div>

      {/* Preview ID */}
      <div className="flex items-center gap-2 bg-violet-50 border border-violet-200 rounded-xl px-4 py-2.5">
        <Tag size={13} className="text-violet-500 flex-shrink-0" />
        <div>
          <p className="text-[10px] text-violet-400 font-bold uppercase tracking-wider">Generated Item ID (preview)</p>
          <p className="text-[12px] font-bold font-mono text-violet-700">
            {initial?.itemId || (() => {
              const d = isConsumable ? form.batchDate : (form.purchaseDate || todayStr());
              // Preview without incrementing counter
              if (form.type === "Tool")       return `TOOL-${form.categoryCode}-XXXX`;
              if (form.type === "Reusable")   return `REUS-${form.categoryCode}-XXXX`;
              const [y, m, day] = (d || todayStr()).split("-");
              return `CONS-${form.categoryCode}-${y}-${m}-${day}-XX`;
            })()}
          </p>
        </div>
      </div>

      <div className="flex gap-3 pt-1">
        <button onClick={onCancel} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-[13px] font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={!valid}
          className={`flex-1 py-2.5 rounded-xl text-white text-[13px] font-semibold transition-colors ${valid ? "bg-blue-600 hover:bg-blue-700" : "bg-blue-300 cursor-not-allowed"}`}
        >
          {initial ? "Save Changes" : "Register Item"}
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// DETAIL DRAWER
// ─────────────────────────────────────────────────────────────────────────────

function ItemDrawer({ item, onClose, onEdit, onQR }) {
  const ts = TYPE_STYLES[item.type] || TYPE_STYLES.Tool;
  const TypeIcon = ts.icon;

  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm bg-white shadow-2xl h-full flex flex-col overflow-y-auto">
        <div className="h-1.5 w-full" style={{ background: ts.accent }} />

        {/* Header */}
        <div className="p-5 flex items-start gap-3 border-b border-slate-100">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white flex-shrink-0" style={{ background: ts.accent }}>
            <TypeIcon size={22} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-bold font-mono text-slate-400">{item.itemId}</p>
            <p className="text-[15px] font-bold text-slate-800 leading-snug">{item.name}</p>
            <div className="flex flex-wrap items-center gap-2 mt-1.5">
              <TypeBadge type={item.type} />
              <StatusBadge status={item.status} />
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors"><X size={16} /></button>
        </div>

        {/* QR preview */}
        <div className="mx-5 mt-4 p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-center gap-4">
          <div className="p-2 bg-white rounded-xl border border-slate-200">
            <QRCanvas value={item.itemId} size={64} />
          </div>
          <div className="flex-1">
            <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">Item QR Code</p>
            <p className="text-[11px] font-mono text-slate-600">{item.itemId}</p>
            <button
              onClick={onQR}
              className="mt-2 flex items-center gap-1.5 text-[11px] font-semibold text-blue-600 hover:text-blue-800 transition-colors"
            >
              <QrCode size={11} /> View & Download
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-5 flex-1 space-y-5">
          <section>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Details</p>
            <div className="space-y-2 text-[12px]">
              {[
                ["Category", `${item.categoryCode} — ${item.categoryLabel}`],
                ["Location", item.location || "—"],
                ["Supplier", item.supplier || "—"],
                ["Registered", formatDate(item.registeredDate)],
                item.purchaseDate && ["Purchase Date", formatDate(item.purchaseDate)],
                item.warrantyExp  && ["Warranty Exp.", formatDate(item.warrantyExp)],
                item.quantity     && ["Quantity", `${item.quantity} ${item.unit || ""}`],
                item.pieceCount   && ["Piece Count", item.pieceCount],
                item.batchDate    && ["Batch Date", formatDate(item.batchDate)],
              ].filter(Boolean).map(([label, value]) => (
                <div key={label} className="flex justify-between items-start gap-3">
                  <span className="text-slate-400 flex-shrink-0">{label}</span>
                  <span className="font-medium text-slate-700 text-right">{value}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Metadata */}
          {item.meta && Object.keys(item.meta).length > 0 && (
            <section>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Tracked Metadata</p>
              <div className="space-y-2 text-[12px]">
                {Object.entries(item.meta).filter(([, v]) => v).map(([k, v]) => (
                  <div key={k} className="flex justify-between items-center">
                    <span className="text-slate-400">{FIELD_LABELS[k] || k}</span>
                    <span className="font-medium text-slate-700 font-mono">{v}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {item.description && (
            <section>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Description</p>
              <p className="text-[12px] text-slate-600 bg-slate-50 rounded-xl p-3 leading-relaxed">{item.description}</p>
            </section>
          )}
        </div>

        <div className="p-4 border-t border-slate-100 flex gap-2">
          <button
            onClick={onQR}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-[13px] font-semibold hover:bg-slate-50 transition-colors"
          >
            <QrCode size={13} /> QR Code
          </button>
          <button
            onClick={onEdit}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-slate-800 text-white text-[13px] font-semibold hover:bg-slate-700 transition-colors"
          >
            <Pencil size={13} /> Edit Item
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MODAL SHELL + CONFIRM DELETE
// ─────────────────────────────────────────────────────────────────────────────

function Modal({ open, onClose, title, children, width = "max-w-xl" }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={onClose}>
      <div className={`bg-white rounded-2xl shadow-2xl w-full ${width} max-h-[90vh] overflow-hidden flex flex-col`} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 flex-shrink-0">
          <h2 className="text-[15px] font-bold text-slate-800">{title}</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 transition-colors"><X size={16} /></button>
        </div>
        <div className="overflow-y-auto flex-1">{children}</div>
      </div>
    </div>
  );
}

function ConfirmDelete({ open, onClose, onConfirm, name }) {
  return (
    <Modal open={open} onClose={onClose} title="Confirm Delete" width="max-w-md">
      <div className="p-6">
        <div className="flex items-center gap-3 p-3 rounded-xl bg-rose-50 border border-rose-200 mb-5">
          <AlertCircle size={16} className="text-rose-500 flex-shrink-0" />
          <p className="text-[13px] text-rose-700">Delete <strong>{name}</strong>? This cannot be undone.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-[13px] font-semibold text-slate-600 hover:bg-slate-50 transition-colors">Cancel</button>
          <button onClick={onConfirm} className="flex-1 py-2.5 rounded-xl bg-rose-500 text-white text-[13px] font-semibold hover:bg-rose-600 transition-colors">Delete</button>
        </div>
      </div>
    </Modal>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SEED DATA
// ─────────────────────────────────────────────────────────────────────────────

const SEED_ITEMS = [
  { id:"i1", itemId:"TOOL-CUT-0001", type:"Tool",       categoryCode:"CUT",  categoryLabel:"Cutting Machines",        name:"Angle Grinder 230mm",         status:"Active",       location:"Site A – Workshop",  supplier:"MachinCo",    purchaseDate:"2024-03-10", warrantyExp:"2026-03-10", quantity:2,  unit:"",      batchDate:"",           pieceCount:"",  registeredDate:"2024-03-10", meta:{ maxHours:"500", serialNo:"CUT-2024-001", bladeType:"Diamond" },       description:"Heavy-duty angle grinder" },
  { id:"i2", itemId:"TOOL-GEN-0001", type:"Tool",       categoryCode:"GEN",  categoryLabel:"Generators",              name:"Diesel Generator 15KVA",       status:"In Use",       location:"Site B",             supplier:"PowerGen",    purchaseDate:"2023-11-05", warrantyExp:"2025-11-05", quantity:1,  unit:"",      batchDate:"",           pieceCount:"",  registeredDate:"2023-11-05", meta:{ runningHours:"320", outputKVA:"15" },                                description:"Backup power for Site B" },
  { id:"i3", itemId:"TOOL-WLD-0001", type:"Tool",       categoryCode:"WLD",  categoryLabel:"Welding Machines",        name:"MIG Welder 250A",              status:"Under Maintenance", location:"Workshop",       supplier:"WeldTech",    purchaseDate:"2022-06-20", warrantyExp:"2024-06-20", quantity:1,  unit:"",      batchDate:"",           pieceCount:"",  registeredDate:"2022-06-20", meta:{ arcHours:"1200", amperageRange:"50-250A" },                          description:"Used for structural welding" },
  { id:"i4", itemId:"REUS-SCF-0001", type:"Reusable",   categoryCode:"SCF",  categoryLabel:"Scaffolding Frames",      name:"Standard Scaffolding Bundle A", status:"Active",       location:"Yard – Section 3",   supplier:"ScaffoldPro", purchaseDate:"2023-01-15", warrantyExp:"",           quantity:1,  unit:"frames",batchDate:"",           pieceCount:"5",  registeredDate:"2023-01-15", meta:{},                                                                    description:"5-frame bundle for standard floors" },
  { id:"i5", itemId:"REUS-PROP-0001",type:"Reusable",   categoryCode:"PROP", categoryLabel:"Acrow Props / Steel Props",name:"Acrow Props Set 1",           status:"In Use",       location:"Site C – Level 2",   supplier:"PropsPlus",   purchaseDate:"2023-05-10", warrantyExp:"",           quantity:1,  unit:"props", batchDate:"",           pieceCount:"10", registeredDate:"2023-05-10", meta:{},                                                                    description:"10-prop bundle" },
  { id:"i6", itemId:"CONS-CEM-2026-04-16-01", type:"Consumable", categoryCode:"CEM", categoryLabel:"Cement (bagged)", name:"OPC Cement Batch Apr-16",     status:"Active",       location:"Warehouse A",        supplier:"CementCo",    purchaseDate:"",           warrantyExp:"",           quantity:500,unit:"Bags",  batchDate:"2026-04-16", pieceCount:"",  registeredDate:"2026-04-16", meta:{},                                                                    description:"Ordinary Portland Cement" },
  { id:"i7", itemId:"CONS-RBR-2026-04-16-01", type:"Consumable", categoryCode:"RBR", categoryLabel:"Rebar / Steel Reinforcement", name:"T12 Rebar Batch Apr-16", status:"Active", location:"Yard – Steel Store", supplier:"SteelMart",   purchaseDate:"",           warrantyExp:"",           quantity:200,unit:"Length (m) or kg", batchDate:"2026-04-16", pieceCount:"", registeredDate:"2026-04-16", meta:{},                                                                    description:"T12 deformed steel bar" },
];

// ─────────────────────────────────────────────────────────────────────────────
// MAIN APP
// ─────────────────────────────────────────────────────────────────────────────

export default function ItemRegistration() {
  const [items, setItems] = useState(SEED_ITEMS);
  const [subCategories, setSubCategories] = useState([]);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [modal, setModal] = useState(null); // null | "create" | "edit" | "delete"
  const [target, setTarget] = useState(null);
  const [drawer, setDrawer] = useState(null);
  const [qrItem, setQrItem] = useState(null);
  const [apiError, setApiError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const categories = await apiFetch("/sub-categories");
        setSubCategories(categories || []);
      } catch (error) {
        console.warn("Unable to load categories from backend:", error);
      }

      try {
        const result = await apiFetch("/items");
        const backendItems = Array.isArray(result) ? result : [];
        const mappedItems = backendItems.map(mapBackendItem);
        setItems(mappedItems);
      } catch (error) {
        console.warn("Unable to load items from backend:", error);
        setApiError("Unable to connect to the backend item service. Showing local data only.");
      }
    };

    load();
  }, []);

  const create = async (data) => {
    try {
      setLoading(true);
      setApiError("");
      const payload = createItemPayload(data, subCategories);
      const result = await apiFetch("/items", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      const created = result;
      const newItems = [];
      if (created.item) {
        if (Array.isArray(created.item)) {
          newItems.push(...created.item.map((item) => mapBackendItem({ type: created.type, item })));
        } else {
          newItems.push(mapBackendItem(created));
        }
      }
      if (newItems.length > 0) {
        setItems((prev) => [...newItems, ...prev]);
      }
      setModal(null);
    } catch (error) {
      const message = error?.message || "Unable to create item.";
      setApiError(message);
      console.error("Create item failed:", error);
    } finally {
      setLoading(false);
    }
  };

  const update = (data) => { setItems((p) => p.map((i) => (i.id === target.id ? { ...i, ...data } : i))); setModal(null); setDrawer(null); };
  const remove = () => { setItems((p) => p.filter((i) => i.id !== target.id)); setModal(null); };

  const filtered = items.filter((item) => {
    const q = search.toLowerCase();
    const ms = item.itemId.toLowerCase().includes(q) || item.name.toLowerCase().includes(q) || item.categoryCode.toLowerCase().includes(q) || item.categoryLabel.toLowerCase().includes(q);
    const mt = filterType   === "all" || item.type   === filterType;
    const mst = filterStatus === "all" || item.status === filterStatus;
    return ms && mt && mst;
  });

  const stats = [
    { label: "Total Items",  value: items.length,                                           color: "text-slate-700" },
    { label: "Tools",        value: items.filter((i) => i.type === "Tool").length,          color: "text-violet-600" },
    { label: "Reusables",    value: items.filter((i) => i.type === "Reusable").length,      color: "text-teal-600"   },
    { label: "Consumables",  value: items.filter((i) => i.type === "Consumable").length,    color: "text-orange-600" },
  ];

  const selCls = "text-[12px] border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-400";

  return (
    <div className="min-h-screen bg-[#f7f8fb] p-5 font-sans">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="mb-6 flex items-start justify-between flex-wrap gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Venus Enterprises</span>
            </div>
            <h1 className="text-[22px] font-extrabold text-slate-800 tracking-tight">Item Registration</h1>
            <p className="text-[13px] text-slate-400 mt-0.5">Tools · Reusables · Consumables — with QR tracking</p>
          </div>
          <button
            onClick={() => { setTarget(null); setModal("create"); }}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-[13px] font-semibold transition-colors"
          >
            <Plus size={14} /> Register Item
          </button>
        </div>

        {apiError ? (
          <div className="mb-5 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
            {apiError}
          </div>
        ) : null}

        {/* Stat cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
          {stats.map((c) => (
            <div key={c.label} className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
              <p className={`text-[24px] font-extrabold leading-none ${c.color}`}>{c.value}</p>
              <p className="text-[11px] text-slate-400 font-medium mt-1">{c.label}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm px-4 py-3 flex flex-wrap gap-3 items-center mb-4">
          <div className="relative flex-1 min-w-[160px]">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search ID, name, category…"
              className="w-full pl-9 pr-3 py-2 text-[12px] border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 bg-slate-50"
            />
          </div>
          <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className={selCls}>
            <option value="all">All Types</option>
            {ITEM_TYPES.map((t) => <option key={t}>{t}</option>)}
          </select>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className={selCls}>
            <option value="all">All Statuses</option>
            {STATUS_OPTIONS.map((s) => <option key={s}>{s}</option>)}
          </select>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                {["Item", "Type", "Category", "Status", "Location", "Registered", "Actions"].map((h, i) => (
                  <th key={h} className={[
                    "px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest",
                    i === 6 ? "text-right" : "text-left",
                    h === "Location" || h === "Registered" ? "hidden lg:table-cell" : "",
                  ].join(" ")}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-14 text-slate-400 text-[13px]">No items match</td></tr>
              ) : filtered.map((item) => {
                const ts = TYPE_STYLES[item.type] || TYPE_STYLES.Tool;
                const TypeIcon = ts.icon;
                return (
                  <tr
                    key={item.id}
                    className="transition-colors cursor-pointer hover:bg-blue-50/30"
                    onClick={() => setDrawer(item)}
                  >
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white flex-shrink-0" style={{ background: ts.accent }}>
                          <TypeIcon size={14} />
                        </div>
                        <div>
                          <p className="text-[12px] font-bold text-slate-700">{item.name}</p>
                          <p className="text-[10px] text-slate-400 font-mono">{item.itemId}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5"><TypeBadge type={item.type} /></td>
                    <td className="px-4 py-3.5">
                      <span className="text-[12px] text-slate-500">{item.categoryCode} — {item.categoryLabel}</span>
                    </td>
                    <td className="px-4 py-3.5"><StatusBadge status={item.status} /></td>
                    <td className="px-4 py-3.5 hidden lg:table-cell">
                      <span className="text-[12px] text-slate-500">{item.location || "—"}</span>
                    </td>
                    <td className="px-4 py-3.5 hidden lg:table-cell">
                      <span className="text-[11px] text-slate-400">{formatDate(item.registeredDate)}</span>
                    </td>
                    <td className="px-4 py-3.5" onClick={(e) => e.stopPropagation()}>
                      <div className="flex justify-end gap-1">
                        <button onClick={() => { setQrItem(item); }} className="p-1.5 rounded-lg hover:bg-violet-50 text-slate-400 hover:text-violet-600 transition-colors" title="QR Code"><QrCode size={13} /></button>
                        <button onClick={() => setDrawer(item)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors" title="View"><Eye size={13} /></button>
                        <button onClick={() => { setTarget(item); setModal("edit"); }} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors" title="Edit"><Pencil size={13} /></button>
                        <button onClick={() => { setTarget(item); setModal("delete"); }} className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-500 transition-colors" title="Delete"><Trash2 size={13} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* QR Modal */}
      <QRModal open={!!qrItem} item={qrItem} onClose={() => setQrItem(null)} />

      {/* Detail drawer */}
      {drawer && (
        <ItemDrawer
          item={drawer}
          onClose={() => setDrawer(null)}
          onEdit={() => { setTarget(drawer); setDrawer(null); setModal("edit"); }}
          onQR={() => { setQrItem(drawer); }}
        />
      )}

      {/* Modals */}
      <Modal open={modal === "create"} onClose={() => setModal(null)} title="Register New Item">
        <ItemForm onSubmit={create} onCancel={() => setModal(null)} />
      </Modal>
      <Modal open={modal === "edit"} onClose={() => setModal(null)} title="Edit Item">
        {target && <ItemForm initial={target} onSubmit={update} onCancel={() => setModal(null)} />}
      </Modal>
      <ConfirmDelete
        open={modal === "delete"}
        onClose={() => setModal(null)}
        onConfirm={remove}
        name={target?.itemId}
      />
    </div>
  );
}