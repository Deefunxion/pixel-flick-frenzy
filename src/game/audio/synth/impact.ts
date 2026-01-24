import type { AudioRefs, AudioSettings } from '../types';
import { ensureAudioContext } from '../context';
import { env } from './envelope';
import { playTone } from './tone';

export function playImpact(refs: AudioRefs, settings: AudioSettings, intensity01: number): void {
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

export function playHeartbeat(refs: AudioRefs, settings: AudioSettings, intensity01: number): void {
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
