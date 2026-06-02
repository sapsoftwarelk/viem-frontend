"use client";

import { useState, useEffect } from "react";
import {
  Plus, Search, Filter, Edit2, Trash2, X, ChevronRight,
  Building2, MapPin, Phone, Calendar, Clock, ChevronDown,
  Layers, FolderTree, MoreVertical, CheckCircle, AlertCircle,
  ArrowLeft, Printer, Eye, Send, RefreshCw, Package, Truck,
  Warehouse, Undo2, AlertTriangle, Check, Download, FileText
} from "lucide-react";
import Badge from "@/components/shared/Badge";

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

type ReturnStatus = 
  | "DRAFT" 
  | "SUBMITTED" 
  | "APPROVED" 
  | "IN_TRANSIT" 
  | "RECEIVED" 
  | "COMPLETED" 
  | "CANCELLED";

type DestinationType = "WAREHOUSE" | "SUPPLIER";

interface ReturnItem {
  id: string;
  itemId: string;
  itemName: string;
  unit: string;
  availableStock: number;
  returnedQuantity: number;
  reason: string;
  condition: "Good" | "Minor Damage" | "Damaged" | "Wrong Item";
}

type InventoryStock = Record<string, number>;

interface InventoryItem {
  id: string;
  name: string;
  unit: string;
  siteStock: InventoryStock;
}

interface SiteReturnNote {
  id: string;
  returnNumber: string;
  siteId: string;
  siteName: string;
  subLevel: string;
  destinationType: DestinationType;
  destinationId: string;      // warehouse id or supplier id
  destinationName: string;
  items: ReturnItem[];
  status: ReturnStatus;
  requestDate: string;
  requestedBy: string;
  approvedBy?: string;
  dispatchDate?: string;
  receivedDate?: string;
  vehicleId?: string;
  driverId?: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// SEED DATA (matching existing system)
// ─────────────────────────────────────────────────────────────────────────────

const SITES = [
  { id: "site1", name: "Colombo City Tower", subLevels: ["Block A Level 1", "Block A Level 2", "Block B Ground"] },
  { id: "site2", name: "Nairobi Business Park", subLevels: ["Phase 1 Ground", "Phase 1 Mezzanine"] },
  { id: "site3", name: "Kandy Hills Resort", subLevels: ["Main Building Ground", "Pool Area"] },
];

const WAREHOUSES = [
  { id: "wh1", name: "Central Warehouse" },
  { id: "wh2", name: "Regional Depot - Kandy" },
];

const SUPPLIERS = [
  { id: "sup1", name: "Ceylon Construction Materials" },
  { id: "sup2", name: "SteelMart International" },
  { id: "sup3", name: "Hardware Lanka (Pvt) Ltd" },
];

const INVENTORY_ITEMS: InventoryItem[] = [
  { id: "item1", name: "OPC Cement 50kg", unit: "Bags", siteStock: { site1: 250, site2: 100, site3: 50 } },
  { id: "item2", name: "T12 Rebar", unit: "kg", siteStock: { site1: 1200, site2: 800, site3: 400 } },
  { id: "item3", name: "Scaffolding Frame", unit: "frames", siteStock: { site1: 45, site2: 30, site3: 20 } },
  { id: "item4", name: "Angle Grinder", unit: "pcs", siteStock: { site1: 4, site2: 2, site3: 1 } },
];

const EMPLOYEES = [
  { id: "emp1", name: "Anil Perera", role: "Site Manager" },
  { id: "emp2", name: "Kamala Wijesinghe", role: "TO" },
  { id: "emp7", name: "Kasun Perera", role: "Driver" },
];

// Seed return notes
const SEED_RETURNS: SiteReturnNote[] = [
  {
    id: "ret1",
    returnNumber: "SRTN-2026-0001",
    siteId: "site1",
    siteName: "Colombo City Tower",
    subLevel: "Block A Level 1",
    destinationType: "WAREHOUSE",
    destinationId: "wh1",
    destinationName: "Central Warehouse",
    items: [
      { id: "ri1", itemId: "item1", itemName: "OPC Cement 50kg", unit: "Bags", availableStock: 250, returnedQuantity: 20, reason: "Excess stock", condition: "Good" },
      { id: "ri2", itemId: "item3", itemName: "Scaffolding Frame", unit: "frames", availableStock: 45, returnedQuantity: 5, reason: "Work completed", condition: "Good" },
    ],
    status: "IN_TRANSIT",
    requestDate: "2026-05-22",
    requestedBy: "Anil Perera",
    approvedBy: "Kamala Wijesinghe",
    dispatchDate: "2026-05-23",
    vehicleId: "veh1",
    driverId: "emp7",
    notes: "Return excess cement and unused scaffolding",
    createdAt: "2026-05-22T08:00:00Z",
    updatedAt: "2026-05-23T10:00:00Z",
  },
  {
    id: "ret2",
    returnNumber: "SRTN-2026-0002",
    siteId: "site2",
    siteName: "Nairobi Business Park",
    subLevel: "Phase 1 Ground",
    destinationType: "SUPPLIER",
    destinationId: "sup2",
    destinationName: "SteelMart International",
    items: [
      { id: "ri3", itemId: "item2", itemName: "T12 Rebar", unit: "kg", availableStock: 800, returnedQuantity: 500, reason: "Wrong grade supplied", condition: "Wrong Item" },
    ],
    status: "APPROVED",
    requestDate: "2026-05-20",
    requestedBy: "John Mwangi",
    approvedBy: "Sarah Kimani",
    notes: "Return incorrect rebar grade",
    createdAt: "2026-05-20T09:00:00Z",
    updatedAt: "2026-05-21T14:00:00Z",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function uid() { return Math.random().toString(36).slice(2, 9); }
function formatDate(d: string) { return new Date(d).toLocaleDateString("en-GB"); }
function todayStr() { return new Date().toISOString().slice(0, 10); }

const STATUS_STYLES: Record<ReturnStatus, "gray" | "amber" | "blue" | "purple" | "green" | "red"> = {
  DRAFT: "gray",
  SUBMITTED: "amber",
  APPROVED: "blue",
  IN_TRANSIT: "purple",
  RECEIVED: "amber",
  COMPLETED: "green",
  CANCELLED: "red",
};

const STATUS_LABELS: Record<ReturnStatus, string> = {
  DRAFT: "Draft",
  SUBMITTED: "Submitted",
  APPROVED: "Approved",
  IN_TRANSIT: "In Transit",
  RECEIVED: "Received",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

// ─────────────────────────────────────────────────────────────────────────────
// RETURN NOTE FORM MODAL
// ─────────────────────────────────────────────────────────────────────────────

function ReturnNoteModal({ open, onClose, onSave, initial }: any) {
  const [form, setForm] = useState({
    siteId: "",
    subLevel: "",
    destinationType: "WAREHOUSE" as DestinationType,
    destinationId: "",
    items: [] as ReturnItem[],
    notes: "",
    requestedBy: "",
  });

  const [selectedItem, setSelectedItem] = useState({ itemId: "", quantity: 1, reason: "", condition: "Good" as const });
  const [availableStock, setAvailableStock] = useState(0);

  useEffect(() => {
    if (open && initial) {
      setForm(initial);
    } else if (open && !initial) {
      setForm({
        siteId: "",
        subLevel: "",
        destinationType: "WAREHOUSE",
        destinationId: "",
        items: [],
        notes: "",
        requestedBy: "",
      });
    }
  }, [open, initial]);

  const handleSiteChange = (siteId: string) => {
    const site = SITES.find(s => s.id === siteId);
    setForm({ ...form, siteId, subLevel: site?.subLevels[0] || "", items: [] });
  };

  const getAvailableStockForSite = (itemId: string) => {
    const item = INVENTORY_ITEMS.find(i => i.id === itemId);
    if (!item || !form.siteId) return 0;
    return item.siteStock?.[form.siteId] || 0;
  };

  const handleAddItem = () => {
    if (!selectedItem.itemId || selectedItem.quantity <= 0) return;
    const item = INVENTORY_ITEMS.find(i => i.id === selectedItem.itemId);
    if (!item) return;
    const stock = getAvailableStockForSite(selectedItem.itemId);
    if (selectedItem.quantity > stock) {
      alert(`Only ${stock} ${item.unit} available at this site.`);
      return;
    }
    const existingIndex = form.items.findIndex(i => i.itemId === selectedItem.itemId);
    if (existingIndex >= 0) {
      const newQty = form.items[existingIndex].returnedQuantity + selectedItem.quantity;
      if (newQty > stock) {
        alert(`Total return exceeds available stock (${stock})`);
        return;
      }
      const updated = [...form.items];
      updated[existingIndex] = { ...updated[existingIndex], returnedQuantity: newQty, reason: selectedItem.reason, condition: selectedItem.condition };
      setForm({ ...form, items: updated });
    } else {
      setForm({
        ...form,
        items: [...form.items, {
          id: uid(),
          itemId: selectedItem.itemId,
          itemName: item.name,
          unit: item.unit,
          availableStock: stock,
          returnedQuantity: selectedItem.quantity,
          reason: selectedItem.reason,
          condition: selectedItem.condition,
        }],
      });
    }
    setSelectedItem({ itemId: "", quantity: 1, reason: "", condition: "Good" });
  };

  const removeItem = (itemId: string) => {
    setForm({ ...form, items: form.items.filter(i => i.itemId !== itemId) });
  };

  const updateItemQty = (itemId: string, newQty: number) => {
    if (newQty < 0) return;
    const item = INVENTORY_ITEMS.find(i => i.id === itemId);
    const stock = getAvailableStockForSite(itemId);
    if (newQty > stock) {
      alert(`Cannot exceed available stock (${stock} ${item?.unit})`);
      return;
    }
    setForm({
      ...form,
      items: form.items.map(i => i.itemId === itemId ? { ...i, returnedQuantity: newQty } : i),
    });
  };

  const isValid = form.siteId && form.destinationId && form.items.length > 0 && form.requestedBy;

  const handleSubmit = () => {
    if (!isValid) return;
    const newReturn: SiteReturnNote = {
      id: initial?.id || uid(),
      returnNumber: initial?.returnNumber || `SRTN-${new Date().getFullYear()}-${Math.floor(Math.random() * 10000)}`,
      siteId: form.siteId,
      siteName: SITES.find(s => s.id === form.siteId)?.name || "",
      subLevel: form.subLevel,
      destinationType: form.destinationType,
      destinationId: form.destinationId,
      destinationName: form.destinationType === "WAREHOUSE" 
        ? WAREHOUSES.find(w => w.id === form.destinationId)?.name || ""
        : SUPPLIERS.find(s => s.id === form.destinationId)?.name || "",
      items: form.items,
      status: initial?.status || "DRAFT",
      requestDate: todayStr(),
      requestedBy: form.requestedBy,
      notes: form.notes,
      createdAt: initial?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    onSave(newReturn);
    onClose();
  };

  if (!open) return null;

  const destinations = form.destinationType === "WAREHOUSE" ? WAREHOUSES : SUPPLIERS;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-800">{initial ? "Edit Return Note" : "New Site Return Note"}</h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-100"><X size={18} /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase">Site *</label>
              <select value={form.siteId} onChange={(e) => handleSiteChange(e.target.value)} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm">
                <option value="">Select Site</option>
                {SITES.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase">Sub‑level</label>
              <select value={form.subLevel} onChange={(e) => setForm({ ...form, subLevel: e.target.value })} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm" disabled={!form.siteId}>
                <option value="">Entire Site</option>
                {SITES.find(s => s.id === form.siteId)?.subLevels.map(sl => <option key={sl} value={sl}>{sl}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase">Return To *</label>
              <div className="flex gap-2 mb-2">
                <button type="button" onClick={() => setForm({ ...form, destinationType: "WAREHOUSE", destinationId: "" })} className={`flex-1 py-2 rounded-lg border text-sm ${form.destinationType === "WAREHOUSE" ? "bg-emerald-50 border-emerald-300 text-emerald-700" : "bg-white border-slate-200"}`}>🏢 Warehouse</button>
                <button type="button" onClick={() => setForm({ ...form, destinationType: "SUPPLIER", destinationId: "" })} className={`flex-1 py-2 rounded-lg border text-sm ${form.destinationType === "SUPPLIER" ? "bg-emerald-50 border-emerald-300 text-emerald-700" : "bg-white border-slate-200"}`}>🏭 Supplier</button>
              </div>
              <select value={form.destinationId} onChange={(e) => setForm({ ...form, destinationId: e.target.value })} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm">
                <option value="">Select {form.destinationType === "WAREHOUSE" ? "Warehouse" : "Supplier"}</option>
                {destinations.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase">Requested By *</label>
              <input value={form.requestedBy} onChange={(e) => setForm({ ...form, requestedBy: e.target.value })} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm" />
            </div>
          </div>

          {/* Items */}
          <div>
            <div className="flex justify-between items-center mb-3">
              <label className="text-xs font-semibold text-slate-500 uppercase">Items to Return</label>
            </div>
            <div className="bg-slate-50 rounded-xl p-4 mb-3">
              <div className="grid grid-cols-12 gap-2 items-end">
                <div className="col-span-5"><label className="text-[10px] font-semibold text-slate-400">Item</label><select value={selectedItem.itemId} onChange={(e) => { const id = e.target.value; setSelectedItem({ ...selectedItem, itemId: id }); setAvailableStock(getAvailableStockForSite(id)); }} className="w-full border rounded-lg px-3 py-2 text-sm bg-white"><option value="">Select</option>{INVENTORY_ITEMS.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}</select></div>
                <div className="col-span-2"><label className="text-[10px] font-semibold text-slate-400">Qty</label><input type="number" min="1" value={selectedItem.quantity} onChange={(e) => setSelectedItem({ ...selectedItem, quantity: Number(e.target.value) })} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
                <div className="col-span-3"><label className="text-[10px] font-semibold text-slate-400">Condition</label><select value={selectedItem.condition} onChange={(e) => setSelectedItem({ ...selectedItem, condition: e.target.value as any })} className="w-full border rounded-lg px-3 py-2 text-sm"><option>Good</option><option>Minor Damage</option><option>Damaged</option><option>Wrong Item</option></select></div>
                <div className="col-span-2"><button onClick={handleAddItem} className="w-full bg-emerald-600 text-white rounded-lg py-2 text-sm"><Plus size={14} className="inline mr-1" /> Add</button></div>
              </div>
              <div className="text-[11px] text-slate-400 mt-2">Available at site: {availableStock} {INVENTORY_ITEMS.find(i => i.id === selectedItem.itemId)?.unit}</div>
            </div>
            {form.items.length === 0 ? (
              <div className="border-2 border-dashed rounded-xl py-8 text-center text-slate-400 text-sm">No items added.</div>
            ) : (
              <div className="border rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50"><tr><th className="p-3 text-left">Item</th><th>Unit</th><th>Return Qty</th><th>Condition</th><th>Reason</th><th className="w-10"></th></tr></thead>
                  <tbody>
                    {form.items.map(item => (
                      <tr key={item.itemId} className="border-t">
                        <td className="p-3">{item.itemName}</td>
                        <td className="p-3">{item.unit}</td>
                        <td className="p-3"><input type="number" value={item.returnedQuantity} onChange={(e) => updateItemQty(item.itemId, Number(e.target.value))} className="w-20 border rounded px-2 py-1" /></td>
                        <td className="p-3"><Badge variant={item.condition === "Good" ? "green" : item.condition === "Minor Damage" ? "amber" : "red"}>{item.condition}</Badge></td>
                        <td className="p-3"><input value={item.reason} onChange={(e) => setForm({ ...form, items: form.items.map(i => i.itemId === item.itemId ? { ...i, reason: e.target.value } : i) })} placeholder="Reason" className="border rounded px-2 py-1 w-32" /></td>
                        <td className="p-3"><button onClick={() => removeItem(item.itemId)} className="text-rose-500"><Trash2 size={14} /></button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase">Notes / Instructions</label>
            <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm resize-none" />
          </div>
        </div>
        <div className="px-6 py-4 border-t flex gap-3">
          <button onClick={onClose} className="flex-1 btn">Cancel</button>
          <button onClick={handleSubmit} disabled={!isValid} className="flex-1 btn btn-primary">{initial ? "Save Changes" : "Create Return Note"}</button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// RETURN NOTE DETAIL DRAWER
// ─────────────────────────────────────────────────────────────────────────────

function ReturnNoteDrawer({ note, onClose, onUpdateStatus }: { note: SiteReturnNote; onClose: () => void; onUpdateStatus: (id: string, status: ReturnStatus) => void }) {
  return (
    <div className="fixed inset-0 z-40 flex justify-end" onClick={onClose}>
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative w-full max-w-2xl bg-white shadow-2xl h-full flex flex-col overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 bg-white p-5 border-b flex justify-between items-start">
          <div><p className="font-mono text-xs text-slate-400">{note.returnNumber}</p><h2 className="text-xl font-bold">Site Return Note</h2><Badge variant={STATUS_STYLES[note.status]}>{STATUS_LABELS[note.status]}</Badge></div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-100"><X size={18} /></button>
        </div>
        <div className="p-6 space-y-5">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div><span className="text-slate-400">From Site:</span> {note.siteName} {note.subLevel && `(${note.subLevel})`}</div>
            <div><span className="text-slate-400">Return To:</span> {note.destinationName}</div>
            <div><span className="text-slate-400">Requested By:</span> {note.requestedBy}</div>
            <div><span className="text-slate-400">Request Date:</span> {formatDate(note.requestDate)}</div>
            {note.approvedBy && <div><span className="text-slate-400">Approved By:</span> {note.approvedBy}</div>}
            {note.dispatchDate && <div><span className="text-slate-400">Dispatched:</span> {formatDate(note.dispatchDate)}</div>}
          </div>
          <div><h3 className="font-semibold mb-2">Items</h3><table className="w-full text-sm border"><thead className="bg-slate-50"><tr><th className="p-2">Item</th><th>Qty</th><th>Condition</th><th>Reason</th></tr></thead><tbody>{note.items.map((i: any) => (<tr key={i.id} className="border-t"><td className="p-2">{i.itemName}</td><td>{i.returnedQuantity} {i.unit}</td><td><Badge variant="gray">{i.condition}</Badge></td><td>{i.reason}</td></tr>))}</tbody></table></div>
          {note.notes && <div><span className="text-slate-400">Notes:</span> {note.notes}</div>}
          {note.status !== "COMPLETED" && note.status !== "CANCELLED" && (
            <div className="flex gap-2 pt-2 border-t">
              {note.status === "DRAFT" && <button onClick={() => onUpdateStatus(note.id, "SUBMITTED")} className="btn btn-primary text-sm">Submit for Approval</button>}
              {note.status === "SUBMITTED" && <button onClick={() => onUpdateStatus(note.id, "APPROVED")} className="btn btn-primary text-sm">Approve</button>}
              {note.status === "APPROVED" && <button onClick={() => onUpdateStatus(note.id, "IN_TRANSIT")} className="btn btn-primary text-sm">Mark In Transit</button>}
              {note.status === "IN_TRANSIT" && <button onClick={() => onUpdateStatus(note.id, "RECEIVED")} className="btn btn-primary text-sm">Mark Received</button>}
              {note.status === "RECEIVED" && <button onClick={() => onUpdateStatus(note.id, "COMPLETED")} className="btn btn-primary text-sm">Complete</button>}
              <button onClick={() => onUpdateStatus(note.id, "CANCELLED")} className="btn btn-danger text-sm">Cancel</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────────────────────────────

export default function SiteReturnNotePage() {
  const [returns, setReturns] = useState<SiteReturnNote[]>(SEED_RETURNS);
  const [search, setSearch] = useState("");
  const [filterSite, setFilterSite] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<SiteReturnNote | null>(null);
  const [viewingNote, setViewingNote] = useState<SiteReturnNote | null>(null);

  const filtered = returns.filter(r => {
    const matchesSearch = r.returnNumber.toLowerCase().includes(search.toLowerCase()) || r.siteName.toLowerCase().includes(search.toLowerCase());
    const matchesSite = filterSite === "all" || r.siteId === filterSite;
    const matchesStatus = filterStatus === "all" || r.status === filterStatus;
    return matchesSearch && matchesSite && matchesStatus;
  });

  const handleSave = (note: SiteReturnNote) => {
    if (returns.find(r => r.id === note.id)) {
      setReturns(prev => prev.map(r => r.id === note.id ? note : r));
    } else {
      setReturns([note, ...returns]);
    }
    setModalOpen(false);
    setEditingNote(null);
  };

  const handleUpdateStatus = (id: string, newStatus: ReturnStatus) => {
    setReturns(prev => prev.map(r => r.id === id ? { ...r, status: newStatus, updatedAt: new Date().toISOString() } : r));
    setViewingNote(null);
  };

  const handleDelete = (id: string) => {
    setReturns(prev => prev.filter(r => r.id !== id));
    setViewingNote(null);
  };

  return (
    <div className="p-5">
      <div className="flex justify-between items-start mb-5">
        <div><h1 className="text-[20px] font-bold text-slate-800">Site Return Notes</h1><p className="text-sm text-slate-500">Return items from sites to warehouse or supplier</p></div>
        <button onClick={() => { setEditingNote(null); setModalOpen(true); }} className="btn btn-primary"><Plus size={14} /> New Return Note</button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4 bg-white p-3 rounded-xl border">
        <div className="flex-1 relative"><Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input placeholder="Search by number or site..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm" /></div>
        <select value={filterSite} onChange={(e) => setFilterSite(e.target.value)} className="border rounded-lg px-3 py-2 text-sm"><option value="all">All Sites</option>{SITES.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="border rounded-lg px-3 py-2 text-sm"><option value="all">All Status</option>{Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50"><tr><th className="p-3 text-left">Return #</th><th>Site</th><th>To</th><th>Items</th><th>Status</th><th>Request Date</th><th className="text-right">Actions</th></tr></thead>
          <tbody>
            {filtered.map(r => (
              <tr key={r.id} className="border-t hover:bg-slate-50/50 cursor-pointer" onClick={() => setViewingNote(r)}>
                <td className="p-3 font-mono text-xs">{r.returnNumber}</td>
                <td className="p-3">{r.siteName}{r.subLevel && <span className="text-slate-400 text-xs block">{r.subLevel}</span>}</td>
                <td className="p-3">{r.destinationName}</td>
                <td className="p-3">{r.items.reduce((s,i) => s + i.returnedQuantity, 0)} units</td>
                <td className="p-3"><Badge variant={STATUS_STYLES[r.status]}>{STATUS_LABELS[r.status]}</Badge></td>
                <td className="p-3">{formatDate(r.requestDate)}</td>
                <td className="p-3 text-right" onClick={(e) => e.stopPropagation()}>
                  <button onClick={() => { setEditingNote(r); setModalOpen(true); }} className="p-1 rounded hover:bg-slate-100"><Edit2 size={14} /></button>
                  <button onClick={() => handleDelete(r.id)} className="p-1 rounded hover:bg-rose-50 text-rose-500 ml-1"><Trash2 size={14} /></button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan={7} className="p-8 text-center text-slate-400">No return notes found</td></tr>}
          </tbody>
        </table>
      </div>

      {/* Modals */}
      <ReturnNoteModal open={modalOpen} onClose={() => { setModalOpen(false); setEditingNote(null); }} onSave={handleSave} initial={editingNote} />
      {viewingNote && <ReturnNoteDrawer note={viewingNote} onClose={() => setViewingNote(null)} onUpdateStatus={handleUpdateStatus} />}
    </div>
  );
}