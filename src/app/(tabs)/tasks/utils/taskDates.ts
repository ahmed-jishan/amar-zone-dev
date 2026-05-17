// FIX 6: taskDates.ts
// BUGS FIXED:
//   - formatTaskDate() was a stub returning the raw value. TaskCardMeta and TaskMeta
//     both called new Date(task.dueDate).toDateString() directly — no locale support,
//     no relative labels ("Today", "Tomorrow", "Overdue"), long format on small cards.
//   - Now provides a production-quality formatter used by both TaskCardMeta and TaskMeta.

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
  if (diffDays <= 6) {
    return date.toLocaleDateString('en-US', { weekday: 'short' }); // "Wed"
  }
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }); // "Jun 3"
};

export const isDateOverdue = (dateStr: string): boolean => {
  const date = new Date(dateStr);
  return date < new Date(new Date().setHours(0, 0, 0, 0));
};
