export const PRIORITIES = {
  critical: {
    label: 'Critical',
    accentColor: '#ef4444',
    textColor: '#ef4444',
    bgColor: 'rgba(239,68,68,0.10)',
    borderColor: 'rgba(239,68,68,0.25)',
  },
  high: {
    label: 'High',
    accentColor: '#f97316',
    textColor: '#f97316',
    bgColor: 'rgba(249,115,22,0.10)',
    borderColor: 'rgba(249,115,22,0.25)',
  },
  medium: {
    label: 'Medium',
    accentColor: '#eab308',
    textColor: '#ca8a04',
    bgColor: 'rgba(234,179,8,0.10)',
    borderColor: 'rgba(234,179,8,0.25)',
  },
  low: {
    label: 'Low',
    accentColor: '#22c55e',
    textColor: '#16a34a',
    bgColor: 'rgba(34,197,94,0.10)',
    borderColor: 'rgba(34,197,94,0.25)',
  },
} as const;

export type PriorityKey = keyof typeof PRIORITIES;
