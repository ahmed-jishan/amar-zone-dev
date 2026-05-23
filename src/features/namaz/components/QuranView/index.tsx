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
    };
  }, []);

  const openSurah = (surah: SurahMeta, ayah = 1) => {
    setSelectedSurah(surah);
    setActiveAyah(ayah);
  };

  const updateMediaSession = (surah: SurahMeta, ayahNumber: number) => {
    if (typeof navigator === 'undefined' || !('mediaSession' in navigator)) return;

    navigator.mediaSession.metadata = new MediaMetadata({
      title: `${surah.transliteration} ${ayahNumber}`,
      artist: 'Quran Recitation',
      album: surah.banglaMeaning,
    });
    navigator.mediaSession.setActionHandler('play', () => {
      audioRef.current?.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
    });
    navigator.mediaSession.setActionHandler('pause', () => {
      audioRef.current?.pause();
      setIsPlaying(false);
    });
    navigator.mediaSession.setActionHandler('nexttrack', () => {
      playPosition(surah, Math.min(surah.verses, ayahNumber + 1));
    });
    navigator.mediaSession.setActionHandler('previoustrack', () => {
      playPosition(surah, Math.max(1, ayahNumber - 1));
    });
  };

  const notifyNowPlaying = async (surah: SurahMeta, ayahNumber: number) => {
    if (typeof window === 'undefined' || !('Notification' in window)) return;
    if (Notification.permission === 'default') await Notification.requestPermission();
    if (Notification.permission !== 'granted') return;

    new Notification(`${surah.transliteration} ${ayahNumber}`, {
      body: 'Quran recitation is playing. Use mobile media controls to pause or resume.',
      tag: `quran-${surah.number}`,
      silent: true,
    });
  };

  const playPosition = (surah: SurahMeta, ayahNumber: number) => {
    const audio = audioRef.current ?? new Audio();
    audioRef.current = audio;

    if (activeSurah === surah.number && activeAyah === ayahNumber) {
      if (isPlaying) {
        audio.pause();
        setIsPlaying(false);
        return;
      }

      audio.play().then(() => {
        setIsPlaying(true);
        updateMediaSession(surah, ayahNumber);
      }).catch(() => setIsPlaying(false));
      return;
    }

    setActiveSurah(surah.number);
    setActiveAyah(ayahNumber);
    setLastRead({ surah: surah.number, ayah: ayahNumber });
    audio.src = getAyahAudioUrl(surah.number, ayahNumber, quranReciter);
    audio.onended = () => {
      const nextAyah = ayahNumber + 1;
      if (nextAyah <= surah.verses) {
        playPosition(surah, nextAyah);
      } else {
        setIsPlaying(false);
        setActiveSurah(null);
        setActiveAyah(null);
      }
    };
    audio.play().then(() => {
      setIsPlaying(true);
      updateMediaSession(surah, ayahNumber);
      void notifyNowPlaying(surah, ayahNumber);
    }).catch(() => setIsPlaying(false));
  };

  const resumeLastRead = () => {
    if (!lastRead) return;
    const surah = SURAHS.find((item) => item.number === lastRead.surah);
    if (surah) openSurah(surah, lastRead.ayah);
  };

  const playBookmark = (surahNumber: number, ayahNumber: number) => {
    const surah = SURAHS.find((item) => item.number === surahNumber);
    if (surah) playPosition(surah, ayahNumber);
  };

  const renderPlayIcon = (surahNumber: number, ayahNumber: number) =>
    activeSurah === surahNumber && activeAyah === ayahNumber && isPlaying ? <Pause size={16} /> : <Play size={16} />;

  if (selectedSurah) {
    return (
      <div className={`space-y-4 ${readingMode ? 'mx-auto max-w-3xl' : ''}`}>
        <div className="sticky top-0 z-20 rounded-2xl border border-emerald-100 bg-white/90 p-4 shadow-sm shadow-emerald-900/5 backdrop-blur">
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setSelectedSurah(null)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-800"
              aria-label="Back to Surah list"
            >
              <ArrowLeft size={18} />
            </button>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-emerald-700">{selectedSurah.transliteration}</p>
              <h2 className="truncate text-2xl font-bold text-emerald-950" dir="rtl">
                {selectedSurah.arabicName}
              </h2>
            </div>
            <button
              type="button"
              onClick={() => setReadingMode(!readingMode)}
              className={`rounded-xl px-3 py-2 text-xs font-semibold ${
                readingMode ? 'bg-emerald-700 text-white' : 'bg-amber-50 text-amber-800'
              }`}
            >
              Calm
            </button>
          </div>
          <div className="mt-3 flex items-center justify-between rounded-xl bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
            <span>{selectedSurah.banglaMeaning} • {selectedSurah.verses} ayah</span>
            <span className="inline-flex items-center gap-1">
              <Headphones size={13} /> {quranReciter}
            </span>
          </div>
        </div>

        {isLoading && <div className="rounded-2xl bg-white/70 p-6 text-center text-emerald-700">Loading Surah...</div>}
        {error && <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">{error}</div>}

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
                    ? 'border-emerald-300 bg-emerald-50 shadow-emerald-900/10'
                    : 'border-emerald-100 bg-white/80 shadow-emerald-900/5'
                }`}
              >
                <div className="mb-4 flex items-center justify-between gap-3">
                  <span className="inline-flex h-8 min-w-8 items-center justify-center rounded-full bg-amber-100 px-2 text-sm font-bold text-amber-800">
                    {ayah.numberInSurah}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => toggleBookmark({ surah: selectedSurah.number, ayah: ayah.numberInSurah })}
                      className={`inline-flex h-9 w-9 items-center justify-center rounded-xl ${
                        bookmarked ? 'bg-amber-500 text-white' : 'bg-emerald-50 text-emerald-700'
                      }`}
                      aria-label="Bookmark ayah"
                    >
                      <Bookmark size={16} fill={bookmarked ? 'currentColor' : 'none'} />
                    </button>
                    <button
                      type="button"
                      onClick={() => playPosition(selectedSurah, ayah.numberInSurah)}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-700 text-white"
                      aria-label="Play ayah"
                    >
                      {renderPlayIcon(selectedSurah.number, ayah.numberInSurah)}
                    </button>
                  </div>
                </div>
                <p className="text-right text-3xl leading-[2.2] text-emerald-950 sm:text-4xl" dir="rtl">
                  {ayah.arabic}
                </p>
                <p className="mt-3 rounded-xl bg-amber-50 px-3 py-3 text-[15px] leading-7 text-amber-950">
                  <span className="mb-1 block text-xs font-semibold text-amber-700">বাংলা উচ্চারণ সহায়ক</span>
                  {ayah.pronunciation}
                </p>
                <p className="mt-3 border-t border-emerald-100 pt-3 text-[15px] leading-7 text-slate-700">
                  {ayah.bangla}
                </p>
                <p className="mt-2 text-xs text-emerald-600">
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
      <section className="rounded-3xl border border-emerald-100 bg-white/80 p-5 shadow-sm shadow-emerald-900/5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
              <BookOpen size={14} /> Quran Companion
            </p>
            <h1 className="mt-3 text-2xl font-bold text-emerald-950">Read, listen, resume.</h1>
            <p className="mt-2 text-sm leading-6 text-emerald-700">
              A calm Quran space with Bangla meaning, ayah audio, bookmarks, and last-read memory.
            </p>
          </div>
          <div className="hidden rounded-2xl bg-amber-50 p-4 text-right sm:block">
            <p className="text-3xl font-bold text-amber-700">١١٤</p>
            <p className="text-xs font-semibold text-amber-800">Surahs</p>
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            disabled={!lastRead}
            onClick={resumeLastRead}
            className="rounded-2xl border border-emerald-100 bg-emerald-700 p-4 text-left text-white disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
          >
            <span className="text-xs font-semibold uppercase tracking-wide opacity-80">Quick resume</span>
            <p className="mt-1 font-bold">
              {lastRead ? `Surah ${lastRead.surah}, Ayah ${lastRead.ayah}` : 'No reading position yet'}
            </p>
          </button>
          <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4">
            <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-amber-700">
              <Bookmark size={14} /> Bookmarks
            </span>
            <p className="mt-1 text-lg font-bold text-amber-950">
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
                    onClick={() => playPosition(surah, 1)}
                    className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-white px-3 py-2 text-sm font-semibold text-emerald-800"
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
                    className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-800"
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

      <div className="sticky top-0 z-10 rounded-2xl border border-emerald-100 bg-white/90 p-3 backdrop-blur">
        <label className="flex items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2 text-emerald-900">
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
              className="group rounded-2xl border border-emerald-100 bg-white/80 p-4 text-left shadow-sm shadow-emerald-900/5 transition hover:border-emerald-300 hover:bg-emerald-50"
            >
              <button type="button" onClick={() => openSurah(surah)} className="w-full text-left">
                <div className="flex items-start justify-between gap-3">
                  <span className="inline-flex h-9 min-w-9 items-center justify-center rounded-xl bg-emerald-100 px-2 text-sm font-bold text-emerald-800">
                    {surah.number}
                  </span>
                  <span className="text-right text-2xl font-semibold text-emerald-950" dir="rtl">
                    {surah.arabicName}
                  </span>
                </div>
                <p className="mt-3 font-bold text-emerald-950">{surah.transliteration}</p>
                <div className="mt-2 flex items-center justify-between gap-3 text-sm text-emerald-700">
                  <span>{surah.banglaMeaning}</span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-1 text-xs text-amber-800">
                    <ListMusic size={12} /> {surah.verses}
                  </span>
                </div>
              </button>
              <div className="mt-4 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => playPosition(surah, active && activeAyah ? activeAyah : 1)}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-700 px-3 py-2 text-sm font-semibold text-white"
                >
                  {active && isPlaying ? <Pause size={16} /> : <Play size={16} />}
                  {active && isPlaying ? 'Pause' : 'Play'}
                </button>
                <button
                  type="button"
                  onClick={() => toggleSurahBookmark(surah.number)}
                  className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ${
                    saved ? 'bg-amber-500 text-white' : 'bg-amber-50 text-amber-800'
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
