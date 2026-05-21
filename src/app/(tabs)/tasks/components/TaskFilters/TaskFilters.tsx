'use client';
import { TASK_FILTERS } from '../../constants/filters';
import type { FilterKey } from '../../hooks/useTaskFilters';

const LABELS: Record<FilterKey, string> = { all:'All', today:'Today', high:'Priority', completed:'Done', overdue:'Overdue' };
const ICONS:  Record<FilterKey, string> = { all:'◈', today:'◉', high:'▲', completed:'✓', overdue:'!' };

interface Props { activeFilter: FilterKey; onFilterChange: (f: FilterKey) => void; }

export default function TaskFilters({ activeFilter, onFilterChange }: Props) {
  return (
    <>
      <div className="az-filters">
        {TASK_FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => onFilterChange(f)}
            aria-pressed={activeFilter === f}
            className={`az-fbtn${activeFilter===f?' az-fbtn--on':''}${f==='overdue'?' az-fbtn--danger':''}`}
          >
            <span style={{ fontSize:10 }}>{ICONS[f]}</span>
            {LABELS[f]}
          </button>
        ))}
      </div>
      <style>{`
        .az-filters { display:flex; gap:6px; overflow-x:auto; padding-bottom:2px; margin-bottom:16px; scrollbar-width:none; }
        .az-filters::-webkit-scrollbar { display:none; }
        .az-fbtn { display:flex; align-items:center; gap:5px; white-space:nowrap; padding:7px 14px; border-radius:99px; border:1px solid var(--az-border); background:var(--az-surface-1); font-size:12px; font-weight:500; color:var(--az-text-2); cursor:pointer; transition:all .15s; flex-shrink:0; }
        .az-fbtn:hover:not(.az-fbtn--on) { background:var(--az-surface-2); color:var(--az-text-1); }
        .az-fbtn--on { background:var(--az-accent); border-color:var(--az-accent); color:#fff; font-weight:600; }
        .az-fbtn--danger.az-fbtn--on { background:var(--az-danger); border-color:var(--az-danger); }
      `}</style>
    </>
  );
}
