"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch, setStoredAuthToken } from "@/lib/api";

interface AuthGuardProps {
  children: React.ReactNode;
  adminOnly?: boolean;
  fallbackRoute?: string;
}

function normalizeRoleTitle(role: any) {
  if (!role) return "";
  return String(role.position_title || role.name || role.title || "").toLowerCase();
}

function isAdminRole(roleTitle: string) {
  return ["admin", "super", "manager"].some((keyword) => roleTitle.includes(keyword));
}

export default function AuthGuard({ children, adminOnly = false, fallbackRoute = "/login" }: AuthGuardProps) {
  const router = useRouter();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function validate() {
      try {
        const data = await apiFetch("/auth/me");
        const user = data?.user ?? data;

        if (!user) {
          throw new Error("Unauthenticated");
        }

        if (adminOnly) {
          const roleTitle = normalizeRoleTitle(user.role);
          if (!isAdminRole(roleTitle)) {
            router.replace(fallbackRoute);
            return;
          }
        }

        if (mounted) {
          setChecked(true);
        }
      } catch (error) {
        setStoredAuthToken(null);
        if (mounted) {
          router.replace("/login");
        }
      }
    }

    void validate();

    return () => {
      mounted = false;
    };
  }, [adminOnly, fallbackRoute, router]);

  if (!checked) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0a0f] text-white/70">
        <div className="rounded-xl border border-white/10 bg-white/5 px-6 py-4 text-sm shadow-xl shadow-black/20">
          Checking authentication...
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
