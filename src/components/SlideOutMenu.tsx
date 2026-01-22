/**
 * SlideOutMenu - Landscape-only menu with flipbook aesthetic
 *
 * Only appears in landscape mode when hamburger is clicked.
 * Styled to match the hand-drawn notebook look.
 */

import React from 'react';
import type { Theme } from '@/game/themes';
import type { ThrowState } from '@/game/engine/types';

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
  // State
  isMuted: boolean;
  throwState: ThrowState;
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
  isMuted,
  throwState,
}: SlideOutMenuProps) {
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

      {/* Menu Panel - Notebook style popup */}
      <div
        className="fixed z-50"
        style={{
          left: '8px',
          top: '50%',
          transform: 'translateY(-50%)',
          width: '180px',
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
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with close X */}
        <div
          className="flex justify-between items-center px-3 py-2"
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

        {/* Quick Stats */}
        <div className="px-3 py-2" style={{ borderBottom: `1px dashed ${lineColor}` }}>
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

        {/* Action Buttons */}
        <div className="p-2 space-y-1">
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
