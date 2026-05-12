// app/(tabs)/namaz/components/TasbihView/ZikrPresets.tsx
'use client';

import { Trash2, Target, CheckCircle2, Circle } from 'lucide-react';
import { ZikrItem } from './index';

interface ZikrPresetsProps {
  zikrList: ZikrItem[];
  activeId: string;
  onSelect: (id: string) => void;
  onDeleteCustom: (id: string) => void;
}

export default function ZikrPresets({ zikrList, activeId, onSelect, onDeleteCustom }: ZikrPresetsProps) {
  return (
    <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-emerald-100 p-5">
      <h3 className="text-lg font-semibold text-emerald-900 mb-3 flex items-center gap-2">
        <Target size={18} className="text-emerald-600" />
        যিকির তালিকা
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-64 overflow-y-auto pr-1">
        {zikrList.map((zikr) => {
          const isActive = activeId === zikr.id;
          const completed = zikr.count >= zikr.target && zikr.target > 0;
          return (
            <div
              key={zikr.id}
              className={`
                flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all
                ${isActive ? 'bg-emerald-100 border border-emerald-300' : 'bg-white/70 border border-emerald-100 hover:bg-emerald-50'}
              `}
              onClick={() => onSelect(zikr.id)}
            >
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-arabic text-emerald-800">{zikr.arabic.substring(0, 20)}</p>
                  {completed && <CheckCircle2 size={14} className="text-emerald-500" />}
                </div>
                <div className="flex gap-3 text-xs text-emerald-600 mt-0.5">
                  <span>{zikr.transliteration}</span>
                  <span>{zikr.count}/{zikr.target}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-emerald-500' : 'bg-gray-300'}`} />
                {zikr.isCustom && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteCustom(zikr.id);
                    }}
                    className="p-1 text-red-400 hover:text-red-600 transition"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}