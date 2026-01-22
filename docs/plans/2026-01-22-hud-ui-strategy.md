# HUD/UI Strategy Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix responsive layout issues (iPhone landscape, browser zoom) and create a unified Canvas-Centric UI strategy with hamburger menu, ring-style landing grades, and Claim All functionality.

**Architecture:** Canvas takes maximum viewport space. All secondary UI moves to a slide-out panel triggered by hamburger button (top-left corner inside canvas). Essential HUD elements (ThrowScore, LandingGrade, StreakCounter, MiniGoalHUD) remain as overlays. Landing grades get celebratory popup styling matching ring hit effects.

**Tech Stack:** React 18, TypeScript, Tailwind CSS, Canvas 2D API

---

## Task 1: Fix Responsive CSS for Canvas-Centric Layout

**Files:**
- Modify: `src/index.css:116-148` (responsive breakpoints)

**Step 1: Update landscape breakpoint to maximize canvas**

Replace lines 126-140 in `src/index.css`:

```css
/* Mobile responsive - Landscape (Canvas-Centric) */
@media (max-height: 500px) and (orientation: landscape) {
  .game-canvas {
    width: auto;
    height: 95vh;
    aspect-ratio: 2 / 1;
    max-width: 100vw;
  }

  /* Hide external UI in landscape - hamburger menu takes over */
  .external-ui {
    display: none !important;
  }

  /* Compact body in landscape */
  body {
    padding: 0;
    margin: 0;
  }
}
```

**Step 2: Add zoom-resistant container styles**

Add after line 148:

```css
/* Canvas container - zoom resistant */
.canvas-container {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  max-width: 100vw;
  overflow: hidden;
}

/* Landscape: full viewport canvas */
@media (max-height: 500px) and (orientation: landscape) {
  .canvas-container {
    height: 100vh;
    height: 100svh; /* Safe viewport height for mobile */
  }
}
```

**Step 3: Verify CSS syntax**

Run: `npm run build`
Expected: Build succeeds with no CSS errors

**Step 4: Commit**

```bash
git add src/index.css
git commit -m "fix: responsive CSS for canvas-centric layout in landscape"
```

---

## Task 2: Create SlideOutMenu Component

**Files:**
- Create: `src/components/SlideOutMenu.tsx`

**Step 1: Create the slide-out menu component**

Create `src/components/SlideOutMenu.tsx`:

```tsx
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
```

**Step 2: Verify component compiles**

Run: `npm run build`
Expected: Build succeeds

**Step 3: Commit**

```bash
git add src/components/SlideOutMenu.tsx
git commit -m "feat: create SlideOutMenu component for canvas-centric UI"
```

---

## Task 3: Add Hamburger Button to Canvas Render

**Files:**
- Modify: `src/game/engine/render.ts` (add hamburger icon rendering)
- Modify: `src/game/engine/types.ts` (add menuOpen state)
- Modify: `src/game/engine/state.ts` (initialize menuOpen)

**Step 1: Add menuOpen to GameState type**

In `src/game/engine/types.ts`, find the GameState interface and add near the end (before the closing brace):

```typescript
  // Slide-out menu state
  menuOpen: boolean;
```

**Step 2: Initialize menuOpen in state.ts**

In `src/game/engine/state.ts`, in `createInitialState()`, add before the closing brace of the return statement:

```typescript
    // Menu state
    menuOpen: false,
```

**Step 3: Add hamburger icon rendering to render.ts**

In `src/game/engine/render.ts`, find the end of the `renderFrame` function (before the final closing brace) and add:

```typescript
  // Hamburger menu icon (top-left corner, inside canvas)
  // Only render if not in flight (avoid distraction during gameplay)
  if (!state.flying && !state.sliding) {
    const menuX = 8;
    const menuY = 8;
    const menuSize = 20;
    const lineHeight = 3;
    const gap = 5;

    ctx.save();
    ctx.fillStyle = state.menuOpen ? theme.highlight : theme.accent3;
    ctx.globalAlpha = 0.8;

    // Three horizontal lines
    for (let i = 0; i < 3; i++) {
      ctx.fillRect(menuX, menuY + i * gap, menuSize, lineHeight);
    }

    ctx.restore();
  }
```

**Step 4: Verify build**

Run: `npm run build`
Expected: Build succeeds

**Step 5: Commit**

```bash
git add src/game/engine/types.ts src/game/engine/state.ts src/game/engine/render.ts
git commit -m "feat: add hamburger menu icon rendering on canvas"
```

---

## Task 4: Integrate SlideOutMenu and Hamburger Click Detection in Game.tsx

**Files:**
- Modify: `src/components/Game.tsx`

**Step 1: Import SlideOutMenu**

Add to imports at the top of Game.tsx:

```typescript
import { SlideOutMenu } from './SlideOutMenu';
```

**Step 2: Add menu state**

Find the state declarations (around line 200-300) and add:

```typescript
const [menuOpen, setMenuOpen] = useState(false);
```

**Step 3: Add hamburger click detection in pointer handler**

In the `handlePointerDown` function, add at the beginning (after the early returns):

```typescript
    // Check if clicking hamburger menu area (top-left 30x20 of canvas)
    const canvas = canvasRef.current;
    if (canvas) {
      const rect = canvas.getBoundingClientRect();
      const scaleX = W / rect.width;
      const scaleY = H / rect.height;
      const canvasX = (e.clientX - rect.left) * scaleX;
      const canvasY = (e.clientY - rect.top) * scaleY;

      // Hamburger hit area: top-left 35x25 pixels
      if (canvasX < 35 && canvasY < 25) {
        setMenuOpen(true);
        return; // Don't start charging
      }
    }
```

**Step 4: Add SlideOutMenu to render**

Find the return statement and add SlideOutMenu after the main container div opens, before the header:

```tsx
      {/* Slide-out Menu */}
      <SlideOutMenu
        isOpen={menuOpen}
        onClose={() => setMenuOpen(false)}
        theme={theme}
        themeId={themeId}
        lastDist={lastDist}
        best={best}
        zenoTarget={zenoTarget}
        zenoLevel={zenoLevel}
        totalScore={totalScore}
        onOpenStats={() => setShowStats(true)}
        onOpenLeaderboard={() => setShowLeaderboard(true)}
        onToggleSound={async () => {
          ensureAudioContext(audioRefs.current);
          await resumeIfSuspended(audioRefs.current);
          setAudioContextState(getAudioState(audioRefs.current));
          setAudioSettings((s) => ({ ...s, muted: !s.muted }));
        }}
        onToggleHaptics={toggleHaptics}
        onReplayTutorial={() => {
          resetTutorialProgress();
          if (stateRef.current) {
            stateRef.current.tutorialState.hasSeenCharge = false;
            stateRef.current.tutorialState.hasSeenAir = false;
            stateRef.current.tutorialState.hasSeenSlide = false;
          }
        }}
        isMuted={audioSettings.muted}
        hapticsEnabled={hapticsEnabled}
        hasHaptics={hasHapticSupport()}
        throwState={throwState}
      />
```

**Step 5: Add external-ui class to secondary UI elements**

Find the settings row (around line 1112) and add the class `external-ui` to hide in landscape:

Change:
```tsx
<div className="w-full max-w-md flex items-center justify-center gap-3 text-xs px-2"
```

To:
```tsx
<div className="w-full max-w-md flex items-center justify-center gap-3 text-xs px-2 external-ui"
```

Also add `external-ui` class to:
- The hero row (LAST, LV, TARGET)
- The secondary stats row (SCORE, BEST)
- The header row

**Step 6: Verify build**

Run: `npm run build`
Expected: Build succeeds

**Step 7: Test manually**

Run: `npm run dev`
Test: Click hamburger icon, verify menu opens

**Step 8: Commit**

```bash
git add src/components/Game.tsx
git commit -m "feat: integrate SlideOutMenu with hamburger click detection"
```

---

## Task 5: Restyle Landing Grades to Ring-Popup Style

**Files:**
- Modify: `src/game/engine/gradeSystem.ts` (update colors and comments)
- Modify: `src/components/LandingGrade.tsx` (new ring-style popup)

**Step 1: Update grade colors and comments in gradeSystem.ts**

Replace the GRADE_COLORS constant:

```typescript
// Grade colors - Performance-based (matching ring popup aesthetic)
export const GRADE_COLORS: Record<Grade, string> = {
  S: '#FFD700',  // Gold (legendary)
  A: '#FF6B35',  // Orange (celebration)
  B: '#1E3A8A',  // Ballpoint Blue (theme)
  C: '#6B7280',  // Muted Blue-Gray
  D: '#9CA3AF',  // Gray (de-emphasized)
};
```

Replace the COMMENTS constant:

```typescript
// Grade phrases - Short, celebratory (matching ring popup style)
const COMMENTS: Record<Grade, string[]> = {
  S: ['PERFECT!', 'LEGENDARY!', 'FLAWLESS!'],
  A: ['GREAT!', 'NICE!', 'SMOOTH!'],
  B: ['GOOD!', 'SOLID!', 'NOT BAD!'],
  C: ['OK', 'DECENT', 'MEH...'],
  D: ['OUCH...', 'ROUGH', 'TRY AGAIN'],
};
```

**Step 2: Rewrite LandingGrade.tsx with ring-popup style**

Replace entire content of `src/components/LandingGrade.tsx`:

```tsx
/**
 * Landing Grade Display - Ring-Popup Style
 *
 * Celebratory popup matching ring hit feedback aesthetic.
 * Big letter + phrase, pop-in animation, performance-based colors.
 */

import React, { useEffect, useState, useMemo } from 'react';
import { GradeResult, GRADE_COLORS, shouldShowConfetti, getRandomTip } from '@/game/engine/gradeSystem';

interface LandingGradeProps {
  result: GradeResult | null;
  visible: boolean;
  onDismiss?: () => void;
}

export function LandingGrade({ result, visible, onDismiss }: LandingGradeProps) {
  const [animPhase, setAnimPhase] = useState<'pop' | 'hold' | 'fade'>('pop');

  // Memoize tip so it doesn't change on every render
  const showTip = result && (result.grade === 'C' || result.grade === 'D');
  const tip = useMemo(() => showTip ? getRandomTip() : null, [showTip, result]);

  useEffect(() => {
    if (!visible || !result) {
      setAnimPhase('pop');
      return;
    }

    // Animation timeline:
    // 0-300ms: pop-in (scale 0 -> 1.2 -> 1)
    // 300-1200ms: hold
    // 1200-1500ms: fade-out

    setAnimPhase('pop');
    const holdTimer = setTimeout(() => setAnimPhase('hold'), 300);
    const fadeTimer = setTimeout(() => setAnimPhase('fade'), 1200);
    const dismissTimer = setTimeout(() => onDismiss?.(), 1500);

    return () => {
      clearTimeout(holdTimer);
      clearTimeout(fadeTimer);
      clearTimeout(dismissTimer);
    };
  }, [visible, result, onDismiss]);

  if (!visible || !result) return null;

  const { grade, comment } = result;
  const color = GRADE_COLORS[grade];

  // Animation styles
  const getAnimationStyle = (): React.CSSProperties => {
    switch (animPhase) {
      case 'pop':
        return {
          transform: 'translate(-50%, -50%) scale(1.2)',
          opacity: 1,
          transition: 'transform 150ms cubic-bezier(0.34, 1.56, 0.64, 1), opacity 100ms ease-out',
        };
      case 'hold':
        return {
          transform: 'translate(-50%, -50%) scale(1)',
          opacity: 1,
          transition: 'transform 150ms ease-out',
        };
      case 'fade':
        return {
          transform: 'translate(-50%, -50%) scale(0.8)',
          opacity: 0,
          transition: 'transform 300ms ease-in, opacity 300ms ease-in',
        };
    }
  };

  return (
    <>
      {/* Confetti for S/A */}
      {shouldShowConfetti(grade) && animPhase !== 'fade' && <Confetti />}

      {/* Grade popup - centered, ring-popup style */}
      <div
        className="absolute pointer-events-none"
        style={{
          left: '50%',
          top: '40%',
          ...getAnimationStyle(),
        }}
      >
        <div className="flex flex-col items-center">
          {/* Big grade letter */}
          <span
            style={{
              fontSize: '48px',
              fontWeight: 900,
              fontFamily: '"Comic Sans MS", cursive, sans-serif',
              color,
              textShadow: `0 0 20px ${color}80, 0 2px 4px rgba(0,0,0,0.5)`,
              lineHeight: 1,
            }}
          >
            {grade}
          </span>

          {/* Phrase underneath */}
          <span
            style={{
              fontSize: '18px',
              fontWeight: 700,
              fontFamily: '"Comic Sans MS", cursive, sans-serif',
              color,
              textShadow: `0 0 10px ${color}60, 0 1px 2px rgba(0,0,0,0.5)`,
              marginTop: '4px',
            }}
          >
            {comment}
          </span>

          {/* Tip for C/D grades */}
          {tip && (
            <span
              style={{
                fontSize: '12px',
                color: '#ef8819',
                marginTop: '8px',
                textAlign: 'center',
                maxWidth: '150px',
                textShadow: '0 1px 2px rgba(0,0,0,0.5)',
              }}
            >
              {tip}
            </span>
          )}
        </div>
      </div>
    </>
  );
}

// Confetti component (unchanged)
function Confetti() {
  const particles = Array.from({ length: 30 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    delay: Math.random() * 0.5,
    color: ['#FFD700', '#FF6B35', '#1E3A8A', '#45B7D1', '#96CEB4'][i % 5],
    size: 4 + Math.random() * 4,
  }));

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
      {particles.map(p => (
        <div
          key={p.id}
          className="absolute animate-confetti"
          style={{
            left: `${p.x}%`,
            top: '-10px',
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            borderRadius: '2px',
            animationDelay: `${p.delay}s`,
          }}
        />
      ))}
    </div>
  );
}

export default LandingGrade;
```

**Step 3: Verify build**

Run: `npm run build`
Expected: Build succeeds

**Step 4: Commit**

```bash
git add src/game/engine/gradeSystem.ts src/components/LandingGrade.tsx
git commit -m "feat: restyle landing grades with ring-popup aesthetic"
```

---

## Task 6: Add Claim All Button to AchievementsPanel

**Files:**
- Modify: `src/components/AchievementsPanel.tsx`
- Modify: `src/components/StatsOverlay.tsx` (pass new prop)
- Modify: `src/game/engine/achievementClaim.ts` (add claimAllAchievements function)

**Step 1: Add claimAllAchievements function**

Add to `src/game/engine/achievementClaim.ts` at the end:

```typescript
/**
 * Claim all unclaimed achievements with animated cascade.
 * Returns array of { id, reward } for each claimed achievement.
 */
export function getClaimableAchievements(
  achievements: Set<string>,
  claimedIds: string[]
): { id: string; reward: number }[] {
  return getUnclaimedAchievements(achievements, claimedIds)
    .map(id => ({ id, reward: getAchievementReward(id) }))
    .filter(a => a.reward > 0);
}
```

**Step 2: Update AchievementsPanel with Claim All button**

Replace `src/components/AchievementsPanel.tsx`:

```tsx
import React, { useState, useEffect } from 'react';
import { ACHIEVEMENTS } from '@/game/engine/achievements';
import { getAchievementReward, getClaimableAchievements } from '@/game/engine/achievementClaim';

interface AchievementsPanelProps {
  achievements: Set<string>;
  claimedAchievements: string[];
  onClaimAchievement: (id: string) => void;
  onClaimAll?: () => Promise<void>;
}

type AchievementStatus = {
  id: string;
  name: string;
  desc: string;
  reward: number;
  unlocked: boolean;
  claimed: boolean;
};

function getAchievementsStatus(
  achievements: Set<string>,
  claimedIds: string[]
): AchievementStatus[] {
  return Object.entries(ACHIEVEMENTS).map(([id, ach]) => ({
    id,
    name: ach.name,
    desc: ach.desc,
    reward: getAchievementReward(id),
    unlocked: achievements.has(id),
    claimed: claimedIds.includes(id),
  }));
}

export function AchievementsPanel({
  achievements,
  claimedAchievements,
  onClaimAchievement,
  onClaimAll,
}: AchievementsPanelProps) {
  const [allAchievements, setAllAchievements] = useState(() =>
    getAchievementsStatus(achievements, claimedAchievements)
  );
  const [claimingAll, setClaimingAll] = useState(false);
  const [claimProgress, setClaimProgress] = useState(0);
  const [highlightId, setHighlightId] = useState<string | null>(null);

  // Update when props change
  useEffect(() => {
    setAllAchievements(getAchievementsStatus(achievements, claimedAchievements));
  }, [achievements, claimedAchievements]);

  // Sort: unclaimed first, then claimed, then locked
  const sorted = [...allAchievements].sort((a, b) => {
    const aUnclaimed = a.unlocked && !a.claimed;
    const bUnclaimed = b.unlocked && !b.claimed;
    if (aUnclaimed && !bUnclaimed) return -1;
    if (!aUnclaimed && bUnclaimed) return 1;
    if (a.claimed && !b.claimed) return -1;
    if (!a.claimed && b.claimed) return 1;
    return 0;
  });

  const unclaimed = allAchievements.filter(a => a.unlocked && !a.claimed);
  const unclaimedCount = unclaimed.length;
  const totalReward = unclaimed.reduce((sum, a) => sum + a.reward, 0);

  const handleClaimAll = async () => {
    if (claimingAll || unclaimedCount === 0) return;

    setClaimingAll(true);
    setClaimProgress(0);

    const claimable = getClaimableAchievements(achievements, claimedAchievements);

    // Animated cascade: claim one by one with 50ms delay
    for (let i = 0; i < claimable.length; i++) {
      const { id, reward } = claimable[i];
      setHighlightId(id);
      setClaimProgress(prev => prev + reward);

      onClaimAchievement(id);

      // Wait 50ms before next claim
      await new Promise(resolve => setTimeout(resolve, 50));
    }

    setHighlightId(null);
    setClaimingAll(false);

    // Call onClaimAll callback if provided
    onClaimAll?.();
  };

  return (
    <div className="bg-slate-800/90 rounded-lg p-3">
      {/* Header with Claim All button */}
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-amber-400 font-bold text-sm flex items-center gap-2">
          Achievements
          {unclaimedCount > 0 && (
            <span className="bg-amber-600 text-white text-xs px-1.5 py-0.5 rounded-full">
              {unclaimedCount}
            </span>
          )}
        </h3>

        {/* Claim All Button */}
        {unclaimedCount > 0 && (
          <button
            onClick={handleClaimAll}
            disabled={claimingAll}
            className="bg-amber-600 hover:bg-amber-500 disabled:bg-amber-800 text-white px-3 py-1 rounded text-xs font-bold transition-colors flex items-center gap-1"
          >
            {claimingAll ? (
              <span>+{claimProgress}...</span>
            ) : (
              <span>Claim All (+{totalReward})</span>
            )}
          </button>
        )}
      </div>

      <div className="space-y-1.5 max-h-64 overflow-y-auto">
        {sorted.map((ach) => {
          const isUnclaimed = ach.unlocked && !ach.claimed;
          const isClaimed = ach.claimed;
          const isHighlighted = highlightId === ach.id;

          return (
            <div
              key={ach.id}
              className={`flex items-center justify-between text-xs p-2 rounded transition-all ${
                isHighlighted
                  ? 'bg-amber-500/50 border border-amber-400 scale-[1.02]'
                  : isClaimed
                    ? 'bg-green-900/30 text-gray-400'
                    : isUnclaimed
                      ? 'bg-amber-900/40 border border-amber-600/50'
                      : 'bg-slate-700/30 text-gray-500'
              }`}
            >
              <div className="flex-1 min-w-0 mr-2">
                <span className={`font-bold ${
                  isUnclaimed ? 'text-amber-300' : isClaimed ? 'text-green-400' : 'text-gray-500'
                }`}>
                  {isClaimed ? '✓ ' : isUnclaimed ? '★ ' : '☆ '}
                  {ach.name}
                </span>
                <p className="text-gray-400 text-xs truncate opacity-70">
                  {ach.desc}
                </p>
              </div>
              {isUnclaimed && ach.reward > 0 && !claimingAll ? (
                <button
                  onClick={() => onClaimAchievement(ach.id)}
                  className="bg-amber-600 hover:bg-amber-500 text-white px-2 py-1 rounded text-xs font-bold whitespace-nowrap transition-colors"
                >
                  +{ach.reward}
                </button>
              ) : ach.reward > 0 ? (
                <span className={`text-xs whitespace-nowrap ${isClaimed ? 'text-green-500' : 'text-gray-600'}`}>
                  {isClaimed ? `✓ +${ach.reward}` : `+${ach.reward}`}
                </span>
              ) : null}
            </div>
          );
        })}
      </div>
      <p className="text-xs text-gray-500 mt-2 text-center">
        {achievements.size}/{Object.keys(ACHIEVEMENTS).length} unlocked
      </p>
    </div>
  );
}
```

**Step 3: Verify build**

Run: `npm run build`
Expected: Build succeeds

**Step 4: Commit**

```bash
git add src/game/engine/achievementClaim.ts src/components/AchievementsPanel.tsx
git commit -m "feat: add Claim All button with animated cascade"
```

---

## Task 7: Final Testing & Polish

**Files:** None (testing only)

**Step 1: Run full build**

Run: `npm run build`
Expected: Build succeeds with no errors

**Step 2: Run lint**

Run: `npm run lint`
Expected: No new lint errors

**Step 3: Manual testing checklist**

Run: `npm run dev`

Test the following:
- [ ] Desktop: Canvas displays correctly, all UI visible
- [ ] Resize browser to narrow width: Canvas scales, UI adjusts
- [ ] Browser zoom in/out: Canvas maintains aspect ratio
- [ ] Click hamburger icon (top-left): Slide-out menu opens
- [ ] Menu contains: Quick stats, Leaderboard, Stats, Settings
- [ ] Click outside menu: Menu closes
- [ ] Sound/Haptics toggles work in menu
- [ ] Landing after throw: Grade popup shows with new style (big letter + phrase)
- [ ] Grade A: Orange color, celebratory
- [ ] Grade B: Blue color
- [ ] Grade C/D: Muted colors
- [ ] Stats overlay: Claim All button visible in Achievements header
- [ ] Click Claim All: Animated cascade, counter increases
- [ ] All achievements claimed: Button disappears

**Step 4: Test on mobile viewport (DevTools)**

- [ ] Portrait: Canvas centered, UI below
- [ ] Landscape: Canvas full height, external UI hidden
- [ ] Hamburger menu accessible in landscape

**Step 5: Create final commit**

```bash
git add -A
git commit -m "chore: HUD/UI strategy implementation complete"
```

---

## Summary

This plan implements:
1. **Canvas-Centric responsive layout** - Canvas maximizes viewport, especially in landscape
2. **Hamburger menu** - Top-left corner, slide-out panel from left
3. **SlideOutMenu component** - Contains stats, navigation, settings
4. **Ring-style landing grades** - Big letter + phrase, pop animation, performance colors
5. **Claim All button** - Animated cascade in AchievementsPanel header

Total estimated changes:
- 2 new files (SlideOutMenu.tsx, CSS updates)
- 6 modified files
- ~400 lines of new code
