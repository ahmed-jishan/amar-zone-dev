'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
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
} from 'lucide-react';
import { SURAHS, type SurahMeta } from '../../data/surahs';
import { usePrefsStore } from '../../store/prefsStore';
import { useQuranStore } from '../../store/quranStore';
import { fetchSurahAyahs, getAyahAudioUrl, type QuranAyah } from '../../utils/quranApi';
import { hideQuranMediaNotification, updateQuranMediaNotification } from '@/lib/native/quranMedia';

export default function QuranView() {
  const [query, setQuery] = useState('');
  const [selectedSurah, setSelectedSurah] = useState<SurahMeta | null>(null);
  const [ayahs, setAyahs] = useState<QuranAyah[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeSurah, setActiveSurah] = useState<number | null>(null);
  const [activeAyah, setActiveAyah] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const ayahRefs = useRef<Record<number, HTMLElement | null>>({});

  const quranReciter = usePrefsStore((state) => state.quranReciter);
  const bookmarks = useQuranStore((state) => state.bookmarks);
  const savedSurahs = useQuranStore((state) => state.savedSurahs);
  const lastRead = useQuranStore((state) => state.lastRead);
  const readingMode = useQuranStore((state) => state.readingMode);
  const toggleBookmark = useQuranStore((state) => state.toggleBookmark);
  const toggleSurahBookmark = useQuranStore((state) => state.toggleSurahBookmark);
  const setLastRead = useQuranStore((state) => state.setLastRead);
  const setReadingMode = useQuranStore((state) => state.setReadingMode);
  const isBookmarked = useQuranStore((state) => state.isBookmarked);
  const isSurahBookmarked = useQuranStore((state) => state.isSurahBookmarked);

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

    return () => {
      cancelled = true;
    };
  }, [selectedSurah]);

  useEffect(() => {
    if (!activeAyah || activeSurah !== selectedSurah?.number) return;
    ayahRefs.current[activeAyah]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [activeAyah, activeSurah, selectedSurah?.number]);

  useEffect(() => {
    return () => {
      audioRef.current?.pause();
      void hideQuranMediaNotification().catch(() => undefined);
      if (typeof navigator !== 'undefined' && 'mediaSession' in navigator) {
        navigator.mediaSession.playbackState = 'none';
      }
    };
  }, []);

  const openSurah = (surah: SurahMeta, ayah = 1) => {
    setSelectedSurah(surah);
    setActiveAyah(ayah);
  };

  const updateMediaSession = (surah: SurahMeta, ayahNumber: number, playing: boolean) => {
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
      try {
        await audioRef.current?.play();
        navigator.mediaSession.playbackState = 'playing';
        setIsPlaying(true);
        await updateNativeMediaNotification(surah, ayahNumber, true);
      } catch {
        navigator.mediaSession.playbackState = 'paused';
        setIsPlaying(false);
      }
    });
    navigator.mediaSession.setActionHandler('pause', () => {
      audioRef.current?.pause();
      navigator.mediaSession.playbackState = 'paused';
      setIsPlaying(false);
      void updateNativeMediaNotification(surah, ayahNumber, false);
    });
    navigator.mediaSession.setActionHandler('nexttrack', () => {
      void playAdjacentAyah(surah.number, ayahNumber, 1);
    });
    navigator.mediaSession.setActionHandler('previoustrack', () => {
      void playAdjacentAyah(surah.number, ayahNumber, -1);
    });
    navigator.mediaSession.setActionHandler('stop', () => {
      audioRef.current?.pause();
      setIsPlaying(false);
      navigator.mediaSession.playbackState = 'none';
    });
  };

  const updateNativeMediaNotification = async (surah: SurahMeta, ayahNumber: number, playing: boolean) => {
    const ayah = ayahs.find((item) => item.numberInSurah === ayahNumber);
    await updateQuranMediaNotification({
      title: `Surah ${surah.transliteration}`,
      subtitle: `Ayah ${ayahNumber}`,
      ayahLine: ayah?.bangla || surah.banglaMeaning,
      playing,
    }).catch((error) => console.warn('Quran media notification failed:', error));
  };

  const playAdjacentAyah = async (currentSurahNumber: number, currentAyahNumber: number, offset: 1 | -1) => {
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
  };

  const playPosition = async (surah: SurahMeta, ayahNumber: number) => {
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
        updateMediaSession(surah, ayahNumber, true);
        await updateNativeMediaNotification(surah, ayahNumber, true);
      } catch {
        setIsPlaying(false);
      }
      return;
    }

    setActiveSurah(surah.number);
    setActiveAyah(ayahNumber);
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
  };

  const resumeLastRead = () => {
    if (!lastRead) return;
    const surah = SURAHS.find((item) => item.number === lastRead.surah);
    if (surah) openSurah(surah, lastRead.ayah);
  };

  const playBookmark = (surahNumber: number, ayahNumber: number) => {
    const surah = SURAHS.find((item) => item.number === surahNumber);
    if (surah) void playPosition(surah, ayahNumber);
  };

  useEffect(() => {
    const handleNativeMediaAction = (event: Event) => {
      const detail = (event as CustomEvent).detail;
      const action = typeof detail === 'string' ? JSON.parse(detail).action : detail?.action;
      const currentSurah = activeSurah ? SURAHS.find((item) => item.number === activeSurah) : selectedSurah;
      if (!currentSurah) return;
      if (action === 'play') {
        void audioRef.current?.play().then(() => {
          setIsPlaying(true);
          if (activeAyah) void updateNativeMediaNotification(currentSurah, activeAyah, true);
        });
      } else if (action === 'pause') {
        audioRef.current?.pause();
        setIsPlaying(false);
        if (activeAyah) void updateNativeMediaNotification(currentSurah, activeAyah, false);
      } else if (action === 'next') {
        if (activeAyah) void playAdjacentAyah(currentSurah.number, activeAyah, 1);
      } else if (action === 'previous') {
        if (activeAyah) void playAdjacentAyah(currentSurah.number, activeAyah, -1);
      }
    };

    window.addEventListener('quran-media-action', handleNativeMediaAction);
    return () => window.removeEventListener('quran-media-action', handleNativeMediaAction);
  }, [activeAyah, activeSurah, selectedSurah, ayahs]);

  const renderPlayIcon = (surahNumber: number, ayahNumber: number) =>
    activeSurah === surahNumber && activeAyah === ayahNumber && isPlaying ? <Pause size={16} /> : <Play size={16} />;

  if (selectedSurah) {
    return (
      <div className={`space-y-4 ${readingMode ? 'mx-auto max-w-3xl' : ''}`}>
        <div className="sticky top-0 z-20 rounded-2xl p-4 nz-surface">
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setSelectedSurah(null)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl nz-control"
              aria-label="Back to Surah list"
            >
              <ArrowLeft size={18} />
            </button>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold nz-accent">{selectedSurah.transliteration}</p>
              <h2 className="truncate text-2xl font-bold nz-text" dir="rtl">
                {selectedSurah.arabicName}
              </h2>
            </div>
            <button
              type="button"
              onClick={() => setReadingMode(!readingMode)}
              className={`rounded-xl px-3 py-2 text-xs font-semibold ${
                readingMode ? 'nz-primary' : 'nz-control nz-gold'
              }`}
            >
              Calm
            </button>
          </div>
          <div className="mt-3 flex items-center justify-between rounded-xl px-3 py-2 text-xs nz-soft nz-text">
            <span>{selectedSurah.banglaMeaning} • {selectedSurah.verses} ayah</span>
            <span className="inline-flex items-center gap-1">
              <Headphones size={13} /> {quranReciter}
            </span>
          </div>
        </div>

        {isLoading && <div className="rounded-2xl p-6 text-center nz-card nz-accent">Loading Surah...</div>}
        {error && <div className="rounded-2xl p-5 text-sm nz-soft nz-gold">{error}</div>}

        <div className="space-y-3">
          {ayahs.map((ayah) => {
            const active = activeSurah === selectedSurah.number && activeAyah === ayah.numberInSurah;
            const bookmarked = isBookmarked({ surah: selectedSurah.number, ayah: ayah.numberInSurah });
            return (
              <article
                key={ayah.number}
                ref={(node) => {
                  ayahRefs.current[ayah.numberInSurah] = node;
                }}
                className={`rounded-2xl border p-4 shadow-sm transition ${
                  active
                    ? 'nz-soft shadow-emerald-900/10'
                    : 'nz-card shadow-emerald-900/5'
                }`}
              >
                <div className="mb-4 flex items-center justify-between gap-3">
                  <span className="inline-flex h-8 min-w-8 items-center justify-center rounded-full px-2 text-sm font-bold nz-soft nz-gold">
                    {ayah.numberInSurah}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => toggleBookmark({ surah: selectedSurah.number, ayah: ayah.numberInSurah })}
                      className={`inline-flex h-9 w-9 items-center justify-center rounded-xl ${
                        bookmarked ? 'bg-amber-500 text-white' : 'nz-control'
                      }`}
                      aria-label="Bookmark ayah"
                    >
                      <Bookmark size={16} fill={bookmarked ? 'currentColor' : 'none'} />
                    </button>
                    <button
                      type="button"
                    onClick={() => void playPosition(selectedSurah, ayah.numberInSurah)}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-xl nz-primary"
                      aria-label="Play ayah"
                    >
                      {renderPlayIcon(selectedSurah.number, ayah.numberInSurah)}
                    </button>
                  </div>
                </div>
                <p className="text-right text-3xl leading-[2.2] nz-text sm:text-4xl" dir="rtl">
                  {ayah.arabic}
                </p>
                <p className="mt-3 rounded-xl px-3 py-3 text-[15px] leading-7 nz-soft nz-text">
                  <span className="mb-1 block text-xs font-semibold nz-gold">বাংলা উচ্চারণ সহায়ক</span>
                  {ayah.pronunciation}
                </p>
                <p className="mt-3 border-t pt-3 text-[15px] leading-7 nz-divider nz-text">
                  {ayah.bangla}
                </p>
                <p className="mt-2 text-xs nz-muted">
                  সহায়ক উচ্চারণটি শেখার জন্য; সবচেয়ে নির্ভরযোগ্য পাঠের জন্য অডিও তিলাওয়াত অনুসরণ করুন।
                </p>
              </article>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <section className="rounded-3xl p-5 nz-elevated-panel nz-quran-hero">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold nz-chip">
              <BookOpen size={14} /> Quran Companion
            </p>
            <h1 className="mt-3 text-2xl font-bold nz-text">Read, listen, resume.</h1>
            <p className="mt-2 text-sm leading-6 nz-muted">
              A calm Quran space with Bangla meaning, ayah audio, bookmarks, and last-read memory.
            </p>
          </div>
          <div className="hidden rounded-2xl p-4 text-right nz-soft sm:block">
            <p className="text-3xl font-bold nz-gold">١١٤</p>
            <p className="text-xs font-semibold nz-muted">Surahs</p>
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            disabled={!lastRead}
            onClick={resumeLastRead}
            className="rounded-2xl p-4 text-left disabled:cursor-not-allowed nz-primary"
          >
            <span className="text-xs font-semibold uppercase tracking-wide opacity-80">Quick resume</span>
            <p className="mt-1 font-bold">
              {lastRead ? `Surah ${lastRead.surah}, Ayah ${lastRead.ayah}` : 'No reading position yet'}
            </p>
          </button>
          <div className="rounded-2xl p-4 nz-soft">
            <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide nz-gold">
              <Bookmark size={14} /> Bookmarks
            </span>
            <p className="mt-1 text-lg font-bold nz-text">
              {bookmarks.length} ayah • {savedSurahs.length} surah
            </p>
          </div>
        </div>

        {(savedSurahItems.length > 0 || bookmarks.length > 0) && (
          <div className="mt-4 space-y-3">
            {savedSurahItems.length > 0 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {savedSurahItems.map((surah) => (
                  <button
                    key={surah.number}
                    type="button"
                    onClick={() => void playPosition(surah, 1)}
                    className="inline-flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold nz-control"
                  >
                    {activeSurah === surah.number && isPlaying ? <Pause size={15} /> : <Volume2 size={15} />}
                    {surah.transliteration}
                  </button>
                ))}
              </div>
            )}
            {bookmarks.length > 0 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {bookmarks.slice(0, 12).map((bookmark) => (
                  <button
                    key={`${bookmark.surah}:${bookmark.ayah}`}
                    type="button"
                    onClick={() => playBookmark(bookmark.surah, bookmark.ayah)}
                    className="inline-flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold nz-control"
                  >
                    {renderPlayIcon(bookmark.surah, bookmark.ayah)}
                    {bookmark.surah}:{bookmark.ayah}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </section>

      <div className="sticky top-0 z-10 rounded-2xl p-3 nz-surface">
        <label className="flex items-center gap-2 rounded-xl px-3 py-2 nz-control">
          <Search size={16} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search Surah name, meaning, or number"
            className="w-full bg-transparent text-sm outline-none placeholder:text-emerald-500"
          />
        </label>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {filteredSurahs.map((surah) => {
          const saved = isSurahBookmarked(surah.number);
          const active = activeSurah === surah.number;
          return (
            <div
              key={surah.number}
              className="group rounded-2xl p-4 text-left transition nz-card"
            >
              <button type="button" onClick={() => openSurah(surah)} className="w-full text-left">
                <div className="flex items-start justify-between gap-3">
                  <span className="inline-flex h-9 min-w-9 items-center justify-center rounded-xl px-2 text-sm font-bold nz-soft nz-accent">
                    {surah.number}
                  </span>
                  <span className="text-right text-2xl font-semibold nz-text" dir="rtl">
                    {surah.arabicName}
                  </span>
                </div>
                <p className="mt-3 font-bold nz-text">{surah.transliteration}</p>
                <div className="mt-2 flex items-center justify-between gap-3 text-sm nz-muted">
                  <span>{surah.banglaMeaning}</span>
                  <span className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs nz-soft nz-gold">
                    <ListMusic size={12} /> {surah.verses}
                  </span>
                </div>
              </button>
              <div className="mt-4 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => void playPosition(surah, active && activeAyah ? activeAyah : 1)}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold nz-primary"
                >
                  {active && isPlaying ? <Pause size={16} /> : <Play size={16} />}
                  {active && isPlaying ? 'Pause' : 'Play'}
                </button>
                <button
                  type="button"
                  onClick={() => toggleSurahBookmark(surah.number)}
                  className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ${
                    saved ? 'bg-amber-500 text-white' : 'nz-control nz-gold'
                  }`}
                  aria-label="Save Surah"
                >
                  <Bookmark size={16} fill={saved ? 'currentColor' : 'none'} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
