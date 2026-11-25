import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  let dbConnected = false;
  let dbError: string | null = null;
  let counts = { translations: 0, books: 0, users: 0 };

  try {
    await prisma.$queryRaw`SELECT 1`;
    dbConnected = true;
    const [translations, books, users] = await Promise.all([
      prisma.bibleTranslation.count(),
      prisma.bibleBook.count(),
      prisma.user.count(),
    ]);
    counts = { translations, books, users };
  } catch (err) {
    dbError = err instanceof Error ? err.message : "Database unreachable";
  }

  return NextResponse.json({
    status: dbConnected ? "ok" : "degraded",
    database: { connected: dbConnected, error: dbError, counts },
    timestamp: new Date().toISOString(),
  });
}
