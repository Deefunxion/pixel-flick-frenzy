// src/components/ArcadeHUD.tsx
// Flipbook aesthetic: ballpoint blue pen + orange stabilo marker
import type { ArcadeState } from '@/game/engine/arcade/types';
import { getLevel } from '@/game/engine/arcade/levels';

// Flipbook colors
const INK_BLUE = '#1e3a5f';
const STABILO_ORANGE = '#d35400';

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
    <div className="absolute bottom-1 left-0 right-0 flex justify-between px-2 pointer-events-none">
      {/* Level indicator - transparent, bold */}
      <div style={{ fontFamily: '"Comic Sans MS", cursive, sans-serif' }}>
        <span style={{ color: STABILO_ORANGE, fontWeight: 'bold', fontSize: '10px' }}>
          LVL {level.id}
        </span>
        <span style={{ color: INK_BLUE, fontWeight: 'bold', marginLeft: '3px', fontSize: '8px' }}>
          →{level.landingTarget}
        </span>
      </div>

      {/* Doodle counter - transparent, bold */}
      {totalDoodles > 0 && (
        <div style={{ fontFamily: '"Comic Sans MS", cursive, sans-serif' }}>
          <span style={{ color: INK_BLUE, fontWeight: 'bold', fontSize: '10px' }}>
            {doodlesCollected}/{totalDoodles}
          </span>
          {inOrderSoFar && doodlesCollected > 0 && (
            <span style={{ color: STABILO_ORANGE, fontWeight: 'bold', marginLeft: '3px', fontSize: '8px' }}>
              ✓
            </span>
          )}
        </div>
      )}

      {/* Stars display - transparent, bold - 3 stars now */}
      <div className="flex gap-1">
        <Star filled={earnedStars?.landedInZone || false} />
        <Star filled={earnedStars?.allDoodles || false} />
        <Star filled={earnedStars?.inOrder || false} />
      </div>
    </div>
  );
}

function Star({ filled }: { filled: boolean }) {
  return (
    <span
      style={{
        fontSize: '10px',
        fontWeight: 'bold',
        color: filled ? STABILO_ORANGE : '#c4b89b',
      }}
    >
      ★
    </span>
  );
}
