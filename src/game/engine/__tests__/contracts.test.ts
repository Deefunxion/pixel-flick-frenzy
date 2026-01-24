// src/game/engine/__tests__/contracts.test.ts
import { describe, it, expect } from 'vitest';
import {
  generateContract,
  evaluateContract,
  type Contract,
  type ContractResult,
} from '../contracts';

describe('Contracts System', () => {
  describe('generateContract', () => {
    it('generates a contract with route objective', () => {
      const contract = generateContract(1, 5); // seed 1, throw 5

      expect(contract).toBeDefined();
      expect(contract.id).toBeDefined();
      expect(contract.objective).toBeDefined();
      expect(contract.reward).toBeGreaterThan(0);
    });

    it('generates different contracts with different seeds', () => {
      const contract1 = generateContract(1, 5);
      const contract2 = generateContract(999, 5);

      // Different seeds should have different IDs
      expect(contract1.id).not.toBe(contract2.id);
    });
  });

  describe('evaluateContract', () => {
    it('returns success when route completed', () => {
      const contract = generateContract(1, 5);
      contract.objective.type = 'route';
      contract.constraints = [];

      const result = evaluateContract(contract, {
        routeComplete: true,
        routeFailed: false,
        staminaUsed: 30,
        brakeTaps: 2,
        landingDistance: 350,
      });

      expect(result.success).toBe(true);
      expect(result.reward).toBe(contract.reward);
    });

    it('returns failure when route incomplete', () => {
      const contract = generateContract(1, 5);
      contract.objective.type = 'route';

      const result = evaluateContract(contract, {
        routeComplete: false,
        routeFailed: true,
        staminaUsed: 50,
        brakeTaps: 3,
        landingDistance: 350,
      });

      expect(result.success).toBe(false);
      expect(result.reward).toBe(0);
    });

    it('enforces stamina constraint', () => {
      const contract = generateContract(1, 5);
      contract.objective.type = 'route';
      contract.constraints = [{ type: 'max_stamina', value: 40 }];

      const result = evaluateContract(contract, {
        routeComplete: true,
        routeFailed: false,
        staminaUsed: 50, // Over limit
        brakeTaps: 1,
        landingDistance: 350,
      });

      expect(result.success).toBe(false);
      expect(result.failReason).toBe('Used too much stamina');
    });

    it('enforces no_brake constraint', () => {
      const contract = generateContract(1, 5);
      contract.objective.type = 'route';
      contract.constraints = [{ type: 'no_brake', value: 0 }];

      const result = evaluateContract(contract, {
        routeComplete: true,
        routeFailed: false,
        staminaUsed: 30,
        brakeTaps: 1, // Used brake
        landingDistance: 350,
      });

      expect(result.success).toBe(false);
      expect(result.failReason).toBe('Brake not allowed');
    });

    it('evaluates ring_count objective', () => {
      const contract = generateContract(1, 5);
      contract.objective.type = 'ring_count';
      contract.objective.target = 2;
      contract.constraints = [];

      const result = evaluateContract(contract, {
        routeComplete: false,
        routeFailed: false,
        staminaUsed: 30,
        brakeTaps: 1,
        landingDistance: 350,
        ringsCollected: 3,
      });

      expect(result.success).toBe(true);
    });

    it('evaluates landing_zone objective', () => {
      const contract = generateContract(1, 5);
      contract.objective.type = 'landing_zone';
      contract.objective.target = 400;
      contract.constraints = [];

      const result = evaluateContract(contract, {
        routeComplete: false,
        routeFailed: false,
        staminaUsed: 30,
        brakeTaps: 1,
        landingDistance: 410,
      });

      expect(result.success).toBe(true);
    });
  });
});
