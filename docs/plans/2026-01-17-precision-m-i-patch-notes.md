# Precision Mechanics Implementation - Patch Notes

> **Reference:** Corrections and fixes for `2026-01-16-precision-mechanics-implementation.md`
> **Date:** 2026-01-17
> **Status:** Apply these fixes during or after implementation

---

## Critical Fixes (Must Apply)

### Fix 1: Double-Dipping on Landing Frame

**Problem:** When Zeno lands (flying → sliding in same frame), both air brake AND slide control can apply in one frame.

**Location:** Task 7 & Task 8 (update.ts wiring)

**Fix:** Add early return flag after air brake section:

```typescript
// In updateFrame, after input edge detection:
let precisionAppliedThisFrame = false;

// In flying section (Task 7):
if (state.flying && !precisionAppliedThisFrame) {
  // ... air brake logic ...
  if (result.applied) precisionAppliedThisFrame = true;
}

// In sliding section (Task 8):
if (state.sliding && !precisionAppliedThisFrame) {
  // ... slide control logic ...
}
```

---

### Fix 2: Test Friction Math Ignores TIME_SCALE

**Problem:** Task 8 test expects `vx *= 0.92^2.5 ≈ 0.81` but actual is `vx *= 0.92^(TIME_SCALE * 2.5)`.

**Location:** Task 8, Step 1 test

**Fix:** Update test to account for TIME_SCALE:

```typescript
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

  // With TIME_SCALE = 0.55 and frictionMultiplier = 2.5:
  // friction = 0.92^(0.55 * 2.5) = 0.92^1.375 ≈ 0.89
  // Normal would be 0.92^0.55 ≈ 0.956
  const normalFriction = Math.pow(0.92, 0.55);
  const brakeFriction = Math.pow(0.92, 0.55 * 2.5);

  expect(state.vx).toBeCloseTo(initialVx * brakeFriction, 1);
  expect(state.vx).toBeLessThan(initialVx * normalFriction);
});
```

---

### Fix 3: Mock Services Missing Audio Functions

**Problem:** `createMockServices` in Task 4 doesn't include precision audio functions added in Task 10. Tests will crash with "undefined is not a function".

**Location:** Task 4, Step 1

**Fix:** Add all audio functions to mock (even if empty):

```typescript
function createMockServices(pressed: boolean): GameServices {
  return {
    // ... existing ...
    audio: {
      // ... existing functions ...

      // Precision control sounds (add these)
      airBrakeTap: () => {},
      airBrakeHold: () => {},
      slideExtend: () => {},
      slideBrake: () => {},
      staminaLow: () => {},
      actionDenied: () => {},
    },
    // ... rest unchanged ...
  };
}
```

---

## Medium Priority Fixes

### Fix 4: Magic Numbers in Edge Multiplier

**Problem:** Hardcoded `350` and `70` will break if CLIFF_EDGE changes.

**Location:** Task 3, `precision.ts`

**Fix:**

```typescript
import { CLIFF_EDGE } from '@/game/constants';

const PRECISION_ZONE_WIDTH = 70;
const PRECISION_ZONE_START = CLIFF_EDGE - PRECISION_ZONE_WIDTH;

export function calculateEdgeMultiplier(position: number): number {
  if (position <= PRECISION_ZONE_START) {
    return 1.0;
  }
  const edgeDistance = (position - PRECISION_ZONE_START) / PRECISION_ZONE_WIDTH;
  return 1 + Math.pow(edgeDistance, 2);
}
```

---

### Fix 5: Slide Extend Direction Bug

**Problem:** `state.vx += 0.15` always adds positive velocity. If vx is negative (rare with wind), this slows down instead of extending.

**Location:** Task 6, `applySlideControl`

**Fix:**

```typescript
if (inputType === 'tap') {
  const cost = Math.ceil(SLIDE_EXTEND_BASE_COST * edgeMultiplier);
  if (state.stamina < cost) {
    return { applied: false, denied: true };
  }
  // Extend in current direction of travel
  if (state.vx > 0) {
    state.vx += SLIDE_EXTEND_VELOCITY;
  } else if (state.vx < 0) {
    state.vx -= SLIDE_EXTEND_VELOCITY; // Extend in negative direction
  }
  // If vx === 0, do nothing (shouldn't happen during slide)
  state.stamina -= cost;
  return { applied: true, denied: false };
}
```

---

### Fix 6: Edge Multiplier Should Apply to Air Brake Too

**Problem:** Plan describes "edge proximity cost scaling" but only slide control uses it. Inconsistent design.

**Location:** Task 5, `applyAirBrake`

**Decision needed:** Either:

**Option A - Apply to air brake (recommended for consistency):**
```typescript
export function applyAirBrake(
  state: GameState,
  inputType: 'tap' | 'hold',
  deltaTime: number = 1/60
): PrecisionResult {
  const edgeMultiplier = calculateEdgeMultiplier(state.px);

  if (inputType === 'tap') {
    const cost = Math.ceil(AIR_BRAKE_TAP_COST * edgeMultiplier);
    if (state.stamina < cost) {
      return { applied: false, denied: true };
    }
    state.vx *= AIR_BRAKE_TAP_REDUCTION;
    state.vy *= AIR_BRAKE_TAP_REDUCTION;
    state.stamina -= cost;
    return { applied: true, denied: false };
  }
  // ... hold logic with edgeMultiplier too
}
```

**Option B - Document that air brake is intentionally position-independent:**
Add comment explaining air brake costs the same everywhere as a design choice.

---

### Fix 7: Stamina Drain Should Scale with Slow-Mo

**Problem:** During cinematic slow-mo, physics run at 0.375x but stamina drains at 1x. This makes precision controls more effective in slow-mo (exploit).

**Location:** Task 5 & 6, hold logic

**Fix:** Use effectiveTimeScale for stamina drain:

```typescript
// Pass effectiveTimeScale to precision functions
// In update.ts:
const effectiveTimeScale = TIME_SCALE * (1 - state.slowMo);

// In precision.ts:
export function applyAirBrake(
  state: GameState,
  inputType: 'tap' | 'hold',
  deltaTime: number = 1/60,
  timeScale: number = 1.0  // NEW PARAM
): PrecisionResult {
  // ...
  if (inputType === 'hold') {
    const frameCost = AIR_BRAKE_HOLD_COST_PER_SEC * deltaTime * timeScale;
    // Now stamina drain matches physics speed
  }
}
```

**Alternative:** Keep current behavior as intentional "reward" for reaching cinematic zone (document this).

---

## Low Priority / Nice to Have

### Fix 8: Add Launch Cooldown

**Problem:** Player can accidentally tap air brake immediately after launch (double-tap on release).

**Fix:** Add 5-frame cooldown after launch:

```typescript
// In GameState:
launchCooldown: number;

// In launch logic:
state.launchCooldown = 5;

// In precision check:
if (state.flying && state.launchCooldown <= 0) {
  // ... allow precision controls
}

// In update:
if (state.launchCooldown > 0) state.launchCooldown--;
```

---

### Fix 9: Add Discoverability

**Problem:** No indication that precision controls exist.

**Fix options:**

1. **First-flight hint:** Show tooltip "Tap to brake" on first throw after update
2. **Tutorial challenge:** Add daily challenge "Use air brake 3 times"
3. **Stamina bar always visible:** Show at 100% initially, fades after first use

---

### Fix 10: Minimum Velocity Protection

**Problem:** Heavy air braking could reduce velocity to near-zero, causing floating behavior.

**Fix:**

```typescript
// After applying air brake:
const MIN_FLIGHT_VELOCITY = 0.5;
if (Math.abs(state.vx) < MIN_FLIGHT_VELOCITY && state.flying) {
  state.vx = Math.sign(state.vx) * MIN_FLIGHT_VELOCITY || MIN_FLIGHT_VELOCITY;
}
```

---

### Fix 11: Tap vs Hold Clarification

**Problem:** Current design: every press starts with tap, then continues as hold. This means holding always gets tap+hold effect.

**Options:**

**A. Keep current (document it):**
- Tap = quick press-release (< 3 frames)
- Hold = sustained press, first frame is tap, subsequent are hold
- This is actually fine for game feel

**B. Separate tap and hold completely:**
```typescript
const TAP_THRESHOLD_FRAMES = 3;

if (state.precisionInput.releasedThisFrame && state.precisionInput.holdDuration <= TAP_THRESHOLD_FRAMES) {
  // This was a tap
  applyAirBrake(state, 'tap');
} else if (pressed && state.precisionInput.holdDuration > TAP_THRESHOLD_FRAMES) {
  // This is a hold (only after threshold)
  applyAirBrake(state, 'hold', deltaTime);
}
```

---

## Test Coverage Additions

Add these tests to ensure fixes work:

```typescript
describe('Edge Cases', () => {
  it('does not double-apply on landing frame', () => {
    const state = createInitialState({ reduceFx: false });
    state.flying = true;
    state.py = H - 19; // About to land
    state.vy = 2;
    state.vx = 3;
    state.stamina = 100;
    state.precisionInput.lastPressedState = true;
    state.precisionInput.holdDuration = 5;

    updateFrame(state, createMockServices(true));

    // Should only deduct stamina once (not twice)
    // Air brake hold: 15/60 = 0.25 stamina
    expect(state.stamina).toBeGreaterThan(99.5);
  });

  it('handles negative vx in slide extend', () => {
    const state = createInitialState({ reduceFx: false });
    state.sliding = true;
    state.px = 300;
    state.vx = -1.0; // Moving backwards (rare)
    state.stamina = 100;

    applySlideControl(state, 'tap');

    expect(state.vx).toBeCloseTo(-1.15); // Extended in negative direction
  });
});
```

---

## Implementation Order

1. **Before starting:** Apply Fix 3 (mock services) - prevents test crashes
2. **During Task 3:** Apply Fix 4 (magic numbers)
3. **During Task 5:** Decide on Fix 6 (edge multiplier for air brake)
4. **During Task 6:** Apply Fix 5 (slide direction)
5. **During Task 7-8:** Apply Fix 1 (double-dipping) and Fix 2 (test math)
6. **After Task 14:** Apply remaining fixes as polish

---

## Summary

| Fix | Priority | Effort | When to Apply |
|-----|----------|--------|---------------|
| 1. Double-dipping | 🔴 Critical | 10 min | Task 7-8 |
| 2. Test friction math | 🔴 Critical | 5 min | Task 8 |
| 3. Mock services | 🔴 Critical | 2 min | Task 4 |
| 4. Magic numbers | 🟠 Medium | 5 min | Task 3 |
| 5. Slide direction | 🟠 Medium | 5 min | Task 6 |
| 6. Edge mult air brake | 🟠 Medium | 10 min | Task 5 |
| 7. Slow-mo stamina | 🟡 Low | 15 min | After Task 14 |
| 8. Launch cooldown | 🟡 Low | 5 min | After Task 14 |
| 9. Discoverability | 🟡 Low | 30 min | Post-release |
| 10. Min velocity | 🟡 Low | 5 min | After Task 14 |
| 11. Tap/hold clarify | 🟡 Low | 10 min | Design decision |
