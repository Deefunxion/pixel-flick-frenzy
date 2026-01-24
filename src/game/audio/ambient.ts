import type { AudioRefs, AudioSettings } from './types';
import {
  areAudioFilesLoaded,
  startAmbientFile as startAmbientFileInternal,
  stopAmbientFile as stopAmbientFileInternal,
  updateAmbientVolume as updateAmbientVolumeInternal,
  startPrecisionDroneFile,
  stopPrecisionDroneFile,
} from '../audioFiles';

/**
 * Start background ambient sound (loops continuously)
 */
export function startAmbient(refs: AudioRefs, settings: AudioSettings): void {
  if (areAudioFilesLoaded()) {
    startAmbientFileInternal(refs, settings);
  }
  // No synth fallback for ambient
}

/**
 * Stop background ambient sound
 */
export function stopAmbient(): void {
  stopAmbientFileInternal();
}

/**
 * Update ambient volume when settings change
 */
export function updateAmbient(settings: AudioSettings): void {
  updateAmbientVolumeInternal(settings);
}

/**
 * Start precision tension drone (loops while in precision zone)
 */
export function startPrecisionDrone(refs: AudioRefs, settings: AudioSettings): void {
  if (areAudioFilesLoaded()) {
    startPrecisionDroneFile(refs, settings);
  }
  // No synth fallback for drone
}

/**
 * Stop precision tension drone
 */
export function stopPrecisionDrone(): void {
  stopPrecisionDroneFile();
}
