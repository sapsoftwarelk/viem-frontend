"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ListChecks, ClipboardCheck, ArrowLeftRight,
  AlertTriangle, Clock, History, Package, X, Truck
} from "lucide-react";
import Logo from "@/components/shared/Logo";

interface UserSidebarProps {
  open: boolean;
  onClose: () => void;
  role: "to" | "driver";
}

const toNav = [
  {
    label: "My Tasks",
    items: [
      { label: "Task Board",        href: "/user",             icon: ListChecks,     badge: 4 },
      { label: "Confirm Receipt",   href: "/user/receipt",     icon: ClipboardCheck },
      { label: "Raise GRtN",        href: "/user/grtn",        icon: ArrowLeftRight },
      { label: "Report Damage",     href: "/user/damage",      icon: AlertTriangle },
      { label: "Log Machine Hours", href: "/user/hours",       icon: Clock },
    ],
  },
  {
    label: "View",
    items: [
      { label: "My Activity Log",   href: "/user/activity",    icon: History },
      { label: "Site Inventory",    href: "/user/inventory",   icon: Package },
    ],
  },
];

const driverNav = [
  {
    label: "My Tasks",
    items: [
      { label: "My GINs",    href: "/driver",          icon: Truck, badge: 2 },
      { label: "Load History",href: "/driver/history",  icon: History },
    ],
  },
];

export default function UserSidebar({ open, onClose, role }: UserSidebarProps) {
  const pathname = usePathname();
  const sections = role === "to" ? toNav : driverNav;
  const roleLabel = role === "to" ? "Technical Officer" : "Driver (temporary)";
  const roleBg = role === "to" ? "bg-viems-blue-light border-viems-blue-border" : "bg-viems-amber-bg border-viems-amber-border";
  const roleText = role === "to" ? "text-viems-blue" : "text-viems-amber";

  const sidebarContent = (
    <aside className="w-[220px] h-full bg-white border-r border-viems-gray-border flex flex-col flex-shrink-0">
      <div className="h-14 px-4 flex items-center justify-between border-b border-viems-gray-border flex-shrink-0">
        <Logo />
        <button onClick={onClose} className="lg:hidden text-gray-400 hover:text-gray-700 p-1">
          <X size={18} />
        </button>
      </div>

      <nav className="flex-1 py-3 overflow-y-auto">
        {sections.map((section) => (
          <div key={section.label} className="mb-4">
            <p className="px-4 mb-1 text-[10px] font-bold text-gray-400 uppercase tracking-widest">{section.label}</p>
            {section.items.map((item) => {
              const active = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  className={`sidebar-link flex items-center gap-2.5 px-4 py-2 text-[13px] font-semibold transition-colors
                    ${active
                      ? "active bg-viems-blue-light text-viems-blue"
                      : "text-gray-700 hover:bg-viems-gray-bg hover:text-gray-900"
                    }`}
                >
                  <Icon size={16} className="flex-shrink-0" />
                  <span className="flex-1">{item.label}</span>
                  {item.badge && (
                    <span className="bg-viems-blue text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="p-4 border-t border-viems-gray-border">
        <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-widest mb-2">Active position</p>
        <div className={`flex items-center gap-2 ${roleBg} border rounded-lg px-3 py-2`}>
          {role === "to"
            ? <ClipboardCheck size={14} className={roleText} />
            : <Truck size={14} className={roleText} />
          }
          <span className={`text-[11px] font-bold ${roleText}`}>{roleLabel}</span>
        </div>
      </div>
    </aside>
  );

  return (
    <>
      <div className="hidden lg:flex h-full">{sidebarContent}</div>
      {open && (
        <>
          <div className="sidebar-overlay lg:hidden" onClick={onClose} />
          <div className="fixed inset-y-0 left-0 z-50 lg:hidden">{sidebarContent}</div>
        </>
      )}
    </>
  );
}
