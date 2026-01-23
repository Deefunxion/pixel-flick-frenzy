# Horizontal-Only View Design

## Overview

One-More-Flick transitions from dual portrait/landscape support to **horizontal-only**. This simplifies CSS, improves UX, and matches the game's natural 2:1 aspect ratio.

## Core Decisions

| Decision | Choice |
|----------|--------|
| Portrait visitors | Rotate screen overlay (Zeno spinning) |
| Desktop behavior | Always playable |
| Canvas sizing | Fit container (contain logic) |
| UI approach | Hamburger menu only |
| On-canvas HUD | Current elements + Last/High score |

---

## Mobile Portrait: Rotate Screen

When `window.innerHeight > window.innerWidth`:

**Visual:**
- Background: White (#f5f0e1 flipbook warmth)
- Zeno: Spinning animation using `/assets/sprites/zenoflip/zenotwist1-4.png` (4-frame loop)
- Phone icon: Animated rotation prompt
- Text: "Rotate for best experience!" (hand-drawn style)

**Behavior:**
- Game is NOT playable until device rotates
- Listens for orientation change to dismiss overlay

---

## Canvas Sizing: Fit Container

```
Logic:
- Calculate availableWidth and availableHeight of viewport
- If width/height > 2 → height is limiting → canvas height = 100%, width = height × 2
- If width/height < 2 → width is limiting → canvas width = 100%, height = width / 2
- Canvas is ALWAYS centered (flexbox)
- No cropping, no overflow
- Viewport-relative units for zoom compatibility
```

---

## On-Canvas HUD Layout

```
┌─────────────────────────────────────────────────────────────────┐
│ (●☰)  [Mini-Goal notifications]           HIGH: 419.99         │
│                                           LAST: 418.55         │
│                                                                 │
│ 🔥3                    ○    ○    ○                      🚩     │
│                       (rings)                    (420 + wind)   │
│                                                                 │
│     ████░░░░                                                    │
│    (power bar)            [ZENO]                                │
│                                                                 │
│▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│
│                         (void - 20-30% lower)                   │
└─────────────────────────────────────────────────────────────────┘
```

### Element Details

| Element | Position | Design |
|---------|----------|--------|
| Hamburger | Top-left | Circle badge with ☰, subtle drop shadow |
| Mini-goals | Top-center | With padding from edges, no overlap with hamburger |
| High/Last Score | Top-right | Existing box design |
| Flag | x=420 fixed | **Dual-purpose**: 420 goal marker + wind indicator |
| Streak | Left side | Existing 🔥 counter |
| Power bar | Near Zeno | Existing |
| Rings | Mid-air | Existing |

### Flag as Wind Indicator

The existing checkered flag at x=420 becomes dual-purpose:
- **Position**: Fixed at x=420 (goal marker)
- **Wave intensity**: 1-5 levels based on wind strength
- **Wave direction**: Left or right based on wind direction

---

## Hamburger Menu Contents

All external UI moves to slide-out menu:
- Stats button
- Leaderboard button
- Sound toggle
- Tutorial replay
- Theme toggle
- Quick stats (Target, Level, Score, Throws remaining)

---

## Removals

- ❌ TAP box on first hold (no value)
- ❌ Separate wind indicator box (replaced by flag)
- ❌ Portrait layout CSS (all media queries for portrait)
- ❌ External UI elements below canvas
- ❌ `external-ui` class system (no longer needed)

---

## Fixes

| Issue | Fix |
|-------|-----|
| PB notification overlaps hamburger | Offset PB notification position |
| Mini-goal stuck at edge | Add padding, better centering |
| Void/abyss too high | Move down 20-30% |
| Wind indicator doesn't match aesthetic | Replace with flag wave behavior |
| Hamburger not obviously clickable | Circle badge with drop shadow |

---

## Technical Approach

### CSS Simplification
- Remove all portrait media queries
- Single responsive rule: fit container with aspect-ratio 2/1
- Use `min()` and `max()` for sizing that works with zoom

### New Component: RotateScreen
- React component that renders when portrait detected
- Uses window resize/orientation listeners
- Renders Zeno flip animation + rotate prompt

### Flag Wind Animation
- Modify existing flag rendering in render.ts
- Add wave animation frames or procedural wave
- Intensity based on `state.wind` value

---

## File Changes Expected

| File | Changes |
|------|---------|
| `src/index.css` | Remove portrait queries, simplify to contain logic |
| `src/components/Game.tsx` | Remove external-ui, add RotateScreen |
| `src/components/RotateScreen.tsx` | **NEW** - Portrait overlay |
| `src/game/engine/render.ts` | Hamburger badge, flag wind, void position, remove TAP box |
| `src/game/engine/windFlag.ts` | **NEW** - Flag wave animation logic |
| `src/components/SlideOutMenu.tsx` | Already exists, may need minor updates |
