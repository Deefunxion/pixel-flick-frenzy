import {
  areAudioFilesLoaded,
  playWhooshFile,
  playImpactFile,
  startChargeFile,
  updateChargeFile,
  stopChargeFile,
  startFlyFile,
  stopFlyFile,
  playSlideFile,
  stopSlideFile,
  playWinFile,
  playRecordBreakFile,
  playFailureFile,
  // Precision control sounds
  playTapAirBrakeFile,
  playTapPushGroundFile,
  playLateHoldFile,
  // Background ambient
  startAmbientFile as startAmbientFileInternal,
  stopAmbientFile as stopAmbientFileInternal,
  updateAmbientVolume as updateAmbientVolumeInternal,
  // Precision bar sounds
  startPrecisionDroneFile,
  stopPrecisionDroneFile,
  playPbDingFile,
  playNewRecordFile,
  playCloseCallFile,
} from './audioFiles';
import {
  canPlaySound,
  registerSoundPlay,
  getRandomPitch,
  getDecayedVolume,
  SOUND_COOLDOWNS,
} from './engine/audioPool';

export type AudioSettings = {
  muted: boolean;
  volume: number; // 0..1
};

export type AudioRefs = {
  ctx: AudioContext | null;
  chargeOsc: OscillatorNode | null;
  chargeGain: GainNode | null;
  edgeOsc: OscillatorNode | null;
  edgeGain: GainNode | null;
  // Tension drone for charge buildup
  tensionOsc: OscillatorNode | null;
  tensionGain: GainNode | null;
  unlocked: boolean; // Track if audio has been unlocked by user gesture
  stateChangeHandler: (() => void) | null; // For cleanup
};

export function ensureAudioContext(refs: AudioRefs): AudioContext {
  if (!refs.ctx) {
    refs.ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
  }
  return refs.ctx;
}

// iOS Safari has 'suspended', 'running', 'closed', and 'interrupted' states
// 'interrupted' happens when user switches apps, phone locks, or call comes in
export async function resumeIfNeeded(refs: AudioRefs): Promise<boolean> {
  if (!refs.ctx) return false;
  const state = refs.ctx.state as string; // Cast to handle 'interrupted' which isn't in TS types
  if (state === 'suspended' || state === 'interrupted') {
    try {
      await refs.ctx.resume();
      return refs.ctx.state === 'running';
    } catch {
      return false;
    }
  }
  return state === 'running';
}

// Legacy alias for backwards compatibility
export const resumeIfSuspended = resumeIfNeeded;

// iOS Safari requires playing a silent buffer to fully unlock audio
// Call this on the first user gesture (touch/click)
export async function unlockAudioForIOS(refs: AudioRefs): Promise<boolean> {
  try {
    const ctx = ensureAudioContext(refs);

    // Set up statechange listener to handle interruptions (iOS switches apps, locks, calls)
    if (!refs.stateChangeHandler) {
      refs.stateChangeHandler = () => {
        const state = ctx.state as string;
        if ((state === 'suspended' || state === 'interrupted') && refs.unlocked) {
          // Only auto-resume if we previously unlocked successfully
          ctx.resume().catch(() => {});
        }
      };
      ctx.addEventListener('statechange', refs.stateChangeHandler);
    }

    // Resume if suspended or interrupted (iOS-specific state)
    const state = ctx.state as string;
    if (state === 'suspended' || state === 'interrupted') {
      await ctx.resume();
    }

    // Play a silent buffer to fully unlock iOS audio
    const buffer = ctx.createBuffer(1, 1, ctx.sampleRate);
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);
    source.start(0);

    // Also create and immediately stop an oscillator (belt and suspenders)
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    gain.gain.value = 0;
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(0);
    osc.stop(ctx.currentTime + 0.001);

    const success = ctx.state === 'running';
    if (success) {
      refs.unlocked = true;
    }
    return success;
  } catch {
    return false;
  }
}

// Get current audio state for UI feedback
export type AudioState = 'running' | 'suspended' | 'interrupted' | 'closed' | 'unavailable';

export function getAudioState(refs: AudioRefs): AudioState {
  if (!refs.ctx) return 'unavailable';
  return refs.ctx.state as AudioState;
}

// Check if audio is likely blocked by iOS silent mode
// Note: There's no direct API for this, but we can detect if audio is "running" but not producing sound
export function isAudioUnlocked(refs: AudioRefs): boolean {
  return refs.unlocked && refs.ctx?.state === 'running';
}

function env(gain: GainNode, now: number, peak: number, duration: number) {
  gain.gain.cancelScheduledValues(now);
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.linearRampToValueAtTime(peak, now + 0.006);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
}

export function playTone(refs: AudioRefs, settings: AudioSettings, freq: number, duration: number, type: OscillatorType = 'square', volume = 0.1) {
  if (settings.muted || settings.volume <= 0) return;

  const ctx = ensureAudioContext(refs);
  const now = ctx.currentTime;

  const osc = ctx.createOscillator();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, now);

  const gain = ctx.createGain();
  env(gain, now, volume * settings.volume, duration);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + duration + 0.02);
}

export function playWhoosh(refs: AudioRefs, settings: AudioSettings) {
  if (settings.muted || settings.volume <= 0) return;
  const ctx = ensureAudioContext(refs);
  const now = ctx.currentTime;

  // Tone glide
  const osc = ctx.createOscillator();
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(420, now);
  osc.frequency.exponentialRampToValueAtTime(120, now + 0.16);

  const gain = ctx.createGain();
  env(gain, now, 0.06 * settings.volume, 0.18);

  // Noise burst
  const noiseBuf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.18), ctx.sampleRate);
  const data = noiseBuf.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * 0.6;
  const noise = ctx.createBufferSource();
  noise.buffer = noiseBuf;

  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.setValueAtTime(900, now);
  filter.Q.setValueAtTime(0.8, now);

  const noiseGain = ctx.createGain();
  env(noiseGain, now, 0.03 * settings.volume, 0.18);

  osc.connect(gain);
  gain.connect(ctx.destination);

  noise.connect(filter);
  filter.connect(noiseGain);
  noiseGain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 0.2);

  noise.start(now);
  noise.stop(now + 0.2);
}

export function playImpact(refs: AudioRefs, settings: AudioSettings, intensity01: number) {
  if (settings.muted || settings.volume <= 0) return;

  const ctx = ensureAudioContext(refs);
  const now = ctx.currentTime;

  // Low thud
  playTone(refs, settings, 70 + intensity01 * 40, 0.14, 'sine', 0.09);

  // Noise click
  const noiseBuf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.12), ctx.sampleRate);
  const data = noiseBuf.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * 0.5;

  const src = ctx.createBufferSource();
  src.buffer = noiseBuf;

  const filter = ctx.createBiquadFilter();
  filter.type = 'highpass';
  filter.frequency.setValueAtTime(600 + intensity01 * 1000, now);

  const gain = ctx.createGain();
  env(gain, now, (0.05 + intensity01 * 0.05) * settings.volume, 0.12);

  src.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);

  src.start(now);
  src.stop(now + 0.14);
}

export function stopChargeTone(refs: AudioRefs) {
  if (refs.chargeOsc) {
    try { refs.chargeOsc.stop(); } catch { /* oscillator already stopped */ }
    refs.chargeOsc = null;
  }
  refs.chargeGain = null;
}

export function startChargeTone(refs: AudioRefs, settings: AudioSettings) {
  if (settings.muted || settings.volume <= 0) return;

  const ctx = ensureAudioContext(refs);
  stopChargeTone(refs);

  const osc = ctx.createOscillator();
  osc.type = 'sine';
  osc.frequency.value = 220;

  const gain = ctx.createGain();
  gain.gain.value = 0.0001;
  gain.gain.linearRampToValueAtTime(0.04 * settings.volume, ctx.currentTime + 0.02);

  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start();

  refs.chargeOsc = osc;
  refs.chargeGain = gain;
}

export function updateChargeTone(refs: AudioRefs, settings: AudioSettings, chargePower01: number) {
  if (settings.muted || settings.volume <= 0) return;
  if (!refs.chargeOsc || !refs.chargeGain || !refs.ctx) return;

  refs.chargeOsc.frequency.value = 220 + chargePower01 * 660;
  refs.chargeGain.gain.value = (0.02 + chargePower01 * 0.05) * settings.volume;
}

export function stopEdgeWarning(refs: AudioRefs) {
  if (refs.edgeOsc) {
    try { refs.edgeOsc.stop(); } catch { /* oscillator already stopped */ }
    refs.edgeOsc = null;
  }
  refs.edgeGain = null;
}

export function updateEdgeWarning(refs: AudioRefs, settings: AudioSettings, proximity01: number) {
  if (settings.muted || settings.volume <= 0) return;

  const ctx = ensureAudioContext(refs);

  if (proximity01 > 0.3) {
    if (!refs.edgeOsc) {
      const osc = ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.value = 100;

      const gain = ctx.createGain();
      gain.gain.value = 0;

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();

      refs.edgeOsc = osc;
      refs.edgeGain = gain;
    }

    refs.edgeOsc.frequency.value = 80 + proximity01 * 120;
    refs.edgeGain!.gain.value = (proximity01 - 0.3) * 0.06 * settings.volume;
  } else {
    stopEdgeWarning(refs);
  }
}

// ============================================
// CHARGE TENSION DRONE
// ============================================

/**
 * Start tension drone during charge - low rumble that builds
 */
export function startTensionDrone(refs: AudioRefs, settings: AudioSettings): void {
  if (settings.muted || settings.volume <= 0 || refs.tensionOsc) return;

  const ctx = ensureAudioContext(refs);

  refs.tensionOsc = ctx.createOscillator();
  refs.tensionGain = ctx.createGain();

  refs.tensionOsc.type = 'sine';
  refs.tensionOsc.frequency.setValueAtTime(80, ctx.currentTime);

  refs.tensionGain.gain.setValueAtTime(0, ctx.currentTime);

  refs.tensionOsc.connect(refs.tensionGain);
  refs.tensionGain.connect(ctx.destination);

  refs.tensionOsc.start();
}

/**
 * Update tension drone pitch based on charge level
 */
export function updateTensionDrone(refs: AudioRefs, settings: AudioSettings, power01: number): void {
  if (!refs.ctx || !refs.tensionOsc || !refs.tensionGain) return;
  if (settings.muted || settings.volume <= 0) return;

  // Pitch rises with charge: 80Hz → 200Hz
  const freq = 80 + power01 * 120;
  refs.tensionOsc.frequency.setValueAtTime(freq, refs.ctx.currentTime);

  // Volume rises too: 0 → 0.1
  const volume = power01 * 0.1 * settings.volume;
  refs.tensionGain.gain.setValueAtTime(volume, refs.ctx.currentTime);
}

/**
 * Stop/release tension drone on launch
 */
export function stopTensionDrone(refs: AudioRefs): void {
  if (!refs.tensionOsc || !refs.tensionGain || !refs.ctx) return;

  // Quick fade out
  refs.tensionGain.gain.setValueAtTime(refs.tensionGain.gain.value, refs.ctx.currentTime);
  refs.tensionGain.gain.exponentialRampToValueAtTime(0.001, refs.ctx.currentTime + 0.1);

  const osc = refs.tensionOsc;
  setTimeout(() => {
    try {
      osc.stop();
    } catch { /* already stopped */ }
  }, 100);

  refs.tensionOsc = null;
  refs.tensionGain = null;
}

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
  // Synthesize a scream-like sound
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

// ============================================
// HYBRID AUDIO FUNCTIONS (file-based with synth fallback)
// ============================================

/**
 * Play whoosh - uses file if loaded, otherwise synth
 */
export function playWhooshHybrid(refs: AudioRefs, settings: AudioSettings): void {
  if (areAudioFilesLoaded()) {
    playWhooshFile(refs, settings);
  } else {
    playWhoosh(refs, settings);
  }
}

/**
 * Play impact - uses file if loaded, otherwise synth
 */
export function playImpactHybrid(refs: AudioRefs, settings: AudioSettings, intensity01: number): void {
  if (areAudioFilesLoaded()) {
    playImpactFile(refs, settings, intensity01);
  } else {
    playImpact(refs, settings, intensity01);
  }
}

/**
 * Start charge tone - ALWAYS use synth (dynamic pitch based on power)
 * The synth version is better because it changes pitch in real-time
 */
export function startChargeToneHybrid(refs: AudioRefs, settings: AudioSettings): void {
  startChargeTone(refs, settings);
}

/**
 * Update charge tone - ALWAYS use synth (dynamic pitch based on power)
 */
export function updateChargeToneHybrid(refs: AudioRefs, settings: AudioSettings, chargePower01: number): void {
  updateChargeTone(refs, settings, chargePower01);
}

/**
 * Stop charge tone - handles both file and synth
 */
export function stopChargeToneHybrid(refs: AudioRefs): void {
  stopChargeFile(); // Clean up any file-based charge if it was playing
  stopChargeTone(refs);
}

/**
 * Start fly sound - loops while character is in the air
 */
export function startFly(refs: AudioRefs, settings: AudioSettings): void {
  if (areAudioFilesLoaded()) {
    startFlyFile(refs, settings);
  }
  // No synth fallback
}

/**
 * Stop fly sound
 */
export function stopFly(): void {
  stopFlyFile();
}

/**
 * Play slide sound - file only (no synth equivalent before)
 */
export function playSlide(refs: AudioRefs, settings: AudioSettings): void {
  if (areAudioFilesLoaded()) {
    playSlideFile(refs, settings);
  }
  // No synth fallback - slide was not implemented before
}

/**
 * Stop slide sound
 */
export function stopSlide(): void {
  stopSlideFile();
}

/**
 * Play win jingle - uses file if loaded, otherwise synth (zenoJingle)
 */
export function playWin(refs: AudioRefs, settings: AudioSettings): void {
  if (areAudioFilesLoaded()) {
    playWinFile(refs, settings);
  }
  // Fallback is zenoJingle in Game.tsx
}

/**
 * Play record break - uses file if loaded, otherwise synth
 */
export function playRecordBreakHybrid(refs: AudioRefs, settings: AudioSettings): void {
  if (areAudioFilesLoaded()) {
    playRecordBreakFile(refs, settings);
  } else {
    playRecordBreak(refs, settings);
  }
}

/**
 * Play failure sound - uses file if loaded, otherwise synth
 */
export function playFailureSoundHybrid(refs: AudioRefs, settings: AudioSettings, type: 'tumble' | 'dive' | 'splat'): void {
  if (areAudioFilesLoaded()) {
    playFailureFile(refs, settings);
  } else {
    playFailureSound(refs, settings, type);
  }
}

// ============================================
// PRECISION CONTROL SOUNDS (file-based with synth fallback)
// ============================================

/**
 * Air brake tap - short, crisp feedback for single tap mid-air
 */
export function playAirBrakeTap(refs: AudioRefs, settings: AudioSettings) {
  if (settings.muted || settings.volume <= 0) return;
  if (areAudioFilesLoaded()) {
    playTapAirBrakeFile(refs, settings);
  } else {
    playTone(refs, settings, 300, 0.08, 'sine', 0.04);
  }
}

/**
 * Air brake hold - subtle continuous feedback for holding brake mid-air
 */
export function playAirBrakeHold(refs: AudioRefs, settings: AudioSettings) {
  if (settings.muted || settings.volume <= 0) return;
  if (areAudioFilesLoaded()) {
    playLateHoldFile(refs, settings);
  } else {
    playTone(refs, settings, 200, 0.05, 'sine', 0.02);
  }
}

/**
 * Slide extend - tap to push/extend slide on ground
 */
export function playSlideExtend(refs: AudioRefs, settings: AudioSettings) {
  if (settings.muted || settings.volume <= 0) return;
  if (areAudioFilesLoaded()) {
    playTapPushGroundFile(refs, settings);
  } else {
    playTone(refs, settings, 150, 0.06, 'triangle', 0.05);
  }
}

/**
 * Slide brake - hold to brake during slide
 */
export function playSlideBrake(refs: AudioRefs, settings: AudioSettings) {
  if (settings.muted || settings.volume <= 0) return;
  if (areAudioFilesLoaded()) {
    playLateHoldFile(refs, settings);
  } else {
    playTone(refs, settings, 100, 0.04, 'sawtooth', 0.03);
  }
}

/**
 * Stamina low warning - high pitched alert
 */
export function playStaminaLow(refs: AudioRefs, settings: AudioSettings) {
  if (settings.muted || settings.volume <= 0) return;
  playTone(refs, settings, 880, 0.1, 'square', 0.04);
}

/**
 * Action denied - feedback when action fails due to insufficient stamina
 */
export function playActionDenied(refs: AudioRefs, settings: AudioSettings) {
  if (settings.muted || settings.volume <= 0) return;
  playTone(refs, settings, 150, 0.15, 'sawtooth', 0.06);
}

// ============================================
// BACKGROUND AMBIENT SOUND
// ============================================

/**
 * Start background ambient sound (loops continuously)
 */
export function startAmbient(refs: AudioRefs, settings: AudioSettings): void {
  if (areAudioFilesLoaded()) {
    startAmbientFileInternal(refs, settings);
  }
  // No synth fallback for ambient
}

/**
 * Stop background ambient sound
 */
export function stopAmbient(): void {
  stopAmbientFileInternal();
}

/**
 * Update ambient volume when settings change
 */
export function updateAmbient(settings: AudioSettings): void {
  updateAmbientVolumeInternal(settings);
}

// ============================================
// PRECISION BAR SOUNDS
// ============================================

/**
 * Start precision tension drone (loops while in precision zone)
 */
export function startPrecisionDrone(refs: AudioRefs, settings: AudioSettings): void {
  if (areAudioFilesLoaded()) {
    startPrecisionDroneFile(refs, settings);
  }
  // No synth fallback for drone
}

/**
 * Stop precision tension drone
 */
export function stopPrecisionDrone(): void {
  stopPrecisionDroneFile();
}

/**
 * Play PB ding sound
 */
export function playPbDing(refs: AudioRefs, settings: AudioSettings): void {
  if (areAudioFilesLoaded()) {
    playPbDingFile(refs, settings);
  } else {
    // Synth fallback - ascending ding
    playTone(refs, settings, 880, 0.08, 'sine', 0.06);
    setTimeout(() => playTone(refs, settings, 1100, 0.1, 'sine', 0.08), 80);
  }
}

/**
 * Play new record jingle
 */
export function playNewRecord(refs: AudioRefs, settings: AudioSettings): void {
  if (areAudioFilesLoaded()) {
    playNewRecordFile(refs, settings);
  } else {
    // Synth fallback - celebratory arpeggio
    playTone(refs, settings, 523, 0.1, 'sine', 0.06);
    setTimeout(() => playTone(refs, settings, 659, 0.1, 'sine', 0.06), 100);
    setTimeout(() => playTone(refs, settings, 784, 0.1, 'sine', 0.06), 200);
    setTimeout(() => playTone(refs, settings, 1047, 0.15, 'sine', 0.08), 300);
  }
}

/**
 * Play close call sound (survived 419.99+)
 */
export function playCloseCall(refs: AudioRefs, settings: AudioSettings): void {
  if (areAudioFilesLoaded()) {
    playCloseCallFile(refs, settings);
  } else {
    // Synth fallback - dramatic chord
    playTone(refs, settings, 440, 0.15, 'sine', 0.05);
    playTone(refs, settings, 554, 0.15, 'sine', 0.05);
    playTone(refs, settings, 659, 0.15, 'sine', 0.05);
  }
}

// ============================================
// FAIL JUICE SOUNDS
// ============================================

/**
 * Play fail impact sound - dull thud for any fall
 * Provides satisfying feedback even for failures
 */
export function playFailImpact(refs: AudioRefs, settings: AudioSettings): void {
  if (settings.muted || settings.volume <= 0) return;

  // Anti-fatigue: Check cooldown
  if (!canPlaySound('failImpact', SOUND_COOLDOWNS.impact)) return;
  registerSoundPlay('failImpact');

  const ctx = ensureAudioContext(refs);
  const now = ctx.currentTime;

  // Apply session volume decay
  const effectiveVolume = getDecayedVolume(settings.volume);

  // Low frequency thud
  const osc = ctx.createOscillator();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(80, now);
  osc.frequency.exponentialRampToValueAtTime(40, now + 0.15);

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.25 * effectiveVolume, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 0.25);

  // Add a subtle crunch/debris sound
  const noise = ctx.createOscillator();
  noise.type = 'sawtooth';
  noise.frequency.setValueAtTime(100, now);
  noise.frequency.exponentialRampToValueAtTime(30, now + 0.1);

  const noiseGain = ctx.createGain();
  noiseGain.gain.setValueAtTime(0.08 * effectiveVolume, now);
  noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

  noise.connect(noiseGain);
  noiseGain.connect(ctx.destination);

  noise.start(now);
  noise.stop(now + 0.15);
}

// ============================================
// RING COLLECTION SOUNDS
// ============================================

/**
 * Play ring collection sound with stereo positioning
 * Each ring has a different pitch (escalating A major chord)
 * Ring 0: A4 (440Hz) - low
 * Ring 1: C#5 (554Hz) - medium
 * Ring 2: E5 (659Hz) - high + bonus flourish
 *
 * Enhanced with:
 * - Escalating pitch multiplier (1.0x, 1.1x, 1.2x)
 * - Stereo pan based on ring X position
 * - Short coin sound for immediate feedback
 */
export function playRingCollect(refs: AudioRefs, settings: AudioSettings, ringIndex: number, ringX: number = 240): void {
  if (settings.muted || settings.volume <= 0) return;

  // Anti-fatigue: Check cooldown before playing
  if (!canPlaySound('ringCollect', SOUND_COOLDOWNS.ringCollect)) return;
  registerSoundPlay('ringCollect');

  const ctx = ensureAudioContext(refs);
  const now = ctx.currentTime;

  // A major chord frequencies (escalating)
  const frequencies = [440, 554, 659]; // A4, C#5, E5
  const pitchMultiplier = 1 + ringIndex * 0.1; // 1.0, 1.1, 1.2
  // Anti-fatigue: Add random pitch variation (+/- 10%)
  const randomPitch = getRandomPitch(0.1);
  const freq = frequencies[Math.min(ringIndex, 2)] * pitchMultiplier * randomPitch;

  // Anti-fatigue: Apply session volume decay
  const effectiveVolume = getDecayedVolume(settings.volume);

  // Stereo pan based on ring X position (0-480 canvas width, center at 240)
  // Pan range: -1 (left) to +1 (right)
  const pan = Math.max(-1, Math.min(1, (ringX - 240) / 240));

  // === COIN SOUND (immediate feedback) ===
  const coinOsc = ctx.createOscillator();
  coinOsc.type = 'square';
  coinOsc.frequency.setValueAtTime(1200 * randomPitch, now);
  coinOsc.frequency.exponentialRampToValueAtTime(800 * randomPitch, now + 0.05);

  const coinGain = ctx.createGain();
  coinGain.gain.setValueAtTime(0.1 * effectiveVolume, now);
  coinGain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

  // Apply stereo pan to coin sound
  const coinPanner = ctx.createStereoPanner();
  coinPanner.pan.setValueAtTime(pan, now);

  coinOsc.connect(coinGain);
  coinGain.connect(coinPanner);
  coinPanner.connect(ctx.destination);
  coinOsc.start(now);
  coinOsc.stop(now + 0.1);

  // === MAIN CHIME ===
  const osc = ctx.createOscillator();
  osc.type = 'sine';
  osc.frequency.value = freq;

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(0.15 * effectiveVolume, now + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

  // Apply stereo pan to main chime
  const panner = ctx.createStereoPanner();
  panner.pan.setValueAtTime(pan, now);

  osc.connect(gain);
  gain.connect(panner);
  panner.connect(ctx.destination);
  osc.start(now);
  osc.stop(now + 0.35);

  // === SHIMMER OVERTONE ===
  const shimmer = ctx.createOscillator();
  shimmer.type = 'sine';
  shimmer.frequency.value = freq * 2; // Octave above

  const shimmerGain = ctx.createGain();
  shimmerGain.gain.setValueAtTime(0, now);
  shimmerGain.gain.linearRampToValueAtTime(0.06 * effectiveVolume, now + 0.02);
  shimmerGain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

  // Apply stereo pan to shimmer
  const shimmerPanner = ctx.createStereoPanner();
  shimmerPanner.pan.setValueAtTime(pan, now);

  shimmer.connect(shimmerGain);
  shimmerGain.connect(shimmerPanner);
  shimmerPanner.connect(ctx.destination);
  shimmer.start(now);
  shimmer.stop(now + 0.25);

  // === BONUS FLOURISH for completing all 3 rings ===
  if (ringIndex === 2) {
    // Quick ascending arpeggio for 3rd ring
    const flourishNotes = [784, 988, 1175]; // G5, B5, D6
    flourishNotes.forEach((flourishFreq, i) => {
      setTimeout(() => {
        const bonus = ctx.createOscillator();
        bonus.type = 'sine';
        bonus.frequency.value = flourishFreq;

        const bonusGain = ctx.createGain();
        const bonusNow = ctx.currentTime;
        bonusGain.gain.setValueAtTime(0, bonusNow);
        bonusGain.gain.linearRampToValueAtTime(0.10 * effectiveVolume, bonusNow + 0.01);
        bonusGain.gain.exponentialRampToValueAtTime(0.001, bonusNow + 0.15);

        bonus.connect(bonusGain);
        bonusGain.connect(ctx.destination);
        bonus.start(bonusNow);
        bonus.stop(bonusNow + 0.2);
      }, 80 + i * 50);
    });
  }
}

/**
 * Play sound for landing grade
 */
export function playGradeSound(refs: AudioRefs, settings: AudioSettings, grade: 'S' | 'A' | 'B' | 'C' | 'D'): void {
  if (settings.muted || !refs.ctx) return;

  const ctx = refs.ctx;
  const vol = settings.volume;

  switch (grade) {
    case 'S':
      // Fanfare - quick ascending arpeggio
      playGradeFanfare(ctx, vol);
      break;
    case 'A':
      // Success chime (3 notes)
      playTone(refs, settings, 659, 0.15, 'sine', 0.3);
      setTimeout(() => playTone(refs, settings, 784, 0.15, 'sine', 0.3), 100);
      setTimeout(() => playTone(refs, settings, 988, 0.2, 'sine', 0.4), 200);
      break;
    case 'B':
      // Soft ding
      playTone(refs, settings, 523, 0.2, 'sine', 0.25);
      break;
    case 'C':
      // Neutral
      playTone(refs, settings, 392, 0.15, 'triangle', 0.15);
      break;
    case 'D':
      // Womp womp (descending)
      playGradeWomp(ctx, vol);
      break;
  }
}

function playGradeFanfare(ctx: AudioContext, volume: number): void {
  // Quick ascending fanfare: C5, E5, G5, C6
  const notes = [523, 659, 784, 1047];
  const now = ctx.currentTime;

  notes.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const startTime = now + i * 0.1;

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, startTime);

    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(0.35 * volume, startTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.25);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(startTime);
    osc.stop(startTime + 0.3);
  });
}

function playGradeWomp(ctx: AudioContext, volume: number): void {
  const now = ctx.currentTime;

  // First womp
  const osc1 = ctx.createOscillator();
  const gain1 = ctx.createGain();
  osc1.type = 'sine';
  osc1.frequency.setValueAtTime(200, now);

  gain1.gain.setValueAtTime(0.2 * volume, now);
  gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

  osc1.connect(gain1);
  gain1.connect(ctx.destination);
  osc1.start(now);
  osc1.stop(now + 0.35);

  // Second womp (descending)
  const osc2 = ctx.createOscillator();
  const gain2 = ctx.createGain();
  osc2.type = 'sine';
  osc2.frequency.setValueAtTime(180, now + 0.2);
  osc2.frequency.exponentialRampToValueAtTime(80, now + 0.6);

  gain2.gain.setValueAtTime(0.2 * volume, now + 0.2);
  gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

  osc2.connect(gain2);
  gain2.connect(ctx.destination);
  osc2.start(now + 0.2);
  osc2.stop(now + 0.65);
}

/**
 * Sweet spot click - satisfying feedback when entering optimal charge range
 */
export function playSweetSpotClick(refs: AudioRefs, settings: AudioSettings): void {
  if (settings.muted || !refs.ctx) return;

  const ctx = refs.ctx;
  const vol = settings.volume;
  const now = ctx.currentTime;

  // Short, satisfying click
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sine';
  osc.frequency.setValueAtTime(1000, now);

  gain.gain.setValueAtTime(0.2 * vol, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 0.06);
}

/**
 * Streak break sound (sad fizzle)
 * Plays when a hot streak is lost
 */
export function playStreakBreakSound(refs: AudioRefs, settings: AudioSettings): void {
  if (settings.muted || !refs.ctx) return;

  const ctx = refs.ctx;
  const vol = settings.volume;
  const now = ctx.currentTime;

  // Fizzle sound - descending sawtooth
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(200, now);
  osc.frequency.exponentialRampToValueAtTime(50, now + 0.5);

  gain.gain.setValueAtTime(0.15 * vol, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 0.55);
}

// ============================================
// PAGE FLIP TRANSITION SOUNDS
// ============================================

/**
 * Play paper flip/whoosh sound
 */
export function playPaperFlip(
  refs: AudioRefs,
  settings: AudioSettings
): void {
  if (settings.muted || !refs.ctx) return;

  const ctx = ensureAudioContext(refs);
  const now = ctx.currentTime;
  const vol = settings.volume * 0.3;

  // White noise burst for paper texture
  const bufferSize = ctx.sampleRate * 0.25; // 250ms
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);

  for (let i = 0; i < bufferSize; i++) {
    // Shaped noise - starts loud, fades quickly
    const t = i / bufferSize;
    const envelope = Math.pow(1 - t, 2);
    data[i] = (Math.random() * 2 - 1) * envelope;
  }

  const noise = ctx.createBufferSource();
  noise.buffer = buffer;

  // Bandpass filter for paper-like timbre
  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = 2000;
  filter.Q.value = 0.5;

  // Gain envelope
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(vol, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

  noise.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);

  noise.start(now);
  noise.stop(now + 0.25);
}

/**
 * Play soft paper settle tick
 */
export function playPaperSettle(
  refs: AudioRefs,
  settings: AudioSettings
): void {
  if (settings.muted || !refs.ctx) return;

  const ctx = ensureAudioContext(refs);
  const now = ctx.currentTime;
  const vol = settings.volume * 0.15;

  // Short click/tick
  const osc = ctx.createOscillator();
  osc.frequency.value = 800;
  osc.type = 'sine';

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(vol, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 0.05);
}
