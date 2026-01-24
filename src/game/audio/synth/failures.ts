import type { AudioRefs, AudioSettings } from '../types';
import { ensureAudioContext } from '../context';

export function playFailureSound(refs: AudioRefs, settings: AudioSettings, type: 'tumble' | 'dive' | 'splat'): void {
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
export function playWilhelmScream(refs: AudioRefs, settings: AudioSettings): void {
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
