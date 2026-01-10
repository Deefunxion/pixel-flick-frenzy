# Art Director Prompt: Phase 6 Asset Preparation for One More Flick

> **Your Role:** You are now acting as the **Art Director** for the One More Flick game. Your responsibility is to create high-quality visual assets that perfectly match the established branding and design system. You have complete creative control within the defined constraints and specifications.

---

## Context: Where We Are

We have successfully implemented Phases 1-5 of the branding implementation plan:

- ✅ **Phase 1:** Color system refinements (Flipbook & Noir utility colors)
- ✅ **Phase 2:** Ghost Trail animation system
- ✅ **Phase 3:** Squash & Stretch animation system
- ✅ **Phase 4:** Anticipation poses
- ✅ **Phase 5:** Scribble energy effects

**Current Status:** All animation systems are working. The game has a strong, cohesive visual identity. Now we need to create the **brand assets** that will represent the game outside of gameplay—icons, logos, and UI elements.

---

## Your Mission: Phase 6 Asset Preparation

You will create **four categories of visual assets** using SVG format. These assets must be production-ready, scalable, and perfectly aligned with the game's hand-drawn aesthetic.

---

## Design System Reference

Before creating any assets, internalize these core design principles:

### Visual Identity

**Two Themes:**

1. **Flipbook Theme**
   - Primary color: Blue ballpoint pen ink `#1a4a7a`
   - Background: Warm cream paper `#f5f1e8`
   - Utility: Pencil gray `#9a9590`, Erased pink `#f0e8e6`
   - Style: Hand-drawn, wobbly lines, organic, warm, notebook aesthetic
   - Line weight: 2-3px with natural variation
   - Character: Friendly, inviting, personal

2. **Noir Theme**
   - Primary color: Off-white ink `#e8e4e0`
   - Background: Deep black `#121216`
   - Utility: Pencil gray `#6a6660`, Ink bleed `#3a3a40`, Warm white `#fff8f0`
   - Style: Sharp, high-contrast, minimalist, cinematic
   - Line weight: 1.5-2px, precise
   - Character: Dramatic, mysterious, sophisticated

### Character Design: Zeno (The Stick Figure)

Zeno is the protagonist and the face of the brand. Every asset must capture his personality.

**Anatomy:**
- Head: Simple circle, diameter ~12-15px at base scale
- Body: Single vertical line, ~15-20px
- Arms: Two lines from mid-torso, slightly bent at "elbows"
- Legs: Two lines from bottom of torso, slight bend at "knees"
- Total height: ~40-50px at base scale

**Personality Traits:**
- Determined but slightly anxious
- Focused on the challenge
- Expressive through posture, not facial features
- Minimal face: two dots for eyes, optional small line for mouth

**The Signature Pose: "The Lean"**
- Forward tilt: 15-20 degrees
- Arms hanging loose, slightly behind body
- Feet at edge, toes may overhang
- Weight shifted forward
- Conveys: anticipation, tension, "about to jump"
- Expression: neutral or slightly smug (confident)

### Hand-Drawn Aesthetic Rules

**For Flipbook Style:**
1. Lines must have subtle wobble (not perfectly straight)
2. Use multiple overlapping strokes to create depth
3. Stroke ends should be rounded, not sharp
4. Slight variations in line thickness
5. Organic, human feel—like drawn with a real pen

**For Noir Style:**
1. Lines are sharper but still hand-drawn
2. High contrast, minimal mid-tones
3. Clean paths with deliberate imperfections
4. Dramatic use of negative space
5. Cinematic, not mechanical

---

## Task Breakdown

### Task 6.1: Create Zeno "Lean" Pose Master Illustration

**Objective:** Create the definitive brand illustration of Zeno in "The Lean" pose. This will be used for app icons, marketing materials, and as the visual anchor of the brand.

**Specifications:**

- **File:** `public/assets/brand/zeno-lean.svg`
- **Format:** SVG, scalable vector
- **Artboard size:** 512×512px (with padding, Zeno centered)
- **Pose details:**
  - Forward tilt: 15-20° from vertical
  - Arms: Hanging loose, slightly behind body line
  - Legs: Feet together or slightly apart, positioned at bottom edge of artboard
  - Toes: May slightly overhang the "cliff edge" (bottom of artboard)
  - Head: Looking forward/down, toward the "edge"
- **Face:**
  - Two small dots for eyes (2-3px circles)
  - Optional: Small curved line for mouth (neutral or slight smirk)
  - Expression conveys: confidence, focus, slight tension
- **Style:** Use the Flipbook pen stroke style (blue ink, wobbly lines, 2-3px stroke)
- **Variants needed:**
  - `zeno-lean-flipbook.svg` (blue on transparent)
  - `zeno-lean-noir.svg` (off-white on transparent)

**Quality Checklist:**
- [ ] Pose angle is exactly 15-20° forward
- [ ] Lines have natural wobble (Flipbook) or controlled precision (Noir)
- [ ] Proportions match in-game stick figure
- [ ] Scalable from 16px to 512px without loss of character
- [ ] Expression is clear even at small sizes

**Implementation Approach:**

You will create this using SVG `<path>` elements. Use Bézier curves for the wobble effect in Flipbook. For Noir, use straighter paths but with subtle hand-drawn imperfections.

**Example SVG structure (Flipbook):**

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <!-- Head -->
  <circle cx="256" cy="180" r="30" fill="none" stroke="#1a4a7a" stroke-width="3" stroke-linecap="round"/>
  
  <!-- Eyes -->
  <circle cx="248" cy="175" r="3" fill="#1a4a7a"/>
  <circle cx="264" cy="175" r="3" fill="#1a4a7a"/>
  
  <!-- Body (tilted forward) -->
  <path d="M 256 210 L 270 320" stroke="#1a4a7a" stroke-width="3" stroke-linecap="round" fill="none"/>
  
  <!-- Arms (loose, behind) -->
  <path d="M 265 240 Q 240 250, 230 270" stroke="#1a4a7a" stroke-width="2.5" stroke-linecap="round" fill="none"/>
  <path d="M 265 240 Q 290 250, 300 270" stroke="#1a4a7a" stroke-width="2.5" stroke-linecap="round" fill="none"/>
  
  <!-- Legs (at edge) -->
  <path d="M 270 320 L 260 420" stroke="#1a4a7a" stroke-width="3" stroke-linecap="round" fill="none"/>
  <path d="M 270 320 L 280 420" stroke="#1a4a7a" stroke-width="3" stroke-linecap="round" fill="none"/>
</svg>
```

Adjust coordinates to achieve the 15-20° lean. Add subtle path variations for wobble.

---

### Task 6.2: Create Custom "one more flick." Lettering

**Objective:** Design the official wordmark/logo for the game. This is the typographic identity that will appear on all marketing materials, the website, and in-game.

**Specifications:**

- **File:** `public/assets/brand/wordmark.svg`
- **Format:** SVG, scalable vector
- **Text:** "one more flick." (all lowercase, period at end is mandatory)
- **Style:** Hand-drawn, ballpoint pen aesthetic
- **Stroke weight:** 2-3px with natural variation
- **Character:**
  - Slight wobble in letterforms (not perfectly geometric)
  - Rounded corners and stroke ends
  - Baseline is slightly uneven (organic, not mechanical)
  - Letters have natural spacing variations
  - The period is deliberate and prominent
- **Variants needed:**
  - `wordmark-flipbook.svg` (blue `#1a4a7a` on transparent)
  - `wordmark-noir.svg` (off-white `#e8e4e0` on transparent)

**Typography Guidelines:**

Each letter should feel hand-drawn but remain legible. The wordmark should be recognizable even at small sizes.

- **"o":** Circular but slightly imperfect, not a perfect circle
- **"n", "m":** Rounded arches, not sharp angles
- **"e":** Open, friendly
- **"f":** Crossbar slightly off-center
- **"l":** Simple vertical with slight curve
- **"i":** Dot is a small circle, not perfectly aligned
- **"c":** Open C-shape
- **"k":** Arms meet at a natural angle
- **".":** Bold dot, same size as "i" dot or slightly larger

**Spacing:** Letters should feel naturally spaced, as if written by hand. Not monospaced, not perfectly kerned—organic.

**Quality Checklist:**
- [ ] All lowercase (no capitals)
- [ ] Period at end is present and visible
- [ ] Wobble is subtle, not exaggerated
- [ ] Legible at 100px width
- [ ] Feels warm (Flipbook) or sophisticated (Noir)
- [ ] Baseline has natural variation

**Implementation Approach:**

Create each letter as a separate `<path>` element. Use Bézier curves to simulate pen strokes. For Flipbook, add subtle double-strokes or overlapping paths to create depth. For Noir, use cleaner single paths with deliberate imperfections.

---

### Task 6.3: Create App Icons

**Objective:** Generate a complete set of app icons in all required sizes for web, iOS, Android, and PWA deployment. Each icon features Zeno in "The Lean" pose.

**Specifications:**

**Sizes Required:**
- 16×16px (favicon, small)
- 32×32px (favicon @2x)
- 180×180px (Apple touch icon)
- 192×192px (Android icon)
- 512×512px (PWA, high-res)

**Variants:**
- Flipbook: Blue Zeno on cream background
- Noir: Off-white Zeno on black background

**File Structure:**
```
public/assets/icons/
├── flipbook/
│   ├── favicon-16x16.png
│   ├── favicon-32x32.png
│   ├── apple-touch-icon-180x180.png
│   ├── android-chrome-192x192.png
│   └── icon-512x512.png
└── noir/
    ├── favicon-16x16.png
    ├── favicon-32x32.png
    ├── apple-touch-icon-180x180.png
    ├── android-chrome-192x192.png
    └── icon-512x512.png
```

**Design Guidelines:**

1. **Composition:**
   - Zeno centered in the icon
   - Adequate padding (10-15% of icon size)
   - Zeno should be recognizable even at 16×16px

2. **Background:**
   - Flipbook: Solid cream `#f5f1e8`
   - Noir: Solid black `#121216`
   - No gradients, no textures

3. **Simplification for Small Sizes:**
   - At 16×16 and 32×32, simplify Zeno's details
   - Reduce wobble, thicken lines slightly
   - Ensure head and body are clearly visible
   - Face details may need to be omitted at 16×16

4. **Rounded Corners:**
   - iOS icons will be masked by the system
   - Provide square PNGs, system will apply corner radius

**Quality Checklist:**
- [ ] All sizes generated from master SVG
- [ ] Zeno is recognizable at 16×16px
- [ ] Colors match theme specifications exactly
- [ ] PNG export is crisp (no anti-aliasing artifacts)
- [ ] Files are optimized (small file size)

**Implementation Approach:**

1. Start with the master `zeno-lean.svg` from Task 6.1
2. Create a 512×512px artboard with background color
3. Center Zeno with appropriate padding
4. Export as PNG at each required size
5. Use a tool like ImageMagick or a script to batch-generate sizes:

```bash
# Example command (you'll implement this)
convert zeno-lean-512.png -resize 16x16 favicon-16x16.png
```

---

### Task 6.4: Create UI Icon Set

**Objective:** Design a set of functional UI icons for in-game interface elements. These icons must match the hand-drawn aesthetic and be instantly recognizable.

**Specifications:**

**Icons Required:**
1. **Sound On** (speaker with sound waves)
2. **Sound Off** (speaker with slash)
3. **Leaderboard** (trophy or podium)
4. **Stats** (bar chart or graph)
5. **Theme Toggle** (half-circle, sun/moon metaphor)
6. **Close** (X symbol)

**File Structure:**
```
public/assets/icons/ui/
├── flipbook/
│   ├── sound-on.svg
│   ├── sound-off.svg
│   ├── leaderboard.svg
│   ├── stats.svg
│   ├── theme-toggle.svg
│   └── close.svg
└── noir/
    ├── sound-on.svg
    ├── sound-off.svg
    ├── leaderboard.svg
    ├── stats.svg
    ├── theme-toggle.svg
    └── close.svg
```

**Design Guidelines:**

1. **Size:** Design at 48×48px base size (will be scaled)
2. **Style:** Hand-drawn, matching the stick figure aesthetic
3. **Stroke weight:** 2-3px (Flipbook), 1.5-2px (Noir)
4. **Clarity:** Must be recognizable at 24×24px
5. **Consistency:** All icons should feel like they belong to the same family

**Icon-Specific Guidelines:**

**Sound On:**
- Simple speaker shape (trapezoid or triangle)
- 2-3 curved lines representing sound waves
- Waves should have hand-drawn wobble

**Sound Off:**
- Same speaker as "Sound On"
- Diagonal slash across speaker
- Slash should be bold and clear

**Leaderboard:**
- Simple trophy shape (cup on pedestal)
- Or: 3-tiered podium (1st, 2nd, 3rd)
- Hand-drawn, not geometric

**Stats:**
- 3-4 vertical bars of varying heights
- Simple bar chart representation
- Bars have rounded tops

**Theme Toggle:**
- Half-circle or crescent shape
- Represents day/night or light/dark
- Can include small rays (sun) or stars (moon)

**Close:**
- Two intersecting diagonal lines forming an X
- Lines should cross at center
- Slightly uneven (hand-drawn feel)

**Quality Checklist:**
- [ ] All icons are same base size (48×48px)
- [ ] Each icon has a unique, recognizable silhouette
- [ ] Hand-drawn style is consistent across all icons
- [ ] Icons work in both Flipbook and Noir themes
- [ ] Legible at 24×24px

**Implementation Approach:**

Create each icon as an SVG with a 48×48px viewBox. Use simple shapes and paths. Avoid excessive detail—these are functional icons, not illustrations.

**Example: Close Icon (Flipbook)**

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
  <path d="M 12 12 L 36 36" stroke="#1a4a7a" stroke-width="3" stroke-linecap="round"/>
  <path d="M 36 12 L 12 36" stroke="#1a4a7a" stroke-width="3" stroke-linecap="round"/>
</svg>
```

Add subtle curves or wobble to paths for hand-drawn feel.

---

## Workflow Instructions

### Step-by-Step Process

**For Each Task:**

1. **Review the specifications** above for that task
2. **Sketch the concept** (mentally or on paper) before coding
3. **Create the SVG** using the provided structure and guidelines
4. **Test at multiple sizes** to ensure scalability
5. **Create theme variants** (Flipbook and Noir)
6. **Save to the correct file path** as specified
7. **Commit your work** with a clear commit message

**Example Commit Messages:**
- `feat(brand): add Zeno lean pose master illustration`
- `feat(brand): create one more flick wordmark`
- `feat(icons): generate app icons for all platforms`
- `feat(icons): create UI icon set for game interface`

### Quality Assurance

Before considering a task complete, verify:

- [ ] File is saved to the correct path
- [ ] SVG is valid and renders correctly
- [ ] Colors match the theme specifications exactly
- [ ] Asset is scalable (test at 50%, 100%, 200%)
- [ ] Hand-drawn aesthetic is consistent with in-game art
- [ ] Both theme variants are created (if applicable)
- [ ] File is optimized (no unnecessary code)

### Testing Your Assets

After creating each asset, test it:

1. **Visual inspection:** Open the SVG in a browser
2. **Scale test:** Zoom in/out to check scalability
3. **Integration test:** Place the asset in the game UI (if applicable)
4. **Theme test:** Verify both Flipbook and Noir variants work

---

## Design Philosophy

As you create these assets, keep these principles in mind:

**1. The Limitation IS the Design**

The stick figure is not a placeholder—it's the brand. The simplicity is intentional. Don't add unnecessary detail. Embrace minimalism.

**2. Hand-Drawn, Not Hand-Waved**

Every line should feel deliberate. The wobble is subtle, not sloppy. The imperfections are controlled, not accidental.

**3. Personality Through Posture**

Zeno's character comes from his body language, not his face. The "lean" pose tells a story: anticipation, tension, confidence, risk.

**4. Consistency is Key**

All assets should feel like they belong to the same universe. The Flipbook assets should all share the same pen-stroke quality. The Noir assets should all have the same dramatic contrast.

**5. Scalability First**

These assets will be seen at 16px and at 512px. Design for both extremes. Test at multiple sizes.

---

## Reference Materials

You have access to:

1. **In-game rendering code:** `src/game/engine/sketchy.ts` and `src/game/engine/render.ts`
   - Study how Zeno is drawn in-game
   - Match the stroke style and proportions

2. **Theme definitions:** `src/game/themes.ts`
   - Use exact color values from here

3. **Existing promotional materials:** (provided by Manus)
   - Use these as inspiration for style consistency

---

## Final Deliverables Checklist

When Phase 6 is complete, you should have created:

- [ ] `public/assets/brand/zeno-lean-flipbook.svg`
- [ ] `public/assets/brand/zeno-lean-noir.svg`
- [ ] `public/assets/brand/wordmark-flipbook.svg`
- [ ] `public/assets/brand/wordmark-noir.svg`
- [ ] `public/assets/icons/flipbook/` (5 PNG files)
- [ ] `public/assets/icons/noir/` (5 PNG files)
- [ ] `public/assets/icons/ui/flipbook/` (6 SVG files)
- [ ] `public/assets/icons/ui/noir/` (6 SVG files)

**Total:** 24 files

---

## Communication Protocol

As you work through these tasks:

1. **Ask questions** if any specification is unclear
2. **Show your work** by committing incrementally
3. **Request feedback** after completing each major task
4. **Document decisions** if you deviate from specs (with justification)

---

## You Are Ready

You have all the information, specifications, and guidelines you need to execute Phase 6 with excellence. Trust the design system. Stay true to the hand-drawn aesthetic. Create assets that are simple, scalable, and full of personality.

**Your goal:** Make Zeno iconic.

**Begin with Task 6.1: Create Zeno "Lean" Pose Master Illustration.**

Good luck, Art Director. 🎨
