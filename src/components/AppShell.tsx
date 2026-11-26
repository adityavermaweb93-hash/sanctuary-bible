"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  BookOpen,
  Search,
  Headphones,
  NotebookPen,
  CalendarCheck,
  User,
  ShieldCheck,
  Sun,
  Moon,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  X,
  Menu,
  Info,
} from "lucide-react";
import { useApp } from "./AppContext";
import { AiAssistantDrawer } from "./AiAssistantDrawer";
import { VerseOfTheDayModal } from "./VerseOfTheDayModal";
import { BibleCoverSplash } from "./BibleCoverSplash";
import { JamRoomLaunchModal } from "./JamRoomLaunchModal";

const DESKTOP_NAV = [
  { href: "/", label: "Home", icon: Home },
  { href: "/bible", label: "Bible", icon: BookOpen },
  { href: "/search", label: "Search", icon: Search },
  { href: "/audio", label: "Audio", icon: Headphones },
  { href: "/notes", label: "Notes", icon: NotebookPen },
  { href: "/plans", label: "Reading Plans", icon: CalendarCheck },
  { href: "/profile", label: "Profile", icon: User },
];

const MOBILE_NAV = [
  { href: "/", label: "Home", icon: Home },
  { href: "/bible", label: "Bible", icon: BookOpen },
  { href: "/search", label: "Search", icon: Search },
  { href: "/notes", label: "Notes", icon: NotebookPen },
];

const SPEEDS = [0.75, 1, 1.25, 1.5, 1.75, 2];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const {
    user,
    branding,
    preferences,
    updatePreferences,
    audio,
    togglePlayPause,
    nextVerse,
    prevVerse,
    setAudioSpeed,
    closeAudio,
  } = useApp();

  const isAdminRoute = pathname?.startsWith("/admin");

  if (isAdminRoute) {
    return <div className="min-h-screen">{children}</div>;
  }

  return (
    <div className="min-h-screen flex flex-col">
      {preferences.brightness < 100 && (
        <div
          aria-hidden="true"
          className="pointer-events-none fixed inset-0 z-[60] bg-black transition-opacity"
          style={{ opacity: Math.min(0.75, (100 - preferences.brightness) / 100) }}
        />
      )}
      {/* Desktop & Tablet Top Header */}
      <header
        className="sticky top-0 z-30 border-b backdrop-blur-md"
        style={{
          backgroundColor: "color-mix(in srgb, var(--bg-surface) 88%, transparent)",
          borderColor: "var(--border-subtle)",
        }}
      >
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <div
              className="flex h-9 w-9 items-center justify-center rounded-xl font-bold text-sm"
              style={{ backgroundColor: branding.primaryColor, color: "#faf8f3" }}
            >
              SB
            </div>
            <div>
              <span className="font-semibold tracking-tight text-base block leading-none">
                {branding.appName}
              </span>
              <span className="text-[11px] hidden sm:block" style={{ color: "var(--text-muted)" }}>
                {branding.tagline}
              </span>
            </div>
          </Link>

          <nav className="hidden lg:flex items-center gap-1">
            {DESKTOP_NAV.map((item) => {
              const Icon = item.icon;
              const active =
                item.href === "/"
                  ? pathname === "/"
                  : pathname?.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium transition"
                  style={
                    active
                      ? {
                          backgroundColor: "var(--accent-gold-soft)",
                          color: "var(--accent-gold)",
                        }
                      : { color: "var(--text-secondary)" }
                  }
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
            {(user?.role === "admin" || user?.role === "editor") && (
              <Link
                href="/admin"
                className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium transition"
                style={
                  isAdminRoute
                    ? {
                        backgroundColor: "var(--accent-gold-soft)",
                        color: "var(--accent-gold)",
                      }
                    : { color: "var(--text-secondary)" }
                }
              >
                <ShieldCheck className="h-4 w-4" />
                <span>Admin</span>
              </Link>
            )}
          </nav>

          <div className="flex items-center gap-2">
            <button
              onClick={() =>
                updatePreferences({
                  theme: preferences.theme === "dark" ? "light" : "dark",
                })
              }
              aria-label="Toggle Light/Dark theme"
              className="rounded-xl border p-2 transition hover:opacity-80 cursor-pointer"
              style={{
                borderColor: "var(--border-subtle)",
                backgroundColor: "var(--bg-page)",
              }}
            >
              {preferences.theme === "dark" ? (
                <Sun className="h-4 w-4" style={{ color: "var(--accent-gold)" }} />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </button>
            <Link
              href="/profile"
              className="hidden sm:inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-medium transition hover:opacity-80"
              style={{
                borderColor: "var(--border-subtle)",
                backgroundColor: "var(--bg-page)",
              }}
            >
              <User className="h-3.5 w-3.5" />
              <span>{user ? user.name || user.email.split("@")[0] : "Sign In"}</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className={`flex-1 ${audio.isOpen ? "pb-36 lg:pb-24" : "pb-20 lg:pb-8"}`}>
        {children}
      </main>

      {/* Desktop Footer */}
      <footer
        className="hidden md:block border-t py-6 text-xs"
        style={{ borderColor: "var(--border-subtle)", color: "var(--text-muted)" }}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6">
          <span>© 2026 {branding.appName}. All rights reserved.</span>
          <div className="flex items-center gap-4">
            <Link href="/about" className="hover:underline">About & Contact</Link>
            <Link href="/about" className="hover:underline">Privacy Policy</Link>
            <Link href="/about" className="hover:underline">Terms & Copyright</Link>
          </div>
        </div>
      </footer>

      {/* Persistent Bottom Audio Player */}
      {audio.isOpen && (
        <div
          className="fixed left-0 right-0 bottom-16 lg:bottom-0 z-30 border-t px-4 py-2.5 shadow-lg backdrop-blur-md"
          style={{
            backgroundColor: "color-mix(in srgb, var(--bg-surface) 95%, transparent)",
            borderColor: "var(--border-subtle)",
          }}
        >
          <div className="mx-auto flex max-w-5xl items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold truncate">
                  {audio.bookName} {audio.chapterNum}
                  {audio.verses[audio.currentVerseIndex]
                    ? `:${audio.verses[audio.currentVerseIndex].verseNum}`
                    : ""}
                </span>
                <span
                  className="rounded-md px-1.5 py-0.5 text-[10px] font-semibold"
                  style={{
                    backgroundColor: "var(--accent-gold-soft)",
                    color: "var(--accent-gold)",
                  }}
                >
                  {audio.translationAbbr}
                </span>
              </div>
              {audio.error ? (
                <p className="text-[11px] text-amber-600 dark:text-amber-400 truncate">
                  {audio.error}
                </p>
              ) : (
                <div className="mt-1 h-1.5 w-full max-w-xs overflow-hidden rounded-full bg-black/10 dark:bg-white/10">
                  <div
                    className="h-full transition-all"
                    style={{
                      width: `${
                        audio.verses.length
                          ? ((audio.currentVerseIndex + 1) / audio.verses.length) * 100
                          : 0
                      }%`,
                      backgroundColor: "var(--accent-gold)",
                    }}
                  />
                </div>
              )}
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2">
              <button
                onClick={prevVerse}
                aria-label="Previous verse"
                className="rounded-lg p-1.5 hover:opacity-75 cursor-pointer"
              >
                <SkipBack className="h-4 w-4" />
              </button>
              <button
                onClick={togglePlayPause}
                disabled={audio.mode === "unavailable"}
                aria-label={audio.isPlaying ? "Pause" : "Play"}
                className="flex h-9 w-9 items-center justify-center rounded-full disabled:opacity-40 cursor-pointer"
                style={{ backgroundColor: "var(--accent-gold)", color: "#ffffff" }}
              >
                {audio.isPlaying ? (
                  <Pause className="h-4 w-4" />
                ) : (
                  <Play className="h-4 w-4 ml-0.5" />
                )}
              </button>
              <button
                onClick={nextVerse}
                aria-label="Next verse"
                className="rounded-lg p-1.5 hover:opacity-75 cursor-pointer"
              >
                <SkipForward className="h-4 w-4" />
              </button>
              <select
                value={audio.speed}
                onChange={(e) => setAudioSpeed(Number(e.target.value))}
                aria-label="Playback speed"
                className="rounded-lg border px-1.5 py-1 text-xs outline-none"
                style={{
                  borderColor: "var(--border-subtle)",
                  backgroundColor: "var(--bg-page)",
                }}
              >
                {SPEEDS.map((s) => (
                  <option key={s} value={s}>
                    {s}x
                  </option>
                ))}
              </select>
              <button
                onClick={closeAudio}
                aria-label="Close audio player"
                className="rounded-lg p-1.5 hover:opacity-75 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Bottom Sheet Menu */}
      {mobileMenuOpen && (
        <>
          <div
            className="fixed inset-0 z-30 bg-black/40 lg:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div
            className="fixed inset-x-0 bottom-16 z-40 lg:hidden rounded-t-2xl border-t p-4 shadow-2xl"
            style={{
              backgroundColor: "var(--bg-surface)",
              borderColor: "var(--border-subtle)",
              paddingBottom: "calc(1rem + env(safe-area-inset-bottom))",
            }}
          >
            <div className="mb-3 flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                Menu
              </span>
              <button
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Close menu"
                className="rounded-lg p-1 hover:opacity-75 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[
                ...DESKTOP_NAV,
                { href: "/about", label: "About", icon: Info },
                ...(user?.role === "admin" || user?.role === "editor"
                  ? [{ href: "/admin", label: "Admin", icon: ShieldCheck }]
                  : []),
              ].map((item) => {
                const Icon = item.icon;
                const active =
                  item.href === "/" ? pathname === "/" : pathname?.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex flex-col items-center justify-center gap-1.5 rounded-xl border p-3 text-xs font-medium transition"
                    style={{
                      borderColor: active ? "var(--accent-gold)" : "var(--border-subtle)",
                      backgroundColor: active ? "var(--accent-gold-soft)" : "var(--bg-page)",
                      color: active ? "var(--accent-gold)" : "var(--text-primary)",
                    }}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="truncate max-w-full">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* Mobile Bottom Navigation */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-40 flex lg:hidden min-h-16 items-center justify-around border-t"
        style={{
          backgroundColor: "var(--bg-surface)",
          borderColor: "var(--border-subtle)",
          paddingBottom: "env(safe-area-inset-bottom)",
        }}
      >
        {MOBILE_NAV.map((item) => {
          const Icon = item.icon;
          const active =
            item.href === "/" ? pathname === "/" : pathname?.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileMenuOpen(false)}
              className="flex flex-col items-center justify-center gap-0.5 px-2 py-1 text-[11px] font-medium"
              style={{
                color: active ? "var(--accent-gold)" : "var(--text-muted)",
              }}
            >
              <Icon className="h-5 w-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
        <button
          type="button"
          onClick={() => setMobileMenuOpen((prev) => !prev)}
          aria-label="Open full menu"
          className="flex flex-col items-center justify-center gap-0.5 px-2 py-1 text-[11px] font-medium cursor-pointer"
          style={{
            color: mobileMenuOpen ? "var(--accent-gold)" : "var(--text-muted)",
          }}
        >
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          <span>Menu</span>
        </button>
      </nav>

      {/* Floating AI Bible Study Assistant */}
      <AiAssistantDrawer />
      {/* Verse of the Day Login Popup */}
      <VerseOfTheDayModal />
      {/* Newly Launched Jam Room Popup */}
      <JamRoomLaunchModal />
      {/* Opening Holy Bible Book Cover */}
      <BibleCoverSplash />
    </div>
  );
}
