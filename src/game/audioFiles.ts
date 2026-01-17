// src/game/audioFiles.ts
// Audio file management for game sounds
// Note: This module is independent to avoid circular dependencies with audio.ts

// Audio file paths (custom sounds from Dee + Kenney.nl CC0)
const AUDIO_BASE_PATH = '/assets/audio/game';

export const AUDIO_FILES = {
  charge: `${AUDIO_BASE_PATH}/charge.wav`,       // Custom - rising charge (2s)
  whoosh: `${AUDIO_BASE_PATH}/whoosh.wav`,       // Custom - launch sound (0.5s)
  fly: `${AUDIO_BASE_PATH}/fly.wav`,             // Custom - flying through air (1.5s)
  impactSoft: `${AUDIO_BASE_PATH}/impact-soft.wav`,  // Custom - soft landing (0.3s)
  impactHard: `${AUDIO_BASE_PATH}/impact-hard.wav`,  // Custom - hard landing (0.5s)
  slide: `${AUDIO_BASE_PATH}/slide.wav`,         // Custom - sliding friction (1s)
  win: `${AUDIO_BASE_PATH}/win.ogg`,             // Kenney - threeTone1 triumphant
  recordBreak: `${AUDIO_BASE_PATH}/record-break.ogg`, // Kenney - zapThreeToneUp ascending
  failure: `${AUDIO_BASE_PATH}/failure.ogg`,     // Kenney - phaserDown2 descending
  // Precision control sounds
  tapAirBrake: `${AUDIO_BASE_PATH}/tap_air_brake.wav`,     // Tap to brake mid-air
  tapPushGround: `${AUDIO_BASE_PATH}/tap_push_ground.wav`, // Tap to push/slide on ground
  tapPushGround2: `${AUDIO_BASE_PATH}/tap_push_ground2.wav`, // Alternate push sound
  lateHold: `${AUDIO_BASE_PATH}/late_hold.wav`,            // Hold brake (air/ground)
  lateHold2: `${AUDIO_BASE_PATH}/late_hold2.wav`,          // Alternate hold sound
  backgroundAmbient: `${AUDIO_BASE_PATH}/background-ambient.wav`, // Background ambient loop
} as const;

export type AudioFileName = keyof typeof AUDIO_FILES;

// Local type definitions to avoid circular imports
type AudioRefsLike = {
  ctx: AudioContext | null;
};

type AudioSettingsLike = {
  muted: boolean;
  volume: number;
};

// Cached audio buffers
const audioBuffers: Map<AudioFileName, AudioBuffer> = new Map();

// Track if audio files are loaded
let filesLoaded = false;
let loadingPromise: Promise<void> | null = null;

// Active audio sources for stopping
let chargeSource: AudioBufferSourceNode | null = null;
let chargeGainNode: GainNode | null = null;
let slideSource: AudioBufferSourceNode | null = null;
let flySource: AudioBufferSourceNode | null = null;
let flyGainNode: GainNode | null = null;

/**
 * Get or create AudioContext
 */
function getContext(refs: AudioRefsLike): AudioContext {
  if (!refs.ctx) {
    refs.ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
  }
  return refs.ctx;
}

/**
 * Load all audio files into memory
 */
export async function loadAudioFiles(refs: AudioRefsLike): Promise<boolean> {
  if (filesLoaded) return true;
  if (loadingPromise) {
    await loadingPromise;
    return filesLoaded;
  }

  loadingPromise = (async () => {
    try {
      const ctx = getContext(refs);

      const loadPromises = Object.entries(AUDIO_FILES).map(async ([name, path]) => {
        try {
          const response = await fetch(path);
          if (!response.ok) {
            console.warn(`Failed to load audio file: ${path}`);
            return;
          }
          const arrayBuffer = await response.arrayBuffer();
          const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
          audioBuffers.set(name as AudioFileName, audioBuffer);
        } catch (err) {
          console.warn(`Error loading audio file ${path}:`, err);
        }
      });

      await Promise.all(loadPromises);
      filesLoaded = audioBuffers.size > 0;
      console.log(`[AudioFiles] Loaded ${audioBuffers.size}/${Object.keys(AUDIO_FILES).length} audio files`);
    } catch (err) {
      console.error('[AudioFiles] Failed to load audio files:', err);
      filesLoaded = false;
    }
  })();

  await loadingPromise;
  return filesLoaded;
}

/**
 * Check if audio files are loaded
 */
export function areAudioFilesLoaded(): boolean {
  return filesLoaded;
}

/**
 * Play an audio buffer with volume control
 */
function playBuffer(
  refs: AudioRefsLike,
  settings: AudioSettingsLike,
  buffer: AudioBuffer,
  volume: number = 1,
  loop: boolean = false,
  playbackRate: number = 1
): AudioBufferSourceNode | null {
  if (settings.muted || settings.volume <= 0) return null;
  if (!buffer) return null;

  try {
    const ctx = getContext(refs);
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = loop;
    source.playbackRate.value = playbackRate;

    const gainNode = ctx.createGain();
    gainNode.gain.value = volume * settings.volume;

    source.connect(gainNode);
    gainNode.connect(ctx.destination);
    source.start(0);

    return source;
  } catch (err) {
    console.warn('[AudioFiles] Error playing buffer:', err);
    return null;
  }
}

/**
 * Play whoosh sound (launch)
 */
export function playWhooshFile(refs: AudioRefsLike, settings: AudioSettingsLike): void {
  const buffer = audioBuffers.get('whoosh');
  if (buffer) {
    playBuffer(refs, settings, buffer, 0.6, false, 1.2); // Slightly faster for snappiness
  }
}

/**
 * Play impact sound based on intensity
 */
export function playImpactFile(refs: AudioRefsLike, settings: AudioSettingsLike, intensity01: number): void {
  // Use soft or hard impact based on intensity
  const bufferName: AudioFileName = intensity01 > 0.5 ? 'impactHard' : 'impactSoft';
  const buffer = audioBuffers.get(bufferName);
  if (buffer) {
    const volume = 0.4 + intensity01 * 0.4; // 0.4 to 0.8
    playBuffer(refs, settings, buffer, volume);
  }
}

/**
 * Start charge sound (loops and changes with power)
 */
export function startChargeFile(refs: AudioRefsLike, settings: AudioSettingsLike): void {
  stopChargeFile();

  const buffer = audioBuffers.get('charge');
  if (!buffer || settings.muted || settings.volume <= 0) return;

  try {
    const ctx = getContext(refs);
    chargeSource = ctx.createBufferSource();
    chargeSource.buffer = buffer;
    chargeSource.loop = false; // Don't loop - let it play through (it's a rising sound)

    chargeGainNode = ctx.createGain();
    chargeGainNode.gain.value = 0.5 * settings.volume;

    chargeSource.connect(chargeGainNode);
    chargeGainNode.connect(ctx.destination);
    chargeSource.start(0);

    // Clean up when done
    chargeSource.onended = () => {
      chargeSource = null;
      chargeGainNode = null;
    };
  } catch (err) {
    console.warn('[AudioFiles] Error starting charge sound:', err);
  }
}

/**
 * Update charge sound based on power level
 */
export function updateChargeFile(refs: AudioRefsLike, settings: AudioSettingsLike, chargePower01: number): void {
  if (chargeGainNode && refs.ctx) {
    // Increase volume as power increases
    chargeGainNode.gain.value = (0.3 + chargePower01 * 0.5) * settings.volume;
  }
}

/**
 * Stop charge sound
 */
export function stopChargeFile(): void {
  if (chargeSource) {
    try {
      chargeSource.stop();
    } catch {
      // Already stopped
    }
    chargeSource = null;
  }
  chargeGainNode = null;
}

/**
 * Start fly sound (loops while flying)
 */
export function startFlyFile(refs: AudioRefsLike, settings: AudioSettingsLike): void {
  stopFlyFile();

  const buffer = audioBuffers.get('fly');
  if (!buffer || settings.muted || settings.volume <= 0) return;

  try {
    const ctx = getContext(refs);
    flySource = ctx.createBufferSource();
    flySource.buffer = buffer;
    flySource.loop = true; // Loop while flying

    flyGainNode = ctx.createGain();
    flyGainNode.gain.value = 0.4 * settings.volume;

    flySource.connect(flyGainNode);
    flyGainNode.connect(ctx.destination);
    flySource.start(0);

    flySource.onended = () => {
      flySource = null;
      flyGainNode = null;
    };
  } catch (err) {
    console.warn('[AudioFiles] Error starting fly sound:', err);
  }
}

/**
 * Stop fly sound
 */
export function stopFlyFile(): void {
  if (flySource) {
    try {
      flySource.stop();
    } catch {
      // Already stopped
    }
    flySource = null;
  }
  flyGainNode = null;
}

/**
 * Play slide sound
 */
export function playSlideFile(refs: AudioRefsLike, settings: AudioSettingsLike): void {
  // Stop any existing slide sound
  if (slideSource) {
    try {
      slideSource.stop();
    } catch {
      // Already stopped
    }
  }

  const buffer = audioBuffers.get('slide');
  if (buffer) {
    slideSource = playBuffer(refs, settings, buffer, 0.5);
    if (slideSource) {
      slideSource.onended = () => {
        slideSource = null;
      };
    }
  }
}

/**
 * Stop slide sound
 */
export function stopSlideFile(): void {
  if (slideSource) {
    try {
      slideSource.stop();
    } catch {
      // Already stopped
    }
    slideSource = null;
  }
}

/**
 * Play win jingle
 */
export function playWinFile(refs: AudioRefsLike, settings: AudioSettingsLike): void {
  const buffer = audioBuffers.get('win');
  if (buffer) {
    playBuffer(refs, settings, buffer, 0.7);
  }
}

/**
 * Play record break sound
 */
export function playRecordBreakFile(refs: AudioRefsLike, settings: AudioSettingsLike): void {
  const buffer = audioBuffers.get('recordBreak');
  if (buffer) {
    playBuffer(refs, settings, buffer, 0.8);
  }
}

/**
 * Play failure sound
 */
export function playFailureFile(refs: AudioRefsLike, settings: AudioSettingsLike): void {
  const buffer = audioBuffers.get('failure');
  if (buffer) {
    playBuffer(refs, settings, buffer, 0.6);
  }
}

// ============================================
// PRECISION CONTROL SOUNDS (file-based)
// ============================================

/**
 * Play air brake tap sound - short crisp feedback for tapping mid-air
 */
export function playTapAirBrakeFile(refs: AudioRefsLike, settings: AudioSettingsLike): void {
  const buffer = audioBuffers.get('tapAirBrake');
  if (buffer) {
    playBuffer(refs, settings, buffer, 0.5);
  }
}

/**
 * Play slide push tap sound - for tapping to extend slide on ground
 */
export function playTapPushGroundFile(refs: AudioRefsLike, settings: AudioSettingsLike): void {
  const buffer = audioBuffers.get('tapPushGround2');
  if (buffer) {
    playBuffer(refs, settings, buffer, 0.5);
  }
}

/**
 * Play hold brake sound - for holding to brake (air or ground)
 */
export function playLateHoldFile(refs: AudioRefsLike, settings: AudioSettingsLike): void {
  const buffer = audioBuffers.get('lateHold');
  if (buffer) {
    playBuffer(refs, settings, buffer, 0.4);
  }
}

// Background ambient sound management
let ambientSource: AudioBufferSourceNode | null = null;
let ambientGainNode: GainNode | null = null;

/**
 * Start background ambient sound (loops continuously)
 */
export function startAmbientFile(refs: AudioRefsLike, settings: AudioSettingsLike): void {
  stopAmbientFile();

  const buffer = audioBuffers.get('backgroundAmbient');
  if (!buffer || settings.muted || settings.volume <= 0) return;

  try {
    const ctx = getContext(refs);
    ambientSource = ctx.createBufferSource();
    ambientSource.buffer = buffer;
    ambientSource.loop = true;

    ambientGainNode = ctx.createGain();
    ambientGainNode.gain.value = 0.15 * settings.volume; // Low background volume

    ambientSource.connect(ambientGainNode);
    ambientGainNode.connect(ctx.destination);
    ambientSource.start(0);

    ambientSource.onended = () => {
      ambientSource = null;
      ambientGainNode = null;
    };
  } catch (err) {
    console.warn('[AudioFiles] Error starting ambient sound:', err);
  }
}

/**
 * Stop background ambient sound
 */
export function stopAmbientFile(): void {
  if (ambientSource) {
    try {
      ambientSource.stop();
    } catch {
      // Already stopped
    }
    ambientSource = null;
  }
  ambientGainNode = null;
}

/**
 * Update ambient volume based on settings
 */
export function updateAmbientVolume(settings: AudioSettingsLike): void {
  if (ambientGainNode) {
    ambientGainNode.gain.value = settings.muted ? 0 : 0.15 * settings.volume;
  }
}
