"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { X, Music2, MapPin } from "lucide-react";

const SEEN_KEY = "sanctuary_jam_room_seen";
const BOOK_OPENED_KEY = "sanctuary_book_opened";
const BOOK_OPENED_EVENT = "sanctuary-book-opened";

export function JamRoomLaunchModal() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      if (sessionStorage.getItem(SEEN_KEY) === "1") return;
      if (sessionStorage.getItem(BOOK_OPENED_KEY) === "1") {
        const timer = setTimeout(() => setOpen(true), 350);
        return () => clearTimeout(timer);
      }
    } catch {
      return;
    }

    const onBookOpened = () => {
      try {
        if (sessionStorage.getItem(SEEN_KEY) === "1") return;
      } catch {
        // ignore
      }
      setTimeout(() => setOpen(true), 350);
    };

    window.addEventListener(BOOK_OPENED_EVENT, onBookOpened);
    return () => window.removeEventListener(BOOK_OPENED_EVENT, onBookOpened);
  }, []);

  const handleClose = () => {
    setOpen(false);
    try {
      sessionStorage.setItem(SEEN_KEY, "1");
    } catch {
      // ignore
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[65] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="jam-room-title"
      onClick={handleClose}
    >
      <div
        className="relative w-full max-w-md overflow-hidden rounded-2xl border shadow-2xl"
        style={{
          backgroundColor: "var(--bg-surface)",
          borderColor: "var(--border-subtle)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top bar */}
        <div
          className="flex items-center justify-between border-b px-4 py-2.5"
          style={{ borderColor: "var(--border-subtle)" }}
        >
          <div className="flex items-center gap-2">
            <span
              className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide"
              style={{
                backgroundColor: "var(--accent-gold-soft)",
                color: "var(--accent-gold)",
              }}
            >
              <Music2 className="h-3 w-3" />
              Newly Launched
            </span>
            <h2 id="jam-room-title" className="text-sm font-semibold truncate">
              The Jam Room by UD Sounds
            </h2>
          </div>
          <button
            type="button"
            onClick={handleClose}
            aria-label="Close announcement"
            className="rounded-lg p-1.5 hover:opacity-75 cursor-pointer"
            style={{ color: "var(--text-muted)" }}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Flyer Image */}
        <div className="relative w-full bg-[#0d1321]">
          <Image
            src="/images/jam-room-launch.jpg"
            alt="The Jam Room by UD Sounds — Rehearse, Record, Perform at The Courtyard, Kuda Village"
            width={1080}
            height={1200}
            className="w-full max-h-[62vh] object-contain"
            priority
          />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-1.5 text-xs min-w-0" style={{ color: "var(--text-secondary)" }}>
            <MapPin className="h-3.5 w-3.5 shrink-0" style={{ color: "var(--accent-gold)" }} />
            <span className="truncate">The Courtyard, Kuda Village</span>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="shrink-0 rounded-xl px-4 py-2 text-xs font-semibold text-white transition hover:opacity-90 cursor-pointer"
            style={{ backgroundColor: "var(--accent-gold)" }}
          >
            Continue to Bible
          </button>
        </div>
      </div>
    </div>
  );
}
