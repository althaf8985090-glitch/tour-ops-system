"use client";

import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/manifest";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"admin" | "guide">("guide");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await signIn("credentials", {
      email,
      password,
      role,
      redirect: false,
      callbackUrl,
    });

    setLoading(false);

    if (!res || res.error) {
      setError("Invalid email or password");
      return;
    }

    router.push(res.url ?? callbackUrl);
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6 bg-white">
      <div className="w-full max-w-md space-y-4">
        <h1 className="text-2xl font-semibold text-[#022c22] text-center tracking-wide">
          UNCLE SAM TOURS
        </h1>
        <div className="rounded-2xl border border-emerald-400/50 bg-[#022c22] px-8 py-10 shadow-[0_0_40px_rgba(16,185,129,0.35)]">
          <p className="text-sm text-emerald-100">Sign in</p>

          <form className="mt-6 space-y-4" onSubmit={onSubmit}>
          <div className="space-y-2">
            <div className="inline-flex rounded-full bg-[#064e3b] p-1 text-xs font-medium text-emerald-50">
              <button
                type="button"
                onClick={() => setRole("guide")}
                className={`px-4 py-1 rounded-full transition-colors ${
                  role === "guide"
                    ? "bg-emerald-400 text-[#022c22]"
                    : "bg-transparent text-emerald-100 hover:bg-emerald-300/20"
                }`}
              >
                Guide
              </button>
              <button
                type="button"
                onClick={() => setRole("admin")}
                className={`px-4 py-1 rounded-full transition-colors ${
                  role === "admin"
                    ? "bg-emerald-400 text-[#022c22]"
                    : "bg-transparent text-emerald-100 hover:bg-emerald-300/20"
                }`}
              >
                Admin
              </button>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-emerald-50">
              Email
            </label>
            <input
              className="w-full rounded-xl border border-emerald-500/40 bg-[#064e3b] px-4 py-3 text-sm text-emerald-50 outline-none focus:ring-2 focus:ring-emerald-300/70"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-emerald-50">
              Password
            </label>
            <input
              className="w-full rounded-xl border border-emerald-500/40 bg-[#064e3b] px-4 py-3 text-sm text-emerald-50 outline-none focus:ring-2 focus:ring-emerald-300/70"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>

          {error ? (
            <div className="rounded-xl bg-red-900/40 px-4 py-3 text-sm text-red-100">
              {error}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-emerald-400 text-[#022c22] py-3 text-sm font-semibold disabled:opacity-60 hover:bg-emerald-300 transition-colors"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>
        </div>
      </div>
    </div>
  );
}

