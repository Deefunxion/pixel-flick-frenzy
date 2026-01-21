/**
 * Multiplier Ladder HUD
 *
 * Shows current multiplier with threshold ticks:
 * 1.5x / 2.0x / 2.5x / 3.0x
 *
 * Glows and pulses when thresholds are passed.
 */

import React, { useEffect, useState } from 'react';

interface MultiplierLadderProps {
  currentMultiplier: number;  // Combined risk * ring multiplier
  isFlying: boolean;
  reduceFx: boolean;
}

const THRESHOLDS = [1.5, 2.0, 2.5, 3.0];

export function MultiplierLadder({
  currentMultiplier,
  isFlying,
  reduceFx
}: MultiplierLadderProps) {
  const [lastThreshold, setLastThreshold] = useState(0);
  const [glowActive, setGlowActive] = useState(false);

  // Track threshold crossing
  useEffect(() => {
    const currentThreshold = THRESHOLDS.filter(t => currentMultiplier >= t).length;
    if (currentThreshold > lastThreshold && !reduceFx) {
      setGlowActive(true);
      setTimeout(() => setGlowActive(false), 300);
    }
    setLastThreshold(currentThreshold);
  }, [currentMultiplier, lastThreshold, reduceFx]);

  // Only show during flight
  if (!isFlying) return null;

  // Calculate display multiplier
  const displayMultiplier = currentMultiplier.toFixed(2);

  // Color based on multiplier
  const getColor = () => {
    if (currentMultiplier >= 3.0) return '#FF6B00';  // Orange
    if (currentMultiplier >= 2.0) return '#FFD700';  // Gold
    if (currentMultiplier >= 1.5) return '#7FD858';  // Green
    return '#FFFFFF';  // White
  };

  return (
    <div
      className={`
        fixed top-16 right-4
        bg-black/60 rounded-lg px-3 py-2
        border-2 transition-all duration-150
        ${glowActive ? 'border-yellow-400 shadow-lg shadow-yellow-400/50' : 'border-white/30'}
      `}
    >
      {/* Multiplier display */}
      <div
        className="text-2xl font-bold text-center"
        style={{ color: getColor() }}
      >
        {displayMultiplier}x
      </div>

      {/* Threshold ticks */}
      <div className="flex gap-1 mt-1 justify-center">
        {THRESHOLDS.map((threshold) => (
          <div
            key={threshold}
            className={`
              w-2 h-2 rounded-full transition-colors
              ${currentMultiplier >= threshold
                ? 'bg-yellow-400'
                : 'bg-white/30'}
            `}
            title={`${threshold}x`}
          />
        ))}
      </div>
    </div>
  );
}

export default MultiplierLadder;
