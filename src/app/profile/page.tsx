"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { User, LogOut, ShieldCheck, Bookmark, Highlighter, Clock } from "lucide-react";
import { useApp } from "@/components/AppContext";

export default function ProfilePage() {
  const {
    user,
    authLoading,
    refreshUser,
    translations,
    activeTranslation,
    setActiveTranslation,
    setVersePopupOpen,
  } = useApp();

  const [mode, setMode] = useState<"login" | "register" | "forgot">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [bookmarks, setBookmarks] = useState<
    Array<{ id: string; referenceLabel: string; bookId: number; chapterNum: number; translationAbbr: string }>
  >([]);
  const [highlights, setHighlights] = useState<
    Array<{ id: string; bookId: number; bookName: string; chapterNum: number; verseNum: number; color: string }>
  >([]);
  const [history, setHistory] = useState<
    Array<{ id: string; bookId: number; bookName: string; chapterNum: number; translationAbbr: string }>
  >([]);

  useEffect(() => {
    if (!user) return;
    fetch("/api/bookmarks")
      .then((r) => r.json())
      .then((d) => Array.isArray(d.bookmarks) && setBookmarks(d.bookmarks))
      .catch(() => {});
    fetch("/api/highlights")
      .then((r) => r.json())
      .then((d) => Array.isArray(d.highlights) && setHighlights(d.highlights))
      .catch(() => {});
    fetch("/api/reading-history")
      .then((r) => r.json())
      .then((d) => Array.isArray(d.history) && setHistory(d.history))
      .catch(() => {});
  }, [user]);

  async function handleAuthSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setSubmitting(true);

    try {
      const endpoint =
        mode === "login"
          ? "/api/auth/login"
          : mode === "register"
            ? "/api/auth/register"
            : "/api/auth/forgot-password";

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Authentication failed");
        return;
      }
      if (mode === "forgot") {
        setMessage(data.message);
      } else {
        await refreshUser();
        setVersePopupOpen(true);
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    await refreshUser();
  }

  if (authLoading) {
    return <div className="p-12 text-center text-sm">Loading account…</div>;
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-md px-4 py-12">
        <div
          className="rounded-3xl border p-6 sm:p-8 shadow-sm space-y-5"
          style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border-subtle)" }}
        >
          <div className="text-center">
            <div
              className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl"
              style={{ backgroundColor: "var(--accent-gold-soft)", color: "var(--accent-gold)" }}
            >
              <User className="h-6 w-6" />
            </div>
            <h1 className="text-xl font-bold">
              {mode === "login"
                ? "Sign In to Sanctuary Bible"
                : mode === "register"
                  ? "Create Your Account"
                  : "Reset Password"}
            </h1>
            <p className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>
              Sync notes, bookmarks, highlights, reading plans, and AI study history.
            </p>
          </div>

          {error && (
            <div className="rounded-xl border border-red-300 bg-red-100 text-red-900 dark:border-red-800 dark:bg-red-950/60 dark:text-red-200 p-3 text-xs font-medium">
              {error}
            </div>
          )}
          {message && (
            <div className="rounded-xl border border-emerald-300 bg-emerald-50 dark:bg-emerald-950/30 p-3 text-xs text-emerald-700 dark:text-emerald-300">
              {message}
            </div>
          )}

          <form onSubmit={handleAuthSubmit} className="space-y-3">
            {mode === "register" && (
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Full Name"
                className="w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none"
                style={{ backgroundColor: "var(--bg-page)", borderColor: "var(--border-subtle)" }}
              />
            )}
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email address"
              className="w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none"
              style={{ backgroundColor: "var(--bg-page)", borderColor: "var(--border-subtle)" }}
            />
            {mode !== "forgot" && (
              <input
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password (min 8 chars)"
                className="w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none"
                style={{ backgroundColor: "var(--bg-page)", borderColor: "var(--border-subtle)" }}
              />
            )}
            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-xl py-2.5 text-sm font-semibold text-white cursor-pointer"
              style={{ backgroundColor: "var(--accent-gold)" }}
            >
              {submitting
                ? "Please wait..."
                : mode === "login"
                  ? "Sign In"
                  : mode === "register"
                    ? "Create Account"
                    : "Send Reset Link"}
            </button>
          </form>

          <div className="flex justify-between text-xs pt-2" style={{ color: "var(--text-secondary)" }}>
            {mode === "login" ? (
              <>
                <button onClick={() => setMode("register")} className="hover:underline cursor-pointer">
                  Create account
                </button>
                <button onClick={() => setMode("forgot")} className="hover:underline cursor-pointer">
                  Forgot password?
                </button>
              </>
            ) : (
              <button onClick={() => setMode("login")} className="hover:underline cursor-pointer">
                Back to Sign In
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 py-8 space-y-6">
      {/* Profile Header */}
      <div
        className="rounded-2xl border p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border-subtle)" }}
      >
        <div>
          <h1 className="text-xl font-bold">{user.name || user.email}</h1>
          <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
            {user.email} · Role: <span className="capitalize font-semibold">{user.role}</span>
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {(user.role === "admin" || user.role === "editor") && (
            <Link
              href="/admin"
              className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold text-white"
              style={{ backgroundColor: "var(--accent-gold)" }}
            >
              <ShieldCheck className="h-4 w-4" />
              Admin Dashboard
            </Link>
          )}
          <button
            onClick={handleLogout}
            className="inline-flex items-center gap-1.5 rounded-xl border px-4 py-2 text-xs font-medium cursor-pointer"
            style={{ borderColor: "var(--border-subtle)" }}
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </div>
      </div>

      {/* Favorite Translation */}
      <div
        className="rounded-2xl border p-5 flex items-center justify-between"
        style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border-subtle)" }}
      >
        <div>
          <h2 className="text-sm font-bold">Default Translation</h2>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            Choose your preferred active Bible translation.
          </p>
        </div>
        <select
          value={activeTranslation}
          onChange={(e) => {
            setActiveTranslation(e.target.value);
            fetch("/api/auth/me", {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ profile: { favoriteTranslation: e.target.value } }),
            }).catch(() => {});
          }}
          className="rounded-xl border px-3 py-2 text-sm"
          style={{ backgroundColor: "var(--bg-page)", borderColor: "var(--border-subtle)" }}
        >
          {translations
            .filter((t) => t.isActive && t.availabilityStatus === "available")
            .map((t) => (
              <option key={t.abbreviation} value={t.abbreviation}>
                {t.abbreviation} — {t.fullName}
              </option>
            ))}
        </select>
      </div>

      {/* Bookmarks, Highlights, History */}
      <div className="grid gap-6 md:grid-cols-3">
        <div
          className="rounded-2xl border p-5 space-y-3"
          style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border-subtle)" }}
        >
          <h3 className="text-sm font-bold flex items-center gap-2">
            <Bookmark className="h-4 w-4" style={{ color: "var(--accent-gold)" }} />
            Bookmarks ({bookmarks.length})
          </h3>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {bookmarks.map((b) => (
              <Link
                key={b.id}
                href={`/bible?book=${b.bookId}&chapter=${b.chapterNum}&translation=${b.translationAbbr}`}
                className="block rounded-lg px-3 py-2 text-xs hover:opacity-80"
                style={{ backgroundColor: "var(--bg-page)" }}
              >
                {b.referenceLabel} ({b.translationAbbr})
              </Link>
            ))}
          </div>
        </div>

        <div
          className="rounded-2xl border p-5 space-y-3"
          style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border-subtle)" }}
        >
          <h3 className="text-sm font-bold flex items-center gap-2">
            <Highlighter className="h-4 w-4" style={{ color: "var(--accent-gold)" }} />
            Highlights ({highlights.length})
          </h3>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {highlights.map((h) => (
              <Link
                key={h.id}
                href={`/bible?book=${h.bookId}&chapter=${h.chapterNum}&verse=${h.verseNum}`}
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs hover:opacity-80"
                style={{ backgroundColor: "var(--bg-page)" }}
              >
                <span className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: h.color }} />
                <span>
                  {h.bookName} {h.chapterNum}:{h.verseNum}
                </span>
              </Link>
            ))}
          </div>
        </div>

        <div
          className="rounded-2xl border p-5 space-y-3"
          style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border-subtle)" }}
        >
          <h3 className="text-sm font-bold flex items-center gap-2">
            <Clock className="h-4 w-4" style={{ color: "var(--accent-gold)" }} />
            Reading History ({history.length})
          </h3>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {history.map((h) => (
              <Link
                key={h.id}
                href={`/bible?book=${h.bookId}&chapter=${h.chapterNum}&translation=${h.translationAbbr}`}
                className="block rounded-lg px-3 py-2 text-xs hover:opacity-80"
                style={{ backgroundColor: "var(--bg-page)" }}
              >
                {h.bookName} {h.chapterNum} ({h.translationAbbr})
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
