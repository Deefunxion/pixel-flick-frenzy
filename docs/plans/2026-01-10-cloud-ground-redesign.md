# Cloud & Ground Redesign

## Overview

Debloat sketchy.ts cloud functions and restore the original game concept: player jumps from ground toward a cliff edge (not cloud platforms). Clouds become purely decorative sky elements that indicate wind direction.

## Original Concept (Restored)

- Player stands on **ground** (solid earth)
- Jumps/flicks toward a **cliff edge** where the flag is
- **Danger**: falling off the cliff
- **Clouds**: decorative, drift with wind to show wind direction

## New Functions

### 1. `drawGround(ctx, groundY, cliffEdgeX, color, nowMs)`

Draws the ground and cliff edge.

**Elements:**
- Horizontal sketchy ground line from x=0 to cliffEdgeX (420)
- Vertical cliff drop-off line at cliffEdgeX
- Cross-hatching underneath (earth texture, alpha ~0.2-0.3)
- Sparse grass scribbles on top (every 30-40px)

```
    ///  //   ///  //        <- grass scribbles
================================  <- ground line (ends at cliff)
   /////////////////////////////  |
  //////// cross-hatch ///////   |  <- cliff drop
 /////////////////////////////   |
                                 v
```

### 2. `drawSkyCloud(ctx, x, y, size, color, nowMs)`

Draws a clean decorative cloud.

**Shape - 5 circles with fixed proportions:**
```typescript
const puffs = [
  { dx: -0.35, dy: 0,     r: 0.3  },  // left
  { dx: -0.1,  dy: -0.2,  r: 0.35 },  // top-left
  { dx: 0.2,   dy: -0.15, r: 0.32 },  // top-right
  { dx: 0.4,   dy: 0.05,  r: 0.28 },  // right
  { dx: 0.05,  dy: 0.15,  r: 0.25 },  // bottom-center
];
```

**Drawing:**
- Each puff: `drawHandCircle` (outline only, not filled)
- One small curl on left edge, one on right
- Minimal wobble - keep it clean
- No cross-hatching fill (keeps clouds light/airy)

**Wind behavior:**
- Cloud x-position drifts: `x + (nowMs * windSpeed * windDirection)`
- Wraps around screen edges
- 3-4 clouds at different heights/sizes

## Deleted Functions

| Function | Reason |
|----------|--------|
| `drawCloudPlatform` | Cloud platforms removed from concept |
| `drawDetailedCloud` | Replaced by `drawSkyCloud` + `drawGround` |
| `drawCloud` (maybe) | If redundant with `drawSkyCloud` |

## File Changes

### sketchy.ts

**Remove:**
- `drawCloud` (~lines 758-788)
- `drawCloudPlatform` (~lines 790-860)
- `drawDetailedCloud` (~lines 2219-2310)

**Add:**
- `drawGround` function
- `drawSkyCloud` function

### render.ts

**In `renderFlipbookFrame`:**

Remove:
```typescript
// Lines 86-97 - cloud platform and decorative cloud calls
drawDetailedCloud(ctx, 70, groundY - 5, 120, 35, COLORS.player, nowMs, true);
drawDetailedCloud(ctx, 220, groundY - 50, 80, 25, COLORS.accent3, nowMs, false);
drawDetailedCloud(ctx, 380, groundY - 5, 100, 35, COLORS.player, nowMs, true);
drawCloud(ctx, 150, 60, 15, COLORS.accent3, 2, nowMs);
drawCloud(ctx, 320, 45, 12, COLORS.accent3, 1.5, nowMs);
drawCloud(ctx, 450, 70, 10, COLORS.accent3, 1.5, nowMs);
```

Add:
```typescript
// Ground and cliff
drawGround(ctx, groundY, CLIFF_EDGE, COLORS.player, nowMs);

// Wind-drifting sky clouds
const windOffset = (nowMs / 50) * state.wind;
drawSkyCloud(ctx, 120 + (windOffset % W), 55, 25, COLORS.accent3, nowMs);
drawSkyCloud(ctx, 280 + (windOffset % W), 70, 20, COLORS.accent3, nowMs);
drawSkyCloud(ctx, 400 + (windOffset % W), 50, 18, COLORS.accent3, nowMs);
```

**In `renderNoirFrame`:**
- Adapt similarly or keep angular noir platforms (TBD based on preference)

## Visual Reference

Target aesthetic from `/docs/_marketing_assets/game-screenshots-polished/flipbook-01-the-coil (Small).png`:
- Clean blue ink outlines
- Notebook paper background
- Simple, charming hand-drawn feel
- Clouds: distinct circular bumps, small curls, no fill
