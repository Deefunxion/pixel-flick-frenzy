// src/game/engine/arcade/generator/level-generator.ts
import type { ArcadeLevel, DoodlePlacement, SpringPlacement, PortalPair, HazardPlacement, HazardMotion, WindZonePlacement, WindDirection, GravityWellPlacement, GravityWellType, FrictionZonePlacement, FrictionType, DoodleMotion } from '../types';
import type { GenerationResult, CharacterData, GhostInput } from './types';
import { SeededRandom } from './random';
import { StrokeTransformer } from './transform';
import { PhysicsSimulator } from './physics-simulator';
import { loadStrokeDatabase, getCharactersByStrokeCount, getStrokeRangeForLevel, getCharacterDatabase } from './stroke-data';

// World definitions - which mechanics are available per level range
interface WorldConfig {
  startLevel: number;
  endLevel: number;
  mechanics: {
    movingDoodles: boolean;      // World 3-4: Doodles that move
    windZones: boolean;          // World 5-6: Directional force areas
    timedSprings: boolean;       // World 7: On/off cycling springs
    staticHazards: boolean;      // World 8: Spike, saw, fire obstacles
    movingHazards: boolean;      // World 9: Moving obstacles
    gravityWells: boolean;       // World 10-11: Attract/repel fields
    timedPortals: boolean;       // World 12: On/off cycling portals
    multiPortals: boolean;       // World 13-14: Multiple portal pairs
    frictionZones: boolean;      // World 15-16: Ice and sticky surfaces
    breakableSprings: boolean;   // World 17+: One-use springs
  };
}

const WORLD_PROGRESSION: WorldConfig[] = [
  { startLevel: 1, endLevel: 10, mechanics: {
    movingDoodles: false, windZones: false, timedSprings: false,
    staticHazards: false, movingHazards: false, gravityWells: false,
    timedPortals: false, multiPortals: false, frictionZones: false, breakableSprings: false
  }},
  { startLevel: 11, endLevel: 20, mechanics: {
    movingDoodles: false, windZones: false, timedSprings: false,
    staticHazards: false, movingHazards: false, gravityWells: false,
    timedPortals: false, multiPortals: false, frictionZones: false, breakableSprings: false
  }},
  { startLevel: 21, endLevel: 30, mechanics: {
    movingDoodles: true, windZones: false, timedSprings: false,
    staticHazards: false, movingHazards: false, gravityWells: false,
    timedPortals: false, multiPortals: false, frictionZones: false, breakableSprings: false
  }},
  { startLevel: 31, endLevel: 40, mechanics: {
    movingDoodles: true, windZones: false, timedSprings: false,
    staticHazards: false, movingHazards: false, gravityWells: false,
    timedPortals: false, multiPortals: false, frictionZones: false, breakableSprings: false
  }},
  { startLevel: 41, endLevel: 50, mechanics: {
    movingDoodles: true, windZones: true, timedSprings: false,
    staticHazards: false, movingHazards: false, gravityWells: false,
    timedPortals: false, multiPortals: false, frictionZones: false, breakableSprings: false
  }},
  { startLevel: 51, endLevel: 60, mechanics: {
    movingDoodles: true, windZones: true, timedSprings: false,
    staticHazards: false, movingHazards: false, gravityWells: false,
    timedPortals: false, multiPortals: false, frictionZones: false, breakableSprings: false
  }},
  { startLevel: 61, endLevel: 70, mechanics: {
    movingDoodles: true, windZones: true, timedSprings: true,
    staticHazards: false, movingHazards: false, gravityWells: false,
    timedPortals: false, multiPortals: false, frictionZones: false, breakableSprings: false
  }},
  { startLevel: 71, endLevel: 80, mechanics: {
    movingDoodles: true, windZones: true, timedSprings: true,
    staticHazards: true, movingHazards: false, gravityWells: false,
    timedPortals: false, multiPortals: false, frictionZones: false, breakableSprings: false
  }},
  { startLevel: 81, endLevel: 90, mechanics: {
    movingDoodles: true, windZones: true, timedSprings: true,
    staticHazards: true, movingHazards: true, gravityWells: false,
    timedPortals: false, multiPortals: false, frictionZones: false, breakableSprings: false
  }},
  { startLevel: 91, endLevel: 100, mechanics: {
    movingDoodles: true, windZones: true, timedSprings: true,
    staticHazards: true, movingHazards: true, gravityWells: true,
    timedPortals: false, multiPortals: false, frictionZones: false, breakableSprings: false
  }},
  { startLevel: 101, endLevel: 110, mechanics: {
    movingDoodles: true, windZones: true, timedSprings: true,
    staticHazards: true, movingHazards: true, gravityWells: true,
    timedPortals: false, multiPortals: false, frictionZones: false, breakableSprings: false
  }},
  { startLevel: 111, endLevel: 120, mechanics: {
    movingDoodles: true, windZones: true, timedSprings: true,
    staticHazards: true, movingHazards: true, gravityWells: true,
    timedPortals: true, multiPortals: false, frictionZones: false, breakableSprings: false
  }},
  { startLevel: 121, endLevel: 140, mechanics: {
    movingDoodles: true, windZones: true, timedSprings: true,
    staticHazards: true, movingHazards: true, gravityWells: true,
    timedPortals: true, multiPortals: true, frictionZones: false, breakableSprings: false
  }},
  { startLevel: 141, endLevel: 160, mechanics: {
    movingDoodles: true, windZones: true, timedSprings: true,
    staticHazards: true, movingHazards: true, gravityWells: true,
    timedPortals: true, multiPortals: true, frictionZones: true, breakableSprings: false
  }},
  { startLevel: 161, endLevel: 250, mechanics: {
    movingDoodles: true, windZones: true, timedSprings: true,
    staticHazards: true, movingHazards: true, gravityWells: true,
    timedPortals: true, multiPortals: true, frictionZones: true, breakableSprings: true
  }},
];

function getWorldConfig(level: number): WorldConfig {
  return WORLD_PROGRESSION.find(w => level >= w.startLevel && level <= w.endLevel)
    || WORLD_PROGRESSION[WORLD_PROGRESSION.length - 1];
}

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

    const targetDoodleCount = getDoodleCount(levelId);

    // Get evenly-spread doodle positions from the character pattern
    // The transformer handles: spreading across X, using Y pattern, ensuring spacing
    const positions = transformer.extractDoodlePositions(character, targetDoodleCount);

    // Positions are already sorted by X (left to right) from the transformer

    // Get world config for this level
    const worldConfig = getWorldConfig(levelId);

    // Create doodles with potential motion for levels 21+
    const doodles: DoodlePlacement[] = positions.map((pos, i) => {
      const doodle: DoodlePlacement = {
        x: pos.x,
        y: pos.y,
        size: rng.next() > 0.5 ? 'large' : 'small',
        sprite: rng.next() > 0.7 ? 'star' : 'coin',
        sequence: i + 1,
      };

      // Add motion for moving doodles (levels 21+)
      if (worldConfig.mechanics.movingDoodles && rng.next() > 0.6) {
        if (rng.next() > 0.5) {
          doodle.motion = {
            type: 'linear',
            axis: rng.pick(['x', 'y'] as const),
            range: rng.nextInt(20, 40),
            speed: rng.nextFloat(0.3, 0.6),
          };
        } else {
          doodle.motion = {
            type: 'circular',
            radius: rng.nextInt(15, 30),
            speed: rng.nextFloat(0.2, 0.4),
          };
        }
      }

      return doodle;
    });

    // Create level
    const level: ArcadeLevel = {
      id: levelId,
      landingTarget: getLandingTarget(levelId),
      doodles,
      springs: [],
      portal: null,
      hazards: [],
      windZones: [],
      gravityWells: [],
      frictionZones: [],
    };

    // Add props if needed
    const props = shouldUseProps(levelId);
    if (props.springs) {
      level.springs = this.generateSprings(
        positions,
        rng,
        worldConfig.mechanics.timedSprings,
        worldConfig.mechanics.breakableSprings
      );
    }
    if (props.portals) {
      const portalResult = this.generatePortals(
        rng.derive('portals'),
        worldConfig.mechanics.timedPortals,
        worldConfig.mechanics.multiPortals
      );
      level.portal = portalResult.portal;
      if (portalResult.portals) {
        level.portals = portalResult.portals;
      }
    }

    // Add hazards for levels 71+
    if (worldConfig.mechanics.staticHazards) {
      level.hazards = this.generateHazards(
        positions,
        rng.derive('hazards'),
        worldConfig.mechanics.movingHazards
      );
    }

    // Add wind zones for levels 41+
    if (worldConfig.mechanics.windZones) {
      level.windZones = this.generateWindZones(rng.derive('wind'));
    }

    // Add gravity wells for levels 91+
    if (worldConfig.mechanics.gravityWells) {
      level.gravityWells = this.generateGravityWells(positions, rng.derive('gravity'));
    }

    // Add friction zones for levels 141+
    if (worldConfig.mechanics.frictionZones) {
      level.frictionZones = this.generateFrictionZones(rng.derive('friction'));
    }

    // Validate with physics
    // Reduce attempts for levels with complex mechanics (they're harder to validate)
    const hasComplexMechanics =
      (level.hazards?.length ?? 0) > 0 ||
      (level.windZones?.length ?? 0) > 0 ||
      (level.gravityWells?.length ?? 0) > 0;
    const validationAttempts = hasComplexMechanics ? 20 : 50;
    const validationResult = this.simulator.findOptimalInputs(level, positions, validationAttempts);

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
    rng: SeededRandom,
    allowTimed: boolean = false,
    allowBreakable: boolean = false
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

      const spring: SpringPlacement = {
        x,
        y,
        direction: rng.pick(['up', 'up-right', 'up-left'] as const),
        strength: rng.nextFloat(0.8, 1.5),
      };

      // Add timing for levels 61+
      if (allowTimed && rng.next() > 0.5) {
        spring.timing = {
          onDuration: rng.nextInt(1000, 2000),
          offDuration: rng.nextInt(500, 1500),
          offset: rng.nextInt(0, 1000),
        };
      }

      // Add breakable for levels 161+
      if (allowBreakable && rng.next() > 0.7) {
        spring.breakable = true;
      }

      springs.push(spring);
    }

    return springs;
  }

  private generatePortals(
    rng: SeededRandom,
    allowTimed: boolean = false,
    allowMulti: boolean = false
  ): { portal: PortalPair | null; portals?: PortalPair[] } {
    // No portal 30% of the time
    if (rng.next() > 0.7) return { portal: null };

    const portalCount = allowMulti ? rng.nextInt(1, 3) : 1;
    const colors = [0, 1, 2, 3, 4, 5]; // blue, green, orange, pink, purple, yellow

    const portals: PortalPair[] = [];

    for (let i = 0; i < portalCount; i++) {
      const entryX = rng.nextInt(200 + i * 50, 390);
      const entryY = rng.nextInt(60, 160);
      const exitX = rng.nextInt(50, 150);
      const exitY = rng.nextInt(30, 100);

      const portal: PortalPair = {
        entry: { x: entryX, y: entryY },
        exit: { x: exitX, y: exitY },
        exitDirection: rng.pick(['straight', 'up-45', 'down-45'] as const),
        exitSpeed: rng.nextFloat(0.6, 1.2),
        colorId: allowMulti ? colors[i] : undefined,
      };

      // Add timing for levels 111+
      if (allowTimed && rng.next() > 0.5) {
        portal.timing = {
          onDuration: rng.nextInt(1500, 3000),
          offDuration: rng.nextInt(1000, 2000),
          offset: rng.nextInt(0, 1500),
        };
      }

      portals.push(portal);
    }

    // Backward compatible: single portal in 'portal' field
    // Multiple portals in 'portals' array
    if (portals.length === 1) {
      return { portal: portals[0] };
    } else {
      return { portal: portals[0], portals };
    }
  }

  private generateHazards(
    doodlePositions: { x: number; y: number }[],
    rng: SeededRandom,
    allowMoving: boolean
  ): HazardPlacement[] {
    const hazards: HazardPlacement[] = [];
    const hazardCount = rng.nextInt(1, 3);
    const sprites = ['spike', 'saw', 'fire'] as const;

    for (let i = 0; i < hazardCount; i++) {
      // Place hazards NOT directly on doodle paths
      let x: number, y: number;
      let attempts = 0;

      do {
        x = rng.nextInt(80, 380);
        y = rng.nextInt(50, 180);
        attempts++;
      } while (
        attempts < 20 &&
        doodlePositions.some(d =>
          Math.abs(d.x - x) < 40 && Math.abs(d.y - y) < 40
        )
      );

      const sprite = rng.pick(sprites);

      // Motion for moving hazards (level 81+)
      let motion: HazardMotion | undefined;
      if (allowMoving && rng.next() > 0.4) {
        if (rng.next() > 0.5) {
          motion = {
            type: 'linear',
            axis: rng.pick(['x', 'y'] as const),
            range: rng.nextInt(30, 60),
            speed: rng.nextFloat(0.3, 0.8),
          };
        } else {
          motion = {
            type: 'circular',
            radius: rng.nextInt(20, 40),
            speed: rng.nextFloat(0.2, 0.5),
          };
        }
      }

      hazards.push({
        x,
        y,
        radius: sprite === 'fire' ? 15 : 12,
        sprite,
        motion,
        scale: rng.nextFloat(0.8, 1.2),
      });
    }

    return hazards;
  }

  private generateWindZones(
    rng: SeededRandom
  ): WindZonePlacement[] {
    const zones: WindZonePlacement[] = [];
    const zoneCount = rng.nextInt(1, 2);
    const directions: WindDirection[] = ['left', 'right', 'up', 'down'];

    for (let i = 0; i < zoneCount; i++) {
      // Place wind zones in play area
      const width = rng.nextInt(60, 120);
      const height = rng.nextInt(40, 80);

      zones.push({
        x: rng.nextInt(100, 350),
        y: rng.nextInt(40, 160),
        width,
        height,
        direction: rng.pick(directions),
        strength: rng.nextFloat(0.15, 0.35),
      });
    }

    return zones;
  }

  private generateGravityWells(
    doodlePositions: { x: number; y: number }[],
    rng: SeededRandom
  ): GravityWellPlacement[] {
    const wells: GravityWellPlacement[] = [];
    const wellCount = rng.nextInt(1, 2);
    const types: GravityWellType[] = ['attract', 'repel'];

    for (let i = 0; i < wellCount; i++) {
      // Place gravity wells near doodles to create interesting paths
      let x: number, y: number;
      if (doodlePositions.length > 0) {
        const nearDoodle = rng.pick(doodlePositions);
        x = nearDoodle.x + rng.nextInt(-50, 50);
        y = nearDoodle.y + rng.nextInt(-30, 30);
      } else {
        x = rng.nextInt(100, 350);
        y = rng.nextInt(60, 160);
      }

      // Clamp to valid game area
      x = Math.max(50, Math.min(400, x));
      y = Math.max(30, Math.min(200, y));

      wells.push({
        x,
        y,
        type: rng.pick(types),
        radius: rng.nextInt(40, 70),
        strength: rng.nextFloat(0.1, 0.3),
        scale: rng.nextFloat(0.8, 1.2),
      });
    }

    return wells;
  }

  private generateFrictionZones(rng: SeededRandom): FrictionZonePlacement[] {
    const zones: FrictionZonePlacement[] = [];
    const zoneCount = rng.nextInt(1, 2);
    const types: FrictionType[] = ['ice', 'sticky'];

    for (let i = 0; i < zoneCount; i++) {
      // Friction zones are at ground level (y near bottom)
      zones.push({
        x: rng.nextInt(100, 380),
        y: 220, // Ground level
        width: rng.nextInt(40, 80),
        type: rng.pick(types),
        strength: undefined, // Use defaults (ice=0.2, sticky=3.0)
      });
    }

    return zones;
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
