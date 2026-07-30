"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import {
  Search, ChevronRight, Package, Truck, Undo2, MoveRight,
  ArrowRightLeft, Calendar, Filter, X, Eye, ChevronDown,
  Printer, Download, FileText, AlertCircle, CheckCircle,
  Clock, ArrowUpDown, TrendingUp, TrendingDown, CircleDot,
  Building2, Hash, ExternalLink, Warehouse, MapPin
} from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

interface Transaction {
  id: string;
  date: string;
  type: "GRN_IN" | "SRN_OUT" | "ADJUSTMENT_IN" | "ADJUSTMENT_OUT" | "SITE_ISSUE_OUT";
  itemId?: string;
  itemName?: string;
  reference: string;
  quantity: number;
  unit: string;
  balanceAfter: number;
  remarks: string;
  relatedParty?: string;
}

interface InventoryItem {
  id: string;
  itemId: string;
  name: string;
  type: string;
  categoryCode: string;
  unit: string;
  currentQuantity: number;
  currentLocation: string;    // renamed and now uses site/warehouse names
  status: string;
  supplierName: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function normalizeTrackingItem(raw: any): InventoryItem {
  const type = String(raw?.type || raw?.item?.type || "").toLowerCase();
  const item = raw?.item || raw;
  return {
    id: String(item?.id || raw?.id || ""),
    itemId: String(item?.id || raw?.id || ""),
    name: String(item?.itemName || item?.name || item?.model || "Unnamed Item"),
    type: type === "tool" ? "Tool" : type === "reusable" ? "Reusable" : "Consumable",
    categoryCode: String(item?.subCategory?.code || item?.categoryCode || item?.subCategoryCode || ""),
    unit: String(item?.unit || (type === "tool" ? "pcs" : "pcs")),
    currentQuantity: Number(type === "tool" ? item?.pieceNum ?? 1 : item?.quantity ?? item?.pieceNum ?? 0),
    currentLocation: String(item?.location?.name || item?.location?.siteName || item?.locationId || item?.location || "Warehouse"),
    status: String(item?.status || "Active"),
    supplierName: String(item?.supplier || item?.supplierName || ""),
  };
}

function mapGoodsReceivedNotes(notes: any[]): Transaction[] {
  if (!Array.isArray(notes)) return [];
  return notes.flatMap((note: any) => {
    const date = String(note?.receivedDate || note?.createdAt || note?.updatedAt || "");
    const reference = String(note?.goodsReceivedNumber || note?.id || note?.reference || "GRN");
    const relatedParty = String(note?.supplier || note?.supplierName || "");
    return (note.items || []).map((item: any, idx: number) => ({
      id: `${reference}-GRN-${item?.id || idx}`,
      date,
      type: "GRN_IN",
      itemId: String(item?.itemId || item?.id || ""),
      itemName: String(item?.itemName || item?.name || ""),
      reference,
      quantity: Number(item?.quantity || item?.receivedQuantity || 0),
      unit: String(item?.unit || "pcs"),
      balanceAfter: 0,
      remarks: String(note?.remarks || note?.comments || item?.notes || ""),
      relatedParty,
    }));
  });
}

function mapReturnNotes(notes: any[]): Transaction[] {
  if (!Array.isArray(notes)) return [];
  return notes.flatMap((note: any) => {
    const date = String(note?.returnDate || note?.createdAt || note?.updatedAt || "");
    const reference = String(note?.returnNumber || note?.id || "SRN");
    const relatedParty = String(note?.destinationName || note?.supplier || note?.destinationType || "");
    return (note.items || []).map((item: any, idx: number) => ({
      id: `${reference}-SRN-${item?.id || idx}`,
      date,
      type: "SRN_OUT",
      itemId: String(item?.itemId || item?.id || ""),
      itemName: String(item?.itemName || item?.name || ""),
      reference,
      quantity: Number(item?.quantity || item?.returnedQuantity || 0),
      unit: String(item?.unit || "pcs"),
      balanceAfter: 0,
      remarks: String(note?.remarks || item?.reason || ""),
      relatedParty,
    }));
  });
}

function mapTransferNotes(notes: any[]): Transaction[] {
  if (!Array.isArray(notes)) return [];
  return notes.flatMap((note: any) => {
    const date = String(note?.transferDate || note?.createdAt || note?.updatedAt || "");
    const reference = String(note?.transferId || note?.id || "TRN");
    const relatedParty = String(note?.toSiteId || note?.toLocationId || note?.toSiteName || "");
    return (note.items || []).map((item: any, idx: number) => ({
      id: `${reference}-TRN-${item?.id || idx}`,
      date,
      type: "SITE_ISSUE_OUT",
      itemId: String(item?.itemId || item?.id || ""),
      itemName: String(item?.itemName || item?.name || ""),
      reference,
      quantity: Number(item?.quantity || item?.issuedQuantity || item?.receivedQuantity || 0),
      unit: String(item?.unit || "pcs"),
      balanceAfter: 0,
      remarks: String(note?.remarks || note?.comments || ""),
      relatedParty,
    }));
  });
}

function getTransactionIcon(type: Transaction["type"]) {
  switch (type) {
    case "GRN_IN": return <Package size={12} className="text-emerald-600" />;
    case "SRN_OUT": return <Undo2 size={12} className="text-rose-600" />;
    case "ADJUSTMENT_IN": return <TrendingUp size={12} className="text-blue-600" />;
    case "ADJUSTMENT_OUT": return <TrendingDown size={12} className="text-orange-600" />;
    case "SITE_ISSUE_OUT": return <Truck size={12} className="text-purple-600" />;
    default: return <ArrowRightLeft size={12} className="text-slate-400" />;
  }
}

function getTransactionLabel(type: Transaction["type"]) {
  switch (type) {
    case "GRN_IN": return "GRN Receipt";
    case "SRN_OUT": return "Supplier Return";
    case "ADJUSTMENT_IN": return "Stock Adjustment (+)";
    case "ADJUSTMENT_OUT": return "Stock Adjustment (-)";
    case "SITE_ISSUE_OUT": return "Site Issue";
  }
}

function getTransactionBadgeStyle(type: Transaction["type"]) {
  switch (type) {
    case "GRN_IN": return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "SRN_OUT": return "bg-rose-50 text-rose-700 border-rose-200";
    case "ADJUSTMENT_IN": return "bg-blue-50 text-blue-700 border-blue-200";
    case "ADJUSTMENT_OUT": return "bg-orange-50 text-orange-700 border-orange-200";
    case "SITE_ISSUE_OUT": return "bg-purple-50 text-purple-700 border-purple-200";
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// DETAIL DRAWER FOR ITEM TRANSACTIONS
// ─────────────────────────────────────────────────────────────────────────────

function ItemTrackingDrawer({ item, transactions, onClose }: { item: InventoryItem; transactions: Transaction[]; onClose: () => void }) {
  const itemTransactions = transactions.filter(t => {
    const matchesItemId = t.itemId && item.itemId && t.itemId === item.itemId;
    const matchesItemName = t.itemName && item.name && (
      t.itemName === item.name ||
      t.itemName.includes(item.name) ||
      item.name.includes(t.itemName)
    );
    return Boolean(matchesItemId || matchesItemName);
  }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  let running = 0;
  const enriched = itemTransactions.map(t => {
    running = t.balanceAfter;
    return { ...t, runningBalance: running };
  });

  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl bg-white shadow-2xl h-full flex flex-col overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-slate-100 p-5 flex items-start justify-between z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white">
              <Package size={18} />
            </div>
            <div>
              <p className="text-[11px] font-mono text-slate-400">{item.itemId}</p>
              <h2 className="text-[16px] font-bold text-slate-800">{item.name}</h2>
              <p className="text-[12px] text-slate-500 mt-0.5">Current stock: <span className="font-bold text-emerald-600">{item.currentQuantity} {item.unit}</span> · Location: {item.currentLocation}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400"><X size={16} /></button>
        </div>

        <div className="p-5">
          {enriched.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <FileText size={32} className="mx-auto mb-2 opacity-50" />
              <p>No transaction history found for this item.</p>
            </div>
          ) : (
            <div className="space-y-0 border border-slate-100 rounded-xl overflow-hidden">
              <div className="bg-slate-50 px-4 py-2 grid grid-cols-12 gap-2 text-[10px] font-bold uppercase text-slate-400 border-b border-slate-100">
                <div className="col-span-3">Date</div>
                <div className="col-span-3">Type / Reference</div>
                <div className="col-span-2 text-right">Qty Change</div>
                <div className="col-span-2 text-right">Balance</div>
                <div className="col-span-2">Party / Remarks</div>
              </div>
              {enriched.map((t, idx) => (
                <div key={t.id} className={`px-4 py-3 grid grid-cols-12 gap-2 text-[12px] items-center ${idx !== enriched.length-1 ? "border-b border-slate-50" : ""} hover:bg-slate-50/50`}>
                  <div className="col-span-3 text-slate-500">{formatDate(t.date)}</div>
                  <div className="col-span-3">
                    <span className={`inline-flex items-center gap-1.5 text-[10px] px-2 py-0.5 rounded-full font-semibold border ${getTransactionBadgeStyle(t.type)}`}>
                      {getTransactionIcon(t.type)} {getTransactionLabel(t.type)}
                    </span>
                    <p className="text-[11px] font-mono text-slate-400 mt-1">{t.reference}</p>
                  </div>
                  <div className={`col-span-2 text-right font-semibold ${t.type === "GRN_IN" || t.type === "ADJUSTMENT_IN" ? "text-emerald-600" : "text-rose-600"}`}>
                    {t.type === "GRN_IN" || t.type === "ADJUSTMENT_IN" ? `+${t.quantity}` : `-${t.quantity}`} {t.unit}
                  </div>
                  <div className="col-span-2 text-right font-mono text-slate-700">{t.runningBalance} {t.unit}</div>
                  <div className="col-span-2 text-[11px] text-slate-500 truncate" title={t.remarks}>
                    {t.relatedParty && <span className="block text-[10px] text-slate-400">{t.relatedParty}</span>}
                    <span>{t.remarks.length > 35 ? t.remarks.slice(0, 32)+"..." : t.remarks}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN REPORT PAGE
// ─────────────────────────────────────────────────────────────────────────────

export default function ItemTrackingReportPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterStockStatus, setFilterStockStatus] = useState("all");
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [showOnlyWithTransactions, setShowOnlyWithTransactions] = useState(false);
  const [apiError, setApiError] = useState("");

  useEffect(() => {
    const loadTrackingData = async () => {
      try {
        setApiError("");
        const [itemsData, grnData, returnData, transferData] = await Promise.all([
          apiFetch("/items"),
          apiFetch("/goods-received-notes"),
          apiFetch("/return-notes"),
          apiFetch("/transfer-notes"),
        ]);

        if (Array.isArray(itemsData)) {
          setItems(itemsData.map(normalizeTrackingItem));
        }

        const newTransactions: Transaction[] = [
          ...mapGoodsReceivedNotes(Array.isArray(grnData) ? grnData : []),
          ...mapReturnNotes(Array.isArray(returnData) ? returnData : []),
          ...mapTransferNotes(Array.isArray(transferData) ? transferData : []),
        ];
        setTransactions(newTransactions);
      } catch (error: any) {
        console.warn("Item tracking live load failed", error);
        setApiError(error?.message || "Unable to load live item tracking data.");
      }
    };

    loadTrackingData();
  }, []);

  const hasTransactions = (item: InventoryItem) => {
    return transactions.some((tx) =>
      tx.itemId === item.itemId ||
      tx.itemName === item.name ||
      tx.itemName?.includes(item.name) ||
      item.name.includes(tx.itemName || "")
    );
  };

  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase()) || item.itemId.toLowerCase().includes(search.toLowerCase());
    const matchesType = filterType === "all" || item.type === filterType;
    const stockStatus = item.currentQuantity <= 0 ? "critical" : (item.currentQuantity <= (item.type === "Consumable" ? 100 : 5) ? "low" : "normal");
    const matchesStock = filterStockStatus === "all" || 
      (filterStockStatus === "critical" && stockStatus === "critical") ||
      (filterStockStatus === "low" && stockStatus === "low") ||
      (filterStockStatus === "normal" && stockStatus === "normal");
    const matchesTransactionFilter = showOnlyWithTransactions ? hasTransactions(item) : true;
    return matchesSearch && matchesType && matchesStock && matchesTransactionFilter;
  });

  const totalItems = items.length;
  const totalValue = items.reduce((sum, i) => sum + (i.currentQuantity * (i.type === "Consumable" ? 500 : 3000)), 0);
  const itemsWithHistory = items.filter(i => hasTransactions(i)).length;
  const zeroStockItems = items.filter(i => i.currentQuantity === 0).length;

  return (
    <div className="min-h-screen bg-[#f7f8fb] p-5 font-sans">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Venus Enterprises</span>
            <ChevronRight size={10} className="text-slate-300" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-600">Reports</span>
          </div>
          <h1 className="text-[22px] font-extrabold text-slate-800 tracking-tight">Item Tracking Report</h1>
          <p className="text-[13px] text-slate-400 mt-0.5">Complete audit trail for every inventory item — from receipt to return or site issue.</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
          <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
            <p className="text-[24px] font-extrabold text-slate-800">{totalItems}</p>
            <p className="text-[11px] text-slate-400 font-medium">Total Items in Inventory</p>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
            <p className="text-[24px] font-extrabold text-emerald-600">{itemsWithHistory}</p>
            <p className="text-[11px] text-slate-400 font-medium">Items with Full History</p>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
            <p className="text-[24px] font-extrabold text-rose-600">{zeroStockItems}</p>
            <p className="text-[11px] text-slate-400 font-medium">Zero Stock Items</p>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
            <p className="text-[24px] font-extrabold text-slate-800">{fmtCurrency(totalValue)}</p>
            <p className="text-[11px] text-slate-400 font-medium">Estimated Inventory Value</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm px-4 py-3 flex flex-wrap gap-3 items-center mb-4">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by Item Name or ID..."
              className="w-full pl-9 pr-3 py-2 text-[12px] border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400 bg-slate-50" />
          </div>
          <select value={filterType} onChange={(e) => setFilterType(e.target.value)}
            className="text-[12px] border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 text-slate-600">
            <option value="all">All Types</option>
            <option value="Tool">Tool</option>
            <option value="Reusable">Reusable</option>
            <option value="Consumable">Consumable</option>
          </select>
          <select value={filterStockStatus} onChange={(e) => setFilterStockStatus(e.target.value)}
            className="text-[12px] border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 text-slate-600">
            <option value="all">All Stock Levels</option>
            <option value="critical">Critical (Zero)</option>
            <option value="low">Low Stock</option>
            <option value="normal">Normal</option>
          </select>
          <label className="flex items-center gap-2 text-[12px] text-slate-600 cursor-pointer">
            <input type="checkbox" checked={showOnlyWithTransactions} onChange={(e) => setShowOnlyWithTransactions(e.target.checked)}
              className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500" />
            Show only items with transaction history
          </label>
          <div className="flex-1"></div>
          <button className="flex items-center gap-2 text-[12px] text-slate-500 hover:text-slate-700 px-3 py-1.5 rounded-lg border border-slate-200">
            <Printer size={12} /> Export Report
          </button>
        </div>

        {/* Items Table — Removed Supplier Column, Changed Location to Current Location */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-x-auto">
          <table className="w-full min-w-[800px]">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">Item ID</th>
                <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">Item Name</th>
                <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">Type</th>
                <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">Current Stock</th>
                <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">Current Location</th>
                <th className="px-4 py-3 text-right text-[10px] font-bold text-slate-400 uppercase tracking-widest">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredItems.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-14 text-slate-400 text-[13px]">No items match your filters</td></tr>
              ) : (
                filteredItems.map((item) => {
                  const stockDisplay = item.currentQuantity === 0 ? 
                    <span className="text-rose-600 font-bold">0 {item.unit}</span> :
                    <span className="text-slate-700">{item.currentQuantity} {item.unit}</span>;
                  const hasHistory = hasTransactions(item);
                  // Display a small icon based on location type (site vs warehouse)
                  const locationIcon = item.currentLocation.toLowerCase().includes("site") ? 
                    <MapPin size={11} className="text-purple-500 flex-shrink-0" /> : 
                    <Warehouse size={11} className="text-emerald-500 flex-shrink-0" />;
                  return (
                    <tr key={item.id} className="transition-colors hover:bg-emerald-50/30">
                      <td className="px-4 py-3.5">
                        <span className="text-[11px] font-mono font-bold text-slate-600">{item.itemId}</span>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500">
                            <Package size={12} />
                          </div>
                          <span className="text-[13px] font-semibold text-slate-700">{item.name}</span>
                        </div>
                       </td>
                      <td className="px-4 py-3.5">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${
                          item.type === "Tool" ? "bg-violet-50 text-violet-700 border-violet-200" :
                          item.type === "Reusable" ? "bg-teal-50 text-teal-700 border-teal-200" :
                          "bg-orange-50 text-orange-700 border-orange-200"
                        }`}>{item.type}</span>
                       </td>
                      <td className="px-4 py-3.5">
                        {stockDisplay}
                        {!hasHistory && <p className="text-[9px] text-slate-300 mt-0.5">No transactions</p>}
                       </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1.5">
                          {locationIcon}
                          <span className="text-[12px] text-slate-600">{item.currentLocation}</span>
                        </div>
                       </td>
                      <td className="px-4 py-3.5 text-right">
                        <button onClick={() => setSelectedItem(item)} 
                          className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-lg transition-colors">
                          <Eye size={12} /> View History
                        </button>
                       </td>
                     </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Drawer for selected item */}
      {selectedItem && (
        <ItemTrackingDrawer
          item={selectedItem}
          transactions={transactions}
          onClose={() => setSelectedItem(null)}
        />
      )}
    </div>
  );
}

function fmtCurrency(n: number) {
  return `Rs. ${n.toLocaleString("en-LK")}`;
}