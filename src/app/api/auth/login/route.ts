import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
  verifyPassword,
  signSessionToken,
  setSessionCookieOptions,
} from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limit";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Valid email and password are required." },
        { status: 400 }
      );
    }

    const email = parsed.data.email.toLowerCase();
    const ip = req.headers.get("x-forwarded-for") || "local";
    const rl = checkRateLimit(`login:${ip}:${email}`, 50, 60_000 * 5);
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Too many login attempts. Please wait a few minutes." },
        { status: 429 }
      );
    }
    const user = await prisma.user.findUnique({
      where: { email },
      include: { role: true, profile: true, preferences: true },
    });

    if (!user || !user.passwordHash) {
      return NextResponse.json(
        { error: "Invalid email or password." },
        { status: 401 }
      );
    }

    if (user.status !== "active") {
      return NextResponse.json(
        { error: "Your account is currently suspended. Contact support." },
        { status: 403 }
      );
    }

    const valid = await verifyPassword(parsed.data.password, user.passwordHash);
    if (!valid) {
      return NextResponse.json(
        { error: "Invalid email or password." },
        { status: 401 }
      );
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const token = await signSessionToken({
      userId: user.id,
      email: user.email,
      role: user.role.name,
    });

    const res = NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role.name,
        emailVerified: user.emailVerified,
        profile: user.profile,
        preferences: user.preferences,
      },
    });
    res.cookies.set(setSessionCookieOptions(token));
    return res;
  } catch (err) {
    console.error("Login error:", err);
    return NextResponse.json(
      { error: "Unable to sign in. Ensure PostgreSQL is connected." },
      { status: 500 }
    );
  }
}
