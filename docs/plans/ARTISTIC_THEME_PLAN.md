# Artistic / Theme Implementation Plan (Enhanced Flipbook + Noir Ink)

Date: 2026-01-08
Project: Pixel Flick Frenzy (One-More-Flick)
Scope: Aesthetic + design + artistic rendering & HUD cohesion (no gameplay changes unless explicitly required for visuals)

## Goals (what “done” looks like)

1. Two high-quality themes selectable in-game:
   - **Enhanced Flipbook** (paper/sketch but more intentional)
   - **Noir Ink** (high-contrast, dry-ink strokes, film grain + vignette **inside canvas only**)
2. **Consistent silhouette language** per theme (player/target/flag/indicators feel from the same hand).
3. **Theme-signature trajectories & particles** (Flipbook = chalk/graphite dotted arc; Noir = ink splatter + droplet smear).
4. **Impact feedback** (1–2 frame squash emphasis + small burst) that feels “drawn”, not generic.
5. **HUD hierarchy** is clear and unified with the theme (hero: SCORE, LV, TARGET; secondary: Last/Best; tertiary: deltas/stats/goals).
6. Reduced-FX mode still looks good; it scales textures/grain/vignette down predictably.

Non-goals:
- No extra pages, no new gameplay modes, no new complex UI systems.
- No new font families or brand-new color systems outside existing theme tokens.

---

## Current architecture touchpoints (for implementation)

- `src/game/themes.ts`: currently exports a single `THEME` (Flipbook).
- `src/game/engine/render.ts`: renders the entire canvas using flipbook-style primitives.
- `src/game/engine/sketchy.ts`: hand-drawn primitives (wobble, hand lines/circles, stick figure, paper texture, etc.).
- `src/components/Game.tsx`: React layout for HUD + settings. Currently hardcodes `THEME` and uses inline style tokens.

---

## Phase 0 — Visual spec & style rules (foundation)

**Objective:** define the artistic “rules” so implementation stays consistent.

### Task 0.1: Theme style spec (1-page per theme)
Deliverable: written spec inside this file + a quick checklist.

#### Enhanced Flipbook spec
- **Line weights:**
  - Primary stroke: 2.5–3.0 px (hero outlines, player, ground edge)
  - Secondary stroke: 1.25–1.75 px (grid/labels/less important markers)
  - Shadow/ghost stroke: 0.75–1.25 px (offset faint pencil)
- **Stroke character:** medium wobble + slight mid-curve; avoid excessive jitter.
- **Layers:** 2–3 passes per key stroke (primary ink + faint graphite + subtle shadow offset).
- **Texture:** paper grain + occasional eraser/smudge marks, subtle, animated slowly.
- **Trajectory:** dotted “chalk/graphite” points; slightly irregular spacing; lighter when older.
- **Particles:** graphite dust puffs on impact (small, low alpha, circular/oval).

#### Noir Ink spec
- **Line weights:**
  - Primary stroke: 1.75–2.25 px (dry-ink thin)
  - Secondary stroke: 1.0–1.5 px
- **Stroke character:** low wobble, sharper intent; fewer decorative lines.
- **Layers:** 1 main ink stroke + optional edge feathering (no pencil shadow).
- **Canvas-only effects:**
  - Vignette: always on (reduced intensity in reduceFx)
  - Grain: always on (reduced intensity in reduceFx)
- **Trajectory:** ink droplets: a few splats + tiny dots; can smear slightly along velocity direction.
- **Particles:** ink blot burst on impact (few drops, higher contrast, quickly fading).

Acceptance criteria:
- You can describe each theme’s “rules” in 30 seconds.
- A screenshot of each theme “reads” consistently without UI feeling mismatched.

---

## Phase 1 — Multi-theme system (minimal refactor)

**Objective:** enable theme selection & persistence; keep code changes localized.

### Task 1.1: Convert `THEME` into `THEMES`
Files:
- `src/game/themes.ts`

Implementation outline:
- Introduce `ThemeId` union type, e.g. `'flipbook' | 'noir'`.
- Export `THEMES: Record<ThemeId, Theme>`.
- Add optional render-style metadata to theme (recommended):
  - `renderStyle: { kind: 'flipbook' | 'noir'; wobble: number; grain: number; vignette: number; pencilLayers: number; }`
- Provide helpers:
  - `getTheme(id: ThemeId): Theme`
  - `DEFAULT_THEME_ID`

Acceptance criteria:
- No behavior change yet if default theme remains flipbook.
- TypeScript compiles cleanly.

### Task 1.2: Persist selected theme
Files:
- `src/components/Game.tsx`
- optionally `src/game/storage.ts` (if we want a typed helper key)

Implementation outline:
- Load from localStorage (new key, e.g. `omf_theme_id`) with fallback to default.
- Save on change.

Acceptance criteria:
- Refresh keeps the theme.

---

## Phase 2 — Theme selector UX (minimal, inline)

**Objective:** allow switching themes quickly while iterating.

### Task 2.1: Add a small theme switcher near settings
Files:
- `src/components/Game.tsx`

Constraints:
- No new pages/modals.
- Must feel “same hand” as theme (colors/borders using theme tokens).

Implementation outline:
- Add a compact control (e.g. 2-button toggle) next to Sound/Vol/FX.
- Label: `Theme: Flipbook / Noir`.
- Optional: keep all themes visible during iteration; later we can gate by achievements.

Acceptance criteria:
- One-tap switch on mobile; no layout break.

---

## Phase 3 — Enhanced Flipbook polish (canvas render)

**Objective:** make Flipbook feel “more intentional” without losing charm.

### Task 3.1: Add pencil layers + consistent line weights
Files:
- `src/game/engine/sketchy.ts`
- `src/game/engine/render.ts`

Implementation outline:
- Add new primitive wrappers (no new art assets):
  - `drawLayeredHandLine(...)` (primary + faint offset + optional shadow)
  - `drawLayeredHandCircle(...)`
- Normalize where lineWidth is set (avoid random values scattered).

Acceptance criteria:
- Player, ground, cliff edge, and key UI marks feel like same pen/pencil set.

### Task 3.2: Paper smudge / eraser marks
Files:
- `src/game/engine/sketchy.ts` (paper texture functions)

Implementation outline:
- Extend `drawPaperTexture` to include occasional soft smudge strokes and “erased” lighter streaks.
- Respect `reduceFx`: lower frequency/alpha.

Acceptance criteria:
- Texture adds depth but doesn’t distract.

---

## Phase 4 — Noir Ink renderer (canvas-only effects)

**Objective:** implement Noir as a separate visual renderer with strict canvas-only post effects.

### Task 4.1: Add a Noir render path
Files:
- Option A (cleaner): `src/game/engine/render_noir.ts`
- Option B (simpler): add `renderNoirFrame` inside `src/game/engine/render.ts`

Implementation outline:
- Switch on `theme.renderStyle.kind`.
- Noir background: dark/off-white pairing (high contrast) using theme tokens.
- Less line clutter: simplify ruled lines/spirals; keep only what reads.

Acceptance criteria:
- Noir looks like a different edition, not just “colors changed”.

### Task 4.2: Film grain + vignette inside canvas only
Files:
- Noir renderer file

Implementation outline:
- Grain: cheap per-frame noise (small alpha) or tiled noise pattern.
- Vignette: radial gradient darkening edges.
- Respect `reduceFx` by scaling intensity, not necessarily disabling entirely.

Acceptance criteria:
- UI outside canvas is untouched.

---

## Phase 5 — Theme-signature trajectories & particles

**Objective:** the “signature” feel should be immediately noticeable.

### Task 5.1: Flipbook trajectory = graphite/chalk dots
Files:
- `src/game/engine/render.ts`

Implementation outline:
- Replace uniform `arc(..., r=2)` dots with slightly varied radius/alpha, mild jitter.

### Task 5.2: Noir trajectory = ink droplets/splatter
Files:
- Noir renderer
- optionally add `drawInkSplatter(...)` helper in `sketchy.ts`

Implementation outline:
- Draw small clusters of dots with occasional elongated droplet (smear in velocity direction if available).

Acceptance criteria:
- You can tell the theme from the trail alone.

---

## Phase 6 — Impact feedback (1–2 frame squash + burst)

**Objective:** landings and impacts feel satisfying and styled.

### Task 6.1: Player squash emphasis on landing
Files:
- `src/game/engine/sketchy.ts` (stick figure already has a landing state)
- `src/game/engine/render.ts` + Noir renderer

Implementation outline:
- For landing frames: temporarily increase lineWidth slightly and add micro-offset.

### Task 6.2: Burst on impact
Files:
- Prefer rendering-only burst derived from `state.landingFrame`.
- If needed, minimal hook in `src/game/engine/update.ts` to spawn themed particles (but keep model stable).

Acceptance criteria:
- Feels snappy; not animation-heavy.

---

## Phase 7 — HUD hierarchy + unified controls (React UI)

**Objective:** the non-canvas UI finally matches the art direction.

### Task 7.1: Hierarchy redesign (layout)
Files:
- `src/components/Game.tsx`

Target hierarchy:
- **Hero row:** SCORE (biggest), LV, TARGET (same tier)
- **Secondary:** LAST, BEST
- **Tertiary:** Δtarget/Δedge, session goals, small stats

Acceptance criteria:
- You can scan SCORE/LV/TARGET first without reading everything.

### Task 7.2: Controls feel “same hand”
Files:
- `src/components/Game.tsx`

Implementation outline:
- Use only theme tokens for borders/background/text.
- Flipbook: “sticker label” feel (rounded corners, light border, subtle paper-like background).
- Noir: minimal ink UI (thin borders, stark contrast, less padding, calmer).

Acceptance criteria:
- No “generic UI kit” vibe; consistent with canvas.

---

## Phase 8 — Visual QA / performance / reduceFx

### Task 8.1: Reduce-FX behavior review
Acceptance criteria:
- Flipbook: less texture/smudge.
- Noir: reduced grain/vignette intensity.

### Task 8.2: Mobile readability & input safety
Acceptance criteria:
- Theme switcher doesn’t break layout.
- Input overlay remains functional.

### Task 8.3: Snapshot checklist (manual)
- Screenshot: Flipbook idle, charging, mid-flight, near-edge danger, landing.
- Screenshot: Noir same 5 moments.

---

## Implementation order (recommended)

1. Phase 1 (multi-theme + persistence)
2. Phase 2 (theme switcher)
3. Phase 4 (Noir render path + vignette/grain) — so we can compare quickly
4. Phase 3 (Enhanced Flipbook polish)
5. Phase 5 (signature trails)
6. Phase 6 (impact feedback)
7. Phase 7 (HUD hierarchy + controls styling)
8. Phase 8 (QA + reduceFx tuning)

---

## Notes / Risks

- Keep rendering changes isolated: avoid touching gameplay math.
- Avoid introducing new global CSS or fonts; use existing Tailwind + theme tokens.
- Grain implementations can be expensive if done per-pixel naively; prefer low-cost patterns.

---

## Open decisions (pick later, defaults are safe)

1. **Theme gating by achievements:**
   - Default for iteration: both themes available.
   - Later: gate Noir behind an achievement.

2. **Where Noir renderer lives:**
   - Cleaner: separate `render_noir.ts`.
   - Simpler: function inside `render.ts`.

---

## Implementation Complete (2026-01-09)

All phases have been implemented:

### Phase 1 - Multi-theme system ✓
- `ThemeId` type (`'flipbook' | 'noir'`)
- `RenderStyle` interface with wobble, grain, vignette, pencilLayers
- `THEMES` record, `getTheme()`, `DEFAULT_THEME_ID`, `THEME_IDS`
- Theme persistence in localStorage

### Phase 2 - Theme selector ✓
- Theme toggle button in settings row (cycles between themes)

### Phase 3 - Enhanced Flipbook ✓
- `LINE_WEIGHTS` constants (primary: 2.5, secondary: 1.5, shadow: 1.0)
- `drawLayeredHandLine()` and `drawLayeredHandCircle()` primitives
- Paper smudge marks (graphite smears) and eraser marks

### Phase 4 - Noir Ink renderer ✓
- Complete `renderNoirFrame()` function with minimal, high-contrast styling
- `drawFilmGrain()` - animated noise pattern
- `drawVignette()` - radial gradient edge darkening
- Both respect `reduceFx` flag

### Phase 5 - Signature trajectories ✓
- Flipbook: graphite/chalk dots with varied radius/alpha and position jitter
- Noir: ink droplets with splatter and velocity smear

### Phase 6 - Impact feedback ✓
- Landing emphasis: 1.3x lineWidth, micro-offset shake
- `drawImpactBurst()` with theme-specific styling (dust puffs vs ink blots)

### Phase 7 - HUD hierarchy + controls ✓
- Hero row: SCORE, LV, TARGET (largest)
- Secondary row: LAST, BEST (medium)
- Theme-aware button styling (sticker vs minimal ink)

### Phase 8 - QA / Mobile ✓
- `reduceFx` behavior: reduces grain, vignette, smudge marks, impact bursts
- Mobile: flex-wrap on controls, touch-friendly button sizes (28px min height)

### Snapshot Checklist (Manual Verification)
Run the dev server and verify these moments look consistent per theme:

**Flipbook Theme:**
- [ ] Idle: Paper texture visible, warm cream background, blue ink player
- [ ] Charging: Power bar with hand-drawn style, angle indicator with wobble
- [ ] Mid-flight: Graphite/chalk trajectory dots with variation
- [ ] Near-edge danger: Red danger border blinking, record zone effects
- [ ] Landing: Impact burst (dust puffs), squash animation

**Noir Theme:**
- [ ] Idle: Dark background, off-white player, vignette visible
- [ ] Charging: Minimal power bar, clean angle line
- [ ] Mid-flight: Ink droplets with splatter and smear
- [ ] Near-edge danger: Danger glow, minimal "RECORD" text
- [ ] Landing: Impact burst (ink drops), film grain visible
