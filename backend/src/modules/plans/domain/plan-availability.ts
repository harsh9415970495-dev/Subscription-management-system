export interface PlanAvailabilityEntity {
  id: string;
  name: string;
  availableFrom?: Date | string | null;
  availableTo?: Date | string | null;
  active: boolean;
}

/**
 * Pure domain query to determine whether a subscription plan is available for activation on a given date.
 */
export function isPlanAvailableOn(
  plan: PlanAvailabilityEntity,
  asOfDate: Date = new Date(),
): boolean {
  if (!plan.active) {
    return false;
  }

  if (plan.availableFrom) {
    const from = typeof plan.availableFrom === 'string' ? new Date(plan.availableFrom) : plan.availableFrom;
    if (asOfDate < from) {
      return false;
    }
  }

  if (plan.availableTo) {
    const to = typeof plan.availableTo === 'string' ? new Date(plan.availableTo) : plan.availableTo;
    if (asOfDate > to) {
      return false;
    }
  }

  return true;
}
