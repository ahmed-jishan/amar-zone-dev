'use client';

import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import {
  ArrowLeft,
  Bookmark,
  BookOpen,
  Headphones,
  ListMusic,
  Pause,
  Play,
  Search,
  Volume2,
  SkipBack,
  SkipForward,
  Eye,
  EyeOff,
  Type,
  Sun,
  Moon,
  Sparkles,
  ScrollText,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { SURAHS, type SurahMeta } from '../../data/surahs';
import { usePrefsStore } from '../../store/prefsStore';
import { useQuranStore, type ReadingTheme } from '../../store/quranStore';
import { fetchSurahAyahs, getAyahAudioUrl, type QuranAyah } from '../../utils/quranApi';
import { addQuranMediaActionListener, hideQuranMediaNotification, updateQuranMediaNotification } from '@/lib/native/quranMedia';
import { useHaptics } from '@/hooks/useHaptics';

// ─── Premium Animation Variants ───
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.04, delayChildren: 0.08 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16, scale: 0.98 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: 'spring' as const, stiffness: 200, damping: 25, mass: 0.8 },
  },
};

const THEME_ICONS: Record<ReadingTheme, React.ReactNode> = {
  default: <Sun size={14} />,
  warm: <Sparkles size={14} />,
  cool: <Type size={14} />,
  night: <Moon size={14} />,
};

const THEME_LABELS: Record<ReadingTheme, string> = {
  default: 'Default',
  warm: 'Parchment',
  cool: 'Calm Blue',
  night: 'Night Mode',
};

export default function QuranView() {
  const haptics = useHaptics();

  // ─── State ───
  const [query, setQuery] = useState('');
  const [selectedSurah, setSelectedSurah] = useState<SurahMeta | null>(null);
  const [ayahs, setAyahs] = useState<QuranAyah[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeSurah, setActiveSurah] = useState<number | null>(null);
  const [activeAyah, setActiveAyah] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showPlayer, setShowPlayer] = useState(false);
  const [themeMenuOpen, setThemeMenuOpen] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const ayahRefs = useRef<Map<number, HTMLElement>>(new Map());
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const themeMenuRef = useRef<HTMLDivElement | null>(null);

  // ─── Store ───
  const quranReciter = usePrefsStore((state) => state.quranReciter);
  const bookmarks = useQuranStore((state) => state.bookmarks);
  const savedSurahs = useQuranStore((state) => state.savedSurahs);
  const lastRead = useQuranStore((state) => state.lastRead);
  const readingMode = useQuranStore((state) => state.readingMode);
  const readingTheme = useQuranStore((state) => state.readingTheme);
  const toggleBookmark = useQuranStore((state) => state.toggleBookmark);
  const toggleSurahBookmark = useQuranStore((state) => state.toggleSurahBookmark);
  const setLastRead = useQuranStore((state) => state.setLastRead);
  const setReadingMode = useQuranStore((state) => state.setReadingMode);
  const setReadingTheme = useQuranStore((state) => state.setReadingTheme);
  const isBookmarked = useQuranStore((state) => state.isBookmarked);
  const isSurahBookmarked = useQuranStore((state) => state.isSurahBookmarked);

  // ─── Filtered Surahs ───
  const filteredSurahs = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return SURAHS;
    return SURAHS.filter((surah) =>
      [surah.transliteration, surah.banglaMeaning, String(surah.number)].some((value) =>
        value.toLowerCase().includes(normalized)
      )
    );
  }, [query]);

  const savedSurahItems = useMemo(
    () => savedSurahs.map((surah) => SURAHS.find((item) => item.number === surah)).filter(Boolean) as SurahMeta[],
    [savedSurahs]
  );

  // ─── Fetch ayahs ───
  useEffect(() => {
    if (!selectedSurah) return;
    let cancelled = false;
    setIsLoading(true);
    setError(null);
    fetchSurahAyahs(selectedSurah.number)
      .then((items) => {
        if (!cancelled) setAyahs(items);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Unable to load Quran text');
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => { cancelled = true; };
  }, [selectedSurah]);

  // ─── Scroll to active ayah ───
  useEffect(() => {
    if (!activeAyah || activeSurah !== selectedSurah?.number) return;
    const el = ayahRefs.current.get(activeAyah);
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [activeAyah, activeSurah, selectedSurah?.number]);

  // ─── Track scroll progress ───
  useEffect(() => {
    if (!selectedSurah || !ayahs.length) return;
    const container = scrollContainerRef.current;
    if (!container) return;
    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const progress = scrollHeight > clientHeight ? scrollTop / (scrollHeight - clientHeight) : 0;
      setScrollProgress(Math.min(1, Math.max(0, progress)));
    };
    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, [selectedSurah, ayahs.length]);

  // ─── Close theme menu on outside click ───
  useEffect(() => {
    if (!themeMenuOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (themeMenuRef.current && !themeMenuRef.current.contains(e.target as Node)) {
        setThemeMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [themeMenuOpen]);

  // ─── Cleanup audio ───
  useEffect(() => {
    return () => {
      audioRef.current?.pause();
      void hideQuranMediaNotification().catch(() => undefined);
      if (typeof navigator !== 'undefined' && 'mediaSession' in navigator) {
        navigator.mediaSession.playbackState = 'none';
      }
    };
  }, []);

  // ─── Actions ───
  const openSurah = useCallback((surah: SurahMeta, ayah = 1) => {
    haptics.tap();
    setSelectedSurah(surah);
    setActiveAyah(ayah);
  }, [haptics]);

  const goBack = useCallback(() => {
    haptics.tap();
    setSelectedSurah(null);
    setActiveSurah(null);
    setActiveAyah(null);
    setIsPlaying(false);
    setShowPlayer(false);
    setScrollProgress(0);
    audioRef.current?.pause();
  }, [haptics]);

  const updateMediaSession = useCallback((surah: SurahMeta, ayahNumber: number, playing: boolean) => {
    if (typeof navigator === 'undefined' || !('mediaSession' in navigator)) return;
    navigator.mediaSession.metadata = new MediaMetadata({
      title: `Surah ${surah.transliteration}`,
      artist: 'Quran Recitation',
      album: `Ayah ${ayahNumber}`,
      artwork: [
        { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
        { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
      ],
    });
    navigator.mediaSession.playbackState = playing ? 'playing' : 'paused';
    navigator.mediaSession.setActionHandler('play', async () => {
      try { await audioRef.current?.play(); navigator.mediaSession.playbackState = 'playing'; setIsPlaying(true); }
      catch { navigator.mediaSession.playbackState = 'paused'; setIsPlaying(false); }
    });
    navigator.mediaSession.setActionHandler('pause', () => {
      audioRef.current?.pause(); navigator.mediaSession.playbackState = 'paused'; setIsPlaying(false);
    });
    navigator.mediaSession.setActionHandler('nexttrack', () => { void playAdjacentAyah(surah.number, ayahNumber, 1); });
    navigator.mediaSession.setActionHandler('previoustrack', () => { void playAdjacentAyah(surah.number, ayahNumber, -1); });
    navigator.mediaSession.setActionHandler('stop', () => { audioRef.current?.pause(); setIsPlaying(false); navigator.mediaSession.playbackState = 'none'; });
  }, []);

  const updateNativeMediaNotification = useCallback(async (surah: SurahMeta, ayahNumber: number, playing: boolean) => {
    const ayah = ayahs.find((item) => item.numberInSurah === ayahNumber);
    await updateQuranMediaNotification({
      title: `Surah ${surah.transliteration}`,
      subtitle: `Ayah ${ayahNumber}`,
      ayahLine: ayah?.bangla || surah.banglaMeaning,
      playing,
    }).catch(() => undefined);
  }, [ayahs]);

  const playAdjacentAyah = useCallback(async (currentSurahNumber: number, currentAyahNumber: number, offset: 1 | -1) => {
    const currentSurah = SURAHS.find((item) => item.number === currentSurahNumber);
    if (!currentSurah) return;
    const nextAyah = currentAyahNumber + offset;
    if (nextAyah >= 1 && nextAyah <= currentSurah.verses) {
      await playPosition(currentSurah, nextAyah);
      return;
    }
    const nextSurah = SURAHS.find((item) => item.number === currentSurahNumber + offset);
    if (!nextSurah) return;
    await playPosition(nextSurah, offset === 1 ? 1 : nextSurah.verses);
  }, []);

  const playPosition = useCallback(async (surah: SurahMeta, ayahNumber: number) => {
    haptics.impact();
    const audio = audioRef.current ?? new Audio();
    audioRef.current = audio;
    audio.preload = 'auto';

    if (activeSurah === surah.number && activeAyah === ayahNumber) {
      if (isPlaying) {
        audio.pause();
        if (typeof navigator !== 'undefined' && 'mediaSession' in navigator) navigator.mediaSession.playbackState = 'paused';
        setIsPlaying(false);
        await updateNativeMediaNotification(surah, ayahNumber, false);
        return;
      }
      try {
        await audio.play();
        setIsPlaying(true);
        setShowPlayer(true);
        updateMediaSession(surah, ayahNumber, true);
        await updateNativeMediaNotification(surah, ayahNumber, true);
      } catch { setIsPlaying(false); }
      return;
    }

    setActiveSurah(surah.number);
    setActiveAyah(ayahNumber);
    setShowPlayer(true);
    if (!selectedSurah) setSelectedSurah(surah);
    setLastRead({ surah: surah.number, ayah: ayahNumber });
    audio.src = getAyahAudioUrl(surah.number, ayahNumber, quranReciter);
    audio.onended = () => {
      const nextAyah = ayahNumber + 1;
      if (nextAyah <= surah.verses) {
        void playPosition(surah, nextAyah);
      } else {
        setIsPlaying(false);
        setActiveSurah(null);
        setActiveAyah(null);
        void hideQuranMediaNotification().catch(() => undefined);
        if (typeof navigator !== 'undefined' && 'mediaSession' in navigator) navigator.mediaSession.playbackState = 'none';
      }
    };
    try {
      await audio.play();
      setIsPlaying(true);
      updateMediaSession(surah, ayahNumber, true);
      await updateNativeMediaNotification(surah, ayahNumber, true);
    } catch {
      setIsPlaying(false);
      updateMediaSession(surah, ayahNumber, false);
      await updateNativeMediaNotification(surah, ayahNumber, false);
    }
  }, [activeAyah, activeSurah, isPlaying, selectedSurah, quranReciter, setLastRead, haptics, updateMediaSession, updateNativeMediaNotification]);

  const resumeLastRead = useCallback(() => {
    if (!lastRead) return;
    const surah = SURAHS.find((item) => item.number === lastRead.surah);
    if (surah) openSurah(surah, lastRead.ayah);
  }, [lastRead, openSurah]);

  const playBookmark = useCallback((surahNumber: number, ayahNumber: number) => {
    const surah = SURAHS.find((item) => item.number === surahNumber);
    if (surah) void playPosition(surah, ayahNumber);
  }, [playPosition]);

  const handleToggleReadingMode = useCallback(() => {
    haptics.tap();
    setReadingMode(!readingMode);
  }, [readingMode, setReadingMode, haptics]);

  const handleThemeChange = useCallback((theme: ReadingTheme) => {
    haptics.tap();
    setReadingTheme(theme);
    setThemeMenuOpen(false);
  }, [setReadingTheme, haptics]);

  const handleBookmarkAyah = useCallback((surahNum: number, ayahNum: number) => {
    haptics.select();
    toggleBookmark({ surah: surahNum, ayah: ayahNum });
  }, [haptics, toggleBookmark]);

  // ─── Native media action listener ───
  useEffect(() => {
    let disposed = false;
    let nativeHandle: { remove: () => Promise<void> } | undefined;
    const handleNativeMediaAction = (detail: { action?: string; playing?: boolean }) => {
      const action = detail?.action;
      const currentSurah = activeSurah ? SURAHS.find((item) => item.number === activeSurah) : selectedSurah;
      if (!currentSurah) return;
      if (action === 'playPause' && detail.playing) {
        void audioRef.current?.play().then(() => {
          setIsPlaying(true);
          if (activeAyah) void updateNativeMediaNotification(currentSurah, activeAyah, true);
        });
      } else if (action === 'playPause' && !detail.playing) {
        audioRef.current?.pause();
        setIsPlaying(false);
        if (activeAyah) void updateNativeMediaNotification(currentSurah, activeAyah, false);
      } else if (action === 'next') {
        if (activeAyah) void playAdjacentAyah(currentSurah.number, activeAyah, 1);
      } else if (action === 'previous') {
        if (activeAyah) void playAdjacentAyah(currentSurah.number, activeAyah, -1);
      }
    };
    void addQuranMediaActionListener(handleNativeMediaAction).then((handle) => {
      if (disposed) void handle?.remove();
      else nativeHandle = handle;
    });
    return () => {
      disposed = true;
      void nativeHandle?.remove();
    };
  }, [activeAyah, activeSurah, selectedSurah, ayahs, playAdjacentAyah, updateNativeMediaNotification]);

  const renderPlayIcon = (surahNumber: number, ayahNumber: number) =>
    activeSurah === surahNumber && activeAyah === ayahNumber && isPlaying ? <Pause size={16} /> : <Play size={16} />;

  // ════════════════════════════════════════════════════════════════
  //  SURAH DETAIL VIEW
  // ════════════════════════════════════════════════════════════════
  if (selectedSurah) {
    const themeClass = readingTheme !== 'default' ? `qz-theme-${readingTheme}` : '';
    const containerClass = readingMode ? 'qz-calm-mode' : '';

    return (
      <div className={`space-y-4 qz-bg ${themeClass}`}>
        {/* ─── Surah Header ─── */}
        <div className="sticky top-0 z-20 qz-glass rounded-2xl p-4">
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={goBack}
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl nz-control"
              aria-label="Back to Surah list"
            >
              <ArrowLeft size={18} />
            </button>
            <div className="min-w-0 flex-1 text-center">
              <p className="truncate text-sm font-semibold nz-accent">{selectedSurah.transliteration}</p>
              <h2 className="truncate text-2xl font-bold nz-text qz-arabic" dir="rtl">
                {selectedSurah.arabicName}
              </h2>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleToggleReadingMode}
                className={`inline-flex h-10 w-10 items-center justify-center rounded-xl transition-all ${
                  readingMode ? 'nz-primary' : 'nz-control'
                }`}
                aria-label="Toggle calm reading mode"
              >
                {readingMode ? <Eye size={16} /> : <EyeOff size={16} />}
              </button>
              <div className="relative" ref={themeMenuRef}>
                <button
                  type="button"
                  onClick={() => { haptics.tap(); setThemeMenuOpen(!themeMenuOpen); }}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-xl nz-control"
                  aria-label="Reading theme"
                >
                  {THEME_ICONS[readingTheme]}
                </button>
                <AnimatePresence>
                  {themeMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -8, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -8, scale: 0.95 }}
                      transition={{ type: 'spring', stiffness: 350, damping: 25 }}
                      className="absolute right-0 top-full mt-2 z-50 w-44 overflow-hidden rounded-xl border border-slate-200/60 bg-white shadow-xl shadow-slate-900/10 dark:border-slate-700/60 dark:bg-slate-900 dark:shadow-black/30"
                    >
                      <div className="p-1.5 space-y-0.5">
                        {(Object.keys(THEME_LABELS) as ReadingTheme[]).map((theme) => (
                          <button
                            key={theme}
                            type="button"
                            onClick={() => handleThemeChange(theme)}
                            className={`w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-all ${
                              readingTheme === theme
                                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                                : 'text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800/50'
                            }`}
                          >
                            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-slate-100 dark:bg-slate-800">
                              {THEME_ICONS[theme]}
                            </span>
                            {THEME_LABELS[theme]}
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* Surah Meta Bar */}
          <div className="mt-3 flex items-center justify-between rounded-xl px-3 py-2 text-xs nz-soft nz-text">
            <span className="flex items-center gap-2">
              <span>{selectedSurah.banglaMeaning}</span>
              <span className="qz-gold-divider w-px h-4 mx-1" />
              <span>{selectedSurah.verses} ayah</span>
              <span className="qz-gold-divider w-px h-4 mx-1" />
              <span className={`qz-revelation ${selectedSurah.revelation === 'Makkah' ? 'makkah' : 'madinah'}`}>
                {selectedSurah.revelation}
              </span>
            </span>
            <span className="inline-flex items-center gap-1">
              <Headphones size={13} /> {quranReciter}
            </span>
          </div>
        </div>

        {/* ─── Loading / Error ─── */}
        {isLoading && (
          <div className="rounded-2xl p-8 text-center nz-card">
            <motion.div
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="text-sm font-semibold nz-accent"
            >
              Loading Surah...
            </motion.div>
          </div>
        )}
        {error && <div className="rounded-2xl p-5 text-sm nz-soft nz-gold">{error}</div>}

        {/* ─── Bismillah ─── */}
        {!isLoading && !error && (
          <div className="qz-bismillah">
            ﷽
          </div>
        )}

        {/* ─── Scroll Progress Pill ─── */}
        {!readingMode && scrollProgress > 0.02 && (
          <motion.div
            initial={{ opacity: 0, x: 8 }}
            animate={{ opacity: 1, x: 0 }}
            className="qz-progress-pill"
          >
            <ScrollText size={12} className="inline mr-1" />
            {Math.round(scrollProgress * 100)}%
          </motion.div>
        )}

        {/* ─── Ayahs Container ─── */}
        <div
          ref={scrollContainerRef}
          className={`space-y-3 pb-40 ${containerClass}`}
        >
          <AnimatePresence mode="popLayout">
            {ayahs.map((ayah) => {
              const active = activeSurah === selectedSurah.number && activeAyah === ayah.numberInSurah;
              const bookmarked = isBookmarked({ surah: selectedSurah.number, ayah: ayah.numberInSurah });

              return (
                <motion.article
                  key={ayah.number}
                  ref={(node) => {
                    if (node) ayahRefs.current.set(ayah.numberInSurah, node);
                  }}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 25 }}
                  className={`qz-ayah-card ${active ? 'active' : ''}`}
                >
                  {/* Ayah Header */}
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <span className="qz-ayah-num">{ayah.numberInSurah}</span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleBookmarkAyah(selectedSurah.number, ayah.numberInSurah)}
                        className={`inline-flex h-9 w-9 items-center justify-center rounded-xl transition-all ${
                          bookmarked
                            ? 'bg-amber-500 text-white shadow-sm shadow-amber-200'
                            : 'nz-control'
                        }`}
                        aria-label="Bookmark ayah"
                      >
                        <Bookmark size={16} fill={bookmarked ? 'currentColor' : 'none'} />
                      </button>
                      <button
                        type="button"
                        onClick={() => void playPosition(selectedSurah, ayah.numberInSurah)}
                        className={`inline-flex h-9 w-9 items-center justify-center rounded-xl transition-all ${
                          active && isPlaying
                            ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-200'
                            : 'nz-primary'
                        }`}
                        aria-label="Play ayah"
                      >
                        {renderPlayIcon(selectedSurah.number, ayah.numberInSurah)}
                      </button>
                    </div>
                  </div>

                  {/* Arabic Text */}
                  <p className="text-right text-3xl leading-[2.4] nz-text qz-arabic sm:text-4xl" dir="rtl">
                    {ayah.arabic}
                  </p>

                  {/* Pronunciation */}
                  {(!readingMode || (readingMode && active)) && (
                    <p className="mt-3 rounded-xl px-3 py-3 text-[15px] leading-7 nz-soft nz-text">
                      <span className="mb-1 block text-xs font-semibold nz-gold">বাংলা উচ্চারণ সহায়ক</span>
                      {ayah.pronunciation}
                    </p>
                  )}

                  {/* Translation */}
                  <p className="mt-3 border-t pt-3 text-[15px] leading-7 nz-divider nz-text">
                    {ayah.bangla}
                  </p>

                  {/* Active audio indicator */}
                  {active && isPlaying && (
                    <div className="mt-3 flex items-center gap-2">
                      <div className="qz-waveform">
                        {[1,2,3,4,5,6,7].map((i) => (
                          <div key={i} className="qz-waveform-bar" />
                        ))}
                      </div>
                      <span className="text-xs font-semibold nz-accent">Playing</span>
                    </div>
                  )}
                </motion.article>
              );
            })}
          </AnimatePresence>
        </div>

        {/* ─── Now Playing Mini Bar ─── */}
        <AnimatePresence>
          {showPlayer && activeSurah === selectedSurah.number && activeAyah && (
            <motion.div
              initial={{ opacity: 0, y: 16, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.95 }}
              className="qz-now-playing"
            >
              <div className="flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold nz-text truncate">
                    {selectedSurah.transliteration} — Ayah {activeAyah}
                  </p>
                  <p className="text-[10px] nz-muted truncate">
                    {quranReciter} reciter
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => void playAdjacentAyah(selectedSurah.number, activeAyah, -1)}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg nz-control"
                    aria-label="Previous ayah"
                  >
                    <SkipBack size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => void playPosition(selectedSurah, activeAyah)}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-xl nz-primary"
                    aria-label={isPlaying ? 'Pause' : 'Play'}
                  >
                    {isPlaying ? <Pause size={16} /> : <Play size={16} />}
                  </button>
                  <button
                    type="button"
                    onClick={() => void playAdjacentAyah(selectedSurah.number, activeAyah, 1)}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg nz-control"
                    aria-label="Next ayah"
                  >
                    <SkipForward size={14} />
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════════
  //  SURAH LIST VIEW
  // ════════════════════════════════════════════════════════════════
  return (
    <div className="space-y-5 qz-bg">
      {/* ─── Premium Hero Section ─── */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 200, damping: 25 }}
        className="rounded-3xl p-5 nz-elevated-panel nz-quran-hero relative overflow-hidden"
      >
        <div className="relative z-10">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold qz-chip">
                <BookOpen size={14} /> Quran Companion
              </p>
              <h1 className="mt-3 text-2xl font-bold nz-text">Read, listen, and reflect</h1>
              <p className="mt-2 text-sm leading-6 nz-muted max-w-md">
                A premium Quran space with Bangla meaning, ayah audio, bookmarks, reading themes, and last-read memory.
              </p>
            </div>
            <div className="hidden rounded-2xl p-4 text-right sm:block nz-soft">
              <p className="text-3xl font-bold nz-gold">١١٤</p>
              <p className="text-xs font-semibold nz-muted">Surahs</p>
            </div>
          </div>

          {/* Quick Actions Grid */}
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <motion.button
              type="button"
              disabled={!lastRead}
              onClick={resumeLastRead}
              whileTap={{ scale: 0.97 }}
              className="rounded-2xl p-4 text-left disabled:cursor-not-allowed nz-primary relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100" />
              <span className="text-xs font-semibold uppercase tracking-wide opacity-80">
                <Play size={12} className="inline mr-1" /> Quick resume
              </span>
              <p className="mt-1 font-bold">
                {lastRead ? `Surah ${lastRead.surah}, Ayah ${lastRead.ayah}` : 'No reading position yet'}
              </p>
            </motion.button>
            <div className="rounded-2xl p-4 nz-soft">
              <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide nz-gold">
                <Bookmark size={14} /> Your Library
              </span>
              <p className="mt-1 text-lg font-bold nz-text">
                {bookmarks.length} bookmarks • {savedSurahs.length} saved surahs
              </p>
            </div>
          </div>

          {/* Saved Surahs + Bookmarks Strip */}
          {(savedSurahItems.length > 0 || bookmarks.length > 0) && (
            <div className="mt-4 space-y-3">
              {savedSurahItems.length > 0 && (
                <motion.div
                  initial="hidden"
                  animate="visible"
                  variants={containerVariants}
                  className="flex gap-2 overflow-x-auto scrollbar-none pb-1"
                >
                  {savedSurahItems.map((surah) => (
                    <motion.button
                      key={surah.number}
                      type="button"
                      variants={itemVariants}
                      onClick={() => void playPosition(surah, 1)}
                      className="qz-chip shrink-0"
                    >
                      {activeSurah === surah.number && isPlaying ? <Pause size={12} /> : <Volume2 size={12} />}
                      {surah.transliteration}
                    </motion.button>
                  ))}
                </motion.div>
              )}
              {bookmarks.length > 0 && (
                <motion.div
                  initial="hidden"
                  animate="visible"
                  variants={containerVariants}
                  className="flex gap-2 overflow-x-auto scrollbar-none pb-1"
                >
                  {bookmarks.slice(0, 12).map((bookmark) => (
                    <motion.button
                      key={`${bookmark.surah}:${bookmark.ayah}`}
                      type="button"
                      variants={itemVariants}
                      onClick={() => playBookmark(bookmark.surah, bookmark.ayah)}
                      className="qz-chip shrink-0"
                    >
                      {renderPlayIcon(bookmark.surah, bookmark.ayah)}
                      {bookmark.surah}:{bookmark.ayah}
                    </motion.button>
                  ))}
                </motion.div>
              )}
            </div>
          )}
        </div>
      </motion.section>

      {/* ─── Premium Search Bar ─── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, type: 'spring', stiffness: 200, damping: 25 }}
        className="qz-search"
      >
        <Search size={18} className="nz-muted shrink-0" />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search surah name, meaning, or number..."
        />
        {query && (
          <button
            type="button"
            onClick={() => { haptics.tap(); setQuery(''); }}
            className="inline-flex h-6 w-6 items-center justify-center rounded-full nz-soft text-[10px] font-bold nz-muted"
          >
            ✕
          </button>
        )}
      </motion.div>

      {/* ─── Surah Grid ─── */}
      <motion.div
        key={query}
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
      >
        {filteredSurahs.map((surah) => {
          const saved = isSurahBookmarked(surah.number);
          const active = activeSurah === surah.number;

          return (
            <motion.div
              key={surah.number}
              variants={itemVariants}
              className="qz-surah-card group"
            >
              <button type="button" onClick={() => openSurah(surah)} className="w-full text-left">
                <div className="flex items-start justify-between gap-3">
                  <span className="qz-surah-badge">{surah.number}</span>
                  <span className="text-right text-2xl font-semibold nz-text qz-arabic" dir="rtl">
                    {surah.arabicName}
                  </span>
                </div>
                <p className="mt-3 font-bold nz-text">{surah.transliteration}</p>
                <div className="mt-2 flex items-center justify-between gap-3 text-sm nz-muted">
                  <span className="flex items-center gap-1.5">
                    {surah.banglaMeaning}
                    <span className={`qz-revelation ${surah.revelation === 'Makkah' ? 'makkah' : 'madinah'} ml-1`}>
                      {surah.revelation === 'Makkah' ? 'مكية' : 'مدنية'}
                    </span>
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs nz-soft nz-gold">
                    <ListMusic size={12} /> {surah.verses}
                  </span>
                </div>
              </button>

              {/* Action Buttons */}
              <div className="mt-4 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => void playPosition(surah, active && activeAyah ? activeAyah : 1)}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold nz-primary transition-all active:scale-95"
                >
                  {active && isPlaying ? <Pause size={16} /> : <Play size={16} />}
                  {active && isPlaying ? 'Pause' : 'Play'}
                </button>
                <button
                  type="button"
                  onClick={() => { haptics.select(); toggleSurahBookmark(surah.number); }}
                  className={`inline-flex h-10 w-10 items-center justify-center rounded-xl transition-all ${
                    saved
                      ? 'bg-amber-500 text-white shadow-sm shadow-amber-200'
                      : 'nz-control nz-gold'
                  }`}
                  aria-label={saved ? 'Remove saved surah' : 'Save surah'}
                >
                  <Bookmark size={16} fill={saved ? 'currentColor' : 'none'} />
                </button>
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      {/* ─── Empty State ─── */}
      {filteredSurahs.length === 0 && query && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl p-8 text-center nz-card"
        >
          <p className="text-lg font-semibold nz-text">No surahs found</p>
          <p className="mt-1 text-sm nz-muted">Try a different search term</p>
        </motion.div>
      )}
    </div>
  );
}