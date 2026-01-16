# Layout / UI Polish Map (based on screenshots)

Date: 2026-01-09
Last verified: 2026-01-09 (cross-checked with codebase)
Scope: Visual layout, spacing, typography, controls sizing, polish. No gameplay changes.
Targets: Flipbook + Noir themes.
Primary files:
- `src/components/Game.tsx` (main game UI)
- `src/components/StatsOverlay.tsx` (stats modal)
- `src/components/LeaderboardScreen.tsx` (leaderboard modal)
- `src/components/NicknameModal.tsx` (onboarding modal)
- `src/index.css` (global styles, body background)
- `src/game/themes.ts` (theme tokens)

## What the screenshots show (quick read)

### Strong points
- Canvas is the hero and looks great in both themes.
- The theme-specific canvas frame (border/shadow) reads well.
- Hero stats row (Score / Lv / Target) is a good direction.
- Landscape trimming (hiding tertiary blocks) is the right strategy.

### Weak points / friction
1) **Background doesn't fill the viewport on desktop** ✅ VERIFIED
   - Root cause: `body` in `index.css` uses `bg-background` (dark synthwave colors from CSS variables) which differs from theme gradients.
   - Game.tsx line 445: gradient uses `theme.background` → `theme.horizon`, applied to centered flex container.
   - Note: `theme.backgroundGradientEnd` exists in themes.ts but is unused.

2) **Typography is too small in many places** ✅ VERIFIED
   - Game.tsx line 616, 634: `text-[9px]` for Score/Lv/Target and Last/Best labels
   - Game.tsx line 662, 675, 685: `text-[10px]` for stats, session goals, daily challenge
   - Game.tsx line 707: `text-[9px]` for game info text

3) **Controls row is visually dense** ✅ VERIFIED
   - Game.tsx line 527, 537: `minHeight: '28px'` on buttons
   - Game.tsx line 543: All 6 controls in single `flex flex-wrap gap-2` container
   - Buttons: Sound/Muted, Vol slider, FX, Theme, Stats, Leaderboard

4) **Visual language inconsistency** ✅ VERIFIED
   - Range slider (lines 558-565) has no `accentColor` set — uses default browser blue
   - Heavy inline styles throughout, no CSS variables for theme tokens

5) **Vertical rhythm is uneven** ✅ VERIFIED
   - Mixed gaps: `gap-1`/`gap-2` (root), `gap-2` (controls), `gap-6` (hero), `gap-3` (stats)
   - Some intentional (hero needs breathing room), some inconsistent

6) **Mobile detection is static** (NEW)
   - `isMobileRef` (Game.tsx line 207-210) is set at mount and never updates on resize
   - Mix of JS-based and CSS-based responsive approaches

7) **Modal components lack consistent styling** (NEW)
   - StatsOverlay, LeaderboardScreen, NicknameModal each define their own button/card styles
   - Close buttons vary: `×` vs `x` character
   - Modal backdrops vary: `rgba(0,0,0,0.8)` vs `rgba(0,0,0,0.9)`

---

## Implementation map (phase-by-phase)

### Phase 1 — Fix overall page structure (highest leverage)

**Goal:** theme background fills the whole viewport, content stays at `max-w-md`.

**Current state (Game.tsx lines 442-446):**
```tsx
<div
  className={`flex flex-col items-center ${isMobileRef.current ? 'gap-1 p-1' : 'gap-2 p-2'}`}
  style={{ background: `linear-gradient(180deg, ${theme.background} 0%, ${theme.horizon} 100%)`, minHeight: '100vh' }}
>
```

**Issue:** Body has `bg-background` (index.css line 96) which is dark synthwave colors. When this container doesn't fill width, body shows through.

**Change:** restructure root wrapper into:
- Outer full-width container with background
- Inner centered column with `max-w-md w-full`

**Where:** `src/components/Game.tsx` lines 442-446, possibly `src/index.css`

**Option A - Fix in Game.tsx:**
- Outer: `div` with `className="w-full min-h-[100svh] flex justify-center"` and the theme gradient as `style.background`.
- Inner: `div` with `className="w-full max-w-md flex flex-col items-center"` and the current `gap/padding` logic.

**Option B - Fix body background in index.css:**
- Remove fixed `bg-background` from body, let page control it entirely

**Why:** fixes the black sidebars on desktop and makes the app feel "intentional".

**Acceptance check:**
- Desktop view: no black sidebars (unless intentionally designed).
- Both themes: background gradient spans edge-to-edge.

**Note:** Consider using `theme.backgroundGradientEnd` (defined in themes.ts but currently unused).

---

### Phase 2 — Typography scale & hierarchy (premium readability)

**Goal:** fewer font sizes, clearer tiers, better legibility.

**Current state (Game.tsx):**
| Element | Line | Current | Issue |
|---------|------|---------|-------|
| Score/Lv/Target labels | 616, 619, 624 | `text-[9px]` | Too small |
| Score/Lv numbers | 617, 621 | `text-2xl` | OK |
| Target number | 625 | `text-xl` | Slightly small |
| Last/Best labels | 634, 654 | `text-[9px]` | Too small |
| Last/Best numbers | 635, 655 | `text-base` | OK |
| Stats row | 662 | `text-[10px]` | Borderline |
| Session goals | 675 | `text-[10px]` | Borderline |
| Daily challenge | 685 | `text-[10px]` | Borderline |
| Game info | 707 | `text-[9px]` | Too small |
| Controls label | 458 | `text-[10px]` | Borderline |

**Rules (keep it simple):**
- **Tier A (hero numbers):** Score, Lv, Target numbers → `text-2xl`/`text-3xl`
- **Tier B (secondary numbers):** Last/Best → `text-base`/`text-lg`
- **Tier C (labels + microcopy):** everything else → minimum `text-xs` (12px)

**Recommended changes:**
- All `text-[9px]` → `text-[11px]` or `text-xs`
- All `text-[10px]` → `text-xs`
- Consider responsive: `text-xs sm:text-sm` for labels

**Where:** `src/components/Game.tsx` (lines listed above)

**Why:** the current 9–10px labels make the UI feel "prototype-ish" and reduce comfort.

**Acceptance check:**
- On mobile portrait, labels are readable without squinting.
- Hero numbers dominate visually, but don't crowd controls.

---

### Phase 3 — Controls row: spacing, sizing, and grouping

**Goal:** reduce density and increase touch comfort without adding new screens.

**Current state (Game.tsx):**
- Lines 520-537: Button styles defined with `minHeight: 28px`
- Line 543: Container `<div className="flex flex-wrap items-center justify-center gap-2 text-[10px]">`
- Lines 544-608: Six controls (Sound, Vol slider, FX, Theme, Stats, Leaderboard) all inline

**Changes:**
1) Raise button height and padding slightly
   - Current: `minHeight: 28px` (lines 527, 537)
   - Recommended: `minHeight: 32px` (or 36px if you want truly touch-first)

2) Split controls into two rows on small widths (mobile)
   - Row 1: Sound / Vol / FX (audio controls)
   - Row 2: Theme / Stats / Leaderboard (navigation)

**Where:** `src/components/Game.tsx` lines 543-610

**How:**
- Wrap controls in a container `div` with `className="w-full max-w-md px-2"`.
- Inside, use two `div`s with `className="flex items-center justify-center gap-2"`.
- Use a breakpoint: on `sm:` combine into one row; on default keep 2 rows.
- Alternative: use CSS grid with `grid-cols-3 sm:grid-cols-6`

**Why:** six buttons on one row looks like a cramped toolbar and reduces perceived quality.

**Acceptance check:**
- Mobile portrait: buttons don't look squeezed.
- Desktop: stays compact and aligned.

---

### Phase 4 — Theme-consistent slider styling (especially Noir)

**Goal:** range input should not look "default blue web control", particularly in Noir.

**Current state (Game.tsx lines 558-565):**
```tsx
<input
  type="range"
  min={0}
  max={100}
  value={Math.round(audioSettings.volume * 100)}
  onChange={(e) => setAudioSettings((s) => ({ ...s, volume: Number(e.target.value) / 100 }))}
  style={{ width: isNoir ? '50px' : '60px' }}  // No accentColor!
/>
```

**Where:** `src/components/Game.tsx` line 564

**Change (low-effort):**
- Add `accentColor` to style object:
```tsx
style={{
  width: isNoir ? '50px' : '60px',
  accentColor: isNoir ? theme.accent2 : theme.accent1
}}
```

**Alternative (higher effort):** Custom slider component with full theme control.

**Why:** right now the slider is the most "out of universe" element in Noir screenshots.

**Acceptance check:**
- Slider thumb/track uses the theme's accent (off-white for Noir, blue for Flipbook).

---

### Phase 5 — Spacing rhythm & alignment consistency

**Goal:** make spacing feel deliberate.

**Current state (Game.tsx):**
| Element | Line | Gap/Spacing | Notes |
|---------|------|-------------|-------|
| Root container | 444 | `gap-1` (mobile) / `gap-2` (desktop) | Responsive via JS |
| Header | 448 | `px-2` | `max-w-md` |
| Controls label | 458 | `px-2` | `max-w-md` |
| Controls | 543 | `gap-2` | No max-width constraint |
| Hero stats | 614 | `gap-6` | No max-width constraint |
| Secondary stats | 632 | `gap-6` | No max-width constraint |
| Stats row | 662 | `gap-3` | No max-width constraint |
| Session goals | 675 | - | `max-w-md` |
| Daily challenge | 685 | `p-2` | `max-w-md` |

**Changes:**
1) Use consistent section spacing
   - Prefer a single rhythm: `gap-2` or `gap-3` between blocks.
   - Keep `gap-6` for hero stats (intentional breathing room).

2) Align all main blocks to the same width
   - Add `max-w-md` to controls, hero stats, secondary stats.
   - Share the same horizontal padding (`px-2`).

**Where:** `src/components/Game.tsx`

**Why:** consistent rhythm is a major "polish" multiplier.

---

### Phase 6 — Daily Challenge visual weight

**Goal:** keep it visible but not competing with Score.

**Current state (Game.tsx lines 684-704):**
```tsx
<div
  className="text-[10px] text-center max-w-md p-2 rounded landscape:hidden"
  style={{
    background: dailyChallenge.completed ? `${theme.highlight}20` : `${theme.accent3}10`,
    border: `1px solid ${dailyChallenge.completed ? theme.highlight : theme.accent3}`,
    color: theme.uiText,
  }}
>
```

**Observed:** the Daily Challenge card is fairly prominent (border + background + padding) and can steal attention.

**Changes:**
- Reduce padding slightly: `p-2` → `p-1.5` or `py-1.5 px-2`
- Lower border opacity: `border: \`1px solid ${theme.accent3}40\``
- Background is already low opacity (`10` = ~6%), acceptable
- Keep copy at `text-xs` (per Phase 2) but lower contrast than hero

**Where:** `src/components/Game.tsx` lines 684-704

**Acceptance check:**
- You see it, but your eye returns to canvas/score first.

---

### Phase 7 — Modal consistency (NEW)

**Goal:** Unify styling across StatsOverlay, LeaderboardScreen, and NicknameModal.

**Current inconsistencies:**

| Aspect | StatsOverlay | LeaderboardScreen | NicknameModal |
|--------|--------------|-------------------|---------------|
| Backdrop | `rgba(0,0,0,0.8)` | `rgba(0,0,0,0.9)` | `rgba(0,0,0,0.9)` |
| Close button | `×` | `x` | None (can't close) |
| Border | `2px solid ${theme.accent1}` | Same | Same |
| Max height | `max-h-[80vh]` | `max-h-[85vh]` | None |
| Container | `max-w-md` | `max-w-md` | `max-w-sm` |

**Recommended standardization:**
- Backdrop: `rgba(0,0,0,0.85)` for all
- Close button: `×` character, consistent styling
- Max height: `max-h-[85vh]` for all scrollable modals
- Container: `max-w-md` for all (NicknameModal can stay `max-w-sm` as it's simpler)

**Where:**
- `src/components/StatsOverlay.tsx` lines 68-72, 82-88
- `src/components/LeaderboardScreen.tsx` lines 46-68
- `src/components/NicknameModal.tsx` lines 80-87

**Why:** Consistent modals feel like a cohesive design system.

**Acceptance check:**
- Opening any modal feels like the same "layer" experience.

---

## Optional (but high-value) polish ideas

### A) Reduce inline-style sprawl
**Why:** as UI grows, inline styles create visual drift and future tech debt.

**Current reality:** Game.tsx has 50+ inline `style={{}}` declarations.

**Suggestion:**
- Set CSS variables at the top wrapper (Game.tsx line 445):
```tsx
style={{
  background: `...`,
  '--ui-bg': theme.uiBg,
  '--ui-text': theme.uiText,
  '--ui-border': theme.accent3,
  '--ui-accent': theme.accent1,
  '--ui-highlight': theme.highlight,
} as React.CSSProperties}
```
- Then use them in child styles: `style={{ color: 'var(--ui-text)' }}`
- Or better: add to index.css with `:root` dynamically via JS

### B) Button states
**Observed:** buttons look the same on hover/active.

**Current (Game.tsx lines 538-540):**
```tsx
const buttonClass = isNoir
  ? 'rounded-sm focus-visible:outline-none focus-visible:ring-1'
  : 'rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1';
```
No hover/active states defined.

**Suggestion:**
- Add subtle pressed/hover feedback using opacity (no new colors):
```tsx
const buttonClass = isNoir
  ? 'rounded-sm focus-visible:outline-none focus-visible:ring-1 hover:opacity-80 active:opacity-70 transition-opacity'
  : 'rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 hover:opacity-90 active:translate-y-px transition-all';
```

### C) Replace static mobile detection (NEW)
**Issue:** `isMobileRef` (Game.tsx lines 207-210) is set once at mount.

**Current:**
```tsx
const isMobileRef = useRef(
  typeof window !== 'undefined' &&
  ('ontouchstart' in window || navigator.maxTouchPoints > 0)
);
```

**Suggestion:** Either:
1. Use CSS-only responsive approach (Tailwind breakpoints) instead of JS detection
2. Use a resize listener to update on orientation change

**Why:** Current approach breaks when testing responsive layouts in devtools.

---

## QA checklist (use screenshots as reference)

1) Desktop: background fills full width (no black sidebars).
2) Mobile portrait: controls not cramped; labels readable.
3) Noir: slider matches theme (no default blue).
4) Flipbook: overall feels like a cohesive "paper app", not a web demo.
5) Landscape: tertiary blocks still hidden and layout stays stable.
6) **NEW:** All modals have consistent backdrop opacity.
7) **NEW:** Button hover/active states provide feedback.
8) **NEW:** Typography minimum is `text-xs` (12px), no `text-[9px]`.

---

## Implementation priority (recommended order)

1. **Phase 4** (Slider accentColor) — 1 line change, immediate visual win
2. **Phase 2** (Typography) — Search/replace, high readability impact
3. **Phase 1** (Background structure) — Architectural, fixes desktop view
4. **Phase 3** (Controls row) — Medium effort, good mobile UX
5. **Phase 6** (Daily Challenge) — Small tweak
6. **Phase 5** (Spacing rhythm) — Polish pass
7. **Phase 7** (Modal consistency) — Cross-file changes
8. **Optional items** — As time permits

---

## Notes for implementation
- Don't add new screens or modals.
- Don't introduce new colors; use existing theme tokens.
- Keep changes surgical inside `src/components/Game.tsx` first.
- Test both Flipbook and Noir themes after each phase.
- Test on mobile Safari (iOS quirks) and Chrome (Android).
