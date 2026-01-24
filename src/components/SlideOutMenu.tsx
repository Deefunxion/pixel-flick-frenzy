/**
 * SlideOutMenu - Landscape-only menu with flipbook aesthetic
 *
 * Only appears in landscape mode when hamburger is clicked.
 * Styled to match the hand-drawn notebook look.
 */

import React, { useState } from 'react';
import type { Theme } from '@/game/themes';
import type { ThrowState } from '@/game/engine/types';
import type { ArcadeState } from '@/game/engine/arcade/types';
import { LevelSelect } from './LevelSelect';

interface SlideOutMenuProps {
  isOpen: boolean;
  onClose: () => void;
  theme: Theme;
  themeId: string;
  // Stats
  lastDist: number | null;
  best: number;
  zenoTarget: number;
  zenoLevel: number;
  totalScore: number;
  // Actions
  onOpenStats: () => void;
  onOpenLeaderboard: () => void;
  onToggleSound: () => void;
  onReplayTutorial: () => void;
  onSelectLevel?: (levelId: number) => void;
  // State
  isMuted: boolean;
  throwState: ThrowState;
  arcadeState?: ArcadeState | null;
}

export function SlideOutMenu({
  isOpen,
  onClose,
  theme,
  themeId,
  lastDist,
  best,
  zenoTarget,
  zenoLevel,
  totalScore,
  onOpenStats,
  onOpenLeaderboard,
  onToggleSound,
  onReplayTutorial,
  onSelectLevel,
  isMuted,
  throwState,
  arcadeState,
}: SlideOutMenuProps) {
  const [showLevelSelect, setShowLevelSelect] = useState(false);

  if (!isOpen) return null;

  const isNoir = themeId === 'noir';

  // Flipbook style colors
  const paperBg = isNoir ? '#1a1a2e' : '#f5f0e1';
  const inkColor = isNoir ? '#e0e0e0' : '#1e3a5f';
  const accentColor = isNoir ? '#4a9eff' : '#d35400';
  const lineColor = isNoir ? '#333' : '#c9d4dc';

  const formatScore = (n: number) => {
    const int = Math.floor(n);
    const dec = ((n - int) * 100).toFixed(0).padStart(2, '0');
    return `${int}.${dec}`;
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40"
        style={{ background: 'rgba(0,0,0,0.4)' }}
        onClick={onClose}
      />

      {/* Menu Panel - Notebook style popup, responsive to zoom */}
      <div
        className="fixed z-50"
        style={{
          left: '8px',
          top: '8px',
          bottom: '8px',
          width: 'min(180px, 40vw)',
          maxHeight: 'calc(100vh - 16px)',
          overflowY: 'auto',
          background: paperBg,
          border: `3px solid ${inkColor}`,
          borderRadius: '4px',
          boxShadow: isNoir
            ? '4px 4px 0 rgba(0,0,0,0.5)'
            : '3px 3px 0 rgba(0,0,0,0.2)',
          // Ruled paper lines
          backgroundImage: isNoir
            ? 'none'
            : `repeating-linear-gradient(transparent, transparent 19px, ${lineColor} 19px, ${lineColor} 20px)`,
          backgroundPosition: '0 10px',
          display: 'flex',
          flexDirection: 'column',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with close X */}
        <div
          className="flex justify-between items-center px-3 py-2 flex-shrink-0"
          style={{
            borderBottom: `2px solid ${inkColor}`,
            fontFamily: '"Comic Sans MS", cursive, sans-serif',
          }}
        >
          <span style={{ color: inkColor, fontWeight: 'bold', fontSize: '14px' }}>
            MENU
          </span>
          <button
            onClick={onClose}
            className="hover:opacity-70"
            style={{
              color: inkColor,
              fontSize: '18px',
              fontWeight: 'bold',
              lineHeight: 1,
            }}
          >
            ×
          </button>
        </div>

        {/* Quick Stats - compact, doesn't shrink */}
        <div className="px-3 py-2 flex-shrink-0" style={{ borderBottom: `1px dashed ${lineColor}` }}>
          <div className="grid grid-cols-2 gap-1 text-center" style={{ fontSize: '11px' }}>
            <div>
              <div style={{ color: inkColor, opacity: 0.6 }}>LAST</div>
              <div style={{ color: accentColor, fontWeight: 'bold', fontFamily: 'monospace' }}>
                {lastDist !== null ? formatScore(lastDist) : '-'}
              </div>
            </div>
            <div>
              <div style={{ color: inkColor, opacity: 0.6 }}>BEST</div>
              <div style={{ color: theme.highlight, fontWeight: 'bold', fontFamily: 'monospace' }}>
                {formatScore(best)}
              </div>
            </div>
            <div>
              <div style={{ color: inkColor, opacity: 0.6 }}>TARGET</div>
              <div style={{ color: inkColor, fontWeight: 'bold', fontFamily: 'monospace' }}>
                {formatScore(zenoTarget)}
              </div>
            </div>
            <div>
              <div style={{ color: inkColor, opacity: 0.6 }}>LV</div>
              <div style={{ color: accentColor, fontWeight: 'bold', fontFamily: 'monospace' }}>
                {zenoLevel}
              </div>
            </div>
          </div>
          <div className="text-center mt-1" style={{ fontSize: '10px' }}>
            <span style={{ color: inkColor, opacity: 0.6 }}>SCORE: </span>
            <span style={{ color: inkColor, fontWeight: 'bold', fontFamily: 'monospace' }}>
              {Math.floor(totalScore).toLocaleString()}
            </span>
            <span style={{ color: inkColor, opacity: 0.5, marginLeft: '8px' }}>
              [{throwState.freeThrows + throwState.permanentThrows}]
            </span>
          </div>
        </div>

        {/* Action Buttons - flex-1 to fill remaining space */}
        <div className="p-2 space-y-1 flex-1 overflow-y-auto">
          {arcadeState && onSelectLevel && (
            <MenuButton onClick={() => setShowLevelSelect(true)} inkColor={inkColor} paperBg={paperBg}>
              Level Select
            </MenuButton>
          )}
          <MenuButton onClick={() => { onOpenLeaderboard(); onClose(); }} inkColor={inkColor} paperBg={paperBg}>
            Leaderboard
          </MenuButton>
          <MenuButton onClick={() => { onOpenStats(); onClose(); }} inkColor={inkColor} paperBg={paperBg}>
            Stats
          </MenuButton>
          <MenuButton onClick={onToggleSound} inkColor={inkColor} paperBg={paperBg}>
            Sound: {isMuted ? 'OFF' : 'ON'}
          </MenuButton>
          <MenuButton onClick={onReplayTutorial} inkColor={inkColor} paperBg={paperBg}>
            Tutorial
          </MenuButton>
        </div>
      </div>

      {/* Level Select Modal */}
      {showLevelSelect && arcadeState && onSelectLevel && (
        <LevelSelect
          arcadeState={arcadeState}
          onSelectLevel={(levelId) => {
            onSelectLevel(levelId);
            setShowLevelSelect(false);
            onClose();
          }}
          onClose={() => setShowLevelSelect(false)}
        />
      )}
    </>
  );
}

function MenuButton({
  onClick,
  children,
  inkColor,
  paperBg
}: {
  onClick: () => void;
  children: React.ReactNode;
  inkColor: string;
  paperBg: string;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left px-2 py-1 rounded hover:opacity-80 transition-opacity"
      style={{
        fontSize: '12px',
        fontFamily: '"Comic Sans MS", cursive, sans-serif',
        color: inkColor,
        background: `${inkColor}10`,
        border: `1px solid ${inkColor}40`,
      }}
    >
      {children}
    </button>
  );
}
