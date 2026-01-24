import type { AudioRefs, AudioSettings } from '../types';
import { ensureAudioContext } from '../context';
import { env } from './envelope';

export function playWhoosh(refs: AudioRefs, settings: AudioSettings): void {
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
