/**
 * Landing Grade Display
 *
 * Shows grade stamp animation with:
 * - Scale slam effect (0 → 1.2 → 1.0)
 * - Grade letter with color
 * - Coach comment
 * - Confetti for S/A grades
 */

import React, { useEffect, useState } from 'react';
import { Grade, GradeResult, GRADE_COLORS, shouldShowConfetti, getRandomTip } from '@/game/engine/gradeSystem';

interface LandingGradeProps {
  result: GradeResult | null;
  visible: boolean;
  onDismiss?: () => void;
}

export function LandingGrade({ result, visible, onDismiss }: LandingGradeProps) {
  const [animationPhase, setAnimationPhase] = useState<'slam' | 'hold' | 'fade'>('slam');
  const [scale, setScale] = useState(0);

  useEffect(() => {
    if (!visible || !result) {
      setAnimationPhase('slam');
      setScale(0);
      return;
    }

    // Slam animation: 0 → 1.2 → 1.0
    setAnimationPhase('slam');
    setScale(0);

    // Start slam
    const slamStart = setTimeout(() => setScale(1.2), 50);

    // Settle to 1.0
    const settle = setTimeout(() => {
      setScale(1.0);
      setAnimationPhase('hold');
    }, 200);

    // Start fade after 1.5s
    const fadeStart = setTimeout(() => {
      setAnimationPhase('fade');
    }, 1500);

    // Dismiss after 2s
    const dismiss = setTimeout(() => {
      onDismiss?.();
    }, 2000);

    return () => {
      clearTimeout(slamStart);
      clearTimeout(settle);
      clearTimeout(fadeStart);
      clearTimeout(dismiss);
    };
  }, [visible, result, onDismiss]);

  if (!visible || !result) return null;

  const { grade, comment, score } = result;
  const color = GRADE_COLORS[grade];
  const showTip = grade === 'C' || grade === 'D';

  return (
    <div
      className={`
        fixed inset-0 flex items-center justify-center pointer-events-none
        transition-opacity duration-300
        ${animationPhase === 'fade' ? 'opacity-0' : 'opacity-100'}
      `}
    >
      {/* Confetti for S/A */}
      {shouldShowConfetti(grade) && animationPhase !== 'fade' && (
        <Confetti />
      )}

      {/* Grade stamp */}
      <div
        className="relative"
        style={{
          transform: `scale(${scale})`,
          transition: 'transform 150ms ease-out',
        }}
      >
        {/* Grade letter */}
        <div
          className="text-8xl font-black text-center"
          style={{
            color,
            textShadow: `0 4px 8px rgba(0,0,0,0.5), 0 0 20px ${color}40`,
          }}
        >
          {grade}
        </div>

        {/* Comment */}
        <div
          className="text-xl font-bold text-center mt-2"
          style={{ color }}
        >
          {comment}
        </div>

        {/* Score breakdown */}
        <div className="text-sm text-white/60 text-center mt-1">
          Score: {score}/100
        </div>

        {/* Tip for C/D grades */}
        {showTip && (
          <div className="text-xs text-yellow-400 text-center mt-3 max-w-48">
            {getRandomTip()}
          </div>
        )}
      </div>
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
