import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";

const bookmarkSchema = z.object({
  bookId: z.number().int().min(1).max(66),
  bookName: z.string().min(1).max(64),
  chapterNum: z.number().int().min(1).max(150),
  verseNum: z.number().int().min(1).max(200).nullable().optional(),
  referenceLabel: z.string().min(1).max(100),
  translationAbbr: z.string().min(1).max(32),
  note: z.string().max(300).optional(),
});

export async function GET() {
  try {
    const user = await requireUser();
    const bookmarks = await prisma.bookmark.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ bookmarks });
  } catch (err) {
    if (err instanceof Error && err.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Failed to load bookmarks" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    const body = await req.json();
    const parsed = bookmarkSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid bookmark" }, { status: 400 });
    }

    const existing = await prisma.bookmark.findFirst({
      where: {
        userId: user.id,
        bookId: parsed.data.bookId,
        chapterNum: parsed.data.chapterNum,
        verseNum: parsed.data.verseNum ?? null,
      },
    });

    if (existing) {
      return NextResponse.json({ bookmark: existing });
    }

    const bookmark = await prisma.bookmark.create({
      data: {
        userId: user.id,
        bookId: parsed.data.bookId,
        bookName: parsed.data.bookName,
        chapterNum: parsed.data.chapterNum,
        verseNum: parsed.data.verseNum ?? null,
        referenceLabel: parsed.data.referenceLabel,
        translationAbbr: parsed.data.translationAbbr,
        note: parsed.data.note || null,
      },
    });
    return NextResponse.json({ bookmark }, { status: 201 });
  } catch (err) {
    if (err instanceof Error && err.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Failed to save bookmark" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await requireUser();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Bookmark id required" }, { status: 400 });
    }
    await prisma.bookmark.deleteMany({ where: { id, userId: user.id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof Error && err.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Failed to delete bookmark" }, { status: 500 });
  }
}
