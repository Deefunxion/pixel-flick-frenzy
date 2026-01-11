# One-More-Flick: NOIR THEME Background Assets Specification

## Project Overview

**Game:** One-More-Flick
**Theme:** Noir Ink - Film noir aesthetic with dramatic lighting
**Canvas Size:** 480×240 pixels (game resolution)
**Asset Resolution:** 2x (960×480 base) for high-DPI display support

---

## CRITICAL: TRANSPARENCY REQUIREMENTS

> **EXTREMELY IMPORTANT - READ THIS FIRST**
>
> All assets EXCEPT the main background MUST have **TRUE TRANSPARENT BACKGROUNDS**.
>
> **DO NOT** deliver assets with:
> - White backgrounds
> - Off-white backgrounds
> - Any solid color backgrounds
> - Checkerboard patterns baked into the image
>
> **VERIFY TRANSPARENCY** by opening each PNG in an image editor and confirming the background shows the transparency checkerboard pattern, NOT a white fill.
>
> **File format:** PNG-24 with ALPHA CHANNEL (RGBA, not RGB)

---

## Visual Reference

The Noir theme is **high-contrast film noir** with:
- Deep black background with subtle radial gradient
- Dramatic spotlight effect from upper-right corner
- Cream/ivory colored elements (platform, clouds, flag)
- Golden accent color for highlights
- Film grain texture overlay
- Vignette darkening at edges
- Stark contrast between light elements and dark background

**Reference image:** `docs/_marketing_assets/game-screenshots-polished/noir-01-the-coil.png`

---

## Color Palette

| Color | Hex | RGB | Usage |
|-------|-----|-----|-------|
| **Deep Black** | `#0a0a0f` | 10, 10, 15 | Background base |
| **Gradient Dark** | `#151520` | 21, 21, 32 | Background gradient end |
| **Cream/Ivory** | `#e8e0d0` | 232, 224, 208 | Platform, clouds, elements |
| **Warm White** | `#f5f0e6` | 245, 240, 230 | Highlights on elements |
| **Shadow Gray** | `#2a2a35` | 42, 42, 53 | Shadows, depth |
| **Gold Accent** | `#e8943a` | 232, 148, 58 | Star, highlights |
| **Spotlight** | `#ffffff` at 10-20% opacity | - | Dramatic light beam |

---

## Technical Specifications (All Assets)

| Property | Specification |
|----------|---------------|
| **Format** | PNG-24 with ALPHA transparency (RGBA) |
| **Color Mode** | sRGB |
| **Bit Depth** | 8-bit per channel (32-bit total with alpha) |
| **Resolution** | 2x game resolution (see individual specs) |
| **Transparency** | **REQUIRED** - True alpha channel, NOT white background |
| **Anti-aliasing** | Soft edges with alpha fade (NOT hard edges on white) |
| **File naming** | lowercase-with-dashes.png |
| **Compression** | PNG compression, no lossy artifacts |

### How to Verify Correct Export

1. Open the exported PNG in Photoshop/GIMP/Figma
2. Hide all layers except the asset
3. Background should show **checkerboard pattern** (transparency)
4. If you see **white or any solid color**, the export is WRONG
5. Re-export with "Transparency" or "Alpha Channel" enabled

---

# ASSET GROUP 1: NOIR BACKGROUND

## 1.1 Main Background

**Purpose:** Base layer - dark gradient background with film noir atmosphere

| Property | Value |
|----------|-------|
| **Filename** | `noir-background.png` |
| **Dimensions** | 960×480 pixels (2x scale) |
| **Transparency** | **NO** - This is the only fully opaque asset |
| **Delivery** | Single static image |

### Visual Requirements:
- **Base color:** Deep black (#0a0a0f)
- **Gradient:** Subtle radial gradient, slightly lighter toward upper-right (#151520)
- **Spotlight effect:** Soft diagonal light beam from upper-right corner
  - Starts bright at corner, fades toward center
  - Color: White at 10-15% opacity
  - Creates dramatic noir lighting feel
- **Vignette:** Darker at all edges, especially corners (baked into background)
- **Texture:** Very subtle noise/grain texture embedded (not separate overlay)
- **NO game elements** - just the atmospheric background

### Reference sketch:
```
┌────────────────────────────────────────────────────────────┐
│▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░░░░░░░░░░░░░│
│▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░░░░░░░░░░░░ SPOT │
│▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░░░░░░░░░░░ LIGHT ░░░░│
│▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░░░░░░░░░░░░░░░░░░░░░░░░░░│
│▓▓▓ DARK ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│
│▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│
│▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│
│▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│
└────────────────────────────────────────────────────────────┘
       (▓ = dark, ░ = subtle spotlight glow from corner)
```

---

## 1.2 Noir Clouds

**Purpose:** Atmospheric clouds floating in the dark sky

| Property | Value |
|----------|-------|
| **Filenames** | `noir-cloud-large.png`, `noir-cloud-medium.png`, `noir-cloud-small.png` |
| **Dimensions** | Large: 280×140, Medium: 200×100, Small: 140×70 (all at 2x) |
| **Transparency** | **YES - TRANSPARENT BACKGROUND REQUIRED** |
| **Delivery** | 3 separate cloud variations |

### Visual Requirements:
- **Style:** Soft, painterly clouds with noir aesthetic
- **Color:** Cream/ivory (#e8e0d0) with subtle warm white highlights (#f5f0e6)
- **Edges:** Soft, feathered edges that fade to transparency (NOT hard edges)
- **Shading:** Subtle internal shadows using darker cream tones
- **NO outline** - soft, atmospheric shapes
- **Shape:** Puffy cumulus-style clouds, slightly stylized

### TRANSPARENCY CHECK:
```
CORRECT:                          WRONG:
┌──────────────┐                  ┌──────────────┐
│ ░░▓▓▓▓▓░░   │ <- checker       │  ▓▓▓▓▓▓▓▓▓▓ │ <- white fill
│░░▓▓▓▓▓▓▓░░ │    pattern       │ ▓▓▓▓▓▓▓▓▓▓▓ │    behind
│ ░░▓▓▓▓▓░░  │    behind        │  ▓▓▓▓▓▓▓▓▓  │    cloud
└──────────────┘    cloud         └──────────────┘
```

### Cloud style reference:
- Look at reference image - clouds are soft, atmospheric
- Multiple overlapping puffs creating organic shape
- Lighter on top (catching "moonlight"), slightly darker underneath
- Edges dissolve into transparency, not sharp cutoffs

---

## 1.3 Wind Effect Elements (Noir Style)

### 1.3a Wind Swoosh Lines

| Property | Value |
|----------|-------|
| **Filenames** | `noir-wind-swoosh-1.png`, `noir-wind-swoosh-2.png`, `noir-wind-swoosh-3.png` |
| **Dimensions** | ~300×60 each at 2x |
| **Transparency** | **YES - TRANSPARENT BACKGROUND REQUIRED** |

### Visual Requirements:
- **Style:** Elegant curved lines suggesting air movement
- **Color:** Cream (#e8e0d0) at varying opacity (50-80%)
- **Line weight:** Tapers from thick (~4px) to thin (~1px)
- **Shape:** Flowing S-curves, wind streaks
- **Edges:** Soft fade at ends, not abrupt cutoffs

### 1.3b Wind Particles (Noir)

| Property | Value |
|----------|-------|
| **Filenames** | `noir-particle-dust-1.png`, `noir-particle-dust-2.png`, `noir-particle-dust-3.png` |
| **Dimensions** | 16×16, 12×12, 8×8 at 2x |
| **Transparency** | **YES - TRANSPARENT BACKGROUND REQUIRED** |

### Visual Requirements:
- **Style:** Small dust motes, debris particles
- **Color:** Cream (#e8e0d0) at 60-80% opacity
- **Shape:** Soft circular or irregular organic shapes
- **NO hard edges** - everything fades to transparency

---

# ASSET GROUP 2: NOIR TERRAIN & CLIFF

## 2.1 Ground Terrain Strip (Noir)

**Purpose:** The illuminated platform/cliff the character stands on

| Property | Value |
|----------|-------|
| **Filename** | `noir-terrain-ground.png` |
| **Dimensions** | 960×120 pixels at 2x (full width, ground depth) |
| **Transparency** | **YES - TRANSPARENT BACKGROUND REQUIRED** |
| **Delivery** | Single horizontal strip |

### Visual Requirements:
- **Style:** Solid platform with dramatic lighting, slightly stylized rocky texture
- **Base color:** Cream/ivory (#e8e0d0) for the main lit surface
- **Top surface:** Flat or slightly textured, well-lit by spotlight
- **Underside/shadow:** Darker gray (#2a2a35) showing depth
- **Left edge:** Can extend off-canvas (will be cropped)
- **Right edge:** Leads into cliff edge (separate asset)
- **Texture:** Subtle rocky/concrete texture, not smooth
- **Lighting:** Brighter where spotlight would hit (right side), slightly darker left

### Structure (side view):
```
                                            (cliff edge here)
                                                    ↓
    ════════════════════════════════════════════════╗
    ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░║
    ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓║
    ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ SHADOW UNDERNEATH ▓▓▓▓▓▓▓▓▓▓▓║
                                                    ↓
    (░ = lit top surface cream, ▓ = shadow underneath)
```

### CRITICAL - Transparent areas:
- Above the platform: TRANSPARENT
- Below the shadow: TRANSPARENT
- The platform itself floats on transparency

---

## 2.2 Cliff Edge Detail (Noir)

**Purpose:** The dramatic vertical drop-off - noir aesthetic

| Property | Value |
|----------|-------|
| **Filename** | `noir-cliff-edge.png` |
| **Dimensions** | 240×400 pixels at 2x |
| **Transparency** | **YES - TRANSPARENT BACKGROUND REQUIRED** |
| **Delivery** | Single sprite |

### Visual Requirements:
- **Style:** Dramatic rocky cliff face descending into darkness
- **Top portion:** Connects with terrain strip (cream colored, lit)
- **Vertical face:** Rocky texture, progressively darker as it descends
- **Color gradient:**
  - Top: Cream (#e8e0d0) matching terrain
  - Middle: Transitioning to gray
  - Bottom: Fading into darkness/shadow (#2a2a35 → transparent)
- **Falling debris:** Small rocks appearing to fall (static positions)
- **Rocky details:** Cracks, ledges, irregular surface
- **Bottom edge:** Fades to transparency (dissolves into void)

### Structure:
```
        ╔════╗  <- connects to terrain (cream colored)
        ║    ║
        ╠══╗ ║  <- rocky ledges, details
        ║  ╚═╝
     ●  ║      <- falling debris elements
        ║
   ●    ╚══╗   <- progressively darker
           ║
      ●    ▒▒▒ <- fading into dark/transparent
           ░░░ <- dissolving edge (transparent)
```

---

## 2.3 Finish Flag (Noir)

**Purpose:** Checkered finish flag - noir styled

| Property | Value |
|----------|-------|
| **Filenames** | `noir-flag-frame-01.png` through `noir-flag-frame-04.png` |
| **Dimensions** | 80×120 each at 2x |
| **Transparency** | **YES - TRANSPARENT BACKGROUND REQUIRED** |
| **Delivery** | 4-frame flutter animation |

### Visual Requirements:
- **Pole:** Cream/ivory colored, simple vertical line with slight taper
- **Flag shape:** Classic racing checkered flag
- **Checkered pattern:**
  - Light squares: Cream (#e8e0d0)
  - Dark squares: Deep charcoal (#1a1a20) or shadow gray
- **Style:** Clean, graphic, high contrast
- **Animation:** 4 frames showing flag waving
  - Frame 1: Flag relatively still
  - Frame 2: Flag beginning to billow
  - Frame 3: Flag fully extended
  - Frame 4: Flag returning
- **Edges:** Clean but with slight soft edge (anti-aliased)

---

# ASSET GROUP 3: NOIR VOID/ABYSS

## 3.1 Void Atmosphere Layers (Noir)

**Purpose:** The dark abyss below the cliff - subtle depth layers

| Property | Value |
|----------|-------|
| **Filenames** | `noir-void-layer-1.png`, `noir-void-layer-2.png`, `noir-void-layer-3.png` |
| **Dimensions** | 1920×200 each at 2x (MUST tile seamlessly horizontally) |
| **Transparency** | **YES - TRANSPARENT BACKGROUND REQUIRED** |
| **Delivery** | 3 separate parallax layers |

### Critical: SEAMLESS HORIZONTAL TILING
Left edge must connect perfectly to right edge for infinite scrolling.

### Visual Requirements:

Unlike the flipbook theme's swirling clouds, the noir void is **more subtle and atmospheric**:

#### Layer 1 (Closest/Fastest)
- **Style:** Wisps of mist/fog drifting
- **Color:** Cream/gray (#e8e0d0) at 15-25% opacity
- **Shape:** Long, horizontal wisps, stretched fog
- **Density:** Sparse - 3-4 wisps across width
- **Position:** Upper portion of the 200px height

#### Layer 2 (Mid-depth)
- **Style:** Softer, more diffuse fog patches
- **Color:** Gray (#808080) at 10-15% opacity
- **Shape:** Amorphous fog patches
- **Density:** Moderate - 5-6 patches
- **Position:** Middle of height range

#### Layer 3 (Farthest/Slowest)
- **Style:** Very subtle, distant haze
- **Color:** Dark gray at 5-10% opacity
- **Shape:** Large, soft gradients suggesting depth
- **Density:** Dense but very subtle
- **Position:** Full height coverage

### The noir void is SUBTLE - it suggests depth through atmospheric haze, not dramatic swirls.

---

## 3.2 Void Gradient Overlay (Optional)

| Property | Value |
|----------|-------|
| **Filename** | `noir-void-gradient.png` |
| **Dimensions** | 960×200 at 2x |
| **Transparency** | Gradient to transparency |

### Visual Requirements:
- **Purpose:** Depth gradient for void area
- **Top:** Fully transparent
- **Bottom:** Very dark (#0a0a0f) at 30-40% opacity
- **Creates:** Sense of infinite dark depth below

---

# PROMPT GUIDE FOR AI IMAGE GENERATION

## CRITICAL INSTRUCTIONS FOR ALL PROMPTS

Add these instructions to EVERY prompt:

```
CRITICAL REQUIREMENTS:
- Export as PNG with TRUE TRANSPARENCY (alpha channel)
- DO NOT add white background
- DO NOT add any solid color background
- Background must be TRANSPARENT (checkered in editors)
- Verify transparency before delivery
```

---

## PROMPT 1: Noir Background

```
Dark film noir game background, deep black (#0a0a0f) with subtle gradient to
dark blue-black (#151520). Dramatic spotlight beam from upper right corner
casting soft diagonal light across the scene. Light beam is white at 10-15%
opacity, creating classic noir cinematography feel. Subtle vignette darkening
at edges. Very fine film grain texture embedded throughout. Moody, atmospheric,
cinematic. No game elements, just atmospheric background.

Style: film noir, cinematic, dramatic lighting, high contrast
Dimensions: 960x480 pixels
Format: PNG (this one CAN be opaque - no transparency needed)
Colors: Deep black (#0a0a0f), gradient to (#151520), white spotlight at low opacity
```

---

## PROMPT 2: Noir Terrain Platform and Cliff

```
Side-view game terrain platform for noir/dark theme. Cream/ivory colored
(#e8e0d0) solid cliff platform lit by dramatic spotlight. Rocky texture,
stylized but realistic. Top surface is well-lit, underside has dark shadow
(#2a2a35). Platform extends from left edge, ends at cliff drop-off on right.

ALSO CREATE: Cliff edge piece showing vertical rocky drop-off descending
into darkness. Top connects to platform (cream colored), progressively gets
darker descending, bottom edge fades/dissolves to transparency. Include
small falling rock debris details.

Style: film noir, dramatic lighting, high contrast, game asset
Dimensions: Platform 960x120, Cliff edge 240x400

CRITICAL:
- TRANSPARENT BACKGROUND (alpha channel PNG)
- NO white background
- Elements float on transparency
- Verify checkerboard shows in editor
```

---

## PROMPT 3: Noir Clouds and Atmospheric Elements

```
Three soft, atmospheric clouds for dark noir game theme. Cream/ivory color
(#e8e0d0) with warm white highlights. Soft, painterly style with feathered
edges that fade to transparency. Puffy cumulus shapes, slightly stylized.
Subtle internal shading. NO outlines - soft atmospheric shapes only.

Sizes needed:
- Large: 280x140 pixels
- Medium: 200x100 pixels
- Small: 140x70 pixels

Style: soft, atmospheric, film noir, painterly
Colors: Cream (#e8e0d0), warm white highlights (#f5f0e6)

CRITICAL:
- TRANSPARENT BACKGROUND (alpha channel PNG)
- Edges must FADE to transparency, not hard cutoff
- NO white background behind clouds
- Verify transparency with checkerboard test
```

---

## PROMPT 4: Noir Flag Animation

```
Checkered racing flag for dark noir game theme. 4-frame flutter animation.
Pole is cream/ivory colored, simple vertical line. Flag has checkered pattern
with cream (#e8e0d0) and dark charcoal (#1a1a20) squares. Clean, graphic,
high contrast noir style.

4 frames showing:
- Frame 1: Flag relatively still
- Frame 2: Flag beginning to wave
- Frame 3: Flag fully extended/billowing
- Frame 4: Flag returning to rest

Dimensions: 80x120 pixels each frame

CRITICAL:
- TRANSPARENT BACKGROUND on all frames
- NO white background
- Anti-aliased edges but clean shapes
```

---

## PROMPT 5: Noir Void/Mist Layers

```
Three horizontal seamless tileable strips of atmospheric mist/fog for dark
noir game void area. Subtle, atmospheric - NOT dramatic swirls. These
represent depth layers for parallax scrolling in a dark abyss.

Layer 1 (closest): Cream-colored wisps (#e8e0d0) at 15-25% opacity, sparse,
long horizontal fog streaks

Layer 2 (mid-depth): Gray fog patches (#808080) at 10-15% opacity, more
diffuse, amorphous shapes

Layer 3 (far): Very subtle dark gray haze at 5-10% opacity, large soft
gradients, barely visible

Each strip: 1920x200 pixels, MUST TILE SEAMLESSLY left-to-right

Style: atmospheric, subtle, film noir, misty
Colors: Cream to gray at very low opacity

CRITICAL:
- TRANSPARENT BACKGROUND
- Mist elements are semi-transparent and float on transparency
- Left edge must connect seamlessly to right edge
- Verify transparency - NO white or solid background
```

---

# DELIVERY CHECKLIST

## Asset Group 1: Noir Background & Sky
- [ ] `noir-background.png` (960×480) - OPAQUE allowed
- [ ] `noir-cloud-large.png` (280×140) - TRANSPARENT BG
- [ ] `noir-cloud-medium.png` (200×100) - TRANSPARENT BG
- [ ] `noir-cloud-small.png` (140×70) - TRANSPARENT BG
- [ ] `noir-wind-swoosh-1.png` (300×60) - TRANSPARENT BG
- [ ] `noir-wind-swoosh-2.png` (300×60) - TRANSPARENT BG
- [ ] `noir-wind-swoosh-3.png` (300×60) - TRANSPARENT BG
- [ ] `noir-particle-dust-1.png` (16×16) - TRANSPARENT BG
- [ ] `noir-particle-dust-2.png` (12×12) - TRANSPARENT BG
- [ ] `noir-particle-dust-3.png` (8×8) - TRANSPARENT BG

## Asset Group 2: Terrain & Cliff
- [ ] `noir-terrain-ground.png` (960×120) - TRANSPARENT BG
- [ ] `noir-cliff-edge.png` (240×400) - TRANSPARENT BG
- [ ] `noir-flag-frame-01.png` (80×120) - TRANSPARENT BG
- [ ] `noir-flag-frame-02.png` (80×120) - TRANSPARENT BG
- [ ] `noir-flag-frame-03.png` (80×120) - TRANSPARENT BG
- [ ] `noir-flag-frame-04.png` (80×120) - TRANSPARENT BG

## Asset Group 3: Void/Abyss
- [ ] `noir-void-layer-1.png` (1920×200, seamless) - TRANSPARENT BG
- [ ] `noir-void-layer-2.png` (1920×200, seamless) - TRANSPARENT BG
- [ ] `noir-void-layer-3.png` (1920×200, seamless) - TRANSPARENT BG
- [ ] `noir-void-gradient.png` (960×200) - TRANSPARENT BG (optional)

**Total: 20 assets**

---

# TRANSPARENCY VERIFICATION GUIDE

Before delivering ANY asset (except noir-background.png), verify:

### In Photoshop:
1. Open the PNG file
2. Look at Layers panel
3. Background should show checkered pattern
4. If you see solid white layer → RE-EXPORT

### In GIMP:
1. Open the PNG file
2. Go to Image → Flatten Image (DON'T do this - just check)
3. If it asks about background color → you have transparency (good)
4. Go to Image → Canvas Size and check if background is transparent

### In Figma:
1. Import the PNG
2. Select it and check if background is transparent
3. Place it over a dark rectangle to verify

### Quick Test:
1. Place the asset over a bright red background in any editor
2. If you see white rectangle around the asset → WRONG
3. If the asset floats on red → CORRECT

---

# INTEGRATION NOTES FOR DEVELOPER

## Asset Directory Structure
```
public/assets/background/noir/
├── noir-background.png
├── clouds/
│   ├── noir-cloud-large.png
│   ├── noir-cloud-medium.png
│   └── noir-cloud-small.png
├── terrain/
│   ├── noir-terrain-ground.png
│   └── noir-cliff-edge.png
├── flag/
│   ├── noir-flag-frame-01.png
│   ├── noir-flag-frame-02.png
│   ├── noir-flag-frame-03.png
│   └── noir-flag-frame-04.png
├── void/
│   ├── noir-void-layer-1.png
│   ├── noir-void-layer-2.png
│   ├── noir-void-layer-3.png
│   └── noir-void-gradient.png
└── wind/
    ├── noir-wind-swoosh-1.png
    ├── noir-wind-swoosh-2.png
    ├── noir-wind-swoosh-3.png
    ├── noir-particle-dust-1.png
    ├── noir-particle-dust-2.png
    └── noir-particle-dust-3.png
```

## Render Layer Order (back to front)
1. `noir-background.png` - static, opaque base
2. `noir-void-layer-3.png` - parallax scroll (slowest)
3. `noir-void-layer-2.png` - parallax scroll
4. `noir-void-layer-1.png` - parallax scroll (fastest)
5. `noir-void-gradient.png` - static depth overlay
6. `noir-cloud-*.png` (×3) - drift with wind
7. `noir-terrain-ground.png` - static platform
8. `noir-cliff-edge.png` - static, at cliff x coordinate
9. `noir-flag-frame-*.png` - animated flutter
10. Wind swooshes - spawn/fade dynamically
11. Wind particles - physics-driven drift
12. Film grain overlay - procedural (code)
13. Vignette - procedural (code)

---

*Document created: 2026-01-11*
*Game: One-More-Flick - Noir Theme*
*Canvas: 480×240 | Assets: 2x resolution*
