export const CATEGORIES = {
  work:     { label: 'Work',     emoji: '💼' },
  study:    { label: 'Study',    emoji: '📚' },
  health:   { label: 'Health',   emoji: '🏃' },
  personal: { label: 'Personal', emoji: '✨' },
  finance:  { label: 'Finance',  emoji: '💰' },
  prayer:   { label: 'Prayer',   emoji: '🤲' },
} as const;

export type CategoryKey = keyof typeof CATEGORIES;
