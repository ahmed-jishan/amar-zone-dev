import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { NAMAZ_STORAGE_KEYS } from '../constants/storageKeys';

export interface QuranPosition {
  surah: number;
  ayah: number;
}

export type ReadingTheme = 'default' | 'warm' | 'cool' | 'night';

interface QuranState {
  bookmarks: QuranPosition[];
  savedSurahs: number[];
  lastRead: QuranPosition | null;
  readingMode: boolean;
  readingTheme: ReadingTheme;
  autoScroll: boolean;
  showTranslation: boolean;
  showPronunciation: boolean;
  toggleBookmark: (position: QuranPosition) => void;
  toggleSurahBookmark: (surah: number) => void;
  setLastRead: (position: QuranPosition) => void;
  setReadingMode: (enabled: boolean) => void;
  setReadingTheme: (theme: ReadingTheme) => void;
  setAutoScroll: (enabled: boolean) => void;
  setShowTranslation: (show: boolean) => void;
  setShowPronunciation: (show: boolean) => void;
  isBookmarked: (position: QuranPosition) => boolean;
  isSurahBookmarked: (surah: number) => boolean;
}

function samePosition(a: QuranPosition, b: QuranPosition): boolean {
  return a.surah === b.surah && a.ayah === b.ayah;
}

export const useQuranStore = create<QuranState>()(
  persist(
    (set, get) => ({
      bookmarks: [],
      savedSurahs: [],
      lastRead: null,
      readingMode: false,
      readingTheme: 'default' as ReadingTheme,
      autoScroll: false,
      showTranslation: true,
      showPronunciation: true,

      toggleBookmark: (position) =>
        set((state) => {
          const exists = state.bookmarks.some((bookmark) => samePosition(bookmark, position));
          return {
            bookmarks: exists
              ? state.bookmarks.filter((bookmark) => !samePosition(bookmark, position))
              : [position, ...state.bookmarks].slice(0, 100),
          };
        }),

      toggleSurahBookmark: (surah) =>
        set((state) => ({
          savedSurahs: state.savedSurahs.includes(surah)
            ? state.savedSurahs.filter((item) => item !== surah)
            : [surah, ...state.savedSurahs].slice(0, 50),
        })),

      setLastRead: (lastRead) => set({ lastRead }),

      setReadingMode: (readingMode) => set({ readingMode }),

      setReadingTheme: (readingTheme) => set({ readingTheme }),

      setAutoScroll: (autoScroll) => set({ autoScroll }),

      setShowTranslation: (showTranslation) => set({ showTranslation }),

      setShowPronunciation: (showPronunciation) => set({ showPronunciation }),

      isBookmarked: (position) => get().bookmarks.some((bookmark) => samePosition(bookmark, position)),

      isSurahBookmarked: (surah) => get().savedSurahs.includes(surah),
    }),
    { name: NAMAZ_STORAGE_KEYS.quran }
  )
);