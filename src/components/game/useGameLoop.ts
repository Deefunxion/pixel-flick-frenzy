import { useRef, useCallback, useEffect } from 'react';
import { W, H } from '@/game/constants';
import { renderFrame } from '@/game/engine/render';
import { createInitialState, resetPhysics } from '@/game/engine/state';
import { updateFrame, type GameAudio, type GameUI } from '@/game/engine/update';
import { renderPageFlip } from '@/game/engine/pageFlipRender';
import type { GameState } from '@/game/engine/types';
import type { Theme } from '@/game/themes';
import { captureError } from '@/lib/sentry';

export type GameLoopConfig = {
  canvasRef: React.RefObject<HTMLCanvasElement>;
  pressedRef: React.MutableRefObject<boolean>;
  themeRef: React.MutableRefObject<Theme>;
  audio: GameAudio;
  ui: GameUI;
  triggerHaptic: (pattern?: number | number[]) => void;
  getDailyStats: () => { date: string; throws: number; landings: number; bestThrow: number };
  reduceFx: boolean;
};

export type UseGameLoopReturn = {
  stateRef: React.MutableRefObject<GameState | null>;
  animFrameRef: React.MutableRefObject<number>;
  errorRef: React.MutableRefObject<string | null>;
  startLoop: (ctx: CanvasRenderingContext2D, config: GameLoopConfig) => () => void;
  initState: (reduceFx: boolean) => GameState;
};

export function useGameLoop(): UseGameLoopReturn {
  const stateRef = useRef<GameState | null>(null);
  const animFrameRef = useRef<number>(0);
  const errorRef = useRef<string | null>(null);

  const initState = useCallback((reduceFx: boolean): GameState => {
    return createInitialState({ reduceFx });
  }, []);

  const startLoop = useCallback((
    ctx: CanvasRenderingContext2D,
    config: GameLoopConfig
  ) => {
    const {
      canvasRef,
      pressedRef,
      themeRef,
      audio,
      ui,
      triggerHaptic,
      getDailyStats,
    } = config;

    const scheduleReset = (ms: number) => {
      setTimeout(() => {
        if (stateRef.current) resetPhysics(stateRef.current);
      }, ms);
    };

    const loop = () => {
      const state = stateRef.current;
      if (state) {
        try {
          const now = performance.now();
          const currentTheme = themeRef.current;
          updateFrame(state, {
            theme: currentTheme,
            nowMs: now,
            pressed: pressedRef.current,
            audio,
            ui,
            triggerHaptic,
            scheduleReset,
            getDailyStats,
            canvas: canvasRef.current!,
          });
          // Pass devicePixelRatio for high-res rendering
          if (!errorRef.current) {
            // Check if page flip transition should consume the frame
            const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
            const pageFlipConsumed = renderPageFlip(
              ctx,
              state,
              currentTheme,
              now,
              dpr,
              () => {
                // Page flip complete callback - reset physics
                resetPhysics(state);
                audio.playPaperSettle?.();
              }
            );

            // Only render normal game frame if page flip didn't consume it
            if (!pageFlipConsumed) {
              renderFrame(ctx, state, currentTheme, now, dpr);
            }
          }
        } catch (err: unknown) {
          const error = err as Error;
          // Derive phase from existing state properties for error context
          const derivedPhase = state.flying ? 'flying' : state.sliding ? 'sliding' : state.charging ? 'charging' : 'idle';
          captureError(error, {
            phase: derivedPhase,
            px: state.px,
            py: state.py,
            flying: state.flying,
          });
          errorRef.current = error.message;
          // Render error to canvas for debugging
          ctx.save();
          ctx.fillStyle = '#000';
          ctx.fillRect(0, 0, W, H);
          ctx.fillStyle = '#f00';
          ctx.font = '16px monospace';
          ctx.fillText('CRASH: ' + error.message.slice(0, 40), 10, 30);
          ctx.fillText(error.message.slice(40, 80), 10, 50);
          ctx.restore();
        }
      }
      animFrameRef.current = requestAnimationFrame(loop);
    };

    animFrameRef.current = requestAnimationFrame(loop);

    // Return cleanup function
    return () => {
      cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  return {
    stateRef,
    animFrameRef,
    errorRef,
    startLoop,
    initState,
  };
}
