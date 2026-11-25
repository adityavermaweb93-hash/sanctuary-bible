import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

export async function GET() {
  try {
    await requireAdmin();
    const rows = await prisma.appSetting.findMany();
    const settings = Object.fromEntries(rows.map((r) => [r.id, r.value]));
    return NextResponse.json({ settings });
  } catch (err) {
    if (err instanceof Error && err.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (err instanceof Error && err.message === "FORBIDDEN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    return NextResponse.json({ error: "Failed to load settings" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const admin = await requireAdmin();
    const { id, value } = await req.json();
    if (!id || typeof value !== "object") {
      return NextResponse.json({ error: "Invalid setting payload" }, { status: 400 });
    }

    const updated = await prisma.appSetting.upsert({
      where: { id: String(id) },
      update: { value },
      create: { id: String(id), value },
    });

    await prisma.adminActivityLog.create({
      data: {
        adminId: admin.id,
        action: "settings.update",
        target: String(id),
      },
    });

    return NextResponse.json({ setting: updated });
  } catch {
    return NextResponse.json({ error: "Failed to save settings" }, { status: 500 });
  }
}
