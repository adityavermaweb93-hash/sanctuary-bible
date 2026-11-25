import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";

const updateNoteSchema = z.object({
  title: z.string().min(1).max(200).trim().optional(),
  content: z.string().max(50000).optional(),
  folderId: z.string().nullable().optional(),
  referenceLabel: z.string().max(100).nullable().optional(),
  tags: z.array(z.string().max(32)).max(10).optional(),
});

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUser();
    const { id } = await context.params;
    const existing = await prisma.userNote.findFirst({
      where: { id, userId: user.id },
    });
    if (!existing) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 });
    }

    const body = await req.json();
    const parsed = updateNoteSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid update payload" }, { status: 400 });
    }

    const note = await prisma.userNote.update({
      where: { id },
      data: parsed.data,
      include: { folder: { select: { id: true, name: true, color: true } } },
    });

    return NextResponse.json({ note });
  } catch (err) {
    if (err instanceof Error && err.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Failed to update note" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUser();
    const { id } = await context.params;
    const deleted = await prisma.userNote.deleteMany({
      where: { id, userId: user.id },
    });
    if (deleted.count === 0) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof Error && err.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Failed to delete note" }, { status: 500 });
  }
}
