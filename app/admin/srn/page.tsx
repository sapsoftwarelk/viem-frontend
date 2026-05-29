"use client";

import { useState, useRef, useEffect } from "react";
import {
  Plus, Search, Eye, Pencil, Trash2, X, AlertCircle,
  Package, ChevronDown, Hash, Calendar, Download, Filter,
  CheckCircle, Clock, Archive, Boxes, ShoppingCart,
  Wrench, RefreshCw, FileText, Send, Printer,
  ChevronRight, ArrowLeft, AlertTriangle, ExternalLink,
  Layers, Tag, Building2, Truck, CreditCard, MoreVertical,
  Copy, Ban, RotateCcw, ClipboardList, SquarePen, QrCode,
  ClipboardCheck, PackageCheck, Link2, Unlink, ArrowDownToLine,
  User, MapPin, Users, Phone, Mail, Building, Globe, BadgeIndianRupee,
  ListFilter, Undo2, Warehouse, Receipt, CalendarClock
} from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

const SRN_STATUSES = ["Draft", "Submitted", "Approved", "Returned", "Cancelled"];
const SRN_STATUS_STYLES: Record<string, { bg: string; text: string; border: string; dot: string }> = {
  "Draft":      { bg: "bg-slate-100",   text: "text-slate-500",   border: "border-slate-200",  dot: "bg-slate-400"   },
  "Submitted":  { bg: "bg-amber-50",    text: "text-amber-700",   border: "border-amber-200",  dot: "bg-amber-500"   },
  "Approved":   { bg: "bg-emerald-50",  text: "text-emerald-700", border: "border-emerald-200",dot: "bg-emerald-500" },
  "Returned":   { bg: "bg-blue-50",     text: "text-blue-700",    border: "border-blue-200",   dot: "bg-blue-500"    },
  "Cancelled":  { bg: "bg-rose-50",     text: "text-rose-600",    border: "border-rose-200",   dot: "bg-rose-400"    },
};

const SUPPLIER_STATUSES = ["Active", "Inactive"];
const DEFAULT_SUPPLIER = {
  id: "",
  code: "",
  name: "",
  contactPerson: "",
  email: "",
  phone: "",
  address: "",
  taxId: "",
  status: "Active" as const,
  createdDate: "",
};

// ─────────────────────────────────────────────────────────────────────────────
// SEED DATA — SUPPLIERS
// ─────────────────────────────────────────────────────────────────────────────

const SEED_SUPPLIERS = [
  {
    id: "sup1",
    code: "SUP-001",
    name: "Ceylon Construction Materials",
    contactPerson: "Mahinda Rajapaksha",
    email: "orders@ceylonconstruct.lk",
    phone: "+94 11 234 5678",
    address: "123, Industrial Zone, Colombo 15",
    taxId: "1234567890",
    status: "Active",
    createdDate: "2024-01-10",
  },
  {
    id: "sup2",
    code: "SUP-002",
    name: "SteelMart International",
    contactPerson: "Nuwan Perera",
    email: "sales@steelmart.com",
    phone: "+94 77 123 4567",
    address: "45, Negombo Road, Katunayake",
    taxId: "2345678901",
    status: "Active",
    createdDate: "2024-02-15",
  },
  {
    id: "sup3",
    code: "SUP-003",
    name: "Hardware Lanka (Pvt) Ltd",
    contactPerson: "Dilani Fernando",
    email: "info@hardwarelanka.lk",
    phone: "+94 11 345 6789",
    address: "78, Main Street, Kandy",
    taxId: "3456789012",
    status: "Active",
    createdDate: "2024-03-20",
  },
  {
    id: "sup4",
    code: "SUP-004",
    name: "Global Tools & Equipment",
    contactPerson: "Saman Rathnayake",
    email: "saman@globaltools.com",
    phone: "+94 70 456 7890",
    address: "12, Export Processing Zone, Biyagama",
    taxId: "4567890123",
    status: "Inactive",
    createdDate: "2023-05-01",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// SEED DATA — SUPPLIER RETURN NOTES
// ─────────────────────────────────────────────────────────────────────────────

const SEED_RETURN_NOTES = [
  {
    id: "srn1",
    returnNumber: "SRN-2026-0001",
    supplierId: "sup1",
    supplierName: "Ceylon Construction Materials",
    returnDate: "2026-05-10",
    status: "Approved",
    reason: "Defective cement bags – moisture damage",
    notes: "Returned 50 bags due to hardening. Supplier acknowledged.",
    totalItems: 50,
    totalValue: 92500,
    createdBy: "Anil Perera",
    createdAt: "2026-05-09",
    lines: [
      { id: "l1", itemName: "OPC Cement 50kg", quantity: 50, unit: "Bags", unitPrice: 1850, total: 92500, condition: "Damaged", reason: "Moisture damage" },
    ],
  },
  {
    id: "srn2",
    returnNumber: "SRN-2026-0002",
    supplierId: "sup2",
    supplierName: "SteelMart International",
    returnDate: "2026-05-15",
    status: "Submitted",
    reason: "T12 Rebar – incorrect grade supplied (Grade 40 instead of Grade 60)",
    notes: "Expecting replacement within 2 weeks.",
    totalItems: 1500,
    totalValue: 480000,
    createdBy: "Ruwantha Bandara",
    createdAt: "2026-05-14",
    lines: [
      { id: "l2", itemName: "T12 Rebar (Grade 40)", quantity: 1500, unit: "kg", unitPrice: 320, total: 480000, condition: "Wrong Item", reason: "Incorrect grade" },
    ],
  },
  {
    id: "srn3",
    returnNumber: "SRN-2026-0003",
    supplierId: "sup3",
    supplierName: "Hardware Lanka (Pvt) Ltd",
    returnDate: "2026-05-18",
    status: "Draft",
    reason: "Damaged scaffolding frames during transit",
    notes: "Awaiting inspection report.",
    totalItems: 12,
    totalValue: 72000,
    createdBy: "Kamala Wijesinghe",
    createdAt: "2026-05-18",
    lines: [
      { id: "l3a", itemName: "Scaffolding Frame 1.8m", quantity: 8, unit: "frames", unitPrice: 4500, total: 36000, condition: "Damaged", reason: "Bent tubes" },
      { id: "l3b", itemName: "Scaffolding Base Jack", quantity: 4, unit: "units", unitPrice: 9000, total: 36000, condition: "Minor Damage", reason: "Threads stripped" },
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
  return n ? `Rs. ${n.toLocaleString("en-LK")}` : "Rs. 0";
}

let srnCounter = 3;
function nextSRNNumber() {
  srnCounter++;
  return `SRN-2026-${String(srnCounter).padStart(4, "0")}`;
}

function generateSupplierCode(suppliers: any[]) {
  const nextNum = suppliers.length + 1;
  return `SUP-${String(nextNum).padStart(3, "0")}`;
}

function calcSRNTotals(lines: any[]) {
  const totalValue = lines.reduce((s, l) => s + (l.total || (l.quantity * l.unitPrice)), 0);
  const totalItems = lines.reduce((s, l) => s + l.quantity, 0);
  return { totalValue, totalItems };
}

// ─────────────────────────────────────────────────────────────────────────────
// BADGES
// ─────────────────────────────────────────────────────────────────────────────

function SRNStatusBadge({ status }: { status: string }) {
  const s = SRN_STATUS_STYLES[status] || SRN_STATUS_STYLES["Draft"];
  return (
    <span className={`inline-flex items-center gap-1.5 text-[10px] px-2 py-0.5 rounded-full font-semibold border ${s.bg} ${s.text} ${s.border}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {status}
    </span>
  );
}

function SupplierStatusBadge({ status }: { status: string }) {
  const isActive = status === "Active";
  return (
    <span className={`inline-flex items-center gap-1.5 text-[10px] px-2 py-0.5 rounded-full font-semibold border ${
      isActive ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-slate-100 text-slate-500 border-slate-200"
    }`}>
      <span className={`w-1.5 h-1.5 rounded-full ${isActive ? "bg-emerald-500" : "bg-slate-400"}`} />
      {status}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SUPPLIER MODAL (CRUD)
// ─────────────────────────────────────────────────────────────────────────────

function SupplierModal({ open, onClose, onSubmit, initial, isEditing }: any) {
  const [form, setForm] = useState(() => ({
    ...DEFAULT_SUPPLIER,
    ...initial,
    createdDate: initial?.createdDate || todayStr(),
  }));

  useEffect(() => {
    if (open) {
      setForm({
        ...DEFAULT_SUPPLIER,
        ...initial,
        createdDate: initial?.createdDate || todayStr(),
      });
    }
  }, [open, initial]);

  const handleChange = (key: string, value: any) => setForm((f: any) => ({ ...f, [key]: value }));
  const isValid = form.name && form.name.trim() !== "" && form.email && form.phone;

  if (!open) return null;

  const inputCls = "w-full border border-slate-200 rounded-xl px-4 py-2.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-emerald-400 bg-white text-slate-700";
  const selectCls = "w-full border border-slate-200 rounded-xl px-4 py-2.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-emerald-400 bg-white";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h2 className="text-[14px] font-bold text-slate-800">{isEditing ? "Edit Supplier" : "New Supplier"}</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400"><X size={15} /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          <div>
            <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">Supplier Name *</label>
            <input value={form.name} onChange={(e) => handleChange("name", e.target.value)} className={inputCls} placeholder="Company name" />
          </div>
          <div>
            <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">Supplier Code</label>
            <input value={form.code} onChange={(e) => handleChange("code", e.target.value)} className={inputCls} placeholder="Auto-generated" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">Contact Person</label>
              <input value={form.contactPerson} onChange={(e) => handleChange("contactPerson", e.target.value)} className={inputCls} placeholder="Name" />
            </div>
            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">Email *</label>
              <input type="email" value={form.email} onChange={(e) => handleChange("email", e.target.value)} className={inputCls} placeholder="company@example.com" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">Phone *</label>
              <input value={form.phone} onChange={(e) => handleChange("phone", e.target.value)} className={inputCls} placeholder="+94 XX XXX XXXX" />
            </div>
            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">Tax ID / VAT</label>
              <input value={form.taxId} onChange={(e) => handleChange("taxId", e.target.value)} className={inputCls} placeholder="Optional" />
            </div>
          </div>
          <div>
            <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">Address</label>
            <textarea value={form.address} onChange={(e) => handleChange("address", e.target.value)} rows={2} className={`${inputCls} resize-none`} placeholder="Street, city, postal code" />
          </div>
          <div>
            <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">Status</label>
            <select value={form.status} onChange={(e) => handleChange("status", e.target.value)} className={selectCls}>
              {SUPPLIER_STATUSES.map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>
        </div>
        <div className="p-5 border-t border-slate-100 flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-[13px] font-semibold text-slate-600 hover:bg-slate-50">Cancel</button>
          <button onClick={() => onSubmit(form)} disabled={!isValid}
            className={`flex-1 py-2.5 rounded-xl text-white text-[13px] font-semibold transition-colors ${isValid ? "bg-emerald-600 hover:bg-emerald-700" : "bg-emerald-300 cursor-not-allowed"}`}>
            {isEditing ? "Save Changes" : "Create Supplier"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SUPPLIER RETURN NOTE LINE ROW
// ─────────────────────────────────────────────────────────────────────────────

function ReturnNoteLineRow({ line, index, onUpdate, onRemove, isEditing }: any) {
  const inputCls = "w-full border border-slate-200 rounded-xl px-3 py-2 text-[12px] focus:outline-none focus:ring-2 focus:ring-emerald-400 bg-white";
  
  const updateLineField = (field: string, value: any) => {
    const updated = { ...line, [field]: value };
    if (field === "quantity" || field === "unitPrice") {
      updated.total = (updated.quantity || 0) * (updated.unitPrice || 0);
    }
    onUpdate(line.id, updated);
  };

  return (
    <div className="border border-slate-200 rounded-2xl bg-white overflow-hidden shadow-sm">
      <div className="flex items-center justify-between px-5 py-2.5 bg-slate-50 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <span className="w-6 h-6 rounded-lg bg-slate-200 flex items-center justify-center text-[10px] font-extrabold text-slate-500">{index + 1}</span>
          {line.condition === "Damaged" && <span className="text-[10px] font-semibold text-rose-600 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full">⚠ Damaged</span>}
          {line.condition === "Wrong Item" && <span className="text-[10px] font-semibold text-orange-600 bg-orange-50 border border-orange-200 px-2 py-0.5 rounded-full">🔄 Wrong Item</span>}
        </div>
        {isEditing && (
          <button onClick={() => onRemove(line.id)} className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-500">
            <Trash2 size={13} />
          </button>
        )}
      </div>
      <div className="p-5">
        <div className="mb-4">
          <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1.5">Item Name *</label>
          {isEditing ? (
            <input value={line.itemName} onChange={(e) => updateLineField("itemName", e.target.value)} className={inputCls} />
          ) : (
            <p className="text-[13px] font-semibold text-slate-700">{line.itemName}</p>
          )}
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1.5">Qty Returned</label>
            {isEditing ? (
              <input type="number" min="0" value={line.quantity} onChange={(e) => updateLineField("quantity", Number(e.target.value))} className={inputCls} />
            ) : (
              <p className="text-[15px] font-bold text-slate-800">{line.quantity}</p>
            )}
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1.5">Unit</label>
            {isEditing ? (
              <input value={line.unit} onChange={(e) => updateLineField("unit", e.target.value)} className={inputCls} />
            ) : (
              <p className="text-[12px] text-slate-500">{line.unit}</p>
            )}
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1.5">Unit Price (Rs.)</label>
            {isEditing ? (
              <input type="number" min="0" value={line.unitPrice} onChange={(e) => updateLineField("unitPrice", Number(e.target.value))} className={inputCls} />
            ) : (
              <p className="text-[12px] text-slate-500">{line.unitPrice ? `Rs. ${line.unitPrice.toLocaleString()}` : "—"}</p>
            )}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 mt-4">
          <div>
            <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1.5">Condition</label>
            {isEditing ? (
              <select value={line.condition} onChange={(e) => updateLineField("condition", e.target.value)} className={inputCls}>
                <option value="Good">Good</option>
                <option value="Minor Damage">Minor Damage</option>
                <option value="Damaged">Damaged</option>
                <option value="Wrong Item">Wrong Item</option>
              </select>
            ) : (
              <span className={`inline-flex text-[11px] font-semibold px-2 py-1 rounded-full ${
                line.condition === "Good" ? "bg-emerald-50 text-emerald-700" :
                line.condition === "Minor Damage" ? "bg-amber-50 text-amber-700" :
                line.condition === "Damaged" ? "bg-rose-50 text-rose-700" :
                "bg-slate-100 text-slate-600"
              }`}>{line.condition}</span>
            )}
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1.5">Reason (optional)</label>
            {isEditing ? (
              <input value={line.reason || ""} onChange={(e) => updateLineField("reason", e.target.value)} className={inputCls} placeholder="Why returned?" />
            ) : (
              <p className="text-[11px] text-slate-500">{line.reason || "—"}</p>
            )}
          </div>
        </div>
        {line.total > 0 && (
          <div className="mt-4 flex justify-end">
            <span className="text-[11px] text-slate-400 mr-2">Line Total:</span>
            <span className="font-extrabold text-slate-800 text-[14px]">{fmtCurrency(line.total)}</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SUPPLIER RETURN NOTE FORM
// ─────────────────────────────────────────────────────────────────────────────

function ReturnNoteForm({ initial, onSubmit, onCancel, suppliers }: any) {
  const defaultNote = {
    id: "",
    returnNumber: nextSRNNumber(),
    supplierId: "",
    supplierName: "",
    returnDate: todayStr(),
    status: "Draft",
    reason: "",
    notes: "",
    totalItems: 0,
    totalValue: 0,
    createdBy: "Current User",
    createdAt: todayStr(),
    lines: [] as any[],
  };

  const [form, setForm] = useState(() => ({ ...defaultNote, ...initial }));
  const [editing, setEditing] = useState(!initial);

  const setField = (key: string, value: any) => setForm((f: any) => ({ ...f, [key]: value }));

  const handleSupplierChange = (supplierId: string) => {
    const supplier = suppliers.find((s: any) => s.id === supplierId);
    setField("supplierId", supplierId);
    setField("supplierName", supplier ? supplier.name : "");
  };

  const addLine = () => {
    setForm((f: any) => ({
      ...f,
      lines: [...f.lines, {
        id: uid(),
        itemName: "",
        quantity: 1,
        unit: "pcs",
        unitPrice: 0,
        total: 0,
        condition: "Good",
        reason: "",
      }]
    }));
  };

  const updateLine = (id: string, updatedLine: any) => {
    setForm((f: any) => ({
      ...f,
      lines: f.lines.map((l: any) => l.id === id ? updatedLine : l)
    }));
  };

  const removeLine = (id: string) => {
    setForm((f: any) => ({ ...f, lines: f.lines.filter((l: any) => l.id !== id) }));
  };

  const { totalValue, totalItems } = calcSRNTotals(form.lines);
  const isValid = form.supplierId && form.lines.length > 0 && form.lines.every((l: any) => l.itemName && l.quantity > 0);

  const inputCls = "w-full border border-slate-200 rounded-xl px-4 py-2.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-emerald-400 bg-white";
  const selectCls = "w-full border border-slate-200 rounded-xl px-4 py-2.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-emerald-400 bg-white";

  const handleSubmit = () => {
    onSubmit({
      ...form,
      totalValue,
      totalItems,
      createdAt: form.createdAt || todayStr(),
    });
  };

  return (
    <div className="p-6 space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1.5">Return Number</label>
          <div className="flex items-center gap-2 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl">
            <Hash size={13} className="text-slate-400" />
            <span className="text-[13px] font-bold font-mono text-slate-700">{form.returnNumber}</span>
          </div>
        </div>
        <div>
          <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1.5">Status</label>
          <select value={form.status} onChange={(e) => setField("status", e.target.value)} className={selectCls}>
            {SRN_STATUSES.map((s) => <option key={s}>{s}</option>)}
          </select>
        </div>
        <div className="col-span-2">
          <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1.5">Supplier *</label>
          <select value={form.supplierId} onChange={(e) => handleSupplierChange(e.target.value)} className={selectCls}>
            <option value="">— Select Supplier —</option>
            {suppliers.filter((s: any) => s.status === "Active").map((sup: any) => (
              <option key={sup.id} value={sup.id}>{sup.name} ({sup.code})</option>
            ))}
          </select>
          {form.supplierName && <p className="text-[10px] text-slate-400 mt-1">Contact: {suppliers.find((s: any) => s.id === form.supplierId)?.contactPerson}</p>}
        </div>
        <div>
          <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1.5">Return Date</label>
          <input type="date" value={form.returnDate} onChange={(e) => setField("returnDate", e.target.value)} className={inputCls} />
        </div>
        <div>
          <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1.5">Created By</label>
          <input value={form.createdBy} onChange={(e) => setField("createdBy", e.target.value)} className={inputCls} />
        </div>
        <div className="col-span-2">
          <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1.5">Return Reason (Summary)</label>
          <input value={form.reason} onChange={(e) => setField("reason", e.target.value)} className={inputCls} placeholder="e.g., Defective goods, wrong items shipped..." />
        </div>
        <div className="col-span-2">
          <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1.5">Notes / Instructions</label>
          <textarea value={form.notes} onChange={(e) => setField("notes", e.target.value)} rows={2} className={`${inputCls} resize-none`} />
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Return Items ({form.lines.length})</p>
          <button onClick={addLine} className="flex items-center gap-1.5 text-[12px] font-semibold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-4 py-2 rounded-xl">
            <Plus size={12} /> Add Item
          </button>
        </div>
        {form.lines.length === 0 ? (
          <div className="border-2 border-dashed border-slate-200 rounded-2xl py-12 text-center">
            <Undo2 size={28} className="mx-auto text-slate-300 mb-3" />
            <p className="text-[13px] text-slate-400">No return items added. Click "Add Item" to start.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {form.lines.map((line: any, i: number) => (
              <ReturnNoteLineRow key={line.id} line={line} index={i} onUpdate={updateLine} onRemove={removeLine} isEditing />
            ))}
          </div>
        )}
        {totalValue > 0 && (
          <div className="mt-5 flex justify-end">
            <div className="bg-emerald-800 text-white rounded-2xl px-6 py-4 text-right">
              <p className="text-[10px] text-emerald-300 uppercase tracking-widest mb-1">Return Total</p>
              <p className="text-[22px] font-extrabold">{fmtCurrency(totalValue)}</p>
              <p className="text-[10px] text-emerald-300 mt-1">{totalItems} items returned</p>
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-3 pt-1">
        <button onClick={onCancel} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-[13px] font-semibold text-slate-600 hover:bg-slate-50">Cancel</button>
        <button onClick={handleSubmit} disabled={!isValid}
          className={`flex-1 py-2.5 rounded-xl text-white text-[13px] font-semibold transition-colors ${isValid ? "bg-emerald-600 hover:bg-emerald-700" : "bg-emerald-300 cursor-not-allowed"}`}>
          {initial ? "Save Changes" : "Create Return Note"}
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// RETURN NOTE DETAIL DRAWER
// ─────────────────────────────────────────────────────────────────────────────

function ReturnNoteDrawer({ note, onClose, onEdit, onDelete, suppliers }: any) {
  const s = SRN_STATUS_STYLES[note.status] || SRN_STATUS_STYLES["Draft"];
  const supplier = suppliers.find((s: any) => s.id === note.supplierId);
  const { totalValue, totalItems } = calcSRNTotals(note.lines);

  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white shadow-2xl h-full flex flex-col overflow-y-auto">
        <div className={`h-1.5 w-full ${s.dot}`} />
        <div className="p-5 flex items-start gap-3 border-b border-slate-100">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-orange-600 text-white flex-shrink-0">
            <Undo2 size={22} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-bold font-mono text-slate-400">{note.returnNumber}</p>
            <p className="text-[15px] font-bold text-slate-800 leading-snug">{note.supplierName}</p>
            <div className="mt-1.5"><SRNStatusBadge status={note.status} /></div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={16} /></button>
        </div>

        <div className="p-5 space-y-5 flex-1">
          <section>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Return Details</p>
            <div className="space-y-2 text-[12px]">
              {[
                ["Return Date", formatDate(note.returnDate)],
                ["Reason", note.reason || "—"],
                ["Created By", note.createdBy],
                ["Created At", formatDate(note.createdAt)],
                ["Supplier", note.supplierName, supplier?.contactPerson],
                ["Phone", supplier?.phone || "—"],
              ].map(([label, value, sub]) => (
                <div key={label} className="flex justify-between items-start gap-3">
                  <span className="text-slate-400 flex-shrink-0">{label}</span>
                  <div className="text-right">
                    <span className="font-medium text-slate-700">{value}</span>
                    {sub && <p className="text-[10px] text-slate-400 mt-0.5">{sub}</p>}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Return Items ({note.lines.length})</p>
            <div className="space-y-2">
              {note.lines.map((line: any, idx: number) => (
                <div key={line.id} className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                  <div className="flex justify-between">
                    <span className="text-[12px] font-semibold text-slate-700">{line.itemName}</span>
                    <span className="text-[11px] font-mono text-slate-500">{line.quantity} {line.unit}</span>
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-500 mt-1">
                    <span>{line.condition}</span>
                    <span>{fmtCurrency(line.total)}</span>
                  </div>
                  {line.reason && <p className="text-[10px] text-slate-400 mt-1">Reason: {line.reason}</p>}
                </div>
              ))}
            </div>
            <div className="mt-3 pt-2 border-t border-slate-100 flex justify-between text-[13px] font-bold">
              <span>Total</span>
              <span>{fmtCurrency(totalValue)} ({totalItems} items)</span>
            </div>
          </section>

          {note.notes && (
            <section>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Notes</p>
              <p className="text-[12px] text-slate-600 bg-slate-50 p-2 rounded-lg">{note.notes}</p>
            </section>
          )}
        </div>

        <div className="p-4 border-t border-slate-100 flex gap-2">
          <button onClick={onDelete} className="p-2.5 rounded-xl border border-slate-200 text-slate-500 hover:bg-rose-50 hover:text-rose-500">
            <Trash2 size={14} />
          </button>
          <button onClick={onEdit} className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-600 text-white text-[13px] font-semibold hover:bg-emerald-700">
            <Pencil size={13} /> Edit Return
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

export default function SupplierReturnNotePage() {
  // Suppliers state
  const [suppliers, setSuppliers] = useState(SEED_SUPPLIERS);
  const [supplierModalOpen, setSupplierModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<any>(null);
  const [deleteSupplierTarget, setDeleteSupplierTarget] = useState<any>(null);

  // Return Notes state
  const [returnNotes, setReturnNotes] = useState(SEED_RETURN_NOTES);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterSupplier, setFilterSupplier] = useState("all");
  const [srnModalOpen, setSrnModalOpen] = useState(false);
  const [editingSRN, setEditingSRN] = useState<any>(null);
  const [drawerSRN, setDrawerSRN] = useState<any>(null);
  const [deleteSRNTarget, setDeleteSRNTarget] = useState<any>(null);

  // Derived stats
  const totalReturns = returnNotes.length;
  const totalValue = returnNotes.reduce((sum, n) => sum + n.totalValue, 0);
  const draftCount = returnNotes.filter((n) => n.status === "Draft").length;
  const submittedCount = returnNotes.filter((n) => n.status === "Submitted").length;
  const approvedCount = returnNotes.filter((n) => n.status === "Approved").length;

  // Filtered return notes
  const filteredReturns = returnNotes.filter((rn) => {
    const q = search.toLowerCase();
    const matchesSearch = rn.returnNumber.toLowerCase().includes(q) || rn.supplierName.toLowerCase().includes(q);
    const matchesStatus = filterStatus === "all" || rn.status === filterStatus;
    const matchesSupplier = filterSupplier === "all" || rn.supplierId === filterSupplier;
    return matchesSearch && matchesStatus && matchesSupplier;
  });

  // Supplier CRUD
  const createSupplier = (data: any) => {
    const newSupplier = {
      ...data,
      id: uid(),
      code: data.code || generateSupplierCode(suppliers),
      createdDate: todayStr(),
    };
    setSuppliers((prev) => [...prev, newSupplier]);
    setSupplierModalOpen(false);
  };
  const updateSupplier = (data: any) => {
    setSuppliers((prev) => prev.map((s) => (s.id === editingSupplier.id ? { ...data, id: s.id } : s)));
    setSupplierModalOpen(false);
    setEditingSupplier(null);
  };
  const deleteSupplier = () => {
    if (deleteSupplierTarget) {
      setSuppliers((prev) => prev.filter((s) => s.id !== deleteSupplierTarget.id));
      setDeleteSupplierTarget(null);
    }
  };

  // Return Note CRUD
  const createSRN = (data: any) => {
    const newNote = {
      ...data,
      id: uid(),
      returnNumber: nextSRNNumber(),
      createdAt: todayStr(),
    };
    setReturnNotes((prev) => [newNote, ...prev]);
    setSrnModalOpen(false);
  };
  const updateSRN = (data: any) => {
    setReturnNotes((prev) => prev.map((n) => (n.id === editingSRN.id ? { ...data, id: n.id } : n)));
    setSrnModalOpen(false);
    setEditingSRN(null);
    setDrawerSRN(null);
  };
  const deleteSRN = () => {
    if (deleteSRNTarget) {
      setReturnNotes((prev) => prev.filter((n) => n.id !== deleteSRNTarget.id));
      setDeleteSRNTarget(null);
      setDrawerSRN(null);
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
              <span className="text-[10px] font-bold uppercase tracking-widest text-orange-600">Supplier Returns</span>
            </div>
            <h1 className="text-[22px] font-extrabold text-slate-800 tracking-tight">Supplier Return Notes</h1>
            <p className="text-[13px] text-slate-400 mt-0.5">Manage supplier returns, track defective or wrong items, and maintain supplier records.</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => { setEditingSupplier(null); setSupplierModalOpen(true); }}
              className="flex items-center gap-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-4 py-2.5 rounded-xl text-[13px] font-semibold transition-colors">
              <Building2 size={14} /> Manage Suppliers
            </button>
            <button onClick={() => { setEditingSRN(null); setSrnModalOpen(true); }}
              className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white px-4 py-2.5 rounded-xl text-[13px] font-semibold transition-colors">
              <Plus size={14} /> New Return Note
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-5">
          <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
            <p className="text-[24px] font-extrabold text-slate-800">{totalReturns}</p>
            <p className="text-[11px] text-slate-400 font-medium">Total Returns</p>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
            <p className="text-[24px] font-extrabold text-emerald-600">{fmtCurrency(totalValue)}</p>
            <p className="text-[11px] text-slate-400 font-medium">Total Return Value</p>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
            <p className="text-[24px] font-extrabold text-amber-600">{draftCount}</p>
            <p className="text-[11px] text-slate-400 font-medium">Draft</p>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
            <p className="text-[24px] font-extrabold text-blue-600">{submittedCount}</p>
            <p className="text-[11px] text-slate-400 font-medium">Submitted</p>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
            <p className="text-[24px] font-extrabold text-emerald-600">{approvedCount}</p>
            <p className="text-[11px] text-slate-400 font-medium">Approved</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm px-4 py-3 flex flex-wrap gap-3 items-center mb-4">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by Return # or Supplier..."
              className="w-full pl-9 pr-3 py-2 text-[12px] border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400 bg-slate-50" />
          </div>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
            className="text-[12px] border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 text-slate-600">
            <option value="all">All Statuses</option>
            {SRN_STATUSES.map((s) => <option key={s}>{s}</option>)}
          </select>
          <select value={filterSupplier} onChange={(e) => setFilterSupplier(e.target.value)}
            className="text-[12px] border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 text-slate-600 min-w-[160px]">
            <option value="all">All Suppliers</option>
            {suppliers.filter(s => s.status === "Active").map((sup) => (
              <option key={sup.id} value={sup.id}>{sup.name}</option>
            ))}
          </select>
        </div>

        {/* Return Notes Table */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                {["Return #", "Supplier", "Date", "Status", "Items", "Total Value", "Actions"].map((h, i) => (
                  <th key={h} className={`px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest ${i === 6 ? "text-right" : "text-left"}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredReturns.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-14 text-slate-400 text-[13px]">No supplier return notes found</td></tr>
              ) : filteredReturns.map((note) => (
                <tr key={note.id} className="transition-colors cursor-pointer hover:bg-orange-50/30" onClick={() => setDrawerSRN(note)}>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-orange-600 text-white flex-shrink-0">
                        <Undo2 size={14} />
                      </div>
                      <div>
                        <p className="text-[12px] font-bold text-slate-700 font-mono">{note.returnNumber}</p>
                        <p className="text-[10px] text-slate-400">{formatDate(note.returnDate)}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-1.5">
                      <Building2 size={11} className="text-slate-400" />
                      <span className="text-[12px] text-slate-600">{note.supplierName}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="text-[11px] text-slate-500">{formatDate(note.returnDate)}</span>
                  </td>
                  <td className="px-4 py-3.5"><SRNStatusBadge status={note.status} /></td>
                  <td className="px-4 py-3.5"><span className="text-[12px] text-slate-600">{note.totalItems}</span></td>
                  <td className="px-4 py-3.5"><span className="text-[13px] font-bold text-slate-700">{fmtCurrency(note.totalValue)}</span></td>
                  <td className="px-4 py-3.5" onClick={(e) => e.stopPropagation()}>
                    <div className="flex justify-end gap-1">
                      <button onClick={() => setDrawerSRN(note)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700" title="View"><Eye size={13} /></button>
                      <button onClick={() => { setEditingSRN(note); setSrnModalOpen(true); }} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700" title="Edit"><Pencil size={13} /></button>
                      <button onClick={() => setDeleteSRNTarget(note)} className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-500" title="Delete"><Trash2 size={13} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Supplier Modal */}
      <SupplierModal
        open={supplierModalOpen}
        onClose={() => { setSupplierModalOpen(false); setEditingSupplier(null); }}
        onSubmit={editingSupplier ? updateSupplier : createSupplier}
        initial={editingSupplier}
        isEditing={!!editingSupplier}
      />

      {/* Return Note Modal */}
      {srnModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={() => { setSrnModalOpen(false); setEditingSRN(null); }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 flex-shrink-0">
              <h2 className="text-[15px] font-bold text-slate-800">{editingSRN ? "Edit Return Note" : "New Supplier Return Note"}</h2>
              <button onClick={() => { setSrnModalOpen(false); setEditingSRN(null); }} className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400"><X size={16} /></button>
            </div>
            <div className="overflow-y-auto flex-1">
              <ReturnNoteForm
                initial={editingSRN}
                onSubmit={editingSRN ? updateSRN : createSRN}
                onCancel={() => { setSrnModalOpen(false); setEditingSRN(null); }}
                suppliers={suppliers}
              />
            </div>
          </div>
        </div>
      )}

      {/* Return Note Drawer */}
      {drawerSRN && (
        <ReturnNoteDrawer
          note={drawerSRN}
          onClose={() => setDrawerSRN(null)}
          onEdit={() => { setEditingSRN(drawerSRN); setDrawerSRN(null); setSrnModalOpen(true); }}
          onDelete={() => { setDeleteSRNTarget(drawerSRN); setDrawerSRN(null); }}
          suppliers={suppliers}
        />
      )}

      {/* Delete Confirmations */}
      <ConfirmDeleteModal
        open={!!deleteSupplierTarget}
        onClose={() => setDeleteSupplierTarget(null)}
        onConfirm={deleteSupplier}
        name={deleteSupplierTarget?.name}
      />
      <ConfirmDeleteModal
        open={!!deleteSRNTarget}
        onClose={() => setDeleteSRNTarget(null)}
        onConfirm={deleteSRN}
        name={deleteSRNTarget?.returnNumber}
      />
    </div>
  );
}