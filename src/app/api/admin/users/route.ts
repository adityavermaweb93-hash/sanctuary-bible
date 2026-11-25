import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(req.url);
    const q = (searchParams.get("q") || "").trim();

    const [users, roles] = await Promise.all([
      prisma.user.findMany({
        where: q
          ? {
              OR: [
                { email: { contains: q, mode: "insensitive" } },
                { name: { contains: q, mode: "insensitive" } },
              ],
            }
          : {},
        orderBy: { createdAt: "desc" },
        take: 100,
        select: {
          id: true,
          email: true,
          name: true,
          status: true,
          emailVerified: true,
          dailyAiLimit: true,
          monthlyAiLimit: true,
          lastLoginAt: true,
          createdAt: true,
          role: { select: { id: true, name: true } },
        },
      }),
      prisma.role.findMany({ orderBy: { name: "asc" } }),
    ]);

    return NextResponse.json({ users, roles });
  } catch (err) {
    if (err instanceof Error && err.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (err instanceof Error && err.message === "FORBIDDEN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    return NextResponse.json({ error: "Failed to load users" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const admin = await requireAdmin();
    const { userId, status, roleId, dailyAiLimit, monthlyAiLimit } = await req.json();
    if (!userId) {
      return NextResponse.json({ error: "userId required" }, { status: 400 });
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(status ? { status } : {}),
        ...(roleId ? { roleId } : {}),
        ...(dailyAiLimit !== undefined ? { dailyAiLimit: Number(dailyAiLimit) } : {}),
        ...(monthlyAiLimit !== undefined ? { monthlyAiLimit: Number(monthlyAiLimit) } : {}),
      },
      select: {
        id: true,
        email: true,
        status: true,
        role: { select: { id: true, name: true } },
      },
    });

    await prisma.adminActivityLog.create({
      data: {
        adminId: admin.id,
        action: "user.update",
        target: updated.email,
        details: { status, roleId, dailyAiLimit, monthlyAiLimit },
      },
    });

    return NextResponse.json({ user: updated });
  } catch {
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
  }
}
