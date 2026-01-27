// src/game/engine/arcade/generator/prop-placer.ts
import type { StrokePoint, Archetype } from './types';
import type { SpringPlacement, PortalPair, ArcadeLevel } from '../types';
import { PhysicsSimulator } from './physics-simulator';
import { archetypeRequiresProps, getUnusedPropStrategy } from './archetypes';
import { SeededRandom } from './random';

interface PropPlacementResult {
  springs: SpringPlacement[];
  portal: PortalPair | null;
}

/**
 * Place props based on trajectory simulation and archetype requirements
 */
export function placePropsForTrajectory(
  doodlePositions: StrokePoint[],
  archetype: Archetype,
  rng: SeededRandom
): PropPlacementResult {
  const requirements = archetypeRequiresProps(archetype);
  const springs: SpringPlacement[] = [];
  let portal: PortalPair | null = null;

  // For climber/zigzag: place springs at upward transitions
  if (requirements.springs) {
    // Find doodles that go UP in sequence (lower Y than previous)
    for (let i = 1; i < doodlePositions.length; i++) {
      const prev = doodlePositions[i - 1];
      const curr = doodlePositions[i];

      // If current doodle is higher (lower Y) than previous by >30px
      if (prev.y - curr.y > 30) {
        // Place spring below the higher doodle
        springs.push({
          x: curr.x - rng.nextInt(10, 30),
          y: Math.min(190, curr.y + rng.nextInt(40, 60)),
          direction: curr.x > prev.x ? 'up-right' : 'up-left',
          strength: 1.0 + rng.nextFloat(0, 0.5),
        });
      }
    }

    // Ensure at least one spring for climber/zigzag
    if (springs.length === 0 && doodlePositions.length > 0) {
      const midpoint = doodlePositions[Math.floor(doodlePositions.length / 2)];
      springs.push({
        x: midpoint.x,
        y: Math.min(190, midpoint.y + 50),
        direction: 'up',
        strength: 1.2,
      });
    }
  }

  // For perimeter/split: place portal for wrap-around or cluster connection
  if (requirements.portals) {
    if (archetype === 'perimeter') {
      // Wrap from right edge back to left
      portal = {
        entry: { x: 380, y: rng.nextInt(60, 150) },
        exit: { x: 70, y: rng.nextInt(60, 150) },
        exitDirection: 'straight',
        exitSpeed: 0.8,
      };
    } else if (archetype === 'split') {
      // Connect left cluster to right cluster
      const leftDoodles = doodlePositions.filter(p => p.x < 200);
      const rightDoodles = doodlePositions.filter(p => p.x > 250);

      if (leftDoodles.length > 0 && rightDoodles.length > 0) {
        const lastLeft = leftDoodles[leftDoodles.length - 1];
        const firstRight = rightDoodles[0];

        portal = {
          entry: { x: lastLeft.x + 30, y: lastLeft.y },
          exit: { x: firstRight.x - 30, y: firstRight.y },
          exitDirection: 'straight',
          exitSpeed: 0.7,
        };
      }
    }
  }

  return { springs, portal };
}

/**
 * Analyze trajectory to find positions where springs would help
 */
export function findSpringPositions(
  doodlePositions: StrokePoint[],
  rng: SeededRandom
): SpringPlacement[] {
  const springs: SpringPlacement[] = [];

  // Find significant upward transitions
  for (let i = 1; i < doodlePositions.length; i++) {
    const prev = doodlePositions[i - 1];
    const curr = doodlePositions[i];
    const dy = prev.y - curr.y; // Positive = going up

    // Spring needed for upward movement > 25px
    if (dy > 25) {
      const springX = (prev.x + curr.x) / 2;
      const springY = Math.min(200, Math.max(prev.y, curr.y) + 30);

      // Determine direction based on horizontal movement
      const dx = curr.x - prev.x;
      let direction: 'up' | 'up-left' | 'up-right' = 'up';
      if (dx > 20) direction = 'up-right';
      else if (dx < -20) direction = 'up-left';

      springs.push({
        x: Math.round(springX),
        y: Math.round(springY),
        direction,
        strength: 0.8 + (dy / 100) * 0.7, // Stronger for bigger jumps
      });
    }
  }

  return springs;
}

/**
 * Validate and adjust props based on simulation
 */
export function validateAndAdjustProps(
  level: ArcadeLevel,
  archetype: Archetype,
  simulator: PhysicsSimulator
): { adjusted: boolean; removedProps: string[] } {
  const strategy = getUnusedPropStrategy(archetype);
  const result = { adjusted: false, removedProps: [] as string[] };

  // Run simulation to find optimal inputs
  const doodlePositions = level.doodles.map(d => ({ x: d.x, y: d.y }));
  const simResult = simulator.findOptimalInputs(level, doodlePositions, 50);

  if (!simResult) {
    return result; // Can't validate without successful sim
  }

  // Check which springs were used
  const usedSprings = new Set(simResult.result.springsHit);

  for (let i = level.springs.length - 1; i >= 0; i--) {
    if (!usedSprings.has(i)) {
      if (strategy === 'remove') {
        level.springs.splice(i, 1);
        result.removedProps.push(`spring-${i}`);
        result.adjusted = true;
      }
      // 'reposition' strategy: would move doodle, but that's complex
      // For now, keep the prop even if unused for puzzle archetypes
    }
  }

  // Check if portal was used
  if (level.portal && !simResult.result.portalUsed) {
    if (strategy === 'remove') {
      level.portal = null;
      result.removedProps.push('portal');
      result.adjusted = true;
    }
  }

  return result;
}

/**
 * Check if a prop placement would block doodle paths
 */
export function checkPropBlocksDoodles(
  propX: number,
  propY: number,
  propRadius: number,
  doodlePositions: StrokePoint[]
): boolean {
  for (const doodle of doodlePositions) {
    const dx = propX - doodle.x;
    const dy = propY - doodle.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Prop too close to doodle
    if (distance < propRadius + 25) {
      return true;
    }
  }
  return false;
}
