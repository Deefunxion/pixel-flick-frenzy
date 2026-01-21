/**
 * Landing Grade Display
 *
 * Shows grade for 1 second, then fades out
 */

import React, { useEffect, useState, useMemo } from 'react';
import { GradeResult, GRADE_COLORS, shouldShowConfetti, getRandomTip } from '@/game/engine/gradeSystem';

interface LandingGradeProps {
  result: GradeResult | null;
  visible: boolean;
  onDismiss?: () => void;
}

export function LandingGrade({ result, visible, onDismiss }: LandingGradeProps) {
  const [fading, setFading] = useState(false);

  // Memoize tip so it doesn't change on every render (must be before early return)
  const showTip = result && (result.grade === 'C' || result.grade === 'D');
  const tip = useMemo(() => showTip ? getRandomTip() : null, [showTip]);

  useEffect(() => {
    if (!visible || !result) {
      setFading(false);
      return;
    }

    // Start fade out after 800ms
    const fadeTimer = setTimeout(() => setFading(true), 800);

    // Dismiss after 1000ms total
    const dismissTimer = setTimeout(() => {
      onDismiss?.();
    }, 1000);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(dismissTimer);
    };
  }, [visible, result, onDismiss]);

  if (!visible || !result) return null;

  const { grade, comment } = result;
  const color = GRADE_COLORS[grade];

  return (
    <div
      className="absolute left-1/2 -translate-x-1/2 pointer-events-none"
      style={{
        top: '20%',
        opacity: fading ? 0 : 1,
        transition: 'opacity 200ms ease-out',
      }}
    >
      {/* Confetti for S/A */}
      {shouldShowConfetti(grade) && !fading && (
        <Confetti />
      )}

      {/* Grade display - compact inline with brand colors */}
      <div
        className="flex items-center gap-2 px-3 py-1 rounded-lg border-2"
        style={{
          backgroundColor: 'rgba(33, 87, 158, 0.9)',
          borderColor: '#21579e',
        }}
      >
        {/* Grade letter */}
        <span
          className="text-3xl font-black"
          style={{
            color,
            textShadow: `0 0 8px ${color}60`,
          }}
        >
          {grade}
        </span>

        {/* Comment */}
        <span
          className="text-sm font-bold"
          style={{ color }}
        >
          {comment}
        </span>
      </div>

      {/* Tip for C/D grades - below */}
      {tip && (
        <div className="text-xs mt-1 text-center max-w-48 mx-auto" style={{ color: '#ef8819' }}>
          {tip}
        </div>
      )}
    </div>
  );
}

// Simple confetti component
function Confetti() {
  const particles = Array.from({ length: 30 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    delay: Math.random() * 0.5,
    color: ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4'][i % 5],
    size: 4 + Math.random() * 4,
  }));

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
      {particles.map(p => (
        <div
          key={p.id}
          className="absolute animate-confetti"
          style={{
            left: `${p.x}%`,
            top: '-10px',
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            borderRadius: '2px',
            animationDelay: `${p.delay}s`,
          }}
        />
      ))}
    </div>
  );
}

export default LandingGrade;
