"use client";

import { useEffect, useState, useRef } from "react";
import { apiFetch } from "@/lib/api";
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

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function formatDate(d: string) { 
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }); 
}

function getPersonName(id: string | undefined) {
  if (!id) return "—";
  return id;
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
  const [sites, setSites] = useState<Site[]>([]);
  const [siteTasks, setSiteTasks] = useState<Record<string, SiteTask[]>>({});
  const [transferNotes, setTransferNotes] = useState<TransferNote[]>([]);
  const [returnNotes, setReturnNotes] = useState<SiteReturnNote[]>([]);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [selectedSiteId, setSelectedSiteId] = useState<string>("");
  const [dateFrom, setDateFrom] = useState<string>(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10));
  const [dateTo, setDateTo] = useState<string>(new Date().toISOString().slice(0, 10));
  const [apiError, setApiError] = useState("");
  const [loading, setLoading] = useState(true);
  const reportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        setApiError("");
        const [sitesData, tasksData, transfersData, returnsData, itemsData] = await Promise.all([
          apiFetch("/site-locations"),
          apiFetch("/tasks"),
          apiFetch("/transfer-notes"),
          apiFetch("/return-notes"),
          apiFetch("/items"),
        ]);

        const mappedSites = Array.isArray(sitesData) ? sitesData.map(normalizeSite).filter((site) => site.id) : [];
        const siteNameById = new Map(mappedSites.map((site) => [site.id, site.name]));
        setSites(mappedSites);
        setSelectedSiteId((current) => current && mappedSites.some((site) => site.id === current) ? current : mappedSites[0]?.id || "");

        const groupedTasks: Record<string, SiteTask[]> = {};
        if (Array.isArray(tasksData)) {
          tasksData.forEach((task: any) => {
            const siteId = String(task?.siteId || task?.siteLocationId || task?.locationId || "");
            if (!siteId) return;
            groupedTasks[siteId] = [...(groupedTasks[siteId] || []), normalizeSiteTask(task)];
          });
        }
        setSiteTasks(groupedTasks);

        setTransferNotes(Array.isArray(transfersData) ? transfersData.map((item) => normalizeTransfer(item, siteNameById)) : []);
        setReturnNotes(Array.isArray(returnsData) ? returnsData.map((item) => normalizeReturn(item, siteNameById)) : []);
        setInventoryItems(Array.isArray(itemsData) ? itemsData.map(normalizeSiteStock) : []);
      } catch (error: any) {
        console.warn("Site report live load failed", error);
        setApiError(error?.message || "Unable to load live site report data.");
        setSites([]);
        setSiteTasks({});
        setTransferNotes([]);
        setReturnNotes([]);
        setInventoryItems([]);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const site = sites.find(s => s.id === selectedSiteId) || sites[0];
  const tasks = site ? siteTasks[site.id] || [] : [];
  
  // Filter by date range
  const filteredTasks = tasks.filter(t => {
    const taskDate = new Date(t.startDate);
    const from = new Date(dateFrom);
    const to = new Date(dateTo);
    return taskDate >= from && taskDate <= to;
  });
  
  const noteInRange = (date: string) => {
    const noteDate = new Date(date || 0);
    return noteDate >= new Date(dateFrom) && noteDate <= new Date(dateTo);
  };
  const allTransfers = [
    ...filteredTasks.flatMap(t => t.transferNotes),
    ...transferNotes.filter((tr) => site && tr.toSiteId === site.id && noteInRange(tr.requestedDate)),
  ];
  const allReturns = [
    ...filteredTasks.flatMap(t => t.returnNotes || []),
    ...returnNotes.filter((ret) => site && ret.siteId === site.id && noteInRange(ret.requestDate)),
  ];
  const allDailyLogs = filteredTasks.flatMap(t => t.dailyLogs);
  const allVehicles = filteredTasks.flatMap(t => t.assignedVehicles);
  const siteStock = inventoryItems.map(item => ({
    name: item.name,
    unit: item.unit,
    quantity: site ? item.siteStock?.[site.id] || 0 : 0,
    type: item.type
  })).filter(s => s.quantity > 0);

  const totalTasks = filteredTasks.length;
  const inProgressTasks = filteredTasks.filter(t => ["IN_PROGRESS", "WORK_STARTED", "MATERIAL_SENT"].includes(t.status)).length;
  const completedTasks = filteredTasks.filter(t => ["COMPLETED", "VERIFIED", "CLOSED"].includes(t.status)).length;
  const delayedTasks = filteredTasks.filter(t => new Date(t.dueDate) < new Date() && !["COMPLETED", "VERIFIED", "CLOSED"].includes(t.status)).length;

  const handlePrint = () => {
    if (!site) return;
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

  if (!site) {
    return (
      <div className="min-h-screen bg-[#f7f8fb] p-5 font-sans">
        <div className="max-w-7xl mx-auto bg-white rounded-2xl border border-slate-100 p-8 text-center text-slate-500">
          {loading ? "Loading site report data..." : apiError ? `Live data unavailable: ${apiError}` : "No site data available."}
        </div>
      </div>
    );
  }

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
            <p className="text-[13px] text-slate-400">{apiError ? `Live data unavailable: ${apiError}` : "Complete operational history and metrics from live site records"}</p>
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
                {sites.map(s => <option key={s.id} value={s.id}>{s.name} ({s.code})</option>)}
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

function normalizeSite(raw: any): Site {
  return {
    id: String(raw?.id || ""),
    code: String(raw?.id || raw?.code || ""),
    name: String(raw?.siteName || raw?.name || "Unnamed Site"),
    location: String(raw?.region || raw?.location || raw?.address || "—"),
    manager: String(raw?.manager || "—"),
    technicalOfficer: String(raw?.technicalOfficer || "—"),
    supervisor: String(raw?.supervisor || "—"),
    status: String(raw?.status || "Active").toLowerCase().includes("inactive") ? "Inactive" : "Active",
    startDate: String(raw?.startDate || raw?.createdAt || ""),
    expectedEndDate: String(raw?.expectedEndDate || ""),
    address: String(raw?.address || "—"),
    client: String(raw?.client || "—"),
    subLevels: (raw?.subLevels || []).map((level: any) => typeof level === "string" ? level : level?.name).filter(Boolean),
  };

}

function normalizeSiteTask(raw: any): SiteTask {
  const status = String(raw?.status || "IN_PROGRESS").toUpperCase().replace(/\s+/g, "_") as TaskStatus;
  const priority = String(raw?.priority || "MEDIUM").toUpperCase() as SiteTask["priority"];
  return {
    id: String(raw?.id || raw?.taskId || ""),
    taskId: String(raw?.taskId || raw?.id || ""),
    jobName: String(raw?.jobName || raw?.title || "Task"),
    description: String(raw?.description || ""),
    priority: ["LOW", "MEDIUM", "HIGH", "URGENT"].includes(priority) ? priority : "MEDIUM",
    status: STATUS_STYLES[status] ? status : "IN_PROGRESS",
    taskType: String(raw?.taskType || "GENERAL"),
    startDate: String(raw?.startDate || raw?.createdAt || new Date().toISOString()),
    dueDate: String(raw?.dueDate || raw?.updatedAt || raw?.createdAt || new Date().toISOString()),
    assignedSiteManagerId: String(raw?.assignedSiteManagerId || raw?.managerId || ""),
    assignedTechnicalOfficerId: String(raw?.assignedTechnicalOfficerId || ""),
    assignedSupervisorId: String(raw?.assignedSupervisorId || ""),
    assignedVehicles: [],
    transferNotes: [],
    returnNotes: [],
    dailyLogs: [],
    createdAt: String(raw?.createdAt || ""),
    updatedAt: String(raw?.updatedAt || ""),
    notes: String(raw?.notes || ""),
    subLevel: String(raw?.subLevel || ""),
  };
}

function normalizeTransfer(raw: any, siteNameById: Map<string, string>): TransferNote {
  const items = (raw?.items || []).map((item: any) => ({
    id: String(item?.id || item?.itemId || item?.itemName || ""),
    itemId: String(item?.itemId || ""),
    itemName: String(item?.itemName || item?.name || "Item"),
    unit: String(item?.unit || "pcs"),
    requestedQuantity: Number(item?.quantity || item?.requestedQuantity || 0),
    issuedQuantity: Number(item?.issuedQuantity || item?.quantity || 0),
    receivedQuantity: Number(item?.receivedQuantity || 0),
    availableStock: Number(item?.availableStock || 0),
  }));
  return {
    id: String(raw?.id || ""),
    transferId: String(raw?.transferId || raw?.id || ""),
    fromType: "SITE",
    fromId: String(raw?.fromSiteId || raw?.fromLocationId || ""),
    fromName: siteNameById.get(String(raw?.fromSiteId)) || siteNameById.get(String(raw?.fromLocationId)) || String(raw?.fromSiteId || raw?.fromLocationId || "—"),
    toSiteId: String(raw?.toSiteId || raw?.toLocationId || ""),
    toSubLevel: siteNameById.get(String(raw?.toSiteId)) || "",
    items,
    status: String(raw?.status || "COMPLETED").toUpperCase() as TransferStatus,
    requestedDate: String(raw?.transferDate || raw?.createdAt || ""),
    requestedBy: String(raw?.requestedBy || "—"),
    notes: String(raw?.remarks || raw?.notes || ""),
  };
}

function normalizeReturn(raw: any, siteNameById: Map<string, string>): SiteReturnNote {
  const items = (raw?.items || []).map((item: any) => ({
    id: String(item?.id || item?.itemId || item?.itemName || ""),
    itemId: String(item?.itemId || ""),
    itemName: String(item?.itemName || item?.name || "Item"),
    unit: String(item?.unit || "pcs"),
    availableStock: Number(item?.availableStock || 0),
    returnedQuantity: Number(item?.quantity || item?.returnedQuantity || 0),
    reason: String(item?.reason || ""),
    condition: "Good" as ReturnItem["condition"],
  }));
  return {
    id: String(raw?.id || ""),
    returnNumber: String(raw?.returnNumber || raw?.id || ""),
    siteId: String(raw?.fromSiteId || raw?.fromLocationId || ""),
    siteName: siteNameById.get(String(raw?.fromSiteId)) || siteNameById.get(String(raw?.fromLocationId)) || "—",
    subLevel: "",
    destinationType: "WAREHOUSE",
    destinationId: String(raw?.toSiteId || raw?.toLocationId || ""),
    destinationName: siteNameById.get(String(raw?.toSiteId)) || siteNameById.get(String(raw?.toLocationId)) || String(raw?.toSiteId || raw?.toLocationId || "—"),
    items,
    status: String(raw?.status || "COMPLETED").toUpperCase() as ReturnStatus,
    requestDate: String(raw?.returnDate || raw?.createdAt || ""),
    requestedBy: String(raw?.requestedBy || "—"),
    notes: String(raw?.remarks || raw?.notes || ""),
    createdAt: String(raw?.createdAt || ""),
    updatedAt: String(raw?.updatedAt || ""),
  };
}

function normalizeSiteStock(entry: any): InventoryItem {
  const item = entry?.item ?? entry;
  const type = String(entry?.type || item?.type || "Consumable").toLowerCase();
  return {
    id: String(item?.id || entry?.id || ""),
    name: String(item?.itemName || item?.name || item?.model || "Item"),
    type: type === "tool" ? "Tool" : type === "reusable" ? "Reusable" : "Consumable",
    unit: String(item?.unit || (type === "tool" ? "pcs" : "")),
    quantity: type === "tool" ? 1 : Number(item?.quantity || item?.pieceNum || 0),
    siteStock: { [String(item?.locationId || item?.location?.id || "")]: type === "tool" ? 1 : Number(item?.quantity || item?.pieceNum || 0) },
  };
}
