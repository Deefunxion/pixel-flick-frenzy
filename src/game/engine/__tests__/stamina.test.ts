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

describe('Air Throttle/Brake Integration (Bomb Jack-like controls)', () => {
  it('applies air brake (velocity reduction) when tapped during flight', () => {
    const state = createInitialState({ reduceFx: false });
    state.flying = true;
    state.px = 300;
    state.vx = 5;
    state.vy = 2; // Falling
    state.stamina = 100;
    // Simulate tap: was pressed, now released with short hold duration
    state.precisionInput.lastPressedState = true;
    state.precisionInput.holdDuration = 2; // Short hold = tap
    state.precisionInput.holdDurationAtRelease = 2;

    const initialVx = state.vx;
    const initialVy = state.vy;

    // Release = tap detected
    updateFrame(state, createMockServices(false));

    // Air brake tap: vx and vy reduced by 5%
    expect(state.vx).toBeLessThan(initialVx); // Should have decreased
    expect(state.stamina).toBe(95); // Cost 5 stamina
  });

  it('applies air float (reduced gravity) when held during flight', () => {
    const state = createInitialState({ reduceFx: false });
    state.flying = true;
    state.px = 300;
    state.py = 100; // High up in the air (not at ground level H-20)
    state.vx = 5;
    state.vy = 0.5; // Slight descent
    state.stamina = 100;
    state.precisionInput.lastPressedState = true;
    state.precisionInput.holdDuration = 5; // Past grace period

    const initialVy = state.vy;

    // Continued hold = float (TRUE Bomb Jack: slows descent, doesn't add height)
    updateFrame(state, createMockServices(true));

    // Float reduces gravity to 30%, so vy increases slowly (still falling, just slower)
    // Normal gravity would add ~0.08, float adds ~0.025
    // vy should be > initialVy (still falling) but not by much
    expect(state.vy).toBeGreaterThan(initialVy); // Still falling (gravity still applies)
    expect(state.vy).toBeLessThan(initialVy + 0.05); // But much slower due to float
    expect(state.airControl.throttleActive).toBe(true);
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
