import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";

const folderSchema = z.object({
  name: z.string().min(1).max(60).trim(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
});

export async function GET() {
  try {
    const user = await requireUser();
    const folders = await prisma.noteFolder.findMany({
      where: { userId: user.id },
      orderBy: { name: "asc" },
      include: { _count: { select: { notes: true } } },
    });
    return NextResponse.json({ folders });
  } catch (err) {
    if (err instanceof Error && err.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Failed to load folders" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    const body = await req.json();
    const parsed = folderSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid folder name" }, { status: 400 });
    }

    const folder = await prisma.noteFolder.upsert({
      where: { userId_name: { userId: user.id, name: parsed.data.name } },
      update: { color: parsed.data.color || "#b4833e" },
      create: {
        userId: user.id,
        name: parsed.data.name,
        color: parsed.data.color || "#b4833e",
      },
    });
    return NextResponse.json({ folder }, { status: 201 });
  } catch (err) {
    if (err instanceof Error && err.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Failed to create folder" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await requireUser();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Folder id required" }, { status: 400 });
    }
    await prisma.noteFolder.deleteMany({ where: { id, userId: user.id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof Error && err.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Failed to delete folder" }, { status: 500 });
  }
}
