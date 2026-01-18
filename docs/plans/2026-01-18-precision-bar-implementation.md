# Precision Bar Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement a visual precision bar that shows real-time progress in the 419-420 competitive zone with PB comparison, dynamic decimals, and progressive slow-motion.

**Architecture:** The precision bar is a UI overlay that activates when Zeno approaches the competitive zone (px >= 418.9, py < 5). It integrates with existing slow-mo and achievement systems, using achievement-gating to prevent new players from seeing it until they unlock "Bullet Time".

**Tech Stack:** TypeScript, Canvas 2D API, WebAudio API, existing game engine patterns

---

## Task 1: Add State Properties

**Files:**
- Modify: `src/game/engine/types.ts:50-131`
- Modify: `src/game/engine/state.ts:39-109`
- Modify: `src/game/engine/state.ts:111-153`

**Step 1: Add precision bar state to GameState interface**

In `src/game/engine/types.ts`, add after line 130 (before the closing brace):

```typescript
  // Precision bar system (419-420 zone)
  precisionBarActive: boolean;
  lastValidPx: number;
  precisionTimeScale: number;
  precisionBarTriggeredThisThrow: boolean;
  passedPbThisThrow: boolean;
```

**Step 2: Initialize precision bar state in createInitialState**

In `src/game/engine/state.ts`, add to the return object (after line 107, before `};`):

```typescript
    // Precision bar
    precisionBarActive: false,
    lastValidPx: 0,
    precisionTimeScale: 1,
    precisionBarTriggeredThisThrow: false,
    passedPbThisThrow: false,
```

**Step 3: Reset precision bar state in resetPhysics**

In `src/game/engine/state.ts`, add after line 149 (before `if (state.particleSystem)`):

```typescript
  // Precision bar reset
  state.precisionBarActive = false;
  state.lastValidPx = 0;
  state.precisionTimeScale = 1;
  state.precisionBarTriggeredThisThrow = false;
  state.passedPbThisThrow = false;
```

**Step 4: Verify types compile**

Run: `npm run build`
Expected: No TypeScript errors

**Step 5: Commit**

```bash
git add src/game/engine/types.ts src/game/engine/state.ts
git commit -m "feat(precision-bar): add state properties for precision bar system"
```

---

## Task 2: Create Precision Bar Logic Module

**Files:**
- Create: `src/game/engine/precisionBar.ts`
- Create: `src/game/engine/__tests__/precisionBar.test.ts`

**Step 1: Write failing tests for precision bar logic**

Create `src/game/engine/__tests__/precisionBar.test.ts`:

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import {
  shouldActivatePrecisionBar,
  calculatePrecisionProgress,
  calculatePrecisionTimeScale,
  getDynamicDecimalPrecision,
  getPbMarkerPosition,
} from '../precisionBar';
import type { GameState } from '../types';

// Minimal mock state
function createMockState(overrides: Partial<GameState> = {}): GameState {
  return {
    px: 0,
    py: 0,
    best: 0,
    achievements: new Set<string>(),
    ...overrides,
  } as GameState;
}

describe('precisionBar', () => {
  describe('shouldActivatePrecisionBar', () => {
    it('returns false when px < 418.9', () => {
      const state = createMockState({ px: 418, py: 2, achievements: new Set(['bullet_time']) });
      expect(shouldActivatePrecisionBar(state)).toBe(false);
    });

    it('returns false when py >= 5', () => {
      const state = createMockState({ px: 419, py: 10, achievements: new Set(['bullet_time']) });
      expect(shouldActivatePrecisionBar(state)).toBe(false);
    });

    it('returns false without bullet_time achievement', () => {
      const state = createMockState({ px: 419, py: 2, achievements: new Set() });
      expect(shouldActivatePrecisionBar(state)).toBe(false);
    });

    it('returns true when all conditions met', () => {
      const state = createMockState({ px: 419, py: 2, achievements: new Set(['bullet_time']) });
      expect(shouldActivatePrecisionBar(state)).toBe(true);
    });

    it('returns true at exact threshold', () => {
      const state = createMockState({ px: 418.9, py: 4.9, achievements: new Set(['bullet_time']) });
      expect(shouldActivatePrecisionBar(state)).toBe(true);
    });
  });

  describe('calculatePrecisionProgress', () => {
    it('returns 0 at px=419', () => {
      expect(calculatePrecisionProgress(419)).toBe(0);
    });

    it('returns 0.5 at px=419.5', () => {
      expect(calculatePrecisionProgress(419.5)).toBe(0.5);
    });

    it('returns 1 at px=420', () => {
      expect(calculatePrecisionProgress(420)).toBe(1);
    });

    it('clamps below 419 to 0', () => {
      expect(calculatePrecisionProgress(418)).toBe(0);
    });

    it('clamps above 420 to 1', () => {
      expect(calculatePrecisionProgress(421)).toBe(1);
    });
  });

  describe('calculatePrecisionTimeScale', () => {
    it('returns 1.0 at px=419', () => {
      expect(calculatePrecisionTimeScale(419)).toBeCloseTo(1.0);
    });

    it('returns ~0.55 at px=419.5', () => {
      expect(calculatePrecisionTimeScale(419.5)).toBeCloseTo(0.55, 1);
    });

    it('returns ~0.1 at px=420', () => {
      expect(calculatePrecisionTimeScale(420)).toBeCloseTo(0.1, 1);
    });
  });

  describe('getDynamicDecimalPrecision', () => {
    it('returns 1 decimal for 419.0-419.89', () => {
      expect(getDynamicDecimalPrecision(419.5)).toBe(1);
      expect(getDynamicDecimalPrecision(419.89)).toBe(1);
    });

    it('returns 2 decimals for 419.9-419.989', () => {
      expect(getDynamicDecimalPrecision(419.9)).toBe(2);
      expect(getDynamicDecimalPrecision(419.95)).toBe(2);
    });

    it('returns 3 decimals for 419.99-419.9989', () => {
      expect(getDynamicDecimalPrecision(419.99)).toBe(3);
      expect(getDynamicDecimalPrecision(419.995)).toBe(3);
    });

    it('returns up to 8 decimals for extreme precision', () => {
      expect(getDynamicDecimalPrecision(419.9999999)).toBe(8);
    });
  });

  describe('getPbMarkerPosition', () => {
    it('returns 0 when no PB in range', () => {
      expect(getPbMarkerPosition(0, 60)).toBe(null);
      expect(getPbMarkerPosition(418, 60)).toBe(null);
    });

    it('returns correct position for PB at 419.5', () => {
      // 419.5 is 50% between 419 and 420
      expect(getPbMarkerPosition(419.5, 60)).toBe(30);
    });

    it('returns correct position for PB at 419.81', () => {
      // 419.81 is 81% between 419 and 420
      expect(getPbMarkerPosition(419.81, 60)).toBeCloseTo(48.6, 1);
    });

    it('clamps PB above 420', () => {
      expect(getPbMarkerPosition(420.5, 60)).toBe(60);
    });
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `npm test -- --run src/game/engine/__tests__/precisionBar.test.ts`
Expected: FAIL - module not found

**Step 3: Implement precision bar logic**

Create `src/game/engine/precisionBar.ts`:

```typescript
import { CLIFF_EDGE } from '@/game/constants';
import type { GameState } from './types';

// Precision bar trigger thresholds
const PRECISION_X_THRESHOLD = 418.9;  // 0.1 before competitive zone
const PRECISION_Y_THRESHOLD = 5;      // Near ground
const PRECISION_ZONE_START = 419;
const PRECISION_ZONE_END = CLIFF_EDGE; // 420

/**
 * Check if precision bar should be active.
 * Requires:
 * - px >= 418.9 (approaching competitive zone)
 * - py < 5 (near ground)
 * - bullet_time achievement unlocked
 */
export function shouldActivatePrecisionBar(state: GameState): boolean {
  const hasBulletTime = state.achievements.has('bullet_time');
  if (!hasBulletTime) return false;

  return state.px >= PRECISION_X_THRESHOLD && state.py < PRECISION_Y_THRESHOLD;
}

/**
 * Calculate progress through precision zone (0 to 1).
 * 0 = at 419, 1 = at 420
 */
export function calculatePrecisionProgress(px: number): number {
  if (px <= PRECISION_ZONE_START) return 0;
  if (px >= PRECISION_ZONE_END) return 1;
  return (px - PRECISION_ZONE_START) / (PRECISION_ZONE_END - PRECISION_ZONE_START);
}

/**
 * Calculate time scale for progressive slow-motion.
 * 1.0 at 419, 0.1 at 420 (linear interpolation)
 */
export function calculatePrecisionTimeScale(px: number): number {
  const progress = calculatePrecisionProgress(px);
  // Linear: 1.0 → 0.1 as progress goes 0 → 1
  return 1 - (progress * 0.9);
}

/**
 * Get number of decimal places to display based on position.
 * More decimals as we approach .9 thresholds.
 */
export function getDynamicDecimalPrecision(px: number): number {
  if (px < PRECISION_ZONE_START) return 1;

  // Check each threshold from highest precision down
  const decimal = px - Math.floor(px);

  if (decimal >= 0.9999999) return 8;
  if (decimal >= 0.999999) return 7;
  if (decimal >= 0.99999) return 6;
  if (decimal >= 0.9999) return 5;
  if (decimal >= 0.999) return 4;
  if (decimal >= 0.99) return 3;
  if (decimal >= 0.9) return 2;
  return 1;
}

/**
 * Format score with dynamic decimal precision.
 */
export function formatPrecisionScore(px: number): string {
  const decimals = getDynamicDecimalPrecision(px);
  return px.toFixed(decimals);
}

/**
 * Get PB marker position in pixels within bar.
 * Returns null if PB is not in precision zone.
 */
export function getPbMarkerPosition(bestScore: number, barWidth: number): number | null {
  if (bestScore < PRECISION_ZONE_START) return null;

  const progress = Math.min(1, (bestScore - PRECISION_ZONE_START) / (PRECISION_ZONE_END - PRECISION_ZONE_START));
  return progress * barWidth;
}

/**
 * Get bar fill color based on position (gold → white gradient).
 */
export function getPrecisionBarColor(px: number): string {
  const progress = calculatePrecisionProgress(px);

  if (progress < 0.5) {
    // Deep gold (#FFD700)
    return '#FFD700';
  } else if (progress < 0.9) {
    // Bright gold (#FFEC8B)
    return '#FFEC8B';
  } else if (progress < 0.99) {
    // White-gold (#FFFACD)
    return '#FFFACD';
  } else {
    // Glowing white
    return '#FFFFFF';
  }
}

/**
 * Check if current position has passed the personal best.
 */
export function hasPassedPb(px: number, best: number): boolean {
  return best >= PRECISION_ZONE_START && px > best;
}

/**
 * Get feedback message for fall.
 */
export function getFallMessage(lastValidPx: number, isFirstTimeInZone: boolean): string {
  if (isFirstTimeInZone) {
    return 'Welcome to the precision zone!';
  }
  if (lastValidPx >= 419.99) {
    return `${lastValidPx.toFixed(4)} - So close!`;
  }
  return `${lastValidPx.toFixed(2)} - Keep practicing!`;
}

/**
 * Get feedback message for successful landing.
 */
export function getSuccessMessage(px: number, best: number, isNewPb: boolean): string {
  if (isNewPb) {
    const improvement = px - best;
    return `NEW PERSONAL BEST! +${improvement.toFixed(4)}`;
  }

  const distFromPb = best - px;
  if (distFromPb < 0.01) {
    return `${px.toFixed(4)} - Just ${distFromPb.toFixed(4)} away!`;
  }

  return `${px.toFixed(2)} - Solid throw!`;
}
```

**Step 4: Run tests to verify they pass**

Run: `npm test -- --run src/game/engine/__tests__/precisionBar.test.ts`
Expected: All tests PASS

**Step 5: Commit**

```bash
git add src/game/engine/precisionBar.ts src/game/engine/__tests__/precisionBar.test.ts
git commit -m "feat(precision-bar): add precision bar logic module with tests"
```

---

## Task 3: Create Precision Bar Render Module

**Files:**
- Create: `src/game/engine/precisionRender.ts`

**Step 1: Create precision bar render module**

Create `src/game/engine/precisionRender.ts`:

```typescript
import type { Theme } from '@/game/themes';
import type { GameState } from './types';
import {
  calculatePrecisionProgress,
  formatPrecisionScore,
  getPbMarkerPosition,
  getPrecisionBarColor,
  hasPassedPb,
} from './precisionBar';

// Bar dimensions (fixed)
const BAR_WIDTH = 60;
const BAR_HEIGHT = 8;
const BAR_GAP_FROM_STAMINA = 4;

/**
 * Draw precision bar above Zeno (above stamina bar if visible).
 */
export function drawPrecisionBar(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  zenoX: number,
  zenoY: number,
  theme: Theme,
  nowMs: number
): void {
  if (!state.precisionBarActive) return;

  const staminaVisible = state.stamina < 100;
  // Position above stamina bar if visible, otherwise directly above Zeno
  const baseY = zenoY - (staminaVisible ? 25 + 6 + BAR_GAP_FROM_STAMINA : 25);

  const barX = zenoX - BAR_WIDTH / 2;
  const barY = baseY - BAR_HEIGHT - BAR_GAP_FROM_STAMINA;

  // Progress through precision zone
  const progress = calculatePrecisionProgress(state.px);
  const fillWidth = progress * BAR_WIDTH;

  // Background (dark)
  ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
  ctx.fillRect(barX, barY, BAR_WIDTH, BAR_HEIGHT);

  // Fill with gradient color
  const fillColor = getPrecisionBarColor(state.px);
  ctx.fillStyle = fillColor;
  ctx.fillRect(barX, barY, fillWidth, BAR_HEIGHT);

  // Pulse effect for very high precision (419.99+)
  if (progress > 0.99) {
    const pulse = Math.sin(nowMs / 100) * 0.3 + 0.7;
    ctx.fillStyle = `rgba(255, 255, 255, ${pulse * 0.5})`;
    ctx.fillRect(barX, barY, fillWidth, BAR_HEIGHT);
  }

  // PB marker (white vertical line, 1px)
  const pbPosition = getPbMarkerPosition(state.best, BAR_WIDTH);
  if (pbPosition !== null) {
    const pbPassed = hasPassedPb(state.px, state.best);
    ctx.strokeStyle = pbPassed ? '#888888' : '#FFFFFF';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(barX + pbPosition, barY);
    ctx.lineTo(barX + pbPosition, barY + BAR_HEIGHT);
    ctx.stroke();

    // Flash effect when passing PB
    if (pbPassed && !state.passedPbThisThrow) {
      const flash = Math.sin(nowMs / 50) * 0.5 + 0.5;
      ctx.fillStyle = `rgba(255, 215, 0, ${flash * 0.8})`;
      ctx.fillRect(barX, barY - 2, BAR_WIDTH, BAR_HEIGHT + 4);
    }
  }

  // Border
  ctx.strokeStyle = theme.accent3;
  ctx.lineWidth = 1;
  ctx.strokeRect(barX, barY, BAR_WIDTH, BAR_HEIGHT);

  // Score display (inside bar, right-aligned, premium feel)
  const scoreText = formatPrecisionScore(state.px);
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 7px monospace';
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';

  // Text shadow for readability
  ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
  ctx.shadowBlur = 2;
  ctx.fillText(scoreText, barX + BAR_WIDTH - 2, barY + BAR_HEIGHT / 2);
  ctx.shadowBlur = 0;

  // "NEW!" indicator when passing PB
  if (hasPassedPb(state.px, state.best) && state.best >= 419) {
    const blink = Math.floor(nowMs / 200) % 2;
    if (blink) {
      ctx.fillStyle = '#FFD700';
      ctx.font = 'bold 6px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('NEW!', barX + 2, barY - 3);
    }
  }
}

/**
 * Draw "Almost!" overlay when falling off in precision zone.
 */
export function drawPrecisionFallOverlay(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  W: number,
  H: number,
  theme: Theme,
  nowMs: number
): void {
  if (!state.fellOff || state.lastValidPx < 419) return;

  const centerX = W / 2;
  const centerY = H / 2 - 20;

  // Background overlay
  ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
  ctx.fillRect(0, 0, W, H);

  // "ALMOST!" text
  const bounce = Math.sin(nowMs / 150) * 3;
  ctx.fillStyle = theme.highlight;
  ctx.font = 'bold 20px "Comic Sans MS", cursive, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('ALMOST!', centerX, centerY - 20 + bounce);

  // Mini precision bar showing final position
  const barWidth = 80;
  const barHeight = 10;
  const barX = centerX - barWidth / 2;
  const barY = centerY;

  // Background
  ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
  ctx.fillRect(barX, barY, barWidth, barHeight);

  // Fill to last valid position
  const progress = Math.min(1, (state.lastValidPx - 419) / 1);
  const fillWidth = progress * barWidth;
  ctx.fillStyle = getPrecisionBarColor(state.lastValidPx);
  ctx.fillRect(barX, barY, fillWidth, barHeight);

  // PB marker if in range
  const pbPos = getPbMarkerPosition(state.best, barWidth);
  if (pbPos !== null) {
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(barX + pbPos, barY);
    ctx.lineTo(barX + pbPos, barY + barHeight);
    ctx.stroke();
  }

  // Border
  ctx.strokeStyle = theme.accent3;
  ctx.lineWidth = 1;
  ctx.strokeRect(barX, barY, barWidth, barHeight);

  // Score text
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 10px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(state.lastValidPx.toFixed(4), centerX, barY + barHeight + 15);

  // Contextual message
  let message = '';
  if (state.lastValidPx >= 419.99) {
    message = 'So close!';
  } else {
    message = 'Keep practicing!';
  }
  ctx.fillStyle = theme.accent3;
  ctx.font = '10px sans-serif';
  ctx.fillText(message, centerX, barY + barHeight + 30);
}

/**
 * Draw success overlay for new PB in precision zone.
 */
export function drawPrecisionSuccessOverlay(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  W: number,
  H: number,
  theme: Theme,
  nowMs: number,
  previousBest: number
): void {
  if (state.dist < 419 || state.fellOff) return;

  const isNewPb = state.dist > previousBest && previousBest >= 419;
  if (!isNewPb) return;

  const centerX = W / 2;
  const centerY = H / 2 - 20;

  // Golden glow background
  const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, 100);
  gradient.addColorStop(0, 'rgba(255, 215, 0, 0.3)');
  gradient.addColorStop(1, 'rgba(255, 215, 0, 0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, W, H);

  // Sparkle effect
  const sparkle = Math.sin(nowMs / 100) * 0.5 + 0.5;
  ctx.fillStyle = `rgba(255, 255, 255, ${sparkle * 0.8})`;
  ctx.font = '16px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('✨', centerX - 60, centerY - 15);
  ctx.fillText('✨', centerX + 60, centerY - 15);

  // "NEW PERSONAL BEST!" text
  const bounce = Math.sin(nowMs / 150) * 2;
  ctx.fillStyle = '#FFD700';
  ctx.font = 'bold 14px "Comic Sans MS", cursive, sans-serif';
  ctx.fillText('NEW PERSONAL BEST!', centerX, centerY - 10 + bounce);

  // Score
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 16px monospace';
  ctx.fillText(state.dist.toFixed(6), centerX, centerY + 15);

  // Improvement
  const improvement = state.dist - previousBest;
  ctx.fillStyle = '#22c55e';
  ctx.font = '10px sans-serif';
  ctx.fillText(`+${improvement.toFixed(6)}`, centerX, centerY + 30);
}
```

**Step 2: Verify module compiles**

Run: `npm run build`
Expected: No TypeScript errors

**Step 3: Commit**

```bash
git add src/game/engine/precisionRender.ts
git commit -m "feat(precision-bar): add precision bar rendering module"
```

---

## Task 4: Integrate Precision Bar into Update Loop

**Files:**
- Modify: `src/game/engine/update.ts:1-40`
- Modify: `src/game/engine/update.ts:118-130`
- Modify: `src/game/engine/update.ts:260-320`

**Step 1: Add imports for precision bar**

At the top of `src/game/engine/update.ts`, add after line 34:

```typescript
import {
  shouldActivatePrecisionBar,
  calculatePrecisionTimeScale,
  hasPassedPb,
} from './precisionBar';
```

**Step 2: Track lastValidPx and precision bar activation**

In `updateFrame`, after the existing flying physics block (around line 315, after `audio.slide?.();`), add:

```typescript
    // Track last valid position for precision bar
    if (state.px < CLIFF_EDGE) {
      state.lastValidPx = state.px;
    }
```

**Step 3: Add precision bar activation check**

After the flying/sliding physics and before the edge proximity slow-mo section (around line 390), add:

```typescript
  // Precision bar activation check
  if ((state.flying || state.sliding) && !state.landed) {
    const shouldActivate = shouldActivatePrecisionBar(state);

    if (shouldActivate && !state.precisionBarActive) {
      state.precisionBarActive = true;
      state.precisionBarTriggeredThisThrow = true;
    }

    // Apply precision time scale when active
    if (state.precisionBarActive && state.px >= 419) {
      state.precisionTimeScale = calculatePrecisionTimeScale(state.px);
    }

    // Track if we passed PB
    if (state.precisionBarActive && !state.passedPbThisThrow && hasPassedPb(state.px, state.best)) {
      state.passedPbThisThrow = true;
      // Flash effect and audio could be triggered here
    }
  }
```

**Step 4: Integrate precision timeScale with existing slow-mo**

Find the line where `effectiveTimeScale` is calculated (around line 219):

```typescript
const effectiveTimeScale = TIME_SCALE * (1 - state.slowMo);
```

Change it to:

```typescript
const precisionSlowdown = state.precisionBarActive ? state.precisionTimeScale : 1;
const effectiveTimeScale = TIME_SCALE * (1 - state.slowMo) * precisionSlowdown;
```

**Step 5: Verify build succeeds**

Run: `npm run build`
Expected: No TypeScript errors

**Step 6: Test in browser**

Run: `npm run dev`
Manual test: Play game, land beyond 400 to unlock bullet_time, then approach 419 zone

**Step 7: Commit**

```bash
git add src/game/engine/update.ts
git commit -m "feat(precision-bar): integrate precision bar into update loop"
```

---

## Task 5: Integrate Precision Bar into Render

**Files:**
- Modify: `src/game/engine/render.ts:1-30`
- Modify: `src/game/engine/render.ts:336-342`

**Step 1: Add imports for precision bar rendering**

At the top of `src/game/engine/render.ts`, add after the existing imports (around line 24):

```typescript
import { drawPrecisionBar, drawPrecisionFallOverlay } from './precisionRender';
```

**Step 2: Add precision bar to flipbook renderer**

In `renderFlipbookFrame`, after the stamina bar drawing (around line 340), add:

```typescript
  // Precision bar (above stamina bar when active)
  if (state.precisionBarActive || (state.fellOff && state.lastValidPx >= 419)) {
    drawPrecisionBar(ctx, state, zenoX, zenoY, COLORS, nowMs);
  }
```

**Step 3: Add precision bar to noir renderer**

In `renderNoirFrame`, after the stamina bar drawing (around line 762), add:

```typescript
  // Precision bar (above stamina bar when active)
  if (state.precisionBarActive || (state.fellOff && state.lastValidPx >= 419)) {
    drawPrecisionBar(ctx, state, state.px, zenoY, COLORS, nowMs);
  }
```

**Step 4: Add fall overlay rendering**

In `renderFlipbookFrame`, after the achievement popup section (around line 630), add:

```typescript
  // Precision zone fall overlay
  if (state.fellOff && state.lastValidPx >= 419 && state.precisionBarTriggeredThisThrow) {
    drawPrecisionFallOverlay(ctx, state, W, H, COLORS, nowMs);
  }
```

**Step 5: Verify build succeeds**

Run: `npm run build`
Expected: No TypeScript errors

**Step 6: Test visually**

Run: `npm run dev`
Manual test:
- Get bullet_time achievement (land beyond 400)
- Approach 419 zone, verify precision bar appears
- Fall off, verify "Almost!" overlay shows

**Step 7: Commit**

```bash
git add src/game/engine/render.ts
git commit -m "feat(precision-bar): integrate precision bar rendering"
```

---

## Task 6: Add Precision Audio Hooks

**Files:**
- Modify: `src/game/audioFiles.ts:8-25`
- Modify: `src/game/engine/update.ts:36-63`

**Step 1: Add precision audio file paths**

In `src/game/audioFiles.ts`, add to `AUDIO_FILES` object (after line 24):

```typescript
  // Precision bar sounds
  tensionDrone: assetPath('/assets/audio/precision/tension-drone.ogg'),
  pbDing: assetPath('/assets/audio/precision/pb-ding.ogg'),
  newRecord: assetPath('/assets/audio/precision/new-record.ogg'),
  closeCall: assetPath('/assets/audio/precision/close-call.ogg'),
```

**Step 2: Add precision audio to GameAudio type**

In `src/game/engine/update.ts`, add to `GameAudio` type (around line 62):

```typescript
  // Precision bar sounds
  precisionDrone?: () => void;
  stopPrecisionDrone?: () => void;
  pbDing?: () => void;
  newRecordJingle?: () => void;
  closeCall?: () => void;
```

**Step 3: Add audio triggers in update loop**

In the precision bar activation section (Task 4 Step 3), enhance with audio:

```typescript
  // Precision bar activation check
  if ((state.flying || state.sliding) && !state.landed) {
    const shouldActivate = shouldActivatePrecisionBar(state);

    if (shouldActivate && !state.precisionBarActive) {
      state.precisionBarActive = true;
      state.precisionBarTriggeredThisThrow = true;
      audio.precisionDrone?.(); // Start tension drone
    }

    // Apply precision time scale when active
    if (state.precisionBarActive && state.px >= 419) {
      state.precisionTimeScale = calculatePrecisionTimeScale(state.px);
    }

    // Track if we passed PB
    if (state.precisionBarActive && !state.passedPbThisThrow && hasPassedPb(state.px, state.best)) {
      state.passedPbThisThrow = true;
      audio.pbDing?.(); // Play PB ding
    }
  } else if (!state.flying && !state.sliding && state.precisionBarActive) {
    // Deactivate when not flying/sliding
    state.precisionBarActive = false;
    audio.stopPrecisionDrone?.();
  }
```

**Step 4: Verify build succeeds**

Run: `npm run build`
Expected: No TypeScript errors

**Step 5: Commit**

```bash
git add src/game/audioFiles.ts src/game/engine/update.ts
git commit -m "feat(precision-bar): add precision audio hooks"
```

---

## Task 7: Add Audio File Implementations

**Files:**
- Modify: `src/game/audioFiles.ts:340-430`

**Step 1: Add precision drone sound functions**

At the end of `src/game/audioFiles.ts`, add:

```typescript
// ============================================
// PRECISION BAR SOUNDS (file-based)
// ============================================

let precisionDroneSource: AudioBufferSourceNode | null = null;
let precisionDroneGainNode: GainNode | null = null;

/**
 * Start precision tension drone (loops while in precision zone)
 */
export function startPrecisionDroneFile(refs: AudioRefsLike, settings: AudioSettingsLike): void {
  stopPrecisionDroneFile();

  const buffer = audioBuffers.get('tensionDrone');
  if (!buffer || settings.muted || settings.volume <= 0) return;

  try {
    const ctx = getContext(refs);
    precisionDroneSource = ctx.createBufferSource();
    precisionDroneSource.buffer = buffer;
    precisionDroneSource.loop = true;

    precisionDroneGainNode = ctx.createGain();
    precisionDroneGainNode.gain.value = 0.3 * settings.volume;

    precisionDroneSource.connect(precisionDroneGainNode);
    precisionDroneGainNode.connect(ctx.destination);
    precisionDroneSource.start(0);

    precisionDroneSource.onended = () => {
      precisionDroneSource = null;
      precisionDroneGainNode = null;
    };
  } catch (err) {
    console.warn('[AudioFiles] Error starting precision drone:', err);
  }
}

/**
 * Stop precision tension drone
 */
export function stopPrecisionDroneFile(): void {
  if (precisionDroneSource) {
    try {
      precisionDroneSource.stop();
    } catch {
      // Already stopped
    }
    precisionDroneSource = null;
  }
  precisionDroneGainNode = null;
}

/**
 * Play PB ding sound
 */
export function playPbDingFile(refs: AudioRefsLike, settings: AudioSettingsLike): void {
  const buffer = audioBuffers.get('pbDing');
  if (buffer) {
    playBuffer(refs, settings, buffer, 0.6);
  }
}

/**
 * Play new record jingle
 */
export function playNewRecordFile(refs: AudioRefsLike, settings: AudioSettingsLike): void {
  const buffer = audioBuffers.get('newRecord');
  if (buffer) {
    playBuffer(refs, settings, buffer, 0.7);
  }
}

/**
 * Play close call sound (survived 419.99+)
 */
export function playCloseCallFile(refs: AudioRefsLike, settings: AudioSettingsLike): void {
  const buffer = audioBuffers.get('closeCall');
  if (buffer) {
    playBuffer(refs, settings, buffer, 0.6);
  }
}
```

**Step 2: Verify build succeeds**

Run: `npm run build`
Expected: No TypeScript errors

**Step 3: Commit**

```bash
git add src/game/audioFiles.ts
git commit -m "feat(precision-bar): add precision audio file implementations"
```

---

## Task 8: Wire Audio in Game.tsx

**Files:**
- Modify: `src/components/Game.tsx` (audio wiring section)

**Step 1: Import precision audio functions**

Add imports for the new audio functions:

```typescript
import {
  // ... existing imports
  startPrecisionDroneFile,
  stopPrecisionDroneFile,
  playPbDingFile,
  playNewRecordFile,
  playCloseCallFile,
} from '@/game/audioFiles';
```

**Step 2: Add to audio object in Game component**

In the audio object definition, add the precision audio callbacks:

```typescript
precisionDrone: () => startPrecisionDroneFile(audioRefs.current, settings),
stopPrecisionDrone: () => stopPrecisionDroneFile(),
pbDing: () => playPbDingFile(audioRefs.current, settings),
newRecordJingle: () => playNewRecordFile(audioRefs.current, settings),
closeCall: () => playCloseCallFile(audioRefs.current, settings),
```

**Step 3: Verify build succeeds**

Run: `npm run build`
Expected: No TypeScript errors

**Step 4: Commit**

```bash
git add src/components/Game.tsx
git commit -m "feat(precision-bar): wire precision audio in Game component"
```

---

## Task 9: Create Placeholder Audio Files

**Files:**
- Create: `public/assets/audio/precision/` directory
- Create placeholder files

**Step 1: Create directory and placeholder files**

```bash
mkdir -p public/assets/audio/precision
```

Create placeholder audio files (you'll replace these with real sounds later):

```bash
# Create silent placeholder files
# In practice, copy existing sound files or create new ones
cp public/assets/audio/game/late_hold.wav public/assets/audio/precision/tension-drone.ogg
cp public/assets/audio/game/win.ogg public/assets/audio/precision/pb-ding.ogg
cp public/assets/audio/game/record-break.ogg public/assets/audio/precision/new-record.ogg
cp public/assets/audio/game/win.ogg public/assets/audio/precision/close-call.ogg
```

**Step 2: Verify files exist**

```bash
ls -la public/assets/audio/precision/
```

Expected: 4 audio files

**Step 3: Commit**

```bash
git add public/assets/audio/precision/
git commit -m "feat(precision-bar): add placeholder audio files"
```

---

## Task 10: End-to-End Testing

**Step 1: Run full build**

```bash
npm run build
```

Expected: No errors

**Step 2: Run all tests**

```bash
npm test
```

Expected: All tests pass

**Step 3: Manual testing checklist**

Run: `npm run dev`

Test scenarios:
- [ ] New player (no bullet_time) - precision bar should NOT appear
- [ ] Land beyond 400 to unlock bullet_time
- [ ] Approach 419 zone with py < 5 - precision bar appears
- [ ] Progressive slow-mo as px increases (419 → 420)
- [ ] Gold → White color gradient on bar
- [ ] PB marker shows at correct position
- [ ] Passing PB triggers flash effect
- [ ] Dynamic decimal precision increases near .9 thresholds
- [ ] Fall at 419.9+ shows "Almost!" overlay with lastValidPx
- [ ] Audio: tension drone plays when bar activates
- [ ] Audio: ding when passing PB

**Step 4: Final commit**

```bash
git add -A
git commit -m "feat(precision-bar): complete precision bar implementation"
```

---

## Summary

| Task | Description | Files |
|------|-------------|-------|
| 1 | Add state properties | types.ts, state.ts |
| 2 | Create logic module | precisionBar.ts, tests |
| 3 | Create render module | precisionRender.ts |
| 4 | Integrate into update loop | update.ts |
| 5 | Integrate into render | render.ts |
| 6 | Add audio hooks | audioFiles.ts, update.ts |
| 7 | Implement audio functions | audioFiles.ts |
| 8 | Wire audio in Game | Game.tsx |
| 9 | Create audio files | audio/precision/ |
| 10 | End-to-end testing | - |

Total estimated commits: 10
