import { prisma } from "@/lib/prisma";
import { decryptSecret } from "@/lib/crypto";
import { BIBLE_BOOKS } from "./books";
import { SAMPLE_CHAPTERS, VerseItem } from "./sample-scripture";

export interface ChapterFetchResult {
  translation: {
    id: string;
    abbreviation: string;
    fullName: string;
    copyrightInfo: string | null;
    licenseInfo: string | null;
    audioAvailable: boolean;
    allowAiContext: boolean;
  };
  book: {
    id: number;
    name: string;
    osisCode: string;
    testament: string;
    chapterCount: number;
  };
  chapterNum: number;
  verses: VerseItem[];
  source: "database" | "public_domain_api" | "provider_api" | "fallback";
}

const PUBLIC_DOMAIN_API_IDS = new Set([
  "kjv",
  "web",
  "asv",
  "bbe",
  "ylt",
  "dra",
  "oeb-us",
]);

/**
 * Fetches a chapter using the configured translation adapter.
 * Respects licensing: never fetches or returns text for inactive or unlicensed translations.
 */
export async function getBibleChapter(
  translationAbbr: string,
  bookId: number,
  chapterNum: number
): Promise<ChapterFetchResult> {
  const book = BIBLE_BOOKS.find((b) => b.id === bookId);
  if (!book) {
    throw new Error("BOOK_NOT_FOUND");
  }
  if (chapterNum < 1 || chapterNum > book.chapterCount) {
    throw new Error("CHAPTER_NOT_FOUND");
  }

  // Try database lookup for translation metadata
  let translationRecord: {
    id: string;
    abbreviation: string;
    fullName: string;
    copyrightInfo: string | null;
    licenseInfo: string | null;
    externalBibleId: string | null;
    availabilityStatus: string;
    isActive: boolean;
    audioAvailable: boolean;
    allowAiContext: boolean;
    provider: {
      slug: string;
      baseUrl: string | null;
      apiKeyEnc: string | null;
    } | null;
  } | null = null;

  try {
    translationRecord = await prisma.bibleTranslation.findUnique({
      where: { abbreviation: translationAbbr },
      include: {
        provider: {
          select: { slug: true, baseUrl: true, apiKeyEnc: true },
        },
      },
    });
  } catch {
    // DB might not be connected yet; allow public domain fallback for KJV/WEB
  }

  if (translationRecord) {
    if (
      !translationRecord.isActive ||
      translationRecord.availabilityStatus !== "available"
    ) {
      throw new Error("TRANSLATION_NOT_LICENSED");
    }

    // 1. Check PostgreSQL BibleVerse cache first
    try {
      const cached = await prisma.bibleVerse.findMany({
        where: {
          translationId: translationRecord.id,
          bookId,
          chapterNum,
        },
        orderBy: { verseNum: "asc" },
        select: { verseNum: true, text: true },
      });
      if (cached.length > 0) {
        return {
          translation: {
            id: translationRecord.id,
            abbreviation: translationRecord.abbreviation,
            fullName: translationRecord.fullName,
            copyrightInfo: translationRecord.copyrightInfo,
            licenseInfo: translationRecord.licenseInfo,
            audioAvailable: translationRecord.audioAvailable,
            allowAiContext: translationRecord.allowAiContext,
          },
          book,
          chapterNum,
          verses: cached,
          source: "database",
        };
      }
    } catch {
      // Ignore DB read errors and fall through to adapter
    }

    // 2. Route to Provider Adapter
    const providerSlug = translationRecord.provider?.slug || "local-pd";
    const externalId =
      translationRecord.externalBibleId ||
      translationRecord.abbreviation.toLowerCase();

    if (providerSlug === "api-bible" && translationRecord.provider?.apiKeyEnc) {
      const apiKey = decryptSecret(translationRecord.provider.apiKeyEnc);
      if (apiKey && translationRecord.externalBibleId) {
        const verses = await fetchFromApiBible(
          apiKey,
          translationRecord.externalBibleId,
          book.osisCode,
          chapterNum
        );
        return {
          translation: {
            id: translationRecord.id,
            abbreviation: translationRecord.abbreviation,
            fullName: translationRecord.fullName,
            copyrightInfo: translationRecord.copyrightInfo,
            licenseInfo: translationRecord.licenseInfo,
            audioAvailable: translationRecord.audioAvailable,
            allowAiContext: translationRecord.allowAiContext,
          },
          book,
          chapterNum,
          verses,
          source: "provider_api",
        };
      }
    }

    if (providerSlug === "esv-api" && translationRecord.provider?.apiKeyEnc) {
      const apiKey = decryptSecret(translationRecord.provider.apiKeyEnc);
      if (apiKey) {
        const verses = await fetchFromEsvApi(apiKey, book.name, chapterNum);
        return {
          translation: {
            id: translationRecord.id,
            abbreviation: translationRecord.abbreviation,
            fullName: translationRecord.fullName,
            copyrightInfo: translationRecord.copyrightInfo,
            licenseInfo: translationRecord.licenseInfo,
            audioAvailable: translationRecord.audioAvailable,
            allowAiContext: translationRecord.allowAiContext,
          },
          book,
          chapterNum,
          verses,
          source: "provider_api",
        };
      }
    }

    // Public-domain adapter (bible-api.com supports kjv, web, bbe, ylt, dra, oeb-us, asv)
    if (PUBLIC_DOMAIN_API_IDS.has(externalId)) {
      const verses = await fetchFromPublicDomainApi(
        externalId,
        book.name,
        chapterNum
      );
      if (verses.length > 0) {
        // Cache public-domain verses in PostgreSQL for fast subsequent reads & search
        try {
          await prisma.bibleVerse.createMany({
            data: verses.map((v) => ({
              translationId: translationRecord!.id,
              bookId,
              chapterNum,
              verseNum: v.verseNum,
              text: v.text,
            })),
            skipDuplicates: true,
          });
        } catch {
          // Non-fatal if cache write fails
        }
        return {
          translation: {
            id: translationRecord.id,
            abbreviation: translationRecord.abbreviation,
            fullName: translationRecord.fullName,
            copyrightInfo: translationRecord.copyrightInfo,
            licenseInfo: translationRecord.licenseInfo,
            audioAvailable: translationRecord.audioAvailable,
            allowAiContext: translationRecord.allowAiContext,
          },
          book,
          chapterNum,
          verses,
          source: "public_domain_api",
        };
      }
    }
  }

  // Fallback for public-domain KJV/WEB when DB is uninitialized
  const upper = translationAbbr.toUpperCase();
  if (upper === "KJV" || upper === "WEB" || upper === "ASV" || upper === "BBE") {
    const pdId = upper === "KJV" ? "kjv" : upper === "WEB" ? "web" : upper.toLowerCase();
    const apiVerses = await fetchFromPublicDomainApi(pdId, book.name, chapterNum);
    if (apiVerses.length > 0) {
      return {
        translation: {
          id: upper.toLowerCase(),
          abbreviation: upper,
          fullName:
            upper === "KJV"
              ? "King James Version"
              : upper === "WEB"
                ? "World English Bible"
                : upper === "ASV"
                  ? "American Standard Version"
                  : "Bible in Basic English",
          copyrightInfo: "Public Domain",
          licenseInfo: "Public Domain",
          audioAvailable: upper === "KJV" || upper === "WEB",
          allowAiContext: true,
        },
        book,
        chapterNum,
        verses: apiVerses,
        source: "public_domain_api",
      };
    }

    const sampleKey = `${upper}:${bookId}:${chapterNum}`;
    if (SAMPLE_CHAPTERS[sampleKey]) {
      return {
        translation: {
          id: upper.toLowerCase(),
          abbreviation: upper,
          fullName: upper === "KJV" ? "King James Version" : "World English Bible",
          copyrightInfo: "Public Domain",
          licenseInfo: "Public Domain",
          audioAvailable: true,
          allowAiContext: true,
        },
        book,
        chapterNum,
        verses: SAMPLE_CHAPTERS[sampleKey],
        source: "fallback",
      };
    }
  }

  throw new Error("CHAPTER_UNAVAILABLE");
}

async function fetchFromPublicDomainApi(
  pdTranslationId: string,
  bookName: string,
  chapterNum: number
): Promise<VerseItem[]> {
  try {
    const ref = encodeURIComponent(`${bookName} ${chapterNum}`);
    const res = await fetch(
      `https://bible-api.com/${ref}?translation=${encodeURIComponent(pdTranslationId)}`,
      { next: { revalidate: 86400 } }
    );
    if (!res.ok) return [];
    const data = await res.json();
    if (!Array.isArray(data.verses)) return [];
    return data.verses.map((v: { verse: number; text: string }) => ({
      verseNum: Number(v.verse),
      text: String(v.text).replace(/\s+/g, " ").trim(),
    }));
  } catch {
    return [];
  }
}

async function fetchFromApiBible(
  apiKey: string,
  bibleId: string,
  osisBook: string,
  chapterNum: number
): Promise<VerseItem[]> {
  const chapterId = `${osisBook.toUpperCase()}.${chapterNum}`;
  const res = await fetch(
    `https://api.scripture.api.bible/v1/bibles/${encodeURIComponent(bibleId)}/chapters/${encodeURIComponent(chapterId)}?content-type=text&include-verse-numbers=true`,
    {
      headers: { "api-key": apiKey },
      cache: "no-store", // Respect provider caching terms
    }
  );
  if (!res.ok) {
    throw new Error("PROVIDER_API_ERROR");
  }
  const json = await res.json();
  const rawContent: string = json?.data?.content || "";
  return parseNumberedVerses(rawContent);
}

async function fetchFromEsvApi(
  apiKey: string,
  bookName: string,
  chapterNum: number
): Promise<VerseItem[]> {
  const q = encodeURIComponent(`${bookName} ${chapterNum}`);
  const res = await fetch(
    `https://api.esv.org/v3/passage/text/?q=${q}&include-passage-references=false&include-verse-numbers=true&include-first-verse-numbers=true&include-headings=false&include-footnotes=false`,
    {
      headers: { Authorization: `Token ${apiKey}` },
      cache: "no-store",
    }
  );
  if (!res.ok) {
    throw new Error("PROVIDER_API_ERROR");
  }
  const json = await res.json();
  const passage = (json?.passages?.[0] as string) || "";
  return parseNumberedVerses(passage);
}

function parseNumberedVerses(text: string): VerseItem[] {
  const matches = [...text.matchAll(/\[(\d+)\]\s*([^\[]+)/g)];
  if (matches.length === 0) {
    return text.trim() ? [{ verseNum: 1, text: text.trim() }] : [];
  }
  return matches.map((m) => ({
    verseNum: Number(m[1]),
    text: m[2].replace(/\s+/g, " ").trim(),
  }));
}
