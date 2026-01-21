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
        className={`absolute rounded transition-all duration-150 ${animatePulse ? 'scale-110' : 'scale-100'}`}
        style={{
          top: '18%',
          left: '2%',
          padding: '1px 4px',
          backgroundColor: 'rgba(33, 87, 158, 0.85)',
          border: `1px solid ${isHot ? '#ed8818' : '#21579e'}`,
        }}
      >
        <div
          className="flex items-center"
          style={{ color: flameColor, fontSize: '9px', fontWeight: 700, gap: '2px' }}
        >
          <span className={isHot ? 'animate-pulse' : ''} style={{ fontSize: '8px' }}>🔥</span>
          <span>×{streak}</span>
          {/* Best streak indicator */}
          {streak >= bestStreak && bestStreak > 0 && (
            <span style={{ fontSize: '6px', marginLeft: '2px', color: '#ed8818' }}>PB!</span>
          )}
        </div>
      </div>

      {/* Milestone celebration - compact, below grade area */}
      {showMilestone && (
        <div
          className="absolute left-1/2 -translate-x-1/2"
          style={{ top: '35%' }}
        >
          <div
            className="text-center animate-bounce rounded"
            style={{
              fontSize: '10px',
              fontWeight: 900,
              padding: '2px 6px',
              color: '#FFFFFF',
              backgroundColor: 'rgba(237, 136, 24, 0.9)',
              border: '1px solid #ed8818',
              textShadow: '0 0 4px rgba(0,0,0,0.5)',
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
