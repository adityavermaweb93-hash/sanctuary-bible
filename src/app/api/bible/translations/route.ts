import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { TRANSLATIONS_SEED } from "@/lib/bible/translations-seed";

export async function GET() {
  try {
    const rows = await prisma.bibleTranslation.findMany({
      orderBy: [{ isActive: "desc" }, { displayOrder: "asc" }],
      select: {
        id: true,
        abbreviation: true,
        fullName: true,
        publisher: true,
        copyrightInfo: true,
        licenseInfo: true,
        availabilityStatus: true,
        isActive: true,
        testamentAvail: true,
        audioAvailable: true,
        allowAiContext: true,
        displayOrder: true,
        language: true,
      },
    });
    if (rows.length > 0) {
      return NextResponse.json({ translations: rows });
    }
  } catch {
    // Fallback to seed metadata when DB is not yet migrated
  }

  return NextResponse.json({
    translations: TRANSLATIONS_SEED.map((t, idx) => ({
      id: `seed-${idx}`,
      abbreviation: t.abbreviation,
      fullName: t.fullName,
      publisher: t.publisher,
      copyrightInfo: t.copyrightInfo,
      licenseInfo: t.licenseInfo,
      availabilityStatus: t.availabilityStatus,
      isActive: t.isActive,
      testamentAvail: t.testamentAvail,
      audioAvailable: t.audioAvailable,
      allowAiContext: t.allowAiContext,
      displayOrder: t.displayOrder,
      language: "en",
    })),
  });
}
