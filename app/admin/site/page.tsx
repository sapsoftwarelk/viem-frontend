"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "../../../lib/api";
import {
  Plus, Search, Edit2, Trash2, X,
  Building2, MapPin, Phone, Calendar, Clock,
  FolderTree, AlertCircle, User,
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
  {
    dot:        "bg-amber-500",
    ring:       "ring-amber-300",
    border:     "border-amber-300",
    cardBg:     "bg-amber-50/40",
    headerBg:   "bg-amber-50",
    headerBorder:"border-amber-200",
    avatarBg:   "bg-amber-500",
    avatarText:  "text-white",
    accent:     "text-amber-600",
    activeCard: "border-amber-400 bg-amber-50/50",
    filterActive:"bg-amber-600",
    idChip:     "bg-amber-100 text-amber-700",
    subBorder:  "border-amber-100",
  },
  {
    dot:        "bg-indigo-500",
    ring:       "ring-indigo-300",
    border:     "border-indigo-300",
    cardBg:     "bg-indigo-50/40",
    headerBg:   "bg-indigo-50",
    headerBorder:"border-indigo-200",
    avatarBg:   "bg-indigo-500",
    avatarText:  "text-white",
    accent:     "text-indigo-600",
    activeCard: "border-indigo-400 bg-indigo-50/50",
    filterActive:"bg-indigo-600",
    idChip:     "bg-indigo-100 text-indigo-700",
    subBorder:  "border-indigo-100",
  },
  {
    dot:        "bg-teal-500",
    ring:       "ring-teal-300",
    border:     "border-teal-300",
    cardBg:     "bg-teal-50/40",
    headerBg:   "bg-teal-50",
    headerBorder:"border-teal-200",
    avatarBg:   "bg-teal-500",
    avatarText:  "text-white",
    accent:     "text-teal-600",
    activeCard: "border-teal-400 bg-teal-50/50",
    filterActive:"bg-teal-600",
    idChip:     "bg-teal-100 text-teal-700",
    subBorder:  "border-teal-100",
  },
  {
    dot:        "bg-pink-500",
    ring:       "ring-pink-300",
    border:     "border-pink-300",
    cardBg:     "bg-pink-50/40",
    headerBg:   "bg-pink-50",
    headerBorder:"border-pink-200",
    avatarBg:   "bg-pink-500",
    avatarText:  "text-white",
    accent:     "text-pink-600",
    activeCard: "border-pink-400 bg-pink-50/50",
    filterActive:"bg-pink-600",
    idChip:     "bg-pink-100 text-pink-700",
    subBorder:  "border-pink-100",
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

// Child Site – has all detailed fields
type Site = {
  id: string;
  name: string;
  manager: string;
  region: string;
  seq: number;
  status: string;
  client: string;
  contactNumber: string;
  address: string;
  startDate: string;
  remarks: string;
};

// Parent Location – minimal fields, contains an array of Sites
type Location = {
  id: string;
  name: string;
  status: string;
  region: string;        // optional, but we keep for consistency
  sites: Site[];         // child sites
};

// ─── Data helpers (back‑end mapping) ──────────────────────────────────────

// The backend still expects "siteName" for parent and "subLevels" for children.
// We map parent -> Location, children -> Sites.
function mapBackendLocation(location: any): Location {
  const sites = Array.isArray(location.subLevels) ? location.subLevels : [];
  return {
    id: location.id,
    name: location.siteName || location.name || "",
    status: location.status || "Planning",
    region: location.region || "",
    sites: sites.map((s: any) => ({
      id: s.id,
      name: s.name || "",
      manager: s.manager || "",
      region: s.region || "",
      seq: s.seq || 1,
      status: s.status || "Planning",
      client: s.client || "",
      contactNumber: s.contactNumber || "",
      address: s.address || "",
      startDate: s.startDate ? s.startDate.split("T")[0] : "",
      remarks: s.remarks || "",
    })),
  };
}

function locationPayload(location: Partial<Location>) {
  return {
    siteName: location.name,
    status: location.status,
    region: location.region,
    subLevels: location.sites?.map((s) => ({
      name: s.name,
      manager: s.manager,
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

// ─── Sample seed data based on the screenshot (inverted) ────────────────────

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
        region: "Colombo",
        seq: 1,
        status: "Active",
        client: "Government",
        contactNumber: "0112345678",
        address: "1, Warehouse Road, Colombo 01",
        startDate: "2024-01-01",
        remarks: "Main warehouse",
      },
      {
        id: "SITE-ADM-WH2",
        name: "Warehouse 2",
        manager: "Admin Manager",
        region: "Colombo",
        seq: 2,
        status: "Active",
        client: "Government",
        contactNumber: "0112345679",
        address: "2, Warehouse Road, Colombo 02",
        startDate: "2024-02-01",
        remarks: "Secondary warehouse",
      },
      {
        id: "SITE-ADM-WH3",
        name: "Warehouse 3",
        manager: "Admin Manager",
        region: "Colombo",
        seq: 3,
        status: "Planning",
        client: "Government",
        contactNumber: "0112345680",
        address: "3, Warehouse Road, Colombo 03",
        startDate: "2024-03-01",
        remarks: "Future warehouse",
      },
      {
        id: "SITE-ADM-RS1",
        name: "Repair Shop 1",
        manager: "Repair Supervisor",
        region: "Colombo",
        seq: 4,
        status: "Active",
        client: "Govt Workshop",
        contactNumber: "0112345681",
        address: "1, Repair Lane, Colombo 04",
        startDate: "2024-01-15",
        remarks: "Main repair",
      },
      {
        id: "SITE-ADM-RS2",
        name: "Repair Shop 2",
        manager: "Repair Supervisor",
        region: "Colombo",
        seq: 5,
        status: "Active",
        client: "Govt Workshop",
        contactNumber: "0112345682",
        address: "2, Repair Lane, Colombo 05",
        startDate: "2024-01-15",
        remarks: "Secondary repair",
      },
      {
        id: "SITE-ADM-RS3",
        name: "Repair Shop 3",
        manager: "Repair Supervisor",
        region: "Colombo",
        seq: 6,
        status: "On Hold",
        client: "Govt Workshop",
        contactNumber: "0112345683",
        address: "3, Repair Lane, Colombo 06",
        startDate: "2024-02-15",
        remarks: "On hold",
      },
      {
        id: "SITE-ADM-TS1",
        name: "Trash Site 1",
        manager: "Waste Manager",
        region: "Colombo",
        seq: 7,
        status: "Active",
        client: "Waste Management",
        contactNumber: "0112345684",
        address: "1, Trash Road, Colombo 07",
        startDate: "2024-01-20",
        remarks: "Landfill",
      },
      {
        id: "SITE-ADM-TS2",
        name: "Trash Site 2",
        manager: "Waste Manager",
        region: "Colombo",
        seq: 8,
        status: "Active",
        client: "Waste Management",
        contactNumber: "0112345685",
        address: "2, Trash Road, Colombo 08",
        startDate: "2024-02-20",
        remarks: "Recycling",
      },
      {
        id: "SITE-ADM-TS3",
        name: "Trash Site 3",
        manager: "Waste Manager",
        region: "Colombo",
        seq: 9,
        status: "Completed",
        client: "Waste Management",
        contactNumber: "0112345686",
        address: "3, Trash Road, Colombo 09",
        startDate: "2023-12-01",
        remarks: "Closed",
      },
    ],
  },
  {
    id: "LOC-OP-0001",
    name: "Operational Sites",
    status: "Active",
    region: "Colombo",
    sites: [
      {
        id: "SITE-OP-COL",
        name: "Colombo City Tower",
        manager: "Anil Perera",
        region: "Colombo",
        seq: 1,
        status: "Active",
        client: "Ceylon Constructions Ltd",
        contactNumber: "0112345678",
        address: "25, Lotus Road, Colombo 01",
        startDate: "2024-01-15",
        remarks: "45 floors",
      },
      {
        id: "SITE-OP-NBO",
        name: "Nairobi Business Park",
        manager: "John Mwangi",
        region: "NBO",
        seq: 2,
        status: "Planning",
        client: "EastAfrica Realty",
        contactNumber: "0700123456",
        address: "Upper Hill, Nairobi",
        startDate: "2024-06-01",
        remarks: "Phase 1",
      },
    ],
  },
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

// ─── Site (child) Modal – full details ──────────────────────────────────────

function SiteModal({ title, initial, onClose, onSave }: any) {
  const [form, setForm] = useState(initial || {
    name: "",
    manager: "",
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

  return (
    <Modal title={title} onClose={onClose}>
      <div className="space-y-4">
        <div><label className="block text-xs font-semibold text-slate-500 mb-1 uppercase">Site Name *</label><input value={form.name} onChange={(e) => handleChange("name", e.target.value)} className="w-full border rounded-xl px-4 py-2.5 text-sm" /></div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-xs font-semibold text-slate-500 mb-1 uppercase">Region</label><select value={form.region} onChange={(e) => handleChange("region", e.target.value)} className="w-full border rounded-xl px-4 py-2.5 text-sm">{REGIONS.map(r => <option key={r}>{r}</option>)}</select></div>
          <div><label className="block text-xs font-semibold text-slate-500 mb-1 uppercase">Status</label><select value={form.status} onChange={(e) => handleChange("status", e.target.value)} className="w-full border rounded-xl px-4 py-2.5 text-sm">{Object.keys(STATUS_STYLES).map(s => <option key={s}>{s}</option>)}</select></div>
        </div>
        <div><label className="block text-xs font-semibold text-slate-500 mb-1 uppercase">Client *</label><input value={form.client} onChange={(e) => handleChange("client", e.target.value)} className="w-full border rounded-xl px-4 py-2.5 text-sm" /></div>
        <div><label className="block text-xs font-semibold text-slate-500 mb-1 uppercase">Site Manager *</label><input value={form.manager} onChange={(e) => handleChange("manager", e.target.value)} className="w-full border rounded-xl px-4 py-2.5 text-sm" /></div>
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
          onClick={() => { setTouched((p) => ({ ...p, contactNumber: true })); if (isValid) onSave(form); }}
          disabled={!isValid}
          className={`btn btn-primary ${!isValid ? "opacity-50 cursor-not-allowed" : ""}`}
        >{title.includes("Edit") ? "Save Changes" : "Add Site"}</button>
      </div>
    </Modal>
  );
}

// ─── Location (parent) Modal – minimal ─────────────────────────────────────

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

// ─── Location Detail Panel (shows child Sites with full details) ────────────

function LocationDetailPanel({ location, onUpdate, onClose }: any) {
  const color = getLocationColor(location.id);
  const [modal, setModal] = useState<
    { type: "add" } | { type: "edit"; site: Site } | { type: "delete"; site: Site } | null
  >(null);

  const updateLocation = (patch: Partial<Location>) => onUpdate({ ...location, ...patch });

  const handleAddSite = async (data: any) => {
    const newSite = { id: `${location.id}-SITE-${pad(location.sites.length + 1, 2)}`, ...data };
    await updateLocation({ sites: [...location.sites, newSite] });
    setModal(null);
  };
  const handleEditSite = async (data: any) => {
    if (modal?.type !== "edit") return;
    await updateLocation({ sites: location.sites.map((s: Site) => s.id === modal.site.id ? { ...s, ...data } : s) });
    setModal(null);
  };
  const handleDeleteSite = async () => {
    if (modal?.type !== "delete") return;
    await updateLocation({ sites: location.sites.filter((s: Site) => s.id !== modal.site.id) });
    setModal(null);
  };

  return (
    <div className={`bg-white rounded-2xl border ${color.border} shadow-sm h-full flex flex-col overflow-hidden`}>
      {/* Colored header for Location */}
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
        <button onClick={onClose} className="p-1 rounded-lg hover:bg-white/70 text-slate-400"><X size={18} /></button>
      </div>

      {/* Child Sites with full details */}
      <div className="flex-1 p-6 flex flex-col overflow-hidden">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold text-slate-800 flex items-center gap-2">
            <FolderTree size={16} className={color.accent} /> Sites
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${color.idChip}`}>{location.sites.length}</span>
          </h3>
          <button onClick={() => setModal({ type: "add" })} className="btn btn-sm btn-primary"><Plus size={14} /> Add Site</button>
        </div>

        {location.sites.length === 0 ? (
          <div className={`flex-1 flex items-center justify-center border-2 border-dashed ${color.border} rounded-xl ${color.cardBg} text-slate-400 text-sm`}>
            No sites defined for this location.
          </div>
        ) : (
          <div className="space-y-4 overflow-auto pr-1">
            {location.sites.map((site: Site) => (
              <div key={site.id} className={`border ${color.subBorder} rounded-xl p-4 hover:shadow-sm transition-all group ${color.cardBg}`}>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className={`font-mono text-[10px] ${color.accent} font-semibold`}>{site.id}</span>
                      <Badge variant={STATUS_STYLES[site.status] as any}>{site.status}</Badge>
                    </div>
                    <h4 className="font-semibold text-slate-800 mt-0.5">{site.name}</h4>
                    <div className="grid grid-cols-2 gap-x-6 gap-y-1 mt-2 text-sm text-slate-600">
                      <div><span className="font-medium">Manager:</span> {site.manager}</div>
                      <div><span className="font-medium">Client:</span> {site.client}</div>
                      <div><span className="font-medium">Contact:</span> {site.contactNumber}</div>
                      <div><span className="font-medium">Start Date:</span> {site.startDate}</div>
                      <div className="col-span-2"><span className="font-medium">Address:</span> {site.address || "—"}</div>
                      {site.remarks && <div className="col-span-2"><span className="font-medium">Remarks:</span> {site.remarks}</div>}
                    </div>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition flex-shrink-0 ml-2">
                    <button onClick={() => setModal({ type: "edit", site })} className="p-1.5 rounded-lg hover:bg-white text-slate-500"><Edit2 size={14} /></button>
                    <button onClick={() => setModal({ type: "delete", site })} className="p-1.5 rounded-lg hover:bg-rose-50 text-rose-500"><Trash2 size={14} /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {modal?.type === "add" && <SiteModal title="Add Site" initial={{ name: "", manager: "", region: REGIONS[0], client: "", contactNumber: "", address: "", startDate: new Date().toISOString().slice(0, 10), status: "Planning", remarks: "" }} onClose={() => setModal(null)} onSave={handleAddSite} />}
      {modal?.type === "edit" && <SiteModal title="Edit Site" initial={modal.site} onClose={() => setModal(null)} onSave={handleEditSite} />}
      {modal?.type === "delete" && <ConfirmModal name={modal.site.name} onClose={() => setModal(null)} onConfirm={handleDeleteSite} />}
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
          <button onClick={() => setShowAddLocation(true)} className="btn btn-primary w-full mt-4"><Plus size={14} /> New Location</button>
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
          <LocationDetailPanel location={selectedLocation} onUpdate={handleUpdateLocation} onClose={() => setSelectedLocationId(null)} />
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