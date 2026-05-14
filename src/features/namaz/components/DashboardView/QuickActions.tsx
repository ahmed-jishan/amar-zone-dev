// app/(tabs)/namaz/components/DashboardView/QuickActions.tsx
'use client';

import { Compass, Sparkles, BookOpen, MapPin, Bell, Sun, Moon } from 'lucide-react';
import { useState } from 'react';

interface ActionItem {
  id: string;
  name: string;
  icon: React.ReactNode;
  color: string;
  description: string;
  action: () => void;
}

export default function QuickActions() {
  const [showTasbih, setShowTasbih] = useState(false);
  const [tasbihCount, setTasbihCount] = useState(0);
  const [selectedZikr, setSelectedZikr] = useState('SubhanAllah');

  // Define actions
  const actions: ActionItem[] = [
    {
      id: 'qibla',
      name: 'কিবলা দিক',
      icon: <Compass size={24} />,
      color: 'from-emerald-600 to-teal-600',
      description: 'কাবা শরীফের দিক নির্ণয়',
      action: () => alert('Qibla Finder coming soon! 🕋')
    },
    {
      id: 'tasbih',
      name: 'তাসবিহ',
      icon: <Sparkles size={24} />,
      color: 'from-amber-500 to-orange-500',
      description: 'ডিজিটাল তাসবিহ কাউন্টার',
      action: () => setShowTasbih(!showTasbih)
    },
    {
      id: 'dua',
      name: 'দুয়া ও যিকির',
      icon: <BookOpen size={24} />,
      color: 'from-purple-500 to-pink-500',
      description: 'দৈনন্দিন দোয়া সমূহ',
      action: () => alert('Dua section coming soon! 🤲')
    },
    {
      id: 'nearby',
      name: 'নিকটস্থ মসজিদ',
      icon: <MapPin size={24} />,
      color: 'from-blue-500 to-cyan-500',
      description: 'মসজিদ খুঁজুন',
      action: () => alert('Nearby mosques coming soon! 🕌')
    }
  ];

  // Tasbih presets
  const zikrPresets = [
    { name: 'SubhanAllah', arabic: 'سُبْحَانَ اللَّهِ', target: 33 },
    { name: 'Alhamdulillah', arabic: 'ٱلْحَمْدُ لِلَّٰهِ', target: 33 },
    { name: 'Allahu Akbar', arabic: 'اللَّهُ أَكْبَرُ', target: 34 },
    { name: 'Astaghfirullah', arabic: 'أَسْتَغْفِرُ اللَّهَ', target: 100 }
  ];

  const handleTasbihClick = () => {
    setTasbihCount(prev => prev + 1);
  };

  const resetTasbih = () => {
    setTasbihCount(0);
  };

  const changeZikr = (name: string) => {
    setSelectedZikr(name);
    setTasbihCount(0);
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-emerald-900 flex items-center gap-2">
        <span className="w-1 h-6 bg-emerald-500 rounded-full"></span>
        দ্রুত অ্যাকশন
      </h3>
      
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {actions.map((action) => (
          <button
            key={action.id}
            onClick={action.action}
            className={`group relative overflow-hidden rounded-xl bg-gradient-to-br ${action.color} p-4 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105`}
          >
            <div className="absolute top-0 right-0 w-20 h-20 opacity-10 group-hover:opacity-20 transition">
              <svg viewBox="0 0 100 100" fill="none">
                <path d="M50 10 L90 50 L50 90 L10 50 L50 10z" stroke="currentColor" strokeWidth="1" />
              </svg>
            </div>
            <div className="relative z-10 text-left">
              <div className="mb-2">{action.icon}</div>
              <p className="font-bold text-sm">{action.name}</p>
              <p className="text-xs opacity-90 mt-1 hidden sm:block">{action.description}</p>
            </div>
          </button>
        ))}
      </div>
      
      {/* Expandable Tasbih Counter */}
      {showTasbih && (
        <div className="bg-white rounded-xl shadow-lg border border-emerald-100 p-5 animate-in slide-in-from-top-2 duration-300">
          <div className="flex justify-between items-center mb-4">
            <h4 className="font-bold text-emerald-800">ডিজিটাল তাসবিহ</h4>
            <button onClick={() => setShowTasbih(false)} className="text-emerald-400 hover:text-emerald-600">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          {/* Zikr presets */}
          <div className="flex flex-wrap gap-2 mb-4">
            {zikrPresets.map(z => (
              <button
                key={z.name}
                onClick={() => changeZikr(z.name)}
                className={`px-3 py-1 rounded-full text-sm transition ${
                  selectedZikr === z.name 
                    ? 'bg-emerald-600 text-white' 
                    : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                }`}
              >
                {z.name}
              </button>
            ))}
          </div>
          
          {/* Counter display */}
          <div className="text-center mb-4">
            <p className="text-2xl font-arabic text-emerald-800 mb-1">
              {zikrPresets.find(z => z.name === selectedZikr)?.arabic}
            </p>
            <div className="text-6xl font-bold text-emerald-700 my-3">{tasbihCount}</div>
            <p className="text-sm text-emerald-500">
              লক্ষ্য: {zikrPresets.find(z => z.name === selectedZikr)?.target}
            </p>
          </div>
          
          {/* Action buttons */}
          <div className="flex gap-3">
            <button
              onClick={handleTasbihClick}
              className="flex-1 bg-emerald-600 text-white py-3 rounded-xl font-bold text-lg hover:bg-emerald-700 transition"
            >
              +১
            </button>
            <button
              onClick={resetTasbih}
              className="px-4 bg-amber-100 text-amber-700 rounded-xl hover:bg-amber-200 transition"
            >
              রিসেট
            </button>
          </div>
          
          {/* Progress bar */}
          <div className="mt-4 h-2 bg-emerald-100 rounded-full">
            <div 
              className="h-full bg-emerald-500 rounded-full transition-all"
              style={{ width: `${(tasbihCount / (zikrPresets.find(z => z.name === selectedZikr)?.target || 1)) * 100}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}