import { NextRequest, NextResponse } from "next/server";
import { getBibleChapter } from "@/lib/bible/adapters";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const bookId = Number(searchParams.get("bookId") || "43");
  const chapter = Number(searchParams.get("chapter") || "3");
  const verse = Number(searchParams.get("verse") || "16");
  const rawTranslations = (searchParams.get("translations") || "KJV,WEB,BSB,ASV")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 6);

  const results = await Promise.all(
    rawTranslations.map(async (abbr) => {
      try {
        const ch = await getBibleChapter(abbr, bookId, chapter);
        const found = ch.verses.find((v) => v.verseNum === verse);
        return {
          translation: abbr,
          fullName: ch.translation.fullName,
          available: true,
          text: found?.text || "Verse not found in this chapter.",
        };
      } catch (err) {
        const msg = err instanceof Error ? err.message : "";
        return {
          translation: abbr,
          fullName: abbr,
          available: false,
          text:
            msg === "TRANSLATION_NOT_LICENSED"
              ? "Coming Soon / Not Yet Licensed"
              : "Unavailable",
        };
      }
    })
  );

  return NextResponse.json({ bookId, chapter, verse, comparisons: results });
}
