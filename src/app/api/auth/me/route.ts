import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, requireUser } from "@/lib/auth";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ user: null });
  }
  return NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role.name,
      emailVerified: user.emailVerified,
      dailyAiLimit: user.dailyAiLimit,
      monthlyAiLimit: user.monthlyAiLimit,
      profile: user.profile,
      preferences: user.preferences,
    },
  });
}

const updateMeSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  profile: z
    .object({
      displayName: z.string().max(100).optional(),
      bio: z.string().max(500).optional(),
      favoriteTranslation: z.string().max(32).optional(),
    })
    .optional(),
  preferences: z
    .object({
      theme: z.enum(["light", "dark", "sepia"]).optional(),
      fontSize: z.number().int().min(12).max(32).optional(),
      fontFamily: z.enum(["serif", "sans", "literata", "georgia"]).optional(),
      lineSpacing: z.number().min(1.2).max(2.6).optional(),
      verseSpacing: z.number().int().min(2).max(28).optional(),
      readingBackground: z
        .enum(["warm-cream", "pure-white", "soft-gray", "night-navy"])
        .optional(),
      brightness: z.number().int().min(50).max(100).optional(),
      defaultAudioSpeed: z.number().min(0.75).max(2.0).optional(),
    })
    .optional(),
});

export async function PATCH(req: NextRequest) {
  try {
    const user = await requireUser();
    const body = await req.json();
    const parsed = updateMeSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid preferences" }, { status: 400 });
    }

    if (parsed.data.name) {
      await prisma.user.update({
        where: { id: user.id },
        data: { name: parsed.data.name },
      });
    }

    if (parsed.data.profile) {
      await prisma.userProfile.upsert({
        where: { userId: user.id },
        update: parsed.data.profile,
        create: { userId: user.id, ...parsed.data.profile },
      });
    }

    if (parsed.data.preferences) {
      await prisma.userPreference.upsert({
        where: { userId: user.id },
        update: parsed.data.preferences,
        create: { userId: user.id, ...parsed.data.preferences },
      });
    }

    const updated = await getCurrentUser();
    return NextResponse.json({ user: updated });
  } catch (err) {
    if (err instanceof Error && err.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }
}
