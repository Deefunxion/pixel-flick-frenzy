// src/components/LevelSelect.tsx
// Flipbook aesthetic: ballpoint blue pen + orange stabilo marker
import { ARCADE_LEVELS } from '@/game/engine/arcade/levels';
import type { ArcadeState, StarObjectives } from '@/game/engine/arcade/types';

// Flipbook colors
const INK_BLUE = '#1e3a5f';
const STABILO_ORANGE = '#d35400';
const PAPER_BG = '#f5f0e1';
const LINE_COLOR = '#c9d4dc';

interface LevelSelectProps {
  arcadeState: ArcadeState;
  onSelectLevel: (levelId: number) => void;
  onClose: () => void;
}

export function LevelSelect({ arcadeState, onSelectLevel, onClose }: LevelSelectProps) {
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div
        className="rounded-lg p-4 max-w-md w-full mx-4"
        style={{
          background: PAPER_BG,
          border: `3px solid ${INK_BLUE}`,
          boxShadow: '4px 4px 0 rgba(0,0,0,0.2)',
          // Ruled paper lines
          backgroundImage: `repeating-linear-gradient(transparent, transparent 19px, ${LINE_COLOR} 19px, ${LINE_COLOR} 20px)`,
          backgroundPosition: '0 10px',
        }}
      >
        {/* Header */}
        <div
          className="flex justify-between items-center mb-4 pb-2"
          style={{ borderBottom: `2px solid ${INK_BLUE}` }}
        >
          <h2
            style={{
              fontFamily: '"Comic Sans MS", cursive, sans-serif',
              fontSize: '18px',
              fontWeight: 'bold',
              color: INK_BLUE,
            }}
          >
            Select Level
          </h2>
          <button
            onClick={onClose}
            className="hover:opacity-70"
            style={{
              color: INK_BLUE,
              fontSize: '20px',
              fontWeight: 'bold',
              lineHeight: 1,
            }}
          >
            ×
          </button>
        </div>

        {/* Level grid */}
        <div className="grid grid-cols-5 gap-2">
          {ARCADE_LEVELS.map(level => {
            const stars = arcadeState.starsPerLevel[level.id];
            const passed = stars?.allDoodles || false;
            const starCount = countDisplayStars(stars);
            const isCurrent = level.id === arcadeState.currentLevelId;

            return (
              <button
                key={level.id}
                onClick={() => onSelectLevel(level.id)}
                className="aspect-square rounded flex flex-col items-center justify-center transition-transform hover:scale-105"
                style={{
                  background: isCurrent ? 'rgba(211, 84, 0, 0.15)' : PAPER_BG,
                  border: `2px solid ${isCurrent ? STABILO_ORANGE : INK_BLUE}`,
                  boxShadow: isCurrent ? `0 0 8px ${STABILO_ORANGE}40` : 'none',
                }}
              >
                <span
                  style={{
                    fontFamily: '"Comic Sans MS", cursive, sans-serif',
                    fontSize: '16px',
                    fontWeight: 'bold',
                    color: isCurrent ? STABILO_ORANGE : INK_BLUE,
                  }}
                >
                  {level.id}
                </span>
                <div className="flex text-xs">
                  {[0, 1].map(i => (
                    <span
                      key={i}
                      style={{
                        color: i < starCount ? STABILO_ORANGE : '#c4b89b',
                        fontSize: '10px',
                      }}
                    >
                      ★
                    </span>
                  ))}
                </div>
                {passed && (
                  <span style={{ color: STABILO_ORANGE, fontSize: '10px' }}>✓</span>
                )}
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div
          className="mt-4 text-center pt-2"
          style={{
            borderTop: `1px dashed ${INK_BLUE}`,
            fontFamily: '"Comic Sans MS", cursive, sans-serif',
            fontSize: '12px',
            color: INK_BLUE,
          }}
        >
          Total Stars:{' '}
          <span style={{ color: STABILO_ORANGE, fontWeight: 'bold' }}>
            {getTotalDisplayStars(arcadeState)}
          </span>
          {' '}/ 20
        </div>
      </div>
    </div>
  );
}

function countDisplayStars(stars: StarObjectives | undefined): number {
  if (!stars) return 0;
  let count = 0;
  if (stars.landedInZone) count++;
  if (stars.inOrder) count++;
  return count;
}

function getTotalDisplayStars(state: ArcadeState): number {
  let total = 0;
  for (const levelId in state.starsPerLevel) {
    total += countDisplayStars(state.starsPerLevel[levelId]);
  }
  return total;
}
