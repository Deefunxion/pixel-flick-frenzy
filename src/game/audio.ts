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
} from './audioFiles';

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
