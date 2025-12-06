import { CheckCircle2, Circle } from 'lucide-react';

interface Task {
  id: string;
  description: string;
  is_completed: boolean;
}

interface TaskListProps {
  tasks: Task[];
  onToggle: (taskId: string, isCompleted: boolean) => void;
}

export default function TaskList({ tasks, onToggle }: TaskListProps) {
  return (
    <div className="space-y-2">
      {tasks.map((task) => (
        <button
          key={task.id}
          onClick={() => onToggle(task.id, !task.is_completed)}
          className="w-full flex items-start gap-3 p-4 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition text-left group"
          style={{ minHeight: '64px' }}
        >
          <div className="flex-shrink-0 mt-0.5">
            {task.is_completed ? (
              <CheckCircle2 className="w-7 h-7 text-green-500" />
            ) : (
              <Circle className="w-7 h-7 text-gray-300 group-hover:text-gray-400" />
            )}
          </div>
          <span
            className={`flex-1 text-base ${
              task.is_completed
                ? 'text-gray-500 line-through'
                : 'text-gray-900 font-medium'
            }`}
          >
            {task.description}
          </span>
        </button>
      ))}
    </div>
  );
}
