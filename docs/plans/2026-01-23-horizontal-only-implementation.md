# Horizontal-Only View Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Convert One-More-Flick from dual portrait/landscape to horizontal-only, with rotate prompt for mobile portrait visitors.

**Architecture:** Remove all portrait CSS/logic, add RotateScreen component for portrait detection, implement contain-fit canvas sizing, and refactor on-canvas HUD elements.

**Tech Stack:** React, TypeScript, CSS (viewport units), Canvas 2D

---

## Task 1: Revert Broken CSS Changes

**Files:**
- Modify: `src/index.css`
- Modify: `src/components/Game.tsx`

**Step 1: Discard uncommitted changes**

```bash
git checkout src/index.css src/components/Game.tsx
```

**Step 2: Verify clean state**

```bash
git status
```

Expected: Both files show as unmodified

**Step 3: Commit baseline**

```bash
git add -A && git commit -m "chore: revert broken CSS experiments" --allow-empty
```

---

## Task 2: Create RotateScreen Component

**Files:**
- Create: `src/components/RotateScreen.tsx`

**Step 1: Create the component file**

```tsx
// src/components/RotateScreen.tsx
import { useEffect, useState } from 'react';
import { assetPath } from '@/lib/assetPath';

const ZENO_FRAMES = [
  assetPath('/assets/sprites/zenoflip/zenotwist1.png'),
  assetPath('/assets/sprites/zenoflip/zenotwist2.png'),
  assetPath('/assets/sprites/zenoflip/zenotwist3.png'),
  assetPath('/assets/sprites/zenoflip/zenotwist4.png'),
];

export function RotateScreen() {
  const [frame, setFrame] = useState(0);

  // Animate Zeno spin
  useEffect(() => {
    const interval = setInterval(() => {
      setFrame((f) => (f + 1) % 4);
    }, 150);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        backgroundColor: '#f5f0e1',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '24px',
        fontFamily: '"Comic Sans MS", cursive, sans-serif',
      }}
    >
      {/* Spinning Zeno */}
      <img
        src={ZENO_FRAMES[frame]}
        alt="Zeno spinning"
        style={{
          width: '120px',
          height: '120px',
          objectFit: 'contain',
        }}
      />

      {/* Animated phone icon */}
      <div
        style={{
          fontSize: '48px',
          animation: 'rotatePhone 1.5s ease-in-out infinite',
        }}
      >
        📱
      </div>

      {/* Text prompt */}
      <p
        style={{
          color: '#1e3a5f',
          fontSize: '18px',
          fontWeight: 'bold',
          textAlign: 'center',
          margin: 0,
        }}
      >
        Rotate for best experience!
      </p>

      {/* CSS animation */}
      <style>{`
        @keyframes rotatePhone {
          0%, 100% { transform: rotate(0deg); }
          50% { transform: rotate(90deg); }
        }
      `}</style>
    </div>
  );
}
```

**Step 2: Verify file created**

```bash
ls -la src/components/RotateScreen.tsx
```

**Step 3: Commit**

```bash
git add src/components/RotateScreen.tsx
git commit -m "feat: add RotateScreen component for portrait visitors"
```

---

## Task 3: Add Portrait Detection Hook

**Files:**
- Create: `src/hooks/useIsPortrait.ts`

**Step 1: Create the hook**

```tsx
// src/hooks/useIsPortrait.ts
import { useEffect, useState } from 'react';

export function useIsPortrait(): boolean {
  const [isPortrait, setIsPortrait] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.innerHeight > window.innerWidth;
  });

  useEffect(() => {
    const checkOrientation = () => {
      setIsPortrait(window.innerHeight > window.innerWidth);
    };

    window.addEventListener('resize', checkOrientation);
    window.addEventListener('orientationchange', checkOrientation);

    return () => {
      window.removeEventListener('resize', checkOrientation);
      window.removeEventListener('orientationchange', checkOrientation);
    };
  }, []);

  return isPortrait;
}
```

**Step 2: Commit**

```bash
git add src/hooks/useIsPortrait.ts
git commit -m "feat: add useIsPortrait hook for orientation detection"
```

---

## Task 4: Integrate RotateScreen in Game.tsx

**Files:**
- Modify: `src/components/Game.tsx`

**Step 1: Add imports at top of Game.tsx**

Find line with other imports and add:

```tsx
import { RotateScreen } from './RotateScreen';
import { useIsPortrait } from '@/hooks/useIsPortrait';
```

**Step 2: Add hook call inside Game component**

After the existing hooks (around line 192), add:

```tsx
const isPortrait = useIsPortrait();
```

**Step 3: Add RotateScreen render**

At the very start of the return statement (before the outer div), add:

```tsx
// Show rotate screen for mobile portrait
if (isPortrait && isMobileRef.current) {
  return <RotateScreen />;
}
```

**Step 4: Verify it compiles**

```bash
npm run build 2>&1 | head -20
```

**Step 5: Commit**

```bash
git add src/components/Game.tsx
git commit -m "feat: show RotateScreen for mobile portrait visitors"
```

---

## Task 5: Simplify CSS to Contain-Fit Logic

**Files:**
- Modify: `src/index.css`

**Step 1: Replace game-canvas rules**

Find the `.game-canvas` section (around line 101-133) and replace with:

```css
/* Game canvas - contain-fit sizing for horizontal-only view */
.game-canvas {
  /* Contain-fit: fill available space while maintaining 2:1 aspect ratio */
  width: 100%;
  height: 100%;
  max-width: min(95vw, calc(95vh * 2));
  max-height: min(95vh, calc(95vw / 2));
  aspect-ratio: 2 / 1;

  /* Center in container */
  margin: auto;

  /* Canvas properties */
  cursor: pointer;
  touch-action: none;
  user-select: none;
  -webkit-user-select: none;
  -webkit-font-smoothing: none;
  -moz-osx-font-smoothing: unset;
}
```

**Step 2: Remove portrait-specific media queries**

Delete the following sections:
- `@media (max-width: 680px)` rule for `.game-canvas`
- `@media (max-width: 420px)` rule for `.game-canvas`

Keep the landscape media query but simplify:

```css
/* Landscape mode - full viewport */
@media (orientation: landscape) {
  .game-canvas {
    max-width: min(98vw, calc(98vh * 2));
    max-height: min(98vh, calc(98vw / 2));
  }

  /* Hide external UI in landscape */
  .external-ui {
    display: none !important;
  }

  body {
    padding: 0;
    margin: 0;
  }
}
```

**Step 3: Verify build**

```bash
npm run build 2>&1 | head -20
```

**Step 4: Commit**

```bash
git add src/index.css
git commit -m "feat: simplify CSS to contain-fit horizontal-only layout"
```

---

## Task 6: Update Game.tsx Canvas Container

**Files:**
- Modify: `src/components/Game.tsx`

**Step 1: Simplify outer container**

Find the main return div (around line 1000) and change:

```tsx
<div
  className="w-full h-[100svh] flex items-center justify-center"
  style={{ background: `linear-gradient(180deg, ${theme.background} 0%, ${theme.horizon} 100%)` }}
>
```

**Step 2: Remove inline canvas styles that conflict with CSS**

Find the canvas element (around line 1066) and simplify the style prop:

```tsx
style={{
  boxShadow: themeId === 'noir'
    ? '0 2px 8px rgba(0,0,0,0.4)'
    : '2px 3px 8px rgba(0,0,0,0.15), inset 0 0 0 1px rgba(0,0,0,0.05)',
  border: themeId === 'noir'
    ? `1.5px solid ${theme.accent3}`
    : `2.5px solid ${theme.accent3}`,
  borderRadius: themeId === 'noir' ? '1px' : '3px',
  imageRendering: 'auto',
  pointerEvents: 'none',
}}
```

(Remove width, maxWidth, aspectRatio - let CSS handle it)

**Step 3: Test locally**

```bash
npm run dev
```

Open browser, resize window, verify canvas scales correctly.

**Step 4: Commit**

```bash
git add src/components/Game.tsx
git commit -m "feat: update Game.tsx for contain-fit canvas sizing"
```

---

## Task 7: Remove TAP Box from Render

**Files:**
- Modify: `src/game/engine/render.ts`

**Step 1: Find and remove TAP nudge indicator**

Find the section around line 1058-1076 that renders the "TAP" box:

```tsx
// Nudge indicator (mid-air boost available)
if (state.flying && !state.nudgeUsed) {
  const nudgeX = 50;
  const nudgeY = H - 35;
  // ... rest of TAP box code
}
```

Delete the entire block (approximately lines 1058-1076).

**Step 2: Verify build**

```bash
npm run build 2>&1 | head -20
```

**Step 3: Commit**

```bash
git add src/game/engine/render.ts
git commit -m "fix: remove TAP box indicator (no longer needed)"
```

---

## Task 8: Redesign Hamburger as Circle Badge

**Files:**
- Modify: `src/game/engine/render.ts`

**Step 1: Find hamburger rendering code**

Around line 670-693, replace the hamburger rendering with:

```tsx
// Hamburger menu icon - circle badge with drop shadow
// Always show in horizontal-only mode (no landscape check needed)
if (!state.flying && !state.sliding) {
  const menuX = 18;
  const menuY = 18;
  const radius = 14;

  ctx.save();

  // Drop shadow
  ctx.beginPath();
  ctx.arc(menuX + 2, menuY + 2, radius, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
  ctx.fill();

  // Circle background
  ctx.beginPath();
  ctx.arc(menuX, menuY, radius, 0, Math.PI * 2);
  ctx.fillStyle = state.menuOpen ? theme.highlight : theme.uiBg;
  ctx.fill();
  ctx.strokeStyle = theme.accent3;
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Three horizontal lines (hamburger)
  ctx.fillStyle = state.menuOpen ? theme.background : theme.accent3;
  const lineWidth = 12;
  const lineHeight = 2;
  const gap = 4;
  const startX = menuX - lineWidth / 2;
  const startY = menuY - gap - lineHeight / 2;

  for (let i = 0; i < 3; i++) {
    ctx.fillRect(startX, startY + i * gap, lineWidth, lineHeight);
  }

  ctx.restore();
}
```

**Step 2: Verify build**

```bash
npm run build 2>&1 | head -20
```

**Step 3: Commit**

```bash
git add src/game/engine/render.ts
git commit -m "feat: redesign hamburger as circle badge with drop shadow"
```

---

## Task 9: Remove Wind Box, Use Flag for Wind

**Files:**
- Modify: `src/game/engine/render.ts`
- Modify: `src/game/engine/backgroundRenderer.ts`

**Step 1: Remove wind box rendering in render.ts**

Find the wind box rendering section (around line 785-850) in `renderFlipbookFrame` and delete the entire wind box section (the box with "WIND" label, arrow, and strength meter).

Keep the flag rendering but ensure it uses wind data for animation speed.

**Step 2: Update backgroundRenderer.ts flag animation**

In `backgroundRenderer.ts`, modify the `updateFlagAnimation` method (around line 123) to vary animation speed more dramatically based on wind:

```tsx
private updateFlagAnimation(deltaMs: number, wind: number): void {
  // Wind strength affects flag wave speed (1-5 levels)
  // Stronger wind = faster flapping
  const windStrength = Math.abs(wind);
  const baseInterval = 200; // Calm wind
  const minInterval = 50;   // Strong wind
  const interval = Math.max(minInterval, baseInterval - windStrength * 300);

  this.state.flagFrameTimer += deltaMs;
  if (this.state.flagFrameTimer >= interval) {
    this.state.flagFrameTimer = 0;
    this.state.flagFrame = (this.state.flagFrame + 1) % 4;
  }
}
```

**Step 3: Also remove wind box from noir render**

Find similar wind box code in the noir rendering section and remove it.

**Step 4: Verify build**

```bash
npm run build 2>&1 | head -20
```

**Step 5: Commit**

```bash
git add src/game/engine/render.ts src/game/engine/backgroundRenderer.ts
git commit -m "feat: remove wind box, flag animation indicates wind strength"
```

---

## Task 10: Lower Void Position

**Files:**
- Modify: `src/game/engine/backgroundRenderer.ts`

**Step 1: Find void rendering position**

Look for where void layers are drawn and adjust Y position by ~25%.

Find the void rendering section and add offset:

```tsx
// Void offset - moved 25% lower for better ground visibility
const VOID_Y_OFFSET = H * 0.25; // Move void down by 25% of canvas height
```

Apply this offset when drawing void layers.

**Step 2: Verify build and test visually**

```bash
npm run dev
```

Check that void appears lower, more ground visible.

**Step 3: Commit**

```bash
git add src/game/engine/backgroundRenderer.ts
git commit -m "fix: lower void position by 25% for better ground visibility"
```

---

## Task 11: Fix Mini-Goal Notification Position

**Files:**
- Modify: `src/components/MiniGoalHUD.tsx` (or wherever mini-goal is rendered)

**Step 1: Find mini-goal positioning**

Add left padding to prevent overlap with hamburger:

```tsx
// Position with left padding to avoid hamburger (40px safe zone)
style={{
  left: '50%',
  transform: 'translateX(-50%)',
  // ... other styles
}}
```

**Step 2: Commit**

```bash
git add src/components/MiniGoalHUD.tsx
git commit -m "fix: center mini-goal notifications, avoid hamburger overlap"
```

---

## Task 12: Fix PB Notification Position

**Files:**
- Find file that renders PB notification and adjust position

**Step 1: Find PB notification rendering**

Search for "PB" or "Personal Best" notification and adjust its position to not overlap with hamburger.

**Step 2: Commit**

```bash
git add [file]
git commit -m "fix: offset PB notification to avoid hamburger overlap"
```

---

## Task 13: Add High Score / Last Score to Canvas HUD

**Files:**
- Modify: `src/game/engine/render.ts`

**Step 1: Add score display in top-right**

In the render function, add after hamburger but before game elements:

```tsx
// High Score & Last Score display (top-right)
ctx.save();
ctx.font = '10px "Comic Sans MS", cursive';
ctx.textAlign = 'right';
ctx.fillStyle = theme.accent3;

// High score
ctx.fillText('HIGH', W - 8, 12);
ctx.font = 'bold 12px monospace';
ctx.fillStyle = theme.highlight;
ctx.fillText(state.bestScore.toFixed(3), W - 8, 24);

// Last score
ctx.font = '10px "Comic Sans MS", cursive';
ctx.fillStyle = theme.accent3;
ctx.fillText('LAST', W - 8, 38);
ctx.font = 'bold 11px monospace';
ctx.fillStyle = theme.accent1;
ctx.fillText(state.lastDistance?.toFixed(3) ?? '-', W - 8, 50);

ctx.restore();
```

**Step 2: Ensure state has bestScore and lastDistance**

Verify these exist in GameState or pass them appropriately.

**Step 3: Commit**

```bash
git add src/game/engine/render.ts
git commit -m "feat: add High Score and Last Score to canvas HUD"
```

---

## Task 14: Update Click Detection for New Hamburger Position

**Files:**
- Modify: `src/components/Game.tsx`

**Step 1: Update hamburger hit area**

Find the click detection code (around line 770) and update for circle badge:

```tsx
// Hamburger hit area: circle at (18, 18) with radius 14
const hamburgerX = 18;
const hamburgerY = 18;
const hamburgerRadius = 20; // Slightly larger for touch
const dx = canvasX - hamburgerX;
const dy = canvasY - hamburgerY;
if (dx * dx + dy * dy < hamburgerRadius * hamburgerRadius) {
  setMenuOpen(true);
  return;
}
```

**Step 2: Commit**

```bash
git add src/components/Game.tsx
git commit -m "fix: update hamburger click detection for circle badge"
```

---

## Task 15: Clean Up Unused Portrait Code

**Files:**
- Modify: `src/index.css`
- Modify: `src/components/Game.tsx`

**Step 1: Remove landscape utility classes**

In CSS, remove unused `landscape:*` utility classes if no longer needed.

**Step 2: Remove isLandscape checks in render.ts**

The hamburger no longer needs landscape detection - it's always visible.

**Step 3: Final cleanup and test**

```bash
npm run build
npm run dev
```

Test on:
- Desktop browser (various window sizes)
- Mobile landscape
- Mobile portrait (should show RotateScreen)

**Step 4: Commit**

```bash
git add -A
git commit -m "chore: clean up unused portrait layout code"
```

---

## Task 16: Final Testing & Polish

**Step 1: Test all scenarios**

| Scenario | Expected |
|----------|----------|
| Desktop wide window | Canvas fills width, centered |
| Desktop tall window | Canvas fills height, centered |
| Mobile landscape | Full-screen canvas, hamburger visible |
| Mobile portrait | RotateScreen with spinning Zeno |
| Browser zoom 50-200% | Canvas scales correctly |

**Step 2: Fix any issues found**

**Step 3: Final commit**

```bash
git add -A
git commit -m "feat: horizontal-only view complete"
```

---

## Summary

| Task | Description |
|------|-------------|
| 1 | Revert broken CSS changes |
| 2 | Create RotateScreen component |
| 3 | Add useIsPortrait hook |
| 4 | Integrate RotateScreen in Game.tsx |
| 5 | Simplify CSS to contain-fit |
| 6 | Update Game.tsx canvas container |
| 7 | Remove TAP box |
| 8 | Redesign hamburger as circle badge |
| 9 | Remove wind box, use flag |
| 10 | Lower void position |
| 11 | Fix mini-goal position |
| 12 | Fix PB notification position |
| 13 | Add High/Last score to canvas |
| 14 | Update hamburger click detection |
| 15 | Clean up unused code |
| 16 | Final testing |
