import React from 'react';
import type { TutorialPhase } from '@/game/engine/types';
import { TUTORIAL_CONTENT } from '@/game/engine/tutorial';

interface TutorialOverlayProps {
  phase: TutorialPhase;
  active: boolean;
  timeRemaining: number;
}

export function TutorialOverlay({ phase, active, timeRemaining }: TutorialOverlayProps) {
  if (!active || phase === 'none') return null;

  const content = TUTORIAL_CONTENT[phase];
  const progress = timeRemaining / 2.0; // 2 second duration

  return (
    <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
      {/* Dim background */}
      <div className="absolute inset-0 bg-black/50" />

      {/* Speech bubble */}
      <div className="relative z-10 bg-white border-2 border-blue-500 rounded-lg p-4 max-w-xs shadow-lg">
        <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-0 h-0
                        border-l-8 border-r-8 border-t-8
                        border-l-transparent border-r-transparent border-t-blue-500" />

        {content.lines.map((line, i) => (
          <p key={i} className="text-center text-blue-800 font-medium text-sm">
            {line}
          </p>
        ))}

        {/* Progress bar */}
        <div className="mt-2 h-1 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-500 transition-all"
            style={{ width: `${progress * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}
