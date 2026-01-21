/**
 * Streak Break Feedback
 *
 * Shows when streak is lost:
 * - Shattered flame animation
 * - Lost streak count
 * - Motivation text
 */

import React from 'react';

interface StreakBreakProps {
  lostStreak: number;
  visible: boolean;
}

export function StreakBreak({ lostStreak, visible }: StreakBreakProps) {
  if (!visible || lostStreak < 2) return null;

  return (
    <div
      className="fixed left-1/2 -translate-x-1/2 z-30 text-center"
      style={{ bottom: '30%' }}
    >
      {/* Compact streak break display */}
      <div className="flex items-center gap-2 bg-black/50 px-3 py-1 rounded-lg">
        <span className="text-2xl opacity-60">💔</span>
        <span className="text-base font-bold text-red-400">
          Streak: {lostStreak}
        </span>
      </div>
    </div>
  );
}

export default StreakBreak;
