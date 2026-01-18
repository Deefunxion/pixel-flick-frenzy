# UX Improvements Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement control symmetry (tap=float), tutorial system, and UI polish based on player feedback.

**Architecture:** Modify existing precision control system to change air tap from brake to gravity reduction. Add tutorial state machine to GameState with localStorage persistence. Replace generic UI elements with hand-drawn assets.

**Tech Stack:** React, TypeScript, Vitest, Canvas 2D, localStorage

---

## Phase 1: Control Symmetry (Air Tap = Float)

### Task 1.1: Add gravityMultiplier and floatDuration to GameState

**Files:**
- Modify: `src/game/engine/types.ts:123-128`

**Step 1: Add new fields to GameState interface**

Add after line 127 (`staminaDeniedShake: number;`):

```typescript
  // Air float (gravity reduction on tap)
  gravityMultiplier: number;
  floatDuration: number;
```

**Step 2: Verify TypeScript compiles**

Run: `npm run build 2>&1 | head -30`
Expected: Errors about missing properties in createInitialState

---

### Task 1.2: Initialize new fields in createInitialState

**Files:**
- Modify: `src/game/engine/state.ts`

**Step 1: Find createInitialState and add initialization**

Search for `staminaDeniedShake: 0` and add after it:

```typescript
    gravityMultiplier: 1,
    floatDuration: 0,
```

**Step 2: Verify build passes**

Run: `npm run build`
Expected: SUCCESS

**Step 3: Commit**

```bash
git add src/game/engine/types.ts src/game/engine/state.ts
git commit -m "feat: add gravityMultiplier and floatDuration to GameState"
```

---

### Task 1.3: Write failing test for applyAirFloat

**Files:**
- Create: `src/game/engine/__tests__/airFloat.test.ts`

**Step 1: Write the failing test**

```typescript
import { describe, it, expect } from 'vitest';
import { applyAirFloat } from '../precision';
import { createInitialState } from '../state';
import { calculateEdgeMultiplier } from '../precision';

describe('Air Float (Gravity Reduction)', () => {
  describe('applyAirFloat', () => {
    it('sets gravityMultiplier to 0.5 and floatDuration to 0.3', () => {
      const state = createInitialState({ reduceFx: false });
      state.px = 300; // Safe zone
      state.stamina = 100;

      applyAirFloat(state);

      expect(state.gravityMultiplier).toBe(0.5);
      expect(state.floatDuration).toBe(0.3);
    });

    it('costs 5 stamina in safe zone', () => {
      const state = createInitialState({ reduceFx: false });
      state.px = 300;
      state.stamina = 100;

      applyAirFloat(state);

      expect(state.stamina).toBe(95);
    });

    it('costs more stamina near edge (uses edgeMultiplier)', () => {
      const state = createInitialState({ reduceFx: false });
      state.px = 410; // ~1.73x multiplier
      state.stamina = 100;

      applyAirFloat(state);

      const expectedCost = Math.ceil(5 * calculateEdgeMultiplier(410));
      expect(state.stamina).toBe(100 - expectedCost);
    });

    it('returns denied: true when stamina insufficient', () => {
      const state = createInitialState({ reduceFx: false });
      state.px = 300;
      state.stamina = 2; // Not enough

      const result = applyAirFloat(state);

      expect(result.applied).toBe(false);
      expect(result.denied).toBe(true);
      expect(state.gravityMultiplier).toBe(1); // Unchanged
    });

    it('does not stack - multiple calls just refresh duration', () => {
      const state = createInitialState({ reduceFx: false });
      state.px = 300;
      state.stamina = 100;

      applyAirFloat(state);
      expect(state.gravityMultiplier).toBe(0.5);

      applyAirFloat(state);
      expect(state.gravityMultiplier).toBe(0.5); // Still 0.5, not 0.25
      expect(state.floatDuration).toBe(0.3); // Reset to 0.3
    });
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- src/game/engine/__tests__/airFloat.test.ts`
Expected: FAIL with "applyAirFloat is not exported"

---

### Task 1.4: Implement applyAirFloat function

**Files:**
- Modify: `src/game/engine/precision.ts`

**Step 1: Add constants at top of file (after line 17)**

```typescript
// Air float constants (gravity reduction on tap)
const AIR_FLOAT_GRAVITY_MULT = 0.5;
const AIR_FLOAT_DURATION = 0.3;
const AIR_FLOAT_BASE_COST = 5;
```

**Step 2: Add applyAirFloat function (after applyAirBrake, around line 80)**

```typescript
/**
 * Apply air float during flight phase (replaces air brake tap).
 * Reduces gravity to 50% for 0.3 seconds.
 * Costs 5 * edgeMultiplier stamina.
 */
export function applyAirFloat(state: GameState): PrecisionResult {
  const edgeMultiplier = calculateEdgeMultiplier(state.px);
  const cost = Math.ceil(AIR_FLOAT_BASE_COST * edgeMultiplier);

  if (state.stamina < cost) {
    return { applied: false, denied: true };
  }

  state.gravityMultiplier = AIR_FLOAT_GRAVITY_MULT;
  state.floatDuration = AIR_FLOAT_DURATION;
  state.stamina -= cost;

  return { applied: true, denied: false };
}
```

**Step 3: Run tests**

Run: `npm test -- src/game/engine/__tests__/airFloat.test.ts`
Expected: PASS

**Step 4: Commit**

```bash
git add src/game/engine/precision.ts src/game/engine/__tests__/airFloat.test.ts
git commit -m "feat: implement applyAirFloat for gravity reduction"
```

---

### Task 1.5: Write test for gravity multiplier decay

**Files:**
- Modify: `src/game/engine/__tests__/airFloat.test.ts`

**Step 1: Add decay test**

```typescript
describe('Gravity Multiplier Decay', () => {
  it('should decay floatDuration over time', () => {
    const state = createInitialState({ reduceFx: false });
    state.gravityMultiplier = 0.5;
    state.floatDuration = 0.3;

    // Simulate 0.1 seconds passing
    decayFloatEffect(state, 0.1);

    expect(state.floatDuration).toBeCloseTo(0.2);
    expect(state.gravityMultiplier).toBe(0.5); // Still active
  });

  it('should reset gravityMultiplier to 1 when duration expires', () => {
    const state = createInitialState({ reduceFx: false });
    state.gravityMultiplier = 0.5;
    state.floatDuration = 0.1;

    // Simulate 0.15 seconds passing (more than remaining)
    decayFloatEffect(state, 0.15);

    expect(state.floatDuration).toBe(0);
    expect(state.gravityMultiplier).toBe(1);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- src/game/engine/__tests__/airFloat.test.ts`
Expected: FAIL with "decayFloatEffect is not defined"

---

### Task 1.6: Implement decayFloatEffect

**Files:**
- Modify: `src/game/engine/precision.ts`

**Step 1: Add decayFloatEffect function**

```typescript
/**
 * Decay the float effect over time.
 * Called every frame during flight.
 */
export function decayFloatEffect(state: GameState, deltaTime: number): void {
  if (state.floatDuration > 0) {
    state.floatDuration -= deltaTime;
    if (state.floatDuration <= 0) {
      state.floatDuration = 0;
      state.gravityMultiplier = 1;
    }
  }
}
```

**Step 2: Update test import**

Add `decayFloatEffect` to the import in `airFloat.test.ts`.

**Step 3: Run tests**

Run: `npm test -- src/game/engine/__tests__/airFloat.test.ts`
Expected: PASS

**Step 4: Commit**

```bash
git add src/game/engine/precision.ts src/game/engine/__tests__/airFloat.test.ts
git commit -m "feat: implement decayFloatEffect for gravity multiplier"
```

---

### Task 1.7: Integrate into update.ts - Replace air brake tap with float

**Files:**
- Modify: `src/game/engine/update.ts`

**Step 1: Add import**

Update the import from precision.ts:

```typescript
import { applyAirBrake, applySlideControl, applyAirFloat, decayFloatEffect } from './precision';
```

**Step 2: Replace air brake tap with float (around line 227-236)**

Find:
```typescript
      if (state.precisionInput.pressedThisFrame) {
        // Tap: single reduction
        const result = applyAirBrake(state, 'tap');
        if (result.applied) {
          precisionAppliedThisFrame = true;
          audio.airBrakeTap?.();
```

Replace with:
```typescript
      if (state.precisionInput.pressedThisFrame) {
        // Tap: gravity reduction (float)
        const result = applyAirFloat(state);
        if (result.applied) {
          precisionAppliedThisFrame = true;
          audio.airBrakeTap?.(); // TODO: add airFloat sound
```

**Step 3: Apply gravity with multiplier (around line 260)**

Find:
```typescript
    state.vy += BASE_GRAV * effectiveTimeScale;
```

Replace with:
```typescript
    const effectiveGravity = BASE_GRAV * state.gravityMultiplier;
    state.vy += effectiveGravity * effectiveTimeScale;

    // Decay float effect
    decayFloatEffect(state, effectiveTimeScale / 60);
```

**Step 4: Run existing tests**

Run: `npm test`
Expected: All tests PASS

**Step 5: Run dev server and test manually**

Run: `npm run dev`
Test: Tap during flight should make Zeno float (less gravity) for 0.3 seconds

**Step 6: Commit**

```bash
git add src/game/engine/update.ts
git commit -m "feat: integrate air float into game loop (tap=float, hold=brake)"
```

---

### Task 1.8: Update control tips text

**Files:**
- Modify: `src/components/Game.tsx`

**Step 1: Find control tips section**

Search for `TAP BRAKE` or control tips.

**Step 2: Update text**

Change from:
```
TAP BRAKE | HOLD HARD BRAKE
```

To:
```
TAP FLOAT | HOLD BRAKE
```

**Step 3: Commit**

```bash
git add src/components/Game.tsx
git commit -m "docs: update control tips to reflect tap=float"
```

---

## Phase 2: Tutorial System

### Task 2.1: Add TutorialState to types.ts

**Files:**
- Modify: `src/game/engine/types.ts`

**Step 1: Add TutorialPhase type and TutorialState interface**

Add before GameState interface:

```typescript
export type TutorialPhase = 'none' | 'idle' | 'charge' | 'air' | 'slide';

export interface TutorialState {
  phase: TutorialPhase;
  active: boolean;
  timeRemaining: number; // seconds
  hasSeenCharge: boolean;
  hasSeenAir: boolean;
  hasSeenSlide: boolean;
}
```

**Step 2: Add tutorialState to GameState**

Add after `staminaDeniedShake`:

```typescript
  // Tutorial system
  tutorialState: TutorialState;
```

**Step 3: Commit**

```bash
git add src/game/engine/types.ts
git commit -m "feat: add TutorialState type definition"
```

---

### Task 2.2: Initialize TutorialState

**Files:**
- Modify: `src/game/engine/state.ts`

**Step 1: Add tutorial initialization helper**

```typescript
function loadTutorialProgress(): Pick<TutorialState, 'hasSeenCharge' | 'hasSeenAir' | 'hasSeenSlide'> {
  if (typeof window === 'undefined') {
    return { hasSeenCharge: false, hasSeenAir: false, hasSeenSlide: false };
  }
  return {
    hasSeenCharge: localStorage.getItem('tutorial_charge_seen') === 'true',
    hasSeenAir: localStorage.getItem('tutorial_air_seen') === 'true',
    hasSeenSlide: localStorage.getItem('tutorial_slide_seen') === 'true',
  };
}
```

**Step 2: Initialize tutorialState in createInitialState**

```typescript
    tutorialState: {
      phase: 'none',
      active: false,
      timeRemaining: 0,
      ...loadTutorialProgress(),
    },
```

**Step 3: Run build**

Run: `npm run build`
Expected: SUCCESS

**Step 4: Commit**

```bash
git add src/game/engine/state.ts
git commit -m "feat: initialize tutorialState with localStorage persistence"
```

---

### Task 2.3: Create tutorial trigger logic

**Files:**
- Create: `src/game/engine/tutorial.ts`

**Step 1: Create tutorial module**

```typescript
import type { GameState, TutorialPhase } from './types';

const TUTORIAL_DURATION = 2.0; // seconds
const TUTORIAL_SLOWMO = 0.1;

export interface TutorialContent {
  lines: string[];
}

export const TUTORIAL_CONTENT: Record<TutorialPhase, TutorialContent> = {
  none: { lines: [] },
  idle: { lines: ['Welcome to One More Flick!', 'Tap and hold to begin'] },
  charge: { lines: ['Hold to charge power (it bounces!)', 'Drag up/down to aim'] },
  air: { lines: ['👆 TAP = float longer', '👇 HOLD = brake'] },
  slide: { lines: ['👆 TAP = push further', '👇 HOLD = brake'] },
};

/**
 * Check if a tutorial should trigger based on game state.
 * Returns the phase to trigger, or 'none' if no tutorial needed.
 */
export function checkTutorialTrigger(state: GameState, prevVy: number): TutorialPhase {
  // Don't trigger if already in tutorial
  if (state.tutorialState.active) return 'none';

  // Charge tutorial: first touch while idle
  if (state.charging && !state.tutorialState.hasSeenCharge) {
    return 'charge';
  }

  // Air tutorial: at flight apex (vy crosses from negative to positive)
  if (state.flying && !state.tutorialState.hasSeenAir) {
    if (prevVy < 0 && state.vy >= 0) {
      return 'air';
    }
  }

  // Slide tutorial: first frame of sliding
  if (state.sliding && !state.tutorialState.hasSeenSlide && state.vx !== 0) {
    return 'slide';
  }

  return 'none';
}

/**
 * Start a tutorial phase.
 */
export function startTutorial(state: GameState, phase: TutorialPhase): void {
  state.tutorialState.phase = phase;
  state.tutorialState.active = true;
  state.tutorialState.timeRemaining = TUTORIAL_DURATION;
}

/**
 * Update tutorial state (call every frame).
 * Returns the slow-mo multiplier to apply.
 */
export function updateTutorial(state: GameState, deltaTime: number): number {
  if (!state.tutorialState.active) return 1;

  state.tutorialState.timeRemaining -= deltaTime;

  if (state.tutorialState.timeRemaining <= 0) {
    completeTutorial(state);
    return 1;
  }

  return TUTORIAL_SLOWMO;
}

/**
 * Complete current tutorial and mark as seen.
 */
export function completeTutorial(state: GameState): void {
  const phase = state.tutorialState.phase;

  // Mark as seen
  if (phase === 'charge') {
    state.tutorialState.hasSeenCharge = true;
    localStorage.setItem('tutorial_charge_seen', 'true');
  } else if (phase === 'air') {
    state.tutorialState.hasSeenAir = true;
    localStorage.setItem('tutorial_air_seen', 'true');
  } else if (phase === 'slide') {
    state.tutorialState.hasSeenSlide = true;
    localStorage.setItem('tutorial_slide_seen', 'true');
  }

  // Reset state
  state.tutorialState.phase = 'none';
  state.tutorialState.active = false;
  state.tutorialState.timeRemaining = 0;
}

/**
 * Reset all tutorial progress (for replay button).
 */
export function resetTutorialProgress(): void {
  localStorage.removeItem('tutorial_charge_seen');
  localStorage.removeItem('tutorial_air_seen');
  localStorage.removeItem('tutorial_slide_seen');
}
```

**Step 2: Commit**

```bash
git add src/game/engine/tutorial.ts
git commit -m "feat: create tutorial trigger and state management"
```

---

### Task 2.4: Integrate tutorial into update.ts

**Files:**
- Modify: `src/game/engine/update.ts`

**Step 1: Add imports**

```typescript
import { checkTutorialTrigger, startTutorial, updateTutorial } from './tutorial';
```

**Step 2: Track previous vy for apex detection**

At start of updateFrame function, add:
```typescript
const prevVy = state.vy;
```

**Step 3: Check tutorial triggers after state updates**

Near end of updateFrame (before return), add:
```typescript
  // Tutorial system
  const tutorialPhase = checkTutorialTrigger(state, prevVy);
  if (tutorialPhase !== 'none') {
    startTutorial(state, tutorialPhase);
  }

  // Apply tutorial slow-mo
  const tutorialSlowMo = updateTutorial(state, 1/60);
  if (tutorialSlowMo < 1) {
    // Tutorial active - already applied via effectiveTimeScale
  }
```

**Step 4: Apply tutorial slow-mo to effectiveTimeScale**

Find where `effectiveTimeScale` is calculated and multiply by tutorial slow-mo.

**Step 5: Run tests and dev server**

Run: `npm test && npm run dev`
Expected: Tests pass, tutorials trigger in game

**Step 6: Commit**

```bash
git add src/game/engine/update.ts
git commit -m "feat: integrate tutorial triggers into game loop"
```

---

### Task 2.5: Create TutorialOverlay component

**Files:**
- Create: `src/components/TutorialOverlay.tsx`

**Step 1: Create the component**

```typescript
import React from 'react';
import type { TutorialPhase } from '@/game/engine/types';
import { TUTORIAL_CONTENT } from '@/game/engine/tutorial';

interface TutorialOverlayProps {
  phase: TutorialPhase;
  active: boolean;
  timeRemaining: number;
}

export function TutorialOverlay({ phase, active, timeRemaining }: TutorialOverlayProps) {
  if (!active || phase === 'none') return null;

  const content = TUTORIAL_CONTENT[phase];
  const progress = timeRemaining / 2.0; // 2 second duration

  return (
    <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
      {/* Dim background */}
      <div className="absolute inset-0 bg-black/50" />

      {/* Speech bubble */}
      <div className="relative z-10 bg-white border-2 border-blue-500 rounded-lg p-4 max-w-xs shadow-lg">
        <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-0 h-0
                        border-l-8 border-r-8 border-t-8
                        border-l-transparent border-r-transparent border-t-blue-500" />

        {content.lines.map((line, i) => (
          <p key={i} className="text-center text-blue-800 font-medium text-sm">
            {line}
          </p>
        ))}

        {/* Progress bar */}
        <div className="mt-2 h-1 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-500 transition-all"
            style={{ width: `${progress * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add src/components/TutorialOverlay.tsx
git commit -m "feat: create TutorialOverlay component"
```

---

### Task 2.6: Integrate TutorialOverlay into Game.tsx

**Files:**
- Modify: `src/components/Game.tsx`

**Step 1: Import TutorialOverlay**

```typescript
import { TutorialOverlay } from './TutorialOverlay';
```

**Step 2: Add TutorialOverlay to JSX**

Find the canvas wrapper div and add after canvas:

```typescript
<TutorialOverlay
  phase={state.tutorialState.phase}
  active={state.tutorialState.active}
  timeRemaining={state.tutorialState.timeRemaining}
/>
```

**Step 3: Test manually**

Run: `npm run dev`
Clear localStorage: `localStorage.clear()` in browser console
Test: Tutorials should appear at each phase

**Step 4: Commit**

```bash
git add src/components/Game.tsx
git commit -m "feat: integrate TutorialOverlay into Game component"
```

---

### Task 2.7: Add tutorial replay button

**Files:**
- Modify: `src/components/Game.tsx`

**Step 1: Import resetTutorialProgress**

```typescript
import { resetTutorialProgress } from '@/game/engine/tutorial';
```

**Step 2: Add replay button handler**

```typescript
const handleTutorialReplay = () => {
  resetTutorialProgress();
  // Force re-initialization on next throw
  setState(prev => ({
    ...prev,
    tutorialState: {
      ...prev.tutorialState,
      hasSeenCharge: false,
      hasSeenAir: false,
      hasSeenSlide: false,
    }
  }));
};
```

**Step 3: Add "?" button to UI**

Add near other control buttons:

```typescript
<button
  onClick={handleTutorialReplay}
  className="px-2 py-1 text-sm border rounded hover:bg-gray-100"
  title="Replay tutorial"
>
  ?
</button>
```

**Step 4: Commit**

```bash
git add src/components/Game.tsx
git commit -m "feat: add tutorial replay button"
```

---

## Phase 3: UI Assets Integration

### Task 3.1: Remove theme toggle button

**Files:**
- Modify: `src/components/Game.tsx`

**Step 1: Find and remove theme toggle**

Search for "Flipbook" or "Noir" button and comment out or remove:

```typescript
{/* Theme toggle removed - Noir is early-stage
<button onClick={toggleTheme}>...</button>
*/}
```

**Step 2: Commit**

```bash
git add src/components/Game.tsx
git commit -m "fix: remove theme toggle (Noir is early-stage)"
```

---

### Task 3.2: Create UI asset loader

**Files:**
- Create: `src/game/engine/uiAssets.ts`

**Step 1: Define UI asset paths**

```typescript
import { assetPath } from '@/lib/assetPath';

export const UI_ASSETS = {
  leaderboard: assetPath('/assets/ui/elements/transparent/2.png'),
  tapHere: assetPath('/assets/ui/elements/transparent/3.png'),
  scoreLabel: assetPath('/assets/ui/elements/transparent/4.png'),
  bestLabel: assetPath('/assets/ui/elements/transparent/5.png'),
  starOutline: assetPath('/assets/ui/elements/transparent/6.png'),
  starFilled: assetPath('/assets/ui/elements/transparent/7.png'),
  trophy: assetPath('/assets/ui/elements/transparent/8.png'),
  podium: assetPath('/assets/ui/elements/transparent/9.png'),
  highlightFrame: assetPath('/assets/ui/elements/transparent/10.png'),
  squareFrame: assetPath('/assets/ui/elements/transparent/11.png'),
  checkboxChecked: assetPath('/assets/ui/elements/transparent/12.png'),
  close: assetPath('/assets/ui/elements/transparent/13.png'),
  refresh: assetPath('/assets/ui/elements/transparent/14.png'),
  gear: assetPath('/assets/ui/elements/transparent/15.png'),
  volumeOn: assetPath('/assets/ui/elements/transparent/16.png'),
  volumeOff: assetPath('/assets/ui/elements/transparent/17.png'),
};
```

**Step 2: Commit**

```bash
git add src/game/engine/uiAssets.ts
git commit -m "feat: define UI asset paths"
```

---

### Task 3.3: Replace volume control with icon buttons

**Files:**
- Modify: `src/components/Game.tsx`

**Step 1: Import UI assets**

```typescript
import { UI_ASSETS } from '@/game/engine/uiAssets';
```

**Step 2: Replace volume slider with toggle button**

Find volume control and replace with:

```typescript
<button
  onClick={() => setMuted(!muted)}
  className="w-8 h-8 p-1"
  title={muted ? 'Unmute' : 'Mute'}
>
  <img
    src={muted ? UI_ASSETS.volumeOff : UI_ASSETS.volumeOn}
    alt={muted ? 'Sound off' : 'Sound on'}
    className="w-full h-full object-contain"
  />
</button>
```

**Step 3: Commit**

```bash
git add src/components/Game.tsx
git commit -m "feat: replace volume slider with hand-drawn icon button"
```

---

### Task 3.4: Replace refresh button with hand-drawn icon

**Files:**
- Modify: `src/components/Game.tsx`

**Step 1: Find refresh/retry button and replace**

```typescript
<button onClick={handleRetry} className="w-8 h-8 p-1" title="Retry">
  <img
    src={UI_ASSETS.refresh}
    alt="Retry"
    className="w-full h-full object-contain"
  />
</button>
```

**Step 2: Commit**

```bash
git add src/components/Game.tsx
git commit -m "feat: replace retry button with hand-drawn icon"
```

---

### Task 3.5: Add hand-drawn SCORE/BEST labels

**Files:**
- Modify: `src/components/Game.tsx` or `src/game/engine/render.ts`

**Step 1: Replace text SCORE with image**

```typescript
<img
  src={UI_ASSETS.scoreLabel}
  alt="Score"
  className="h-4 object-contain"
/>
<span className="text-lg font-bold">{state.dist.toFixed(2)}</span>
```

**Step 2: Replace text BEST with image**

```typescript
<img
  src={UI_ASSETS.bestLabel}
  alt="Best"
  className="h-4 object-contain"
/>
<span className="text-lg font-bold">{state.best.toFixed(2)}</span>
```

**Step 3: Commit**

```bash
git add src/components/Game.tsx
git commit -m "feat: add hand-drawn SCORE/BEST labels"
```

---

## Phase 4: Testing & Polish

### Task 4.1: Full integration test

**Steps:**

1. Clear localStorage: `localStorage.clear()`
2. Refresh page
3. Verify: Charge tutorial appears on first touch
4. Verify: Air tutorial appears at flight apex
5. Verify: Slide tutorial appears on landing
6. Verify: Tap during flight reduces gravity (float effect)
7. Verify: Hold during flight brakes (velocity reduction)
8. Verify: UI shows hand-drawn icons
9. Verify: Theme toggle is hidden

---

### Task 4.2: Mobile testing

**Steps:**

1. Open on mobile device or emulator
2. Test touch interactions with tutorial
3. Verify tutorial text is readable
4. Verify icons are appropriately sized

---

### Task 4.3: Final commit and push

```bash
git add -A
git commit -m "feat: complete UX improvements (tutorial, float controls, UI)"
git push
```

---

## Summary

| Phase | Tasks | Est. Time |
|-------|-------|-----------|
| Phase 1: Control Symmetry | 8 tasks | - |
| Phase 2: Tutorial System | 7 tasks | - |
| Phase 3: UI Assets | 5 tasks | - |
| Phase 4: Testing | 3 tasks | - |
| **Total** | **23 tasks** | - |

## Files Modified

| File | Changes |
|------|---------|
| `src/game/engine/types.ts` | Add gravityMultiplier, floatDuration, TutorialState |
| `src/game/engine/state.ts` | Initialize new fields |
| `src/game/engine/precision.ts` | Add applyAirFloat, decayFloatEffect |
| `src/game/engine/update.ts` | Integrate float and tutorial |
| `src/game/engine/tutorial.ts` | New file - tutorial logic |
| `src/game/engine/uiAssets.ts` | New file - UI asset paths |
| `src/game/engine/__tests__/airFloat.test.ts` | New file - float tests |
| `src/components/Game.tsx` | UI updates, tutorial integration |
| `src/components/TutorialOverlay.tsx` | New file - tutorial UI |
