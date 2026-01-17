import { describe, it, expect } from 'vitest';
import { createInitialState, resetPhysics } from '../state';
import { updateFrame, type GameServices } from '../update';
import { getTheme } from '@/game/themes';

describe('Stamina State', () => {
  it('initializes with full stamina (100)', () => {
    const state = createInitialState({ reduceFx: false });
    expect(state.stamina).toBe(100);
  });

  it('resets stamina to 100 on resetPhysics', () => {
    const state = createInitialState({ reduceFx: false });
    state.stamina = 25;
    resetPhysics(state);
    expect(state.stamina).toBe(100);
  });
});

describe('Input State for Precision Control', () => {
  it('initializes with input tracking state', () => {
    const state = createInitialState({ reduceFx: false });
    expect(state.precisionInput).toEqual({
      pressedThisFrame: false,
      releasedThisFrame: false,
      holdDuration: 0,
      lastPressedState: false,
    });
  });

  it('resets input state on resetPhysics', () => {
    const state = createInitialState({ reduceFx: false });
    state.precisionInput.holdDuration = 500;
    state.precisionInput.pressedThisFrame = true;
    resetPhysics(state);
    expect(state.precisionInput.holdDuration).toBe(0);
    expect(state.precisionInput.pressedThisFrame).toBe(false);
  });
});

// Mock GameServices for testing
// FIX 3: Include ALL audio functions to prevent crashes
function createMockServices(pressed: boolean): GameServices {
  return {
    theme: getTheme('flipbook'),
    nowMs: 0,
    pressed,
    audio: {
      startCharge: () => {},
      updateCharge: () => {},
      stopCharge: () => {},
      whoosh: () => {},
      impact: () => {},
      edgeWarning: () => {},
      stopEdgeWarning: () => {},
      tone: () => {},
      zenoJingle: () => {},
      heartbeat: () => {},
      recordBreak: () => {},
      failureSound: () => {},
      wilhelmScream: () => {},
      startFly: () => {},
      stopFly: () => {},
      slide: () => {},
      stopSlide: () => {},
      win: () => {},
      // Precision control sounds (Fix 3 - must include these)
      airBrakeTap: () => {},
      airBrakeHold: () => {},
      slideExtend: () => {},
      slideBrake: () => {},
      staminaLow: () => {},
      actionDenied: () => {},
    },
    ui: {
      setFellOff: () => {},
      setLastMultiplier: () => {},
      setPerfectLanding: () => {},
      setTotalScore: () => {},
      setBestScore: () => {},
      setZenoTarget: () => {},
      setZenoLevel: () => {},
      setStats: () => {},
      setAchievements: () => {},
      setNewAchievement: () => {},
      setLastDist: () => {},
      setSessionGoals: () => {},
      setDailyStats: () => {},
      setDailyChallenge: () => {},
      setHotStreak: () => {},
      onNewPersonalBest: async () => {},
      onFall: async () => {},
    },
    triggerHaptic: () => {},
    scheduleReset: () => {},
    getDailyStats: () => ({ date: '2026-01-16', bestDistance: 0, bestScore: 0 }),
  };
}

describe('Input Edge Detection', () => {
  it('detects pressedThisFrame on input start', () => {
    const state = createInitialState({ reduceFx: false });
    state.flying = true;
    state.precisionInput.lastPressedState = false;

    updateFrame(state, createMockServices(true));

    expect(state.precisionInput.pressedThisFrame).toBe(true);
    expect(state.precisionInput.releasedThisFrame).toBe(false);
  });

  it('detects releasedThisFrame on input release', () => {
    const state = createInitialState({ reduceFx: false });
    state.flying = true;
    state.precisionInput.lastPressedState = true;
    state.precisionInput.holdDuration = 10;

    updateFrame(state, createMockServices(false));

    expect(state.precisionInput.pressedThisFrame).toBe(false);
    expect(state.precisionInput.releasedThisFrame).toBe(true);
  });

  it('increments holdDuration while pressed', () => {
    const state = createInitialState({ reduceFx: false });
    state.flying = true;
    state.precisionInput.lastPressedState = true;
    state.precisionInput.holdDuration = 5;

    updateFrame(state, createMockServices(true));

    expect(state.precisionInput.holdDuration).toBe(6);
  });
});

describe('Air Brake Integration', () => {
  it('applies air brake tap when pressed during flight', () => {
    const state = createInitialState({ reduceFx: false });
    state.flying = true;
    state.px = 300;
    state.vx = 5;
    state.vy = -3;
    state.stamina = 100;
    state.precisionInput.lastPressedState = false;

    // First frame with press (tap)
    updateFrame(state, createMockServices(true));

    // Velocity should be reduced by tap (5%), then physics applied
    // Air brake: vx = 5 * 0.95 = 4.75, vy = -3 * 0.95 = -2.85
    // Physics: gravity 0.15 * 0.55 = 0.0825 added to vy, wind affects vx
    // Final vy approx -2.85 + 0.0825 = -2.7675
    expect(state.vx).toBeCloseTo(4.75, 1);
    expect(state.vy).toBeCloseTo(-2.77, 1); // After gravity applied
    expect(state.stamina).toBe(95);
  });

  it('applies air brake hold when held during flight', () => {
    const state = createInitialState({ reduceFx: false });
    state.flying = true;
    state.px = 300;
    state.vx = 5;
    state.vy = -3;
    state.stamina = 100;
    state.precisionInput.lastPressedState = true;
    state.precisionInput.holdDuration = 5;

    // Subsequent frame with continued press (hold)
    updateFrame(state, createMockServices(true));

    // Velocity should be reduced by hold (3%), then physics applied
    // Air brake: vx = 5 * 0.97 = 4.85, vy = -3 * 0.97 = -2.91
    // Physics: gravity 0.15 * 0.55 = 0.0825 added to vy
    // Final vy approx -2.91 + 0.0825 = -2.8275
    expect(state.vx).toBeCloseTo(4.85, 1);
    expect(state.vy).toBeCloseTo(-2.83, 1); // After gravity applied
  });

  it('does not apply air brake if landed', () => {
    const state = createInitialState({ reduceFx: false });
    state.landed = true;
    state.vx = 5;
    state.stamina = 100;
    state.precisionInput.lastPressedState = false;

    updateFrame(state, createMockServices(true));

    expect(state.vx).toBe(5);
    expect(state.stamina).toBe(100);
  });
});
