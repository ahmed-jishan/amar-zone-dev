'use client';

interface StatsSnapshot {
  total: number;
  completed: number;
  completionRate: number;
  today: number;
  overdue: number;
}
interface Props { stats: StatsSnapshot; }

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 5)  return { text: 'Late night grind', sub: 'Burning the midnight oil' };
  if (h < 12) return { text: 'Good morning',     sub: 'Start strong today' };
  if (h < 17) return { text: 'Good afternoon',   sub: 'Keep the momentum going' };
  if (h < 21) return { text: 'Good evening',     sub: 'Wrapping up the day' };
  return       { text: 'Good night',              sub: 'Almost there' };
};

export default function TaskHeader({ stats }: Props) {
  const g = getGreeting();
  const dateStr = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  const rate = stats.completionRate;
  const rateColor = rate >= 80 ? 'var(--az-success)' : rate >= 50 ? 'var(--az-warn)' : 'var(--az-danger)';
  const RADIUS = 22, CIRC = 2 * Math.PI * RADIUS;

  return (
    <header style={{ padding: '20px 0 0' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <p style={{ fontSize: 11, fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--az-text-3)', margin: '0 0 4px' }}>{dateStr}</p>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--az-text-1)', margin: '0 0 2px', letterSpacing: '-0.02em' }}>{g.text}</h1>
          <p style={{ fontSize: 13, color: 'var(--az-text-3)', margin: 0 }}>{g.sub}</p>
        </div>
        <svg width="56" height="56" viewBox="0 0 56 56" style={{ flexShrink: 0, marginTop: 4 }}>
          <circle cx="28" cy="28" r={RADIUS} fill="none" stroke="var(--az-surface-2)" strokeWidth="4"/>
          <circle cx="28" cy="28" r={RADIUS} fill="none" stroke={rateColor} strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray={CIRC}
            strokeDashoffset={CIRC * (1 - rate / 100)}
            style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%', transition: 'stroke-dashoffset 0.8s cubic-bezier(0.34,1.56,0.64,1)' }}/>
          <text x="28" y="33" textAnchor="middle" fontSize="11" fontWeight="600" fill={rateColor}>{rate}%</text>
        </svg>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8, marginBottom: 16 }}>
        {[
          { label: 'Today',   value: stats.today,     color: 'var(--az-accent)' },
          { label: 'Done',    value: stats.completed,  color: 'var(--az-success)' },
          { label: 'Overdue', value: stats.overdue,    color: 'var(--az-danger)' },
          { label: 'Total',   value: stats.total,      color: 'var(--az-text-2)' },
        ].map((s) => (
          <div key={s.label} style={{ background: 'var(--az-surface-1)', border: '1px solid var(--az-border)', borderRadius: 12, padding: '10px 8px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
            <span style={{ fontSize: 20, fontWeight: 700, lineHeight: 1, fontVariantNumeric: 'tabular-nums', color: s.color }}>{s.value}</span>
            <span style={{ fontSize: 10, color: 'var(--az-text-3)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{s.label}</span>
          </div>
        ))}
      </div>

      <div style={{ marginBottom: 24 }}>
        <div style={{ height: 3, background: 'var(--az-surface-2)', borderRadius: 99, overflow: 'hidden' }}>
          <div style={{ width: `${rate}%`, height: '100%', background: rateColor, borderRadius: 99, transition: 'width 0.8s cubic-bezier(0.34,1.56,0.64,1)' }}/>
        </div>
      </div>
    </header>
  );
}
