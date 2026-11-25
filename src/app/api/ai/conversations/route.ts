import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await requireUser();
    const conversations = await prisma.aiConversation.findMany({
      where: { userId: user.id },
      orderBy: { updatedAt: "desc" },
      take: 25,
      include: {
        messages: { orderBy: { createdAt: "asc" } },
      },
    });
    return NextResponse.json({ conversations });
  } catch (err) {
    if (err instanceof Error && err.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Failed to load conversations" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await requireUser();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Conversation id required" }, { status: 400 });
    }
    await prisma.aiConversation.deleteMany({ where: { id, userId: user.id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof Error && err.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Failed to delete conversation" }, { status: 500 });
  }
}
