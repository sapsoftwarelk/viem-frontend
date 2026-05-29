"use client";

import { useState } from "react";
import {
  Plus, Search, Filter, Edit2, Trash2, X, ChevronRight,
  Building2, MapPin, Phone, Calendar, Clock, ChevronDown,
  Layers, FolderTree, MoreVertical, CheckCircle, AlertCircle
} from "lucide-react";
import Badge from "@/components/shared/Badge";

const pad = (n: number, width = 4) => String(n).padStart(width, "0");

const REGIONS = [
  "Ampara", "Anuradhapura", "Badulla", "Batticaloa", "Colombo", "Galle",
  "Gampaha", "Hambantota", "Jaffna", "Kalutara", "Kandy", "Kegalle",
  "Kilinochchi", "Kurunegala", "Mannar", "Matale", "Matara", "Monaragala",
  "Mullaitivu", "Nuwara Eliya", "Polonnaruwa", "Puttalam", "Ratnapura",
  "Trincomalee", "Vavuniya",
];

const STATUS_STYLES: Record<string, "green" | "amber" | "gray" | "blue" | "red"> = {
  Active: "green",
  Planning: "amber",
  Completed: "gray",
  "On Hold": "red",
};

function generateSiteId(region: string, seq: number) {
  return `SITE-${region}-${pad(seq)}`;
}

type SubLevel = {
  id: string;
  name: string;
  status: string;
  startDate: string;
  remarks: string;
};

type Site = {
  id: string;
  name: string;
  region: string;
  seq: number;
  status: string;
  client: string;
  contactNumber: string;
  address: string;
  startDate: string;
  remarks: string;
  subLevels: SubLevel[];
};

const SEED_SITES: Site[] = [
  {
    id: "SITE-COL-0001",
    name: "Colombo City Tower",
    region: "COL",
    seq: 1,
    status: "Active",
    client: "Ceylon Constructions Ltd",
    contactNumber: "+94 11 234 5678",
    address: "25, Lotus Road, Colombo 01",
    startDate: "2024-01-15",
    remarks: "Main commercial tower project with 45 floors.",
    subLevels: [],
  },
  {
    id: "SITE-NBO-0001",
    name: "Nairobi Business Park",
    region: "NBO",
    seq: 1,
    status: "Planning",
    client: "EastAfrica Realty",
    contactNumber: "+254 700 123 456",
    address: "Upper Hill, Nairobi",
    startDate: "2024-06-01",
    remarks: "Phase 1 development in progress.",
    subLevels: [],
  },
];

// ----------------------------------------------------------------------------
// Modal components (reused)
// ----------------------------------------------------------------------------
function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-800">{title}</h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-100 text-slate-400">
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
        Are you sure you want to delete <strong className="text-rose-600">{name}</strong>? This action cannot be undone.
      </p>
      <div className="flex justify-end gap-3 mt-6">
        <button onClick={onClose} className="btn">Cancel</button>
        <button onClick={onConfirm} className="btn btn-danger">Delete</button>
      </div>
    </Modal>
  );
}

// ----------------------------------------------------------------------------
// Sub-level form modal
// ----------------------------------------------------------------------------
function SubLevelModal({ title, initial, onClose, onSave }: any) {
  const [form, setForm] = useState(initial || {
    name: "",
    startDate: new Date().toISOString().slice(0, 10),
    status: "Planning",
    remarks: "",
  });

  const handleChange = (field: string, value: any) => setForm({ ...form, [field]: value });
  const isValid = form.name.trim();

  return (
    <Modal title={title} onClose={onClose}>
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wider">Sub-level Name *</label>
          <input value={form.name} onChange={(e) => handleChange("name", e.target.value)} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm" placeholder="e.g., North Wing, Phase 2" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wider">Start Date</label>
            <input type="date" value={form.startDate} onChange={(e) => handleChange("startDate", e.target.value)} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wider">Status</label>
            <select value={form.status} onChange={(e) => handleChange("status", e.target.value)} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm">
              {Object.keys(STATUS_STYLES).map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wider">Remarks</label>
          <textarea rows={3} value={form.remarks} onChange={(e) => handleChange("remarks", e.target.value)} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm resize-none" placeholder="Additional details..." />
        </div>
      </div>
      <div className="flex justify-end gap-3 mt-6 pt-2">
        <button onClick={onClose} className="btn">Cancel</button>
        <button onClick={() => isValid && onSave(form)} className="btn btn-primary">Save</button>
      </div>
    </Modal>
  );
}

// ----------------------------------------------------------------------------
// Add / Edit Main Site Modal
// ----------------------------------------------------------------------------
function SiteFormModal({ onClose, onSave, initial, isEdit = false }: any) {
  const [form, setForm] = useState(initial || {
    name: "",
    region: REGIONS[0],
    client: "",
    contactNumber: "",
    address: "",
    startDate: new Date().toISOString().slice(0, 10),
    status: "Planning",
    remarks: "",
  });

  const handleChange = (field: string, value: any) => setForm({ ...form, [field]: value });
  const isValid = form.name.trim() && form.client.trim();

  return (
    <Modal title={isEdit ? "Edit Main Site" : "Register New Main Site"} onClose={onClose}>
      <div className="space-y-4">
        <div><label className="block text-xs font-semibold text-slate-500 mb-1 uppercase">Site Name *</label><input value={form.name} onChange={(e) => handleChange("name", e.target.value)} className="w-full border rounded-xl px-4 py-2.5 text-sm" /></div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-xs font-semibold text-slate-500 mb-1 uppercase">Region</label><select value={form.region} onChange={(e) => handleChange("region", e.target.value)} className="w-full border rounded-xl px-4 py-2.5 text-sm">{REGIONS.map(r => <option key={r}>{r}</option>)}</select></div>
          <div><label className="block text-xs font-semibold text-slate-500 mb-1 uppercase">Status</label><select value={form.status} onChange={(e) => handleChange("status", e.target.value)} className="w-full border rounded-xl px-4 py-2.5 text-sm">{Object.keys(STATUS_STYLES).map(s => <option key={s}>{s}</option>)}</select></div>
        </div>
        <div><label className="block text-xs font-semibold text-slate-500 mb-1 uppercase">Client *</label><input value={form.client} onChange={(e) => handleChange("client", e.target.value)} className="w-full border rounded-xl px-4 py-2.5 text-sm" /></div>
        <div><label className="block text-xs font-semibold text-slate-500 mb-1 uppercase">Contact Number</label><input value={form.contactNumber} onChange={(e) => handleChange("contactNumber", e.target.value)} className="w-full border rounded-xl px-4 py-2.5 text-sm" /></div>
        <div><label className="block text-xs font-semibold text-slate-500 mb-1 uppercase">Address</label><input value={form.address} onChange={(e) => handleChange("address", e.target.value)} className="w-full border rounded-xl px-4 py-2.5 text-sm" /></div>
        <div><label className="block text-xs font-semibold text-slate-500 mb-1 uppercase">Start Date</label><input type="date" value={form.startDate} onChange={(e) => handleChange("startDate", e.target.value)} className="w-full border rounded-xl px-4 py-2.5 text-sm" /></div>
        <div><label className="block text-xs font-semibold text-slate-500 mb-1 uppercase">Remarks</label><textarea rows={2} value={form.remarks} onChange={(e) => handleChange("remarks", e.target.value)} className="w-full border rounded-xl px-4 py-2.5 text-sm resize-none" /></div>
      </div>
      <div className="flex justify-end gap-3 mt-6 pt-2">
        <button onClick={onClose} className="btn">Cancel</button>
        <button onClick={() => isValid && onSave(form)} className="btn btn-primary">{isEdit ? "Save Changes" : "Register Site"}</button>
      </div>
    </Modal>
  );
}

// ----------------------------------------------------------------------------
// Site Detail Panel (sub-levels management)
// ----------------------------------------------------------------------------
function SiteDetailPanel({ site, onUpdate, onClose }: any) {
  const [modal, setModal] = useState<{ type: "add" } | { type: "edit"; sub: SubLevel } | { type: "delete"; sub: SubLevel } | null>(null);

  const updateSite = (patch: Partial<Site>) => onUpdate({ ...site, ...patch });

  const handleAddSub = (data: any) => {
    const newSub = {
      id: `${site.id}-LVL-${pad(site.subLevels.length + 1, 2)}`,
      ...data,
    };
    updateSite({ subLevels: [...site.subLevels, newSub] });
    setModal(null);
  };

  const handleEditSub = (data: any) => {
    if (modal?.type !== "edit") return;
    updateSite({
      subLevels: site.subLevels.map((s: SubLevel) => s.id === modal.sub.id ? { ...s, ...data } : s)
    });
    setModal(null);
  };

  const handleDeleteSub = () => {
    if (modal?.type !== "delete") return;
    updateSite({ subLevels: site.subLevels.filter((s: SubLevel) => s.id !== modal.sub.id) });
    setModal(null);
  };

  const emptySubForm = {
    name: "",
    startDate: new Date().toISOString().slice(0, 10),
    status: "Planning",
    remarks: "",
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-start bg-slate-50/50">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="font-mono text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-lg">{site.id}</span>
            <Badge variant={STATUS_STYLES[site.status] as any}>{site.status}</Badge>
          </div>
          <h2 className="text-xl font-bold text-slate-800">{site.name}</h2>
          <p className="text-sm text-slate-500">{site.client}</p>
        </div>
        <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-100 text-slate-400"><X size={18} /></button>
      </div>

      {/* Site Info */}
      <div className="px-6 py-4 border-b border-slate-100 grid grid-cols-2 gap-4 text-sm">
        <div className="flex items-start gap-2"><MapPin size={14} className="text-slate-400 mt-0.5" /><div><p className="font-medium text-slate-700">Address</p><p className="text-slate-500">{site.address}</p></div></div>
        <div className="flex items-start gap-2"><Phone size={14} className="text-slate-400 mt-0.5" /><div><p className="font-medium text-slate-700">Contact</p><p className="text-slate-500">{site.contactNumber}</p></div></div>
        <div className="flex items-start gap-2"><Calendar size={14} className="text-slate-400 mt-0.5" /><div><p className="font-medium text-slate-700">Start Date</p><p className="text-slate-500">{site.startDate}</p></div></div>
        {site.remarks && <div className="col-span-2 flex items-start gap-2"><Clock size={14} className="text-slate-400 mt-0.5" /><div><p className="font-medium text-slate-700">Remarks</p><p className="text-slate-500">{site.remarks}</p></div></div>}
      </div>

      {/* Sub-levels */}
      <div className="flex-1 p-6 flex flex-col overflow-hidden">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold text-slate-800 flex items-center gap-2"><FolderTree size={16} /> Sub-Levels ({site.subLevels.length})</h3>
          <button onClick={() => setModal({ type: "add" })} className="btn btn-sm btn-primary"><Plus size={14} /> Add Sub-Level</button>
        </div>
        {site.subLevels.length === 0 ? (
          <div className="flex-1 flex items-center justify-center border-2 border-dashed border-slate-200 rounded-xl text-slate-400 text-sm">No sub-levels defined.</div>
        ) : (
          <div className="space-y-3 overflow-auto pr-1">
            {site.subLevels.map((sub: SubLevel) => (
              <div key={sub.id} className="border border-slate-200 rounded-xl p-4 hover:shadow-sm transition-all group">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-mono text-[10px] text-slate-400">{sub.id}</div>
                    <div className="font-semibold text-slate-800 mt-1">{sub.name}</div>
                    <div className="flex gap-3 mt-1 text-xs text-slate-500"><span>Start: {sub.startDate}</span><Badge variant={STATUS_STYLES[sub.status] as any}>{sub.status}</Badge></div>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
                    <button onClick={() => setModal({ type: "edit", sub })} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500"><Edit2 size={14} /></button>
                    <button onClick={() => setModal({ type: "delete", sub })} className="p-1.5 rounded-lg hover:bg-rose-50 text-rose-500"><Trash2 size={14} /></button>
                  </div>
                </div>
                {sub.remarks && <div className="mt-2 text-xs text-slate-500 border-t pt-2 mt-2">{sub.remarks}</div>}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      {modal?.type === "add" && <SubLevelModal title="Add Sub-Level" initial={emptySubForm} onClose={() => setModal(null)} onSave={handleAddSub} />}
      {modal?.type === "edit" && <SubLevelModal title="Edit Sub-Level" initial={modal.sub} onClose={() => setModal(null)} onSave={handleEditSub} />}
      {modal?.type === "delete" && <ConfirmModal name={modal.sub.name} onClose={() => setModal(null)} onConfirm={handleDeleteSub} />}
    </div>
  );
}

// ----------------------------------------------------------------------------
// Main Component
// ----------------------------------------------------------------------------
export default function SiteManagementPage() {
  const [sites, setSites] = useState<Site[]>(SEED_SITES);
  const [selectedSiteId, setSelectedSiteId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");

  const [showAddSite, setShowAddSite] = useState(false);
  const [editSite, setEditSite] = useState<Site | null>(null);
  const [deleteSiteTarget, setDeleteSiteTarget] = useState<Site | null>(null);

  const filteredSites = sites.filter(site => {
    const matchesSearch = site.name.toLowerCase().includes(search.toLowerCase()) ||
      site.id.toLowerCase().includes(search.toLowerCase()) ||
      site.client.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filterStatus === "All" || site.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const handleAddSite = (data: any) => {
    const regionSeq = sites.filter(s => s.region === data.region).length + 1;
    const newSite: Site = {
      id: generateSiteId(data.region, regionSeq),
      name: data.name,
      region: data.region,
      seq: regionSeq,
      status: data.status,
      client: data.client,
      contactNumber: data.contactNumber,
      address: data.address,
      startDate: data.startDate,
      remarks: data.remarks || "",
      subLevels: [],
    };
    setSites([newSite, ...sites]);
    setShowAddSite(false);
    setSelectedSiteId(newSite.id);
  };

  const handleUpdateSite = (updated: Site) => {
    setSites(prev => prev.map(s => s.id === updated.id ? updated : s));
    if (selectedSiteId === updated.id) setSelectedSiteId(updated.id);
  };

  const handleDeleteSite = (id: string) => {
    setSites(prev => prev.filter(s => s.id !== id));
    if (selectedSiteId === id) setSelectedSiteId(null);
    setDeleteSiteTarget(null);
  };

  const selectedSite = sites.find(s => s.id === selectedSiteId);

  return (
    <div className="h-full flex gap-5">
      {/* Left Panel – Site List */}
      <div className="w-96 flex-shrink-0 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
        <div className="p-4 border-b border-slate-100">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input type="text" placeholder="Search sites..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50 focus:bg-white" />
          </div>
          <div className="flex flex-wrap gap-2 mt-3">
            {["All", ...Object.keys(STATUS_STYLES)].map(st => (
              <button key={st} onClick={() => setFilterStatus(st)} className={`px-3 py-1 text-xs rounded-full font-medium transition ${filterStatus === st ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>{st}</button>
            ))}
          </div>
          <button onClick={() => setShowAddSite(true)} className="btn btn-primary w-full mt-4"><Plus size={14} /> New Main Site</button>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {filteredSites.map(site => (
            <div key={site.id} onClick={() => setSelectedSiteId(site.id)} className={`p-3 rounded-xl border cursor-pointer transition-all hover:shadow-sm ${selectedSiteId === site.id ? "border-emerald-300 bg-emerald-50/30" : "border-slate-200 hover:border-slate-300"}`}>
              <div className="flex justify-between items-start">
                <div><div className="font-mono text-[10px] text-slate-400">{site.id}</div><div className="font-semibold text-slate-800">{site.name}</div><div className="text-xs text-slate-500 mt-0.5">{site.client}</div></div>
                <Badge variant={STATUS_STYLES[site.status] as any}>{site.status}</Badge>
              </div>
              <div className="flex justify-between items-center mt-2 text-xs text-slate-400"><span>{site.subLevels.length} sub-levels</span><div className="flex gap-1">
                <button onClick={(e) => { e.stopPropagation(); setEditSite(site); }} className="p-1 rounded hover:bg-slate-100"><Edit2 size={12} /></button>
                <button onClick={(e) => { e.stopPropagation(); setDeleteSiteTarget(site); }} className="p-1 rounded hover:bg-rose-50 text-rose-500"><Trash2 size={12} /></button>
              </div></div>
            </div>
          ))}
        </div>
      </div>

      {/* Right Panel – Site Detail */}
      <div className="flex-1 min-w-0">
        {selectedSite ? (
          <SiteDetailPanel site={selectedSite} onUpdate={handleUpdateSite} onClose={() => setSelectedSiteId(null)} />
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm h-full flex flex-col items-center justify-center text-slate-400">
            <Building2 size={48} className="mb-3 opacity-40" />
            <p className="text-sm">Select a site from the list</p>
          </div>
        )}
      </div>

      {/* Modals */}
      {showAddSite && <SiteFormModal onClose={() => setShowAddSite(false)} onSave={handleAddSite} />}
      {editSite && <SiteFormModal isEdit initial={editSite} onClose={() => setEditSite(null)} onSave={(data: any) => { handleUpdateSite({ ...editSite, ...data }); setEditSite(null); }} />}
      {deleteSiteTarget && <ConfirmModal name={deleteSiteTarget.name} onClose={() => setDeleteSiteTarget(null)} onConfirm={() => handleDeleteSite(deleteSiteTarget.id)} />}
    </div>
  );
}