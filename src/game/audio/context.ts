import type { AudioRefs, AudioState } from './types';

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
export function getAudioState(refs: AudioRefs): AudioState {
  if (!refs.ctx) return 'unavailable';
  return refs.ctx.state as AudioState;
}

// Check if audio is likely blocked by iOS silent mode
// Note: There's no direct API for this, but we can detect if audio is "running" but not producing sound
export function isAudioUnlocked(refs: AudioRefs): boolean {
  return refs.unlocked && refs.ctx?.state === 'running';
}
