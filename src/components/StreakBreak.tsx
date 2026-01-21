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
      className="absolute left-1/2 -translate-x-1/2 text-center"
      style={{ bottom: '25%' }}
    >
      {/* Compact streak break display with brand colors */}
      <div
        className="flex items-center gap-2 px-3 py-1 rounded-lg border-2"
        style={{
          backgroundColor: 'rgba(33, 87, 158, 0.9)',
          borderColor: '#21579e',
        }}
      >
        <span className="text-2xl opacity-80">💔</span>
        <span className="text-base font-bold" style={{ color: '#ed8818' }}>
          Streak: {lostStreak}
        </span>
      </div>
    </div>
  );
}

export default StreakBreak;
