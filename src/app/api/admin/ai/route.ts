import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { encryptSecret, decryptSecret, maskSecret } from "@/lib/crypto";

export async function GET() {
  try {
    await requireAdmin();
    const [config, usageAgg] = await Promise.all([
      prisma.aiConfig.findUnique({ where: { id: "default" } }),
      prisma.aiConversation.aggregate({
        _sum: { totalTokens: true, estimatedCost: true },
        _count: { id: true },
      }),
    ]);

    return NextResponse.json({
      config: config
        ? {
            isEnabled: config.isEnabled,
            provider: config.provider,
            model: config.model,
            dailyGlobalLimit: config.dailyGlobalLimit,
            monthlyGlobalLimit: config.monthlyGlobalLimit,
            defaultUserDailyLimit: config.defaultUserDailyLimit,
            systemPromptExtra: config.systemPromptExtra,
            hasApiKey: Boolean(config.apiKeyEnc),
            maskedApiKey: config.apiKeyEnc
              ? maskSecret(decryptSecret(config.apiKeyEnc))
              : "",
          }
        : null,
      usage: {
        totalConversations: usageAgg._count.id,
        totalTokens: usageAgg._sum.totalTokens || 0,
        estimatedCost: usageAgg._sum.estimatedCost || 0,
      },
    });
  } catch (err) {
    if (err instanceof Error && err.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (err instanceof Error && err.message === "FORBIDDEN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    return NextResponse.json({ error: "Failed to load AI config" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const admin = await requireAdmin();
    const body = await req.json();

    const data: Record<string, unknown> = {
      isEnabled: Boolean(body.isEnabled),
      provider: body.provider || "openai",
      model: body.model || "gpt-4o-mini",
      dailyGlobalLimit: Number(body.dailyGlobalLimit || 5000),
      monthlyGlobalLimit: Number(body.monthlyGlobalLimit || 100000),
      defaultUserDailyLimit: Number(body.defaultUserDailyLimit || 30),
      systemPromptExtra: body.systemPromptExtra || null,
    };

    if (body.apiKey && String(body.apiKey).trim()) {
      data.apiKeyEnc = encryptSecret(String(body.apiKey).trim());
    }

    await prisma.aiConfig.upsert({
      where: { id: "default" },
      update: data,
      create: { id: "default", ...data },
    });

    await prisma.adminActivityLog.create({
      data: {
        adminId: admin.id,
        action: "ai.config.update",
        target: String(data.provider),
      },
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Failed to update AI config" }, { status: 500 });
  }
}
