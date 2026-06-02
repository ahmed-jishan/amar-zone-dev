'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { BookOpen, ChevronDown, Plus, X } from 'lucide-react';
import DuaCard from './DuaCard';
import { useDuaStore, type DuaItem } from '../../store/duaStore';

const EMPTY_FORM = {
  arabic: '',
  transliteration: '',
  translation: '',
  reference: '',
};

export type { DuaItem } from '../../store/duaStore';
export type { DuaCategory } from '../../store/duaStore';

export default function DuaView() {
  const categories = useDuaStore((state) => state.categories);
  const read = useDuaStore((state) => state.read);
  const addCustomDua = useDuaStore((state) => state.addCustomDua);
  const deleteCustomDua = useDuaStore((state) => state.deleteCustomDua);
  const toggleRead = useDuaStore((state) => state.toggleRead);

  const [activeCategoryId, setActiveCategoryId] = useState(categories[0]?.id ?? '');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  useEffect(() => {
    if (!categories.some((category) => category.id === activeCategoryId)) {
      setActiveCategoryId(categories[0]?.id ?? '');
    }
  }, [activeCategoryId, categories]);

  const activeCategory = useMemo(
    () => categories.find((category) => category.id === activeCategoryId) ?? categories[0],
    [activeCategoryId, categories]
  );

  const activeDuas = activeCategory?.duas ?? [];

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const arabic = form.arabic.trim();
    const transliteration = form.transliteration.trim();
    const translation = form.translation.trim();
    const reference = form.reference.trim();

    if (!arabic || !translation) return;

    addCustomDua({
      arabic,
      transliteration: transliteration || 'Custom dua / zikr',
      translation,
      reference: reference || undefined,
    });
    setForm(EMPTY_FORM);
    setIsAdding(false);
    setActiveCategoryId('custom-duas');
  };

  const updateForm = (field: keyof typeof EMPTY_FORM, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-emerald-100 p-2 dark:bg-emerald-900/30">
            <BookOpen className="text-emerald-700 dark:text-emerald-300" size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-bold nz-text">দোয়া ও যিকির</h2>
            <p className="text-sm nz-muted">অর্থসহ পড়ুন, শুনুন, নিজের দোয়া যোগ করুন</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setIsAdding((value) => !value)}
          className="inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold nz-primary"
        >
          {isAdding ? <X size={16} /> : <Plus size={16} />}
          {isAdding ? 'বন্ধ করুন' : 'নতুন যোগ করুন'}
        </button>
      </div>

      {isAdding && (
        <form onSubmit={handleSubmit} className="space-y-3 rounded-2xl p-4 nz-card">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="space-y-1 sm:col-span-2">
              <span className="text-xs font-semibold nz-muted">আরবি দোয়া / যিকির</span>
              <textarea
                value={form.arabic}
                onChange={(event) => updateForm('arabic', event.target.value)}
                rows={3}
                dir="rtl"
                className="w-full rounded-xl border border-emerald-100 bg-white/80 px-3 py-2 text-right text-lg leading-loose outline-none focus:border-emerald-400 dark:border-emerald-900/50 dark:bg-emerald-950/20"
                required
              />
            </label>
            <label className="space-y-1">
              <span className="text-xs font-semibold nz-muted">উচ্চারণ সহায়ক</span>
              <input
                value={form.transliteration}
                onChange={(event) => updateForm('transliteration', event.target.value)}
                className="w-full rounded-xl border border-emerald-100 bg-white/80 px-3 py-2 text-sm outline-none focus:border-emerald-400 dark:border-emerald-900/50 dark:bg-emerald-950/20"
                placeholder="Subhanallah / আলহামদুলিল্লাহ"
              />
            </label>
            <label className="space-y-1">
              <span className="text-xs font-semibold nz-muted">রেফারেন্স</span>
              <input
                value={form.reference}
                onChange={(event) => updateForm('reference', event.target.value)}
                className="w-full rounded-xl border border-emerald-100 bg-white/80 px-3 py-2 text-sm outline-none focus:border-emerald-400 dark:border-emerald-900/50 dark:bg-emerald-950/20"
                placeholder="ঐচ্ছিক"
              />
            </label>
            <label className="space-y-1 sm:col-span-2">
              <span className="text-xs font-semibold nz-muted">অর্থ</span>
              <textarea
                value={form.translation}
                onChange={(event) => updateForm('translation', event.target.value)}
                rows={2}
                className="w-full rounded-xl border border-emerald-100 bg-white/80 px-3 py-2 text-sm leading-6 outline-none focus:border-emerald-400 dark:border-emerald-900/50 dark:bg-emerald-950/20"
                required
              />
            </label>
          </div>
          <div className="flex justify-end">
            <button type="submit" className="rounded-xl px-4 py-2 text-sm font-semibold nz-primary">
              সংরক্ষণ করুন
            </button>
          </div>
        </form>
      )}

      <div className="relative">
        <div className="hidden flex-wrap gap-2 border-b border-emerald-100 pb-2 md:flex dark:border-emerald-900/30">
          {categories.map((category) => (
            <button
              key={category.id}
              type="button"
              onClick={() => setActiveCategoryId(category.id)}
              className={`rounded-t-lg px-4 py-2 text-sm transition ${
                activeCategoryId === category.id ? 'nz-primary font-semibold' : 'nz-control nz-muted'
              }`}
            >
              {category.nameBn}
            </button>
          ))}
        </div>

        <div className="md:hidden">
          <button
            type="button"
            onClick={() => setIsDropdownOpen((value) => !value)}
            className="flex w-full items-center justify-between rounded-xl px-4 py-2 nz-control nz-text"
          >
            <span>{activeCategory?.nameBn}</span>
            <ChevronDown size={18} className={`transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
          </button>
          {isDropdownOpen && (
            <div className="absolute left-0 right-0 z-30 mt-1 overflow-hidden rounded-xl border border-emerald-100 bg-white shadow-xl dark:border-emerald-900/40 dark:bg-emerald-950">
              {categories.map((category) => (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => {
                    setActiveCategoryId(category.id);
                    setIsDropdownOpen(false);
                  }}
                  className="w-full px-4 py-2 text-left text-sm nz-text hover:bg-emerald-50 dark:hover:bg-emerald-900/30"
                >
                  {category.nameBn}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="space-y-4">
        {activeDuas.map((dua) => (
          <DuaCard
            key={dua.id}
            dua={dua}
            isRead={read[dua.id] || false}
            onToggleRead={() => toggleRead(dua.id)}
            onDelete={dua.isCustom ? () => deleteCustomDua(dua.id) : undefined}
          />
        ))}
        {activeDuas.length === 0 && (
          <div className="rounded-2xl py-8 text-center text-sm nz-card nz-muted">
            এই ক্যাটাগরিতে এখনো কোনো দোয়া নেই।
          </div>
        )}
      </div>
    </div>
  );
}
