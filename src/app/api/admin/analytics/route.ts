import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { BIBLE_BOOKS } from "@/lib/bible/books";

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(req.url);
    const range = searchParams.get("range") || "30d";
    const fromParam = searchParams.get("from");
    const toParam = searchParams.get("to");

    const now = new Date();
    let startDate = new Date(now);
    let endDate = new Date(now);

    if (range === "today") {
      startDate.setUTCHours(0, 0, 0, 0);
    } else if (range === "7d") {
      startDate.setDate(now.getDate() - 7);
    } else if (range === "90d") {
      startDate.setDate(now.getDate() - 90);
    } else if (range === "custom" && fromParam && toParam) {
      startDate = new Date(fromParam);
      endDate = new Date(toParam);
    } else {
      startDate.setDate(now.getDate() - 30);
    }

    const day1Ago = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const day7Ago = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const day30Ago = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [
      totalRegisteredUsers,
      newRegistrations,
      pageViews,
      chapterViews,
      audioPlays,
      aiQuestions,
      notesCreated,
      uniqueVisitorRows,
      dauUsers,
      wauUsers,
      mauUsers,
      dailySeries,
      topBooksRaw,
      topTranslationsRaw,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({
        where: { createdAt: { gte: startDate, lte: endDate } },
      }),
      prisma.analyticsEvent.count({
        where: {
          eventType: "page_view",
          createdAt: { gte: startDate, lte: endDate },
        },
      }),
      prisma.analyticsEvent.count({
        where: {
          eventType: "chapter_read",
          createdAt: { gte: startDate, lte: endDate },
        },
      }),
      prisma.analyticsEvent.count({
        where: {
          eventType: "audio_play",
          createdAt: { gte: startDate, lte: endDate },
        },
      }),
      prisma.analyticsEvent.count({
        where: {
          eventType: "ai_question",
          createdAt: { gte: startDate, lte: endDate },
        },
      }),
      prisma.userNote.count({
        where: { createdAt: { gte: startDate, lte: endDate } },
      }),
      prisma.analyticsEvent.groupBy({
        by: ["visitorHash"],
        where: {
          visitorHash: { not: null },
          createdAt: { gte: startDate, lte: endDate },
        },
      }),
      prisma.analyticsEvent.groupBy({
        by: ["userId"],
        where: { userId: { not: null }, createdAt: { gte: day1Ago } },
      }),
      prisma.analyticsEvent.groupBy({
        by: ["userId"],
        where: { userId: { not: null }, createdAt: { gte: day7Ago } },
      }),
      prisma.analyticsEvent.groupBy({
        by: ["userId"],
        where: { userId: { not: null }, createdAt: { gte: day30Ago } },
      }),
      prisma.dailyAnalytics.findMany({
        where: { date: { gte: startDate, lte: endDate } },
        orderBy: { date: "asc" },
      }),
      prisma.analyticsEvent.groupBy({
        by: ["bookId"],
        where: {
          eventType: "chapter_read",
          bookId: { not: null },
          createdAt: { gte: startDate, lte: endDate },
        },
        _count: { bookId: true },
        orderBy: { _count: { bookId: "desc" } },
        take: 8,
      }),
      prisma.analyticsEvent.groupBy({
        by: ["translationAbbr"],
        where: {
          translationAbbr: { not: null },
          createdAt: { gte: startDate, lte: endDate },
        },
        _count: { translationAbbr: true },
        orderBy: { _count: { translationAbbr: "desc" } },
        take: 8,
      }),
    ]);

    const topBooks = topBooksRaw.map((r) => ({
      bookId: r.bookId,
      bookName:
        BIBLE_BOOKS.find((b) => b.id === r.bookId)?.name || `Book ${r.bookId}`,
      views: r._count.bookId,
    }));

    const topTranslations = topTranslationsRaw.map((r) => ({
      abbreviation: r.translationAbbr,
      uses: r._count.translationAbbr,
    }));

    return NextResponse.json({
      range,
      summary: {
        totalVisitors: uniqueVisitorRows.length,
        pageViews,
        totalRegisteredUsers,
        newRegistrations,
        dau: dauUsers.length,
        wau: wauUsers.length,
        mau: mauUsers.length,
        chapterViews,
        audioPlays,
        aiQuestions,
        notesCreated,
      },
      topBooks,
      topTranslations,
      dailySeries,
    });
  } catch (err) {
    if (err instanceof Error && err.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (err instanceof Error && err.message === "FORBIDDEN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    return NextResponse.json({ error: "Failed to load analytics" }, { status: 500 });
  }
}
