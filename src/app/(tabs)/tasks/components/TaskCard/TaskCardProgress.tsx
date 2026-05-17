import { Task } from '../../types';
import { getTaskProgress } from '@/app/(tabs)/tasks/utils/taskProgress';

interface Props {
  task: Task;
}

export default function TaskCardProgress({ task }: Props) {
  const progress = getTaskProgress(task);

  if (!task.subtasks?.length) return null;

  return (
    <div className="mt-3">
      <div className="flex justify-between text-[10px] text-white/50">
        <span>Progress</span>
        <span>{progress}%</span>
      </div>

      <div className="mt-1 h-1 w-full rounded-full bg-white/10">
        <div
          className="h-1 rounded-full bg-emerald-500 transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}