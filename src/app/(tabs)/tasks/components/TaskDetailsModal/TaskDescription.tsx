import { Task } from '../../types';

interface Props {
  task: Task;
}

export default function TaskDescription({ task }: Props) {
  return (
    <div className="mb-4">
      <h3 className="text-white font-medium text-base">
        {task.title}
      </h3>

      {task.description && (
        <p className="mt-2 text-sm text-white/60">
          {task.description}
        </p>
      )}
    </div>
  );
}