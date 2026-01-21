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
    <div className="fixed top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 text-center">
      {/* Broken flame */}
      <div className="text-4xl opacity-50 animate-fade-out">
        💔
      </div>

      {/* Lost streak text */}
      <div className="text-xl font-bold text-red-400 mt-2">
        Streak Lost: {lostStreak}
      </div>

      {/* Motivation */}
      <div className="text-sm text-white/60 mt-1">
        Can you beat {lostStreak}?
      </div>
    </div>
  );
}

export default StreakBreak;
