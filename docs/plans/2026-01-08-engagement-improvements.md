# One-More-Flick Engagement Improvements Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make every throw feel emotionally charged — epic tension for record attempts, comedic relief for failures — while adding meaningful progression and competitive hooks.

**Architecture:** The game engine already has `slowMo`, `zoom`, and `screenFlash` state properties. We'll extend these with a new "record zone" detection system, add comedic failure animations/sounds, create a stats overlay component, and implement infinite-precision scoring with daily challenge modes.

**Tech Stack:** React 18, TypeScript, Canvas 2D, WebAudio API, LocalStorage

---

## Phase 1: Epic Record Zone Camera (Peggle-style)

### Task 1.1: Add Record Zone Detection State

**Files:**
- Modify: `src/game/engine/types.ts`
- Modify: `src/game/engine/state.ts`

**Step 1: Add new state properties for record zone detection**

In `src/game/engine/types.ts`, add to `GameState` interface:

```typescript
// Record zone camera
recordZoneActive: boolean;      // True when approaching personal best
recordZoneIntensity: number;    // 0-1 based on how close to beating record
recordZonePeak: boolean;        // True at moment of potential record break
epicMomentTriggered: boolean;   // Prevents repeat triggers per throw
```

**Step 2: Initialize new state in state.ts**

In `createInitialState()`, add:

```typescript
recordZoneActive: false,
recordZoneIntensity: 0,
recordZonePeak: false,
epicMomentTriggered: false,
```

In `resetPhysics()`, add:

```typescript
state.recordZoneActive = false;
state.recordZoneIntensity = 0;
state.recordZonePeak = false;
state.epicMomentTriggered = false;
```

**Step 3: Commit**

```bash
git add src/game/engine/types.ts src/game/engine/state.ts
git commit -m "feat: add record zone state properties for epic camera"
```

---

### Task 1.2: Implement Record Zone Detection Logic

**Files:**
- Modify: `src/game/engine/update.ts`

**Step 1: Add record zone detection in the flying physics section**

After line ~213 (after existing zoom/slowMo logic), add:

```typescript
// Record zone detection - Peggle-style epic moment
if ((state.flying || state.sliding) && !state.epicMomentTriggered) {
  const approachingBest = state.px > state.best - 30 && state.px < state.best + 5;
  const willBeatRecord = state.px > state.best - 10 && state.vx > 0;

  if (approachingBest && state.best > 50) {
    state.recordZoneActive = true;
    // Intensity ramps up as we get closer
    const distToBest = Math.abs(state.px - state.best);
    state.recordZoneIntensity = Math.max(0, 1 - distToBest / 30);

    if (willBeatRecord && state.px > state.best - 3) {
      state.recordZonePeak = true;
      state.epicMomentTriggered = true;
    }
  } else {
    state.recordZoneActive = false;
    state.recordZoneIntensity = 0;
  }
}
```

**Step 2: Enhance slowMo and zoom when record zone is active**

Replace the existing slowMo/zoom block (lines ~204-213) with:

```typescript
if ((state.flying || state.sliding) && state.px > 90) {
  const edgeProximity = (state.px - 90) / (CLIFF_EDGE - 90);

  // Base slowMo from edge proximity
  let targetSlowMo = state.reduceFx ? 0 : Math.min(0.7, edgeProximity * 0.8);
  let targetZoom = state.reduceFx ? 1 : (1 + edgeProximity * 0.3);

  // Epic record zone amplification
  if (state.recordZoneActive && !state.reduceFx) {
    targetSlowMo = Math.min(0.95, targetSlowMo + state.recordZoneIntensity * 0.4);
    targetZoom = Math.min(2.2, targetZoom + state.recordZoneIntensity * 0.8);
  }

  // Peak moment freeze
  if (state.recordZonePeak && !state.reduceFx) {
    targetSlowMo = 0.98;
    targetZoom = 2.5;
  }

  state.slowMo = targetSlowMo;
  state.zoom = targetZoom;
  state.zoomTargetX = state.px;
  state.zoomTargetY = state.py;
  audio.edgeWarning(edgeProximity);
} else {
  audio.stopEdgeWarning();
}
```

**Step 3: Commit**

```bash
git add src/game/engine/update.ts
git commit -m "feat: implement record zone detection with epic slowMo/zoom"
```

---

### Task 1.3: Add Epic Record Zone Audio

**Files:**
- Modify: `src/game/audio.ts`
- Modify: `src/game/engine/update.ts`

**Step 1: Add heartbeat sound function to audio.ts**

```typescript
export function playHeartbeat(refs: AudioRefs, settings: AudioSettings, intensity01: number) {
  if (settings.muted || settings.volume <= 0) return;

  const ctx = ensureAudioContext(refs);
  const now = ctx.currentTime;

  // Double-thump heartbeat
  const freq = 50 + intensity01 * 30;
  const vol = (0.08 + intensity01 * 0.12) * settings.volume;

  // First thump
  const osc1 = ctx.createOscillator();
  osc1.type = 'sine';
  osc1.frequency.value = freq;
  const gain1 = ctx.createGain();
  gain1.gain.setValueAtTime(0, now);
  gain1.gain.linearRampToValueAtTime(vol, now + 0.02);
  gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
  osc1.connect(gain1);
  gain1.connect(ctx.destination);
  osc1.start(now);
  osc1.stop(now + 0.15);

  // Second thump (slightly quieter, higher)
  const osc2 = ctx.createOscillator();
  osc2.type = 'sine';
  osc2.frequency.value = freq * 1.2;
  const gain2 = ctx.createGain();
  gain2.gain.setValueAtTime(0, now + 0.12);
  gain2.gain.linearRampToValueAtTime(vol * 0.7, now + 0.14);
  gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
  osc2.connect(gain2);
  gain2.connect(ctx.destination);
  osc2.start(now + 0.12);
  osc2.stop(now + 0.25);
}

export function playRecordBreak(refs: AudioRefs, settings: AudioSettings) {
  if (settings.muted || settings.volume <= 0) return;

  const ctx = ensureAudioContext(refs);
  const now = ctx.currentTime;

  // Rising triumphant arpeggio
  const notes = [392, 494, 587, 784, 988]; // G4, B4, D5, G5, B5

  notes.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = freq;

    const gain = ctx.createGain();
    const startTime = now + i * 0.06;
    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(0.12 * settings.volume, startTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.4);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(startTime);
    osc.stop(startTime + 0.45);
  });
}
```

**Step 2: Add to GameAudio type and wire up**

In `update.ts`, add to `GameAudio` type:

```typescript
heartbeat: (intensity: number) => void;
recordBreak: () => void;
```

**Step 3: Update Game.tsx to pass new audio functions**

In `Game.tsx`, add to the audio object:

```typescript
heartbeat: (i) => playHeartbeat(audioRefs.current, audioSettingsRef.current, i),
recordBreak: () => playRecordBreak(audioRefs.current, audioSettingsRef.current),
```

**Step 4: Trigger heartbeat during record zone**

In `update.ts`, after record zone detection, add:

```typescript
// Heartbeat audio during record zone
if (state.recordZoneActive && !state.reduceFx) {
  // Play heartbeat every ~400ms based on frame count
  if (Math.floor(nowMs / 400) !== Math.floor((nowMs - 16) / 400)) {
    audio.heartbeat(state.recordZoneIntensity);
  }
}

// Record break celebration
if (state.recordZonePeak) {
  audio.recordBreak();
  state.recordZonePeak = false; // Only trigger once
}
```

**Step 5: Commit**

```bash
git add src/game/audio.ts src/game/engine/update.ts src/components/Game.tsx
git commit -m "feat: add heartbeat and record break audio for epic moments"
```

---

### Task 1.4: Add Visual Record Zone Indicators

**Files:**
- Modify: `src/game/engine/render.ts`

**Step 1: Add record zone visual effects to flipbook renderer**

In `renderFlipbookFrame()`, after the slow-mo corners section, add:

```typescript
// Record zone vignette and visual effects
if (state.recordZoneActive && !state.reduceFx) {
  const intensity = state.recordZoneIntensity;

  // Vignette effect (darker edges)
  const gradient = ctx.createRadialGradient(W/2, H/2, 0, W/2, H/2, W * 0.7);
  gradient.addColorStop(0, 'rgba(0,0,0,0)');
  gradient.addColorStop(0.7, `rgba(0,0,0,${intensity * 0.2})`);
  gradient.addColorStop(1, `rgba(0,0,0,${intensity * 0.5})`);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, W, H);

  // Pulsing border glow
  const pulse = Math.sin(nowMs / 100) * 0.5 + 0.5;
  ctx.strokeStyle = `rgba(255, 215, 0, ${intensity * pulse * 0.8})`;
  ctx.lineWidth = 4 + intensity * 4;
  ctx.strokeRect(2, 2, W - 4, H - 4);

  // "RECORD ZONE" text when intensity high
  if (intensity > 0.5) {
    ctx.fillStyle = `rgba(255, 215, 0, ${(intensity - 0.5) * 2})`;
    ctx.font = 'bold 16px "Comic Sans MS", cursive, sans-serif';
    ctx.textAlign = 'center';
    const textPulse = Math.sin(nowMs / 150) * 2;
    ctx.fillText('RECORD ZONE', W / 2, 25 + textPulse);
  }
}
```

**Step 2: Add similar effects to classic renderer**

In `renderClassicFrame()`, after the slow-mo corners section, add:

```typescript
// Record zone vignette (classic theme)
if (state.recordZoneActive && !state.reduceFx) {
  const intensity = state.recordZoneIntensity;

  // Gold border pulsing
  const pulse = Math.floor(nowMs / 80) % 2;
  if (pulse) {
    ctx.fillStyle = `rgba(255, 215, 0, ${intensity * 0.6})`;
    ctx.fillRect(0, 0, W, 2);
    ctx.fillRect(0, H - 2, W, 2);
    ctx.fillRect(0, 0, 2, H);
    ctx.fillRect(W - 2, 0, 2, H);
  }
}
```

**Step 3: Commit**

```bash
git add src/game/engine/render.ts
git commit -m "feat: add record zone visual effects (vignette, golden border)"
```

---

## Phase 2: Comedic Failure Moments

### Task 2.1: Add Failure Animation State

**Files:**
- Modify: `src/game/engine/types.ts`
- Modify: `src/game/engine/state.ts`

**Step 1: Add failure state properties**

In `types.ts`, add to `GameState`:

```typescript
// Comedic failure
failureAnimating: boolean;
failureFrame: number;
failureType: 'tumble' | 'splat' | 'dive' | null;
```

**Step 2: Initialize in state.ts**

In `createInitialState()`:

```typescript
failureAnimating: false,
failureFrame: 0,
failureType: null,
```

In `resetPhysics()`:

```typescript
state.failureAnimating = false;
state.failureFrame = 0;
state.failureType = null;
```

**Step 3: Commit**

```bash
git add src/game/engine/types.ts src/game/engine/state.ts
git commit -m "feat: add failure animation state for comedic falls"
```

---

### Task 2.2: Implement Failure Animation Logic

**Files:**
- Modify: `src/game/engine/update.ts`

**Step 1: Trigger failure animation when falling off**

Find the section where `state.fellOff = true` is set (around lines 242-248 and 354-366). Replace the fell-off handling with:

```typescript
// First fell-off location (in sliding stopped section ~line 242):
if (landedAt >= CLIFF_EDGE) {
  state.fellOff = true;
  state.dist = 0;
  state.lastMultiplier = 0;
  ui.setFellOff(true);
  ui.setLastMultiplier(0);
  ui.setPerfectLanding(false);

  // Trigger comedic failure
  state.failureAnimating = true;
  state.failureFrame = 0;
  state.failureType = Math.random() > 0.5 ? 'tumble' : 'dive';
  audio.tone(220, 0.15);
}

// Second fell-off location (sliding past edge ~line 354):
if (state.px >= CLIFF_EDGE && state.sliding) {
  state.sliding = false;
  state.fellOff = true;
  state.dist = 0;
  ui.setFellOff(true);

  // Comedic failure
  state.failureAnimating = true;
  state.failureFrame = 0;
  state.failureType = state.vx > 2 ? 'dive' : 'tumble';
  audio.tone(220, 0.15);

  ui.setLastDist(null);
  state.tryCount++;
  if (state.tryCount % 5 === 0) nextWind(state);
  svc.scheduleReset(2000); // Longer delay for animation
}
```

**Step 2: Update failure animation frames**

In the main update loop, add after particle updates:

```typescript
// Failure animation update
if (state.failureAnimating) {
  state.failureFrame++;

  // Animate falling off the edge
  if (state.failureType === 'tumble') {
    state.px += 1;
    state.py += state.failureFrame * 0.5;
    // Spawn occasional particles
    if (state.failureFrame % 5 === 0) {
      spawnParticles(state, state.px, state.py, 2, 1, theme.danger);
    }
  } else if (state.failureType === 'dive') {
    state.px += 2;
    state.py += state.failureFrame * 0.8;
  }

  // End animation after falling off screen
  if (state.py > H + 50) {
    state.failureAnimating = false;
  }
}
```

**Step 3: Commit**

```bash
git add src/game/engine/update.ts
git commit -m "feat: implement comedic failure animation logic"
```

---

### Task 2.3: Add Comedic Failure Audio

**Files:**
- Modify: `src/game/audio.ts`
- Modify: `src/game/engine/update.ts`
- Modify: `src/components/Game.tsx`

**Step 1: Add failure sound effects to audio.ts**

```typescript
export function playFailureSound(refs: AudioRefs, settings: AudioSettings, type: 'tumble' | 'dive' | 'splat') {
  if (settings.muted || settings.volume <= 0) return;

  const ctx = ensureAudioContext(refs);
  const now = ctx.currentTime;

  if (type === 'tumble') {
    // Descending "wah wah" trombone-style
    const notes = [350, 300, 250, 200];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.value = freq;

      const gain = ctx.createGain();
      const startTime = now + i * 0.15;
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.06 * settings.volume, startTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.14);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(startTime);
      osc.stop(startTime + 0.15);
    });
  } else if (type === 'dive') {
    // Descending whistle
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.exponentialRampToValueAtTime(100, now + 0.6);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.08 * settings.volume, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.65);
  }
}

// Wilhelm scream easter egg (rare)
export function playWilhelmScream(refs: AudioRefs, settings: AudioSettings) {
  // TODO: Could load actual audio file, for now synthesize a scream-like sound
  if (settings.muted || settings.volume <= 0) return;

  const ctx = ensureAudioContext(refs);
  const now = ctx.currentTime;

  // Descending yell with vibrato
  const osc = ctx.createOscillator();
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(600, now);
  osc.frequency.linearRampToValueAtTime(400, now + 0.5);

  // Vibrato
  const vibrato = ctx.createOscillator();
  vibrato.type = 'sine';
  vibrato.frequency.value = 8;
  const vibratoGain = ctx.createGain();
  vibratoGain.gain.value = 30;
  vibrato.connect(vibratoGain);
  vibratoGain.connect(osc.frequency);

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(0.1 * settings.volume, now + 0.02);
  gain.gain.setValueAtTime(0.1 * settings.volume, now + 0.3);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  vibrato.start(now);
  osc.stop(now + 0.55);
  vibrato.stop(now + 0.55);
}
```

**Step 2: Add to GameAudio type and Game.tsx**

In `update.ts` GameAudio type:

```typescript
failureSound: (type: 'tumble' | 'dive' | 'splat') => void;
wilhelmScream: () => void;
```

In `Game.tsx`:

```typescript
failureSound: (type) => playFailureSound(audioRefs.current, audioSettingsRef.current, type),
wilhelmScream: () => playWilhelmScream(audioRefs.current, audioSettingsRef.current),
```

**Step 3: Trigger failure sounds**

When setting `state.failureAnimating = true`, add:

```typescript
// 10% chance of Wilhelm scream easter egg
if (Math.random() < 0.1) {
  audio.wilhelmScream();
} else {
  audio.failureSound(state.failureType!);
}
```

**Step 4: Commit**

```bash
git add src/game/audio.ts src/game/engine/update.ts src/components/Game.tsx
git commit -m "feat: add comedic failure sounds (wah-wah, whistle, Wilhelm)"
```

---

### Task 2.4: Render Comedic Failure Animations

**Files:**
- Modify: `src/game/engine/render.ts`
- Modify: `src/game/engine/sketchy.ts`

**Step 1: Add failing stick figure variants to sketchy.ts**

```typescript
export function drawFailingStickFigure(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  color: string,
  nowMs: number,
  failureType: 'tumble' | 'dive',
  frame: number,
) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 2.5;
  ctx.lineCap = 'round';

  const spin = (frame * 0.3) % (Math.PI * 2);

  ctx.save();
  ctx.translate(x, y);

  if (failureType === 'tumble') {
    // Spinning tumble
    ctx.rotate(spin);

    // Head
    ctx.beginPath();
    ctx.arc(0, -12, 5, 0, Math.PI * 2);
    ctx.stroke();

    // Body
    ctx.beginPath();
    ctx.moveTo(0, -7);
    ctx.lineTo(0, 5);
    ctx.stroke();

    // Arms (flailing)
    const armWave = Math.sin(frame * 0.5) * 0.5;
    ctx.beginPath();
    ctx.moveTo(-8, -2 + armWave * 5);
    ctx.lineTo(0, -3);
    ctx.lineTo(8, -2 - armWave * 5);
    ctx.stroke();

    // Legs (kicking)
    ctx.beginPath();
    ctx.moveTo(-6, 12 + armWave * 3);
    ctx.lineTo(0, 5);
    ctx.lineTo(6, 12 - armWave * 3);
    ctx.stroke();

  } else if (failureType === 'dive') {
    // Superman dive pose
    ctx.rotate(-Math.PI / 6);

    // Head looking down
    ctx.beginPath();
    ctx.arc(0, -10, 5, 0, Math.PI * 2);
    ctx.stroke();

    // Panic eyes
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(-2, -11, 1.5, 0, Math.PI * 2);
    ctx.arc(2, -11, 1.5, 0, Math.PI * 2);
    ctx.fill();

    // Open mouth (O shape)
    ctx.beginPath();
    ctx.arc(0, -8, 2, 0, Math.PI * 2);
    ctx.stroke();

    // Body stretched
    ctx.beginPath();
    ctx.moveTo(0, -5);
    ctx.lineTo(0, 10);
    ctx.stroke();

    // Arms reaching forward
    ctx.beginPath();
    ctx.moveTo(-10, -8);
    ctx.lineTo(0, -3);
    ctx.lineTo(-10, -8);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(10, -8);
    ctx.lineTo(0, -3);
    ctx.stroke();

    // Legs trailing
    ctx.beginPath();
    ctx.moveTo(-5, 18);
    ctx.lineTo(0, 10);
    ctx.lineTo(5, 18);
    ctx.stroke();
  }

  ctx.restore();

  // Sweat drops / panic lines
  if (frame % 4 < 2) {
    ctx.beginPath();
    ctx.moveTo(x + 10, y - 15);
    ctx.lineTo(x + 14, y - 20);
    ctx.moveTo(x - 10, y - 15);
    ctx.lineTo(x - 14, y - 20);
    ctx.stroke();
  }
}
```

**Step 2: Use failing figure in render.ts**

In `renderFlipbookFrame()`, modify the player drawing section:

```typescript
// Player as stick figure
let playerState: 'idle' | 'charging' | 'flying' | 'landing' = 'idle';
if (state.charging) playerState = 'charging';
else if (state.flying || state.sliding) playerState = 'flying';
else if (state.landingFrame > 0) playerState = 'landing';

const playerColor = state.fellOff ? COLORS.danger : COLORS.player;

// Check for failure animation
if (state.failureAnimating && state.failureType) {
  drawFailingStickFigure(
    ctx,
    state.px,
    state.py,
    playerColor,
    nowMs,
    state.failureType,
    state.failureFrame,
  );
} else {
  drawStickFigure(
    ctx,
    state.px,
    state.py,
    playerColor,
    nowMs,
    playerState,
    state.angle,
    { vx: state.vx, vy: state.vy },
  );
}
```

**Step 3: Add "NOOO!" or funny text during failure**

```typescript
// Funny failure text
if (state.failureAnimating && state.failureFrame < 30) {
  const texts = ['NOOO!', 'AHHH!', 'OOF!', 'YIKES!'];
  const text = texts[Math.floor(state.seed % texts.length)];

  ctx.fillStyle = COLORS.danger;
  ctx.font = 'bold 14px "Comic Sans MS", cursive, sans-serif';
  ctx.textAlign = 'center';

  const bounce = Math.sin(state.failureFrame * 0.3) * 3;
  ctx.fillText(text, state.px, state.py - 30 + bounce);
}
```

**Step 4: Commit**

```bash
git add src/game/engine/render.ts src/game/engine/sketchy.ts
git commit -m "feat: render comedic failure animations with flailing stick figure"
```

---

## Phase 3: Stats Page with Skill Visibility

### Task 3.1: Create Stats Overlay Component

**Files:**
- Create: `src/components/StatsOverlay.tsx`

**Step 1: Create the stats overlay component**

```typescript
import { useEffect, useState } from 'react';
import { loadJson, loadNumber } from '@/game/storage';
import { ACHIEVEMENTS } from '@/game/engine/achievements';
import type { Stats } from '@/game/engine/types';
import type { Theme } from '@/game/themes';

type StatsOverlayProps = {
  theme: Theme;
  onClose: () => void;
};

type HistoryEntry = {
  date: string;
  bestDistance: number;
  throws: number;
};

export function StatsOverlay({ theme, onClose }: StatsOverlayProps) {
  const [stats, setStats] = useState<Stats>(() =>
    loadJson('stats', { totalThrows: 0, successfulLandings: 0, totalDistance: 0, perfectLandings: 0, maxMultiplier: 1 }, 'omf_stats')
  );
  const [history, setHistory] = useState<HistoryEntry[]>(() =>
    loadJson('history', [], 'omf_history')
  );
  const [achievements, setAchievements] = useState<Set<string>>(() => {
    const arr = loadJson<string[]>('achievements', [], 'omf_achievements');
    return new Set(arr);
  });

  const successRate = stats.totalThrows > 0
    ? Math.round((stats.successfulLandings / stats.totalThrows) * 100)
    : 0;

  const avgDistance = stats.successfulLandings > 0
    ? (stats.totalDistance / stats.successfulLandings).toFixed(2)
    : '0.00';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.8)' }}
      onClick={onClose}
    >
      <div
        className="max-w-md w-full max-h-[80vh] overflow-y-auto rounded-lg p-4"
        style={{ background: theme.uiBg, border: `2px solid ${theme.accent1}` }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold" style={{ color: theme.accent1 }}>
            Your Stats
          </h2>
          <button
            onClick={onClose}
            className="text-xl px-2"
            style={{ color: theme.uiText }}
          >
            ×
          </button>
        </div>

        {/* Main stats grid */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <StatBox label="Total Throws" value={stats.totalThrows} theme={theme} />
          <StatBox label="Success Rate" value={`${successRate}%`} theme={theme} />
          <StatBox label="Perfect Landings" value={stats.perfectLandings} theme={theme} />
          <StatBox label="Avg Distance" value={avgDistance} theme={theme} />
          <StatBox label="Max Multiplier" value={`${stats.maxMultiplier.toFixed(1)}x`} theme={theme} />
          <StatBox label="Achievements" value={`${achievements.size}/${Object.keys(ACHIEVEMENTS).length}`} theme={theme} />
        </div>

        {/* Achievement list */}
        <div className="mb-4">
          <h3 className="text-sm font-bold mb-2" style={{ color: theme.accent2 }}>
            Achievements
          </h3>
          <div className="grid grid-cols-1 gap-1">
            {Object.entries(ACHIEVEMENTS).map(([id, ach]) => (
              <div
                key={id}
                className="flex items-center gap-2 text-xs p-1 rounded"
                style={{
                  background: achievements.has(id) ? `${theme.highlight}20` : 'transparent',
                  color: achievements.has(id) ? theme.highlight : theme.uiText,
                  opacity: achievements.has(id) ? 1 : 0.5,
                }}
              >
                <span>{achievements.has(id) ? '★' : '☆'}</span>
                <span className="font-bold">{ach.name}</span>
                <span className="opacity-70">— {ach.desc}</span>
              </div>
            ))}
          </div>
        </div>

        {/* History (last 7 days) */}
        {history.length > 0 && (
          <div>
            <h3 className="text-sm font-bold mb-2" style={{ color: theme.accent2 }}>
              Recent History
            </h3>
            <div className="text-xs" style={{ color: theme.uiText }}>
              {history.slice(-7).reverse().map((entry, i) => (
                <div key={i} className="flex justify-between py-1 border-b border-opacity-20" style={{ borderColor: theme.accent3 }}>
                  <span>{entry.date}</span>
                  <span>Best: {entry.bestDistance.toFixed(2)}</span>
                  <span>{entry.throws} throws</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StatBox({ label, value, theme }: { label: string; value: string | number; theme: Theme }) {
  return (
    <div
      className="p-2 rounded text-center"
      style={{ background: `${theme.accent3}20`, border: `1px solid ${theme.accent3}` }}
    >
      <div className="text-xs opacity-70" style={{ color: theme.uiText }}>{label}</div>
      <div className="text-lg font-bold font-mono" style={{ color: theme.accent1 }}>{value}</div>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add src/components/StatsOverlay.tsx
git commit -m "feat: create StatsOverlay component for detailed statistics"
```

---

### Task 3.2: Add History Tracking

**Files:**
- Modify: `src/game/storage.ts`
- Modify: `src/game/engine/update.ts`

**Step 1: Add history types and functions to storage.ts**

```typescript
export type HistoryEntry = {
  date: string;
  bestDistance: number;
  throws: number;
  score: number;
};

export function loadHistory(): HistoryEntry[] {
  return loadJson<HistoryEntry[]>('history', [], 'omf_history');
}

export function saveHistory(history: HistoryEntry[]) {
  // Keep only last 30 days
  const trimmed = history.slice(-30);
  saveJson('history', trimmed);
}

export function updateTodayHistory(bestDistance: number, throws: number, score: number) {
  const today = todayLocalISODate();
  const history = loadHistory();

  const todayIndex = history.findIndex(h => h.date === today);
  if (todayIndex >= 0) {
    history[todayIndex] = {
      date: today,
      bestDistance: Math.max(history[todayIndex].bestDistance, bestDistance),
      throws: throws,
      score: Math.max(history[todayIndex].score, score),
    };
  } else {
    history.push({ date: today, bestDistance, throws, score });
  }

  saveHistory(history);
}
```

**Step 2: Call updateTodayHistory after each throw**

In `update.ts`, after `saveJson('stats', state.stats);` add:

```typescript
import { updateTodayHistory } from '@/game/storage';

// After stats save:
updateTodayHistory(state.best, state.stats.totalThrows, state.totalScore);
```

**Step 3: Commit**

```bash
git add src/game/storage.ts src/game/engine/update.ts
git commit -m "feat: add daily history tracking for stats page"
```

---

### Task 3.3: Integrate Stats Button into Game UI

**Files:**
- Modify: `src/components/Game.tsx`

**Step 1: Add stats overlay state and button**

Add state:

```typescript
const [showStats, setShowStats] = useState(false);
```

Add import:

```typescript
import { StatsOverlay } from './StatsOverlay';
```

Add button in the settings row:

```typescript
<button
  className="px-2 py-1 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
  style={{ background: theme.uiBg, border: `1px solid ${theme.accent3}` }}
  onClick={() => setShowStats(true)}
  aria-label="View stats"
>
  Stats
</button>
```

Add overlay render at the end of the component:

```typescript
{showStats && (
  <StatsOverlay theme={theme} onClose={() => setShowStats(false)} />
)}
```

**Step 2: Commit**

```bash
git add src/components/Game.tsx
git commit -m "feat: add stats button and overlay integration"
```

---

## Phase 4: Infinite-Precision Leaderboard

### Task 4.1: Implement Dynamic Decimal Precision

**Files:**
- Modify: `src/game/constants.ts`
- Create: `src/game/leaderboard.ts`

**Step 1: Create leaderboard module**

```typescript
import { loadJson, saveJson, loadNumber, saveNumber } from './storage';
import { CLIFF_EDGE } from './constants';

export type LeaderboardEntry = {
  distance: number;
  precision: number; // Number of decimal places
  date: string;
  displayDistance: string;
};

// Get current precision level (starts at 4 decimals)
export function getCurrentPrecision(): number {
  return loadNumber('leaderboard_precision', 4, 'omf_leaderboard_precision');
}

// Calculate the theoretical maximum at current precision
export function getMaxAtPrecision(precision: number): number {
  // Max is CLIFF_EDGE - (1 / 10^precision)
  // e.g., at 4 decimals: 419.9999
  return CLIFF_EDGE - Math.pow(10, -precision);
}

// Check if precision should increase
export function shouldIncreasePrecision(distance: number): boolean {
  const precision = getCurrentPrecision();
  const threshold = getMaxAtPrecision(precision) - Math.pow(10, -(precision - 1));
  // If distance is within 0.1 of the current max, increase precision
  return distance >= threshold;
}

// Increase precision level
export function increasePrecision(): number {
  const current = getCurrentPrecision();
  const next = Math.min(current + 1, 12); // Cap at 12 decimals
  saveNumber('leaderboard_precision', next);
  return next;
}

// Format distance with appropriate precision
export function formatLeaderboardDistance(distance: number): string {
  const precision = getCurrentPrecision();
  return distance.toFixed(precision);
}

// Personal leaderboard (top 10 throws)
export function getPersonalLeaderboard(): LeaderboardEntry[] {
  return loadJson<LeaderboardEntry[]>('personal_leaderboard', [], 'omf_personal_leaderboard');
}

export function addToPersonalLeaderboard(distance: number): boolean {
  const precision = getCurrentPrecision();
  const leaderboard = getPersonalLeaderboard();

  const entry: LeaderboardEntry = {
    distance,
    precision,
    date: new Date().toISOString(),
    displayDistance: distance.toFixed(precision),
  };

  // Check if this would trigger precision increase
  if (shouldIncreasePrecision(distance)) {
    increasePrecision();
    entry.precision = getCurrentPrecision();
    entry.displayDistance = distance.toFixed(entry.precision);
  }

  // Add and sort
  leaderboard.push(entry);
  leaderboard.sort((a, b) => b.distance - a.distance);

  // Keep top 10
  const trimmed = leaderboard.slice(0, 10);
  saveJson('personal_leaderboard', trimmed);

  // Return true if this is a new top entry
  return trimmed[0].distance === distance;
}
```

**Step 2: Commit**

```bash
git add src/game/leaderboard.ts
git commit -m "feat: create infinite-precision leaderboard system"
```

---

### Task 4.2: Integrate Leaderboard into Game

**Files:**
- Modify: `src/game/engine/update.ts`
- Modify: `src/components/StatsOverlay.tsx`

**Step 1: Add to personal leaderboard on successful landing**

In `update.ts`, after recording a new best:

```typescript
import { addToPersonalLeaderboard } from '@/game/leaderboard';

// After state.best update:
if (state.dist > 50) { // Only track meaningful distances
  addToPersonalLeaderboard(state.dist);
}
```

**Step 2: Display leaderboard in StatsOverlay**

Add to StatsOverlay.tsx:

```typescript
import { getPersonalLeaderboard, getCurrentPrecision, getMaxAtPrecision } from '@/game/leaderboard';

// In component:
const [leaderboard] = useState(() => getPersonalLeaderboard());
const precision = getCurrentPrecision();
const maxDistance = getMaxAtPrecision(precision);

// Add section in render:
{leaderboard.length > 0 && (
  <div className="mb-4">
    <h3 className="text-sm font-bold mb-2" style={{ color: theme.accent2 }}>
      Personal Leaderboard
      <span className="text-xs font-normal opacity-70 ml-2">
        (Precision: {precision} decimals)
      </span>
    </h3>
    <div className="text-xs" style={{ color: theme.uiText }}>
      {leaderboard.map((entry, i) => (
        <div
          key={i}
          className="flex justify-between py-1"
          style={{ color: i === 0 ? theme.highlight : theme.uiText }}
        >
          <span>#{i + 1}</span>
          <span className="font-mono">{entry.displayDistance}</span>
          <span className="opacity-50">{new Date(entry.date).toLocaleDateString()}</span>
        </div>
      ))}
    </div>
    <div className="text-xs mt-2 opacity-70" style={{ color: theme.uiText }}>
      Next decimal unlocks at: {maxDistance.toFixed(precision)}
    </div>
  </div>
)}
```

**Step 3: Commit**

```bash
git add src/game/engine/update.ts src/components/StatsOverlay.tsx
git commit -m "feat: integrate infinite-precision leaderboard into game"
```

---

## Phase 5: Daily Challenges

### Task 5.1: Create Daily Challenge System

**Files:**
- Create: `src/game/dailyChallenge.ts`

**Step 1: Create daily challenge module**

```typescript
import { dailySeedFromDate, loadJson, saveJson, todayLocalISODate } from './storage';
import { CLIFF_EDGE } from './constants';

export type ChallengeType =
  | 'streak_above'      // Land X throws above a distance
  | 'misery'            // Shortest throw wins
  | 'jackpot_target'    // Hit within ±N of a random target
  | 'consistency'       // X throws within ±5 of each other
  | 'multiplier_hunt';  // Achieve total multiplier sum

export type DailyChallenge = {
  type: ChallengeType;
  date: string;
  target: number;        // The goal (distance, count, etc.)
  tolerance: number;     // For jackpot: ±N tolerance
  description: string;
  progress: number;
  completed: boolean;
  attempts: number;
  bestAttempt: number;
};

// Generate deterministic daily challenge from date
export function generateDailyChallenge(date: string = todayLocalISODate()): DailyChallenge {
  const seed = dailySeedFromDate(date);
  const challengeTypes: ChallengeType[] = ['streak_above', 'misery', 'jackpot_target', 'consistency', 'multiplier_hunt'];
  const type = challengeTypes[seed % challengeTypes.length];

  let target: number;
  let tolerance = 0;
  let description: string;

  switch (type) {
    case 'streak_above':
      target = 3 + (seed % 3); // 3-5 throws
      const threshold = 350 + (seed % 50); // Above 350-400
      description = `Land ${target} throws above ${threshold}`;
      break;

    case 'misery':
      target = 50; // Below 50 is "winning"
      description = `Shortest safe landing wins (under ${target})`;
      break;

    case 'jackpot_target':
      target = 100 + ((seed * 7) % 300); // Random target 100-400
      tolerance = 30 - Math.floor((seed % 20)); // ±10-30
      description = `Hit ${target} ±${tolerance}`;
      break;

    case 'consistency':
      target = 4; // 4 throws
      tolerance = 5; // Within ±5
      description = `${target} throws within ±${tolerance} of each other`;
      break;

    case 'multiplier_hunt':
      target = 10; // Total 10x multiplier
      description = `Accumulate ${target}x total multiplier`;
      break;

    default:
      target = 3;
      description = 'Unknown challenge';
  }

  return {
    type,
    date,
    target,
    tolerance,
    description,
    progress: 0,
    completed: false,
    attempts: 0,
    bestAttempt: 0,
  };
}

// Load today's challenge (creates if doesn't exist)
export function loadDailyChallenge(): DailyChallenge {
  const today = todayLocalISODate();
  const stored = loadJson<DailyChallenge | null>('daily_challenge', null, 'omf_daily_challenge');

  if (!stored || stored.date !== today) {
    const newChallenge = generateDailyChallenge(today);
    saveJson('daily_challenge', newChallenge);
    return newChallenge;
  }

  return stored;
}

// Update challenge progress
export function updateDailyChallenge(
  distance: number,
  multiplier: number,
  fellOff: boolean,
): DailyChallenge {
  const challenge = loadDailyChallenge();

  if (challenge.completed) return challenge;

  challenge.attempts++;

  switch (challenge.type) {
    case 'streak_above': {
      const threshold = parseInt(challenge.description.match(/above (\d+)/)?.[1] || '350');
      if (!fellOff && distance >= threshold) {
        challenge.progress++;
        if (challenge.progress >= challenge.target) {
          challenge.completed = true;
        }
      } else {
        challenge.progress = 0; // Streak broken
      }
      break;
    }

    case 'misery':
      if (!fellOff && distance < challenge.target) {
        if (challenge.bestAttempt === 0 || distance < challenge.bestAttempt) {
          challenge.bestAttempt = distance;
        }
        challenge.completed = true;
      }
      break;

    case 'jackpot_target':
      if (!fellOff) {
        const diff = Math.abs(distance - challenge.target);
        if (diff <= challenge.tolerance) {
          challenge.completed = true;
          challenge.bestAttempt = distance;
        }
      }
      break;

    case 'consistency':
      // Track in separate storage, simplified here
      if (!fellOff) {
        challenge.progress++;
        if (challenge.progress >= challenge.target) {
          challenge.completed = true;
        }
      }
      break;

    case 'multiplier_hunt':
      if (!fellOff) {
        challenge.progress += multiplier;
        if (challenge.progress >= challenge.target) {
          challenge.completed = true;
        }
      }
      break;
  }

  saveJson('daily_challenge', challenge);
  return challenge;
}
```

**Step 2: Commit**

```bash
git add src/game/dailyChallenge.ts
git commit -m "feat: create daily challenge system with multiple challenge types"
```

---

### Task 5.2: Integrate Daily Challenge UI

**Files:**
- Modify: `src/components/Game.tsx`

**Step 1: Add daily challenge state and display**

Add imports and state:

```typescript
import { loadDailyChallenge, updateDailyChallenge, type DailyChallenge } from '@/game/dailyChallenge';

const [dailyChallenge, setDailyChallenge] = useState<DailyChallenge>(() => loadDailyChallenge());
```

Add challenge display after session goals:

```typescript
{/* Daily Challenge */}
<div
  className="text-[10px] text-center max-w-md p-2 rounded"
  style={{
    background: dailyChallenge.completed ? `${theme.highlight}20` : `${theme.accent3}10`,
    border: `1px solid ${dailyChallenge.completed ? theme.highlight : theme.accent3}`,
    color: theme.uiText,
  }}
>
  <span className="font-bold" style={{ color: theme.accent1 }}>
    Daily Challenge:
  </span>
  <span className={dailyChallenge.completed ? 'line-through opacity-50' : ''}>
    {dailyChallenge.description}
  </span>
  {dailyChallenge.completed && (
    <span style={{ color: theme.highlight }}> ✓ Complete!</span>
  )}
  {!dailyChallenge.completed && dailyChallenge.progress > 0 && (
    <span style={{ color: theme.accent2 }}> ({dailyChallenge.progress}/{dailyChallenge.target})</span>
  )}
</div>
```

Add to GameUI type and wire up challenge updates in update.ts.

**Step 2: Commit**

```bash
git add src/components/Game.tsx src/game/engine/update.ts
git commit -m "feat: integrate daily challenge UI and progress tracking"
```

---

## Phase 6: Bragging Rights - Consecutive 419+ Counter

### Task 6.1: Add Hot Streak Tracking

**Files:**
- Modify: `src/game/engine/types.ts`
- Modify: `src/game/engine/state.ts`
- Modify: `src/game/engine/update.ts`
- Modify: `src/game/storage.ts`

**Step 1: Add streak state**

In types.ts:

```typescript
// Hot streak (consecutive 419+ throws)
hotStreak: number;
bestHotStreak: number;
```

In state.ts initialization:

```typescript
hotStreak: 0,
bestHotStreak: loadNumber('best_hot_streak', 0, 'omf_best_hot_streak'),
```

In resetPhysics, reset hotStreak only on failure (keep it across successful throws).

**Step 2: Track streaks in update.ts**

After a successful landing above 419:

```typescript
if (state.dist >= 419) {
  state.hotStreak++;
  if (state.hotStreak > state.bestHotStreak) {
    state.bestHotStreak = state.hotStreak;
    saveNumber('best_hot_streak', state.bestHotStreak);
  }
} else if (state.dist < 419 || state.fellOff) {
  state.hotStreak = 0;
}
```

**Step 3: Display streak in UI**

Add to Game.tsx stats row:

```typescript
{state.hotStreak > 0 && (
  <span style={{ color: theme.highlight }}>
    🔥 {state.hotStreak} streak
  </span>
)}
```

**Step 4: Commit**

```bash
git add src/game/engine/types.ts src/game/engine/state.ts src/game/engine/update.ts src/game/storage.ts src/components/Game.tsx
git commit -m "feat: add hot streak tracking for consecutive 419+ throws"
```

---

## Canvas Visualization

See `docs/plans/2026-01-08-engagement-improvements.canvas` for visual progress tracking.

---

## Summary

| Phase | Feature | Files |
|-------|---------|-------|
| 1 | Epic Record Zone Camera | types, state, update, render, audio |
| 2 | Comedic Failure Moments | types, state, update, render, sketchy, audio |
| 3 | Stats Page | StatsOverlay.tsx, storage, Game.tsx |
| 4 | Infinite-Precision Leaderboard | leaderboard.ts, StatsOverlay, update |
| 5 | Daily Challenges | dailyChallenge.ts, Game.tsx, update |
| 6 | Hot Streak Counter | types, state, update, storage, Game.tsx |

Total: ~15 tasks, ~6 new files, modifications to ~10 existing files
