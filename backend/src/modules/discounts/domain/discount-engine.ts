export type DiscountType = 'PERCENTAGE' | 'FIXED';
export type DiscountScope = 'PRODUCTS' | 'SUBSCRIPTIONS';

export interface DiscountRuleDefinition {
  id: string;
  code: string;
  type: DiscountType;
  value: number; // basis points (1000 bp = 10.00%) for PERCENTAGE, or paise for FIXED
  minPurchaseAmount?: number; // in paise
  minQuantity?: number;
  startDate?: Date | string | null;
  endDate?: Date | string | null;
  usageLimit?: number | null;
  usedCount?: number;
  scope: DiscountScope;
  targetIds?: string[] | null; // productIds if PRODUCTS, subscriptionIds if SUBSCRIPTIONS
  active?: boolean;
}

export interface DiscountLineItem {
  lineId: string;
  productId: string;
  unitPrice: number; // paise
  quantity: number;
  amount: number; // unitPrice * quantity in paise
}

export interface DiscountContext {
  subscriptionId?: string;
  customerId?: string;
  asOfDate?: Date;
  lines: DiscountLineItem[];
}

export interface LineDiscountApplication {
  lineId: string;
  discountId: string;
  discountCode: string;
  discountType: DiscountType;
  discountAmount: number; // paise
  discountedAmount: number; // paise (original - discount)
}

export interface InvoiceDiscountApplication {
  discountId: string;
  discountCode: string;
  discountType: DiscountType;
  discountAmount: number; // paise
}

export interface DiscountEvaluationResult {
  lineDiscounts: LineDiscountApplication[];
  invoiceDiscount?: InvoiceDiscountApplication | null;
  totalDiscountAmount: number; // sum of all line + invoice discounts in paise
  originalSubtotal: number; // in paise
  finalSubtotal: number; // in paise (original - totalDiscountAmount)
}

/**
 * Calculates raw discount amount on a base amount (in paise).
 * Uses integer minor units and half-up rounding for percentage basis points.
 * Zero floats used.
 */
export function calculateRawDiscount(amountPaise: number, type: DiscountType, value: number): number {
  if (amountPaise <= 0 || value <= 0) {
    return 0;
  }
  if (type === 'PERCENTAGE') {
    // value in basis points: e.g. 1000 bp = 10%, 1800 bp = 18%
    const discount = Math.floor((amountPaise * value + 5000) / 10000);
    return Math.min(amountPaise, discount);
  } else {
    // FIXED amount in paise
    return Math.min(amountPaise, value);
  }
}

/**
 * Determines whether a discount rule is valid as of a specific date and usage limit.
 */
export function isDiscountRuleActive(rule: DiscountRuleDefinition, asOfDate: Date = new Date()): boolean {
  if (rule.active === false) {
    return false;
  }

  // Check usage limit
  if (rule.usageLimit !== undefined && rule.usageLimit !== null) {
    if ((rule.usedCount ?? 0) >= rule.usageLimit) {
      return false;
    }
  }

  // Check start date
  if (rule.startDate) {
    const start = typeof rule.startDate === 'string' ? new Date(rule.startDate) : rule.startDate;
    if (asOfDate < start) {
      return false;
    }
  }

  // Check end date
  if (rule.endDate) {
    const end = typeof rule.endDate === 'string' ? new Date(rule.endDate) : rule.endDate;
    if (asOfDate > end) {
      return false;
    }
  }

  return true;
}

/**
 * Pure Discount Engine evaluating applicable discounts with Assumption A-4:
 * "At most one product-scoped discount per line and one subscription-scoped discount per invoice, highest saving wins."
 */
export function evaluateDiscounts(
  context: DiscountContext,
  availableRules: DiscountRuleDefinition[],
): DiscountEvaluationResult {
  const asOfDate = context.asOfDate || new Date();
  const activeRules = availableRules.filter((r) => isDiscountRuleActive(r, asOfDate));

  const originalSubtotal = context.lines.reduce((acc, l) => acc + l.amount, 0);
  const lineDiscounts: LineDiscountApplication[] = [];
  let totalLineDiscounts = 0;

  // 1. Evaluate Product-Scoped Discounts (at most one per line, highest saving wins)
  for (const line of context.lines) {
    const applicableProductRules = activeRules.filter((r) => {
      if (r.scope !== 'PRODUCTS') return false;
      // Target check: if targets specified, must include line.productId
      if (r.targetIds && r.targetIds.length > 0 && !r.targetIds.includes(line.productId)) {
        return false;
      }
      // Minimum quantity check
      if (r.minQuantity && line.quantity < r.minQuantity) {
        return false;
      }
      // Minimum purchase amount check (per line)
      if (r.minPurchaseAmount && line.amount < r.minPurchaseAmount) {
        return false;
      }
      return true;
    });

    if (applicableProductRules.length > 0) {
      // Find rule with highest savings
      let bestRule: DiscountRuleDefinition | null = null;
      let highestSaving = 0;

      for (const rule of applicableProductRules) {
        const saving = calculateRawDiscount(line.amount, rule.type, rule.value);
        if (saving > highestSaving) {
          highestSaving = saving;
          bestRule = rule;
        }
      }

      if (bestRule && highestSaving > 0) {
        lineDiscounts.push({
          lineId: line.lineId,
          discountId: bestRule.id,
          discountCode: bestRule.code,
          discountType: bestRule.type,
          discountAmount: highestSaving,
          discountedAmount: line.amount - highestSaving,
        });
        totalLineDiscounts += highestSaving;
      }
    }
  }

  // 2. Evaluate Subscription-Scoped Discounts (at most one per invoice, highest saving wins)
  const remainingSubtotalAfterLines = originalSubtotal - totalLineDiscounts;
  let invoiceDiscount: InvoiceDiscountApplication | null = null;

  if (remainingSubtotalAfterLines > 0) {
    const applicableSubRules = activeRules.filter((r) => {
      if (r.scope !== 'SUBSCRIPTIONS') return false;
      // Target check: if targets specified, must include subscriptionId
      if (
        r.targetIds &&
        r.targetIds.length > 0 &&
        (!context.subscriptionId || !r.targetIds.includes(context.subscriptionId))
      ) {
        return false;
      }
      // Minimum purchase check against invoice subtotal
      if (r.minPurchaseAmount && originalSubtotal < r.minPurchaseAmount) {
        return false;
      }
      // Minimum quantity check against total items
      const totalQty = context.lines.reduce((acc, l) => acc + l.quantity, 0);
      if (r.minQuantity && totalQty < r.minQuantity) {
        return false;
      }
      return true;
    });

    if (applicableSubRules.length > 0) {
      let bestSubRule: DiscountRuleDefinition | null = null;
      let highestSubSaving = 0;

      for (const rule of applicableSubRules) {
        const saving = calculateRawDiscount(remainingSubtotalAfterLines, rule.type, rule.value);
        if (saving > highestSubSaving) {
          highestSubSaving = saving;
          bestSubRule = rule;
        }
      }

      if (bestSubRule && highestSubSaving > 0) {
        invoiceDiscount = {
          discountId: bestSubRule.id,
          discountCode: bestSubRule.code,
          discountType: bestSubRule.type,
          discountAmount: highestSubSaving,
        };
      }
    }
  }

  const invoiceDiscountAmount = invoiceDiscount ? invoiceDiscount.discountAmount : 0;
  const totalDiscountAmount = totalLineDiscounts + invoiceDiscountAmount;
  const finalSubtotal = Math.max(0, originalSubtotal - totalDiscountAmount);

  return {
    lineDiscounts,
    invoiceDiscount,
    totalDiscountAmount,
    originalSubtotal,
    finalSubtotal,
  };
}
