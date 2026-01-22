/**
 * Landing Grade Display - Ring-Popup Style
 *
 * Celebratory popup matching ring hit feedback aesthetic.
 * Big letter + phrase, pop-in animation, performance-based colors.
 */

import React, { useEffect, useState, useMemo } from 'react';
import { GradeResult, GRADE_COLORS, shouldShowConfetti, getRandomTip } from '@/game/engine/gradeSystem';

interface LandingGradeProps {
  result: GradeResult | null;
  visible: boolean;
  onDismiss?: () => void;
}

export function LandingGrade({ result, visible, onDismiss }: LandingGradeProps) {
  const [animPhase, setAnimPhase] = useState<'pop' | 'hold' | 'fade'>('pop');

  // Memoize tip so it doesn't change on every render
  const showTip = result && (result.grade === 'C' || result.grade === 'D');
  const tip = useMemo(() => showTip ? getRandomTip() : null, [showTip]);

  useEffect(() => {
    if (!visible || !result) {
      setAnimPhase('pop');
      return;
    }

    // Animation timeline:
    // 0-300ms: pop-in (scale 0 -> 1.2 -> 1)
    // 300-1200ms: hold
    // 1200-1500ms: fade-out

    setAnimPhase('pop');
    const holdTimer = setTimeout(() => setAnimPhase('hold'), 300);
    const fadeTimer = setTimeout(() => setAnimPhase('fade'), 1200);
    const dismissTimer = setTimeout(() => onDismiss?.(), 1500);

    return () => {
      clearTimeout(holdTimer);
      clearTimeout(fadeTimer);
      clearTimeout(dismissTimer);
    };
  }, [visible, result, onDismiss]);

  if (!visible || !result) return null;

  const { grade, comment } = result;
  const color = GRADE_COLORS[grade];

  // Animation styles
  const getAnimationStyle = (): React.CSSProperties => {
    switch (animPhase) {
      case 'pop':
        return {
          transform: 'translate(-50%, -50%) scale(1.2)',
          opacity: 1,
          transition: 'transform 150ms cubic-bezier(0.34, 1.56, 0.64, 1), opacity 100ms ease-out',
        };
      case 'hold':
        return {
          transform: 'translate(-50%, -50%) scale(1)',
          opacity: 1,
          transition: 'transform 150ms ease-out',
        };
      case 'fade':
        return {
          transform: 'translate(-50%, -50%) scale(0.8)',
          opacity: 0,
          transition: 'transform 300ms ease-in, opacity 300ms ease-in',
        };
    }
  };

  return (
    <>
      {/* Confetti for S/A */}
      {shouldShowConfetti(grade) && animPhase !== 'fade' && <Confetti />}

      {/* Grade popup - centered, ring-popup style */}
      <div
        className="absolute pointer-events-none"
        style={{
          left: '50%',
          top: '40%',
          ...getAnimationStyle(),
        }}
      >
        <div className="flex flex-col items-center">
          {/* Big grade letter */}
          <span
            style={{
              fontSize: '48px',
              fontWeight: 900,
              fontFamily: '"Comic Sans MS", cursive, sans-serif',
              color,
              textShadow: `0 0 20px ${color}80, 0 2px 4px rgba(0,0,0,0.5)`,
              lineHeight: 1,
            }}
          >
            {grade}
          </span>

          {/* Phrase underneath */}
          <span
            style={{
              fontSize: '18px',
              fontWeight: 700,
              fontFamily: '"Comic Sans MS", cursive, sans-serif',
              color,
              textShadow: `0 0 10px ${color}60, 0 1px 2px rgba(0,0,0,0.5)`,
              marginTop: '4px',
            }}
          >
            {comment}
          </span>

          {/* Tip for C/D grades */}
          {tip && (
            <span
              style={{
                fontSize: '12px',
                color: '#ef8819',
                marginTop: '8px',
                textAlign: 'center',
                maxWidth: '150px',
                textShadow: '0 1px 2px rgba(0,0,0,0.5)',
              }}
            >
              {tip}
            </span>
          )}
        </div>
      </div>
    </>
  );
}

// Confetti component (unchanged)
function Confetti() {
  const particles = Array.from({ length: 30 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    delay: Math.random() * 0.5,
    color: ['#FFD700', '#FF6B35', '#1E3A8A', '#45B7D1', '#96CEB4'][i % 5],
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
