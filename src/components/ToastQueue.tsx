/**
 * Toast Queue System
 *
 * Non-blocking toasts for:
 * - Achievement progress
 * - Task completion
 * - Streak updates
 */

import React, { useState, useEffect, useCallback } from 'react';

interface Toast {
  id: string;
  message: string;
  type: 'progress' | 'complete' | 'streak' | 'info';
  priority: 'high' | 'medium' | 'low';
  duration: number;
}

interface ToastQueueProps {
  toasts: Toast[];
  onDismiss: (id: string) => void;
}

const TYPE_STYLES = {
  progress: 'bg-blue-500/80 border-blue-400',
  complete: 'bg-green-500/80 border-green-400',
  streak: 'bg-orange-500/80 border-orange-400',
  info: 'bg-gray-500/80 border-gray-400',
};

const TYPE_ICONS = {
  progress: '📊',
  complete: '✅',
  streak: '🔥',
  info: 'ℹ️',
};

export function ToastQueue({ toasts, onDismiss }: ToastQueueProps) {
  // Only show max 3 toasts
  const visibleToasts = toasts.slice(0, 3);

  return (
    <div className="fixed bottom-20 left-1/2 -translate-x-1/2 flex flex-col gap-2 z-40">
      {visibleToasts.map((toast, index) => (
        <ToastItem
          key={toast.id}
          toast={toast}
          index={index}
          onDismiss={() => onDismiss(toast.id)}
        />
      ))}
    </div>
  );
}

interface ToastItemProps {
  toast: Toast;
  index: number;
  onDismiss: () => void;
}

function ToastItem({ toast, index, onDismiss }: ToastItemProps) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, toast.duration);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toast.id, toast.duration]); // Only depend on toast identity, not onDismiss callback

  return (
    <div
      className={`
        px-4 py-2 rounded-lg border-2
        text-white text-sm font-medium
        flex items-center gap-2
        animate-slide-up
        ${TYPE_STYLES[toast.type]}
      `}
      style={{ animationDelay: `${index * 100}ms` }}
    >
      <span>{TYPE_ICONS[toast.type]}</span>
      <span>{toast.message}</span>
    </div>
  );
}

// Hook for managing toast queue
export function useToastQueue() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((
    message: string,
    type: Toast['type'] = 'info',
    priority: Toast['priority'] = 'medium'
  ) => {
    const durations = { high: 3000, medium: 2000, low: 1500 };

    const newToast: Toast = {
      id: `${Date.now()}-${Math.random()}`,
      message,
      type,
      priority,
      duration: durations[priority],
    };

    setToasts(prev => {
      // Insert by priority
      const sorted = [...prev, newToast].sort((a, b) => {
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      });

      // Limit queue size to 5
      return sorted.slice(0, 5);
    });
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return { toasts, addToast, dismissToast };
}

export default ToastQueue;
