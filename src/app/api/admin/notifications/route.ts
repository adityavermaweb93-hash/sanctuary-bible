import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

export async function GET() {
  try {
    await requireAdmin();
    const notifications = await prisma.notification.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    return NextResponse.json({ notifications });
  } catch (err) {
    if (err instanceof Error && err.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (err instanceof Error && err.message === "FORBIDDEN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    return NextResponse.json({ error: "Failed to load notifications" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin();
    const { title, message, type } = await req.json();
    const notification = await prisma.notification.create({
      data: {
        title: String(title),
        message: String(message),
        type: type || "announcement",
        isActive: true,
      },
    });
    await prisma.adminActivityLog.create({
      data: {
        adminId: admin.id,
        action: "notification.create",
        target: notification.title,
      },
    });
    return NextResponse.json({ notification }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to create notification" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
    await prisma.notification.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Failed to delete notification" }, { status: 500 });
  }
}
