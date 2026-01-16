# Precision Mechanics Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add stamina-based air brake and slide control mechanics to enable meaningful 4th decimal precision for competitive leaderboards.

**Architecture:** Extend GameState with stamina tracking, add tap/hold detection during flight and slide phases, implement edge proximity cost scaling. New input detection happens in Game.tsx, physics changes in update.ts, UI rendering in render.ts.

**Tech Stack:** React, TypeScript, Canvas 2D, WebAudio API (existing stack - no new dependencies)

---

## Task 1: Add Stamina State to GameState

**Files:**
- Modify: `src/game/engine/types.ts:43-116` (GameState interface)
- Modify: `src/game/engine/state.ts:19-101` (createInitialState)
- Modify: `src/game/engine/state.ts:103-137` (resetPhysics)

**Step 1: Write test for stamina state**

Create file: `src/game/engine/__tests__/stamina.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { createInitialState, resetPhysics } from '../state';

describe('Stamina State', () => {
  it('initializes with full stamina (100)', () => {
    const state = createInitialState({ reduceFx: false });
    expect(state.stamina).toBe(100);
  });

  it('resets stamina to 100 on resetPhysics', () => {
    const state = createInitialState({ reduceFx: false });
    state.stamina = 25;
    resetPhysics(state);
    expect(state.stamina).toBe(100);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- src/game/engine/__tests__/stamina.test.ts`
Expected: FAIL with "Property 'stamina' does not exist"

**Step 3: Add stamina to GameState interface**

In `src/game/engine/types.ts`, add after line 111 (before closing brace):

```typescript
  // Precision mechanics - stamina system
  stamina: number;
```

**Step 4: Initialize stamina in createInitialState**

In `src/game/engine/state.ts`, add to the return object (around line 98):

```typescript
    stamina: 100,
```

**Step 5: Reset stamina in resetPhysics**

In `src/game/engine/state.ts`, add to resetPhysics function (around line 133):

```typescript
  state.stamina = 100;
```

**Step 6: Run test to verify it passes**

Run: `npm test -- src/game/engine/__tests__/stamina.test.ts`
Expected: PASS

**Step 7: Commit**

```bash
git add src/game/engine/types.ts src/game/engine/state.ts src/game/engine/__tests__/stamina.test.ts
git commit -m "$(cat <<'EOF'
feat(precision): add stamina state to GameState

Add stamina property (0-100) to track player's precision control resource.
Initializes at 100, resets to 100 on each new throw.

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 2: Add Input State Tracking for Tap/Hold Detection

**Files:**
- Modify: `src/game/engine/types.ts:43-116` (GameState interface)
- Modify: `src/game/engine/state.ts:19-101` (createInitialState)
- Modify: `src/game/engine/state.ts:103-137` (resetPhysics)

**Step 1: Write test for input state**

Add to `src/game/engine/__tests__/stamina.test.ts`:

```typescript
describe('Input State for Precision Control', () => {
  it('initializes with input tracking state', () => {
    const state = createInitialState({ reduceFx: false });
    expect(state.precisionInput).toEqual({
      pressedThisFrame: false,
      releasedThisFrame: false,
      holdDuration: 0,
      lastPressedState: false,
    });
  });

  it('resets input state on resetPhysics', () => {
    const state = createInitialState({ reduceFx: false });
    state.precisionInput.holdDuration = 500;
    state.precisionInput.pressedThisFrame = true;
    resetPhysics(state);
    expect(state.precisionInput.holdDuration).toBe(0);
    expect(state.precisionInput.pressedThisFrame).toBe(false);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- src/game/engine/__tests__/stamina.test.ts`
Expected: FAIL with "Property 'precisionInput' does not exist"

**Step 3: Add PrecisionInput type and add to GameState**

In `src/game/engine/types.ts`, add before GameState interface:

```typescript
export interface PrecisionInput {
  pressedThisFrame: boolean;   // True only on the frame input started
  releasedThisFrame: boolean;  // True only on the frame input released
  holdDuration: number;        // Frames held (for continuous hold)
  lastPressedState: boolean;   // Previous frame's pressed state
}
```

Add to GameState interface after stamina:

```typescript
  precisionInput: PrecisionInput;
```

**Step 4: Initialize precisionInput in createInitialState**

In `src/game/engine/state.ts`, add to return object:

```typescript
    precisionInput: {
      pressedThisFrame: false,
      releasedThisFrame: false,
      holdDuration: 0,
      lastPressedState: false,
    },
```

**Step 5: Reset precisionInput in resetPhysics**

In `src/game/engine/state.ts`, add to resetPhysics:

```typescript
  state.precisionInput = {
    pressedThisFrame: false,
    releasedThisFrame: false,
    holdDuration: 0,
    lastPressedState: false,
  };
```

**Step 6: Run test to verify it passes**

Run: `npm test -- src/game/engine/__tests__/stamina.test.ts`
Expected: PASS

**Step 7: Commit**

```bash
git add src/game/engine/types.ts src/game/engine/state.ts src/game/engine/__tests__/stamina.test.ts
git commit -m "$(cat <<'EOF'
feat(precision): add input state tracking for tap/hold detection

Add PrecisionInput interface to track press/release edges and hold duration.
This enables distinguishing tap (single press) from hold (sustained press).

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 3: Implement Edge Multiplier Calculation

**Files:**
- Create: `src/game/engine/precision.ts`
- Create: `src/game/engine/__tests__/precision.test.ts`

**Step 1: Write test for edge multiplier**

Create file: `src/game/engine/__tests__/precision.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { calculateEdgeMultiplier } from '../precision';

describe('Edge Multiplier', () => {
  it('returns 1.0 for positions at or below 350', () => {
    expect(calculateEdgeMultiplier(0)).toBe(1.0);
    expect(calculateEdgeMultiplier(300)).toBe(1.0);
    expect(calculateEdgeMultiplier(350)).toBe(1.0);
  });

  it('increases quadratically for positions above 350', () => {
    // At 380: 1 + ((380-350)/70)^2 = 1 + (30/70)^2 ≈ 1.18
    expect(calculateEdgeMultiplier(380)).toBeCloseTo(1.18, 1);

    // At 400: 1 + ((400-350)/70)^2 = 1 + (50/70)^2 ≈ 1.51
    expect(calculateEdgeMultiplier(400)).toBeCloseTo(1.51, 1);

    // At 410: 1 + ((410-350)/70)^2 = 1 + (60/70)^2 ≈ 1.73
    expect(calculateEdgeMultiplier(410)).toBeCloseTo(1.73, 1);

    // At 419: 1 + ((419-350)/70)^2 = 1 + (69/70)^2 ≈ 1.97
    expect(calculateEdgeMultiplier(419)).toBeCloseTo(1.97, 1);
  });

  it('reaches approximately 2.0 at cliff edge (420)', () => {
    // At 420: 1 + ((420-350)/70)^2 = 1 + 1 = 2.0
    expect(calculateEdgeMultiplier(420)).toBe(2.0);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- src/game/engine/__tests__/precision.test.ts`
Expected: FAIL with "Cannot find module '../precision'"

**Step 3: Implement edge multiplier function**

Create file: `src/game/engine/precision.ts`

```typescript
/**
 * Calculate stamina cost multiplier based on edge proximity.
 * Actions near the cliff edge (420) cost more stamina.
 *
 * Formula: position <= 350 ? 1.0 : 1 + ((position - 350) / 70)^2
 *
 * @param position - Current x position (0-420)
 * @returns Multiplier from 1.0 (safe zone) to 2.0 (cliff edge)
 */
export function calculateEdgeMultiplier(position: number): number {
  if (position <= 350) {
    return 1.0;
  }
  const edgeDistance = (position - 350) / 70;
  return 1 + Math.pow(edgeDistance, 2);
}
```

**Step 4: Run test to verify it passes**

Run: `npm test -- src/game/engine/__tests__/precision.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/game/engine/precision.ts src/game/engine/__tests__/precision.test.ts
git commit -m "$(cat <<'EOF'
feat(precision): implement edge multiplier calculation

Add calculateEdgeMultiplier function that increases stamina costs
quadratically as player approaches the cliff edge (350-420 range).
Creates risk/reward tension for precision control near the edge.

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 4: Implement Input Edge Detection in updateFrame

**Files:**
- Modify: `src/game/engine/update.ts:110-616`

**Step 1: Write test for input edge detection**

Add to `src/game/engine/__tests__/stamina.test.ts`:

```typescript
import { updateFrame, type GameServices } from '../update';
import { getTheme } from '@/game/themes';

// Mock GameServices for testing
function createMockServices(pressed: boolean): GameServices {
  return {
    theme: getTheme('flipbook'),
    nowMs: 0,
    pressed,
    audio: {
      startCharge: () => {},
      updateCharge: () => {},
      stopCharge: () => {},
      whoosh: () => {},
      impact: () => {},
      edgeWarning: () => {},
      stopEdgeWarning: () => {},
      tone: () => {},
      zenoJingle: () => {},
      heartbeat: () => {},
      recordBreak: () => {},
      failureSound: () => {},
      wilhelmScream: () => {},
    },
    ui: {
      setFellOff: () => {},
      setLastMultiplier: () => {},
      setPerfectLanding: () => {},
      setTotalScore: () => {},
      setBestScore: () => {},
      setZenoTarget: () => {},
      setZenoLevel: () => {},
      setStats: () => {},
      setAchievements: () => {},
      setNewAchievement: () => {},
      setLastDist: () => {},
      setSessionGoals: () => {},
      setDailyStats: () => {},
      setDailyChallenge: () => {},
      setHotStreak: () => {},
    },
    triggerHaptic: () => {},
    scheduleReset: () => {},
    getDailyStats: () => ({ date: '2026-01-16', bestDistance: 0, bestScore: 0 }),
  };
}

describe('Input Edge Detection', () => {
  it('detects pressedThisFrame on input start', () => {
    const state = createInitialState({ reduceFx: false });
    state.flying = true;
    state.precisionInput.lastPressedState = false;

    updateFrame(state, createMockServices(true));

    expect(state.precisionInput.pressedThisFrame).toBe(true);
    expect(state.precisionInput.releasedThisFrame).toBe(false);
  });

  it('detects releasedThisFrame on input release', () => {
    const state = createInitialState({ reduceFx: false });
    state.flying = true;
    state.precisionInput.lastPressedState = true;
    state.precisionInput.holdDuration = 10;

    updateFrame(state, createMockServices(false));

    expect(state.precisionInput.pressedThisFrame).toBe(false);
    expect(state.precisionInput.releasedThisFrame).toBe(true);
  });

  it('increments holdDuration while pressed', () => {
    const state = createInitialState({ reduceFx: false });
    state.flying = true;
    state.precisionInput.lastPressedState = true;
    state.precisionInput.holdDuration = 5;

    updateFrame(state, createMockServices(true));

    expect(state.precisionInput.holdDuration).toBe(6);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- src/game/engine/__tests__/stamina.test.ts`
Expected: FAIL (edge detection not implemented yet)

**Step 3: Add input edge detection to updateFrame**

In `src/game/engine/update.ts`, add after line 118 (after touch feedback decay):

```typescript
  // Precision control input edge detection (for tap vs hold)
  if (state.flying || state.sliding) {
    const wasPressed = state.precisionInput.lastPressedState;
    state.precisionInput.pressedThisFrame = pressed && !wasPressed;
    state.precisionInput.releasedThisFrame = !pressed && wasPressed;

    if (pressed) {
      state.precisionInput.holdDuration++;
    } else {
      state.precisionInput.holdDuration = 0;
    }

    state.precisionInput.lastPressedState = pressed;
  }
```

**Step 4: Run test to verify it passes**

Run: `npm test -- src/game/engine/__tests__/stamina.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/game/engine/update.ts src/game/engine/__tests__/stamina.test.ts
git commit -m "$(cat <<'EOF'
feat(precision): add input edge detection for tap/hold

Detect input press/release edges during flight and slide phases.
Track hold duration to distinguish tap (quick press) from hold.

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 5: Implement Air Brake Mechanics

**Files:**
- Modify: `src/game/engine/precision.ts`
- Modify: `src/game/engine/update.ts`
- Modify: `src/game/engine/__tests__/precision.test.ts`

**Step 1: Write test for air brake**

Add to `src/game/engine/__tests__/precision.test.ts`:

```typescript
import { applyAirBrake } from '../precision';
import { createInitialState } from '../state';

describe('Air Brake', () => {
  describe('Tap (5% reduction, 5 stamina)', () => {
    it('reduces velocity by 5% on tap', () => {
      const state = createInitialState({ reduceFx: false });
      state.vx = 10;
      state.vy = -5;
      state.stamina = 100;

      const result = applyAirBrake(state, 'tap');

      expect(result.applied).toBe(true);
      expect(state.vx).toBeCloseTo(9.5);
      expect(state.vy).toBeCloseTo(-4.75);
      expect(state.stamina).toBe(95);
    });

    it('does not apply if stamina < 5', () => {
      const state = createInitialState({ reduceFx: false });
      state.vx = 10;
      state.vy = -5;
      state.stamina = 4;

      const result = applyAirBrake(state, 'tap');

      expect(result.applied).toBe(false);
      expect(result.denied).toBe(true);
      expect(state.vx).toBe(10);
      expect(state.stamina).toBe(4);
    });
  });

  describe('Hold (3% reduction per frame, 15 stamina/sec)', () => {
    it('reduces velocity by 3% per frame on hold', () => {
      const state = createInitialState({ reduceFx: false });
      state.vx = 10;
      state.vy = -5;
      state.stamina = 100;
      const deltaTime = 1/60; // 60fps

      const result = applyAirBrake(state, 'hold', deltaTime);

      expect(result.applied).toBe(true);
      expect(state.vx).toBeCloseTo(9.7);
      expect(state.vy).toBeCloseTo(-4.85);
      expect(state.stamina).toBeCloseTo(100 - 15 * deltaTime);
    });

    it('drains to 0 and stops if insufficient stamina', () => {
      const state = createInitialState({ reduceFx: false });
      state.vx = 10;
      state.stamina = 0.1;
      const deltaTime = 1/60;

      const result = applyAirBrake(state, 'hold', deltaTime);

      expect(result.applied).toBe(false);
      expect(result.denied).toBe(true);
      expect(state.stamina).toBe(0.1); // Unchanged
    });
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- src/game/engine/__tests__/precision.test.ts`
Expected: FAIL with "applyAirBrake is not defined"

**Step 3: Implement applyAirBrake function**

Add to `src/game/engine/precision.ts`:

```typescript
import type { GameState } from './types';

// Air brake constants
const AIR_BRAKE_TAP_REDUCTION = 0.95;  // 5% velocity reduction
const AIR_BRAKE_TAP_COST = 5;
const AIR_BRAKE_HOLD_REDUCTION = 0.97; // 3% velocity reduction per frame
const AIR_BRAKE_HOLD_COST_PER_SEC = 15;

export type PrecisionResult = {
  applied: boolean;
  denied: boolean;
};

/**
 * Apply air brake during flight phase.
 * Tap: 5% velocity reduction, costs 5 stamina
 * Hold: 3% velocity reduction per frame, costs 15 stamina/sec
 */
export function applyAirBrake(
  state: GameState,
  inputType: 'tap' | 'hold',
  deltaTime: number = 1/60
): PrecisionResult {
  if (inputType === 'tap') {
    if (state.stamina < AIR_BRAKE_TAP_COST) {
      return { applied: false, denied: true };
    }
    state.vx *= AIR_BRAKE_TAP_REDUCTION;
    state.vy *= AIR_BRAKE_TAP_REDUCTION;
    state.stamina -= AIR_BRAKE_TAP_COST;
    return { applied: true, denied: false };
  }

  // Hold
  const frameCost = AIR_BRAKE_HOLD_COST_PER_SEC * deltaTime;
  if (state.stamina < frameCost) {
    return { applied: false, denied: true };
  }
  state.vx *= AIR_BRAKE_HOLD_REDUCTION;
  state.vy *= AIR_BRAKE_HOLD_REDUCTION;
  state.stamina -= frameCost;
  return { applied: true, denied: false };
}
```

**Step 4: Run test to verify it passes**

Run: `npm test -- src/game/engine/__tests__/precision.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/game/engine/precision.ts src/game/engine/__tests__/precision.test.ts
git commit -m "$(cat <<'EOF'
feat(precision): implement air brake mechanics

Add applyAirBrake function for mid-air velocity reduction:
- Tap: 5% reduction, 5 stamina cost
- Hold: 3%/frame reduction, 15 stamina/sec cost

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 6: Implement Slide Control Mechanics

**Files:**
- Modify: `src/game/engine/precision.ts`
- Modify: `src/game/engine/__tests__/precision.test.ts`

**Step 1: Write test for slide control**

Add to `src/game/engine/__tests__/precision.test.ts`:

```typescript
import { applySlideControl, calculateEdgeMultiplier } from '../precision';

describe('Slide Control', () => {
  describe('Tap (extend: +0.15 velocity)', () => {
    it('adds 0.15 to velocity at position 300 (1.0x multiplier)', () => {
      const state = createInitialState({ reduceFx: false });
      state.px = 300;
      state.vx = 1.0;
      state.stamina = 100;

      const result = applySlideControl(state, 'tap');

      expect(result.applied).toBe(true);
      expect(state.vx).toBeCloseTo(1.15);
      expect(state.stamina).toBe(92); // 100 - 8*1.0
    });

    it('costs more stamina near the edge', () => {
      const state = createInitialState({ reduceFx: false });
      state.px = 410; // ~1.73x multiplier
      state.vx = 1.0;
      state.stamina = 100;

      const result = applySlideControl(state, 'tap');
      const edgeMult = calculateEdgeMultiplier(410);
      const expectedCost = Math.ceil(8 * edgeMult);

      expect(result.applied).toBe(true);
      expect(state.stamina).toBe(100 - expectedCost);
    });

    it('denies if insufficient stamina for edge-scaled cost', () => {
      const state = createInitialState({ reduceFx: false });
      state.px = 415; // Higher multiplier
      state.vx = 1.0;
      state.stamina = 10; // Not enough for scaled cost

      const result = applySlideControl(state, 'tap');

      expect(result.applied).toBe(false);
      expect(result.denied).toBe(true);
    });
  });

  describe('Hold (brake: 2.5x friction)', () => {
    it('returns brake friction multiplier of 2.5', () => {
      const state = createInitialState({ reduceFx: false });
      state.px = 300;
      state.stamina = 100;
      const deltaTime = 1/60;

      const result = applySlideControl(state, 'hold', deltaTime);

      expect(result.applied).toBe(true);
      expect(result.frictionMultiplier).toBe(2.5);
      expect(state.stamina).toBeCloseTo(100 - 10 * 1.0 * deltaTime);
    });

    it('costs more stamina near edge', () => {
      const state = createInitialState({ reduceFx: false });
      state.px = 410;
      state.stamina = 100;
      const deltaTime = 1/60;
      const edgeMult = calculateEdgeMultiplier(410);

      const result = applySlideControl(state, 'hold', deltaTime);

      expect(result.applied).toBe(true);
      expect(state.stamina).toBeCloseTo(100 - 10 * edgeMult * deltaTime);
    });
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- src/game/engine/__tests__/precision.test.ts`
Expected: FAIL with "applySlideControl is not defined"

**Step 3: Implement applySlideControl function**

Add to `src/game/engine/precision.ts`:

```typescript
// Slide control constants
const SLIDE_EXTEND_VELOCITY = 0.15;
const SLIDE_EXTEND_BASE_COST = 8;
const SLIDE_BRAKE_FRICTION_MULT = 2.5;
const SLIDE_BRAKE_COST_PER_SEC = 10;

export type SlideControlResult = PrecisionResult & {
  frictionMultiplier?: number;
};

/**
 * Apply slide control during ground slide phase.
 * Tap: +0.15 velocity (extend slide), costs 8 * edgeMultiplier stamina
 * Hold: 2.5x friction (brake), costs 10/sec * edgeMultiplier stamina
 */
export function applySlideControl(
  state: GameState,
  inputType: 'tap' | 'hold',
  deltaTime: number = 1/60
): SlideControlResult {
  const edgeMultiplier = calculateEdgeMultiplier(state.px);

  if (inputType === 'tap') {
    const cost = Math.ceil(SLIDE_EXTEND_BASE_COST * edgeMultiplier);
    if (state.stamina < cost) {
      return { applied: false, denied: true };
    }
    state.vx += SLIDE_EXTEND_VELOCITY;
    state.stamina -= cost;
    return { applied: true, denied: false };
  }

  // Hold (brake)
  const frameCost = SLIDE_BRAKE_COST_PER_SEC * edgeMultiplier * deltaTime;
  if (state.stamina < frameCost) {
    return { applied: false, denied: true, frictionMultiplier: 1.0 };
  }
  state.stamina -= frameCost;
  return { applied: true, denied: false, frictionMultiplier: SLIDE_BRAKE_FRICTION_MULT };
}
```

**Step 4: Run test to verify it passes**

Run: `npm test -- src/game/engine/__tests__/precision.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/game/engine/precision.ts src/game/engine/__tests__/precision.test.ts
git commit -m "$(cat <<'EOF'
feat(precision): implement slide control mechanics

Add applySlideControl function for ground phase precision:
- Tap: +0.15 velocity (extend), 8 * edgeMultiplier stamina
- Hold: 2.5x friction (brake), 10/sec * edgeMultiplier stamina

Edge multiplier increases costs near cliff edge (350-420 range).

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 7: Wire Air Brake into Flight Phase

**Files:**
- Modify: `src/game/engine/update.ts`

**Step 1: Write integration test**

Add to `src/game/engine/__tests__/stamina.test.ts`:

```typescript
describe('Air Brake Integration', () => {
  it('applies air brake tap when pressed during flight', () => {
    const state = createInitialState({ reduceFx: false });
    state.flying = true;
    state.vx = 5;
    state.vy = -3;
    state.stamina = 100;
    state.precisionInput.lastPressedState = false;

    // First frame with press (tap)
    updateFrame(state, createMockServices(true));

    // Velocity should be reduced by tap (5%)
    expect(state.vx).toBeCloseTo(4.75);
    expect(state.vy).toBeCloseTo(-2.85);
    expect(state.stamina).toBe(95);
  });

  it('applies air brake hold when held during flight', () => {
    const state = createInitialState({ reduceFx: false });
    state.flying = true;
    state.vx = 5;
    state.vy = -3;
    state.stamina = 100;
    state.precisionInput.lastPressedState = true;
    state.precisionInput.holdDuration = 5;

    // Subsequent frame with continued press (hold)
    updateFrame(state, createMockServices(true));

    // Velocity should be reduced by hold (3%)
    expect(state.vx).toBeCloseTo(4.85);
    expect(state.vy).toBeCloseTo(-2.91);
  });

  it('does not apply air brake if landed', () => {
    const state = createInitialState({ reduceFx: false });
    state.landed = true;
    state.vx = 5;
    state.stamina = 100;
    state.precisionInput.lastPressedState = false;

    updateFrame(state, createMockServices(true));

    expect(state.vx).toBe(5);
    expect(state.stamina).toBe(100);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- src/game/engine/__tests__/stamina.test.ts`
Expected: FAIL (air brake not wired in yet)

**Step 3: Wire air brake into flying phase**

In `src/game/engine/update.ts`, add import at top:

```typescript
import { applyAirBrake, applySlideControl } from './precision';
```

In the flying section (around line 195, after `if (state.flying) {`), add:

```typescript
    // Precision control: Air brake
    if (!state.landed) {
      const deltaTime = 1/60;
      if (state.precisionInput.pressedThisFrame) {
        // Tap: single reduction
        applyAirBrake(state, 'tap');
      } else if (pressed && state.precisionInput.holdDuration > 0) {
        // Hold: continuous reduction
        applyAirBrake(state, 'hold', deltaTime);
      }
    }
```

**Step 4: Run test to verify it passes**

Run: `npm test -- src/game/engine/__tests__/stamina.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/game/engine/update.ts src/game/engine/__tests__/stamina.test.ts
git commit -m "$(cat <<'EOF'
feat(precision): wire air brake into flight phase

Air brake now activates during flight:
- Tap input: 5% velocity reduction, 5 stamina
- Hold input: 3%/frame reduction, 15 stamina/sec

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 8: Wire Slide Control into Sliding Phase

**Files:**
- Modify: `src/game/engine/update.ts`

**Step 1: Write integration test**

Add to `src/game/engine/__tests__/stamina.test.ts`:

```typescript
describe('Slide Control Integration', () => {
  it('applies slide extend tap when pressed during slide', () => {
    const state = createInitialState({ reduceFx: false });
    state.sliding = true;
    state.px = 300;
    state.vx = 1.0;
    state.stamina = 100;
    state.precisionInput.lastPressedState = false;

    updateFrame(state, createMockServices(true));

    expect(state.vx).toBeCloseTo(1.15);
    expect(state.stamina).toBe(92); // 100 - 8
  });

  it('applies slide brake friction when held during slide', () => {
    const state = createInitialState({ reduceFx: false });
    state.sliding = true;
    state.px = 300;
    state.vx = 2.0;
    state.stamina = 100;
    state.precisionInput.lastPressedState = true;
    state.precisionInput.holdDuration = 5;

    const initialVx = state.vx;
    updateFrame(state, createMockServices(true));

    // With 2.5x friction multiplier, velocity should decrease faster
    // Normal friction: vx *= 0.92
    // With brake: vx *= 0.92^2.5 ≈ 0.81
    expect(state.vx).toBeLessThan(initialVx * 0.92);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- src/game/engine/__tests__/stamina.test.ts`
Expected: FAIL (slide control not wired in)

**Step 3: Wire slide control into sliding phase**

In `src/game/engine/update.ts`, modify the sliding section (around line 394):

```typescript
  // Sliding (scaled by effectiveTimeScale for slowmo support)
  if (state.sliding) {
    // Precision control: Slide extend/brake
    let frictionMultiplier = 1.0;
    if (!state.landed) {
      const deltaTime = 1/60;
      if (state.precisionInput.pressedThisFrame) {
        // Tap: extend slide
        applySlideControl(state, 'tap');
      } else if (pressed && state.precisionInput.holdDuration > 0) {
        // Hold: brake
        const result = applySlideControl(state, 'hold', deltaTime);
        if (result.frictionMultiplier) {
          frictionMultiplier = result.frictionMultiplier;
        }
      }
    }

    const baseFriction = 0.92;
    const friction = Math.pow(baseFriction, effectiveTimeScale * frictionMultiplier);
    state.vx *= friction;
    state.px += state.vx * effectiveTimeScale;
    // ... rest of sliding logic unchanged
```

**Step 4: Run test to verify it passes**

Run: `npm test -- src/game/engine/__tests__/stamina.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/game/engine/update.ts src/game/engine/__tests__/stamina.test.ts
git commit -m "$(cat <<'EOF'
feat(precision): wire slide control into sliding phase

Slide control now activates during ground slide:
- Tap: +0.15 velocity (extend), 8 * edgeMultiplier stamina
- Hold: 2.5x friction (brake), 10/sec * edgeMultiplier stamina

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 9: Implement Stamina Bar UI Rendering

**Files:**
- Modify: `src/game/engine/render.ts`

**Step 1: Add stamina bar rendering function**

In `src/game/engine/render.ts`, add helper function before `renderFrame`:

```typescript
/**
 * Draw stamina bar above Zeno.
 * - Hidden when stamina = 100
 * - Green > 50, Yellow 25-50, Red < 25
 * - Flashes when < 25
 */
function drawStaminaBar(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  stamina: number,
  nowMs: number,
  COLORS: Theme
) {
  // Hidden when full
  if (stamina >= 100) return;

  const barWidth = 40;
  const barHeight = 6;
  const barX = x - barWidth / 2;
  const barY = y - 12;

  // Background
  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  ctx.fillRect(barX, barY, barWidth, barHeight);

  // Fill color based on stamina level
  let fillColor: string;
  if (stamina > 50) {
    fillColor = '#22c55e'; // Green
  } else if (stamina > 25) {
    fillColor = '#eab308'; // Yellow
  } else {
    fillColor = '#ef4444'; // Red
    // Flash effect when low
    if (Math.floor(nowMs / 200) % 2 === 0) {
      ctx.fillStyle = 'rgba(239, 68, 68, 0.3)';
      ctx.fillRect(barX - 2, barY - 2, barWidth + 4, barHeight + 4);
    }
  }

  // Fill bar
  const fillWidth = (stamina / 100) * (barWidth - 2);
  ctx.fillStyle = fillColor;
  ctx.fillRect(barX + 1, barY + 1, fillWidth, barHeight - 2);

  // Border
  ctx.strokeStyle = COLORS.accent3;
  ctx.lineWidth = 1;
  ctx.strokeRect(barX, barY, barWidth, barHeight);

  // Stamina number (small)
  ctx.fillStyle = COLORS.uiText;
  ctx.font = '7px monospace';
  ctx.textAlign = 'right';
  ctx.fillText(Math.floor(stamina).toString(), barX + barWidth + 12, barY + 5);
}
```

**Step 2: Wire stamina bar into renderFlipbookFrame**

In `renderFlipbookFrame`, after player rendering (around line 265), add:

```typescript
  // Stamina bar (only during flight/slide when stamina used)
  if ((state.flying || state.sliding) && state.stamina < 100) {
    drawStaminaBar(ctx, zenoX, zenoY, state.stamina, nowMs, COLORS);
  }
```

**Step 3: Wire stamina bar into renderNoirFrame**

In `renderNoirFrame`, after player rendering (around line 682), add:

```typescript
  // Stamina bar (only during flight/slide when stamina used)
  if ((state.flying || state.sliding) && state.stamina < 100) {
    drawStaminaBar(ctx, state.px, zenoY, state.stamina, nowMs, COLORS);
  }
```

**Step 4: Test manually**

Run: `npm run dev`
Expected: Stamina bar appears above Zeno when tapping/holding during flight or slide

**Step 5: Commit**

```bash
git add src/game/engine/render.ts
git commit -m "$(cat <<'EOF'
feat(precision): add stamina bar UI rendering

Draw stamina bar above Zeno during flight/slide phases:
- Hidden when stamina = 100
- Green when > 50%, Yellow when 25-50%, Red when < 25%
- Flashes when low (< 25%)
- Shows numeric value next to bar

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 10: Add Audio Feedback for Precision Controls

**Files:**
- Modify: `src/game/engine/update.ts:35-55` (GameAudio type)
- Modify: `src/components/Game.tsx:396-416` (audio object)
- Modify: `src/game/audio.ts`

**Step 1: Extend GameAudio type**

In `src/game/engine/update.ts`, add to GameAudio type:

```typescript
  // Precision control sounds
  airBrakeTap?: () => void;
  airBrakeHold?: () => void;
  slideExtend?: () => void;
  slideBrake?: () => void;
  staminaLow?: () => void;
  actionDenied?: () => void;
```

**Step 2: Add synth functions to audio.ts**

In `src/game/audio.ts`, add:

```typescript
// Precision control sounds (synth-based)
export function playAirBrakeTap(refs: AudioRefs, settings: AudioSettings) {
  if (settings.muted || settings.volume <= 0) return;
  // Soft whoosh with pitch based on action
  playTone(refs, settings, 300, 0.08, 'sine', 0.04);
}

export function playAirBrakeHold(refs: AudioRefs, settings: AudioSettings) {
  if (settings.muted || settings.volume <= 0) return;
  // Continuous wind-like sound (just a soft tone)
  playTone(refs, settings, 200, 0.05, 'sine', 0.02);
}

export function playSlideExtend(refs: AudioRefs, settings: AudioSettings) {
  if (settings.muted || settings.volume <= 0) return;
  // Quick friction sound
  playTone(refs, settings, 150, 0.06, 'triangle', 0.05);
}

export function playSlideBrake(refs: AudioRefs, settings: AudioSettings) {
  if (settings.muted || settings.volume <= 0) return;
  // Grinding/brake sound
  playTone(refs, settings, 100, 0.04, 'sawtooth', 0.03);
}

export function playStaminaLow(refs: AudioRefs, settings: AudioSettings) {
  if (settings.muted || settings.volume <= 0) return;
  // Warning beep
  playTone(refs, settings, 880, 0.1, 'square', 0.04);
}

export function playActionDenied(refs: AudioRefs, settings: AudioSettings) {
  if (settings.muted || settings.volume <= 0) return;
  // Error buzz
  playTone(refs, settings, 150, 0.15, 'sawtooth', 0.06);
}
```

**Step 3: Wire audio into Game.tsx**

In `src/components/Game.tsx`, import new functions:

```typescript
import {
  // ... existing imports
  playAirBrakeTap,
  playAirBrakeHold,
  playSlideExtend,
  playSlideBrake,
  playStaminaLow,
  playActionDenied,
} from '@/game/audio';
```

Add to audio object in Game.tsx:

```typescript
      // Precision control sounds
      airBrakeTap: () => playAirBrakeTap(audioRefs.current, audioSettingsRef.current),
      airBrakeHold: () => playAirBrakeHold(audioRefs.current, audioSettingsRef.current),
      slideExtend: () => playSlideExtend(audioRefs.current, audioSettingsRef.current),
      slideBrake: () => playSlideBrake(audioRefs.current, audioSettingsRef.current),
      staminaLow: () => playStaminaLow(audioRefs.current, audioSettingsRef.current),
      actionDenied: () => playActionDenied(audioRefs.current, audioSettingsRef.current),
```

**Step 4: Call audio in update.ts**

Modify air brake call in update.ts:

```typescript
      if (state.precisionInput.pressedThisFrame) {
        const result = applyAirBrake(state, 'tap');
        if (result.applied) {
          audio.airBrakeTap?.();
        } else if (result.denied) {
          audio.actionDenied?.();
        }
      } else if (pressed && state.precisionInput.holdDuration > 0) {
        const result = applyAirBrake(state, 'hold', deltaTime);
        if (result.applied && state.precisionInput.holdDuration % 6 === 0) {
          audio.airBrakeHold?.(); // Play periodically during hold
        } else if (result.denied) {
          audio.actionDenied?.();
        }
      }
```

Similar for slide control.

**Step 5: Test manually**

Run: `npm run dev`
Expected: Hear sounds when using precision controls

**Step 6: Commit**

```bash
git add src/game/engine/update.ts src/game/audio.ts src/components/Game.tsx
git commit -m "$(cat <<'EOF'
feat(precision): add audio feedback for precision controls

Add synthesized sounds for:
- Air brake tap/hold
- Slide extend/brake
- Low stamina warning
- Action denied (insufficient stamina)

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 11: Add Low Stamina Warning Effect

**Files:**
- Modify: `src/game/engine/update.ts`

**Step 1: Add low stamina warning**

In update.ts, after precision control handling in both flying and sliding sections:

```typescript
    // Low stamina warning (play beep when crossing threshold)
    const wasAbove25 = state.stamina + (/* cost just deducted */) > 25;
    if (state.stamina <= 25 && state.stamina > 0) {
      if (Math.floor(nowMs / 500) !== Math.floor((nowMs - 16) / 500)) {
        audio.staminaLow?.();
      }
    }
```

**Step 2: Test manually**

Run: `npm run dev`
Expected: Hear warning beeps when stamina drops below 25

**Step 3: Commit**

```bash
git add src/game/engine/update.ts
git commit -m "$(cat <<'EOF'
feat(precision): add low stamina warning beep

Play warning beep every 500ms when stamina drops below 25.
Alerts player to conserve remaining precision control resource.

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 12: Add Denied Action Visual Feedback

**Files:**
- Modify: `src/game/engine/types.ts`
- Modify: `src/game/engine/state.ts`
- Modify: `src/game/engine/render.ts`
- Modify: `src/game/engine/update.ts`

**Step 1: Add shake effect state**

In types.ts, add to GameState:

```typescript
  staminaDeniedShake: number; // Frames of shake remaining
```

In state.ts, initialize and reset:

```typescript
    staminaDeniedShake: 0,
```

**Step 2: Trigger shake on denied**

In update.ts, when action denied:

```typescript
        if (result.denied) {
          audio.actionDenied?.();
          state.staminaDeniedShake = 8;
        }
```

**Step 3: Render shake effect on stamina bar**

In render.ts, modify drawStaminaBar:

```typescript
function drawStaminaBar(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  stamina: number,
  nowMs: number,
  COLORS: Theme,
  shakeAmount: number = 0
) {
  // Apply shake offset
  const shakeX = shakeAmount > 0 ? (Math.random() - 0.5) * shakeAmount : 0;
  const shakeY = shakeAmount > 0 ? (Math.random() - 0.5) * shakeAmount : 0;

  const barX = x - barWidth / 2 + shakeX;
  const barY = y - 12 + shakeY;
  // ... rest unchanged
```

Call with shake:

```typescript
    drawStaminaBar(ctx, zenoX, zenoY, state.stamina, nowMs, COLORS, state.staminaDeniedShake);
```

**Step 4: Decay shake in update**

In update.ts:

```typescript
  if (state.staminaDeniedShake > 0) state.staminaDeniedShake--;
```

**Step 5: Commit**

```bash
git add src/game/engine/types.ts src/game/engine/state.ts src/game/engine/render.ts src/game/engine/update.ts
git commit -m "$(cat <<'EOF'
feat(precision): add denied action visual feedback

Shake stamina bar when action is denied due to insufficient stamina.
Provides clear visual feedback that the player is out of resources.

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 13: Update CHANGELOG.md

**Files:**
- Modify: `CHANGELOG.md`

**Step 1: Add precision mechanics to changelog**

Add new section to CHANGELOG.md under `[Unreleased]`:

```markdown
### Added - Precision Mechanics
- **Stamina System**: 100-unit resource pool per throw for precision control
  - Resets to full on each new throw
  - Shared between air brake and slide control

- **Air Brake** (during flight):
  - Tap: 5% velocity reduction, costs 5 stamina
  - Hold: 3%/frame velocity reduction, costs 15 stamina/sec
  - Use case: Fine-tune landing position mid-air

- **Slide Control** (during ground slide):
  - Tap: +0.15 velocity (extend slide), costs 8 × edgeMultiplier stamina
  - Hold: 2.5× friction (brake), costs 10/sec × edgeMultiplier stamina
  - Use case: Extend to reach target or brake before falling off

- **Edge Proximity Scaling**: Stamina costs increase quadratically near cliff edge (350-420)
  - Position 350: 1.0× multiplier
  - Position 400: 1.5× multiplier
  - Position 419: ~2.0× multiplier

- **Stamina UI**:
  - Bar above Zeno (hidden when full)
  - Color coding: Green (>50%), Yellow (25-50%), Red (<25%)
  - Flashing effect when low
  - Shake effect when action denied

- **Audio Feedback**:
  - Air brake tap/hold sounds
  - Slide extend/brake sounds
  - Low stamina warning beep
  - Action denied error buzz

### Technical
- New `precision.ts` module with edge multiplier and control functions
- Extended `GameState` with stamina and precision input tracking
- Unit tests for all precision mechanics
```

**Step 2: Commit**

```bash
git add CHANGELOG.md
git commit -m "$(cat <<'EOF'
docs: update CHANGELOG with precision mechanics

Document all new precision control features:
- Stamina system
- Air brake mechanics
- Slide control mechanics
- Edge proximity scaling
- UI and audio feedback

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 14: Run Full Test Suite and Build

**Step 1: Run all tests**

Run: `npm test`
Expected: All tests pass

**Step 2: Run build**

Run: `npm run build`
Expected: Build succeeds without errors

**Step 3: Run lint**

Run: `npm run lint`
Expected: No lint errors

**Step 4: Manual playtesting checklist**

- [ ] Stamina bar appears above Zeno during flight when tapping
- [ ] Tap during flight reduces velocity noticeably
- [ ] Hold during flight continuously reduces velocity
- [ ] Stamina depletes during use
- [ ] Stamina bar colors change (green → yellow → red)
- [ ] Low stamina warning beeps
- [ ] Denied action shakes bar and plays error sound
- [ ] Tap during slide extends distance
- [ ] Hold during slide brakes faster
- [ ] Edge proximity makes slide control more expensive
- [ ] Cannot push from safe zone (390) all the way to edge (419) - stamina runs out

**Step 5: Final commit**

```bash
git add -A
git commit -m "$(cat <<'EOF'
feat(precision): complete precision mechanics implementation

All precision mechanics working:
- Stamina-based air brake and slide control
- Edge proximity cost scaling
- Visual and audio feedback
- Full test coverage

Enables meaningful 4th decimal precision for competitive leaderboards.

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

## Summary

This plan implements the precision mechanics in 14 tasks:

1. **Tasks 1-2**: Add stamina and input tracking state
2. **Tasks 3-6**: Implement core mechanics (edge multiplier, air brake, slide control)
3. **Tasks 7-8**: Wire mechanics into game loop
4. **Tasks 9-12**: Add UI and audio feedback
5. **Tasks 13-14**: Documentation and verification

Each task follows TDD: write failing test → implement → verify pass → commit.

Estimated trajectory count after implementation: ~19,440,000 unique outcomes (5× more than needed for meaningful 4th decimal precision).
