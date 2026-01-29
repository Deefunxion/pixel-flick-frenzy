// src/game/audio/celebrations.ts

import type { AudioRefs, AudioSettings } from './types';
import { ensureAudioContext } from './context';

/**
 * 3-star level complete - quick satisfying chime
 */
export function playStarBurst(refs: AudioRefs, settings: AudioSettings): void {
  if (settings.muted || settings.volume <= 0) return;

  const ctx = ensureAudioContext(refs);
  const now = ctx.currentTime;
  const vol = settings.volume * 0.3;

  // Quick ascending arpeggio (C-E-G)
  const notes = [523, 659, 784];
  notes.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = freq;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, now + i * 0.08);
    gain.gain.linearRampToValueAtTime(vol, now + i * 0.08 + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.15);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now + i * 0.08);
    osc.stop(now + i * 0.08 + 0.2);
  });
}

/**
 * World complete - triumphant fanfare
 */
export function playWorldFanfare(refs: AudioRefs, settings: AudioSettings): void {
  if (settings.muted || settings.volume <= 0) return;

  const ctx = ensureAudioContext(refs);
  const now = ctx.currentTime;
  const vol = settings.volume * 0.4;

  // Triumphant chord progression: C major -> G major -> C major (octave up)
  const chords = [
    { notes: [262, 330, 392], time: 0 },      // C major
    { notes: [196, 294, 392], time: 0.3 },    // G major
    { notes: [523, 659, 784], time: 0.6 },    // C major (octave)
  ];

  chords.forEach(chord => {
    chord.notes.forEach(freq => {
      const osc = ctx.createOscillator();
      osc.type = 'triangle';
      osc.frequency.value = freq;

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0, now + chord.time);
      gain.gain.linearRampToValueAtTime(vol / 3, now + chord.time + 0.05);
      gain.gain.setValueAtTime(vol / 3, now + chord.time + 0.2);
      gain.gain.exponentialRampToValueAtTime(0.001, now + chord.time + 0.5);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + chord.time);
      osc.stop(now + chord.time + 0.6);
    });
  });
}

/**
 * Galaxy complete - epic orchestral flourish
 */
export function playGalaxyFanfare(refs: AudioRefs, settings: AudioSettings): void {
  if (settings.muted || settings.volume <= 0) return;

  const ctx = ensureAudioContext(refs);
  const now = ctx.currentTime;
  const vol = settings.volume * 0.5;

  // Epic ascending scale with harmony
  const scale = [262, 294, 330, 349, 392, 440, 494, 523, 587, 659, 784];

  scale.forEach((freq, i) => {
    const osc1 = ctx.createOscillator();
    osc1.type = 'sine';
    osc1.frequency.value = freq;

    // Add fifth harmony
    const osc2 = ctx.createOscillator();
    osc2.type = 'sine';
    osc2.frequency.value = freq * 1.5;

    const gain = ctx.createGain();
    const startTime = now + i * 0.08;
    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(vol * (0.3 + i * 0.07), startTime + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.4);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);
    osc1.start(startTime);
    osc2.start(startTime);
    osc1.stop(startTime + 0.5);
    osc2.stop(startTime + 0.5);
  });

  // Final chord (scheduled after scale completes)
  const finalChordTime = now + scale.length * 0.08;
  const finalNotes = [523, 659, 784, 1047];
  finalNotes.forEach(freq => {
    const osc = ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.value = freq;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, finalChordTime);
    gain.gain.linearRampToValueAtTime(vol, finalChordTime + 0.05);
    gain.gain.setValueAtTime(vol, finalChordTime + 0.3);
    gain.gain.exponentialRampToValueAtTime(0.001, finalChordTime + 1);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(finalChordTime);
    osc.stop(finalChordTime + 1.2);
  });
}

/**
 * Daily challenge rank reveal
 */
export function playRankReveal(refs: AudioRefs, settings: AudioSettings, rank: number): void {
  if (settings.muted || settings.volume <= 0) return;

  const ctx = ensureAudioContext(refs);
  const now = ctx.currentTime;
  const vol = settings.volume * 0.35;

  // Drum roll effect
  for (let i = 0; i < 10; i++) {
    const osc = ctx.createOscillator();
    osc.type = 'square';
    osc.frequency.value = 100 + Math.random() * 50;

    const gain = ctx.createGain();
    const t = now + i * 0.05;
    gain.gain.setValueAtTime(vol * 0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.06);
  }

  // Reveal tone based on rank (scheduled after drum roll)
  const revealTime = now + 0.5;
  const freq = rank <= 3 ? 880 : rank <= 10 ? 660 : 440;
  const osc = ctx.createOscillator();
  osc.type = 'sine';
  osc.frequency.value = freq;

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0, revealTime);
  gain.gain.linearRampToValueAtTime(vol, revealTime + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.001, revealTime + 0.5);

  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(revealTime);
  osc.stop(revealTime + 0.6);
}
