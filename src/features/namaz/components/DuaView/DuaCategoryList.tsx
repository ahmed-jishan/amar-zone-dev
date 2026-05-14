// DuaCategoryList.tsx (optional – not used in current index.tsx, but kept for structure)
'use client';

import { DuaCategory } from './index';

interface Props {
  categories: DuaCategory[];
  activeId: string;
  onSelect: (id: string) => void;
}

export default function DuaCategoryList({ categories, activeId, onSelect }: Props) {
  return (
    <div className="flex flex-wrap gap-2">
      {categories.map(cat => (
        <button
          key={cat.id}
          onClick={() => onSelect(cat.id)}
          className={`px-3 py-1.5 rounded-full text-sm transition ${
            activeId === cat.id
              ? 'bg-emerald-600 text-white'
              : 'bg-white/70 text-emerald-700 hover:bg-emerald-100'
          }`}
        >
          {cat.nameBn}
        </button>
      ))}
    </div>
  );
}