"use client";

import { useEffect, useMemo, useState } from "react";
import { TrendingUp, TrendingDown, Package, Plus, Filter, ArrowUpRight, Truck, Building2, ClipboardList, ArrowRightLeft, AlertTriangle, Loader2 } from "lucide-react";
import Badge from "@/components/shared/Badge";
import Avatar from "@/components/shared/Avatar";
import Link from "next/link";
import { apiFetch } from "@/lib/api";

type SiteRecord = {
  id?: string;
  siteName?: string;
  name?: string;
  manager?: string;
  region?: string;
  status?: string;
};

type TaskRecord = {
  id?: string;
  title?: string;
  description?: string;
  priority?: string;
  status?: string;
  createdAt?: string;
};

type TransferRecord = {
  id?: string;
  ref?: string;
  transferId?: string;
  from?: string;
  to?: string;
  items?: string;
  status?: string;
  createdAt?: string;
  date?: string;
};

type InventoryRecord = {
  id?: string;
  name?: string;
  stockQty?: number;
  minQty?: number;
  unit?: string;
};

const statusBadgeVariant = (status?: string | null) => {
  const normalized = (status || "").toLowerCase();
  if (["received", "complete", "completed", "closed"].includes(normalized)) return "green";
  if (["in progress", "in_progress", "active", "pending", "submitted"].includes(normalized)) return "amber";
  if (["draft", "planning"].includes(normalized)) return "gray";
  return "blue";
};

const formatDate = (value?: string) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString();
};

const normalizeStatus = (value?: string | null) => (value || "").trim();

export default function AdminDashboard() {
  const [sites, setSites] = useState<SiteRecord[]>([]);
  const [tasks, setTasks] = useState<TaskRecord[]>([]);
  const [transfers, setTransfers] = useState<TransferRecord[]>([]);
  const [items, setItems] = useState<InventoryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const loadDashboardData = async () => {
      setLoading(true);
      setError(null);

      try {
        const [sitesResult, tasksResult, transferResult, itemsResult] = await Promise.allSettled([
          apiFetch("/site-locations"),
          apiFetch("/tasks"),
          apiFetch("/transfer-notes"),
          apiFetch("/items"),
        ]);

        if (!mounted) return;

        const siteList = sitesResult.status === "fulfilled" && Array.isArray(sitesResult.value) ? sitesResult.value : [];
        const taskList = tasksResult.status === "fulfilled" && Array.isArray(tasksResult.value) ? tasksResult.value : [];
        const transferList = transferResult.status === "fulfilled" && Array.isArray(transferResult.value) ? transferResult.value : [];
        const itemList = itemsResult.status === "fulfilled" && Array.isArray(itemsResult.value) ? itemsResult.value : [];

        setSites(siteList);
        setTasks(taskList);
        setTransfers(transferList);
        setItems(itemList);
      } catch (err) {
        if (!mounted) return;
        setError(err instanceof Error ? err.message : "Unable to load dashboard data");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    void loadDashboardData();
    return () => {
      mounted = false;
    };
  }, []);

  const stats = useMemo(() => {
    const activeSites = sites.filter((site) => !["completed", "inactive", "cancelled", "closed"].includes(normalizeStatus(site.status).toLowerCase())).length;
    const openTasks = tasks.filter((task) => !["completed", "inactive", "cancelled", "closed"].includes(normalizeStatus(task.status).toLowerCase())).length;
    const pendingTransfers = transfers.filter((transfer) => !["received", "complete", "completed", "closed"].includes(normalizeStatus(transfer.status).toLowerCase())).length;
    const lowStockItems = items.filter((item) => typeof item.stockQty === "number" && typeof item.minQty === "number" && item.stockQty <= item.minQty).length;

    return [
      {
        label: "Active Sites",
        value: loading ? "—" : String(activeSites),
        delta: loading ? "Loading live data…" : `${activeSites} site${activeSites === 1 ? "" : "s"} currently active`,
        up: true,
        icon: Building2,
        iconBg: "bg-viems-blue-light",
        iconColor: "text-viems-blue",
      },
      {
        label: "Open Tasks",
        value: loading ? "—" : String(openTasks),
        delta: loading ? "Loading live data…" : `${openTasks} task${openTasks === 1 ? "" : "s"} awaiting action`,
        up: null,
        icon: ClipboardList,
        iconBg: "bg-viems-amber-bg",
        iconColor: "text-viems-amber",
      },
      {
        label: "Pending Transfers",
        value: loading ? "—" : String(pendingTransfers),
        delta: loading ? "Loading live data…" : `${pendingTransfers} transfer${pendingTransfers === 1 ? "" : "s"} pending`,
        up: pendingTransfers > 0,
        icon: ArrowRightLeft,
        iconBg: "bg-viems-red-bg",
        iconColor: "text-viems-red",
      },
      {
        label: "Low Stock Items",
        value: loading ? "—" : String(lowStockItems),
        delta: loading ? "Loading live data…" : `${lowStockItems} item${lowStockItems === 1 ? "" : "s"} need attention`,
        up: lowStockItems > 0,
        icon: Package,
        iconBg: "bg-viems-green-bg",
        iconColor: "text-viems-green",
      },
    ];
  }, [items, loading, sites, tasks, transfers]);

  const recentTransfers = useMemo(() =>
    transfers.slice(0, 4).map((transfer) => ({
      id: transfer.id || transfer.ref || transfer.transferId || "—",
      from: transfer.from || "—",
      to: transfer.to || "—",
      items: transfer.items || "—",
      status: normalizeStatus(transfer.status) || "Submitted",
      date: formatDate(transfer.createdAt || transfer.date),
    })),
    [transfers],
  );

  const activeTasks = useMemo(() =>
    tasks
      .filter((task) => !["completed", "inactive", "cancelled", "closed"].includes(normalizeStatus(task.status).toLowerCase()))
      .slice(0, 3)
      .map((task) => ({
        title: task.title || "Untitled task",
        status: normalizeStatus(task.status) || "Active",
        priority: task.priority || "Medium",
        site: task.description || "Operational task",
      })),
    [tasks],
  );

  const stockAlerts = useMemo(() =>
    items
      .filter((item) => typeof item.stockQty === "number" && typeof item.minQty === "number" && item.stockQty <= item.minQty)
      .slice(0, 3)
      .map((item) => ({
        item: item.name || "Unnamed item",
        current: item.stockQty ?? 0,
        min: item.minQty ?? 0,
        unit: item.unit || "pcs",
        severity: (item.stockQty ?? 0) === 0 ? "Critical" : "Low",
      })),
    [items],
  );

  const keyPersonnel = useMemo(() =>
    sites
      .filter((site) => site.manager?.trim())
      .slice(0, 5)
      .map((site, index) => ({
        name: site.manager || "Unassigned",
        role: site.siteName || site.name || "Site team",
        badge: site.region || "Site",
        color: (index % 2 === 0 ? "blue" : "green") as "blue" | "green",
      })),
    [sites],
  );

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div>
          <h1 className="text-[20px] font-bold text-gray-900 leading-tight">Dashboard</h1>
          <p className="text-[12px] text-gray-500 mt-0.5">Live overview of sites, tasks, transfers, and inventory from the backend.</p>
        </div>
        <div className="flex gap-2">
          <button className="btn"><Filter size={14} /> Filter</button>
          <Link href="/admin/tasks" className="btn btn-primary"><Plus size={14} /> New Task</Link>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-[12px] text-amber-700">
          {error}. Some modules may require a signed-in session to load their protected data.
        </div>
      )}

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
                {s.up === true && <TrendingUp size={12} className="text-viems-green" />}
                {s.up === false && <TrendingDown size={12} className="text-viems-red" />}
                <p className={`text-[11px] font-medium ${s.up === true ? "text-viems-green" : s.up === false ? "text-viems-red" : "text-gray-500"}`}>
                  {s.delta}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2 data-card">
          <div className="card-header">
            <h2 className="card-title">Recent Transfer Notes</h2>
            <Link href="/admin/transfers" className="btn text-[11px] py-1">View all <ArrowUpRight size={12} /></Link>
          </div>
          <div className="overflow-x-auto">
            {loading ? (
              <div className="flex items-center justify-center gap-2 py-8 text-[12px] text-gray-500">
                <Loader2 size={14} className="animate-spin" /> Loading transfer notes…
              </div>
            ) : recentTransfers.length === 0 ? (
              <div className="py-8 text-center text-[12px] text-gray-500">No transfer notes have been created yet.</div>
            ) : (
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
                  {recentTransfers.map((transfer) => (
                    <tr key={transfer.id}>
                      <td className="font-bold text-gray-900">{transfer.id}</td>
                      <td className="text-gray-700 text-[12px]">{transfer.from} → {transfer.to}</td>
                      <td className="hidden md:table-cell text-gray-600">{transfer.items}</td>
                      <td><Badge variant={statusBadgeVariant(transfer.status)}>{transfer.status.replace(/_/g, " ")}</Badge></td>
                      <td className="hidden lg:table-cell text-gray-500">{transfer.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="data-card">
            <div className="card-header">
              <h2 className="card-title">Active Tasks</h2>
              <Link href="/admin/tasks" className="btn text-[11px] py-1">All tasks ↗</Link>
            </div>
            <div className="px-4 py-2">
              {loading ? (
                <div className="flex items-center justify-center gap-2 py-4 text-[12px] text-gray-500">
                  <Loader2 size={14} className="animate-spin" /> Loading tasks…
                </div>
              ) : activeTasks.length === 0 ? (
                <p className="text-center text-gray-400 text-[12px] py-4">No active tasks found.</p>
              ) : activeTasks.map((task, index) => (
                <div key={`${task.title}-${index}`} className="flex items-start gap-2 py-2.5 border-b border-viems-gray-border last:border-0">
                  <div className="flex-1">
                    <p className="text-[12px] font-bold text-gray-900">{task.title}</p>
                    <p className="text-[11px] text-gray-500">{task.site}</p>
                    <div className="flex gap-1 mt-1">
                      <Badge variant="gray">{task.priority}</Badge>
                      <Badge variant={statusBadgeVariant(task.status)}>{task.status}</Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="data-card">
            <div className="card-header">
              <h2 className="card-title">Stock Alerts</h2>
              <Link href="/admin/items" className="btn text-[11px] py-1">Inventory ↗</Link>
            </div>
            <div className="px-4 py-2 space-y-2">
              {loading ? (
                <div className="flex items-center justify-center gap-2 py-4 text-[12px] text-gray-500">
                  <Loader2 size={14} className="animate-spin" /> Checking stock…
                </div>
              ) : stockAlerts.length === 0 ? (
                <p className="text-center text-gray-400 text-[12px] py-4">No low stock items detected.</p>
              ) : stockAlerts.map((alert) => (
                <div key={alert.item} className="flex items-center justify-between py-1.5 border-b border-viems-gray-border last:border-0">
                  <div className="flex items-center gap-2">
                    <AlertTriangle size={12} className={alert.severity === "Critical" ? "text-red-500" : "text-amber-500"} />
                    <span className="text-[12px] font-medium text-gray-800">{alert.item}</span>
                  </div>
                  <div className="text-[11px] text-gray-500">{alert.current} / {alert.min} {alert.unit}</div>
                  <Badge variant={alert.severity === "Critical" ? "red" : "amber"}>{alert.severity}</Badge>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        <div className="data-card">
          <div className="card-header">
            <h2 className="card-title">Key Personnel</h2>
            <Link href="/admin/persons" className="btn text-[11px] py-1">Manage ↗</Link>
          </div>
          <div className="px-4 py-2">
            {loading ? (
              <div className="flex items-center justify-center gap-2 py-4 text-[12px] text-gray-500">
                <Loader2 size={14} className="animate-spin" /> Loading site contacts…
              </div>
            ) : keyPersonnel.length === 0 ? (
              <p className="text-center text-gray-400 text-[12px] py-4">No manager data available yet.</p>
            ) : keyPersonnel.map((person) => (
              <div key={`${person.name}-${person.role}`} className="flex items-center gap-3 py-2.5 border-b border-viems-gray-border last:border-0">
                <Avatar initials={person.name.slice(0, 2).toUpperCase()} color={person.color} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-bold text-gray-900 truncate">{person.name}</p>
                  <p className="text-[11px] text-gray-500 truncate">{person.role}</p>
                </div>
                <Badge variant={person.color}>{person.badge}</Badge>
              </div>
            ))}
          </div>
        </div>

        <div className="data-card">
          <div className="card-header">
            <h2 className="card-title">Quick Actions</h2>
          </div>
          <div className="px-4 py-3 grid grid-cols-2 gap-2">
            <Link href="/admin/tasks" className="btn justify-center"><Plus size={12} /> New Task</Link>
            <Link href="/admin/transfers" className="btn justify-center"><Truck size={12} /> New Transfer</Link>
            <Link href="/admin/items" className="btn justify-center"><Package size={12} /> Add Stock</Link>
            <Link href="/admin/site" className="btn justify-center"><Building2 size={12} /> Manage Sites</Link>
          </div>
          <div className="px-4 pb-3 text-[10px] text-gray-400 border-t border-viems-gray-border pt-2 mt-2">
            System status: live backend data · updates on refresh
          </div>
        </div>
      </div>
    </div>
  );
}