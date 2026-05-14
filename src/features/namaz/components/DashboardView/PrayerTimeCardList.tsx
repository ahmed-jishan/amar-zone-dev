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
import { createPortal } from 'react-dom';
import { useState, useEffect, useRef, useCallback } from 'react';

/* ═══════════════════════════════════════════════════════════════════════════
   Types
═══════════════════════════════════════════════════════════════════════════ */
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

/* ═══════════════════════════════════════════════════════════════════════════
   Static config
═══════════════════════════════════════════════════════════════════════════ */
const PRAYER_ORDER = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'] as const;

// SVG icons (inline — no icon font dependency)
const PrayerIcons: Record<string, JSX.Element> = {
  Fajr: (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
      <path d="M12 3v1M12 20v1M4.22 4.22l.7.7M18.36 18.36l.7.7M3 12H2M22 12h-1M4.92 19.07l.7-.7M18.36 5.64l.7-.7"/>
      <path d="M17 12a5 5 0 1 1-10 0 5 5 0 0 1 10 0z"/>
      {/* Crescent overlay for dawn */}
      <path d="M9 9a3 3 0 0 0 4.65 2.5A5 5 0 0 1 9 9z" fill="currentColor" stroke="none" opacity="0.3"/>
    </svg>
  ),
  Dhuhr: (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
      <circle cx="12" cy="12" r="5" fill="currentColor" fillOpacity="0.12"/>
      <path d="M12 2v3M12 19v3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M2 12h3M19 12h3M4.22 19.78l2.12-2.12M17.66 6.34l2.12-2.12"/>
    </svg>
  ),
  Asr: (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
      <circle cx="12" cy="12" r="4"/>
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/>
      <path d="M12 16a4 4 0 0 0 0-8" strokeOpacity="0.35"/>
    </svg>
  ),
  Maghrib: (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
      <path d="M12 19a7 7 0 0 0 0-14c0 5-3 8-5 9.5A7 7 0 0 0 12 19z" fill="currentColor" fillOpacity="0.1"/>
      <path d="M5 19h14M2 19h2M20 19h2"/>
      <path d="M12 5v2M6 7l1.5 1.5M18 7l-1.5 1.5"/>
    </svg>
  ),
  Isha: (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" fill="currentColor" fillOpacity="0.12"/>
      <circle cx="17" cy="6"  r="0.8" fill="currentColor"/>
      <circle cx="20" cy="10" r="0.6" fill="currentColor"/>
      <circle cx="19" cy="4"  r="0.5" fill="currentColor"/>
    </svg>
  ),
};

const PRAYER_META: Record<string, {
  bn: string;
  time: string; // descriptive period
  iconBg: string;
  iconColor: string;
}> = {
  Fajr:    { bn: 'ফজর',    time: 'ভোর',      iconBg: 'rgba(109,40,217,0.08)',  iconColor: '#7c3aed' },
  Dhuhr:   { bn: 'যোহর',   time: 'দুপুর',    iconBg: 'rgba(217,119,6,0.10)',   iconColor: '#b45309' },
  Asr:     { bn: 'আসর',    time: 'বিকাল',    iconBg: 'rgba(217,119,6,0.10)',   iconColor: '#b45309' },
  Maghrib: { bn: 'মাগরিব', time: 'সন্ধ্যা',  iconBg: 'rgba(234,88,12,0.09)',   iconColor: '#c2410c' },
  Isha:    { bn: 'এশা',    time: 'রাত',       iconBg: 'rgba(67,56,202,0.08)',   iconColor: '#4338ca' },
};

   //STATUS_META  — add / replace this object in your file
//══════════════════════════════════════════════════════════════════════════ */
const STATUS_META: Record<PrayerStatus, {
  bg: string; color: string; border: string;
  dotColor: string;
  label: string; labelShort: string; sub: string;
  rowTint: string;
}> = {
  pending: {
    bg: 'rgba(241,245,249,0.85)', color: '#64748b', border: 'rgba(148,163,184,0.35)',
    dotColor: '#cbd5e1',
    label: 'পেন্ডিং', labelShort: 'বাকি', sub: 'এখনো পড়া হয়নি',
    rowTint: 'transparent',
  },
  onTime: {
    bg: 'rgba(209,250,229,0.85)', color: '#065742', border: 'rgba(16,185,129,0.35)',
    dotColor: '#10b981',
    label: 'সময়মত', labelShort: 'সময়মত', sub: 'সঠিক সময়ে আদায়',
    rowTint: 'rgba(5,150,105,0.025)',
  },
  jamaat: {
    bg: 'rgba(219,234,254,0.85)', color: '#1e40af', border: 'rgba(59,130,246,0.35)',
    dotColor: '#3b82f6',
    label: 'জামাতে', labelShort: 'জামাত', sub: 'জামাতের সাথে আদায়',
    rowTint: 'rgba(59,130,246,0.025)',
  },
  late: {
    bg: 'rgba(254,243,199,0.85)', color: '#92400e', border: 'rgba(217,119,6,0.35)',
    dotColor: '#f59e0b',
    label: 'দেরিতে', labelShort: 'দেরিতে', sub: 'ওয়াক্তের পরে আদায়',
    rowTint: 'rgba(245,158,11,0.025)',
  },
  missed: {
    bg: 'rgba(254,226,226,0.85)', color: '#991b1b', border: 'rgba(239,68,68,0.35)',
    dotColor: '#ef4444',
    label: 'কাজা', labelShort: 'কাজা', sub: 'ওয়াক্ত চলে গেছে',
    rowTint: 'rgba(239,68,68,0.025)',
  },
};

const STATUS_OPTIONS: PrayerStatus[] = ['pending', 'onTime', 'jamaat', 'late', 'missed'];
/* ═══════════════════════════════════════════════════════════════════════════
   Helpers
═══════════════════════════════════════════════════════════════════════════ */
const toMins = (t: string) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
const isDone  = (s: PrayerStatus) => s === 'onTime' || s === 'jamaat' || s === 'late';

/* ═══════════════════════════════════════════════════════════════════════════
   Status Dropdown
═══════════════════════════════════════════════════════════════════════════ */
function useDropdownPosition(
  triggerRef: React.RefObject<HTMLButtonElement>,
  isOpen: boolean
) {
  const [pos, setPos] = useState({ top: 0, left: 0, width: 0, openUp: false });

  useEffect(() => {
    if (!isOpen || !triggerRef.current) return;

    const DROPDOWN_H = 260;
    const GAP = 6;

    const recalc = () => {
      const rect = triggerRef.current!.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const openUp = spaceBelow < DROPDOWN_H + GAP && rect.top > DROPDOWN_H + GAP;

      setPos({
        top: openUp ? rect.top - DROPDOWN_H - GAP : rect.bottom + GAP,
        left: Math.max(
          8,
          Math.min(rect.right - 200, window.innerWidth - 208)
        ),
        width: 200,
        openUp,
      });
    };

    recalc();
    window.addEventListener('scroll', recalc, true);
    window.addEventListener('resize', recalc);

    return () => {
      window.removeEventListener('scroll', recalc, true);
      window.removeEventListener('resize', recalc);
    };
  }, [isOpen, triggerRef]);

  return pos;
}

function StatusDropdown({
  triggerRef,
  current,
  onSelect,
  onClose,
}: {
  triggerRef: React.RefObject<HTMLButtonElement>;
  current: PrayerStatus;
  onSelect: (s: PrayerStatus) => void;
  onClose: () => void;
}) {
  const menuRef = useRef<HTMLDivElement>(null);
  const pos = useDropdownPosition(triggerRef, true);

  useEffect(() => {
    const handle = (e: MouseEvent) => {
      if (
        menuRef.current && !menuRef.current.contains(e.target as Node) &&
        triggerRef.current && !triggerRef.current.contains(e.target as Node)
      ) {
        onClose();
      }
    };

    const id = setTimeout(() => document.addEventListener('mousedown', handle), 10);
    return () => {
      clearTimeout(id);
      document.removeEventListener('mousedown', handle);
    };
  }, [onClose, triggerRef]);

  useEffect(() => {
    const handle = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', handle);
    return () => document.removeEventListener('keydown', handle);
  }, [onClose]);

  const menu = (
    <div
      ref={menuRef}
      role="listbox"
      style={{
        position: 'fixed',
        top: pos.top,
        left: pos.left,
        width: pos.width,
        zIndex: 9999,
        background: 'rgba(255,255,255,0.97)',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(6,87,66,0.10)',
        borderRadius: 14,
        boxShadow: '0 8px 32px rgba(5,150,105,0.12), 0 2px 10px rgba(0,0,0,0.07)',
        animation: pos.openUp
          ? 'qaDropUp .17s cubic-bezier(.34,1.56,.64,1)'
          : 'qaDropIn .17s cubic-bezier(.34,1.56,.64,1)',
        overflow: 'hidden',
      }}
    >
      {STATUS_OPTIONS.map((s, idx) => {
        const m = STATUS_META[s];
        const active = s === current;

        return (
          <button
            key={s}
            role="option"
            aria-selected={active}
            onClick={() => onSelect(s)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              width: '100%',
              padding: '8px 12px',
              background: active ? m.bg : 'transparent',
              border: 'none',
              borderBottom: idx < STATUS_OPTIONS.length - 1
                ? '1px solid rgba(6,87,66,0.05)'
                : 'none',
              cursor: 'pointer',
              transition: 'background 0.1s',
              fontFamily: 'inherit',
              textAlign: 'left',
            }}
            onMouseEnter={e => {
              if (!active) e.currentTarget.style.background = 'rgba(240,253,244,0.7)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = active ? m.bg : 'transparent';
            }}
          >
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: m.dotColor, flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12.5, fontWeight: 600, color: m.color, lineHeight: 1.3 }}>
                {m.label}
              </div>
              <div style={{ fontSize: 10, color: '#9ca3af', marginTop: 1 }}>
                {m.sub}
              </div>
            </div>
            {active && (
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ flexShrink: 0 }}>
                <path d="M2 6l3 3 5-5" stroke="#059669" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )}
          </button>
        );
      })}
    </div>
  );

  return typeof document !== 'undefined'
    ? createPortal(menu, document.body)
    : null;
}

export function StatusChip({
  prayerKey,
  status,
  isOpen,
  onToggle,
  onClose,
  onSelect,
}: {
  prayerKey: string;
  status: PrayerStatus;
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
  onSelect: (s: PrayerStatus) => void;
}) {
  const triggerRef = useRef<HTMLButtonElement>(null!);
  const sm = STATUS_META[status];

  return (
    <div className="relative flex-shrink-0" data-prayer-key={prayerKey}>
      <button
        ref={triggerRef}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        onClick={e => { e.stopPropagation(); onToggle(); }}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 5,
          padding: '5px 10px',
          borderRadius: 9,
          border: `1px solid ${sm.border}`,
          background: sm.bg,
          color: sm.color,
          fontSize: 12,
          fontWeight: 600,
          cursor: 'pointer',
          whiteSpace: 'nowrap',
          fontFamily: 'inherit',
          transition: 'filter 0.12s, transform 0.1s',
        }}
        onMouseEnter={e => { e.currentTarget.style.filter = 'brightness(0.93)'; }}
        onMouseLeave={e => { e.currentTarget.style.filter = 'none'; }}
        onMouseDown={e => { e.currentTarget.style.transform = 'scale(0.96)'; }}
        onMouseUp={e => { e.currentTarget.style.transform = 'scale(1)'; }}
      >
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: sm.dotColor, flexShrink: 0 }} />
        {sm.labelShort}
        <svg
          width="9"
          height="9"
          viewBox="0 0 9 9"
          fill="none"
          style={{
            opacity: 0.5,
            marginLeft: 1,
            transition: 'transform 0.15s',
            transform: isOpen ? 'rotate(180deg)' : 'none',
          }}
        >
          <path d="M1.5 3l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      </button>

      {isOpen && (
        <StatusDropdown
          triggerRef={triggerRef}
          current={status}
          onSelect={onSelect}
          onClose={onClose}
        />
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Countdown chip  (shown on the "next" prayer row)
═══════════════════════════════════════════════════════════════════════════ */
function CountdownChip({ adhanTime }: { adhanTime: string }) {
  const [label, setLabel] = useState('');

  const calc = useCallback(() => {
    const now  = new Date();
    const [h, m] = adhanTime.split(':').map(Number);
    const target = new Date();
    target.setHours(h, m, 0, 0);
    let diff = Math.floor((target.getTime() - now.getTime()) / 1000);
    if (diff < 0) { setLabel('এখন'); return; }
    const hrs  = Math.floor(diff / 3600);
    const mins = Math.floor((diff % 3600) / 60);
    const secs = diff % 60;
    setLabel(hrs > 0
      ? `${hrs}ঘ ${mins}মি`
      : mins > 0
      ? `${mins}মি ${secs}সে`
      : `${secs}সে`
    );
  }, [adhanTime]);

  useEffect(() => {
    calc();
    const id = setInterval(calc, 1000);
    return () => clearInterval(id);
  }, [calc]);

  return (
    <span
      style={{
        fontSize: 10, fontWeight: 700,
        padding: '2px 7px', borderRadius: 20,
        background: 'rgba(5,150,105,0.10)',
        color: '#065742',
        letterSpacing: '0.02em',
        fontVariantNumeric: 'tabular-nums',
      }}
    >
      ⏱ {label}
    </span>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Progress ring  (small SVG for the summary header)
═══════════════════════════════════════════════════════════════════════════ */
function ProgressRing({ value, max, size = 36 }: { value: number; max: number; size?: number }) {
  const r   = (size - 5) / 2;
  const cir = 2 * Math.PI * r;
  const pct = Math.min(value / max, 1);
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(5,150,105,0.10)" strokeWidth="4"/>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#059669" strokeWidth="4"
        strokeLinecap="round"
        strokeDasharray={cir}
        strokeDashoffset={cir * (1 - pct)}
        style={{ transition: 'stroke-dashoffset 0.7s cubic-bezier(.34,1,.64,1)' }}
      />
    </svg>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Main component
═══════════════════════════════════════════════════════════════════════════ */
export default function PrayerTimeCard({ prayerTimes, onMarkPrayer }: Props) {
  const [openDrop, setOpenDrop]   = useState<string | null>(null);
  const [mounted,  setMounted]    = useState(false);
  const [nowMins,  setNowMins]    = useState(0);

  useEffect(() => {
    setMounted(true);
    const tick = () => { const n = new Date(); setNowMins(n.getHours() * 60 + n.getMinutes()); };
    tick();
    const id = setInterval(tick, 30_000);
    return () => clearInterval(id);
  }, []);

  const closeDrop = useCallback(() => setOpenDrop(null), []);

  // Summary
  const doneCount   = PRAYER_ORDER.filter(k => isDone(prayerTimes[k].status)).length;
  const missedCount = PRAYER_ORDER.filter(k => prayerTimes[k].status === 'missed').length;
  const pendCount   = PRAYER_ORDER.filter(k => prayerTimes[k].status === 'pending').length;
  const progressPct = Math.round((doneCount / 5) * 100);

  // Next prayer
  const nextPrayerKey = (() => {
    for (const key of PRAYER_ORDER) {
      if (prayerTimes[key].status === 'pending' && toMins(prayerTimes[key].adhan) > nowMins) return key;
    }
    return null;
  })();

  return (
    <div
      className="overflow-hidden"
      style={{
        borderRadius: 22,
        border: '1px solid rgba(16,185,129,0.14)',
        // glass card — sits on emerald-50/teal-50/amber-50 background
        background: 'rgba(255,255,255,0.72)',
        backdropFilter: 'blur(16px)',
        boxShadow: '0 4px 32px rgba(5,150,105,0.08), 0 1px 4px rgba(6,87,66,0.05)',
      }}
    >
      {/* Geometric diamond watermark — matches root bg pattern */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none opacity-[0.025] rounded-[22px] overflow-hidden"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M20 3L37 20L20 37L3 20Z' fill='none' stroke='%23065742' stroke-width='0.7'/%3E%3C/svg%3E")`,
          backgroundSize: '40px 40px',
        }}
      />

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div
        style={{
          padding: '16px 20px 14px',
          borderBottom: '1px solid rgba(6,87,66,0.06)',
          background: 'rgba(255,255,255,0.5)',
        }}
      >
        <div className="flex items-center justify-between">
          {/* Title */}
          <div className="flex items-center gap-2.5">
            <div style={{ width: 3, height: 20, borderRadius: 2, background: 'linear-gradient(180deg,#059669,#0d9488)', flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#065742', lineHeight: 1.2 }}>
                আজকের নামাজ
              </div>
              <div style={{ fontSize: 10, color: '#6b8f7a', marginTop: 1 }}>
                {new Date().toLocaleDateString('bn-BD', { weekday: 'long', day: 'numeric', month: 'long' })}
              </div>
            </div>
          </div>

          {/* Progress ring + summary chips */}
          <div className="flex items-center gap-2">
            <div className="relative flex items-center justify-center" style={{ width: 36, height: 36 }}>
              {mounted && <ProgressRing value={doneCount} max={5} />}
              <span
                style={{
                  position: 'absolute',
                  fontSize: 10, fontWeight: 700, color: '#059669',
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {doneCount}/৫
              </span>
            </div>

            <div className="flex items-center gap-1">
              {doneCount > 0 && (
                <span style={{
                  fontSize: 11, fontWeight: 600, padding: '3px 8px',
                  borderRadius: 20, background: 'rgba(209,250,229,0.9)', color: '#065742',
                  border: '1px solid rgba(16,185,129,0.2)',
                }}>✓ {doneCount}</span>
              )}
              {missedCount > 0 && (
                <span style={{
                  fontSize: 11, fontWeight: 600, padding: '3px 8px',
                  borderRadius: 20, background: 'rgba(254,226,226,0.9)', color: '#991b1b',
                  border: '1px solid rgba(239,68,68,0.2)',
                }}>{missedCount} কাজা</span>
              )}
              {pendCount > 0 && (
                <span style={{
                  fontSize: 11, fontWeight: 600, padding: '3px 8px',
                  borderRadius: 20, background: 'rgba(241,245,249,0.9)', color: '#475569',
                  border: '1px solid rgba(148,163,184,0.2)',
                }}>{pendCount} বাকি</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Prayer rows ────────────────────────────────────────────────── */}
      <div>
        {PRAYER_ORDER.map((key, idx) => {
          const entry  = prayerTimes[key];
          const s      = entry.status;
          const pm     = PRAYER_META[key];
          const sm     = STATUS_META[s];
          const isNext = key === nextPrayerKey;
          const done   = isDone(s);
          const isOpen = openDrop === key;

          return (
            <div
              key={key}
              className="relative"
              style={{
                display: 'grid',
                gridTemplateColumns: '38px 1fr auto',
                alignItems: 'center',
                columnGap: 12,
                padding: '12px 18px',
                borderBottom: idx < 4 ? '1px solid rgba(6,87,66,0.05)' : 'none',
                background: isNext
                  ? 'linear-gradient(90deg,rgba(5,150,105,0.05) 0%,transparent 100%)'
                  : sm.rowTint,
                opacity: done && !isNext ? 0.68 : 1,
                transition: 'background 0.15s, opacity 0.2s',
              }}
            >
              {/* Next-prayer accent line */}
              {isNext && (
                <div
                  aria-hidden
                  style={{
                    position: 'absolute', left: 0, top: '20%', bottom: '20%',
                    width: 3, borderRadius: '0 2px 2px 0',
                    background: 'linear-gradient(180deg,#059669,#0d9488)',
                  }}
                />
              )}

              {/* Icon */}
              <div
                style={{
                  width: 38, height: 38, borderRadius: 12, flexShrink: 0,
                  background: pm.iconBg,
                  color: pm.iconColor,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  border: `1px solid ${pm.iconColor}18`,
                }}
              >
                {PrayerIcons[key]}
              </div>

              {/* Name + times */}
              <div style={{ minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: '#065742', letterSpacing: '-0.01em' }}>
                    {pm.bn}
                  </span>
                  <span style={{ fontSize: 10, color: '#9ca3af' }}>{pm.time}</span>
                  {isNext && <CountdownChip adhanTime={entry.adhan} />}
                </div>

                {/* Time pills */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: 3,
                    fontSize: 11, fontWeight: 500, color: '#4b7a66',
                    background: 'rgba(5,150,105,0.06)',
                    padding: '2px 7px', borderRadius: 6,
                    fontVariantNumeric: 'tabular-nums',
                  }}>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>
                    </svg>
                    {entry.adhan}
                    <span style={{ fontSize: 9, color: '#9ca3af', marginLeft: 1 }}>আযান</span>
                  </span>
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: 3,
                    fontSize: 11, fontWeight: 500, color: '#4b7a66',
                    background: 'rgba(5,150,105,0.06)',
                    padding: '2px 7px', borderRadius: 6,
                    fontVariantNumeric: 'tabular-nums',
                  }}>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                    </svg>
                    {entry.jamaat}
                    <span style={{ fontSize: 9, color: '#9ca3af', marginLeft: 1 }}>জামাত</span>
                  </span>
                </div>
              </div>

              {/* Status chip + dropdown */}
              <StatusChip
                prayerKey={key}
                status={s}
                isOpen={isOpen}
                onToggle={() => setOpenDrop(isOpen ? null : key)}
                onClose={closeDrop}
                onSelect={(ns) => onMarkPrayer(key, ns)}
              />
            </div>
          );
        })}
      </div>

      {/* ── Footer progress ─────────────────────────────────────────────── */}
      <div
        style={{
          padding: '12px 20px 16px',
          borderTop: '1px solid rgba(6,87,66,0.06)',
          background: 'rgba(240,253,244,0.35)',
        }}
      >
        {/* Labels */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 7 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: '#4b7a66', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              দৈনিক অগ্রগতি
            </span>
            <span style={{ fontSize: 10, color: '#9ca3af' }}>
              {progressPct === 100 ? '— আলহামদুলিল্লাহ ✓' : ''}
            </span>
          </div>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#059669' }}>
            {progressPct}%
          </span>
        </div>

        {/* Segmented bar — one segment per prayer */}
        <div style={{ display: 'flex', gap: 3, height: 6 }}>
          {PRAYER_ORDER.map(key => {
            const s = prayerTimes[key].status;
            const segColor = s === 'onTime'  ? '#059669'
                           : s === 'jamaat'  ? '#3b82f6'
                           : s === 'late'    ? '#f59e0b'
                           : s === 'missed'  ? '#ef4444'
                           : 'rgba(5,150,105,0.10)';
            return (
              <div
                key={key}
                style={{
                  flex: 1, borderRadius: 3,
                  background: segColor,
                  transition: 'background 0.4s ease',
                  boxShadow: isDone(s) ? `0 0 5px ${segColor}60` : 'none',
                }}
                title={PRAYER_META[key].bn}
              />
            );
          })}
        </div>

        {/* Prayer name labels under segments */}
        <div style={{ display: 'flex', gap: 3, marginTop: 4 }}>
          {PRAYER_ORDER.map(key => (
            <div key={key} style={{ flex: 1, textAlign: 'center', fontSize: 9, color: '#9ca3af' }}>
              {PRAYER_META[key].bn}
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes qaDropIn {
          from { opacity: 0; transform: translateY(-6px) scale(0.97); }
          to   { opacity: 1; transform: none; }
        }
        @keyframes qaDropUp {
          from { opacity: 0; transform: translateY(6px) scale(0.97); }
          to   { opacity: 1; transform: none; }
        }
      `}</style>
    </div>
  );
}
