"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  BookOpen,
  Bookmark,
  NotebookPen,
  Clock,
  Headphones,
  CalendarCheck,
  ArrowRight,
  Sparkles,
  Bell,
  Music,
  MapPin,
} from "lucide-react";
import { useApp } from "@/components/AppContext";
import { BIBLE_BOOKS } from "@/lib/bible/books";

export default function HomePage() {
  const {
    user,
    activeTranslation,
    homepageSettings,
    notifications,
    openAiWithContext,
  } = useApp();

  const [dailyVerseText, setDailyVerseText] = useState<string>("");
  const [bookmarks, setBookmarks] = useState<
    Array<{ id: string; referenceLabel: string; bookId: number; chapterNum: number; translationAbbr: string }>
  >([]);
  const [notes, setNotes] = useState<
    Array<{ id: string; title: string; referenceLabel: string | null; updatedAt: string }>
  >([]);
  const [history, setHistory] = useState<
    Array<{ id: string; bookId: number; bookName: string; chapterNum: number; translationAbbr: string }>
  >([]);
  const [audioHistory, setAudioHistory] = useState<
    Array<{ id: string; bookId: number; bookName: string; chapterNum: number; translationAbbr: string }>
  >([]);
  const [plans, setPlans] = useState<
    Array<{ id: string; title: string; durationDays: number; category: string }>
  >([]);

  const dailyRef = String(homepageSettings.dailyVerseRef || "John 3:16");
  const dailyBookId = Number(homepageSettings.dailyVerseBookId || 43);
  const dailyChapter = Number(homepageSettings.dailyVerseChapter || 3);
  const dailyVerseNum = Number(homepageSettings.dailyVerseNum || 16);

  useEffect(() => {
    fetch(
      `/api/bible/chapter?translation=${encodeURIComponent(activeTranslation)}&bookId=${dailyBookId}&chapter=${dailyChapter}`
    )
      .then((r) => r.json())
      .then((d) => {
        const v = d.verses?.find(
          (item: { verseNum: number; text: string }) => item.verseNum === dailyVerseNum
        );
        if (v) setDailyVerseText(v.text);
      })
      .catch(() => {});

    fetch("/api/reading-plans")
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d.plans)) setPlans(d.plans.slice(0, 3));
      })
      .catch(() => {});

    if (user) {
      fetch("/api/bookmarks")
        .then((r) => r.json())
        .then((d) => Array.isArray(d.bookmarks) && setBookmarks(d.bookmarks.slice(0, 4)))
        .catch(() => {});
      fetch("/api/notes")
        .then((r) => r.json())
        .then((d) => Array.isArray(d.notes) && setNotes(d.notes.slice(0, 4)))
        .catch(() => {});
      fetch("/api/reading-history")
        .then((r) => r.json())
        .then((d) => Array.isArray(d.history) && setHistory(d.history.slice(0, 4)))
        .catch(() => {});
      fetch("/api/audio/history")
        .then((r) => r.json())
        .then((d) => Array.isArray(d.history) && setAudioHistory(d.history.slice(0, 3)))
        .catch(() => {});
    }
  }, [activeTranslation, dailyBookId, dailyChapter, dailyVerseNum, user]);

  const lastRead = history[0] || {
    bookId: 43,
    bookName: "John",
    chapterNum: 3,
    translationAbbr: activeTranslation,
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8 space-y-8">
      {/* Announcements */}
      {notifications.length > 0 && (
        <div
          className="rounded-2xl border px-4 py-3 flex items-center gap-3 text-sm"
          style={{
            backgroundColor: "var(--accent-gold-soft)",
            borderColor: "var(--accent-gold)",
          }}
        >
          <Bell className="h-4 w-4 shrink-0" style={{ color: "var(--accent-gold)" }} />
          <div>
            <span className="font-semibold">{notifications[0].title}: </span>
            <span style={{ color: "var(--text-secondary)" }}>
              {notifications[0].message}
            </span>
          </div>
        </div>
      )}

      {/* Welcome Hero */}
      <section className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--accent-gold)" }}>
            {user ? `Peace to you, ${user.name || user.email.split("@")[0]}` : "Sanctuary Study"}
          </p>
          <h1 className="mt-1 text-2xl sm:text-3xl font-bold tracking-tight">
            {String(homepageSettings.welcomeTitle || "Welcome to Sanctuary Bible")}
          </h1>
          <p className="mt-1 text-sm max-w-2xl" style={{ color: "var(--text-secondary)" }}>
            {String(
              homepageSettings.welcomeSubtitle ||
                "A quiet, modern space for daily Scripture reading, study, and reflection."
            )}
          </p>
        </div>

        <div className="flex flex-wrap gap-2.5">
          <Link
            href={`/bible?book=${lastRead.bookId}&chapter=${lastRead.chapterNum}&translation=${activeTranslation}`}
            className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:opacity-90"
            style={{ backgroundColor: "var(--accent-gold)" }}
          >
            <BookOpen className="h-4 w-4" />
            <span>Continue Reading</span>
          </Link>
          <button
            onClick={() => openAiWithContext(dailyRef, activeTranslation)}
            className="inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition hover:opacity-80 cursor-pointer"
            style={{
              borderColor: "var(--border-subtle)",
              backgroundColor: "var(--bg-surface)",
            }}
          >
            <Sparkles className="h-4 w-4" style={{ color: "var(--accent-gold)" }} />
            <span>Ask AI Assistant</span>
          </button>
        </div>
      </section>

      {/* Newly Launched: The Jam Room by UD Sounds */}
      <section
        className="rounded-2xl border p-5 sm:p-6 shadow-sm overflow-hidden"
        style={{
          backgroundColor: "var(--bg-surface)",
          borderColor: "var(--border-subtle)",
        }}
      >
        <div className="grid gap-6 md:grid-cols-12 items-center">
          <div className="md:col-span-5">
            <div className="relative aspect-[4/4.5] w-full overflow-hidden rounded-xl border" style={{ borderColor: "var(--border-subtle)" }}>
              <Image
                src="/images/jam-room-launch.jpg"
                alt="The Jam Room by UD Sounds — Rehearse, Record, Perform"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 420px"
                priority
              />
            </div>
          </div>
          <div className="md:col-span-7 space-y-4">
            <div className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider" style={{ backgroundColor: "var(--accent-gold-soft)", color: "var(--accent-gold)" }}>
              <Music className="h-3.5 w-3.5" />
              <span>Newly Launched</span>
            </div>
            <h2 className="font-serif text-2xl sm:text-3xl font-semibold tracking-tight">
              The Jam Room by UD Sounds
            </h2>
            <p className="text-sm sm:text-base leading-relaxed" style={{ color: "var(--text-secondary)" }}>
              Rehearse, Record &amp; Perform in a private, comfortable sound room equipped with premium sound equipment and professional mic setup — perfect for worship teams, choirs, bands, and groups.
            </p>
            <div className="flex flex-wrap gap-2 text-xs font-medium">
              <span className="rounded-lg border px-2.5 py-1" style={{ borderColor: "var(--border-subtle)", backgroundColor: "var(--bg-page)" }}>
                Premium Sound Equipment
              </span>
              <span className="rounded-lg border px-2.5 py-1" style={{ borderColor: "var(--border-subtle)", backgroundColor: "var(--bg-page)" }}>
                Professional Mic Setup
              </span>
              <span className="rounded-lg border px-2.5 py-1" style={{ borderColor: "var(--border-subtle)", backgroundColor: "var(--bg-page)" }}>
                Private &amp; Comfortable
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm font-medium" style={{ color: "var(--text-primary)" }}>
              <MapPin className="h-4 w-4 shrink-0" style={{ color: "var(--accent-gold)" }} />
              <span>The Courtyard, Kuda Village (Near Greenwood School)</span>
            </div>
          </div>
        </div>
      </section>

      {/* Daily Bible Verse & Continue Reading */}
      <section className="grid gap-6 lg:grid-cols-3">
        {homepageSettings.showDailyVerse !== false && (
          <div
            className="lg:col-span-2 rounded-2xl border p-6 shadow-sm flex flex-col justify-between"
            style={{
              backgroundColor: "var(--bg-surface)",
              borderColor: "var(--border-subtle)",
            }}
          >
            <div>
              <div className="flex items-center justify-between">
                <span
                  className="text-xs font-semibold uppercase tracking-wider"
                  style={{ color: "var(--accent-gold)" }}
                >
                  Daily Bible Verse
                </span>
                <span className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>
                  {dailyRef} ({activeTranslation})
                </span>
              </div>
              <blockquote className="mt-4 font-scripture-serif text-xl sm:text-2xl leading-relaxed">
                “{dailyVerseText || "For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life."}”
              </blockquote>
            </div>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Link
                href={`/bible?book=${dailyBookId}&chapter=${dailyChapter}&verse=${dailyVerseNum}&translation=${activeTranslation}`}
                className="inline-flex items-center gap-1.5 text-xs font-semibold hover:underline"
                style={{ color: "var(--accent-gold)" }}
              >
                <span>Read full chapter</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
              <button
                onClick={() => openAiWithContext(dailyRef, activeTranslation)}
                className="text-xs font-medium hover:underline cursor-pointer"
                style={{ color: "var(--text-secondary)" }}
              >
                Explain this verse with AI
              </button>
            </div>
          </div>
        )}

        {homepageSettings.showContinueReading !== false && (
          <div
            className="rounded-2xl border p-6 shadow-sm flex flex-col justify-between"
            style={{
              backgroundColor: "var(--bg-surface)",
              borderColor: "var(--border-subtle)",
            }}
          >
            <div>
              <span
                className="text-xs font-semibold uppercase tracking-wider"
                style={{ color: "var(--accent-gold)" }}
              >
                Continue Reading
              </span>
              <h2 className="mt-3 text-xl font-bold">
                {lastRead.bookName} {lastRead.chapterNum}
              </h2>
              <p className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>
                Translation: {lastRead.translationAbbr || activeTranslation}
              </p>
              <div className="mt-4">
                <div className="flex justify-between text-xs mb-1" style={{ color: "var(--text-secondary)" }}>
                  <span>Study Progress</span>
                  <span>{user ? `${history.length} recent chapters` : "Guest mode"}</span>
                </div>
                <div className="h-2 w-full rounded-full bg-black/5 dark:bg-white/10 overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${Math.min(100, Math.max(12, history.length * 15))}%`,
                      backgroundColor: "var(--accent-gold)",
                    }}
                  />
                </div>
              </div>
            </div>
            <Link
              href={`/bible?book=${lastRead.bookId}&chapter=${lastRead.chapterNum}&translation=${lastRead.translationAbbr || activeTranslation}`}
              className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-2 text-xs font-semibold transition hover:opacity-80"
              style={{
                borderColor: "var(--border-subtle)",
                backgroundColor: "var(--bg-elevated)",
              }}
            >
              <span>Open Reader</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        )}
      </section>

      {/* Personal Study Row: Bookmarks, Notes, Reading History, Audio */}
      <section className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {/* My Bookmarks */}
        <div
          className="rounded-2xl border p-5"
          style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border-subtle)" }}
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Bookmark className="h-4 w-4" style={{ color: "var(--accent-gold)" }} />
              My Bookmarks
            </h3>
            <Link href="/profile" className="text-xs hover:underline" style={{ color: "var(--text-muted)" }}>
              View all
            </Link>
          </div>
          {!user ? (
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              Sign in to save and sync your verse bookmarks.
            </p>
          ) : bookmarks.length === 0 ? (
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              No bookmarks yet. Tap any verse in the reader to bookmark it.
            </p>
          ) : (
            <ul className="space-y-2">
              {bookmarks.map((b) => (
                <li key={b.id}>
                  <Link
                    href={`/bible?book=${b.bookId}&chapter=${b.chapterNum}&translation=${b.translationAbbr}`}
                    className="block rounded-lg px-2.5 py-1.5 text-xs hover:opacity-80"
                    style={{ backgroundColor: "var(--bg-elevated)" }}
                  >
                    <span className="font-medium">{b.referenceLabel}</span>
                    <span className="ml-1.5 text-[10px]" style={{ color: "var(--text-muted)" }}>
                      ({b.translationAbbr})
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* My Notes */}
        <div
          className="rounded-2xl border p-5"
          style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border-subtle)" }}
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <NotebookPen className="h-4 w-4" style={{ color: "var(--accent-gold)" }} />
              My Notes
            </h3>
            <Link href="/notes" className="text-xs hover:underline" style={{ color: "var(--text-muted)" }}>
              Open Notes
            </Link>
          </div>
          {!user ? (
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              Sign in to write, save, and export study notes as images.
            </p>
          ) : notes.length === 0 ? (
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              No notes yet. Create your first study note in the Notes tab.
            </p>
          ) : (
            <ul className="space-y-2">
              {notes.map((n) => (
                <li key={n.id}>
                  <Link
                    href="/notes"
                    className="block rounded-lg px-2.5 py-1.5 text-xs hover:opacity-80"
                    style={{ backgroundColor: "var(--bg-elevated)" }}
                  >
                    <div className="font-medium truncate">{n.title}</div>
                    {n.referenceLabel && (
                      <div className="text-[10px]" style={{ color: "var(--accent-gold)" }}>
                        {n.referenceLabel}
                      </div>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Reading History */}
        <div
          className="rounded-2xl border p-5"
          style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border-subtle)" }}
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Clock className="h-4 w-4" style={{ color: "var(--accent-gold)" }} />
              Recently Read
            </h3>
          </div>
          {history.length === 0 ? (
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              Your recently read chapters will appear here.
            </p>
          ) : (
            <ul className="space-y-2">
              {history.map((h) => (
                <li key={h.id}>
                  <Link
                    href={`/bible?book=${h.bookId}&chapter=${h.chapterNum}&translation=${h.translationAbbr}`}
                    className="block rounded-lg px-2.5 py-1.5 text-xs hover:opacity-80"
                    style={{ backgroundColor: "var(--bg-elevated)" }}
                  >
                    {h.bookName} {h.chapterNum} ({h.translationAbbr})
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Recently Played Audio */}
        <div
          className="rounded-2xl border p-5"
          style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border-subtle)" }}
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Headphones className="h-4 w-4" style={{ color: "var(--accent-gold)" }} />
              Recently Played Audio
            </h3>
            <Link href="/audio" className="text-xs hover:underline" style={{ color: "var(--text-muted)" }}>
              Audio Hub
            </Link>
          </div>
          {audioHistory.length === 0 ? (
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              Listen to any chapter in KJV, WEB, or BSB to track audio history.
            </p>
          ) : (
            <ul className="space-y-2">
              {audioHistory.map((a) => (
                <li key={a.id}>
                  <Link
                    href={`/bible?book=${a.bookId}&chapter=${a.chapterNum}&translation=${a.translationAbbr}`}
                    className="block rounded-lg px-2.5 py-1.5 text-xs hover:opacity-80"
                    style={{ backgroundColor: "var(--bg-elevated)" }}
                  >
                    {a.bookName} {a.chapterNum} ({a.translationAbbr})
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* Reading Plans */}
      {homepageSettings.showReadingPlans !== false && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <CalendarCheck className="h-5 w-5" style={{ color: "var(--accent-gold)" }} />
              Bible Reading Plans
            </h2>
            <Link href="/plans" className="text-xs font-semibold hover:underline" style={{ color: "var(--accent-gold)" }}>
              Explore all plans →
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {plans.length > 0 ? (
              plans.map((p) => (
                <Link
                  key={p.id}
                  href="/plans"
                  className="rounded-2xl border p-5 transition hover:shadow-md"
                  style={{
                    backgroundColor: "var(--bg-surface)",
                    borderColor: "var(--border-subtle)",
                  }}
                >
                  <span
                    className="rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
                    style={{
                      backgroundColor: "var(--accent-gold-soft)",
                      color: "var(--accent-gold)",
                    }}
                  >
                    {p.durationDays} Days · {p.category}
                  </span>
                  <h3 className="mt-3 font-semibold text-base">{p.title}</h3>
                </Link>
              ))
            ) : (
              <Link
                href="/plans"
                className="rounded-2xl border p-5"
                style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border-subtle)" }}
              >
                <span className="text-xs font-semibold" style={{ color: "var(--accent-gold)" }}>
                  7, 30, 90 & 365-Day Plans
                </span>
                <h3 className="mt-2 font-semibold">Browse Reading Plans</h3>
              </Link>
            )}
          </div>
        </section>
      )}

      {/* Explore Bible Books */}
      {homepageSettings.showExploreBooks !== false && (
        <section className="space-y-4">
          <h2 className="text-lg font-bold">Explore Bible Books</h2>
          <div className="grid gap-2 grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8">
            {BIBLE_BOOKS.slice(0, 16).map((b) => (
              <Link
                key={b.id}
                href={`/bible?book=${b.id}&chapter=1&translation=${activeTranslation}`}
                className="rounded-xl border px-3 py-2 text-xs font-medium text-center transition hover:opacity-80"
                style={{
                  backgroundColor: "var(--bg-surface)",
                  borderColor: "var(--border-subtle)",
                }}
              >
                {b.name}
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
