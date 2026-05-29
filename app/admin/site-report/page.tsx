"use client";

import { useState, useRef } from "react";
import {
  Building2, MapPin, Calendar, User, Phone, Mail, FileText,
  Package, Truck, Clock, CheckCircle, AlertCircle, TrendingUp,
  TrendingDown, ArrowRightLeft, Printer, Download, ChevronDown,
  Filter, X, Search, Eye, Layers, Users, HardHat, Boxes,
  ClipboardList, ListChecks, CalendarDays, Activity, BarChart3,
  Undo2, Warehouse
} from "lucide-react";
import Badge from "@/components/shared/Badge";

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

type TaskStatus = 
  | "DRAFT" | "APPROVED" | "MATERIAL_REQUESTED" | "MATERIAL_SENT"
  | "WORK_STARTED" | "IN_PROGRESS" | "WAITING_RETURN" | "COMPLETED"
  | "VERIFIED" | "CLOSED";

type TransferStatus = "DRAFT" | "SUBMITTED" | "IN_TRANSIT" | "RECEIVED" | "COMPLETED";
type ReturnStatus = "DRAFT" | "SUBMITTED" | "APPROVED" | "IN_TRANSIT" | "RECEIVED" | "COMPLETED" | "CANCELLED";

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

interface TransferItem {
  id: string;
  itemId: string;
  itemName: string;
  unit: string;
  requestedQuantity: number;
  issuedQuantity?: number;
  receivedQuantity?: number;
  availableStock: number;
}

interface TransferNote {
  id: string;
  transferId: string;
  fromType: "WAREHOUSE" | "SITE";
  fromId: string;
  fromName: string;
  toSiteId: string;
  toSubLevel: string;
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
}

// Return Note types
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

interface SiteReturnNote {
  id: string;
  returnNumber: string;
  siteId: string;
  siteName: string;
  subLevel: string;
  destinationType: "WAREHOUSE" | "SUPPLIER";
  destinationId: string;
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

interface SiteTask {
  id: string;
  taskId: string;
  jobName: string;
  description: string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  status: TaskStatus;
  taskType: string;
  startDate: string;
  dueDate: string;
  actualStartDate?: string;
  actualEndDate?: string;
  assignedSiteManagerId: string;
  assignedTechnicalOfficerId: string;
  assignedSupervisorId: string;
  assignedDriverId?: string;
  assignedVehicles: VehicleAssignment[];
  transferNotes: TransferNote[];
  returnNotes: SiteReturnNote[];   // added
  dailyLogs: DailyLog[];
  createdAt: string;
  updatedAt: string;
  notes: string;
  subLevel: string;
}

interface InventoryItem {
  id: string;
  name: string;
  type: string;
  unit: string;
  quantity: number;
  siteStock?: Record<string, number>;
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

const EMPLOYEES = [
  { id: "emp1", name: "Anil Perera", role: "Site Manager", phone: "+94 77 123 4567" },
  { id: "emp2", name: "Kamala Wijesinghe", role: "Technical Officer", phone: "+94 77 234 5678" },
  { id: "emp3", name: "Ruwantha Bandara", role: "Supervisor", phone: "+94 76 345 6789" },
  { id: "emp9", name: "John Mwangi", role: "Site Manager", phone: "+254 700 123 456" },
  { id: "emp10", name: "Sarah Kimani", role: "Technical Officer", phone: "+254 700 234 567" },
  { id: "emp11", name: "James Otieno", role: "Supervisor", phone: "+254 700 345 678" },
  { id: "emp4", name: "Nalini Fernando", role: "Site Manager", phone: "+94 71 456 7890" },
  { id: "emp5", name: "Suresh Mendis", role: "Technical Officer", phone: "+94 70 567 8901" },
  { id: "emp6", name: "Dilani Rathnayake", role: "Supervisor", phone: "+94 77 678 9012" },
  { id: "emp7", name: "Kasun Perera", role: "Driver", phone: "+94 75 789 0123" },
];

const VEHICLES = [
  { id: "veh1", plate: "LRY-001", type: "Lorry", driver: "Kasun Perera", status: "Available" },
];

const INVENTORY_ITEMS: InventoryItem[] = [
  { id: "item1", name: "OPC Cement 50kg", type: "Consumable", unit: "Bags", quantity: 500, siteStock: { site1: 250, site2: 100, site3: 50 } },
  { id: "item2", name: "T12 Rebar", type: "Consumable", unit: "kg", quantity: 5000, siteStock: { site1: 1200, site2: 800, site3: 400 } },
  { id: "item3", name: "Scaffolding Frame", type: "Reusable", unit: "frames", quantity: 150, siteStock: { site1: 45, site2: 30, site3: 20 } },
  { id: "item4", name: "Angle Grinder", type: "Tool", unit: "pcs", quantity: 10, siteStock: { site1: 4, site2: 2, site3: 1 } },
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
    status: "COMPLETED",
    requestDate: "2026-05-22",
    requestedBy: "Anil Perera",
    approvedBy: "Kamala Wijesinghe",
    dispatchDate: "2026-05-23",
    receivedDate: "2026-05-24",
    vehicleId: "veh1",
    driverId: "emp7",
    notes: "Return excess cement and unused scaffolding",
    createdAt: "2026-05-22T08:00:00Z",
    updatedAt: "2026-05-24T14:00:00Z",
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
    status: "IN_TRANSIT",
    requestDate: "2026-05-20",
    requestedBy: "John Mwangi",
    approvedBy: "Sarah Kimani",
    dispatchDate: "2026-05-21",
    notes: "Return incorrect rebar grade",
    createdAt: "2026-05-20T09:00:00Z",
    updatedAt: "2026-05-21T14:00:00Z",
  },
];

const SITE_TASKS: Record<string, SiteTask[]> = {
  site1: [
    {
      id: "task1", taskId: "TASK-2026-0001", jobName: "Foundation Concrete Pour",
      description: "Pour concrete for foundation of Block A.", priority: "HIGH", status: "MATERIAL_SENT",
      taskType: "CONCRETE_POUR", startDate: "2026-05-20", dueDate: "2026-05-25",
      assignedSiteManagerId: "emp1", assignedTechnicalOfficerId: "emp2", assignedSupervisorId: "emp3", assignedDriverId: "emp7",
      assignedVehicles: [
        { id: "va1", vehicleId: "veh1", vehiclePlate: "LRY-001", driver: "Kasun Perera", tripType: "MORNING", status: "IN_TRANSIT", departureTime: "2026-05-20T08:00:00", subLevel: "Block A Level 1" }
      ],
      transferNotes: [
        {
          id: "tn1", transferId: "TRF-2026-0001", fromType: "WAREHOUSE", fromId: "warehouse1", fromName: "Central Warehouse",
          toSiteId: "site1", toSubLevel: "Block A Level 1",
          items: [
            { id: "ti1", itemId: "item1", itemName: "OPC Cement 50kg", unit: "Bags", requestedQuantity: 200, issuedQuantity: 200, receivedQuantity: 180, availableStock: 500 },
            { id: "ti2", itemId: "item2", itemName: "T12 Rebar", unit: "kg", requestedQuantity: 2000, issuedQuantity: 2000, receivedQuantity: 2000, availableStock: 5000 }
          ],
          status: "IN_TRANSIT", requestedDate: "2026-05-18", requestedBy: "Anil Perera", approvedBy: "Kamala Wijesinghe",
          dispatchedDate: "2026-05-19", driverId: "emp7", vehicleId: "veh1", notes: "Priority delivery"
        }
      ],
      returnNotes: SEED_RETURNS.filter(r => r.siteId === "site1"),   // site1 returns
      dailyLogs: [
        { id: "dl1", date: "2026-05-20", workforceCount: 12, contractors: 4, supervisors: 2, materialsUsed: "100 bags cement, 1000kg rebar", equipmentHours: "Mixer: 4h", events: "Rain delay", photos: [], notes: "", subLevel: "Block A Level 1" }
      ],
      createdAt: "2026-05-18T10:00:00Z", updatedAt: "2026-05-20T08:00:00Z", notes: "", subLevel: "Block A Level 1"
    },
    {
      id: "task2", taskId: "TASK-2026-0003", jobName: "Block A Level 2 Masonry",
      description: "Brickwork for Block A Level 2.", priority: "MEDIUM", status: "IN_PROGRESS",
      taskType: "MASONRY", startDate: "2026-05-22", dueDate: "2026-05-30",
      assignedSiteManagerId: "emp1", assignedTechnicalOfficerId: "emp2", assignedSupervisorId: "emp3",
      assignedVehicles: [], transferNotes: [], returnNotes: [], dailyLogs: [],
      createdAt: "2026-05-21T09:00:00Z", updatedAt: "2026-05-22T07:30:00Z", notes: "", subLevel: "Block A Level 2"
    }
  ],
  site2: [
    {
      id: "task3", taskId: "TASK-2026-0002", jobName: "Excavation for Foundation",
      description: "Excavate area for building foundation.", priority: "MEDIUM", status: "IN_PROGRESS",
      taskType: "EXCAVATION", startDate: "2026-05-22", dueDate: "2026-05-28",
      assignedSiteManagerId: "emp9", assignedTechnicalOfficerId: "emp10", assignedSupervisorId: "emp11",
      assignedVehicles: [], transferNotes: [], returnNotes: SEED_RETURNS.filter(r => r.siteId === "site2"), dailyLogs: [],
      createdAt: "2026-05-19T09:00:00Z", updatedAt: "2026-05-22T07:30:00Z", notes: "", subLevel: "Phase 1 Ground"
    }
  ],
  site3: [],
};

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function formatDate(d: string) { 
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }); 
}

function getPersonName(id: string | undefined) {
  if (!id) return "—";
  const p = EMPLOYEES.find(e => e.id === id);
  return p ? p.name : id;
}

const STATUS_STYLES: Record<string, string> = {
  "DRAFT": "bg-slate-100 text-slate-600",
  "APPROVED": "bg-blue-100 text-blue-700",
  "MATERIAL_REQUESTED": "bg-amber-100 text-amber-700",
  "MATERIAL_SENT": "bg-purple-100 text-purple-700",
  "WORK_STARTED": "bg-indigo-100 text-indigo-700",
  "IN_PROGRESS": "bg-cyan-100 text-cyan-700",
  "WAITING_RETURN": "bg-orange-100 text-orange-700",
  "COMPLETED": "bg-emerald-100 text-emerald-700",
  "VERIFIED": "bg-teal-100 text-teal-700",
  "CLOSED": "bg-slate-100 text-slate-500",
};

const PRIORITY_STYLES = {
  LOW: "bg-slate-100 text-slate-600",
  MEDIUM: "bg-blue-100 text-blue-700",
  HIGH: "bg-orange-100 text-orange-700",
  URGENT: "bg-rose-100 text-rose-700",
};

const RETURN_STATUS_STYLES: Record<ReturnStatus, string> = {
  "DRAFT": "bg-slate-100 text-slate-600",
  "SUBMITTED": "bg-amber-100 text-amber-700",
  "APPROVED": "bg-blue-100 text-blue-700",
  "IN_TRANSIT": "bg-purple-100 text-purple-700",
  "RECEIVED": "bg-orange-100 text-orange-700",
  "COMPLETED": "bg-emerald-100 text-emerald-700",
  "CANCELLED": "bg-rose-100 text-rose-700",
};

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export default function SiteReportPage() {
  const [selectedSiteId, setSelectedSiteId] = useState<string>("site1");
  const [dateFrom, setDateFrom] = useState<string>("2026-05-01");
  const [dateTo, setDateTo] = useState<string>("2026-05-31");
  const reportRef = useRef<HTMLDivElement>(null);

  const site = SITES.find(s => s.id === selectedSiteId)!;
  const tasks = SITE_TASKS[selectedSiteId] || [];
  
  // Filter by date range
  const filteredTasks = tasks.filter(t => {
    const taskDate = new Date(t.startDate);
    const from = new Date(dateFrom);
    const to = new Date(dateTo);
    return taskDate >= from && taskDate <= to;
  });
  
  const allTransfers = filteredTasks.flatMap(t => t.transferNotes);
  const allReturns = filteredTasks.flatMap(t => t.returnNotes || []);
  const allDailyLogs = filteredTasks.flatMap(t => t.dailyLogs);
  const allVehicles = filteredTasks.flatMap(t => t.assignedVehicles);
  const siteStock = INVENTORY_ITEMS.map(item => ({
    name: item.name,
    unit: item.unit,
    quantity: item.siteStock?.[site.id] || 0,
    type: item.type
  })).filter(s => s.quantity > 0);

  const totalTasks = filteredTasks.length;
  const inProgressTasks = filteredTasks.filter(t => ["IN_PROGRESS", "WORK_STARTED", "MATERIAL_SENT"].includes(t.status)).length;
  const completedTasks = filteredTasks.filter(t => ["COMPLETED", "VERIFIED", "CLOSED"].includes(t.status)).length;
  const delayedTasks = filteredTasks.filter(t => new Date(t.dueDate) < new Date() && !["COMPLETED", "VERIFIED", "CLOSED"].includes(t.status)).length;

  const handlePrint = () => {
    const printContent = reportRef.current;
    if (!printContent) return;
    const win = window.open("", "_blank", "width=1200,height=800");
    if (!win) return;
    win.document.write(`
      <html><head><title>Site Report - ${site.name}</title>
      <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; margin: 30px; color: #1e293b; }
        .header { margin-bottom: 30px; border-bottom: 2px solid #059669; padding-bottom: 15px; }
        .title { font-size: 24px; font-weight: 800; }
        .subtitle { color: #64748b; margin-top: 5px; }
        .stats-grid { display: grid; grid-template-columns: repeat(4,1fr); gap: 15px; margin-bottom: 30px; }
        .stat-card { border: 1px solid #e2e8f0; border-radius: 12px; padding: 15px; text-align: center; }
        .stat-number { font-size: 28px; font-weight: 800; }
        .stat-label { font-size: 11px; color: #64748b; margin-top: 5px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        th { background: #f1f5f9; text-align: left; padding: 10px; font-size: 11px; text-transform: uppercase; }
        td { padding: 10px; border-bottom: 1px solid #f1f5f9; font-size: 12px; }
        h2 { font-size: 16px; margin: 20px 0 10px; color: #0f172a; }
        .badge { display: inline-block; padding: 2px 8px; border-radius: 20px; font-size: 10px; font-weight: 600; }
        .footer { margin-top: 40px; text-align: center; font-size: 10px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 15px; }
        @media print { body { margin: 0; } }
      </style>
      </head><body>
      <div class="header">
        <div class="title">${site.name}</div>
        <div class="subtitle">${site.code} · ${site.location} · ${site.client}</div>
        <div class="subtitle">Report Period: ${formatDate(dateFrom)} - ${formatDate(dateTo)}</div>
      </div>
      <div class="stats-grid">
        <div class="stat-card"><div class="stat-number">${totalTasks}</div><div class="stat-label">Total Tasks</div></div>
        <div class="stat-card"><div class="stat-number">${inProgressTasks}</div><div class="stat-label">In Progress</div></div>
        <div class="stat-card"><div class="stat-number">${completedTasks}</div><div class="stat-label">Completed</div></div>
        <div class="stat-card"><div class="stat-number">${delayedTasks}</div><div class="stat-label">Delayed</div></div>
      </div>
      <h2>📋 Tasks (${filteredTasks.length})</h2>
      <table><thead><tr><th>Task ID</th><th>Job Name</th><th>Sub‑level</th><th>Status</th><th>Priority</th><th>Due Date</th></tr></thead>
      <tbody>${filteredTasks.map(t => `<tr><td>${t.taskId}</td><td>${t.jobName}</td><td>${t.subLevel || "Entire Site"}</td><td><span class="badge">${t.status.replace("_"," ")}</span></td><td><span class="badge">${t.priority}</span></td><td>${formatDate(t.dueDate)}</td></tr>`).join("")}</tbody>
      </table>
      <h2>🚚 Transfer Notes (${allTransfers.length})</h2>
      <table><thead><tr><th>Transfer ID</th><th>From</th><th>To Sub‑level</th><th>Items</th><th>Status</th><th>Date</th></tr></thead>
      <tbody>${allTransfers.map(tr => `<tr><td>${tr.transferId}</td><td>${tr.fromName}</td><td>${tr.toSubLevel || "Entire Site"}</td><td>${tr.items.map(i=>`${i.itemName} (${i.requestedQuantity} ${i.unit})`).join(", ")}</td><td>${tr.status}</td><td>${formatDate(tr.requestedDate)}</td></tr>`).join("")}</tbody>
      </table>
      <h2>🔄 Returned Goods (${allReturns.length})</h2>
      <table><thead><tr><th>Return #</th><th>Returned To</th><th>Sub‑level</th><th>Items (Qty)</th><th>Status</th><th>Request Date</th></tr></thead>
      <tbody>${allReturns.map(r => `<tr><td>${r.returnNumber}</td><td>${r.destinationName}</td><td>${r.subLevel || "Entire Site"}</td><td>${r.items.map(i=>`${i.itemName} (${i.returnedQuantity} ${i.unit})`).join(", ")}</td><td><span class="badge">${r.status}</span></td><td>${formatDate(r.requestDate)}</td></tr>`).join("")}</tbody>
      </table>
      <h2>📝 Daily Logs (${allDailyLogs.length})</h2>
      <table><thead><tr><th>Date</th><th>Sub‑level</th><th>Workforce</th><th>Materials Used</th><th>Equipment Hours</th><th>Events</th></tr></thead>
      <tbody>${allDailyLogs.map(l => `<tr><td>${formatDate(l.date)}</td><td>${l.subLevel || "Entire Site"}</td><td>${l.workforceCount}</td><td>${l.materialsUsed}</td><td>${l.equipmentHours}</td><td>${l.events}</td></tr>`).join("")}</tbody>
      </table>
      <h2>🚛 Vehicles Assigned (${allVehicles.length})</h2>
      <table><thead><tr><th>Vehicle</th><th>Driver</th><th>Trip Type</th><th>Status</th><th>Sub‑level</th></tr></thead>
      <tbody>${allVehicles.map(v => `<tr><td>${v.vehiclePlate}</td><td>${v.driver}</td><td>${v.tripType}</td><td>${v.status}</td><td>${v.subLevel || "Entire Site"}</td></tr>`).join("")}</tbody>
      </table>
      <h2>📦 Current Stock at Site</h2>
      <table><thead><tr><th>Item</th><th>Quantity</th><th>Unit</th><th>Type</th></tr></thead>
      <tbody>${siteStock.map(s => `<tr><td>${s.name}</td><td>${s.quantity}</td><td>${s.unit}</td><td>${s.type}</td></tr>`).join("")}</tbody>
      </table>
      <div class="footer">Generated by VEIMS · ${new Date().toLocaleString()}</div>
      </body></html>
    `);
    win.document.close();
    setTimeout(() => win.print(), 400);
  };

  return (
    <div className="min-h-screen bg-[#f7f8fb] p-5 font-sans">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-start mb-6 flex-wrap gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-bold uppercase text-slate-400">Venus Enterprises</span>
              <ChevronDown size={10} className="text-slate-300" />
              <span className="text-[10px] font-bold uppercase text-emerald-600">Site Report</span>
            </div>
            <h1 className="text-[22px] font-extrabold text-slate-800">Site Performance Report</h1>
            <p className="text-[13px] text-slate-400">Complete operational history and metrics for any site</p>
          </div>
          <div className="flex gap-2">
            <button onClick={handlePrint} className="flex items-center gap-2 bg-slate-800 text-white px-4 py-2 rounded-xl text-[13px] font-semibold hover:bg-slate-700">
              <Printer size={14} /> Print Report
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 mb-5">
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">Select Site</label>
              <select value={selectedSiteId} onChange={(e) => setSelectedSiteId(e.target.value)} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-[13px] bg-white">
                {SITES.map(s => <option key={s.id} value={s.id}>{s.name} ({s.code})</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">From Date</label>
              <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="border border-slate-200 rounded-xl px-4 py-2.5 text-[13px]" />
            </div>
            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">To Date</label>
              <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="border border-slate-200 rounded-xl px-4 py-2.5 text-[13px]" />
            </div>
            <button onClick={() => {}} className="bg-emerald-600 text-white px-5 py-2.5 rounded-xl text-[13px] font-semibold">Apply Filter</button>
          </div>
        </div>

        {/* Report Content */}
        <div ref={reportRef}>
          {/* Site Summary Card */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 mb-5">
            <div className="flex justify-between items-start flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-emerald-600 flex items-center justify-center text-white"><Building2 size={22} /></div>
                <div><h2 className="text-[20px] font-extrabold text-slate-800">{site.name}</h2><p className="text-[12px] text-slate-500">{site.code} · {site.location}</p></div>
              </div>
              <div className="text-right"><p className="text-[11px] text-slate-400">Report Period</p><p className="text-[13px] font-semibold">{formatDate(dateFrom)} - {formatDate(dateTo)}</p></div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-5">
              <div><span className="text-[11px] text-slate-400">Client</span><p className="font-medium text-[13px]">{site.client}</p></div>
              <div><span className="text-[11px] text-slate-400">Address</span><p className="font-medium text-[13px]">{site.address}</p></div>
              <div><span className="text-[11px] text-slate-400">Site Manager</span><p className="font-medium text-[13px]">{site.manager}</p></div>
              <div><span className="text-[11px] text-slate-400">Technical Officer</span><p className="font-medium text-[13px]">{site.technicalOfficer}</p></div>
              <div><span className="text-[11px] text-slate-400">Supervisor</span><p className="font-medium text-[13px]">{site.supervisor}</p></div>
              <div><span className="text-[11px] text-slate-400">Start Date</span><p className="font-medium text-[13px]">{formatDate(site.startDate)}</p></div>
              <div><span className="text-[11px] text-slate-400">Expected End Date</span><p className="font-medium text-[13px]">{formatDate(site.expectedEndDate)}</p></div>
              <div><span className="text-[11px] text-slate-400">Status</span><p><span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${site.status === "Active" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>{site.status}</span></p></div>
            </div>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
            <div className="bg-white rounded-2xl border border-slate-200 p-4 text-center shadow-sm"><p className="text-[28px] font-extrabold text-slate-800">{totalTasks}</p><p className="text-[11px] text-slate-400">Total Tasks</p></div>
            <div className="bg-white rounded-2xl border border-slate-200 p-4 text-center shadow-sm"><p className="text-[28px] font-extrabold text-blue-600">{inProgressTasks}</p><p className="text-[11px] text-slate-400">In Progress</p></div>
            <div className="bg-white rounded-2xl border border-slate-200 p-4 text-center shadow-sm"><p className="text-[28px] font-extrabold text-emerald-600">{completedTasks}</p><p className="text-[11px] text-slate-400">Completed</p></div>
            <div className="bg-white rounded-2xl border border-slate-200 p-4 text-center shadow-sm"><p className="text-[28px] font-extrabold text-rose-600">{delayedTasks}</p><p className="text-[11px] text-slate-400">Delayed</p></div>
          </div>

          {/* TASKS TABLE */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden mb-5 shadow-sm">
            <div className="px-5 py-3 bg-gradient-to-r from-emerald-50 to-teal-50 border-b border-emerald-200 flex items-center gap-2">
              <ClipboardList size={16} className="text-emerald-700" />
              <h3 className="font-bold text-[14px] text-emerald-800">Tasks ({filteredTasks.length})</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-[12px] border-collapse">
                <thead>
                  <tr className="bg-emerald-100 border-b-2 border-emerald-300">
                    <th className="p-3 text-left font-bold text-emerald-900 border-r border-emerald-200">Task ID</th>
                    <th className="p-3 text-left font-bold text-emerald-900 border-r border-emerald-200">Job Name</th>
                    <th className="p-3 text-left font-bold text-emerald-900 border-r border-emerald-200">Sub‑level</th>
                    <th className="p-3 text-left font-bold text-emerald-900 border-r border-emerald-200">Status</th>
                    <th className="p-3 text-left font-bold text-emerald-900 border-r border-emerald-200">Priority</th>
                    <th className="p-3 text-left font-bold text-emerald-900 border-r border-emerald-200">Due Date</th>
                    <th className="p-3 text-left font-bold text-emerald-900">Assigned To</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredTasks.map(t => (
                    <tr key={t.id} className="hover:bg-slate-50">
                      <td className="p-3 font-mono text-slate-600 border-r border-slate-100">{t.taskId}</td>
                      <td className="p-3 font-medium text-slate-700 border-r border-slate-100">{t.jobName}</td>
                      <td className="p-3 text-slate-500 border-r border-slate-100">{t.subLevel || "Entire Site"}</td>
                      <td className="p-3 border-r border-slate-100"><span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${STATUS_STYLES[t.status]}`}>{t.status.replace("_"," ")}</span></td>
                      <td className="p-3 border-r border-slate-100"><span className={`text-[10px] px-2 py-0.5 rounded-full ${PRIORITY_STYLES[t.priority]}`}>{t.priority}</span></td>
                      <td className="p-3 text-slate-600 border-r border-slate-100">{formatDate(t.dueDate)}</td>
                      <td className="p-3 text-slate-500">{getPersonName(t.assignedSiteManagerId)}<br/>{getPersonName(t.assignedTechnicalOfficerId)}</td>
                    </tr>
                  ))}
                  {filteredTasks.length === 0 && <tr><td colSpan={7} className="p-8 text-center text-slate-400">No tasks</td></tr>}
                </tbody>
              </table>
            </div>
          </div>

          {/* TRANSFER NOTES TABLE */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden mb-5 shadow-sm">
            <div className="px-5 py-3 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-200 flex items-center gap-2">
              <ArrowRightLeft size={16} className="text-blue-700" />
              <h3 className="font-bold text-[14px] text-blue-800">Material Transfer Notes ({allTransfers.length})</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-[12px] border-collapse">
                <thead>
                  <tr className="bg-blue-100 border-b-2 border-blue-300">
                    <th className="p-3 text-left font-bold text-blue-900 border-r border-blue-200">Transfer ID</th>
                    <th className="p-3 text-left font-bold text-blue-900 border-r border-blue-200">From</th>
                    <th className="p-3 text-left font-bold text-blue-900 border-r border-blue-200">To Sub‑level</th>
                    <th className="p-3 text-left font-bold text-blue-900 border-r border-blue-200">Items</th>
                    <th className="p-3 text-left font-bold text-blue-900 border-r border-blue-200">Status</th>
                    <th className="p-3 text-left font-bold text-blue-900 border-r border-blue-200">Requested Date</th>
                    <th className="p-3 text-left font-bold text-blue-900">Driver/Vehicle</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {allTransfers.map(tr => (
                    <tr key={tr.id} className="hover:bg-slate-50">
                      <td className="p-3 font-mono text-slate-600 border-r border-slate-100">{tr.transferId}</td>
                      <td className="p-3 text-slate-700 border-r border-slate-100">{tr.fromName}</td>
                      <td className="p-3 text-slate-500 border-r border-slate-100">{tr.toSubLevel || "Entire Site"}</td>
                      <td className="p-3 text-slate-600 border-r border-slate-100">{tr.items.map(i => `${i.itemName} (${i.requestedQuantity} ${i.unit})`).join(", ")}</td>
                      <td className="p-3 border-r border-slate-100"><span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">{tr.status}</span></td>
                      <td className="p-3 text-slate-600 border-r border-slate-100">{formatDate(tr.requestedDate)}</td>
                      <td className="p-3 text-slate-500">{tr.driverId ? getPersonName(tr.driverId) : "—"}</td>
                    </tr>
                  ))}
                  {allTransfers.length === 0 && <tr><td colSpan={7} className="p-8 text-center text-slate-400">No transfers</td></tr>}
                </tbody>
              </table>
            </div>
          </div>

          {/* RETURNED GOODS TABLE (NEW) */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden mb-5 shadow-sm">
            <div className="px-5 py-3 bg-gradient-to-r from-orange-50 to-red-50 border-b border-orange-200 flex items-center gap-2">
              <Undo2 size={16} className="text-orange-700" />
              <h3 className="font-bold text-[14px] text-orange-800">Returned Goods ({allReturns.length})</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-[12px] border-collapse">
                <thead>
                  <tr className="bg-orange-100 border-b-2 border-orange-300">
                    <th className="p-3 text-left font-bold text-orange-900 border-r border-orange-200">Return #</th>
                    <th className="p-3 text-left font-bold text-orange-900 border-r border-orange-200">Returned To</th>
                    <th className="p-3 text-left font-bold text-orange-900 border-r border-orange-200">Sub‑level</th>
                    <th className="p-3 text-left font-bold text-orange-900 border-r border-orange-200">Items (Qty / Condition)</th>
                    <th className="p-3 text-left font-bold text-orange-900 border-r border-orange-200">Status</th>
                    <th className="p-3 text-left font-bold text-orange-900 border-r border-orange-200">Request Date</th>
                    <th className="p-3 text-left font-bold text-orange-900">Reason / Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {allReturns.map(r => (
                    <tr key={r.id} className="hover:bg-slate-50">
                      <td className="p-3 font-mono text-slate-600 border-r border-slate-100">{r.returnNumber}</td>
                      <td className="p-3 text-slate-700 border-r border-slate-100">{r.destinationName}</td>
                      <td className="p-3 text-slate-500 border-r border-slate-100">{r.subLevel || "Entire Site"}</td>
                      <td className="p-3 text-slate-600 border-r border-slate-100">
                        {r.items.map(i => `${i.itemName} (${i.returnedQuantity} ${i.unit})`).join(", ")}
                        <div className="text-[10px] text-slate-400 mt-1">{r.items.map(i => i.condition).join(", ")}</div>
                      </td>
                      <td className="p-3 border-r border-slate-100"><span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${RETURN_STATUS_STYLES[r.status]}`}>{r.status}</span></td>
                      <td className="p-3 text-slate-600 border-r border-slate-100">{formatDate(r.requestDate)}</td>
                      <td className="p-3 text-slate-500">{r.notes || r.items.map(i => i.reason).join(", ")}</td>
                    </tr>
                  ))}
                  {allReturns.length === 0 && <tr><td colSpan={7} className="p-8 text-center text-slate-400">No returned goods</td></tr>}
                </tbody>
              </table>
            </div>
          </div>

          {/* DAILY LOGS TABLE */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden mb-5 shadow-sm">
            <div className="px-5 py-3 bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-200 flex items-center gap-2">
              <FileText size={16} className="text-amber-700" />
              <h3 className="font-bold text-[14px] text-amber-800">Daily Logs ({allDailyLogs.length})</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-[12px] border-collapse">
                <thead>
                  <tr className="bg-amber-100 border-b-2 border-amber-300">
                    <th className="p-3 text-left font-bold text-amber-900 border-r border-amber-200">Date</th>
                    <th className="p-3 text-left font-bold text-amber-900 border-r border-amber-200">Sub‑level</th>
                    <th className="p-3 text-left font-bold text-amber-900 border-r border-amber-200">Workforce</th>
                    <th className="p-3 text-left font-bold text-amber-900 border-r border-amber-200">Materials Used</th>
                    <th className="p-3 text-left font-bold text-amber-900 border-r border-amber-200">Equipment Hours</th>
                    <th className="p-3 text-left font-bold text-amber-900">Events</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {allDailyLogs.map(l => (
                    <tr key={l.id} className="hover:bg-slate-50">
                      <td className="p-3 text-slate-600 border-r border-slate-100">{formatDate(l.date)}</td>
                      <td className="p-3 text-slate-500 border-r border-slate-100">{l.subLevel || "Entire Site"}</td>
                      <td className="p-3 font-medium text-slate-700 border-r border-slate-100">{l.workforceCount}</td>
                      <td className="p-3 text-slate-600 border-r border-slate-100">{l.materialsUsed}</td>
                      <td className="p-3 text-slate-600 border-r border-slate-100">{l.equipmentHours}</td>
                      <td className="p-3 text-slate-500">{l.events}</td>
                    </tr>
                  ))}
                  {allDailyLogs.length === 0 && <tr><td colSpan={6} className="p-8 text-center text-slate-400">No logs</td></tr>}
                </tbody>
              </table>
            </div>
          </div>

          {/* VEHICLES & STOCK */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="px-5 py-3 bg-gradient-to-r from-purple-50 to-pink-50 border-b border-purple-200 flex items-center gap-2">
                <Truck size={16} className="text-purple-700" />
                <h3 className="font-bold text-[14px] text-purple-800">Vehicles Assigned ({allVehicles.length})</h3>
              </div>
              <table className="w-full text-[12px] border-collapse">
                <thead>
                  <tr className="bg-purple-100 border-b-2 border-purple-300">
                    <th className="p-3 text-left font-bold text-purple-900 border-r border-purple-200">Vehicle</th>
                    <th className="p-3 text-left font-bold text-purple-900 border-r border-purple-200">Driver</th>
                    <th className="p-3 text-left font-bold text-purple-900 border-r border-purple-200">Trip Type</th>
                    <th className="p-3 text-left font-bold text-purple-900 border-r border-purple-200">Status</th>
                    <th className="p-3 text-left font-bold text-purple-900">Sub‑level</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {allVehicles.map(v => (
                    <tr key={v.id} className="hover:bg-slate-50">
                      <td className="p-3 font-mono text-slate-700 border-r border-slate-100">{v.vehiclePlate}</td>
                      <td className="p-3 text-slate-600 border-r border-slate-100">{v.driver}</td>
                      <td className="p-3 text-slate-600 border-r border-slate-100">{v.tripType}</td>
                      <td className="p-3 border-r border-slate-100"><span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100">{v.status}</span></td>
                      <td className="p-3 text-slate-500">{v.subLevel || "Entire Site"}</td>
                    </tr>
                  ))}
                  {allVehicles.length === 0 && <tr><td colSpan={5} className="p-8 text-center text-slate-400">No vehicles</td></tr>}
                </tbody>
              </table>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="px-5 py-3 bg-gradient-to-r from-emerald-50 to-green-50 border-b border-emerald-200 flex items-center gap-2">
                <Package size={16} className="text-emerald-700" />
                <h3 className="font-bold text-[14px] text-emerald-800">Current Stock on Site</h3>
              </div>
              <table className="w-full text-[12px] border-collapse">
                <thead>
                  <tr className="bg-emerald-100 border-b-2 border-emerald-300">
                    <th className="p-3 text-left font-bold text-emerald-900 border-r border-emerald-200">Item</th>
                    <th className="p-3 text-left font-bold text-emerald-900 border-r border-emerald-200">Quantity</th>
                    <th className="p-3 text-left font-bold text-emerald-900 border-r border-emerald-200">Unit</th>
                    <th className="p-3 text-left font-bold text-emerald-900">Type</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {siteStock.map(s => (
                    <tr key={s.name} className="hover:bg-slate-50">
                      <td className="p-3 font-medium text-slate-700 border-r border-slate-100">{s.name}</td>
                      <td className="p-3 font-bold text-slate-800 border-r border-slate-100">{s.quantity}</td>
                      <td className="p-3 text-slate-600 border-r border-slate-100">{s.unit}</td>
                      <td className="p-3 text-slate-500">{s.type}</td>
                    </tr>
                  ))}
                  {siteStock.length === 0 && <tr><td colSpan={4} className="p-8 text-center text-slate-400">No stock</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}