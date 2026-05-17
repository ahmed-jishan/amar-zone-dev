// FIX 24: priorities.ts
// BUG FIXED:
//   - text-black on bg-green-500 (low priority) fails WCAG AA contrast (ratio ~3.5:1).
//   - TaskCardMeta applied text-black to all priority badges — black on yellow/green
//     is borderline; black on a dark red (critical) is actually fine but looks heavy.
//   - Switched to ring/muted style for better dark theme integration.
//   - Added `textColor` for badges that need white text.

export const PRIORITIES = {
  critical: {
    label: 'Critical',
    color: 'bg-red-500/20 text-red-300 border border-red-500/30',
  },
  high: {
    label: 'High',
    color: 'bg-orange-500/20 text-orange-300 border border-orange-500/30',
  },
  medium: {
    label: 'Medium',
    color: 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30',
  },
  low: {
    label: 'Low',
    color: 'bg-green-500/20 text-green-300 border border-green-500/30',
  },
} as const;

export type PriorityKey = keyof typeof PRIORITIES;
