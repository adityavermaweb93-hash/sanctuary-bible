import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

export async function GET() {
  try {
    await requireAdmin();
    const plans = await prisma.readingPlan.findMany({
      orderBy: { durationDays: "asc" },
      include: { _count: { select: { days: true, progress: true } } },
    });
    return NextResponse.json({ plans });
  } catch (err) {
    if (err instanceof Error && err.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (err instanceof Error && err.message === "FORBIDDEN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    return NextResponse.json({ error: "Failed to load plans" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin();
    const body = await req.json();
    const slug =
      body.slug ||
      String(body.title)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");

    const plan = await prisma.readingPlan.create({
      data: {
        slug,
        title: String(body.title),
        description: String(body.description || ""),
        durationDays: Number(body.durationDays || 7),
        category: String(body.category || "Custom"),
        isFeatured: Boolean(body.isFeatured),
        isActive: true,
      },
    });

    await prisma.adminActivityLog.create({
      data: { adminId: admin.id, action: "plan.create", target: plan.slug },
    });
    return NextResponse.json({ plan }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to create plan" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    await requireAdmin();
    const { id, isActive, isFeatured, title, description } = await req.json();
    const updated = await prisma.readingPlan.update({
      where: { id },
      data: {
        ...(isActive !== undefined ? { isActive: Boolean(isActive) } : {}),
        ...(isFeatured !== undefined ? { isFeatured: Boolean(isFeatured) } : {}),
        ...(title !== undefined ? { title } : {}),
        ...(description !== undefined ? { description } : {}),
      },
    });
    return NextResponse.json({ plan: updated });
  } catch {
    return NextResponse.json({ error: "Failed to update plan" }, { status: 500 });
  }
}
