# Precision Mechanics Design

**Date:** 2026-01-16
**Status:** Draft
**Goal:** Make Zeno decimal precision meaningful for competitive leaderboards

---

## Problem Statement

The current Zeno system displays 8 decimal places (e.g., 419.9999352), but the actual gameplay only produces ~10,800 discrete trajectories. This means:

- The displayed precision is "fake" (floating point noise)
- Leaderboard differences like 419.9999 vs 419.9998 are not skill-based
- Players cannot intentionally achieve specific decimal scores

**Target:** 3,900,000+ unique trajectories to support meaningful 4th decimal precision.

---

## Solution Overview

Add two new player-controlled mechanics with a shared stamina resource:

1. **Air Brake** - Mid-air speed reduction (tap/hold)
2. **Slide Control** - Ground phase extension/braking (tap/hold)
3. **Stamina System** - Limited resource that scales with edge proximity

**Result:** 108 × 100 × 60 × 30 = ~19,440,000 unique trajectories

---

## Detailed Mechanics

### Phase 1: Charge (Unchanged)

| Input | Effect |
|-------|--------|
| Hold | Power meter oscillates 0→1→0 |
| Drag up/down | Adjust angle (20°-70°) |
| Release | Launch |

No stamina cost during charge phase.

---

### Phase 2: Flight (Air Brake)

Player can reduce velocity while airborne to fine-tune landing position.

| Input | Effect | Stamina Cost |
|-------|--------|--------------|
| Tap | 5% velocity reduction | 5 |
| Hold | 3% velocity reduction per frame | 15/sec |

**Implementation:**
```typescript
// Air brake - tap
if (flying && tap && stamina >= 5) {
  state.vx *= 0.95;
  state.vy *= 0.95;
  stamina -= 5;
}

// Air brake - hold
if (flying && hold && stamina >= costPerFrame) {
  state.vx *= 0.97;
  state.vy *= 0.97;
  stamina -= 15 * deltaTime;
}
```

**Use case:** Player overshoots slightly, uses air brake to land closer to target.

---

### Phase 3: Slide (Extend/Brake)

Player can extend or shorten slide distance after landing.

| Input | Effect | Stamina Cost |
|-------|--------|--------------|
| Tap | +0.15 velocity (push forward) | 8 × edgeMultiplier |
| Hold | ×2.5 friction (brake) | 10/sec × edgeMultiplier |

**Implementation:**
```typescript
// Slide extend - tap
if (sliding && tap && stamina >= tapCost) {
  state.vx += 0.15;
  stamina -= tapCost;
}

// Slide brake - hold
if (sliding && hold && stamina >= brakeCostPerFrame) {
  friction = baseFriction * 2.5;
  stamina -= brakeCostPerFrame * deltaTime;
}
```

**Use case:**
- Land at 410, tap-tap-tap to extend to 418
- Approaching edge too fast, hold to brake before falling off

---

## Stamina System

### Resource Pool

- **Maximum:** 100 units per throw
- **Resets:** On each new throw
- **Shared:** Between air brake and slide control

### Edge Proximity Scaling

Actions near the cliff edge (420) cost more stamina, creating risk/reward tension.

**Formula:**
```typescript
const edgeMultiplier = position <= 350
  ? 1.0
  : 1 + Math.pow((position - 350) / 70, 2);
```

**Scaling Table:**

| Position | Multiplier | Tap Cost (base 8) |
|----------|------------|-------------------|
| 300 | 1.0× | 8 |
| 350 | 1.0× | 8 |
| 380 | 1.2× | 10 |
| 400 | 1.5× | 12 |
| 410 | 2.0× | 16 |
| 415 | 2.6× | 21 |
| 418 | 3.4× | 27 |
| 419 | 3.8× | 30 |

**Gameplay implication:**
- Landing at 390 and pushing to 410: ~40 stamina (manageable)
- Landing at 410 and pushing to 419: ~100 stamina (burns everything)

---

## UI: Stamina Bar

### Position
Follows character (above Zeno), moves with him during flight and slide.

### Appearance
```
    ⚡ ████████████░░░░░░  67
              ↓
           [ZENO]
```

### Behavior

| Condition | Display |
|-----------|---------|
| Stamina = 100 | Hidden (no clutter) |
| Stamina < 100 | Fade in, show bar |
| Stamina > 50 | Green |
| Stamina 25-50 | Yellow |
| Stamina < 25 | Red + flashing |
| Action without stamina | Shake effect + deny sound |

### Implementation Notes
- Smooth fade in/out (200ms transition)
- Bar width: ~40px
- Font size: 8px (pixel font)
- Position: Centered above sprite, 8px gap

---

## Complete Control Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                                                                     │
│  CHARGE          FLIGHT              SLIDE                          │
│  ───────         ──────              ─────                          │
│  [Hold+Drag]     [Tap/Hold=brake]    [Tap=extend, Hold=brake]       │
│  Power+Angle     Air brake           Slide control                  │
│  No stamina      Low stamina         Scaled stamina                 │
│                                                                     │
│     30           ~~~~~~~~~~~~⤵       ═══════════════▶    420        │
│   START                              LANDING          EDGE          │
│                                                                     │
│  Stamina: ████████████████████████████████████████  100             │
│           ████████████████████░░░░░░░░░░░░░░░░░░░░   50  (used air) │
│           ████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░   20  (near edge)│
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Trajectory Count Verification

| Input | Discrete Levels | Source |
|-------|-----------------|--------|
| Power | 108 | Frame timing during 1800ms charge |
| Angle | 100 | Drag resolution (50° range) |
| Air brake timing | 60 | ~60 frames of flight |
| Slide control timing | 30 | ~30 frames of sliding |

**Total:** 108 × 100 × 60 × 30 = **19,440,000 trajectories**

**Required for 0.0001 precision:** 3,900,000

**Result:** 5× more than needed ✅

---

## Edge Cases & Anti-Exploit

### Exploit Prevention

**Problem:** Player could land safe (390) and tap-tap-tap to 419.

**Solution:** Stamina system with edge scaling ensures:
- Pushing from 390→419 costs ~150+ stamina (impossible with 100 max)
- Must land closer to target, then fine-tune with remaining stamina

### Edge Cases

| Scenario | Behavior |
|----------|----------|
| Tap with 0 stamina | Denied, shake effect, no action |
| Hold with insufficient stamina | Drains to 0, then stops |
| Fall off while extending | Normal fall-off sequence |
| Air brake to 0 velocity | Drops straight down (still possible) |

---

## Audio Feedback

| Action | Sound |
|--------|-------|
| Air tap | Soft whoosh (pitch based on remaining stamina) |
| Air hold | Continuous wind sound |
| Slide tap | Quick friction sound |
| Slide hold | Grinding/brake sound |
| Low stamina (<25) | Warning beep |
| Action denied (0 stamina) | Error buzz |

---

## Visual Feedback

| Action | Effect |
|--------|--------|
| Air brake | Speed lines reduce, slight glow on Zeno |
| Slide extend | Small dust puff behind |
| Slide brake | Larger dust cloud, friction sparks |
| Near edge (>410) | Screen edge glow intensifies |
| Stamina depleting | Bar pulses with each action |

---

## Implementation Phases

### Phase 1: Core Mechanics
1. Add stamina state to GameState
2. Implement air brake (tap/hold detection during flight)
3. Implement slide control (tap/hold detection during slide)
4. Add edge multiplier calculation

### Phase 2: UI
1. Stamina bar component
2. Position tracking (follow Zeno)
3. Color transitions and animations
4. Denied action feedback

### Phase 3: Audio/Visual Polish
1. New sound effects for actions
2. Particle effects for slide control
3. Screen effects for edge proximity

### Phase 4: Balancing
1. Playtest stamina costs
2. Adjust edge multiplier curve
3. Tune velocity effects
4. Verify trajectory count in practice

---

## Open Questions

1. **Tutorial:** How do we teach these mechanics? Popup? Practice mode?
2. **Accessibility:** Should there be an "auto-brake" option for casual players?
3. **Leaderboard:** Separate leaderboards for classic vs precision mode?

---

## Success Criteria

- [ ] Player can meaningfully control landing within 0.001 pixel precision
- [ ] Leaderboard differences at 4th decimal reflect skill, not luck
- [ ] Stamina creates strategic decisions, not frustration
- [ ] Edge proximity creates tension without feeling unfair
- [ ] Controls feel responsive and intuitive within 3 attempts
