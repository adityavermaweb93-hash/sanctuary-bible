"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { CalendarCheck, CheckCircle2, Circle, Play, Pause } from "lucide-react";
import { useApp } from "@/components/AppContext";

interface PlanDay {
  id: string;
  dayNumber: number;
  title: string;
  passages: Array<{ bookId: number; bookName: string; startChapter: number; endChapter: number }>;
}

interface ReadingPlan {
  id: string;
  title: string;
  description: string;
  durationDays: number;
  category: string;
  days: PlanDay[];
  progress?: Array<{
    id: string;
    status: string;
    completedDays: number[];
    reminderTime: string | null;
  }>;
}

export default function ReadingPlansPage() {
  const { user, activeTranslation } = useApp();
  const [plans, setPlans] = useState<ReadingPlan[]>([]);
  const [expandedPlan, setExpandedPlan] = useState<string | null>(null);

  const loadPlans = useCallback(async () => {
    const res = await fetch("/api/reading-plans");
    const data = await res.json();
    if (Array.isArray(data.plans)) setPlans(data.plans);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      void loadPlans();
    }, 0);
    return () => clearTimeout(t);
  }, [loadPlans]);

  async function startPlan(planId: string) {
    await fetch("/api/reading-plans", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ planId, action: "start" }),
    });
    setExpandedPlan(planId);
    loadPlans();
  }

  async function toggleDay(planId: string, dayNumber: number) {
    await fetch("/api/reading-plans", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ planId, action: "toggleDay", dayNumber }),
    });
    loadPlans();
  }

  async function toggleStatus(planId: string, currentStatus: string) {
    await fetch("/api/reading-plans", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        planId,
        status: currentStatus === "paused" ? "active" : "paused",
      }),
    });
    loadPlans();
  }

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <CalendarCheck className="h-6 w-6" style={{ color: "var(--accent-gold)" }} />
          Bible Reading Plans
        </h1>
        <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
          Build a consistent daily habit in Scripture with 7-day, 30-day, 90-day, and 365-day plans.
        </p>
      </div>

      <div className="grid gap-5">
        {plans.map((p) => {
          const prog = p.progress?.[0];
          const completed = prog?.completedDays || [];
          const pct = Math.round((completed.length / p.durationDays) * 100);
          const isExpanded = expandedPlan === p.id;

          return (
            <div
              key={p.id}
              className="rounded-2xl border p-6 space-y-4"
              style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border-subtle)" }}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <span
                    className="rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
                    style={{ backgroundColor: "var(--accent-gold-soft)", color: "var(--accent-gold)" }}
                  >
                    {p.durationDays} Days · {p.category}
                  </span>
                  <h2 className="mt-2 text-lg font-bold">{p.title}</h2>
                  <p className="mt-1 text-xs" style={{ color: "var(--text-secondary)" }}>
                    {p.description}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {!user ? (
                    <Link
                      href="/profile"
                      className="rounded-xl border px-4 py-2 text-xs font-semibold"
                      style={{ borderColor: "var(--border-subtle)" }}
                    >
                      Sign in to track
                    </Link>
                  ) : !prog ? (
                    <button
                      onClick={() => startPlan(p.id)}
                      className="rounded-xl px-4 py-2 text-xs font-semibold text-white cursor-pointer"
                      style={{ backgroundColor: "var(--accent-gold)" }}
                    >
                      Start Plan
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={() => toggleStatus(p.id, prog.status)}
                        className="inline-flex items-center gap-1 rounded-xl border px-3 py-2 text-xs font-medium cursor-pointer"
                        style={{ borderColor: "var(--border-subtle)" }}
                      >
                        {prog.status === "paused" ? (
                          <>
                            <Play className="h-3.5 w-3.5" /> Resume
                          </>
                        ) : (
                          <>
                            <Pause className="h-3.5 w-3.5" /> Pause
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => setExpandedPlan(isExpanded ? null : p.id)}
                        className="rounded-xl px-4 py-2 text-xs font-semibold text-white cursor-pointer"
                        style={{ backgroundColor: "var(--accent-gold)" }}
                      >
                        {isExpanded ? "Hide Days" : `View Progress (${pct}%)`}
                      </button>
                    </>
                  )}
                </div>
              </div>

              {prog && (
                <div className="h-2 w-full rounded-full bg-black/5 dark:bg-white/10 overflow-hidden">
                  <div
                    className="h-full transition-all"
                    style={{ width: `${pct}%`, backgroundColor: "var(--accent-gold)" }}
                  />
                </div>
              )}

              {isExpanded && (
                <div className="pt-2 grid gap-2 sm:grid-cols-2 max-h-80 overflow-y-auto">
                  {p.days.map((d) => {
                    const done = completed.includes(d.dayNumber);
                    const first = d.passages?.[0];
                    return (
                      <div
                        key={d.id}
                        className="flex items-center justify-between rounded-xl border px-3 py-2 text-xs"
                        style={{ borderColor: "var(--border-subtle)", backgroundColor: "var(--bg-page)" }}
                      >
                        <button
                          onClick={() => toggleDay(p.id, d.dayNumber)}
                          className="flex items-center gap-2 text-left cursor-pointer"
                        >
                          {done ? (
                            <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                          ) : (
                            <Circle className="h-4 w-4 shrink-0" style={{ color: "var(--text-muted)" }} />
                          )}
                          <span className={done ? "line-through opacity-60" : "font-medium"}>
                            {d.title}
                          </span>
                        </button>
                        {first && (
                          <Link
                            href={`/bible?book=${first.bookId}&chapter=${first.startChapter}&translation=${activeTranslation}`}
                            className="font-semibold hover:underline shrink-0 ml-2"
                            style={{ color: "var(--accent-gold)" }}
                          >
                            Read →
                          </Link>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
