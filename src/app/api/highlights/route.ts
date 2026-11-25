import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";

const highlightSchema = z.object({
  bookId: z.number().int().min(1).max(66),
  bookName: z.string().min(1).max(64),
  chapterNum: z.number().int().min(1).max(150),
  verseNum: z.number().int().min(1).max(200),
  translationAbbr: z.string().min(1).max(32),
  color: z.string().min(3).max(32),
});

export async function GET(req: NextRequest) {
  try {
    const user = await requireUser();
    const { searchParams } = new URL(req.url);
    const bookId = searchParams.get("bookId");
    const chapterNum = searchParams.get("chapter");

    const highlights = await prisma.highlight.findMany({
      where: {
        userId: user.id,
        ...(bookId && chapterNum
          ? { bookId: Number(bookId), chapterNum: Number(chapterNum) }
          : {}),
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ highlights });
  } catch (err) {
    if (err instanceof Error && err.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Failed to load highlights" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    const body = await req.json();
    const parsed = highlightSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid highlight" }, { status: 400 });
    }

    const highlight = await prisma.highlight.upsert({
      where: {
        userId_bookId_chapterNum_verseNum: {
          userId: user.id,
          bookId: parsed.data.bookId,
          chapterNum: parsed.data.chapterNum,
          verseNum: parsed.data.verseNum,
        },
      },
      update: { color: parsed.data.color },
      create: {
        userId: user.id,
        ...parsed.data,
      },
    });
    return NextResponse.json({ highlight }, { status: 201 });
  } catch (err) {
    if (err instanceof Error && err.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Failed to save highlight" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await requireUser();
    const { searchParams } = new URL(req.url);
    const bookId = Number(searchParams.get("bookId"));
    const chapterNum = Number(searchParams.get("chapter"));
    const verseNum = Number(searchParams.get("verse"));

    if (!bookId || !chapterNum || !verseNum) {
      return NextResponse.json({ error: "Missing verse coordinates" }, { status: 400 });
    }

    await prisma.highlight.deleteMany({
      where: { userId: user.id, bookId, chapterNum, verseNum },
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof Error && err.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Failed to remove highlight" }, { status: 500 });
  }
}
