"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch, setStoredAuthToken } from "../../lib/api";

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const data = await apiFetch("/auth/login", {
        method: "POST",
        body: JSON.stringify({ username, password }),
      });

      const token = data?.token || data?.accessToken || data?.access_token;
      if (!token) {
        throw new Error("No authentication token returned");
      }

      setStoredAuthToken(token);

      const user = data?.user ?? data;
      const roleTitle = String(user?.role?.position_title || user?.role?.name || user?.role?.title || "").toLowerCase();
      const isAdminRole = ["admin", "super", "manager"].some((keyword) => roleTitle.includes(keyword));
      const targetRoute = isAdminRole ? "/admin" : "/user";
      router.replace(targetRoute);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unable to sign in right now.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-4 overflow-hidden relative">
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 50% -10%, rgba(99,102,241,0.18) 0%, transparent 70%), radial-gradient(ellipse 60% 40% at 80% 100%, rgba(236,72,153,0.10) 0%, transparent 70%)",
        }}
      />

      <div
        className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      <div className="relative w-full max-w-md transition-all duration-700 opacity-100 translate-y-0">
        <div className="h-px w-full bg-gradient-to-r from-transparent via-indigo-500 to-transparent mb-0" />

        <div
          className="bg-[#111118] border border-white/[0.07] rounded-b-2xl rounded-t-none px-8 py-10 shadow-2xl"
          style={{
            boxShadow: "0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04)",
          }}
        >
          <div className="flex items-center gap-3 mb-10">
            <div className="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-900/60">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <rect x="2" y="2" width="6" height="6" rx="1.5" fill="white" opacity="0.9" />
                <rect x="10" y="2" width="6" height="6" rx="1.5" fill="white" opacity="0.5" />
                <rect x="2" y="10" width="6" height="6" rx="1.5" fill="white" opacity="0.5" />
                <rect x="10" y="10" width="6" height="6" rx="1.5" fill="white" opacity="0.9" />
              </svg>
            </div>
            <div>
              <p className="text-white font-semibold text-sm tracking-wide leading-none">Admin Portal</p>
              <p className="text-white/30 text-[11px] mt-0.5 tracking-widest uppercase">
                Venus Enterprises Management System
              </p>
            </div>
          </div>

          <div className="mb-8">
            <h1 className="text-white text-2xl font-bold tracking-tight">Sign in</h1>
            <p className="text-white/40 text-sm mt-1">Use your backend credentials to access the dashboard.</p>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm text-white/70 mb-2" htmlFor="username">
                Username or employee ID
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white outline-none ring-0 focus:border-indigo-500"
                placeholder="Enter username"
                required
              />
            </div>

            <div>
              <label className="block text-sm text-white/70 mb-2" htmlFor="password">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white outline-none ring-0 focus:border-indigo-500"
                placeholder="Enter password"
                required
              />
            </div>

            {error ? <p className="text-sm text-rose-400">{error}</p> : null}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-70 text-white font-semibold rounded-lg py-3 text-sm transition-all duration-200 shadow-lg shadow-indigo-900/40"
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <p className="text-white/20 text-[11px] text-center mt-8 tracking-wide">
            Use the credentials created in the backend user management flow.
          </p>
        </div>

        <div className="h-px w-3/4 mx-auto bg-gradient-to-r from-transparent via-indigo-500/30 to-transparent mt-0" />
      </div>
    </div>
  );
}
