import { NextRequest, NextResponse } from "next/server";
import { getBibleChapter } from "@/lib/bible/adapters";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const translation = (searchParams.get("translation") || "KJV").trim();
  const bookId = Number(searchParams.get("bookId") || "43");
  const chapter = Number(searchParams.get("chapter") || "3");

  if (!Number.isInteger(bookId) || !Number.isInteger(chapter)) {
    return NextResponse.json({ error: "Invalid bookId or chapter" }, { status: 400 });
  }

  try {
    const result = await getBibleChapter(translation, bookId, chapter);

    // Record reading history for authenticated users
    const session = await getSession();
    if (session) {
      prisma.readingHistory
        .create({
          data: {
            userId: session.userId,
            translationAbbr: result.translation.abbreviation,
            bookId: result.book.id,
            bookName: result.book.name,
            chapterNum: result.chapterNum,
          },
        })
        .catch(() => {});
    }

    return NextResponse.json(result);
  } catch (err) {
    const code = err instanceof Error ? err.message : "UNKNOWN";
    if (code === "TRANSLATION_NOT_LICENSED") {
      return NextResponse.json(
        {
          error:
            "This translation is not yet licensed or activated. Please choose an available translation.",
        },
        { status: 403 }
      );
    }
    if (code === "BOOK_NOT_FOUND" || code === "CHAPTER_NOT_FOUND") {
      return NextResponse.json({ error: "Book or chapter not found" }, { status: 404 });
    }
    return NextResponse.json(
      { error: "Unable to load chapter at this time." },
      { status: 502 }
    );
  }
}
