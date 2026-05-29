
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  BarChart2,
  Package,
  FileText,
  RotateCcw,
  Send,
  ArrowLeftRight,
  AlertTriangle,
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
} from "lucide-react";

import Logo from "@/components/shared/Logo";

interface NavItem {
  label: string;
  shortName: string;
  href: string;
  icon: React.ElementType;
  tooltip: string;
  badge?: string | number;
  badgeColor?: "blue" | "amber" | "red";
}

const navSections: { label: string; items: NavItem[] }[] = [
  {
    label: "Overview",
    items: [
      {
        label: "Dashboard",
        shortName: "DB",
        href: "/admin",
        icon: LayoutDashboard,
        tooltip:
          "Overview of all system KPIs, recent activity, and key metrics at a glance.",
      },

    ],
  },

  {
    label: "Operations",
    items: [
      {
        label: "Sites",
        shortName: "SIT",
        href: "/admin/site",
        icon: BrickWall,
        badge: 3,
        badgeColor: "blue",
        tooltip:
          "Create and track purchase orders sent to suppliers for stock replenishment.",
      },
      {
        label: "Site Task Manager",
        shortName: "STM",
        href: "/admin/stm",
        icon: Folder,
        tooltip:
          "Record incoming stock received from suppliers against purchase orders.",
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
        tooltip:
          "Create and track purchase orders sent to suppliers for stock replenishment.",
      },
      {
        label: "Goods Receive Note",
        shortName: "GRN",
        href: "/admin/grn",
        icon: ClipboardList,
        tooltip:
          "Record incoming stock received from suppliers against purchase orders.",
      },
      {
        label: "Supplier Return Note",
        shortName: "SRN",
        href: "/admin/srn",
        icon: RotateCcw,
        tooltip:
          "Log items returned from store or site back into the main inventory.",
      },
       {
        label: "Good Return Note",
        shortName: "grtn",
        href: "/admin/grtn",
        icon: RotateCcw,
        tooltip:
          "Return item stock from sites to central warehouse.",
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
        tooltip:
          "Manage all inventory items, assets, categories, and stock levels.",
      },
      {
        label: "Persons & Assign Roles",
        shortName: "PRS",
        href: "/admin/persons",
        icon: Users,
        tooltip: "Manage system users and assign roles.",
      },
      {
        label: "Job Positions",
        shortName: "POS",
        href: "/admin/positions",
        icon: CreditCard,
        tooltip:
          "Define and manage job positions and their associated responsibilities.",
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
        tooltip:
          "Manage vehicle details and monitor insurance expiry dates.",
      },
      {
        label: "Settings",
        shortName: "SET",
        href: "/admin/settings",
        icon: Settings,
        tooltip:
          "Configure system preferences, integrations, and global application settings.",
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
        tooltip:
          "View detailed warehouse inventory levels, stock movement, and valuation.",
      },
      {
        label: "Inventory Tracking Report",
        shortName: "ITR",
        href: "/admin/item-tracking-report",
        icon: Network,
        tooltip:
          "Generate reports for system users, assigned roles, and permissions.",
      },
       {
        label: "Site Detailed Report",
        shortName: "SDR",
        href: "/admin/site-report",
        icon: Network,
        tooltip:
          "Generate reports for system users, assigned roles, and permissions.",
      },
    ],
  },
];

const badgeColors = {
  blue: "bg-viems-blue text-white",
  amber: "bg-yellow-400 text-yellow-900",
  red: "bg-red-500 text-white",
};

interface AdminSidebarProps {
  open: boolean;
  onClose: () => void;
}

export default function AdminSidebar({
  open,
  onClose,
}: AdminSidebarProps) {
  const pathname = usePathname();

  const sidebarContent = (
    <aside className="w-[280px] h-full bg-viems-sidebar flex flex-col flex-shrink-0 overflow-y-auto shadow-xl">
      {/* Logo */}
      <div className="h-16 px-4 flex items-center justify-between border-b border-viems-sidebar-border flex-shrink-0">
        <Logo />

        <button
          onClick={onClose}
          className="lg:hidden text-gray-400 hover:text-white p-1"
        >
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

            {section.items.map((item) => {
              const active =
                pathname === item.href ||
                (item.href !== "/admin" &&
                  pathname.startsWith(item.href));

              const Icon = item.icon;

              return (
                <div key={item.href} className="relative group">
                  <Link
                    href={item.href}
                    onClick={onClose}
                    className={`sidebar-link flex items-center gap-3 px-4 py-3 text-[13px] font-medium transition-all duration-200
                      ${
                        active
                          ? "bg-viems-sidebar-active text-white border-l-4 border-viems-blue"
                          : "text-gray-400 hover:bg-viems-sidebar-hover hover:text-gray-200"
                      }`}
                  >
                    <Icon size={17} className="flex-shrink-0" />

                    <span className="flex-1 leading-tight">
                      {item.label}

                      <span
                        className={`ml-1 text-[10px] font-semibold ${
                          active ? "text-blue-300" : "text-gray-500"
                        }`}
                      >
                        [{item.shortName}]
                      </span>
                    </span>

                    {item.badge && (
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full min-w-[20px] text-center ${
                          badgeColors[item.badgeColor ?? "blue"]
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </Link>

                  {/* Tooltip */}
                  <div
                    className="
                      pointer-events-none absolute left-full top-1/2 -translate-y-1/2 ml-3 z-50
                      w-56 px-3 py-2 rounded-lg
                      bg-gray-900 border border-gray-700
                      text-[11px] text-gray-200 leading-snug shadow-xl
                      opacity-0 group-hover:opacity-100
                      transition-opacity duration-150 delay-300
                    "
                  >
                    <span className="font-semibold text-white block mb-1">
                      {item.label} [{item.shortName}]
                    </span>

                    {item.tooltip}

                    {/* Arrow */}
                    <span className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-gray-700" />
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-viems-sidebar-border flex-shrink-0">
        <div className="flex items-center gap-3 bg-viems-sidebar-active rounded-xl px-3 py-3">
          <ShieldCheck
            size={16}
            className="text-viems-blue-mid flex-shrink-0"
          />

          <span className="text-[11px] font-semibold text-viems-blue-mid">
            Main Administrator
          </span>
        </div>
      </div>
    </aside>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex h-full">
        {sidebarContent}
      </div>

      {/* Mobile Sidebar */}
      {open && (
        <>
          <div
            className="sidebar-overlay lg:hidden"
            onClick={onClose}
          />

          <div className="fixed inset-y-0 left-0 z-50 lg:hidden">
            {sidebarContent}
          </div>
        </>
      )}
    </>
  );
}

