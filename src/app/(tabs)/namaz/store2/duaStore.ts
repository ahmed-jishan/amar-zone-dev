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
}

export interface DuaCategory {
  id: string;
  name: string;
  nameBn: string;
  duas: DuaItem[];
}

interface DuaStore {
  categories: DuaCategory[];
  read: Record<string, boolean>;
  favorites: Record<string, boolean>;
  toggleRead: (id: string) => void;
  toggleFavorite: (id: string) => void;
}

export const useDuaStore = create<DuaStore>()(
  persist(
    (set) => ({
      categories: duas as DuaCategory[],
      read: {},
      favorites: {},
      toggleRead: (id) => set((state) => ({ read: { ...state.read, [id]: !state.read[id] } })),
      toggleFavorite: (id) =>
        set((state) => ({ favorites: { ...state.favorites, [id]: !state.favorites[id] } })),
    }),
    {
      name: NAMAZ_STORAGE_KEYS.dua,
      partialize: (state) => ({ read: state.read, favorites: state.favorites }),
      merge: (persisted, current) => ({ ...current, ...(persisted as Partial<DuaStore>), categories: current.categories }),
    }
  )
);
