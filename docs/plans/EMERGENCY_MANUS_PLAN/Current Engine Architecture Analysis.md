# Current Engine Architecture Analysis

## Overview

Το One-More-Flick game engine είναι ένα **pure procedural rendering system** που χρησιμοποιεί Canvas 2D API για όλα τα visuals. Το architecture είναι clean και modular.

---

## Core Components

### 1. **Game Loop** (`Game.tsx`)
- Manages the main game loop με `requestAnimationFrame`
- Calls `updateGame()` και `renderFrame()` κάθε frame
- Handles user input (mouse, touch, keyboard)

### 2. **State Management** (`state.ts`)
- Το `GameState` interface ορίζει όλο το game state
- Περιλαμβάνει: player position, velocity, game mode, particles, achievements, etc.
- **Κρίσιμο:** Δεν υπάρχει animation state ή sprite data

### 3. **Update Logic** (`update.ts`)
- Physics simulation (gravity, wind, collisions)
- State transitions (idle → charging → flying → landing)
- Particle system updates

### 4. **Rendering Pipeline** (`render.ts`)
- **Entry point:** `renderFrame()`
- Theme-based rendering: `renderFlipbookFrame()` ή `renderNoirFrame()`
- Calls drawing functions από `sketchy.ts`

### 5. **Drawing Primitives** (`sketchy.ts`)
- **2,300+ lines** of procedural drawing functions
- Functions όπως: `drawStickFigure()`, `drawZenoCoil()`, `drawZenoBolt()`, `drawZenoImpact()`
- Όλα τα visuals δημιουργούνται με Canvas primitives (lines, circles, arcs)

---

## Player Rendering Flow

Το player rendering γίνεται στο `renderFlipbookFrame()` με conditional logic:

```typescript
if (state.failureAnimating) {
  drawFailingStickFigure(ctx, state.px, state.py, playerColor, nowMs, state.failureType, state.failureFrame);
} else if (state.charging) {
  drawZenoCoil(ctx, state.px, state.py, playerColor, nowMs, state.chargePower, 'flipbook');
} else if (state.flying && !state.failureAnimating) {
  drawZenoBolt(ctx, state.px, state.py, playerColor, nowMs, { vx: state.vx, vy: state.vy }, 'flipbook');
} else if (state.landingFrame > 0 && state.landingFrame < 15 && !state.fellOff) {
  drawZenoImpact(ctx, state.px, state.py, playerColor, nowMs, state.landingFrame, 'flipbook');
} else {
  drawStickFigure(ctx, state.px, state.py, playerColor, nowMs, playerState, state.angle, ...);
}
```

**Κάθε pose είναι μια function που σχεδιάζει geometric shapes.**

---

## Strengths

1. **Clean Separation:** State, update, και render είναι ξεκάθαρα separated
2. **Modular:** Εύκολο να προσθέσεις νέα drawing functions
3. **Performant:** Procedural rendering είναι lightweight
4. **Theme System:** Υποστηρίζει multiple themes (Flipbook, Noir)

---

## Weaknesses (για Hand-Drawn Aesthetic)

1. **No Asset Loading:** Δεν υπάρχει infrastructure για images ή sprite sheets
2. **No Animation System:** Δεν υπάρχει frame-by-frame animation support
3. **Procedural Limitations:** Geometric shapes δεν μπορούν να replicate artist-quality drawings
4. **No Sprite Renderer:** Το Canvas API χρησιμοποιείται μόνο για primitives, όχι για `drawImage()`

---

## Key Files

| File | Lines | Purpose |
|------|-------|---------|
| `types.ts` | 114 | Data structures |
| `state.ts` | ~200 | State initialization |
| `update.ts` | ~400 | Physics & logic |
| `render.ts` | ~900 | Rendering pipeline |
| `sketchy.ts` | 2,300+ | Drawing primitives |
| `particles.ts` | ~300 | Particle effects |

---

## Architectural Gaps για Hybrid Model

Για να υποστηρίξουμε sprite-based character rendering, χρειαζόμαστε:

1. **Asset Loading System**
   - Load sprite sheets (PNG images)
   - Parse sprite sheet metadata (frame positions, sizes)

2. **Animation System**
   - Store animation state (current frame, elapsed time)
   - Switch between animations (coil, bolt, impact, idle)
   - Interpolate frames για smooth playback

3. **Sprite Renderer**
   - Replace procedural `drawZeno*()` calls με `drawSprite()` calls
   - Handle sprite positioning, rotation, scaling

4. **Hybrid Rendering Pipeline**
   - Render procedural background (platforms, clouds, UI)
   - Render sprite-based character on top
   - Maintain correct z-ordering

---

## Estimated Complexity

| Component | Complexity | Estimated Lines of Code |
|-----------|------------|-------------------------|
| Asset Loader | Low | ~50 |
| Sprite Class | Medium | ~100 |
| Animator Class | Medium | ~150 |
| Render Integration | Low | ~30 (modifications) |
| **Total** | **Medium** | **~330 new + 30 modified** |

---

## Conclusion

Το τρέχον architecture είναι **solid και extensible**. Η προσθήκη sprite support δεν απαιτεί rewrite, αλλά **incremental additions**. Το procedural rendering για platforms μπορεί να παραμείνει ως έχει, ενώ το character rendering μπορεί να γίνει sprite-based.

Αυτό είναι το **Hybrid Model** που προτείνουμε.
