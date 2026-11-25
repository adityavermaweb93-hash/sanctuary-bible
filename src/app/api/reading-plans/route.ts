import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, requireUser } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getSession();
    const plans = await prisma.readingPlan.findMany({
      where: { isActive: true },
      include: {
        days: { orderBy: { dayNumber: "asc" }, take: 31 },
        ...(session
          ? {
              progress: {
                where: { userId: session.userId },
              },
            }
          : {}),
      },
      orderBy: [{ isFeatured: "desc" }, { durationDays: "asc" }],
    });
    return NextResponse.json({ plans });
  } catch {
    return NextResponse.json({ plans: [] });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    const { planId, action, dayNumber, status, reminderTime } = await req.json();

    if (!planId) {
      return NextResponse.json({ error: "planId required" }, { status: 400 });
    }

    if (action === "start") {
      const progress = await prisma.readingPlanProgress.upsert({
        where: { userId_planId: { userId: user.id, planId } },
        update: { status: "active" },
        create: { userId: user.id, planId, status: "active", completedDays: [] },
      });
      return NextResponse.json({ progress });
    }

    const existing = await prisma.readingPlanProgress.findUnique({
      where: { userId_planId: { userId: user.id, planId } },
    });
    if (!existing) {
      return NextResponse.json({ error: "Plan not started" }, { status: 404 });
    }

    if (action === "toggleDay" && typeof dayNumber === "number") {
      const set = new Set(existing.completedDays);
      if (set.has(dayNumber)) set.delete(dayNumber);
      else set.add(dayNumber);
      const updated = await prisma.readingPlanProgress.update({
        where: { id: existing.id },
        data: { completedDays: Array.from(set).sort((a, b) => a - b) },
      });
      return NextResponse.json({ progress: updated });
    }

    if (status || reminderTime !== undefined) {
      const updated = await prisma.readingPlanProgress.update({
        where: { id: existing.id },
        data: {
          ...(status ? { status } : {}),
          ...(reminderTime !== undefined ? { reminderTime } : {}),
        },
      });
      return NextResponse.json({ progress: updated });
    }

    return NextResponse.json({ progress: existing });
  } catch (err) {
    if (err instanceof Error && err.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Failed to update plan" }, { status: 500 });
  }
}
