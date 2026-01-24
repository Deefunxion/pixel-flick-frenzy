import { useRef, useCallback } from 'react';
import {
  MAX_ANGLE,
  MIN_ANGLE,
  OPTIMAL_ANGLE,
  W,
  H,
} from '@/game/constants';
import {
  unlockAudioForIOS,
  getAudioState,
  startAmbient,
  type AudioRefs,
  type AudioSettings,
  type AudioState,
} from '@/game/audio';
import { bufferInput, isBuffering } from '@/game/engine/inputBuffer';
import type { GameState } from '@/game/engine/types';

export type InputHandlerConfig = {
  stateRef: React.MutableRefObject<GameState | null>;
  audioRefs: React.MutableRefObject<AudioRefs>;
  audioSettingsRef: React.MutableRefObject<AudioSettings>;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  onAudioContextStateChange: (state: AudioState) => void;
  onShowAudioWarning: (show: boolean) => void;
  onHideMobileHint: () => void;
  onMenuOpen: () => void;
  triggerHaptic: (pattern?: number | number[]) => void;
};

export type UseGameInputReturn = {
  pressedRef: React.MutableRefObject<boolean>;
  pointerIdRef: React.MutableRefObject<number | null>;
  pointerStartYRef: React.MutableRefObject<number>;
  angleStartRef: React.MutableRefObject<number>;
  attachInputHandlers: (
    inputPad: HTMLDivElement,
    extraInputPad: HTMLDivElement | null,
    config: InputHandlerConfig
  ) => () => void;
};

export function useGameInput(): UseGameInputReturn {
  const pressedRef = useRef(false);
  const pointerIdRef = useRef<number | null>(null);
  const pointerStartYRef = useRef<number>(0);
  const angleStartRef = useRef<number>(OPTIMAL_ANGLE);

  const attachInputHandlers = useCallback((
    inputPad: HTMLDivElement,
    extraInputPad: HTMLDivElement | null,
    config: InputHandlerConfig
  ) => {
    const {
      stateRef,
      audioRefs,
      audioSettingsRef,
      canvasRef,
      onAudioContextStateChange,
      onShowAudioWarning,
      onHideMobileHint,
      onMenuOpen,
      triggerHaptic,
    } = config;

    // Touch UX flags
    const markTouchActive = (active: boolean) => {
      const s = stateRef.current;
      if (!s) return;
      s.touchActive = active;
      if (active) s.touchFeedback = 1;
    };

    const handleKeyDown = async (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        // Buffer input if we're in slow-mo/freeze
        if (isBuffering()) {
          bufferInput('press');
        }
        pressedRef.current = true;
        // Unlock audio on first gesture (iOS compatible)
        const wasUnlocked = audioRefs.current.unlocked;
        await unlockAudioForIOS(audioRefs.current);
        // Start ambient on first unlock
        if (!wasUnlocked && audioRefs.current.unlocked) {
          startAmbient(audioRefs.current, audioSettingsRef.current);
        }
      }
      if (e.code === 'ArrowUp' || e.code === 'ArrowDown') {
        const s = stateRef.current;
        if (!s) return;
        if (!s.flying && !s.sliding) {
          e.preventDefault();
          const step = e.code === 'ArrowUp' ? 2 : -2;
          s.angle = Math.max(MIN_ANGLE, Math.min(MAX_ANGLE, s.angle + step));
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        // Buffer input if we're in slow-mo/freeze
        if (isBuffering()) {
          bufferInput('release');
        }
        pressedRef.current = false;
      }
    };

    const handlePointerDown = async (e: PointerEvent) => {
      if (e.button !== 0 && e.pointerType !== 'touch') return;
      e.preventDefault();

      // Check if clicking hamburger menu area (circle at 18,18 with radius 20 for touch)
      const canvas = canvasRef.current;
      if (canvas) {
        const rect = canvas.getBoundingClientRect();
        const scaleX = W / rect.width;
        const scaleY = H / rect.height;
        const canvasX = (e.clientX - rect.left) * scaleX;
        const canvasY = (e.clientY - rect.top) * scaleY;

        // Hamburger hit area: circle at (18, 18) with radius 20 (slightly larger for touch)
        const hamburgerX = 18;
        const hamburgerY = 18;
        const hamburgerRadius = 20;
        const dx = canvasX - hamburgerX;
        const dy = canvasY - hamburgerY;
        if (dx * dx + dy * dy < hamburgerRadius * hamburgerRadius) {
          onMenuOpen();
          return; // Don't start charging
        }
      }

      // Buffer input if we're in slow-mo/freeze
      if (isBuffering()) {
        bufferInput('press', { x: e.clientX, y: e.clientY });
      }

      pressedRef.current = true;
      pointerIdRef.current = e.pointerId;
      pointerStartYRef.current = e.clientY;
      const s = stateRef.current;
      if (s) angleStartRef.current = s.angle;

      try {
        inputPad.setPointerCapture(e.pointerId);
      } catch {
        // ignore
      }

      // iOS requires aggressive audio unlock on first touch
      const wasUnlocked = audioRefs.current.unlocked;
      const unlocked = await unlockAudioForIOS(audioRefs.current);
      const state = getAudioState(audioRefs.current);
      onAudioContextStateChange(state);

      // Start ambient on first successful unlock
      if (!wasUnlocked && unlocked) {
        startAmbient(audioRefs.current, audioSettingsRef.current);
      }

      // Show warning on iOS if audio isn't running after unlock attempt
      if (!unlocked && e.pointerType === 'touch' && !audioSettingsRef.current.muted) {
        onShowAudioWarning(true);
      }

      // Hide mobile hint after first touch/click
      onHideMobileHint();

      // Touch UX flags + haptics
      if (e.pointerType === 'touch') {
        markTouchActive(true);
        triggerHaptic(15);
      }
    };

    const handlePointerMove = (e: PointerEvent) => {
      if (pointerIdRef.current == null || e.pointerId !== pointerIdRef.current) return;
      const s = stateRef.current;
      if (!s) return;
      if (!s.charging) return;

      const dy = e.clientY - pointerStartYRef.current;
      // Drag up -> higher angle
      const nextAngle = angleStartRef.current + (-dy * 0.18);
      s.angle = Math.max(MIN_ANGLE, Math.min(MAX_ANGLE, nextAngle));
    };

    const handlePointerUp = (e: PointerEvent) => {
      if (pointerIdRef.current != null && e.pointerId === pointerIdRef.current) {
        pointerIdRef.current = null;
      }

      // Buffer input if we're in slow-mo/freeze
      if (isBuffering()) {
        bufferInput('release');
      }

      pressedRef.current = false;

      markTouchActive(false);
      if (stateRef.current?.charging) {
        triggerHaptic([10, 30, 20]);
      }
    };

    const handlePointerCancel = (e: PointerEvent) => {
      if (pointerIdRef.current != null && e.pointerId === pointerIdRef.current) {
        pointerIdRef.current = null;
      }
      pressedRef.current = false;

      markTouchActive(false);
    };

    // Attach event listeners
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    inputPad.addEventListener('pointerdown', handlePointerDown);
    inputPad.addEventListener('pointermove', handlePointerMove);
    inputPad.addEventListener('pointerup', handlePointerUp);
    inputPad.addEventListener('pointercancel', handlePointerCancel);

    // Extra touch area below stats (for comfortable thumb reach on mobile)
    if (extraInputPad) {
      extraInputPad.addEventListener('pointerdown', handlePointerDown);
      extraInputPad.addEventListener('pointermove', handlePointerMove);
      extraInputPad.addEventListener('pointerup', handlePointerUp);
      extraInputPad.addEventListener('pointercancel', handlePointerCancel);
    }

    // Return cleanup function
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);
      inputPad.removeEventListener('pointerdown', handlePointerDown);
      inputPad.removeEventListener('pointermove', handlePointerMove);
      inputPad.removeEventListener('pointerup', handlePointerUp);
      inputPad.removeEventListener('pointercancel', handlePointerCancel);
      if (extraInputPad) {
        extraInputPad.removeEventListener('pointerdown', handlePointerDown);
        extraInputPad.removeEventListener('pointermove', handlePointerMove);
        extraInputPad.removeEventListener('pointerup', handlePointerUp);
        extraInputPad.removeEventListener('pointercancel', handlePointerCancel);
      }
    };
  }, []);

  return {
    pressedRef,
    pointerIdRef,
    pointerStartYRef,
    angleStartRef,
    attachInputHandlers,
  };
}
