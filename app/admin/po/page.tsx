"use client";

import { useState, useRef, useEffect } from "react";
import {
  Plus, Search, Eye, Pencil, Trash2, X, AlertCircle,
  Package, ChevronDown, Hash, Calendar, Download, Filter,
  CheckCircle, Clock, Archive, Boxes, ShoppingCart,
  Wrench, RefreshCw, FileText, Send, Printer,
  ChevronRight, ArrowLeft, AlertTriangle, ExternalLink,
  Layers, Tag, Building2, Truck, CreditCard, MoreVertical,
  Copy, Ban, RotateCcw, ClipboardList, SquarePen, QrCode
} from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

const ITEM_TYPES = ["Tool", "Reusable", "Consumable"];

const TOOL_CATEGORIES = [
  { code: "CUT",  label: "Cutting Machines",        fields: ["maxHours","serialNo","bladeType"] },
  { code: "DRL",  label: "Drilling Machines",        fields: ["maxHours","chuckSize","serialNo"] },
  { code: "MIX",  label: "Concrete Mixers",          fields: ["drumHours","capacityLitres"] },
  { code: "GEN",  label: "Generators",               fields: ["runningHours","outputKVA"] },
  { code: "PMP",  label: "Pumps",                    fields: ["runningHours","flowRate"] },
  { code: "WLD",  label: "Welding Machines",         fields: ["arcHours","amperageRange"] },
  { code: "LEV",  label: "Laser Levels / Surveying", fields: ["calibrationDate","range"] },
  { code: "EXC",  label: "Excavators",               fields: ["engineHours","bucketCapacity"] },
  { code: "CRN",  label: "Cranes",                   fields: ["liftHours","maxLoadRating"] },
  { code: "SCF",  label: "Scaffolding Systems",      fields: ["serialNo"] },
];

const REUSABLE_CATEGORIES = [
  { code: "SCF",  label: "Scaffolding Frames",           defaultPieces: 5,  unit: "frames" },
  { code: "PROP", label: "Acrow Props / Steel Props",    defaultPieces: 10, unit: "props" },
  { code: "FWK",  label: "Formwork / Shuttering Panels", defaultPieces: 4,  unit: "panels" },
  { code: "PLK",  label: "Scaffold Planks / Boards",     defaultPieces: 6,  unit: "planks" },
  { code: "CPLA", label: "Column Plates",                defaultPieces: 1,  unit: "plates", individualTracking: true },
  { code: "SAFE", label: "Safety Netting",               defaultPieces: 1,  unit: "rolls" },
];

const CONSUMABLE_CATEGORIES = [
  { code: "CEM",  label: "Cement (bagged)",             unit: "Bags" },
  { code: "SND",  label: "Sand (bulk)",                 unit: "Cubic metres" },
  { code: "STN",  label: "Crushed Stone / Aggregate",   unit: "Cubic metres" },
  { code: "SBK",  label: "Sandbags",                    unit: "Units" },
  { code: "RBR",  label: "Rebar / Steel Reinforcement", unit: "Length (m) or kg" },
  { code: "PNT",  label: "Paint",                       unit: "Litres" },
  { code: "PVC",  label: "PVC / Plumbing Materials",    unit: "Units or metres" },
  { code: "CONC", label: "Ready-mix Concrete",          unit: "Cubic metres" },
];

const STATUS_OPTIONS_ITEM = ["Active", "In Use", "Under Maintenance", "Retired", "Out of Stock"];

const STATUS_STYLES_ITEM: Record<string, any> = {
  "Active":            { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", dot: "bg-emerald-500" },
  "In Use":            { bg: "bg-blue-50",    text: "text-blue-700",    border: "border-blue-200",    dot: "bg-blue-500"    },
  "Under Maintenance": { bg: "bg-amber-50",   text: "text-amber-700",   border: "border-amber-200",   dot: "bg-amber-500"   },
  "Retired":           { bg: "bg-rose-50",    text: "text-rose-600",    border: "border-rose-200",    dot: "bg-rose-500"    },
  "Out of Stock":      { bg: "bg-slate-100",  text: "text-slate-500",   border: "border-slate-200",   dot: "bg-slate-400"   },
};

const PO_STATUSES = ["Draft", "Pending Approval", "Approved", "Ordered", "Partially Received", "Received", "Cancelled"];

const PO_STATUS_STYLES: Record<string, { bg: string; text: string; border: string; dot: string }> = {
  "Draft":               { bg: "bg-slate-100",   text: "text-slate-500",   border: "border-slate-200",  dot: "bg-slate-400"   },
  "Pending Approval":    { bg: "bg-amber-50",    text: "text-amber-700",   border: "border-amber-200",  dot: "bg-amber-500"   },
  "Approved":            { bg: "bg-blue-50",     text: "text-blue-700",    border: "border-blue-200",   dot: "bg-blue-500"    },
  "Ordered":             { bg: "bg-violet-50",   text: "text-violet-700",  border: "border-violet-200", dot: "bg-violet-500"  },
  "Partially Received":  { bg: "bg-orange-50",   text: "text-orange-700",  border: "border-orange-200", dot: "bg-orange-500"  },
  "Received":            { bg: "bg-emerald-50",  text: "text-emerald-700", border: "border-emerald-200",dot: "bg-emerald-500" },
  "Cancelled":           { bg: "bg-rose-50",     text: "text-rose-600",    border: "border-rose-200",   dot: "bg-rose-400"    },
};

const TYPE_STYLES: Record<string, { bg: string; text: string; border: string; icon: any; accent: string }> = {
  Tool:       { bg: "bg-violet-50", text: "text-violet-700", border: "border-violet-200", icon: Wrench,    accent: "#7c3aed" },
  Reusable:   { bg: "bg-teal-50",   text: "text-teal-700",   border: "border-teal-200",   icon: RefreshCw, accent: "#0f766e" },
  Consumable: { bg: "bg-orange-50", text: "text-orange-700", border: "border-orange-200", icon: Boxes,     accent: "#c2410c" },
};

const FIELD_LABELS: Record<string, string> = {
  maxHours: "Max Hours", serialNo: "Serial No.", bladeType: "Blade Type",
  chuckSize: "Chuck Size", drumHours: "Drum Hours", capacityLitres: "Capacity (L)",
  runningHours: "Running Hours", outputKVA: "Output KVA", flowRate: "Flow Rate",
  arcHours: "Arc Hours", amperageRange: "Amperage Range", calibrationDate: "Calibration Date",
  range: "Range", engineHours: "Engine Hours", bucketCapacity: "Bucket Capacity",
  liftHours: "Lift Hours", maxLoadRating: "Max Load Rating",
};

// ─────────────────────────────────────────────────────────────────────────────
// SEED DATA
// ─────────────────────────────────────────────────────────────────────────────

const SEED_REGISTERED_ITEMS = [
  { itemId:"TOOL-CUT-0001", type:"Tool",       categoryCode:"CUT",  categoryLabel:"Cutting Machines",         name:"Angle Grinder 230mm",          unit:"",                   status:"Active"    },
  { itemId:"TOOL-GEN-0001", type:"Tool",       categoryCode:"GEN",  categoryLabel:"Generators",               name:"Diesel Generator 15KVA",       unit:"",                   status:"In Use"    },
  { itemId:"TOOL-WLD-0001", type:"Tool",       categoryCode:"WLD",  categoryLabel:"Welding Machines",         name:"MIG Welder 250A",              unit:"",                   status:"Under Maintenance" },
  { itemId:"REUS-SCF-0001", type:"Reusable",   categoryCode:"SCF",  categoryLabel:"Scaffolding Frames",       name:"Standard Scaffolding Bundle A", unit:"frames",            status:"Active"    },
  { itemId:"REUS-PROP-0001",type:"Reusable",   categoryCode:"PROP", categoryLabel:"Acrow Props / Steel Props",name:"Acrow Props Set 1",            unit:"props",              status:"In Use"    },
  { itemId:"CONS-CEM-2026-04-16-01", type:"Consumable", categoryCode:"CEM", categoryLabel:"Cement (bagged)",  name:"OPC Cement Batch Apr-16",      unit:"Bags",               status:"Active"    },
  { itemId:"CONS-RBR-2026-04-16-01", type:"Consumable", categoryCode:"RBR", categoryLabel:"Rebar / Steel Reinforcement", name:"T12 Rebar Batch Apr-16", unit:"Length (m) or kg", status:"Active" },
];

const SEED_POS = [
  {
    id: "po1", poNumber: "PO-2026-0001", status: "Received",
    supplier: "CementCo", site: "Site A – Warehouse",
    requestedBy: "J. Perera", approvedBy: "M. Silva",
    createdDate: "2026-04-15", requiredDate: "2026-04-20", deliveredDate: "2026-04-19",
    notes: "Priority delivery — slab pour on 21st",
    lines: [
      { id:"l1", itemId:"CONS-CEM-2026-04-16-01", itemName:"OPC Cement Batch Apr-16", type:"Consumable", categoryCode:"CEM", unit:"Bags",   qtyOrdered:500, qtyReceived:500, unitPrice:1850, isRegistered: true },
    ],
  },
  {
    id: "po2", poNumber: "PO-2026-0002", status: "Ordered",
    supplier: "SteelMart", site: "Site B",
    requestedBy: "D. Gunasekara", approvedBy: "M. Silva",
    createdDate: "2026-05-01", requiredDate: "2026-05-10", deliveredDate: "",
    notes: "",
    lines: [
      { id:"l2", itemId:"CONS-RBR-2026-04-16-01", itemName:"T12 Rebar Batch Apr-16", type:"Consumable", categoryCode:"RBR", unit:"kg",    qtyOrdered:4000, qtyReceived:0, unitPrice:320, isRegistered: true },
      { id:"l3", itemId:"", itemName:"T16 Rebar",                                    type:"Consumable", categoryCode:"RBR", unit:"kg",    qtyOrdered:2000, qtyReceived:0, unitPrice:340, isRegistered: false },
    ],
  },
  {
    id: "po3", poNumber: "PO-2026-0003", status: "Draft",
    supplier: "", site: "Site C",
    requestedBy: "K. Bandara", approvedBy: "",
    createdDate: "2026-05-18", requiredDate: "2026-05-28", deliveredDate: "",
    notes: "Awaiting supplier quote",
    lines: [
      { id:"l4", itemId:"", itemName:"Ready-mix Concrete Grade 30", type:"Consumable", categoryCode:"CONC", unit:"Cubic metres", qtyOrdered:50, qtyReceived:0, unitPrice:0, isRegistered: false },
    ],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function uid() { return Math.random().toString(36).slice(2, 9); }
function todayStr() { return new Date().toISOString().slice(0, 10); }
function formatDate(d: string) {
  return d ? new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—";
}
function fmtCurrency(n: number) {
  return n ? `Rs. ${n.toLocaleString("en-LK")}` : "—";
}

let poCounter = 3;
function nextPONumber() {
  poCounter++;
  return `PO-2026-${String(poCounter).padStart(4, "0")}`;
}

function calcTotals(lines: any[]) {
  const subtotal = lines.reduce((s, l) => s + (l.qtyOrdered || 0) * (l.unitPrice || 0), 0);
  return { subtotal };
}

function getCategoryList(type: string) {
  if (type === "Tool")       return TOOL_CATEGORIES;
  if (type === "Reusable")   return REUSABLE_CATEGORIES;
  if (type === "Consumable") return CONSUMABLE_CATEGORIES;
  return [];
}

function getCategoryByCode(type: string, code: string) {
  return getCategoryList(type).find((c) => c.code === code) || null;
}

function pad(n: number, len = 4) { return String(n).padStart(len, "0"); }
const counters: Record<string, number> = {};
function nextSeq(key: string) { counters[key] = (counters[key] || 0) + 1; return counters[key]; }
function generateItemId(type: string, catCode: string, date: string) {
  if (type === "Tool")       return `TOOL-${catCode}-${pad(nextSeq(`TOOL-${catCode}`))}`;
  if (type === "Reusable")   return `REUS-${catCode}-${pad(nextSeq(`REUS-${catCode}`))}`;
  const [y, m, day] = (date || todayStr()).split("-");
  return `CONS-${catCode}-${y}-${m}-${day}-${pad(nextSeq(`CONS-${catCode}-${date}`), 2)}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// BADGES
// ─────────────────────────────────────────────────────────────────────────────

function POStatusBadge({ status }: { status: string }) {
  const s = PO_STATUS_STYLES[status] || PO_STATUS_STYLES["Draft"];
  return (
    <span className={`inline-flex items-center gap-1.5 text-[10px] px-2 py-0.5 rounded-full font-semibold border ${s.bg} ${s.text} ${s.border}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {status}
    </span>
  );
}

function TypeBadge({ type }: { type: string }) {
  const s = TYPE_STYLES[type] || TYPE_STYLES.Tool;
  const Icon = s.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 text-[10px] px-2 py-0.5 rounded-full font-semibold border ${s.bg} ${s.text} ${s.border}`}>
      <Icon size={9} /> {type}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ITEM REGISTRATION FORM (embedded)
// ─────────────────────────────────────────────────────────────────────────────

function ItemRegistrationForm({ onSubmit, onCancel }: { onSubmit: (item: any) => void; onCancel: () => void }) {
  const defaultForm = {
    type: "Tool", categoryCode: "CUT", name: "", description: "",
    status: "Active", quantity: 1, unit: "", location: "", supplier: "",
    purchaseDate: "", warrantyExp: "", batchDate: todayStr(),
    pieceCount: "", meta: {} as Record<string, string>,
  };
  const [form, setForm] = useState(defaultForm);
  const set = (k: string, v: any) => setForm((f) => ({ ...f, [k]: v }));
  const setMeta = (k: string, v: string) => setForm((f) => ({ ...f, meta: { ...f.meta, [k]: v } }));

  const handleTypeChange = (t: string) => {
    const cats = getCategoryList(t);
    set("type", t);
    set("categoryCode", cats[0]?.code || "");
    set("meta", {});
  };

  const catList = getCategoryList(form.type);
  const catObj = getCategoryByCode(form.type, form.categoryCode) as any;
  const isReusable   = form.type === "Reusable";
  const isConsumable = form.type === "Consumable";
  const isTool       = form.type === "Tool";
  const valid = form.name.trim() && form.categoryCode;

  const inputCls = "w-full border border-slate-200 rounded-xl px-3 py-2 text-[12px] focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white text-slate-700";

  const handleSubmit = () => {
    if (!valid) return;
    const date = isConsumable ? form.batchDate : (form.purchaseDate || todayStr());
    const itemId = generateItemId(form.type, form.categoryCode, date);
    const catLabel = catObj?.label || form.categoryCode;
    const unit = isConsumable ? (catObj?.unit || form.unit) : (isReusable ? catObj?.unit : form.unit);
    onSubmit({ ...form, itemId, categoryLabel: catLabel, unit, registeredDate: todayStr(), id: "i" + uid() });
  };

  return (
    <div className="p-5 space-y-4">
      {/* Type toggle */}
      <div className="flex gap-1.5 p-1 bg-slate-100 rounded-xl">
        {ITEM_TYPES.map((t) => {
          const s = TYPE_STYLES[t];
          const Icon = s.icon;
          return (
            <button key={t} onClick={() => handleTypeChange(t)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-[11px] font-semibold transition-all ${form.type === t ? "bg-white shadow-sm text-slate-800" : "text-slate-500 hover:text-slate-700"}`}>
              <Icon size={11} style={{ color: form.type === t ? s.accent : undefined }} />{t}
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-2 gap-3">
        {/* Category */}
        <div className="col-span-2">
          <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1.5 tracking-wider">Category</label>
          <select value={form.categoryCode} onChange={(e) => { set("categoryCode", e.target.value); set("meta", {}); }} className={inputCls}>
            {catList.map((c: any) => <option key={c.code} value={c.code}>{c.code} — {c.label}</option>)}
          </select>
        </div>

        {/* Name */}
        <div className="col-span-2">
          <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1.5 tracking-wider">Item Name *</label>
          <input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder={`e.g. ${catObj?.label || "Item name"}`} className={inputCls} />
        </div>

        {/* Description */}
        <div className="col-span-2">
          <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1.5 tracking-wider">Description</label>
          <textarea value={form.description} onChange={(e) => set("description", e.target.value)} rows={2} placeholder="Brief description…" className={`${inputCls} resize-none`} />
        </div>

        {/* Status */}
        <div>
          <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1.5 tracking-wider">Status</label>
          <select value={form.status} onChange={(e) => set("status", e.target.value)} className={inputCls}>
            {STATUS_OPTIONS_ITEM.map((s) => <option key={s}>{s}</option>)}
          </select>
        </div>

        {/* Location */}
        <div>
          <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1.5 tracking-wider">Location / Site</label>
          <input value={form.location} onChange={(e) => set("location", e.target.value)} placeholder="Site / Warehouse" className={inputCls} />
        </div>

        {/* Supplier */}
        <div>
          <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1.5 tracking-wider">Supplier</label>
          <input value={form.supplier} onChange={(e) => set("supplier", e.target.value)} placeholder="Supplier name" className={inputCls} />
        </div>

        {/* Purchase date (non-consumable) */}
        {!isConsumable && (
          <div>
            <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1.5 tracking-wider">Purchase Date</label>
            <input value={form.purchaseDate} onChange={(e) => set("purchaseDate", e.target.value)} type="date" className={inputCls} />
          </div>
        )}

        {/* Warranty (tool) */}
        {isTool && (
          <div>
            <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1.5 tracking-wider">Warranty Expiry</label>
            <input value={form.warrantyExp} onChange={(e) => set("warrantyExp", e.target.value)} type="date" className={inputCls} />
          </div>
        )}

        {/* Reusable */}
        {isReusable && (
          <>
            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1.5 tracking-wider">Piece Count</label>
              <input value={form.pieceCount || catObj?.defaultPieces || ""} onChange={(e) => set("pieceCount", e.target.value)} type="number" min="1" className={inputCls} />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1.5 tracking-wider">Individual Tracking</label>
              <select className={inputCls}><option>No</option><option>Yes</option></select>
            </div>
          </>
        )}

        {/* Consumable */}
        {isConsumable && (
          <>
            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1.5 tracking-wider">Batch Date</label>
              <input value={form.batchDate} onChange={(e) => set("batchDate", e.target.value)} type="date" className={inputCls} />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1.5 tracking-wider">Quantity</label>
              <input value={form.quantity} onChange={(e) => set("quantity", Number(e.target.value))} type="number" min="1" className={inputCls} />
            </div>
            <div className="col-span-2">
              <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1.5 tracking-wider">Unit ({catObj?.unit || "unit"})</label>
              <input value={form.unit || catObj?.unit || ""} onChange={(e) => set("unit", e.target.value)} placeholder={catObj?.unit || "Unit"} className={inputCls} />
            </div>
          </>
        )}

        {/* Tool quantity */}
        {isTool && (
          <div>
            <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1.5 tracking-wider">Quantity</label>
            <input value={form.quantity} onChange={(e) => set("quantity", Number(e.target.value))} type="number" min="1" className={inputCls} />
          </div>
        )}

        {/* Dynamic metadata */}
        {catObj?.fields?.length > 0 && (
          <div className="col-span-2 bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Tracked Metadata</p>
            <div className="grid grid-cols-2 gap-3">
              {catObj.fields.map((f: string) => (
                <div key={f}>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1.5 tracking-wider">{FIELD_LABELS[f] || f}</label>
                  <input type={f === "calibrationDate" ? "date" : "text"} value={form.meta[f] || ""} onChange={(e) => setMeta(f, e.target.value)} placeholder={FIELD_LABELS[f] || f} className={inputCls} />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Preview ID */}
      <div className="flex items-center gap-2 bg-violet-50 border border-violet-200 rounded-xl px-3 py-2.5">
        <Tag size={12} className="text-violet-500 flex-shrink-0" />
        <div>
          <p className="text-[9px] text-violet-400 font-bold uppercase tracking-wider">Generated Item ID (preview)</p>
          <p className="text-[11px] font-bold font-mono text-violet-700">
            {(() => {
              if (form.type === "Tool")     return `TOOL-${form.categoryCode}-XXXX`;
              if (form.type === "Reusable") return `REUS-${form.categoryCode}-XXXX`;
              const [y, m, day] = (form.batchDate || todayStr()).split("-");
              return `CONS-${form.categoryCode}-${y}-${m}-${day}-XX`;
            })()}
          </p>
        </div>
      </div>

      <div className="flex gap-3 pt-1">
        <button onClick={onCancel} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-[12px] font-semibold text-slate-600 hover:bg-slate-50">Cancel</button>
        <button onClick={handleSubmit} disabled={!valid}
          className={`flex-1 py-2.5 rounded-xl text-white text-[12px] font-semibold transition-colors ${valid ? "bg-blue-600 hover:bg-blue-700" : "bg-blue-300 cursor-not-allowed"}`}>
          Register Item
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ITEM REGISTRATION MODAL
// ─────────────────────────────────────────────────────────────────────────────

function ItemRegistrationModal({ open, onClose, onRegistered }: { open: boolean; onClose: () => void; onRegistered: (item: any) => void }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center"><Package size={13} className="text-white" /></div>
            <h2 className="text-[14px] font-bold text-slate-800">Register New Item</h2>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400"><X size={15} /></button>
        </div>
        <div className="overflow-y-auto flex-1">
          <ItemRegistrationForm
            onSubmit={(item) => { onRegistered(item); onClose(); }}
            onCancel={onClose}
          />
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// UNREGISTERED ITEM BANNER
// ─────────────────────────────────────────────────────────────────────────────

function UnregisteredBanner({ onGoRegister }: { onGoRegister: () => void }) {
  return (
    <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-[12px]">
      <AlertTriangle size={15} className="text-amber-500 mt-0.5 flex-shrink-0" />
      <div className="flex-1">
        <p className="font-bold text-amber-700">Item not in registry</p>
        <p className="text-amber-600 mt-0.5">This item hasn't been registered yet. You can still add it to the PO, but it won't have a tracked Item ID.</p>
      </div>
      <button onClick={onGoRegister}
        className="flex items-center gap-1.5 text-[11px] font-bold text-amber-700 bg-amber-100 hover:bg-amber-200 border border-amber-300 px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap">
        <Plus size={10} /> Register Now
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ITEM PICKER MODAL
// ─────────────────────────────────────────────────────────────────────────────

function ItemPickerModal({ open, onClose, onPick, onGoRegister, registeredItems }: {
  open: boolean; onClose: () => void; onPick: (item: any) => void;
  onGoRegister: () => void; registeredItems: any[];
}) {
  const [q, setQ] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");

  const filtered = registeredItems.filter((i) => {
    const qm = q === "" || i.itemId.toLowerCase().includes(q.toLowerCase()) || i.name.toLowerCase().includes(q.toLowerCase());
    const tm = typeFilter === "all" || i.type === typeFilter;
    return qm && tm;
  });

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Package size={15} className="text-blue-600" />
            <h2 className="text-[14px] font-bold text-slate-800">Select Registered Item</h2>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400"><X size={15} /></button>
        </div>
        <div className="p-4 border-b border-slate-100 flex gap-3">
          <div className="relative flex-1">
            <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={q} onChange={(e) => setQ(e.target.value)} autoFocus placeholder="Search ID, name…"
              className="w-full pl-8 pr-3 py-2 text-[12px] border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 bg-slate-50" />
          </div>
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}
            className="text-[11px] border border-slate-200 rounded-xl px-3 bg-slate-50 text-slate-600 focus:outline-none">
            <option value="all">All Types</option>
            {ITEM_TYPES.map((t) => <option key={t}>{t}</option>)}
          </select>
        </div>
        <div className="flex-1 overflow-y-auto divide-y divide-slate-50">
          {filtered.length === 0 ? (
            <div className="py-10 text-center text-slate-400 text-[12px]">No items found</div>
          ) : filtered.map((item) => {
            const ts = TYPE_STYLES[item.type] || TYPE_STYLES.Tool;
            const Icon = ts.icon;
            return (
              <button key={item.itemId} onClick={() => { onPick(item); onClose(); }}
                className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-blue-50/40 transition-colors text-left group">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white flex-shrink-0" style={{ background: ts.accent }}>
                  <Icon size={14} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-bold text-slate-700 truncate">{item.name}</p>
                  <p className="text-[10px] font-mono text-slate-400">{item.itemId}</p>
                </div>
                <TypeBadge type={item.type} />
                <ChevronRight size={13} className="text-slate-300 group-hover:text-blue-500 flex-shrink-0" />
              </button>
            );
          })}
        </div>
        <div className="p-4 border-t border-slate-100 bg-slate-50">
          <p className="text-[11px] text-slate-500 mb-2">Item not in the list?</p>
          <div className="flex gap-2">
            <button onClick={onGoRegister}
              className="flex items-center gap-1.5 text-[11px] font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-3 py-2 rounded-lg transition-colors">
              <Plus size={11} /> Register New Item
            </button>
            <button onClick={() => { onPick(null); onClose(); }}
              className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-600 bg-white hover:bg-slate-100 border border-slate-200 px-3 py-2 rounded-lg transition-colors">
              <SquarePen size={11} /> Add Unregistered
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PO LINE ROW — WIDER layout for form
// ─────────────────────────────────────────────────────────────────────────────

function POLineRow({ line, index, onUpdate, onRemove, onOpenPicker, onGoRegister, isEditing }: any) {
  const inputCls = "w-full border border-slate-200 rounded-xl px-3 py-2.5 text-[12px] focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white text-slate-700";

  return (
    <div className="border border-slate-200 rounded-2xl bg-white overflow-hidden shadow-sm">
      {/* Line header */}
      <div className="flex items-center justify-between px-5 py-2.5 bg-slate-50 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <span className="w-6 h-6 rounded-lg bg-slate-200 flex items-center justify-center text-[10px] font-extrabold text-slate-500">{index + 1}</span>
          {line.isRegistered
            ? <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1"><CheckCircle size={9} /> Registered</span>
            : <span className="text-[10px] font-semibold text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full flex items-center gap-1"><AlertTriangle size={9} /> Unregistered</span>
          }
          {line.itemId && <span className="text-[10px] font-mono text-slate-400 hidden sm:inline">{line.itemId}</span>}
        </div>
        {isEditing && (
          <button onClick={() => onRemove(line.id)} className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-500 transition-colors">
            <Trash2 size={13} />
          </button>
        )}
      </div>

      <div className="p-5">
        {/* Row 1: Item name + type */}
        <div className="grid grid-cols-12 gap-4 mb-4">
          <div className="col-span-12 lg:col-span-7">
            <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1.5 tracking-wider">Item Name *</label>
            {isEditing ? (
              <div className="flex gap-2">
                <input value={line.itemName} onChange={(e) => onUpdate(line.id, "itemName", e.target.value)}
                  placeholder="Item name or description…" className={`${inputCls} flex-1`} />
                <button onClick={() => onOpenPicker(line.id)}
                  className="flex-shrink-0 flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-blue-200 bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors text-[11px] font-semibold whitespace-nowrap"
                  title="Pick from registered items">
                  <Package size={12} /> Pick Item
                </button>
              </div>
            ) : (
              <p className="text-[13px] font-semibold text-slate-700">{line.itemName || "—"}</p>
            )}
          </div>
          <div className="col-span-6 lg:col-span-2">
            <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1.5 tracking-wider">Type</label>
            {isEditing ? (
              <select value={line.type} onChange={(e) => onUpdate(line.id, "type", e.target.value)} className={inputCls}>
                {ITEM_TYPES.map((t) => <option key={t}>{t}</option>)}
              </select>
            ) : <TypeBadge type={line.type} />}
          </div>
          <div className="col-span-6 lg:col-span-3">
            <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1.5 tracking-wider">Category</label>
            {isEditing ? (
              <select value={line.categoryCode} onChange={(e) => onUpdate(line.id, "categoryCode", e.target.value)} className={inputCls}>
                {[...TOOL_CATEGORIES, ...REUSABLE_CATEGORIES, ...CONSUMABLE_CATEGORIES].map((c) => (
                  <option key={c.code} value={c.code}>{c.code}</option>
                ))}
              </select>
            ) : <span className="text-[12px] text-slate-500 font-mono">{line.categoryCode}</span>}
          </div>
        </div>

        {/* Row 2: Qty + Unit + Price */}
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1.5 tracking-wider">Qty Ordered</label>
            {isEditing ? (
              <input type="number" min="0" value={line.qtyOrdered} onChange={(e) => onUpdate(line.id, "qtyOrdered", Number(e.target.value))} className={inputCls} />
            ) : <p className="text-[15px] font-bold text-slate-700">{line.qtyOrdered}</p>}
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1.5 tracking-wider">Unit</label>
            {isEditing ? (
              <input value={line.unit} onChange={(e) => onUpdate(line.id, "unit", e.target.value)} placeholder="Bags, kg, m…" className={inputCls} />
            ) : <p className="text-[12px] text-slate-500">{line.unit || "—"}</p>}
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1.5 tracking-wider">Unit Price (Rs.)</label>
            {isEditing ? (
              <input type="number" min="0" value={line.unitPrice || ""} onChange={(e) => onUpdate(line.id, "unitPrice", Number(e.target.value))} placeholder="0.00" className={inputCls} />
            ) : <p className="text-[12px] text-slate-500">{line.unitPrice ? `Rs. ${line.unitPrice.toLocaleString()}` : "—"}</p>}
          </div>
        </div>

        {/* Row 3: banners + totals */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          {!line.isRegistered && isEditing && (
            <UnregisteredBanner onGoRegister={onGoRegister} />
          )}
          <div className="ml-auto flex items-center gap-5 text-[12px]">
            {line.qtyOrdered > 0 && line.unitPrice > 0 && (
              <div className="text-right">
                <span className="text-slate-400 mr-2">Line Total</span>
                <span className="font-extrabold text-slate-800 text-[14px]">{fmtCurrency(line.qtyOrdered * line.unitPrice)}</span>
              </div>
            )}
            {!isEditing && (
              <div className="text-right">
                <span className="text-slate-400 mr-2">Received</span>
                <span className={`font-bold ${line.qtyReceived >= line.qtyOrdered ? "text-emerald-600" : "text-orange-600"}`}>
                  {line.qtyReceived} / {line.qtyOrdered}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PO FORM
// ─────────────────────────────────────────────────────────────────────────────

function POForm({ initial, onSubmit, onCancel, onGoRegister, registeredItems, onNewItemRegistered }: {
  initial?: any; onSubmit: (data: any) => void; onCancel: () => void;
  onGoRegister: () => void; registeredItems: any[]; onNewItemRegistered: (item: any) => void;
}) {
  const defaultPO = {
    poNumber: nextPONumber(), status: "Draft", supplier: "", site: "",
    requestedBy: "", approvedBy: "", createdDate: todayStr(),
    requiredDate: "", deliveredDate: "", notes: "", lines: [],
  };
  const [form, setForm] = useState(initial ? { ...defaultPO, ...initial } : defaultPO);
  const [pickerLineId, setPickerLineId] = useState<string | null>(null);
  const [showItemReg, setShowItemReg] = useState(false);
  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));

  const addLine = () => {
    setForm((f: any) => ({
      ...f, lines: [...f.lines, {
        id: uid(), itemId: "", itemName: "", type: "Consumable",
        categoryCode: "CEM", unit: "", qtyOrdered: 1, qtyReceived: 0, unitPrice: 0, isRegistered: false,
      }]
    }));
  };

  const updateLine = (id: string, key: string, val: any) =>
    setForm((f: any) => ({ ...f, lines: f.lines.map((l: any) => l.id === id ? { ...l, [key]: val } : l) }));

  const removeLine = (id: string) =>
    setForm((f: any) => ({ ...f, lines: f.lines.filter((l: any) => l.id !== id) }));

  const pickItem = (lineId: string, registeredItem: any) => {
    if (!registeredItem) { updateLine(lineId, "isRegistered", false); return; }
    setForm((f: any) => ({
      ...f, lines: f.lines.map((l: any) => l.id === lineId ? {
        ...l, itemId: registeredItem.itemId, itemName: registeredItem.name,
        type: registeredItem.type, categoryCode: registeredItem.categoryCode,
        unit: registeredItem.unit, isRegistered: true,
      } : l),
    }));
  };

  const handleNewItemRegistered = (item: any) => {
    onNewItemRegistered(item);
    setShowItemReg(false);
    // If a picker was open for a line, auto-fill it
    if (pickerLineId) { pickItem(pickerLineId, item); setPickerLineId(null); }
  };

  const { subtotal } = calcTotals(form.lines);
  const valid = form.lines.length > 0;
  const inputCls = "w-full border border-slate-200 rounded-xl px-4 py-2.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white text-slate-700";

  return (
    <div className="p-6 space-y-6">
      {/* Header grid */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1.5 tracking-wider">PO Number</label>
          <div className="flex items-center gap-2 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl">
            <Hash size={13} className="text-slate-400" />
            <span className="text-[13px] font-bold font-mono text-slate-700">{form.poNumber}</span>
          </div>
        </div>
        <div>
          <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1.5 tracking-wider">Status</label>
          <select value={form.status} onChange={(e) => set("status", e.target.value)} className={inputCls}>
            {PO_STATUSES.map((s) => <option key={s}>{s}</option>)}
          </select>
        </div>
        <div className="col-span-2">
          <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1.5 tracking-wider">Supplier / Vendor</label>
          <input value={form.supplier} onChange={(e) => set("supplier", e.target.value)} placeholder="Supplier or vendor name" className={inputCls} />
        </div>
        <div>
          <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1.5 tracking-wider">Delivery Site</label>
          <input value={form.site} onChange={(e) => set("site", e.target.value)} placeholder="Site / Warehouse" className={inputCls} />
        </div>
        <div>
          <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1.5 tracking-wider">Requested By</label>
          <input value={form.requestedBy} onChange={(e) => set("requestedBy", e.target.value)} placeholder="Name" className={inputCls} />
        </div>
        <div>
          <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1.5 tracking-wider">Approved By</label>
          <input value={form.approvedBy} onChange={(e) => set("approvedBy", e.target.value)} placeholder="Name" className={inputCls} />
        </div>
        <div>
          <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1.5 tracking-wider">Required By Date</label>
          <input type="date" value={form.requiredDate} onChange={(e) => set("requiredDate", e.target.value)} className={inputCls} />
        </div>
        <div className="col-span-2">
          <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1.5 tracking-wider">Notes</label>
          <textarea value={form.notes} onChange={(e) => set("notes", e.target.value)} rows={2} placeholder="Any special instructions…" className={`${inputCls} resize-none`} />
        </div>
      </div>

      {/* Lines */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Order Lines ({form.lines.length})</p>
          <button onClick={addLine}
            className="flex items-center gap-1.5 text-[12px] font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-4 py-2 rounded-xl transition-colors">
            <Plus size={12} /> Add Line
          </button>
        </div>

        {form.lines.length === 0 ? (
          <div className="border-2 border-dashed border-slate-200 rounded-2xl py-12 text-center">
            <ShoppingCart size={28} className="mx-auto text-slate-300 mb-3" />
            <p className="text-[13px] text-slate-400">No lines yet. Add an order line to continue.</p>
            <button onClick={addLine} className="mt-3 flex items-center gap-1.5 mx-auto text-[12px] font-semibold text-blue-600 hover:text-blue-800">
              <Plus size={12} /> Add First Line
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {form.lines.map((line: any, i: number) => (
              <POLineRow key={line.id} line={line} index={i}
                onUpdate={updateLine} onRemove={removeLine}
                onOpenPicker={(id: string) => setPickerLineId(id)}
                onGoRegister={() => setShowItemReg(true)}
                isEditing />
            ))}
          </div>
        )}

        {subtotal > 0 && (
          <div className="mt-5 flex justify-end">
            <div className="bg-slate-800 text-white rounded-2xl px-6 py-4 text-right">
              <p className="text-[10px] text-slate-400 uppercase tracking-widest mb-1">Order Subtotal</p>
              <p className="text-[22px] font-extrabold">{fmtCurrency(subtotal)}</p>
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-3 pt-1">
        <button onClick={onCancel} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-[13px] font-semibold text-slate-600 hover:bg-slate-50">Cancel</button>
        <button onClick={() => onSubmit(form)} disabled={!valid}
          className={`flex-1 py-2.5 rounded-xl text-white text-[13px] font-semibold transition-colors ${valid ? "bg-blue-600 hover:bg-blue-700" : "bg-blue-300 cursor-not-allowed"}`}>
          {initial ? "Save Changes" : "Create PO"}
        </button>
      </div>

      <ItemPickerModal open={!!pickerLineId} onClose={() => setPickerLineId(null)}
        onPick={(item) => { if (pickerLineId) pickItem(pickerLineId, item); setPickerLineId(null); }}
        onGoRegister={() => { setPickerLineId(null); setShowItemReg(true); }}
        registeredItems={registeredItems} />

      <ItemRegistrationModal open={showItemReg} onClose={() => setShowItemReg(false)} onRegistered={handleNewItemRegistered} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PO PRINT REPORT
// ─────────────────────────────────────────────────────────────────────────────

function POPrintReport({ po, onClose }: { po: any; onClose: () => void }) {
  const { subtotal } = calcTotals(po.lines);
  const ss = PO_STATUS_STYLES[po.status] || PO_STATUS_STYLES["Draft"];

  const handlePrint = () => {
    const printContent = document.getElementById("po-print-content");
    if (!printContent) return;
    const win = window.open("", "_blank", "width=900,height=700");
    if (!win) return;
    win.document.write(`
      <html><head><title>${po.poNumber}</title>
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Segoe UI', Arial, sans-serif; color: #1e293b; background: white; padding: 40px; }
        .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 32px; padding-bottom: 20px; border-bottom: 2px solid #e2e8f0; }
        .company { font-size: 22px; font-weight: 900; color: #1e40af; letter-spacing: -0.5px; }
        .po-num { font-size: 13px; font-weight: 700; color: #64748b; font-family: monospace; margin-top: 4px; }
        .badge { display: inline-block; padding: 3px 10px; border-radius: 999px; font-size: 11px; font-weight: 700; border: 1px solid #cbd5e1; background: #f1f5f9; color: #475569; }
        .meta-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px; margin-bottom: 28px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; }
        .meta-item label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #94a3b8; display: block; margin-bottom: 3px; }
        .meta-item span { font-size: 13px; font-weight: 600; color: #1e293b; }
        h2 { font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #94a3b8; margin-bottom: 12px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
        th { background: #f1f5f9; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; padding: 10px 12px; text-align: left; border-bottom: 1px solid #e2e8f0; }
        td { padding: 11px 12px; font-size: 12px; color: #334155; border-bottom: 1px solid #f1f5f9; }
        tr:last-child td { border-bottom: none; }
        .item-name { font-weight: 700; color: #1e293b; }
        .item-id { font-family: monospace; font-size: 10px; color: #94a3b8; }
        .unreg { color: #d97706; font-size: 10px; font-weight: 600; }
        .total-row { display: flex; justify-content: flex-end; margin-top: 8px; }
        .total-box { background: #1e293b; color: white; border-radius: 12px; padding: 14px 24px; text-align: right; }
        .total-label { font-size: 10px; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px; }
        .total-amount { font-size: 22px; font-weight: 900; }
        .notes { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 14px; font-size: 12px; color: #475569; line-height: 1.6; }
        .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0; display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 32px; }
        .sig-label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #94a3b8; margin-bottom: 32px; }
        .sig-line { border-top: 1.5px solid #cbd5e1; padding-top: 6px; font-size: 11px; color: #64748b; }
        @media print { body { padding: 20px; } }
      </style></head>
      <body>
        <div class="header">
          <div>
            <div class="company">Venus Enterprises</div>
            <div class="po-num">${po.poNumber}</div>
            <div style="margin-top:8px"><span class="badge">${po.status}</span></div>
          </div>
          <div style="text-align:right">
            <div style="font-size:11px;color:#64748b;margin-bottom:4px">Purchase Order</div>
            <div style="font-size:11px;color:#94a3b8">Date: ${formatDate(po.createdDate)}</div>
            ${po.requiredDate ? `<div style="font-size:11px;color:#94a3b8">Required: ${formatDate(po.requiredDate)}</div>` : ""}
            ${po.deliveredDate ? `<div style="font-size:11px;color:#16a34a;font-weight:700">Delivered: ${formatDate(po.deliveredDate)}</div>` : ""}
          </div>
        </div>

        <div class="meta-grid">
          <div class="meta-item"><label>Supplier / Vendor</label><span>${po.supplier || "—"}</span></div>
          <div class="meta-item"><label>Delivery Site</label><span>${po.site || "—"}</span></div>
          <div class="meta-item"><label>Requested By</label><span>${po.requestedBy || "—"}</span></div>
          <div class="meta-item"><label>Approved By</label><span>${po.approvedBy || "—"}</span></div>
          <div class="meta-item"><label>Created Date</label><span>${formatDate(po.createdDate)}</span></div>
          <div class="meta-item"><label>Required By</label><span>${formatDate(po.requiredDate)}</span></div>
        </div>

        <h2>Order Lines</h2>
        <table>
          <thead>
            <tr>
              <th>#</th><th>Item</th><th>Type</th><th>Category</th>
              <th style="text-align:right">Qty Ordered</th>
              <th style="text-align:right">Qty Received</th>
              <th>Unit</th>
              <th style="text-align:right">Unit Price</th>
              <th style="text-align:right">Line Total</th>
            </tr>
          </thead>
          <tbody>
            ${po.lines.map((l: any, i: number) => `
              <tr>
                <td>${i + 1}</td>
                <td>
                  <div class="item-name">${l.itemName}</div>
                  ${l.isRegistered && l.itemId ? `<div class="item-id">${l.itemId}</div>` : `<div class="unreg">⚠ Unregistered</div>`}
                </td>
                <td>${l.type}</td>
                <td>${l.categoryCode}</td>
                <td style="text-align:right;font-weight:700">${l.qtyOrdered}</td>
                <td style="text-align:right;color:${l.qtyReceived >= l.qtyOrdered ? "#16a34a" : "#d97706"}">${l.qtyReceived}</td>
                <td>${l.unit || "—"}</td>
                <td style="text-align:right">${l.unitPrice ? `Rs. ${l.unitPrice.toLocaleString("en-LK")}` : "—"}</td>
                <td style="text-align:right;font-weight:700">${l.unitPrice && l.qtyOrdered ? `Rs. ${(l.unitPrice * l.qtyOrdered).toLocaleString("en-LK")}` : "—"}</td>
              </tr>`).join("")}
          </tbody>
        </table>

        ${subtotal > 0 ? `
        <div class="total-row">
          <div class="total-box">
            <div class="total-label">Order Total</div>
            <div class="total-amount">Rs. ${subtotal.toLocaleString("en-LK")}</div>
          </div>
        </div>` : ""}

        ${po.notes ? `
        <div style="margin-top:24px">
          <h2>Notes</h2>
          <div class="notes">${po.notes}</div>
        </div>` : ""}

        <div class="footer">
          <div>
            <div class="sig-label">Requested By</div>
            <div class="sig-line">${po.requestedBy || "_______________"}</div>
          </div>
          <div>
            <div class="sig-label">Approved By</div>
            <div class="sig-line">${po.approvedBy || "_______________"}</div>
          </div>
          <div>
            <div class="sig-label">Received By</div>
            <div class="sig-line">_______________</div>
          </div>
        </div>
      </body></html>`);
    win.document.close();
    setTimeout(() => win.print(), 400);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden" onClick={(e) => e.stopPropagation()}>
        {/* Modal header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-slate-800 flex items-center justify-center"><FileText size={15} className="text-white" /></div>
            <div>
              <h2 className="text-[14px] font-bold text-slate-800">{po.poNumber}</h2>
              <p className="text-[11px] text-slate-400">{po.supplier || "No supplier"} · {po.site || "No site"}</p>
            </div>
            <POStatusBadge status={po.status} />
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 text-white text-[12px] font-semibold hover:bg-slate-700 transition-colors">
              <Printer size={13} /> Print / Export
            </button>
            <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400"><X size={15} /></button>
          </div>
        </div>

        {/* Report body */}
        <div id="po-print-content" className="overflow-y-auto flex-1 p-6 space-y-6">
          {/* Company header */}
          <div className="flex items-start justify-between flex-wrap gap-4 pb-5 border-b border-slate-100">
            <div>
              <p className="text-[20px] font-extrabold text-blue-700 tracking-tight">Venus Enterprises</p>
              <p className="text-[12px] font-mono text-slate-400 mt-0.5">{po.poNumber}</p>
            </div>
            <div className="text-right text-[12px] text-slate-500">
              <p>Created: <span className="font-semibold text-slate-700">{formatDate(po.createdDate)}</span></p>
              {po.requiredDate && <p>Required: <span className="font-semibold text-slate-700">{formatDate(po.requiredDate)}</span></p>}
              {po.deliveredDate && <p className="text-emerald-600 font-semibold">Delivered: {formatDate(po.deliveredDate)}</p>}
            </div>
          </div>

          {/* Meta grid */}
          <div className="grid grid-cols-3 gap-4">
            {[
              ["Supplier / Vendor", po.supplier || "—"],
              ["Delivery Site", po.site || "—"],
              ["Requested By", po.requestedBy || "—"],
              ["Approved By", po.approvedBy || "—"],
              ["Status", po.status],
            ].map(([label, value]) => (
              <div key={label} className="bg-slate-50 border border-slate-100 rounded-xl p-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">{label}</p>
                <p className="text-[13px] font-semibold text-slate-700">
                  {label === "Status" ? <POStatusBadge status={value} /> : value}
                </p>
              </div>
            ))}
          </div>

          {/* Lines table */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3">Order Lines ({po.lines.length})</p>
            <div className="border border-slate-200 rounded-2xl overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    {["#", "Item", "Type", "Qty Ordered", "Qty Received", "Unit", "Unit Price", "Line Total"].map((h, i) => (
                      <th key={h} className={`px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 ${i > 2 ? "text-right" : "text-left"}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {po.lines.map((l: any, i: number) => (
                    <tr key={l.id} className="hover:bg-slate-50/50">
                      <td className="px-4 py-3 text-[11px] text-slate-400 font-bold">{i + 1}</td>
                      <td className="px-4 py-3">
                        <p className="text-[12px] font-bold text-slate-700">{l.itemName}</p>
                        {l.isRegistered && l.itemId
                          ? <p className="text-[10px] font-mono text-slate-400">{l.itemId}</p>
                          : <p className="text-[10px] text-amber-600 flex items-center gap-0.5 font-semibold"><AlertTriangle size={8} /> Unregistered</p>
                        }
                      </td>
                      <td className="px-4 py-3"><TypeBadge type={l.type} /></td>
                      <td className="px-4 py-3 text-right text-[13px] font-bold text-slate-700">{l.qtyOrdered}</td>
                      <td className={`px-4 py-3 text-right text-[12px] font-semibold ${l.qtyReceived >= l.qtyOrdered ? "text-emerald-600" : "text-orange-600"}`}>{l.qtyReceived}</td>
                      <td className="px-4 py-3 text-right text-[11px] text-slate-500">{l.unit || "—"}</td>
                      <td className="px-4 py-3 text-right text-[12px] text-slate-600">{l.unitPrice ? `Rs. ${l.unitPrice.toLocaleString()}` : "—"}</td>
                      <td className="px-4 py-3 text-right text-[13px] font-bold text-slate-800">
                        {l.unitPrice && l.qtyOrdered ? fmtCurrency(l.unitPrice * l.qtyOrdered) : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Total */}
          {subtotal > 0 && (
            <div className="flex justify-end">
              <div className="bg-slate-800 text-white rounded-2xl px-6 py-4 text-right">
                <p className="text-[10px] text-slate-400 uppercase tracking-widest mb-1">Order Total</p>
                <p className="text-[24px] font-extrabold">{fmtCurrency(subtotal)}</p>
              </div>
            </div>
          )}

          {/* Notes */}
          {po.notes && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Notes</p>
              <p className="text-[13px] text-slate-600 bg-slate-50 border border-slate-100 rounded-xl p-4 leading-relaxed">{po.notes}</p>
            </div>
          )}

          {/* Signatures */}
          <div className="grid grid-cols-3 gap-8 pt-6 border-t border-slate-100">
            {["Requested By", "Approved By", "Received By"].map((label) => (
              <div key={label}>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-8">{label}</p>
                <div className="border-t border-slate-300 pt-2">
                  <p className="text-[11px] text-slate-400">Signature & Date</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PO DETAIL DRAWER
// ─────────────────────────────────────────────────────────────────────────────

function PODrawer({ po, onClose, onEdit, onDelete, onReport }: {
  po: any; onClose: () => void; onEdit: () => void; onDelete: () => void; onReport: () => void;
}) {
  const ss = PO_STATUS_STYLES[po.status] || PO_STATUS_STYLES["Draft"];
  const { subtotal } = calcTotals(po.lines);
  const unregisteredLines = po.lines.filter((l: any) => !l.isRegistered);

  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white shadow-2xl h-full flex flex-col overflow-y-auto">
        <div className={`h-1.5 w-full ${ss.dot}`} />
        <div className="p-5 flex items-start gap-3 border-b border-slate-100">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-blue-600 text-white flex-shrink-0">
            <ClipboardList size={22} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-bold font-mono text-slate-400">{po.poNumber}</p>
            <p className="text-[15px] font-bold text-slate-800 leading-snug">{po.supplier || "No supplier set"}</p>
            <div className="flex flex-wrap items-center gap-2 mt-1.5">
              <POStatusBadge status={po.status} />
              {unregisteredLines.length > 0 && (
                <span className="text-[10px] font-semibold text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <AlertTriangle size={9} /> {unregisteredLines.length} unregistered
                </span>
              )}
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={16} /></button>
        </div>

        <div className="p-5 space-y-5 flex-1">
          <section>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">PO Details</p>
            <div className="space-y-2 text-[12px]">
              {([
                ["Delivery Site", po.site || "—"],
                ["Requested By", po.requestedBy || "—"],
                ["Approved By", po.approvedBy || "—"],
                ["Created", formatDate(po.createdDate)],
                ["Required By", formatDate(po.requiredDate)],
                po.deliveredDate ? ["Delivered", formatDate(po.deliveredDate)] : null,
              ] as any[]).filter(Boolean).map(([label, value]: any) => (
                <div key={label} className="flex justify-between items-start gap-3">
                  <span className="text-slate-400">{label}</span>
                  <span className="font-medium text-slate-700 text-right">{value}</span>
                </div>
              ))}
            </div>
          </section>

          <section>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Order Lines ({po.lines.length})</p>
            <div className="space-y-2">
              {po.lines.map((line: any) => (
                <div key={line.id} className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-[12px]">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <p className="font-bold text-slate-700">{line.itemName}</p>
                      {line.isRegistered && line.itemId && <p className="text-[10px] font-mono text-slate-400 mt-0.5">{line.itemId}</p>}
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <TypeBadge type={line.type} />
                      {!line.isRegistered && (
                        <span className="text-[9px] font-semibold text-amber-600 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-full flex items-center gap-1">
                          <AlertTriangle size={8} /> Unregistered
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-slate-500">
                    <span>{line.qtyOrdered} {line.unit}</span>
                    <div className="text-right">
                      <span className="text-slate-400 mr-1">Recv:</span>
                      <span className={`font-semibold ${line.qtyReceived >= line.qtyOrdered ? "text-emerald-600" : "text-orange-600"}`}>{line.qtyReceived}/{line.qtyOrdered}</span>
                      {line.unitPrice > 0 && <span className="ml-3 font-bold text-slate-700">{fmtCurrency(line.qtyOrdered * line.unitPrice)}</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {subtotal > 0 && (
            <div className="flex justify-between items-center bg-slate-800 text-white rounded-xl px-4 py-3">
              <span className="text-[11px] text-slate-400">Order Total</span>
              <span className="text-[16px] font-extrabold">{fmtCurrency(subtotal)}</span>
            </div>
          )}

          {po.notes && (
            <section>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Notes</p>
              <p className="text-[12px] text-slate-600 bg-slate-50 rounded-xl p-3 leading-relaxed">{po.notes}</p>
            </section>
          )}
        </div>

        <div className="p-4 border-t border-slate-100 flex gap-2">
          <button onClick={onDelete} className="p-2.5 rounded-xl border border-slate-200 text-slate-500 hover:bg-rose-50 hover:text-rose-500 hover:border-rose-200 transition-colors">
            <Trash2 size={14} />
          </button>
          <button onClick={onReport}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-[12px] font-semibold hover:bg-slate-50 transition-colors">
            <Printer size={13} /> Report
          </button>
          <button onClick={onEdit}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-slate-800 text-white text-[13px] font-semibold hover:bg-slate-700 transition-colors">
            <Pencil size={13} /> Edit PO
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MODAL SHELL + CONFIRM DELETE
// ─────────────────────────────────────────────────────────────────────────────

function Modal({ open, onClose, title, children, width = "max-w-3xl" }: any) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={onClose}>
      <div className={`bg-white rounded-2xl shadow-2xl w-full ${width} max-h-[90vh] overflow-hidden flex flex-col`} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 flex-shrink-0">
          <h2 className="text-[15px] font-bold text-slate-800">{title}</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400"><X size={16} /></button>
        </div>
        <div className="overflow-y-auto flex-1">{children}</div>
      </div>
    </div>
  );
}

function ConfirmDelete({ open, onClose, onConfirm, name }: any) {
  return (
    <Modal open={open} onClose={onClose} title="Confirm Delete" width="max-w-md">
      <div className="p-6">
        <div className="flex items-center gap-3 p-3 rounded-xl bg-rose-50 border border-rose-200 mb-5">
          <AlertCircle size={16} className="text-rose-500 flex-shrink-0" />
          <p className="text-[13px] text-rose-700">Delete <strong>{name}</strong>? This cannot be undone.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-[13px] font-semibold text-slate-600 hover:bg-slate-50">Cancel</button>
          <button onClick={onConfirm} className="flex-1 py-2.5 rounded-xl bg-rose-500 text-white text-[13px] font-semibold hover:bg-rose-600">Delete</button>
        </div>
      </div>
    </Modal>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────────────────────────────

export default function PurchaseOrderPage() {
  const [pos, setPos]               = useState(SEED_POS);
  const [registeredItems, setRegisteredItems] = useState(SEED_REGISTERED_ITEMS);
  const [search, setSearch]         = useState("");
  const [filterStatus, setFilter]   = useState("all");
  const [modal, setModal]           = useState<string | null>(null);
  const [target, setTarget]         = useState<any>(null);
  const [drawer, setDrawer]         = useState<any>(null);
  const [reportPO, setReportPO]     = useState<any>(null);

  const handleNewItemRegistered = (item: any) => {
    setRegisteredItems((prev) => [...prev, { ...item, itemId: item.itemId, name: item.name, type: item.type, categoryCode: item.categoryCode, unit: item.unit, status: item.status }]);
  };

  const filtered = pos.filter((po) => {
    const q = search.toLowerCase();
    const ms = po.poNumber.toLowerCase().includes(q) || (po.supplier || "").toLowerCase().includes(q) || (po.site || "").toLowerCase().includes(q);
    const mst = filterStatus === "all" || po.status === filterStatus;
    return ms && mst;
  });

  const create = (data: any) => { setPos((p) => [...p, { id: "po" + uid(), ...data }]); setModal(null); };
  const update = (data: any) => { setPos((p) => p.map((i) => i.id === target.id ? { ...i, ...data } : i)); setModal(null); setDrawer(null); };
  const remove = ()          => { setPos((p) => p.filter((i) => i.id !== target.id)); setModal(null); setDrawer(null); };

  const totalPOs      = pos.length;
  const draftCount    = pos.filter((p) => p.status === "Draft").length;
  const pendingCount  = pos.filter((p) => ["Pending Approval","Approved","Ordered"].includes(p.status)).length;
  const receivedCount = pos.filter((p) => p.status === "Received").length;
  const unregCount    = pos.reduce((s, po) => s + po.lines.filter((l: any) => !l.isRegistered).length, 0);

  const stats = [
    { label: "Total POs",        value: totalPOs,      color: "text-slate-700" },
    { label: "Drafts",           value: draftCount,    color: "text-slate-500" },
    { label: "Active / Ordered", value: pendingCount,  color: "text-blue-600"  },
    { label: "Received",         value: receivedCount, color: "text-emerald-600"},
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
              <ChevronRight size={10} className="text-slate-300" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Purchase Orders</span>
            </div>
            <h1 className="text-[22px] font-extrabold text-slate-800 tracking-tight">Purchase Orders</h1>
            <p className="text-[13px] text-slate-400 mt-0.5">Request · Approve · Track — linked to Item Registry</p>
          </div>
          <div className="flex items-center gap-2">
            {unregCount > 0 && (
              <span className="flex items-center gap-2 border border-amber-300 bg-amber-50 text-amber-700 px-4 py-2.5 rounded-xl text-[12px] font-semibold">
                <AlertTriangle size={13} /> {unregCount} Unregistered Item{unregCount > 1 ? "s" : ""}
              </span>
            )}
            <button onClick={() => { setTarget(null); setModal("create"); }}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-[13px] font-semibold transition-colors">
              <Plus size={14} /> New PO
            </button>
          </div>
        </div>

        {/* Stats */}
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
            <input value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search PO number, supplier, site…"
              className="w-full pl-9 pr-3 py-2 text-[12px] border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 bg-slate-50" />
          </div>
          <select value={filterStatus} onChange={(e) => setFilter(e.target.value)} className={selCls}>
            <option value="all">All Statuses</option>
            {PO_STATUSES.map((s) => <option key={s}>{s}</option>)}
          </select>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                {["Purchase Order", "Supplier", "Status", "Lines", "Required By", "Total", "Actions"].map((h, i) => (
                  <th key={h} className={[
                    "px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest",
                    i === 6 ? "text-right" : "text-left",
                    h === "Required By" || h === "Total" ? "hidden lg:table-cell" : "",
                  ].join(" ")}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-14 text-slate-400 text-[13px]">No purchase orders match</td></tr>
              ) : filtered.map((po) => {
                const { subtotal } = calcTotals(po.lines);
                const unreg = po.lines.filter((l: any) => !l.isRegistered).length;
                return (
                  <tr key={po.id} className="transition-colors cursor-pointer hover:bg-blue-50/30" onClick={() => setDrawer(po)}>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-blue-600 text-white flex-shrink-0">
                          <ClipboardList size={14} />
                        </div>
                        <div>
                          <p className="text-[12px] font-bold text-slate-700 font-mono">{po.poNumber}</p>
                          <p className="text-[10px] text-slate-400">{po.site || "No site"}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1.5">
                        <Truck size={11} className="text-slate-400" />
                        <span className="text-[12px] text-slate-600">{po.supplier || <span className="text-slate-300 italic">No supplier</span>}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex flex-col gap-1">
                        <POStatusBadge status={po.status} />
                        {unreg > 0 && (
                          <span className="text-[9px] font-semibold text-amber-600 flex items-center gap-1">
                            <AlertTriangle size={8} /> {unreg} unregistered
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="text-[13px] font-bold text-slate-700">{po.lines.length}</span>
                      <span className="text-[11px] text-slate-400 ml-1">line{po.lines.length !== 1 ? "s" : ""}</span>
                    </td>
                    <td className="px-4 py-3.5 hidden lg:table-cell">
                      <span className="text-[11px] text-slate-500">{formatDate(po.requiredDate)}</span>
                    </td>
                    <td className="px-4 py-3.5 hidden lg:table-cell">
                      <span className="text-[12px] font-bold text-slate-700">{subtotal > 0 ? fmtCurrency(subtotal) : "—"}</span>
                    </td>
                    <td className="px-4 py-3.5" onClick={(e) => e.stopPropagation()}>
                      <div className="flex justify-end gap-1">
                        <button onClick={() => setReportPO(po)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors" title="Print Report"><Printer size={13} /></button>
                        <button onClick={() => setDrawer(po)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors" title="View"><Eye size={13} /></button>
                        <button onClick={() => { setTarget(po); setModal("edit"); }} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors" title="Edit"><Pencil size={13} /></button>
                        <button onClick={() => { setTarget(po); setModal("delete"); }} className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-500 transition-colors" title="Delete"><Trash2 size={13} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Drawer */}
      {drawer && (
        <PODrawer po={drawer} onClose={() => setDrawer(null)}
          onEdit={() => { setTarget(drawer); setDrawer(null); setModal("edit"); }}
          onDelete={() => { setTarget(drawer); setDrawer(null); setModal("delete"); }}
          onReport={() => { setReportPO(drawer); setDrawer(null); }} />
      )}

      {/* Print Report Modal */}
      {reportPO && <POPrintReport po={reportPO} onClose={() => setReportPO(null)} />}

      {/* Create / Edit Modals — wider max-w-3xl */}
      <Modal open={modal === "create"} onClose={() => setModal(null)} title="New Purchase Order" width="max-w-3xl">
        <POForm onSubmit={create} onCancel={() => setModal(null)}
          onGoRegister={() => {}}
          registeredItems={registeredItems}
          onNewItemRegistered={handleNewItemRegistered} />
      </Modal>
      <Modal open={modal === "edit"} onClose={() => setModal(null)} title="Edit Purchase Order" width="max-w-3xl">
        {target && <POForm initial={target} onSubmit={update} onCancel={() => setModal(null)}
          onGoRegister={() => {}}
          registeredItems={registeredItems}
          onNewItemRegistered={handleNewItemRegistered} />}
      </Modal>

      <ConfirmDelete open={modal === "delete"} onClose={() => setModal(null)} onConfirm={remove} name={target?.poNumber} />
    </div>
  );
}