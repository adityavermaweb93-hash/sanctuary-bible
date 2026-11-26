"use client";

import React, { useState, useSyncExternalStore } from "react";
import { BookOpen } from "lucide-react";
import { useApp } from "./AppContext";

const SESSION_KEY = "sanctuary_book_opened";
const OPENED_EVENT = "sanctuary-book-opened";

function subscribeBookOpened(callback: () => void) {
  window.addEventListener(OPENED_EVENT, callback);
  return () => window.removeEventListener(OPENED_EVENT, callback);
}

function getBookVisibleSnapshot() {
  try {
    return sessionStorage.getItem(SESSION_KEY) !== "1";
  } catch {
    return true;
  }
}

function getServerBookVisibleSnapshot() {
  return true;
}

export function BibleCoverSplash() {
  const { branding } = useApp();
  const visible = useSyncExternalStore(
    subscribeBookOpened,
    getBookVisibleSnapshot,
    getServerBookVisibleSnapshot
  );
  const [opening, setOpening] = useState(false);

  if (!visible) return null;

  const handleOpen = () => {
    if (opening) return;
    setOpening(true);
    setTimeout(() => {
      try {
        sessionStorage.setItem(SESSION_KEY, "1");
      } catch {
        // Ignore storage errors
      }
      window.dispatchEvent(new Event(OPENED_EVENT));
    }, 650);
  };

  return (
    <div
      className={`fixed inset-0 z-[70] flex flex-col items-center justify-center px-6 py-10 transition-opacity duration-500 ${
        opening ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
      style={{
        background:
          "radial-gradient(circle at 50% 35%, #23314d 0%, #121a2b 65%, #090d16 100%)",
      }}
    >
      {/* Interactive 3D Bible Book */}
      <button
        type="button"
        onClick={handleOpen}
        aria-label="Open the Holy Bible"
        className="group relative cursor-pointer focus:outline-none"
        style={{ perspective: "1400px" }}
      >
        {/* Soft ambient glow */}
        <div
          className="absolute -inset-6 rounded-3xl opacity-40 blur-2xl transition-opacity duration-500 group-hover:opacity-65"
          style={{ backgroundColor: "#b4833e" }}
        />

        {/* Book Body + Cream Page Edges */}
        <div className="relative flex items-stretch">
          {/* Spine shadow & ridges */}
          <div
            className="relative z-20 flex h-[390px] w-[275px] sm:h-[440px] sm:w-[310px] flex-col items-center justify-between rounded-r-xl rounded-l-sm border-2 px-7 py-9 text-center shadow-2xl transition-transform duration-700 ease-in-out origin-left"
            style={{
              background:
                "linear-gradient(135deg, #273452 0%, #172136 55%, #101726 100%)",
              borderColor: "#b4833e",
              boxShadow:
                "inset 12px 0 22px rgba(0,0,0,0.45), 0 25px 50px -12px rgba(0,0,0,0.75)",
              transform: opening ? "rotateY(-82deg) scale(0.98)" : "rotateY(0deg)",
            }}
          >
            {/* Spine crease line */}
            <div
              className="pointer-events-none absolute inset-y-0 left-3 w-px opacity-50"
              style={{ backgroundColor: "#b4833e" }}
            />

            {/* Inner Gold Foil Frame */}
            <div
              className="pointer-events-none absolute inset-3.5 rounded-r-lg rounded-l-xs border opacity-45"
              style={{ borderColor: "#d4a359" }}
            />

            {/* Top Emblem */}
            <div className="relative z-10 flex flex-col items-center gap-2 pt-2">
              <div
                className="flex h-11 w-11 items-center justify-center rounded-full border"
                style={{
                  borderColor: "rgba(212, 163, 89, 0.55)",
                  backgroundColor: "rgba(212, 163, 89, 0.1)",
                }}
              >
                <BookOpen className="h-5 w-5" style={{ color: "#e6c385" }} />
              </div>
              <span
                className="text-[10px] font-semibold uppercase tracking-[0.28em]"
                style={{ color: "#d4a359" }}
              >
                Sacred Scripture
              </span>
            </div>

            {/* Center Gold-Embossed Title */}
            <div className="relative z-10 space-y-3">
              <div
                className="mx-auto h-px w-16 opacity-60"
                style={{ backgroundColor: "#d4a359" }}
              />
              <h1
                className="font-serif text-3xl sm:text-4xl font-semibold tracking-wide leading-tight"
                style={{
                  color: "#f3d89c",
                  textShadow: "0 2px 10px rgba(0,0,0,0.55)",
                }}
              >
                THE HOLY
                <br />
                BIBLE
              </h1>
              <div
                className="mx-auto h-px w-16 opacity-60"
                style={{ backgroundColor: "#d4a359" }}
              />
              <p
                className="text-xs tracking-[0.18em] uppercase pt-1"
                style={{ color: "#cbd5e1" }}
              >
                {branding.appName}
              </p>
            </div>

            {/* Bottom Verse & Tap Prompt */}
            <div className="relative z-10 space-y-3 pb-1">
              <p
                className="font-serif text-xs italic leading-relaxed"
                style={{ color: "#d4dce8" }}
              >
                &ldquo;Thy word is a lamp unto my feet, and a light unto my path.&rdquo;
              </p>
              <span
                className="inline-flex items-center gap-1.5 rounded-full border px-4 py-1.5 text-xs font-semibold tracking-wide transition-transform duration-300 group-hover:scale-105"
                style={{
                  borderColor: "#d4a359",
                  backgroundColor: "rgba(180, 131, 62, 0.2)",
                  color: "#f3d89c",
                }}
              >
                Tap to Open Bible
              </span>
            </div>
          </div>

          {/* Layered Cream Page Edges (right side of closed book) */}
          <div
            className="my-2 w-3.5 rounded-r-md border-y border-r shadow-inner"
            style={{
              background:
                "repeating-linear-gradient(90deg, #efe6d2 0px, #efe6d2 2px, #dfd2b5 2px, #dfd2b5 4px)",
              borderColor: "#c5b593",
            }}
          />

          {/* Gold Ribbon Bookmark */}
          <div
            className="pointer-events-none absolute -bottom-5 left-14 z-10 h-8 w-4 rounded-b-sm shadow-md"
            style={{
              backgroundColor: "#b4833e",
              clipPath: "polygon(0 0, 100% 0, 100% 100%, 50% 72%, 0 100%)",
            }}
          />
        </div>
      </button>
    </div>
  );
}
