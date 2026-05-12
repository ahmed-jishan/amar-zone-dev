// // app/(tabs)/namaz/components/DashboardView/PrayerTimeCard.tsx
// 'use client';

// import { useState, useRef, useEffect } from 'react';
// import { Clock, Users, CheckCircle, Circle, AlertCircle, Star, Moon } from 'lucide-react';

// type PrayerStatus = 'pending' | 'onTime' | 'late' | 'missed' | 'jamaat';

// interface PrayerData {
//   Fajr: { adhan: string; jamaat: string; status: PrayerStatus };
//   Dhuhr: { adhan: string; jamaat: string; status: PrayerStatus };
//   Asr: { adhan: string; jamaat: string; status: PrayerStatus };
//   Maghrib: { adhan: string; jamaat: string; status: PrayerStatus };
//   Isha: { adhan: string; jamaat: string; status: PrayerStatus };
// }

// interface Props {
//   prayerTimes: PrayerData;
//   onMarkPrayer: (prayerName: string, status: PrayerStatus) => void;
// }

// // Helper SunIcon
// const SunIcon = ({ size }: { size: number }) => (
//   <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
//     <circle cx="12" cy="12" r="4" />
//     <path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
//   </svg>
// );

// const prayerOrder = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];
// const prayerIcons: Record<string, React.ReactNode> = {
//   Fajr: <Moon size={20} />,
//   Dhuhr: <SunIcon size={20} />,
//   Asr: <SunIcon size={20} />,
//   Maghrib: <SunIcon size={20} />,
//   Isha: <Moon size={20} />
// };

// const statusColors = {
//   pending: { bg: 'bg-white/70', border: 'border-emerald-100', icon: <Circle size={22} className="text-emerald-300" />, label: '' },
//   onTime: { bg: 'bg-emerald-50/80', border: 'border-emerald-200', icon: <CheckCircle size={22} className="text-emerald-600" />, label: 'সময়মত' },
//   late: { bg: 'bg-amber-50/80', border: 'border-amber-200', icon: <AlertCircle size={22} className="text-amber-600" />, label: 'দেরি' },
//   missed: { bg: 'bg-red-50/80', border: 'border-red-200', icon: <AlertCircle size={22} className="text-red-500" />, label: 'কাজা' },
//   jamaat: { bg: 'bg-blue-50/80', border: 'border-blue-200', icon: <Users size={22} className="text-blue-600" />, label: 'জামাত' }
// };

// export default function PrayerTimeCard({ prayerTimes, onMarkPrayer }: Props) {
//   const [openDropdown, setOpenDropdown] = useState<string | null>(null);
//   const dropdownRef = useRef<HTMLDivElement>(null);

//   // Close dropdown when clicking outside
//   useEffect(() => {
//     const handleClickOutside = (event: MouseEvent) => {
//       if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
//         setOpenDropdown(null);
//       }
//     };
//     document.addEventListener('mousedown', handleClickOutside);
//     return () => document.removeEventListener('mousedown', handleClickOutside);
//   }, []);

//   const handleStatusChange = (prayerName: string, status: PrayerStatus) => {
//     onMarkPrayer(prayerName, status);
//     setOpenDropdown(null);
//   };

//   return (
//     <div className="space-y-3">
//       <h3 className="text-lg font-semibold text-emerald-900 flex items-center gap-2">
//         <span className="w-1 h-6 bg-emerald-500 rounded-full"></span>
//         আজকের নামাজের সময়সূচি
//       </h3>
      
//       {prayerOrder.map((prayer) => {
//         const data = prayerTimes[prayer as keyof PrayerData];
//         const currentStatus = data.status;
//         const statusStyle = statusColors[currentStatus];
        
//         return (
//           <div 
//             key={prayer}
//             className={`flex flex-wrap items-center justify-between p-4 rounded-xl transition-all duration-200 ${statusStyle.bg} border ${statusStyle.border} backdrop-blur-sm hover:shadow-md relative`}
//           >
//             <div className="flex items-center gap-4">
//               <div className="text-emerald-700">
//                 {prayerIcons[prayer]}
//               </div>
//               <div>
//                 <h4 className="font-bold text-emerald-900 text-lg">{prayer}</h4>
//                 <div className="flex gap-3 text-sm text-emerald-600">
//                   <span className="flex items-center gap-1"><Clock size={12} /> {data.adhan}</span>
//                   <span className="flex items-center gap-1"><Users size={12} /> {data.jamaat}</span>
//                 </div>
//               </div>
//             </div>
            
//             <div className="relative" ref={openDropdown === prayer ? dropdownRef : null}>
//               {currentStatus !== 'pending' ? (
//                 <div className="flex items-center gap-2">
//                   {statusStyle.icon}
//                   <span className="text-sm font-medium text-emerald-700">{statusStyle.label}</span>
//                   <button 
//                     onClick={() => setOpenDropdown(openDropdown === prayer ? null : prayer)}
//                     className="ml-2 text-emerald-500 hover:text-emerald-700"
//                   >
//                     <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
//                       <path d="M6 9l6 6 6-6" />
//                     </svg>
//                   </button>
//                 </div>
//               ) : (
//                 <button
//                   onClick={() => setOpenDropdown(openDropdown === prayer ? null : prayer)}
//                   className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition flex items-center gap-2"
//                 >
//                   <CheckCircle size={16} />
//                   মার্ক করুন
//                 </button>
//               )}
              
//               {/* Dropdown - positioned ABOVE the button to avoid clipping */}
//               {openDropdown === prayer && (
//                 <div className="absolute bottom-full right-0 mb-2 w-48 bg-white rounded-lg shadow-xl border border-emerald-100 z-50 overflow-hidden">
//                   {Object.entries(statusColors).map(([status, style]) => (
//                     <button
//                       key={status}
//                       onClick={() => handleStatusChange(prayer, status as PrayerStatus)}
//                       className="flex items-center gap-3 w-full px-4 py-2.5 text-left text-sm hover:bg-emerald-50 transition-colors text-gray-800"
//                     >
//                       <span className="flex-shrink-0">{style.icon}</span>
//                       <span className="font-medium">{style.label || 'পেন্ডিং'}</span>
//                     </button>
//                   ))}
//                 </div>
//               )}
//             </div>
//           </div>
//         );
//       })}
//     </div>
//   );
// }

'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

type PrayerStatus = 'pending' | 'onTime' | 'late' | 'missed' | 'jamaat';

interface PrayerEntry {
  adhan: string;
  jamaat: string;
  status: PrayerStatus;
}

interface PrayerData {
  Fajr:    PrayerEntry;
  Dhuhr:   PrayerEntry;
  Asr:     PrayerEntry;
  Maghrib: PrayerEntry;
  Isha:    PrayerEntry;
}

interface Props {
  prayerTimes: PrayerData;
  onMarkPrayer: (prayer: string, status: PrayerStatus) => void;
}

// ─── Static config ────────────────────────────────────────────────────────────

const PRAYER_ORDER = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'] as const;

const PRAYER_META: Record<string, { bn: string; iconClass: string; badgeBg: string; badgeColor: string }> = {
  Fajr:    { bn: 'ফজর',    iconClass: 'ti-moon',        badgeBg: '#ede9fe', badgeColor: '#7c3aed' },
  Dhuhr:   { bn: 'যোহর',   iconClass: 'ti-sun',         badgeBg: '#fef3c7', badgeColor: '#b45309' },
  Asr:     { bn: 'আসর',    iconClass: 'ti-sun',         badgeBg: '#fef3c7', badgeColor: '#b45309' },
  Maghrib: { bn: 'মাগরিব', iconClass: 'ti-sunset',      badgeBg: '#ffedd5', badgeColor: '#c2410c' },
  Isha:    { bn: 'এশা',    iconClass: 'ti-moon-stars',  badgeBg: '#ede9fe', badgeColor: '#7c3aed' },
};

const STATUS_META: Record<PrayerStatus, {
  chipBg: string; chipColor: string;
  iconClass: string; dropIconBg: string; dropIconColor: string;
  label: string; sub: string;
}> = {
  pending: {
    chipBg: '#f1f5f9', chipColor: '#64748b',
    iconClass: 'ti-circle-dashed', dropIconBg: '#f1f5f9', dropIconColor: '#94a3b8',
    label: 'মার্ক করুন', sub: 'এখনো পড়া হয়নি',
  },
  onTime: {
    chipBg: '#d1fae5', chipColor: '#065742',
    iconClass: 'ti-circle-check', dropIconBg: '#d1fae5', dropIconColor: '#059669',
    label: 'সময়মত', sub: 'সঠিক সময়ে আদায়',
  },
  jamaat: {
    chipBg: '#dbeafe', chipColor: '#1e40af',
    iconClass: 'ti-users', dropIconBg: '#dbeafe', dropIconColor: '#2563eb',
    label: 'জামাতে', sub: 'জামাতে আদায়',
  },
  late: {
    chipBg: '#fef3c7', chipColor: '#92400e',
    iconClass: 'ti-clock-exclamation', dropIconBg: '#fef3c7', dropIconColor: '#d97706',
    label: 'দেরিতে', sub: 'সময়ের পরে',
  },
  missed: {
    chipBg: '#fee2e2', chipColor: '#991b1b',
    iconClass: 'ti-circle-x', dropIconBg: '#fee2e2', dropIconColor: '#dc2626',
    label: 'কাজা', sub: 'আদায় হয়নি',
  },
};

const STATUS_OPTIONS: PrayerStatus[] = ['onTime', 'jamaat', 'late', 'missed'];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const toMins = (t: string) => {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
};

const isDone = (s: PrayerStatus) => s === 'onTime' || s === 'jamaat' || s === 'late';

// ─── Subcomponents ────────────────────────────────────────────────────────────

function StatusDropdown({
  prayerKey,
  current,
  onSelect,
  onClose,
}: {
  prayerKey: string;
  current: PrayerStatus;
  onSelect: (s: PrayerStatus) => void;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  return (
    <div
      ref={ref}
      role="listbox"
      className="absolute right-0 top-[calc(100%+6px)] z-50 overflow-hidden"
      style={{
        background: '#fff',
        border: '1px solid rgba(6,87,66,0.12)',
        borderRadius: 14,
        minWidth: 200,
        boxShadow: '0 8px 32px rgba(5,150,105,0.14), 0 2px 8px rgba(0,0,0,0.06)',
        animation: 'dropIn .18s cubic-bezier(.34,1.56,.64,1)',
      }}
    >
      <div
        style={{
          padding: '9px 14px 7px',
          fontSize: 10, fontWeight: 700, color: '#9ca3af',
          letterSpacing: '0.08em', textTransform: 'uppercase',
          borderBottom: '1px solid rgba(6,87,66,0.07)',
        }}
      >
        নামাজের অবস্থা
      </div>

      {STATUS_OPTIONS.map(s => {
        const m = STATUS_META[s];
        const isSelected = s === current;
        return (
          <button
            key={s}
            role="option"
            aria-selected={isSelected}
            onClick={() => onSelect(s)}
            className="flex items-center gap-3 w-full text-left transition-colors"
            style={{
              padding: '9px 14px', border: 'none', cursor: 'pointer',
              background: isSelected ? 'rgba(240,253,244,0.8)' : 'transparent',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = '#f0fdf4')}
            onMouseLeave={e => (e.currentTarget.style.background = isSelected ? 'rgba(240,253,244,0.8)' : 'transparent')}
          >
            <div
              className="flex items-center justify-center flex-shrink-0 rounded-[8px]"
              style={{ width: 28, height: 28, background: m.dropIconBg, color: m.dropIconColor, fontSize: 14 }}
            >
              <i className={`ti ${m.iconClass}`} aria-hidden />
            </div>
            <div className="flex-1 min-w-0">
              <div style={{ fontSize: 13, fontWeight: 600, color: m.dropIconColor }}>{m.label}</div>
              <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 1 }}>{m.sub}</div>
            </div>
            {isSelected && (
              <i className="ti ti-check flex-shrink-0" aria-hidden style={{ color: '#059669', fontSize: 15 }} />
            )}
          </button>
        );
      })}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function PrayerTimeCard({ prayerTimes, onMarkPrayer }: Props) {
  const [openDrop, setOpenDrop] = useState<string | null>(null);
  const [nowMins, setNowMins] = useState(() => {
    const n = new Date();
    return n.getHours() * 60 + n.getMinutes();
  });

  useEffect(() => {
    const id = setInterval(() => {
      const n = new Date();
      setNowMins(n.getHours() * 60 + n.getMinutes());
    }, 30_000);
    return () => clearInterval(id);
  }, []);

  const closeDrop = useCallback(() => setOpenDrop(null), []);

  /** Which row is the current "next" prayer */
  const nextPrayerKey = (() => {
    for (const key of PRAYER_ORDER) {
      const s = prayerTimes[key].status;
      if (s === 'pending' && toMins(prayerTimes[key].adhan) > nowMins) return key;
    }
    return null;
  })();

  // Summary counts
  const doneCount = PRAYER_ORDER.filter(k => isDone(prayerTimes[k].status)).length;
  const missedCount = PRAYER_ORDER.filter(k => prayerTimes[k].status === 'missed').length;
  const pendCount = PRAYER_ORDER.filter(k => prayerTimes[k].status === 'pending').length;
  const progressPct = Math.round((doneCount / 5) * 100);

  return (
    <div
      className="overflow-hidden"
      style={{
        background: '#fff',
        borderRadius: 20,
        border: '1px solid rgba(16,185,129,0.14)',
        boxShadow: '0 4px 24px rgba(5,150,105,0.08)',
      }}
    >
      {/* ── Header ── */}
      <div
        className="flex items-center justify-between"
        style={{ padding: '16px 20px 13px', borderBottom: '1px solid rgba(6,87,66,0.07)' }}
      >
        <div className="flex items-center gap-2.5" style={{ fontSize: 15, fontWeight: 600, color: '#065742' }}>
          <div style={{ width: 3, height: 20, borderRadius: 2, background: '#059669', flexShrink: 0 }} />
          আজকের নামাজের সময়সূচি
        </div>
        <div className="flex items-center gap-1.5">
          <span
            className="flex items-center gap-1"
            style={{ fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 20, background: '#d1fae5', color: '#065742' }}
          >
            <i className="ti ti-check" aria-hidden style={{ fontSize: 11 }} />
            {doneCount} আদায়
          </span>
          {missedCount > 0 && (
            <span
              style={{ fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 20, background: '#fee2e2', color: '#991b1b' }}
            >
              {missedCount} কাজা
            </span>
          )}
          {pendCount > 0 && (
            <span
              style={{ fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 20, background: '#f3f4f6', color: '#4b5563' }}
            >
              {pendCount} বাকি
            </span>
          )}
        </div>
      </div>

      {/* ── Prayer rows ── */}
      <div>
        {PRAYER_ORDER.map((key, idx) => {
          const entry = prayerTimes[key];
          const s = entry.status;
          const meta = PRAYER_META[key];
          const sMeta = STATUS_META[s];
          const isNext = key === nextPrayerKey;
          const done = isDone(s);
          const isOpen = openDrop === key;

          return (
            <div
              key={key}
              className="relative"
              style={{
                display: 'grid',
                gridTemplateColumns: '36px 1fr auto',
                alignItems: 'center',
                gap: '0 12px',
                padding: '11px 20px',
                borderBottom: idx < 4 ? '1px solid rgba(6,87,66,0.05)' : 'none',
                background: isNext ? 'rgba(5,150,105,0.04)' : 'transparent',
                opacity: done && !isNext ? 0.72 : 1,
                transition: 'background .15s',
              }}
            >
              {/* Next-prayer accent bar */}
              {isNext && (
                <div
                  aria-hidden
                  style={{
                    position: 'absolute', left: 0, top: 8, bottom: 8,
                    width: 3, borderRadius: '0 2px 2px 0', background: '#059669',
                  }}
                />
              )}

              {/* Icon badge */}
              <div
                className="flex items-center justify-center flex-shrink-0 rounded-[10px]"
                style={{
                  width: 36, height: 36,
                  background: meta.badgeBg,
                  color: meta.badgeColor,
                  fontSize: 17,
                }}
              >
                <i className={`ti ${meta.iconClass}`} aria-hidden />
              </div>

              {/* Name + times */}
              <div>
                <div className="flex items-center gap-2" style={{ marginBottom: 3 }}>
                  <span style={{ fontSize: 15, fontWeight: 600, color: '#065742', lineHeight: 1.2 }}>
                    {meta.bn}
                  </span>
                  {isNext && (
                    <span
                      style={{
                        fontSize: 10, fontWeight: 600, padding: '2px 7px',
                        borderRadius: 20, background: 'rgba(5,150,105,0.12)', color: '#065742',
                        letterSpacing: '0.03em',
                      }}
                    >
                      এখন
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1" style={{ fontSize: 12, color: '#4b7a66', fontWeight: 500 }}>
                    <i className="ti ti-clock" aria-hidden style={{ fontSize: 12 }} />
                    <span style={{ fontVariantNumeric: 'tabular-nums' }}>{entry.adhan}</span>
                    <span style={{ fontSize: 10, color: '#9ca3af', marginLeft: 1 }}>আযান</span>
                  </span>
                  <span className="flex items-center gap-1" style={{ fontSize: 12, color: '#4b7a66', fontWeight: 500 }}>
                    <i className="ti ti-users" aria-hidden style={{ fontSize: 12 }} />
                    <span style={{ fontVariantNumeric: 'tabular-nums' }}>{entry.jamaat}</span>
                    <span style={{ fontSize: 10, color: '#9ca3af', marginLeft: 1 }}>জামাত</span>
                  </span>
                </div>
              </div>

              {/* Status chip + dropdown */}
              <div className="relative flex items-center flex-shrink-0">
                <button
                  aria-haspopup="listbox"
                  aria-expanded={isOpen}
                  onClick={e => {
                    e.stopPropagation();
                    setOpenDrop(isOpen ? null : key);
                  }}
                  className="flex items-center gap-1.5"
                  style={{
                    padding: '5px 10px',
                    borderRadius: 8,
                    border: 'none',
                    cursor: 'pointer',
                    background: sMeta.chipBg,
                    color: sMeta.chipColor,
                    fontSize: 12,
                    fontWeight: 600,
                    whiteSpace: 'nowrap',
                    transition: 'filter .15s',
                    fontFamily: 'inherit',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.filter = 'brightness(0.94)')}
                  onMouseLeave={e => (e.currentTarget.style.filter = 'none')}
                >
                  <i className={`ti ${sMeta.iconClass}`} aria-hidden style={{ fontSize: 13 }} />
                  {sMeta.label}
                  <i className="ti ti-chevron-down" aria-hidden style={{ fontSize: 11, opacity: 0.6 }} />
                </button>

                {isOpen && (
                  <StatusDropdown
                    prayerKey={key}
                    current={s}
                    onSelect={newStatus => {
                      onMarkPrayer(key, newStatus);
                      setOpenDrop(null);
                    }}
                    onClose={closeDrop}
                  />
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Progress bar ── */}
      <div
        style={{
          padding: '11px 20px 15px',
          borderTop: '1px solid rgba(6,87,66,0.06)',
          background: '#fafffe',
        }}
      >
        <div className="flex justify-between items-center" style={{ marginBottom: 6 }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: '#4b7a66', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
            দৈনিক অগ্রগতি
          </span>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#059669' }}>
            {doneCount}/৫
          </span>
        </div>
        <div style={{ height: 5, borderRadius: 3, background: '#e8f5f0', overflow: 'hidden' }}>
          <div
            style={{
              height: '100%', borderRadius: 3,
              background: 'linear-gradient(90deg,#059669,#0d9488)',
              width: `${progressPct}%`,
              transition: 'width .6s cubic-bezier(.34,1,.64,1)',
            }}
          />
        </div>
      </div>

      <style>{`
        @keyframes dropIn {
          from { opacity:0; transform:translateY(-6px) scale(.97); }
          to   { opacity:1; transform:none; }
        }
      `}</style>
    </div>
  );
}