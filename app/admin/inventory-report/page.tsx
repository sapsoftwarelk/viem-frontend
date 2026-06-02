"use client";

import { useState, useEffect } from "react";
import {
  Plus, Search, Eye, Pencil, Trash2, X, AlertCircle,
  Package, ChevronDown, Hash, Calendar, Download, Filter,
  CheckCircle, Clock, Archive, Boxes, ShoppingCart,
  Wrench, RefreshCw, FileText, Send, Printer,
  ChevronRight, ArrowLeft, AlertTriangle, ExternalLink,
  Layers, Tag, Building2, Truck, CreditCard, MoreVertical,
  Copy, Ban, RotateCcw, ClipboardList, SquarePen, QrCode,
  ClipboardCheck, PackageCheck, Link2, Unlink, ArrowDownToLine,
  User, MapPin, Users, Phone, Mail, Warehouse, PlusCircle,
  MinusCircle, MoveRight, Grid3x3, List, BarChart3, Home,
  Settings, DollarSign, Weight, Ruler, Thermometer, Shield
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

const ALL_CATEGORIES = [...TOOL_CATEGORIES, ...REUSABLE_CATEGORIES, ...CONSUMABLE_CATEGORIES];

const TYPE_STYLES: Record<string, { bg: string; text: string; border: string; icon: any; accent: string }> = {
  Tool:       { bg: "bg-violet-50", text: "text-violet-700", border: "border-violet-200", icon: Wrench,    accent: "#7c3aed" },
  Reusable:   { bg: "bg-teal-50",   text: "text-teal-700",   border: "border-teal-200",   icon: RefreshCw, accent: "#0f766e" },
  Consumable: { bg: "bg-orange-50", text: "text-orange-700", border: "border-orange-200", icon: Boxes,     accent: "#c2410c" },
};

const STOCK_STATUS = {
  CRITICAL: { label: "Critical", color: "text-rose-600", bg: "bg-rose-50", border: "border-rose-200", threshold: 5 },
  LOW:      { label: "Low",      color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-200", threshold: 20 },
  NORMAL:   { label: "Normal",   color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-200", threshold: Infinity },
};

// ─────────────────────────────────────────────────────────────────────────────
// SEED DATA — INVENTORY ITEMS
// ─────────────────────────────────────────────────────────────────────────────

const SEED_INVENTORY = [
  {
    id: "inv1",
    itemId: "TOOL-CUT-0001",
    name: "Angle Grinder 230mm",
    type: "Tool",
    categoryCode: "CUT",
    quantity: 8,
    unit: "pcs",
    unitPrice: 85,
    minStock: 3,
    maxStock: 15,
    location: "A-12",
    status: "Active",
    supplierId: "sup3",
    supplierName: "Hardware Lanka (Pvt) Ltd",
    lastReceived: "2026-05-10",
    notes: "Heavy duty, 2200W",
    attributes: { maxHours: "2000", serialNo: "AG230-001", bladeType: "230mm" },
  },
  {
    id: "inv2",
    itemId: "TOOL-DRL-0001",
    name: "Rotary Hammer Drill",
    type: "Tool",
    categoryCode: "DRL",
    quantity: 4,
    unit: "pcs",
    unitPrice: 120,
    minStock: 2,
    maxStock: 10,
    location: "B-05",
    status: "Active",
    supplierId: "sup3",
    supplierName: "Hardware Lanka (Pvt) Ltd",
    lastReceived: "2026-04-22",
    notes: "SDS Plus, 800W",
    attributes: { maxHours: "1500", chuckSize: "13mm", serialNo: "RHD-882" },
  },
  {
    id: "inv3",
    itemId: "REUS-SCF-0001",
    name: "Scaffolding Frame 1.8m",
    type: "Reusable",
    categoryCode: "SCF",
    quantity: 45,
    unit: "frames",
    unitPrice: 15,
    minStock: 20,
    maxStock: 100,
    location: "C-01",
    status: "Active",
    supplierId: "sup1",
    supplierName: "Ceylon Construction Materials",
    lastReceived: "2026-04-15",
    notes: "Galvanized, standard duty",
    attributes: {},
  },
  {
    id: "inv4",
    itemId: "REUS-PROP-0001",
    name: "Acrow Prop 3m",
    type: "Reusable",
    categoryCode: "PROP",
    quantity: 120,
    unit: "props",
    unitPrice: 25,
    minStock: 50,
    maxStock: 250,
    location: "C-07",
    status: "Active",
    supplierId: "sup1",
    supplierName: "Ceylon Construction Materials",
    lastReceived: "2026-05-01",
    notes: "Adjustable, 3m extended",
    attributes: {},
  },
  {
    id: "inv5",
    itemId: "CONS-CEM-0001",
    name: "OPC Cement 50kg",
    type: "Consumable",
    categoryCode: "CEM",
    quantity: 250,
    unit: "Bags",
    unitPrice: 12,
    minStock: 100,
    maxStock: 1000,
    location: "D-03",
    status: "Active",
    supplierId: "sup1",
    supplierName: "Ceylon Construction Materials",
    lastReceived: "2026-05-18",
    notes: "Grade 42.5N",
    attributes: {},
  },
  {
    id: "inv6",
    itemId: "CONS-RBR-0001",
    name: "T12 Rebar",
    type: "Consumable",
    categoryCode: "RBR",
    quantity: 3200,
    unit: "kg",
    unitPrice: 0.85,
    minStock: 1000,
    maxStock: 5000,
    location: "E-02",
    status: "Active",
    supplierId: "sup2",
    supplierName: "SteelMart International",
    lastReceived: "2026-05-10",
    notes: "Grade 60, 12mm dia",
    attributes: {},
  },
  {
    id: "inv7",
    itemId: "CONS-CONC-0001",
    name: "Ready-mix Concrete Grade 30",
    type: "Consumable",
    categoryCode: "CONC",
    quantity: 0,
    unit: "Cubic metres",
    unitPrice: 95,
    minStock: 5,
    maxStock: 30,
    location: "E-09",
    status: "Inactive",
    supplierId: "sup1",
    supplierName: "Ceylon Construction Materials",
    lastReceived: "2026-04-10",
    notes: "For structural slabs",
    attributes: {},
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// SEED SUPPLIERS (from previous page)
// ─────────────────────────────────────────────────────────────────────────────

const SEED_SUPPLIERS = [
  { id: "sup1", code: "SUP-001", name: "Ceylon Construction Materials", status: "Active" },
  { id: "sup2", code: "SUP-002", name: "SteelMart International", status: "Active" },
  { id: "sup3", code: "SUP-003", name: "Hardware Lanka (Pvt) Ltd", status: "Active" },
  { id: "sup4", code: "SUP-004", name: "Global Tools & Equipment", status: "Inactive" },
];

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function uid() { return Math.random().toString(36).slice(2, 9); }
function todayStr() { return new Date().toISOString().slice(0, 10); }
function formatDate(d: string) { return d ? new Date(d).toLocaleDateString("en-GB") : "—"; }
function fmtNumber(n: number) { return n?.toLocaleString() || "0"; }

function generateItemId(type: string, categoryCode: string, existingItems: any[]) {
  const prefix = `${type.toUpperCase().slice(0, 4)}-${categoryCode}-`;
  const similar = existingItems.filter(i => i.itemId?.startsWith(prefix));
  const nextNum = similar.length + 1;
  return `${prefix}${String(nextNum).padStart(4, "0")}`;
}

function getStockStatus(quantity: number, minStock: number) {
  if (quantity <= (minStock || 0)) return STOCK_STATUS.CRITICAL;
  if (quantity <= (minStock || 0) * 2) return STOCK_STATUS.LOW;
  return STOCK_STATUS.NORMAL;
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

function StockStatusBadge({ quantity, minStock }: { quantity: number; minStock: number }) {
  const status = getStockStatus(quantity, minStock);
  return (
    <span className={`inline-flex items-center gap-1.5 text-[10px] px-2 py-0.5 rounded-full font-semibold border ${status.bg} ${status.color} ${status.border}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${status.color.replace("text", "bg")}`} />
      {status.label} ({quantity})
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// INVENTORY FORM MODAL (CRUD) — Only used for editing now
// ─────────────────────────────────────────────────────────────────────────────

function InventoryFormModal({ open, onClose, onSubmit, initial, suppliers, existingItems }: any) {
  const defaultItem = {
    id: "",
    itemId: "",
    name: "",
    type: "Consumable",
    categoryCode: "",
    quantity: 0,
    unit: "",
    minStock: 0,
    maxStock: 0,
    location: "",
    status: "Active",
    supplierId: "",
    supplierName: "",
    lastReceived: todayStr(),
    notes: "",
    attributes: {},
  };

  const [form, setForm] = useState(() => ({ ...defaultItem, ...initial }));

  useEffect(() => {
    if (open) {
      setForm({ ...defaultItem, ...initial });
    }
  }, [open, initial]);

  const handleChange = (key: string, value: any) => {
    setForm((f: any) => ({ ...f, [key]: value }));
    // Auto-populate supplier name when supplier changes
    if (key === "supplierId") {
      const sup = suppliers.find((s: any) => s.id === value);
      if (sup) setForm((f: any) => ({ ...f, supplierName: sup.name }));
    }
    // Auto-set unit based on category when type/category changes
    if (key === "categoryCode" && form.type) {
      const category = ALL_CATEGORIES.find(c => c.code === value);
      if (category && (category as any).unit) {
        setForm((f: any) => ({ ...f, unit: (category as any).unit }));
      }
    }
  };

  const handleSubmit = () => {
    if (!form.name || !form.type || !form.categoryCode) return;
    const newItem = {
      ...form,
      itemId: form.itemId || generateItemId(form.type, form.categoryCode, existingItems),
      lastReceived: form.lastReceived || todayStr(),
    };
    onSubmit(newItem);
  };

  const isValid = form.name && form.type && form.categoryCode && (form.supplierId || !form.supplierId);
  const inputCls = "w-full border border-slate-200 rounded-xl px-4 py-2.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-emerald-400 bg-white";
  const selectCls = "w-full border border-slate-200 rounded-xl px-4 py-2.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-emerald-400 bg-white";

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h2 className="text-[14px] font-bold text-slate-800">{initial ? "Edit Inventory Item" : "New Inventory Item"}</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400"><X size={15} /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">Item ID</label>
              <input value={form.itemId} onChange={(e) => handleChange("itemId", e.target.value)} className={inputCls} placeholder="Auto-generated" />
            </div>
            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">Status</label>
              <select value={form.status} onChange={(e) => handleChange("status", e.target.value)} className={selectCls}>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">Item Name *</label>
            <input value={form.name} onChange={(e) => handleChange("name", e.target.value)} className={inputCls} placeholder="e.g., Angle Grinder" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">Type *</label>
              <select value={form.type} onChange={(e) => { handleChange("type", e.target.value); handleChange("categoryCode", ""); }} className={selectCls}>
                {ITEM_TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">Category *</label>
              <select value={form.categoryCode} onChange={(e) => handleChange("categoryCode", e.target.value)} className={selectCls}>
                <option value="">— Select —</option>
                {(form.type === "Tool" ? TOOL_CATEGORIES : form.type === "Reusable" ? REUSABLE_CATEGORIES : CONSUMABLE_CATEGORIES).map(c => (
                  <option key={c.code} value={c.code}>{c.code} — {c.label}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">Supplier</label>
              <select value={form.supplierId} onChange={(e) => handleChange("supplierId", e.target.value)} className={selectCls}>
                <option value="">— Not assigned —</option>
                {suppliers.filter((s: any) => s.status === "Active").map((sup: any) => (
                  <option key={sup.id} value={sup.id}>{sup.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">Location / Bin</label>
              <input value={form.location} onChange={(e) => handleChange("location", e.target.value)} className={inputCls} placeholder="A-12, Shelf 3" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">Quantity</label>
              <input type="number" min="0" value={form.quantity} onChange={(e) => handleChange("quantity", Number(e.target.value))} className={inputCls} />
            </div>
            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">Unit</label>
              <input value={form.unit} onChange={(e) => handleChange("unit", e.target.value)} className={inputCls} placeholder="pcs, kg, m" />
            </div>
            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">Min Stock</label>
              <input type="number" min="0" value={form.minStock} onChange={(e) => handleChange("minStock", Number(e.target.value))} className={inputCls} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">Max Stock</label>
              <input type="number" min="0" value={form.maxStock} onChange={(e) => handleChange("maxStock", Number(e.target.value))} className={inputCls} />
            </div>
            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">Last Received</label>
              <input type="date" value={form.lastReceived} onChange={(e) => handleChange("lastReceived", e.target.value)} className={inputCls} />
            </div>
          </div>
          <div>
            <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">Notes</label>
            <textarea value={form.notes} onChange={(e) => handleChange("notes", e.target.value)} rows={2} className={`${inputCls} resize-none`} />
          </div>
        </div>
        <div className="p-5 border-t border-slate-100 flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-[13px] font-semibold text-slate-600 hover:bg-slate-50">Cancel</button>
          <button onClick={handleSubmit} disabled={!isValid}
            className={`flex-1 py-2.5 rounded-xl text-white text-[13px] font-semibold transition-colors ${isValid ? "bg-emerald-600 hover:bg-emerald-700" : "bg-emerald-300 cursor-not-allowed"}`}>
            {initial ? "Save Changes" : "Create Item"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// STOCK ADJUSTMENT MODAL (In/Out)
// ─────────────────────────────────────────────────────────────────────────────

function StockAdjustModal({ open, onClose, onSubmit, item }: any) {
  const [adjustment, setAdjustment] = useState({ type: "in", quantity: 1, reason: "" });
  if (!open || !item) return null;

  const handleSubmit = () => {
    if (adjustment.quantity <= 0) return;
    onSubmit(adjustment.type, adjustment.quantity, adjustment.reason);
  };

  const inputCls = "w-full border border-slate-200 rounded-xl px-4 py-2.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-emerald-400 bg-white";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h2 className="text-[14px] font-bold text-slate-800">Adjust Stock: {item.name}</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400"><X size={15} /></button>
        </div>
        <div className="p-5 space-y-4">
          <div className="flex gap-3">
            <button onClick={() => setAdjustment({ ...adjustment, type: "in" })} className={`flex-1 py-2 rounded-xl border text-[13px] font-semibold flex items-center justify-center gap-2 ${adjustment.type === "in" ? "bg-emerald-50 border-emerald-300 text-emerald-700" : "bg-white border-slate-200 text-slate-500"}`}>
              <PlusCircle size={14} /> Stock In
            </button>
            <button onClick={() => setAdjustment({ ...adjustment, type: "out" })} className={`flex-1 py-2 rounded-xl border text-[13px] font-semibold flex items-center justify-center gap-2 ${adjustment.type === "out" ? "bg-rose-50 border-rose-300 text-rose-700" : "bg-white border-slate-200 text-slate-500"}`}>
              <MinusCircle size={14} /> Stock Out
            </button>
          </div>
          <div>
            <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">Quantity</label>
            <input type="number" min="1" value={adjustment.quantity} onChange={(e) => setAdjustment({ ...adjustment, quantity: Number(e.target.value) })} className={inputCls} />
          </div>
          <div>
            <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">Reason / Reference</label>
            <input value={adjustment.reason} onChange={(e) => setAdjustment({ ...adjustment, reason: e.target.value })} placeholder="e.g., GRN-001, Site issue" className={inputCls} />
          </div>
          <div className="bg-slate-50 rounded-xl p-3 text-center">
            <p className="text-[11px] text-slate-500">Current Stock: <span className="font-bold text-slate-800">{fmtNumber(item.quantity)} {item.unit}</span></p>
            <p className="text-[11px] text-slate-500 mt-1">After adjustment: <span className="font-bold text-emerald-600">{fmtNumber(adjustment.type === "in" ? item.quantity + adjustment.quantity : item.quantity - adjustment.quantity)} {item.unit}</span></p>
          </div>
        </div>
        <div className="p-5 border-t border-slate-100 flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-[13px] font-semibold text-slate-600">Cancel</button>
          <button onClick={handleSubmit} className="flex-1 py-2.5 rounded-xl bg-emerald-600 text-white text-[13px] font-semibold hover:bg-emerald-700">Apply Adjustment</button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// DETAIL DRAWER
// ─────────────────────────────────────────────────────────────────────────────

function InventoryDrawer({ item, onClose, onEdit, onDelete, onAdjustStock }: any) {
  const status = getStockStatus(item.quantity, item.minStock);
  const category = ALL_CATEGORIES.find(c => c.code === item.categoryCode);

  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white shadow-2xl h-full flex flex-col overflow-y-auto">
        <div className={`h-1.5 w-full ${status.bg}`} />
        <div className="p-5 flex items-start gap-3 border-b border-slate-100">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-emerald-600 text-white flex-shrink-0">
            <Package size={22} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-bold font-mono text-slate-400">{item.itemId}</p>
            <p className="text-[15px] font-bold text-slate-800 leading-snug">{item.name}</p>
            <div className="mt-1.5"><TypeBadge type={item.type} /></div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={16} /></button>
        </div>

        <div className="p-5 space-y-5 flex-1">
          <section>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Stock Information</p>
            <div className="space-y-2 text-[12px]">
              {[
                ["Current Stock", `${fmtNumber(item.quantity)} ${item.unit}`, status.label],
                ["Min Stock Level", fmtNumber(item.minStock)],
                ["Max Stock Level", fmtNumber(item.maxStock)],
                ["Location", item.location || "—"],
              ].map(([label, value, sub]) => (
                <div key={label} className="flex justify-between items-start gap-3">
                  <span className="text-slate-400">{label}</span>
                  <div className="text-right">
                    <span className="font-medium text-slate-700">{value}</span>
                    {sub && <span className={`ml-2 text-[10px] ${status.color}`}>{sub}</span>}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Item Details</p>
            <div className="space-y-2 text-[12px]">
              {[
                ["Category", category ? `${category.code} — ${category.label}` : item.categoryCode || "—"],
                ["Supplier", item.supplierName || "—"],
                ["Last Received", formatDate(item.lastReceived)],
                ["Status", item.status],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between">
                  <span className="text-slate-400">{label}</span>
                  <span className="font-medium text-slate-700">{value}</span>
                </div>
              ))}
            </div>
          </section>

          {item.notes && (
            <section>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Notes</p>
              <p className="text-[12px] text-slate-600 bg-slate-50 p-2 rounded-lg">{item.notes}</p>
            </section>
          )}
        </div>

        <div className="p-4 border-t border-slate-100 flex gap-2">
          <button onClick={onDelete} className="p-2.5 rounded-xl border border-slate-200 text-slate-500 hover:bg-rose-50 hover:text-rose-500">
            <Trash2 size={14} />
          </button>
          <button onClick={onAdjustStock} className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-[12px] font-semibold hover:bg-slate-50">
            <MoveRight size={13} /> Adjust Stock
          </button>
          <button onClick={onEdit} className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-600 text-white text-[13px] font-semibold hover:bg-emerald-700">
            <Pencil size={13} /> Edit Item
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CONFIRM DELETE MODAL
// ─────────────────────────────────────────────────────────────────────────────

function ConfirmDeleteModal({ open, onClose, onConfirm, name }: any) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
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
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────────────────────────────

export default function WarehouseInventoryPage() {
  const [items, setItems] = useState(SEED_INVENTORY);
  const [suppliers] = useState(SEED_SUPPLIERS);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterStockStatus, setFilterStockStatus] = useState("all");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [drawerItem, setDrawerItem] = useState<any>(null);
  const [adjustItem, setAdjustItem] = useState<any>(null);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);

  // Stats
  const totalItems = items.length;
  const totalValue = items.reduce((sum, i) => sum + (i.quantity * (i.unitPrice || 0)), 0);
  const criticalItems = items.filter(i => getStockStatus(i.quantity, i.minStock).label === "Critical").length;
  const lowItems = items.filter(i => getStockStatus(i.quantity, i.minStock).label === "Low").length;
  const activeItems = items.filter(i => i.status === "Active").length;

  // Filtered items
  const filteredItems = items.filter((item) => {
    const q = search.toLowerCase();
    const matchesSearch = item.name.toLowerCase().includes(q) || item.itemId.toLowerCase().includes(q) || (item.supplierName || "").toLowerCase().includes(q);
    const matchesType = filterType === "all" || item.type === filterType;
    const matchesStatus = filterStatus === "all" || item.status === filterStatus;
    const stockStatus = getStockStatus(item.quantity, item.minStock).label;
    const matchesStock = filterStockStatus === "all" || stockStatus === filterStockStatus;
    return matchesSearch && matchesType && matchesStatus && matchesStock;
  });

  // CRUD (no creation)
  const updateItem = (data: any) => {
    setItems(prev => prev.map(i => i.id === editingItem.id ? { ...data, id: i.id } : i));
    setModalOpen(false);
    setEditingItem(null);
    setDrawerItem(null);
  };
  const deleteItem = () => {
    if (deleteTarget) {
      setItems(prev => prev.filter(i => i.id !== deleteTarget.id));
      setDeleteTarget(null);
      setDrawerItem(null);
    }
  };
  const adjustStock = (type: string, quantity: number, reason: string) => {
    if (adjustItem) {
      const newQty = type === "in" ? adjustItem.quantity + quantity : adjustItem.quantity - quantity;
      setItems(prev => prev.map(i => i.id === adjustItem.id ? { ...i, quantity: Math.max(0, newQty), lastReceived: type === "in" ? todayStr() : i.lastReceived } : i));
      setAdjustItem(null);
      setDrawerItem(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#f7f8fb] p-5 font-sans">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-start justify-between flex-wrap gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Venus Enterprises</span>
              <ChevronRight size={10} className="text-slate-300" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-600">Warehouse</span>
            </div>
            <h1 className="text-[22px] font-extrabold text-slate-800 tracking-tight">Inventory Management</h1>
            <p className="text-[13px] text-slate-400 mt-0.5">Manage stock items, track quantities, and adjust inventory levels.</p>
          </div>
          {/* "New Item" button removed as requested */}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-5">
          <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
            <p className="text-[24px] font-extrabold text-slate-800">{totalItems}</p>
            <p className="text-[11px] text-slate-400 font-medium">Total Items</p>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
            <p className="text-[24px] font-extrabold text-emerald-600">{activeItems}</p>
            <p className="text-[11px] text-slate-400 font-medium">Active Items</p>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
            <p className="text-[24px] font-extrabold text-rose-600">{criticalItems}</p>
            <p className="text-[11px] text-slate-400 font-medium">Critical Stock</p>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
            <p className="text-[24px] font-extrabold text-amber-600">{lowItems}</p>
            <p className="text-[11px] text-slate-400 font-medium">Low Stock</p>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
            <p className="text-[24px] font-extrabold text-slate-800">{fmtCurrency(totalValue)}</p>
            <p className="text-[11px] text-slate-400 font-medium">Total Value</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm px-4 py-3 flex flex-wrap gap-3 items-center mb-4">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, ID, or supplier..."
              className="w-full pl-9 pr-3 py-2 text-[12px] border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400 bg-slate-50" />
          </div>
          <select value={filterType} onChange={(e) => setFilterType(e.target.value)}
            className="text-[12px] border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 text-slate-600">
            <option value="all">All Types</option>
            {ITEM_TYPES.map(t => <option key={t}>{t}</option>)}
          </select>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
            className="text-[12px] border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 text-slate-600">
            <option value="all">All Status</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
          <select value={filterStockStatus} onChange={(e) => setFilterStockStatus(e.target.value)}
            className="text-[12px] border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 text-slate-600">
            <option value="all">All Stock Levels</option>
            <option value="Critical">Critical</option>
            <option value="Low">Low</option>
            <option value="Normal">Normal</option>
          </select>
        </div>

        {/* Inventory Table */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-x-auto">
          <table className="w-full min-w-[800px]">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">Item ID</th>
                <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">Name</th>
                <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">Type</th>
                <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">Category</th>
                <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">Stock</th>
                <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">Location</th>
                <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</th>
                <th className="px-4 py-3 text-right text-[10px] font-bold text-slate-400 uppercase tracking-widest">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredItems.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-14 text-slate-400 text-[13px]">No inventory items found</td></tr>
              ) : filteredItems.map((item) => (
                <tr key={item.id} className="transition-colors cursor-pointer hover:bg-emerald-50/30" onClick={() => setDrawerItem(item)}>
                  <td className="px-4 py-3.5">
                    <span className="text-[11px] font-mono font-bold text-slate-600">{item.itemId}</span>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${TYPE_STYLES[item.type]?.bg || "bg-slate-100"}`}>
                        {(() => { const Icon = TYPE_STYLES[item.type]?.icon || Package; return <Icon size={12} className={TYPE_STYLES[item.type]?.text || "text-slate-500"} />; })()}
                      </div>
                      <span className="text-[13px] font-semibold text-slate-700">{item.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3.5"><TypeBadge type={item.type} /></td>
                  <td className="px-4 py-3.5"><span className="text-[11px] text-slate-500 font-mono">{item.categoryCode}</span></td>
                  <td className="px-4 py-3.5"><StockStatusBadge quantity={item.quantity} minStock={item.minStock} /></td>
                  <td className="px-4 py-3.5"><span className="text-[11px] text-slate-500">{item.location || "—"}</span></td>
                  <td className="px-4 py-3.5">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${item.status === "Active" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-slate-100 text-slate-500 border border-slate-200"}`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="px-4 py-3.5" onClick={(e) => e.stopPropagation()}>
                    <div className="flex justify-end gap-1">
                      <button onClick={() => setAdjustItem(item)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-emerald-600" title="Adjust Stock"><MoveRight size={13} /></button>
                      <button onClick={() => { setEditingItem(item); setModalOpen(true); }} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700" title="Edit"><Pencil size={13} /></button>
                      <button onClick={() => setDeleteTarget(item)} className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-500" title="Delete"><Trash2 size={13} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      <InventoryFormModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditingItem(null); }}
        onSubmit={updateItem}
        initial={editingItem}
        suppliers={suppliers}
        existingItems={items}
      />

      <StockAdjustModal
        open={!!adjustItem}
        onClose={() => setAdjustItem(null)}
        onSubmit={adjustStock}
        item={adjustItem}
      />

      {drawerItem && (
        <InventoryDrawer
          item={drawerItem}
          onClose={() => setDrawerItem(null)}
          onEdit={() => { setEditingItem(drawerItem); setDrawerItem(null); setModalOpen(true); }}
          onDelete={() => { setDeleteTarget(drawerItem); setDrawerItem(null); }}
          onAdjustStock={() => { setAdjustItem(drawerItem); setDrawerItem(null); }}
        />
      )}

      <ConfirmDeleteModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={deleteItem}
        name={deleteTarget?.name}
      />
    </div>
  );
}

// Helper for currency formatting
function fmtCurrency(n: number) {
  return n ? `Rs. ${n.toLocaleString("en-LK")}` : "Rs. 0";
}