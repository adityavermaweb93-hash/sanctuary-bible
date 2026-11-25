"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
} from "react";
import { usePathname } from "next/navigation";

export interface UserPreferences {
  theme: "light" | "dark" | "sepia";
  fontSize: number;
  fontFamily: "serif" | "sans" | "literata" | "georgia";
  lineSpacing: number;
  verseSpacing: number;
  readingBackground: "warm-cream" | "pure-white" | "soft-gray" | "night-navy";
  brightness: number;
  defaultAudioSpeed: number;
}

export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  role: string;
  emailVerified: boolean;
  dailyAiLimit: number;
  monthlyAiLimit: number;
  profile?: {
    displayName: string | null;
    bio: string | null;
    favoriteTranslation: string;
    streakDays: number;
  } | null;
  preferences?: UserPreferences | null;
}

export interface TranslationMeta {
  id: string;
  abbreviation: string;
  fullName: string;
  publisher: string | null;
  copyrightInfo: string | null;
  licenseInfo: string | null;
  availabilityStatus: string;
  isActive: boolean;
  testamentAvail: string;
  audioAvailable: boolean;
  allowAiContext: boolean;
  displayOrder: number;
}

export interface AudioVerseItem {
  verseNum: number;
  text: string;
}

export interface AudioState {
  isOpen: boolean;
  isPlaying: boolean;
  translationAbbr: string;
  bookId: number;
  bookName: string;
  chapterNum: number;
  currentVerseIndex: number;
  verses: AudioVerseItem[];
  speed: number;
  mode: "permitted_tts" | "licensed_audio" | "unavailable";
  audioUrl?: string;
  error?: string;
}

const DEFAULT_PREFERENCES: UserPreferences = {
  theme: "light",
  fontSize: 19,
  fontFamily: "serif",
  lineSpacing: 1.8,
  verseSpacing: 12,
  readingBackground: "warm-cream",
  brightness: 100,
  defaultAudioSpeed: 1.0,
};

interface AppContextValue {
  user: AuthUser | null;
  authLoading: boolean;
  refreshUser: () => Promise<void>;
  preferences: UserPreferences;
  updatePreferences: (patch: Partial<UserPreferences>) => Promise<void>;
  translations: TranslationMeta[];
  activeTranslation: string;
  setActiveTranslation: (abbr: string) => void;
  branding: {
    appName: string;
    tagline: string;
    primaryColor: string;
    accentColor: string;
  };
  homepageSettings: Record<string, unknown>;
  notifications: Array<{ id: string; title: string; message: string; type: string }>;
  // AI Assistant
  aiOpen: boolean;
  setAiOpen: (open: boolean) => void;
  aiContextRef: string | null;
  aiContextTranslation: string | null;
  openAiWithContext: (ref: string, translationAbbr?: string) => void;
  // Verse of the Day login popup
  versePopupOpen: boolean;
  setVersePopupOpen: (open: boolean) => void;
  // Audio Player
  audio: AudioState;
  startAudioChapter: (opts: {
    translationAbbr: string;
    bookId: number;
    bookName: string;
    chapterNum: number;
    verses: AudioVerseItem[];
    startVerseNum?: number;
  }) => Promise<void>;
  togglePlayPause: () => void;
  nextVerse: () => void;
  prevVerse: () => void;
  setAudioSpeed: (speed: number) => void;
  closeAudio: () => void;
  trackEvent: (payload: {
    eventType: string;
    path?: string;
    translationAbbr?: string;
    bookId?: number;
    chapterNum?: number;
  }) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [preferences, setPreferences] =
    useState<UserPreferences>(DEFAULT_PREFERENCES);
  const [translations, setTranslations] = useState<TranslationMeta[]>([]);
  const [activeTranslation, setActiveTranslationState] = useState("KJV");
  const [branding, setBranding] = useState({
    appName: "Sanctuary Bible",
    tagline: "Read, Study & Reflect in Scripture",
    primaryColor: "#1b263b",
    accentColor: "#b4833e",
  });
  const [homepageSettings, setHomepageSettings] = useState<
    Record<string, unknown>
  >({});
  const [notifications, setNotifications] = useState<
    Array<{ id: string; title: string; message: string; type: string }>
  >([]);

  const [aiOpen, setAiOpen] = useState(false);
  const [aiContextRef, setAiContextRef] = useState<string | null>(null);
  const [aiContextTranslation, setAiContextTranslation] = useState<
    string | null
  >(null);
  const [versePopupOpen, setVersePopupOpen] = useState(false);

  const [audio, setAudio] = useState<AudioState>({
    isOpen: false,
    isPlaying: false,
    translationAbbr: "KJV",
    bookId: 43,
    bookName: "John",
    chapterNum: 3,
    currentVerseIndex: 0,
    verses: [],
    speed: 1.0,
    mode: "permitted_tts",
  });

  const audioElRef = useRef<HTMLAudioElement | null>(null);
  const isPlayingRef = useRef(false);
  const audioRef = useRef(audio);
  useEffect(() => {
    audioRef.current = audio;
  }, [audio]);

  const trackEvent = useCallback(
    (payload: {
      eventType: string;
      path?: string;
      translationAbbr?: string;
      bookId?: number;
      chapterNum?: number;
    }) => {
      fetch("/api/analytics/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }).catch(() => {});
    },
    []
  );

  const refreshUser = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me", { cache: "no-store" });
      const data = await res.json();
      setUser(data.user || null);
      if (data.user?.preferences) {
        setPreferences((prev) => ({ ...prev, ...data.user.preferences }));
      }
      if (data.user?.profile?.favoriteTranslation) {
        setActiveTranslationState(data.user.profile.favoriteTranslation);
      }
    } catch {
      setUser(null);
    } finally {
      setAuthLoading(false);
    }
  }, []);

  useEffect(() => {
    // Load local preferences first for instant theme
    const t = setTimeout(() => {
      try {
        const savedPrefs = localStorage.getItem("sanctuary_prefs");
        if (savedPrefs) {
          setPreferences((prev) => ({ ...prev, ...JSON.parse(savedPrefs) }));
        }
        const savedTrans = localStorage.getItem("sanctuary_translation");
        if (savedTrans) setActiveTranslationState(savedTrans);
      } catch {}
      void refreshUser();
    }, 0);

    fetch("/api/bible/translations")
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d.translations)) setTranslations(d.translations);
      })
      .catch(() => {});

    fetch("/api/settings")
      .then((r) => r.json())
      .then((d) => {
        if (d.settings?.branding) {
          setBranding((prev) => ({ ...prev, ...d.settings.branding }));
        }
        if (d.settings?.homepage) setHomepageSettings(d.settings.homepage);
        if (Array.isArray(d.notifications)) setNotifications(d.notifications);
      })
      .catch(() => {});

    return () => clearTimeout(t);
  }, [refreshUser]);

  // Apply theme class to <html>
  useEffect(() => {
    const html = document.documentElement;
    html.classList.remove("dark", "sepia");
    if (preferences.theme === "dark") html.classList.add("dark");
    if (preferences.theme === "sepia") html.classList.add("sepia");
  }, [preferences.theme]);

  // Track page views
  useEffect(() => {
    if (pathname) {
      trackEvent({ eventType: "page_view", path: pathname });
    }
  }, [pathname, trackEvent]);

  const setActiveTranslation = useCallback(
    (abbr: string) => {
      setActiveTranslationState(abbr);
      try {
        localStorage.setItem("sanctuary_translation", abbr);
      } catch {}
      trackEvent({ eventType: "translation_switch", translationAbbr: abbr });
    },
    [trackEvent]
  );

  const updatePreferences = useCallback(
    async (patch: Partial<UserPreferences>) => {
      setPreferences((prev) => {
        const next = { ...prev, ...patch };
        try {
          localStorage.setItem("sanctuary_prefs", JSON.stringify(next));
        } catch {}
        return next;
      });
      if (user) {
        fetch("/api/auth/me", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ preferences: patch }),
        }).catch(() => {});
      }
    },
    [user]
  );

  const openAiWithContext = useCallback(
    (ref: string, translationAbbr?: string) => {
      setAiContextRef(ref);
      setAiContextTranslation(translationAbbr || activeTranslation);
      setAiOpen(true);
    },
    [activeTranslation]
  );

  // Audio playback engine (respecting licensing)
  const stopSpeech = useCallback(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    if (audioElRef.current) {
      audioElRef.current.pause();
    }
  }, []);

  const speakVerseRef = useRef<(idx: number, stateSnapshot?: AudioState) => void>(() => {});

  const speakVerseAtIndex = useCallback(
    (idx: number, stateSnapshot?: AudioState) => {
      const st = stateSnapshot || audioRef.current;
      if (st.mode !== "permitted_tts") return;
      if (idx < 0 || idx >= st.verses.length) {
        setAudio((prev) => ({ ...prev, isPlaying: false }));
        isPlayingRef.current = false;
        return;
      }

      if (typeof window === "undefined" || !("speechSynthesis" in window)) {
        setAudio((prev) => ({
          ...prev,
          isPlaying: false,
          error: "Speech synthesis is not supported in this browser.",
        }));
        return;
      }

      window.speechSynthesis.cancel();
      const verse = st.verses[idx];
      const utterance = new SpeechSynthesisUtterance(verse.text);
      utterance.rate = st.speed;
      utterance.lang = "en-US";
      utterance.onend = () => {
        if (isPlayingRef.current) {
          const nextIdx = idx + 1;
          if (nextIdx < audioRef.current.verses.length) {
            setAudio((prev) => ({ ...prev, currentVerseIndex: nextIdx }));
            speakVerseRef.current(nextIdx);
          } else {
            isPlayingRef.current = false;
            setAudio((prev) => ({ ...prev, isPlaying: false }));
          }
        }
      };
      window.speechSynthesis.speak(utterance);
    },
    []
  );

  useEffect(() => {
    speakVerseRef.current = speakVerseAtIndex;
  }, [speakVerseAtIndex]);

  const startAudioChapter = useCallback(
    async (opts: {
      translationAbbr: string;
      bookId: number;
      bookName: string;
      chapterNum: number;
      verses: AudioVerseItem[];
      startVerseNum?: number;
    }) => {
      stopSpeech();
      trackEvent({
        eventType: "audio_play",
        translationAbbr: opts.translationAbbr,
        bookId: opts.bookId,
        chapterNum: opts.chapterNum,
      });

      let mode: AudioState["mode"] = "unavailable";
      let audioUrl: string | undefined;
      let error: string | undefined;

      try {
        const res = await fetch(
          `/api/audio/chapter?translation=${encodeURIComponent(opts.translationAbbr)}&bookId=${opts.bookId}&chapter=${opts.chapterNum}`
        );
        const data = await res.json();
        mode = data.mode || "unavailable";
        if (mode === "licensed_audio" && data.tracks?.[0]?.audioUrl) {
          audioUrl = data.tracks[0].audioUrl;
        } else if (mode === "unavailable") {
          error = data.reason || "Audio is not licensed for this translation.";
        }
      } catch {
        error = "Unable to verify audio license.";
      }

      const startIdx = opts.startVerseNum
        ? Math.max(
            0,
            opts.verses.findIndex((v) => v.verseNum === opts.startVerseNum)
          )
        : 0;

      const nextState: AudioState = {
        isOpen: true,
        isPlaying: mode !== "unavailable",
        translationAbbr: opts.translationAbbr,
        bookId: opts.bookId,
        bookName: opts.bookName,
        chapterNum: opts.chapterNum,
        currentVerseIndex: startIdx,
        verses: opts.verses,
        speed: preferences.defaultAudioSpeed || 1.0,
        mode,
        audioUrl,
        error,
      };

      setAudio(nextState);
      isPlayingRef.current = mode !== "unavailable";

      if (mode === "permitted_tts") {
        speakVerseAtIndex(startIdx, nextState);
      } else if (mode === "licensed_audio" && audioUrl) {
        if (!audioElRef.current) audioElRef.current = new Audio();
        audioElRef.current.src = audioUrl;
        audioElRef.current.playbackRate = nextState.speed;
        audioElRef.current.play().catch(() => {});
      }

      if (user) {
        fetch("/api/audio/history", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            translationAbbr: opts.translationAbbr,
            bookId: opts.bookId,
            bookName: opts.bookName,
            chapterNum: opts.chapterNum,
            verseNum: opts.startVerseNum || null,
            positionSec: 0,
            durationSec: 0,
          }),
        }).catch(() => {});
      }
    },
    [preferences.defaultAudioSpeed, speakVerseAtIndex, stopSpeech, trackEvent, user]
  );

  const togglePlayPause = useCallback(() => {
    if (audio.mode === "unavailable") return;
    if (audio.isPlaying) {
      isPlayingRef.current = false;
      stopSpeech();
      setAudio((prev) => ({ ...prev, isPlaying: false }));
    } else {
      isPlayingRef.current = true;
      setAudio((prev) => ({ ...prev, isPlaying: true }));
      if (audio.mode === "permitted_tts") {
        speakVerseAtIndex(audio.currentVerseIndex);
      } else if (audioElRef.current) {
        audioElRef.current.play().catch(() => {});
      }
    }
  }, [audio.currentVerseIndex, audio.isPlaying, audio.mode, speakVerseAtIndex, stopSpeech]);

  const nextVerse = useCallback(() => {
    const nextIdx = Math.min(audio.verses.length - 1, audio.currentVerseIndex + 1);
    setAudio((prev) => ({ ...prev, currentVerseIndex: nextIdx, isPlaying: true }));
    isPlayingRef.current = true;
    if (audio.mode === "permitted_tts") {
      speakVerseAtIndex(nextIdx, { ...audio, currentVerseIndex: nextIdx });
    }
  }, [audio, speakVerseAtIndex]);

  const prevVerse = useCallback(() => {
    const prevIdx = Math.max(0, audio.currentVerseIndex - 1);
    setAudio((prev) => ({ ...prev, currentVerseIndex: prevIdx, isPlaying: true }));
    isPlayingRef.current = true;
    if (audio.mode === "permitted_tts") {
      speakVerseAtIndex(prevIdx, { ...audio, currentVerseIndex: prevIdx });
    }
  }, [audio, speakVerseAtIndex]);

  const setAudioSpeed = useCallback(
    (speed: number) => {
      setAudio((prev) => ({ ...prev, speed }));
      if (audioElRef.current) audioElRef.current.playbackRate = speed;
      if (audio.isPlaying && audio.mode === "permitted_tts") {
        speakVerseAtIndex(audio.currentVerseIndex, { ...audio, speed });
      }
      updatePreferences({ defaultAudioSpeed: speed });
    },
    [audio, speakVerseAtIndex, updatePreferences]
  );

  const closeAudio = useCallback(() => {
    isPlayingRef.current = false;
    stopSpeech();
    setAudio((prev) => ({ ...prev, isOpen: false, isPlaying: false }));
  }, [stopSpeech]);

  return (
    <AppContext.Provider
      value={{
        user,
        authLoading,
        refreshUser,
        preferences,
        updatePreferences,
        translations,
        activeTranslation,
        setActiveTranslation,
        branding,
        homepageSettings,
        notifications,
        aiOpen,
        setAiOpen,
        aiContextRef,
        aiContextTranslation,
        openAiWithContext,
        versePopupOpen,
        setVersePopupOpen,
        audio,
        startAudioChapter,
        togglePlayPause,
        nextVerse,
        prevVerse,
        setAudioSpeed,
        closeAudio,
        trackEvent,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used inside AppProvider");
  return ctx;
}
