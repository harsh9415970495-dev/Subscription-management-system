export interface TaxRuleDefinition {
  id: string;
  name: string;
  rateBp: number; // Basis points (1800 bp = 18.00%)
  appliesTo: 'ALL' | 'PRODUCT_TYPE' | 'SPECIFIC_PRODUCTS' | string;
  productTypes?: string[] | null;
  productIds?: string[] | null;
  validFrom?: Date | string | null;
  validTo?: Date | string | null;
  priority?: number;
  active?: boolean;
}

export interface TaxableLine {
  lineId?: string;
  productId?: string;
  productType?: string;
  amount: number; // in minor units (paise)
}

export interface TaxBreakdown {
  ruleId: string;
  ruleName: string;
  rateBp: number;
  taxAmount: number; // in minor units (paise)
}

export interface LineTaxResult {
  lineId?: string;
  baseAmount: number; // in minor units (paise)
  taxes: TaxBreakdown[];
  totalTax: number; // in minor units (paise)
  totalWithTax: number; // in minor units (paise)
}

/**
 * Calculates tax on an integer amount (in minor units / paise) using basis points (rateBp).
 * Uses half-up rounding in pure integer arithmetic:
 *   tax = Math.floor((amount * rateBp + 5000) / 10000)
 * Zero floats used.
 */
export function calculateTaxAmount(amountPaise: number, rateBp: number): number {
  if (amountPaise <= 0 || rateBp <= 0) {
    return 0;
  }
  return Math.floor((amountPaise * rateBp + 5000) / 10000);
}

/**
 * Determines whether a given tax rule applies to a specific line item on a specific date.
 */
export function isTaxRuleApplicable(
  rule: TaxRuleDefinition,
  line: TaxableLine,
  asOfDate: Date = new Date(),
): boolean {
  if (rule.active === false) {
    return false;
  }

  // Check validity dates
  if (rule.validFrom) {
    const fromDate = typeof rule.validFrom === 'string' ? new Date(rule.validFrom) : rule.validFrom;
    if (asOfDate < fromDate) {
      return false;
    }
  }

  if (rule.validTo) {
    const toDate = typeof rule.validTo === 'string' ? new Date(rule.validTo) : rule.validTo;
    if (asOfDate > toDate) {
      return false;
    }
  }

  // Check scope
  if (rule.appliesTo === 'ALL') {
    return true;
  }

  if (rule.appliesTo === 'PRODUCT_TYPE') {
    if (!line.productType || !rule.productTypes || rule.productTypes.length === 0) {
      return false;
    }
    return rule.productTypes.includes(line.productType);
  }

  if (rule.appliesTo === 'SPECIFIC_PRODUCTS') {
    if (!line.productId || !rule.productIds || rule.productIds.length === 0) {
      return false;
    }
    return rule.productIds.includes(line.productId);
  }

  return false;
}

/**
 * Computes taxes for a single line item given a set of tax rules.
 */
export function calculateLineTax(
  line: TaxableLine,
  rules: TaxRuleDefinition[],
  asOfDate: Date = new Date(),
): LineTaxResult {
  const applicableRules = rules
    .filter((r) => isTaxRuleApplicable(r, line, asOfDate))
    .sort((a, b) => (b.priority ?? 10) - (a.priority ?? 10));

  const taxes: TaxBreakdown[] = [];
  let totalTax = 0;

  for (const rule of applicableRules) {
    const taxAmount = calculateTaxAmount(line.amount, rule.rateBp);
    taxes.push({
      ruleId: rule.id,
      ruleName: rule.name,
      rateBp: rule.rateBp,
      taxAmount,
    });
    totalTax += taxAmount;
  }

  return {
    lineId: line.lineId,
    baseAmount: line.amount,
    taxes,
    totalTax,
    totalWithTax: line.amount + totalTax,
  };
}

/**
 * Computes taxes for multiple line items and aggregates the grand total.
 */
export function calculateMultipleLinesTax(
  lines: TaxableLine[],
  rules: TaxRuleDefinition[],
  asOfDate: Date = new Date(),
): { lines: LineTaxResult[]; grandSubtotal: number; grandTax: number; grandTotal: number } {
  const lineResults = lines.map((l) => calculateLineTax(l, rules, asOfDate));
  const grandSubtotal = lineResults.reduce((acc, l) => acc + l.baseAmount, 0);
  const grandTax = lineResults.reduce((acc, l) => acc + l.totalTax, 0);
  const grandTotal = grandSubtotal + grandTax;

  return {
    lines: lineResults,
    grandSubtotal,
    grandTax,
    grandTotal,
  };
}
