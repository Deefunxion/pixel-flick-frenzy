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
      {/* Streak counter */}
      <div
        className={`
          fixed top-16 left-4
          bg-black/60 rounded-lg px-3 py-2
          border-2 transition-all duration-150
          ${animatePulse ? 'scale-110' : 'scale-100'}
          ${isHot ? 'border-orange-500' : 'border-white/30'}
        `}
      >
        <div
          className="text-2xl font-bold text-center flex items-center gap-1"
          style={{ color: flameColor }}
        >
          <span className={isHot ? 'animate-pulse' : ''}>🔥</span>
          <span>×{streak}</span>
        </div>

        {/* Best streak indicator */}
        {streak >= bestStreak && bestStreak > 0 && (
          <div className="text-xs text-yellow-400 text-center">
            Personal Best!
          </div>
        )}
      </div>

      {/* Milestone celebration */}
      {showMilestone && (
        <div className="fixed top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50">
          <div
            className="text-3xl font-black text-center animate-bounce"
            style={{
              color: flameColor,
              textShadow: `0 0 20px ${flameColor}, 0 0 40px ${flameColor}`,
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
