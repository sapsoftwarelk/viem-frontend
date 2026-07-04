"use client";

import { useLayoutEffect } from "react";
import { useRouter } from "next/navigation";

export default function RootPage() {
  const router = useRouter();

  useLayoutEffect(() => {
    // Force transition directly to /login safely after hydration
    router.replace("/login");
  }, [router]);

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
      <div className="animate-pulse text-indigo-500/50 text-sm tracking-widest uppercase">
        Loading Portal...
      </div>
    </div>
  );
}