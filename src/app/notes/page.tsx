"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import {
  Plus,
  Search,
  Folder,
  Save,
  ImageDown,
  Share2,
  Trash2,
  CheckCircle2,
  NotebookPen,
} from "lucide-react";
import { useApp } from "@/components/AppContext";

interface NoteFolder {
  id: string;
  name: string;
  color: string;
}

interface UserNote {
  id: string;
  title: string;
  content: string;
  folderId: string | null;
  referenceLabel: string | null;
  translationAbbr: string | null;
  updatedAt: string;
}

export default function NotesPage() {
  const { user, branding, trackEvent } = useApp();
  const [notes, setNotes] = useState<UserNote[]>([]);
  const [folders, setFolders] = useState<NoteFolder[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [searchQ, setSearchQ] = useState("");

  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [referenceLabel, setReferenceLabel] = useState("");
  const [folderId, setFolderId] = useState<string>("");
  const [includeRefInExport, setIncludeRefInExport] = useState(true);
  const [includeDateInExport, setIncludeDateInExport] = useState(true);

  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [newFolderName, setNewFolderName] = useState("");
  const [previewDataUrl, setPreviewDataUrl] = useState<string | null>(null);
  const autosaveTimer = useRef<NodeJS.Timeout | null>(null);

  const loadData = useCallback(async () => {
    if (!user) return;
    const [nRes, fRes] = await Promise.all([
      fetch(
        `/api/notes?q=${encodeURIComponent(searchQ)}${selectedFolder ? `&folderId=${selectedFolder}` : ""}`
      ),
      fetch("/api/note-folders"),
    ]);
    const nData = await nRes.json();
    const fData = await fRes.json();
    if (Array.isArray(nData.notes)) setNotes(nData.notes);
    if (Array.isArray(fData.folders)) setFolders(fData.folders);
  }, [user, searchQ, selectedFolder]);

  useEffect(() => {
    const t = setTimeout(() => {
      void loadData();
    }, 0);
    return () => clearTimeout(t);
  }, [loadData]);

  // Protect against accidental loss of unsaved changes
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (dirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  const saveInApp = useCallback(
    async (silent = false) => {
      if (!user || !title.trim()) return;
      setSaving(true);
      try {
        if (activeNoteId) {
          const res = await fetch(`/api/notes/${activeNoteId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              title: title.trim(),
              content,
              folderId: folderId || null,
              referenceLabel: referenceLabel.trim() || null,
            }),
          });
          if (res.ok) {
            setDirty(false);
            if (!silent) {
              setSaveMessage("Saved to your account");
              setTimeout(() => setSaveMessage(null), 2500);
            }
            loadData();
          }
        } else {
          const res = await fetch("/api/notes", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              title: title.trim(),
              content,
              folderId: folderId || null,
              referenceLabel: referenceLabel.trim() || null,
            }),
          });
          const data = await res.json();
          if (res.ok && data.note) {
            setActiveNoteId(data.note.id);
            setDirty(false);
            trackEvent({ eventType: "note_created" });
            setSaveMessage("Note created & saved in app");
            setTimeout(() => setSaveMessage(null), 2500);
            loadData();
          }
        }
      } finally {
        setSaving(false);
      }
    },
    [user, title, content, folderId, referenceLabel, activeNoteId, loadData, trackEvent]
  );

  // Autosave after 2.5 seconds of inactivity for existing notes
  useEffect(() => {
    if (!dirty || !activeNoteId || !title.trim()) return;
    if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    autosaveTimer.current = setTimeout(() => {
      saveInApp(true);
    }, 2500);
    return () => {
      if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    };
  }, [dirty, activeNoteId, title, content, referenceLabel, folderId, saveInApp]);

  function selectNote(n: UserNote) {
    setActiveNoteId(n.id);
    setTitle(n.title);
    setContent(n.content);
    setReferenceLabel(n.referenceLabel || "");
    setFolderId(n.folderId || "");
    setDirty(false);
    setPreviewDataUrl(null);
  }

  function startNewNote() {
    setActiveNoteId(null);
    setTitle("");
    setContent("");
    setReferenceLabel("");
    setFolderId(selectedFolder || "");
    setDirty(false);
    setPreviewDataUrl(null);
  }

  async function deleteNote(id: string) {
    await fetch(`/api/notes/${id}`, { method: "DELETE" });
    if (activeNoteId === id) startNewNote();
    loadData();
  }

  async function createFolder(e: React.FormEvent) {
    e.preventDefault();
    if (!newFolderName.trim()) return;
    await fetch("/api/note-folders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newFolderName.trim() }),
    });
    setNewFolderName("");
    loadData();
  }

  /**
   * OPTION B: Render high-resolution PNG card of the note for device gallery export.
   */
  function generateNoteImage(): string {
    const canvas = document.createElement("canvas");
    canvas.width = 1080;
    canvas.height = 1350;
    const ctx = canvas.getContext("2d")!;

    // Warm cream background
    ctx.fillStyle = "#faf8f3";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Subtle double gold border
    ctx.strokeStyle = "#b4833e";
    ctx.lineWidth = 4;
    ctx.strokeRect(48, 48, canvas.width - 96, canvas.height - 96);
    ctx.lineWidth = 1;
    ctx.strokeRect(60, 60, canvas.width - 120, canvas.height - 120);

    // Header Branding
    ctx.fillStyle = "#b4833e";
    ctx.font = "bold 24px sans-serif";
    ctx.fillText(branding.appName.toUpperCase(), 100, 130);

    if (includeDateInExport) {
      ctx.fillStyle = "#718096";
      ctx.font = "22px sans-serif";
      const dateStr = new Date().toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
      ctx.fillText(dateStr, 100, 168);
    }

    // Note Title
    ctx.fillStyle = "#1b263b";
    ctx.font = "bold 46px Georgia, serif";
    const wrappedTitle = wrapText(ctx, title || "Bible Study Note", 880);
    let y = 250;
    for (const line of wrappedTitle.slice(0, 3)) {
      ctx.fillText(line, 100, y);
      y += 58;
    }

    // Optional Bible Reference badge
    if (includeRefInExport && referenceLabel.trim()) {
      y += 14;
      ctx.fillStyle = "#b4833e";
      ctx.font = "bold 28px sans-serif";
      ctx.fillText(referenceLabel.trim(), 100, y);
      y += 45;
    } else {
      y += 20;
    }

    // Divider
    ctx.strokeStyle = "#e7e1d4";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(100, y);
    ctx.lineTo(980, y);
    ctx.stroke();
    y += 56;

    // Note Body
    ctx.fillStyle = "#2d3748";
    ctx.font = "30px Georgia, serif";
    const paragraphs = (content || "").split("\n");
    for (const p of paragraphs) {
      const lines = wrapText(ctx, p || " ", 880);
      for (const line of lines) {
        if (y > 1180) break;
        ctx.fillText(line, 100, y);
        y += 46;
      }
      y += 12;
      if (y > 1180) break;
    }

    // Footer
    ctx.fillStyle = "#718096";
    ctx.font = "20px sans-serif";
    ctx.fillText(`Study Note · ${branding.appName}`, 100, 1255);

    const dataUrl = canvas.toDataURL("image/png");
    setPreviewDataUrl(dataUrl);
    return dataUrl;
  }

  async function handleDownloadImage() {
    const url = previewDataUrl || generateNoteImage();
    const link = document.createElement("a");
    link.download = `${(title || "bible-note").toLowerCase().replace(/[^a-z0-9]+/g, "-")}.png`;
    link.href = url;
    link.click();
  }

  async function handleShareImageToGallery() {
    const url = previewDataUrl || generateNoteImage();
    const blob = await (await fetch(url)).blob();
    const file = new File([blob], "sanctuary-bible-note.png", { type: "image/png" });

    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({
        title: title || "Bible Study Note",
        files: [file],
      });
    } else {
      handleDownloadImage();
    }
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center space-y-4">
        <NotebookPen className="h-12 w-12 mx-auto" style={{ color: "var(--accent-gold)" }} />
        <h1 className="text-2xl font-bold">Personal Bible Notes</h1>
        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
          Sign in to create, organize, sync, and export your personal Bible study notes as images.
        </p>
        <Link
          href="/profile"
          className="inline-block rounded-xl px-6 py-2.5 text-sm font-semibold text-white"
          style={{ backgroundColor: "var(--accent-gold)" }}
        >
          Sign In to Open Notes
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-6">
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Left Sidebar: Folders & Notes List */}
        <aside className="lg:col-span-4 space-y-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold">My Notes</h1>
            <button
              onClick={startNewNote}
              className="inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold text-white cursor-pointer"
              style={{ backgroundColor: "var(--accent-gold)" }}
            >
              <Plus className="h-3.5 w-3.5" />
              New Note
            </button>
          </div>

          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5"
              style={{ color: "var(--text-muted)" }}
            />
            <input
              type="text"
              value={searchQ}
              onChange={(e) => setSearchQ(e.target.value)}
              placeholder="Search notes..."
              className="w-full rounded-xl border pl-9 pr-3 py-2 text-xs outline-none"
              style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border-subtle)" }}
            />
          </div>

          {/* Folders */}
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => setSelectedFolder(null)}
              className="rounded-lg px-2.5 py-1 text-xs font-medium cursor-pointer"
              style={
                selectedFolder === null
                  ? { backgroundColor: "var(--accent-gold-soft)", color: "var(--accent-gold)" }
                  : { backgroundColor: "var(--bg-surface)" }
              }
            >
              All Notes
            </button>
            {folders.map((f) => (
              <button
                key={f.id}
                onClick={() => setSelectedFolder(f.id)}
                className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium cursor-pointer"
                style={
                  selectedFolder === f.id
                    ? { backgroundColor: "var(--accent-gold-soft)", color: "var(--accent-gold)" }
                    : { backgroundColor: "var(--bg-surface)" }
                }
              >
                <Folder className="h-3 w-3" />
                {f.name}
              </button>
            ))}
          </div>

          <form onSubmit={createFolder} className="flex gap-1.5">
            <input
              type="text"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder="New folder name..."
              className="flex-1 rounded-lg border px-2.5 py-1 text-xs"
              style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border-subtle)" }}
            />
            <button
              type="submit"
              className="rounded-lg border px-2.5 py-1 text-xs font-medium cursor-pointer"
              style={{ borderColor: "var(--border-subtle)" }}
            >
              Add
            </button>
          </form>

          {/* Note List */}
          <div className="space-y-2 max-h-[55vh] overflow-y-auto pr-1">
            {notes.length === 0 ? (
              <p className="text-xs p-4 text-center" style={{ color: "var(--text-muted)" }}>
                No notes found. Click “New Note” to start writing.
              </p>
            ) : (
              notes.map((n) => (
                <div
                  key={n.id}
                  onClick={() => selectNote(n)}
                  className="rounded-xl border p-3 cursor-pointer transition"
                  style={{
                    backgroundColor: "var(--bg-surface)",
                    borderColor:
                      activeNoteId === n.id
                        ? "var(--accent-gold)"
                        : "var(--border-subtle)",
                  }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-sm font-semibold truncate">{n.title}</h3>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteNote(n.id);
                      }}
                      aria-label="Delete note"
                      className="text-red-500/70 hover:text-red-600 cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  {n.referenceLabel && (
                    <span className="text-[11px] font-medium" style={{ color: "var(--accent-gold)" }}>
                      {n.referenceLabel}
                    </span>
                  )}
                  <p className="mt-1 text-xs line-clamp-2" style={{ color: "var(--text-muted)" }}>
                    {n.content}
                  </p>
                </div>
              ))
            )}
          </div>
        </aside>

        {/* Right Editor & Dual Save Options */}
        <section
          className="lg:col-span-8 rounded-2xl border p-6 space-y-4"
          style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border-subtle)" }}
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>
              {saving
                ? "Saving..."
                : dirty
                  ? "Unsaved changes"
                  : saveMessage ? (
                    <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      {saveMessage}
                    </span>
                  ) : activeNoteId ? (
                    "Synced to account"
                  ) : (
                    "New Note"
                  )}
            </span>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => saveInApp(false)}
                disabled={saving || !title.trim()}
                className="inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold text-white disabled:opacity-40 cursor-pointer"
                style={{ backgroundColor: "var(--accent-gold)" }}
              >
                <Save className="h-3.5 w-3.5" />
                Save in App
              </button>

              <button
                onClick={handleDownloadImage}
                disabled={!title.trim() && !content.trim()}
                className="inline-flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-semibold disabled:opacity-40 cursor-pointer"
                style={{ borderColor: "var(--border-subtle)", backgroundColor: "var(--bg-page)" }}
              >
                <ImageDown className="h-3.5 w-3.5" />
                Save to Gallery (PNG)
              </button>

              <button
                onClick={handleShareImageToGallery}
                disabled={!title.trim() && !content.trim()}
                className="inline-flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-semibold disabled:opacity-40 cursor-pointer"
                style={{ borderColor: "var(--border-subtle)", backgroundColor: "var(--bg-page)" }}
              >
                <Share2 className="h-3.5 w-3.5" />
                Share Image
              </button>
            </div>
          </div>

          <input
            type="text"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              setDirty(true);
            }}
            placeholder="Note title..."
            className="w-full rounded-xl border px-4 py-2.5 text-lg font-bold outline-none"
            style={{ backgroundColor: "var(--bg-page)", borderColor: "var(--border-subtle)" }}
          />

          <div className="grid gap-3 sm:grid-cols-2">
            <input
              type="text"
              value={referenceLabel}
              onChange={(e) => {
                setReferenceLabel(e.target.value);
                setDirty(true);
              }}
              placeholder="Bible Reference (e.g. John 3:16)"
              className="rounded-xl border px-3 py-2 text-xs outline-none"
              style={{ backgroundColor: "var(--bg-page)", borderColor: "var(--border-subtle)" }}
            />
            <select
              value={folderId}
              onChange={(e) => {
                setFolderId(e.target.value);
                setDirty(true);
              }}
              className="rounded-xl border px-3 py-2 text-xs outline-none"
              style={{ backgroundColor: "var(--bg-page)", borderColor: "var(--border-subtle)" }}
            >
              <option value="">No Folder</option>
              {folders.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>
          </div>

          <textarea
            rows={12}
            value={content}
            onChange={(e) => {
              setContent(e.target.value);
              setDirty(true);
            }}
            placeholder="Write your study reflections, sermon notes, or prayers..."
            className="w-full rounded-xl border p-4 font-scripture-serif text-base leading-relaxed outline-none"
            style={{ backgroundColor: "var(--bg-page)", borderColor: "var(--border-subtle)" }}
          />

          <div className="flex flex-wrap items-center gap-4 text-xs" style={{ color: "var(--text-secondary)" }}>
            <label className="inline-flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={includeRefInExport}
                onChange={(e) => setIncludeRefInExport(e.target.checked)}
              />
              Include Bible reference in image export
            </label>
            <label className="inline-flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={includeDateInExport}
                onChange={(e) => setIncludeDateInExport(e.target.checked)}
              />
              Include date in image export
            </label>
          </div>

          {previewDataUrl && (
            <div className="pt-4 border-t" style={{ borderColor: "var(--border-subtle)" }}>
              <p className="text-xs font-semibold mb-2">Exported Gallery Card Preview</p>
              <img
                src={previewDataUrl}
                alt="Exported Bible Note Card"
                className="max-h-80 rounded-xl border shadow-md"
              />
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let current = "";
  for (const w of words) {
    const test = current ? `${current} ${w}` : w;
    if (ctx.measureText(test).width > maxWidth && current) {
      lines.push(current);
      current = w;
    } else {
      current = test;
    }
  }
  if (current) lines.push(current);
  return lines;
}
