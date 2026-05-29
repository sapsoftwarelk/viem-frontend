"use client";

import { useState, useEffect } from "react";
import { apiFetch } from "../../../lib/api";
import {
  Plus, Search, Eye, Pencil, Trash2, X, AlertCircle,
  Car, Fuel, Hash, ShieldCheck, FileText, Bell, Truck,
  Bike, Bus
} from "lucide-react";

// ── Constants ──────────────────────────────────────────────────────────────────

const FUEL_TYPES = ["Petrol", "Diesel", "Electric", "Hybrid", "CNG"];
const STATUSES   = ["Active", "Inactive", "Under Repair", "Decommissioned"];
const CATEGORIES = ["Car", "Van", "Lorry", "Motorcycle", "Three-Wheeler", "Bus", "Other"];

const STATUS_STYLES = {
  Active:         { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" },
  Inactive:       { bg: "bg-slate-100",  text: "text-slate-500",   border: "border-slate-200"  },
  "Under Repair": { bg: "bg-amber-50",   text: "text-amber-700",   border: "border-amber-200"  },
  Decommissioned: { bg: "bg-rose-50",    text: "text-rose-600",    border: "border-rose-200"   },
};

const CATEGORY_COLORS = ["blue", "emerald", "amber", "violet", "rose", "slate", "teal"];
const CAT_BG = {
  blue:    "bg-blue-600",
  emerald: "bg-emerald-600",
  amber:   "bg-amber-500",
  violet:  "bg-violet-600",
  rose:    "bg-rose-600",
  slate:   "bg-slate-500",
  teal:    "bg-teal-600",
};

// ── Seed data ─────────────────────────────────────────────────────────────────

const TODAY = new Date();
const daysFromNow = (n) => {
  const d = new Date(TODAY);
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
};

const SEED_VEHICLES = [
  { id: "v1", regNo: "WP CAB 1234", make: "Toyota",     model: "HiAce",  year: 2019, color: "White",  fuel: "Diesel",   category: "Van",         status: "Active",       insuranceExp: daysFromNow(5),   regExp: daysFromNow(40),  notes: "Main delivery van" },
  { id: "v2", regNo: "WP KL 5678",  make: "Mitsubishi", model: "L200",   year: 2021, color: "Silver", fuel: "Diesel",   category: "Lorry",       status: "Active",       insuranceExp: daysFromNow(90),  regExp: daysFromNow(3),   notes: "Heavy cargo lorry" },
  { id: "v3", regNo: "CP PA 9900",  make: "Honda",      model: "CB150R", year: 2022, color: "Red",    fuel: "Petrol",   category: "Motorcycle",  status: "Under Repair", insuranceExp: daysFromNow(-5),  regExp: daysFromNow(6),   notes: "Dispatch bike" },
  { id: "v4", regNo: "WP GH 3344",  make: "Suzuki",     model: "Alto",   year: 2020, color: "Blue",   fuel: "Petrol",   category: "Car",         status: "Active",       insuranceExp: daysFromNow(200), regExp: daysFromNow(180), notes: "Management vehicle" },
  { id: "v5", regNo: "NW BB 7711",  make: "Tata",       model: "Ace",    year: 2018, color: "Yellow", fuel: "Diesel",   category: "Lorry",       status: "Inactive",     insuranceExp: daysFromNow(60),  regExp: daysFromNow(90),  notes: "Old stock — pending disposal" },
  { id: "v6", regNo: "SG CA 2200",  make: "Toyota",     model: "Prius",  year: 2023, color: "Pearl",  fuel: "Hybrid",   category: "Car",         status: "Active",       insuranceExp: daysFromNow(7),   regExp: daysFromNow(365), notes: "CEO pool car" },
  { id: "v7", regNo: "EP DA 0055",  make: "BYD",        model: "e6",     year: 2024, color: "Gray",   fuel: "Electric", category: "Van",         status: "Active",       insuranceExp: daysFromNow(300), regExp: daysFromNow(1),   notes: "Electric test unit" },
];

// ── Helpers ────────────────────────────────────────────────────────────────────

function uid() { return Math.random().toString(36).slice(2, 9); }

function catColor(cat) {
  const idx = CATEGORIES.indexOf(cat);
  return CATEGORY_COLORS[idx >= 0 ? idx % CATEGORY_COLORS.length : 0] || "slate";
}

function formatDate(d) {
  return d ? new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—";
}

function daysUntil(dateStr) {
  if (!dateStr) return null;
  return Math.ceil((new Date(dateStr) - new Date()) / (1000 * 60 * 60 * 24));
}

// "expired" | "critical" (≤7 days) | "ok" | null
function dateStatus(dateStr) {
  const d = daysUntil(dateStr);
  if (d === null) return null;
  if (d < 0)  return "expired";
  if (d <= 7) return "critical";
  return "ok";
}

// Build the deduplicated alert list for a set of vehicles, respecting dismissed IDs
function buildAlerts(vehicles, dismissed) {
  const alerts = [];
  vehicles.forEach((v) => {
    const ins = dateStatus(v.insuranceExp);
    const reg = dateStatus(v.regExp);
    const insId = `${v.id}-ins-${ins === "expired" ? "exp" : "crit"}`;
    const regId = `${v.id}-reg-${reg === "expired" ? "exp" : "crit"}`;

    if ((ins === "expired" || ins === "critical") && !dismissed.has(insId)) {
      alerts.push({ id: insId, vehicle: v, type: "insurance", label: "Insurance",    severity: ins, days: daysUntil(v.insuranceExp) });
    }
    if ((reg === "expired" || reg === "critical") && !dismissed.has(regId)) {
      alerts.push({ id: regId, vehicle: v, type: "reg",       label: "Registration", severity: reg, days: daysUntil(v.regExp) });
    }
  });
  // expired first, then by days ascending
  alerts.sort((a, b) => {
    if (a.severity !== b.severity) return a.severity === "expired" ? -1 : 1;
    return a.days - b.days;
  });
  return alerts;
}

// ── Small shared components ───────────────────────────────────────────────────

function DateChip({ dateStr, label }) {
  const s = dateStatus(dateStr);
  const d = daysUntil(dateStr);
  if (!dateStr) return <span className="text-[11px] text-slate-300">—</span>;

  const styles = {
    expired:  "bg-rose-50 text-rose-600 border-rose-200",
    critical: "bg-amber-50 text-amber-700 border-amber-200",
    ok:       "bg-slate-50 text-slate-500 border-slate-200",
  };
  const icon = s === "expired" ? "⛔" : s === "critical" ? "⚠" : "✓";

  return (
    <span className={`inline-flex items-center gap-1 border rounded-lg px-2 py-0.5 text-[10px] font-semibold ${styles[s]}`}>
      {icon} {label}: {formatDate(dateStr)}
      {s === "critical" && ` (${d}d)`}
      {s === "expired"  && " Expired"}
    </span>
  );
}

function StatusBadge({ status }) {
  const c = STATUS_STYLES[status] || STATUS_STYLES.Inactive;
  return (
    <span className={`inline-flex items-center text-[10px] px-2 py-0.5 rounded-full font-semibold border ${c.bg} ${c.text} ${c.border}`}>
      ● {status}
    </span>
  );
}

function CatBadge({ category }) {
  const col = catColor(category);
  const map = {
    blue:    "bg-blue-50 text-blue-700 border-blue-200",
    emerald: "bg-emerald-50 text-emerald-700 border-emerald-200",
    amber:   "bg-amber-50 text-amber-700 border-amber-200",
    violet:  "bg-violet-50 text-violet-700 border-violet-200",
    rose:    "bg-rose-50 text-rose-700 border-rose-200",
    teal:    "bg-teal-50 text-teal-700 border-teal-200",
    slate:   "bg-slate-100 text-slate-600 border-slate-200",
  };
  return (
    <span className={`inline-flex items-center border rounded-full font-semibold px-2 py-0.5 text-[10px] ${map[col] || map.slate}`}>
      {category}
    </span>
  );
}

function CatIcon({ category, size = 14 }) {
  const icons = { Lorry: Truck, Motorcycle: Bike, Bus, Van: Truck };
  const Icon = icons[category] || Car;
  return <Icon size={size} />;
}

// ── Notification Panel ────────────────────────────────────────────────────────

function NotificationPanel({ vehicles, dismissed, onDismiss }) {
  const alerts = buildAlerts(vehicles, dismissed);
  if (!alerts.length) return null;

  return (
    <div className="mb-5 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <div className="flex items-center gap-2.5 px-5 py-3 border-b border-slate-100 bg-amber-50">
        <Bell size={14} className="text-amber-500 flex-shrink-0" />
        <p className="text-[12px] font-bold text-amber-800 flex-1">
          {alerts.length} compliance alert{alerts.length !== 1 ? "s" : ""} — insurance or registration expiring within 7 days (or already expired)
        </p>
      </div>
      <div className="divide-y divide-slate-50">
        {alerts.map((a) => {
          const Icon = a.type === "insurance" ? ShieldCheck : FileText;
          const isExp = a.severity === "expired";
          return (
            <div key={a.id} className={`flex items-center gap-3 px-5 py-3 ${isExp ? "bg-rose-50/40" : "bg-amber-50/30"}`}>
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${isExp ? "bg-rose-100" : "bg-amber-100"}`}>
                <Icon size={13} className={isExp ? "text-rose-500" : "text-amber-600"} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-bold text-slate-700">
                  <span className="font-mono">{a.vehicle.regNo}</span>
                  {" — "}{a.label} {isExp ? "has expired" : `expires in ${a.days} day${a.days !== 1 ? "s" : ""}`}
                </p>
                <p className="text-[10px] text-slate-400">
                  {a.vehicle.make} {a.vehicle.model} · Expiry:{" "}
                  {a.type === "insurance" ? formatDate(a.vehicle.insuranceExp) : formatDate(a.vehicle.regExp)}
                </p>
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border flex-shrink-0 ${isExp ? "bg-rose-50 text-rose-600 border-rose-200" : "bg-amber-50 text-amber-700 border-amber-200"}`}>
                {isExp ? "Expired" : `${a.days}d left`}
              </span>
              <button
                onClick={() => onDismiss(a.id)}
                className="text-slate-300 hover:text-slate-500 transition-colors flex-shrink-0 ml-1"
                title="Dismiss"
              >
                <X size={13} />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Modal shell ───────────────────────────────────────────────────────────────

function Modal({ open, onClose, title, children, width = "max-w-xl" }) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className={`bg-white rounded-2xl shadow-2xl w-full ${width} max-h-[90vh] overflow-hidden flex flex-col`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 flex-shrink-0">
          <h2 className="text-[15px] font-bold text-slate-800">{title}</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 transition-colors"
          >
            <X size={16} />
          </button>
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
          <p className="text-[13px] text-rose-700">
            Delete <strong>{name}</strong>? This cannot be undone.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-slate-200 text-[13px] font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-2.5 rounded-xl bg-rose-500 text-white text-[13px] font-semibold hover:bg-rose-600 transition-colors"
          >
            Delete
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ── Vehicle Form ──────────────────────────────────────────────────────────────

function VehicleForm({ initial, onSubmit, onCancel }) {
  const empty = {
    regNo: "", make: "", model: "", year: new Date().getFullYear(),
    color: "", fuel: "Petrol", category: "Car", status: "Active",
    insuranceExp: "", regExp: "", notes: "",
  };
  const [form, setForm] = useState(initial || empty);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const valid = form.regNo.trim() && form.make.trim() && form.model.trim();

  const inputCls =
    "w-full border border-slate-200 rounded-xl px-4 py-2.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white text-slate-700";

  const Field = ({ label, children }) => (
    <div>
      <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1.5 tracking-wider">{label}</label>
      {children}
    </div>
  );

  const dateHint = (key) => {
    const s = dateStatus(form[key]);
    if (!form[key] || !s) return null;
    const color =
      s === "expired" ? "text-rose-500" : s === "critical" ? "text-amber-600" : "text-emerald-600";
    const msg =
      s === "expired"
        ? "⛔ Already expired"
        : s === "critical"
        ? `⚠ Expires in ${daysUntil(form[key])} day(s)`
        : `✓ ${daysUntil(form[key])} days remaining`;
    return <p className={`text-[10px] mt-1 font-medium ${color}`}>{msg}</p>;
  };

  return (
    <div className="p-6 space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Field label="Registration No *">
          <input
            value={form.regNo}
            onChange={(e) => set("regNo", e.target.value.toUpperCase())}
            placeholder="WP CAB 1234"
            className={`${inputCls} font-mono uppercase`}
          />
        </Field>
        <Field label="Category">
          <select value={form.category} onChange={(e) => set("category", e.target.value)} className={inputCls}>
            {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
          </select>
        </Field>
        <Field label="Make *">
          <input value={form.make} onChange={(e) => set("make", e.target.value)} placeholder="Toyota" className={inputCls} />
        </Field>
        <Field label="Model *">
          <input value={form.model} onChange={(e) => set("model", e.target.value)} placeholder="HiAce" className={inputCls} />
        </Field>
        <Field label="Year">
          <input value={form.year} onChange={(e) => set("year", e.target.value)} type="number" min="1990" max="2035" className={inputCls} />
        </Field>
        <Field label="Color">
          <input value={form.color} onChange={(e) => set("color", e.target.value)} placeholder="White" className={inputCls} />
        </Field>
        <Field label="Fuel Type">
          <select value={form.fuel} onChange={(e) => set("fuel", e.target.value)} className={inputCls}>
            {FUEL_TYPES.map((f) => <option key={f}>{f}</option>)}
          </select>
        </Field>
        <Field label="Status">
          <select value={form.status} onChange={(e) => set("status", e.target.value)} className={inputCls}>
            {STATUSES.map((s) => <option key={s}>{s}</option>)}
          </select>
        </Field>

        {/* Compliance dates */}
        <div className="col-span-2 grid grid-cols-2 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
          <div className="col-span-2">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3">Compliance Dates</p>
          </div>
          <Field label="Insurance Expiry">
            <input value={form.insuranceExp} onChange={(e) => set("insuranceExp", e.target.value)} type="date" className={inputCls} />
            {dateHint("insuranceExp")}
          </Field>
          <Field label="Registration Expiry">
            <input value={form.regExp} onChange={(e) => set("regExp", e.target.value)} type="date" className={inputCls} />
            {dateHint("regExp")}
          </Field>
        </div>

        <div className="col-span-2">
          <Field label="Notes">
            <textarea
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
              rows={2}
              placeholder="Any additional notes…"
              className={`${inputCls} resize-none`}
            />
          </Field>
        </div>
      </div>

      <div className="flex gap-3 pt-1">
        <button
          onClick={onCancel}
          className="flex-1 py-2.5 rounded-xl border border-slate-200 text-[13px] font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={() => valid && onSubmit(form)}
          disabled={!valid}
          className={`flex-1 py-2.5 rounded-xl text-white text-[13px] font-semibold transition-colors ${valid ? "bg-blue-600 hover:bg-blue-700" : "bg-blue-300 cursor-not-allowed"}`}
        >
          {initial ? "Save Changes" : "Register Vehicle"}
        </button>
      </div>
    </div>
  );
}

// ── Detail Drawer ─────────────────────────────────────────────────────────────

function VehicleDrawer({ vehicle, onClose, onEdit }) {
  const col = catColor(vehicle.category);
  const avatarBg = CAT_BG[col] || "bg-slate-500";

  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm bg-white shadow-2xl h-full flex flex-col overflow-y-auto">
        <div className={`h-1.5 w-full ${avatarBg}`} />

        {/* Header */}
        <div className="p-5 flex items-start gap-3 border-b border-slate-100">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white flex-shrink-0 ${avatarBg}`}>
            <CatIcon category={vehicle.category} size={22} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[15px] font-bold text-slate-800 font-mono">{vehicle.regNo}</p>
            <p className="text-[12px] text-slate-500">{vehicle.make} {vehicle.model} · {vehicle.year}</p>
            <div className="flex flex-wrap items-center gap-2 mt-1.5">
              <CatBadge category={vehicle.category} />
              <StatusBadge status={vehicle.status} />
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 flex-1 space-y-5">
          <section>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Vehicle Details</p>
            <div className="space-y-2 text-[12px]">
              {[
                [<Fuel size={11} />, "Fuel",  vehicle.fuel],
                [<Hash size={11} />, "Color", vehicle.color || "—"],
              ].map(([icon, label, value]) => (
                <div key={label} className="flex justify-between items-center">
                  <span className="flex items-center gap-1.5 text-slate-400">{icon}{label}</span>
                  <span className="font-medium text-slate-700">{value}</span>
                </div>
              ))}
            </div>
          </section>

          <section>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Compliance</p>
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-[12px] text-slate-400"><ShieldCheck size={11} />Insurance</span>
                <DateChip dateStr={vehicle.insuranceExp} label="Ins" />
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-[12px] text-slate-400"><FileText size={11} />Registration</span>
                <DateChip dateStr={vehicle.regExp} label="Reg" />
              </div>
            </div>
          </section>

          {vehicle.notes && (
            <section>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Notes</p>
              <p className="text-[12px] text-slate-600 bg-slate-50 rounded-xl p-3 leading-relaxed">{vehicle.notes}</p>
            </section>
          )}
        </div>

        <div className="p-4 border-t border-slate-100">
          <button
            onClick={onEdit}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-slate-800 text-white text-[13px] font-semibold hover:bg-slate-700 transition-colors"
          >
            <Pencil size={13} /> Edit Vehicle
          </button>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// MAIN
// ══════════════════════════════════════════════════════════════════════════════

export default function VehicleRegistration() {
  const [vehicles, setVehicles] = useState(SEED_VEHICLES);
  const [dismissed, setDismissed]       = useState(new Set());
  const [search, setSearch]             = useState("");
  const [filterCat, setFilterCat]       = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [modal, setModal]               = useState(null); // null | "create" | "edit" | "delete"
  const [target, setTarget]             = useState(null);
  const [drawer, setDrawer]             = useState(null);

  const dismissAlert = (id) => setDismissed((prev) => new Set([...prev, id]));

  const filtered = vehicles.filter((v) => {
    const q = search.toLowerCase();
    const matchSearch = (
      v.regNo.toLowerCase().includes(q) ||
      v.make.toLowerCase().includes(q)  ||
      v.model.toLowerCase().includes(q)
    );
    const matchCat    = filterCat    === "all" || v.category === filterCat;
    const matchStatus = filterStatus === "all" || v.status   === filterStatus;
    return matchSearch && matchCat && matchStatus;
  });

  useEffect(() => {
    const load = async () => {
      try {
        const v = await apiFetch('/vehicles');
        if (Array.isArray(v)) setVehicles(v.map((x: any) => ({ id: x.id, regNo: x.regNo || x.registration || '', make: x.make || '', model: x.model || '', year: x.year || '', color: x.color || '', fuel: x.fuel || '', category: x.category || 'Other', status: x.status || 'Active', insuranceExp: x.insuranceExp ? x.insuranceExp.split('T')[0] : '', regExp: x.regExp ? x.regExp.split('T')[0] : '', notes: x.notes || '' })));
      } catch (err) {
        console.warn('Load vehicles failed, using seed', err);
      }
    };
    load();
  }, []);

  const normalizeVehiclePayload = (data: any) => {
    return {
      registrationNo: data.regNo,
      category: data.category,
      make: data.make,
      model: data.model,
      year: Number(data.year),
      color: data.color,
      fuelType: data.fuel,
      status: data.status,
      notes: data.notes,
      insuranceExpiry: data.insuranceExp || undefined,
      registrationExpiry: data.regExp || undefined,
    };
  };

  const create = async (data) => {
    try {
      const payload = normalizeVehiclePayload(data);
      const created = await apiFetch('/vehicles', { method: 'POST', body: JSON.stringify(payload) }).catch(() => null);
      if (created) setVehicles((prev) => [{ id: created.id, regNo: created.registrationNo || created.regNo, make: created.make, model: created.model, year: created.year, color: created.color, fuel: created.fuelType || created.fuel, category: created.category, status: created.status, insuranceExp: created.insuranceExpiry ? created.insuranceExpiry.split('T')[0] : '', regExp: created.registrationExpiry ? created.registrationExpiry.split('T')[0] : '', notes: created.notes || '' }, ...prev]);
    } catch (err) {
      console.error('Create vehicle failed', err);
    }
    setModal(null);
  };

  const update = async (data) => {
    try {
      if (!target) return;
      const payload = normalizeVehiclePayload(data);
      const updated = await apiFetch(`/vehicles/${target.id}`, { method: 'PUT', body: JSON.stringify(payload) }).catch(() => null);
      if (updated) setVehicles((prev) => prev.map((v) => (v.id === target.id ? { ...v, ...data } : v)));
    } catch (err) {
      console.error('Update vehicle failed', err);
    }
    setModal(null);
    setDrawer(null);
  };

  const remove = async () => {
    try {
      if (!target) return;
      await apiFetch(`/vehicles/${target.id}`, { method: 'DELETE' }).catch(() => null);
      setVehicles((prev) => prev.filter((v) => v.id !== target.id));
    } catch (err) {
      console.error('Delete vehicle failed', err);
    }
    setModal(null);
  };

  const alertCount = buildAlerts(vehicles, dismissed).length;

  return (
    <div className="min-h-screen bg-[#f7f8fb] p-5 font-sans">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="mb-6 flex items-start justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-[22px] font-extrabold text-slate-800 tracking-tight">Vehicle Registration</h1>
            <p className="text-[13px] text-slate-400 mt-0.5">Manage the company fleet — registrations and compliance</p>
          </div>
          <button
            onClick={() => { setTarget(null); setModal("create"); }}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-[13px] font-semibold transition-colors"
          >
            <Plus size={14} /> Register Vehicle
          </button>
        </div>

        {/* Notification Panel */}
        <NotificationPanel vehicles={vehicles} dismissed={dismissed} onDismiss={dismissAlert} />

        {/* Stat cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
          {[
            { label: "Total Fleet",    value: vehicles.length,                                         color: "text-blue-600"    },
            { label: "Active",         value: vehicles.filter((v) => v.status === "Active").length,    color: "text-emerald-600" },
            { label: "Under Repair",   value: vehicles.filter((v) => v.status === "Under Repair").length, color: "text-amber-500" },
            { label: "Decommissioned", value: vehicles.filter((v) => v.status === "Decommissioned").length, color: "text-rose-500" },
          ].map((c) => (
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
              placeholder="Search reg no, make, model…"
              className="w-full pl-9 pr-3 py-2 text-[12px] border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 bg-slate-50"
            />
          </div>
          <select
            value={filterCat}
            onChange={(e) => setFilterCat(e.target.value)}
            className="text-[12px] border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            <option value="all">All Categories</option>
            {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="text-[12px] border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            <option value="all">All Statuses</option>
            {STATUSES.map((s) => <option key={s}>{s}</option>)}
          </select>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                {["Vehicle", "Category", "Fuel / Color", "Insurance Exp.", "Reg. Exp.", "Status", "Actions"].map((h, i) => (
                  <th
                    key={h}
                    className={[
                      "px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest",
                      i === 6 ? "text-right" : "text-left",
                      h === "Fuel / Color"                       ? "hidden lg:table-cell" : "",
                      h === "Insurance Exp." || h === "Reg. Exp." ? "hidden md:table-cell" : "",
                    ].join(" ")}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-14 text-slate-400 text-[13px]">No vehicles match</td>
                </tr>
              ) : (
                filtered.map((v) => {
                  const col      = catColor(v.category);
                  const avatarBg = CAT_BG[col] || "bg-slate-500";
                  const rowAlert =
                    ["expired", "critical"].includes(dateStatus(v.insuranceExp)) ||
                    ["expired", "critical"].includes(dateStatus(v.regExp));

                  return (
                    <tr
                      key={v.id}
                      className={`transition-colors cursor-pointer ${rowAlert ? "bg-amber-50/20 hover:bg-amber-50/50" : "hover:bg-blue-50/30"}`}
                      onClick={() => setDrawer(v)}
                    >
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-white flex-shrink-0 ${avatarBg}`}>
                            <CatIcon category={v.category} size={14} />
                          </div>
                          <div>
                            <p className="text-[13px] font-bold text-slate-700 font-mono">{v.regNo}</p>
                            <p className="text-[10px] text-slate-400">{v.make} {v.model} · {v.year}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5"><CatBadge category={v.category} /></td>
                      <td className="px-4 py-3.5 hidden lg:table-cell">
                        <span className="text-[12px] text-slate-500">
                          {v.fuel}{v.color ? ` · ${v.color}` : ""}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 hidden md:table-cell">
                        <DateChip dateStr={v.insuranceExp} label="Ins" />
                      </td>
                      <td className="px-4 py-3.5 hidden md:table-cell">
                        <DateChip dateStr={v.regExp} label="Reg" />
                      </td>
                      <td className="px-4 py-3.5"><StatusBadge status={v.status} /></td>
                      <td className="px-4 py-3.5" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-end gap-1">
                          <button
                            onClick={() => setDrawer(v)}
                            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
                            title="View"
                          >
                            <Eye size={13} />
                          </button>
                          <button
                            onClick={() => { setTarget(v); setModal("edit"); }}
                            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
                            title="Edit"
                          >
                            <Pencil size={13} />
                          </button>
                          <button
                            onClick={() => { setTarget(v); setModal("delete"); }}
                            className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-500 transition-colors"
                            title="Delete"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Detail drawer */}
        {drawer && (
          <VehicleDrawer
            vehicle={drawer}
            onClose={() => setDrawer(null)}
            onEdit={() => { setTarget(drawer); setDrawer(null); setModal("edit"); }}
          />
        )}

        {/* Modals */}
        <Modal open={modal === "create"} onClose={() => setModal(null)} title="Register Vehicle">
          <VehicleForm onSubmit={create} onCancel={() => setModal(null)} />
        </Modal>
        <Modal open={modal === "edit"} onClose={() => setModal(null)} title="Edit Vehicle">
          {target && <VehicleForm initial={target} onSubmit={update} onCancel={() => setModal(null)} />}
        </Modal>
        <ConfirmDelete
          open={modal === "delete"}
          onClose={() => setModal(null)}
          onConfirm={remove}
          name={target?.regNo}
        />
      </div>
    </div>
  );
}