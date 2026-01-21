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
      style={{ bottom: '20%' }}
    >
      {/* Compact streak break display with brand colors */}
      <div
        className="flex items-center rounded"
        style={{
          gap: '3px',
          padding: '2px 5px',
          backgroundColor: 'rgba(33, 87, 158, 0.85)',
          border: '1px solid #21579e',
        }}
      >
        <span style={{ fontSize: '10px', opacity: 0.8 }}>💔</span>
        <span style={{ fontSize: '9px', fontWeight: 700, color: '#ed8818' }}>
          Streak: {lostStreak}
        </span>
      </div>
    </div>
  );
}

export default StreakBreak;
