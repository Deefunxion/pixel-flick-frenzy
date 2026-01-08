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
};

export function ensureAudioContext(refs: AudioRefs): AudioContext {
  if (!refs.ctx) {
    refs.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return refs.ctx;
}

export async function resumeIfSuspended(refs: AudioRefs) {
  if (!refs.ctx) return;
  if (refs.ctx.state === 'suspended') {
    try {
      await refs.ctx.resume();
    } catch {
      // ignore
    }
  }
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
    try { refs.chargeOsc.stop(); } catch {}
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
    try { refs.edgeOsc.stop(); } catch {}
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
