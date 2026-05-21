export const formatTaskDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffDays = Math.round(
    (startOfDate.getTime() - startOfToday.getTime()) / (1000 * 60 * 60 * 24)
  );
  if (diffDays < 0) return 'Overdue';
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Tomorrow';
  if (diffDays <= 6) return date.toLocaleDateString('en-US', { weekday: 'short' });
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

export const isDateOverdue = (dateStr: string): boolean => {
  const date = new Date(dateStr);
  return date < new Date(new Date().setHours(0, 0, 0, 0));
};

export const getRelativeDate = (dateStr: string): { label: string; isOverdue: boolean } => {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = Math.floor((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (diff < 0) return { label: 'Overdue', isOverdue: true };
  if (diff === 0) return { label: 'Today', isOverdue: false };
  if (diff === 1) return { label: 'Tomorrow', isOverdue: false };
  if (diff < 7) return { label: date.toLocaleDateString('en-US', { weekday: 'long' }), isOverdue: false };
  return { label: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), isOverdue: false };
};
