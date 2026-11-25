"use client";

import React, { useEffect, useState, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  Headphones,
  SlidersHorizontal,
  Columns2,
  Bookmark,
  Highlighter,
  NotebookPen,
  Copy,
  Share2,
  Sparkles,
  Lock,
  Check,
  X,
} from "lucide-react";
import Link from "next/link";
import { useApp, TranslationMeta } from "@/components/AppContext";
import { BIBLE_BOOKS } from "@/lib/bible/books";
import { VerseItem } from "@/lib/bible/sample-scripture";

const HIGHLIGHT_COLORS = [
  { name: "Gold", hex: "#fef08a" },
  { name: "Sage", hex: "#bbf7d0" },
  { name: "Sky", hex: "#bae6fd" },
  { name: "Rose", hex: "#fecdd3" },
  { name: "Lavender", hex: "#e9d5ff" },
];

function BibleReaderInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const {
    user,
    translations,
    activeTranslation,
    setActiveTranslation,
    preferences,
    updatePreferences,
    startAudioChapter,
    openAiWithContext,
    trackEvent,
  } = useApp();

  const bookId = Number(searchParams.get("book") || "43");
  const chapterNum = Number(searchParams.get("chapter") || "3");
  const urlTrans = searchParams.get("translation");
  const targetVerse = searchParams.get("verse")
    ? Number(searchParams.get("verse"))
    : null;

  const currentTranslation = urlTrans || activeTranslation;
  const currentBook =
    BIBLE_BOOKS.find((b) => b.id === bookId) || BIBLE_BOOKS[42];

  const [verses, setVerses] = useState<VerseItem[]>([]);
  const [copyrightInfo, setCopyrightInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedVerse, setSelectedVerse] = useState<VerseItem | null>(null);
  const [highlights, setHighlights] = useState<Record<number, string>>({});
  const [copiedMsg, setCopiedMsg] = useState<string | null>(null);

  // Modals / Popovers
  const [showTypography, setShowTypography] = useState(false);
  const [showTranslations, setShowTranslations] = useState(false);
  const [selectedUnavailable, setSelectedUnavailable] =
    useState<TranslationMeta | null>(null);
  const [showBooks, setShowBooks] = useState(false);
  const [bookTab, setBookTab] = useState<"OT" | "NT">(
    currentBook.testament === "OT" ? "OT" : "NT"
  );

  // Compare modal
  const [compareOpen, setCompareOpen] = useState(false);
  const [compareResults, setCompareResults] = useState<
    Array<{ translation: string; fullName: string; available: boolean; text: string }>
  >([]);
  const [compareLoading, setCompareLoading] = useState(false);

  // Quick Note modal
  const [noteModalOpen, setNoteModalOpen] = useState(false);
  const [noteTitle, setNoteTitle] = useState("");
  const [noteContent, setNoteContent] = useState("");
  const [noteSaving, setNoteSaving] = useState(false);

  const navigateChapter = useCallback(
    (newBookId: number, newChap: number, newTrans = currentTranslation) => {
      setSelectedVerse(null);
      router.push(
        `/bible?book=${newBookId}&chapter=${newChap}&translation=${encodeURIComponent(newTrans)}`
      );
    },
    [currentTranslation, router]
  );

  useEffect(() => {
    let active = true;
    const t = setTimeout(() => {
      if (!active) return;
      setLoading(true);
      setError(null);
    }, 0);

    fetch(
      `/api/bible/chapter?translation=${encodeURIComponent(currentTranslation)}&bookId=${currentBook.id}&chapter=${chapterNum}`
    )
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to load chapter");
        return data;
      })
      .then((data) => {
        if (!active) return;
        setVerses(data.verses || []);
        setCopyrightInfo(data.translation?.copyrightInfo || null);
        trackEvent({
          eventType: "chapter_read",
          translationAbbr: currentTranslation,
          bookId: currentBook.id,
          chapterNum,
        });
      })
      .catch((err) => {
        if (!active) return;
        setError(err instanceof Error ? err.message : "Failed to load chapter");
        setVerses([]);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
      clearTimeout(t);
    };
  }, [currentBook.id, chapterNum, currentTranslation, trackEvent]);

  useEffect(() => {
    if (!user) {
      const t = setTimeout(() => setHighlights({}), 0);
      return () => clearTimeout(t);
    }
    fetch(`/api/highlights?bookId=${currentBook.id}&chapter=${chapterNum}`)
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d.highlights)) {
          const map: Record<number, string> = {};
          for (const h of d.highlights) map[h.verseNum] = h.color;
          setHighlights(map);
        }
      })
      .catch(() => {});
  }, [user, currentBook.id, chapterNum]);

  function handlePrevChapter() {
    if (chapterNum > 1) {
      navigateChapter(currentBook.id, chapterNum - 1);
    } else if (currentBook.id > 1) {
      const prevBook = BIBLE_BOOKS.find((b) => b.id === currentBook.id - 1)!;
      navigateChapter(prevBook.id, prevBook.chapterCount);
    }
  }

  function handleNextChapter() {
    if (chapterNum < currentBook.chapterCount) {
      navigateChapter(currentBook.id, chapterNum + 1);
    } else if (currentBook.id < 66) {
      const nextBook = BIBLE_BOOKS.find((b) => b.id === currentBook.id + 1)!;
      navigateChapter(nextBook.id, 1);
    }
  }

  async function handleHighlight(color: string | null) {
    if (!selectedVerse || !user) return;
    if (!color) {
      await fetch(
        `/api/highlights?bookId=${currentBook.id}&chapter=${chapterNum}&verse=${selectedVerse.verseNum}`,
        { method: "DELETE" }
      );
      setHighlights((prev) => {
        const copy = { ...prev };
        delete copy[selectedVerse.verseNum];
        return copy;
      });
      return;
    }

    await fetch("/api/highlights", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        bookId: currentBook.id,
        bookName: currentBook.name,
        chapterNum,
        verseNum: selectedVerse.verseNum,
        translationAbbr: currentTranslation,
        color,
      }),
    });
    setHighlights((prev) => ({ ...prev, [selectedVerse.verseNum]: color }));
  }

  async function handleBookmark() {
    if (!selectedVerse) return;
    if (!user) {
      router.push("/profile");
      return;
    }
    await fetch("/api/bookmarks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        bookId: currentBook.id,
        bookName: currentBook.name,
        chapterNum,
        verseNum: selectedVerse.verseNum,
        referenceLabel: `${currentBook.name} ${chapterNum}:${selectedVerse.verseNum}`,
        translationAbbr: currentTranslation,
      }),
    });
    setCopiedMsg("Bookmarked!");
    setTimeout(() => setCopiedMsg(null), 2000);
  }

  async function handleCompare() {
    if (!selectedVerse) return;
    setCompareOpen(true);
    setCompareLoading(true);
    try {
      const res = await fetch(
        `/api/bible/compare?bookId=${currentBook.id}&chapter=${chapterNum}&verse=${selectedVerse.verseNum}&translations=KJV,WEB,BSB,ASV,BBE`
      );
      const data = await res.json();
      setCompareResults(data.comparisons || []);
    } finally {
      setCompareLoading(false);
    }
  }

  async function handleSaveQuickNote(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedVerse || !user) return;
    setNoteSaving(true);
    try {
      await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: noteTitle || `${currentBook.name} ${chapterNum}:${selectedVerse.verseNum}`,
          content: noteContent,
          bookId: currentBook.id,
          bookName: currentBook.name,
          chapterNum,
          verseNum: selectedVerse.verseNum,
          referenceLabel: `${currentBook.name} ${chapterNum}:${selectedVerse.verseNum}`,
          translationAbbr: currentTranslation,
        }),
      });
      setNoteModalOpen(false);
      setNoteTitle("");
      setNoteContent("");
      setCopiedMsg("Note saved to account!");
      setTimeout(() => setCopiedMsg(null), 2500);
    } finally {
      setNoteSaving(false);
    }
  }

  const fontClass =
    preferences.fontFamily === "sans"
      ? "font-scripture-sans"
      : preferences.fontFamily === "georgia"
        ? "font-scripture-georgia"
        : "font-scripture-serif";

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 py-6">
      {/* Top Reader Controls Bar */}
      <div
        className="sticky top-16 z-20 mb-6 flex flex-wrap items-center justify-between gap-2 rounded-2xl border px-3 py-2.5 shadow-sm backdrop-blur-md"
        style={{
          backgroundColor: "color-mix(in srgb, var(--bg-surface) 92%, transparent)",
          borderColor: "var(--border-subtle)",
        }}
      >
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowBooks(!showBooks)}
            className="rounded-xl border px-3 py-1.5 text-sm font-semibold hover:opacity-80 cursor-pointer"
            style={{ borderColor: "var(--border-subtle)", backgroundColor: "var(--bg-page)" }}
          >
            {currentBook.name} {chapterNum}
          </button>

          <button
            onClick={() => setShowTranslations(!showTranslations)}
            className="rounded-xl border px-3 py-1.5 text-sm font-semibold cursor-pointer"
            style={{
              borderColor: "var(--accent-gold)",
              backgroundColor: "var(--accent-gold-soft)",
              color: "var(--accent-gold)",
            }}
          >
            {currentTranslation}
          </button>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() =>
              startAudioChapter({
                translationAbbr: currentTranslation,
                bookId: currentBook.id,
                bookName: currentBook.name,
                chapterNum,
                verses,
              })
            }
            disabled={verses.length === 0}
            title="Listen to chapter"
            className="inline-flex items-center gap-1.5 rounded-xl border px-2.5 py-1.5 text-xs font-medium hover:opacity-80 disabled:opacity-40 cursor-pointer"
            style={{ borderColor: "var(--border-subtle)", backgroundColor: "var(--bg-page)" }}
          >
            <Headphones className="h-3.5 w-3.5" style={{ color: "var(--accent-gold)" }} />
            <span className="hidden sm:inline">Listen</span>
          </button>

          <button
            onClick={() => setShowTypography(!showTypography)}
            title="Reading preferences"
            className="rounded-xl border p-2 hover:opacity-80 cursor-pointer"
            style={{ borderColor: "var(--border-subtle)", backgroundColor: "var(--bg-page)" }}
          >
            <SlidersHorizontal className="h-4 w-4" />
          </button>

          <button
            onClick={handlePrevChapter}
            aria-label="Previous chapter"
            className="rounded-xl border p-2 hover:opacity-80 cursor-pointer"
            style={{ borderColor: "var(--border-subtle)", backgroundColor: "var(--bg-page)" }}
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={handleNextChapter}
            aria-label="Next chapter"
            className="rounded-xl border p-2 hover:opacity-80 cursor-pointer"
            style={{ borderColor: "var(--border-subtle)", backgroundColor: "var(--bg-page)" }}
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Book & Chapter Selector Drawer */}
      {showBooks && (
        <div
          className="mb-6 rounded-2xl border p-4 shadow-lg"
          style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border-subtle)" }}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex gap-2">
              {(["OT", "NT"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setBookTab(t)}
                  className="rounded-lg px-3 py-1 text-xs font-semibold cursor-pointer"
                  style={
                    bookTab === t
                      ? { backgroundColor: "var(--accent-gold)", color: "#fff" }
                      : { backgroundColor: "var(--bg-elevated)" }
                  }
                >
                  {t === "OT" ? "Old Testament (39)" : "New Testament (27)"}
                </button>
              ))}
            </div>
            <button onClick={() => setShowBooks(false)} className="cursor-pointer">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-1.5 max-h-60 overflow-y-auto">
            {BIBLE_BOOKS.filter((b) => b.testament === bookTab).map((b) => (
              <button
                key={b.id}
                onClick={() => {
                  navigateChapter(b.id, 1);
                  setShowBooks(false);
                }}
                className="rounded-lg px-2.5 py-1.5 text-left text-xs font-medium hover:opacity-80 cursor-pointer"
                style={
                  b.id === currentBook.id
                    ? { backgroundColor: "var(--accent-gold-soft)", color: "var(--accent-gold)" }
                    : { backgroundColor: "var(--bg-elevated)" }
                }
              >
                {b.name}
              </button>
            ))}
          </div>
          <div className="mt-4 pt-3 border-t" style={{ borderColor: "var(--border-subtle)" }}>
            <p className="text-xs font-semibold mb-2">
              {currentBook.name} Chapters (1–{currentBook.chapterCount})
            </p>
            <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
              {Array.from({ length: currentBook.chapterCount }, (_, i) => i + 1).map(
                (ch) => (
                  <button
                    key={ch}
                    onClick={() => {
                      navigateChapter(currentBook.id, ch);
                      setShowBooks(false);
                    }}
                    className="h-8 w-9 rounded-lg text-xs font-semibold cursor-pointer"
                    style={
                      ch === chapterNum
                        ? { backgroundColor: "var(--accent-gold)", color: "#fff" }
                        : { backgroundColor: "var(--bg-elevated)" }
                    }
                  >
                    {ch}
                  </button>
                )
              )}
            </div>
          </div>
        </div>
      )}

      {/* Translation Selector Modal */}
      {showTranslations && (
        <div
          className="mb-6 rounded-2xl border p-4 shadow-lg"
          style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border-subtle)" }}
        >
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-bold">English Bible Translations (52)</h3>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                Active licensed translations can be switched instantly. Unlicensed translations show Coming Soon.
              </p>
            </div>
            <button onClick={() => setShowTranslations(false)} className="cursor-pointer">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="grid gap-2 sm:grid-cols-2 max-h-80 overflow-y-auto pr-1">
            {translations.map((t) => {
              const available = t.isActive && t.availabilityStatus === "available";
              return (
                <button
                  key={t.abbreviation}
                  onClick={() => {
                    if (!available) {
                      setSelectedUnavailable(t);
                      return;
                    }
                    setSelectedUnavailable(null);
                    setActiveTranslation(t.abbreviation);
                    navigateChapter(currentBook.id, chapterNum, t.abbreviation);
                    setShowTranslations(false);
                  }}
                  className={`flex items-center justify-between rounded-xl border p-2.5 text-left transition hover:opacity-90 cursor-pointer ${
                    !available ? "opacity-75" : ""
                  }`}
                  style={{
                    borderColor:
                      currentTranslation === t.abbreviation ||
                      selectedUnavailable?.abbreviation === t.abbreviation
                        ? "var(--accent-gold)"
                        : "var(--border-subtle)",
                    backgroundColor: "var(--bg-page)",
                  }}
                >
                  <div className="min-w-0 pr-2">
                    <div className="text-xs font-bold flex items-center gap-1.5">
                      <span>{t.abbreviation}</span>
                      {currentTranslation === t.abbreviation && (
                        <Check className="h-3.5 w-3.5" style={{ color: "var(--accent-gold)" }} />
                      )}
                    </div>
                    <div className="text-[11px] truncate" style={{ color: "var(--text-secondary)" }}>
                      {t.fullName}
                    </div>
                  </div>
                  {!available && (
                    <span className="shrink-0 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium bg-black/5 dark:bg-white/10">
                      <Lock className="h-2.5 w-2.5" />
                      {t.availabilityStatus === "coming_soon" ? "Coming Soon" : "Not Yet Licensed"}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {selectedUnavailable && (
            <div
              className="mt-3 rounded-xl border p-3.5 text-xs space-y-1.5"
              style={{
                borderColor: "var(--accent-gold)",
                backgroundColor: "var(--accent-gold-soft)",
              }}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold">
                  {selectedUnavailable.abbreviation} — {selectedUnavailable.fullName}
                </span>
                <button
                  onClick={() => setSelectedUnavailable(null)}
                  className="cursor-pointer"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
              {selectedUnavailable.publisher && (
                <p style={{ color: "var(--text-secondary)" }}>
                  Publisher: {selectedUnavailable.publisher}
                </p>
              )}
              {selectedUnavailable.copyrightInfo && (
                <p style={{ color: "var(--text-secondary)" }}>
                  {selectedUnavailable.copyrightInfo}
                </p>
              )}
              <p style={{ color: "var(--text-muted)" }}>
                Status:{" "}
                <strong className="uppercase">
                  {selectedUnavailable.availabilityStatus.replace(/_/g, " ")}
                </strong>{" "}
                — Scripture text is only displayed once an authorized publisher or API license is configured in{" "}
                <Link href="/admin" className="underline font-semibold">
                  Admin → Translations
                </Link>
                .
              </p>
            </div>
          )}
        </div>
      )}

      {/* Typography Customization Popover */}
      {showTypography && (
        <div
          className="mb-6 rounded-2xl border p-4 shadow-lg grid gap-4 sm:grid-cols-2 md:grid-cols-4"
          style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border-subtle)" }}
        >
          <div>
            <label className="text-xs font-semibold block mb-1.5">Theme</label>
            <div className="flex gap-1.5">
              {(["light", "sepia", "dark"] as const).map((th) => (
                <button
                  key={th}
                  onClick={() => updatePreferences({ theme: th })}
                  className="flex-1 rounded-lg border py-1 text-xs capitalize cursor-pointer"
                  style={
                    preferences.theme === th
                      ? { borderColor: "var(--accent-gold)", backgroundColor: "var(--accent-gold-soft)" }
                      : { borderColor: "var(--border-subtle)" }
                  }
                >
                  {th}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold block mb-1.5">
              Font Size ({preferences.fontSize}px)
            </label>
            <input
              type="range"
              min={14}
              max={28}
              value={preferences.fontSize}
              onChange={(e) => updatePreferences({ fontSize: Number(e.target.value) })}
              className="w-full"
            />
          </div>

          <div>
            <label className="text-xs font-semibold block mb-1.5">Font Family</label>
            <select
              value={preferences.fontFamily}
              onChange={(e) =>
                updatePreferences({
                  fontFamily: e.target.value as "serif" | "sans" | "georgia",
                })
              }
              className="w-full rounded-lg border px-2 py-1 text-xs"
              style={{ borderColor: "var(--border-subtle)", backgroundColor: "var(--bg-page)" }}
            >
              <option value="serif">Literata Serif</option>
              <option value="georgia">Georgia Classic</option>
              <option value="sans">Modern Sans</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold block mb-1.5">
              Line Spacing ({preferences.lineSpacing})
            </label>
            <input
              type="range"
              min={1.4}
              max={2.4}
              step={0.1}
              value={preferences.lineSpacing}
              onChange={(e) => updatePreferences({ lineSpacing: Number(e.target.value) })}
              className="w-full"
            />
          </div>
        </div>
      )}

      {/* Toast */}
      {copiedMsg && (
        <div
          className="fixed top-20 right-4 z-50 rounded-xl px-4 py-2 text-xs font-semibold text-white shadow-lg"
          style={{ backgroundColor: "var(--accent-gold)" }}
        >
          {copiedMsg}
        </div>
      )}

      {/* Chapter Content */}
      <article
        className="rounded-3xl border px-6 py-8 sm:px-10 sm:py-12 shadow-sm"
        style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border-subtle)" }}
      >
        <div className="mb-8 text-center">
          <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--accent-gold)" }}>
            {currentBook.testament === "OT" ? "Old Testament" : "New Testament"} · {currentTranslation}
          </p>
          <h1 className="mt-1 font-scripture-serif text-3xl sm:text-4xl font-bold">
            {currentBook.name} {chapterNum}
          </h1>
        </div>

        {loading ? (
          <div className="space-y-4 animate-pulse">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-5 rounded bg-black/5 dark:bg-white/5 w-full" />
            ))}
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-amber-300 bg-amber-50 dark:bg-amber-950/30 p-6 text-center text-sm">
            {error}
          </div>
        ) : (
          <div
            className={`${fontClass} space-y-2`}
            style={{
              fontSize: `${preferences.fontSize}px`,
              lineHeight: preferences.lineSpacing,
            }}
          >
            {verses.map((v) => {
              const isSelected = selectedVerse?.verseNum === v.verseNum;
              const isTarget = targetVerse === v.verseNum;
              const hlColor = highlights[v.verseNum];

              return (
                <p
                  key={v.verseNum}
                  onClick={() =>
                    setSelectedVerse(isSelected ? null : v)
                  }
                  style={{
                    marginBottom: `${preferences.verseSpacing}px`,
                    backgroundColor: hlColor
                      ? preferences.theme === "dark"
                        ? `${hlColor}33`
                        : hlColor
                      : isSelected || isTarget
                        ? "var(--accent-gold-soft)"
                        : undefined,
                  }}
                  className="rounded-lg px-2 py-1 transition cursor-pointer hover:bg-black/[0.03] dark:hover:bg-white/[0.03]"
                >
                  <sup
                    className="mr-1.5 text-xs font-sans font-bold select-none"
                    style={{ color: "var(--accent-gold)" }}
                  >
                    {v.verseNum}
                  </sup>
                  <span>{v.text}</span>
                </p>
              );
            })}
          </div>
        )}

        {copyrightInfo && (
          <p
            className="mt-10 border-t pt-4 text-center text-[11px]"
            style={{ borderColor: "var(--border-subtle)", color: "var(--text-muted)" }}
          >
            {copyrightInfo}
          </p>
        )}
      </article>

      {/* Bottom Chapter Navigation */}
      <div className="mt-6 flex items-center justify-between">
        <button
          onClick={handlePrevChapter}
          className="inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-medium hover:opacity-80 cursor-pointer"
          style={{ borderColor: "var(--border-subtle)", backgroundColor: "var(--bg-surface)" }}
        >
          <ChevronLeft className="h-4 w-4" />
          <span>Previous</span>
        </button>
        <button
          onClick={handleNextChapter}
          className="inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-medium hover:opacity-80 cursor-pointer"
          style={{ borderColor: "var(--border-subtle)", backgroundColor: "var(--bg-surface)" }}
        >
          <span>Next</span>
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Verse Contextual Action Bar */}
      {selectedVerse && (
        <div
          className="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 z-40 w-[calc(100vw-2rem)] max-w-2xl rounded-2xl border p-3 shadow-2xl backdrop-blur-md"
          style={{
            backgroundColor: "var(--bg-surface)",
            borderColor: "var(--border-subtle)",
          }}
        >
          <div className="flex items-center justify-between mb-2 px-1">
            <span className="text-xs font-bold" style={{ color: "var(--accent-gold)" }}>
              {currentBook.name} {chapterNum}:{selectedVerse.verseNum} ({currentTranslation})
            </span>
            <button onClick={() => setSelectedVerse(null)} className="cursor-pointer">
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {user && (
              <div className="flex items-center gap-1 mr-2 border-r pr-2" style={{ borderColor: "var(--border-subtle)" }}>
                <Highlighter className="h-3.5 w-3.5 mr-0.5" />
                {HIGHLIGHT_COLORS.map((c) => (
                  <button
                    key={c.name}
                    onClick={() => handleHighlight(c.hex)}
                    title={`Highlight ${c.name}`}
                    className="h-5 w-5 rounded-full border border-black/15 cursor-pointer"
                    style={{ backgroundColor: c.hex }}
                  />
                ))}
                {highlights[selectedVerse.verseNum] && (
                  <button
                    onClick={() => handleHighlight(null)}
                    className="text-[10px] underline ml-1 cursor-pointer"
                  >
                    Clear
                  </button>
                )}
              </div>
            )}

            <button
              onClick={handleBookmark}
              className="inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-medium hover:opacity-80 cursor-pointer"
              style={{ borderColor: "var(--border-subtle)" }}
            >
              <Bookmark className="h-3.5 w-3.5" />
              <span>Bookmark</span>
            </button>

            <button
              onClick={() => {
                if (!user) return router.push("/profile");
                setNoteTitle(`${currentBook.name} ${chapterNum}:${selectedVerse.verseNum}`);
                setNoteContent(`"${selectedVerse.text}"\n\nReflection:\n`);
                setNoteModalOpen(true);
              }}
              className="inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-medium hover:opacity-80 cursor-pointer"
              style={{ borderColor: "var(--border-subtle)" }}
            >
              <NotebookPen className="h-3.5 w-3.5" />
              <span>Add Note</span>
            </button>

            <button
              onClick={() => {
                navigator.clipboard.writeText(
                  `${currentBook.name} ${chapterNum}:${selectedVerse.verseNum} (${currentTranslation}) — "${selectedVerse.text}"`
                );
                setCopiedMsg("Verse copied!");
                setTimeout(() => setCopiedMsg(null), 2000);
              }}
              className="inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-medium hover:opacity-80 cursor-pointer"
              style={{ borderColor: "var(--border-subtle)" }}
            >
              <Copy className="h-3.5 w-3.5" />
              <span>Copy</span>
            </button>

            <button
              onClick={() => {
                const shareText = `${currentBook.name} ${chapterNum}:${selectedVerse.verseNum} (${currentTranslation}) — "${selectedVerse.text}"`;
                if (navigator.share) {
                  navigator.share({ text: shareText }).catch(() => {});
                } else {
                  navigator.clipboard.writeText(shareText);
                  setCopiedMsg("Copied to share!");
                  setTimeout(() => setCopiedMsg(null), 2000);
                }
              }}
              className="inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-medium hover:opacity-80 cursor-pointer"
              style={{ borderColor: "var(--border-subtle)" }}
            >
              <Share2 className="h-3.5 w-3.5" />
              <span>Share</span>
            </button>

            <button
              onClick={() =>
                startAudioChapter({
                  translationAbbr: currentTranslation,
                  bookId: currentBook.id,
                  bookName: currentBook.name,
                  chapterNum,
                  verses,
                  startVerseNum: selectedVerse.verseNum,
                })
              }
              className="inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-medium hover:opacity-80 cursor-pointer"
              style={{ borderColor: "var(--border-subtle)" }}
            >
              <Headphones className="h-3.5 w-3.5" />
              <span>Listen</span>
            </button>

            <button
              onClick={handleCompare}
              className="inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-medium hover:opacity-80 cursor-pointer"
              style={{ borderColor: "var(--border-subtle)" }}
            >
              <Columns2 className="h-3.5 w-3.5" />
              <span>Compare</span>
            </button>

            <button
              onClick={() =>
                openAiWithContext(
                  `${currentBook.name} ${chapterNum}:${selectedVerse.verseNum}`,
                  currentTranslation
                )
              }
              className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-white cursor-pointer"
              style={{ backgroundColor: "var(--accent-gold)" }}
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>Ask AI</span>
            </button>
          </div>
        </div>
      )}

      {/* Side-by-Side Translation Comparison Modal */}
      {compareOpen && selectedVerse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div
            className="w-full max-w-2xl max-h-[80vh] overflow-y-auto rounded-2xl border p-6 shadow-2xl"
            style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border-subtle)" }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold">
                Compare Translations — {currentBook.name} {chapterNum}:
                {selectedVerse.verseNum}
              </h3>
              <button onClick={() => setCompareOpen(false)} className="cursor-pointer">
                <X className="h-4 w-4" />
              </button>
            </div>
            {compareLoading ? (
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                Loading translations…
              </p>
            ) : (
              <div className="space-y-3">
                {compareResults.map((c) => (
                  <div
                    key={c.translation}
                    className="rounded-xl border p-3.5"
                    style={{ borderColor: "var(--border-subtle)", backgroundColor: "var(--bg-page)" }}
                  >
                    <div className="text-xs font-bold" style={{ color: "var(--accent-gold)" }}>
                      {c.translation} — {c.fullName}
                    </div>
                    <p className="mt-1.5 font-scripture-serif text-sm leading-relaxed">
                      {c.text}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Quick Note Modal */}
      {noteModalOpen && selectedVerse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <form
            onSubmit={handleSaveQuickNote}
            className="w-full max-w-lg rounded-2xl border p-6 shadow-2xl space-y-4"
            style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border-subtle)" }}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold">
                Add Note for {currentBook.name} {chapterNum}:{selectedVerse.verseNum}
              </h3>
              <button type="button" onClick={() => setNoteModalOpen(false)} className="cursor-pointer">
                <X className="h-4 w-4" />
              </button>
            </div>
            <input
              type="text"
              value={noteTitle}
              onChange={(e) => setNoteTitle(e.target.value)}
              placeholder="Note title"
              required
              className="w-full rounded-xl border px-3 py-2 text-sm"
              style={{ borderColor: "var(--border-subtle)", backgroundColor: "var(--bg-page)" }}
            />
            <textarea
              rows={6}
              value={noteContent}
              onChange={(e) => setNoteContent(e.target.value)}
              placeholder="Write your study note..."
              required
              className="w-full rounded-xl border px-3 py-2 text-sm"
              style={{ borderColor: "var(--border-subtle)", backgroundColor: "var(--bg-page)" }}
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setNoteModalOpen(false)}
                className="rounded-xl border px-4 py-2 text-xs font-medium cursor-pointer"
                style={{ borderColor: "var(--border-subtle)" }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={noteSaving}
                className="rounded-xl px-4 py-2 text-xs font-semibold text-white cursor-pointer"
                style={{ backgroundColor: "var(--accent-gold)" }}
              >
                {noteSaving ? "Saving..." : "Save in App"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

export default function BiblePage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-sm">Loading Bible reader…</div>}>
      <BibleReaderInner />
    </Suspense>
  );
}
