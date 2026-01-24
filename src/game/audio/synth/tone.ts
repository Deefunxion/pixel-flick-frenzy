import type { AudioRefs, AudioSettings } from '../types';
import { ensureAudioContext } from '../context';
import { env } from './envelope';

export function playTone(
  refs: AudioRefs,
  settings: AudioSettings,
  freq: number,
  duration: number,
  type: OscillatorType = 'square',
  volume = 0.1
): void {
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

// ============================================
// CHARGE TONE
// ============================================

export function stopChargeTone(refs: AudioRefs): void {
  if (refs.chargeOsc) {
    try { refs.chargeOsc.stop(); } catch { /* oscillator already stopped */ }
    refs.chargeOsc = null;
  }
  refs.chargeGain = null;
}

export function startChargeTone(refs: AudioRefs, settings: AudioSettings): void {
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

export function updateChargeTone(refs: AudioRefs, settings: AudioSettings, chargePower01: number): void {
  if (settings.muted || settings.volume <= 0) return;
  if (!refs.chargeOsc || !refs.chargeGain || !refs.ctx) return;

  refs.chargeOsc.frequency.value = 220 + chargePower01 * 660;
  refs.chargeGain.gain.value = (0.02 + chargePower01 * 0.05) * settings.volume;
}

// ============================================
// TENSION DRONE
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

// ============================================
// EDGE WARNING
// ============================================

export function stopEdgeWarning(refs: AudioRefs): void {
  if (refs.edgeOsc) {
    try { refs.edgeOsc.stop(); } catch { /* oscillator already stopped */ }
    refs.edgeOsc = null;
  }
  refs.edgeGain = null;
}

export function updateEdgeWarning(refs: AudioRefs, settings: AudioSettings, proximity01: number): void {
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
