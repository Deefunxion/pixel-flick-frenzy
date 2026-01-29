// src/components/TutorialHand.tsx

import { useEffect, useState } from 'react';
import type { TutorialPhase } from '@/game/engine/types';

interface TutorialHandProps {
  phase: TutorialPhase;
  active: boolean;
}

type GestureAnimation = 'tap' | 'hold' | 'drag';

const PHASE_GESTURES: Record<TutorialPhase, GestureAnimation[]> = {
  none: [],
  idle: ['tap'],
  charge: ['hold', 'drag'],
  air: ['tap', 'hold'],
  slide: ['tap', 'hold'],
};

export function TutorialHand({ phase, active }: TutorialHandProps) {
  const [currentGesture, setCurrentGesture] = useState(0);
  const [animationFrame, setAnimationFrame] = useState(0);

  const gestures = PHASE_GESTURES[phase] || [];

  useEffect(() => {
    if (!active || gestures.length === 0) return;

    // Cycle through gestures every 2 seconds
    const gestureInterval = setInterval(() => {
      setCurrentGesture(g => (g + 1) % gestures.length);
      setAnimationFrame(0);
    }, 2000);

    // Animate gesture every 100ms
    const frameInterval = setInterval(() => {
      setAnimationFrame(f => (f + 1) % 20);
    }, 100);

    return () => {
      clearInterval(gestureInterval);
      clearInterval(frameInterval);
    };
  }, [active, gestures.length]);

  if (!active || gestures.length === 0) return null;

  const gesture = gestures[currentGesture];

  // Calculate hand position based on gesture and animation frame
  const getHandStyle = (): React.CSSProperties => {
    const baseY = 60; // percentage from top
    const baseX = 50;

    switch (gesture) {
      case 'tap':
        // Tap animation: move down briefly
        const tapOffset = animationFrame < 5 ? animationFrame * 2 : Math.max(0, 10 - (animationFrame - 5) * 2);
        return {
          top: `${baseY + tapOffset}%`,
          left: `${baseX}%`,
          transform: 'translate(-50%, -50%)',
        };

      case 'hold':
        // Hold animation: pulse/glow effect (hand stays still)
        const holdScale = 1 + Math.sin(animationFrame * 0.3) * 0.1;
        return {
          top: `${baseY}%`,
          left: `${baseX}%`,
          transform: `translate(-50%, -50%) scale(${holdScale})`,
        };

      case 'drag':
        // Drag animation: move up and down
        const dragY = Math.sin(animationFrame * 0.3) * 15;
        return {
          top: `${baseY + dragY}%`,
          left: `${baseX}%`,
          transform: 'translate(-50%, -50%)',
        };

      default:
        return {
          top: `${baseY}%`,
          left: `${baseX}%`,
          transform: 'translate(-50%, -50%)',
        };
    }
  };

  const getGestureLabel = (): string => {
    switch (gesture) {
      case 'tap': return 'TAP';
      case 'hold': return 'HOLD';
      case 'drag': return 'DRAG';
      default: return '';
    }
  };

  // Get ring color based on gesture
  const getRingColor = (): string => {
    return gesture === 'hold' ? '#F5A623' : '#4ECDC4';
  };

  return (
    <div className="absolute inset-0 pointer-events-none z-20">
      {/* Hand icon (using emoji as placeholder - replace with actual asset) */}
      <div
        className="absolute w-16 h-16 transition-all duration-100"
        style={getHandStyle()}
      >
        {/* Hand representation - can be replaced with actual PNG */}
        <div
          className="w-full h-full flex items-center justify-center text-4xl"
          style={{
            filter: 'drop-shadow(2px 2px 4px rgba(0,0,0,0.3))',
          }}
        >
          👆
        </div>

        {/* Gesture indicator ring */}
        <div
          className="absolute -inset-2 rounded-full border-4 opacity-50"
          style={{
            borderColor: getRingColor(),
            animation: gesture === 'hold' ? 'pulse 1s infinite' : 'none',
          }}
        />

        {/* Ripple effect for tap */}
        {gesture === 'tap' && animationFrame < 10 && (
          <div
            className="absolute inset-0 rounded-full border-2"
            style={{
              borderColor: '#4ECDC4',
              transform: `scale(${1 + animationFrame * 0.15})`,
              opacity: 1 - animationFrame * 0.1,
            }}
          />
        )}
      </div>

      {/* Gesture label */}
      <div
        className="absolute top-3/4 left-1/2 -translate-x-1/2 px-3 py-1 rounded"
        style={{
          background: '#1e3a5f',
          color: 'white',
          fontFamily: '"Comic Sans MS", cursive',
          fontSize: '14px',
          fontWeight: 'bold',
        }}
      >
        {getGestureLabel()}
      </div>

      {/* CSS for pulse animation */}
      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 0.5; }
          50% { transform: scale(1.1); opacity: 0.8; }
        }
      `}</style>
    </div>
  );
}
