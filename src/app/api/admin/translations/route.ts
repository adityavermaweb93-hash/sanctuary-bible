import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { getBibleChapter } from "@/lib/bible/adapters";

export async function GET() {
  try {
    await requireAdmin();
    const [translations, providers] = await Promise.all([
      prisma.bibleTranslation.findMany({
        orderBy: [{ displayOrder: "asc" }],
        include: {
          provider: { select: { id: true, name: true, slug: true } },
          licenses: true,
        },
      }),
      prisma.bibleProvider.findMany({
        orderBy: { name: "asc" },
        select: { id: true, name: true, slug: true, baseUrl: true, isActive: true, notes: true },
      }),
    ]);
    return NextResponse.json({ translations, providers });
  } catch (err) {
    if (err instanceof Error && err.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (err instanceof Error && err.message === "FORBIDDEN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    return NextResponse.json({ error: "Failed to load translations" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin();
    const body = await req.json();

    if (body.action === "testConnection") {
      try {
        const res = await getBibleChapter(body.abbreviation, 43, 3);
        return NextResponse.json({
          ok: true,
          message: `Connected (${res.source}): loaded ${res.verses.length} verses of John 3.`,
        });
      } catch (e) {
        return NextResponse.json({
          ok: false,
          message: e instanceof Error ? e.message : "Connection failed",
        });
      }
    }

    const created = await prisma.bibleTranslation.create({
      data: {
        abbreviation: String(body.abbreviation).trim(),
        fullName: String(body.fullName).trim(),
        publisher: body.publisher || null,
        copyrightInfo: body.copyrightInfo || null,
        licenseInfo: body.licenseInfo || null,
        providerId: body.providerId || null,
        externalBibleId: body.externalBibleId || null,
        availabilityStatus: body.availabilityStatus || "coming_soon",
        isActive: Boolean(body.isActive),
        testamentAvail: body.testamentAvail || "OT_NT",
        audioAvailable: Boolean(body.audioAvailable),
        allowAiContext: Boolean(body.allowAiContext),
        displayOrder: Number(body.displayOrder || 100),
      },
    });

    await prisma.adminActivityLog.create({
      data: {
        adminId: admin.id,
        action: "translation.create",
        target: created.abbreviation,
      },
    });

    return NextResponse.json({ translation: created }, { status: 201 });
  } catch (err) {
    if (err instanceof Error && err.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (err instanceof Error && err.message === "FORBIDDEN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    return NextResponse.json({ error: "Failed to save translation" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const admin = await requireAdmin();
    const body = await req.json();
    const { id, ...updates } = body;
    if (!id) {
      return NextResponse.json({ error: "Translation id required" }, { status: 400 });
    }

    const updated = await prisma.bibleTranslation.update({
      where: { id },
      data: {
        ...(updates.fullName !== undefined ? { fullName: updates.fullName } : {}),
        ...(updates.publisher !== undefined ? { publisher: updates.publisher } : {}),
        ...(updates.copyrightInfo !== undefined ? { copyrightInfo: updates.copyrightInfo } : {}),
        ...(updates.licenseInfo !== undefined ? { licenseInfo: updates.licenseInfo } : {}),
        ...(updates.providerId !== undefined ? { providerId: updates.providerId } : {}),
        ...(updates.externalBibleId !== undefined ? { externalBibleId: updates.externalBibleId } : {}),
        ...(updates.availabilityStatus !== undefined ? { availabilityStatus: updates.availabilityStatus } : {}),
        ...(updates.isActive !== undefined ? { isActive: Boolean(updates.isActive) } : {}),
        ...(updates.audioAvailable !== undefined ? { audioAvailable: Boolean(updates.audioAvailable) } : {}),
        ...(updates.allowAiContext !== undefined ? { allowAiContext: Boolean(updates.allowAiContext) } : {}),
        ...(updates.displayOrder !== undefined ? { displayOrder: Number(updates.displayOrder) } : {}),
      },
    });

    await prisma.adminActivityLog.create({
      data: {
        adminId: admin.id,
        action: "translation.update",
        target: updated.abbreviation,
        details: updates,
      },
    });

    return NextResponse.json({ translation: updated });
  } catch (err) {
    if (err instanceof Error && err.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (err instanceof Error && err.message === "FORBIDDEN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    return NextResponse.json({ error: "Failed to update translation" }, { status: 500 });
  }
}
