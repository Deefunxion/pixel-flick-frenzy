// src/components/LevelSelect.tsx
import { ARCADE_LEVELS } from '@/game/engine/arcade/levels';
import type { ArcadeState, StarObjectives } from '@/game/engine/arcade/types';

interface LevelSelectProps {
  arcadeState: ArcadeState;
  onSelectLevel: (levelId: number) => void;
  onClose: () => void;
}

export function LevelSelect({ arcadeState, onSelectLevel, onClose }: LevelSelectProps) {
  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
      <div className="bg-amber-50 rounded-lg p-4 max-w-md w-full mx-4 border-2 border-amber-900">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-amber-900">Select Level</h2>
          <button
            onClick={onClose}
            className="text-amber-900 hover:text-amber-700 text-2xl"
          >
            ×
          </button>
        </div>

        <div className="grid grid-cols-5 gap-2">
          {ARCADE_LEVELS.map(level => {
            const stars = arcadeState.starsPerLevel[level.id];
            const passed = stars?.allDoodles || false;
            const starCount = countDisplayStars(stars);

            return (
              <button
                key={level.id}
                onClick={() => onSelectLevel(level.id)}
                className={`
                  aspect-square rounded border-2 flex flex-col items-center justify-center
                  ${level.id === arcadeState.currentLevelId
                    ? 'border-amber-500 bg-amber-100'
                    : passed
                      ? 'border-green-400 bg-green-50 hover:bg-green-100'
                      : 'border-amber-300 bg-white hover:bg-amber-50'
                  }
                `}
              >
                <span className="text-lg font-bold text-amber-900">{level.id}</span>
                <div className="flex text-xs">
                  {/* 2 stars: landedInZone, inOrder */}
                  {[0, 1].map(i => (
                    <span
                      key={i}
                      className={i < starCount ? 'text-yellow-500' : 'text-gray-300'}
                    >
                      ★
                    </span>
                  ))}
                </div>
                {passed && (
                  <span className="text-green-500 text-xs">✓</span>
                )}
              </button>
            );
          })}
        </div>

        <div className="mt-4 text-center text-amber-800 text-sm">
          Total Stars: {getTotalDisplayStars(arcadeState)} / 20
        </div>
      </div>
    </div>
  );
}

/**
 * Count stars for display (max 2 per level)
 * ★ landedInZone
 * ★★ inOrder (circular Bomb Jack style)
 */
function countDisplayStars(stars: StarObjectives | undefined): number {
  if (!stars) return 0;
  let count = 0;
  if (stars.landedInZone) count++;
  if (stars.inOrder) count++;
  return count;
}

/**
 * Get total stars across all levels (max 20)
 */
function getTotalDisplayStars(state: ArcadeState): number {
  let total = 0;
  for (const levelId in state.starsPerLevel) {
    total += countDisplayStars(state.starsPerLevel[levelId]);
  }
  return total;
}
