import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";

const resetSchema = z.object({
  token: z.string().min(10),
  password: z.string().min(8).max(128),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = resetSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid token or password" }, { status: 400 });
    }

    const user = await prisma.user.findFirst({
      where: {
        resetToken: parsed.data.token,
        resetTokenExpiresAt: { gt: new Date() },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Reset token is invalid or expired." },
        { status: 400 }
      );
    }

    const passwordHash = await hashPassword(parsed.data.password);
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        resetToken: null,
        resetTokenExpiresAt: null,
      },
    });

    return NextResponse.json({ message: "Password updated successfully." });
  } catch {
    return NextResponse.json({ error: "Failed to reset password" }, { status: 500 });
  }
}
