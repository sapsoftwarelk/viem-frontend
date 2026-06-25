"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  FileText,
  RotateCcw,
  ArrowLeftRight,
  AlertOctagon,
  Wrench,
  Undo2,
  Users,
  CreditCard,
  ClipboardList,
  Settings,
  X,
  ShieldCheck,
  Car,
  Folder,
  BrickWall,
  Network,
  MapPin,
  Warehouse,
  ChevronDown,
  ChevronRight,
} from "lucide-react";

import Logo from "@/components/shared/Logo";

// ─── Types ────────────────────────────────────────────────────────────────────

interface NavLeaf {
  type?: "leaf";
  label: string;
  shortName: string;
  href: string;
  icon: React.ElementType;
  tooltip: string;
  badge?: string | number;
  badgeColor?: "blue" | "amber" | "red";
}

interface NavGroup {
  type: "group";
  label: string;
  shortName: string;
  icon: React.ElementType;
  tooltip: string;
  defaultOpen?: boolean;
  children: NavLeaf[];
}

type NavItem = NavLeaf | NavGroup;

interface NavSection {
  label: string;
  items: NavItem[];
}

// ─── Navigation config ────────────────────────────────────────────────────────

const navSections: NavSection[] = [
  {
    label: "Overview",
    items: [
      {
        label: "Dashboard",
        shortName: "DB",
        href: "/admin",
        icon: LayoutDashboard,
        tooltip: "Overview of all system KPIs, recent activity, and key metrics at a glance.",
      },
    ],
  },

  {
    label: "Operations",
    items: [
      {
        label: "Sites & Locations",
        shortName: "SIT",
        href: "/admin/site",
        icon: MapPin,
        badge: 3,
        badgeColor: "blue",
        tooltip: "Manage company branches, warehouses, stores, projects, and operational locations.",
      },
      {
        type: "group",
        label: "Inter-Site Inventory",
        shortName: "ISI",
        icon: Warehouse,
        tooltip: "Manage all inventory movements, returns, repairs, and loss records between sites.",
        defaultOpen: false,
        children: [
          {
            label: "Inventory Transfer Notes",
            shortName: "ITN",
            href: "/admin/transfers",
            icon: ArrowLeftRight,
            badge: 3,
            badgeColor: "amber",
            tooltip: "Transfer items or assets between sites — warehouse to branch, site to site, store to project.",
          },
          {
            label: "Inventory Return Notes",
            shortName: "IRN",
            href: "/admin/returns",
            icon: Undo2,
            tooltip: "Return previously transferred inventory back to the originating site or central warehouse.",
          },
          {
            label: "Repair & Maintenance Notes",
            shortName: "RMN",
            href: "/admin/repairs",
            icon: Wrench,
            tooltip: "Record items sent for repair, maintenance, or servicing. Track vendor, status, and return date.",
          },
          {
            label: "Damage & Loss Reports",
            shortName: "DLR",
            href: "/admin/damage-reports",
            icon: AlertOctagon,
            tooltip: "Document damaged, broken, lost, or unusable inventory. Track type, quantity, site, and approval status.",
          },
        ],
      },
      {
        label: "Site Task Manager",
        shortName: "STM",
        href: "/admin/stm",
        icon: Folder,
        tooltip: "Assign and monitor operational tasks across all active project sites.",
      },
    ],
  },

  {
    label: "Inventory",
    items: [
      {
        label: "Purchase Orders",
        shortName: "PO",
        href: "/admin/po",
        icon: FileText,
        badge: 3,
        badgeColor: "blue",
        tooltip: "Create and track purchase orders sent to suppliers for stock replenishment.",
      },
      {
        label: "Goods Receive Notes",
        shortName: "GRN",
        href: "/admin/grn",
        icon: ClipboardList,
        tooltip: "Record incoming stock received from suppliers against purchase orders.",
      },
      {
        label: "Supplier Return Notes",
        shortName: "SRN",
        href: "/admin/srn",
        icon: RotateCcw,
        tooltip: "Log items returned to suppliers due to defects, overstock, or order discrepancies.",
      },
      {
        label: "Goods Return Notes",
        shortName: "GRTN",
        href: "/admin/grtn",
        icon: RotateCcw,
        tooltip: "Return item stock from sites to the central warehouse.",
      },
    ],
  },

  {
    label: "Administration",
    items: [
      {
        label: "Items & Assets",
        shortName: "ITM",
        href: "/admin/items",
        icon: Package,
        tooltip: "Manage all inventory items, assets, categories, and stock levels.",
      },
      {
        label: "Subcategories",
        shortName: "SUB",
        href: "/admin/sub-categories",
        icon: BrickWall,
        tooltip: "Create and review inventory subcategories used in item registration.",
      },
      {
        label: "Persons & Assign Roles",
        shortName: "PRS",
        href: "/admin/persons",
        icon: Users,
        tooltip: "Manage system users and assign roles.",
      },
      {
        label: "Login Credentials",
        shortName: "CRED",
        href: "/admin/login-credentials",
        icon: ShieldCheck,
        tooltip: "Create and manage login credentials for selected employees.",
      },
      {
        label: "Job Positions",
        shortName: "POS",
        href: "/admin/positions",
        icon: CreditCard,
        tooltip: "Define and manage job positions and their associated responsibilities.",
      },
      {
        label: "Tasks",
        shortName: "TSK",
        href: "/admin/tasks",
        icon: ClipboardList,
        tooltip: "Define tasks that have to be completed by users.",
      },
      {
        label: "Vehicles",
        shortName: "VCL",
        href: "/admin/vehicles",
        icon: Car,
        tooltip: "Manage vehicle details and monitor insurance expiry dates.",
      },
      {
        label: "Settings",
        shortName: "SET",
        href: "/admin/settings",
        icon: Settings,
        tooltip: "Configure system preferences, integrations, and global application settings.",
      },
    ],
  },

  {
    label: "Reports",
    items: [
      {
        label: "Warehouse Inventory Report",
        shortName: "WIR",
        href: "/admin/inventory-report",
        icon: Package,
        tooltip: "View detailed warehouse inventory levels, stock movement, and valuation.",
      },
      {
        label: "Inventory Tracking Report",
        shortName: "ITR",
        href: "/admin/item-tracking-report",
        icon: Network,
        tooltip: "Track item movements across all sites with full audit trail.",
      },
      {
        label: "Site Detailed Report",
        shortName: "SDR",
        href: "/admin/site-report",
        icon: Network,
        tooltip: "Generate per-site reports covering tasks, inventory, transfers, and personnel.",
      },
    ],
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const badgeColors = {
  blue:  "bg-viems-blue text-white",
  amber: "bg-yellow-400 text-yellow-900",
  red:   "bg-red-500 text-white",
};

function Badge({ badge, badgeColor }: { badge: string | number; badgeColor?: "blue" | "amber" | "red" }) {
  return (
    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full min-w-[20px] text-center ${badgeColors[badgeColor ?? "blue"]}`}>
      {badge}
    </span>
  );
}

function Tooltip({ label, shortName, tooltip }: { label: string; shortName: string; tooltip: string }) {
  return (
    <div className="
      pointer-events-none absolute left-full top-1/2 -translate-y-1/2 ml-3 z-50
      w-56 px-3 py-2 rounded-lg
      bg-gray-900 border border-gray-700
      text-[11px] text-gray-200 leading-snug shadow-xl
      opacity-0 group-hover:opacity-100
      transition-opacity duration-150 delay-300
    ">
      <span className="font-semibold text-white block mb-1">{label} [{shortName}]</span>
      {tooltip}
      <span className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-gray-700" />
    </div>
  );
}

// ─── Leaf link ────────────────────────────────────────────────────────────────

function LeafLink({
  item,
  pathname,
  onClose,
  indent = false,
}: {
  item: NavLeaf;
  pathname: string;
  onClose: () => void;
  indent?: boolean;
}) {
  const active = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href));
  const Icon = item.icon;

  return (
    <div className="relative group">
      <Link
        href={item.href}
        onClick={onClose}
        className={`
          sidebar-link flex items-center gap-3 py-2.5 text-[13px] font-medium transition-all duration-200
          ${indent ? "pl-10 pr-4" : "px-4"}
          ${active
            ? "bg-viems-sidebar-active text-white border-l-4 border-viems-blue"
            : "text-gray-400 hover:bg-viems-sidebar-hover hover:text-gray-200"
          }
        `}
      >
        <Icon size={indent ? 15 : 17} className="flex-shrink-0" />
        <span className="flex-1 leading-tight">
          {item.label}
          <span className={`ml-1 text-[10px] font-semibold ${active ? "text-blue-300" : "text-gray-500"}`}>
            [{item.shortName}]
          </span>
        </span>
        {item.badge && <Badge badge={item.badge} badgeColor={item.badgeColor} />}
      </Link>
      <Tooltip label={item.label} shortName={item.shortName} tooltip={item.tooltip} />
    </div>
  );
}

// ─── Group row ────────────────────────────────────────────────────────────────

function GroupRow({
  item,
  pathname,
  onClose,
}: {
  item: NavGroup;
  pathname: string;
  onClose: () => void;
}) {
  const anyChildActive = item.children.some(
    (c) => pathname === c.href || pathname.startsWith(c.href)
  );
  const [open, setOpen] = useState(item.defaultOpen || anyChildActive);
  const Icon = item.icon;

  return (
    <div>
      {/* Group header */}
      <div className="relative group">
        <button
          onClick={() => setOpen((v) => !v)}
          className={`
            w-full flex items-center gap-3 px-4 py-2.5 text-[13px] font-medium transition-all duration-200
            ${anyChildActive
              ? "bg-viems-sidebar-active text-white border-l-4 border-viems-blue"
              : "text-gray-400 hover:bg-viems-sidebar-hover hover:text-gray-200"
            }
          `}
        >
          <Icon size={17} className="flex-shrink-0" />
          <span className="flex-1 text-left leading-tight">
            {item.label}
            <span className={`ml-1 text-[10px] font-semibold ${anyChildActive ? "text-blue-300" : "text-gray-500"}`}>
              [{item.shortName}]
            </span>
          </span>
          {open
            ? <ChevronDown size={13} className="flex-shrink-0 text-gray-500" />
            : <ChevronRight size={13} className="flex-shrink-0 text-gray-500" />
          }
        </button>
        <Tooltip label={item.label} shortName={item.shortName} tooltip={item.tooltip} />
      </div>

      {/* Children */}
      {open && (
        <div className="border-l border-viems-sidebar-border ml-[28px]">
          {item.children.map((child) => (
            <LeafLink key={child.href} item={child} pathname={pathname} onClose={onClose} indent />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────

interface AdminSidebarProps {
  open: boolean;
  onClose: () => void;
}

export default function AdminSidebar({ open, onClose }: AdminSidebarProps) {
  const pathname = usePathname();

  const sidebarContent = (
    <aside className="w-[280px] h-full bg-viems-sidebar flex flex-col flex-shrink-0 overflow-y-auto shadow-xl">
      {/* Logo */}
      <div className="h-16 px-4 flex items-center justify-between border-b border-viems-sidebar-border flex-shrink-0">
        <Logo />
        <button onClick={onClose} className="lg:hidden text-gray-400 hover:text-white p-1">
          <X size={18} />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 overflow-y-auto">
        {navSections.map((section) => (
          <div key={section.label} className="mb-5">
            <p className="px-4 mb-2 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
              {section.label}
            </p>

            {section.items.map((item) =>
              item.type === "group" ? (
                <GroupRow key={item.label} item={item} pathname={pathname} onClose={onClose} />
              ) : (
                <LeafLink key={item.href} item={item as NavLeaf} pathname={pathname} onClose={onClose} />
              )
            )}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-viems-sidebar-border flex-shrink-0">
        <div className="flex items-center gap-3 bg-viems-sidebar-active rounded-xl px-3 py-3">
          <ShieldCheck size={16} className="text-viems-blue-mid flex-shrink-0" />
          <span className="text-[11px] font-semibold text-viems-blue-mid">Main Administrator</span>
        </div>
      </div>
    </aside>
  );

  return (
    <>
      {/* Desktop */}
      <div className="hidden lg:flex h-full">{sidebarContent}</div>

      {/* Mobile */}
      {open && (
        <>
          <div className="sidebar-overlay lg:hidden" onClick={onClose} />
          <div className="fixed inset-y-0 left-0 z-50 lg:hidden">{sidebarContent}</div>
        </>
      )}
    </>
  );
}