# One-More-Flick Codebase Analysis - Artwork Overview

## Game Concept
**One-More-Flick** είναι ένα minimalist arcade flick game με θέμα το Zeno's Paradox. Ο παίκτης προσπαθεί να προσγειωθεί όσο πιο κοντά στην άκρη του γκρεμού (145) χωρίς να πέσει.

## Τρέχουσα Καλλιτεχνική Κατεύθυνση

### Δύο Υλοποιημένα Themes

#### 1. **Flipbook Theme** (Default)
- **Αισθητική**: Hand-drawn notebook/sketchbook style
- **Χρώματα**: 
  - Warm cream paper background (#f5f1e8)
  - Blue ballpoint pen ink (#1a4a7a)
  - Light blue ruled lines
  - Red pen accents
  - Highlighter yellow-orange
- **Χαρακτηριστικά**:
  - Paper texture με smudge/eraser marks
  - Ruled lines (notebook paper)
  - Spiral holes στο αριστερό περιθώριο
  - Layered strokes (primary ink + faint graphite + shadow)
  - Graphite/chalk trajectory dots
  - Dust puff impact bursts
  - Medium wobble για hand-drawn feel
  - Stick figure player

#### 2. **Noir Ink Theme**
- **Αισθητική**: High-contrast, dry-ink strokes, film noir
- **Χρώματα**:
  - Near-black background (#1a1a1e)
  - Off-white primary ink (#e8e4e0)
  - Muted gray accents
  - Red danger highlights
- **Χαρακτηριστικά**:
  - Film grain effect (canvas-only)
  - Vignette effect (canvas-only)
  - Minimal line clutter
  - Ink droplet trajectories με splatter
  - Ink blot impact bursts
  - Lower wobble, sharper intent
  - Single clean ink stroke

## Τεχνική Υλοποίηση

### Rendering Architecture
- **Canvas-based rendering** (no WebGL)
- **Resolution**: 480x240 pixels (tiny pixel canvas)
- **Render pipeline**:
  - `render.ts`: Main rendering logic, theme switching
  - `sketchy.ts`: Hand-drawn primitives (wobble, layers, textures)
  - `themes.ts`: Theme definitions με RenderStyle metadata

### Key Rendering Primitives
1. **Layered drawing**: Primary ink + graphite + shadow offset
2. **Hand-drawn wobble**: Seeded random για deterministic animation
3. **Line weights**: Primary (2.5px), Secondary (1.5px), Shadow (1.0px)
4. **Textures**: Paper grain, smudge marks, film grain
5. **Effects**: Vignette, screen shake, zoom, slow-mo

### Visual Elements
- **Player**: Stick figure με landing animation
- **Ground**: Hand-drawn line με hatching για depth
- **Cliff edge**: Jagged line με danger warning (blinking exclamation)
- **Zeno target**: Hand-drawn star με dashed vertical line
- **Best marker**: Checkered flag
- **Trajectory**: Theme-specific dots/droplets
- **Impact**: Burst particles (dust puffs ή ink blots)

## Current Assets
- **favicon.ico**: 256x256 PNG icon (δεν το είδα ακόμα)
- **placeholder.svg**: Generic placeholder image
- **robots.txt**: SEO configuration

## UI/HUD Structure
- **Hero row**: SCORE (biggest), LV, TARGET
- **Secondary row**: LAST, BEST
- **Tertiary**: Δtarget/Δedge, session goals, stats
- **Controls**: Theme switcher, Sound/Volume/FX toggles
- **Theme-aware styling**: "Sticker label" για Flipbook, minimal ink για Noir

## Achievements & Progression
- Achievements system implemented
- Stats tracking (throws, landings, distance, etc.)
- Daily challenge system (deferred)
- Persistent account με ever-increasing score

## Design Principles
1. **The limitation IS the design** - Constraints create meaning
2. **145 is unreachable** - Zeno's Paradox is sacred
3. **Juice everything** - Every action needs feedback
4. **Mobile-first** - Touch is primary input
5. **Ever-increasing** - Progress never resets

## Observations

### Strengths
- ✅ Cohesive artistic vision με δύο distinct themes
- ✅ Hand-drawn aesthetic είναι well-executed
- ✅ Theme system είναι extensible (εύκολο να προστεθούν νέα themes)
- ✅ Rendering primitives είναι modular και reusable
- ✅ Attention to detail (layered strokes, wobble, textures)

### Gaps & Opportunities
- ⚠️ **Minimal external artwork assets** (μόνο favicon και placeholder)
- ⚠️ **Δεν υπάρχουν custom icons** για achievements, UI elements
- ⚠️ **Δεν υπάρχει branding artwork** (logo, splash screen, social media assets)
- ⚠️ **Δεν υπάρχουν promotional materials** (screenshots, GIFs, marketing visuals)
- ⚠️ **Limited theme variety** (μόνο 2 themes, αν και το σύστημα υποστηρίζει περισσότερα)
- ⚠️ **Δεν υπάρχουν seasonal/event themes**
- ⚠️ **Δεν υπάρχουν custom fonts** (χρησιμοποιεί Tailwind defaults)

## Technical Notes
- Όλα τα visuals είναι **procedurally generated** στο canvas
- Δεν χρησιμοποιούνται sprite sheets ή image assets για το gameplay
- Αυτό είναι **deliberate design choice** για το minimalist aesthetic
- Αλλά σημαίνει ότι υπάρχει ευκαιρία για **external branding/marketing artwork**
