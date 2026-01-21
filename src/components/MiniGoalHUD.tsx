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
      className="absolute rounded"
      style={{
        top: '3%',
        left: '2%',
        padding: '2px 4px',
        backgroundColor: 'rgba(33, 87, 158, 0.85)',
        border: '1px solid #21579e',
        fontSize: '8px',
        lineHeight: 1.2,
      }}
    >
      <div className="flex items-center" style={{ gap: '3px' }}>
        <span style={{ fontSize: '7px' }}>🎯</span>
        <span className="text-white font-medium">{goalText}</span>
        <span style={{ color: 'rgba(255,255,255,0.7)' }}>({current}/{target})</span>
      </div>

      {/* Progress bar */}
      <div className="flex" style={{ gap: '1px', marginTop: '2px' }}>
        {Array.from({ length: segments }).map((_, i) => (
          <div
            key={i}
            style={{
              width: '6px',
              height: '2px',
              borderRadius: '1px',
              backgroundColor: i < filledSegments ? '#ed8818' : 'rgba(255,255,255,0.2)',
            }}
          />
        ))}
      </div>
    </div>
  );
}

export default MiniGoalHUD;
