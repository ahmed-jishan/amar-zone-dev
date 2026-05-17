import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import presets from '../data/zikrPresets.json';
import { NAMAZ_STORAGE_KEYS } from '../constants/storageKeys';
import type { TasbihItem, ZikrPreset } from '../types/tasbih.types';

const initialItems: TasbihItem[] = (presets as ZikrPreset[]).map((preset) => ({
  ...preset,
  count: 0,
}));

interface TasbihStore {
  items: TasbihItem[];
  activeId: string;
  setActive: (id: string) => void;
  increment: (id?: string) => void;
  decrement: (id?: string) => void;
  reset: (id?: string) => void;
  resetAll: () => void;
  addCustom: (item: Omit<TasbihItem, 'id' | 'count' | 'category' | 'createdAt' | 'updatedAt'>) => void;
  removeCustom: (id: string) => void;
}

export const useTasbihStore = create<TasbihStore>()(
  persist(
    (set, get) => ({
      items: initialItems,
      activeId: initialItems[0]?.id ?? '',
      setActive: (activeId) => set({ activeId }),
      increment: (id) =>
        set((state) => ({
          items: state.items.map((item) =>
            item.id === (id ?? state.activeId)
              ? { ...item, count: item.count + 1, updatedAt: Date.now() }
              : item
          ),
        })),
      decrement: (id) =>
        set((state) => ({
          items: state.items.map((item) =>
            item.id === (id ?? state.activeId)
              ? { ...item, count: Math.max(0, item.count - 1), updatedAt: Date.now() }
              : item
          ),
        })),
      reset: (id) =>
        set((state) => ({
          items: state.items.map((item) =>
            item.id === (id ?? state.activeId) ? { ...item, count: 0, updatedAt: Date.now() } : item
          ),
        })),
      resetAll: () => set((state) => ({ items: state.items.map((item) => ({ ...item, count: 0 })) })),
      addCustom: (item) => {
        const id = `custom-${Date.now()}`;
        set((state) => ({
          items: [...state.items, { ...item, id, count: 0, category: 'custom', createdAt: Date.now() }],
          activeId: id,
        }));
      },
      removeCustom: (id) =>
        set((state) => {
          const items = state.items.filter((item) => item.id !== id || item.category !== 'custom');
          return { items, activeId: get().activeId === id ? items[0]?.id ?? '' : state.activeId };
        }),
    }),
    { name: NAMAZ_STORAGE_KEYS.tasbih }
  )
);
