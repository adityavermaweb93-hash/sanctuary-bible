# Sanctuary Bible — Production English Bible Application

Sanctuary Bible is a full-stack, database-backed English Bible reading and study platform built with **Next.js (App Router)**, **React**, **TypeScript**, **Tailwind CSS**, and **PostgreSQL (Prisma ORM)**.

---

## Features Implemented

- **52-Translation Management & Adapter System**: All 52 requested English translations are modeled and seeded with publisher, copyright, license, testament, audio, and AI-context permissions. Public-domain translations (`KJV`, `WEB`, `BSB`, `ASV`, `YLT`, `DRB`, `OEB`, `BBE`) work immediately; copyrighted translations (`NKJV`, `ESV`, `NIV`, `NLT`, `NASB`, etc.) are marked `not_yet_licensed` or `coming_soon` until an authorized provider key and license are configured.
- **Bible Reader (`/bible`)**: Full 66-book navigation (OT & NT), chapter/verse navigation, instant translation switching, Light/Sepia/Dark themes, font size/family/line-spacing controls, verse contextual menu (Highlight in 5 colors, Bookmark, Add Note, Copy, Share, Listen, Ask AI, Side-by-Side Translation Comparison).
- **Personal Notes System (`/notes`)**: Folders/categories, search, autosave, accidental-loss protection, **Option A: Save in App** (PostgreSQL), and **Option B: Save to Gallery** (high-resolution 1080×1350 PNG card generator with native share/download).
- **Bible Audio Player (`/audio` & persistent bottom bar)**: Playback speeds `0.75x`–`2x`, verse-by-verse progression, licensed audio track support + permitted public-domain synthesis, and listening history.
- **AI Bible Study Assistant (floating bottom-right drawer)**: Strictly Scripture-focused assistant with automatic verse context, quick prompts, user & global rate/token limits, and copyright protection (copyrighted text is never sent to AI providers). Configurable for OpenAI, Anthropic, or Google Gemini.
- **Reading Plans (`/plans`)**: 7-day, 30-day, 90-day, 365-day, and Psalms & Proverbs plans with progress tracking and pause/resume.
- **Admin Control Panel (`/admin`)**: Real privacy-conscious analytics (Visitors, Page Views, DAU/WAU/MAU, Chapter Views, Top Books, Top Translations, selectable date ranges), Translation & Provider management, Audio source management, User & Role management, AI config & cost monitoring, App Branding/Homepage/Legal customization, Notifications, and System Activity Logs.

---

## 1. How to Run the Application

```bash
cd bible-app
npm install
cp .env.example .env
# Edit .env with your PostgreSQL DATABASE_URL, JWT_SECRET, and ENCRYPTION_KEY
npx prisma db push
npx prisma db seed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## 2. Database Configuration (PostgreSQL)

Update `DATABASE_URL` in `.env`:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/bible_app?schema=public"
```

Push the schema and run the seed script:

```bash
npx prisma generate
npx prisma db push
npx prisma db seed
```

The seed script creates:
- 4 RBAC roles (`admin`, `editor`, `user`) & 9 permissions
- All 66 canonical Bible books and chapters
- All 52 English Bible translation entries & license records
- Sample public-domain chapters (`KJV`, `WEB`)
- 5 Reading Plans (7, 30, 31, 90, 365 days)
- Default Admin & Reader accounts

---

## 3. Accessing the Admin Panel

Navigate to `/admin` (or sign in at `/profile`).

Seeded accounts:
- **Admin**: `admin@sanctuarybible.app` / `Admin@Sanctuary2026!`
- **Reader**: `reader@sanctuarybible.app` / `Reader@Sanctuary2026!`

> **Important:** Change the seeded admin password immediately in production.

---

## 4. Connecting Bible APIs & Adding Licensed Translations

1. Sign in as Admin and open **Admin → Translations (52)**.
2. Under **Bible API Providers**, enter your encrypted API key for **API.Bible** (`api.scripture.api.bible`) or **Crossway ESV API** (`api.esv.org`).
3. Locate the translation in the table, set its `externalBibleId` (if using API.Bible), update `availabilityStatus` to `available`, and check **Active**.
4. Click **Test** to verify live passage retrieval.

---

## 5. Configuring the AI Bible Study Assistant

1. Open **Admin → AI Assistant**.
2. Choose your provider (`openai`, `anthropic`, or `gemini`) and model (e.g., `gpt-4o-mini`, `claude-3-5-sonnet-latest`, `gemini-2.5-flash`).
3. Enter your API key (stored encrypted with AES-256-GCM in PostgreSQL using `ENCRYPTION_KEY`) and configure daily/monthly global & user limits.

---

## 6. Configuring Audio Sources

1. Open **Admin → Audio**.
2. Add a licensed audio source (`licensed_mp3`, `bible_brain`, or `permitted_tts` for public-domain translations) with license confirmation enabled.
3. Map `AudioTrack` URLs to specific translations, books, and chapters.

---

## 7. Deployment

1. Provision a managed PostgreSQL database (e.g., Neon, Supabase, RDS, or Cloud SQL).
2. Set `DATABASE_URL`, `JWT_SECRET`, `ENCRYPTION_KEY`, and `NEXT_PUBLIC_APP_URL` in your hosting environment (e.g., Vercel).
3. Run `npx prisma db push && npx prisma db seed` against production.
4. Build and start:

```bash
npm run build
npm run start
```

---

## 8. Database Backup & Restore

**Backup:**
```bash
pg_dump "$DATABASE_URL" --format=custom --file=sanctuary_backup_$(date +%F).dump
```

**Restore:**
```bash
pg_restore --clean --if-exists --dbname="$DATABASE_URL" sanctuary_backup_YYYY-MM-DD.dump
```
