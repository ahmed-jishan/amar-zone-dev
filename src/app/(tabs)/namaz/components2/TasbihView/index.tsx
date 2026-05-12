// app/(tabs)/namaz/components/TasbihView/index.tsx
'use client';

import { useState, useEffect } from 'react';
import { Sparkles, Target, RotateCcw, Plus } from 'lucide-react';
import DigitalTasbih from './DigitalTasbih';
import ZikrPresets from './ZikrPresets';

export interface ZikrItem {
  id: string;
  arabic: string;
  transliteration: string;
  bangla: string;
  count: number;
  target: number;
  isCustom?: boolean;
}

export default function TasbihView() {
  const [zikrList, setZikrList] = useState<ZikrItem[]>([
    {
      id: 'subhanallah',
      arabic: 'سُبْحَانَ اللَّهِ',
      transliteration: 'Subhanallah',
      bangla: 'পবিত্রতা আল্লাহর জন্য',
      count: 0,
      target: 33,
    },
    {
      id: 'alhamdulillah',
      arabic: 'الْحَمْدُ لِلَّهِ',
      transliteration: 'Alhamdulillah',
      bangla: 'সকল প্রশংসা আল্লাহর জন্য',
      count: 0,
      target: 33,
    },
    {
      id: 'allahuakbar',
      arabic: 'اللَّهُ أَكْبَرُ',
      transliteration: 'Allahu Akbar',
      bangla: 'আল্লাহ সর্বশ্রেষ্ঠ',
      count: 0,
      target: 34,
    },
    {
      id: 'lailahaillallah',
      arabic: 'لَا إِلَٰهَ إِلَّا اللَّهُ',
      transliteration: 'La ilaha illallah',
      bangla: 'আল্লাহ ছাড়া কোনো ইলাহ নেই',
      count: 0,
      target: 10,
    },
    {
      id: 'darood',
      arabic: 'اللَّهُمَّ صَلِّ عَلَى مُحَمَّدٍ',
      transliteration: 'Allahumma salli ala Muhammad',
      bangla: 'দরুদ শরীফ',
      count: 0,
      target: 10,
    },
  ]);
  const [activeZikrId, setActiveZikrId] = useState<string>('subhanallah');
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [newCustomZikr, setNewCustomZikr] = useState({ arabic: '', transliteration: '', bangla: '', target: 33 });

  // Load from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('tasbihData');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setZikrList(parsed);
      } catch (e) {}
    }
  }, []);

  // Save to localStorage whenever zikrList changes
  useEffect(() => {
    localStorage.setItem('tasbihData', JSON.stringify(zikrList));
  }, [zikrList]);

  const updateZikrCount = (id: string, newCount: number) => {
    setZikrList(prev =>
      prev.map(z =>
        z.id === id ? { ...z, count: Math.min(Math.max(0, newCount), z.target) } : z
      )
    );
    // Haptic feedback (vibrate if supported)
    if (typeof window !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(50);
    }
  };

  const resetZikr = (id: string) => {
    setZikrList(prev =>
      prev.map(z =>
        z.id === id ? { ...z, count: 0 } : z
      )
    );
  };

  const resetAll = () => {
    setZikrList(prev =>
      prev.map(z => ({ ...z, count: 0 }))
    );
  };

  const addCustomZikr = () => {
    if (!newCustomZikr.arabic.trim()) return;
    const newId = `custom_${Date.now()}`;
    const newZikr: ZikrItem = {
      id: newId,
      arabic: newCustomZikr.arabic,
      transliteration: newCustomZikr.transliteration || 'Custom Zikr',
      bangla: newCustomZikr.bangla || 'কাস্টম যিকির',
      count: 0,
      target: newCustomZikr.target || 33,
      isCustom: true,
    };
    setZikrList(prev => [...prev, newZikr]);
    setShowCustomModal(false);
    setNewCustomZikr({ arabic: '', transliteration: '', bangla: '', target: 33 });
  };

  const deleteCustomZikr = (id: string) => {
    setZikrList(prev => prev.filter(z => z.id !== id));
    if (activeZikrId === id && zikrList.length > 0) {
      setActiveZikrId(zikrList[0].id);
    }
  };

  const activeZikr = zikrList.find(z => z.id === activeZikrId) || zikrList[0];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-100 rounded-xl">
            <Sparkles className="text-emerald-700" size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-emerald-900">ডিজিটাল তাসবিহ</h2>
            <p className="text-emerald-600 text-sm">যিকির ও দরুদ শরীফ</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={resetAll}
            className="flex items-center gap-2 px-3 py-2 bg-white/70 rounded-xl border border-emerald-200 text-emerald-700 hover:bg-white transition"
          >
            <RotateCcw size={16} />
            <span className="hidden sm:inline">সব রিসেট</span>
          </button>
          <button
            onClick={() => setShowCustomModal(true)}
            className="flex items-center gap-2 px-3 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition"
          >
            <Plus size={16} />
            <span className="hidden sm:inline">কাস্টম যিকির</span>
          </button>
        </div>
      </div>

      {/* Main Tasbih Card */}
      {activeZikr && (
        <DigitalTasbih
          zikr={activeZikr}
          onIncrement={() => updateZikrCount(activeZikr.id, activeZikr.count + 1)}
          onDecrement={() => updateZikrCount(activeZikr.id, activeZikr.count - 1)}
          onReset={() => resetZikr(activeZikr.id)}
        />
      )}

      {/* Zikr Presets List */}
      <ZikrPresets
        zikrList={zikrList}
        activeId={activeZikrId}
        onSelect={setActiveZikrId}
        onDeleteCustom={deleteCustomZikr}
      />

      {/* Custom Zikr Modal */}
      {showCustomModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowCustomModal(false)}>
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-xl font-bold text-emerald-900 mb-4">নতুন যিকির যোগ করুন</h3>
            <div className="space-y-3">
              <input
                type="text"
                placeholder="আরবি পাঠ (سُبْحَانَ اللَّهِ)"
                value={newCustomZikr.arabic}
                onChange={e => setNewCustomZikr({...newCustomZikr, arabic: e.target.value})}
                className="w-full px-3 py-2 border border-emerald-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-300"
              />
              <input
                type="text"
                placeholder="উচ্চারণ (Subhanallah)"
                value={newCustomZikr.transliteration}
                onChange={e => setNewCustomZikr({...newCustomZikr, transliteration: e.target.value})}
                className="w-full px-3 py-2 border border-emerald-200 rounded-lg"
              />
              <input
                type="text"
                placeholder="বাংলা অর্থ"
                value={newCustomZikr.bangla}
                onChange={e => setNewCustomZikr({...newCustomZikr, bangla: e.target.value})}
                className="w-full px-3 py-2 border border-emerald-200 rounded-lg"
              />
              <div>
                <label className="text-sm text-emerald-600">টার্গেট সংখ্যা</label>
                <input
                  type="number"
                  min="1"
                  value={newCustomZikr.target}
                  onChange={e => setNewCustomZikr({...newCustomZikr, target: parseInt(e.target.value) || 33})}
                  className="w-full px-3 py-2 border border-emerald-200 rounded-lg"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={addCustomZikr} className="flex-1 py-2 bg-emerald-600 text-white rounded-xl font-medium">যোগ করুন</button>
              <button onClick={() => setShowCustomModal(false)} className="flex-1 py-2 bg-gray-100 text-gray-700 rounded-xl">বাতিল</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}