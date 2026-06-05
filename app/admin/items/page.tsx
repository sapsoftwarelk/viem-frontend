"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Plus, Search, Eye, Pencil, Trash2, X, AlertCircle,
  QrCode, Package, Wrench, RefreshCw, ChevronDown,
  Hash, Calendar, Download, Filter, Layers, Tag,
  CheckCircle, Clock, Archive, Boxes
} from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

type ItemType = "Tool" | "Reusable" | "Consumable";

type AnyRecord = Record<string, any>;

interface BatchSplit {
  id: string;
  quantity: number | string;
  expiryDate: string;
}

interface SubCategory {
  id?: string;
  code: string;
  name?: string;
  category?: { slug?: string };
  defaultPieces?: number;
  unit?: string;
  individualTracking?: boolean;
  fields?: string[];
}

interface ItemFormData {
  id?: string;
  itemId?: string;
  type: ItemType | string;
  categoryCode: string;
  categoryLabel?: string;
  name: string;
  description: string;
  status: string;
  quantity: number | string;
  unit: string;
  location: string;
  supplier: string;
  purchaseDate: string;
  warrantyExp: string;
  batchDate: string;
  expiryDate: string;
  pieceCount: string | number;
  individualTracking?: string;
  bundleId?: string;
  batchSplits?: BatchSplit[];
  registeredDate?: string;
  meta: AnyRecord;
  [key: string]: any;
}

const ITEM_TYPES: ItemType[] = ["Tool", "Reusable", "Consumable"];

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

const STATUS_OPTIONS = ["Active", "Available", "In Warehouse", "Ready", "On Site", "Returning", "Damaged", "Expired", "Depleted", "Under Maintenance", "Retired", "Out of Stock"] as const;

type StatusOption = (typeof STATUS_OPTIONS)[number];

const STATUS_STYLES: Record<string, { bg: string; text: string; border: string; dot: string }> = {
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

const TYPE_STYLES: Record<string, { bg: string; text: string; border: string; icon: typeof Wrench; accent: string }> = {
  Tool:       { bg: "bg-violet-50", text: "text-violet-700", border: "border-violet-200", icon: Wrench,   accent: "#7c3aed" },
  Reusable:   { bg: "bg-teal-50",   text: "text-teal-700",   border: "border-teal-200",   icon: RefreshCw,accent: "#0f766e" },
  Consumable: { bg: "bg-orange-50", text: "text-orange-700", border: "border-orange-200", icon: Boxes,    accent: "#c2410c" },
};

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function uid() { return Math.random().toString(36).slice(2, 9); }

function pad(n: string | number, len = 4): string { return String(n).padStart(len, "0"); }

function todayStr(): string { return new Date().toISOString().slice(0, 10); }

function formatDate(d?: string | Date | null): string {
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

function normalizeStatus(value?: string): string {
  if (!value) return "Active";
  const key = String(value).trim().toUpperCase();
  return (STATUS_DISPLAY as Record<string, string>)[key] || value.replace(/_/g, " ").replace(/\b\w/g, (ch) => ch.toUpperCase());
}

function normalizeType(value?: string): ItemType {
  if (!value) return "Tool";
  const type = String(value).trim().toLowerCase();
  return type === "consumable" ? "Consumable" : type === "reusable" ? "Reusable" : "Tool";
}

function parseCategoryCode(item: AnyRecord): string {
  if (item?.subCategory?.code) return item.subCategory.code;
  if (item?.id?.startsWith("REUS-")) {
    const parts = String(item.id).split("-");
    return parts[1] || "REUS";
  }
  if (item?.id?.startsWith("CONS-")) {
    const parts = String(item.id).split("-");
    return parts[1] || "CONS";
  }
  if (item?.id?.startsWith("TOOL-")) {
    const parts = String(item.id).split("-");
    return parts[1] || "TOOL";
  }
  return "";
}

function getCategoryLabel(type?: string, code?: string): string {
  const itemType = normalizeType(type);
  const category = getCategoryByCode(itemType, code);
  return category?.label || code || "Unknown";
}

function mapBackendItem(itemRecord: AnyRecord): ItemFormData {
  const item = itemRecord?.item || itemRecord;
  const type = normalizeType(itemRecord?.type || item?.type);
  const categoryCode = parseCategoryCode(item);
  const categoryLabel = getCategoryLabel(type, categoryCode);
  const expiryDate = item.expiryDate ? String(item.expiryDate).split("T")[0] : "";
  return {
    id: String(item.id || item.itemId || uid()),
    itemId: String(item.id || item.itemId || uid()),
    type,
    categoryCode,
    categoryLabel,
    name: String(item.itemName || item.model || item.bundleId || item.id || ""),
    status: normalizeStatus(item.status),
    location: item?.location?.siteName || item?.location?.name || item?.locationId || "",
    supplier: String(item.supplier || ""),
    purchaseDate: item.purchaseDate ? String(item.purchaseDate).split("T")[0] : "",
    warrantyExp: item.warrantyExpiry ? String(item.warrantyExpiry).split("T")[0] : "",
    quantity: item.quantity ?? item.pieceNum ?? item.pieceCount ?? 1,
    unit: String(item.unit || (type === "Reusable" ? "pcs" : "")),
    batchDate: item.batchDate ? String(item.batchDate).split("T")[0] : "",
    expiryDate,
    batchSplits: type === "Consumable" && expiryDate ? [{ id: uid(), quantity: item.quantity ?? 1, expiryDate }] : [],
    pieceCount: item.pieceCount ?? item.pieceNum ?? "",
    registeredDate: item.receivedDate ? String(item.receivedDate).split("T")[0] : item.purchaseDate ? String(item.purchaseDate).split("T")[0] : todayStr(),
    meta: {
      maxHours: item.maxHours || "",
      serialNo: item.serialNumber || "",
      bladeType: item.bladeType || "",
      ...item.meta,
    },
    description: String(item.description || ""),
  };
}

async function apiFetch(path: string, options: RequestInit = {}) {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((options.headers as Record<string, string>) || {}),
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
    const error = new Error(body?.message || body?.error || response.statusText || "API request failed") as Error & { status: number };
    error.status = response.status;
    throw error;
  }
  return body;
}

function createItemPayload(form: ItemFormData, subCategories: SubCategory[]) {
  const subCategory = subCategories.find((cat) => cat.code === form.categoryCode);

  const payload: AnyRecord = {
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
const counters: Record<string, number> = {};
function nextSeq(key: string): number {
  counters[key] = (counters[key] || 0) + 1;
  return counters[key];
}

function generateItemId(type: string, catCode: string, date?: string): string {
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

function getDynamicCategoryList(type: string, subCategories: SubCategory[] = []): Array<Record<string, any>> {
  if (!Array.isArray(subCategories) || subCategories.length === 0) return [];
  const slug = type === "Tool" ? "tools" : type === "Reusable" ? "reusable" : type === "Consumable" ? "consumable" : null;
  if (!slug) return [];
  return subCategories
    .filter((c) => c.category?.slug === slug)
    .map((c) => ({ code: c.code, label: c.name || c.code, id: c.id }));
}

function getCategoryList(type: string, subCategories: SubCategory[] = []): Array<Record<string, any>> {
  const dynamic = getDynamicCategoryList(type, subCategories);
  if (dynamic.length > 0) return dynamic;
  if (type === "Tool")       return TOOL_CATEGORIES;
  if (type === "Reusable")   return REUSABLE_CATEGORIES;
  if (type === "Consumable") return CONSUMABLE_CATEGORIES;
  return [];
}

function getCategoryByCode(type: string, code?: string, subCategories: SubCategory[] = []): Record<string, any> | null {
  const dynamic = getCategoryList(type, subCategories).find((c) => c.code === code);
  const fallback = getCategoryList(type).find((c) => c.code === code);
  return dynamic ? { ...fallback, ...dynamic } : fallback || null;
}

// ─────────────────────────────────────────────────────────────────────────────
// QR CODE — pure canvas, no external lib
// Encodes text as a simple visual placeholder QR-style grid using a hash
// For production, swap canvas draw with a real QR library like qrcode.js
// ─────────────────────────────────────────────────────────────────────────────

function hashCode(str: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = (h * 0x01000193) >>> 0;
  }
  return h;
}

function QRCanvas({ value, size = 120, id }: { value: string; size?: number; id?: string }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !value) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
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
    const finder = (r: number, c: number) => {
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
      id={id}
      ref={canvasRef}
      style={{ display: "block", imageRendering: "pixelated" }}
      title={value}
    />
  );
}

function QRModal({ open, item, onClose }: { open: boolean; item: ItemFormData | null; onClose: () => void }) {
  if (!open || !item) return null;

  const downloadQR = () => {
    // find the canvas inside the modal
    const canvas = document.querySelector<HTMLCanvasElement>("#qr-download-canvas");
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = `${String(item.itemId)}-QR.png`;
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
            <QRCanvas value={String(item.itemId)} size={160} id="qr-download-canvas" />
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

function TypeBadge({ type }: { type: string }) {
  const s = TYPE_STYLES[type] || TYPE_STYLES.Tool;
  const Icon = s.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 text-[10px] px-2 py-0.5 rounded-full font-semibold border ${s.bg} ${s.text} ${s.border}`}>
      <Icon size={9} /> {type}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
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

const FIELD_LABELS: Record<string, string> = {
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

function MetaFields({ fields, values, onChange, inputCls, errors, touched, setTouched,}: {
  fields?: string[];
  values: AnyRecord;
  onChange: (field: string, value: string) => void;
  inputCls: string;
  errors: Record<string, string>;
  touched: Record<string, boolean>;
  setTouched: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
}) {
  if (!fields || !fields.length) return null;
  return (
    <>
      {fields.map((f) => (
        <div key={f}>
          <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1.5 tracking-wider">
            {FIELD_LABELS[f] || f}
          </label>
          <>
  <input
    type={DATE_FIELDS.includes(f) ? "date" : "text"}
    value={values[f] || ""}
    onChange={(e) => {
  let value = e.target.value;

  if (f === "maxHours" || f === "serialNo") {
    value = value.replace(/\D/g, "");
  }

  onChange(f, value);
}}
    onBlur={() =>
      setTouched((prev) => ({
        ...prev,
        [f]: true,
      }))
    }
    placeholder={FIELD_LABELS[f] || f}
    className={`${inputCls}
      ${
        touched?.[f] && errors?.[f]
          ? "border-red-500 focus:ring-red-400"
          : ""
      }`}
  />

  {touched?.[f] && errors?.[f] && (
    <p className="mt-1 text-xs text-red-500">
      {errors[f]}
    </p>
  )}
</>
        </div>
      ))}
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ITEM FORM
// ─────────────────────────────────────────────────────────────────────────────

function Field({ label, children, span = 1 }: { label: string; children: React.ReactNode; span?: number }) {
  return (
    <div className={span === 2 ? "col-span-2" : ""}>
      <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1.5 tracking-wider">{label}</label>
      {children}
    </div>
  );
}

function ItemForm({ initial, onSubmit, onCancel, subCategories = [] }: {
  initial?: Partial<ItemFormData>;
  onSubmit: (data: ItemFormData) => void;
  onCancel: () => void;
  subCategories?: SubCategory[];
}) {
  const defaultForm: ItemFormData = {
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
    expiryDate: "",
    batchSplits: [],
    pieceCount: "",
    meta: {},
  };
  const [form, setForm] = useState<ItemFormData>(
    initial ? { ...defaultForm, ...initial } : defaultForm
  );

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const validateField = (field: string, value: string | number | undefined) => {
    let error = "";

    switch (field) {
        case "maxHours":
          if (!value) {
            error = "Max Hours is required";
          } else if (!/^\d+$/.test(String(value))) {
            error = "Only numbers allowed";
          } else if (Number(value) <= 0) {
            error = "Must be greater than 0";
          }
          break;

      case "serialNo":
        if (!String(value || "").trim()) {
          error = "Serial Number is required";
        } else if (!/^\d+$/.test(String(value))) {
          error = "Serial Number must contain numbers only";
        } else if (String(value).length < 5) {
          error = "Minimum 5 digits required";
        }
        break;
    }

    return error;
  };

  const set = (k: keyof ItemFormData, v: any) =>
    setForm((f) => ({ ...f, [k]: v } as ItemFormData));

  const setMeta = (k: string, v: string) => {
    setForm((f) => ({
      ...f,
      meta: {
        ...f.meta,
        [k]: v,
      },
    } as ItemFormData));

    const error = validateField(k, v);

    setErrors((prev) => ({
      ...prev,
      [k]: error,
    }));
  };

  const validateForm = (): boolean => {
    const nextErrors: Record<string, string> = {};

    if (!form.name?.trim()) {
      nextErrors.name = "Item name is required";
    }

    if (!form.categoryCode) {
      nextErrors.categoryCode = "Category is required";
    }

    if (form.type === "Tool") {
      if (!form.quantity || Number(form.quantity) <= 0) {
        nextErrors.quantity = "Quantity must be greater than 0";
      }
    }

    if (form.type === "Reusable") {
      if (!form.pieceCount || Number(form.pieceCount) <= 0) {
        nextErrors.pieceCount = "Piece count must be greater than 0";
      }
    }

    if (form.type === "Consumable") {
      if (!form.batchDate) {
        nextErrors.batchDate = "Batch date is required";
      }
      const hasBatchSplits = Boolean(form.batchSplits?.length);
      if (!hasBatchSplits) {
        nextErrors.batchSplits = "Add at least one expiry date";
      }
      const splitQtyTotal = form.batchSplits?.reduce((sum, split) => sum + (Number(split.quantity) || 0), 0) || 0;
      form.batchSplits?.forEach((split, index) => {
        if (!split.quantity || Number(split.quantity) <= 0) {
          nextErrors[`batchSplitQty-${split.id}`] = `Batch ${index + 1} quantity is required`;
        }
        if (!split.expiryDate) {
          nextErrors[`batchSplitExpiry-${split.id}`] = `Batch ${index + 1} expiry date is required`;
        } else if (form.batchDate && split.expiryDate < form.batchDate) {
          nextErrors[`batchSplitExpiry-${split.id}`] = `Batch ${index + 1} expiry must be after batch date`;
        }
      });
      if (hasBatchSplits && splitQtyTotal !== Number(form.quantity || 0)) {
        nextErrors.batchSplits = "Batch quantities must equal total quantity";
      }
      // For Consumable, unit can come from form.unit or category
      const categoryUnit = catObj?.unit;
      if (!form.unit?.trim() && !categoryUnit?.trim()) {
        nextErrors.unit = "Unit is required";
      }
      if (!form.quantity || Number(form.quantity) <= 0) {
        nextErrors.quantity = "Quantity must be greater than 0";
      }
    }

    (catObj?.fields || []).forEach((field: string) => {
      const error = validateField(field, form.meta?.[field]);
      if (error) {
        nextErrors[field] = error;
      }
    });

    setErrors(nextErrors);
    setTouched((prev) => ({
      ...prev,
      ...Object.fromEntries(Object.keys(nextErrors).map((key) => [key, true])),
    }));

    return Object.keys(nextErrors).length === 0;
  };

  // When type changes, reset category to first of that type
  const handleTypeChange = (t: ItemType) => {
    const cats = getCategoryList(t);
    set("type", t);
    set("categoryCode", cats[0]?.code || "");
    set("meta", {});
    set("batchSplits", t === "Consumable" ? [{ id: uid(), quantity: form.quantity || 1, expiryDate: "" }] : []);
  };

  const catList = getCategoryList(form.type, subCategories);
  const catObj  = getCategoryByCode(form.type, form.categoryCode, subCategories);
  const isReusable   = form.type === "Reusable";
  const isConsumable = form.type === "Consumable";
  const isTool       = form.type === "Tool";
  const batchSplits = form.batchSplits || [];
  const splitTotal = batchSplits.reduce((sum, split) => sum + (Number(split.quantity) || 0), 0);
  const totalQuantity = Number(form.quantity) || 0;

  const valid = Boolean(form.name.trim() && form.categoryCode);

  const inputCls = "w-full border border-slate-200 rounded-xl px-4 py-2.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white text-slate-700";

  const addBatchSplit = () => {
    set("batchSplits", [
      ...batchSplits,
      { id: uid(), quantity: "", expiryDate: "" },
    ]);
  };

  const updateBatchSplit = (id: string, key: keyof BatchSplit, value: string) => {
    set("batchSplits", batchSplits.map((split) => (
      split.id === id ? { ...split, [key]: value } : split
    )));
  };

  const removeBatchSplit = (id: string) => {
    set("batchSplits", batchSplits.filter((split) => split.id !== id));
  };

  const handleSubmit = () => {
    if (!validateForm()) return;
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
          <select
            value={form.categoryCode}
            onChange={(e) => { set("categoryCode", e.target.value); set("meta", {}); }}
            onBlur={() => setTouched((prev) => ({ ...prev, categoryCode: true }))}
            className={`${inputCls} ${touched.categoryCode && errors.categoryCode ? "border-red-500 focus:ring-red-400" : ""}`}
          >
            {catList.map((c) => (
              <option key={c.code} value={c.code}>{c.code} — {c.label}</option>
            ))}
          </select>
          {touched.categoryCode && errors.categoryCode ? (
            <p className="mt-1 text-xs text-red-500">{errors.categoryCode}</p>
          ) : null}
        </Field>

        {/* Name */}
        <Field label="Item Name *" span={2}>
          <input
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            onBlur={() => setTouched((prev) => ({ ...prev, name: true }))}
            placeholder={`e.g. ${catObj?.label || "Item name"}`}
            className={`${inputCls} ${touched.name && errors.name ? "border-red-500 focus:ring-red-400" : ""}`}
          />
          {touched.name && errors.name ? (
            <p className="mt-1 text-xs text-red-500">{errors.name}</p>
          ) : null}
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
                onBlur={() => setTouched((prev) => ({ ...prev, pieceCount: true }))}
                type="number" min="1"
                placeholder={String(catObj?.defaultPieces || 1)}
                className={`${inputCls} ${touched.pieceCount && errors.pieceCount ? "border-red-500 focus:ring-red-400" : ""}`}
              />
              {touched.pieceCount && errors.pieceCount ? (
                <p className="mt-1 text-xs text-red-500">{errors.pieceCount}</p>
              ) : null}
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
              <input
                value={form.batchDate}
                onChange={(e) => set("batchDate", e.target.value)}
                onBlur={() => setTouched((prev) => ({ ...prev, batchDate: true }))}
                type="date"
                className={`${inputCls} ${touched.batchDate && errors.batchDate ? "border-red-500 focus:ring-red-400" : ""}`}
              />
              {touched.batchDate && errors.batchDate ? (
                <p className="mt-1 text-xs text-red-500">{errors.batchDate}</p>
              ) : null}
            </Field>
            <Field label="Quantity">
              <input
                value={form.quantity}
                onChange={(e) => set("quantity", e.target.value)}
                onBlur={() => setTouched((prev) => ({ ...prev, quantity: true }))}
                type="number"
                min="1"
                placeholder="Qty"
                className={`${inputCls} ${touched.quantity && errors.quantity ? "border-red-500 focus:ring-red-400" : ""}`}
              />
              {touched.quantity && errors.quantity ? (
                <p className="mt-1 text-xs text-red-500">{errors.quantity}</p>
              ) : null}
            </Field>
            <Field label={`Unit (${catObj?.unit || "unit"})`} span={2}>
              <input
                value={form.unit || catObj?.unit || ""}
                onChange={(e) => set("unit", e.target.value)}
                onBlur={() => setTouched((prev) => ({ ...prev, unit: true }))}
                placeholder={catObj?.unit || "Unit"}
                className={`${inputCls} ${touched.unit && errors.unit ? "border-red-500 focus:ring-red-400" : ""}`}
              />
              {touched.unit && errors.unit ? (
                <p className="mt-1 text-xs text-red-500">{errors.unit}</p>
              ) : null}
            </Field>
            <div className="col-span-2 border border-slate-200 rounded-xl p-3 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[11px] font-bold uppercase text-slate-400 tracking-wider">Expiry Breakdown</p>
                  {batchSplits.length > 0 ? (
                    <p className={`text-[11px] ${splitTotal === totalQuantity ? "text-emerald-600" : "text-amber-600"}`}>
                      {splitTotal} / {totalQuantity} {form.unit || catObj?.unit || ""}
                    </p>
                  ) : null}
                </div>
                <button
                  type="button"
                  onClick={addBatchSplit}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-[12px] font-semibold text-slate-600 hover:bg-slate-50"
                >
                  <Plus size={12} /> Add Date
                </button>
              </div>

              {batchSplits.map((split, index) => (
                <div key={split.id} className="grid grid-cols-[1fr_1fr_auto] gap-2 items-start">
                  <div>
                    <input
                      value={split.quantity}
                      onChange={(e) => updateBatchSplit(split.id, "quantity", e.target.value)}
                      type="number"
                      min="1"
                      placeholder={`Qty ${index + 1}`}
                      className={`${inputCls} ${errors[`batchSplitQty-${split.id}`] ? "border-red-500 focus:ring-red-400" : ""}`}
                    />
                    {errors[`batchSplitQty-${split.id}`] ? (
                      <p className="mt-1 text-xs text-red-500">{errors[`batchSplitQty-${split.id}`]}</p>
                    ) : null}
                  </div>
                  <div>
                    <input
                      value={split.expiryDate}
                      onChange={(e) => updateBatchSplit(split.id, "expiryDate", e.target.value)}
                      type="date"
                      className={`${inputCls} ${errors[`batchSplitExpiry-${split.id}`] ? "border-red-500 focus:ring-red-400" : ""}`}
                    />
                    {errors[`batchSplitExpiry-${split.id}`] ? (
                      <p className="mt-1 text-xs text-red-500">{errors[`batchSplitExpiry-${split.id}`]}</p>
                    ) : null}
                  </div>
                  <button
                    type="button"
                    onClick={() => removeBatchSplit(split.id)}
                    className="mt-1 rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-500"
                    title="Remove expiry date"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
              {errors.batchSplits ? (
                <p className="text-xs text-red-500">{errors.batchSplits}</p>
              ) : null}
            </div>
          </>
        )}

        {/* Tool quantity */}
        {isTool && (
          <Field label="Quantity">
            <input
              value={form.quantity}
              onChange={(e) => set("quantity", e.target.value)}
              onBlur={() => setTouched((prev) => ({ ...prev, quantity: true }))}
              type="number"
              min="1"
              className={`${inputCls} ${touched.quantity && errors.quantity ? "border-red-500 focus:ring-red-400" : ""}`}
            />
            {touched.quantity && errors.quantity ? (
              <p className="mt-1 text-xs text-red-500">{errors.quantity}</p>
            ) : null}
          </Field>
        )}

        {/* Dynamic metadata */}
        {catObj?.fields?.length > 0 && (
          <div className="col-span-2 bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Tracked Metadata</p>
            <div className="grid grid-cols-2 gap-3">
              <MetaFields
  fields={catObj?.fields || []}
  values={form.meta}
  onChange={setMeta}
  inputCls={inputCls}
  errors={errors}
  touched={touched}
  setTouched={setTouched}
/>
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

function ItemDrawer({ item, onClose, onEdit, onQR }: { item: ItemFormData; onClose: () => void; onEdit: () => void; onQR: () => void }) {
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
            <QRCanvas value={String(item.itemId)} size={64} />
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
              {(
                [
                  ["Category", `${item.categoryCode} — ${item.categoryLabel}`],
                  ["Location", item.location || "—"],
                  ["Supplier", item.supplier || "—"],
                  ["Registered", formatDate(item.registeredDate)],
                  item.purchaseDate && ["Purchase Date", formatDate(item.purchaseDate)],
                  item.warrantyExp  && ["Warranty Exp.", formatDate(item.warrantyExp)],
                  item.quantity     && ["Quantity", `${item.quantity} ${item.unit || ""}`],
                  item.pieceCount   && ["Piece Count", String(item.pieceCount)],
                  item.batchDate    && ["Batch Date", formatDate(item.batchDate)],
                  item.expiryDate   && ["Expiry Date", formatDate(item.expiryDate)],
                ] as Array<[string, string] | false>
              ).filter((entry): entry is [string, string] => Boolean(entry)).map(([label, value]) => (
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
                {Object.entries(item.meta as Record<string, any>).filter(([, v]) => v).map(([k, v]) => (
                  <div key={k} className="flex justify-between items-center">
                    <span className="text-slate-400">{FIELD_LABELS[k] || k}</span>
                    <span className="font-medium text-slate-700 font-mono">{String(v)}</span>
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

function Modal({ open, onClose, title, children, width = "max-w-xl" }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode; width?: string }) {
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

function ConfirmDelete({ open, onClose, onConfirm, name }: { open: boolean; onClose: () => void; onConfirm: () => void; name?: string }) {
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
  { id:"i1", itemId:"TOOL-CUT-0001", type:"Tool",       categoryCode:"CUT",  categoryLabel:"Cutting Machines",        name:"Angle Grinder 230mm",         status:"Active",       location:"Site A – Workshop",  supplier:"MachinCo",    purchaseDate:"2024-03-10", warrantyExp:"2026-03-10", quantity:2,  unit:"",      batchDate:"",           expiryDate:"",           pieceCount:"",  registeredDate:"2024-03-10", meta:{ maxHours:"500", serialNo:"CUT-2024-001", bladeType:"Diamond" },       description:"Heavy-duty angle grinder" },
  { id:"i2", itemId:"TOOL-GEN-0001", type:"Tool",       categoryCode:"GEN",  categoryLabel:"Generators",              name:"Diesel Generator 15KVA",       status:"In Use",       location:"Site B",             supplier:"PowerGen",    purchaseDate:"2023-11-05", warrantyExp:"2025-11-05", quantity:1,  unit:"",      batchDate:"",           expiryDate:"",           pieceCount:"",  registeredDate:"2023-11-05", meta:{ runningHours:"320", outputKVA:"15" },                                description:"Backup power for Site B" },
  { id:"i3", itemId:"TOOL-WLD-0001", type:"Tool",       categoryCode:"WLD",  categoryLabel:"Welding Machines",        name:"MIG Welder 250A",              status:"Under Maintenance", location:"Workshop",       supplier:"WeldTech",    purchaseDate:"2022-06-20", warrantyExp:"2024-06-20", quantity:1,  unit:"",      batchDate:"",           expiryDate:"",           pieceCount:"",  registeredDate:"2022-06-20", meta:{ arcHours:"1200", amperageRange:"50-250A" },                          description:"Used for structural welding" },
  { id:"i4", itemId:"REUS-SCF-0001", type:"Reusable",   categoryCode:"SCF",  categoryLabel:"Scaffolding Frames",      name:"Standard Scaffolding Bundle A", status:"Active",       location:"Yard – Section 3",   supplier:"ScaffoldPro", purchaseDate:"2023-01-15", warrantyExp:"",           quantity:1,  unit:"frames",batchDate:"",           expiryDate:"",           pieceCount:"5",  registeredDate:"2023-01-15", meta:{},                                                                    description:"5-frame bundle for standard floors" },
  { id:"i5", itemId:"REUS-PROP-0001",type:"Reusable",   categoryCode:"PROP", categoryLabel:"Acrow Props / Steel Props",name:"Acrow Props Set 1",           status:"In Use",       location:"Site C – Level 2",   supplier:"PropsPlus",   purchaseDate:"2023-05-10", warrantyExp:"",           quantity:1,  unit:"props", batchDate:"",           expiryDate:"",           pieceCount:"10", registeredDate:"2023-05-10", meta:{},                                                                    description:"10-prop bundle" },
  { id:"i6", itemId:"CONS-CEM-2026-04-16-01", type:"Consumable", categoryCode:"CEM", categoryLabel:"Cement (bagged)", name:"OPC Cement Batch Apr-16",     status:"Active",       location:"Warehouse A",        supplier:"CementCo",    purchaseDate:"",           warrantyExp:"",           quantity:500,unit:"Bags",  batchDate:"2026-04-16", expiryDate:"2026-07-16", pieceCount:"",  registeredDate:"2026-04-16", meta:{},                                                                    description:"Ordinary Portland Cement" },
  { id:"i7", itemId:"CONS-RBR-2026-04-16-01", type:"Consumable", categoryCode:"RBR", categoryLabel:"Rebar / Steel Reinforcement", name:"T12 Rebar Batch Apr-16", status:"Active", location:"Yard – Steel Store", supplier:"SteelMart",   purchaseDate:"",           warrantyExp:"",           quantity:200,unit:"Length (m) or kg", batchDate:"2026-04-16", expiryDate:"2027-04-16", pieceCount:"", registeredDate:"2026-04-16", meta:{},                                                                    description:"T12 deformed steel bar" },
];

// ─────────────────────────────────────────────────────────────────────────────
// MAIN APP
// ─────────────────────────────────────────────────────────────────────────────

export default function ItemRegistration() {
  const router = useRouter();
  const [items, setItems] = useState<ItemFormData[]>(SEED_ITEMS);
  const [subCategories, setSubCategories] = useState<SubCategory[]>([]);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<"all" | ItemType>("all");
  const [filterStatus, setFilterStatus] = useState<"all" | string>("all");
  const [modal, setModal] = useState<"create" | "edit" | "delete" | null>(null);
  const [target, setTarget] = useState<ItemFormData | null>(null);
  const [drawer, setDrawer] = useState<ItemFormData | null>(null);
  const [qrItem, setQrItem] = useState<ItemFormData | null>(null);
  const [apiError, setApiError] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const handleAuthFailure = useCallback(() => {
    localStorage.removeItem("admin_token");
    setApiError("Your session has expired. Please sign in again.");
    router.replace("/login");
  }, [router]);

  useEffect(() => {
    const load = async () => {
      try {
        const categories = await apiFetch("/sub-categories");
        setSubCategories(categories || []);
      } catch (error: any) {
        console.warn("Unable to load categories from backend:", error);
        if (error?.status === 401) {
          handleAuthFailure();
          return;
        }
      }

      try {
        const result = await apiFetch("/items");
        const backendItems = Array.isArray(result) ? result : [];
        const mappedItems = backendItems.map(mapBackendItem);
        setItems(mappedItems);
      } catch (error: any) {
        console.warn("Unable to load items from backend:", error);
        if (error?.status === 401) {
          handleAuthFailure();
          return;
        }
        setApiError("Unable to connect to the backend item service. Showing local data only.");
      }
    };

    load();
  }, [handleAuthFailure]);

  const create = async (data: ItemFormData) => {
    try {
      setLoading(true);
      setApiError("");
      const createForms =
        data.type === "Consumable" && data.batchSplits?.length
          ? data.batchSplits.map((split) => ({
              ...data,
              quantity: split.quantity,
              expiryDate: split.expiryDate,
              batchSplits: [],
            }))
          : [data];

      const results = [];
      for (const formData of createForms) {
        const payload = createItemPayload(formData, subCategories);
        results.push(await apiFetch("/items", {
          method: "POST",
          body: JSON.stringify(payload),
        }));
      }
      const newItems: ItemFormData[] = [];
      for (const created of results) {
        if (!created.item) continue;
        if (Array.isArray(created.item)) {
          newItems.push(...created.item.map((item: AnyRecord) => mapBackendItem({ type: created.type, item })));
        } else {
          newItems.push(mapBackendItem(created));
        }
      }
      if (newItems.length > 0) {
        setItems((prev) => [...newItems, ...prev]);
      }
      setModal(null);
    } catch (error: any) {
      if (error?.status === 401) {
        handleAuthFailure();
        return;
      }
      const message = error?.message || "Unable to create item.";
      setApiError(message);
      console.error("Create item failed:", error);
    } finally {
      setLoading(false);
    }
  };

  const update = (data: Partial<ItemFormData>) => {
    setItems((p) => p.map((i) => (i.id === target?.id ? { ...i, ...data } : i)));
    setModal(null);
    setDrawer(null);
  };
  const remove = () => {
    if (!target) return;
    setItems((p) => p.filter((i) => i.id !== target.id));
    setModal(null);
  };

  const filtered = items.filter((item) => {
    const q = search.toLowerCase();
    const ms = String(item.itemId).toLowerCase().includes(q) || String(item.name).toLowerCase().includes(q) || String(item.categoryCode).toLowerCase().includes(q) || String(item.categoryLabel).toLowerCase().includes(q);
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
          <select value={filterType} onChange={(e) => setFilterType(e.target.value as "all" | ItemType)} className={selCls}>
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
        <ItemForm subCategories={subCategories} onSubmit={create} onCancel={() => setModal(null)} />
      </Modal>
      <Modal open={modal === "edit"} onClose={() => setModal(null)} title="Edit Item">
        {target && <ItemForm initial={target} subCategories={subCategories} onSubmit={update} onCancel={() => setModal(null)} />}
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
