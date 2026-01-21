/**
 * Streak Counter HUD
 *
 * Shows current hot streak with:
 * - Flame icon that changes color
 * - Pulse animation on increment
 * - Milestone celebrations
 */

import React, { useEffect, useState } from 'react';

interface StreakCounterProps {
  streak: number;
  bestStreak: number;
  visible: boolean;
}

// Flame color based on streak
function getFlameColor(streak: number): string {
  if (streak >= 10) return '#60A5FA';  // Blue/white (unstoppable)
  if (streak >= 5) return '#EF4444';   // Red-orange (blazing)
  if (streak >= 3) return '#F97316';   // Bright orange (on fire)
  return '#FB923C';  // Orange (basic flame)
}

// Milestone messages
const MILESTONES: Record<number, { text: string; emoji: string }> = {
  3: { text: 'ON FIRE!', emoji: '🔥' },
  5: { text: 'BLAZING!', emoji: '🔥🔥' },
  10: { text: 'UNSTOPPABLE!', emoji: '🔥🔥🔥' },
  15: { text: 'LEGENDARY!', emoji: '👑' },
};

export function StreakCounter({ streak, bestStreak, visible }: StreakCounterProps) {
  const [showMilestone, setShowMilestone] = useState<string | null>(null);
  const [animatePulse, setAnimatePulse] = useState(false);
  const [prevStreak, setPrevStreak] = useState(streak);

  useEffect(() => {
    if (streak > prevStreak) {
      // Streak increased - pulse animation
      setAnimatePulse(true);
      setTimeout(() => setAnimatePulse(false), 300);

      // Check for milestone
      const milestone = MILESTONES[streak];
      if (milestone) {
        setShowMilestone(`${milestone.emoji} ${milestone.text}`);
        setTimeout(() => setShowMilestone(null), 2000);
      }
    }
    setPrevStreak(streak);
  }, [streak, prevStreak]);

  if (!visible || streak < 1) return null;

  const flameColor = getFlameColor(streak);
  const isHot = streak >= 5;

  return (
    <>
      {/* Streak counter - positioned below MiniGoalHUD */}
      <div
        className={`
          fixed left-4 z-20
          rounded-lg px-2 py-1
          border-2 transition-all duration-150
          ${animatePulse ? 'scale-110' : 'scale-100'}
        `}
        style={{
          top: '60px',
          backgroundColor: 'rgba(33, 87, 158, 0.9)',
          borderColor: isHot ? '#ed8818' : '#21579e',
        }}
      >
        <div
          className="text-lg font-bold flex items-center gap-1"
          style={{ color: flameColor }}
        >
          <span className={isHot ? 'animate-pulse' : ''}>🔥</span>
          <span>×{streak}</span>
          {/* Best streak indicator */}
          {streak >= bestStreak && bestStreak > 0 && (
            <span className="text-xs ml-1" style={{ color: '#ed8818' }}>PB!</span>
          )}
        </div>
      </div>

      {/* Milestone celebration - compact, below grade area */}
      {showMilestone && (
        <div
          className="fixed left-1/2 -translate-x-1/2 z-40"
          style={{ top: '35%' }}
        >
          <div
            className="text-xl font-black text-center animate-bounce px-4 py-1 rounded-lg border-2"
            style={{
              color: '#FFFFFF',
              backgroundColor: 'rgba(237, 136, 24, 0.9)',
              borderColor: '#ed8818',
              textShadow: '0 0 8px rgba(0,0,0,0.5)',
            }}
          >
            {showMilestone}
          </div>
        </div>
      )}
    </>
  );
}

export default StreakCounter;
