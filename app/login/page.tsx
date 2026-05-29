"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api";

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data?.message ?? "Invalid username or password.");
        setLoading(false);
        return;
      }

      localStorage.setItem("admin_token", data.access_token);
      router.push("/admin");
    } catch (err) {
      setError("Unable to reach the server. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-4 overflow-hidden relative">
      {/* Ambient background */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 50% -10%, rgba(99,102,241,0.18) 0%, transparent 70%), radial-gradient(ellipse 60% 40% at 80% 100%, rgba(236,72,153,0.10) 0%, transparent 70%)",
        }}
      />

      {/* Grid texture */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      {/* Card */}
      <div
        className={`relative w-full max-w-md transition-all duration-700 ${
          mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
        }`}
      >
        {/* Top accent line */}
        <div className="h-px w-full bg-gradient-to-r from-transparent via-indigo-500 to-transparent mb-0" />

        <div
          className="bg-[#111118] border border-white/[0.07] rounded-b-2xl rounded-t-none px-8 py-10 shadow-2xl"
          style={{
            boxShadow:
              "0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04)",
          }}
        >
          {/* Logo / Brand */}
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
              <p className="text-white font-semibold text-sm tracking-wide leading-none">
                Admin Portal
              </p>
              <p className="text-white/30 text-[11px] mt-0.5 tracking-widest uppercase">
                Venus Enterprises Management System
              </p>
            </div>
          </div>

          {/* Heading */}
          <div className="mb-8">
            <h1 className="text-white text-2xl font-bold tracking-tight">Sign in</h1>
            <p className="text-white/40 text-sm mt-1">
                Access the administration dashboard with username and password
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Username */}
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-white/50 uppercase tracking-widest">
                Username
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/25 pointer-events-none">
                  <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
                    <path
                      d="M1 3.5A.5.5 0 011.5 3h12a.5.5 0 01.5.5v8a.5.5 0 01-.5.5h-12a.5.5 0 01-.5-.5v-8zm1 .809V11h11V4.309L7.5 8.5 2 4.309zM12.45 4H2.55L7.5 7.691 12.45 4z"
                      fill="currentColor"
                    />
                  </svg>
                </span>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  autoComplete="username"
                  placeholder="superadmin"
                  className="w-full bg-white/[0.04] border border-white/[0.08] text-white placeholder-white/20 rounded-lg pl-10 pr-4 py-3 text-sm outline-none focus:border-indigo-500/70 focus:bg-white/[0.06] transition-all duration-200"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-white/50 uppercase tracking-widest">
                Password
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/25 pointer-events-none">
                  <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
                    <path
                      d="M5 6V4.5a2.5 2.5 0 015 0V6h.5A1.5 1.5 0 0112 7.5v4A1.5 1.5 0 0110.5 13h-6A1.5 1.5 0 013 11.5v-4A1.5 1.5 0 014.5 6H5zm1 0h4V4.5a2 2 0 10-4 0V6zm-1.5 1a.5.5 0 00-.5.5v4a.5.5 0 00.5.5h6a.5.5 0 00.5-.5v-4a.5.5 0 00-.5-.5h-6z"
                      fill="currentColor"
                    />
                  </svg>
                </span>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="w-full bg-white/[0.04] border border-white/[0.08] text-white placeholder-white/20 rounded-lg pl-10 pr-11 py-3 text-sm outline-none focus:border-indigo-500/70 focus:bg-white/[0.06] transition-all duration-200"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/25 hover:text-white/60 transition-colors"
                >
                  {showPassword ? (
                    <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
                      <path
                        d="M13.354 1.354a.5.5 0 10-.708-.708L10.3 2.993A7.17 7.17 0 007.5 2.5C4.308 2.5 1.656 4.365.5 7.5c.52 1.404 1.397 2.606 2.51 3.488l-1.864 1.658a.5.5 0 10.708.708l12-12zM4.097 10.281A5.665 5.665 0 012.02 7.5C3.007 5.14 5.09 3.5 7.5 3.5c.78 0 1.527.162 2.21.454L8.18 5.48A2.5 2.5 0 005.48 8.18L4.097 10.28zM7.5 11.5c-.834 0-1.628-.18-2.342-.505l.742-.742A3.469 3.469 0 007.5 10.5a3.5 3.5 0 003.5-3.5c0-.358-.054-.703-.154-1.03l.8-.8C12.496 5.89 13.31 6.636 13.98 7.5 12.993 9.86 10.91 11.5 7.5 11.5z"
                        fill="currentColor"
                      />
                    </svg>
                  ) : (
                    <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
                      <path
                        d="M7.5 2.5C4.308 2.5 1.656 4.365.5 7.5c1.156 3.135 3.808 5 7 5s5.844-1.865 7-5c-1.156-3.135-3.808-5-7-5zm0 8.5a3.5 3.5 0 110-7 3.5 3.5 0 010 7zm0-1.5a2 2 0 100-4 2 2 0 000 4z"
                        fill="currentColor"
                      />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2.5 bg-red-500/10 border border-red-500/20 rounded-lg px-3.5 py-2.5">
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 15 15"
                  fill="none"
                  className="text-red-400 shrink-0"
                >
                  <path
                    d="M7.5 1a6.5 6.5 0 100 13A6.5 6.5 0 007.5 1zm0 1a5.5 5.5 0 110 11A5.5 5.5 0 017.5 2zm0 3a.5.5 0 00-.5.5v3a.5.5 0 001 0v-3A.5.5 0 007.5 5zm0 6a.75.75 0 100-1.5.75.75 0 000 1.5z"
                    fill="currentColor"
                  />
                </svg>
                <span className="text-red-400 text-xs">{error}</span>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full relative overflow-hidden bg-indigo-600 hover:bg-indigo-500 disabled:opacity-70 disabled:cursor-not-allowed text-white font-semibold rounded-lg py-3 text-sm transition-all duration-200 shadow-lg shadow-indigo-900/40 mt-2 group"
            >
              <span
                className={`flex items-center justify-center gap-2 transition-all duration-300 ${
                  loading ? "opacity-0" : "opacity-100"
                }`}
              >
                Sign in to dashboard
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 15 15"
                  fill="none"
                  className="group-hover:translate-x-0.5 transition-transform duration-200"
                >
                  <path
                    d="M8.293 2.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L10.586 8.5H2a1 1 0 010-2h8.586L8.293 3.707a1 1 0 010-1.414z"
                    fill="currentColor"
                  />
                </svg>
              </span>
              {loading && (
                <span className="absolute inset-0 flex items-center justify-center">
                  <svg
                    className="animate-spin w-4 h-4 text-white"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                    />
                  </svg>
                </span>
              )}
            </button>
          </form>

          {/* Footer note */}
          <p className="text-white/20 text-[11px] text-center mt-8 tracking-wide">
            Restricted access · Authorized personnel only
          </p>
        </div>

        {/* Bottom accent */}
        <div className="h-px w-3/4 mx-auto bg-gradient-to-r from-transparent via-indigo-500/30 to-transparent mt-0" />
      </div>
    </div>
  );
}