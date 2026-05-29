"use client";

import { useState, useEffect } from "react";
import {
  Plus, Search, Eye, Pencil, Trash2, X, AlertCircle,
  Package, ChevronDown, Hash, Calendar, Filter,
  CheckCircle, Clock, Archive, Boxes, ShoppingCart,
  Wrench, RefreshCw, FileText, Send, Printer,
  ChevronRight, ArrowLeft, AlertTriangle, ExternalLink,
  Layers, Tag, Building2, Truck, CreditCard, MoreVertical,
  Copy, Ban, RotateCcw, ClipboardList, SquarePen, QrCode,
  ClipboardCheck, PackageCheck, Link2, Unlink, ArrowDownToLine,
  User, MapPin, Users, Phone, Mail, Warehouse, PlusCircle,
  MinusCircle, MoveRight, Grid3x3, List, BarChart3, Home,
  Settings, DollarSign, Weight, Ruler, Thermometer, Shield,
  GanttChart, Clipboard, ListChecks, ClockIcon,
  UserCheck, UserX, Fuel, Camera, MessageSquare, CalendarDays,
  CircleDot, Circle, Check, ChevronLeft, Loader2, Building,
  HardHat, Calendar as CalendarIcon, Activity, AlertOctagon,
  FolderTree, FolderOpen, ArrowRightLeft, Truck as TruckIcon,
  Warehouse as WarehouseIcon, ArrowRight, CheckSquare, Send as SendIcon
} from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

type TaskStatus = 
  | "DRAFT" | "APPROVED" | "MATERIAL_REQUESTED" | "MATERIAL_SENT"
  | "WORK_STARTED" | "IN_PROGRESS" | "WAITING_RETURN" | "COMPLETED"
  | "VERIFIED" | "CLOSED";

type TaskPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";
type TaskType = 
  | "EXCAVATION" | "CONCRETE_POUR" | "MASONRY" | "PLUMBING"
  | "ELECTRICAL" | "MATERIAL_TRANSFER" | "TOOL_DEPLOYMENT"
  | "SITE_CLEANUP" | "EMERGENCY_PURCHASE" | "REPAIR_WORK";

// Transfer Note types
type TransferStatus = "DRAFT" | "SUBMITTED" | "IN_TRANSIT" | "RECEIVED" | "COMPLETED";
type TransferFromType = "WAREHOUSE" | "SITE";

interface TransferItem {
  id: string;
  itemId: string;
  itemName: string;
  unit: string;
  requestedQuantity: number;
  issuedQuantity?: number;
  receivedQuantity?: number;
  availableStock: number;
  unitPrice?: number;
  notes?: string;
}

interface TransferNote {
  id: string;
  transferId: string;
  fromType: TransferFromType;
  fromId: string;        // warehouse id or site id
  fromName: string;
  toSiteId: string;      // destination site
  toSubLevel: string;    // optional sub-level
  items: TransferItem[];
  status: TransferStatus;
  requestedDate: string;
  requestedBy: string;
  approvedBy?: string;
  dispatchedDate?: string;
  receivedDate?: string;
  driverId?: string;
  vehicleId?: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

interface Site {
  id: string;
  code: string;
  name: string;
  location: string;
  manager: string;
  technicalOfficer: string;
  supervisor: string;
  status: "Active" | "Inactive";
  startDate: string;
  expectedEndDate: string;
  address: string;
  client: string;
  subLevels: string[];
}

interface Employee {
  id: string;
  name: string;
  role: string;
  phone: string;
}

interface Vehicle {
  id: string;
  plate: string;
  type: string;
  driver: string;
  status: string;
}

interface InventoryItem {
  id: string;
  name: string;
  type: string;
  unit: string;
  quantity: number;      // warehouse stock
  siteStock?: Record<string, number>; // stock per site (siteId -> quantity)
}

interface SiteTask {
  id: string;
  taskId: string;
  jobName: string;
  description: string;
  priority: TaskPriority;
  status: TaskStatus;
  taskType: TaskType;
  startDate: string;
  dueDate: string;
  actualStartDate?: string;
  actualEndDate?: string;
  assignedSiteManagerId: string;
  assignedTechnicalOfficerId: string;
  assignedSupervisorId: string;
  assignedDriverId?: string;
  assignedVehicles: VehicleAssignment[];
  transferNotes: TransferNote[];  // replace materialRequests
  dailyLogs: DailyLog[];
  createdAt: string;
  updatedAt: string;
  notes: string;
  photos: string[];
  subLevel: string;
}

// Keep other types (VehicleAssignment, DailyLog) as before
interface VehicleAssignment {
  id: string;
  vehicleId: string;
  vehiclePlate: string;
  driver: string;
  tripType: "MORNING" | "EVENING" | "EMERGENCY";
  status: "SCHEDULED" | "IN_TRANSIT" | "RETURNED";
  departureTime?: string;
  arrivalTime?: string;
  subLevel: string;
}

interface DailyLog {
  id: string;
  date: string;
  workforceCount: number;
  contractors: number;
  supervisors: number;
  materialsUsed: string;
  equipmentHours: string;
  events: string;
  photos: string[];
  notes: string;
  subLevel: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// SEED DATA
// ─────────────────────────────────────────────────────────────────────────────

const SITES: Site[] = [
  {
    id: "site1", code: "SITE-COL-0001", name: "Colombo City Tower",
    location: "Colombo 01", manager: "Anil Perera", technicalOfficer: "Kamala Wijesinghe",
    supervisor: "Ruwantha Bandara", status: "Active",
    startDate: "2024-01-15", expectedEndDate: "2026-12-31",
    address: "25, Lotus Road, Colombo 01", client: "Ceylon Constructions Ltd",
    subLevels: ["Block A Level 1", "Block A Level 2", "Block B Ground", "Parking Level"]
  },
  {
    id: "site2", code: "SITE-NBO-0001", name: "Nairobi Business Park",
    location: "Nairobi, Kenya", manager: "John Mwangi", technicalOfficer: "Sarah Kimani",
    supervisor: "James Otieno", status: "Active",
    startDate: "2024-06-01", expectedEndDate: "2025-12-31",
    address: "Upper Hill, Nairobi", client: "EastAfrica Realty",
    subLevels: ["Phase 1 Ground", "Phase 1 Mezzanine", "Phase 2 Foundation"]
  },
  {
    id: "site3", code: "SITE-KDY-0001", name: "Kandy Hills Resort",
    location: "Kandy", manager: "Nalini Fernando", technicalOfficer: "Suresh Mendis",
    supervisor: "Dilani Rathnayake", status: "Active",
    startDate: "2025-01-10", expectedEndDate: "2026-06-30",
    address: "Peradeniya Road, Kandy", client: "Hilltop Hotels",
    subLevels: ["Main Building Ground", "Main Building First", "Pool Area", "Landscaping"]
  },
];

const EMPLOYEES: Employee[] = [
  { id: "emp1", name: "Anil Perera", role: "Site Manager", phone: "+94 77 123 4567" },
  { id: "emp2", name: "Kamala Wijesinghe", role: "Technical Officer", phone: "+94 77 234 5678" },
  { id: "emp3", name: "Ruwantha Bandara", role: "Supervisor", phone: "+94 76 345 6789" },
  { id: "emp4", name: "Nalini Fernando", role: "Site Manager", phone: "+94 71 456 7890" },
  { id: "emp5", name: "Suresh Mendis", role: "Technical Officer", phone: "+94 70 567 8901" },
  { id: "emp6", name: "Dilani Rathnayake", role: "Supervisor", phone: "+94 77 678 9012" },
  { id: "emp7", name: "Kasun Perera", role: "Driver", phone: "+94 75 789 0123" },
  { id: "emp8", name: "Amal Silva", role: "Driver", phone: "+94 77 890 1234" },
  { id: "emp9", name: "John Mwangi", role: "Site Manager", phone: "+254 700 123 456" },
  { id: "emp10", name: "Sarah Kimani", role: "Technical Officer", phone: "+254 700 234 567" },
  { id: "emp11", name: "James Otieno", role: "Supervisor", phone: "+254 700 345 678" },
];

const VEHICLES: Vehicle[] = [
  { id: "veh1", plate: "LRY-001", type: "Lorry", driver: "Kasun Perera", status: "Available" },
  { id: "veh2", plate: "LRY-002", type: "Lorry", driver: "Amal Silva", status: "Available" },
  { id: "veh3", plate: "PUP-001", type: "Pickup", driver: "Nuwan Jaya", status: "Available" },
];

// Inventory with site-specific stock
const INVENTORY_ITEMS: InventoryItem[] = [
  { id: "item1", name: "OPC Cement 50kg", type: "Consumable", unit: "Bags", quantity: 500, siteStock: { site1: 200, site2: 100, site3: 50 } },
  { id: "item2", name: "T12 Rebar", type: "Consumable", unit: "kg", quantity: 5000, siteStock: { site1: 1200, site2: 800, site3: 400 } },
  { id: "item3", name: "Scaffolding Frame", type: "Reusable", unit: "frames", quantity: 150, siteStock: { site1: 45, site2: 30, site3: 20 } },
  { id: "item4", name: "Angle Grinder", type: "Tool", unit: "pcs", quantity: 10, siteStock: { site1: 4, site2: 2, site3: 1 } },
];

// Seed tasks with transfer notes instead of material requests
const SEED_TASKS: SiteTask[] = [
  {
    id: "task1", taskId: "TASK-2026-0001", jobName: "Foundation Concrete Pour",
    description: "Pour concrete for foundation of Block A.",
    priority: "HIGH", status: "MATERIAL_SENT", taskType: "CONCRETE_POUR",
    startDate: "2026-05-20", dueDate: "2026-05-25",
    assignedSiteManagerId: "emp1", assignedTechnicalOfficerId: "emp2", assignedSupervisorId: "emp3", assignedDriverId: "emp7",
    assignedVehicles: [
      { id: "va1", vehicleId: "veh1", vehiclePlate: "LRY-001", driver: "Kasun Perera", tripType: "MORNING", status: "IN_TRANSIT", departureTime: "2026-05-20T08:00:00", subLevel: "Block A Level 1" }
    ],
    transferNotes: [
      {
        id: "tn1", transferId: "TRF-2026-0001", fromType: "WAREHOUSE", fromId: "warehouse1", fromName: "Central Warehouse",
        toSiteId: "site1", toSubLevel: "Block A Level 1",
        items: [
          { id: "ti1", itemId: "item1", itemName: "OPC Cement 50kg", unit: "Bags", requestedQuantity: 200, issuedQuantity: 200, receivedQuantity: 180, availableStock: 500, notes: "For foundation" },
          { id: "ti2", itemId: "item2", itemName: "T12 Rebar", unit: "kg", requestedQuantity: 2000, issuedQuantity: 2000, receivedQuantity: 2000, availableStock: 5000, notes: "" }
        ],
        status: "IN_TRANSIT", requestedDate: "2026-05-18", requestedBy: "Anil Perera", approvedBy: "Kamala Wijesinghe", dispatchedDate: "2026-05-19", driverId: "emp7", vehicleId: "veh1", notes: "Priority delivery",
        createdAt: "2026-05-18T10:00:00Z", updatedAt: "2026-05-20T08:00:00Z"
      }
    ],
    dailyLogs: [
      { id: "dl1", date: "2026-05-20", workforceCount: 12, contractors: 4, supervisors: 2, materialsUsed: "100 bags cement, 1000kg rebar", equipmentHours: "Mixer: 4h", events: "Rain delay", photos: [], notes: "", subLevel: "Block A Level 1" }
    ],
    createdAt: "2026-05-18T10:00:00Z", updatedAt: "2026-05-20T08:00:00Z", notes: "", photos: [], subLevel: "Block A Level 1"
  },
  {
    id: "task2", taskId: "TASK-2026-0002", jobName: "Excavation for Foundation",
    description: "Excavate area for building foundation.",
    priority: "MEDIUM", status: "IN_PROGRESS", taskType: "EXCAVATION",
    startDate: "2026-05-22", dueDate: "2026-05-28",
    assignedSiteManagerId: "emp9", assignedTechnicalOfficerId: "emp10", assignedSupervisorId: "emp11",
    assignedVehicles: [], transferNotes: [], dailyLogs: [],
    createdAt: "2026-05-19T09:00:00Z", updatedAt: "2026-05-22T07:30:00Z", notes: "", photos: [], subLevel: "Phase 1 Ground"
  },
];

const SITE_TASKS_MAP: Record<string, SiteTask[]> = {
  site1: [SEED_TASKS[0]],
  site2: [SEED_TASKS[1]],
  site3: [],
};

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function uid() { return Math.random().toString(36).slice(2, 9); }
function todayStr() { return new Date().toISOString().slice(0, 10); }
function formatDate(d: string) { return new Date(d).toLocaleDateString("en-GB"); }
function formatDateTime(d: string) { return new Date(d).toLocaleString("en-GB"); }

const STATUS_STYLES: Record<TaskStatus, { bg: string; text: string; border: string; dot: string }> = {
  "DRAFT": { bg: "bg-slate-100", text: "text-slate-500", border: "border-slate-200", dot: "bg-slate-400" },
  "APPROVED": { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200", dot: "bg-blue-500" },
  "MATERIAL_REQUESTED": { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200", dot: "bg-amber-500" },
  "MATERIAL_SENT": { bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200", dot: "bg-purple-500" },
  "WORK_STARTED": { bg: "bg-indigo-50", text: "text-indigo-700", border: "border-indigo-200", dot: "bg-indigo-500" },
  "IN_PROGRESS": { bg: "bg-cyan-50", text: "text-cyan-700", border: "border-cyan-200", dot: "bg-cyan-500" },
  "WAITING_RETURN": { bg: "bg-orange-50", text: "text-orange-700", border: "border-orange-200", dot: "bg-orange-500" },
  "COMPLETED": { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", dot: "bg-emerald-500" },
  "VERIFIED": { bg: "bg-teal-50", text: "text-teal-700", border: "border-teal-200", dot: "bg-teal-500" },
  "CLOSED": { bg: "bg-slate-100", text: "text-slate-500", border: "border-slate-200", dot: "bg-slate-400" },
};

const PRIORITY_STYLES: Record<TaskPriority, string> = {
  "LOW": "bg-slate-100 text-slate-600",
  "MEDIUM": "bg-blue-100 text-blue-700",
  "HIGH": "bg-orange-100 text-orange-700",
  "URGENT": "bg-rose-100 text-rose-700",
};

const TASK_TYPE_LABELS: Record<TaskType, string> = {
  "EXCAVATION": "Excavation", "CONCRETE_POUR": "Concrete Pour", "MASONRY": "Masonry",
  "PLUMBING": "Plumbing", "ELECTRICAL": "Electrical", "MATERIAL_TRANSFER": "Material Transfer",
  "TOOL_DEPLOYMENT": "Tool Deployment", "SITE_CLEANUP": "Site Cleanup",
  "EMERGENCY_PURCHASE": "Emergency Purchase", "REPAIR_WORK": "Repair Work",
};

const TRANSFER_STATUS_STYLES: Record<TransferStatus, string> = {
  "DRAFT": "bg-slate-100 text-slate-600",
  "SUBMITTED": "bg-blue-100 text-blue-700",
  "IN_TRANSIT": "bg-purple-100 text-purple-700",
  "RECEIVED": "bg-amber-100 text-amber-700",
  "COMPLETED": "bg-emerald-100 text-emerald-700",
};

function TransferStatusBadge({ status }: { status: TransferStatus }) {
  return <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${TRANSFER_STATUS_STYLES[status]}`}>{status}</span>;
}

function TaskStatusBadge({ status }: { status: TaskStatus }) {
  const s = STATUS_STYLES[status];
  return <span className={`inline-flex items-center gap-1.5 text-[10px] px-2 py-0.5 rounded-full font-semibold border ${s.bg} ${s.text} ${s.border}`}><span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />{status.replace("_", " ")}</span>;
}

// ─────────────────────────────────────────────────────────────────────────────
// TRANSFER NOTE MODAL (Professional)
// ─────────────────────────────────────────────────────────────────────────────

function TransferNoteModal({ open, onClose, onSubmit, taskId, currentSite, subLevels, sites, inventoryItems, employees, vehicles }: any) {
  const [form, setForm] = useState({
    fromType: "WAREHOUSE" as TransferFromType,
    fromId: "",
    fromName: "",
    toSubLevel: "",
    items: [] as TransferItem[],
    notes: "",
    driverId: "",
    vehicleId: "",
  });

  const [selectedItemRow, setSelectedItemRow] = useState({ itemId: "", quantity: 1 });
  const [availableStock, setAvailableStock] = useState(0);

  // Reset when modal opens
  useEffect(() => {
    if (open) {
      setForm({
        fromType: "WAREHOUSE",
        fromId: "",
        fromName: "",
        toSubLevel: "",
        items: [],
        notes: "",
        driverId: "",
        vehicleId: "",
      });
      setSelectedItemRow({ itemId: "", quantity: 1 });
      setAvailableStock(0);
    }
  }, [open]);

  const handleFromTypeChange = (type: TransferFromType) => {
    setForm({ ...form, fromType: type, fromId: "", fromName: "", items: [] });
  };

  const handleFromIdChange = (id: string) => {
    let name = "";
    if (form.fromType === "WAREHOUSE") {
      name = "Central Warehouse";
    } else {
      const site = sites.find((s: any) => s.id === id);
      name = site ? site.name : "";
    }
    setForm({ ...form, fromId: id, fromName: name, items: [] });
  };

  const getStockForItem = (itemId: string) => {
    const item = inventoryItems.find((i: any) => i.id === itemId);
    if (!item) return 0;
    if (form.fromType === "WAREHOUSE") return item.quantity;
    if (form.fromType === "SITE" && form.fromId) {
      return item.siteStock?.[form.fromId] || 0;
    }
    return 0;
  };

  const handleSelectItem = () => {
    if (!selectedItemRow.itemId || selectedItemRow.quantity <= 0) return;
    const item = inventoryItems.find((i: any) => i.id === selectedItemRow.itemId);
    if (!item) return;
    const stock = getStockForItem(selectedItemRow.itemId);
    if (selectedItemRow.quantity > stock) {
      alert(`Insufficient stock. Available: ${stock} ${item.unit}`);
      return;
    }
    // Check if item already exists in list
    const existing = form.items.find(i => i.itemId === selectedItemRow.itemId);
    if (existing) {
      const newQty = existing.requestedQuantity + selectedItemRow.quantity;
      if (newQty > stock) {
        alert(`Total requested exceeds available stock (${stock})`);
        return;
      }
      setForm({
        ...form,
        items: form.items.map(i => i.itemId === selectedItemRow.itemId ? { ...i, requestedQuantity: newQty } : i)
      });
    } else {
      setForm({
        ...form,
        items: [...form.items, {
          id: uid(),
          itemId: item.id,
          itemName: item.name,
          unit: item.unit,
          requestedQuantity: selectedItemRow.quantity,
          availableStock: stock,
          notes: ""
        }]
      });
    }
    setSelectedItemRow({ itemId: "", quantity: 1 });
    setAvailableStock(0);
  };

  const removeItem = (itemId: string) => {
    setForm({ ...form, items: form.items.filter(i => i.itemId !== itemId) });
  };

  const updateItemQuantity = (itemId: string, newQty: number) => {
    if (newQty < 0) return;
    const item = inventoryItems.find((i: any) => i.id === itemId);
    const stock = getStockForItem(itemId);
    if (newQty > stock) {
      alert(`Cannot exceed available stock (${stock} ${item?.unit})`);
      return;
    }
    setForm({
      ...form,
      items: form.items.map(i => i.itemId === itemId ? { ...i, requestedQuantity: newQty } : i)
    });
  };

  const handleSubmit = () => {
    if (!form.fromId || form.items.length === 0) {
      alert("Please select source and at least one item");
      return;
    }
    const transferNote: TransferNote = {
      id: uid(),
      transferId: `TRF-${Math.floor(Math.random() * 10000)}`,
      fromType: form.fromType,
      fromId: form.fromId,
      fromName: form.fromName,
      toSiteId: currentSite.id,
      toSubLevel: form.toSubLevel,
      items: form.items.map(i => ({ ...i, issuedQuantity: i.requestedQuantity, receivedQuantity: 0 })),
      status: "DRAFT",
      requestedDate: todayStr(),
      requestedBy: "Current User", // Replace with actual user
      driverId: form.driverId,
      vehicleId: form.vehicleId,
      notes: form.notes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    onSubmit(transferNote);
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100">
          <h2 className="text-[16px] font-bold text-slate-800">New Transfer Note</h2>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-100"><X size={18} /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Transfer Details */}
          <div className="grid grid-cols-2 gap-5">
            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">Transfer From</label>
              <div className="flex gap-2">
                <button type="button" onClick={() => handleFromTypeChange("WAREHOUSE")} className={`flex-1 py-2 rounded-lg border text-[13px] font-medium ${form.fromType === "WAREHOUSE" ? "bg-emerald-50 border-emerald-300 text-emerald-700" : "bg-white border-slate-200 text-slate-600"}`}>
                  <WarehouseIcon size={14} className="inline mr-1" /> Warehouse
                </button>
                <button type="button" onClick={() => handleFromTypeChange("SITE")} className={`flex-1 py-2 rounded-lg border text-[13px] font-medium ${form.fromType === "SITE" ? "bg-emerald-50 border-emerald-300 text-emerald-700" : "bg-white border-slate-200 text-slate-600"}`}>
                  <Building2 size={14} className="inline mr-1" /> Other Site
                </button>
              </div>
            </div>
            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">Source Location *</label>
              {form.fromType === "WAREHOUSE" ? (
                <div className="w-full border border-slate-200 rounded-xl px-4 py-2.5 bg-slate-50 text-slate-700">🏢 Central Warehouse</div>
              ) : (
                <select value={form.fromId} onChange={(e) => handleFromIdChange(e.target.value)} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 bg-white">
                  <option value="">Select Site</option>
                  {sites.filter((s: any) => s.id !== currentSite.id).map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              )}
            </div>
            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">To Site</label>
              <div className="w-full border border-slate-200 rounded-xl px-4 py-2.5 bg-slate-50 text-slate-700">{currentSite.name}</div>
            </div>
            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">To Sub‑level (optional)</label>
              <select value={form.toSubLevel} onChange={(e) => setForm({ ...form, toSubLevel: e.target.value })} className="w-full border border-slate-200 rounded-xl px-4 py-2.5">
                <option value="">Entire Site</option>
                {subLevels.map((sl: string) => <option key={sl} value={sl}>{sl}</option>)}
              </select>
            </div>
          </div>

          {/* Items Section */}
          <div>
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-bold text-[14px]">Items to Transfer</h3>
              <div className="flex gap-2 items-center">
                <select value={selectedItemRow.itemId} onChange={(e) => {
                  const id = e.target.value;
                  setSelectedItemRow({ ...selectedItemRow, itemId: id });
                  setAvailableStock(getStockForItem(id));
                }} className="border rounded-xl px-3 py-1.5 text-[12px] w-48">
                  <option value="">Select Item</option>
                  {inventoryItems.map((item: any) => {
                    const stock = getStockForItem(item.id);
                    return <option key={item.id} value={item.id} disabled={stock === 0}>{item.name} ({stock} {item.unit})</option>;
                  })}
                </select>
                <input type="number" min="1" value={selectedItemRow.quantity} onChange={(e) => setSelectedItemRow({ ...selectedItemRow, quantity: Number(e.target.value) })} placeholder="Qty" className="border rounded-xl px-3 py-1.5 text-[12px] w-24" />
                <button onClick={handleSelectItem} className="bg-emerald-600 text-white px-3 py-1.5 rounded-xl text-[12px] flex items-center gap-1"><Plus size={12}/> Add</button>
              </div>
            </div>
            {form.items.length === 0 ? (
              <div className="border-2 border-dashed border-slate-200 rounded-xl py-8 text-center text-slate-400 text-[12px]">No items added yet.</div>
            ) : (
              <div className="border rounded-xl overflow-hidden">
                <table className="w-full text-[12px]">
                  <thead className="bg-slate-50">
                    <tr><th className="p-3 text-left">Item</th><th>Unit</th><th>Requested Qty</th><th>Available Stock</th><th className="w-10"></th></tr>
                  </thead>
                  <tbody>
                    {form.items.map((item) => (
                      <tr key={item.itemId} className="border-t">
                        <td className="p-3">{item.itemName}</td>
                        <td className="p-3">{item.unit}</td>
                        <td className="p-3"><input type="number" value={item.requestedQuantity} onChange={(e) => updateItemQuantity(item.itemId, Number(e.target.value))} className="w-20 border rounded px-2 py-1" /></td>
                        <td className="p-3">{item.availableStock} {item.unit}</td>
                        <td className="p-3"><button onClick={() => removeItem(item.itemId)} className="text-rose-500"><Trash2 size={14}/></button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Logistics */}
          <div className="grid grid-cols-2 gap-5">
            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">Assign Driver</label>
              <select value={form.driverId} onChange={(e) => setForm({ ...form, driverId: e.target.value })} className="w-full border rounded-xl px-4 py-2.5">
                <option value="">Select Driver</option>
                {employees.filter((e: any) => e.role === "Driver").map((e: any) => <option key={e.id} value={e.id}>{e.name} ({e.phone})</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">Assign Vehicle</label>
              <select value={form.vehicleId} onChange={(e) => setForm({ ...form, vehicleId: e.target.value })} className="w-full border rounded-xl px-4 py-2.5">
                <option value="">Select Vehicle</option>
                {vehicles.map((v: any) => <option key={v.id} value={v.id}>{v.plate} - {v.type}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">Notes / Instructions</label>
            <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} className="w-full border rounded-xl px-4 py-2.5 resize-none" placeholder="Special instructions for driver or site team..." />
          </div>
        </div>
        <div className="px-6 py-4 border-t border-slate-100 flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 border rounded-xl text-[13px] font-semibold">Cancel</button>
          <button onClick={handleSubmit} className="flex-1 py-2.5 bg-emerald-600 text-white rounded-xl text-[13px] font-semibold flex items-center justify-center gap-2"><SendIcon size={14}/> Create Transfer Note</button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TRANSFER NOTE DETAIL DRAWER
// ─────────────────────────────────────────────────────────────────────────────

function TransferNoteDrawer({ note, onClose, onUpdateStatus }: any) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 bg-white px-6 py-4 border-b flex justify-between items-center">
          <div><p className="text-[11px] font-mono text-slate-400">{note.transferId}</p><h3 className="font-bold text-[16px]">Transfer Note</h3></div>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-100"><X size={18}/></button>
        </div>
        <div className="p-6 space-y-5">
          <div className="grid grid-cols-2 gap-4 text-[13px]">
            <div><span className="text-slate-400">From:</span> {note.fromName}</div>
            <div><span className="text-slate-400">To:</span> {note.toSiteName || note.toSiteId}</div>
            <div><span className="text-slate-400">Status:</span> <TransferStatusBadge status={note.status} /></div>
            <div><span className="text-slate-400">Requested:</span> {formatDate(note.requestedDate)}</div>
            {note.dispatchedDate && <div><span className="text-slate-400">Dispatched:</span> {formatDate(note.dispatchedDate)}</div>}
            {note.driverId && <div><span className="text-slate-400">Driver:</span> {note.driverName || note.driverId}</div>}
          </div>
          <div><h4 className="font-semibold mb-2">Items</h4><table className="w-full text-[12px] border"><thead className="bg-slate-50"><tr><th className="p-2">Item</th><th>Unit</th><th>Requested</th><th>Issued</th><th>Received</th></tr></thead><tbody>{note.items.map((i: any) => (<tr key={i.id} className="border-t"><td className="p-2">{i.itemName}</td><td>{i.unit}</td><td>{i.requestedQuantity}</td><td>{i.issuedQuantity ?? "-"}</td><td>{i.receivedQuantity ?? "-"}</td></tr>))}</tbody></table></div>
          {note.notes && <div><span className="text-slate-400">Notes:</span> {note.notes}</div>}
          {note.status !== "COMPLETED" && (
            <div className="flex gap-2 pt-2">
              {note.status === "DRAFT" && <button onClick={() => onUpdateStatus(note.id, "SUBMITTED")} className="px-3 py-1 bg-blue-600 text-white rounded-lg text-[11px]">Submit Transfer</button>}
              {note.status === "SUBMITTED" && <button onClick={() => onUpdateStatus(note.id, "IN_TRANSIT")} className="px-3 py-1 bg-purple-600 text-white rounded-lg text-[11px]">Mark In Transit</button>}
              {note.status === "IN_TRANSIT" && <button onClick={() => onUpdateStatus(note.id, "RECEIVED")} className="px-3 py-1 bg-amber-600 text-white rounded-lg text-[11px]">Mark Received</button>}
              {note.status === "RECEIVED" && <button onClick={() => onUpdateStatus(note.id, "COMPLETED")} className="px-3 py-1 bg-emerald-600 text-white rounded-lg text-[11px]">Complete Transfer</button>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SITE DASHBOARD (with Transfer Notes tab)
// ─────────────────────────────────────────────────────────────────────────────

function SiteDashboard({ site, onBack, tasks, setTasks, employees, vehicles, inventoryItems, allSites }: any) {
  const [activeTab, setActiveTab] = useState<"tasks" | "transfers" | "vehicles" | "logs">("transfers");
  const [selectedSubLevel, setSelectedSubLevel] = useState<string>("ALL");
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [selectedTransfer, setSelectedTransfer] = useState<any>(null);

  const subLevelOptions = ["ALL", ...site.subLevels];

  const filteredTransfers = tasks.flatMap((t: any) => t.transferNotes || []).filter((tn: any) => selectedSubLevel === "ALL" || tn.toSubLevel === selectedSubLevel);
  const filteredVehicles = tasks.flatMap((t: any) => t.assignedVehicles).filter((v: any) => selectedSubLevel === "ALL" || v.subLevel === selectedSubLevel);
  const filteredLogs = tasks.flatMap((t: any) => t.dailyLogs).filter((l: any) => selectedSubLevel === "ALL" || l.subLevel === selectedSubLevel);

  const addTransferNote = (taskId: string, note: TransferNote) => {
    setTasks(tasks.map((t: any) => t.id === taskId ? { ...t, transferNotes: [...(t.transferNotes || []), note], updatedAt: new Date().toISOString() } : t));
  };

  const updateTransferStatus = (transferId: string, newStatus: TransferStatus) => {
    setTasks(tasks.map((t: any) => ({
      ...t,
      transferNotes: t.transferNotes?.map((tn: any) => tn.id === transferId ? { ...tn, status: newStatus, updatedAt: new Date().toISOString() } : tn)
    })));
  };

  // For simplicity, we'll allow adding transfer to any task; in real app you'd pick a task. Here we'll add to first task or create a generic transfer.
  const handleAddTransfer = (note: TransferNote) => {
    if (tasks.length > 0) {
      addTransferNote(tasks[0].id, note);
    } else {
      // Create a dummy task if none exists
      const newTask: SiteTask = {
        id: uid(), taskId: `TASK-${Math.floor(Math.random()*10000)}`, jobName: "Material Transfer", description: "Transfer from " + note.fromName, priority: "MEDIUM", status: "APPROVED", taskType: "MATERIAL_TRANSFER",
        startDate: todayStr(), dueDate: todayStr(), assignedSiteManagerId: "", assignedTechnicalOfficerId: "", assignedSupervisorId: "", assignedVehicles: [], transferNotes: [note], dailyLogs: [],
        createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), notes: "", photos: [], subLevel: note.toSubLevel
      };
      setTasks([...tasks, newTask]);
    }
    setShowTransferModal(false);
  };

  return (
    <div className="min-h-screen bg-[#f7f8fb]">
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-5 py-4">
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="p-1.5 rounded-lg hover:bg-slate-100"><ChevronLeft size={18} /></button>
            <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white"><Building2 size={18} /></div>
            <div><p className="text-[11px] font-mono text-slate-400">{site.code}</p><h1 className="text-[20px] font-extrabold text-slate-800">{site.name}</h1></div>
          </div>
          <div className="mt-3 flex items-center gap-2"><FolderTree size={14} className="text-slate-400"/><span className="text-[11px] font-medium">Sub-level:</span>
            <select value={selectedSubLevel} onChange={(e) => setSelectedSubLevel(e.target.value)} className="border rounded-lg px-3 py-1.5 text-[12px]">{subLevelOptions.map(opt => <option key={opt} value={opt}>{opt === "ALL" ? "📁 Entire Site" : opt}</option>)}</select>
          </div>
          <div className="flex gap-4 mt-4 border-b">
            <button onClick={() => setActiveTab("transfers")} className={`pb-2 text-[13px] font-semibold ${activeTab === "transfers" ? "text-emerald-600 border-b-2 border-emerald-600" : "text-slate-400"}`}>Transfer Notes</button>
            <button onClick={() => setActiveTab("tasks")} className={`pb-2 text-[13px] font-semibold ${activeTab === "tasks" ? "text-emerald-600 border-b-2 border-emerald-600" : "text-slate-400"}`}>Tasks</button>
            <button onClick={() => setActiveTab("vehicles")} className={`pb-2 text-[13px] font-semibold ${activeTab === "vehicles" ? "text-emerald-600 border-b-2 border-emerald-600" : "text-slate-400"}`}>Vehicles</button>
            <button onClick={() => setActiveTab("logs")} className={`pb-2 text-[13px] font-semibold ${activeTab === "logs" ? "text-emerald-600 border-b-2 border-emerald-600" : "text-slate-400"}`}>Daily Logs</button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-5">
        {activeTab === "transfers" && (
          <div>
            <div className="flex justify-between items-center mb-4"><h2 className="font-bold text-[15px]">Material Transfer Notes</h2><button onClick={() => setShowTransferModal(true)} className="bg-emerald-600 text-white px-3 py-1.5 rounded-lg text-[12px] flex items-center gap-1"><Plus size={12}/> New Transfer</button></div>
            {filteredTransfers.length === 0 ? <div className="text-center py-12 text-slate-400">No transfer notes for this sub‑level.</div> : (
              <div className="space-y-3">
                {filteredTransfers.map((tn: TransferNote) => (
                  <div key={tn.id} className="bg-white border rounded-xl p-4 hover:shadow-sm cursor-pointer" onClick={() => setSelectedTransfer(tn)}>
                    <div className="flex justify-between items-start"><div><div className="flex items-center gap-2"><span className="font-mono text-[11px] text-slate-400">{tn.transferId}</span><TransferStatusBadge status={tn.status} /></div><p className="font-semibold mt-1">{tn.fromName} → {site.name}</p><p className="text-[12px] text-slate-500">{tn.items.length} item(s) · {tn.items.reduce((s,i)=>s+i.requestedQuantity,0)} units</p></div><ArrowRight size={16} className="text-slate-300"/></div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        {activeTab === "tasks" && (
          <div><h2 className="font-bold mb-4">Site Tasks</h2>{tasks.length === 0 ? <div className="text-center py-12 text-slate-400">No tasks.</div> : tasks.map((t:any)=> <div key={t.id} className="bg-white border rounded-xl p-3 mb-2">{t.jobName}</div>)}</div>
        )}
        {activeTab === "vehicles" && (
          <div><h2 className="font-bold mb-4">Vehicles</h2>{filteredVehicles.length === 0 ? <div className="text-center py-12 text-slate-400">No vehicles.</div> : filteredVehicles.map((v:any)=><div key={v.id} className="bg-white border rounded-xl p-3 mb-2">{v.vehiclePlate} - {v.driver}</div>)}</div>
        )}
        {activeTab === "logs" && (
          <div><h2 className="font-bold mb-4">Daily Logs</h2>{filteredLogs.length === 0 ? <div className="text-center py-12 text-slate-400">No logs.</div> : filteredLogs.map((l:any)=><div key={l.id} className="bg-white border rounded-xl p-3 mb-2">{formatDate(l.date)}: {l.materialsUsed}</div>)}</div>
        )}
      </div>

      <TransferNoteModal open={showTransferModal} onClose={() => setShowTransferModal(false)} onSubmit={handleAddTransfer} taskId={tasks[0]?.id} currentSite={site} subLevels={site.subLevels} sites={allSites} inventoryItems={inventoryItems} employees={employees} vehicles={vehicles} />
      {selectedTransfer && <TransferNoteDrawer note={selectedTransfer} onClose={() => setSelectedTransfer(null)} onUpdateStatus={updateTransferStatus} />}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────────────────────────────

export default function SiteTaskManagerPage() {
  const [selectedSite, setSelectedSite] = useState<Site | null>(null);
  const [sites] = useState(SITES);
  const [employees] = useState(EMPLOYEES);
  const [vehicles] = useState(VEHICLES);
  const [inventoryItems] = useState(INVENTORY_ITEMS);
  const [tasksBySite, setTasksBySite] = useState<Record<string, SiteTask[]>>(SITE_TASKS_MAP);
  const [search, setSearch] = useState("");

  const filteredSites = sites.filter(s => s.name.toLowerCase().includes(search.toLowerCase()) || s.code.toLowerCase().includes(search.toLowerCase()));

  const updateSiteTasks = (siteId: string, newTasks: SiteTask[]) => {
    setTasksBySite(prev => ({ ...prev, [siteId]: newTasks }));
  };

  if (selectedSite) {
    return <SiteDashboard site={selectedSite} onBack={() => setSelectedSite(null)} tasks={tasksBySite[selectedSite.id] || []} setTasks={(newTasks: SiteTask[]) => updateSiteTasks(selectedSite.id, newTasks)} employees={employees} vehicles={vehicles} inventoryItems={inventoryItems} allSites={sites} />;
  }

  return (
    <div className="min-h-screen bg-[#f7f8fb] p-5 font-sans">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6"><h1 className="text-[22px] font-extrabold text-slate-800">Site Task Manager</h1><p className="text-[13px] text-slate-400">Manage transfers, tasks, vehicles, and logs per site and sub‑level.</p></div>
        <div className="bg-white rounded-2xl border p-3 flex gap-3 mb-4"><div className="relative flex-1"><Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2"/><input value={search} onChange={(e)=>setSearch(e.target.value)} placeholder="Search site..." className="w-full pl-9 pr-3 py-2 border rounded-xl bg-slate-50 text-[12px]" /></div></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSites.map(site => (
            <div key={site.id} onClick={() => setSelectedSite(site)} className="bg-white rounded-2xl border p-5 cursor-pointer hover:shadow-md transition">
              <div className="flex items-center gap-2"><div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center"><Building2 size={18}/></div><div><p className="text-[10px] font-mono text-slate-400">{site.code}</p><h3 className="font-bold">{site.name}</h3></div></div>
              <div className="mt-3 text-[12px] text-slate-500 flex items-center gap-1"><MapPin size={11}/> {site.location}</div>
              <div className="mt-4 flex justify-between text-center"><div><p className="text-[18px] font-bold">{tasksBySite[site.id]?.length || 0}</p><p className="text-[10px] text-slate-400">Tasks</p></div><div><p className="text-[18px] font-bold text-amber-600">{tasksBySite[site.id]?.flatMap(t=>t.transferNotes).length || 0}</p><p className="text-[10px] text-slate-400">Transfers</p></div></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}