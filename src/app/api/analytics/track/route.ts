import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { hashVisitor } from "@/lib/crypto";

const trackSchema = z.object({
  eventType: z.enum([
    "page_view",
    "chapter_read",
    "translation_switch",
    "audio_play",
    "ai_question",
    "note_created",
    "search",
  ]),
  path: z.string().max(255).optional(),
  translationAbbr: z.string().max(32).optional(),
  bookId: z.number().int().min(1).max(66).optional(),
  chapterNum: z.number().int().min(1).max(150).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = trackSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid event payload" }, { status: 400 });
    }

    const session = await getSession();
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const ua = req.headers.get("user-agent") || "unknown";
    const visitorHash = hashVisitor(ip, ua);

    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    await prisma.analyticsEvent.create({
      data: {
        eventType: parsed.data.eventType,
        visitorHash,
        userId: session?.userId || null,
        isGuest: !session,
        path: parsed.data.path,
        translationAbbr: parsed.data.translationAbbr,
        bookId: parsed.data.bookId,
        chapterNum: parsed.data.chapterNum,
        metadata: parsed.data.metadata ? (parsed.data.metadata as object) : undefined,
      },
    });

    const incField: Record<string, number> = {};
    if (parsed.data.eventType === "page_view") incField.pageViews = 1;
    if (parsed.data.eventType === "chapter_read") incField.chapterViews = 1;
    if (parsed.data.eventType === "audio_play") incField.audioPlays = 1;
    if (parsed.data.eventType === "ai_question") incField.aiQuestions = 1;
    if (parsed.data.eventType === "note_created") incField.notesCreated = 1;

    await prisma.dailyAnalytics.upsert({
      where: { date: today },
      update: Object.fromEntries(
        Object.entries(incField).map(([k, v]) => [k, { increment: v }])
      ),
      create: {
        date: today,
        ...incField,
      },
    });

    return NextResponse.json({ ok: true });
  } catch {
    // Non-blocking if DB isn't initialized yet
    return NextResponse.json({ ok: false }, { status: 200 });
  }
}
