import React from 'react';
import type { TutorialPhase } from '@/game/engine/types';
import { TUTORIAL_CONTENT } from '@/game/engine/tutorial';
import { TutorialHand } from './TutorialHand';

interface TutorialOverlayProps {
  phase: TutorialPhase;
  active: boolean;
  timeRemaining: number;
}

export function TutorialOverlay({ phase, active, timeRemaining }: TutorialOverlayProps) {
  if (!active || phase === 'none') return null;

  const content = TUTORIAL_CONTENT[phase];
  const progress = timeRemaining / 4.0; // 4 second duration

  return (
    <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
      {/* Dim background */}
      <div className="absolute inset-0 bg-black/50" />

      {/* Animated hand gesture */}
      <TutorialHand phase={phase} active={active} />

      {/* Speech bubble - hand-drawn style */}
      <div
        className="relative z-10 rounded-lg p-4 max-w-xs"
        style={{
          backgroundColor: '#FFF8E7',
          border: '3px solid #1e3a5f',
          boxShadow: '4px 4px 0 rgba(0,0,0,0.2)',
        }}
      >
        {/* Hand-drawn style pointer */}
        <div
          className="absolute -bottom-4 left-1/2 -translate-x-1/2"
          style={{
            width: 0,
            height: 0,
            borderLeft: '12px solid transparent',
            borderRight: '12px solid transparent',
            borderTop: '16px solid #1e3a5f',
          }}
        />
        <div
          className="absolute -bottom-2 left-1/2 -translate-x-1/2"
          style={{
            width: 0,
            height: 0,
            borderLeft: '10px solid transparent',
            borderRight: '10px solid transparent',
            borderTop: '14px solid #FFF8E7',
          }}
        />

        {content.lines.map((line, i) => (
          <p
            key={i}
            className="text-center font-bold text-base"
            style={{ color: '#1e3a5f' }}
          >
            {line}
          </p>
        ))}

        {/* Progress bar - orange accent */}
        <div
          className="mt-3 h-2 rounded-full overflow-hidden"
          style={{ backgroundColor: 'rgba(0,0,0,0.1)' }}
        >
          <div
            className="h-full transition-all rounded-full"
            style={{
              width: `${progress * 100}%`,
              backgroundColor: '#F5A623',
            }}
          />
        </div>
      </div>
    </div>
  );
}
