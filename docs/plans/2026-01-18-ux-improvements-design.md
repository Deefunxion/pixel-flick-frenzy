# UX Improvements Design Document

**Date:** 2026-01-18
**Status:** Ready for Implementation
**Source:** User feedback from Facebook + Reddit posts

---

## Overview

Three major UX improvements based on player feedback:

1. **Tutorial System** - Players don't discover precision controls
2. **Cliff Edge Visibility** - ✅ FIXED - Players couldn't see where the edge was
3. **UI Polish** - Hand-drawn assets to replace generic UI elements

Additionally:
- **Control Symmetry** - Simplify controls to one mental model

---

## 1. Tutorial System

### Problem
> "Άργησα να παρατηρήσω τα extra controls για το φρένο κλπ"
> Players miss the air brake and slide control mechanics entirely.

### Solution: Progressive Contextual Tutorials

Tutorials trigger at the exact moment each mechanic becomes relevant.

### Tutorial Flow

```
[Idle Screen - First Visit]
    → Arrow pointing at Zeno
    → Wait for first touch

[First Touch - Charging]
    → SLOW-MO 0.1x
    → Speech bubble: "Hold to charge power (it bounces!)"
    → Speech bubble: "Drag up/down to aim"
    → Resume on release

[Flight Apex - First Flight]
    → Trigger when vy ≈ 0 (highest point)
    → SLOW-MO 0.1x
    → Speech bubble: "👆 TAP = float longer | 👇 HOLD = brake"
    → Resume after 2 seconds or on input

[Landing - First Ground Contact]
    → Trigger on first slide
    → SLOW-MO 0.1x
    → Speech bubble: "👆 TAP = push further | 👇 HOLD = brake"
    → Resume after 2 seconds or on input
```

### Visual Design

| Element | Specification |
|---------|---------------|
| **Effect** | Zoom in on Zeno + bubble |
| **Zeno + Bubble** | Bright/highlighted (full opacity) |
| **Background** | Semi-transparent (dimmed ~50%) |
| **Game Speed** | 0.1x slow-motion |
| **Bubble Style** | Comic speech bubble from Zeno |
| **Content** | Text + simple gesture icon (👆/👇) |

### Trigger Conditions

| Tutorial | Condition | localStorage Key |
|----------|-----------|------------------|
| Charge/Aim | `onTouchStart && state === 'idle'` | `tutorial_charge_seen` |
| Air Controls | `vy changes from negative to positive` | `tutorial_air_seen` |
| Slide Controls | `state === 'sliding' && first frame` | `tutorial_slide_seen` |

### Replay System

- Each tutorial shows **once ever** (cached in localStorage)
- Add **"?" button** in UI header for manual tutorial replay
- Replay resets all tutorial flags and starts from next throw

### Implementation Notes

```typescript
// New state in GameState
tutorialState: {
  phase: 'none' | 'charge' | 'air' | 'slide';
  active: boolean;
  timeRemaining: number;
}

// Slow-mo during tutorial
if (state.tutorialState.active) {
  deltaTime *= 0.1; // 10% speed
}
```

---

## 2. Control Symmetry Change

### Problem
Current controls are asymmetric and confusing:
- Air: tap = brake, hold = hard brake
- Ground: tap = push, hold = brake

### Solution: Unified Control Model

| State | TAP | HOLD |
|-------|-----|------|
| Air | **Float** (gravity reduction) | **Brake** (velocity reduction) |
| Ground | **Push** (extend slide) | **Brake** (friction) |

**One mental model:** TAP = extend/push, HOLD = brake

### Air TAP Implementation

| Parameter | Value |
|-----------|-------|
| Effect | Gravity × 0.5 |
| Duration | 0.3 seconds |
| Stamina Cost | 5 × edgeMultiplier (unchanged) |

```typescript
// In precision.ts - new function
export function applyAirFloat(state: GameState): void {
  state.gravityMultiplier = 0.5;
  state.floatDuration = 0.3; // seconds
  state.stamina -= 5 * getEdgeMultiplier(state.px);
}

// In update.ts - apply gravity with multiplier
const effectiveGravity = GRAVITY * (state.gravityMultiplier ?? 1);
state.vy += effectiveGravity * dt;

// Decay float effect
if (state.floatDuration > 0) {
  state.floatDuration -= dt;
  if (state.floatDuration <= 0) {
    state.gravityMultiplier = 1;
  }
}
```

### Migration Path

1. Update `precision.ts` with new air tap logic
2. Update `Game.tsx` input handlers
3. Update tutorial text to reflect new controls
4. Update control tips in header

---

## 3. Cliff Edge Visibility

### Status: ✅ FIXED

### Problem
> "Μέσα στο game το γραφικό του εδάφους σε μπερδεύει, δεν είσαι σίγουρος που τελειώνει το πάτωμα"

The cliff-edge asset wasn't aligned with the physics edge (x=420).

### Solution Applied

In `backgroundRenderer.ts`:

```typescript
private drawTerrain(ctx: CanvasRenderingContext2D): void {
  const groundY = H - 19;
  const TERRAIN_OFFSET_X = -50;

  // terrain-ground
  ctx.drawImage(groundImg, TERRAIN_OFFSET_X, groundY - h + 24, w, h);

  // cliff-edge
  ctx.drawImage(cliffImg, CLIFF_EDGE - w * 0.3 + TERRAIN_OFFSET_X, groundY - h * 0.18, w, h);
}
```

Now the cliff tip aligns with x=420 (physics edge).

---

## 4. UI Polish

### Problem
> "Το UI από κάτω θα μπορούσε να είναι πιο ωραίο"

Generic UI elements don't match the hand-drawn game aesthetic.

### Solution: Hand-Drawn UI Assets

#### Available Assets

Location: `public/assets/ui/elements/transparent/`

| File | Asset | Usage |
|------|-------|-------|
| 1.png | Flipbook button | **REMOVE** (hide theme toggle) |
| 2.png | Leaderboard button | Main menu |
| 3.png | TAP HERE | CTA / first-time hint |
| 4.png | SCORE label | In-game HUD |
| 5.png | BEST label | In-game HUD |
| 6.png | Star outline | Achievement/rating |
| 7.png | Star filled | Achievement/rating |
| 8.png | Trophy | Win screen |
| 9.png | Podium | Leaderboard |
| 10.png | Highlight frame | Active element indicator |
| 11.png | Square frame | Container/card |
| 12.png | Checkbox checked | Settings |
| 13.png | Close (X) | Modal close button |
| 14.png | Refresh | Retry button |
| 15.png | Gear | Settings button |
| 16.png | Volume on | Audio toggle |
| 17.png | Volume off | Audio toggle (muted) |

#### Theme Toggle Removal

Remove the "Flipbook/Noir" toggle button because:
- Noir theme is too early-stage
- Having both visible hurts overall polish impression
- Can re-add later when Noir is complete

```typescript
// In Game.tsx - remove or hide theme toggle
// {showThemeToggle && <ThemeToggle ... />}
```

#### Implementation Priority

1. **Volume icons** (16, 17) - Replace current volume slider
2. **SCORE/BEST labels** (4, 5) - Replace text labels
3. **Refresh/Close icons** (14, 13) - Replace generic buttons
4. **Leaderboard button** (2) - Main menu
5. **Settings gear** (15) - Settings access
6. **Stars/Trophy** (6, 7, 8) - Achievement displays

---

## Implementation Order

### Phase 1: Control Symmetry (Priority: High)
- [ ] Update `precision.ts` with gravity reduction for air tap
- [ ] Update `Game.tsx` input handlers
- [ ] Update control tips text
- [ ] Test stamina costs

### Phase 2: Tutorial System (Priority: High)
- [ ] Add `tutorialState` to GameState
- [ ] Create `TutorialOverlay` component
- [ ] Implement slow-mo during tutorials
- [ ] Add tutorial trigger logic in `update.ts`
- [ ] Add localStorage caching
- [ ] Add "?" replay button

### Phase 3: UI Assets Integration (Priority: Medium)
- [ ] Remove theme toggle button
- [ ] Replace volume control with icon buttons
- [ ] Replace SCORE/BEST text with image labels
- [ ] Replace refresh/close with icon buttons
- [ ] Add "?" tutorial button with gear icon style

### Phase 4: Testing & Polish
- [ ] Test tutorial flow on fresh localStorage
- [ ] Test control symmetry feels good
- [ ] Verify cliff edge visibility
- [ ] Mobile testing

---

## Success Criteria

1. **New players understand controls** within first 3 throws
2. **Cliff edge is obvious** - no confusion about where to land
3. **UI feels cohesive** - hand-drawn style throughout
4. **Controls feel intuitive** - tap=extend, hold=brake everywhere

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/game/engine/types.ts` | Add tutorialState, gravityMultiplier, floatDuration |
| `src/game/engine/precision.ts` | Add applyAirFloat function |
| `src/game/engine/update.ts` | Tutorial triggers, gravity multiplier |
| `src/game/engine/render.ts` | Tutorial overlay rendering |
| `src/components/Game.tsx` | Input handlers, tutorial UI, remove theme toggle |
| `src/game/constants.ts` | Tutorial timing constants |

---

## Appendix: Original Feedback

**Facebook - Left Blue:**
> "Άργησα μόνο λίγο να παρατηρήσω τα extra controls για το φρένο κλπ και ακόμα δεν είμαι σίγουρος αν έχω καταλάβει πως λειτουργεί το slide. Θα ήθελα να μπορούσα να καταλάβω καλύτερα που είναι η άκρη γιατί ενώ στο cover art φαίνεται καθαρά, μέσα στο game το γραφικό του εδάφους σε μπερδεύει και δεν είσαι σίγουρος που τελειώνει το πάτωμα. Επίσης το UI από κάτω θα μπορούσε να είναι πιο ωραίο."

**Facebook - Dimitris Locke:**
> "Πολύ ωραία δουλειά! Μπράβο!"
> "45 χρόνια gaming κάτι άρεσε τελικά."
