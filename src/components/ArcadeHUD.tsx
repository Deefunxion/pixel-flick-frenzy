// src/components/ArcadeHUD.tsx
import type { ArcadeState } from '@/game/engine/arcade/types';
import { getLevel } from '@/game/engine/arcade/levels';

interface ArcadeHUDProps {
  arcadeState: ArcadeState;
  currentDistance: number;
  doodlesCollected: number;
  totalDoodles: number;
  inOrderSoFar: boolean;
}

export function ArcadeHUD({
  arcadeState,
  currentDistance,
  doodlesCollected,
  totalDoodles,
  inOrderSoFar,
}: ArcadeHUDProps) {
  const level = getLevel(arcadeState.currentLevelId);
  if (!level) return null;

  const earnedStars = arcadeState.starsPerLevel[level.id];

  return (
    <div className="absolute bottom-2 left-0 right-0 flex justify-between px-3 pointer-events-none">
      {/* Level indicator */}
      <div className="bg-black/50 rounded px-2 py-1 text-white font-mono text-sm">
        <span className="text-yellow-400">LVL {level.id}</span>
        <span className="text-gray-400 ml-2">Land {level.landingTarget}+</span>
      </div>

      {/* Doodle counter */}
      {totalDoodles > 0 && (
        <div className="bg-black/50 rounded px-2 py-1 text-white font-mono text-sm">
          <span>{doodlesCollected}/{totalDoodles}</span>
          {inOrderSoFar && doodlesCollected > 0 && (
            <span className="ml-1 text-green-400">✓</span>
          )}
        </div>
      )}

      {/* Stars display */}
      <div className="bg-black/50 rounded px-2 py-1 flex gap-1">
        <Star filled={earnedStars?.allDoodles || false} />
        <Star filled={earnedStars?.inOrder || false} />
        <Star filled={earnedStars?.landedInZone || false} />
      </div>
    </div>
  );
}

function Star({ filled }: { filled: boolean }) {
  return (
    <span className={`text-lg ${filled ? 'text-yellow-400' : 'text-gray-600'}`}>
      ★
    </span>
  );
}
