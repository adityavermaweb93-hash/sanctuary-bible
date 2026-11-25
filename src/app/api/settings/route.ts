import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const [settings, notifications] = await Promise.all([
      prisma.appSetting.findMany({
        where: { id: { in: ["branding", "homepage", "legal", "system"] } },
      }),
      prisma.notification.findMany({
        where: {
          isActive: true,
          OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
        },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
    ]);

    const map = Object.fromEntries(settings.map((s) => [s.id, s.value]));
    return NextResponse.json({ settings: map, notifications });
  } catch {
    return NextResponse.json({
      settings: {
        branding: {
          appName: "Sanctuary Bible",
          tagline: "Read, Study & Reflect in Scripture",
          primaryColor: "#1b263b",
          accentColor: "#b4833e",
        },
        homepage: {
          welcomeTitle: "Welcome to Sanctuary Bible",
          welcomeSubtitle:
            "A quiet, modern space for daily Scripture reading, study, and reflection.",
          showContinueReading: true,
          showDailyVerse: true,
          showReadingPlans: true,
          showBookmarks: true,
          showNotes: true,
          showAudioHistory: true,
          showExploreBooks: true,
          dailyVerseRef: "John 3:16",
          dailyVerseBookId: 43,
          dailyVerseChapter: 3,
          dailyVerseNum: 16,
        },
      },
      notifications: [],
    });
  }
}
