// FIX 7: categories.ts
// BUG: File was completely empty. QuickAddModal and TaskMeta hardcoded category strings.
// Now a single source of truth for all category metadata.

export const CATEGORIES = {
  work: { label: 'Work', emoji: '💼', color: 'bg-blue-500/20 text-blue-300 border-blue-500/20' },
  study: { label: 'Study', emoji: '📚', color: 'bg-purple-500/20 text-purple-300 border-purple-500/20' },
  health: { label: 'Health', emoji: '🏃', color: 'bg-green-500/20 text-green-300 border-green-500/20' },
  personal: { label: 'Personal', emoji: '✨', color: 'bg-pink-500/20 text-pink-300 border-pink-500/20' },
  finance: { label: 'Finance', emoji: '💰', color: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/20' },
  prayer: { label: 'Prayer', emoji: '🤲', color: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/20' },
} as const;

export type CategoryKey = keyof typeof CATEGORIES;
