import { describe, it, expect } from 'vitest';
import { createInitialState, resetPhysics } from '../state';

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
