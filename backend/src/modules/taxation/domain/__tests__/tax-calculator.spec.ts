import { describe, it, expect } from 'vitest';
import {
  calculateTaxAmount,
  isTaxRuleApplicable,
  calculateLineTax,
  calculateMultipleLinesTax,
  TaxRuleDefinition,
} from '../tax-calculator';

describe('TaxCalculator Domain Logic', () => {
  describe('calculateTaxAmount integer arithmetic & half-up rounding', () => {
    it('calculates standard 18% GST on 1000 INR (100000 paise)', () => {
      // 100000 paise * 1800 bp / 10000 = 18000 paise (180.00 INR)
      const tax = calculateTaxAmount(100000, 1800);
      expect(tax).toBe(18000);
    });

    it('calculates 5% GST on 500 INR (50000 paise)', () => {
      // 50000 * 500 / 10000 = 2500 paise (25.00 INR)
      const tax = calculateTaxAmount(50000, 500);
      expect(tax).toBe(2500);
    });

    it('correctly rounds up at 0.5 boundary (half-up rounding)', () => {
      // 100 paise * 550 bp = 55000. (55000 + 5000)/10000 = 60000/10000 = 6 paise
      // In float: 100 * 0.055 = 5.5 paise -> rounds up to 6 paise
      const tax = calculateTaxAmount(100, 550);
      expect(tax).toBe(6);
    });

    it('correctly rounds down below 0.5 boundary', () => {
      // 100 paise * 549 bp = 54900. (54900 + 5000)/10000 = 59900/10000 = 5 paise
      // In float: 100 * 0.0549 = 5.49 paise -> rounds down to 5 paise
      const tax = calculateTaxAmount(100, 549);
      expect(tax).toBe(5);
    });

    it('handles zero rate (0 basis points)', () => {
      const tax = calculateTaxAmount(100000, 0);
      expect(tax).toBe(0);
    });

    it('handles zero or negative amounts safely', () => {
      expect(calculateTaxAmount(0, 1800)).toBe(0);
      expect(calculateTaxAmount(-5000, 1800)).toBe(0);
    });
  });

  describe('isTaxRuleApplicable scoping & validity', () => {
    const baseRule: TaxRuleDefinition = {
      id: 'tax_gst_18',
      name: 'GST 18%',
      rateBp: 1800,
      appliesTo: 'ALL',
      active: true,
    };

    it('applies ALL scope to any product type', () => {
      expect(isTaxRuleApplicable(baseRule, { amount: 1000, productType: 'SERVICE' })).toBe(true);
      expect(isTaxRuleApplicable(baseRule, { amount: 1000, productType: 'SOFTWARE' })).toBe(true);
    });

    it('respects PRODUCT_TYPE scope filter', () => {
      const typeScopedRule: TaxRuleDefinition = {
        ...baseRule,
        appliesTo: 'PRODUCT_TYPE',
        productTypes: ['SERVICE', 'SOFTWARE'],
      };

      expect(isTaxRuleApplicable(typeScopedRule, { amount: 1000, productType: 'SERVICE' })).toBe(true);
      expect(isTaxRuleApplicable(typeScopedRule, { amount: 1000, productType: 'PHYSICAL' })).toBe(false);
    });

    it('respects SPECIFIC_PRODUCTS scope filter', () => {
      const productScopedRule: TaxRuleDefinition = {
        ...baseRule,
        appliesTo: 'SPECIFIC_PRODUCTS',
        productIds: ['prod_100', 'prod_200'],
      };

      expect(isTaxRuleApplicable(productScopedRule, { amount: 1000, productId: 'prod_100' })).toBe(true);
      expect(isTaxRuleApplicable(productScopedRule, { amount: 1000, productId: 'prod_999' })).toBe(false);
    });

    it('rejects rules where active is false', () => {
      const inactiveRule: TaxRuleDefinition = { ...baseRule, active: false };
      expect(isTaxRuleApplicable(inactiveRule, { amount: 1000 })).toBe(false);
    });

    it('rejects rules where validFrom is in the future', () => {
      const futureRule: TaxRuleDefinition = {
        ...baseRule,
        validFrom: new Date('2027-01-01'),
      };
      expect(isTaxRuleApplicable(futureRule, { amount: 1000 }, new Date('2026-10-31'))).toBe(false);
    });

    it('rejects rules where validTo is in the past', () => {
      const expiredRule: TaxRuleDefinition = {
        ...baseRule,
        validTo: new Date('2025-01-01'),
      };
      expect(isTaxRuleApplicable(expiredRule, { amount: 1000 }, new Date('2026-10-31'))).toBe(false);
    });
  });

  describe('calculateLineTax & calculateMultipleLinesTax', () => {
    const rules: TaxRuleDefinition[] = [
      {
        id: 'tax_gst_18',
        name: 'GST 18%',
        rateBp: 1800,
        appliesTo: 'ALL',
        priority: 10,
        active: true,
      },
    ];

    it('calculates totalWithTax for a single line', () => {
      const result = calculateLineTax({ lineId: 'l1', amount: 250000 }, rules);
      // 250000 paise (2500 INR) * 18% = 45000 paise (450 INR)
      expect(result.baseAmount).toBe(250000);
      expect(result.totalTax).toBe(45000);
      expect(result.totalWithTax).toBe(295000);
      expect(result.taxes).toHaveLength(1);
      expect(result.taxes[0].taxAmount).toBe(45000);
    });

    it('aggregates multiple lines with per-line half-up rounding', () => {
      const lines = [
        { lineId: 'l1', amount: 333, productType: 'SERVICE' }, // 333 * 0.18 = 59.94 -> 60 paise
        { lineId: 'l2', amount: 667, productType: 'SERVICE' }, // 667 * 0.18 = 120.06 -> 120 paise
      ];

      const multi = calculateMultipleLinesTax(lines, rules);
      expect(multi.grandSubtotal).toBe(1000); // 333 + 667
      expect(multi.lines[0].totalTax).toBe(60);
      expect(multi.lines[1].totalTax).toBe(120);
      expect(multi.grandTax).toBe(180);
      expect(multi.grandTotal).toBe(1180);
    });
  });
});
