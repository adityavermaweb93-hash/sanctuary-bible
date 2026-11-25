"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Search as SearchIcon, BookOpen } from "lucide-react";
import { useApp } from "@/components/AppContext";

interface SearchResult {
  translationAbbr: string;
  bookId: number;
  bookName: string;
  chapterNum: number;
  verseNum: number;
  text: string;
}

export default function SearchPage() {
  const { translations, activeTranslation, trackEvent } = useApp();
  const [query, setQuery] = useState("");
  const [selectedTranslation, setSelectedTranslation] = useState(activeTranslation);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const activeList = translations.filter(
    (t) => t.isActive && t.availabilityStatus === "available"
  );

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setSearched(true);
    trackEvent({ eventType: "search", translationAbbr: selectedTranslation });

    try {
      const res = await fetch(
        `/api/bible/search?q=${encodeURIComponent(query.trim())}&translation=${encodeURIComponent(selectedTranslation)}`
      );
      const data = await res.json();
      setResults(data.results || []);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Search Scripture</h1>
        <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
          Search by Bible reference (e.g., “John 3:16”, “Psalm 23”, “Romans 8:28”) or keyword.
        </p>
      </div>

      <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-2.5">
        <div className="relative flex-1">
          <SearchIcon
            className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4"
            style={{ color: "var(--text-muted)" }}
          />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Enter reference or keyword (e.g. shepherd, John 3:16)..."
            className="w-full rounded-xl border pl-10 pr-4 py-2.5 text-sm outline-none"
            style={{
              backgroundColor: "var(--bg-surface)",
              borderColor: "var(--border-subtle)",
            }}
          />
        </div>

        <select
          value={selectedTranslation}
          onChange={(e) => setSelectedTranslation(e.target.value)}
          className="rounded-xl border px-3 py-2.5 text-sm outline-none"
          style={{
            backgroundColor: "var(--bg-surface)",
            borderColor: "var(--border-subtle)",
          }}
        >
          {(activeList.length > 0
            ? activeList
            : [{ abbreviation: "KJV" }, { abbreviation: "WEB" }, { abbreviation: "BSB" }]
          ).map((t) => (
            <option key={t.abbreviation} value={t.abbreviation}>
              {t.abbreviation}
            </option>
          ))}
        </select>

        <button
          type="submit"
          disabled={loading}
          className="rounded-xl px-5 py-2.5 text-sm font-semibold text-white cursor-pointer"
          style={{ backgroundColor: "var(--accent-gold)" }}
        >
          {loading ? "Searching..." : "Search"}
        </button>
      </form>

      {/* Quick Suggestions */}
      <div className="flex flex-wrap gap-2">
        {["John 3:16", "Psalm 23", "Romans 8:28", "Genesis 1", "shepherd", "love"].map(
          (chip) => (
            <button
              key={chip}
              onClick={() => setQuery(chip)}
              className="rounded-full border px-3 py-1 text-xs hover:opacity-80 cursor-pointer"
              style={{
                borderColor: "var(--border-subtle)",
                backgroundColor: "var(--bg-surface)",
              }}
            >
              {chip}
            </button>
          )
        )}
      </div>

      {/* Results */}
      <div className="space-y-3">
        {searched && !loading && results.length === 0 && (
          <div
            className="rounded-2xl border p-6 text-center text-sm"
            style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border-subtle)" }}
          >
            No matching passages found in {selectedTranslation}. Try a direct reference like “John 3:16” or read chapters to index them.
          </div>
        )}

        {results.map((r, idx) => (
          <Link
            key={`${r.bookId}-${r.chapterNum}-${r.verseNum}-${idx}`}
            href={`/bible?book=${r.bookId}&chapter=${r.chapterNum}&verse=${r.verseNum}&translation=${encodeURIComponent(r.translationAbbr)}`}
            className="block rounded-2xl border p-4 transition hover:shadow-sm"
            style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border-subtle)" }}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold flex items-center gap-1.5" style={{ color: "var(--accent-gold)" }}>
                <BookOpen className="h-3.5 w-3.5" />
                {r.bookName} {r.chapterNum}:{r.verseNum}
              </span>
              <span className="rounded-md px-2 py-0.5 text-[10px] font-semibold bg-black/5 dark:bg-white/10">
                {r.translationAbbr}
              </span>
            </div>
            <p className="mt-2 font-scripture-serif text-sm leading-relaxed">
              {r.text}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
