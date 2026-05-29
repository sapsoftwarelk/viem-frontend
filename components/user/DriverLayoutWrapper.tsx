"use client";
import { useState } from "react";
import UserSidebar from "@/components/user/UserSidebar";
import UserTopbar from "@/components/user/UserTopbar";

export default function DriverLayoutWrapper({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  return (
    <div className="flex h-screen overflow-hidden bg-viems-gray-bg">
      <UserSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} role="driver" />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <UserTopbar
          onMenuClick={() => setSidebarOpen(true)}
          name="Person A"
          role="Driver (role-switched)"
          initials="PA"
          avatarColor="amber"
        />
        <main className="flex-1 overflow-y-auto p-4 md:p-5">{children}</main>
      </div>
    </div>
  );
}
