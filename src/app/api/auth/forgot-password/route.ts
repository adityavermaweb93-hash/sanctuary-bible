import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const forgotSchema = z.object({ email: z.string().email() });

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = forgotSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Valid email required" }, { status: 400 });
    }

    const email = parsed.data.email.toLowerCase();
    const user = await prisma.user.findUnique({ where: { email } });
    if (user) {
      const resetToken = crypto.randomBytes(24).toString("hex");
      const resetTokenExpiresAt = new Date(Date.now() + 60 * 60 * 1000);
      await prisma.user.update({
        where: { id: user.id },
        data: { resetToken, resetTokenExpiresAt },
      });
    }

    // Always return generic success to prevent email enumeration
    return NextResponse.json({
      message:
        "If an account exists for that email, a password reset link has been generated.",
    });
  } catch {
    return NextResponse.json({ error: "Request failed" }, { status: 500 });
  }
}
