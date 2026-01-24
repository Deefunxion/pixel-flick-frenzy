// src/game/engine/contracts.ts
/**
 * Contracts System - Objectives that make each throw different
 *
 * A contract defines: objective + constraints + reward
 * This creates variety without RNG frustration.
 */

export type ObjectiveType = 'route' | 'landing_zone' | 'ring_count';
export type ConstraintType = 'max_stamina' | 'no_brake' | 'no_throttle' | 'max_brake_taps';

export interface ContractObjective {
  type: ObjectiveType;
  description: string;
  target?: number;
}

export interface ContractConstraint {
  type: ConstraintType;
  value: number;
  description?: string;
}

export interface Contract {
  id: string;
  objective: ContractObjective;
  constraints: ContractConstraint[];
  reward: number;        // Throws rewarded
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface ContractEvalInput {
  routeComplete: boolean;
  routeFailed: boolean;
  staminaUsed: number;
  brakeTaps: number;
  landingDistance: number;
  ringsCollected?: number;
}

export interface ContractResult {
  success: boolean;
  reward: number;
  failReason: string | null;
}

// Contract templates
const TEMPLATES: Array<Omit<Contract, 'id'>> = [
  {
    objective: { type: 'route', description: 'Complete the route' },
    constraints: [],
    reward: 5,
    difficulty: 'easy',
  },
  {
    objective: { type: 'route', description: 'Complete route efficiently' },
    constraints: [{ type: 'max_stamina', value: 50 }],
    reward: 10,
    difficulty: 'medium',
  },
  {
    objective: { type: 'route', description: 'No brakes allowed' },
    constraints: [{ type: 'no_brake', value: 0 }],
    reward: 15,
    difficulty: 'hard',
  },
  {
    objective: { type: 'ring_count', description: 'Collect 2+ rings', target: 2 },
    constraints: [],
    reward: 8,
    difficulty: 'medium',
  },
  {
    objective: { type: 'landing_zone', description: 'Land beyond 400', target: 400 },
    constraints: [],
    reward: 6,
    difficulty: 'easy',
  },
];

/**
 * Generate a contract for current throw
 */
export function generateContract(seed: number, throwCount: number): Contract {
  // Seeded selection
  let t = seed + throwCount * 31;
  const random = () => {
    t = (t * 1103515245 + 12345) & 0x7fffffff;
    return t / 0x7fffffff;
  };

  // Weight toward easier contracts early
  const difficultyBias = Math.min(throwCount / 20, 1);
  const templateIndex = Math.floor(random() * TEMPLATES.length * (0.5 + difficultyBias * 0.5));
  const template = TEMPLATES[Math.min(templateIndex, TEMPLATES.length - 1)];

  return {
    ...template,
    id: `contract_${seed}_${throwCount}`,
  };
}

/**
 * Evaluate if contract was completed
 */
export function evaluateContract(
  contract: Contract,
  input: ContractEvalInput
): ContractResult {
  // Check objective
  let objectiveMet = false;

  switch (contract.objective.type) {
    case 'route':
      objectiveMet = input.routeComplete && !input.routeFailed;
      break;
    case 'ring_count':
      objectiveMet = (input.ringsCollected ?? 0) >= (contract.objective.target ?? 1);
      break;
    case 'landing_zone':
      objectiveMet = input.landingDistance >= (contract.objective.target ?? 350);
      break;
  }

  if (!objectiveMet) {
    return { success: false, reward: 0, failReason: 'Objective not met' };
  }

  // Check constraints
  for (const constraint of contract.constraints) {
    switch (constraint.type) {
      case 'max_stamina':
        if (input.staminaUsed > constraint.value) {
          return { success: false, reward: 0, failReason: 'Used too much stamina' };
        }
        break;
      case 'no_brake':
        if (input.brakeTaps > 0) {
          return { success: false, reward: 0, failReason: 'Brake not allowed' };
        }
        break;
      case 'max_brake_taps':
        if (input.brakeTaps > constraint.value) {
          return { success: false, reward: 0, failReason: 'Too many brake taps' };
        }
        break;
    }
  }

  return { success: true, reward: contract.reward, failReason: null };
}

/**
 * Get next contract (rotates after completion or 2 fails)
 */
export function getNextContract(
  seed: number,
  throwCount: number,
  consecutiveFails: number
): Contract {
  // After 2 fails, give easier contract
  if (consecutiveFails >= 2) {
    return {
      id: `fallback_${throwCount}`,
      objective: { type: 'ring_count', description: 'Collect any ring', target: 1 },
      constraints: [],
      reward: 3,
      difficulty: 'easy',
    };
  }

  return generateContract(seed, throwCount);
}
