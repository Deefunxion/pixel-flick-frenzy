# Engagement & Juice Systems Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Transform One-More-Flick from functional game to dopamine-rich, retention-optimized mobile experience through 9 engagement layers.

**Architecture:** Canvas-based rendering for immediate visual feedback (particles, text popups, flashes), React overlays for complex UI (toasts, HUD elements), WebAudio for audio juice. State extended with new tracking fields. All effects respect `reduceFx` setting.

**Tech Stack:** React 18, TypeScript, Canvas 2D API, WebAudio API, localStorage persistence

**Design Document:** `docs/plans/2026-01-21-engagement-juice-design.md`

**Research Sources:** `docs/plans/grok_on_juice.md`, `docs/plans/deepseek_on_juice.md`

---

## Task Summary (27 Tasks)

| Phase | Focus | Tasks |
|-------|-------|-------|
| **Phase 1** | Core Juice | 1.1-1.6 (ring popups, multiplier ladder, audio, **haptics**, **anti-fatigue**, **fail juice**) |
| **Phase 2** | Landing Grades | 2.1-2.3 (grade system, UI, audio) |
| **Phase 3** | Near-Miss Drama | 3.1-3.3 (heartbeat, visuals, dramatic pause) |
| **Phase 4** | Streak & Momentum | 4.1-4.3 (counter, break feedback, ON FIRE mode) |
| **Phase 5** | Goal Tracking | 5.1-5.2 (mini HUD, toast queue) |
| **Phase 6** | Charge Feel | 6.1-6.4 (sweet spot, tension audio, **charge glow**, **input buffering**) |
| **Phase 7** | Live Stats | 7.1 (PB callouts) |
| **Phase 8** | Air Control | 8.1-8.4 (trail effects, stamina warnings, action denied, **performance guardrails**) |

**New from research review (bolded above):**
- Task 1.4: Haptic feedback layer (Android Vibration API)
- Task 1.5: Audio anti-fatigue (pooling, pitch variation, session decay)
- Task 1.6: Regular fail juice (hit-stop, dust, thud for all falls)
- Task 6.3: Charge visual tension (glow, vignette, particles)
- Task 6.4: Input buffering during slow-mo/freeze
- Task 8.4: Performance guardrails (FPS, particle budget, haptic rate limiting)

---

## Phase 1: Core Juice (Highest Impact)

### Task 1.1: Ring Collection Text Popup System

**Files:**
- Create: `src/game/engine/ringJuice.ts`
- Modify: `src/game/engine/types.ts:85-95`
- Modify: `src/game/engine/update.ts:445-480`
- Modify: `src/game/engine/render.ts:450-500`
- Test: Manual verification (visual)

**Step 1: Extend GameState for ring juice**

Add to `src/game/engine/types.ts` after line 95 (after `ringMultiplier`):

```typescript
// Ring juice state
ringJuicePopups: RingJuicePopup[];
lastRingCollectTime: number;
```

**Step 2: Create ringJuice.ts module**

Create `src/game/engine/ringJuice.ts`:

```typescript
/**
 * Ring Collection Juice System
 *
 * Provides escalating feedback for ring collection:
 * - Text popups ("Nice!", "Great!", "PERFECT!")
 * - Screen edge glow effects
 * - Micro-freeze timing
 */

export interface RingJuicePopup {
  x: number;
  y: number;
  text: string;
  color: string;
  createdAt: number;
  scale: number;
  opacity: number;
}

// Escalating text based on rings collected this throw
export const RING_FEEDBACK = [
  { text: 'Nice!', color: '#7FD858', glow: false },      // Ring 1 - green
  { text: 'Great!', color: '#FFD700', glow: true },      // Ring 2 - gold + edge glow
  { text: 'PERFECT!', color: '#FFA500', glow: true, flash: true },  // Ring 3 - orange + flash
];

// Popup animation constants
export const POPUP_DURATION_MS = 800;
export const POPUP_RISE_SPEED = 40;  // pixels per second
export const POPUP_FADE_START = 0.6; // start fading at 60% of duration

// Micro-freeze duration (skip if already in slow-mo)
export const MICRO_FREEZE_MS = 70;

/**
 * Create a juice popup for ring collection
 */
export function createRingPopup(
  ringX: number,
  ringY: number,
  ringIndex: number,  // 0, 1, or 2 (how many collected so far, 0-indexed)
  now: number
): RingJuicePopup {
  const feedback = RING_FEEDBACK[Math.min(ringIndex, 2)];
  return {
    x: ringX,
    y: ringY - 20,  // Start slightly above ring
    text: feedback.text,
    color: feedback.color,
    createdAt: now,
    scale: 1.5,     // Start big
    opacity: 1.0,
  };
}

/**
 * Update all juice popups (call each frame)
 */
export function updateRingPopups(
  popups: RingJuicePopup[],
  deltaMs: number,
  now: number
): RingJuicePopup[] {
  return popups
    .map(popup => {
      const age = now - popup.createdAt;
      const progress = age / POPUP_DURATION_MS;

      // Rise upward
      const newY = popup.y - (POPUP_RISE_SPEED * deltaMs / 1000);

      // Scale: 1.5 → 1.0 over first 200ms
      const scaleProgress = Math.min(age / 200, 1);
      const newScale = 1.5 - 0.5 * scaleProgress;

      // Fade: start at 60%, complete at 100%
      const fadeProgress = Math.max(0, (progress - POPUP_FADE_START) / (1 - POPUP_FADE_START));
      const newOpacity = 1 - fadeProgress;

      return {
        ...popup,
        y: newY,
        scale: newScale,
        opacity: newOpacity,
      };
    })
    .filter(popup => (now - popup.createdAt) < POPUP_DURATION_MS);
}

/**
 * Check if we should apply micro-freeze
 */
export function shouldMicroFreeze(currentSlowMo: number): boolean {
  // Skip if already in slow-mo (> 0.3 means significant slowdown)
  return currentSlowMo < 0.3;
}

/**
 * Get edge glow intensity (0-1) based on rings collected
 */
export function getEdgeGlowIntensity(ringsCollected: number): number {
  if (ringsCollected < 2) return 0;
  if (ringsCollected === 2) return 0.3;
  return 0.6;  // 3 rings
}

/**
 * Check if screen flash should trigger
 */
export function shouldScreenFlash(ringsCollected: number): boolean {
  return ringsCollected >= 3;
}
```

**Step 3: Initialize ring juice state**

In `src/game/engine/state.ts`, add to `createInitialState()` (around line 180):

```typescript
// Ring juice
ringJuicePopups: [],
lastRingCollectTime: 0,
```

And in `resetPhysics()` (around line 270):

```typescript
// Reset ring juice
state.ringJuicePopups = [];
state.lastRingCollectTime = 0;
```

**Step 4: Integrate ring juice into update.ts**

In `src/game/engine/update.ts`, find the ring collection section (around line 445-480 where `checkRingCollision` is called). Modify it:

```typescript
import {
  createRingPopup,
  updateRingPopups,
  shouldMicroFreeze,
  getEdgeGlowIntensity,
  shouldScreenFlash,
  MICRO_FREEZE_MS
} from './ringJuice';

// Inside the ring collection check:
if (checkRingCollision(state.px, state.py, ring)) {
  ring.passed = true;
  ring.passedAt = nowMs;
  state.ringsPassedThisThrow++;

  // Apply multiplier
  state.ringMultiplier *= RING_MULTIPLIERS[i];

  // === RING JUICE ===

  // 1. Create text popup
  state.ringJuicePopups.push(
    createRingPopup(ring.x, ring.y, state.ringsPassedThisThrow - 1, nowMs)
  );

  // 2. Micro-freeze (if not already in slow-mo)
  if (shouldMicroFreeze(state.slowMo)) {
    state.slowMo = Math.max(state.slowMo, 0.95);  // Brief pause
    state.lastRingCollectTime = nowMs;
  }

  // 3. Screen flash on 3rd ring
  if (shouldScreenFlash(state.ringsPassedThisThrow) && !state.reduceFx) {
    state.screenFlash = 0.5;  // Stronger flash
  } else if (!state.reduceFx) {
    state.screenFlash = 0.3;  // Normal flash
  }

  // 4. Edge glow (stored for render)
  state.edgeGlowIntensity = getEdgeGlowIntensity(state.ringsPassedThisThrow);

  // Existing particle burst
  for (let p = 0; p < 10; p++) {
    const angle = (p / 10) * Math.PI * 2;
    state.particles.push({
      x: ring.x,
      y: ring.y,
      vx: Math.cos(angle) * 2,
      vy: Math.sin(angle) * 2,
      life: 30,
      maxLife: 30,
      color: ring.color,
    });
  }

  // Existing audio
  audio.ringCollect(i as 0 | 1 | 2);
}

// Update ring juice popups (outside collision check, every frame)
state.ringJuicePopups = updateRingPopups(
  state.ringJuicePopups,
  effectiveDeltaMs,
  nowMs
);

// Decay micro-freeze
if (state.lastRingCollectTime > 0 && nowMs - state.lastRingCollectTime > MICRO_FREEZE_MS) {
  // Let slowMo decay naturally via existing code
}
```

**Step 5: Add edgeGlowIntensity to types**

In `src/game/engine/types.ts`, add:

```typescript
edgeGlowIntensity: number;  // 0-1 for screen edge glow effect
```

Initialize to 0 in `createInitialState()` and reset in `resetPhysics()`.

**Step 6: Render ring juice popups**

In `src/game/engine/render.ts`, add after particle rendering (around line 450-500):

```typescript
import { POPUP_DURATION_MS } from './ringJuice';

// Render ring juice popups
function renderRingPopups(
  ctx: CanvasRenderingContext2D,
  popups: RingJuicePopup[]
): void {
  for (const popup of popups) {
    ctx.save();
    ctx.globalAlpha = popup.opacity;
    ctx.translate(popup.x, popup.y);
    ctx.scale(popup.scale, popup.scale);

    // Draw text with outline
    ctx.font = 'bold 14px "Comic Sans MS", cursive';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Outline
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 3;
    ctx.strokeText(popup.text, 0, 0);

    // Fill
    ctx.fillStyle = popup.color;
    ctx.fillText(popup.text, 0, 0);

    ctx.restore();
  }
}

// Render edge glow
function renderEdgeGlow(
  ctx: CanvasRenderingContext2D,
  intensity: number,
  width: number,
  height: number,
  color: string = '#FFD700'
): void {
  if (intensity <= 0) return;

  const gradient = ctx.createLinearGradient(0, 0, 30, 0);
  gradient.addColorStop(0, `rgba(255, 215, 0, ${intensity * 0.4})`);
  gradient.addColorStop(1, 'rgba(255, 215, 0, 0)');

  // Left edge
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 30, height);

  // Right edge (mirror)
  ctx.save();
  ctx.translate(width, 0);
  ctx.scale(-1, 1);
  ctx.fillRect(0, 0, 30, height);
  ctx.restore();
}

// Call these in renderFlipbookFrame/renderNoirFrame before final overlays:
renderEdgeGlow(ctx, state.edgeGlowIntensity, W, H);
renderRingPopups(ctx, state.ringJuicePopups);
```

**Step 7: Commit**

```bash
git add src/game/engine/ringJuice.ts src/game/engine/types.ts src/game/engine/state.ts src/game/engine/update.ts src/game/engine/render.ts
git commit -m "feat(juice): add ring collection text popups and edge glow effects

- Create ringJuice.ts with popup system and escalating feedback
- Add 'Nice!', 'Great!', 'PERFECT!' popups that rise and fade
- Add screen edge glow on 2nd/3rd ring collection
- Add micro-freeze effect on ring collection
- Popups scale down from 1.5x to 1.0x with smooth fade"
```

---

### Task 1.2: Multiplier Ladder HUD

**Files:**
- Create: `src/components/MultiplierLadder.tsx`
- Modify: `src/components/Game.tsx:95-110` (imports), `1200-1220` (render)
- Modify: `src/game/engine/types.ts` (add ladder state)

**Step 1: Create MultiplierLadder component**

Create `src/components/MultiplierLadder.tsx`:

```typescript
/**
 * Multiplier Ladder HUD
 *
 * Shows current multiplier with threshold ticks:
 * 1.5x / 2.0x / 2.5x / 3.0x
 *
 * Glows and pulses when thresholds are passed.
 */

import React, { useEffect, useState } from 'react';

interface MultiplierLadderProps {
  currentMultiplier: number;  // Combined risk * ring multiplier
  isFlying: boolean;
  reduceFx: boolean;
}

const THRESHOLDS = [1.5, 2.0, 2.5, 3.0];

export function MultiplierLadder({
  currentMultiplier,
  isFlying,
  reduceFx
}: MultiplierLadderProps) {
  const [lastThreshold, setLastThreshold] = useState(0);
  const [glowActive, setGlowActive] = useState(false);

  // Track threshold crossing
  useEffect(() => {
    const currentThreshold = THRESHOLDS.filter(t => currentMultiplier >= t).length;
    if (currentThreshold > lastThreshold && !reduceFx) {
      setGlowActive(true);
      setTimeout(() => setGlowActive(false), 300);
    }
    setLastThreshold(currentThreshold);
  }, [currentMultiplier, lastThreshold, reduceFx]);

  // Only show during flight
  if (!isFlying) return null;

  // Calculate display multiplier
  const displayMultiplier = currentMultiplier.toFixed(2);

  // Color based on multiplier
  const getColor = () => {
    if (currentMultiplier >= 3.0) return '#FF6B00';  // Orange
    if (currentMultiplier >= 2.0) return '#FFD700';  // Gold
    if (currentMultiplier >= 1.5) return '#7FD858';  // Green
    return '#FFFFFF';  // White
  };

  return (
    <div
      className={`
        fixed top-16 right-4
        bg-black/60 rounded-lg px-3 py-2
        border-2 transition-all duration-150
        ${glowActive ? 'border-yellow-400 shadow-lg shadow-yellow-400/50' : 'border-white/30'}
      `}
    >
      {/* Multiplier display */}
      <div
        className="text-2xl font-bold text-center"
        style={{ color: getColor() }}
      >
        🎯 {displayMultiplier}x
      </div>

      {/* Threshold ticks */}
      <div className="flex gap-1 mt-1 justify-center">
        {THRESHOLDS.map((threshold, i) => (
          <div
            key={threshold}
            className={`
              w-2 h-2 rounded-full transition-colors
              ${currentMultiplier >= threshold
                ? 'bg-yellow-400'
                : 'bg-white/30'}
            `}
            title={`${threshold}x`}
          />
        ))}
      </div>
    </div>
  );
}

export default MultiplierLadder;
```

**Step 2: Integrate into Game.tsx**

Add import at top of `src/components/Game.tsx`:

```typescript
import { MultiplierLadder } from './MultiplierLadder';
```

Add state for combined multiplier (around line 180, with other useState):

```typescript
const [combinedMultiplier, setCombinedMultiplier] = useState(1.0);
```

Update in the game loop sync (around line 900, in the `setInterval` for HUD updates):

```typescript
// Sync combined multiplier
const combined = stateRef.current.currentMultiplier * stateRef.current.ringMultiplier;
setCombinedMultiplier(combined);
```

Add to render (around line 1200, with other HUD overlays):

```typescript
{/* Multiplier Ladder HUD */}
<MultiplierLadder
  currentMultiplier={combinedMultiplier}
  isFlying={hudFlying}
  reduceFx={reduceFx}
/>
```

**Step 3: Commit**

```bash
git add src/components/MultiplierLadder.tsx src/components/Game.tsx
git commit -m "feat(juice): add multiplier ladder HUD during flight

- Shows current combined multiplier (risk × ring)
- Threshold ticks at 1.5x / 2.0x / 2.5x / 3.0x
- Glows when crossing thresholds
- Color changes based on multiplier level
- Only visible during flight"
```

---

### Task 1.3: Ring Collection Audio Enhancement

**Files:**
- Modify: `src/game/engine/audio.ts:180-220`
- Modify: `src/game/engine/update.ts:445-480`

**Step 1: Add escalating pitch to ring collection**

In `src/game/engine/audio.ts`, modify the `ringCollect` function (around line 180-220):

```typescript
/**
 * Ring collection with escalating pitch and stereo pan
 * @param ringIndex 0, 1, or 2
 * @param ringX Ring X position for stereo pan (0-480)
 */
ringCollect(ringIndex: 0 | 1 | 2, ringX: number = 240): void {
  if (!this.ctx || this.muted) return;

  // Base frequencies (A major chord) with escalating pitch
  const baseFreqs = [440, 554, 659];  // A4, C#5, E5
  const pitchMultiplier = 1 + ringIndex * 0.1;  // 1.0, 1.1, 1.2
  const freq = baseFreqs[ringIndex] * pitchMultiplier;

  // Stereo pan based on ring X position (-1 to 1)
  const pan = (ringX - 240) / 240;  // -1 (left) to +1 (right)

  const osc = this.ctx.createOscillator();
  const gain = this.ctx.createGain();
  const panner = this.ctx.createStereoPanner();

  osc.type = 'sine';
  osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

  panner.pan.setValueAtTime(Math.max(-1, Math.min(1, pan)), this.ctx.currentTime);

  gain.gain.setValueAtTime(0.3 * this.volume, this.ctx.currentTime);
  gain.gain.exponentialDecayTo(0.01, this.ctx.currentTime + 0.3);

  osc.connect(panner);
  panner.connect(gain);
  gain.connect(this.ctx.destination);

  osc.start();
  osc.stop(this.ctx.currentTime + 0.3);

  // Bonus flourish on 3rd ring
  if (ringIndex === 2) {
    setTimeout(() => this.threeRingFlourish(), 150);
  }
}

/**
 * Bonus sound flourish for collecting all 3 rings
 */
private threeRingFlourish(): void {
  if (!this.ctx || this.muted) return;

  // Quick ascending arpeggio
  const notes = [784, 988, 1175];  // G5, B5, D6
  notes.forEach((freq, i) => {
    setTimeout(() => {
      this.tone(freq, 0.15, 'sine', 0.2);
    }, i * 50);
  });
}
```

**Step 2: Pass ring X position to audio**

In `src/game/engine/update.ts`, update the ring collection audio call:

```typescript
// Change from:
audio.ringCollect(i as 0 | 1 | 2);

// To:
audio.ringCollect(i as 0 | 1 | 2, ring.x);
```

**Step 3: Add "coin" sound for immediate feedback**

In `src/game/engine/audio.ts`, add short coin sound:

```typescript
/**
 * Short coin collection sound (plays before the chord)
 */
coinCollect(): void {
  if (!this.ctx || this.muted) return;

  const osc = this.ctx.createOscillator();
  const gain = this.ctx.createGain();

  osc.type = 'square';
  osc.frequency.setValueAtTime(1200, this.ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(800, this.ctx.currentTime + 0.05);

  gain.gain.setValueAtTime(0.15 * this.volume, this.ctx.currentTime);
  gain.gain.exponentialDecayTo(0.01, this.ctx.currentTime + 0.08);

  osc.connect(gain);
  gain.connect(this.ctx.destination);

  osc.start();
  osc.stop(this.ctx.currentTime + 0.08);
}
```

In update.ts, call before ringCollect:

```typescript
audio.coinCollect();
audio.ringCollect(i as 0 | 1 | 2, ring.x);
```

**Step 4: Commit**

```bash
git add src/game/engine/audio.ts src/game/engine/update.ts
git commit -m "feat(juice): enhance ring collection audio

- Add escalating pitch (1.0x, 1.1x, 1.2x) per ring
- Add stereo pan based on ring X position
- Add bonus flourish arpeggio on 3rd ring collection
- Add short 'coin' sound for immediate feedback"
```

---

### Task 1.4: Haptic Feedback Layer (Android)

**Files:**
- Create: `src/game/engine/haptics.ts`
- Modify: `src/game/engine/update.ts`
- Modify: `src/components/Game.tsx`

**Step 1: Create haptics.ts module**

Create `src/game/engine/haptics.ts`:

```typescript
/**
 * Haptic Feedback System
 *
 * Provides tactile feedback for key game events.
 * Uses Vibration API with graceful fallback.
 *
 * Research: "Combined audiohaptic feedback significantly enhances
 * motor performance and precision" - Husain et al., 2019
 */

// Check for Vibration API support
export function hasHapticSupport(): boolean {
  return typeof navigator !== 'undefined' && 'vibrate' in navigator;
}

// User preference for haptics
let hapticsEnabled = true;

export function setHapticsEnabled(enabled: boolean): void {
  hapticsEnabled = enabled;
  localStorage.setItem('omf_haptics_enabled', enabled ? '1' : '0');
}

export function getHapticsEnabled(): boolean {
  const stored = localStorage.getItem('omf_haptics_enabled');
  if (stored !== null) {
    hapticsEnabled = stored === '1';
  }
  return hapticsEnabled;
}

/**
 * Trigger haptic feedback
 * @param pattern - Single duration or pattern array [vibrate, pause, vibrate, ...]
 */
function vibrate(pattern: number | number[]): void {
  if (!hapticsEnabled || !hasHapticSupport()) return;

  try {
    navigator.vibrate(pattern);
  } catch (e) {
    // Silently fail - haptics are enhancement, not critical
  }
}

// === Haptic Patterns ===

/**
 * Ring collection - short, satisfying tap
 * Intensity scales with ring index (0, 1, 2)
 */
export function hapticRingCollect(ringIndex: number): void {
  const durations = [20, 35, 50];  // Escalating intensity
  vibrate(durations[Math.min(ringIndex, 2)]);
}

/**
 * Perfect landing - celebratory pattern
 */
export function hapticPerfectLanding(): void {
  vibrate([50, 30, 80]);  // Short-pause-long
}

/**
 * Good landing - single medium pulse
 */
export function hapticGoodLanding(): void {
  vibrate(40);
}

/**
 * Near-miss - dramatic pulse synced with heartbeat
 */
export function hapticNearMiss(): void {
  vibrate([80, 150, 60]);  // thump-pause-thump
}

/**
 * Fail/fall - impact feedback
 */
export function hapticFail(): void {
  vibrate(60);
}

/**
 * Achievement unlock - celebration pattern
 */
export function hapticAchievement(): void {
  vibrate([30, 50, 30, 50, 80]);  // Quick celebration
}

/**
 * Multiplier threshold crossed
 */
export function hapticMultiplierThreshold(): void {
  vibrate([25, 25, 40]);
}

/**
 * Action denied - sharp negative feedback
 */
export function hapticDenied(): void {
  vibrate([15, 30, 15]);  // Quick double-tap
}

/**
 * Charge release - snap feedback
 */
export function hapticRelease(): void {
  vibrate(30);
}

/**
 * Streak milestone (3, 5, 10, 15)
 */
export function hapticStreakMilestone(streak: number): void {
  if (streak >= 10) {
    vibrate([40, 30, 40, 30, 60]);  // Big celebration
  } else if (streak >= 5) {
    vibrate([30, 30, 50]);
  } else {
    vibrate([25, 25, 35]);
  }
}
```

**Step 2: Integrate haptics into update.ts**

In `src/game/engine/update.ts`, add imports and calls:

```typescript
import {
  hapticRingCollect,
  hapticPerfectLanding,
  hapticGoodLanding,
  hapticNearMiss,
  hapticFail,
  hapticRelease,
  hapticDenied,
  hapticMultiplierThreshold
} from './haptics';

// On ring collection:
hapticRingCollect(state.ringsPassedThisThrow - 1);

// On landing (based on grade):
if (grade === 'S' || grade === 'A') {
  hapticPerfectLanding();
} else if (grade === 'B' || grade === 'C') {
  hapticGoodLanding();
}

// On near-miss:
hapticNearMiss();

// On fall:
hapticFail();

// On throw release:
hapticRelease();

// On action denied:
hapticDenied();

// On multiplier threshold:
hapticMultiplierThreshold();
```

**Step 3: Add haptics toggle to settings**

In `src/components/Game.tsx`, add haptics toggle near audio settings:

```typescript
import { getHapticsEnabled, setHapticsEnabled, hasHapticSupport } from '@/game/engine/haptics';

// State
const [hapticsEnabled, setHapticsEnabledState] = useState(getHapticsEnabled());

// Toggle handler
const toggleHaptics = () => {
  const newValue = !hapticsEnabled;
  setHapticsEnabled(newValue);
  setHapticsEnabledState(newValue);
};

// Only show toggle if device supports haptics
{hasHapticSupport() && (
  <button onClick={toggleHaptics}>
    {hapticsEnabled ? '📳' : '📴'}
  </button>
)}
```

**Step 4: Commit**

```bash
git add src/game/engine/haptics.ts src/game/engine/update.ts src/components/Game.tsx
git commit -m "feat(juice): add haptic feedback layer for Android

- Create haptics.ts with Vibration API wrapper
- Add haptic patterns for all key events:
  - Ring collection (escalating intensity)
  - Landing (perfect vs good patterns)
  - Near-miss (heartbeat sync)
  - Fail, release, denied, achievements
- User preference toggle with localStorage
- Graceful fallback when unsupported"
```

---

### Task 1.5: Audio Anti-Fatigue System

**Files:**
- Create: `src/game/engine/audioPool.ts`
- Modify: `src/game/engine/audio.ts`

**Step 1: Create audioPool.ts module**

Create `src/game/engine/audioPool.ts`:

```typescript
/**
 * Audio Pool & Anti-Fatigue System
 *
 * Prevents audio fatigue through:
 * - Sound pooling (max concurrent instances)
 * - Pitch variation (±15% random)
 * - Session volume decay
 * - Cooldown enforcement
 *
 * Research: "Slightly randomize the pitch of frequent sound effects
 * (within 0.9-1.1 range) to reduce perceptual fatigue"
 */

interface PooledSound {
  lastPlayedAt: number;
  playCount: number;
}

// Track sound instances
const soundPool: Map<string, PooledSound[]> = new Map();

// Configuration
const MAX_CONCURRENT_SOUNDS = 4;
const DEFAULT_COOLDOWN_MS = 100;
const PITCH_VARIATION = 0.15;  // ±15%

// Session volume decay
let sessionStartTime = Date.now();
let sessionVolumeMultiplier = 1.0;
const VOLUME_DECAY_INTERVAL_MS = 3 * 60 * 1000;  // Every 3 minutes
const VOLUME_DECAY_AMOUNT = 0.05;  // 5% quieter
const MIN_SESSION_VOLUME = 0.7;  // Never below 70%

/**
 * Update session volume (call periodically)
 */
export function updateSessionVolume(): number {
  const elapsed = Date.now() - sessionStartTime;
  const decaySteps = Math.floor(elapsed / VOLUME_DECAY_INTERVAL_MS);
  sessionVolumeMultiplier = Math.max(
    MIN_SESSION_VOLUME,
    1.0 - (decaySteps * VOLUME_DECAY_AMOUNT)
  );
  return sessionVolumeMultiplier;
}

/**
 * Reset session volume (e.g., on page focus)
 */
export function resetSessionVolume(): void {
  sessionStartTime = Date.now();
  sessionVolumeMultiplier = 1.0;
}

/**
 * Get current session volume multiplier
 */
export function getSessionVolumeMultiplier(): number {
  return sessionVolumeMultiplier;
}

/**
 * Check if a sound can play (respects pooling and cooldown)
 */
export function canPlaySound(
  soundId: string,
  cooldownMs: number = DEFAULT_COOLDOWN_MS
): boolean {
  const now = Date.now();
  const pool = soundPool.get(soundId) || [];

  // Clean up old entries
  const activePool = pool.filter(s => now - s.lastPlayedAt < 1000);

  // Check concurrent limit
  if (activePool.length >= MAX_CONCURRENT_SOUNDS) {
    return false;
  }

  // Check cooldown
  const lastPlayed = activePool[activePool.length - 1];
  if (lastPlayed && now - lastPlayed.lastPlayedAt < cooldownMs) {
    return false;
  }

  return true;
}

/**
 * Register a sound play
 */
export function registerSoundPlay(soundId: string): void {
  const now = Date.now();
  const pool = soundPool.get(soundId) || [];

  // Clean up old entries (older than 1 second)
  const activePool = pool.filter(s => now - s.lastPlayedAt < 1000);

  activePool.push({ lastPlayedAt: now, playCount: 1 });
  soundPool.set(soundId, activePool);
}

/**
 * Get random pitch variation
 * Returns multiplier between (1 - variation) and (1 + variation)
 */
export function getRandomPitch(variation: number = PITCH_VARIATION): number {
  return 1 + (Math.random() * 2 - 1) * variation;
}

/**
 * Get volume with session decay applied
 */
export function getDecayedVolume(baseVolume: number): number {
  updateSessionVolume();
  return baseVolume * sessionVolumeMultiplier;
}

/**
 * Cooldown values for different sound types
 */
export const SOUND_COOLDOWNS = {
  ringCollect: 150,
  coinCollect: 100,
  impact: 200,
  whoosh: 100,
  denied: 300,
  achievement: 500,
  gradeSound: 300,
  heartbeat: 400,
};
```

**Step 2: Integrate into audio.ts**

Modify `src/game/engine/audio.ts` to use the pool:

```typescript
import {
  canPlaySound,
  registerSoundPlay,
  getRandomPitch,
  getDecayedVolume,
  SOUND_COOLDOWNS
} from './audioPool';

// Modify existing methods to use pool:

ringCollect(ringIndex: 0 | 1 | 2, ringX: number = 240): void {
  if (!this.ctx || this.muted) return;

  // Check pool
  if (!canPlaySound('ringCollect', SOUND_COOLDOWNS.ringCollect)) return;
  registerSoundPlay('ringCollect');

  // Apply pitch variation
  const basePitch = [440, 554, 659][ringIndex];
  const pitch = basePitch * getRandomPitch(0.1);  // ±10% variation

  // Apply session volume decay
  const volume = getDecayedVolume(0.3 * this.volume);

  // ... rest of implementation with pitch and volume
}

// Similar changes to other frequently-called methods:
// - coinCollect()
// - tone()
// - impact()
```

**Step 3: Commit**

```bash
git add src/game/engine/audioPool.ts src/game/engine/audio.ts
git commit -m "feat(juice): add audio anti-fatigue system

- Create audioPool.ts with sound pooling
- Max 4 concurrent sounds per type
- Pitch variation ±15% to prevent repetition fatigue
- Session volume decay (5% quieter every 3 minutes)
- Cooldown enforcement per sound type
- Prevents audio spam on rapid actions"
```

---

### Task 1.6: Regular Fail Juice (Non-Near-Miss Falls)

**Files:**
- Modify: `src/game/engine/update.ts`
- Modify: `src/game/engine/render.ts`
- Modify: `src/game/engine/audio.ts`

**Step 1: Add fail state tracking**

In `src/game/engine/types.ts`:

```typescript
// Fail juice state
failJuiceActive: boolean;
failJuiceStartTime: number;
failImpactX: number;
failImpactY: number;
```

**Step 2: Trigger fail juice on any fall**

In `src/game/engine/update.ts`, when fall is detected:

```typescript
// On ANY fall (not just near-miss), trigger fail juice
if (state.fellOff && !state.failJuiceActive) {
  state.failJuiceActive = true;
  state.failJuiceStartTime = nowMs;
  state.failImpactX = state.px;
  state.failImpactY = state.py;

  // Hit-stop (brief freeze on impact)
  const FAIL_HIT_STOP_MS = 80;  // 5 frames at 60fps
  state.slowMo = Math.max(state.slowMo, 0.95);

  // Screen shake
  state.screenShake = 5;

  // Impact sound (if not already playing near-miss drama)
  if (!state.nearMissActive) {
    audio.failImpact();
  }

  // Haptic
  hapticFail();

  // Spawn dust particles at impact point
  if (!state.reduceFx) {
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI + Math.PI;  // Upward arc
      state.particles.push({
        x: state.failImpactX,
        y: H - 20,  // Ground level
        vx: Math.cos(angle) * (1 + Math.random()),
        vy: Math.sin(angle) * 2,
        life: 20 + Math.random() * 10,
        maxLife: 30,
        color: '#8B7355',  // Dust brown
      });
    }
  }
}

// Clear fail juice after duration
if (state.failJuiceActive && nowMs - state.failJuiceStartTime > 300) {
  state.failJuiceActive = false;
}
```

**Step 3: Add fail impact sound**

In `src/game/engine/audio.ts`:

```typescript
/**
 * Fail impact sound - dull thud
 */
failImpact(): void {
  if (!this.ctx || this.muted) return;

  if (!canPlaySound('failImpact', 200)) return;
  registerSoundPlay('failImpact');

  const osc = this.ctx.createOscillator();
  const gain = this.ctx.createGain();

  osc.type = 'sine';
  osc.frequency.setValueAtTime(80, this.ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(40, this.ctx.currentTime + 0.15);

  const volume = getDecayedVolume(0.25 * this.volume);
  gain.gain.setValueAtTime(volume, this.ctx.currentTime);
  gain.gain.exponentialDecayTo(0.01, this.ctx.currentTime + 0.2);

  osc.connect(gain);
  gain.connect(this.ctx.destination);

  osc.start();
  osc.stop(this.ctx.currentTime + 0.2);
}
```

**Step 4: Initialize state**

In `src/game/engine/state.ts`:

```typescript
// createInitialState():
failJuiceActive: false,
failJuiceStartTime: 0,
failImpactX: 0,
failImpactY: 0,

// resetPhysics():
state.failJuiceActive = false;
state.failJuiceStartTime = 0;
```

**Step 5: Commit**

```bash
git add src/game/engine/types.ts src/game/engine/state.ts src/game/engine/update.ts src/game/engine/audio.ts
git commit -m "feat(juice): add fail juice for all falls

- Hit-stop (80ms) on any fall impact
- Screen shake on fail
- Dust particle burst at impact point
- Dull thud impact sound
- Works for all falls, not just near-misses
- Every failure now has satisfying feedback"
```

---

### Task 2.1: Landing Grade System Core

**Files:**
- Create: `src/game/engine/gradeSystem.ts`
- Modify: `src/game/engine/types.ts`
- Modify: `src/game/engine/state.ts`

**Step 1: Create gradeSystem.ts**

Create `src/game/engine/gradeSystem.ts`:

```typescript
/**
 * Landing Grade System
 *
 * Calculates letter grades (S/A/B/C/D) based on:
 * - Distance from target
 * - Rings passed
 * - Speed control (landing velocity)
 * - Edge proximity bonus
 */

export type Grade = 'S' | 'A' | 'B' | 'C' | 'D';

export interface GradeResult {
  grade: Grade;
  score: number;  // 0-100
  breakdown: {
    distance: number;    // 0-40
    rings: number;       // 0-30
    speedControl: number; // 0-20
    edgeBonus: number;   // 0-10
  };
  comment: string;
}

// Grade thresholds
const GRADE_THRESHOLDS: Record<Grade, number> = {
  S: 90,
  A: 70,
  B: 50,
  C: 30,
  D: 0,
};

// Coach comments per grade (Greek and English mix)
const COMMENTS: Record<Grade, string[]> = {
  S: ['FLAWLESS!', 'LEGENDARY!', 'Θρύλος!', 'MASTERFUL!'],
  A: ['Solid!', 'Clean run!', 'Καθαρό!', 'Nice work!'],
  B: ['Not bad!', 'Getting there!', 'Οκ δουλειά!', 'Keep it up!'],
  C: ['Room to improve', 'Keep trying!', 'Προσπάθησε ξανά'],
  D: ['Ouch...', 'Shake it off!', 'Ξαναπροσπάθησε...'],
};

// Tips for C/D grades
const TIPS = [
  'Tip: Try less power next time',
  'Tip: Use brake near the edge',
  'Tip: Aim for the rings!',
  'Tip: Watch your landing speed',
  'Tip: Hold to charge longer',
];

/**
 * Calculate landing grade
 */
export function calculateGrade(
  landingX: number,
  targetX: number,
  ringsPassedThisThrow: number,
  landingVelocity: number,  // Absolute velocity at landing
  fellOff: boolean
): GradeResult {
  // If fell off, always D
  if (fellOff) {
    return {
      grade: 'D',
      score: 0,
      breakdown: { distance: 0, rings: 0, speedControl: 0, edgeBonus: 0 },
      comment: getRandomComment('D'),
    };
  }

  // Distance score (0-40 points)
  // Perfect = within 2px of target
  const distFromTarget = Math.abs(landingX - targetX);
  let distanceScore: number;
  if (distFromTarget < 2) {
    distanceScore = 40;  // Perfect
  } else if (distFromTarget < 5) {
    distanceScore = 35;  // Excellent
  } else if (distFromTarget < 10) {
    distanceScore = 30;  // Great
  } else if (distFromTarget < 20) {
    distanceScore = 20;  // Good
  } else if (distFromTarget < 50) {
    distanceScore = 10;  // Okay
  } else {
    distanceScore = Math.max(0, 5 - distFromTarget / 100);  // Poor
  }

  // Rings score (0-30 points, 10 per ring)
  const ringsScore = Math.min(30, ringsPassedThisThrow * 10);

  // Speed control score (0-20 points)
  // Lower landing velocity = better control
  let speedScore: number;
  if (landingVelocity < 1) {
    speedScore = 20;  // Perfect stop
  } else if (landingVelocity < 2) {
    speedScore = 15;  // Great control
  } else if (landingVelocity < 3) {
    speedScore = 10;  // Good
  } else if (landingVelocity < 5) {
    speedScore = 5;   // Okay
  } else {
    speedScore = 0;   // Fast landing
  }

  // Edge proximity bonus (0-10 points)
  // Bonus for landing close to 420 without falling
  let edgeBonus = 0;
  if (landingX >= 415) {
    edgeBonus = 10;  // Maximum risk
  } else if (landingX >= 410) {
    edgeBonus = 7;
  } else if (landingX >= 400) {
    edgeBonus = 4;
  }

  const totalScore = distanceScore + ringsScore + speedScore + edgeBonus;

  // Determine grade
  let grade: Grade = 'D';
  for (const [g, threshold] of Object.entries(GRADE_THRESHOLDS) as [Grade, number][]) {
    if (totalScore >= threshold) {
      grade = g;
      break;
    }
  }

  return {
    grade,
    score: totalScore,
    breakdown: {
      distance: distanceScore,
      rings: ringsScore,
      speedControl: speedScore,
      edgeBonus,
    },
    comment: getRandomComment(grade),
  };
}

function getRandomComment(grade: Grade): string {
  const comments = COMMENTS[grade];
  return comments[Math.floor(Math.random() * comments.length)];
}

export function getRandomTip(): string {
  return TIPS[Math.floor(Math.random() * TIPS.length)];
}

// Grade colors
export const GRADE_COLORS: Record<Grade, string> = {
  S: '#FFD700',  // Gold
  A: '#C0C0C0',  // Silver
  B: '#CD7F32',  // Bronze
  C: '#808080',  // Gray
  D: '#4A4A4A',  // Dark gray
};

// Grade should show confetti
export function shouldShowConfetti(grade: Grade): boolean {
  return grade === 'S' || grade === 'A';
}
```

**Step 2: Add grade state to types**

In `src/game/engine/types.ts`, add:

```typescript
import { GradeResult } from './gradeSystem';

// In GameState interface:
lastGrade: GradeResult | null;
gradeDisplayTime: number;  // When grade was shown (for animation timing)
```

**Step 3: Initialize grade state**

In `src/game/engine/state.ts`, add to `createInitialState()`:

```typescript
lastGrade: null,
gradeDisplayTime: 0,
```

And in `resetPhysics()`:

```typescript
state.lastGrade = null;
state.gradeDisplayTime = 0;
```

**Step 4: Commit**

```bash
git add src/game/engine/gradeSystem.ts src/game/engine/types.ts src/game/engine/state.ts
git commit -m "feat(juice): create landing grade system core

- Add grade calculation (S/A/B/C/D) based on:
  - Distance from target (0-40 points)
  - Rings passed (0-30 points)
  - Speed control (0-20 points)
  - Edge proximity bonus (0-10 points)
- Add coach comments per grade (Greek/English)
- Add tips for C/D grades
- Add grade colors and confetti triggers"
```

---

### Task 2.2: Landing Grade UI Component

**Files:**
- Create: `src/components/LandingGrade.tsx`
- Modify: `src/components/Game.tsx`

**Step 1: Create LandingGrade component**

Create `src/components/LandingGrade.tsx`:

```typescript
/**
 * Landing Grade Display
 *
 * Shows grade stamp animation with:
 * - Scale slam effect (0 → 1.2 → 1.0)
 * - Grade letter with color
 * - Coach comment
 * - Confetti for S/A grades
 */

import React, { useEffect, useState } from 'react';
import { Grade, GradeResult, GRADE_COLORS, shouldShowConfetti, getRandomTip } from '@/game/engine/gradeSystem';

interface LandingGradeProps {
  result: GradeResult | null;
  visible: boolean;
  onDismiss?: () => void;
}

export function LandingGrade({ result, visible, onDismiss }: LandingGradeProps) {
  const [animationPhase, setAnimationPhase] = useState<'slam' | 'hold' | 'fade'>('slam');
  const [scale, setScale] = useState(0);

  useEffect(() => {
    if (!visible || !result) {
      setAnimationPhase('slam');
      setScale(0);
      return;
    }

    // Slam animation: 0 → 1.2 → 1.0
    setAnimationPhase('slam');
    setScale(0);

    // Start slam
    const slamStart = setTimeout(() => setScale(1.2), 50);

    // Settle to 1.0
    const settle = setTimeout(() => {
      setScale(1.0);
      setAnimationPhase('hold');
    }, 200);

    // Start fade after 1.5s
    const fadeStart = setTimeout(() => {
      setAnimationPhase('fade');
    }, 1500);

    // Dismiss after 2s
    const dismiss = setTimeout(() => {
      onDismiss?.();
    }, 2000);

    return () => {
      clearTimeout(slamStart);
      clearTimeout(settle);
      clearTimeout(fadeStart);
      clearTimeout(dismiss);
    };
  }, [visible, result, onDismiss]);

  if (!visible || !result) return null;

  const { grade, comment, score } = result;
  const color = GRADE_COLORS[grade];
  const showTip = grade === 'C' || grade === 'D';

  return (
    <div
      className={`
        fixed inset-0 flex items-center justify-center pointer-events-none
        transition-opacity duration-300
        ${animationPhase === 'fade' ? 'opacity-0' : 'opacity-100'}
      `}
    >
      {/* Confetti for S/A */}
      {shouldShowConfetti(grade) && animationPhase !== 'fade' && (
        <Confetti />
      )}

      {/* Grade stamp */}
      <div
        className="relative"
        style={{
          transform: `scale(${scale})`,
          transition: 'transform 150ms ease-out',
        }}
      >
        {/* Grade letter */}
        <div
          className="text-8xl font-black text-center"
          style={{
            color,
            textShadow: `0 4px 8px rgba(0,0,0,0.5), 0 0 20px ${color}40`,
          }}
        >
          {grade}
        </div>

        {/* Comment */}
        <div
          className="text-xl font-bold text-center mt-2"
          style={{ color }}
        >
          {comment}
        </div>

        {/* Score breakdown */}
        <div className="text-sm text-white/60 text-center mt-1">
          Score: {score}/100
        </div>

        {/* Tip for C/D grades */}
        {showTip && (
          <div className="text-xs text-yellow-400 text-center mt-3 max-w-48">
            {getRandomTip()}
          </div>
        )}
      </div>
    </div>
  );
}

// Simple confetti component
function Confetti() {
  const particles = Array.from({ length: 30 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    delay: Math.random() * 0.5,
    color: ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4'][i % 5],
    size: 4 + Math.random() * 4,
  }));

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
      {particles.map(p => (
        <div
          key={p.id}
          className="absolute animate-confetti"
          style={{
            left: `${p.x}%`,
            top: '-10px',
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            borderRadius: '2px',
            animationDelay: `${p.delay}s`,
          }}
        />
      ))}
    </div>
  );
}

export default LandingGrade;
```

**Step 2: Add confetti animation to CSS**

Add to `src/index.css`:

```css
@keyframes confetti {
  0% {
    transform: translateY(0) rotate(0deg);
    opacity: 1;
  }
  100% {
    transform: translateY(400px) rotate(720deg);
    opacity: 0;
  }
}

.animate-confetti {
  animation: confetti 2s ease-out forwards;
}
```

**Step 3: Integrate into Game.tsx**

Add import:

```typescript
import { LandingGrade } from './LandingGrade';
import { calculateGrade } from '@/game/engine/gradeSystem';
```

Add state:

```typescript
const [showGrade, setShowGrade] = useState(false);
const [lastGradeResult, setLastGradeResult] = useState<GradeResult | null>(null);
```

Calculate grade on landing (in the landing detection section, around line 700):

```typescript
// After successful landing detected:
const gradeResult = calculateGrade(
  stateRef.current.px,
  stateRef.current.zenoTarget,
  stateRef.current.ringsPassedThisThrow,
  Math.abs(stateRef.current.vx),
  stateRef.current.fellOff
);
setLastGradeResult(gradeResult);
setShowGrade(true);
```

Add to render:

```typescript
{/* Landing Grade */}
<LandingGrade
  result={lastGradeResult}
  visible={showGrade}
  onDismiss={() => setShowGrade(false)}
/>
```

**Step 4: Commit**

```bash
git add src/components/LandingGrade.tsx src/index.css src/components/Game.tsx
git commit -m "feat(juice): add landing grade UI with slam animation

- Grade stamp scales 0 → 1.2 → 1.0 (slam effect)
- Shows grade letter (S/A/B/C/D) with color
- Coach comment and score breakdown
- Tips for C/D grades to help learning
- Confetti burst for S/A grades
- Auto-dismisses after 2 seconds"
```

---

### Task 2.3: Grade Audio Feedback

**Files:**
- Modify: `src/game/engine/audio.ts`
- Modify: `src/components/Game.tsx`

**Step 1: Add grade-specific sounds**

In `src/game/engine/audio.ts`, add:

```typescript
/**
 * Play sound for landing grade
 */
gradeSound(grade: 'S' | 'A' | 'B' | 'C' | 'D'): void {
  if (!this.ctx || this.muted) return;

  switch (grade) {
    case 'S':
      // Fanfare
      this.playFanfare();
      break;
    case 'A':
      // Success chime
      this.tone(659, 0.15, 'sine', 0.3);
      setTimeout(() => this.tone(784, 0.15, 'sine', 0.3), 100);
      setTimeout(() => this.tone(988, 0.2, 'sine', 0.4), 200);
      break;
    case 'B':
      // Soft ding
      this.tone(523, 0.2, 'sine', 0.25);
      break;
    case 'C':
      // Neutral
      this.tone(392, 0.15, 'triangle', 0.15);
      break;
    case 'D':
      // Womp womp
      this.playWomp();
      break;
  }
}

private playFanfare(): void {
  if (!this.ctx) return;

  // Quick ascending fanfare
  const notes = [523, 659, 784, 1047];  // C5, E5, G5, C6
  notes.forEach((freq, i) => {
    setTimeout(() => {
      this.tone(freq, 0.2, 'sine', 0.35);
    }, i * 100);
  });
}

private playWomp(): void {
  if (!this.ctx) return;

  // Descending womp womp
  this.tone(200, 0.3, 'sine', 0.2);
  setTimeout(() => {
    const osc = this.ctx!.createOscillator();
    const gain = this.ctx!.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(180, this.ctx!.currentTime);
    osc.frequency.exponentialRampToValueAtTime(80, this.ctx!.currentTime + 0.4);
    gain.gain.setValueAtTime(0.2 * this.volume, this.ctx!.currentTime);
    gain.gain.exponentialDecayTo(0.01, this.ctx!.currentTime + 0.4);
    osc.connect(gain);
    gain.connect(this.ctx!.destination);
    osc.start();
    osc.stop(this.ctx!.currentTime + 0.4);
  }, 200);
}
```

**Step 2: Play grade sound on landing**

In Game.tsx, after calculating grade:

```typescript
// Play grade sound
audioRefs.current.game?.gradeSound(gradeResult.grade);
```

**Step 3: Commit**

```bash
git add src/game/engine/audio.ts src/components/Game.tsx
git commit -m "feat(juice): add grade-specific audio feedback

- S grade: Ascending fanfare (C-E-G-C)
- A grade: Success chime (3 notes)
- B grade: Soft ding
- C grade: Neutral tone
- D grade: Womp womp (descending)"
```

---

### Task 3.1: Near-Miss Drama - Heartbeat Sequence

**Files:**
- Modify: `src/game/engine/update.ts`
- Modify: `src/game/engine/audio.ts`
- Modify: `src/game/engine/types.ts`

**Step 1: Add near-miss state**

In `src/game/engine/types.ts`:

```typescript
// Near-miss drama state
nearMissActive: boolean;
nearMissDistance: number;  // How far from target
nearMissIntensity: 'extreme' | 'close' | 'near' | null;
nearMissAnimationStart: number;
```

**Step 2: Initialize near-miss state**

In `src/game/engine/state.ts`:

```typescript
// createInitialState():
nearMissActive: false,
nearMissDistance: 0,
nearMissIntensity: null,
nearMissAnimationStart: 0,

// resetPhysics():
state.nearMissActive = false;
state.nearMissDistance = 0;
state.nearMissIntensity = null;
state.nearMissAnimationStart = 0;
```

**Step 3: Detect near-miss in update.ts**

In `src/game/engine/update.ts`, after fall detection (around line 600):

```typescript
// Near-miss detection
if (state.fellOff && !state.nearMissActive) {
  const distFromTarget = Math.abs(state.px - state.zenoTarget);
  const distFromEdge = 420 - state.px;  // How close to edge they got

  // Determine intensity based on distance
  let intensity: 'extreme' | 'close' | 'near' | null = null;
  if (distFromEdge < 0.5 || distFromTarget < 2) {
    intensity = 'extreme';  // < 0.5m from edge or < 2m from target
    state.nearMissDistance = Math.min(distFromEdge, distFromTarget);
  } else if (distFromEdge < 2 || distFromTarget < 5) {
    intensity = 'close';
    state.nearMissDistance = Math.min(distFromEdge, distFromTarget);
  } else if (distFromEdge < 5 || distFromTarget < 10) {
    intensity = 'near';
    state.nearMissDistance = Math.min(distFromEdge, distFromTarget);
  }

  if (intensity) {
    state.nearMissActive = true;
    state.nearMissIntensity = intensity;
    state.nearMissAnimationStart = nowMs;

    // Trigger heartbeat for all players (no unlock required)
    if (intensity === 'extreme' || intensity === 'close') {
      audio.heartbeat(intensity === 'extreme' ? 1.0 : 0.7);
    }

    // Dramatic slowdown
    state.slowMo = 0.9;  // Slow to 10% speed briefly
  }
}
```

**Step 4: Add enhanced heartbeat**

In `src/game/engine/audio.ts`, modify heartbeat:

```typescript
/**
 * Dramatic heartbeat for near-miss moments
 * @param intensity 0-1 (affects volume and low bass)
 */
heartbeat(intensity: number = 1.0): void {
  if (!this.ctx || this.muted) return;

  const volume = 0.3 * intensity * this.volume;

  // First beat
  this.playHeartbeatPulse(volume, 0);

  // Second beat (slightly quieter, delayed)
  this.playHeartbeatPulse(volume * 0.8, 400);

  // Low bass rumble
  if (intensity > 0.7) {
    this.playBassRumble(intensity);
  }
}

private playHeartbeatPulse(volume: number, delayMs: number): void {
  if (!this.ctx) return;

  setTimeout(() => {
    const osc = this.ctx!.createOscillator();
    const gain = this.ctx!.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(60, this.ctx!.currentTime);
    osc.frequency.exponentialRampToValueAtTime(40, this.ctx!.currentTime + 0.15);

    gain.gain.setValueAtTime(volume, this.ctx!.currentTime);
    gain.gain.exponentialDecayTo(0.01, this.ctx!.currentTime + 0.2);

    osc.connect(gain);
    gain.connect(this.ctx!.destination);

    osc.start();
    osc.stop(this.ctx!.currentTime + 0.2);
  }, delayMs);
}

private playBassRumble(intensity: number): void {
  if (!this.ctx) return;

  const osc = this.ctx.createOscillator();
  const gain = this.ctx.createGain();

  osc.type = 'sine';
  osc.frequency.setValueAtTime(30, this.ctx.currentTime);

  gain.gain.setValueAtTime(0.15 * intensity * this.volume, this.ctx.currentTime);
  gain.gain.exponentialDecayTo(0.01, this.ctx.currentTime + 0.8);

  osc.connect(gain);
  gain.connect(this.ctx.destination);

  osc.start();
  osc.stop(this.ctx.currentTime + 0.8);
}
```

**Step 5: Commit**

```bash
git add src/game/engine/update.ts src/game/engine/audio.ts src/game/engine/types.ts src/game/engine/state.ts
git commit -m "feat(juice): add near-miss drama with heartbeat sequence

- Detect near-miss on fall (< 5m from edge or target)
- Three intensity levels: extreme (<0.5m), close (<2m), near (<5m)
- Dramatic heartbeat: two pulses + low bass rumble
- No unlock required - drama for all players
- Brief slow-motion on near-miss trigger"
```

---

### Task 3.2: Near-Miss Visual Effects

**Files:**
- Modify: `src/game/engine/render.ts`
- Create: `src/components/NearMissOverlay.tsx`
- Modify: `src/components/Game.tsx`

**Step 1: Add spotlight vignette in render.ts**

In `src/game/engine/render.ts`:

```typescript
/**
 * Render near-miss spotlight effect
 * Vignette that focuses on target zone
 */
function renderNearMissSpotlight(
  ctx: CanvasRenderingContext2D,
  targetX: number,
  intensity: 'extreme' | 'close' | 'near',
  width: number,
  height: number
): void {
  // Dimming intensity based on near-miss level
  const dimAmount = intensity === 'extreme' ? 0.5
                  : intensity === 'close' ? 0.4
                  : 0.3;

  // Create radial gradient centered on target
  const gradient = ctx.createRadialGradient(
    targetX, height - 30,  // Target position
    30,  // Inner radius (bright)
    targetX, height - 30,
    150  // Outer radius (dim)
  );

  gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');  // Clear center
  gradient.addColorStop(0.5, `rgba(0, 0, 0, ${dimAmount * 0.5})`);
  gradient.addColorStop(1, `rgba(0, 0, 0, ${dimAmount})`);

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  // Glow on target zone
  const glowGradient = ctx.createRadialGradient(
    targetX, height - 30, 0,
    targetX, height - 30, 40
  );
  glowGradient.addColorStop(0, 'rgba(255, 215, 0, 0.3)');
  glowGradient.addColorStop(1, 'rgba(255, 215, 0, 0)');

  ctx.fillStyle = glowGradient;
  ctx.fillRect(targetX - 50, height - 80, 100, 100);
}

// Call in renderFlipbookFrame/renderNoirFrame when nearMissActive:
if (state.nearMissActive && state.nearMissIntensity) {
  renderNearMissSpotlight(ctx, state.zenoTarget, state.nearMissIntensity, W, H);
}
```

**Step 2: Create NearMissOverlay component**

Create `src/components/NearMissOverlay.tsx`:

```typescript
/**
 * Near-Miss Overlay
 *
 * Shows:
 * - Animated distance counter
 * - "SO CLOSE!" text
 * - Recovery prompt
 */

import React, { useEffect, useState } from 'react';

interface NearMissOverlayProps {
  distance: number;
  intensity: 'extreme' | 'close' | 'near';
  visible: boolean;
}

const INTENSITY_TEXT = {
  extreme: 'INCHES AWAY!',
  close: 'SO CLOSE!',
  near: 'Almost!',
};

export function NearMissOverlay({ distance, intensity, visible }: NearMissOverlayProps) {
  const [displayDistance, setDisplayDistance] = useState(0);
  const [showRecovery, setShowRecovery] = useState(false);

  useEffect(() => {
    if (!visible) {
      setDisplayDistance(0);
      setShowRecovery(false);
      return;
    }

    // Animate distance counter from 0 to actual
    const duration = 600;
    const startTime = performance.now();

    const animate = () => {
      const elapsed = performance.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Ease out
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayDistance(distance * eased);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);

    // Show recovery prompt after delay
    const recoveryTimer = setTimeout(() => {
      setShowRecovery(true);
    }, 800);

    return () => clearTimeout(recoveryTimer);
  }, [visible, distance]);

  if (!visible) return null;

  const textSize = intensity === 'extreme' ? 'text-4xl' : intensity === 'close' ? 'text-3xl' : 'text-2xl';

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center pointer-events-none">
      {/* Main text */}
      <div
        className={`${textSize} font-black text-red-500 animate-pulse`}
        style={{ textShadow: '0 0 20px rgba(255, 0, 0, 0.5)' }}
      >
        {INTENSITY_TEXT[intensity]}
      </div>

      {/* Distance counter */}
      <div className="text-2xl font-bold text-red-400 mt-2">
        {displayDistance.toFixed(2)}m short
      </div>

      {/* Recovery prompt */}
      {showRecovery && (
        <div className="text-lg text-white/80 mt-6 animate-fade-in">
          So close! Try again?
        </div>
      )}
    </div>
  );
}

export default NearMissOverlay;
```

**Step 3: Add fade-in animation**

In `src/index.css`:

```css
@keyframes fade-in {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.animate-fade-in {
  animation: fade-in 0.3s ease-out forwards;
}
```

**Step 4: Integrate into Game.tsx**

Add import:

```typescript
import { NearMissOverlay } from './NearMissOverlay';
```

Add state:

```typescript
const [nearMissState, setNearMissState] = useState<{
  visible: boolean;
  distance: number;
  intensity: 'extreme' | 'close' | 'near';
} | null>(null);
```

Sync near-miss state (in HUD interval):

```typescript
if (stateRef.current.nearMissActive) {
  setNearMissState({
    visible: true,
    distance: stateRef.current.nearMissDistance,
    intensity: stateRef.current.nearMissIntensity!,
  });
} else if (nearMissState?.visible) {
  // Hide after delay
  setTimeout(() => setNearMissState(null), 1200);
}
```

Add to render:

```typescript
{/* Near-Miss Overlay */}
{nearMissState && (
  <NearMissOverlay
    distance={nearMissState.distance}
    intensity={nearMissState.intensity}
    visible={nearMissState.visible}
  />
)}
```

**Step 5: Commit**

```bash
git add src/game/engine/render.ts src/components/NearMissOverlay.tsx src/index.css src/components/Game.tsx
git commit -m "feat(juice): add near-miss visual effects

- Spotlight vignette focusing on target zone
- 'SO CLOSE!' / 'INCHES AWAY!' text based on intensity
- Animated distance counter (counts up to actual)
- Recovery prompt after brief delay
- Dramatic red styling with pulse animation"
```

---

### Task 3.3: Near-Miss Dramatic Pause

**Files:**
- Modify: `src/game/engine/update.ts`

**Step 1: Implement dramatic pause timing**

In `src/game/engine/update.ts`, add after near-miss detection:

```typescript
// Near-miss dramatic pause management
const NEAR_MISS_PAUSE_DURATION = 1000;  // 1 second pause

// If near-miss is active, maintain slow-mo for dramatic effect
if (state.nearMissActive) {
  const timeSinceNearMiss = nowMs - state.nearMissAnimationStart;

  if (timeSinceNearMiss < NEAR_MISS_PAUSE_DURATION) {
    // Maintain heavy slow-mo during pause
    state.slowMo = Math.max(state.slowMo, 0.85);

    // Screen pulse effect synced with heartbeat
    if (timeSinceNearMiss < 200 || (timeSinceNearMiss > 400 && timeSinceNearMiss < 600)) {
      // Pulse the screen slightly during heartbeats
      if (!state.reduceFx) {
        state.screenFlash = 0.1;
      }
    }
  } else {
    // Release dramatic pause, allow normal reset
    state.nearMissActive = false;
  }
}
```

**Step 2: Commit**

```bash
git add src/game/engine/update.ts
git commit -m "feat(juice): add near-miss dramatic pause

- 1 second slow-motion hold for 'sinking in' moment
- Screen pulse synced with heartbeat timing
- Builds 'one more try' motivation
- Respects reduceFx setting"
```

---

## Phase 2: Progression Feel

### Task 4.1: Streak Counter HUD

**Files:**
- Create: `src/components/StreakCounter.tsx`
- Modify: `src/components/Game.tsx`

**Step 1: Create StreakCounter component**

Create `src/components/StreakCounter.tsx`:

```typescript
/**
 * Streak Counter HUD
 *
 * Shows current hot streak with:
 * - Flame icon that changes color
 * - Pulse animation on increment
 * - Milestone celebrations
 */

import React, { useEffect, useState } from 'react';

interface StreakCounterProps {
  streak: number;
  bestStreak: number;
  visible: boolean;
}

// Flame color based on streak
function getFlameColor(streak: number): string {
  if (streak >= 10) return '#60A5FA';  // Blue/white (unstoppable)
  if (streak >= 5) return '#EF4444';   // Red-orange (blazing)
  if (streak >= 3) return '#F97316';   // Bright orange (on fire)
  return '#FB923C';  // Orange (basic flame)
}

// Milestone messages
const MILESTONES: Record<number, { text: string; emoji: string }> = {
  3: { text: 'ON FIRE!', emoji: '🔥' },
  5: { text: 'BLAZING!', emoji: '🔥🔥' },
  10: { text: 'UNSTOPPABLE!', emoji: '🔥🔥🔥' },
  15: { text: 'LEGENDARY!', emoji: '👑' },
};

export function StreakCounter({ streak, bestStreak, visible }: StreakCounterProps) {
  const [showMilestone, setShowMilestone] = useState<string | null>(null);
  const [animatePulse, setAnimatePulse] = useState(false);
  const [prevStreak, setPrevStreak] = useState(streak);

  useEffect(() => {
    if (streak > prevStreak) {
      // Streak increased - pulse animation
      setAnimatePulse(true);
      setTimeout(() => setAnimatePulse(false), 300);

      // Check for milestone
      const milestone = MILESTONES[streak];
      if (milestone) {
        setShowMilestone(`${milestone.emoji} ${milestone.text}`);
        setTimeout(() => setShowMilestone(null), 2000);
      }
    }
    setPrevStreak(streak);
  }, [streak, prevStreak]);

  if (!visible || streak < 1) return null;

  const flameColor = getFlameColor(streak);
  const isHot = streak >= 5;

  return (
    <>
      {/* Streak counter */}
      <div
        className={`
          fixed top-16 left-4
          bg-black/60 rounded-lg px-3 py-2
          border-2 transition-all duration-150
          ${animatePulse ? 'scale-110' : 'scale-100'}
          ${isHot ? 'border-orange-500' : 'border-white/30'}
        `}
      >
        <div
          className="text-2xl font-bold text-center flex items-center gap-1"
          style={{ color: flameColor }}
        >
          <span className={isHot ? 'animate-pulse' : ''}>🔥</span>
          <span>×{streak}</span>
        </div>

        {/* Best streak indicator */}
        {streak >= bestStreak && bestStreak > 0 && (
          <div className="text-xs text-yellow-400 text-center">
            Personal Best!
          </div>
        )}
      </div>

      {/* Milestone celebration */}
      {showMilestone && (
        <div className="fixed top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50">
          <div
            className="text-3xl font-black text-orange-500 animate-bounce"
            style={{ textShadow: '0 0 20px rgba(255, 165, 0, 0.5)' }}
          >
            {showMilestone}
          </div>
        </div>
      )}
    </>
  );
}

export default StreakCounter;
```

**Step 2: Integrate into Game.tsx**

Add import:

```typescript
import { StreakCounter } from './StreakCounter';
```

Add state (or use existing hotStreak state):

```typescript
// Should already have:
// const [hotStreak, setHotStreak] = useState({ current: 0, best: 0 });
```

Add to render:

```typescript
{/* Streak Counter */}
<StreakCounter
  streak={hotStreak.current}
  bestStreak={hotStreak.best}
  visible={!showGrade && !nearMissState}  // Hide during other overlays
/>
```

**Step 3: Commit**

```bash
git add src/components/StreakCounter.tsx src/components/Game.tsx
git commit -m "feat(juice): add streak counter HUD

- Flame icon with color escalation (orange → red → blue)
- Pulse animation on streak increment
- Milestone celebrations at 3/5/10/15
- Personal best indicator
- Hides during grade and near-miss overlays"
```

---

### Task 4.2: Streak Break Feedback

**Files:**
- Create: `src/components/StreakBreak.tsx`
- Modify: `src/game/engine/audio.ts`
- Modify: `src/components/Game.tsx`

**Step 1: Create StreakBreak component**

Create `src/components/StreakBreak.tsx`:

```typescript
/**
 * Streak Break Feedback
 *
 * Shows when streak is lost:
 * - Shattered flame animation
 * - Lost streak count
 * - Motivation text
 */

import React from 'react';

interface StreakBreakProps {
  lostStreak: number;
  visible: boolean;
}

export function StreakBreak({ lostStreak, visible }: StreakBreakProps) {
  if (!visible || lostStreak < 2) return null;

  return (
    <div className="fixed top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 text-center">
      {/* Broken flame */}
      <div className="text-4xl opacity-50 animate-fade-out">
        💔
      </div>

      {/* Lost streak text */}
      <div className="text-xl font-bold text-red-400 mt-2">
        Streak Lost: {lostStreak}
      </div>

      {/* Motivation */}
      <div className="text-sm text-white/60 mt-1">
        Can you beat {lostStreak}?
      </div>
    </div>
  );
}

export default StreakBreak;
```

**Step 2: Add fade-out animation**

In `src/index.css`:

```css
@keyframes fade-out {
  from { opacity: 1; transform: scale(1); }
  to { opacity: 0; transform: scale(0.5); }
}

.animate-fade-out {
  animation: fade-out 1.5s ease-out forwards;
}
```

**Step 3: Add streak break sound**

In `src/game/engine/audio.ts`:

```typescript
/**
 * Streak break sound (sad fizzle)
 */
streakBreak(): void {
  if (!this.ctx || this.muted) return;

  // Fizzle sound
  const osc = this.ctx.createOscillator();
  const gain = this.ctx.createGain();

  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(200, this.ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(50, this.ctx.currentTime + 0.5);

  gain.gain.setValueAtTime(0.15 * this.volume, this.ctx.currentTime);
  gain.gain.exponentialDecayTo(0.01, this.ctx.currentTime + 0.5);

  osc.connect(gain);
  gain.connect(this.ctx.destination);

  osc.start();
  osc.stop(this.ctx.currentTime + 0.5);
}
```

**Step 4: Integrate into Game.tsx**

Add import:

```typescript
import { StreakBreak } from './StreakBreak';
```

Add state:

```typescript
const [streakBreakState, setStreakBreakState] = useState<{
  visible: boolean;
  lostStreak: number;
} | null>(null);
```

Detect streak break (when streak resets):

```typescript
// In the streak update logic:
if (previousStreak >= 2 && newStreak === 0) {
  setStreakBreakState({ visible: true, lostStreak: previousStreak });
  audioRefs.current.game?.streakBreak();

  // Hide after 2 seconds
  setTimeout(() => setStreakBreakState(null), 2000);
}
```

Add to render:

```typescript
{/* Streak Break */}
{streakBreakState && (
  <StreakBreak
    lostStreak={streakBreakState.lostStreak}
    visible={streakBreakState.visible}
  />
)}
```

**Step 5: Commit**

```bash
git add src/components/StreakBreak.tsx src/index.css src/game/engine/audio.ts src/components/Game.tsx
git commit -m "feat(juice): add streak break feedback

- Broken heart animation when streak lost
- Shows lost streak count
- 'Can you beat X?' motivation text
- Sad fizzle sound effect
- Only shows for streaks >= 2"
```

---

### Task 4.3: Session Heat Visual (ON FIRE Mode)

**Files:**
- Modify: `src/game/engine/types.ts`
- Modify: `src/game/engine/state.ts`
- Modify: `src/game/engine/render.ts`
- Modify: `src/game/engine/update.ts`

**Step 1: Add session heat state**

In `src/game/engine/types.ts`:

```typescript
// Session heat (builds across session)
sessionHeat: number;  // 0-100
onFireMode: boolean;  // True when streak >= 5
```

**Step 2: Initialize session heat**

In `src/game/engine/state.ts`:

```typescript
// createInitialState():
sessionHeat: 0,
onFireMode: false,

// Note: sessionHeat does NOT reset in resetPhysics()
// It builds across the session
```

**Step 3: Update session heat in update.ts**

In `src/game/engine/update.ts`:

```typescript
// After successful landing:
if (state.landed && !state.fellOff) {
  // Build session heat (doesn't reset on fail)
  state.sessionHeat = Math.min(100, state.sessionHeat + 5);

  // ON FIRE mode triggers at streak 5+
  state.onFireMode = state.hotStreak >= 5;
}

// ON FIRE mode decays slowly over time (not on fail)
if (state.onFireMode && state.hotStreak < 5) {
  state.onFireMode = false;
}
```

**Step 4: Render ON FIRE visual effects**

In `src/game/engine/render.ts`:

```typescript
/**
 * Render ON FIRE mode visual effects
 * - Warm background tint
 * - Flame particles around Zeno
 */
function renderOnFireMode(
  ctx: CanvasRenderingContext2D,
  zenoX: number,
  zenoY: number,
  intensity: number,  // sessionHeat / 100
  width: number,
  height: number
): void {
  // Warm background tint
  ctx.fillStyle = `rgba(255, 100, 0, ${intensity * 0.1})`;
  ctx.fillRect(0, 0, width, height);

  // Flame border effect
  const gradient = ctx.createLinearGradient(0, height, 0, height - 40);
  gradient.addColorStop(0, `rgba(255, 100, 0, ${intensity * 0.3})`);
  gradient.addColorStop(1, 'rgba(255, 100, 0, 0)');

  ctx.fillStyle = gradient;
  ctx.fillRect(0, height - 40, width, 40);
}

// Call in render functions:
if (state.onFireMode && !state.reduceFx) {
  renderOnFireMode(ctx, state.px, state.py, state.sessionHeat / 100, W, H);
}
```

**Step 5: Commit**

```bash
git add src/game/engine/types.ts src/game/engine/state.ts src/game/engine/update.ts src/game/engine/render.ts
git commit -m "feat(juice): add ON FIRE mode visual effects

- Session heat builds across session (doesn't reset on fail)
- ON FIRE mode activates at streak 5+
- Warm background tint based on heat level
- Flame border effect at bottom of screen
- Respects reduceFx setting"
```

---

### Task 5.1: Mini Goal HUD

**Files:**
- Create: `src/components/MiniGoalHUD.tsx`
- Modify: `src/game/engine/achievementProgress.ts`
- Modify: `src/components/Game.tsx`

**Step 1: Create MiniGoalHUD component**

Create `src/components/MiniGoalHUD.tsx`:

```typescript
/**
 * Mini Goal HUD
 *
 * Shows closest achievement in top-left:
 * 🎯 Land at 419+ (2/5) ▓▓░░░
 */

import React from 'react';

interface MiniGoalHUDProps {
  goalText: string;
  progress: number;  // 0-1
  target: number;
  current: number;
  visible: boolean;
}

export function MiniGoalHUD({ goalText, progress, target, current, visible }: MiniGoalHUDProps) {
  if (!visible) return null;

  // Create progress bar segments
  const segments = 5;
  const filledSegments = Math.floor(progress * segments);

  return (
    <div className="fixed top-4 left-4 bg-black/50 rounded-lg px-2 py-1 text-xs">
      <div className="flex items-center gap-2">
        <span>🎯</span>
        <span className="text-white/80">{goalText}</span>
        <span className="text-white/60">({current}/{target})</span>
      </div>

      {/* Progress bar */}
      <div className="flex gap-0.5 mt-1">
        {Array.from({ length: segments }).map((_, i) => (
          <div
            key={i}
            className={`w-3 h-1.5 rounded-sm ${
              i < filledSegments
                ? 'bg-yellow-400'
                : 'bg-white/20'
            }`}
          />
        ))}
      </div>
    </div>
  );
}

export default MiniGoalHUD;
```

**Step 2: Add closest goal selector**

Enhance `src/game/engine/achievementProgress.ts`:

```typescript
/**
 * Get the single closest goal for mini HUD
 * Prioritizes: daily tasks > near achievements > long-term
 */
export function getClosestGoal(
  stats: Stats,
  state: GameState,
  unlockedSet: Set<string>,
  dailyTasks?: DailyTasks
): { text: string; progress: number; current: number; target: number } | null {
  // Get closest achievements
  const closest = getClosestAchievements(stats, state, unlockedSet, 1);

  if (closest.length === 0) return null;

  const goal = closest[0];

  return {
    text: goal.name,
    progress: goal.current / goal.target,
    current: goal.current,
    target: goal.target,
  };
}
```

**Step 3: Integrate into Game.tsx**

Add import:

```typescript
import { MiniGoalHUD } from './MiniGoalHUD';
import { getClosestGoal } from '@/game/engine/achievementProgress';
```

Add state:

```typescript
const [miniGoal, setMiniGoal] = useState<{
  text: string;
  progress: number;
  current: number;
  target: number;
} | null>(null);
```

Update mini goal periodically (in HUD interval):

```typescript
// Update mini goal
const goal = getClosestGoal(
  stateRef.current.stats,
  stateRef.current,
  achievements,
  stateRef.current.dailyTasks
);
setMiniGoal(goal);
```

Add to render:

```typescript
{/* Mini Goal HUD */}
{miniGoal && (
  <MiniGoalHUD
    goalText={miniGoal.text}
    progress={miniGoal.progress}
    target={miniGoal.target}
    current={miniGoal.current}
    visible={!showGrade && !nearMissState}
  />
)}
```

**Step 4: Commit**

```bash
git add src/components/MiniGoalHUD.tsx src/game/engine/achievementProgress.ts src/components/Game.tsx
git commit -m "feat(juice): add mini goal HUD

- Shows closest achievement in top-left corner
- Progress bar with 5 segments
- Current/target display
- Updates after each throw
- Hides during overlays"
```

---

### Task 5.2: Progress Toast System

**Files:**
- Create: `src/components/ToastQueue.tsx`
- Modify: `src/components/Game.tsx`

**Step 1: Create ToastQueue component**

Create `src/components/ToastQueue.tsx`:

```typescript
/**
 * Toast Queue System
 *
 * Non-blocking toasts for:
 * - Achievement progress
 * - Task completion
 * - Streak updates
 */

import React, { useState, useEffect, useCallback } from 'react';

interface Toast {
  id: string;
  message: string;
  type: 'progress' | 'complete' | 'streak' | 'info';
  priority: 'high' | 'medium' | 'low';
  duration: number;
}

interface ToastQueueProps {
  toasts: Toast[];
  onDismiss: (id: string) => void;
}

const TYPE_STYLES = {
  progress: 'bg-blue-500/80 border-blue-400',
  complete: 'bg-green-500/80 border-green-400',
  streak: 'bg-orange-500/80 border-orange-400',
  info: 'bg-gray-500/80 border-gray-400',
};

const TYPE_ICONS = {
  progress: '📊',
  complete: '✅',
  streak: '🔥',
  info: 'ℹ️',
};

export function ToastQueue({ toasts, onDismiss }: ToastQueueProps) {
  // Only show max 3 toasts
  const visibleToasts = toasts.slice(0, 3);

  return (
    <div className="fixed bottom-20 left-1/2 -translate-x-1/2 flex flex-col gap-2 z-40">
      {visibleToasts.map((toast, index) => (
        <ToastItem
          key={toast.id}
          toast={toast}
          index={index}
          onDismiss={() => onDismiss(toast.id)}
        />
      ))}
    </div>
  );
}

interface ToastItemProps {
  toast: Toast;
  index: number;
  onDismiss: () => void;
}

function ToastItem({ toast, index, onDismiss }: ToastItemProps) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, toast.duration);
    return () => clearTimeout(timer);
  }, [toast.duration, onDismiss]);

  return (
    <div
      className={`
        px-4 py-2 rounded-lg border-2
        text-white text-sm font-medium
        flex items-center gap-2
        animate-slide-up
        ${TYPE_STYLES[toast.type]}
      `}
      style={{ animationDelay: `${index * 100}ms` }}
    >
      <span>{TYPE_ICONS[toast.type]}</span>
      <span>{toast.message}</span>
    </div>
  );
}

// Hook for managing toast queue
export function useToastQueue() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((
    message: string,
    type: Toast['type'] = 'info',
    priority: Toast['priority'] = 'medium'
  ) => {
    const durations = { high: 3000, medium: 2000, low: 1500 };

    const newToast: Toast = {
      id: `${Date.now()}-${Math.random()}`,
      message,
      type,
      priority,
      duration: durations[priority],
    };

    setToasts(prev => {
      // Insert by priority
      const sorted = [...prev, newToast].sort((a, b) => {
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      });
      return sorted;
    });
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return { toasts, addToast, dismissToast };
}

export default ToastQueue;
```

**Step 2: Add slide-up animation**

In `src/index.css`:

```css
@keyframes slide-up {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-slide-up {
  animation: slide-up 0.3s ease-out forwards;
}
```

**Step 3: Integrate into Game.tsx**

Add import:

```typescript
import { ToastQueue, useToastQueue } from './ToastQueue';
```

Use the hook:

```typescript
const { toasts, addToast, dismissToast } = useToastQueue();
```

Add progress toasts (when achievement progress updates):

```typescript
// Example usage:
addToast('Hot Streak 3/5! 🔥', 'progress', 'medium');
addToast('✅ DAILY COMPLETE! +5 throws', 'complete', 'high');
```

Add to render:

```typescript
{/* Toast Queue */}
<ToastQueue toasts={toasts} onDismiss={dismissToast} />
```

**Step 4: Commit**

```bash
git add src/components/ToastQueue.tsx src/index.css src/components/Game.tsx
git commit -m "feat(juice): add progress toast queue system

- Non-blocking toast notifications
- Priority-based ordering (high/medium/low)
- Type styling (progress/complete/streak/info)
- Max 3 visible toasts
- Auto-dismiss with configurable duration
- Slide-up animation with stagger"
```

---

## Phase 3: Polish & Depth

### Task 6.1: Charge Sweet Spot

**Files:**
- Modify: `src/game/engine/update.ts`
- Modify: `src/game/engine/audio.ts`
- Modify: `src/game/engine/types.ts`

**Step 1: Add sweet spot state**

In `src/game/engine/types.ts`:

```typescript
// Charge sweet spot
chargeSweetSpot: boolean;  // True when in optimal range
sweetSpotJustEntered: boolean;  // For one-time feedback
```

**Step 2: Initialize sweet spot state**

In `src/game/engine/state.ts`:

```typescript
chargeSweetSpot: false,
sweetSpotJustEntered: false,
```

**Step 3: Detect sweet spot in update.ts**

In `src/game/engine/update.ts`, in the charging section:

```typescript
// Sweet spot detection (70-85% power)
const SWEET_SPOT_MIN = 0.70;
const SWEET_SPOT_MAX = 0.85;

if (state.charging) {
  const power01 = state.power / 10;  // Normalize to 0-1
  const inSweetSpot = power01 >= SWEET_SPOT_MIN && power01 <= SWEET_SPOT_MAX;

  // Track entry into sweet spot
  if (inSweetSpot && !state.chargeSweetSpot) {
    state.sweetSpotJustEntered = true;
    audio.sweetSpotClick();  // Satisfying click

    // Micro zoom
    if (!state.reduceFx) {
      state.zoom = 1.02;  // Subtle 2% zoom
    }
  } else {
    state.sweetSpotJustEntered = false;
  }

  state.chargeSweetSpot = inSweetSpot;
}
```

**Step 4: Add sweet spot click sound**

In `src/game/engine/audio.ts`:

```typescript
/**
 * Satisfying click when entering sweet spot
 */
sweetSpotClick(): void {
  if (!this.ctx || this.muted) return;

  const osc = this.ctx.createOscillator();
  const gain = this.ctx.createGain();

  osc.type = 'sine';
  osc.frequency.setValueAtTime(1000, this.ctx.currentTime);

  gain.gain.setValueAtTime(0.2 * this.volume, this.ctx.currentTime);
  gain.gain.exponentialDecayTo(0.01, this.ctx.currentTime + 0.05);

  osc.connect(gain);
  gain.connect(this.ctx.destination);

  osc.start();
  osc.stop(this.ctx.currentTime + 0.05);
}
```

**Step 5: Commit**

```bash
git add src/game/engine/types.ts src/game/engine/state.ts src/game/engine/update.ts src/game/engine/audio.ts
git commit -m "feat(juice): add charge sweet spot feedback

- Detect optimal power range (70-85%)
- Satisfying click sound on entry
- Subtle 2% camera zoom in sweet spot
- 'Got it!' feeling before launch"
```

---

### Task 6.2: Charge Tension Audio

**Files:**
- Modify: `src/game/engine/audio.ts`
- Modify: `src/game/engine/update.ts`

**Step 1: Add tension drone**

In `src/game/engine/audio.ts`:

```typescript
private tensionOsc: OscillatorNode | null = null;
private tensionGain: GainNode | null = null;

/**
 * Start tension drone during charge
 */
startTensionDrone(): void {
  if (!this.ctx || this.muted || this.tensionOsc) return;

  this.tensionOsc = this.ctx.createOscillator();
  this.tensionGain = this.ctx.createGain();

  this.tensionOsc.type = 'sine';
  this.tensionOsc.frequency.setValueAtTime(80, this.ctx.currentTime);

  this.tensionGain.gain.setValueAtTime(0, this.ctx.currentTime);

  this.tensionOsc.connect(this.tensionGain);
  this.tensionGain.connect(this.ctx.destination);

  this.tensionOsc.start();
}

/**
 * Update tension drone pitch based on charge level
 */
updateTensionDrone(power01: number): void {
  if (!this.ctx || !this.tensionOsc || !this.tensionGain) return;

  // Pitch rises with charge: 80Hz → 200Hz
  const freq = 80 + power01 * 120;
  this.tensionOsc.frequency.setValueAtTime(freq, this.ctx.currentTime);

  // Volume rises too: 0 → 0.1
  const volume = power01 * 0.1 * this.volume;
  this.tensionGain.gain.setValueAtTime(volume, this.ctx.currentTime);
}

/**
 * Release tension drone on launch
 */
releaseTensionDrone(): void {
  if (!this.tensionOsc || !this.tensionGain || !this.ctx) return;

  // Quick fade out
  this.tensionGain.gain.exponentialDecayTo(0.001, this.ctx.currentTime + 0.1);

  const osc = this.tensionOsc;
  setTimeout(() => {
    osc.stop();
  }, 100);

  this.tensionOsc = null;
  this.tensionGain = null;
}
```

**Step 2: Call tension audio from update.ts**

In `src/game/engine/update.ts`:

```typescript
// On charge start:
if (justStartedCharging) {
  audio.startTensionDrone();
}

// During charging:
if (state.charging) {
  const power01 = state.power / 10;
  audio.updateTensionDrone(power01);
}

// On release:
if (justReleased) {
  audio.releaseTensionDrone();
}
```

**Step 3: Commit**

```bash
git add src/game/engine/audio.ts src/game/engine/update.ts
git commit -m "feat(juice): add charge tension audio

- Low drone starts at charge begin
- Pitch rises with charge level (80Hz → 200Hz)
- Volume builds with power
- Releases on launch for satisfying payoff"
```

---

### Task 6.3: Charge Visual Tension Build

**Files:**
- Modify: `src/game/engine/render.ts`
- Modify: `src/game/engine/update.ts`
- Modify: `src/game/engine/types.ts`

**Step 1: Add charge visual state**

In `src/game/engine/types.ts`:

```typescript
// Charge visual tension
chargeGlowIntensity: number;  // 0-1, builds with charge
chargeVignetteActive: boolean;
```

**Step 2: Update charge glow in update.ts**

In `src/game/engine/update.ts`, during charging:

```typescript
// Build charge visual intensity
if (state.charging) {
  const power01 = state.power / 10;  // 0-1

  // Glow builds with charge
  state.chargeGlowIntensity = power01;

  // Vignette activates at 50% charge
  state.chargeVignetteActive = power01 > 0.5;

  // Particles intensify with charge (existing particle system)
  if (power01 > 0.6 && !state.reduceFx) {
    // Emit more particles at higher charge
    const particleChance = power01 * 0.3;  // Up to 30% chance per frame
    if (Math.random() < particleChance) {
      state.particleSystem.emitChargingSwirls(
        state.px,
        state.py,
        power01,
        '#FFD700'
      );
    }
  }
}

// Reset on release
if (!state.charging) {
  state.chargeGlowIntensity = 0;
  state.chargeVignetteActive = false;
}
```

**Step 3: Render charge visual effects**

In `src/game/engine/render.ts`:

```typescript
/**
 * Render charge glow around Zeno
 */
function renderChargeGlow(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  intensity: number  // 0-1
): void {
  if (intensity <= 0) return;

  const radius = 30 + intensity * 20;  // 30-50px
  const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);

  gradient.addColorStop(0, `rgba(255, 215, 0, ${intensity * 0.4})`);
  gradient.addColorStop(0.5, `rgba(255, 165, 0, ${intensity * 0.2})`);
  gradient.addColorStop(1, 'rgba(255, 165, 0, 0)');

  ctx.fillStyle = gradient;
  ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
}

/**
 * Render charge vignette (subtle edge darkening)
 */
function renderChargeVignette(
  ctx: CanvasRenderingContext2D,
  intensity: number,
  width: number,
  height: number
): void {
  if (intensity <= 0) return;

  const gradient = ctx.createRadialGradient(
    width / 2, height / 2, height * 0.3,
    width / 2, height / 2, height * 0.8
  );

  gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
  gradient.addColorStop(1, `rgba(0, 0, 0, ${intensity * 0.3})`);

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
}

// Call during charging phase:
if (state.charging && !state.reduceFx) {
  renderChargeGlow(ctx, state.px, state.py, state.chargeGlowIntensity);
  if (state.chargeVignetteActive) {
    renderChargeVignette(ctx, state.chargeGlowIntensity - 0.5, W, H);
  }
}
```

**Step 4: Initialize state**

In `src/game/engine/state.ts`:

```typescript
// createInitialState():
chargeGlowIntensity: 0,
chargeVignetteActive: false,

// resetPhysics():
state.chargeGlowIntensity = 0;
state.chargeVignetteActive = false;
```

**Step 5: Commit**

```bash
git add src/game/engine/types.ts src/game/engine/state.ts src/game/engine/update.ts src/game/engine/render.ts
git commit -m "feat(juice): add charge visual tension build

- Glow around Zeno intensifies with charge level
- Subtle vignette at screen edges during high charge
- Particle swirls increase with charge intensity
- Visual 'energy building' feel before release
- Respects reduceFx setting"
```

---

### Task 6.4: Input Buffering During Slow-Mo/Freeze

**Files:**
- Create: `src/game/engine/inputBuffer.ts`
- Modify: `src/game/engine/update.ts`
- Modify: `src/components/Game.tsx`

**Step 1: Create inputBuffer.ts module**

Create `src/game/engine/inputBuffer.ts`:

```typescript
/**
 * Input Buffer System
 *
 * Stores player inputs during slow-mo/freeze frames
 * and applies them when time resumes.
 *
 * Research: "Buffer Inputs: Store input events during the freeze
 * and apply them once time resumes to maintain responsiveness"
 */

interface BufferedInput {
  type: 'press' | 'release' | 'tap';
  timestamp: number;
  data?: {
    x?: number;
    y?: number;
  };
}

// Buffer storage
let inputBuffer: BufferedInput[] = [];
let bufferingActive = false;

// Buffer window (how long to hold inputs)
const BUFFER_WINDOW_MS = 200;

/**
 * Start buffering inputs (call when entering slow-mo/freeze)
 */
export function startBuffering(): void {
  bufferingActive = true;
  inputBuffer = [];
}

/**
 * Stop buffering and return buffered inputs
 */
export function stopBuffering(): BufferedInput[] {
  bufferingActive = false;
  const buffered = [...inputBuffer];
  inputBuffer = [];
  return buffered;
}

/**
 * Check if currently buffering
 */
export function isBuffering(): boolean {
  return bufferingActive;
}

/**
 * Add input to buffer (call from input handlers)
 */
export function bufferInput(
  type: BufferedInput['type'],
  data?: BufferedInput['data']
): void {
  if (!bufferingActive) return;

  const now = Date.now();

  // Clear old inputs outside buffer window
  inputBuffer = inputBuffer.filter(
    input => now - input.timestamp < BUFFER_WINDOW_MS
  );

  inputBuffer.push({
    type,
    timestamp: now,
    data,
  });
}

/**
 * Get the most recent buffered input of a type
 */
export function getBufferedInput(type: BufferedInput['type']): BufferedInput | null {
  const matching = inputBuffer.filter(i => i.type === type);
  return matching.length > 0 ? matching[matching.length - 1] : null;
}

/**
 * Check if a specific input was buffered
 */
export function hasBufferedInput(type: BufferedInput['type']): boolean {
  return inputBuffer.some(i => i.type === type);
}

/**
 * Clear the buffer
 */
export function clearBuffer(): void {
  inputBuffer = [];
}
```

**Step 2: Integrate into update.ts**

In `src/game/engine/update.ts`:

```typescript
import {
  startBuffering,
  stopBuffering,
  isBuffering,
  hasBufferedInput,
  clearBuffer
} from './inputBuffer';

// When entering significant slow-mo (e.g., micro-freeze):
if (state.slowMo > 0.8 && !isBuffering()) {
  startBuffering();
}

// When exiting slow-mo, apply buffered inputs:
if (state.slowMo < 0.3 && isBuffering()) {
  const buffered = stopBuffering();

  // Apply buffered tap/release
  if (hasBufferedInput('tap')) {
    // Treat as if player tapped this frame
    pressedThisFrame = true;
  }
  if (hasBufferedInput('release')) {
    releasedThisFrame = true;
  }

  clearBuffer();
}
```

**Step 3: Buffer inputs in Game.tsx**

In `src/components/Game.tsx`, modify input handlers:

```typescript
import { bufferInput, isBuffering } from '@/game/engine/inputBuffer';

// In pointer handlers:
const handlePointerDown = (e: PointerEvent) => {
  if (isBuffering()) {
    bufferInput('press', { x: e.clientX, y: e.clientY });
  }
  // ... existing logic
};

const handlePointerUp = (e: PointerEvent) => {
  if (isBuffering()) {
    bufferInput('release');
  }
  // ... existing logic
};
```

**Step 4: Commit**

```bash
git add src/game/engine/inputBuffer.ts src/game/engine/update.ts src/components/Game.tsx
git commit -m "feat(juice): add input buffering during slow-mo

- Create inputBuffer.ts for storing inputs during freeze
- Buffer window of 200ms
- Inputs applied when time resumes
- Maintains responsiveness during dramatic pauses
- Prevents 'swallowed' inputs during hit-stop"
```

---

### Task 7.1: Personal Best Callouts

**Files:**
- Modify: `src/game/engine/update.ts`
- Modify: `src/components/Game.tsx`

**Step 1: Add PB tracking state**

In `src/game/engine/types.ts`:

```typescript
// PB tracking during flight
pbPaceActive: boolean;  // On track to beat PB
pbPassedThisThrow: boolean;  // Just passed PB position
```

**Step 2: Detect PB pace in update.ts**

In `src/game/engine/update.ts`:

```typescript
// During flight, check if on PB pace
if (state.flying) {
  // Check if current position would beat best
  const onPbPace = state.px > state.best - 10;  // Within 10px of best

  if (onPbPace && !state.pbPaceActive) {
    state.pbPaceActive = true;
    // Could trigger "On PB pace!" toast
  }

  // Check if just passed PB position
  if (state.px > state.best && !state.pbPassedThisThrow) {
    state.pbPassedThisThrow = true;
    audio.pbDing();
    // Trigger "NEW PERSONAL BEST!" celebration
  }
}

// Reset on new throw
// In resetPhysics():
state.pbPaceActive = false;
state.pbPassedThisThrow = false;
```

**Step 3: Add PB callout to Game.tsx**

```typescript
// Watch for PB passed
useEffect(() => {
  if (stateRef.current.pbPassedThisThrow) {
    addToast('🏆 NEW PERSONAL BEST!', 'complete', 'high');
  }
}, [/* trigger on landing */]);
```

**Step 4: Commit**

```bash
git add src/game/engine/types.ts src/game/engine/state.ts src/game/engine/update.ts src/components/Game.tsx
git commit -m "feat(juice): add personal best callouts

- Track when on PB pace during flight
- Detect crossing PB position mid-flight
- PB ding sound on pass
- '🏆 NEW PERSONAL BEST!' toast"
```

---

### Task 8.1: Air Control Trail Effects

**Files:**
- Modify: `src/game/engine/render.ts`
- Modify: `src/game/engine/update.ts`
- Modify: `src/game/engine/types.ts`

**Step 1: Add control action tracking**

In `src/game/engine/types.ts`:

```typescript
// Air control feedback
lastControlAction: 'float' | 'brake' | null;
controlActionTime: number;
```

**Step 2: Track control actions in update.ts**

In `src/game/engine/update.ts`:

```typescript
// When float/brake used:
if (state.flying && pressedThisFrame) {
  state.lastControlAction = 'float';
  state.controlActionTime = nowMs;
}

if (state.flying && state.holdDuration > 200) {
  state.lastControlAction = 'brake';
  state.controlActionTime = nowMs;
}
```

**Step 3: Modify trail rendering**

In `src/game/engine/render.ts`:

```typescript
/**
 * Render trail with control action effects
 */
function renderTrailWithEffects(
  ctx: CanvasRenderingContext2D,
  trail: TrailPoint[],
  controlAction: 'float' | 'brake' | null,
  actionAge: number
): void {
  if (trail.length < 2) return;

  ctx.beginPath();
  ctx.moveTo(trail[0].x, trail[0].y);

  for (let i = 1; i < trail.length; i++) {
    const point = trail[i];

    // Apply control effect to recent trail points
    if (controlAction && actionAge < 300) {
      if (controlAction === 'float') {
        // Ink smear effect - slightly wider, wavy
        ctx.lineWidth = 3 + Math.sin(i * 0.5) * 1;
      } else if (controlAction === 'brake') {
        // Compressed effect - thinner
        ctx.lineWidth = Math.max(1, 3 - i * 0.1);
      }
    } else {
      ctx.lineWidth = 2;
    }

    ctx.lineTo(point.x, point.y);
  }

  ctx.strokeStyle = 'rgba(0, 0, 0, 0.6)';
  ctx.stroke();
}
```

**Step 4: Commit**

```bash
git add src/game/engine/types.ts src/game/engine/state.ts src/game/engine/update.ts src/game/engine/render.ts
git commit -m "feat(juice): add air control trail effects

- Float action: ink smear trail variation
- Brake action: compressed/shortened trail
- Visual confirmation of action taken
- Effects last 300ms after action"
```

---

### Task 8.2: Low Stamina Warning Enhancements

**Files:**
- Modify: `src/game/engine/render.ts`
- Modify: `src/game/engine/audio.ts`
- Modify: `src/game/engine/update.ts`

**Step 1: Add low stamina visual feedback**

In `src/game/engine/render.ts`, enhance stamina bar:

```typescript
// In stamina bar rendering:
if (stamina < 25) {
  // Pulsing effect
  const pulseAlpha = 0.5 + Math.sin(Date.now() * 0.01) * 0.3;
  ctx.globalAlpha = pulseAlpha;

  // Red glow
  ctx.shadowColor = 'red';
  ctx.shadowBlur = 10;
}

// Trail fades when low stamina
if (stamina < 25) {
  ctx.globalAlpha = 0.5 + stamina / 50;  // 0.5-1.0
}
```

**Step 2: Add low stamina beep**

In `src/game/engine/audio.ts`:

```typescript
/**
 * Low stamina warning beep
 */
lowStaminaBeep(): void {
  if (!this.ctx || this.muted) return;

  const osc = this.ctx.createOscillator();
  const gain = this.ctx.createGain();

  osc.type = 'square';
  osc.frequency.setValueAtTime(800, this.ctx.currentTime);

  gain.gain.setValueAtTime(0.1 * this.volume, this.ctx.currentTime);
  gain.gain.exponentialDecayTo(0.01, this.ctx.currentTime + 0.1);

  osc.connect(gain);
  gain.connect(this.ctx.destination);

  osc.start();
  osc.stop(this.ctx.currentTime + 0.1);
}
```

**Step 3: Trigger beep in update.ts**

```typescript
// Low stamina warning (once per threshold crossing)
if (state.stamina < 25 && prevStamina >= 25) {
  audio.lowStaminaBeep();
}
```

**Step 4: Commit**

```bash
git add src/game/engine/render.ts src/game/engine/audio.ts src/game/engine/update.ts
git commit -m "feat(juice): enhance low stamina warning

- Pulsing stamina bar when < 25%
- Red glow effect
- Trail fades when low
- Warning beep on crossing threshold"
```

---

### Task 8.3: Action Denied Improvement

**Files:**
- Modify: `src/game/engine/render.ts`
- Modify: `src/game/engine/audio.ts`

**Step 1: Add thunk sound**

In `src/game/engine/audio.ts`:

```typescript
/**
 * Action denied thunk sound
 */
actionDeniedThunk(): void {
  if (!this.ctx || this.muted) return;

  const osc = this.ctx.createOscillator();
  const gain = this.ctx.createGain();

  osc.type = 'triangle';
  osc.frequency.setValueAtTime(150, this.ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(80, this.ctx.currentTime + 0.1);

  gain.gain.setValueAtTime(0.2 * this.volume, this.ctx.currentTime);
  gain.gain.exponentialDecayTo(0.01, this.ctx.currentTime + 0.1);

  osc.connect(gain);
  gain.connect(this.ctx.destination);

  osc.start();
  osc.stop(this.ctx.currentTime + 0.1);
}
```

**Step 2: Add red pulse on Zeno**

In `src/game/engine/render.ts`:

```typescript
// When drawing Zeno sprite, if action denied:
if (state.staminaDeniedShake > 0) {
  // Red tint overlay
  ctx.globalCompositeOperation = 'source-atop';
  ctx.fillStyle = `rgba(255, 0, 0, ${state.staminaDeniedShake * 0.3})`;
  ctx.fillRect(zenoX - 25, zenoY - 25, 50, 50);
  ctx.globalCompositeOperation = 'source-over';
}
```

**Step 3: Commit**

```bash
git add src/game/engine/audio.ts src/game/engine/render.ts
git commit -m "feat(juice): improve action denied feedback

- Clear 'thunk' sound (not silence)
- Red pulse on Zeno sprite
- Stamina bar flashes red
- Always feedback, never silence"
```

---

### Task 8.4: Performance Guardrails Module

**Files:**
- Create: `src/game/engine/performanceGuard.ts`
- Modify: `src/game/engine/update.ts`
- Modify: `src/game/engine/particles.ts`

**Step 1: Create performanceGuard.ts module**

Create `src/game/engine/performanceGuard.ts`:

```typescript
/**
 * Performance Guardrails
 *
 * Monitors and enforces performance limits for juice effects.
 * Critical for Google Play Store success (battery/performance reviews).
 *
 * Guardrails:
 * - Particle budget (max 100-200)
 * - FPS monitoring with auto-degradation
 * - Audio instance limits
 * - Battery-conscious haptic limits
 */

// Configuration
const MAX_PARTICLES = 150;
const TARGET_FPS = 60;
const FPS_WARNING_THRESHOLD = 45;
const FPS_CRITICAL_THRESHOLD = 30;

// Tracking
let frameTimestamps: number[] = [];
let currentFPS = 60;
let qualityLevel: 'high' | 'medium' | 'low' = 'high';

// Particle budget
let activeParticleCount = 0;

/**
 * Update FPS tracking (call every frame)
 */
export function trackFrame(timestamp: number): void {
  frameTimestamps.push(timestamp);

  // Keep last 60 frames
  if (frameTimestamps.length > 60) {
    frameTimestamps.shift();
  }

  // Calculate FPS
  if (frameTimestamps.length >= 2) {
    const oldest = frameTimestamps[0];
    const newest = frameTimestamps[frameTimestamps.length - 1];
    const duration = newest - oldest;
    currentFPS = Math.round((frameTimestamps.length - 1) / (duration / 1000));
  }

  // Auto-adjust quality
  if (currentFPS < FPS_CRITICAL_THRESHOLD) {
    qualityLevel = 'low';
  } else if (currentFPS < FPS_WARNING_THRESHOLD) {
    qualityLevel = 'medium';
  } else {
    qualityLevel = 'high';
  }
}

/**
 * Get current FPS
 */
export function getCurrentFPS(): number {
  return currentFPS;
}

/**
 * Get current quality level
 */
export function getQualityLevel(): 'high' | 'medium' | 'low' {
  return qualityLevel;
}

/**
 * Check if we can spawn more particles
 */
export function canSpawnParticles(count: number): boolean {
  const limit = qualityLevel === 'high' ? MAX_PARTICLES
              : qualityLevel === 'medium' ? MAX_PARTICLES * 0.6
              : MAX_PARTICLES * 0.3;

  return activeParticleCount + count <= limit;
}

/**
 * Register particle spawn
 */
export function registerParticles(count: number): void {
  activeParticleCount += count;
}

/**
 * Register particle death
 */
export function unregisterParticles(count: number): void {
  activeParticleCount = Math.max(0, activeParticleCount - count);
}

/**
 * Get scaled particle count based on quality
 */
export function getScaledParticleCount(baseCount: number): number {
  const scale = qualityLevel === 'high' ? 1.0
              : qualityLevel === 'medium' ? 0.6
              : 0.3;
  return Math.max(1, Math.round(baseCount * scale));
}

/**
 * Check if effect should be skipped for performance
 */
export function shouldSkipEffect(effectType: 'particle' | 'glow' | 'shake'): boolean {
  if (qualityLevel === 'low') {
    // In low quality, skip non-essential effects
    return effectType === 'glow';
  }
  if (qualityLevel === 'medium') {
    // In medium, skip expensive effects sometimes
    return effectType === 'glow' && Math.random() > 0.5;
  }
  return false;
}

/**
 * Get maximum concurrent haptic operations
 * Battery-conscious limiting
 */
export function getMaxHapticOps(): number {
  return qualityLevel === 'high' ? 10
       : qualityLevel === 'medium' ? 5
       : 2;
}

let hapticOpsThisSecond = 0;
let lastHapticReset = Date.now();

/**
 * Check if haptic can fire (rate limiting)
 */
export function canFireHaptic(): boolean {
  const now = Date.now();
  if (now - lastHapticReset > 1000) {
    hapticOpsThisSecond = 0;
    lastHapticReset = now;
  }

  if (hapticOpsThisSecond >= getMaxHapticOps()) {
    return false;
  }

  hapticOpsThisSecond++;
  return true;
}

/**
 * Performance stats for debugging
 */
export function getPerformanceStats(): {
  fps: number;
  quality: string;
  particles: number;
  maxParticles: number;
} {
  const limit = qualityLevel === 'high' ? MAX_PARTICLES
              : qualityLevel === 'medium' ? MAX_PARTICLES * 0.6
              : MAX_PARTICLES * 0.3;

  return {
    fps: currentFPS,
    quality: qualityLevel,
    particles: activeParticleCount,
    maxParticles: limit,
  };
}
```

**Step 2: Integrate into update.ts**

In `src/game/engine/update.ts`:

```typescript
import {
  trackFrame,
  canSpawnParticles,
  registerParticles,
  getScaledParticleCount,
  shouldSkipEffect
} from './performanceGuard';

// At start of updateFrame:
trackFrame(nowMs);

// When spawning particles:
const particleCount = getScaledParticleCount(10);  // Base 10 particles
if (canSpawnParticles(particleCount)) {
  for (let i = 0; i < particleCount; i++) {
    state.particles.push({ /* ... */ });
  }
  registerParticles(particleCount);
}

// When checking glow effects:
if (!shouldSkipEffect('glow')) {
  state.edgeGlowIntensity = getEdgeGlowIntensity(state.ringsPassedThisThrow);
}
```

**Step 3: Integrate into haptics.ts**

In `src/game/engine/haptics.ts`:

```typescript
import { canFireHaptic } from './performanceGuard';

function vibrate(pattern: number | number[]): void {
  if (!hapticsEnabled || !hasHapticSupport()) return;

  // Battery-conscious rate limiting
  if (!canFireHaptic()) return;

  try {
    navigator.vibrate(pattern);
  } catch (e) {
    // Silently fail
  }
}
```

**Step 4: Add dev overlay (optional)**

In `src/components/Game.tsx` (dev mode only):

```typescript
import { getPerformanceStats } from '@/game/engine/performanceGuard';

// In render, only in dev:
{import.meta.env.DEV && (
  <div className="fixed bottom-2 left-2 text-xs text-white/50 bg-black/30 p-1 rounded">
    {(() => {
      const stats = getPerformanceStats();
      return `FPS: ${stats.fps} | Q: ${stats.quality} | P: ${stats.particles}/${stats.maxParticles}`;
    })()}
  </div>
)}
```

**Step 5: Commit**

```bash
git add src/game/engine/performanceGuard.ts src/game/engine/update.ts src/game/engine/haptics.ts src/components/Game.tsx
git commit -m "feat(juice): add performance guardrails module

- FPS monitoring with auto quality degradation
- Particle budget (150 max, scales with quality)
- Quality levels: high/medium/low (auto-detected)
- Battery-conscious haptic rate limiting
- Dev overlay for performance stats
- Critical for Google Play Store success"
```

---

## Testing Checklist

Run after each phase completion:

```bash
# Build check
npm run build

# Type check
npx tsc --noEmit

# Lint
npm run lint

# Manual testing
npm run dev
```

**Phase 1 (Core Juice) tests:**
- [ ] Ring collection shows "Nice!", "Great!", "PERFECT!" text
- [ ] Edge glow appears on 2nd/3rd ring
- [ ] Micro-freeze on ring collection (if not in slow-mo)
- [ ] Multiplier ladder shows during flight
- [ ] Audio escalates with ring collection
- [ ] Haptic feedback on ring collection (Android only)
- [ ] Haptic patterns vary by event type
- [ ] Audio doesn't spam on rapid ring collection (anti-fatigue)
- [ ] Pitch varies slightly on repeated sounds
- [ ] Landing grades (S/A/B/C/D) display correctly
- [ ] Grade sounds play appropriately
- [ ] Confetti on S/A grades
- [ ] Near-miss heartbeat triggers on fall near target
- [ ] Spotlight vignette focuses on target
- [ ] Distance counter animates
- [ ] Regular falls (non-near-miss) have hit-stop
- [ ] Dust particles on all falls
- [ ] Impact thud sound on falls

**Phase 2 (Progression Feel) tests:**
- [ ] Streak counter shows during gameplay
- [ ] Flame color changes with streak level
- [ ] Milestones celebrate at 3/5/10/15
- [ ] Streak break shows when lost
- [ ] ON FIRE mode activates at streak 5+
- [ ] Mini goal HUD shows closest achievement
- [ ] Progress toasts appear non-blocking

**Phase 3 (Polish) tests:**
- [ ] Sweet spot click on optimal charge
- [ ] Tension drone builds during charge
- [ ] Charge glow intensifies with power level
- [ ] Vignette appears at high charge
- [ ] Inputs during slow-mo are buffered and applied
- [ ] No "swallowed" inputs during hit-stop
- [ ] PB callouts on passing best
- [ ] Trail effects on float/brake
- [ ] Low stamina warning enhanced
- [ ] Action denied has clear feedback
- [ ] FPS stays above 45 with full juice
- [ ] Quality auto-degrades on low-end devices
- [ ] Particle count respects budget
- [ ] Haptics rate-limited on rapid actions

---

## Rollback Plan

Each task is a separate commit. To rollback:

```bash
# Find commit to revert
git log --oneline

# Revert specific commit
git revert <commit-hash>

# Or reset to before a phase
git reset --hard <pre-phase-commit>
```

---

## Files Summary

**New Files (17):**
- `src/game/engine/ringJuice.ts` - Ring collection feedback system
- `src/game/engine/gradeSystem.ts` - Landing grade calculation
- `src/game/engine/haptics.ts` - Vibration API wrapper for Android
- `src/game/engine/audioPool.ts` - Audio anti-fatigue system
- `src/game/engine/inputBuffer.ts` - Input buffering during slow-mo
- `src/game/engine/performanceGuard.ts` - FPS/particle budget guardrails
- `src/components/MultiplierLadder.tsx` - Multiplier HUD during flight
- `src/components/LandingGrade.tsx` - Grade stamp display
- `src/components/NearMissOverlay.tsx` - Near-miss drama UI
- `src/components/StreakCounter.tsx` - Hot streak HUD
- `src/components/StreakBreak.tsx` - Streak loss feedback
- `src/components/MiniGoalHUD.tsx` - Closest achievement display
- `src/components/ToastQueue.tsx` - Non-blocking notification system

**Modified Files (8):**
- `src/game/engine/types.ts` (state extensions for all juice systems)
- `src/game/engine/state.ts` (initialization and reset)
- `src/game/engine/update.ts` (logic integration, performance tracking)
- `src/game/engine/render.ts` (visual effects, charge glow, trails)
- `src/game/engine/audio.ts` (audio feedback with pooling)
- `src/game/engine/achievementProgress.ts` (goal selection)
- `src/components/Game.tsx` (React integration)
- `src/index.css` (animations)
