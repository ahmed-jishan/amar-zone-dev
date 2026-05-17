// FIX 23: EmptyState.tsx
// BUG: Was a stub `<div>EmptyState</div>` — never shown anyway since TaskList
//      never rendered it. Now a real empty state component with context.

interface Props {
  message?: string;
}

export default function EmptyState({ message }: Props) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="mb-4 text-5xl opacity-30">✓</div>
      <p className="text-sm font-medium text-white/30">
        {message ?? 'No tasks here'}
      </p>
      <p className="mt-1 text-xs text-white/20">
        Add a task above to get started
      </p>
    </div>
  );
}
