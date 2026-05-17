'use client';
// FIX 19: TaskNotes.tsx
// BUG FIXED:
//   - Notes state was local only. Typing and closing modal lost all notes.
//   - No debounce or save trigger — would need manual save button OR auto-save on blur.
//   - Textarea had no resize: none — expanded layout breaking the modal on mobile.
//
// FIX: Save notes to store on textarea blur (auto-save pattern, no save button needed).

import { useState } from 'react';
import { Task } from '../../types';
import { useTaskStore } from '@/lib/store/taskStore';

interface Props {
  task: Task;
}

export default function TaskNotes({ task }: Props) {
  const [notes, setNotes] = useState(task.notes || '');
  const updateTask = useTaskStore((s) => s.updateTask);

  const handleBlur = () => {
    if (notes !== task.notes) {
      updateTask(task.id, { notes });
    }
  };

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <h4 className="text-xs font-medium text-white/50">Notes</h4>
        <span className="text-[10px] text-white/30">auto-saved</span>
      </div>

      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        onBlur={handleBlur}
        placeholder="Add notes..."
        rows={4}
        className="w-full resize-none rounded-xl border border-white/10 bg-white/5 p-3 text-xs text-white outline-none placeholder:text-white/25 focus:border-white/20 transition-colors"
      />
    </div>
  );
}
