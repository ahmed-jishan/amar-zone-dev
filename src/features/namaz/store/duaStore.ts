import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import duas from '../data/duas.json';
import { NAMAZ_STORAGE_KEYS } from '../constants/storageKeys';

export interface DuaItem {
  id: string;
  arabic: string;
  transliteration: string;
  translation: string;
  reference?: string;
  isCustom?: boolean;
}

export interface DuaCategory {
  id: string;
  name: string;
  nameBn: string;
  duas: DuaItem[];
}

interface DuaStore {
  categories: DuaCategory[];
  customDuas: DuaItem[];
  read: Record<string, boolean>;
  favorites: Record<string, boolean>;
  addCustomDua: (dua: Omit<DuaItem, 'id' | 'isCustom'>) => void;
  deleteCustomDua: (id: string) => void;
  toggleRead: (id: string) => void;
  toggleFavorite: (id: string) => void;
}

const DEFAULT_CATEGORIES = duas as DuaCategory[];
const CUSTOM_CATEGORY_ID = 'custom-duas';

function buildCategories(customDuas: DuaItem[]): DuaCategory[] {
  if (customDuas.length === 0) return DEFAULT_CATEGORIES;

  return [
    {
      id: CUSTOM_CATEGORY_ID,
      name: 'My Duas & Zikr',
      nameBn: 'আমার দোয়া ও যিকির',
      duas: customDuas,
    },
    ...DEFAULT_CATEGORIES,
  ];
}

export const useDuaStore = create<DuaStore>()(
  persist(
    (set) => ({
      categories: DEFAULT_CATEGORIES,
      customDuas: [],
      read: {},
      favorites: {},
      addCustomDua: (dua) =>
        set((state) => {
          const customDua: DuaItem = {
            ...dua,
            id: `custom-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            isCustom: true,
          };
          const customDuas = [customDua, ...state.customDuas];
          return { customDuas, categories: buildCategories(customDuas) };
        }),
      deleteCustomDua: (id) =>
        set((state) => {
          const customDuas = state.customDuas.filter((dua) => dua.id !== id);
          const { [id]: _read, ...read } = state.read;
          const { [id]: _favorite, ...favorites } = state.favorites;
          return { customDuas, categories: buildCategories(customDuas), read, favorites };
        }),
      toggleRead: (id) => set((state) => ({ read: { ...state.read, [id]: !state.read[id] } })),
      toggleFavorite: (id) =>
        set((state) => ({ favorites: { ...state.favorites, [id]: !state.favorites[id] } })),
    }),
    {
      name: NAMAZ_STORAGE_KEYS.dua,
      partialize: (state) => ({ customDuas: state.customDuas, read: state.read, favorites: state.favorites }),
      merge: (persisted, current) => {
        const saved = persisted as Partial<DuaStore>;
        const customDuas = saved.customDuas ?? [];
        return {
          ...current,
          ...saved,
          customDuas,
          categories: buildCategories(customDuas),
        };
      },
    }
  )
);
