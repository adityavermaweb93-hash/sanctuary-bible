"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { BookOpen, Sparkles, X } from "lucide-react";
import { useApp } from "./AppContext";

export function VerseOfTheDayModal() {
  const {
    user,
    versePopupOpen,
    setVersePopupOpen,
    homepageSettings,
    activeTranslation,
    openAiWithContext,
  } = useApp();

  const dailyRef = String(homepageSettings.dailyVerseRef || "John 3:16");
  const dailyBookId = Number(homepageSettings.dailyVerseBookId || 43);
  const dailyChapter = Number(homepageSettings.dailyVerseChapter || 3);
  const dailyVerseNum = Number(homepageSettings.dailyVerseNum || 16);

  const [verseText, setVerseText] = useState(
    "For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life."
  );

  useEffect(() => {
    if (!versePopupOpen) return;
    fetch(
      `/api/bible/chapter?translation=${encodeURIComponent(activeTranslation)}&bookId=${dailyBookId}&chapter=${dailyChapter}`
    )
      .then((r) => r.json())
      .then((d) => {
        const found = d.verses?.find(
          (v: { verseNum: number; text: string }) => v.verseNum === dailyVerseNum
        );
        if (found?.text) setVerseText(found.text);
      })
      .catch(() => {});
  }, [versePopupOpen, activeTranslation, dailyBookId, dailyChapter, dailyVerseNum]);

  if (!versePopupOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 backdrop-blur-sm p-4">
      <div
        className="relative w-full max-w-lg rounded-3xl border p-6 sm:p-8 shadow-2xl space-y-5"
        style={{
          backgroundColor: "var(--bg-surface)",
          borderColor: "var(--accent-gold)",
        }}
      >
        <button
          onClick={() => setVersePopupOpen(false)}
          aria-label="Close Verse of the Day"
          className="absolute right-4 top-4 rounded-full p-1.5 hover:opacity-75 cursor-pointer"
        >
          <X className="h-4 w-4" />
        </button>

        <div>
          <span
            className="inline-block rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wider"
            style={{
              backgroundColor: "var(--accent-gold-soft)",
              color: "var(--accent-gold)",
            }}
          >
            Verse of the Day
          </span>
          {user && (
            <p className="mt-2 text-xs" style={{ color: "var(--text-muted)" }}>
              Welcome back, {user.name || user.email.split("@")[0]}.
            </p>
          )}
        </div>

        <blockquote className="font-scripture-serif text-xl sm:text-2xl leading-relaxed">
          “{verseText}”
        </blockquote>

        <p className="text-sm font-semibold" style={{ color: "var(--accent-gold)" }}>
          — {dailyRef} ({activeTranslation})
        </p>

        <div className="flex flex-wrap items-center gap-2.5 pt-2">
          <Link
            href={`/bible?book=${dailyBookId}&chapter=${dailyChapter}&verse=${dailyVerseNum}&translation=${activeTranslation}`}
            onClick={() => setVersePopupOpen(false)}
            className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-xs font-semibold text-white"
            style={{ backgroundColor: "var(--accent-gold)" }}
          >
            <BookOpen className="h-3.5 w-3.5" />
            Read Chapter
          </Link>

          <button
            onClick={() => {
              setVersePopupOpen(false);
              openAiWithContext(dailyRef, activeTranslation);
            }}
            className="inline-flex items-center gap-1.5 rounded-xl border px-4 py-2.5 text-xs font-medium cursor-pointer"
            style={{
              borderColor: "var(--border-subtle)",
              backgroundColor: "var(--bg-page)",
            }}
          >
            <Sparkles className="h-3.5 w-3.5" style={{ color: "var(--accent-gold)" }} />
            Ask AI About This Verse
          </button>

          <button
            onClick={() => setVersePopupOpen(false)}
            className="ml-auto text-xs font-medium hover:underline cursor-pointer"
            style={{ color: "var(--text-muted)" }}
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}
