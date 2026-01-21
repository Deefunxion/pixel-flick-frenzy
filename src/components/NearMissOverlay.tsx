/**
 * Near-Miss Overlay
 *
 * Shows:
 * - Animated distance counter
 * - "SO CLOSE!" text
 * - Recovery prompt
 */

import React, { useEffect, useState } from 'react';

interface NearMissOverlayProps {
  distance: number;
  intensity: 'extreme' | 'close' | 'near';
  visible: boolean;
}

const INTENSITY_TEXT = {
  extreme: 'INCHES AWAY!',
  close: 'SO CLOSE!',
  near: 'Almost!',
};

export function NearMissOverlay({ distance, intensity, visible }: NearMissOverlayProps) {
  const [displayDistance, setDisplayDistance] = useState(0);
  const [showRecovery, setShowRecovery] = useState(false);

  useEffect(() => {
    if (!visible) {
      setDisplayDistance(0);
      setShowRecovery(false);
      return;
    }

    // Animate distance counter from 0 to actual
    const duration = 600;
    const startTime = performance.now();

    const animate = () => {
      const elapsed = performance.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Ease out
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayDistance(distance * eased);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);

    // Show recovery prompt after delay
    const recoveryTimer = setTimeout(() => {
      setShowRecovery(true);
    }, 800);

    return () => clearTimeout(recoveryTimer);
  }, [visible, distance]);

  if (!visible) return null;

  const textSize = intensity === 'extreme' ? 'text-4xl' : intensity === 'close' ? 'text-3xl' : 'text-2xl';

  return (
    <div
      className="fixed left-1/2 -translate-x-1/2 pointer-events-none z-40 text-center"
      style={{ top: '40%' }}
    >
      {/* Main text */}
      <div
        className={`${textSize} font-black text-red-500 animate-pulse`}
        style={{ textShadow: '0 0 20px rgba(255, 0, 0, 0.5)' }}
      >
        {INTENSITY_TEXT[intensity]}
      </div>

      {/* Distance counter */}
      <div className="text-xl font-bold text-red-400 mt-1">
        {displayDistance.toFixed(2)}px short
      </div>

      {/* Recovery prompt */}
      {showRecovery && (
        <div className="text-sm text-white/60 mt-3 animate-fade-in">
          Try again?
        </div>
      )}
    </div>
  );
}

export default NearMissOverlay;
