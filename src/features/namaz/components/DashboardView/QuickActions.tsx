'use client';

import { useState } from 'react';
import { BookOpen, Compass, ExternalLink, Loader2, MapPin, Navigation, Sparkles, X } from 'lucide-react';
import { usePrefsStore } from '../../store/prefsStore';
import { formatLocation } from '../../hooks/useLocationSync';
import {
  formatMosqueDistance,
  mosqueMapUrl,
  useNearbyMosques,
} from '../../hooks/useNearbyMosques';

interface ActionItem {
  id: string;
  name: string;
  icon: React.ReactNode;
  tone: string;
  description: string;
  action: () => void;
}

const COPY = {
  bn: {
    quickActions: 'দ্রুত অ্যাকশন',
    qibla: 'কিবলা দিক',
    qiblaDesc: 'কাবা শরীফের দিক নির্ণয়',
    tasbih: 'তাসবিহ',
    tasbihDesc: 'ডিজিটাল তাসবিহ কাউন্টার',
    dua: 'দোয়া ও যিকির',
    duaDesc: 'দৈনন্দিন দোয়া সমূহ',
    nearby: 'নিকটস্থ মসজিদ',
    nearbyDesc: 'মসজিদ খুঁজুন',
    digitalTasbih: 'ডিজিটাল তাসবিহ',
    target: 'লক্ষ্য',
    increment: '+১',
    reset: 'রিসেট',
    nearbyMosque: 'নিকটস্থ মসজিদ',
    searching: 'কাছের মসজিদ খোঁজা হচ্ছে...',
    empty: 'এই এলাকার জন্য কাছাকাছি মসজিদের তথ্য পাওয়া যায়নি। মানচিত্রে খোঁজার চেষ্টা করুন।',
    direction: 'দিক',
  },
  en: {
    quickActions: 'Quick actions',
    qibla: 'Qibla direction',
    qiblaDesc: 'Find the direction of the Kaaba',
    tasbih: 'Tasbih',
    tasbihDesc: 'Digital tasbih counter',
    dua: 'Duas & Zikr',
    duaDesc: 'Daily duas collection',
    nearby: 'Nearby mosques',
    nearbyDesc: 'Find a mosque',
    digitalTasbih: 'Digital Tasbih',
    target: 'Target',
    increment: '+1',
    reset: 'Reset',
    nearbyMosque: 'Nearby mosques',
    searching: 'Searching nearby mosques...',
    empty: 'No nearby mosque data found for this area. Try searching on the map.',
    direction: 'Direction',
  },
};

export default function QuickActions({ language }: { language: 'bn' | 'en' }) {
  const t = COPY[language];
  const [showTasbih, setShowTasbih] = useState(false);
  const [showMosques, setShowMosques] = useState(false);
  const [tasbihCount, setTasbihCount] = useState(0);
  const [selectedZikr, setSelectedZikr] = useState('SubhanAllah');
  const location = usePrefsStore((state) => state.location);
  const nearbyMosques = useNearbyMosques(location);

  const openMosques = () => {
    setShowMosques(true);
    void nearbyMosques.load();
  };

  const actions: ActionItem[] = [
    {
      id: 'qibla',
      name: t.qibla,
      icon: <Compass size={24} />,
      tone: 'nz-action-accent',
      description: t.qiblaDesc,
      action: () => window.dispatchEvent(new CustomEvent('namaz:open-qibla')),
    },
    {
      id: 'tasbih',
      name: t.tasbih,
      icon: <Sparkles size={24} />,
      tone: 'nz-action-gold',
      description: t.tasbihDesc,
      action: () => setShowTasbih((value) => !value),
    },
    {
      id: 'dua',
      name: t.dua,
      icon: <BookOpen size={24} />,
      tone: 'nz-action-calm',
      description: t.duaDesc,
      action: () => window.dispatchEvent(new CustomEvent('namaz:open-dua')),
    },
    {
      id: 'nearby',
      name: t.nearby,
      icon: <MapPin size={24} />,
      tone: 'nz-action-info',
      description: t.nearbyDesc,
      action: openMosques,
    },
  ];

  const zikrPresets = [
    { name: 'SubhanAllah', arabic: 'سُبْحَانَ اللَّهِ', target: 33 },
    { name: 'Alhamdulillah', arabic: 'ٱلْحَمْدُ لِلَّٰهِ', target: 33 },
    { name: 'Allahu Akbar', arabic: 'اللَّهُ أَكْبَرُ', target: 34 },
    { name: 'Astaghfirullah', arabic: 'أَسْتَغْفِرُ اللَّهَ', target: 100 },
  ];

  const selectedPreset = zikrPresets.find((item) => item.name === selectedZikr) ?? zikrPresets[0];

  return (
    <div className="space-y-4">
      <h3 className="flex items-center gap-2 text-lg font-semibold nz-text">
        <span className="h-6 w-1 rounded-full bg-emerald-500" />
        {t.quickActions}
      </h3>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {actions.map((action) => (
          <button
            key={action.id}
            type="button"
            onClick={action.action}
            className={`group relative overflow-hidden rounded-xl p-4 text-left text-white shadow-lg transition-all duration-300 hover:scale-[1.02] hover:shadow-xl ${action.tone}`}
          >
            <div className="relative z-10">
              <div className="mb-2">{action.icon}</div>
              <p className="text-sm font-bold">{action.name}</p>
              <p className="mt-1 hidden text-xs opacity-90 sm:block">{action.description}</p>
            </div>
          </button>
        ))}
      </div>

      {showTasbih && (
        <div className="rounded-xl p-5 shadow-lg animate-[az-slide-up_250ms_ease-out] nz-card">
          <div className="mb-4 flex items-center justify-between">
            <h4 className="font-bold nz-text">{t.digitalTasbih}</h4>
            <button type="button" onClick={() => setShowTasbih(false)} className="rounded-lg p-1 text-emerald-500 hover:bg-emerald-50">
              <X size={18} />
            </button>
          </div>
          <div className="mb-4 flex flex-wrap gap-2">
            {zikrPresets.map((zikr) => (
              <button
                key={zikr.name}
                type="button"
                onClick={() => {
                  setSelectedZikr(zikr.name);
                  setTasbihCount(0);
                }}
                className={`rounded-full px-3 py-1 text-sm font-semibold transition ${
                  selectedZikr === zikr.name ? 'bg-emerald-600 text-white' : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                }`}
              >
                {zikr.name}
              </button>
            ))}
          </div>
          <div className="mb-4 text-center">
            <p className="mb-1 text-2xl nz-text">{selectedPreset.arabic}</p>
            <div className="my-3 text-6xl font-bold nz-accent">{tasbihCount}</div>
            <p className="text-sm nz-muted">{t.target}: {selectedPreset.target}</p>
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={() => setTasbihCount((value) => value + 1)} className="flex-1 rounded-xl bg-emerald-600 py-3 text-lg font-bold text-white transition hover:bg-emerald-700">
              {t.increment}
            </button>
            <button type="button" onClick={() => setTasbihCount(0)} className="rounded-xl bg-amber-100 px-4 text-amber-700 transition hover:bg-amber-200">
              {t.reset}
            </button>
          </div>
          <div className="mt-4 h-2 rounded-full bg-emerald-100">
            <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${Math.min((tasbihCount / selectedPreset.target) * 100, 100)}%` }} />
          </div>
        </div>
      )}

      {showMosques && (
        <div className="rounded-xl p-5 shadow-lg animate-[az-slide-up_250ms_ease-out] nz-card">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <h4 className="font-bold nz-text">{t.nearbyMosque}</h4>
              <p className="mt-1 text-sm nz-muted">{nearbyMosques.searchLabel || formatLocation(location)}</p>
            </div>
            <button type="button" onClick={() => setShowMosques(false)} className="rounded-lg p-1 text-slate-500 hover:bg-slate-100">
              <X size={18} />
            </button>
          </div>

          {nearbyMosques.status === 'loading' && (
            <div className="flex items-center gap-2 rounded-lg p-3 text-sm font-semibold nz-soft nz-text">
              <Loader2 size={16} className="animate-spin" />
              {t.searching}
            </div>
          )}

          {nearbyMosques.status === 'empty' && (
            <div className="rounded-lg p-3 text-sm nz-soft nz-muted">
              {t.empty}
            </div>
          )}

          {nearbyMosques.status === 'error' && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
              {nearbyMosques.error}
            </div>
          )}

          {nearbyMosques.nearest && (
            <div className="space-y-3">
              <div className="rounded-xl p-4 nz-soft">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold nz-text">{nearbyMosques.nearest.name}</p>
                    <p className="mt-1 text-sm nz-muted">
                      {formatMosqueDistance(nearbyMosques.nearest.distanceMeters)}
                      {nearbyMosques.nearest.address ? ` • ${nearbyMosques.nearest.address}` : ''}
                    </p>
                  </div>
                  <a
                    href={mosqueMapUrl(nearbyMosques.nearest)}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-2 text-xs font-bold text-white transition hover:bg-blue-700"
                  >
                    <Navigation size={14} />
                    {t.direction}
                  </a>
                </div>
              </div>

              {nearbyMosques.mosques.slice(1, 5).map((mosque) => (
                <div key={mosque.id} className="flex items-center justify-between gap-3 rounded-lg border border-slate-100 px-3 py-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-800">{mosque.name}</p>
                    <p className="text-xs text-slate-500">
                      {formatMosqueDistance(mosque.distanceMeters)}
                      {mosque.address ? ` • ${mosque.address}` : ''}
                    </p>
                  </div>
                  <a href={mosqueMapUrl(mosque)} target="_blank" rel="noreferrer" className="rounded-lg p-2 text-blue-600 hover:bg-blue-50" aria-label={`Open ${mosque.name} in map`}>
                    <ExternalLink size={16} />
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
