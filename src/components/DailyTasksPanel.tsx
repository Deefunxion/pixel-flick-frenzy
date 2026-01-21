import React from 'react';
import type { DailyTasks } from '@/game/engine/types';
import { getDailyTasksStatus } from '@/game/engine/dailyTasks';

interface DailyTasksPanelProps {
  dailyTasks: DailyTasks;
  onClaimTask: (taskId: string) => void;
}

export function DailyTasksPanel({ dailyTasks, onClaimTask }: DailyTasksPanelProps) {
  const tasks = getDailyTasksStatus(dailyTasks);

  return (
    <div className="bg-slate-800/90 rounded-lg p-3">
      <h3 className="text-amber-400 font-bold text-sm mb-2">Daily Tasks</h3>
      <div className="space-y-2">
        {tasks.map((task) => (
          <div
            key={task.id}
            className={`flex items-center justify-between text-xs p-2 rounded ${
              task.claimed
                ? 'bg-green-900/30 text-gray-500'
                : task.completed
                  ? 'bg-amber-900/30'
                  : 'bg-slate-700/50'
            }`}
          >
            <span className={task.completed ? 'text-white' : 'text-gray-400'}>
              {task.claimed ? '✓ ' : task.completed ? '● ' : '○ '}
              {task.desc}
            </span>
            {task.completed && !task.claimed ? (
              <button
                onClick={() => onClaimTask(task.id)}
                className="bg-amber-600 hover:bg-amber-500 text-white px-2 py-0.5 rounded text-xs"
              >
                +{task.reward}
              </button>
            ) : (
              <span className="text-gray-500">+{task.reward}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
