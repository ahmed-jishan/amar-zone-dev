'use client';

import { useEffect, useMemo, useState } from 'react';
import { BellRing, CheckCircle2, Clock3, UsersRound } from 'lucide-react';
import { usePrefsStore, type ConfigurablePrayerName, type PrayerTimePreference } from '../../store/prefsStore';
import { CONFIGURABLE_PRAYERS, PRAYER_CONFIG_LABELS, computePrayerTimeConfig } from '../../utils/azanJamatConfig';
import type { PrayerTimesResponse } from '../../types/prayer.types';

interface Props {
  prayerTimesResponse: PrayerTimesResponse;
}

function PreferenceCard({
  prayer,
  startTime,
  preference,
  onPersist,
}: {
  prayer: ConfigurablePrayerName;
  startTime: string;
  preference: PrayerTimePreference;
  onPersist: (updates: Partial<PrayerTimePreference>) => void;
}) {
  const [draft, setDraft] = useState(preference);

  useEffect(() => {
    setDraft(preference);
  }, [preference]);

  const preview = useMemo(() => computePrayerTimeConfig(startTime, draft), [draft, startTime]);
  const isValid = preview.errors.length === 0;

  const updateDraft = (updates: Partial<PrayerTimePreference>) => {
    const next = { ...draft, ...updates };
    setDraft(next);
    if (computePrayerTimeConfig(startTime, next).errors.length === 0) {
      onPersist(updates);
    }
  };

  return (
    <article className="rounded-2xl border border-[var(--nz-border)] p-4 shadow-sm nz-card">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h4 className="text-base font-bold nz-text">{PRAYER_CONFIG_LABELS[prayer]}</h4>
          <p className="mt-1 text-xs font-semibold nz-muted">Prayer Start: {preview.prayerStartDisplay}</p>
        </div>
        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold ${isValid ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
          <CheckCircle2 size={12} />
          {isValid ? 'Saved' : 'Fix time'}
        </span>
      </div>

      <div className="mt-4 grid gap-3">
        <section className="rounded-xl p-3 nz-soft">
          <div className="mb-3 flex items-center justify-between gap-3">
            <p className="inline-flex items-center gap-2 text-sm font-bold nz-text">
              <BellRing size={15} /> Azan
            </p>
            <SegmentedMode
              value={draft.azanMode}
              onChange={(azanMode) => updateDraft({ azanMode })}
            />
          </div>
          {draft.azanMode === 'offset' ? (
            <label className="block">
              <span className="text-xs font-semibold nz-muted">Offset minutes</span>
              <input
                type="number"
                min={0}
                max={90}
                value={draft.azanOffsetMinutes}
                onChange={(event) => updateDraft({ azanOffsetMinutes: Number(event.target.value) || 0 })}
                className="mt-1 w-full rounded-xl px-3 py-2 text-sm nz-control"
              />
            </label>
          ) : (
            <label className="block">
              <span className="text-xs font-semibold nz-muted">Fixed Azan time</span>
              <input
                type="time"
                value={draft.azanFixedTime}
                onChange={(event) => updateDraft({ azanFixedTime: event.target.value })}
                className="mt-1 w-full rounded-xl px-3 py-2 text-sm nz-control"
              />
            </label>
          )}
          <p className="mt-2 text-xs font-bold nz-accent">Calculated Azan: {preview.azanDisplay}</p>
        </section>

        <section className="rounded-xl p-3 nz-soft">
          <div className="mb-3 flex items-center justify-between gap-3">
            <p className="inline-flex items-center gap-2 text-sm font-bold nz-text">
              <UsersRound size={15} /> Jamat
            </p>
            <SegmentedMode
              value={draft.jamatMode}
              onChange={(jamatMode) => updateDraft({ jamatMode })}
            />
          </div>
          {draft.jamatMode === 'offset' ? (
            <label className="block">
              <span className="text-xs font-semibold nz-muted">Minutes after Azan</span>
              <input
                type="number"
                min={0}
                max={180}
                value={draft.jamatOffsetMinutes}
                onChange={(event) => updateDraft({ jamatOffsetMinutes: Number(event.target.value) || 0 })}
                className="mt-1 w-full rounded-xl px-3 py-2 text-sm nz-control"
              />
            </label>
          ) : (
            <label className="block">
              <span className="text-xs font-semibold nz-muted">Fixed Jamat time</span>
              <input
                type="time"
                value={draft.jamatFixedTime}
                onChange={(event) => updateDraft({ jamatFixedTime: event.target.value })}
                className="mt-1 w-full rounded-xl px-3 py-2 text-sm nz-control"
              />
            </label>
          )}
          <p className="mt-2 text-xs font-bold nz-gold">Calculated Jamat: {preview.jamatDisplay}</p>
        </section>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2 rounded-xl p-2 nz-soft">
        <PreviewCell label="Start" value={preview.prayerStartDisplay} />
        <PreviewCell label="Azan" value={preview.azanDisplay} />
        <PreviewCell label="Jamat" value={preview.jamatDisplay} />
      </div>

      {preview.errors.length > 0 && (
        <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">
          {preview.errors.map((error) => (
            <p key={error}>{error}</p>
          ))}
        </div>
      )}
    </article>
  );
}

function SegmentedMode({ value, onChange }: { value: 'offset' | 'fixed'; onChange: (value: 'offset' | 'fixed') => void }) {
  return (
    <div className="grid grid-cols-2 rounded-xl border border-[var(--nz-border)] p-1">
      {(['offset', 'fixed'] as const).map((mode) => (
        <button
          key={mode}
          type="button"
          aria-pressed={value === mode}
          onClick={() => onChange(mode)}
          className={`rounded-lg px-3 py-1.5 text-xs font-bold capitalize transition ${value === mode ? 'nz-primary' : 'nz-muted'}`}
        >
          {mode}
        </button>
      ))}
    </div>
  );
}

function PreviewCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-lg bg-white/50 px-2 py-2 text-center dark:bg-slate-950/30">
      <p className="text-[10px] font-bold uppercase nz-muted">{label}</p>
      <p className="mt-1 text-xs font-black nz-text">{value}</p>
    </div>
  );
}

export default function AzanJamatConfigPanel({ prayerTimesResponse }: Props) {
  const preferences = usePrefsStore((state) => state.prayerTimePreferences);
  const updatePreference = usePrefsStore((state) => state.updatePrayerTimePreference);

  return (
    <section className="space-y-3">
      <div className="flex items-end justify-between gap-3 px-1">
        <div>
          <p className="inline-flex items-center gap-2 text-sm font-bold nz-accent">
            <Clock3 size={16} /> Azan & Jamat
          </p>
          <h3 className="mt-1 text-lg font-black nz-text">Prayer time configuration</h3>
        </div>
        <span className="rounded-full px-3 py-1 text-xs font-bold nz-chip">Live preview</span>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        {CONFIGURABLE_PRAYERS.map((prayer) => (
          <PreferenceCard
            key={prayer}
            prayer={prayer}
            startTime={prayerTimesResponse.timings[prayer].time}
            preference={preferences[prayer]}
            onPersist={(updates) => updatePreference(prayer, updates)}
          />
        ))}
      </div>
    </section>
  );
}
