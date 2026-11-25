"use client";

import React, { useEffect, useState } from "react";
import { Headphones, Play, Clock } from "lucide-react";
import { useApp } from "@/components/AppContext";
import { BIBLE_BOOKS } from "@/lib/bible/books";

export default function AudioPage() {
  const { user, translations, activeTranslation, startAudioChapter } = useApp();
  const [selectedTrans, setSelectedTrans] = useState(
    ["KJV", "WEB", "BSB"].includes(activeTranslation) ? activeTranslation : "KJV"
  );
  const [selectedBook, setSelectedBook] = useState(43);
  const [selectedChapter, setSelectedChapter] = useState(3);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<
    Array<{ id: string; bookId: number; bookName: string; chapterNum: number; translationAbbr: string; playedAt: string }>
  >([]);

  const audioTranslations = translations.filter((t) => t.isActive && t.audioAvailable);
  const bookMeta = BIBLE_BOOKS.find((b) => b.id === selectedBook) || BIBLE_BOOKS[42];

  useEffect(() => {
    if (user) {
      fetch("/api/audio/history")
        .then((r) => r.json())
        .then((d) => Array.isArray(d.history) && setHistory(d.history))
        .catch(() => {});
    }
  }, [user]);

  async function playSelected(bookId = selectedBook, chapter = selectedChapter, trans = selectedTrans) {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/bible/chapter?translation=${encodeURIComponent(trans)}&bookId=${bookId}&chapter=${chapter}`
      );
      const data = await res.json();
      if (res.ok && data.verses) {
        const b = BIBLE_BOOKS.find((item) => item.id === bookId)!;
        await startAudioChapter({
          translationAbbr: trans,
          bookId,
          bookName: b.name,
          chapterNum: chapter,
          verses: data.verses,
        });
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Headphones className="h-6 w-6" style={{ color: "var(--accent-gold)" }} />
          Bible Audio Player
        </h1>
        <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
          Listen to entire chapters or individual verses using licensed audio sources and permitted public-domain translations.
        </p>
      </div>

      {/* Quick Chapter Player Card */}
      <div
        className="rounded-2xl border p-6 space-y-4"
        style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border-subtle)" }}
      >
        <h2 className="text-sm font-bold uppercase tracking-wider" style={{ color: "var(--accent-gold)" }}>
          Start Listening
        </h2>
        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <label className="text-xs font-medium block mb-1">Translation</label>
            <select
              value={selectedTrans}
              onChange={(e) => setSelectedTrans(e.target.value)}
              className="w-full rounded-xl border px-3 py-2 text-sm"
              style={{ backgroundColor: "var(--bg-page)", borderColor: "var(--border-subtle)" }}
            >
              {(audioTranslations.length > 0
                ? audioTranslations
                : [
                    { abbreviation: "KJV", fullName: "King James Version" },
                    { abbreviation: "WEB", fullName: "World English Bible" },
                    { abbreviation: "BSB", fullName: "Berean Standard Bible" },
                  ]
              ).map((t) => (
                <option key={t.abbreviation} value={t.abbreviation}>
                  {t.abbreviation} — {t.fullName}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-medium block mb-1">Book</label>
            <select
              value={selectedBook}
              onChange={(e) => {
                setSelectedBook(Number(e.target.value));
                setSelectedChapter(1);
              }}
              className="w-full rounded-xl border px-3 py-2 text-sm"
              style={{ backgroundColor: "var(--bg-page)", borderColor: "var(--border-subtle)" }}
            >
              {BIBLE_BOOKS.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-medium block mb-1">Chapter</label>
            <select
              value={selectedChapter}
              onChange={(e) => setSelectedChapter(Number(e.target.value))}
              className="w-full rounded-xl border px-3 py-2 text-sm"
              style={{ backgroundColor: "var(--bg-page)", borderColor: "var(--border-subtle)" }}
            >
              {Array.from({ length: bookMeta.chapterCount }, (_, i) => i + 1).map((ch) => (
                <option key={ch} value={ch}>
                  Chapter {ch}
                </option>
              ))}
            </select>
          </div>
        </div>

        <button
          onClick={() => playSelected()}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white cursor-pointer"
          style={{ backgroundColor: "var(--accent-gold)" }}
        >
          <Play className="h-4 w-4" />
          <span>{loading ? "Loading Audio..." : `Play ${bookMeta.name} ${selectedChapter}`}</span>
        </button>
      </div>

      {/* Audio History */}
      <div
        className="rounded-2xl border p-6 space-y-3"
        style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border-subtle)" }}
      >
        <h2 className="text-sm font-bold flex items-center gap-2">
          <Clock className="h-4 w-4" style={{ color: "var(--accent-gold)" }} />
          Recently Played Audio
        </h2>
        {!user ? (
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            Sign in to save your listening history and resume where you left off.
          </p>
        ) : history.length === 0 ? (
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            No audio played yet.
          </p>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2">
            {history.map((h) => (
              <button
                key={h.id}
                onClick={() => playSelected(h.bookId, h.chapterNum, h.translationAbbr)}
                className="flex items-center justify-between rounded-xl border px-3.5 py-2.5 text-left text-xs hover:opacity-80 cursor-pointer"
                style={{ borderColor: "var(--border-subtle)", backgroundColor: "var(--bg-page)" }}
              >
                <span className="font-semibold">
                  {h.bookName} {h.chapterNum} ({h.translationAbbr})
                </span>
                <Play className="h-3.5 w-3.5" style={{ color: "var(--accent-gold)" }} />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
