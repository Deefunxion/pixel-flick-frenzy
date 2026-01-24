import type { AudioRefs, AudioSettings } from './types';
import {
  areAudioFilesLoaded,
  playWhooshFile,
  playImpactFile,
  stopChargeFile,
  playRecordBreakFile,
  playFailureFile,
} from '../audioFiles';
import { playWhoosh } from './synth/whoosh';
import { playImpact } from './synth/impact';
import { startChargeTone, updateChargeTone, stopChargeTone } from './synth/tone';
import { playRecordBreak, playFailureSound } from './synth';

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
