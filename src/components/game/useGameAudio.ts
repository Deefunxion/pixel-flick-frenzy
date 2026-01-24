import { useRef, useState, useEffect, useCallback } from 'react';
import {
  ensureAudioContext,
  playTone,
  resumeIfSuspended,
  unlockAudioForIOS,
  getAudioState,
  startAmbient,
  updateAmbient,
  stopChargeToneHybrid,
  stopEdgeWarning,
  type AudioRefs,
  type AudioSettings,
  type AudioState,
} from '@/game/audio';
import { loadJson, loadNumber, saveJson, saveNumber } from '@/game/storage';

export type UseGameAudioReturn = {
  audioRefs: React.MutableRefObject<AudioRefs>;
  audioSettings: AudioSettings;
  audioSettingsRef: React.MutableRefObject<AudioSettings>;
  audioContextState: AudioState;
  showAudioWarning: boolean;
  setShowAudioWarning: React.Dispatch<React.SetStateAction<boolean>>;
  setAudioSettings: React.Dispatch<React.SetStateAction<AudioSettings>>;
  setAudioContextState: React.Dispatch<React.SetStateAction<AudioState>>;
  handleAudioRetry: () => Promise<void>;
  toggleMute: () => Promise<void>;
  playZenoJingle: () => void;
  cleanupAudio: () => void;
};

export function useGameAudio(): UseGameAudioReturn {
  const audioRefs = useRef<AudioRefs>({
    ctx: null,
    chargeOsc: null,
    chargeGain: null,
    edgeOsc: null,
    edgeGain: null,
    tensionOsc: null,
    tensionGain: null,
    unlocked: false,
    stateChangeHandler: null,
  });

  const [audioSettings, setAudioSettings] = useState<AudioSettings>(() => {
    const muted = loadJson('audio_muted', false, 'omf_audio_muted');
    const volume = loadNumber('audio_volume', 0.9, 'omf_audio_volume');
    return { muted, volume: Math.max(0, Math.min(1, volume)) };
  });
  const audioSettingsRef = useRef(audioSettings);

  const [audioContextState, setAudioContextState] = useState<AudioState>('unavailable');
  const [showAudioWarning, setShowAudioWarning] = useState(false);

  // Persist audio settings
  useEffect(() => {
    saveJson('audio_muted', audioSettings.muted);
    saveNumber('audio_volume', audioSettings.volume);
    audioSettingsRef.current = audioSettings;
    updateAmbient(audioSettings);
  }, [audioSettings]);

  // iOS Audio: Retry handler for blocked audio
  const handleAudioRetry = useCallback(async () => {
    const unlocked = await unlockAudioForIOS(audioRefs.current);
    setAudioContextState(getAudioState(audioRefs.current));
    if (unlocked) {
      setShowAudioWarning(false);
      // Play a test tone to confirm audio is working
      playTone(audioRefs.current, audioSettingsRef.current, 440, 0.1, 'sine', 0.05);
      // Start ambient sound
      startAmbient(audioRefs.current, audioSettingsRef.current);
    }
  }, []);

  // Toggle mute
  const toggleMute = useCallback(async () => {
    ensureAudioContext(audioRefs.current);
    await resumeIfSuspended(audioRefs.current);
    setAudioContextState(getAudioState(audioRefs.current));
    setAudioSettings((s) => ({ ...s, muted: !s.muted }));
  }, []);

  // Phase 4: Zeno level-up arpeggio
  const playZenoJingle = useCallback(() => {
    const settings = audioSettingsRef.current;
    if (settings.muted || settings.volume <= 0) return;
    const ctx = ensureAudioContext(audioRefs.current);
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6

    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = freq;

      const gain = ctx.createGain();
      gain.gain.value = 0;
      gain.gain.setValueAtTime(0, ctx.currentTime + i * 0.08);
      gain.gain.linearRampToValueAtTime(0.08, ctx.currentTime + i * 0.08 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.08 + 0.2);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + i * 0.08);
      osc.stop(ctx.currentTime + i * 0.08 + 0.25);
    });
  }, []);

  // Cleanup function for unmount
  const cleanupAudio = useCallback(() => {
    stopChargeToneHybrid(audioRefs.current);
    stopEdgeWarning(audioRefs.current);
  }, []);

  return {
    audioRefs,
    audioSettings,
    audioSettingsRef,
    audioContextState,
    showAudioWarning,
    setShowAudioWarning,
    setAudioSettings,
    setAudioContextState,
    handleAudioRetry,
    toggleMute,
    playZenoJingle,
    cleanupAudio,
  };
}
