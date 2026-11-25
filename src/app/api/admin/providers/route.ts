import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { encryptSecret, decryptSecret, maskSecret } from "@/lib/crypto";

export async function GET() {
  try {
    await requireAdmin();
    const providers = await prisma.bibleProvider.findMany({ orderBy: { name: "asc" } });
    return NextResponse.json({
      providers: providers.map((p) => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        baseUrl: p.baseUrl,
        isActive: p.isActive,
        notes: p.notes,
        hasApiKey: Boolean(p.apiKeyEnc),
        maskedApiKey: p.apiKeyEnc ? maskSecret(decryptSecret(p.apiKeyEnc)) : "",
      })),
    });
  } catch (err) {
    if (err instanceof Error && err.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (err instanceof Error && err.message === "FORBIDDEN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    return NextResponse.json({ error: "Failed to load providers" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const admin = await requireAdmin();
    const { id, baseUrl, apiKey, isActive, notes } = await req.json();
    if (!id) {
      return NextResponse.json({ error: "Provider id required" }, { status: 400 });
    }

    const updated = await prisma.bibleProvider.update({
      where: { id },
      data: {
        ...(baseUrl !== undefined ? { baseUrl } : {}),
        ...(isActive !== undefined ? { isActive: Boolean(isActive) } : {}),
        ...(notes !== undefined ? { notes } : {}),
        ...(apiKey ? { apiKeyEnc: encryptSecret(String(apiKey)) } : {}),
      },
    });

    await prisma.adminActivityLog.create({
      data: {
        adminId: admin.id,
        action: "provider.update",
        target: updated.slug,
      },
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Failed to update provider" }, { status: 500 });
  }
}
