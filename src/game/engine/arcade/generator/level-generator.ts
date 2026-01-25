// src/game/engine/arcade/generator/level-generator.ts
import type { ArcadeLevel, DoodlePlacement, SpringPlacement, PortalPair } from '../types';
import type { GenerationResult, CharacterData, GhostInput } from './types';
import { SeededRandom } from './random';
import { StrokeTransformer } from './transform';
import { PhysicsSimulator } from './physics-simulator';
import { loadStrokeDatabase, getCharactersByStrokeCount, getStrokeRangeForLevel, getCharacterDatabase } from './stroke-data';

// Landing target progression
function getLandingTarget(level: number): number {
  if (level <= 100) return 410;
  if (level <= 110) return 411;
  if (level <= 120) return 412;
  if (level <= 130) return 413;
  if (level <= 140) return 414;
  if (level <= 150) return 415;
  if (level <= 160) return 416;
  if (level <= 170) return 417;
  if (level <= 180) return 418;
  if (level <= 200) return 419;
  // 200+ gets into decimal precision
  if (level <= 210) return 419.1;
  if (level <= 220) return 419.2;
  if (level <= 230) return 419.3;
  if (level <= 240) return 419.4;
  return 419.5;
}

// Doodle count for level
function getDoodleCount(level: number): number {
  if (level <= 10) return level;
  if (level <= 20) return 10 + Math.floor((level - 10) / 2);
  return Math.min(25, 15 + Math.floor((level - 20) / 10));
}

// Should use springs/portals?
function shouldUseProps(level: number): { springs: boolean; portals: boolean } {
  return {
    springs: level >= 11,
    portals: level >= 21,
  };
}

export class LevelGenerator {
  private simulator: PhysicsSimulator;
  private initialized = false;

  constructor() {
    this.simulator = new PhysicsSimulator();
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;
    // Only try to load if database is empty
    if (getCharacterDatabase().length === 0) {
      try {
        await loadStrokeDatabase();
      } catch {
        // Database may have been set directly for testing
      }
    }
    this.initialized = true;
  }

  async generateLevel(levelId: number, seed: string): Promise<GenerationResult> {
    if (!this.initialized) {
      await this.initialize();
    }

    const rng = new SeededRandom(`${seed}-${levelId}`);
    const strokeRange = getStrokeRangeForLevel(levelId);
    let candidates = getCharactersByStrokeCount(strokeRange.min, strokeRange.max);

    // Fallback: if no candidates in range, use all available characters
    if (candidates.length === 0) {
      candidates = getCharacterDatabase();
    }

    if (candidates.length === 0) {
      return {
        success: false,
        error: `No characters found with ${strokeRange.min}-${strokeRange.max} strokes`,
        attempts: 0,
      };
    }

    const maxAttempts = 5;
    let attempts = 0;

    while (attempts < maxAttempts) {
      attempts++;

      // Pick random character
      const character = rng.pick(candidates);

      // Try to generate level from this character
      const result = this.generateFromCharacter(levelId, character, rng.derive(attempts));

      if (result.success) {
        return { ...result, attempts };
      }

      // Try prop adjustments if we have a level
      if (result.level) {
        const adjustedResult = this.tryPropAdjustments(result.level, rng.derive(`adj-${attempts}`));
        if (adjustedResult.success) {
          return { ...adjustedResult, attempts };
        }
      }
    }

    // Return last attempt even if not fully successful
    const character = rng.pick(candidates);
    const finalResult = this.generateFromCharacter(levelId, character, rng.derive('final'));

    return {
      ...finalResult,
      success: finalResult.level !== undefined, // Consider it success if we have a level
      attempts,
    };
  }

  private generateFromCharacter(
    levelId: number,
    character: CharacterData,
    rng: SeededRandom
  ): GenerationResult {
    const transformer = new StrokeTransformer({
      rotation: rng.pick([0, 90, 180, 270] as const),
      flipHorizontal: rng.next() > 0.5,
    });

    const doodlePositions = transformer.extractDoodlePositions(character);
    const targetDoodleCount = getDoodleCount(levelId);

    // Adjust doodle count
    let positions = [...doodlePositions];
    if (positions.length < targetDoodleCount) {
      // Interpolate additional points
      positions = this.interpolatePositions(positions, targetDoodleCount, rng);
    } else if (positions.length > targetDoodleCount) {
      // Take subset
      positions = rng.shuffle([...positions]).slice(0, targetDoodleCount);
    }

    // Sort positions by x for sequence (left to right traversal)
    positions.sort((a, b) => a.x - b.x);

    // Create doodles
    const doodles: DoodlePlacement[] = positions.map((pos, i) => ({
      x: pos.x,
      y: pos.y,
      size: rng.next() > 0.5 ? 'large' : 'small',
      sprite: rng.next() > 0.7 ? 'star' : 'coin',
      sequence: i + 1,
    }));

    // Create level
    const level: ArcadeLevel = {
      id: levelId,
      landingTarget: getLandingTarget(levelId),
      doodles,
      springs: [],
      portal: null,
    };

    // Add props if needed
    const props = shouldUseProps(levelId);
    if (props.springs) {
      level.springs = this.generateSprings(positions, rng);
    }
    if (props.portals) {
      level.portal = this.generatePortal(rng);
    }

    // Validate with physics
    const validationResult = this.simulator.findOptimalInputs(level, positions, 50);

    if (validationResult) {
      return {
        success: true,
        level,
        ghostReplay: validationResult.config.inputs,
        attempts: 1,
      };
    }

    return {
      success: false,
      level,
      error: 'Physics validation failed',
      attempts: 1,
    };
  }

  private interpolatePositions(
    positions: { x: number; y: number }[],
    target: number,
    rng: SeededRandom
  ): { x: number; y: number }[] {
    const result = [...positions];

    // If we have no positions, create some random ones
    if (result.length === 0) {
      for (let i = 0; i < target; i++) {
        result.push({
          x: rng.nextInt(60, 380),
          y: rng.nextInt(40, 180),
        });
      }
      return result;
    }

    while (result.length < target) {
      if (result.length === 1) {
        // Add points around the single point
        const p = result[0];
        result.push({
          x: Math.round(p.x + rng.nextFloat(-50, 50)),
          y: Math.round(p.y + rng.nextFloat(-30, 30)),
        });
      } else {
        // Pick two adjacent points and add midpoint with jitter
        const idx = rng.nextInt(0, result.length - 2);
        const p1 = result[idx];
        const p2 = result[idx + 1];

        const midX = (p1.x + p2.x) / 2 + rng.nextFloat(-10, 10);
        const midY = (p1.y + p2.y) / 2 + rng.nextFloat(-10, 10);

        // Clamp to valid game area
        const clampedX = Math.max(45, Math.min(390, midX));
        const clampedY = Math.max(30, Math.min(200, midY));

        result.splice(idx + 1, 0, { x: Math.round(clampedX), y: Math.round(clampedY) });
      }
    }

    return result;
  }

  private generateSprings(
    doodlePositions: { x: number; y: number }[],
    rng: SeededRandom
  ): SpringPlacement[] {
    const springs: SpringPlacement[] = [];
    const springCount = rng.nextInt(1, 3);

    for (let i = 0; i < springCount; i++) {
      let x: number, y: number;

      if (doodlePositions.length > 0) {
        // Place springs near doodles that might need trajectory help
        const pos = rng.pick(doodlePositions);
        x = pos.x + rng.nextInt(-30, 30);
        y = Math.min(200, pos.y + rng.nextInt(20, 50)); // Below doodle
      } else {
        // Random position
        x = rng.nextInt(100, 350);
        y = rng.nextInt(150, 200);
      }

      springs.push({
        x,
        y,
        direction: rng.pick(['up', 'up-right', 'up-left'] as const),
        strength: rng.nextFloat(0.8, 1.5),
      });
    }

    return springs;
  }

  private generatePortal(rng: SeededRandom): PortalPair | null {
    if (rng.next() > 0.6) return null; // 40% chance of portal

    // Entry near end of level, exit near start
    const entryX = rng.nextInt(300, 390);
    const entryY = rng.nextInt(80, 160);
    const exitX = rng.nextInt(50, 120);
    const exitY = rng.nextInt(30, 80);

    return {
      entry: { x: entryX, y: entryY },
      exit: { x: exitX, y: exitY },
      exitDirection: rng.pick(['straight', 'up-45'] as const),
      exitSpeed: rng.nextFloat(0.6, 1.2),
    };
  }

  private tryPropAdjustments(level: ArcadeLevel, rng: SeededRandom): GenerationResult {
    // Try adding/adjusting springs
    const adjustedLevel = { ...level, springs: [...level.springs] };

    // Add a helper spring
    const newSpring: SpringPlacement = {
      x: rng.nextInt(150, 300),
      y: rng.nextInt(160, 200),
      direction: 'up',
      strength: rng.nextFloat(1.0, 1.5),
    };
    adjustedLevel.springs = [...level.springs, newSpring];

    const result = this.simulator.findOptimalInputs(adjustedLevel, [], 30);

    if (result) {
      return {
        success: true,
        level: adjustedLevel,
        ghostReplay: result.config.inputs,
        attempts: 1,
      };
    }

    return {
      success: false,
      level: adjustedLevel,
      error: 'Prop adjustments failed',
      attempts: 1,
    };
  }

  /**
   * Generate multiple levels in batch
   */
  async generateBatch(
    startLevel: number,
    endLevel: number,
    seed: string,
    onProgress?: (current: number, total: number, result: GenerationResult) => void
  ): Promise<{ levels: ArcadeLevel[]; ghostReplays: Record<number, GhostInput[]>; failed: number[] }> {
    const levels: ArcadeLevel[] = [];
    const ghostReplays: Record<number, GhostInput[]> = {};
    const failed: number[] = [];

    const total = endLevel - startLevel + 1;

    for (let id = startLevel; id <= endLevel; id++) {
      const result = await this.generateLevel(id, seed);

      if (result.success && result.level) {
        levels.push(result.level);
        if (result.ghostReplay) {
          ghostReplays[id] = result.ghostReplay;
        }
      } else {
        failed.push(id);
      }

      onProgress?.(id - startLevel + 1, total, result);
    }

    return { levels, ghostReplays, failed };
  }
}
