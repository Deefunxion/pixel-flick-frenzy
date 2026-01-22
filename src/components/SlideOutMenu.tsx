import React from 'react';
import type { Theme } from '@/game/themes';
import type { ThrowState } from '@/game/engine/types';
import { UI_ASSETS } from '@/game/engine/uiAssets';

interface SlideOutMenuProps {
  isOpen: boolean;
  onClose: () => void;
  theme: Theme;
  themeId: string;
  // Stats data
  lastDist: number | null;
  best: number;
  zenoTarget: number;
  zenoLevel: number;
  totalScore: number;
  // Actions
  onOpenStats: () => void;
  onOpenLeaderboard: () => void;
  onToggleSound: () => void;
  onToggleHaptics: () => void;
  onReplayTutorial: () => void;
  // State
  isMuted: boolean;
  hapticsEnabled: boolean;
  hasHaptics: boolean;
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
  onToggleHaptics,
  onReplayTutorial,
  isMuted,
  hapticsEnabled,
  hasHaptics,
  throwState,
}: SlideOutMenuProps) {
  if (!isOpen) return null;

  const isNoir = themeId === 'noir';
  const filterStyle = isNoir ? 'invert(1)' : 'none';

  const formatScore = (n: number) => {
    const int = Math.floor(n);
    const dec = ((n - int) * 100).toFixed(0).padStart(2, '0');
    return { int, dec };
  };

  return (
    <>
      {/* Backdrop - tap to close */}
      <div
        className="fixed inset-0 z-40"
        style={{ background: 'rgba(0,0,0,0.5)' }}
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className="fixed left-0 top-0 bottom-0 z-50 w-72 overflow-y-auto"
        style={{
          background: `${theme.uiBg}f0`,
          borderRight: `2px solid ${theme.accent3}`,
          transform: isOpen ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 250ms ease-out',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b" style={{ borderColor: theme.accent3 }}>
          <span className="font-bold" style={{ color: theme.accent1 }}>Menu</span>
          <button
            onClick={onClose}
            className="text-2xl px-2 hover:opacity-70"
            style={{ color: theme.uiText }}
          >
            ×
          </button>
        </div>

        {/* Quick Stats */}
        <div className="p-4 border-b" style={{ borderColor: theme.accent3 }}>
          <div className="grid grid-cols-2 gap-3 text-center">
            <div>
              <div className="text-xs opacity-70" style={{ color: theme.uiText }}>LAST</div>
              <div className="text-lg font-bold font-mono" style={{ color: theme.accent1 }}>
                {lastDist !== null ? (
                  <>{formatScore(lastDist).int}<span className="text-sm opacity-60">.{formatScore(lastDist).dec}</span></>
                ) : '-'}
              </div>
            </div>
            <div>
              <div className="text-xs opacity-70" style={{ color: theme.uiText }}>BEST</div>
              <div className="text-lg font-bold font-mono" style={{ color: theme.highlight }}>
                {formatScore(best).int}<span className="text-sm opacity-60">.{formatScore(best).dec}</span>
              </div>
            </div>
            <div>
              <div className="text-xs opacity-70" style={{ color: theme.uiText }}>TARGET</div>
              <div className="text-lg font-bold font-mono" style={{ color: theme.accent2 }}>
                {formatScore(zenoTarget).int}<span className="text-sm opacity-60">.{formatScore(zenoTarget).dec}</span>
              </div>
            </div>
            <div>
              <div className="text-xs opacity-70" style={{ color: theme.uiText }}>LEVEL</div>
              <div className="text-lg font-bold font-mono" style={{ color: theme.highlight }}>
                {zenoLevel}
              </div>
            </div>
          </div>
          <div className="mt-3 text-center">
            <div className="text-xs opacity-70" style={{ color: theme.uiText }}>SCORE</div>
            <div className="text-xl font-bold font-mono" style={{ color: theme.accent1 }}>
              {totalScore.toLocaleString()}
            </div>
          </div>
          {/* Throws remaining */}
          <div className="mt-2 text-center text-xs" style={{ color: theme.uiText }}>
            Throws: {throwState.freeThrows + throwState.permanentThrows}
            {throwState.isPremium && ' ∞'}
          </div>
        </div>

        {/* Navigation Buttons */}
        <div className="p-4 space-y-2">
          <MenuButton
            onClick={() => { onOpenLeaderboard(); onClose(); }}
            theme={theme}
          >
            <img src={UI_ASSETS.leaderboard} alt="" className="h-6" style={{ filter: filterStyle }} />
            <span>Leaderboard</span>
          </MenuButton>

          <MenuButton
            onClick={() => { onOpenStats(); onClose(); }}
            theme={theme}
          >
            <img src={UI_ASSETS.statsLabel} alt="" className="h-6" style={{ filter: filterStyle }} />
            <span>Stats & Achievements</span>
          </MenuButton>
        </div>

        {/* Settings */}
        <div className="p-4 border-t" style={{ borderColor: theme.accent3 }}>
          <div className="text-xs font-bold mb-3" style={{ color: theme.accent2 }}>Settings</div>

          {/* Sound toggle */}
          <ToggleRow
            label="Sound"
            enabled={!isMuted}
            onToggle={onToggleSound}
            theme={theme}
            icon={isMuted ? UI_ASSETS.volumeOff : UI_ASSETS.volumeOn}
            filterStyle={filterStyle}
          />

          {/* Haptics toggle */}
          {hasHaptics && (
            <ToggleRow
              label="Haptics"
              enabled={hapticsEnabled}
              onToggle={onToggleHaptics}
              theme={theme}
              emoji={hapticsEnabled ? '📳' : '📴'}
            />
          )}
        </div>

        {/* Actions */}
        <div className="p-4 border-t" style={{ borderColor: theme.accent3 }}>
          <MenuButton onClick={onReplayTutorial} theme={theme}>
            <img src={UI_ASSETS.helpIcon} alt="" className="h-6" style={{ filter: filterStyle }} />
            <span>Replay Tutorial</span>
          </MenuButton>
        </div>
      </div>
    </>
  );
}

function MenuButton({
  onClick,
  theme,
  children,
}: {
  onClick: () => void;
  theme: Theme;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 p-3 rounded hover:opacity-80 transition-opacity"
      style={{
        background: `${theme.accent3}30`,
        border: `1px solid ${theme.accent3}`,
        color: theme.uiText,
      }}
    >
      {children}
    </button>
  );
}

function ToggleRow({
  label,
  enabled,
  onToggle,
  theme,
  icon,
  emoji,
  filterStyle,
}: {
  label: string;
  enabled: boolean;
  onToggle: () => void;
  theme: Theme;
  icon?: string;
  emoji?: string;
  filterStyle?: string;
}) {
  return (
    <div className="flex items-center justify-between py-2">
      <div className="flex items-center gap-2">
        {icon && <img src={icon} alt="" className="w-5 h-5" style={{ filter: filterStyle }} />}
        {emoji && <span>{emoji}</span>}
        <span className="text-sm" style={{ color: theme.uiText }}>{label}</span>
      </div>
      <button
        onClick={onToggle}
        className="w-12 h-6 rounded-full transition-colors relative"
        style={{
          background: enabled ? theme.highlight : `${theme.accent3}50`,
        }}
      >
        <div
          className="absolute top-1 w-4 h-4 rounded-full bg-white transition-transform"
          style={{
            transform: enabled ? 'translateX(26px)' : 'translateX(2px)',
          }}
        />
      </button>
    </div>
  );
}
