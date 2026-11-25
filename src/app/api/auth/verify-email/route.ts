import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { token } = await req.json();
    if (!token || typeof token !== "string") {
      return NextResponse.json({ error: "Invalid verification token" }, { status: 400 });
    }
    const user = await prisma.user.findFirst({ where: { verificationToken: token } });
    if (!user) {
      return NextResponse.json({ error: "Token not found" }, { status: 404 });
    }
    await prisma.user.update({
      where: { id: user.id },
      data: { emailVerified: true, verificationToken: null },
    });
    return NextResponse.json({ message: "Email verified successfully." });
  } catch {
    return NextResponse.json({ error: "Verification failed" }, { status: 500 });
  }
}
