import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const PUBLIC_DOMAIN_AUDIO_PERMITTED = new Set([
  "KJV",
  "WEB",
  "BSB",
  "ASV",
  "YLT",
  "DRB",
  "OEB",
  "BBE",
]);

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const translationAbbr = (searchParams.get("translation") || "KJV").toUpperCase();
  const bookId = Number(searchParams.get("bookId") || "43");
  const chapterNum = Number(searchParams.get("chapter") || "3");

  try {
    const translation = await prisma.bibleTranslation.findUnique({
      where: { abbreviation: translationAbbr },
      include: { licenses: true },
    });

    if (translation) {
      const tracks = await prisma.audioTrack.findMany({
        where: {
          translationId: translation.id,
          bookId,
          chapterNum,
          isActive: true,
          audioSource: { isActive: true, licenseConfirmed: true },
        },
        include: { audioSource: { select: { name: true, providerType: true } } },
        orderBy: { verseNum: "asc" },
      });

      if (tracks.length > 0) {
        return NextResponse.json({
          mode: "licensed_audio",
          tracks,
          translationAbbr,
        });
      }

      const permitTts =
        translation.audioAvailable &&
        (translation.allowAiContext ||
          translation.licenses.some((l) => l.permitAudio));

      if (permitTts) {
        return NextResponse.json({
          mode: "permitted_tts",
          tracks: [],
          translationAbbr,
          licenseNote: "Permitted Public Domain / Open License audio synthesis.",
        });
      }

      return NextResponse.json({
        mode: "unavailable",
        tracks: [],
        translationAbbr,
        reason:
          "Audio is not licensed for this translation. Switch to KJV, WEB, or BSB, or configure a licensed audio source in Admin.",
      });
    }
  } catch {
    // Fallback when DB is not initialized
  }

  if (PUBLIC_DOMAIN_AUDIO_PERMITTED.has(translationAbbr)) {
    return NextResponse.json({
      mode: "permitted_tts",
      tracks: [],
      translationAbbr,
      licenseNote: "Permitted Public Domain audio synthesis.",
    });
  }

  return NextResponse.json({
    mode: "unavailable",
    tracks: [],
    translationAbbr,
    reason: "Audio is not licensed for this translation.",
  });
}
