export interface ZikrPreset {
  id: string;
  arabic: string;
  transliteration: string;
  meaning: string;
  target: number;
  category: 'after-prayer' | 'morning-evening' | 'general' | 'custom';
}

export interface TasbihItem extends ZikrPreset {
  count: number;
  createdAt?: number;
  updatedAt?: number;
}

export interface TasbihStateSnapshot {
  items: TasbihItem[];
  activeId: string;
}
