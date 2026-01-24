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

// iOS Safari has 'suspended', 'running', 'closed', and 'interrupted' states
// 'interrupted' happens when user switches apps, phone locks, or call comes in
export type AudioState = 'running' | 'suspended' | 'interrupted' | 'closed' | 'unavailable';
