import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await requireUser();
    const history = await prisma.readingHistory.findMany({
      where: { userId: user.id },
      orderBy: { readAt: "desc" },
      take: 30,
    });
    return NextResponse.json({ history });
  } catch (err) {
    if (err instanceof Error && err.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Failed to load reading history" }, { status: 500 });
  }
}
