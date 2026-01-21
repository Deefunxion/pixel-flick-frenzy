/**
 * Mini Goal HUD
 *
 * Shows closest achievement in top-left:
 * 🎯 Land at 419+ (2/5) ▓▓░░░
 */

import React from 'react';

interface MiniGoalHUDProps {
  goalText: string;
  progress: number;  // 0-1
  target: number;
  current: number;
  visible: boolean;
}

export function MiniGoalHUD({ goalText, progress, target, current, visible }: MiniGoalHUDProps) {
  if (!visible) return null;

  // Create progress bar segments
  const segments = 5;
  const filledSegments = Math.floor(progress * segments);

  return (
    <div
      className="absolute rounded-lg px-2 py-1 text-xs border-2"
      style={{
        top: '4%',
        left: '2%',
        backgroundColor: 'rgba(33, 87, 158, 0.9)',
        borderColor: '#21579e',
      }}
    >
      <div className="flex items-center gap-2">
        <span>🎯</span>
        <span className="text-white font-medium">{goalText}</span>
        <span className="text-white/80">({current}/{target})</span>
      </div>

      {/* Progress bar */}
      <div className="flex gap-0.5 mt-1">
        {Array.from({ length: segments }).map((_, i) => (
          <div
            key={i}
            className="w-3 h-1.5 rounded-sm"
            style={{
              backgroundColor: i < filledSegments ? '#ed8818' : 'rgba(255,255,255,0.2)',
            }}
          />
        ))}
      </div>
    </div>
  );
}

export default MiniGoalHUD;
