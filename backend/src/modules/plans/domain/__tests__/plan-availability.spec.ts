import { describe, it, expect } from 'vitest';
import { isPlanAvailableOn, PlanAvailabilityEntity } from '../plan-availability';

describe('PlanAvailability Domain Logic', () => {
  const basePlan: PlanAvailabilityEntity = {
    id: 'plan_pro_monthly',
    name: 'Enterprise Pro Monthly',
    active: true,
  };

  it('is available when active and without availability constraints', () => {
    expect(isPlanAvailableOn(basePlan)).toBe(true);
  });

  it('is unavailable when active is false', () => {
    expect(isPlanAvailableOn({ ...basePlan, active: false })).toBe(false);
  });

  it('respects availableFrom constraint', () => {
    const futurePlan: PlanAvailabilityEntity = {
      ...basePlan,
      availableFrom: new Date('2027-01-01'),
    };
    expect(isPlanAvailableOn(futurePlan, new Date('2026-10-31'))).toBe(false);
    expect(isPlanAvailableOn(futurePlan, new Date('2027-01-02'))).toBe(true);
  });

  it('respects availableTo constraint', () => {
    const expiredPlan: PlanAvailabilityEntity = {
      ...basePlan,
      availableTo: new Date('2025-12-31'),
    };
    expect(isPlanAvailableOn(expiredPlan, new Date('2026-10-31'))).toBe(false);
  });
});
