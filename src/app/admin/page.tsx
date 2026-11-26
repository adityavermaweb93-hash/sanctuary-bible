"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Gauge,
  BookOpen,
  Headphones,
  Users,
  Sparkles,
  Palette,
  Bell,
  Settings,
  CalendarCheck,
  ShieldAlert,
  CheckCircle2,
  RefreshCw,
  ExternalLink,
  Plus,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { useApp } from "@/components/AppContext";
import { BIBLE_BOOKS } from "@/lib/bible/books";

type TabId =
  | "overview"
  | "translations"
  | "content"
  | "audio"
  | "users"
  | "ai"
  | "customization"
  | "notifications"
  | "system";

const WP_MENU: Array<{
  id: TabId;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  dividerAfter?: boolean;
}> = [
  { id: "overview", label: "Dashboard", icon: Gauge, dividerAfter: true },
  { id: "translations", label: "Translations (52)", icon: BookOpen },
  { id: "content", label: "Content & Plans", icon: CalendarCheck },
  { id: "audio", label: "Audio", icon: Headphones },
  { id: "notifications", label: "Announcements", icon: Bell, dividerAfter: true },
  { id: "users", label: "Users", icon: Users },
  { id: "ai", label: "AI Assistant", icon: Sparkles },
  { id: "customization", label: "Appearance", icon: Palette },
  { id: "system", label: "Settings & Health", icon: Settings },
];

export default function WordPressStyleAdminPage() {
  const router = useRouter();
  const { user, authLoading, refreshUser, branding } = useApp();
  const [tab, setTab] = useState<TabId>("overview");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // Overview
  const [range, setRange] = useState("30d");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [analytics, setAnalytics] = useState<{
    summary: Record<string, number>;
    topBooks: Array<{ bookName: string; views: number }>;
    topTranslations: Array<{ abbreviation: string; uses: number }>;
  } | null>(null);

  // Quick Draft (WP Dashboard widget)
  const [quickDraft, setQuickDraft] = useState({ title: "", message: "" });

  // Translations & Providers
  const [translations, setTranslations] = useState<
    Array<{
      id: string;
      abbreviation: string;
      fullName: string;
      publisher: string | null;
      availabilityStatus: string;
      isActive: boolean;
      audioAvailable: boolean;
      allowAiContext: boolean;
      externalBibleId: string | null;
    }>
  >([]);
  const [providers, setProviders] = useState<
    Array<{ id: string; name: string; slug: string; maskedApiKey: string }>
  >([]);
  const [transFilter, setTransFilter] = useState("");

  // Users
  const [users, setUsers] = useState<
    Array<{
      id: string;
      email: string;
      name: string | null;
      status: string;
      dailyAiLimit: number;
      createdAt: string;
      role: { id: string; name: string };
    }>
  >([]);
  const [roles, setRoles] = useState<Array<{ id: string; name: string }>>([]);
  const [userSearch, setUserSearch] = useState("");

  // AI Config
  const [aiForm, setAiForm] = useState({
    isEnabled: true,
    provider: "openai",
    model: "gpt-4o-mini",
    apiKey: "",
    maskedApiKey: "",
    dailyGlobalLimit: 5000,
    monthlyGlobalLimit: 100000,
    defaultUserDailyLimit: 30,
  });
  const [aiUsage, setAiUsage] = useState({
    totalConversations: 0,
    totalTokens: 0,
    estimatedCost: 0,
  });

  // Audio
  const [audioSources, setAudioSources] = useState<
    Array<{
      id: string;
      name: string;
      providerType: string;
      licenseConfirmed: boolean;
      isActive: boolean;
    }>
  >([]);
  const [newAudioSource, setNewAudioSource] = useState({
    name: "",
    providerType: "licensed_mp3",
    baseUrl: "",
  });

  // Plans
  const [plans, setPlans] = useState<
    Array<{
      id: string;
      title: string;
      durationDays: number;
      category: string;
      isActive: boolean;
    }>
  >([]);
  const [newPlan, setNewPlan] = useState({
    title: "",
    description: "",
    durationDays: 7,
    category: "Custom",
  });

  // Settings
  const [brandingForm, setBrandingForm] = useState({
    appName: "Sanctuary Bible",
    tagline: "Read, Study & Reflect in Scripture",
    primaryColor: "#1b263b",
    accentColor: "#b4833e",
  });
  const [homepageForm, setHomepageForm] = useState({
    welcomeTitle: "Welcome to Sanctuary Bible",
    welcomeSubtitle:
      "A quiet, modern space for daily Scripture reading, study, and reflection.",
    dailyVerseRef: "John 3:16",
  });
  const [legalForm, setLegalForm] = useState({
    aboutText: "",
    contactEmail: "",
    privacyPolicy: "",
  });

  // Notifications
  const [notifications, setNotifications] = useState<
    Array<{ id: string; title: string; message: string; type: string }>
  >([]);
  const [newNotif, setNewNotif] = useState({
    title: "",
    message: "",
    type: "announcement",
  });

  // System
  const [systemInfo, setSystemInfo] = useState<{
    databaseStatus: string;
    counts: Record<string, number>;
    logs: Array<{
      id: string;
      action: string;
      target: string | null;
      createdAt: string;
      admin: { email: string };
    }>;
    version: string;
  } | null>(null);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

  const loadAnalytics = useCallback(async () => {
    const url =
      range === "custom" && customFrom && customTo
        ? `/api/admin/analytics?range=custom&from=${customFrom}&to=${customTo}`
        : `/api/admin/analytics?range=${range}`;
    const res = await fetch(url);
    if (res.ok) setAnalytics(await res.json());
  }, [range, customFrom, customTo]);

  useEffect(() => {
    if (!user || (user.role !== "admin" && user.role !== "editor")) return;
    if (tab === "overview") {
      const t = setTimeout(() => {
        void loadAnalytics();
        fetch("/api/admin/system")
          .then((r) => r.json())
          .then((d) => setSystemInfo(d))
          .catch(() => {});
      }, 0);
      return () => clearTimeout(t);
    }
    if (tab === "translations") {
      fetch("/api/admin/translations")
        .then((r) => r.json())
        .then((d) => d.translations && setTranslations(d.translations));
      fetch("/api/admin/providers")
        .then((r) => r.json())
        .then((d) => d.providers && setProviders(d.providers));
    }
    if (tab === "content") {
      fetch("/api/admin/plans")
        .then((r) => r.json())
        .then((d) => d.plans && setPlans(d.plans));
    }
    if (tab === "audio") {
      fetch("/api/admin/audio")
        .then((r) => r.json())
        .then((d) => d.sources && setAudioSources(d.sources));
    }
    if (tab === "users") {
      fetch(`/api/admin/users?q=${encodeURIComponent(userSearch)}`)
        .then((r) => r.json())
        .then((d) => {
          if (d.users) setUsers(d.users);
          if (d.roles) setRoles(d.roles);
        });
    }
    if (tab === "ai") {
      fetch("/api/admin/ai")
        .then((r) => r.json())
        .then((d) => {
          if (d.config) setAiForm((p) => ({ ...p, ...d.config, apiKey: "" }));
          if (d.usage) setAiUsage(d.usage);
        });
    }
    if (tab === "customization") {
      fetch("/api/admin/settings")
        .then((r) => r.json())
        .then((d) => {
          if (d.settings?.branding) setBrandingForm((p) => ({ ...p, ...d.settings.branding }));
          if (d.settings?.homepage) setHomepageForm((p) => ({ ...p, ...d.settings.homepage }));
          if (d.settings?.legal) setLegalForm((p) => ({ ...p, ...d.settings.legal }));
        });
    }
    if (tab === "notifications") {
      fetch("/api/admin/notifications")
        .then((r) => r.json())
        .then((d) => d.notifications && setNotifications(d.notifications));
    }
    if (tab === "system") {
      fetch("/api/admin/system")
        .then((r) => r.json())
        .then((d) => setSystemInfo(d));
    }
  }, [tab, user, loadAnalytics, userSearch]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#f0f0f1] text-[#1d2327] flex items-center justify-center text-sm">
        Loading wp-admin…
      </div>
    );
  }

  if (!user || (user.role !== "admin" && user.role !== "editor")) {
    return (
      <div className="min-h-screen bg-[#f0f0f1] text-[#1d2327] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white border border-[#c3c4c7] p-6 shadow-sm text-center space-y-4">
          <ShieldAlert className="h-10 w-10 mx-auto text-[#d63638]" />
          <h1 className="text-lg font-semibold">Admin Access Required</h1>
          <p className="text-xs text-[#50575e]">
            Sign in with an administrator account to access the WordPress-style backend.
          </p>
          <Link
            href="/profile"
            className="inline-block bg-[#2271b1] hover:bg-[#135e96] text-white text-xs font-medium px-4 py-2 rounded-sm"
          >
            Log In
          </Link>
        </div>
      </div>
    );
  }

  const currentMenu = WP_MENU.find((m) => m.id === tab);

  return (
    <div className="min-h-screen bg-[#f0f0f1] text-[#1d2327] flex flex-col font-sans">
      {/* WordPress Top Admin Bar */}
      <header className="sticky top-0 z-40 h-9 bg-[#1d2327] text-[#f0f0f1] flex items-center justify-between px-3 text-xs select-none">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-1 hover:text-[#72aee6] cursor-pointer"
            aria-label="Toggle admin menu"
          >
            {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>

          <Link
            href="/"
            className="flex items-center gap-1.5 font-semibold hover:text-[#72aee6]"
          >
            <BookOpen className="h-3.5 w-3.5 text-[#72aee6]" />
            <span>{branding.appName}</span>
            <ExternalLink className="h-3 w-3 opacity-70" />
          </Link>

          <button
            onClick={() => setTab("notifications")}
            className="hidden sm:inline-flex items-center gap-1 px-2 py-1 hover:bg-[#2c3338] hover:text-[#72aee6] rounded-sm cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>New</span>
          </button>
        </div>

        <div className="flex items-center gap-3">
          <span className="hidden sm:inline text-[#c3c4c7]">
            Howdy, <strong className="text-white">{user.name || user.email}</strong>
          </span>
          <button
            onClick={async () => {
              await fetch("/api/auth/logout", { method: "POST" });
              await refreshUser();
              router.push("/profile");
            }}
            className="inline-flex items-center gap-1 hover:text-[#72aee6] cursor-pointer"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Log Out</span>
          </button>
        </div>
      </header>

      <div className="flex flex-1">
        {/* WordPress Left Sidebar (Desktop) / Bottom Drawer (Mobile) */}
        <aside
          className={`${
            mobileMenuOpen ? "block fixed inset-x-0 bottom-14 top-9 z-30 overflow-y-auto" : "hidden"
          } md:block md:w-52 shrink-0 bg-[#1d2327] text-[#f0f0f1] py-2 select-none`}
        >
          <nav className="space-y-0.5">
            {WP_MENU.map((item) => {
              const Icon = item.icon;
              const active = tab === item.id;
              return (
                <React.Fragment key={item.id}>
                  <button
                    onClick={() => {
                      setTab(item.id);
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center gap-2.5 px-3.5 py-2 text-[13px] text-left transition cursor-pointer ${
                      active
                        ? "bg-[#2271b1] text-white font-semibold"
                        : "text-[#c3c4c7] hover:bg-[#2c3338] hover:text-[#72aee6]"
                    }`}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </button>
                  {item.dividerAfter && (
                    <div className="my-2 border-t border-[#2c3338]" />
                  )}
                </React.Fragment>
              );
            })}
          </nav>
        </aside>

        {/* Main WP-Admin Workspace */}
        <main className="flex-1 p-4 pb-20 sm:p-6 md:pb-6 overflow-x-hidden space-y-5">
          {toast && (
            <div className="bg-white border-l-4 border-[#00a32a] border border-[#c3c4c7] px-4 py-2.5 text-xs font-medium flex items-center gap-2 shadow-sm">
              <CheckCircle2 className="h-4 w-4 text-[#00a32a]" />
              <span>{toast}</span>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-2">
            <h1 className="text-2xl font-normal text-[#1d2327]">
              {currentMenu?.label || "Dashboard"}
            </h1>
            <Link
              href="/bible"
              className="border border-[#2271b1] text-[#2271b1] bg-white hover:bg-[#f6f7f7] px-3 py-1.5 text-xs font-medium rounded-sm"
            >
              Open Bible Reader
            </Link>
          </div>

          {/* 1. DASHBOARD OVERVIEW (WP Metaboxes) */}
          {tab === "overview" && (
            <div className="space-y-5">
              {/* Date Range Bar */}
              <div className="bg-white border border-[#c3c4c7] p-3 flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold mr-1">Date Range:</span>
                {(["today", "7d", "30d", "90d", "custom"] as const).map((r) => (
                  <button
                    key={r}
                    onClick={() => setRange(r)}
                    className={`px-2.5 py-1 text-xs uppercase rounded-sm border cursor-pointer ${
                      range === r
                        ? "bg-[#2271b1] text-white border-[#2271b1]"
                        : "bg-[#f6f7f7] text-[#2c3338] border-[#c3c4c7]"
                    }`}
                  >
                    {r}
                  </button>
                ))}
                {range === "custom" && (
                  <div className="flex items-center gap-2">
                    <input
                      type="date"
                      value={customFrom}
                      onChange={(e) => setCustomFrom(e.target.value)}
                      className="border border-[#8c8f94] px-2 py-1 text-xs rounded-sm"
                    />
                    <input
                      type="date"
                      value={customTo}
                      onChange={(e) => setCustomTo(e.target.value)}
                      className="border border-[#8c8f94] px-2 py-1 text-xs rounded-sm"
                    />
                    <button
                      onClick={loadAnalytics}
                      className="bg-[#2271b1] text-white px-3 py-1 text-xs rounded-sm cursor-pointer"
                    >
                      Apply
                    </button>
                  </div>
                )}
              </div>

              <div className="grid gap-5 lg:grid-cols-2">
                {/* At a Glance Metabox */}
                <div className="bg-white border border-[#c3c4c7]">
                  <div className="border-b border-[#c3c4c7] px-4 py-2.5 font-semibold text-sm">
                    At a Glance
                  </div>
                  <div className="p-4 grid grid-cols-2 gap-3 text-xs">
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-4 w-4 text-[#2271b1]" />
                      <span>
                        <strong>{systemInfo?.counts?.translations ?? 52}</strong> Translations
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-[#2271b1]" />
                      <span>
                        <strong>{analytics?.summary.totalRegisteredUsers ?? 0}</strong> Users
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Gauge className="h-4 w-4 text-[#2271b1]" />
                      <span>
                        <strong>{analytics?.summary.totalVisitors ?? 0}</strong> Unique Visitors
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-[#2271b1]" />
                      <span>
                        <strong>{analytics?.summary.aiQuestions ?? 0}</strong> AI Questions
                      </span>
                    </div>
                  </div>
                  <div className="bg-[#f6f7f7] border-t border-[#c3c4c7] px-4 py-2 text-[11px] text-[#50575e]">
                    Sanctuary Bible {systemInfo?.version || "1.0.0"} · PostgreSQL{" "}
                    <span className="text-[#00a32a] font-semibold">
                      {systemInfo?.databaseStatus || "connected"}
                    </span>
                  </div>
                </div>

                {/* Quick Draft Metabox */}
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    await fetch("/api/admin/notifications", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ ...quickDraft, type: "announcement" }),
                    });
                    setQuickDraft({ title: "", message: "" });
                    showToast("Announcement published to site!");
                  }}
                  className="bg-white border border-[#c3c4c7]"
                >
                  <div className="border-b border-[#c3c4c7] px-4 py-2.5 font-semibold text-sm">
                    Quick Announcement
                  </div>
                  <div className="p-4 space-y-2.5">
                    <input
                      required
                      value={quickDraft.title}
                      onChange={(e) =>
                        setQuickDraft({ ...quickDraft, title: e.target.value })
                      }
                      placeholder="Announcement Title"
                      className="w-full border border-[#8c8f94] px-2.5 py-1.5 text-xs rounded-sm"
                    />
                    <textarea
                      required
                      rows={2}
                      value={quickDraft.message}
                      onChange={(e) =>
                        setQuickDraft({ ...quickDraft, message: e.target.value })
                      }
                      placeholder="Write a message for all readers..."
                      className="w-full border border-[#8c8f94] px-2.5 py-1.5 text-xs rounded-sm"
                    />
                    <button
                      type="submit"
                      className="bg-[#2271b1] hover:bg-[#135e96] text-white px-3 py-1.5 text-xs font-medium rounded-sm cursor-pointer"
                    >
                      Publish Announcement
                    </button>
                  </div>
                </form>

                {/* Activity & Usage Metabox */}
                <div className="bg-white border border-[#c3c4c7]">
                  <div className="border-b border-[#c3c4c7] px-4 py-2.5 font-semibold text-sm">
                    Site Traffic & Engagement
                  </div>
                  <div className="p-4 grid grid-cols-2 gap-3 text-xs">
                    <div>Page Views: <strong>{analytics?.summary.pageViews ?? 0}</strong></div>
                    <div>Chapter Views: <strong>{analytics?.summary.chapterViews ?? 0}</strong></div>
                    <div>DAU / WAU / MAU: <strong>{analytics?.summary.dau ?? 0} / {analytics?.summary.wau ?? 0} / {analytics?.summary.mau ?? 0}</strong></div>
                    <div>Audio Plays: <strong>{analytics?.summary.audioPlays ?? 0}</strong></div>
                    <div>Notes Created: <strong>{analytics?.summary.notesCreated ?? 0}</strong></div>
                    <div>New Registrations: <strong>{analytics?.summary.newRegistrations ?? 0}</strong></div>
                  </div>
                </div>

                {/* Top Books & Translations */}
                <div className="bg-white border border-[#c3c4c7]">
                  <div className="border-b border-[#c3c4c7] px-4 py-2.5 font-semibold text-sm">
                    Top Read Books & Translations
                  </div>
                  <div className="p-4 grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <p className="font-semibold mb-1.5 text-[#50575e]">Books</p>
                      {(analytics?.topBooks || []).length === 0 ? (
                        <p className="text-[#646970]">No chapter views yet.</p>
                      ) : (
                        analytics!.topBooks.map((b) => (
                          <div key={b.bookName} className="flex justify-between py-0.5">
                            <span>{b.bookName}</span>
                            <strong>{b.views}</strong>
                          </div>
                        ))
                      )}
                    </div>
                    <div>
                      <p className="font-semibold mb-1.5 text-[#50575e]">Translations</p>
                      {(analytics?.topTranslations || []).length === 0 ? (
                        <p className="text-[#646970]">No usage yet.</p>
                      ) : (
                        analytics!.topTranslations.map((t) => (
                          <div key={t.abbreviation} className="flex justify-between py-0.5">
                            <span>{t.abbreviation}</span>
                            <strong>{t.uses}</strong>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 2. TRANSLATIONS (52) */}
          {tab === "translations" && (
            <div className="space-y-5">
              <div className="bg-white border border-[#c3c4c7] p-4 space-y-3">
                <h2 className="text-sm font-semibold">API Providers</h2>
                <div className="grid gap-3 md:grid-cols-3">
                  {providers.map((p) => (
                    <div key={p.id} className="border border-[#c3c4c7] bg-[#f6f7f7] p-3 text-xs space-y-2">
                      <div className="font-semibold">{p.name}</div>
                      <div className="text-[#50575e]">Key: {p.maskedApiKey || "Not set"}</div>
                      <form
                        onSubmit={async (e) => {
                          e.preventDefault();
                          const fd = new FormData(e.currentTarget);
                          const apiKey = String(fd.get("apiKey") || "");
                          await fetch("/api/admin/providers", {
                            method: "PATCH",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ id: p.id, apiKey, isActive: true }),
                          });
                          showToast(`Updated ${p.name}`);
                        }}
                        className="flex gap-1.5"
                      >
                        <input
                          name="apiKey"
                          type="password"
                          placeholder="API Key..."
                          className="flex-1 border border-[#8c8f94] bg-white px-2 py-1 text-xs rounded-sm"
                        />
                        <button className="bg-[#2271b1] text-white px-2.5 py-1 text-xs rounded-sm cursor-pointer">
                          Save
                        </button>
                      </form>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white border border-[#c3c4c7]">
                <div className="border-b border-[#c3c4c7] px-4 py-3 flex flex-wrap items-center justify-between gap-2">
                  <span className="font-semibold text-sm">
                    All Translations ({translations.length})
                  </span>
                  <input
                    value={transFilter}
                    onChange={(e) => setTransFilter(e.target.value)}
                    placeholder="Search translations..."
                    className="border border-[#8c8f94] px-2.5 py-1 text-xs rounded-sm"
                  />
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#f6f7f7] border-b border-[#c3c4c7]">
                      <tr>
                        <th className="p-2.5">Abbr</th>
                        <th className="p-2.5">Full Name</th>
                        <th className="p-2.5">Availability</th>
                        <th className="p-2.5">Active</th>
                        <th className="p-2.5">Audio</th>
                        <th className="p-2.5">Test</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#dcdcde]">
                      {translations
                        .filter(
                          (t) =>
                            t.abbreviation.toLowerCase().includes(transFilter.toLowerCase()) ||
                            t.fullName.toLowerCase().includes(transFilter.toLowerCase())
                        )
                        .map((t) => (
                          <tr key={t.id} className="hover:bg-[#f6f7f7]">
                            <td className="p-2.5 font-semibold">{t.abbreviation}</td>
                            <td className="p-2.5">{t.fullName}</td>
                            <td className="p-2.5">
                              <select
                                value={t.availabilityStatus}
                                onChange={async (e) => {
                                  const availabilityStatus = e.target.value;
                                  await fetch("/api/admin/translations", {
                                    method: "PATCH",
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify({ id: t.id, availabilityStatus }),
                                  });
                                  setTranslations((prev) =>
                                    prev.map((x) =>
                                      x.id === t.id ? { ...x, availabilityStatus } : x
                                    )
                                  );
                                  showToast(`Updated ${t.abbreviation}`);
                                }}
                                className="border border-[#8c8f94] px-1.5 py-0.5 text-xs rounded-sm bg-white"
                              >
                                <option value="available">available</option>
                                <option value="coming_soon">coming_soon</option>
                                <option value="not_yet_licensed">not_yet_licensed</option>
                                <option value="inactive">inactive</option>
                              </select>
                            </td>
                            <td className="p-2.5">
                              <input
                                type="checkbox"
                                checked={t.isActive}
                                onChange={async (e) => {
                                  const isActive = e.target.checked;
                                  await fetch("/api/admin/translations", {
                                    method: "PATCH",
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify({ id: t.id, isActive }),
                                  });
                                  setTranslations((prev) =>
                                    prev.map((x) =>
                                      x.id === t.id ? { ...x, isActive } : x
                                    )
                                  );
                                }}
                              />
                            </td>
                            <td className="p-2.5">
                              <input
                                type="checkbox"
                                checked={t.audioAvailable}
                                onChange={async (e) => {
                                  const audioAvailable = e.target.checked;
                                  await fetch("/api/admin/translations", {
                                    method: "PATCH",
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify({ id: t.id, audioAvailable }),
                                  });
                                  setTranslations((prev) =>
                                    prev.map((x) =>
                                      x.id === t.id ? { ...x, audioAvailable } : x
                                    )
                                  );
                                }}
                              />
                            </td>
                            <td className="p-2.5">
                              <button
                                onClick={async () => {
                                  const res = await fetch("/api/admin/translations", {
                                    method: "POST",
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify({
                                      action: "testConnection",
                                      abbreviation: t.abbreviation,
                                    }),
                                  });
                                  const d = await res.json();
                                  showToast(d.message);
                                }}
                                className="inline-flex items-center gap-1 border border-[#2271b1] text-[#2271b1] px-2 py-0.5 rounded-sm cursor-pointer"
                              >
                                <RefreshCw className="h-3 w-3" /> Test
                              </button>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* 3. CONTENT & PLANS */}
          {tab === "content" && (
            <div className="grid gap-5 lg:grid-cols-2">
              <div className="bg-white border border-[#c3c4c7] p-4 space-y-4">
                <h2 className="text-sm font-semibold">Reading Plans ({plans.length})</h2>
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    await fetch("/api/admin/plans", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify(newPlan),
                    });
                    setNewPlan({ title: "", description: "", durationDays: 7, category: "Custom" });
                    showToast("Reading plan created");
                    const r = await fetch("/api/admin/plans");
                    const d = await r.json();
                    if (d.plans) setPlans(d.plans);
                  }}
                  className="space-y-2 border-b border-[#c3c4c7] pb-4"
                >
                  <input
                    required
                    placeholder="Plan Title"
                    value={newPlan.title}
                    onChange={(e) => setNewPlan({ ...newPlan, title: e.target.value })}
                    className="w-full border border-[#8c8f94] px-2.5 py-1.5 text-xs rounded-sm"
                  />
                  <div className="flex gap-2">
                    <input
                      type="number"
                      min={1}
                      value={newPlan.durationDays}
                      onChange={(e) => setNewPlan({ ...newPlan, durationDays: Number(e.target.value) })}
                      className="w-24 border border-[#8c8f94] px-2.5 py-1.5 text-xs rounded-sm"
                    />
                    <input
                      placeholder="Category"
                      value={newPlan.category}
                      onChange={(e) => setNewPlan({ ...newPlan, category: e.target.value })}
                      className="flex-1 border border-[#8c8f94] px-2.5 py-1.5 text-xs rounded-sm"
                    />
                    <button className="bg-[#2271b1] text-white px-3 py-1.5 text-xs rounded-sm cursor-pointer">
                      Add New
                    </button>
                  </div>
                </form>
                <div className="space-y-2">
                  {plans.map((p) => (
                    <div key={p.id} className="flex items-center justify-between border border-[#dcdcde] p-2.5 text-xs">
                      <div>
                        <strong>{p.title}</strong>
                        <div className="text-[#50575e]">{p.durationDays} days · {p.category}</div>
                      </div>
                      <button
                        onClick={async () => {
                          await fetch("/api/admin/plans", {
                            method: "PATCH",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ id: p.id, isActive: !p.isActive }),
                          });
                          setPlans((prev) =>
                            prev.map((x) => (x.id === p.id ? { ...x, isActive: !x.isActive } : x))
                          );
                        }}
                        className="border border-[#8c8f94] px-2.5 py-1 rounded-sm cursor-pointer"
                      >
                        {p.isActive ? "Active" : "Paused"}
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white border border-[#c3c4c7] p-4 space-y-3">
                <h2 className="text-sm font-semibold">Bible Books (66)</h2>
                <div className="max-h-96 overflow-y-auto grid grid-cols-2 gap-1.5 text-xs">
                  {BIBLE_BOOKS.map((b) => (
                    <div key={b.id} className="border border-[#dcdcde] px-2.5 py-1.5 flex justify-between">
                      <span>{b.name}</span>
                      <span className="text-[#50575e]">{b.chapterCount} ch</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 4. AUDIO */}
          {tab === "audio" && (
            <div className="bg-white border border-[#c3c4c7] p-4 space-y-4">
              <h2 className="text-sm font-semibold">Licensed Audio Sources</h2>
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  await fetch("/api/admin/audio", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ ...newAudioSource, licenseConfirmed: true }),
                  });
                  setNewAudioSource({ name: "", providerType: "licensed_mp3", baseUrl: "" });
                  showToast("Audio source added");
                  const r = await fetch("/api/admin/audio");
                  const d = await r.json();
                  if (d.sources) setAudioSources(d.sources);
                }}
                className="grid gap-2 sm:grid-cols-4"
              >
                <input
                  required
                  placeholder="Source Name"
                  value={newAudioSource.name}
                  onChange={(e) => setNewAudioSource({ ...newAudioSource, name: e.target.value })}
                  className="border border-[#8c8f94] px-2.5 py-1.5 text-xs rounded-sm"
                />
                <select
                  value={newAudioSource.providerType}
                  onChange={(e) => setNewAudioSource({ ...newAudioSource, providerType: e.target.value })}
                  className="border border-[#8c8f94] px-2.5 py-1.5 text-xs rounded-sm bg-white"
                >
                  <option value="licensed_mp3">Licensed MP3 CDN</option>
                  <option value="bible_brain">Bible Brain API</option>
                  <option value="permitted_tts">Permitted TTS</option>
                </select>
                <input
                  placeholder="Base URL"
                  value={newAudioSource.baseUrl}
                  onChange={(e) => setNewAudioSource({ ...newAudioSource, baseUrl: e.target.value })}
                  className="border border-[#8c8f94] px-2.5 py-1.5 text-xs rounded-sm"
                />
                <button className="bg-[#2271b1] text-white px-3 py-1.5 text-xs rounded-sm cursor-pointer">
                  Add Source
                </button>
              </form>
              <div className="space-y-2">
                {audioSources.map((s) => (
                  <div key={s.id} className="flex items-center justify-between border border-[#dcdcde] p-3 text-xs">
                    <div>
                      <strong>{s.name}</strong>
                      <div className="text-[#50575e]">{s.providerType} · License Confirmed: {s.licenseConfirmed ? "Yes" : "No"}</div>
                    </div>
                    <span className="text-[#00a32a] font-semibold">{s.isActive ? "Active" : "Disabled"}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 5. USERS */}
          {tab === "users" && (
            <div className="bg-white border border-[#c3c4c7]">
              <div className="border-b border-[#c3c4c7] px-4 py-3 flex items-center justify-between gap-2">
                <span className="font-semibold text-sm">Users ({users.length})</span>
                <input
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  placeholder="Search Users..."
                  className="border border-[#8c8f94] px-2.5 py-1 text-xs rounded-sm"
                />
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#f6f7f7] border-b border-[#c3c4c7]">
                    <tr>
                      <th className="p-2.5">Email</th>
                      <th className="p-2.5">Name</th>
                      <th className="p-2.5">Role</th>
                      <th className="p-2.5">Status</th>
                      <th className="p-2.5">Daily AI Limit</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#dcdcde]">
                    {users.map((u) => (
                      <tr key={u.id} className="hover:bg-[#f6f7f7]">
                        <td className="p-2.5 font-medium">{u.email}</td>
                        <td className="p-2.5">{u.name || "—"}</td>
                        <td className="p-2.5">
                          <select
                            value={u.role.id}
                            onChange={async (e) => {
                              const roleId = e.target.value;
                              await fetch("/api/admin/users", {
                                method: "PATCH",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ userId: u.id, roleId }),
                              });
                              showToast(`Updated role for ${u.email}`);
                            }}
                            className="border border-[#8c8f94] px-1.5 py-0.5 text-xs rounded-sm bg-white"
                          >
                            {roles.map((r) => (
                              <option key={r.id} value={r.id}>
                                {r.name}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="p-2.5">
                          <button
                            onClick={async () => {
                              const nextStatus = u.status === "active" ? "suspended" : "active";
                              await fetch("/api/admin/users", {
                                method: "PATCH",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ userId: u.id, status: nextStatus }),
                              });
                              setUsers((prev) =>
                                prev.map((x) => (x.id === u.id ? { ...x, status: nextStatus } : x))
                              );
                              showToast(`${u.email} is now ${nextStatus}`);
                            }}
                            className={`px-2 py-0.5 rounded-sm font-semibold cursor-pointer ${
                              u.status === "active"
                                ? "bg-[#edfaef] text-[#00a32a]"
                                : "bg-[#fcf0f1] text-[#d63638]"
                            }`}
                          >
                            {u.status}
                          </button>
                        </td>
                        <td className="p-2.5">{u.dailyAiLimit}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 6. AI ASSISTANT */}
          {tab === "ai" && (
            <div className="grid gap-5 lg:grid-cols-3">
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  await fetch("/api/admin/ai", {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(aiForm),
                  });
                  showToast("AI Settings saved");
                }}
                className="lg:col-span-2 bg-white border border-[#c3c4c7] p-4 space-y-3 text-xs"
              >
                <div className="flex items-center justify-between border-b border-[#c3c4c7] pb-2">
                  <span className="font-semibold text-sm">AI Provider Configuration</span>
                  <label className="inline-flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={aiForm.isEnabled}
                      onChange={(e) => setAiForm({ ...aiForm, isEnabled: e.target.checked })}
                    />
                    Enable AI
                  </label>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="block font-medium mb-1">Provider</label>
                    <select
                      value={aiForm.provider}
                      onChange={(e) => setAiForm({ ...aiForm, provider: e.target.value })}
                      className="w-full border border-[#8c8f94] px-2.5 py-1.5 rounded-sm bg-white"
                    >
                      <option value="openai">OpenAI</option>
                      <option value="anthropic">Anthropic</option>
                      <option value="gemini">Google Gemini</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-medium mb-1">Model</label>
                    <input
                      value={aiForm.model}
                      onChange={(e) => setAiForm({ ...aiForm, model: e.target.value })}
                      className="w-full border border-[#8c8f94] px-2.5 py-1.5 rounded-sm"
                    />
                  </div>
                </div>
                <div>
                  <label className="block font-medium mb-1">
                    API Key (Current: {aiForm.maskedApiKey || "None"})
                  </label>
                  <input
                    type="password"
                    value={aiForm.apiKey}
                    onChange={(e) => setAiForm({ ...aiForm, apiKey: e.target.value })}
                    placeholder="Enter API key..."
                    className="w-full border border-[#8c8f94] px-2.5 py-1.5 rounded-sm"
                  />
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  <div>
                    <label className="block font-medium mb-1">Daily Global Limit</label>
                    <input
                      type="number"
                      value={aiForm.dailyGlobalLimit}
                      onChange={(e) => setAiForm({ ...aiForm, dailyGlobalLimit: Number(e.target.value) })}
                      className="w-full border border-[#8c8f94] px-2.5 py-1.5 rounded-sm"
                    />
                  </div>
                  <div>
                    <label className="block font-medium mb-1">Monthly Global Limit</label>
                    <input
                      type="number"
                      value={aiForm.monthlyGlobalLimit}
                      onChange={(e) => setAiForm({ ...aiForm, monthlyGlobalLimit: Number(e.target.value) })}
                      className="w-full border border-[#8c8f94] px-2.5 py-1.5 rounded-sm"
                    />
                  </div>
                  <div>
                    <label className="block font-medium mb-1">User Daily Limit</label>
                    <input
                      type="number"
                      value={aiForm.defaultUserDailyLimit}
                      onChange={(e) => setAiForm({ ...aiForm, defaultUserDailyLimit: Number(e.target.value) })}
                      className="w-full border border-[#8c8f94] px-2.5 py-1.5 rounded-sm"
                    />
                  </div>
                </div>
                <button className="bg-[#2271b1] text-white px-4 py-1.5 rounded-sm cursor-pointer">
                  Save Changes
                </button>
              </form>

              <div className="bg-white border border-[#c3c4c7] p-4 space-y-2 text-xs">
                <h3 className="font-semibold text-sm border-b border-[#c3c4c7] pb-2">Usage & Cost</h3>
                <div className="flex justify-between"><span>Conversations</span><strong>{aiUsage.totalConversations}</strong></div>
                <div className="flex justify-between"><span>Tokens Used</span><strong>{aiUsage.totalTokens.toLocaleString()}</strong></div>
                <div className="flex justify-between"><span>Estimated Cost</span><strong>${aiUsage.estimatedCost.toFixed(4)}</strong></div>
              </div>
            </div>
          )}

          {/* 7. APPEARANCE */}
          {tab === "customization" && (
            <div className="grid gap-5 lg:grid-cols-2">
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  await fetch("/api/admin/settings", {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ id: "branding", value: brandingForm }),
                  });
                  showToast("Site Identity saved");
                }}
                className="bg-white border border-[#c3c4c7] p-4 space-y-3 text-xs"
              >
                <h2 className="font-semibold text-sm border-b border-[#c3c4c7] pb-2">Site Identity & Theme</h2>
                <input
                  value={brandingForm.appName}
                  onChange={(e) => setBrandingForm({ ...brandingForm, appName: e.target.value })}
                  placeholder="Site Title"
                  className="w-full border border-[#8c8f94] px-2.5 py-1.5 rounded-sm"
                />
                <input
                  value={brandingForm.tagline}
                  onChange={(e) => setBrandingForm({ ...brandingForm, tagline: e.target.value })}
                  placeholder="Tagline"
                  className="w-full border border-[#8c8f94] px-2.5 py-1.5 rounded-sm"
                />
                <button className="bg-[#2271b1] text-white px-4 py-1.5 rounded-sm cursor-pointer">
                  Save Branding
                </button>
              </form>

              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  await fetch("/api/admin/settings", {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ id: "homepage", value: homepageForm }),
                  });
                  showToast("Homepage Settings saved");
                }}
                className="bg-white border border-[#c3c4c7] p-4 space-y-3 text-xs"
              >
                <h2 className="font-semibold text-sm border-b border-[#c3c4c7] pb-2">Homepage Reading Settings</h2>
                <input
                  value={homepageForm.welcomeTitle}
                  onChange={(e) => setHomepageForm({ ...homepageForm, welcomeTitle: e.target.value })}
                  placeholder="Welcome Title"
                  className="w-full border border-[#8c8f94] px-2.5 py-1.5 rounded-sm"
                />
                <input
                  value={homepageForm.dailyVerseRef}
                  onChange={(e) => setHomepageForm({ ...homepageForm, dailyVerseRef: e.target.value })}
                  placeholder="Daily Verse (e.g. John 3:16)"
                  className="w-full border border-[#8c8f94] px-2.5 py-1.5 rounded-sm"
                />
                <button className="bg-[#2271b1] text-white px-4 py-1.5 rounded-sm cursor-pointer">
                  Save Homepage
                </button>
              </form>

              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  await fetch("/api/admin/settings", {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ id: "legal", value: legalForm }),
                  });
                  showToast("Legal & About pages saved");
                }}
                className="lg:col-span-2 bg-white border border-[#c3c4c7] p-4 space-y-3 text-xs"
              >
                <h2 className="font-semibold text-sm border-b border-[#c3c4c7] pb-2">About, Contact & Privacy Policy</h2>
                <input
                  value={legalForm.contactEmail}
                  onChange={(e) => setLegalForm({ ...legalForm, contactEmail: e.target.value })}
                  placeholder="Contact Email"
                  className="w-full border border-[#8c8f94] px-2.5 py-1.5 rounded-sm"
                />
                <textarea
                  rows={2}
                  value={legalForm.aboutText}
                  onChange={(e) => setLegalForm({ ...legalForm, aboutText: e.target.value })}
                  placeholder="About Text"
                  className="w-full border border-[#8c8f94] px-2.5 py-1.5 rounded-sm"
                />
                <textarea
                  rows={2}
                  value={legalForm.privacyPolicy}
                  onChange={(e) => setLegalForm({ ...legalForm, privacyPolicy: e.target.value })}
                  placeholder="Privacy Policy"
                  className="w-full border border-[#8c8f94] px-2.5 py-1.5 rounded-sm"
                />
                <button className="bg-[#2271b1] text-white px-4 py-1.5 rounded-sm cursor-pointer">
                  Save Legal Pages
                </button>
              </form>
            </div>
          )}

          {/* 8. ANNOUNCEMENTS */}
          {tab === "notifications" && (
            <div className="bg-white border border-[#c3c4c7] p-4 space-y-4 text-xs">
              <h2 className="font-semibold text-sm">Publish Announcements</h2>
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  await fetch("/api/admin/notifications", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(newNotif),
                  });
                  setNewNotif({ title: "", message: "", type: "announcement" });
                  showToast("Announcement published");
                  const r = await fetch("/api/admin/notifications");
                  const d = await r.json();
                  if (d.notifications) setNotifications(d.notifications);
                }}
                className="grid gap-2 sm:grid-cols-3"
              >
                <input
                  required
                  placeholder="Title"
                  value={newNotif.title}
                  onChange={(e) => setNewNotif({ ...newNotif, title: e.target.value })}
                  className="border border-[#8c8f94] px-2.5 py-1.5 rounded-sm"
                />
                <input
                  required
                  placeholder="Message"
                  value={newNotif.message}
                  onChange={(e) => setNewNotif({ ...newNotif, message: e.target.value })}
                  className="border border-[#8c8f94] px-2.5 py-1.5 rounded-sm"
                />
                <button className="bg-[#2271b1] text-white px-4 py-1.5 rounded-sm cursor-pointer">
                  Publish
                </button>
              </form>
              <div className="space-y-2">
                {notifications.map((n) => (
                  <div key={n.id} className="flex items-center justify-between border border-[#dcdcde] p-2.5">
                    <div>
                      <strong>{n.title}</strong>
                      <div className="text-[#50575e]">{n.message}</div>
                    </div>
                    <button
                      onClick={async () => {
                        await fetch(`/api/admin/notifications?id=${n.id}`, { method: "DELETE" });
                        setNotifications((prev) => prev.filter((x) => x.id !== n.id));
                      }}
                      className="text-[#d63638] cursor-pointer"
                    >
                      Trash
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 9. SETTINGS & SYSTEM HEALTH */}
          {tab === "system" && (
            <div className="grid gap-5 lg:grid-cols-2">
              <div className="bg-white border border-[#c3c4c7] p-4 space-y-2 text-xs">
                <h2 className="font-semibold text-sm border-b border-[#c3c4c7] pb-2">Site Health</h2>
                <div className="flex justify-between">
                  <span>PostgreSQL Status</span>
                  <strong className="text-[#00a32a]">{systemInfo?.databaseStatus || "connected"}</strong>
                </div>
                <div className="flex justify-between">
                  <span>Version</span>
                  <strong>{systemInfo?.version || "1.0.0"}</strong>
                </div>
                {systemInfo?.counts &&
                  Object.entries(systemInfo.counts).map(([k, v]) => (
                    <div key={k} className="flex justify-between capitalize">
                      <span>{k}</span>
                      <strong>{v}</strong>
                    </div>
                  ))}
              </div>

              <div className="bg-white border border-[#c3c4c7] p-4 space-y-2 text-xs">
                <h2 className="font-semibold text-sm border-b border-[#c3c4c7] pb-2">Admin Activity Log</h2>
                <div className="max-h-72 overflow-y-auto space-y-2">
                  {(systemInfo?.logs || []).map((l) => (
                    <div key={l.id} className="border border-[#dcdcde] p-2">
                      <strong>{l.action}</strong>
                      <div className="text-[#50575e]">
                        {l.admin.email} · {l.target || "—"} · {new Date(l.createdAt).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Mobile Admin Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 h-14 bg-[#1d2327] text-[#f0f0f1] border-t border-[#2c3338] flex items-center justify-around px-1">
        {(
          [
            { id: "overview", label: "Dashboard", icon: Gauge },
            { id: "translations", label: "Bible", icon: BookOpen },
            { id: "content", label: "Content", icon: CalendarCheck },
            { id: "users", label: "Users", icon: Users },
          ] as const
        ).map((item) => {
          const Icon = item.icon;
          const active = tab === item.id && !mobileMenuOpen;
          return (
            <button
              key={item.id}
              onClick={() => {
                setTab(item.id);
                setMobileMenuOpen(false);
              }}
              className={`flex flex-col items-center justify-center gap-0.5 px-2 py-1 text-[10px] font-medium cursor-pointer ${
                active ? "text-[#72aee6]" : "text-[#c3c4c7]"
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{item.label}</span>
            </button>
          );
        })}
        <button
          onClick={() => setMobileMenuOpen((prev) => !prev)}
          className={`flex flex-col items-center justify-center gap-0.5 px-2 py-1 text-[10px] font-medium cursor-pointer ${
            mobileMenuOpen ? "text-[#72aee6]" : "text-[#c3c4c7]"
          }`}
        >
          {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          <span>Menu</span>
        </button>
      </nav>
    </div>
  );
}
