# Three Iconic Poses - Design Document

> **Date:** 2026-01-10
> **Status:** Approved
> **Purpose:** Integrate Art Direction 2.0 into the game's procedural rendering - enhanced poses with pen-on-notebook aesthetic

---

## Overview

Replace the current generic stick figure animations with three distinct, superhero-inspired poses that match the approved artwork:

1. **The Coil** (charging) - Compressed spring energy, ready to explode
2. **The Bolt** (flight) - Streamlined motion, forward momentum
3. **The Impact** (landing) - Classic three-point superhero landing

All visuals maintain the hand-drawn pen-on-notebook aesthetic at 480x240 resolution.

---

## Reference Assets

| Pose | Reference File | Key Elements |
|------|---------------|--------------|
| The Coil | `assets/icons/noir/zeno-windup-noir.png` | Spring torso, spiral orbits, back leg extended |
| The Bolt | `assets/brand/promotional-three-poses-flipbook.png` | Running stride, arms pumping, diagonal momentum |
| The Impact | `assets/icons/flipbook/zeno-landing-flipbook.png` | Three-point landing, ground cracks, dust puffs |

---

## Pose 1: The Coil (Charging)

### Body Position
- **Stance:** Deep crouch, very low center of gravity
- **Back leg:** Extended FAR behind (sprinter in starting blocks)
- **Front leg:** Bent at ~90°, foot planted at cliff edge
- **Torso:** Twisted slightly, showing coiled tension
- **Arms:** One pulled back (fist clenched), other forward for balance
- **Head:** Looking forward at target, determined expression

### Energy Effects
- **Spiral rings:** 2-3 orbiting ellipses around the figure, rotating slowly
- **Spring tension lines:** Zig-zag marks along extended back leg
- **Ground dust:** Small scribble marks at back foot (power gathering)
- **Intensity scaling:** All effects intensify with charge level (0-1)

### Animation Behavior
- Figure compresses more as charge builds (existing squash: 70% at full)
- Spirals rotate faster at higher charge
- Spring lines become more pronounced
- Ground dust expands

### Function Signature
```typescript
drawZenoCoil(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  color: string,
  nowMs: number,
  chargePower: number,      // 0-1
  themeKind: 'flipbook' | 'noir'
)
```

---

## Pose 2: The Bolt (Flight)

### Flight Phases

#### Phase: Rising (vy < -2)
- **Body:** Stretched horizontally, streamlined
- **Arms:** One extended straight forward (Superman), other back along body
- **Legs:** Together, trailing behind
- **Angle:** Slight upward tilt following velocity

#### Phase: Mid-Flight (|vy| < 2)
- **Body:** Running stride through air
- **Arms:** Pumping motion (alternating forward/back)
- **Legs:** Alternating stride (one forward, one back)
- **Angle:** Horizontal, forward lean

#### Phase: Falling (vy > 2)
- **Body:** Preparing for landing
- **Arms:** Spreading outward for balance
- **Legs:** Beginning to separate, knees bending
- **Angle:** Slight downward tilt

### Energy Effects
- **Speed lines:** Horizontal streaks trailing behind (enhance existing `drawSpeedLines`)
- **Ghost trail:** Sharper, more defined echo figures (enhance existing `drawGhostFigure`)
- **Whoosh marks:** Small curved scribbles at high velocity
- **Intensity scaling:** Effects scale with speed magnitude

### Animation Behavior
- Smooth interpolation between phases based on velocity
- Arm/leg positions respond to vx/vy direction
- Ghost trail spacing tightens at higher speeds

### Function Signature
```typescript
drawZenoBolt(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  color: string,
  nowMs: number,
  velocity: { vx: number; vy: number },
  themeKind: 'flipbook' | 'noir'
)
```

---

## Pose 3: The Impact (Landing)

### Body Position (Three-Point Landing)
- **Left knee:** DOWN, touching ground
- **Right leg:** Extended to the side for stability
- **Left hand:** PLANTED on ground, fingers splayed
- **Right arm:** UP and back for dramatic balance
- **Torso:** Low, absorbing impact
- **Head:** Looking up, triumphant expression (confident smirk)

### Energy Effects
- **Ground cracks:** 5-7 lines radiating outward from impact point (hand + knee)
- **Dust puffs:** 3-4 small scribble cloud circles around landing zone
- **Impact burst:** Short radiating dashes (starburst pattern)
- **Debris particles:** Tiny dots/specks flying upward

### Animation Sequence
| Frames | Action |
|--------|--------|
| 0-3 | Maximum squash, cracks appear instantly, dust starts |
| 4-8 | Recovery - figure rises slightly, cracks fade, dust expands then settles |
| 9-12 | Settle - dust dissipates, figure holds proud pose |
| 13+ | Transition to idle or reset |

### Function Signature
```typescript
drawZenoImpact(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  color: string,
  nowMs: number,
  landingFrame: number,     // frames since landing
  themeKind: 'flipbook' | 'noir'
)
```

---

## Supporting Effect Functions

### Energy Spirals (for The Coil)
```typescript
drawEnergySpirals(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  intensity: number,        // 0-1 charge level
  color: string,
  nowMs: number,
  themeKind: 'flipbook' | 'noir'
)
```
- 2-3 elliptical orbits at different angles
- Rotation speed increases with intensity
- Flipbook: blue ink, thicker strokes
- Noir: white/cream, thinner, glowing

### Ground Cracks (for The Impact)
```typescript
drawGroundCracks(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  frame: number,
  color: string,
  themeKind: 'flipbook' | 'noir'
)
```
- 5-7 radiating lines from center point
- Lines have slight wobble (hand-drawn feel)
- Fade out over frames 0-12
- Flipbook: pencil-gray cracks
- Noir: bright white cracks

### Dust Puffs (for The Impact)
```typescript
drawDustPuffs(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  frame: number,
  color: string,
  themeKind: 'flipbook' | 'noir'
)
```
- 3-4 small scribble circles
- Expand outward and upward over time
- Fade to transparent
- Hand-drawn wobbly circles (use existing `drawHandCircle`)

---

## Integration Plan

### render.ts Changes

Replace current `drawStickFigure` calls with pose-specific routing:

```typescript
// In player rendering section
if (state.charging) {
  drawZenoCoil(ctx, px, py, color, nowMs, state.chargePower, themeKind);
} else if (state.flying) {
  drawZenoBolt(ctx, px, py, color, nowMs, { vx: state.vx, vy: state.vy }, themeKind);
} else if (state.landingFrame > 0 && state.landingFrame < 15) {
  drawZenoImpact(ctx, px, py, color, nowMs, state.landingFrame, themeKind);
} else {
  drawStickFigure(ctx, px, py, color, nowMs, 'idle', 0, { vx: 0, vy: 0 }, 0);
}
```

### State Changes (types.ts)

No new state fields required - existing fields sufficient:
- `charging` + `chargePower` → The Coil
- `flying` + `vx`/`vy` → The Bolt
- `landingFrame` → The Impact

### Backward Compatibility

- Keep existing `drawStickFigure` for idle state and failure animations
- New functions are additive, not replacements
- Existing squash/stretch logic preserved where applicable

---

## Theme Variations

### Flipbook Theme
- Blue ink color (`#1a4a7a`)
- Thicker strokes (2.5px primary)
- Visible wobble on all lines
- Graphite shadow layers
- Warmer dust/debris tones

### Noir Theme
- Off-white color (`#e8e4e0`)
- Thinner, sharper strokes (1.5-2px)
- Subtle glow effect on energy
- Higher contrast effects
- Cooler, more dramatic lighting feel

---

## Success Criteria

1. The Coil pose clearly communicates "compressed spring about to explode"
2. The Bolt pose shows controlled, intentional flight (not falling)
3. The Impact pose reads as triumphant superhero landing
4. All effects maintain pen-on-notebook aesthetic
5. Smooth transitions between poses
6. Performance: maintains 60fps with all effects
7. Works correctly in both Flipbook and Noir themes
8. Respects `reduceFx` setting (simplified effects when enabled)

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/game/engine/sketchy.ts` | Add new pose functions + effect functions |
| `src/game/engine/render.ts` | Route to new pose functions based on state |

---

## Out of Scope

- Changing the existing idle animation
- Modifying failure animations (tumble, dive)
- Adding new game states
- Changing physics or gameplay mechanics
- App icon generation (already handled)
