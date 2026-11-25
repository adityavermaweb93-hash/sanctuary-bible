import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { decryptSecret } from "@/lib/crypto";
import { checkRateLimit } from "@/lib/rate-limit";

const chatSchema = z.object({
  conversationId: z.string().optional(),
  message: z.string().min(1).max(2000).trim(),
  contextRef: z.string().max(100).optional(),
  translationAbbr: z.string().max(32).optional(),
});

const STRICT_BIBLE_SYSTEM_PROMPT = `You are the Sanctuary AI Bible Study Assistant.
Follow these rules strictly:
1. You must ONLY answer questions related to the Bible, Scripture, biblical history, biblical characters, Christian theology/teachings, parables, prophecies, biblical languages/terminology, and practical application of Scripture.
2. Politely redirect any unrelated questions (coding, general trivia, entertainment, math, etc.) back to Bible study.
3. Prioritize the Bible as your primary source and always include specific, accurate Bible references (e.g., John 3:16, Romans 8:1-4).
4. Clearly distinguish direct biblical statements from theological interpretation.
5. Acknowledge respectfully when different Christian traditions interpret a passage differently.
6. Never invent or fabricate Bible verses or references. Never present uncertain historical details as confirmed facts.
7. Keep responses clear, reverent, structured, and helpful for personal study.`;

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    const rl = checkRateLimit(`ai:${user.id}`, 15, 60_000);
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "You are sending messages too quickly. Please wait a moment." },
        { status: 429 }
      );
    }

    const body = await req.json();
    const parsed = chatSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid message" }, { status: 400 });
    }

    const aiConfig = await prisma.aiConfig.findUnique({ where: { id: "default" } });
    if (aiConfig && !aiConfig.isEnabled) {
      return NextResponse.json(
        { error: "The AI Bible Assistant is currently disabled by the administrator." },
        { status: 503 }
      );
    }

    // Check user daily limit
    const dayStart = new Date();
    dayStart.setUTCHours(0, 0, 0, 0);
    const todayUserCount = await prisma.aiMessage.count({
      where: {
        role: "user",
        createdAt: { gte: dayStart },
        conversation: { userId: user.id },
      },
    });
    if (todayUserCount >= user.dailyAiLimit) {
      return NextResponse.json(
        { error: `Daily AI question limit (${user.dailyAiLimit}) reached.` },
        { status: 429 }
      );
    }

    // Resolve API key from Admin DB or env
    const provider = aiConfig?.provider || "openai";
    const model = aiConfig?.model || "gpt-4o-mini";
    let apiKey = aiConfig?.apiKeyEnc ? decryptSecret(aiConfig.apiKeyEnc) : "";
    if (!apiKey) {
      if (provider === "openai") apiKey = process.env.OPENAI_API_KEY || "";
      if (provider === "anthropic") apiKey = process.env.ANTHROPIC_API_KEY || "";
      if (provider === "gemini") apiKey = process.env.GEMINI_API_KEY || "";
    }

    if (!apiKey) {
      return NextResponse.json(
        {
          error:
            "AI provider API key is not configured yet. An administrator can configure OpenAI, Anthropic, or Gemini in Admin > AI Management.",
        },
        { status: 503 }
      );
    }

    // Copyright check: NEVER send copyrighted translation text to AI
    let contextNote = "";
    if (parsed.data.contextRef) {
      contextNote = `\n[User is currently studying: ${parsed.data.contextRef}]`;
      if (parsed.data.translationAbbr) {
        const trans = await prisma.bibleTranslation.findUnique({
          where: { abbreviation: parsed.data.translationAbbr },
          select: { allowAiContext: true },
        });
        if (!trans?.allowAiContext) {
          contextNote += " (Note: Do not quote copyrighted translation text; cite references and explain using public domain or original concepts.)";
        }
      }
    }

    // Load or create conversation
    let conversation = parsed.data.conversationId
      ? await prisma.aiConversation.findFirst({
          where: { id: parsed.data.conversationId, userId: user.id },
          include: { messages: { orderBy: { createdAt: "asc" }, take: 12 } },
        })
      : null;

    if (!conversation) {
      conversation = await prisma.aiConversation.create({
        data: {
          userId: user.id,
          title: parsed.data.message.slice(0, 60),
          contextRef: parsed.data.contextRef || null,
        },
        include: { messages: true },
      });
    }

    await prisma.aiMessage.create({
      data: {
        conversationId: conversation.id,
        role: "user",
        content: parsed.data.message,
      },
    });

    const systemPrompt =
      STRICT_BIBLE_SYSTEM_PROMPT +
      (aiConfig?.systemPromptExtra ? `\n${aiConfig.systemPromptExtra}` : "");

    const historyMessages = conversation.messages.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }));
    historyMessages.push({
      role: "user",
      content: `${parsed.data.message}${contextNote}`,
    });

    const { reply, tokensUsed } = await callAiProvider({
      provider,
      model,
      apiKey,
      systemPrompt,
      messages: historyMessages,
    });

    const assistantMsg = await prisma.aiMessage.create({
      data: {
        conversationId: conversation.id,
        role: "assistant",
        content: reply,
        tokensUsed,
      },
    });

    await prisma.aiConversation.update({
      where: { id: conversation.id },
      data: {
        totalTokens: { increment: tokensUsed },
        estimatedCost: { increment: (tokensUsed / 1000) * 0.0006 },
      },
    });

    return NextResponse.json({
      conversationId: conversation.id,
      message: assistantMsg,
    });
  } catch (err) {
    if (err instanceof Error && err.message === "UNAUTHORIZED") {
      return NextResponse.json(
        { error: "Please sign in to use the AI Bible Study Assistant." },
        { status: 401 }
      );
    }
    console.error("AI chat error:", err);
    return NextResponse.json(
      { error: "Unable to complete AI request. Check provider configuration." },
      { status: 500 }
    );
  }
}

async function callAiProvider(opts: {
  provider: string;
  model: string;
  apiKey: string;
  systemPrompt: string;
  messages: { role: "user" | "assistant"; content: string }[];
}): Promise<{ reply: string; tokensUsed: number }> {
  if (opts.provider === "anthropic") {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": opts.apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: opts.model,
        max_tokens: 1024,
        system: opts.systemPrompt,
        messages: opts.messages,
      }),
    });
    if (!res.ok) throw new Error("Anthropic API error");
    const data = await res.json();
    const reply = data?.content?.[0]?.text || "No response generated.";
    const tokensUsed =
      (data?.usage?.input_tokens || 0) + (data?.usage?.output_tokens || 0);
    return { reply, tokensUsed };
  }

  if (opts.provider === "gemini") {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(opts.model)}:generateContent?key=${encodeURIComponent(opts.apiKey)}`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: opts.systemPrompt }] },
        contents: opts.messages.map((m) => ({
          role: m.role === "assistant" ? "model" : "user",
          parts: [{ text: m.content }],
        })),
      }),
    });
    if (!res.ok) throw new Error("Gemini API error");
    const data = await res.json();
    const reply =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "No response generated.";
    const tokensUsed = data?.usageMetadata?.totalTokenCount || 0;
    return { reply, tokensUsed };
  }

  // Default: OpenAI
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${opts.apiKey}`,
    },
    body: JSON.stringify({
      model: opts.model,
      messages: [
        { role: "system", content: opts.systemPrompt },
        ...opts.messages,
      ],
      temperature: 0.4,
      max_tokens: 1000,
    }),
  });
  if (!res.ok) throw new Error("OpenAI API error");
  const data = await res.json();
  const reply = data?.choices?.[0]?.message?.content || "No response generated.";
  const tokensUsed = data?.usage?.total_tokens || 0;
  return { reply, tokensUsed };
}
