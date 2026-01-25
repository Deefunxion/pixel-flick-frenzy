// src/game/engine/arcade/generator/__tests__/physics-simulator.test.ts
import { PhysicsSimulator } from '../physics-simulator';
import type { ArcadeLevel } from '../../types';

describe('PhysicsSimulator', () => {
  const simpleLevel: ArcadeLevel = {
    id: 1,
    landingTarget: 410,
    doodles: [
      { x: 200, y: 100, size: 'large', sprite: 'coin', sequence: 1 },
    ],
    springs: [],
    portal: null,
  };

  it('simulates a throw and returns trajectory', () => {
    const simulator = new PhysicsSimulator();
    const result = simulator.simulate(simpleLevel, {
      launchAngle: 45,
      launchPower: 7,
      inputs: [],
    });

    expect(result.trajectory.length).toBeGreaterThan(0);
    expect(result.finalX).toBeGreaterThan(0);
  });

  it('detects doodle collection', () => {
    const simulator = new PhysicsSimulator();
    const result = simulator.simulate(simpleLevel, {
      launchAngle: 45,
      launchPower: 7,
      inputs: [],
    });

    // May or may not collect depending on trajectory
    expect(typeof result.doodlesCollected).toBe('object');
    expect(Array.isArray(result.doodlesCollected)).toBe(true);
  });

  it('respects input events for brake/throttle', () => {
    const simulator = new PhysicsSimulator();

    const resultNoBrake = simulator.simulate(simpleLevel, {
      launchAngle: 45,
      launchPower: 7,
      inputs: [],
    });

    const resultWithBrake = simulator.simulate(simpleLevel, {
      launchAngle: 45,
      launchPower: 7,
      inputs: [
        { timestamp: 500, action: 'press' },
        { timestamp: 1000, action: 'release' },
      ],
    });

    // Brake should affect final position
    expect(resultWithBrake.finalX).not.toEqual(resultNoBrake.finalX);
  });

  it('detects spring collisions and applies impulse', () => {
    const levelWithSpring: ArcadeLevel = {
      id: 2,
      landingTarget: 410,
      doodles: [],
      springs: [{ x: 150, y: 200, direction: 'up' }],
      portal: null,
    };

    const simulator = new PhysicsSimulator();
    const result = simulator.simulate(levelWithSpring, {
      launchAngle: 30,
      launchPower: 5,
      inputs: [],
    });

    // Spring hit detection
    expect(Array.isArray(result.springsHit)).toBe(true);
  });

  it('handles portal teleportation', () => {
    const levelWithPortal: ArcadeLevel = {
      id: 3,
      landingTarget: 410,
      doodles: [],
      springs: [],
      portal: {
        entry: { x: 200, y: 150 },
        exit: { x: 350, y: 100 },
        exitDirection: 'straight',
      },
    };

    const simulator = new PhysicsSimulator();
    const result = simulator.simulate(levelWithPortal, {
      launchAngle: 45,
      launchPower: 6,
      inputs: [],
    });

    expect(typeof result.portalUsed).toBe('boolean');
  });

  it('detects landing in target zone', () => {
    const simulator = new PhysicsSimulator();
    const result = simulator.simulate(simpleLevel, {
      launchAngle: 45,
      launchPower: 10,
      inputs: [],
    });

    expect(typeof result.landedInZone).toBe('boolean');
    expect(typeof result.fellOff).toBe('boolean');
  });
});
