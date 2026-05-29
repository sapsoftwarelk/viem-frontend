"use client";

import { TrendingUp, TrendingDown, Package, Send, Wrench, DollarSign, Plus, Filter, ArrowUpRight, Truck, Building2, ClipboardList, ArrowRightLeft, AlertTriangle } from "lucide-react";
import Badge from "@/components/shared/Badge";
import Avatar from "@/components/shared/Avatar";
import Link from "next/link";

// Updated stats to reflect VEIMS modules
const stats = [
  {
    label: "Active Sites",
    value: "3",
    delta: "+2 this quarter",
    up: true,
    icon: Building2,
    iconBg: "bg-viems-blue-light",
    iconColor: "text-viems-blue",
  },
  {
    label: "Open Tasks",
    value: "8",
    delta: "4 in progress",
    up: null,
    icon: ClipboardList,
    iconBg: "bg-viems-amber-bg",
    iconColor: "text-viems-amber",
  },
  {
    label: "Pending Transfers",
    value: "3",
    delta: "2 waiting receipt",
    up: false,
    icon: ArrowRightLeft,
    iconBg: "bg-viems-red-bg",
    iconColor: "text-viems-red",
  },
  {
    label: "Low Stock Items",
    value: "2",
    delta: "1 critical",
    up: false,
    icon: Package,
    iconBg: "bg-viems-green-bg",
    iconColor: "text-viems-green",
  },
];

// Recent transfer notes (from the Transfer system)
const recentTransfers = [
  { ref: "TRF-2026-0001", from: "Central Warehouse", to: "Colombo City Tower", items: "Cement, Rebar", status: "IN_TRANSIT", badge: "blue" },
  { ref: "TRF-2026-0002", from: "Nairobi Business Park", to: "Central Warehouse", items: "Scaffolding", status: "RECEIVED", badge: "green" },
  { ref: "TRF-2026-0003", from: "Kandy Hills Resort", to: "Colombo City Tower", items: "Angle Grinder", status: "SUBMITTED", badge: "amber" },
  { ref: "TRF-2026-0004", from: "Central Warehouse", to: "Nairobi Business Park", items: "T12 Rebar", status: "DRAFT", badge: "gray" },
];

// Active tasks per site (simplified)
const activeTasks = [
  { site: "Colombo City Tower", task: "Foundation Concrete Pour", priority: "HIGH", status: "IN_PROGRESS", badge: "amber" },
  { site: "Nairobi Business Park", task: "Excavation", priority: "MEDIUM", status: "WORK_STARTED", badge: "blue" },
  { site: "Colombo City Tower", task: "Block A Masonry", priority: "MEDIUM", status: "MATERIAL_SENT", badge: "purple" },
];

// People / roles (from your employee system)
const people = [
  { name: "Anil Perera",    role: "Site Manager",       badge: "Site Mgr", color: "blue" as const },
  { name: "Kamala Wijesinghe", role: "TO / Inventory",  badge: "TO",       color: "green" as const },
  { name: "John Mwangi",    role: "Site Manager (NBO)", badge: "Site Mgr", color: "blue" as const },
  { name: "Kasun Perera",   role: "Driver",             badge: "Driver",   color: "amber" as const },
  { name: "Repair Tech",    role: "Workshop",           badge: "Tech",     color: "red" as const },
];

// Stock alerts
const stockAlerts = [
  { item: "OPC Cement", current: 45, min: 100, unit: "Bags", severity: "Critical" },
  { item: "T12 Rebar", current: 800, min: 1000, unit: "kg", severity: "Low" },
  { item: "Angle Grinder", current: 3, min: 5, unit: "pcs", severity: "Low" },
];

export default function AdminDashboard() {
  return (
    <div>
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div>
          <h1 className="text-[20px] font-bold text-gray-900 leading-tight">Dashboard</h1>
          <p className="text-[12px] text-gray-500 mt-0.5">VEIMS · Overview of all sites, tasks, and inventory</p>
        </div>
        <div className="flex gap-2">
          <button className="btn"><Filter size={14} /> Filter</button>
          <Link href="/admin/tasks/new" className="btn btn-primary"><Plus size={14} /> New Task</Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="stat-card">
              <div className="flex items-start justify-between mb-3">
                <p className="text-[11px] font-semibold text-gray-600 uppercase tracking-wide">{s.label}</p>
                <div className={`w-8 h-8 rounded-lg ${s.iconBg} flex items-center justify-center`}>
                  <Icon size={15} className={s.iconColor} />
                </div>
              </div>
              <p className="text-[24px] font-bold text-gray-900 leading-none">{s.value}</p>
              <div className="flex items-center gap-1 mt-1.5">
                {s.up === true  && <TrendingUp  size={12} className="text-viems-green" />}
                {s.up === false && <TrendingDown size={12} className="text-viems-red"   />}
                <p className={`text-[11px] font-medium ${s.up === true ? "text-viems-green" : s.up === false ? "text-viems-red" : "text-gray-500"}`}>
                  {s.delta}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Transfer Notes table */}
        <div className="xl:col-span-2 data-card">
          <div className="card-header">
            <h2 className="card-title">Recent Transfer Notes (Material Movements)</h2>
            <Link href="/admin/transfers" className="btn text-[11px] py-1">View all <ArrowUpRight size={12} /></Link>
          </div>
          <div className="overflow-x-auto">
            <table className="viems-table">
              <thead>
                <tr>
                  <th>Transfer ID</th>
                  <th>From → To</th>
                  <th className="hidden md:table-cell">Items</th>
                  <th>Status</th>
                  <th className="hidden lg:table-cell">Date</th>
                </tr>
              </thead>
              <tbody>
                {recentTransfers.map((t) => (
                  <tr key={t.ref}>
                    <td className="font-bold text-gray-900">{t.ref}</td>
                    <td className="text-gray-700 text-[12px]">{t.from} → {t.to}</td>
                    <td className="hidden md:table-cell text-gray-600">{t.items}</td>
                    <td><Badge variant={t.badge as any}>{t.status.replace('_', ' ')}</Badge></td>
                    <td className="hidden lg:table-cell text-gray-500">Today</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right column */}
        <div className="flex flex-col gap-4">
          {/* Active tasks */}
          <div className="data-card">
            <div className="card-header">
              <h2 className="card-title">Active Tasks by Site</h2>
              <Link href="/admin/tasks" className="btn text-[11px] py-1">All tasks ↗</Link>
            </div>
            <div className="px-4 py-2">
              {activeTasks.map((task, idx) => (
                <div key={idx} className="flex items-start gap-2 py-2.5 border-b border-viems-gray-border last:border-0">
                  <div className="flex-1">
                    <p className="text-[12px] font-bold text-gray-900">{task.task}</p>
                    <p className="text-[11px] text-gray-500">{task.site}</p>
                    <div className="flex gap-1 mt-1">
                      <Badge variant="gray">{task.priority}</Badge>
                      <Badge variant={task.badge as any}>{task.status.replace('_', ' ')}</Badge>
                    </div>
                  </div>
                </div>
              ))}
              {activeTasks.length === 0 && <p className="text-center text-gray-400 text-[12px] py-4">No active tasks</p>}
            </div>
          </div>

          {/* Stock alerts */}
          <div className="data-card">
            <div className="card-header">
              <h2 className="card-title">Stock Alerts</h2>
              <Link href="/admin/inventory" className="btn text-[11px] py-1">Inventory ↗</Link>
            </div>
            <div className="px-4 py-2 space-y-2">
              {stockAlerts.map((alert) => (
                <div key={alert.item} className="flex items-center justify-between py-1.5 border-b border-viems-gray-border last:border-0">
                  <div className="flex items-center gap-2">
                    <AlertTriangle size={12} className={alert.severity === "Critical" ? "text-red-500" : "text-amber-500"} />
                    <span className="text-[12px] font-medium text-gray-800">{alert.item}</span>
                  </div>
                  <div className="text-[11px] text-gray-500">{alert.current} / {alert.min} {alert.unit}</div>
                  <Badge variant={alert.severity === "Critical" ? "red" : "amber"}>{alert.severity}</Badge>
                </div>
              ))}
              {stockAlerts.length === 0 && <p className="text-center text-gray-400 text-[12px] py-4">All stock levels OK</p>}
            </div>
          </div>
        </div>
      </div>

      {/* Lower section: People & roles (optional) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        <div className="data-card">
          <div className="card-header">
            <h2 className="card-title">Key Personnel</h2>
            <Link href="/admin/persons" className="btn text-[11px] py-1">Manage ↗</Link>
          </div>
          <div className="px-4 py-2">
            {people.map((p) => (
              <div key={p.name} className="flex items-center gap-3 py-2.5 border-b border-viems-gray-border last:border-0">
                <Avatar initials={p.name.slice(0,2).toUpperCase()} color={p.color} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-bold text-gray-900 truncate">{p.name}</p>
                  <p className="text-[11px] text-gray-500 truncate">{p.role}</p>
                </div>
                <Badge variant={p.color === "gray" ? "gray" : p.color as any}>{p.badge}</Badge>
              </div>
            ))}
          </div>
        </div>

        {/* Quick links / system status */}
        <div className="data-card">
          <div className="card-header">
            <h2 className="card-title">Quick Actions</h2>
          </div>
          <div className="px-4 py-3 grid grid-cols-2 gap-2">
            <Link href="/admin/tasks/new" className="btn justify-center"><Plus size={12} /> New Task</Link>
            <Link href="/admin/transfers/new" className="btn justify-center"><Truck size={12} /> New Transfer</Link>
            <Link href="/admin/inventory/new" className="btn justify-center"><Package size={12} /> Add Stock</Link>
            <Link href="/admin/sites" className="btn justify-center"><Building2 size={12} /> Manage Sites</Link>
          </div>
          <div className="px-4 pb-3 text-[10px] text-gray-400 border-t border-viems-gray-border pt-2 mt-2">
            System status: All services operational · Last sync: 2 min ago
          </div>
        </div>
      </div>
    </div>
  );
}