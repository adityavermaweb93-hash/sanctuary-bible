import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";

const createNoteSchema = z.object({
  title: z.string().min(1).max(200).trim(),
  content: z.string().max(50000),
  folderId: z.string().nullable().optional(),
  bookId: z.number().int().min(1).max(66).nullable().optional(),
  bookName: z.string().max(64).nullable().optional(),
  chapterNum: z.number().int().min(1).max(150).nullable().optional(),
  verseNum: z.number().int().min(1).max(200).nullable().optional(),
  referenceLabel: z.string().max(100).nullable().optional(),
  translationAbbr: z.string().max(32).nullable().optional(),
  tags: z.array(z.string().max(32)).max(10).optional(),
});

export async function GET(req: NextRequest) {
  try {
    const user = await requireUser();
    const { searchParams } = new URL(req.url);
    const q = (searchParams.get("q") || "").trim();
    const folderId = searchParams.get("folderId");

    const notes = await prisma.userNote.findMany({
      where: {
        userId: user.id,
        ...(folderId ? { folderId } : {}),
        ...(q
          ? {
              OR: [
                { title: { contains: q, mode: "insensitive" } },
                { content: { contains: q, mode: "insensitive" } },
                { referenceLabel: { contains: q, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      include: { folder: { select: { id: true, name: true, color: true } } },
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json({ notes });
  } catch (err) {
    if (err instanceof Error && err.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Failed to load notes" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    const body = await req.json();
    const parsed = createNoteSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid note" },
        { status: 400 }
      );
    }

    const note = await prisma.userNote.create({
      data: {
        userId: user.id,
        title: parsed.data.title,
        content: parsed.data.content,
        folderId: parsed.data.folderId || null,
        bookId: parsed.data.bookId || null,
        bookName: parsed.data.bookName || null,
        chapterNum: parsed.data.chapterNum || null,
        verseNum: parsed.data.verseNum || null,
        referenceLabel: parsed.data.referenceLabel || null,
        translationAbbr: parsed.data.translationAbbr || null,
        tags: parsed.data.tags || [],
      },
      include: { folder: { select: { id: true, name: true, color: true } } },
    });

    return NextResponse.json({ note }, { status: 201 });
  } catch (err) {
    if (err instanceof Error && err.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Failed to create note" }, { status: 500 });
  }
}
