"use client";

import React, { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

function ResetPasswordInner() {
  const params = useSearchParams();
  const [token, setToken] = useState(params.get("token") || "");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setStatus(null);
    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password }),
    });
    const data = await res.json();
    if (!res.ok) setError(data.error || "Reset failed");
    else setStatus(data.message);
  }

  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <form
        onSubmit={handleSubmit}
        className="rounded-2xl border p-6 space-y-4"
        style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border-subtle)" }}
      >
        <h1 className="text-xl font-bold">Reset Your Password</h1>
        {error && <p className="text-xs text-red-600">{error}</p>}
        {status && (
          <p className="text-xs text-emerald-600">
            {status}{" "}
            <Link href="/profile" className="underline font-semibold">
              Sign In
            </Link>
          </p>
        )}
        <input
          required
          value={token}
          onChange={(e) => setToken(e.target.value)}
          placeholder="Reset Token"
          className="w-full rounded-xl border px-3 py-2 text-sm"
          style={{ backgroundColor: "var(--bg-page)", borderColor: "var(--border-subtle)" }}
        />
        <input
          type="password"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="New Password (min 8 chars)"
          className="w-full rounded-xl border px-3 py-2 text-sm"
          style={{ backgroundColor: "var(--bg-page)", borderColor: "var(--border-subtle)" }}
        />
        <button
          type="submit"
          className="w-full rounded-xl py-2.5 text-sm font-semibold text-white cursor-pointer"
          style={{ backgroundColor: "var(--accent-gold)" }}
        >
          Update Password
        </button>
      </form>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-sm">Loading…</div>}>
      <ResetPasswordInner />
    </Suspense>
  );
}
