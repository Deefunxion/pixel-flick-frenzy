# One-More-Flick: Background Art Assets Specification

## Project Overview

**Game:** One-More-Flick
**Art Style:** Hand-drawn notebook doodle aesthetic (ballpoint pen on aged paper)
**Canvas Size:** 480×240 pixels (game resolution)
**Asset Resolution:** 2x (960×480 base) for high-DPI display support
**Color Palette:** Blue ink primary (#1a4a7a), cream paper (#f5f0e6), accent orange (#e8943a)

---

## Visual Reference

The art style is **ballpoint pen doodles on notebook paper** - the look of something sketched during class:
- Organic, imperfect line work (not perfectly straight)
- Layered strokes showing "redrawn" lines
- Slight wobble and character to all edges
- Blue ink with occasional darker emphasis strokes
- Cream/aged paper with subtle wear marks

---

## Technical Specifications (All Assets)

| Property | Specification |
|----------|---------------|
| **Format** | PNG-24 with alpha transparency |
| **Color Mode** | sRGB |
| **Resolution** | 2x game resolution (see individual specs) |
| **Transparency** | Required for all except paper background |
| **Anti-aliasing** | Soft edges preferred (will be rendered on canvas) |
| **File naming** | lowercase-with-dashes.png |

---

# ASSET GROUP 1: PAPER BACKGROUND & SKY

## 1.1 Paper Background

**Purpose:** Base layer - aged notebook paper with ruled lines and binder holes

| Property | Value |
|----------|-------|
| **Filename** | `paper-background.png` |
| **Dimensions** | 960×480 pixels |
| **Transparency** | None (fully opaque) |
| **Delivery** | Single static image |

### Visual Requirements:
- **Paper color:** Aged cream/ivory (#f5f0e6 to #ebe5d9)
- **Texture:** Subtle paper grain, occasional coffee/ink stains, light smudges
- **Ruled lines:** Horizontal blue lines (#a8c4e0), ~18px apart at 2x scale
- **Margin line:** Vertical red/pink line (#d4a0a0), positioned ~80px from left edge
- **Binder holes:** 4-5 circular holes along left margin
  - Diameter: ~40px each at 2x
  - Include shadow/depth to show hole punched through paper
  - Dark interior (#2a2520)
- **Weathering:** Slightly darker/yellowed at edges, subtle fold marks acceptable

### Reference sketch:
```
┌────────────────────────────────────────────────────────────┐
│ ●  │                                                       │
│    │  ─────────────────────────────────────────────────    │
│ ●  │                                                       │
│    │  ─────────────────────────────────────────────────    │
│ ●  │                                                       │
│    │  ─────────────────────────────────────────────────    │
│ ●  │         [aged cream paper with subtle stains]         │
│    │  ─────────────────────────────────────────────────    │
│ ●  │                                                       │
└────────────────────────────────────────────────────────────┘
```

---

## 1.2 Sky Clouds (Decorative)

**Purpose:** Floating doodle clouds in the sky area, wind-responsive

| Property | Value |
|----------|-------|
| **Filenames** | `cloud-large.png`, `cloud-medium.png`, `cloud-small.png` |
| **Dimensions** | Large: 280×140, Medium: 200×100, Small: 140×70 (all at 2x) |
| **Transparency** | Full alpha, only cloud shape visible |
| **Delivery** | 3 separate cloud variations |

### Visual Requirements:
- **Style:** Elaborate doodle clouds with personality
- **Line color:** Blue ink (#1a4a7a) with stroke width ~4-6px at 2x
- **Interior details:** Spiral curls, scribble shading, layered puff outlines
- **NO fill:** Outline/stroke only, interior shows through to paper
- **Character:** Whimsical, playful - like doodled during daydreaming
- **Variations:** Each cloud should have unique shape and personality

### Cloud anatomy:
```
        ╭───╮
    ╭──╮│ @ │╭──╮      <- spiral curl details inside
   ╭╯~~╰┴───┴╯~~╰╮     <- multiple overlapping puff outlines
  ╭╯  ~~~~~~     ╰╮    <- scribble texture
  ╰───────────────╯
```

### Specific cloud personalities:
1. **Large cloud:** Puffy cumulus style, 4-5 overlapping puffs, elaborate spiral details inside, small decorative curls at edges
2. **Medium cloud:** Slightly elongated, 3-4 puffs, wind-swept appearance, trailing wisps
3. **Small cloud:** Simple 2-3 puff cloud, minimal interior detail, accent piece

---

## 1.3 Wind Effect Elements

**Purpose:** Visual indicators of wind direction and strength

### 1.3a Wind Swoosh Lines

| Property | Value |
|----------|-------|
| **Filenames** | `wind-swoosh-1.png`, `wind-swoosh-2.png`, `wind-swoosh-3.png` |
| **Dimensions** | ~300×60 each at 2x |
| **Transparency** | Full alpha |
| **Delivery** | 3 variations of swoosh lines |

### Visual Requirements:
- **Style:** Dynamic curved lines suggesting air movement
- **Line weight:** Tapers from thick (~6px) to thin (~2px)
- **Color:** Light blue ink (#4a7ab0) with ~70% opacity feel
- **Shape:** Elegant S-curves or flowing arcs
- **Variations:** Different curve angles and lengths
- **Details:** Small speed lines, tiny trailing marks

### 1.3b Wind Particles

| Property | Value |
|----------|-------|
| **Filenames** | `particle-paper-scrap.png`, `particle-leaf.png`, `particle-dust-1.png`, `particle-dust-2.png` |
| **Dimensions** | 16×16 to 32×32 each at 2x |
| **Transparency** | Full alpha |
| **Delivery** | 4 small particle sprites |

### Visual Requirements:
- **Paper scrap:** Tiny torn notebook paper piece, cream with hint of blue line
- **Leaf:** Simple doodle leaf shape, could be mid-tumble rotation
- **Dust particles:** Abstract small scribble marks, varied shapes
- **Style:** Quick sketchy marks, very simple, will be small on screen

---

# ASSET GROUP 2: TERRAIN & CLIFF

## 2.1 Ground Terrain Strip

**Purpose:** The main platform/ground the character stands on

| Property | Value |
|----------|-------|
| **Filename** | `terrain-ground.png` |
| **Dimensions** | 960×100 pixels at 2x (full width, ground depth) |
| **Transparency** | Alpha on top edge (grass/texture), solid below |
| **Delivery** | Single horizontal strip |

### Visual Requirements:
- **Style:** Abstract doodle pattern - artistic, not realistic
- **Top edge:** Organic hand-drawn line (not perfectly straight), small grass tufts/scribbles
- **Fill pattern:** Decorative scribbles, crosshatch variations, doodle patterns
- **Color:** Blue ink (#1a4a7a), varied stroke weights for depth
- **Progressive degradation:**
  - LEFT SIDE (0-60%): Solid, confident strokes, stable appearance
  - MIDDLE (60-85%): Cracks appear, pattern becomes less dense
  - RIGHT EDGE (85-100%): Crumbling, gaps in pattern, unstable feel

### Degradation visualization:
```
[SOLID/SAFE]          [CRACKING]           [CRUMBLING]
╔═══════════════╦═══════════════╦═══════════════╗
║ Dense doodle  ║ Cracks appear ║ Broken chunks ║
║ scribbles     ║ gaps forming  ║ falling away  ║
║ confident     ║ uncertain     ║ dangerous     ║
╚═══════════════╩═══════════════╩═══════════════╝
                                              ↓
                                         (cliff edge)
```

---

## 2.2 Cliff Edge Detail

**Purpose:** The dramatic vertical drop-off at the right edge of the platform

| Property | Value |
|----------|-------|
| **Filename** | `cliff-edge.png` |
| **Dimensions** | 200×300 pixels at 2x |
| **Transparency** | Full alpha (irregularly shaped) |
| **Delivery** | Single sprite |

### Visual Requirements:
- **Position:** Overlaps end of terrain strip, extends downward
- **Style:** Crumbling rocky cliff edge drawn as doodle
- **Top portion:** Connects seamlessly with terrain strip's crumbling right edge
- **Vertical face:** Rough, irregular rock face with cracks, loose stones
- **Falling debris:** Small rocks/chunks appearing to fall (static positions suggesting motion)
- **Line work:** Heavier strokes for main cliff body, lighter for loose debris
- **Depth:** Some cross-hatching or shading to suggest 3D depth

### Structure:
```
        ╔════╗  <- connects to terrain
        ║    ║
        ╠══╗ ║  <- crumbling rocks
        ║  ╚═╝
     ●  ║      <- falling debris (small rocks)
        ║
   ●    ╚══╗   <- irregular rock face
           ║
      ●    ╚═══ <- trailing into void
```

---

## 2.3 Finish Flag

**Purpose:** The checkered finish flag marking the target/goal area

| Property | Value |
|----------|-------|
| **Filenames** | `flag-frame-01.png` through `flag-frame-04.png` |
| **Dimensions** | 80×120 each at 2x |
| **Transparency** | Full alpha |
| **Delivery** | 4-frame flutter animation |

### Visual Requirements:
- **Pole:** Hand-drawn vertical line, slightly wobbly, ~6px wide
- **Flag shape:** Classic checkered racing flag
- **Checkered pattern:** Hand-drawn squares, imperfect grid (doodle style)
- **Colors:** Blue ink squares, white/paper squares
- **Animation:** 4 frames showing flag fluttering in wind
  - Frame 1: Flag relatively still
  - Frame 2: Flag beginning to billow
  - Frame 3: Flag fully extended
  - Frame 4: Flag returning

### Frame sequence:
```
Frame 1    Frame 2    Frame 3    Frame 4
  │╔═╗       │╔══╗      │╔═══╗     │╔══╗
  │║ ║       │║  ║      │║   ║     │║  ║
  │╚═╝       │╚══╝       ╚═══╝     │╚══╝
  │          │          │          │
```

---

# ASSET GROUP 3: VOID/ABYSS

## 3.1 Void Swirl Layers

**Purpose:** The dramatic swirling abyss below the cliff - creates sense of infinite depth and danger

| Property | Value |
|----------|-------|
| **Filenames** | `void-layer-1.png`, `void-layer-2.png`, `void-layer-3.png` |
| **Dimensions** | 1920×200 each at 2x (MUST tile seamlessly horizontally) |
| **Transparency** | Full alpha (swirls only, rest transparent) |
| **Delivery** | 3 separate parallax layers |

### Critical Requirement: SEAMLESS HORIZONTAL TILING
Each layer scrolls infinitely. Left edge must connect perfectly to right edge.

### Visual Requirements:

#### Layer 1 (Closest/Fastest)
- **Swirl size:** Large (60-100px diameter swirls)
- **Density:** Sparse - 4-6 swirls across the width
- **Line weight:** Heavy strokes (6-8px at 2x)
- **Color:** Blue ink (#1a4a7a), full opacity
- **Style:** Bold spiral swirls with decorative curl ends
- **Position:** Mostly in upper portion of the 200px height

#### Layer 2 (Mid-depth)
- **Swirl size:** Medium (40-60px diameter)
- **Density:** Moderate - 8-10 swirls across width
- **Line weight:** Medium strokes (4-5px)
- **Color:** Blue ink, ~80% opacity appearance
- **Style:** Mix of spirals and flowing curves
- **Position:** Middle of the height range

#### Layer 3 (Farthest/Slowest)
- **Swirl size:** Small (20-35px diameter)
- **Density:** Dense - 12-15 swirls across width
- **Line weight:** Thin strokes (2-3px)
- **Color:** Blue ink, ~50-60% opacity appearance
- **Style:** Simple spirals, suggesting distant mist
- **Position:** Distributed across full height, more at bottom

### Layer composition example:
```
Layer 1 (front):    @       @           @        @
Layer 2 (mid):        ○   ○     ○   ○      ○   ○    ○
Layer 3 (back):     · · · · · · · · · · · · · · · · · ·
                    ─────────────────────────────────────
                                 (bottom edge)
```

### Swirl style reference:
```
    ╭──────╮
   ╭╯  ╭─╮ │     <- outer spiral arm
   │  ╭╯ │ │     <- inner curl
   │  ╰──╯ │     <- center point
   ╰───────╯     <- decorative tail/wisps
       ~~~
```

---

## 3.2 Void Atmosphere (Optional Enhancement)

| Property | Value |
|----------|-------|
| **Filename** | `void-gradient.png` |
| **Dimensions** | 960×200 at 2x |
| **Transparency** | Gradient alpha |
| **Delivery** | Single gradient overlay |

### Visual Requirements:
- **Purpose:** Subtle depth gradient over void area
- **Top:** Fully transparent
- **Bottom:** Light fog tint (very subtle cream/white, ~10% opacity)
- **Creates:** Sense of atmospheric depth/fog in the abyss

---

# PROMPT GUIDE FOR AI IMAGE GENERATION

Below are three prompts optimized for AI image generation tools (Midjourney, DALL-E, Stable Diffusion, etc.). Adjust style parameters for your preferred tool.

---

## PROMPT 1: Paper Background & Sky Elements

```
Hand-drawn notebook paper background, aged cream paper with subtle coffee stains
and ink smudges, blue horizontal ruled lines, red vertical margin line on left,
4-5 circular binder holes punched along left edge with shadowed depth,
weathered edges. Include 3 whimsical doodle clouds drawn in blue ballpoint pen
ink, outline style only with spiral curl details inside, no fill. Playful
sketch aesthetic like classroom doodling. Top-down flat view, 16:9 aspect ratio.

Style: ballpoint pen sketch, notebook doodle, hand-drawn illustration
Colors: cream paper (#f5f0e6), blue ink (#1a4a7a), red margin (#d4a0a0)
```

---

## PROMPT 2: Terrain, Cliff & Flag

```
Side-view game terrain platform drawn in blue ballpoint pen on notebook paper.
Abstract doodle art style with decorative scribble patterns filling the ground.
Left side is solid and confident strokes, progressively crumbling and broken
toward the right edge where a dramatic cliff drops off. Vertical cliff face
shows rough rocky texture with small falling debris/rocks. A hand-drawn
checkered racing flag on a wobbly pole stands near the cliff edge. Doodle
aesthetic with imperfect hand-drawn lines, artistic and playful.
Transparent background.

Style: ballpoint pen sketch, notebook doodle, game asset
Colors: blue ink (#1a4a7a) on transparent
```

---

## PROMPT 3: Void/Abyss Swirling Clouds

```
Three horizontal seamless tileable strips of swirling mist/clouds, drawn in
blue ballpoint pen doodle style. Each strip represents a different depth layer
for parallax scrolling: Layer 1 has large bold spiral swirls (60-100px),
Layer 2 has medium spirals (40-60px), Layer 3 has small distant spirals
(20-35px). Swirls have decorative curl ends and flowing tails. Creates sense
of mysterious abyss depth. Each strip must tile seamlessly left-to-right.
Transparent background, outline style only.

Style: ballpoint pen sketch, spiral doodles, seamless pattern
Colors: blue ink (#1a4a7a) on transparent
Dimensions: Wide horizontal strips (1920px wide concept)
```

---

# DELIVERY CHECKLIST

## Asset Group 1: Paper & Sky
- [ ] `paper-background.png` (960×480)
- [ ] `cloud-large.png` (280×140)
- [ ] `cloud-medium.png` (200×100)
- [ ] `cloud-small.png` (140×70)
- [ ] `wind-swoosh-1.png` (300×60)
- [ ] `wind-swoosh-2.png` (300×60)
- [ ] `wind-swoosh-3.png` (300×60)
- [ ] `particle-paper-scrap.png` (32×32)
- [ ] `particle-leaf.png` (24×24)
- [ ] `particle-dust-1.png` (16×16)
- [ ] `particle-dust-2.png` (16×16)

## Asset Group 2: Terrain & Cliff
- [ ] `terrain-ground.png` (960×100)
- [ ] `cliff-edge.png` (200×300)
- [ ] `flag-frame-01.png` (80×120)
- [ ] `flag-frame-02.png` (80×120)
- [ ] `flag-frame-03.png` (80×120)
- [ ] `flag-frame-04.png` (80×120)

## Asset Group 3: Void/Abyss
- [ ] `void-layer-1.png` (1920×200, seamless)
- [ ] `void-layer-2.png` (1920×200, seamless)
- [ ] `void-layer-3.png` (1920×200, seamless)
- [ ] `void-gradient.png` (960×200, optional)

**Total: 21 assets (20 required + 1 optional)**

---

# INTEGRATION NOTES FOR DEVELOPER

## Asset Directory Structure
```
public/assets/background/
├── paper-background.png
├── clouds/
│   ├── cloud-large.png
│   ├── cloud-medium.png
│   └── cloud-small.png
├── terrain/
│   ├── terrain-ground.png
│   └── cliff-edge.png
├── flag/
│   ├── flag-frame-01.png
│   ├── flag-frame-02.png
│   ├── flag-frame-03.png
│   └── flag-frame-04.png
├── void/
│   ├── void-layer-1.png
│   ├── void-layer-2.png
│   ├── void-layer-3.png
│   └── void-gradient.png
└── wind/
    ├── wind-swoosh-1.png
    ├── wind-swoosh-2.png
    ├── wind-swoosh-3.png
    ├── particle-paper-scrap.png
    ├── particle-leaf.png
    ├── particle-dust-1.png
    └── particle-dust-2.png
```

## Render Layer Order (back to front)
1. `paper-background.png` - static
2. `void-layer-3.png` - parallax scroll (slowest, 0.3x wind)
3. `void-layer-2.png` - parallax scroll (0.6x wind)
4. `void-layer-1.png` - parallax scroll (fastest, 1.0x wind)
5. `void-gradient.png` - static overlay (optional)
6. `cloud-*.png` (×3) - drift with wind, stretch based on intensity
7. `terrain-ground.png` - static
8. `cliff-edge.png` - static, positioned at cliff x coordinate
9. `flag-frame-*.png` - animated, flutter speed based on wind
10. Wind swooshes - spawn/fade dynamically
11. Wind particles - physics-driven drift

## Animation Speeds
- **Flag flutter:** 150ms per frame (baseline), faster with stronger wind
- **Void parallax:** Layer 1: 2px/frame, Layer 2: 1.2px/frame, Layer 3: 0.6px/frame (at max wind)
- **Cloud drift:** 0.5-1.5px/frame based on wind strength
- **Wind swoosh:** Fade in over 300ms, visible 800ms, fade out 300ms
- **Particles:** Spawn rate scales with wind strength, lifetime 2-4 seconds

---

*Document created: 2026-01-11*
*Game: One-More-Flick*
*Canvas: 480×240 | Assets: 2x resolution*
