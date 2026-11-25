import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { BIBLE_BOOKS } from "../src/lib/bible/books";
import { TRANSLATIONS_SEED } from "../src/lib/bible/translations-seed";
import { SAMPLE_CHAPTERS } from "../src/lib/bible/sample-scripture";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding Sanctuary Bible database...");

  // 1. Permissions & Roles
  const permissionKeys = [
    "translations.manage",
    "content.manage",
    "audio.manage",
    "users.manage",
    "ai.manage",
    "settings.manage",
    "analytics.view",
    "plans.manage",
    "notifications.manage",
  ];

  const permissions = await Promise.all(
    permissionKeys.map((key) =>
      prisma.permission.upsert({
        where: { key },
        update: {},
        create: { key, description: `Permission to ${key.replace(".", " ")}` },
      })
    )
  );

  const adminRole = await prisma.role.upsert({
    where: { name: "admin" },
    update: {},
    create: { name: "admin", description: "Full system administrator" },
  });

  await prisma.role.upsert({
    where: { name: "editor" },
    update: {},
    create: { name: "editor", description: "Content and reading plan editor" },
  });

  const userRole = await prisma.role.upsert({
    where: { name: "user" },
    update: {},
    create: { name: "user", description: "Standard registered reader" },
  });

  for (const perm of permissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: { roleId: adminRole.id, permissionId: perm.id },
      },
      update: {},
      create: { roleId: adminRole.id, permissionId: perm.id },
    });
  }

  // 2. Default Admin & Reader Accounts
  const adminPassword = await bcrypt.hash("Admin@Sanctuary2026!", 12);
  const readerPassword = await bcrypt.hash("Reader@Sanctuary2026!", 12);

  await prisma.user.upsert({
    where: { email: "admin@sanctuarybible.app" },
    update: {},
    create: {
      email: "admin@sanctuarybible.app",
      name: "Sanctuary Admin",
      passwordHash: adminPassword,
      emailVerified: true,
      roleId: adminRole.id,
      dailyAiLimit: 500,
      monthlyAiLimit: 10000,
      profile: {
        create: { displayName: "Administrator", favoriteTranslation: "KJV" },
      },
      preferences: { create: {} },
    },
  });

  await prisma.user.upsert({
    where: { email: "adityavermaweb93@gmail.com" },
    update: { roleId: adminRole.id },
    create: {
      email: "adityavermaweb93@gmail.com",
      name: "Aditya Verma",
      passwordHash: adminPassword,
      emailVerified: true,
      roleId: adminRole.id,
      dailyAiLimit: 500,
      monthlyAiLimit: 10000,
      profile: {
        create: { displayName: "Aditya Verma", favoriteTranslation: "KJV" },
      },
      preferences: { create: {} },
    },
  });

  await prisma.user.upsert({
    where: { email: "reader@sanctuarybible.app" },
    update: {},
    create: {
      email: "reader@sanctuarybible.app",
      name: "Grace Reader",
      passwordHash: readerPassword,
      emailVerified: true,
      roleId: userRole.id,
      profile: {
        create: { displayName: "Grace", favoriteTranslation: "WEB" },
      },
      preferences: { create: {} },
    },
  });

  // 3. Bible Providers
  const localProvider = await prisma.bibleProvider.upsert({
    where: { slug: "local-pd" },
    update: {},
    create: {
      name: "Public Domain & Open License Adapter",
      slug: "local-pd",
      baseUrl: "https://bible-api.com",
      isActive: true,
      notes: "Serves verified public domain and CC0 Bible translations.",
    },
  });

  const apiBibleProvider = await prisma.bibleProvider.upsert({
    where: { slug: "api-bible" },
    update: {},
    create: {
      name: "API.Bible (American Bible Society)",
      slug: "api-bible",
      baseUrl: "https://api.scripture.api.bible/v1",
      isActive: false,
      notes: "Requires API.Bible key and publisher approval per translation.",
    },
  });

  const esvProvider = await prisma.bibleProvider.upsert({
    where: { slug: "esv-api" },
    update: {},
    create: {
      name: "Crossway ESV API",
      slug: "esv-api",
      baseUrl: "https://api.esv.org/v3",
      isActive: false,
      notes: "Requires Crossway ESV API token and terms compliance.",
    },
  });

  const providerMap: Record<string, string> = {
    "local-pd": localProvider.id,
    "api-bible": apiBibleProvider.id,
    "esv-api": esvProvider.id,
  };

  // 4. All 52 Bible Translations
  for (const t of TRANSLATIONS_SEED) {
    const translation = await prisma.bibleTranslation.upsert({
      where: { abbreviation: t.abbreviation },
      update: {
        fullName: t.fullName,
        publisher: t.publisher,
        copyrightInfo: t.copyrightInfo,
        licenseInfo: t.licenseInfo,
        displayOrder: t.displayOrder,
      },
      create: {
        abbreviation: t.abbreviation,
        fullName: t.fullName,
        publisher: t.publisher,
        copyrightInfo: t.copyrightInfo,
        licenseInfo: t.licenseInfo,
        providerId: providerMap[t.providerSlug] || localProvider.id,
        externalBibleId: t.externalBibleId,
        availabilityStatus: t.availabilityStatus,
        isActive: t.isActive,
        testamentAvail: t.testamentAvail,
        audioAvailable: t.audioAvailable,
        allowAiContext: t.allowAiContext,
        displayOrder: t.displayOrder,
      },
    });

    const existingLicense = await prisma.translationLicense.findFirst({
      where: { translationId: translation.id },
    });
    if (!existingLicense) {
      await prisma.translationLicense.create({
        data: {
          translationId: translation.id,
          licenseType:
            t.availabilityStatus === "available"
              ? "Public Domain / Open"
              : "Commercial License Required",
          licensor: t.publisher,
          permitText: t.availabilityStatus === "available",
          permitAudio: t.audioAvailable,
          permitAi: t.allowAiContext,
          permitCache: t.availabilityStatus === "available",
          notes: t.licenseInfo,
        },
      });
    }
  }

  // 5. All 66 Bible Books & Chapters
  for (const b of BIBLE_BOOKS) {
    await prisma.bibleBook.upsert({
      where: { id: b.id },
      update: {
        name: b.name,
        chapterCount: b.chapterCount,
        category: b.category,
        displayOrder: b.displayOrder,
      },
      create: {
        id: b.id,
        osisCode: b.osisCode,
        name: b.name,
        testament: b.testament,
        category: b.category,
        chapterCount: b.chapterCount,
        displayOrder: b.displayOrder,
      },
    });

    const chapterRows = Array.from({ length: b.chapterCount }, (_, idx) => ({
      bookId: b.id,
      chapterNum: idx + 1,
    }));
    await prisma.bibleChapter.createMany({
      data: chapterRows,
      skipDuplicates: true,
    });
  }

  // 6. Seed Sample Public Domain Verses
  const kjv = await prisma.bibleTranslation.findUnique({ where: { abbreviation: "KJV" } });
  const web = await prisma.bibleTranslation.findUnique({ where: { abbreviation: "WEB" } });

  for (const [key, verses] of Object.entries(SAMPLE_CHAPTERS)) {
    const [abbr, bookStr, chapStr] = key.split(":");
    const trans = abbr === "KJV" ? kjv : web;
    if (!trans) continue;
    await prisma.bibleVerse.createMany({
      data: verses.map((v) => ({
        translationId: trans.id,
        bookId: Number(bookStr),
        chapterNum: Number(chapStr),
        verseNum: v.verseNum,
        text: v.text,
      })),
      skipDuplicates: true,
    });
  }

  // 7. Reading Plans
  const plans = [
    {
      slug: "7-day-foundations",
      title: "7-Day Foundations of Faith",
      description: "Explore core passages on creation, grace, prayer, and hope in one week.",
      durationDays: 7,
      category: "Foundational",
      isFeatured: true,
      days: [
        { dayNumber: 1, title: "In the Beginning", passages: [{ bookId: 1, bookName: "Genesis", startChapter: 1, endChapter: 1 }] },
        { dayNumber: 2, title: "The Good Shepherd", passages: [{ bookId: 19, bookName: "Psalms", startChapter: 23, endChapter: 23 }] },
        { dayNumber: 3, title: "The Sermon on the Mount", passages: [{ bookId: 40, bookName: "Matthew", startChapter: 5, endChapter: 5 }] },
        { dayNumber: 4, title: "God So Loved the World", passages: [{ bookId: 43, bookName: "John", startChapter: 3, endChapter: 3 }] },
        { dayNumber: 5, title: "Life in the Spirit", passages: [{ bookId: 45, bookName: "Romans", startChapter: 8, endChapter: 8 }] },
        { dayNumber: 6, title: "The Way of Love", passages: [{ bookId: 46, bookName: "1 Corinthians", startChapter: 13, endChapter: 13 }] },
        { dayNumber: 7, title: "All Things New", passages: [{ bookId: 66, bookName: "Revelation", startChapter: 21, endChapter: 21 }] },
      ],
    },
    {
      slug: "30-day-gospels",
      title: "30-Day Walk Through the Gospels",
      description: "Read key chapters from Matthew, Mark, Luke, and John over 30 days.",
      durationDays: 30,
      category: "New Testament",
      isFeatured: true,
      days: Array.from({ length: 30 }, (_, i) => ({
        dayNumber: i + 1,
        title: `Day ${i + 1}: Life & Teachings of Jesus`,
        passages: [{ bookId: 43, bookName: "John", startChapter: (i % 21) + 1, endChapter: (i % 21) + 1 }],
      })),
    },
    {
      slug: "90-day-new-testament",
      title: "90-Day New Testament Journey",
      description: "Read the entire New Testament in 90 focused daily readings.",
      durationDays: 90,
      category: "New Testament",
      isFeatured: false,
      days: Array.from({ length: 90 }, (_, i) => ({
        dayNumber: i + 1,
        title: `NT Day ${i + 1}`,
        passages: [{ bookId: 40 + (i % 27), bookName: BIBLE_BOOKS[39 + (i % 27)].name, startChapter: 1, endChapter: 1 }],
      })),
    },
    {
      slug: "365-day-whole-bible",
      title: "365-Day Whole Bible Plan",
      description: "A balanced daily journey through Genesis to Revelation in one year.",
      durationDays: 365,
      category: "Full Bible",
      isFeatured: true,
      days: Array.from({ length: 365 }, (_, i) => {
        const b = BIBLE_BOOKS[i % 66];
        const ch = (i % b.chapterCount) + 1;
        return {
          dayNumber: i + 1,
          title: `Day ${i + 1}: ${b.name} ${ch}`,
          passages: [{ bookId: b.id, bookName: b.name, startChapter: ch, endChapter: ch }],
        };
      }),
    },
    {
      slug: "psalms-and-proverbs",
      title: "31-Day Psalms & Proverbs Wisdom",
      description: "Daily worship from Psalms paired with practical wisdom from Proverbs.",
      durationDays: 31,
      category: "Wisdom",
      isFeatured: true,
      days: Array.from({ length: 31 }, (_, i) => ({
        dayNumber: i + 1,
        title: `Wisdom Day ${i + 1}`,
        passages: [
          { bookId: 19, bookName: "Psalms", startChapter: i + 1, endChapter: i + 1 },
          { bookId: 20, bookName: "Proverbs", startChapter: i + 1, endChapter: i + 1 },
        ],
      })),
    },
  ];

  for (const p of plans) {
    const plan = await prisma.readingPlan.upsert({
      where: { slug: p.slug },
      update: { title: p.title, description: p.description, isFeatured: p.isFeatured },
      create: {
        slug: p.slug,
        title: p.title,
        description: p.description,
        durationDays: p.durationDays,
        category: p.category,
        isFeatured: p.isFeatured,
        isActive: true,
      },
    });
    for (const d of p.days) {
      await prisma.readingPlanDay.upsert({
        where: { planId_dayNumber: { planId: plan.id, dayNumber: d.dayNumber } },
        update: {},
        create: {
          planId: plan.id,
          dayNumber: d.dayNumber,
          title: d.title,
          passages: d.passages,
        },
      });
    }
  }

  // 8. Audio Source (Public Domain Permitted)
  await prisma.audioSource.upsert({
    where: { name: "Public Domain Web Speech / Open Audio" },
    update: {},
    create: {
      name: "Public Domain Web Speech / Open Audio",
      providerType: "permitted_tts",
      licenseConfirmed: true,
      isActive: true,
      notes: "Permitted ONLY for Public Domain translations (KJV, WEB, BSB, ASV, YLT, DRB, OEB, BBE).",
    },
  });

  // 9. AI Config & App Settings
  await prisma.aiConfig.upsert({
    where: { id: "default" },
    update: {},
    create: {
      id: "default",
      isEnabled: true,
      provider: "openai",
      model: "gpt-4o-mini",
      dailyGlobalLimit: 5000,
      monthlyGlobalLimit: 100000,
      defaultUserDailyLimit: 30,
    },
  });

  const defaultSettings: Record<string, object> = {
    branding: {
      appName: "Sanctuary Bible",
      tagline: "Read, Study & Reflect in Scripture",
      primaryColor: "#1b263b",
      accentColor: "#b4833e",
      defaultTheme: "light",
      defaultFont: "serif",
      logoText: "SB",
    },
    homepage: {
      welcomeTitle: "Welcome to Sanctuary Bible",
      welcomeSubtitle: "A quiet, modern space for daily Scripture reading, study, and reflection.",
      showContinueReading: true,
      showDailyVerse: true,
      showReadingPlans: true,
      showBookmarks: true,
      showNotes: true,
      showAudioHistory: true,
      showExploreBooks: true,
      dailyVerseRef: "John 3:16",
      dailyVerseBookId: 43,
      dailyVerseChapter: 3,
      dailyVerseNum: 16,
    },
    legal: {
      aboutText: "Sanctuary Bible is a modern English Bible reading and study platform built with respect for Scripture copyright and licensing.",
      contactEmail: "support@sanctuarybible.app",
      privacyPolicy: "We respect your privacy. Your personal notes, bookmarks, and highlights remain private to your account. Analytics use daily-salted hashes without storing raw IP addresses.",
      termsText: "Public domain translations are provided freely. Copyrighted translations remain the property of their respective publishers and are enabled only under valid license.",
    },
    system: {
      maintenanceMode: false,
      appVersion: "1.0.0",
    },
  };

  for (const [id, value] of Object.entries(defaultSettings)) {
    await prisma.appSetting.upsert({
      where: { id },
      update: {},
      create: { id, value },
    });
  }

  console.log("Seed completed successfully (66 books, 52 translations, 5 reading plans, admin & reader accounts).");
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
