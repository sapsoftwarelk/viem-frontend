"use client";
import { Bell, Menu, ChevronDown } from "lucide-react";
import Avatar from "@/components/shared/Avatar";

interface UserTopbarProps {
  onMenuClick: () => void;
  name: string;
  role: string;
  avatarColor?: "blue" | "amber";
  initials: string;
}

export default function UserTopbar({ onMenuClick, name, role, avatarColor = "blue", initials }: UserTopbarProps) {
  return (
    <header className="h-14 bg-white border-b border-viems-gray-border flex items-center px-4 gap-3 flex-shrink-0 z-30">
      <button
        onClick={onMenuClick}
        className="lg:hidden p-1.5 rounded-lg hover:bg-viems-gray-bg text-gray-700"
        aria-label="Open menu"
      >
        <Menu size={20} />
      </button>

      <div className="flex-1" />

      <div className="flex items-center gap-2">
        <button className="relative w-9 h-9 rounded-lg border border-viems-gray-border flex items-center justify-center text-gray-700 hover:bg-viems-gray-bg transition-colors">
          <Bell size={16} />
        </button>

        <div className="flex items-center gap-2 border border-viems-gray-border rounded-full pl-1 pr-3 py-1 hover:bg-viems-gray-bg cursor-pointer transition-colors">
          <Avatar initials={initials} color={avatarColor} size="sm" />
          <div className="hidden sm:block">
            <p className="text-[12px] font-bold text-gray-900 leading-tight">{name}</p>
            <p className={`text-[10px] leading-tight font-semibold ${avatarColor === "amber" ? "text-viems-amber" : "text-gray-500"}`}>{role}</p>
          </div>
          <ChevronDown size={12} className="text-gray-500 hidden sm:block" />
        </div>
      </div>
    </header>
  );
}
