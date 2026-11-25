import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { BIBLE_BOOKS } from "@/lib/bible/books";
import { getBibleChapter } from "@/lib/bible/adapters";
import { checkRateLimit } from "@/lib/rate-limit";

function parseReference(query: string) {
  const match = query
    .trim()
    .match(/^([1-3]?\s?[a-zA-Z\s]+?)\s+(\d+)(?::(\d+))?$/);
  if (!match) return null;
  const bookQuery = match[1].trim().toLowerCase();
  const chapter = Number(match[2]);
  const verse = match[3] ? Number(match[3]) : undefined;
  const book = BIBLE_BOOKS.find(
    (b) =>
      b.name.toLowerCase() === bookQuery ||
      b.name.toLowerCase().startsWith(bookQuery) ||
      b.osisCode.toLowerCase() === bookQuery
  );
  if (!book || chapter < 1 || chapter > book.chapterCount) return null;
  return { book, chapter, verse };
}

export async function GET(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") || "local";
  const rl = checkRateLimit(`search:${ip}`, 60, 60_000);
  if (!rl.allowed) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") || "").trim();
  const translation = (searchParams.get("translation") || "KJV").trim();

  if (!q || q.length < 2) {
    return NextResponse.json({ results: [], referenceMatch: null });
  }

  // 1. Direct Reference Match (e.g., "John 3:16" or "Psalm 23")
  const ref = parseReference(q);
  if (ref) {
    try {
      const ch = await getBibleChapter(translation, ref.book.id, ref.chapter);
      const matchedVerses = ref.verse
        ? ch.verses.filter((v) => v.verseNum === ref.verse)
        : ch.verses.slice(0, 10);
      return NextResponse.json({
        referenceMatch: {
          bookId: ref.book.id,
          bookName: ref.book.name,
          chapterNum: ref.chapter,
          verseNum: ref.verse,
        },
        results: matchedVerses.map((v) => ({
          translationAbbr: ch.translation.abbreviation,
          bookId: ref.book.id,
          bookName: ref.book.name,
          chapterNum: ref.chapter,
          verseNum: v.verseNum,
          text: v.text,
        })),
      });
    } catch {
      // Fall through to keyword search
    }
  }

  // 2. Keyword Search across cached verses in PostgreSQL
  try {
    const verses = await prisma.bibleVerse.findMany({
      where: {
        translation: {
          abbreviation: translation,
          isActive: true,
          availabilityStatus: "available",
        },
        text: { contains: q, mode: "insensitive" },
      },
      take: 40,
      include: {
        book: { select: { name: true } },
        translation: { select: { abbreviation: true } },
      },
      orderBy: [{ bookId: "asc" }, { chapterNum: "asc" }, { verseNum: "asc" }],
    });

    return NextResponse.json({
      referenceMatch: null,
      results: verses.map((v) => ({
        translationAbbr: v.translation.abbreviation,
        bookId: v.bookId,
        bookName: v.book.name,
        chapterNum: v.chapterNum,
        verseNum: v.verseNum,
        text: v.text,
      })),
    });
  } catch {
    return NextResponse.json({ referenceMatch: null, results: [] });
  }
}
