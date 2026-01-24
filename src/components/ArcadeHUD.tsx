// src/components/ArcadeHUD.tsx
// Flipbook aesthetic: ballpoint blue pen + orange stabilo marker
import type { ArcadeState } from '@/game/engine/arcade/types';
import { getLevel } from '@/game/engine/arcade/levels';

// Flipbook colors
const INK_BLUE = '#1e3a5f';
const STABILO_ORANGE = '#d35400';
const PAPER_BG = 'rgba(245, 240, 225, 0.85)';

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
      {/* Level indicator - notebook style */}
      <div
        className="rounded px-2 py-1"
        style={{
          background: PAPER_BG,
          border: `2px solid ${INK_BLUE}`,
          fontFamily: '"Comic Sans MS", cursive, sans-serif',
        }}
      >
        <span style={{ color: STABILO_ORANGE, fontWeight: 'bold', fontSize: '13px' }}>
          LVL {level.id}
        </span>
        <span style={{ color: INK_BLUE, marginLeft: '6px', fontSize: '11px' }}>
          → {level.landingTarget}
        </span>
      </div>

      {/* Doodle counter */}
      {totalDoodles > 0 && (
        <div
          className="rounded px-2 py-1"
          style={{
            background: PAPER_BG,
            border: `2px solid ${INK_BLUE}`,
            fontFamily: '"Comic Sans MS", cursive, sans-serif',
          }}
        >
          <span style={{ color: INK_BLUE, fontWeight: 'bold', fontSize: '13px' }}>
            {doodlesCollected}/{totalDoodles}
          </span>
          {inOrderSoFar && doodlesCollected > 0 && (
            <span style={{ color: STABILO_ORANGE, marginLeft: '4px', fontSize: '12px' }}>
              ✓
            </span>
          )}
        </div>
      )}

      {/* Stars display */}
      <div
        className="rounded px-2 py-1 flex gap-1"
        style={{
          background: PAPER_BG,
          border: `2px solid ${INK_BLUE}`,
        }}
      >
        <Star filled={earnedStars?.landedInZone || false} />
        <Star filled={earnedStars?.inOrder || false} />
      </div>
    </div>
  );
}

function Star({ filled }: { filled: boolean }) {
  return (
    <span
      style={{
        fontSize: '14px',
        color: filled ? STABILO_ORANGE : '#c4b89b',
        textShadow: filled ? '0 0 4px rgba(211, 84, 0, 0.5)' : 'none',
      }}
    >
      ★
    </span>
  );
}
