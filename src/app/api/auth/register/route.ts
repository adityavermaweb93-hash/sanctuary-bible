import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
  hashPassword,
  signSessionToken,
  setSessionCookieOptions,
} from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limit";

const registerSchema = z.object({
  email: z.string().email().max(255),
  password: z.string().min(8).max(128),
  name: z.string().min(1).max(100).trim(),
});

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") || "local";
  const rl = checkRateLimit(`register:${ip}`, 10, 60_000 * 15);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Too many registration attempts. Please try again later." },
      { status: 429 }
    );
  }

  try {
    const body = await req.json();
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid input" },
        { status: 400 }
      );
    }

    const email = parsed.data.email.toLowerCase();
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: "An account with this email already exists." },
        { status: 409 }
      );
    }

    const isOwnerAdmin = email === "adityavermaweb93@gmail.com";
    const assignedRole = await prisma.role.upsert({
      where: { name: isOwnerAdmin ? "admin" : "user" },
      update: {},
      create: {
        name: isOwnerAdmin ? "admin" : "user",
        description: isOwnerAdmin
          ? "Full system administrator"
          : "Standard registered reader",
      },
    });

    const passwordHash = await hashPassword(parsed.data.password);
    const verificationToken = crypto.randomBytes(24).toString("hex");

    const user = await prisma.user.create({
      data: {
        email,
        name: parsed.data.name,
        passwordHash,
        verificationToken,
        roleId: assignedRole.id,
        profile: {
          create: {
            displayName: parsed.data.name,
            favoriteTranslation: "WEB",
          },
        },
        preferences: {
          create: {},
        },
      },
      include: { role: true, profile: true, preferences: true },
    });

    const token = await signSessionToken({
      userId: user.id,
      email: user.email,
      role: user.role.name,
    });

    const res = NextResponse.json(
      {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role.name,
          emailVerified: user.emailVerified,
          profile: user.profile,
          preferences: user.preferences,
        },
      },
      { status: 201 }
    );
    res.cookies.set(setSessionCookieOptions(token));
    return res;
  } catch (err) {
    console.error("Register error:", err);
    return NextResponse.json(
      { error: "Unable to create account. Ensure PostgreSQL is connected." },
      { status: 500 }
    );
  }
}
