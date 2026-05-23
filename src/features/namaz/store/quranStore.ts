import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { NAMAZ_STORAGE_KEYS } from '../constants/storageKeys';

export interface QuranPosition {
  surah: number;
  ayah: number;
}

interface QuranState {
  bookmarks: QuranPosition[];
  savedSurahs: number[];
  lastRead: QuranPosition | null;
  readingMode: boolean;
  toggleBookmark: (position: QuranPosition) => void;
  toggleSurahBookmark: (surah: number) => void;
  setLastRead: (position: QuranPosition) => void;
  setReadingMode: (enabled: boolean) => void;
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
      isBookmarked: (position) => get().bookmarks.some((bookmark) => samePosition(bookmark, position)),
      isSurahBookmarked: (surah) => get().savedSurahs.includes(surah),
    }),
    { name: NAMAZ_STORAGE_KEYS.quran }
  )
);
