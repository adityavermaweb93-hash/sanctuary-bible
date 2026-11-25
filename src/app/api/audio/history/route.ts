import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";

const historySchema = z.object({
  translationAbbr: z.string().max(32),
  bookId: z.number().int().min(1).max(66),
  bookName: z.string().max(64),
  chapterNum: z.number().int().min(1).max(150),
  verseNum: z.number().int().min(1).max(200).nullable().optional(),
  positionSec: z.number().min(0),
  durationSec: z.number().min(0),
});

export async function GET() {
  try {
    const user = await requireUser();
    const history = await prisma.audioHistory.findMany({
      where: { userId: user.id },
      orderBy: { playedAt: "desc" },
      take: 20,
    });
    return NextResponse.json({ history });
  } catch (err) {
    if (err instanceof Error && err.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Failed to load audio history" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    const body = await req.json();
    const parsed = historySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid audio history" }, { status: 400 });
    }

    const entry = await prisma.audioHistory.create({
      data: {
        userId: user.id,
        translationAbbr: parsed.data.translationAbbr,
        bookId: parsed.data.bookId,
        bookName: parsed.data.bookName,
        chapterNum: parsed.data.chapterNum,
        verseNum: parsed.data.verseNum ?? null,
        positionSec: parsed.data.positionSec,
        durationSec: parsed.data.durationSec,
      },
    });
    return NextResponse.json({ entry }, { status: 201 });
  } catch (err) {
    if (err instanceof Error && err.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Failed to save audio history" }, { status: 500 });
  }
}
