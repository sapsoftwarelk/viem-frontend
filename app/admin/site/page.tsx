"use client";

import { useEffect, useState } from "react";
import { apiFetch, API_BASE_URL } from "../../../lib/api";
import {
  Plus, Search, Edit2, Trash2, X,
  Building2, MapPin, Phone, Calendar, Clock,
  FolderTree, AlertCircle, User, History, Users,
  Download, UserX, Truck, ArrowRightLeft, HistoryIcon
} from "lucide-react";
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
    dot:          "bg-violet-500",
    ring:         "ring-violet-300",
    border:       "border-violet-300",
    cardBg:       "bg-violet-50/40",
    headerBg:     "bg-violet-50",
    headerBorder: "border-violet-200",
    avatarBg:     "bg-violet-500",
    avatarText:   "text-white",
    accent:       "text-violet-600",
    activeCard:   "border-violet-400 bg-violet-50/50",
    filterActive: "bg-violet-600",
    idChip:       "bg-violet-100 text-violet-700",
    subBorder:    "border-violet-100",
  },
  {
    dot:          "bg-sky-500",
    ring:         "ring-sky-300",
    border:       "border-sky-300",
    cardBg:       "bg-sky-50/40",
    headerBg:     "bg-sky-50",
    headerBorder: "border-sky-200",
    avatarBg:     "bg-sky-500",
    avatarText:   "text-white",
    accent:       "text-sky-600",
    activeCard:   "border-sky-400 bg-sky-50/50",
    filterActive: "bg-sky-600",
    idChip:       "bg-sky-100 text-sky-700",
    subBorder:    "border-sky-100",
  },
  {
    dot:          "bg-emerald-500",
    ring:         "ring-emerald-300",
    border:       "border-emerald-300",
    cardBg:       "bg-emerald-50/40",
    headerBg:     "bg-emerald-50",
    headerBorder: "border-emerald-200",
    avatarBg:     "bg-emerald-500",
    avatarText:   "text-white",
    accent:       "text-emerald-600",
    activeCard:   "border-emerald-400 bg-emerald-50/50",
    filterActive: "bg-emerald-600",
    idChip:       "bg-emerald-100 text-emerald-700",
    subBorder:    "border-emerald-100",
  },
  {
    dot:          "bg-rose-500",
    ring:         "ring-rose-300",
    border:       "border-rose-300",
    cardBg:       "bg-rose-50/40",
    headerBg:     "bg-rose-50",
    headerBorder: "border-rose-200",
    avatarBg:     "bg-rose-500",
    avatarText:   "text-white",
    accent:       "text-rose-600",
    activeCard:   "border-rose-400 bg-rose-50/50",
    filterActive: "bg-rose-600",
    idChip:       "bg-rose-100 text-rose-700",
    subBorder:    "border-rose-100",
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

// ─── Data helpers ──────────────────────────────────────────────────────────────

function mapBackendLocation(location: any): Location {
  const sites = Array.isArray(location.subLevels) ? location.subLevels : [];
  return {
    id: location.id,
    name: location.siteName || location.name || "",
    status: location.status || "Planning",
    region: location.region || "",
    sites: sites
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
        assignedPersons: [],
        assignedVehicles: [],
      })),
  };
}

function locationPayload(location: Partial<Location>) {
  return {
    siteName: location.name,
    status: location.status,
    region: location.region,
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
    })) || [],
  };
}

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

// ─── Shared Modals ────────────────────────────────────────────────────────────

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
    <Modal title="Confirm Action" onClose={onClose}>
      <p className="text-slate-600">
        Are you sure you want to proceed with <strong className="text-rose-600">{name}</strong>? This action cannot be undone.
      </p>
      <div className="flex justify-end gap-3 mt-6">
        <button onClick={onClose} className="btn">Cancel</button>
        <button onClick={onConfirm} className="btn btn-danger">Confirm</button>
      </div>
    </Modal>
  );
}

// ─── Resource Assignment History Modal ───────────────────────────────────────

function ResourceHistoryModal({ resource, resourceType, onClose }: { resource: any; resourceType: "EMPLOYEE" | "VEHICLE"; onClose: () => void }) {
  const [history, setHistory] = useState<any[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
  setHistory(Array.isArray(res) ? res : []);
} catch (error) {
  setHistory([]);
} finally {
  setLoading(false);
}
    })();
  }, [resource.id, resourceType]);

  return (
    <Modal title={`Allocation History — ${resource.name || resource.vehiclePlate}`} onClose={onClose}>
      <div className="space-y-3">
        {loading ? (
          <div className="py-8 text-center text-xs text-slate-400">Loading history logs...</div>
        ) : !history || history.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400">No allocation history recorded for this {resourceType.toLowerCase()}.</div>
        ) : (
          <div className="relative border-l-2 border-indigo-100 pl-4 ml-2 space-y-4">
            {history.map((entry, idx) => (
              <div key={idx} className="relative text-xs">
                <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-indigo-600 ring-4 ring-white" />
                <div className="font-semibold text-slate-800 text-sm">
                  {entry.status === "ACTIVE" ? `Assigned to Site: ${entry.siteSubId || "General"}` : `Status: ${entry.status}`}
                </div>
                {entry.locationId && <div className="text-slate-500">Location ID: {entry.locationId}</div>}
                <div className="text-slate-400 font-mono mt-0.5">
                  {new Date(entry.createdAt).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="flex justify-end mt-6">
        <button onClick={onClose} className="btn btn-primary">Close</button>
      </div>
    </Modal>
  );
}

// ─── Transfer Modal ───────────────────────────────────────────────────────────

function TransferModal({ resource, resourceType, locations, currentSiteId, onClose, onTransfer }: any) {
  const [targetLocationId, setTargetLocationId] = useState("");
  const [targetSiteId, setTargetSiteId] = useState("");

  const availableLocations = locations || [];
  const selectedLoc = availableLocations.find((l: any) => l.id === targetLocationId);
  const availableSites = selectedLoc ? selectedLoc.sites.filter((s: any) => s.id !== currentSiteId) : [];

  const handleExecuteTransfer = () => {
    if (!targetLocationId || !targetSiteId) return;
    onTransfer(resource.id, resourceType, targetLocationId, targetSiteId);
  };

  return (
    <Modal title={`Transfer ${resourceType}: ${resource.name || resource.vehiclePlate}`} onClose={onClose}>
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase">Target Location *</label>
          <select
            value={targetLocationId}
            onChange={(e) => { setTargetLocationId(e.target.value); setTargetSiteId(""); }}
            className="w-full border rounded-xl px-4 py-2.5 text-sm"
          >
            <option value="">-- Select Location --</option>
            {availableLocations.map((loc: any) => (
              <option key={loc.id} value={loc.id}>{loc.name} ({loc.region})</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase">Target Site *</label>
          <select
            value={targetSiteId}
            disabled={!targetLocationId || availableSites.length === 0}
            onChange={(e) => setTargetSiteId(e.target.value)}
            className="w-full border rounded-xl px-4 py-2.5 text-sm disabled:bg-slate-100"
          >
            <option value="">-- Select Site --</option>
            {availableSites.map((s: any) => (
              <option key={s.id} value={s.id}>{s.name} ({s.id})</option>
            ))}
          </select>
          {targetLocationId && availableSites.length === 0 && (
            <p className="text-xs text-amber-600 mt-1">No alternative active sites available in this location.</p>
          )}
        </div>
      </div>

      <div className="flex justify-end gap-3 mt-6">
        <button onClick={onClose} className="btn">Cancel</button>
        <button
          onClick={handleExecuteTransfer}
          disabled={!targetLocationId || !targetSiteId}
          className="btn btn-primary disabled:opacity-50"
        >
          Execute Transfer
        </button>
      </div>
    </Modal>
  );
}

// ─── Site Modal ───────────────────────────────────────────────────────────────

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

// ─── Location Detail Panel ───────────────────────────────────────────────────

function LocationDetailPanel({ location, locations, onUpdate, onAllocationChange, onClose }: any) {
  const color = getLocationColor(location.id);
  const [modal, setModal] = useState<
    { type: "add" } | { type: "edit"; site: Site } | { type: "delete"; site: Site } | null
  >(null);
  const [transferState, setTransferState] = useState<{ resource: any; resourceType: "EMPLOYEE" | "VEHICLE"; siteId: string } | null>(null);
  const [historyResource, setHistoryResource] = useState<{ resource: any; resourceType: "EMPLOYEE" | "VEHICLE" } | null>(null);
  const [showAllocationMatrix, setShowAllocationMatrix] = useState(false);
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

  const [expandedHistories, setExpandedHistories] = useState<Record<string, boolean>>({});

  const toggleHistory = (siteId: string) => {
    setExpandedHistories(prev => ({ ...prev, [siteId]: !prev[siteId] }));
  };

  const updateLocation = (patch: Partial<Location>) => onUpdate({ ...location, ...patch });

  const handleAddSite = async (data: any) => {
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
    
    if (modal.site.assignedPersons.length > 0 || modal.site.assignedVehicles.length > 0) {
      alert(`Cannot delete site "${modal.site.name}". Please unassign or transfer active employees and vehicles first.`);
      return;
    }

    await updateLocation({
      sites: location.sites.filter((s: Site) => s.id !== modal.site.id),
    });
    setModal(null);
  };

  const handleUnassignResource = async (resourceId: string, resourceType: "EMPLOYEE" | "VEHICLE") => {
    if (!window.confirm(`Are you sure you want to unassign this ${resourceType.toLowerCase()}?`)) return;
    try {
      await apiFetch(`/allocations/${encodeURIComponent(resourceId)}`, {
        method: "PUT",
        body: JSON.stringify({ resourceType, status: "IDLE", locationId: null, siteSubId: null }),
      });
      onAllocationChange();
    } catch (err) {
      alert(`Failed to unassign ${resourceType.toLowerCase()}`);
    }
  };

  const handleExecuteTransfer = async (resourceId: string, resourceType: "EMPLOYEE" | "VEHICLE", targetLocationId: string, targetSiteId: string) => {
    try {
      await apiFetch(`/allocations/${encodeURIComponent(resourceId)}`, {
        method: "PUT",
        body: JSON.stringify({
          resourceType,
          status: "ACTIVE",
          locationId: targetLocationId,
          siteSubId: targetSiteId,
        }),
      });
      setTransferState(null);
      onAllocationChange();
    } catch (err) {
      alert(`Failed to transfer ${resourceType.toLowerCase()}`);
    }
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
            <button onClick={() => setShowAllocationMatrix(true)} className="btn btn-sm bg-emerald-600 text-white hover:bg-emerald-700"><Users size={14} /> Allocation Matrix</button>
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

                      {/* Assigned Persons with Direct Actions and History */}
                      <div className="mt-3 text-sm">
                        <div className="font-semibold text-slate-700 text-xs uppercase tracking-wider mb-1.5 flex items-center gap-1">
                          <User size={12} /> Assigned Personnel ({site.assignedPersons?.length || 0})
                        </div>
                        {site.assignedPersons && site.assignedPersons.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {site.assignedPersons.map((p) => (
                              <div key={p.id} className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white border border-slate-200 shadow-sm rounded-lg text-xs font-medium text-slate-700">
                                <span>{p.name}</span>
                                <button
                                  onClick={() => setHistoryResource({ resource: p, resourceType: "EMPLOYEE" })}
                                  title="View Full Person History"
                                  className="text-slate-400 hover:text-indigo-600 p-0.5 rounded hover:bg-indigo-50"
                                >
                                  <Clock size={12} />
                                </button>
                                <button
                                  onClick={() => setTransferState({ resource: p, resourceType: "EMPLOYEE", siteId: site.id })}
                                  title="Transfer Person to Another Site"
                                  className="text-slate-400 hover:text-indigo-600 p-0.5 rounded hover:bg-slate-50"
                                >
                                  <ArrowRightLeft size={12} />
                                </button>
                                <button
                                  onClick={() => handleUnassignResource(p.id, "EMPLOYEE")}
                                  title="Unassign Person"
                                  className="text-slate-400 hover:text-rose-600 p-0.5 rounded hover:bg-rose-50"
                                >
                                  <UserX size={12} />
                                </button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-slate-400 italic">No personnel currently assigned.</p>
                        )}
                      </div>

                      {/* Assigned Vehicles with Direct Actions and History */}
                      <div className="mt-3 text-sm">
                        <div className="font-semibold text-slate-700 text-xs uppercase tracking-wider mb-1.5 flex items-center gap-1">
                          <Truck size={12} /> Assigned Vehicles ({site.assignedVehicles?.length || 0})
                        </div>
                        {site.assignedVehicles && site.assignedVehicles.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {site.assignedVehicles.map((v) => (
                              <div key={v.id} className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white border border-slate-200 shadow-sm rounded-lg text-xs font-medium text-slate-700">
                                <span>{v.vehiclePlate}</span>
                                <button
                                  onClick={() => setHistoryResource({ resource: v, resourceType: "VEHICLE" })}
                                  title="View Full Vehicle History"
                                  className="text-slate-400 hover:text-indigo-600 p-0.5 rounded hover:bg-indigo-50"
                                >
                                  <Clock size={12} />
                                </button>
                                <button
                                  onClick={() => setTransferState({ resource: v, resourceType: "VEHICLE", siteId: site.id })}
                                  title="Transfer Vehicle to Another Site"
                                  className="text-slate-400 hover:text-indigo-600 p-0.5 rounded hover:bg-slate-50"
                                >
                                  <ArrowRightLeft size={12} />
                                </button>
                                <button
                                  onClick={() => handleUnassignResource(v.id, "VEHICLE")}
                                  title="Unassign Vehicle"
                                  className="text-slate-400 hover:text-rose-600 p-0.5 rounded hover:bg-rose-50"
                                >
                                  <X size={12} />
                                </button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-slate-400 italic">No vehicles currently assigned.</p>
                        )}
                      </div>

                      {/* Expanded Manager History */}
                      {isHistoryOpen && site.managerHistory && site.managerHistory.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-dashed border-slate-200 bg-white/70 p-2.5 rounded-lg">
                          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                            <Clock size={12} /> Manager History
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

      {transferState && (
        <TransferModal
          resource={transferState.resource}
          resourceType={transferState.resourceType}
          locations={locations}
          currentSiteId={transferState.siteId}
          onClose={() => setTransferState(null)}
          onTransfer={handleExecuteTransfer}
        />
      )}

      {historyResource && (
        <ResourceHistoryModal
          resource={historyResource.resource}
          resourceType={historyResource.resourceType}
          onClose={() => setHistoryResource(null)}
        />
      )}

      {showAllocationMatrix && (
        <Modal title={`Daily Allocation Matrix — ${location.name}`} onClose={() => setShowAllocationMatrix(false)}>
          <AllocationMatrix location={location} onClose={() => setShowAllocationMatrix(false)} onAllocationChange={onAllocationChange} />
        </Modal>
      )}
    </div>
  );
}

// ─── Allocation Matrix ────────────────────────────────────────────────────────

// ─── Allocation Matrix ────────────────────────────────────────────────────────

function AllocationMatrix({ location, onClose, onAllocationChange }: any) {
  const [activeTab, setActiveTab] = useState<'EMPLOYEE' | 'VEHICLE'>('EMPLOYEE');
  const [employees, setEmployees] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [allocations, setAllocations] = useState<any[]>([]);
  const [historyEntries, setHistoryEntries] = useState<any[] | null>(null);
  const [historyOpenFor, setHistoryOpenFor] = useState<{ id: string; type: 'EMPLOYEE' | 'VEHICLE' } | null>(null);

  const columns = [
    { id: 'IDLE', label: 'Idle' },
    ...((location.sites || []).map((s: any) => ({ id: s.id, label: s.name }))),
    { id: 'REPAIR', label: 'Repair Places' },
    { id: 'ABSENT', label: 'Absent' },
  ];

  useEffect(() => {
    (async () => {
      try {
        const [emps, vehs, allocs] = await Promise.all([
          apiFetch('/employees'),
          apiFetch('/vehicles'),
          apiFetch('/allocations'),
        ]);
        if (Array.isArray(emps)) setEmployees(emps);
        if (Array.isArray(vehs)) setVehicles(vehs);
        if (Array.isArray(allocs)) setAllocations(allocs);
      } catch (e) {
        console.error("Allocation fetch failed", e);
      }
    })();
  }, []);

  const getAllocation = (resourceId: string, resourceType: string) =>
    allocations.find((a: any) => a.resourceId === resourceId && a.resourceType === resourceType) || null;

  const handleSet = async (resourceId: string, resourceType: 'EMPLOYEE' | 'VEHICLE', columnId: string) => {
    const payload: any = { resourceType, status: columnId };
    let targetLabel = columnId;

    if (columnId === 'IDLE' || columnId === 'ABSENT') {
      payload.locationId = null;
      payload.siteSubId = null;
      targetLabel = columnId;
    } else if (columnId === 'REPAIR') {
      payload.locationId = location.id;
      payload.siteSubId = null;
      targetLabel = `Repair places @ ${location.name}`;
    } else {
      payload.locationId = location.id;
      payload.siteSubId = columnId;
      payload.status = 'ACTIVE';
      const site = (location.sites || []).find((s: any) => s.id === columnId);
      targetLabel = site ? `${site.name} (${site.id}) @ ${location.name}` : `${columnId} @ ${location.name}`;
    }

    const resourceName = resourceType === 'EMPLOYEE'
      ? (employees.find((x: any) => x.id === resourceId)?.fullName || resourceId)
      : (vehicles.find((x: any) => x.id === resourceId)?.registrationNo || resourceId);

    const ok = window.confirm(`Assign ${resourceType.toLowerCase()} "${resourceName}" to ${targetLabel}?`);
    if (!ok) return;

    try {
      const res = await apiFetch(`/allocations/${encodeURIComponent(resourceId)}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });

      setAllocations((prev) => {
        const others = prev.filter((p: any) => !(p.resourceId === resourceId && p.resourceType === resourceType));
        return [res, ...others];
      });

      onAllocationChange();
    } catch (e) {
      console.error('Allocation update failed', e);
      alert('Failed to update allocation');
    }
  };

  const openHistory = async (resourceId: string, resourceType: 'EMPLOYEE' | 'VEHICLE') => {
    setHistoryOpenFor({ id: resourceId, type: resourceType });
    try {
      const res = await apiFetch(`/allocations/${encodeURIComponent(resourceId)}/history?type=${resourceType}`);
      setHistoryEntries(Array.isArray(res) ? res : []);
    } catch (e) {
      setHistoryEntries([]);
    }
  };

  // Metric Calculators
  const getStats = (type: 'EMPLOYEE' | 'VEHICLE') => {
    const list = type === 'EMPLOYEE' ? employees : vehicles;
    let active = 0, idle = 0, repair = 0, absent = 0;

    list.forEach((item) => {
      const alloc = getAllocation(item.id, type);
      if (!alloc || alloc.status === 'IDLE') idle++;
      else if (alloc.status === 'ACTIVE') active++;
      else if (alloc.status === 'REPAIR') repair++;
      else if (alloc.status === 'ABSENT') absent++;
    });

    return { total: list.length, active, idle, repair, absent };
  };

  const currentStats = getStats(activeTab);

  return (
    <div className="space-y-4">
      {/* Tab Switcher & Navigation */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-2">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('EMPLOYEE')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'EMPLOYEE'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <User size={14} /> Personnel ({employees.length})
          </button>
          <button
            onClick={() => setActiveTab('VEHICLE')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'VEHICLE'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Truck size={14} /> Fleet & Vehicles ({vehicles.length})
          </button>
        </div>
      </div>

      {/* Resource Metrics Bar */}
      <div className="grid grid-cols-4 gap-3">
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-center">
          <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Total Units</div>
          <div className="text-lg font-bold text-slate-800">{currentStats.total}</div>
        </div>
        <div className="bg-emerald-50/60 border border-emerald-200 rounded-xl p-2.5 text-center">
          <div className="text-[10px] font-semibold text-emerald-600 uppercase tracking-wider">Active</div>
          <div className="text-lg font-bold text-emerald-700">{currentStats.active}</div>
        </div>
        <div className="bg-amber-50/60 border border-amber-200 rounded-xl p-2.5 text-center">
          <div className="text-[10px] font-semibold text-amber-600 uppercase tracking-wider">Idle</div>
          <div className="text-lg font-bold text-amber-700">{currentStats.idle}</div>
        </div>
        <div className="bg-rose-50/60 border border-rose-200 rounded-xl p-2.5 text-center">
          <div className="text-[10px] font-semibold text-rose-600 uppercase tracking-wider">Repair / Absent</div>
          <div className="text-lg font-bold text-rose-700">{currentStats.repair + currentStats.absent}</div>
        </div>
      </div>

      <p className="text-xs text-slate-500 italic">
        Click a cell to set global state for {activeTab === 'EMPLOYEE' ? 'personnel' : 'vehicles'}. Each resource is limited to one active location state.
      </p>

      {/* Allocation Matrix Table */}
      <div className="overflow-x-auto border rounded-2xl shadow-sm bg-white">
        <table className="w-full border-collapse text-xs">
          <thead>
            <tr className="bg-slate-100/70 border-b border-slate-200">
              <th className="p-3 text-left font-bold text-slate-700 min-w-[160px] sticky left-0 bg-slate-100 z-10 border-r border-slate-200">
                {activeTab === 'EMPLOYEE' ? 'Employee Name' : 'Vehicle Plate / Reg No'}
              </th>
              {columns.map((c) => (
                <th key={c.id} className="p-3 text-center font-bold text-slate-700 min-w-[110px]">
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {activeTab === 'EMPLOYEE' ? (
              employees.length === 0 ? (
                <tr>
                  <td colSpan={columns.length + 1} className="p-6 text-center text-slate-400 italic">
                    No employees registered in system.
                  </td>
                </tr>
              ) : (
                employees.map((e) => (
                  <tr key={`emp-${e.id}`} className="border-t border-slate-100 hover:bg-indigo-50/20 transition-colors">
                    <td className="p-2.5 font-semibold text-slate-800 sticky left-0 bg-white border-r border-slate-100 z-10">
                      {e.fullName || e.name}
                    </td>
                    {columns.map((col) => {
                      const alloc = getAllocation(e.id, 'EMPLOYEE');
                      const active =
                        alloc &&
                        ((col.id === 'IDLE' && alloc.status === 'IDLE') ||
                          (col.id === 'REPAIR' && alloc.status === 'REPAIR') ||
                          (col.id === 'ABSENT' && alloc.status === 'ABSENT') ||
                          (alloc.status === 'ACTIVE' && alloc.siteSubId === col.id));
                      return (
                        <td key={col.id} className="p-1 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => handleSet(e.id, 'EMPLOYEE', col.id)}
                              className={`flex-1 py-1.5 rounded-lg font-bold text-xs transition-all ${
                                active
                                  ? 'bg-indigo-600 text-white shadow-sm ring-2 ring-indigo-300'
                                  : 'hover:bg-slate-100 text-slate-300 hover:text-slate-500'
                              }`}
                            >
                              {active ? '✓' : '—'}
                            </button>
                            <button
                              title="View History Log"
                              onClick={() => openHistory(e.id, 'EMPLOYEE')}
                              className="p-1 rounded text-slate-400 hover:text-indigo-600 hover:bg-slate-100"
                            >
                              <Clock size={12} />
                            </button>
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))
              )
            ) : vehicles.length === 0 ? (
              <tr>
                <td colSpan={columns.length + 1} className="p-6 text-center text-slate-400 italic">
                  No vehicles registered in system.
                </td>
              </tr>
            ) : (
              vehicles.map((v) => (
                <tr key={`veh-${v.id}`} className="border-t border-slate-100 hover:bg-emerald-50/20 transition-colors">
                  <td className="p-2.5 font-semibold text-slate-800 sticky left-0 bg-white border-r border-slate-100 z-10">
                    <div className="flex items-center gap-1.5">
                      <Truck size={13} className="text-slate-400" />
                      <span>{v.registrationNo || v.vehiclePlate || v.id}</span>
                    </div>
                  </td>
                  {columns.map((col) => {
                    const alloc = getAllocation(v.id, 'VEHICLE');
                    const active =
                      alloc &&
                      ((col.id === 'IDLE' && alloc.status === 'IDLE') ||
                        (col.id === 'REPAIR' && alloc.status === 'REPAIR') ||
                        (col.id === 'ABSENT' && alloc.status === 'ABSENT') ||
                        (alloc.status === 'ACTIVE' && alloc.siteSubId === col.id));
                    return (
                      <td key={col.id} className="p-1 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleSet(v.id, 'VEHICLE', col.id)}
                            className={`flex-1 py-1.5 rounded-lg font-bold text-xs transition-all ${
                              active
                                ? 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-300'
                                : 'hover:bg-slate-100 text-slate-300 hover:text-slate-500'
                            }`}
                          >
                            {active ? '✓' : '—'}
                          </button>
                          <button
                            title="View History Log"
                            onClick={() => openHistory(v.id, 'VEHICLE')}
                            className="p-1 rounded text-slate-400 hover:text-emerald-600 hover:bg-slate-100"
                          >
                            <Clock size={12} />
                          </button>
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* History Audit Drawer */}
      {historyOpenFor && (
        <div className="mt-4 border border-slate-200 rounded-xl p-4 bg-slate-50 shadow-inner">
          <div className="flex justify-between items-center mb-2">
            <h4 className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
              <HistoryIcon size={14} className="text-indigo-600" /> Audit Trail — {historyOpenFor.type}: {historyOpenFor.id}
            </h4>
            <button
              onClick={() => {
                setHistoryOpenFor(null);
                setHistoryEntries(null);
              }}
              className="text-xs text-slate-400 hover:text-slate-600 font-semibold"
            >
              Close
            </button>
          </div>
          <div className="max-h-40 overflow-y-auto text-xs space-y-1.5 pr-1">
            {historyEntries === null ? (
              <div className="text-slate-400 italic">Loading audit entries...</div>
            ) : historyEntries.length === 0 ? (
              <div className="text-slate-400 italic">No historical allocations recorded.</div>
            ) : (
              historyEntries.map((h, idx) => (
                <div key={idx} className="p-2 bg-white rounded-lg border border-slate-200 flex justify-between items-center shadow-2xs">
                  <span className="font-semibold text-slate-700">
                    Status: <span className="text-indigo-600">{h.status}</span> {h.siteSubId ? `@ Site: ${h.siteSubId}` : ''}
                  </span>
                  <span className="text-slate-400 font-mono text-[11px]">{new Date(h.createdAt).toLocaleString()}</span>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Page Component ───────────────────────────────────────────────────────

export default function LocationManagementPage() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [allocations, setAllocations] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [apiError, setApiError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showAddLocation, setShowAddLocation] = useState(false);
  const [editLocation, setEditLocation] = useState<Location | null>(null);
  const [deleteLocationTarget, setDeleteLocationTarget] = useState<Location | null>(null);
  const [downloadingAllReport, setDownloadingAllReport] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      setApiError("");
      const [locRes, allocRes, empRes, vehRes] = await Promise.all([
        apiFetch("/site-locations"),
        apiFetch("/allocations"),
        apiFetch("/employees"),
        apiFetch("/vehicles"),
      ]);

      if (Array.isArray(allocRes)) setAllocations(allocRes);
      if (Array.isArray(empRes)) setEmployees(empRes);
      if (Array.isArray(vehRes)) setVehicles(vehRes);

      if (Array.isArray(locRes)) {
        const mapped = locRes.map(mapBackendLocation);
        setLocations(mapped);
        setSelectedLocationId((current) =>
          current && mapped.some((l) => l.id === current) ? current : mapped[0]?.id || null
        );
      }
    } catch (error: any) {
      console.error("Data load failed", error);
      setApiError(error?.message || "Unable to sync with system services.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const hydratedLocations = locations.map((loc) => {
    const updatedSites = loc.sites.map((site) => {
      const activePersons = allocations
        .filter((a) => a.resourceType === "EMPLOYEE" && a.status === "ACTIVE" && a.siteSubId === site.id)
        .map((a) => {
          const emp = employees.find((e) => e.id === a.resourceId);
          return { id: a.resourceId, name: emp?.fullName || emp?.name || a.resourceId };
        });

      const activeVehicles = allocations
        .filter((a) => a.resourceType === "VEHICLE" && a.status === "ACTIVE" && a.siteSubId === site.id)
        .map((a) => {
          const veh = vehicles.find((v) => v.id === a.resourceId);
          return { id: a.resourceId, vehiclePlate: veh?.registrationNo || veh?.vehiclePlate || a.resourceId };
        });

      return {
        ...site,
        assignedPersons: activePersons,
        assignedVehicles: activeVehicles,
      };
    });

    return { ...loc, sites: updatedSites };
  });

  const filteredLocations = hydratedLocations.filter((loc) => {
    const q = search.toLowerCase();
    const matchesSearch = loc.name.toLowerCase().includes(q) || loc.id.toLowerCase().includes(q);
    const matchesFilter = filterStatus === "All" || loc.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const handleDownloadAllReport = async () => {
    setDownloadingAllReport(true);
    try {
      const ok = await downloadPdf(`/site-locations/reports/all`, `site-locations-report.pdf`);
      if (!ok) setApiError("Couldn't generate full report. Check server connectivity.");
    } finally {
      setDownloadingAllReport(false);
    }
  };

  const handleAddLocation = async (data: any) => {
    try {
      setApiError("");
      const created = await apiFetch("/site-locations", {
        method: "POST",
        body: JSON.stringify(locationPayload({ ...data, sites: [] })),
      });
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
      const saved = await apiFetch(`/site-locations/${updated.id}`, {
        method: "PUT",
        body: JSON.stringify(locationPayload(updated)),
      });
      const mapped = mapBackendLocation(saved);
      setLocations((prev) => prev.map((l) => (l.id === mapped.id ? mapped : l)));
    } catch (error: any) {
      setApiError(error?.message || "Unable to update location.");
    }
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

  const selectedLocation = hydratedLocations.find((l) => l.id === selectedLocationId);

  return (
    <div className="h-full flex gap-5">
      {/* Left Sidebar */}
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
              title="Download detailed PDF report"
              className={`btn bg-slate-800 text-white hover:bg-slate-900 ${downloadingAllReport ? "opacity-60 cursor-wait" : ""}`}
            >
              <Download size={14} /> {downloadingAllReport ? "..." : "Download All"}
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {loading ? (
            <div className="py-10 text-center text-sm text-slate-400">Syncing database state...</div>
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

      {/* Right Workstation Panel */}
      <div className="flex-1 min-w-0">
        {selectedLocation ? (
          <LocationDetailPanel
            location={selectedLocation}
            locations={hydratedLocations}
            onUpdate={handleUpdateLocation}
            onAllocationChange={fetchData}
            onClose={() => setSelectedLocationId(null)}
          />
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm h-full flex flex-col items-center justify-center text-slate-400">
            <Building2 size={48} className="mb-3 opacity-30" />
            <p className="text-sm font-medium">Select a location to inspect operational sites</p>
          </div>
        )}
      </div>

      {/* Top Level Modals */}
      {showAddLocation && <LocationFormModal onClose={() => setShowAddLocation(false)} onSave={handleAddLocation} />}
      {editLocation && <LocationFormModal isEdit initial={editLocation} onClose={() => setEditLocation(null)} onSave={async (data: any) => { await handleUpdateLocation({ ...editLocation, ...data }); setEditLocation(null); }} />}
      {deleteLocationTarget && <ConfirmModal name={deleteLocationTarget.name} onClose={() => setDeleteLocationTarget(null)} onConfirm={() => handleDeleteLocation(deleteLocationTarget.id)} />}
    </div>
  );
}