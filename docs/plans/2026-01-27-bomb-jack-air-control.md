# Bomb Jack Style Air Control Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make air control feel lighter and more Bomb Jack-like by reducing gravity multipliers 50% and implementing directional tap logic that preserves rightward momentum.

**Architecture:** Modify constants and two functions in `precision.ts`. Tap behavior becomes directional (reset vx only when moving left). Hold brake affects only vertical velocity. No new files needed.

**Tech Stack:** TypeScript, existing precision.ts module, Vitest for tests

---

## Summary of Changes

1. **Gravity multipliers reduced 50%** - floatier feel overall
2. **Tap behavior directional** - moving right = keep vx, moving left = reset vx
3. **Hold brake vertical only** - parachute effect, maintain horizontal momentum

---

### Task 1: Write failing tests for new gravity multipliers

**Files:**
- Modify: `src/game/engine/__tests__/airThrottle.test.ts`

**Step 1: Write the failing tests**

Add these tests to verify the new gravity values:

```typescript
describe('Lighter gravity multipliers (Bomb Jack style)', () => {
  it('should have HEAVY_GRAVITY_MULT at 0.6 (was 1.2)', () => {
    // No input = 60% gravity (was 120%)
    const state = createTestState();
    state.airControl.recentTapTimes = []; // No taps
    const gravity = calculateTapGravity(state, 1000);
    expect(gravity).toBe(0.6);
  });

  it('should have FLOAT_MAX_GRAVITY at 0.30 (was 0.60)', () => {
    // Single tap = 30% gravity
    const state = createTestState();
    state.airControl.recentTapTimes = [900]; // 1 tap within window
    const gravity = calculateTapGravity(state, 1000);
    expect(gravity).toBe(0.30);
  });

  it('should have FLOAT_MIN_GRAVITY at 0.08 (was 0.15)', () => {
    // 3+ taps = 8% gravity (best float)
    const state = createTestState();
    state.airControl.recentTapTimes = [850, 900, 950]; // 3 taps within window
    const gravity = calculateTapGravity(state, 1000);
    expect(gravity).toBe(0.08);
  });

  it('should have RAPID_FLAP_GRAVITY at 0.015 (was 0.03)', () => {
    // 7+ taps/sec = 1.5% gravity (almost horizontal)
    const state = createTestState();
    // 8 taps in ~1 second = 8 taps/sec
    state.airControl.recentTapTimes = [100, 200, 300, 400, 500, 600, 700, 800];
    const gravity = calculateTapGravity(state, 850);
    expect(gravity).toBe(0.015);
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `npm test -- --run src/game/engine/__tests__/airThrottle.test.ts`

Expected: FAIL - gravity values don't match new expected values

---

### Task 2: Update gravity multiplier constants

**Files:**
- Modify: `src/game/engine/precision.ts:141-144`

**Step 1: Update the constants**

Change from:
```typescript
const HEAVY_GRAVITY_MULT = 1.2;
const FLOAT_MIN_GRAVITY = 0.15;
const FLOAT_MAX_GRAVITY = 0.60;
const RAPID_FLAP_GRAVITY = 0.03;
```

To:
```typescript
const HEAVY_GRAVITY_MULT = 0.6;         // 50% reduction: normal gravity when not tapping
const FLOAT_MIN_GRAVITY = 0.08;         // 50% reduction: best float with 3+ taps
const FLOAT_MAX_GRAVITY = 0.30;         // 50% reduction: single tap float
const RAPID_FLAP_GRAVITY = 0.015;       // 50% reduction: rapid flap almost horizontal
```

**Step 2: Run tests to verify they pass**

Run: `npm test -- --run src/game/engine/__tests__/airThrottle.test.ts`

Expected: PASS

**Step 3: Commit**

```bash
git add src/game/engine/precision.ts src/game/engine/__tests__/airThrottle.test.ts
git commit -m "feat(air-control): reduce gravity multipliers 50% for floatier Bomb Jack feel"
```

---

### Task 3: Write failing tests for directional tap behavior

**Files:**
- Modify: `src/game/engine/__tests__/airThrottle.test.ts`

**Step 1: Write the failing tests**

```typescript
describe('Directional tap behavior (Bomb Jack style)', () => {
  it('should reset vx to 0 and add boost when moving LEFT (vx < 0)', () => {
    const state = createTestState();
    state.vx = -3;  // Moving left
    state.vy = 2;   // Falling
    state.stamina = 100;
    state.airControl.recentTapTimes = [];

    registerFloatTap(state, 1000);

    expect(state.vx).toBeCloseTo(0.8);  // Reset + boost
    expect(state.vy).toBe(0);            // Stop falling
  });

  it('should KEEP vx and only stop vy when moving RIGHT (vx > 0)', () => {
    const state = createTestState();
    state.vx = 3;   // Moving right
    state.vy = 2;   // Falling
    state.stamina = 100;
    state.airControl.recentTapTimes = [900]; // Not fresh tap

    registerFloatTap(state, 1000);

    expect(state.vx).toBeCloseTo(3.8);  // Keep 3 + add boost 0.8
    expect(state.vy).toBe(0);            // Stop falling
  });

  it('should KEEP vx and stop vy when vx is 0 (stopped)', () => {
    const state = createTestState();
    state.vx = 0;   // Stopped
    state.vy = 2;   // Falling
    state.stamina = 100;
    state.airControl.recentTapTimes = [900];

    registerFloatTap(state, 1000);

    expect(state.vx).toBeCloseTo(0.8);  // 0 + boost
    expect(state.vy).toBe(0);            // Stop falling
  });

  it('should cap vx at FLOAT_MAX_VELOCITY when moving right', () => {
    const state = createTestState();
    state.vx = 4.2;  // Near cap (4.5)
    state.vy = 1;
    state.stamina = 100;
    state.airControl.recentTapTimes = [900];

    registerFloatTap(state, 1000);

    expect(state.vx).toBe(4.5);  // Capped, not 4.2 + 0.8 = 5.0
    expect(state.vy).toBe(0);
  });

  it('should stop vy on fresh tap even when moving right', () => {
    const state = createTestState();
    state.vx = 5;   // Moving right fast
    state.vy = 4;   // Falling fast
    state.stamina = 100;
    state.airControl.recentTapTimes = [];  // Fresh tap (no recent taps)

    registerFloatTap(state, 1000);

    expect(state.vx).toBeGreaterThanOrEqual(5);  // Keep or add boost
    expect(state.vy).toBe(0);                     // Stop falling
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `npm test -- --run src/game/engine/__tests__/airThrottle.test.ts`

Expected: FAIL - current behavior resets vx regardless of direction

---

### Task 4: Implement directional tap behavior

**Files:**
- Modify: `src/game/engine/precision.ts:200-275` (registerFloatTap function)

**Step 1: Rewrite the tap logic**

Replace the current `registerFloatTap` function body (after stamina check and bounce reversal logic) with:

```typescript
export function registerFloatTap(
  state: GameState,
  nowMs: number
): FloatTapResult {
  const edgeMultiplier = calculateEdgeMultiplier(state.px);
  const cost = Math.ceil(TAP_STAMINA_COST * edgeMultiplier);

  if (state.stamina < cost) {
    return { applied: false, denied: true, velocityBoost: 0 };
  }

  state.stamina -= cost;

  // Check if this is a "fresh" tap (no recent taps = first tap after pause)
  const recentTaps = state.airControl.recentTapTimes.filter(
    t => nowMs - t < TAP_WINDOW_MS
  );
  const isFreshTap = recentTaps.length === 0;

  // Add tap timestamp (for float gravity calculation)
  state.airControl.recentTapTimes.push(nowMs);

  // Clean old taps outside window
  state.airControl.recentTapTimes = state.airControl.recentTapTimes.filter(
    t => nowMs - t < TAP_WINDOW_MS
  );

  // BOUNCE REVERSAL MECHANIC (special case - unchanged)
  if (state.airControl.postBounceMovingRight && state.vx > 0) {
    if (state.airControl.postBounceTapCount === 0) {
      state.vx = 0;
      state.vy = 0;
      state.airControl.postBounceTapCount = 1;
      return { applied: true, denied: false, velocityBoost: 0 };
    } else if (state.airControl.postBounceTapCount === 1) {
      state.vx = -MAX_VELOCITY / 2;
      state.airControl.postBounceTapCount = 2;
      state.airControl.postBounceMovingRight = false;
      return { applied: true, denied: false, velocityBoost: -MAX_VELOCITY / 2 };
    }
  }

  // BOMB JACK STYLE DIRECTIONAL TAP
  // Always stop vertical velocity
  state.vy = 0;

  const oldVx = state.vx;

  if (state.vx < 0) {
    // MOVING LEFT (wrong direction): Full reset, start fresh right
    state.vx = TAP_VELOCITY_BOOST;
  } else {
    // MOVING RIGHT OR STOPPED: Keep momentum, add boost (capped)
    state.vx = Math.min(state.vx + TAP_VELOCITY_BOOST, FLOAT_MAX_VELOCITY);
  }

  const actualBoost = state.vx - oldVx;

  return {
    applied: true,
    denied: false,
    velocityBoost: actualBoost
  };
}
```

**Step 2: Run tests to verify they pass**

Run: `npm test -- --run src/game/engine/__tests__/airThrottle.test.ts`

Expected: PASS

**Step 3: Commit**

```bash
git add src/game/engine/precision.ts src/game/engine/__tests__/airThrottle.test.ts
git commit -m "feat(air-control): directional tap - keep vx when moving right, reset when left"
```

---

### Task 5: Write failing tests for vertical-only brake

**Files:**
- Modify: `src/game/engine/__tests__/airThrottle.test.ts`

**Step 1: Write the failing tests**

```typescript
describe('Hold brake vertical only (Bomb Jack parachute)', () => {
  it('should brake vy but NOT vx when holding', () => {
    const state = createTestState();
    state.vx = 5;
    state.vy = 4;
    state.stamina = 100;

    applyHardBrake(state, 30, 1/60);  // 30 frames past threshold

    expect(state.vx).toBe(5);          // Unchanged
    expect(state.vy).toBeLessThan(4);  // Reduced
  });

  it('should maintain horizontal momentum through multiple brake frames', () => {
    const state = createTestState();
    state.vx = 6;
    state.vy = 3;
    state.stamina = 100;

    // Apply brake for several frames
    for (let i = 0; i < 10; i++) {
      applyHardBrake(state, i + 1, 1/60);
    }

    expect(state.vx).toBe(6);          // Still unchanged after 10 frames
    expect(state.vy).toBeLessThan(1);  // Significantly reduced
  });

  it('should allow full horizontal speed while braking vertically', () => {
    const state = createTestState();
    state.vx = 7;  // Max velocity
    state.vy = 5;
    state.stamina = 100;

    applyHardBrake(state, 60, 1/60);  // Full brake strength

    expect(state.vx).toBe(7);  // Untouched
    expect(state.vy).toBeLessThan(5);
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `npm test -- --run src/game/engine/__tests__/airThrottle.test.ts`

Expected: FAIL - current brake reduces both vx and vy

---

### Task 6: Implement vertical-only brake

**Files:**
- Modify: `src/game/engine/precision.ts:338-362` (applyHardBrake function)

**Step 1: Remove vx braking**

Change from:
```typescript
// Apply progressive deceleration
state.vx *= decel;
state.vy *= decel;
```

To:
```typescript
// Apply progressive deceleration to VERTICAL only (Bomb Jack parachute style)
// Horizontal momentum is preserved - player keeps moving forward
state.vy *= decel;
```

**Step 2: Run tests to verify they pass**

Run: `npm test -- --run src/game/engine/__tests__/airThrottle.test.ts`

Expected: PASS

**Step 3: Commit**

```bash
git add src/game/engine/precision.ts src/game/engine/__tests__/airThrottle.test.ts
git commit -m "feat(air-control): hold brake affects vertical only, preserves horizontal momentum"
```

---

### Task 7: Manual playtesting

**Step 1: Start dev server**

Run: `npm run dev`

**Step 2: Test scenarios**

1. **Light gravity test:**
   - Launch at medium power
   - Tap rapidly - should feel much floatier than before
   - Without tapping, fall should feel normal (not heavy)

2. **Directional tap test:**
   - Launch, let yourself drift right
   - Tap - should keep forward momentum, just stop falling
   - Use portal to go left, tap - should stop and reverse to right

3. **Parachute brake test:**
   - Launch at high angle
   - Hold at apex - should stop falling but keep drifting horizontally
   - Release - should continue forward while starting to fall

**Step 3: Final commit if all good**

```bash
git add -A
git commit -m "feat(air-control): complete Bomb Jack style lighter air control

- Gravity multipliers reduced 50% for floatier feel
- Directional tap: keep vx when moving right, reset when left
- Hold brake: vertical only (parachute effect)
- Maintains existing stamina costs and air friction"
```

---

## Files Changed Summary

| File | Changes |
|------|---------|
| `src/game/engine/precision.ts` | Constants (4 lines), registerFloatTap (~40 lines), applyHardBrake (1 line) |
| `src/game/engine/__tests__/airThrottle.test.ts` | New test cases (~60 lines) |

**Total: ~105 lines changed across 2 files**
