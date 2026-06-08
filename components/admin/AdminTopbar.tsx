"use client";
import { Bell, Search, Menu, ChevronDown } from "lucide-react";
import Avatar from "@/components/shared/Avatar";

interface AdminTopbarProps {
  onMenuClick: () => void;
}

export default function AdminTopbar({ onMenuClick }: AdminTopbarProps) {
  return (
    <header className="h-14 bg-white border-b border-viems-gray-border flex items-center px-4 gap-3 flex-shrink-0 z-30">
      {/* Hamburger — mobile */}
      <button
        onClick={onMenuClick}
        className="lg:hidden p-1.5 rounded-lg hover:bg-viems-gray-bg text-gray-700"
        aria-label="Open menu"
      >
        <Menu size={20} />
      </button>

      {/* Search */}
      <div className="flex items-center gap-2 bg-viems-gray-bg border border-viems-gray-border rounded-lg px-3 h-9 flex-1 max-w-xs">
        <Search size={14} className="text-gray-500 flex-shrink-0" />
        <input
          placeholder="Search items, persons, orders…"
          className="bg-transparent text-[13px] text-gray-900 placeholder-gray-400 outline-none w-full font-medium"
        />
      </div>

      <div className="ml-auto flex items-center gap-2">
        {/* User chip */}
        <div className="flex items-center gap-2 border border-viems-gray-border rounded-full pl-1 pr-3 py-1 hover:bg-viems-gray-bg cursor-pointer transition-colors">
          <Avatar initials="MA" color="blue" size="sm" />
          <div className="hidden sm:block">
            <p className="text-[12px] font-bold text-gray-900 leading-tight">Main Admin</p>
            <p className="text-[10px] text-gray-500 leading-tight">Administrator</p>
          </div>
          <ChevronDown size={12} className="text-gray-500 hidden sm:block" />
        </div>
      </div>
    </header>
  );
}