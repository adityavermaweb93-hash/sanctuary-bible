"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Sparkles,
  X,
  Send,
  BookOpen,
  History,
  Plus,
  AlertCircle,
} from "lucide-react";
import { useApp } from "./AppContext";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

const QUICK_PROMPTS = [
  "Explain this verse.",
  "Explain the historical context.",
  "What does this teach us?",
  "Find related Bible verses.",
  "Compare translations.",
];

export function AiAssistantDrawer() {
  const {
    user,
    aiOpen,
    setAiOpen,
    aiContextRef,
    aiContextTranslation,
    trackEvent,
  } = useApp();

  const [messages, setMessages] = useState<Message[]>([]);
  const [conversationId, setConversationId] = useState<string | undefined>();
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [conversations, setConversations] = useState<
    Array<{ id: string; title: string; contextRef: string | null; messages: Message[] }>
  >([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (aiOpen && user && showHistory) {
      fetch("/api/ai/conversations")
        .then((r) => r.json())
        .then((d) => {
          if (Array.isArray(d.conversations)) setConversations(d.conversations);
        })
        .catch(() => {});
    }
  }, [aiOpen, user, showHistory]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  async function sendMessage(text: string) {
    const trimmed = text.trim();
    if (!trimmed || loading) return;
    setError(null);
    setInput("");
    setMessages((prev) => [
      ...prev,
      { id: `local-${Date.now()}`, role: "user", content: trimmed },
    ]);
    setLoading(true);
    trackEvent({ eventType: "ai_question" });

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId,
          message: trimmed,
          contextRef: aiContextRef || undefined,
          translationAbbr: aiContextTranslation || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Unable to get a response.");
        return;
      }
      setConversationId(data.conversationId);
      setMessages((prev) => [...prev, data.message]);
    } catch {
      setError("Network error while contacting the AI Bible Assistant.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* Floating AI Button in bottom-right above mobile bottom nav */}
      <button
        onClick={() => setAiOpen(!aiOpen)}
        aria-label="Open AI Bible Study Assistant"
        className="fixed right-4 bottom-20 md:bottom-6 z-40 flex h-13 w-13 items-center justify-center rounded-full shadow-lg transition-transform hover:scale-105 active:scale-95 cursor-pointer"
        style={{
          backgroundColor: "var(--accent-gold)",
          color: "#ffffff",
        }}
      >
        {aiOpen ? <X className="h-5 w-5" /> : <Sparkles className="h-5 w-5" />}
      </button>

      {/* Chat Drawer */}
      {aiOpen && (
        <div
          className="fixed right-4 bottom-36 md:bottom-22 z-50 flex h-[520px] max-h-[75vh] w-[calc(100vw-2rem)] max-w-md flex-col overflow-hidden rounded-2xl border shadow-2xl"
          style={{
            backgroundColor: "var(--bg-surface)",
            borderColor: "var(--border-subtle)",
          }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between border-b px-4 py-3"
            style={{ borderColor: "var(--border-subtle)" }}
          >
            <div className="flex items-center gap-2.5">
              <div
                className="flex h-8 w-8 items-center justify-center rounded-full"
                style={{ backgroundColor: "var(--accent-gold-soft)", color: "var(--accent-gold)" }}
              >
                <BookOpen className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-semibold">AI Bible Study Assistant</h3>
                <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                  {aiContextRef ? `Context: ${aiContextRef}` : "Strictly Scripture-focused"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {user && (
                <>
                  <button
                    onClick={() => {
                      setConversationId(undefined);
                      setMessages([]);
                      setError(null);
                      setShowHistory(false);
                    }}
                    title="New conversation"
                    className="rounded-lg p-1.5 hover:opacity-75 cursor-pointer"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setShowHistory(!showHistory)}
                    title="Conversation history"
                    className="rounded-lg p-1.5 hover:opacity-75 cursor-pointer"
                  >
                    <History className="h-4 w-4" />
                  </button>
                </>
              )}
              <button
                onClick={() => setAiOpen(false)}
                className="rounded-lg p-1.5 hover:opacity-75 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Body */}
          {showHistory ? (
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              <p className="text-xs font-medium px-1" style={{ color: "var(--text-muted)" }}>
                Past Study Conversations
              </p>
              {conversations.length === 0 ? (
                <p className="text-xs p-3 text-center" style={{ color: "var(--text-muted)" }}>
                  No saved conversations yet.
                </p>
              ) : (
                conversations.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => {
                      setConversationId(c.id);
                      setMessages(c.messages);
                      setShowHistory(false);
                    }}
                    className="w-full text-left rounded-xl border p-2.5 text-xs hover:opacity-80 cursor-pointer"
                    style={{ borderColor: "var(--border-subtle)" }}
                  >
                    <div className="font-medium truncate">{c.title}</div>
                    {c.contextRef && (
                      <div className="text-[11px] mt-0.5" style={{ color: "var(--accent-gold)" }}>
                        {c.contextRef}
                      </div>
                    )}
                  </button>
                ))
              )}
            </div>
          ) : (
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
              {!user && (
                <div
                  className="rounded-xl border p-3 text-xs flex items-start gap-2"
                  style={{
                    borderColor: "var(--border-subtle)",
                    backgroundColor: "var(--bg-elevated)",
                  }}
                >
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" style={{ color: "var(--accent-gold)" }} />
                  <div>
                    Please <a href="/profile" className="underline font-medium">sign in</a> to ask the AI Bible Study Assistant questions and save your study conversations.
                  </div>
                </div>
              )}

              {messages.length === 0 && (
                <div className="space-y-3">
                  <p className="text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                    Ask about verse meanings, chapter explanations, biblical history, characters, parables, prophecies, or Christian teachings.
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {QUICK_PROMPTS.map((q) => (
                      <button
                        key={q}
                        onClick={() => sendMessage(aiContextRef ? `${q} (${aiContextRef})` : q)}
                        className="rounded-full border px-2.5 py-1 text-[11px] font-medium transition hover:opacity-80 cursor-pointer"
                        style={{
                          borderColor: "var(--border-subtle)",
                          backgroundColor: "var(--bg-elevated)",
                        }}
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className="max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed whitespace-pre-wrap"
                    style={
                      m.role === "user"
                        ? {
                            backgroundColor: "var(--accent-gold)",
                            color: "#ffffff",
                          }
                        : {
                            backgroundColor: "var(--bg-elevated)",
                            color: "var(--text-primary)",
                          }
                    }
                  >
                    {m.content}
                  </div>
                </div>
              ))}

              {loading && (
                <div className="flex justify-start">
                  <div
                    className="rounded-2xl px-3.5 py-2 text-xs"
                    style={{ backgroundColor: "var(--bg-elevated)", color: "var(--text-muted)" }}
                  >
                    Searching Scripture context…
                  </div>
                </div>
              )}

              {error && (
                <div className="rounded-xl border border-red-300 bg-red-100 text-red-900 dark:border-red-800 dark:bg-red-950/70 dark:text-red-200 p-3 text-xs font-medium space-y-1.5">
                  <p>{error}</p>
                  {user?.role === "admin" && error.includes("API key") && (
                    <a
                      href="/admin"
                      className="inline-block underline font-semibold"
                    >
                      Open Admin → AI Assistant to add your API key →
                    </a>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Input */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              sendMessage(input);
            }}
            className="flex items-center gap-2 border-t p-3"
            style={{ borderColor: "var(--border-subtle)" }}
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={
                aiContextRef
                  ? `Ask about ${aiContextRef}...`
                  : "Ask a Bible study question..."
              }
              className="flex-1 rounded-xl border px-3 py-2 text-xs outline-none"
              style={{
                backgroundColor: "var(--bg-page)",
                borderColor: "var(--border-subtle)",
                color: "var(--text-primary)",
              }}
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="flex h-8 w-8 items-center justify-center rounded-xl disabled:opacity-40 cursor-pointer"
              style={{ backgroundColor: "var(--accent-gold)", color: "#ffffff" }}
            >
              <Send className="h-3.5 w-3.5" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
