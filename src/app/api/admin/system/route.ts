import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

export async function GET() {
  try {
    await requireAdmin();
    const [
      users,
      translations,
      verses,
      notes,
      bookmarks,
      highlights,
      logs,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.bibleTranslation.count(),
      prisma.bibleVerse.count(),
      prisma.userNote.count(),
      prisma.bookmark.count(),
      prisma.highlight.count(),
      prisma.adminActivityLog.findMany({
        orderBy: { createdAt: "desc" },
        take: 30,
        include: { admin: { select: { email: true, name: true } } },
      }),
    ]);

    return NextResponse.json({
      databaseStatus: "connected",
      counts: { users, translations, verses, notes, bookmarks, highlights },
      logs,
      version: "1.0.0",
    });
  } catch (err) {
    if (err instanceof Error && err.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (err instanceof Error && err.message === "FORBIDDEN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    return NextResponse.json(
      { databaseStatus: "error", error: "Failed to inspect system" },
      { status: 500 }
    );
  }
}
