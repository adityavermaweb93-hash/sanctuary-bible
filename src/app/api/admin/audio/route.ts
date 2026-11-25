import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

export async function GET() {
  try {
    await requireAdmin();
    const [sources, tracks] = await Promise.all([
      prisma.audioSource.findMany({ orderBy: { name: "asc" } }),
      prisma.audioTrack.findMany({
        take: 50,
        orderBy: [{ bookId: "asc" }, { chapterNum: "asc" }],
        include: {
          translation: { select: { abbreviation: true } },
          book: { select: { name: true } },
          audioSource: { select: { name: true } },
        },
      }),
    ]);
    return NextResponse.json({ sources, tracks });
  } catch (err) {
    if (err instanceof Error && err.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (err instanceof Error && err.message === "FORBIDDEN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    return NextResponse.json({ error: "Failed to load audio sources" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin();
    const body = await req.json();

    if (body.kind === "track") {
      const track = await prisma.audioTrack.create({
        data: {
          audioSourceId: body.audioSourceId,
          translationId: body.translationId,
          bookId: Number(body.bookId),
          chapterNum: Number(body.chapterNum),
          verseNum: body.verseNum ? Number(body.verseNum) : null,
          audioUrl: body.audioUrl,
          durationSec: body.durationSec ? Number(body.durationSec) : null,
        },
      });
      await prisma.adminActivityLog.create({
        data: { adminId: admin.id, action: "audio.track.create", target: track.id },
      });
      return NextResponse.json({ track }, { status: 201 });
    }

    const source = await prisma.audioSource.create({
      data: {
        name: body.name,
        providerType: body.providerType || "licensed_mp3",
        baseUrl: body.baseUrl || null,
        licenseConfirmed: Boolean(body.licenseConfirmed),
        isActive: Boolean(body.isActive ?? true),
        notes: body.notes || null,
      },
    });
    await prisma.adminActivityLog.create({
      data: { adminId: admin.id, action: "audio.source.create", target: source.name },
    });
    return NextResponse.json({ source }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to create audio record" }, { status: 500 });
  }
}
