"use client";

import { useEffect, useState } from "react";
import { apiFetch, API_BASE_URL } from "../../../lib/api";
import {
  Plus, Search, Edit2, Trash2, X,
  Building2, MapPin, Phone, Calendar, Clock,
  FolderTree, AlertCircle, User, History
  , UserPlus, Download } from "lucide-react";
import Badge from "@/components/shared/Badge";

const pad = (n: number, width = 4) => String(n).padStart(width, "0");

const REGIONS = [
  "Ampara","Anuradhapura","Badulla","Batticaloa","Colombo","Galle","Gampaha",
  "Hambantota","Jaffna","Kalutara","Kandy","Kegalle","Kilinochchi","Kurunegala",
  "Mannar","Matale","Matara","Monaragala","Mullaitivu","Nuwara Eliya",
  "Polonnaruwa","Puttalam","Ratnapura","Trincomalee","Vavuniya",
];

const STATUS_STYLES: Record<string, "green" | "amber" | "gray" | "blue" | "red"> = {
  Active: "green",
  Planning: "amber",
  Completed: "gray",
  "On Hold": "red",
};

// ─── Color palette ────────────────────────────────────────────────────────────
const LOCATION_COLORS = [
  {
    dot:        "bg-violet-500",
    ring:       "ring-violet-300",
    border:     "border-violet-300",
    cardBg:     "bg-violet-50/40",
    headerBg:   "bg-violet-50",
    headerBorder:"border-violet-200",
    avatarBg:   "bg-violet-500",
    avatarText:  "text-white",
    accent:     "text-violet-600",
    activeCard: "border-violet-400 bg-violet-50/50",
    filterActive:"bg-violet-600",
    idChip:     "bg-violet-100 text-violet-700",
    subBorder:  "border-violet-100",
  },
  {
    dot:        "bg-sky-500",
    ring:       "ring-sky-300",
    border:     "border-sky-300",
    cardBg:     "bg-sky-50/40",
    headerBg:   "bg-sky-50",
    headerBorder:"border-sky-200",
    avatarBg:   "bg-sky-500",
    avatarText:  "text-white",
    accent:     "text-sky-600",
    activeCard: "border-sky-400 bg-sky-50/50",
    filterActive:"bg-sky-600",
    idChip:     "bg-sky-100 text-sky-700",
    subBorder:  "border-sky-100",
  },
  {
    dot:        "bg-emerald-500",
    ring:       "ring-emerald-300",
    border:     "border-emerald-300",
    cardBg:     "bg-emerald-50/40",
    headerBg:   "bg-emerald-50",
    headerBorder:"border-emerald-200",
    avatarBg:   "bg-emerald-500",
    avatarText:  "text-white",
    accent:     "text-emerald-600",
    activeCard: "border-emerald-400 bg-emerald-50/50",
    filterActive:"bg-emerald-600",
    idChip:     "bg-emerald-100 text-emerald-700",
    subBorder:  "border-emerald-100",
  },
  {
    dot:        "bg-rose-500",
    ring:       "ring-rose-300",
    border:     "border-rose-300",
    cardBg:     "bg-rose-50/40",
    headerBg:   "bg-rose-50",
    headerBorder:"border-rose-200",
    avatarBg:   "bg-rose-500",
    avatarText:  "text-white",
    accent:     "text-rose-600",
    activeCard: "border-rose-400 bg-rose-50/50",
    filterActive:"bg-rose-600",
    idChip:     "bg-rose-100 text-rose-700",
    subBorder:  "border-rose-100",
  },
];

function locationColorIndex(id: string): number {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  return hash % LOCATION_COLORS.length;
}

function getLocationColor(id: string) {
  return LOCATION_COLORS[locationColorIndex(id)];
}

function locationInitials(name: string): string {
  const words = name.trim().split(/\s+/);
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

// ─── Data types ──────────────────────────────────────────────────────────────

export type ManagerHistoryEntry = {
  managerName: string;
  changedAt: string;
};

export type AssignedPerson = {
  id: string;
  name: string;
};

export type AssignedVehicle = {
  id: string;
  vehiclePlate: string;
  driver?: string;
};

type Site = {
  id: string;
  name: string;
  manager: string;
  managerHistory: ManagerHistoryEntry[];
  region: string;
  seq: number;
  status: string;
  client: string;
  contactNumber: string;
  address: string;
  startDate: string;
  remarks: string;
  assignedPersons: AssignedPerson[];
  assignedVehicles: AssignedVehicle[];
};

type Location = {
  id: string;
  name: string;
  status: string;
  region: string;
  sites: Site[];
};

// ─── Data helpers (back‑end mapping) ──────────────────────────────────────

function mapBackendLocation(location: any): Location {
  const sites = Array.isArray(location.subLevels) ? location.subLevels : [];
  return {
    id: location.id,
    name: location.siteName || location.name || "",
    status: location.status || "Planning",
    region: location.region || "",
    sites: sites
      // Defensive: never let an id-less record from the backend reach the UI.
      // The backend now guarantees ids on write, but old rows created before
      // that fix may still be missing one — skip them rather than crash.
      .filter((s: any) => !!s?.id)
      .map((s: any) => ({
        id: s.id,
        name: s.name || "",
        manager: s.manager || "",
        managerHistory: Array.isArray(s.managerHistory) ? s.managerHistory : [],
        region: s.region || "",
        seq: s.seq || 1,
        status: s.status || "Planning",
        client: s.client || "",
        contactNumber: s.contactNumber || "",
        address: s.address || "",
        startDate: s.startDate ? s.startDate.split("T")[0] : "",
        remarks: s.remarks || "",
        assignedPersons: Array.isArray(s.assignedPersons) ? s.assignedPersons.map((p: any) => ({ id: p.id || '', name: p.name || '' })) : [],
        assignedVehicles: Array.isArray(s.assignedVehicles) ? s.assignedVehicles.map((v: any) => ({ id: v.id || '', vehiclePlate: v.vehiclePlate || v.registrationNo || '', driver: v.driver || '' })) : [],
      })),
  };
}

function locationPayload(location: Partial<Location>) {
  return {
    siteName: location.name,
    status: location.status,
    region: location.region,
    // Note: `id` is included when present (existing sites) and omitted
    // when absent (brand-new sites). The backend is the sole authority
    // on assigning/validating sub-level ids — see normalizeSubLevels()
    // in site-locations.service.ts. We never invent ids on the client.
    //
    // IMPORTANT: assignedPersons/assignedVehicles are included here so
    // that a genuine edit (rename, manager change, etc.) round-trips
    // without silently dropping assignments. The backend also carries
    // these forward from the existing record if they're omitted, as a
    // second line of defense — but sending them explicitly keeps the
    // client and server in agreement about what "no assignment" means
    // vs. "field not sent".
    subLevels: location.sites?.map((s) => ({
      ...(s.id ? { id: s.id } : {}),
      name: s.name,
      manager: s.manager,
      managerHistory: s.managerHistory,
      region: s.region,
      seq: s.seq,
      status: s.status,
      client: s.client,
      contactNumber: s.contactNumber,
      address: s.address,
      startDate: s.startDate,
      remarks: s.remarks,
      assignedPersons: s.assignedPersons || [],
      assignedVehicles: s.assignedVehicles || [],
    })) || [],
  };
}

// ─── Shared file-download helper ──────────────────────────────────────────────
// Tries the configured API base first, then a couple of common local dev
// ports as a fallback — mirrors the pattern already used by the bulk-assign
// "Download PDF" buttons, kept in one place so the report buttons share it.
async function downloadPdf(path: string, filename: string): Promise<boolean> {
  const candidates = [API_BASE_URL, "http://localhost:5001/api", "http://localhost:5002/api"];
  for (const base of candidates) {
    try {
      const resp = await fetch(`${base}${path}`);
      if (!resp.ok) continue;
      const blob = await resp.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      return true;
    } catch (e) {
      console.warn("report download try failed", base, e);
    }
  }
  return false;
}

// ─── Sample seed data with historical records ────────────────────────────────

const SEED_LOCATIONS: Location[] = [
  {
    id: "LOC-ADM-0001",
    name: "Administrative Sites",
    status: "Active",
    region: "Colombo",
    sites: [
      {
        id: "SITE-ADM-WH1",
        name: "Warehouse 1",
        manager: "Admin Manager",
        managerHistory: [
          { managerName: "K.D. Perera", changedAt: "2024-01-01" },
          { managerName: "S. Jayasinghe", changedAt: "2025-03-14" }
        ],
        region: "Colombo",
        seq: 1,
        status: "Active",
        client: "Government",
        contactNumber: "0112345678",
        address: "1, Warehouse Road, Colombo 01",
        startDate: "2024-01-01",
        remarks: "Main warehouse",
        assignedPersons: [],
        assignedVehicles: [],
      }
    ],
  }
];

// ─── Shared modals ────────────────────────────────────────────────────────────

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-800">{title}</h2>
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

// ─── Site Modal – Tracks Manager Mutations ───────────────────────────────────

function SiteModal({ title, initial, onClose, onSave }: any) {
  const [form, setForm] = useState(initial || {
    name: "",
    manager: "",
    managerHistory: [],
    region: REGIONS[0],
    client: "",
    contactNumber: "",
    address: "",
    startDate: new Date().toISOString().slice(0, 10),
    status: "Planning",
    remarks: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const handleChange = (field: string, value: any) => {
    if (field === "contactNumber") {
      value = value.replace(/\D/g, "").slice(0, 10);
      let error = "";
      if (!value) error = "Contact Number is required";
      else if (value.length !== 10) error = "Contact Number must contain exactly 10 digits";
      setErrors((prev) => ({ ...prev, contactNumber: error }));
    }
    setForm({ ...form, [field]: value });
  };

  const isValid = form.name.trim() && form.manager.trim() && form.client.trim() && /^\d{10}$/.test(form.contactNumber);

  const handlePreSave = () => {
    if (!isValid) return;

    let updatedHistory = [...form.managerHistory];

    // Check if the manager changed to log previous manager into deployment history
    if (initial && initial.manager && initial.manager !== form.manager) {
      const historyEntry: ManagerHistoryEntry = {
        managerName: initial.manager,
        changedAt: new Date().toISOString().slice(0, 10)
      };
      updatedHistory = [historyEntry, ...updatedHistory];
    }

    onSave({ ...form, managerHistory: updatedHistory });
  };

  return (
    <Modal title={title} onClose={onClose}>
      <div className="space-y-4">
        <div><label className="block text-xs font-semibold text-slate-500 mb-1 uppercase">Site Name *</label><input value={form.name} onChange={(e) => handleChange("name", e.target.value)} className="w-full border rounded-xl px-4 py-2.5 text-sm" /></div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-xs font-semibold text-slate-500 mb-1 uppercase">Region</label><select value={form.region} onChange={(e) => handleChange("region", e.target.value)} className="w-full border rounded-xl px-4 py-2.5 text-sm">{REGIONS.map(r => <option key={r}>{r}</option>)}</select></div>
          <div><label className="block text-xs font-semibold text-slate-500 mb-1 uppercase">Status</label><select value={form.status} onChange={(e) => handleChange("status", e.target.value)} className="w-full border rounded-xl px-4 py-2.5 text-sm">{Object.keys(STATUS_STYLES).map(s => <option key={s}>{s}</option>)}</select></div>
        </div>
        <div><label className="block text-xs font-semibold text-slate-500 mb-1 uppercase">Client *</label><input value={form.client} onChange={(e) => handleChange("client", e.target.value)} className="w-full border rounded-xl px-4 py-2.5 text-sm" /></div>
        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase">Site Manager *</label>
          <input value={form.manager} onChange={(e) => handleChange("manager", e.target.value)} className="w-full border rounded-xl px-4 py-2.5 text-sm" placeholder="Assign primary manager" />
          {initial?.manager && initial.manager !== form.manager && (
            <p className="mt-1 text-xs text-amber-600 flex items-center gap-1">
              <AlertCircle size={12} /> Changed manager. "{initial.manager}" will be archived to log history.
            </p>
          )}
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase">Contact Number</label>
          <input
            type="tel" value={form.contactNumber} inputMode="numeric" maxLength={10} placeholder="0771234567"
            onChange={(e) => handleChange("contactNumber", e.target.value)}
            onBlur={() => setTouched((prev) => ({ ...prev, contactNumber: true }))}
            className={`w-full border rounded-xl px-4 py-2.5 text-sm ${touched.contactNumber && errors.contactNumber ? "border-red-500" : ""}`}
          />
          {touched.contactNumber && errors.contactNumber && <p className="mt-1 text-xs text-red-500">{errors.contactNumber}</p>}
        </div>
        <div><label className="block text-xs font-semibold text-slate-500 mb-1 uppercase">Address</label><input value={form.address} onChange={(e) => handleChange("address", e.target.value)} className="w-full border rounded-xl px-4 py-2.5 text-sm" /></div>
        <div><label className="block text-xs font-semibold text-slate-500 mb-1 uppercase">Start Date</label><input type="date" value={form.startDate} onChange={(e) => handleChange("startDate", e.target.value)} className="w-full border rounded-xl px-4 py-2.5 text-sm" /></div>
        <div><label className="block text-xs font-semibold text-slate-500 mb-1 uppercase">Remarks</label><textarea rows={2} value={form.remarks} onChange={(e) => handleChange("remarks", e.target.value)} className="w-full border rounded-xl px-4 py-2.5 text-sm resize-none" /></div>
      </div>
      <div className="flex justify-end gap-3 mt-6 pt-2">
        <button onClick={onClose} className="btn">Cancel</button>
        <button
          onClick={() => { setTouched((p) => ({ ...p, contactNumber: true })); handlePreSave(); }}
          disabled={!isValid}
          className={`btn btn-primary ${!isValid ? "opacity-50 cursor-not-allowed" : ""}`}
        >{title.includes("Edit") ? "Save Changes" : "Add Site"}</button>
      </div>
    </Modal>
  );
}

// ─── Location Form Modal ─────────────────────────────────────────────────────

function LocationFormModal({ onClose, onSave, initial, isEdit = false }: any) {
  const [form, setForm] = useState(initial || {
    name: "",
    region: REGIONS[0],
    status: "Planning",
  });

  const isValid = form.name.trim();

  return (
    <Modal title={isEdit ? "Edit Location" : "Register New Location"} onClose={onClose}>
      <div className="space-y-4">
        <div><label className="block text-xs font-semibold text-slate-500 mb-1 uppercase">Location Name *</label><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full border rounded-xl px-4 py-2.5 text-sm" /></div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-xs font-semibold text-slate-500 mb-1 uppercase">Region</label><select value={form.region} onChange={(e) => setForm({ ...form, region: e.target.value })} className="w-full border rounded-xl px-4 py-2.5 text-sm">{REGIONS.map(r => <option key={r}>{r}</option>)}</select></div>
          <div><label className="block text-xs font-semibold text-slate-500 mb-1 uppercase">Status</label><select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="w-full border rounded-xl px-4 py-2.5 text-sm">{Object.keys(STATUS_STYLES).map(s => <option key={s}>{s}</option>)}</select></div>
        </div>
      </div>
      <div className="flex justify-end gap-3 mt-6 pt-2">
        <button onClick={onClose} className="btn">Cancel</button>
        <button
          onClick={() => { if (isValid) onSave(form); }}
          disabled={!isValid}
          className={`btn btn-primary ${!isValid ? "opacity-50 cursor-not-allowed" : ""}`}
        >{isEdit ? "Save Changes" : "Register Location"}</button>
      </div>
    </Modal>
  );
}

// ─── Location Detail Panel (Renders Child Logs & History Accordions) ──────────
//
// `onUpdate` performs a genuine PUT to persist edits (add/edit/delete site,
// change location fields). `onLocalUpdate` only updates React state in the
// parent — no network call — and is used after the assign-people /
// assign-vehicles endpoints, since those already persisted the change
// server-side. Reusing `onUpdate` there was the bug: it fired a redundant
// PUT that rebuilt subLevels and wiped the assignment that was just saved.

function LocationDetailPanel({ location, onUpdate, onLocalUpdate, onClose }: any) {
  const color = getLocationColor(location.id);
  const [modal, setModal] = useState<
    { type: "add" } | { type: "edit"; site: Site } | { type: "delete"; site: Site } | null
  >(null);
  const [showPeopleAssign, setShowPeopleAssign] = useState(false);
  const [showVehiclesAssign, setShowVehiclesAssign] = useState(false);
  const [assignSiteId, setAssignSiteId] = useState<string | null>(null);
  const [downloadingReport, setDownloadingReport] = useState(false);

  const handleDownloadReport = async () => {
    setDownloadingReport(true);
    try {
      const ok = await downloadPdf(`/site-locations/${location.id}/report`, `${location.id}-report.pdf`);
      if (!ok) alert("Couldn't generate the report. Please check your connection and try again.");
    } finally {
      setDownloadingReport(false);
    }
  };

  // Track open state for individual site histories in layout
  const [expandedHistories, setExpandedHistories] = useState<Record<string, boolean>>({});

  const toggleHistory = (siteId: string) => {
    setExpandedHistories(prev => ({ ...prev, [siteId]: !prev[siteId] }));
  };

  const updateLocation = (patch: Partial<Location>) => onUpdate({ ...location, ...patch });

  const handleAddSite = async (data: any) => {
    // No client-side id generation. The backend is the single source of
    // truth for sub-level ids (see normalizeSubLevels in
    // site-locations.service.ts) — it assigns a fresh, collision-free id
    // on save and the mapped response replaces this optimistic entry.
    const newSite = {
      ...data,
      managerHistory: [],
      assignedPersons: [],
      assignedVehicles: [],
    };
    await updateLocation({ sites: [...location.sites, newSite] });
    setModal(null);
  };

  const handleEditSite = async (data: any) => {
    if (modal?.type !== "edit") return;
    await updateLocation({
      sites: location.sites.map((s: Site) =>
        s.id && modal.site.id && s.id === modal.site.id ? { ...s, ...data } : s
      ),
    });
    setModal(null);
  };

  const handleDeleteSite = async () => {
    if (modal?.type !== "delete") return;
    await updateLocation({
      sites: location.sites.filter((s: Site) => s.id !== modal.site.id),
    });
    setModal(null);
  };

  return (
    <div className={`bg-white rounded-2xl border ${color.border} shadow-sm h-full flex flex-col overflow-hidden`}>
      <div className={`px-6 py-5 border-b ${color.headerBorder} ${color.headerBg} flex justify-between items-start`}>
        <div className="flex items-start gap-4">
          <div className={`w-12 h-12 rounded-xl ${color.avatarBg} ${color.avatarText} flex items-center justify-center text-lg font-black shadow-sm flex-shrink-0`}>
            {locationInitials(location.name)}
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className={`font-mono text-xs px-2 py-0.5 rounded-lg font-semibold ${color.idChip}`}>{location.id}</span>
              <Badge variant={STATUS_STYLES[location.status] as any}>{location.status}</Badge>
            </div>
            <h2 className="text-xl font-bold text-slate-800 leading-tight">{location.name}</h2>
            <p className={`text-sm font-medium ${color.accent} mt-0.5`}>{location.region}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleDownloadReport}
            disabled={downloadingReport}
            className={`btn btn-sm bg-slate-800 text-white hover:bg-slate-900 ${downloadingReport ? "opacity-60 cursor-wait" : ""}`}
          >
            <Download size={14} /> {downloadingReport ? "Preparing..." : "Download Report"}
          </button>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-white/70 text-slate-400"><X size={18} /></button>
        </div>
      </div>

      <div className="flex-1 p-6 flex flex-col overflow-hidden">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold text-slate-800 flex items-center gap-2">
            <FolderTree size={16} className={color.accent} /> Sites
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${color.idChip}`}>{location.sites.length}</span>
          </h3>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowPeopleAssign(true)} className="btn btn-sm bg-blue-600 text-white hover:bg-blue-700"><User size={14} /> Bulk Assign People</button>
            <button onClick={() => setShowVehiclesAssign(true)} className="btn btn-sm bg-purple-600 text-white hover:bg-purple-700"><Building2 size={14} /> Bulk Assign Vehicles</button>
            <button onClick={() => setModal({ type: "add" })} className="btn btn-sm btn-primary"><Plus size={14} /> Add Site</button>
          </div>
        </div>

        {location.sites.length === 0 ? (
          <div className={`flex-1 flex items-center justify-center border-2 border-dashed ${color.border} rounded-xl ${color.cardBg} text-slate-400 text-sm`}>
            No sites defined for this location.
          </div>
        ) : (
          <div className="space-y-4 overflow-auto pr-1">
            {location.sites.map((site: Site, index: number) => {
              // Fall back to index as the React key only — never as the
              // actual site id used for edit/delete matching — in case a
              // legacy record still slips through without one.
              const rowKey = site.id || `unindexed-${index}`;
              const isHistoryOpen = !!expandedHistories[rowKey];
              return (
                <div key={rowKey} className={`border ${color.subBorder} rounded-xl p-4 hover:shadow-sm transition-all group ${color.cardBg}`}>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className={`font-mono text-[10px] ${color.accent} font-semibold`}>{site.id || "—"}</span>
                        <Badge variant={STATUS_STYLES[site.status] as any}>{site.status}</Badge>
                      </div>
                      <h4 className="font-semibold text-slate-800 mt-0.5">{site.name}</h4>

                      <div className="grid grid-cols-2 gap-x-6 gap-y-1 mt-2 text-sm text-slate-600">
                        <div className="flex items-center gap-1.5 col-span-1">
                          <div><span className="font-medium">Manager:</span> {site.manager}</div>
                          {site.managerHistory && site.managerHistory.length > 0 && (
                            <button
                              type="button"
                              onClick={() => toggleHistory(rowKey)}
                              className="inline-flex items-center text-xs text-slate-400 hover:text-indigo-600 ml-1 bg-white border border-slate-200 shadow-sm rounded px-1 py-0.5 transition"
                              title="View History Log"
                            >
                              <History size={11} className="mr-0.5" />
                              {site.managerHistory.length}
                            </button>
                          )}
                        </div>
                        <div><span className="font-medium">Client:</span> {site.client}</div>
                        <div><span className="font-medium">Contact:</span> {site.contactNumber}</div>
                        <div><span className="font-medium">Start Date:</span> {site.startDate}</div>
                        <div className="col-span-2"><span className="font-medium">Address:</span> {site.address || "—"}</div>
                        {site.remarks && <div className="col-span-2"><span className="font-medium">Remarks:</span> {site.remarks}</div>}
                      </div>

                      {site.assignedPersons && site.assignedPersons.length > 0 && (
                        <div className="mt-3 text-sm text-slate-600">
                          <div className="font-medium text-slate-700">Assigned People:</div>
                          <div className="text-sm text-slate-500">{site.assignedPersons.map((p:any)=>p.name).join(', ')}</div>
                        </div>
                      )}

                      {site.assignedVehicles && site.assignedVehicles.length > 0 && (
                        <div className="mt-2 text-sm text-slate-600">
                          <div className="font-medium text-slate-700">Assigned Vehicles:</div>
                          <div className="text-sm text-slate-500">{site.assignedVehicles.map((v:any)=>v.vehiclePlate || v.id).join(', ')}</div>
                        </div>
                      )}

                      {/* Expanded Section for History Timeline */}
                      {isHistoryOpen && site.managerHistory && site.managerHistory.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-dashed border-slate-200 bg-white/70 p-2.5 rounded-lg">
                          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                            <Clock size={12} /> Previous Manager History
                          </div>
                          <div className="relative border-l border-slate-200 pl-3 ml-1.5 space-y-2">
                            {site.managerHistory.map((entry, idx) => (
                              <div key={idx} className="relative text-xs text-slate-600">
                                <div className="absolute -left-[16.5px] top-1 w-2 h-2 rounded-full bg-slate-300 ring-4 ring-white" />
                                <span className="font-semibold text-slate-700">{entry.managerName}</span>
                                <span className="text-slate-400 mx-1.5">•</span>
                                <span className="text-slate-400 font-mono">{entry.changedAt}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition flex-shrink-0 ml-2">
                      <button onClick={() => { setAssignSiteId(site.id || null); setShowPeopleAssign(true); }} title="Assign person" className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500"><UserPlus size={14} /></button>
                      <button onClick={() => setModal({ type: "edit", site })} className="p-1.5 rounded-lg hover:bg-white text-slate-500"><Edit2 size={14} /></button>
                      <button onClick={() => setModal({ type: "delete", site })} className="p-1.5 rounded-lg hover:bg-rose-50 text-rose-500"><Trash2 size={14} /></button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {modal?.type === "add" && <SiteModal title="Add Site" initial={{ name: "", manager: "", managerHistory: [], region: REGIONS[0], client: "", contactNumber: "", address: "", startDate: new Date().toISOString().slice(0, 10), status: "Planning", remarks: "" }} onClose={() => setModal(null)} onSave={handleAddSite} />}
      {modal?.type === "edit" && <SiteModal title="Edit Site" initial={modal.site} onClose={() => setModal(null)} onSave={handleEditSite} />}
      {modal?.type === "delete" && <ConfirmModal name={modal.site.name} onClose={() => setModal(null)} onConfirm={handleDeleteSite} />}

      {showPeopleAssign && (
        <Modal title="Bulk Assign People" onClose={() => { setShowPeopleAssign(false); setAssignSiteId(null); }}>
          <AssignPeopleForm
            sites={location.sites}
            locationId={location.id}
            initialSiteId={assignSiteId}
            onClose={() => { setShowPeopleAssign(false); setAssignSiteId(null); }}
              onAssigned={async (assignments?: any[]) => {
                if (Array.isArray(assignments)) {
                  // Assignment was already persisted by /assign-people.
                  // Just reflect it in local state — do NOT go through
                  // onUpdate (that fires a PUT that rebuilds subLevels
                  // and would strip this exact data back out).
                  const updated = { ...location, sites: location.sites.map((s: any) => {
                    const match = assignments.find(a => a.locationId === location.id && a.subLevelId === s.id);
                    return match ? { ...s, assignedPersons: Array.isArray(match.persons) ? match.persons : [] } : s;
                  }) };
                  onLocalUpdate && onLocalUpdate(updated);
                  return;
                }
                // fallback: fetch refreshed from server, again only a local sync
                const refreshed = await apiFetch('/site-locations');
                if (Array.isArray(refreshed)) {
                  const match = refreshed.find((r: any) => r.id === location.id);
                  if (match) onLocalUpdate && onLocalUpdate(mapBackendLocation(match));
                }
              }}
          />
        </Modal>
      )}

      {showVehiclesAssign && (
        <Modal title="Bulk Assign Vehicles" onClose={() => setShowVehiclesAssign(false)}>
          <AssignVehiclesForm
            sites={location.sites}
            locationId={location.id}
            onClose={() => setShowVehiclesAssign(false)}
            onAssigned={async (assignments?: any[]) => {
              if (Array.isArray(assignments)) {
                // Same reasoning as above — local sync only, already persisted.
                const updated = { ...location, sites: location.sites.map((s: any) => {
                  const match = assignments.find(a => a.locationId === location.id && a.subLevelId === s.id);
                  return match ? { ...s, assignedVehicles: Array.isArray(match.vehicles) ? match.vehicles : [] } : s;
                }) };
                onLocalUpdate && onLocalUpdate(updated);
                return;
              }
              const refreshed = await apiFetch('/site-locations');
              if (Array.isArray(refreshed)) {
                const match = refreshed.find((r: any) => r.id === location.id);
                if (match) onLocalUpdate && onLocalUpdate(mapBackendLocation(match));
              }
            }}
          />
        </Modal>
      )}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function LocationManagementPage() {
  const [locations, setLocations] = useState<Location[]>(SEED_LOCATIONS);
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [apiError, setApiError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showAddLocation, setShowAddLocation] = useState(false);
  const [editLocation, setEditLocation] = useState<Location | null>(null);
  const [deleteLocationTarget, setDeleteLocationTarget] = useState<Location | null>(null);
  const [downloadingAllReport, setDownloadingAllReport] = useState(false);

  const handleDownloadAllReport = async () => {
    setDownloadingAllReport(true);
    try {
      const ok = await downloadPdf(`/site-locations/reports/all`, `site-locations-report.pdf`);
      if (!ok) setApiError("Couldn't generate the full report. Please check your connection and try again.");
    } finally {
      setDownloadingAllReport(false);
    }
  };

  useEffect(() => {
    const loadLocations = async () => {
      try {
        setLoading(true);
        setApiError("");
        const result = await apiFetch("/site-locations");
        if (Array.isArray(result)) {
          const mapped = result.map(mapBackendLocation);
          setLocations(mapped);
          setSelectedLocationId((current) =>
            current && mapped.some((l) => l.id === current) ? current : mapped[0]?.id || null
          );
        }
      } catch (error: any) {
        console.warn("Load locations failed, using seed data", error);
        setApiError(error?.message || "Unable to load locations from backend.");
      } finally {
        setLoading(false);
      }
    };
    loadLocations();
  }, []);

  const filteredLocations = locations.filter((loc) => {
    const q = search.toLowerCase();
    const matchesSearch = loc.name.toLowerCase().includes(q) || loc.id.toLowerCase().includes(q);
    const matchesFilter = filterStatus === "All" || loc.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const handleAddLocation = async (data: any) => {
    try {
      setApiError("");
      const created = await apiFetch("/site-locations", { method: "POST", body: JSON.stringify(locationPayload({ ...data, sites: [] })) });
      const newLoc = mapBackendLocation(created);
      setLocations((prev) => [newLoc, ...prev]);
      setShowAddLocation(false);
      setSelectedLocationId(newLoc.id);
    } catch (error: any) {
      setApiError(error?.message || "Unable to create location.");
    }
  };

  const handleUpdateLocation = async (updated: Location) => {
    try {
      setApiError("");
      const saved = await apiFetch(`/site-locations/${updated.id}`, { method: "PUT", body: JSON.stringify(locationPayload(updated)) });
      const mapped = mapBackendLocation(saved);
      setLocations((prev) => prev.map((l) => l.id === mapped.id ? mapped : l));
    } catch (error: any) {
      setApiError(error?.message || "Unable to update location.");
    }
  };

  // Pure local state sync — no network call. Used after actions (like
  // bulk-assign) that already persisted their change through a dedicated
  // endpoint, so we just need the UI to reflect the new state.
  const handleLocalUpdateLocation = (updated: Location) => {
    setLocations((prev) => prev.map((l) => (l.id === updated.id ? updated : l)));
  };

  const handleDeleteLocation = async (id: string) => {
    try {
      setApiError("");
      await apiFetch(`/site-locations/${id}`, { method: "DELETE" });
      setLocations((prev) => prev.filter((l) => l.id !== id));
      if (selectedLocationId === id) setSelectedLocationId(null);
      setDeleteLocationTarget(null);
    } catch (error: any) {
      setApiError(error?.message || "Unable to delete location.");
    }
  };

  const selectedLocation = locations.find((l) => l.id === selectedLocationId);

  return (
    <div className="h-full flex gap-5">
      {/* ── Left: Location list ── */}
      <div className="w-96 flex-shrink-0 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
        <div className="p-4 border-b border-slate-100">
          {apiError && (
            <div className="mb-3 flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700">
              <AlertCircle size={14} className="mt-0.5 flex-shrink-0" /><span>{apiError}</span>
            </div>
          )}
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input type="text" placeholder="Search locations..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50 focus:bg-white" />
          </div>
          <div className="flex flex-wrap gap-2 mt-3">
            {["All", ...Object.keys(STATUS_STYLES)].map((st) => (
              <button key={st} onClick={() => setFilterStatus(st)}
                className={`px-3 py-1 text-xs rounded-full font-medium transition ${filterStatus === st ? "bg-slate-700 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
                {st}
              </button>
            ))}
          </div>
          <div className="flex gap-2 mt-4">
            <button onClick={() => setShowAddLocation(true)} className="btn btn-primary flex-1"><Plus size={14} /> New Location</button>
            <button
              onClick={handleDownloadAllReport}
              disabled={downloadingAllReport}
              title="Download a detailed PDF report for every location"
              className={`btn bg-slate-800 text-white hover:bg-slate-900 ${downloadingAllReport ? "opacity-60 cursor-wait" : ""}`}
            >
              <Download size={14} /> {downloadingAllReport ? "..." : "Download All"}
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {loading ? (
            <div className="py-10 text-center text-sm text-slate-400">Loading locations...</div>
          ) : filteredLocations.length === 0 ? (
            <div className="py-10 text-center text-sm text-slate-400">No locations found.</div>
          ) : filteredLocations.map((loc) => {
            const color = getLocationColor(loc.id);
            const isSelected = selectedLocationId === loc.id;
            return (
              <div
                key={loc.id}
                onClick={() => setSelectedLocationId(loc.id)}
                className={`p-3 rounded-xl border cursor-pointer transition-all hover:shadow-sm
                  ${isSelected ? color.activeCard : "border-slate-200 hover:border-slate-300 bg-white"}`}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-9 h-9 rounded-lg ${color.avatarBg} ${color.avatarText} flex items-center justify-center text-[13px] font-black flex-shrink-0 shadow-sm`}>
                    {locationInitials(loc.name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start gap-1">
                      <div>
                        <div className={`font-mono text-[10px] font-semibold ${color.accent}`}>{loc.id}</div>
                        <div className="font-semibold text-slate-800 text-sm leading-tight truncate">{loc.name}</div>
                        <div className="text-xs text-slate-500 mt-0.5">{loc.region}</div>
                      </div>
                      <Badge variant={STATUS_STYLES[loc.status] as any}>{loc.status}</Badge>
                    </div>
                    <div className="flex justify-between items-center mt-2 text-xs text-slate-400">
                      <span className={`${color.accent} font-medium`}>{loc.sites.length} sites</span>
                      <div className="flex gap-1">
                        <button onClick={(e) => { e.stopPropagation(); setEditLocation(loc); }} className="p-1 rounded hover:bg-slate-100"><Edit2 size={12} /></button>
                        <button onClick={(e) => { e.stopPropagation(); setDeleteLocationTarget(loc); }} className="p-1 rounded hover:bg-rose-50 text-rose-500"><Trash2 size={12} /></button>
                      </div>
                    </div>
                  </div>
                </div>
                {isSelected && <div className={`mt-2 h-0.5 rounded-full ${color.avatarBg} opacity-50`} />}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Right: Detail panel ── */}
      <div className="flex-1 min-w-0">
        {selectedLocation ? (
          <LocationDetailPanel
            location={selectedLocation}
            onUpdate={handleUpdateLocation}
            onLocalUpdate={handleLocalUpdateLocation}
            onClose={() => setSelectedLocationId(null)}
          />
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm h-full flex flex-col items-center justify-center text-slate-400">
            <Building2 size={48} className="mb-3 opacity-30" />
            <p className="text-sm font-medium">Select a location to view its sites</p>
          </div>
        )}
      </div>

      {/* Modals */}
      {showAddLocation && <LocationFormModal onClose={() => setShowAddLocation(false)} onSave={handleAddLocation} />}
      {editLocation && <LocationFormModal isEdit initial={editLocation} onClose={() => setEditLocation(null)} onSave={async (data: any) => { await handleUpdateLocation({ ...editLocation, ...data }); setEditLocation(null); }} />}
      {deleteLocationTarget && <ConfirmModal name={deleteLocationTarget.name} onClose={() => setDeleteLocationTarget(null)} onConfirm={() => handleDeleteLocation(deleteLocationTarget.id)} />}
    </div>
  );
}

// ─── Bulk Assign Forms (used by LocationDetailPanel) ─────────────────────
function AssignPeopleForm({ sites, onClose, onAssigned, initialSiteId, locationId }: any) {
  const [employees, setEmployees] = useState<any[]>([]);
  const [selectedSites, setSelectedSites] = useState<Set<string>>(new Set());
  const [selectedPersons, setSelectedPersons] = useState<Set<string>>(new Set());
  const [banner, setBanner] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  useEffect(() => { (async () => { try { const res = await apiFetch('/employees'); if (Array.isArray(res)) setEmployees(res); } catch {} })(); }, []);

  // If an initial site was provided (single-site assign), preselect it
  useEffect(() => {
    if (initialSiteId) {
      setSelectedSites(new Set([initialSiteId]));
    }
  }, [initialSiteId]);

  const toggleSite = (id: string) => { const s = new Set(selectedSites); s.has(id) ? s.delete(id) : s.add(id); setSelectedSites(s); };
  const togglePerson = (id: string) => { const s = new Set(selectedPersons); s.has(id) ? s.delete(id) : s.add(id); setSelectedPersons(s); };

  const handleAssign = async (download = false) => {
    const persons = Array.from(selectedPersons).map(id => { const e = employees.find((x:any)=>x.id===id); return { id, name: e?.fullName || e?.name || '' }; });
    // selectedSites are sub-level ids; include parent locationId and subLevelId
    const targets = Array.from(selectedSites).map(subLevelId => ({ locationId: locationId || '', subLevelId }));
    if (persons.length === 0 || targets.length === 0) { setBanner({ type: 'error', message: 'Select at least one site and one person' }); return; }
    const assignments = targets.map(t => ({ locationId: t.locationId, subLevelId: t.subLevelId, persons }));
    try {
      if (!download) {
        await apiFetch('/site-locations/assign-people', { method: 'POST', body: JSON.stringify({ assignments }) });
        setBanner({ type: 'success', message: 'People assigned' });
        await new Promise((r) => setTimeout(r, 700));
        onAssigned && onAssigned(assignments);
        onClose();
        return;
      }

      // Download flow: try known base URLs until a blob is returned
      const candidates = [API_BASE_URL, 'http://localhost:5001/api', 'http://localhost:5002/api'];
      let ok = false;
      for (const base of candidates) {
        try {
          const resp = await fetch(`${base}/site-locations/assign-people?download=true`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ assignments }) });
          if (!resp.ok) continue;
          const blob = await resp.blob();
          const u = URL.createObjectURL(blob);
          const a = document.createElement('a'); a.href = u; a.download = 'site-people-assignments.pdf'; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(u);
          ok = true; break;
        } catch (e) {
          console.warn('download try failed', base, e);
        }
      }
      if (!ok) throw new Error('Download failed (no reachable API)');
      setBanner({ type: 'success', message: 'PDF downloaded' });
      await new Promise((r) => setTimeout(r, 700));
      onClose();
    } catch (err:any) { console.error(err); setBanner({ type: 'error', message: err?.message || 'Failed' }); }
  };

  return (
    <div>
      {banner && (
        <div className={`mb-3 p-2 rounded border ${banner.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'}`}>
          <div className="flex justify-between items-center text-sm">
            <div>{banner.message}</div>
            <button onClick={() => setBanner(null)} className="text-xs opacity-70">Close</button>
          </div>
        </div>
      )}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-sm font-semibold mb-2">Select Site</p>
          <div className="max-h-64 overflow-auto border rounded p-2">
            {sites.map((s:any)=> (
              <div key={s.id} className="mb-2"><label><input type="checkbox" checked={selectedSites.has(s.id)} onChange={()=>toggleSite(s.id)} className="mr-2" /> {s.name} ({s.id})</label></div>
            ))}
          </div>
        </div>
        <div>
          <p className="text-sm font-semibold mb-2">Select People</p>
          <div className="max-h-64 overflow-auto border rounded p-2">
            {employees.map((e:any)=> (<div key={e.id} className="mb-1"><label><input type="checkbox" checked={selectedPersons.has(e.id)} onChange={()=>togglePerson(e.id)} className="mr-2" /> {e.fullName || e.name}</label></div>))}
          </div>
        </div>
      </div>
      <div className="flex justify-end gap-2 mt-4">
        <button className="btn" onClick={() => handleAssign(false)}>Assign</button>
        <button className="btn" onClick={() => handleAssign(true)}>Download PDF</button>
      </div>
    </div>
  );
}

function AssignVehiclesForm({ sites, onClose, onAssigned, locationId }: any) {
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [selectedSites, setSelectedSites] = useState<Set<string>>(new Set());
  const [selectedVehicles, setSelectedVehicles] = useState<Set<string>>(new Set());
  const [banner, setBanner] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  useEffect(() => { (async () => { try { const res = await apiFetch('/vehicles'); if (Array.isArray(res)) setVehicles(res); } catch {} })(); }, []);
  const toggleSite = (id: string) => { const s = new Set(selectedSites); s.has(id) ? s.delete(id) : s.add(id); setSelectedSites(s); };
  const toggleVehicle = (id: string) => { const s = new Set(selectedVehicles); s.has(id) ? s.delete(id) : s.add(id); setSelectedVehicles(s); };
  const handleAssign = async (download = false) => {
    const vehs = Array.from(selectedVehicles).map(id => { const v = vehicles.find((x:any)=>x.id===id); return { id, vehiclePlate: v?.registrationNo || v?.vehiclePlate || '' }; });
    // selectedSites are sub-level ids; include parent locationId and subLevelId
    const targets = Array.from(selectedSites).map(subLevelId => ({ locationId: locationId || '', subLevelId }));
    if (vehs.length === 0 || targets.length === 0) { setBanner({ type: 'error', message: 'Select at least one site and one vehicle' }); return; }
    const assignments = targets.map(t => ({ locationId: t.locationId, subLevelId: t.subLevelId, vehicles: vehs }));
    try {
      if (!download) {
        await apiFetch('/site-locations/assign-vehicles', { method: 'POST', body: JSON.stringify({ assignments }) });
        setBanner({ type: 'success', message: 'Vehicles assigned' });
        await new Promise((r) => setTimeout(r, 700));
        onAssigned && onAssigned(assignments);
        onClose();
        return;
      }
      const candidates = [API_BASE_URL, 'http://localhost:5001/api', 'http://localhost:5002/api'];
      let ok = false;
      for (const base of candidates) {
        try {
          const resp = await fetch(`${base}/site-locations/assign-vehicles?download=true`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ assignments }) });
          if (!resp.ok) continue;
          const blob = await resp.blob(); const u = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = u; a.download = 'site-vehicles-assignments.pdf'; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(u);
          ok = true; break;
        } catch (e) { console.warn('download try failed', base, e); }
      }
      if (!ok) throw new Error('Download failed (no reachable API)');
      setBanner({ type: 'success', message: 'PDF downloaded' });
      await new Promise((r) => setTimeout(r, 700));
      onClose();
    } catch (err:any) { setBanner({ type: 'error', message: err?.message || 'Failed' }); }
  };
  return (
    <div>
      {banner && (
        <div className={`mb-3 p-2 rounded border ${banner.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'}`}>
          <div className="flex justify-between items-center text-sm">
            <div>{banner.message}</div>
            <button onClick={() => setBanner(null)} className="text-xs opacity-70">Close</button>
          </div>
        </div>
      )}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-sm font-semibold mb-2">Select Site</p>
          <div className="max-h-64 overflow-auto border rounded p-2">
            {sites.map((s:any)=> (<div key={s.id} className="mb-2"><label><input type="checkbox" checked={selectedSites.has(s.id)} onChange={()=>toggleSite(s.id)} className="mr-2" /> {s.name} ({s.id})</label></div>))}
          </div>
        </div>
        <div>
          <p className="text-sm font-semibold mb-2">Select Vehicles</p>
          <div className="max-h-64 overflow-auto border rounded p-2">
            {vehicles.map((v:any)=> (<div key={v.id} className="mb-1"><label><input type="checkbox" checked={selectedVehicles.has(v.id)} onChange={()=>toggleVehicle(v.id)} className="mr-2" /> {v.registrationNo || v.vehiclePlate || v.plate || v.id}</label></div>))}
          </div>
        </div>
      </div>
      <div className="flex justify-end gap-2 mt-4">
        <button className="btn" onClick={() => handleAssign(false)}>Assign</button>
        <button className="btn" onClick={() => handleAssign(true)}>Download PDF</button>
      </div>
    </div>
  );
}