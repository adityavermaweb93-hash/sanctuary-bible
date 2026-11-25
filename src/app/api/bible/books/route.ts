import { NextResponse } from "next/server";
import { BIBLE_BOOKS } from "@/lib/bible/books";

export async function GET() {
  return NextResponse.json({ books: BIBLE_BOOKS });
}
