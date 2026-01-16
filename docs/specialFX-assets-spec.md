# Special Effects Assets Specification

## Overview

This document specifies all visual effects assets needed for **One-More-Flick** game. Assets are required for **two visual themes**: Flipbook (colorful, hand-drawn sketch style) and Noir (high-contrast, black ink film noir style).

**CRITICAL REQUIREMENTS:**
- All assets must have **transparent backgrounds** (PNG-24 with alpha channel)
- NO white backgrounds - everything must layer correctly over the game background
- Test transparency by placing assets over colored backgrounds before delivery

---

## Game Context

- **Canvas Size**: 480 x 240 pixels (logical), scaled for retina displays
- **Character (Zeno)**: 50 x 50 pixels display size
- **Art Style Reference**: See existing assets in `/public/assets/`
  - Flipbook: Blue pencil sketch on notebook paper aesthetic
  - Noir: Black ink, high contrast, film noir with grain

---

## 1. CHARGING EFFECTS

### 1.1 Energy Swirl Sprite Sheet
Radiating energy lines around Zeno while charging power.

| Property | Flipbook | Noir |
|----------|----------|------|
| **File** | `fx-charge-swirl-flipbook.png` | `fx-charge-swirl-noir.png` |
| **Sheet Size** | 512 x 64 px | 512 x 64 px |
| **Frame Size** | 64 x 64 px | 64 x 64 px |
| **Frame Count** | 8 frames | 8 frames |
| **Animation** | Loop at 12 fps | Loop at 12 fps |
| **Style** | Blue pencil swirling lines, wispy, organic | Black ink brush strokes, sharp, angular |
| **Intensity** | Lines grow longer/denser as charge increases | Lines become bolder/more defined |

**Visual Description:**
- Centered origin point (Zeno's center will be placed here)
- 4-6 curved lines radiating outward, rotating
- Lines should feel like energy gathering
- Flipbook: Sketchy, imperfect lines with slight wobble
- Noir: Clean but expressive ink brush strokes

---

### 1.2 Ground Dust (Charging)
Small dust puffs at Zeno's feet during charge.

| Property | Flipbook | Noir |
|----------|----------|------|
| **File** | `fx-charge-dust-flipbook.png` | `fx-charge-dust-noir.png` |
| **Sheet Size** | 256 x 32 px | 256 x 32 px |
| **Frame Size** | 32 x 32 px | 32 x 32 px |
| **Frame Count** | 8 frames | 8 frames |
| **Animation** | Loop at 10 fps | Loop at 10 fps |
| **Style** | Light brown/tan puffs, sketchy circles | Gray/white wisps, ink splatter style |

**Visual Description:**
- Small dust clouds rising from ground level
- Origin at bottom-center of frame
- Particles drift slightly upward and outward
- Should feel like pressure building on ground

---

## 2. LAUNCH EFFECTS

### 2.1 Launch Burst
Explosive burst when Zeno launches.

| Property | Flipbook | Noir |
|----------|----------|------|
| **File** | `fx-launch-burst-flipbook.png` | `fx-launch-burst-noir.png` |
| **Sheet Size** | 512 x 64 px | 512 x 64 px |
| **Frame Size** | 64 x 64 px | 64 x 64 px |
| **Frame Count** | 8 frames | 8 frames |
| **Animation** | Play once at 15 fps | Play once at 15 fps |
| **Style** | Yellow/orange starburst, comic book "POW" feel | White/gray sharp rays, noir spotlight burst |

**Visual Description:**
- Frame 1: Small concentrated burst at center
- Frames 2-5: Rays expand outward rapidly
- Frames 6-8: Rays fade and dissipate
- Flipbook: Hand-drawn star shape with speed lines
- Noir: Sharp geometric rays, high contrast

---

### 2.2 Launch Sparks
Small particles flying backward from launch point.

| Property | Flipbook | Noir |
|----------|----------|------|
| **File** | `fx-launch-sparks-flipbook.png` | `fx-launch-sparks-noir.png` |
| **Sheet Size** | 384 x 48 px | 384 x 48 px |
| **Frame Size** | 48 x 48 px | 48 x 48 px |
| **Frame Count** | 8 frames | 8 frames |
| **Animation** | Play once at 20 fps | Play once at 20 fps |
| **Style** | Orange/yellow dots and streaks | White dots with motion trails |

**Visual Description:**
- Sparks emanate from right side (launch direction is right)
- Travel leftward and slightly upward
- Fade out as they travel
- 6-10 individual spark particles per frame

---

## 3. FLIGHT EFFECTS

### 3.1 Speed Lines
Motion blur lines during high-speed flight.

| Property | Flipbook | Noir |
|----------|----------|------|
| **File** | `fx-speed-lines-flipbook.png` | `fx-speed-lines-noir.png` |
| **Sheet Size** | 512 x 64 px | 512 x 64 px |
| **Frame Size** | 128 x 64 px | 128 x 64 px |
| **Frame Count** | 4 frames | 4 frames |
| **Animation** | Loop at 16 fps | Loop at 16 fps |
| **Style** | Blue pencil horizontal dashes | Black ink sharp streaks |

**Visual Description:**
- Horizontal lines trailing behind (to the left of center)
- Lines should vary in length (15-40px)
- Staggered vertically to create depth
- Center of frame is where Zeno will be positioned
- Flipbook: Sketchy, slightly wavy lines
- Noir: Clean, sharp, varying thickness

---

### 3.2 Motion Trail / After-Image
Fading silhouettes following Zeno during flight.

| Property | Flipbook | Noir |
|----------|----------|------|
| **File** | `fx-motion-trail-flipbook.png` | `fx-motion-trail-noir.png` |
| **Sheet Size** | 200 x 50 px | 200 x 50 px |
| **Frame Size** | 50 x 50 px | 50 x 50 px |
| **Frame Count** | 4 frames (opacity levels) | 4 frames (opacity levels) |
| **Usage** | Stamp at previous positions | Stamp at previous positions |
| **Style** | Light blue silhouette, sketchy | Gray silhouette, ink wash |

**Visual Description:**
- Simplified Zeno silhouette in flying pose (superman pose)
- Frame 1: 60% opacity
- Frame 2: 40% opacity
- Frame 3: 25% opacity
- Frame 4: 10% opacity
- Should match Zeno's 50x50 display size exactly

---

### 3.3 Wind Whoosh Marks
Curved air displacement lines for very high speed.

| Property | Flipbook | Noir |
|----------|----------|------|
| **File** | `fx-whoosh-flipbook.png` | `fx-whoosh-noir.png` |
| **Sheet Size** | 256 x 64 px | 256 x 64 px |
| **Frame Size** | 64 x 64 px | 64 x 64 px |
| **Frame Count** | 4 frames | 4 frames |
| **Animation** | Loop at 12 fps | Loop at 12 fps |
| **Style** | Light curved swooshes | Sharp angular swooshes |

**Visual Description:**
- 2-3 curved lines suggesting air being pushed aside
- Lines curve around an invisible center point (Zeno's position)
- Should convey extreme speed and air resistance

---

## 4. LANDING EFFECTS

### 4.1 Impact Burst
Shockwave effect on landing.

| Property | Flipbook | Noir |
|----------|----------|------|
| **File** | `fx-impact-burst-flipbook.png` | `fx-impact-burst-noir.png` |
| **Sheet Size** | 640 x 80 px | 640 x 80 px |
| **Frame Size** | 80 x 80 px | 80 x 80 px |
| **Frame Count** | 8 frames | 8 frames |
| **Animation** | Play once at 15 fps | Play once at 15 fps |
| **Style** | Comic "WHAM" style burst | Noir spotlight/shadow burst |

**Visual Description:**
- Frame 1: Concentrated impact point
- Frames 2-4: Circular shockwave expands
- Frames 5-6: Radial lines appear
- Frames 7-8: Everything fades out
- Origin at bottom-center (ground level)
- Flipbook: Yellow/orange with hand-drawn star shape
- Noir: White/gray with sharp geometric rays

---

### 4.2 Landing Dust Cloud
Dust explosion on ground impact.

| Property | Flipbook | Noir |
|----------|----------|------|
| **File** | `fx-landing-dust-flipbook.png` | `fx-landing-dust-noir.png` |
| **Sheet Size** | 640 x 64 px | 640 x 64 px |
| **Frame Size** | 80 x 64 px | 80 x 64 px |
| **Frame Count** | 8 frames | 8 frames |
| **Animation** | Play once at 12 fps | Play once at 12 fps |
| **Style** | Tan/brown puffy clouds | Gray/white ink splatter clouds |

**Visual Description:**
- Frame 1: Initial burst at ground level
- Frames 2-4: Dust billows outward and upward
- Frames 5-6: Cloud expands and starts to thin
- Frames 7-8: Dissipates into wisps
- Width should be ~60-70px at maximum expansion
- Height ~40-50px at peak

---

### 4.3 Ground Crack Lines
Radiating cracks from impact point (superhero landing style).

| Property | Flipbook | Noir |
|----------|----------|------|
| **File** | `fx-ground-cracks-flipbook.png` | `fx-ground-cracks-noir.png` |
| **Sheet Size** | 480 x 60 px | 480 x 60 px |
| **Frame Size** | 80 x 60 px | 80 x 60 px |
| **Frame Count** | 6 frames | 6 frames |
| **Animation** | Play once at 10 fps | Play once at 10 fps |
| **Style** | Blue pencil cracks | Black ink sharp cracks |

**Visual Description:**
- Frame 1: Small crack point at center-bottom
- Frames 2-4: 4-6 crack lines radiate outward along ground
- Frames 5-6: Cracks fade out
- Lines should be jagged, not smooth
- Some cracks can have small branches
- All cracks should originate from single point and spread horizontally

---

### 4.4 Impact Debris
Small rock/debris particles flying up from impact.

| Property | Flipbook | Noir |
|----------|----------|------|
| **File** | `fx-impact-debris-flipbook.png` | `fx-impact-debris-noir.png` |
| **Sheet Size** | 384 x 48 px | 384 x 48 px |
| **Frame Size** | 48 x 48 px | 48 x 48 px |
| **Frame Count** | 8 frames | 8 frames |
| **Animation** | Play once at 15 fps | Play once at 15 fps |
| **Style** | Brown/tan rock chunks | Gray/black debris pieces |

**Visual Description:**
- 6-10 small debris particles (3-6px each)
- Launch upward and outward from bottom-center
- Arc trajectory (go up then fall down)
- Particles rotate as they fly
- Mix of sizes for visual interest

---

## 5. FAILURE EFFECTS

### 5.1 Fall Swirl
Dizzy/panic swirl when Zeno falls off cliff.

| Property | Flipbook | Noir |
|----------|----------|------|
| **File** | `fx-fall-swirl-flipbook.png` | `fx-fall-swirl-noir.png` |
| **Sheet Size** | 256 x 64 px | 256 x 64 px |
| **Frame Size** | 64 x 64 px | 64 x 64 px |
| **Frame Count** | 4 frames | 4 frames |
| **Animation** | Loop at 8 fps | Loop at 8 fps |
| **Style** | Spiral lines, comic panic style | Sharp angular spiral |

**Visual Description:**
- Spiral lines rotating around center
- Small motion lines indicating rapid spinning
- Comic book style "dizzy" indicator
- Should convey panic/loss of control

---

### 5.2 Exclamation/Panic Marks
"!" marks or sweat drops for failure moments.

| Property | Flipbook | Noir |
|----------|----------|------|
| **File** | `fx-panic-marks-flipbook.png` | `fx-panic-marks-noir.png` |
| **Sheet Size** | 128 x 32 px | 128 x 32 px |
| **Frame Size** | 32 x 32 px | 32 x 32 px |
| **Frame Count** | 4 frames | 4 frames |
| **Animation** | Loop at 6 fps | Loop at 6 fps |
| **Style** | Hand-drawn "!" and sweat drops | Bold ink "!" marks |

**Visual Description:**
- Frame 1-2: "!" exclamation marks appearing
- Frame 3-4: Sweat drops or stress lines
- Position above Zeno's head
- Comic book style panic indicators

---

## 6. UI EFFECTS

### 6.1 Star Sparkle (Record Marker)
Animated sparkle for the star target marker.

| Property | Flipbook | Noir |
|----------|----------|------|
| **File** | `fx-star-sparkle-flipbook.png` | `fx-star-sparkle-noir.png` |
| **Sheet Size** | 128 x 32 px | 128 x 32 px |
| **Frame Size** | 32 x 32 px | 32 x 32 px |
| **Frame Count** | 4 frames | 4 frames |
| **Animation** | Loop at 6 fps | Loop at 6 fps |
| **Style** | Yellow/gold twinkle | White/silver glint |

**Visual Description:**
- 4-point or 5-point star shape
- Frames show rotation or twinkle effect
- Small sparkle rays that appear and disappear
- Should draw attention to target position

---

## 7. PARTICLE SPRITES (Individual)

For the particle system, we need individual particle images that will be spawned programmatically.

### 7.1 Dust Particle
| Property | Value |
|----------|-------|
| **File** | `particle-dust-{theme}.png` |
| **Size** | 16 x 16 px |
| **Style** | Soft, fuzzy circle with irregular edges |

### 7.2 Spark Particle
| Property | Value |
|----------|-------|
| **File** | `particle-spark-{theme}.png` |
| **Size** | 8 x 8 px |
| **Style** | Bright point with small rays |

### 7.3 Debris Particle
| Property | Value |
|----------|-------|
| **File** | `particle-debris-{theme}.png` |
| **Size** | 12 x 12 px |
| **Style** | Irregular rock/dirt chunk shape |

### 7.4 Smoke Puff Particle
| Property | Value |
|----------|-------|
| **File** | `particle-smoke-{theme}.png` |
| **Size** | 24 x 24 px |
| **Style** | Soft cloud/puff shape |

---

## File Delivery Structure

Please organize deliverables as follows:

```
/fx-assets/
  /flipbook/
    fx-charge-swirl-flipbook.png
    fx-charge-dust-flipbook.png
    fx-launch-burst-flipbook.png
    fx-launch-sparks-flipbook.png
    fx-speed-lines-flipbook.png
    fx-motion-trail-flipbook.png
    fx-whoosh-flipbook.png
    fx-impact-burst-flipbook.png
    fx-landing-dust-flipbook.png
    fx-ground-cracks-flipbook.png
    fx-impact-debris-flipbook.png
    fx-fall-swirl-flipbook.png
    fx-panic-marks-flipbook.png
    fx-star-sparkle-flipbook.png
    particle-dust-flipbook.png
    particle-spark-flipbook.png
    particle-debris-flipbook.png
    particle-smoke-flipbook.png

  /noir/
    fx-charge-swirl-noir.png
    fx-charge-dust-noir.png
    fx-launch-burst-noir.png
    fx-launch-sparks-noir.png
    fx-speed-lines-noir.png
    fx-motion-trail-noir.png
    fx-whoosh-noir.png
    fx-impact-burst-noir.png
    fx-landing-dust-noir.png
    fx-ground-cracks-noir.png
    fx-impact-debris-noir.png
    fx-fall-swirl-noir.png
    fx-panic-marks-noir.png
    fx-star-sparkle-noir.png
    particle-dust-noir.png
    particle-spark-noir.png
    particle-debris-noir.png
    particle-smoke-noir.png
```

---

## Color Palettes

### Flipbook Theme
| Use | Color | Hex |
|-----|-------|-----|
| Primary (lines) | Dark Blue | #3B5998 |
| Secondary | Light Blue | #6B8AC4 |
| Accent (energy) | Orange/Yellow | #F5A623 |
| Dust/Earth | Tan/Brown | #C4A574 |
| Highlight | Gold | #FFD700 |

### Noir Theme
| Use | Color | Hex |
|-----|-------|-----|
| Primary (lines) | Pure Black | #000000 |
| Secondary | Dark Gray | #333333 |
| Accent | Off-White | #F5F5F5 |
| Highlight | Bright White | #FFFFFF |
| Shadow | Medium Gray | #666666 |

---

## Quality Checklist

Before delivery, verify each asset:

- [ ] PNG format with alpha channel (PNG-24)
- [ ] NO white or colored background - pure transparency
- [ ] Correct dimensions as specified
- [ ] Frames aligned properly in sprite sheet (no offset)
- [ ] Consistent line weight within theme
- [ ] Colors match the specified palette
- [ ] Animation reads clearly at intended frame rate
- [ ] Test over dark AND light backgrounds to verify transparency

---

## Integration Notes

These assets will be integrated into the game's sprite-based effects system. The game engine will:

1. Load sprite sheets on game init
2. Display appropriate frame based on game state
3. Position effects relative to Zeno's position
4. Handle animation timing automatically
5. Scale effects with game zoom (if any)

The programmer will handle all animation logic - you just need to provide the visual frames as specified.

---

## Questions?

If any specification is unclear, please ask before starting work. It's better to clarify upfront than to redo assets later.

**Priority Order:**
1. Landing effects (most visible, most impactful)
2. Launch effects
3. Flight effects (speed lines, motion trail)
4. Charging effects
5. Failure effects
6. UI effects
7. Particle sprites
