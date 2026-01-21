/**
 * Throw Score HUD
 *
 * Shows current throw score that increases as:
 * - Distance increases
 * - Rings are collected (multiplier bonus)
 */

import React, { useEffect, useState } from 'react';

interface ThrowScoreProps {
  distance: number;           // Current position (px value)
  ringMultiplier: number;     // 1.0 → 2.0+ based on rings passed
  ringsCollected: number;     // 0-3 rings
  isFlying: boolean;
}

export function ThrowScore({
  distance,
  ringMultiplier,
  ringsCollected,
  isFlying
}: ThrowScoreProps) {
  const [glowActive, setGlowActive] = useState(false);
  const [prevRings, setPrevRings] = useState(0);

  // Glow effect when ring is collected
  useEffect(() => {
    if (ringsCollected > prevRings) {
      setGlowActive(true);
      setTimeout(() => setGlowActive(false), 400);
    }
    setPrevRings(ringsCollected);
  }, [ringsCollected, prevRings]);

  // Only show during flight
  if (!isFlying) return null;

  // Calculate current throw score
  const throwScore = Math.floor(distance * ringMultiplier);

  // Ring indicator color
  const getRingColor = (index: number) => {
    if (index < ringsCollected) return '#FFD700';  // Gold - collected
    return '#FFFFFF30';  // Dim - not collected
  };

  return (
    <div
      className="absolute rounded-lg px-2 py-1 border-2 transition-all duration-150"
      style={{
        top: '8%',
        right: '2%',
        backgroundColor: 'rgba(33, 87, 158, 0.9)',
        borderColor: glowActive ? '#ed8818' : '#21579e',
        boxShadow: glowActive ? '0 0 12px rgba(237, 136, 24, 0.5)' : 'none',
      }}
    >
      {/* Score display */}
      <div
        className="text-2xl font-bold text-center tabular-nums"
        style={{ color: ringsCollected > 0 ? '#FFD700' : '#FFFFFF' }}
      >
        {throwScore}
      </div>

      {/* Ring indicators */}
      <div className="flex gap-1.5 mt-1 justify-center">
        {[0, 1, 2].map((index) => (
          <div
            key={index}
            className="w-3 h-3 rounded-full transition-colors duration-200"
            style={{ backgroundColor: getRingColor(index) }}
            title={`Ring ${index + 1}`}
          />
        ))}
      </div>

      {/* Multiplier (only show if > 1) */}
      {ringMultiplier > 1.01 && (
        <div className="text-xs text-center mt-1" style={{ color: '#ed8818' }}>
          ×{ringMultiplier.toFixed(2)}
        </div>
      )}
    </div>
  );
}

export default ThrowScore;
