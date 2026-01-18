# Precision Bar Design

**Date:** 2026-01-18
**Status:** Draft
**Goal:** Visual feedback system for competitive throws (419-420 zone)

---

## Problem Statement

Players cannot visually understand the difference between throws like:
- 419.83 vs 419.64 (early competitive)
- 419.999856 vs 419.999433 (high-level competition)

The Zeno decimal system shows precision, but there's no real-time visual feedback that makes skill differences feel meaningful.

---

## Solution Overview

A **Precision Bar** that appears during competitive throws (419+ zone), showing:
- Real-time position progress toward 420
- Personal best marker for comparison
- Dynamic decimal precision as score increases
- Progressive slow-motion for dramatic effect

---

## Trigger Conditions

The precision bar activates when BOTH conditions are met:

```typescript
const shouldActivate = state.px >= 418.9 && state.py < 5;
```

| Condition | Value | Reason |
|-----------|-------|--------|
| X position | >= 418.9 | 0.1 before competitive zone |
| Y position | < 5 | Near ground, realistic landing trajectory |

**Achievement Gate:** Requires "Bullet Time" achievement (land beyond 400)

**Deactivation:**
- Velocity ≈ 0 (successful landing)
- px > 420 (fell off cliff)

---

## Visual Design

### Position & Size

```
       [Precision Bar - 60px]     419.87
       [Stamina Bar]              67
              [ZENO]
```

- **Width:** 60px (fixed)
- **Height:** 8px
- **Gap from stamina bar:** 4px
- **Follows Zeno horizontally**

### Bar Elements

```
┌──────────────────────────────────────────────┐
│  [▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓|░░░░░░] 419.73            │
│         fill    PB line   empty              │
└──────────────────────────────────────────────┘
```

| Element | Description |
|---------|-------------|
| Fill | Gold → White gradient, left to right |
| PB Line | White vertical line, 1px width |
| Score | Inside bar, right-aligned, premium font |
| Empty | Dark/transparent unfilled area |

### Color Progression

| Position Range | Fill Color |
|----------------|------------|
| 419.0 - 419.5 | Deep gold (#FFD700) |
| 419.5 - 419.9 | Bright gold (#FFEC8B) |
| 419.9 - 419.99 | White-gold (#FFFACD) |
| 419.99+ | Glowing white (#FFFFFF) + subtle pulse |

### Dynamic Decimal Display

Score label shows more decimals as position approaches .9 thresholds:

| Position | Display |
|----------|---------|
| 419.0 - 419.89 | 419.7 (1 decimal) |
| 419.9 - 419.989 | 419.93 (2 decimals) |
| 419.99 - 419.9989 | 419.997 (3 decimals) |
| 419.999 - 419.99989 | 419.9973 (4 decimals) |
| ... | Up to 8 decimals |

---

## Personal Best Marker

### Display

- White vertical line (1px) at PB position
- Position calculated: `(PB - 419) / 1 * barWidth`
- Example: PB 419.81 = 81% across the bar

### First Throw (No PB)

- No PB line displayed
- Just score tracking

### Passing PB Visual Feedback

1. Flash effect on the bar
2. PB line dims (white → gray)
3. "NEW!" indicator appears
4. Gold particle burst

---

## Progressive Slow Motion

### Speed Formula

```typescript
// Linear interpolation from 419 to 420
const progress = (state.px - 419) / 1;  // 0.0 to 1.0
const timeScale = 1 - (progress * 0.9); // 1.0 → 0.1
```

### Speed Table

| Position | Time Scale | Effective Speed |
|----------|------------|-----------------|
| 419.0 | 1.0 | 100% |
| 419.25 | 0.775 | 77% |
| 419.5 | 0.55 | 55% |
| 419.75 | 0.325 | 32% |
| 419.9 | 0.19 | 19% |
| 419.99 | 0.1 | 10% |

### What Slows Down

- Physics (velocity, position updates)
- Animations (sprite frame rate)
- Particles (dust, effects)

### What Stays Normal

- UI updates (precision bar, score)
- Input response (stamina controls)
- Audio pitch

### Exit Transition

- Smooth 500ms transition back to 100% speed
- Triggers on landing (velocity ≈ 0) or fall (px > 420)

---

## Last Valid Position Tracking

### Purpose

Track the last position before falling off to show "how close" on failure.

### Implementation

```typescript
// In GameState:
lastValidPx: number;

// Each frame in update.ts:
if (state.px < CLIFF_EDGE) {
  state.lastValidPx = state.px;
}
```

### Fall Feedback

When Zeno falls (px >= 420):

1. Precision bar freezes at lastValidPx
2. Slow-mo continues for 500ms (dramatic effect)
3. "Almost!" overlay appears

---

## Feedback Messages

### Fall Messages

| Scenario | Message |
|----------|---------|
| Close to edge (419.99+) | "419.9987 - So close!" |
| Mid-zone fall (419.5-419.99) | "419.82 - Keep practicing!" |
| First time in zone | "Welcome to the precision zone!" |

### Success Messages

| Scenario | Message |
|----------|---------|
| New PB | "NEW PERSONAL BEST! +0.0047" |
| Close to PB (< 0.01) | "419.91 - Just 0.0023 away!" |
| Far from PB | "419.73 - Solid throw!" |
| First competitive landing | "First precision landing: 419.XX" |

---

## Audio Design

### Ambient Sounds

| Trigger | Sound |
|---------|-------|
| Precision bar appears | Low drone fade-in |
| Approaching PB (< 0.05 away) | Tension build, rising pitch |
| In slow-mo zone (419.9+) | Heartbeat effect |

### Event Sounds

| Event | Sound |
|-------|-------|
| Passing PB marker | Soft "ding" chime |
| New PB confirmed | Triumphant 3-note jingle |
| Fall after 419.9+ | Dramatic "whoosh-thud" |
| Close call (419.99+ survived) | Relief exhale + sparkle |

### Integration

- Precision sounds layer on top of existing (slide, brake)
- Volume ducking: game sounds -30% when precision bar active
- No pitch shift from slow-mo

### Audio Files

```
/public/assets/audio/precision/
  - tension-drone.ogg
  - pb-ding.ogg
  - new-record.ogg
  - close-call.ogg
```

---

## Technical Implementation

### New State Properties

```typescript
// In GameState (types.ts)
precisionBarActive: boolean;
lastValidPx: number;
precisionTimeScale: number;
sessionBestThrow: number;
```

### New Modules

```
src/game/engine/
  └── precisionBar.ts      # Trigger logic, calculations
  └── precisionRender.ts   # UI rendering

src/game/audio/
  └── precisionAudio.ts    # Tension/success sounds
```

### Integration Points

| File | Changes |
|------|---------|
| `types.ts` | Add new state properties |
| `state.ts` | Initialize new properties |
| `update.ts` | Check triggers, update lastValidPx, apply timeScale |
| `render.ts` | Call precisionRender when active |
| `Game.tsx` | Load precision audio files |

### Render Order

1. Game world (background, cliff, Zeno)
2. Particles
3. Precision bar (if active)
4. Stamina bar (if < 100)
5. Score/UI overlays

---

## Integration with Existing Systems

### With Stamina System

- Both bars visible simultaneously in competitive zone
- Precision bar positioned above stamina bar
- Independent functionality

### With Achievement System

- Precision bar requires "Bullet Time" achievement
- New players: no precision bar, no slow-mo
- After unlock: full experience

### With Existing Slow-Mo

- Existing edge proximity slow-mo (350-420)
- Precision bar slow-mo is more aggressive
- Use minimum of both timeScale values

---

## Success Criteria

- [ ] Player can see real-time progress in 419-420 zone
- [ ] PB marker enables meaningful comparison
- [ ] Dynamic decimals create anticipation at .9 thresholds
- [ ] Slow-mo enhances dramatic moments without frustration
- [ ] Fall feedback shows "how close" meaningfully
- [ ] Audio enhances tension without being annoying

---

## Implementation Phases

### Phase 1: Core Logic
1. Add state properties
2. Implement trigger detection
3. Track lastValidPx
4. Apply precision timeScale

### Phase 2: UI Rendering
1. Bar background and fill
2. Gold → White gradient
3. PB marker line
4. Dynamic decimal score display

### Phase 3: Feedback Messages
1. Success overlay
2. Fall overlay ("Almost!")
3. PB comparison messages

### Phase 4: Audio
1. Load audio files
2. Tension drone trigger
3. Event sounds (ding, jingle)
4. Volume ducking

### Phase 5: Polish
1. Fade transitions
2. Particle effects
3. Flash/glow effects
4. Premium font integration
