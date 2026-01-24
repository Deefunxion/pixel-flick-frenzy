import type { AudioRefs, AudioSettings } from './types';
import { ensureAudioContext } from './context';
import { playTone } from './synth/tone';
import {
  areAudioFilesLoaded,
  startFlyFile,
  stopFlyFile,
  playSlideFile,
  stopSlideFile,
  playWinFile,
  playTapAirBrakeFile,
  playTapPushGroundFile,
  playLateHoldFile,
  playPbDingFile,
  playNewRecordFile,
  playCloseCallFile,
} from '../audioFiles';
import {
  canPlaySound,
  registerSoundPlay,
  getRandomPitch,
  getDecayedVolume,
  SOUND_COOLDOWNS,
} from '../engine/audioPool';

// ============================================
// FLY & SLIDE
// ============================================

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

// ============================================
// PRECISION CONTROL SOUNDS
// ============================================

/**
 * Air brake tap - short, crisp feedback for single tap mid-air
 */
export function playAirBrakeTap(refs: AudioRefs, settings: AudioSettings): void {
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
export function playAirBrakeHold(refs: AudioRefs, settings: AudioSettings): void {
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
export function playSlideExtend(refs: AudioRefs, settings: AudioSettings): void {
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
export function playSlideBrake(refs: AudioRefs, settings: AudioSettings): void {
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
export function playStaminaLow(refs: AudioRefs, settings: AudioSettings): void {
  if (settings.muted || settings.volume <= 0) return;
  playTone(refs, settings, 880, 0.1, 'square', 0.04);
}

/**
 * Action denied - feedback when action fails due to insufficient stamina
 */
export function playActionDenied(refs: AudioRefs, settings: AudioSettings): void {
  if (settings.muted || settings.volume <= 0) return;
  playTone(refs, settings, 150, 0.15, 'sawtooth', 0.06);
}

// ============================================
// PRECISION BAR SOUNDS
// ============================================

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

// ============================================
// PAGE FLIP TRANSITION SOUNDS
// ============================================

/**
 * Play paper flip/whoosh sound
 */
export function playPaperFlip(refs: AudioRefs, settings: AudioSettings): void {
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
export function playPaperSettle(refs: AudioRefs, settings: AudioSettings): void {
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
