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
      holdDurationAtRelease: 0,
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
      setThrowState: () => {},
      setPracticeMode: () => {},
      setDailyTasks: () => {},
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

describe('Zeno Air Control Integration', () => {
  it('registers float tap and costs 5 stamina when pressed during flight', () => {
    const state = createInitialState({ reduceFx: false });
    state.flying = true;
    state.px = 300;
    state.py = 100; // High up
    state.vx = 5;
    state.vy = 2;
    state.stamina = 100;
    // Simulate press: was not pressed, now pressed
    state.precisionInput.lastPressedState = false;
    state.precisionInput.holdDuration = 0;

    // Press = tap detected immediately (press-based detection)
    updateFrame(state, createMockServices(true));

    // Float tap costs 5 stamina (TAP_STAMINA_COST)
    expect(state.stamina).toBe(95);
    // Tap is registered in recentTapTimes
    expect(state.airControl.recentTapTimes.length).toBeGreaterThan(0);
    // Velocity boosted
    expect(state.vx).toBeGreaterThan(5);
  });

  it('applies progressive brake when held past 0.3sec threshold', () => {
    const state = createInitialState({ reduceFx: false });
    state.flying = true;
    state.px = 300;
    state.py = 100;
    state.vx = 5;
    state.vy = 2;
    state.stamina = 100;
    state.precisionInput.lastPressedState = true;
    // Hold for 30 frames (past 18-frame threshold, some ramp time)
    state.precisionInput.holdDuration = 30;

    const initialVx = state.vx;

    // Continued hold = progressive brake
    updateFrame(state, createMockServices(true));

    // Progressive brake: starts gentle (0.98), ramps to strong (0.80)
    // At 30 frames (12 past threshold), ramp = 12/60 = 0.2
    // Expected decel = 0.98 - 0.2*(0.98-0.80) = 0.98 - 0.036 = ~0.944
    // So velocity should be reduced but not dramatically
    expect(state.vx).toBeLessThan(initialVx);
    expect(state.vx).toBeGreaterThan(initialVx * 0.9); // Gentle reduction
    expect(state.airControl.isHoldingBrake).toBe(true);
  });

  it('applies heavy gravity when no input', () => {
    const state = createInitialState({ reduceFx: false });
    state.flying = true;
    state.px = 300;
    state.py = 100;
    state.vx = 5;
    state.vy = 0;
    state.stamina = 100;
    state.precisionInput.lastPressedState = false;
    state.airControl.recentTapTimes = []; // No recent taps

    // No input = heavy gravity (HEAVY_GRAVITY_MULT = 1.2)
    updateFrame(state, createMockServices(false));

    // vy should increase due to gravity
    // Normal gravity ~0.08 * 0.55 (TIME_SCALE) * 1.2 = ~0.053
    expect(state.vy).toBeGreaterThan(0.04);
  });

  it('does not apply air control if landed', () => {
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

describe('Slide Control Integration', () => {
  it('applies slide extend tap when pressed during slide', () => {
    const state = createInitialState({ reduceFx: false });
    state.sliding = true;
    state.px = 300;
    state.vx = 1.0;
    state.stamina = 100;
    state.precisionInput.lastPressedState = false;

    updateFrame(state, createMockServices(true));

    // Extend adds 0.15 velocity (before friction)
    // Final velocity affected by friction: (1.0 + 0.15) * friction
    expect(state.vx).toBeGreaterThan(1.0); // Extended
    expect(state.stamina).toBe(92); // 100 - 8
  });

  it('applies slide brake friction when held during slide', () => {
    const state = createInitialState({ reduceFx: false });
    state.sliding = true;
    state.px = 300;
    state.vx = 2.0;
    state.stamina = 100;
    state.precisionInput.lastPressedState = true;
    state.precisionInput.holdDuration = 5;

    const initialVx = state.vx;
    updateFrame(state, createMockServices(true));

    // FIX 2: With TIME_SCALE = 0.55 and frictionMultiplier = 2.5:
    // Normal friction = 0.92^0.55 ≈ 0.956
    // Brake friction = 0.92^(0.55 * 2.5) = 0.92^1.375 ≈ 0.89
    const timeScale = 0.55;
    const normalFriction = Math.pow(0.92, timeScale);
    const brakeFriction = Math.pow(0.92, timeScale * 2.5);

    // Velocity with brake should be less than with normal friction
    expect(state.vx).toBeLessThan(initialVx * normalFriction);
    expect(state.vx).toBeCloseTo(initialVx * brakeFriction, 1);
  });
});
