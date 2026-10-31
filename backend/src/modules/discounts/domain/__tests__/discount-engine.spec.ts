import { describe, it, expect } from 'vitest';
import {
  calculateRawDiscount,
  isDiscountRuleActive,
  evaluateDiscounts,
  DiscountRuleDefinition,
  DiscountContext,
} from '../discount-engine';

describe('DiscountEngine Domain Logic (≥ 25 Table-Driven Test Matrix)', () => {
  describe('calculateRawDiscount & integer arithmetic', () => {
    it('1. calculates 10% percentage discount (1000 bp) on ₹1,000.00 (100,000 paise)', () => {
      expect(calculateRawDiscount(100000, 'PERCENTAGE', 1000)).toBe(10000); // 100 INR
    });

    it('2. calculates fixed discount of ₹500.00 (50,000 paise) on ₹2,000.00 (200,000 paise)', () => {
      expect(calculateRawDiscount(200000, 'FIXED', 50000)).toBe(50000);
    });

    it('3. bounds fixed discount when fixed amount exceeds line total (never discounts below zero)', () => {
      expect(calculateRawDiscount(30000, 'FIXED', 50000)).toBe(30000);
    });

    it('4. bounds percentage discount at 100% (10000 bp)', () => {
      expect(calculateRawDiscount(50000, 'PERCENTAGE', 10000)).toBe(50000);
    });

    it('5. returns 0 discount for zero or negative amount', () => {
      expect(calculateRawDiscount(0, 'PERCENTAGE', 1000)).toBe(0);
      expect(calculateRawDiscount(-1000, 'FIXED', 500)).toBe(0);
    });

    it('6. returns 0 discount for zero or negative value', () => {
      expect(calculateRawDiscount(100000, 'PERCENTAGE', 0)).toBe(0);
      expect(calculateRawDiscount(100000, 'FIXED', -100)).toBe(0);
    });

    it('7. rounds half-up at 0.5 paise boundary (5.5 paise -> 6 paise)', () => {
      // 100 paise * 550 bp = 55000. (55000 + 5000)/10000 = 6 paise
      expect(calculateRawDiscount(100, 'PERCENTAGE', 550)).toBe(6);
    });

    it('8. rounds down below 0.5 paise boundary (5.49 paise -> 5 paise)', () => {
      expect(calculateRawDiscount(100, 'PERCENTAGE', 549)).toBe(5);
    });
  });

  describe('isDiscountRuleActive validity & limits', () => {
    const baseRule: DiscountRuleDefinition = {
      id: 'd1',
      code: 'PROMO10',
      type: 'PERCENTAGE',
      value: 1000,
      scope: 'PRODUCTS',
      active: true,
    };

    it('9. accepts active rule within open window and no limit', () => {
      expect(isDiscountRuleActive(baseRule)).toBe(true);
    });

    it('10. rejects rule with active: false', () => {
      expect(isDiscountRuleActive({ ...baseRule, active: false })).toBe(false);
    });

    it('11. rejects rule when used_count reaches usage_limit', () => {
      const limitReached: DiscountRuleDefinition = {
        ...baseRule,
        usageLimit: 5,
        usedCount: 5,
      };
      expect(isDiscountRuleActive(limitReached)).toBe(false);
    });

    it('12. accepts rule when used_count is below usage_limit', () => {
      const underLimit: DiscountRuleDefinition = {
        ...baseRule,
        usageLimit: 10,
        usedCount: 9,
      };
      expect(isDiscountRuleActive(underLimit)).toBe(true);
    });

    it('13. rejects rule when start_date is in the future', () => {
      const futureRule: DiscountRuleDefinition = {
        ...baseRule,
        startDate: new Date('2027-01-01'),
      };
      expect(isDiscountRuleActive(futureRule, new Date('2026-10-31'))).toBe(false);
    });

    it('14. rejects rule when end_date is in the past', () => {
      const pastRule: DiscountRuleDefinition = {
        ...baseRule,
        endDate: new Date('2025-12-31'),
      };
      expect(isDiscountRuleActive(pastRule, new Date('2026-10-31'))).toBe(false);
    });
  });

  describe('evaluateDiscounts stacking, scoping, and threshold evaluation', () => {
    const testLines = [
      {
        lineId: 'l1',
        productId: 'prod_erp',
        unitPrice: 200000, // 2000 INR
        quantity: 1,
        amount: 200000,
      },
      {
        lineId: 'l2',
        productId: 'prod_support',
        unitPrice: 150000, // 1500 INR
        quantity: 2,
        amount: 300000, // 3000 INR
      },
    ];

    it('15. applies product-scoped discount to matching target product', () => {
      const rules: DiscountRuleDefinition[] = [
        {
          id: 'd_erp_10',
          code: 'ERP10',
          type: 'PERCENTAGE',
          value: 1000, // 10%
          scope: 'PRODUCTS',
          targetIds: ['prod_erp'],
          active: true,
        },
      ];

      const res = evaluateDiscounts({ lines: testLines }, rules);
      expect(res.lineDiscounts).toHaveLength(1);
      expect(res.lineDiscounts[0].lineId).toBe('l1');
      expect(res.lineDiscounts[0].discountAmount).toBe(20000); // 10% of 200,000 = 20,000 paise (200 INR)
      expect(res.totalDiscountAmount).toBe(20000);
      expect(res.finalSubtotal).toBe(480000); // 500,000 - 20,000
    });

    it('16. ignores product-scoped discount when line does not match targetIds', () => {
      const rules: DiscountRuleDefinition[] = [
        {
          id: 'd_other',
          code: 'OTHER20',
          type: 'PERCENTAGE',
          value: 2000,
          scope: 'PRODUCTS',
          targetIds: ['prod_unmatched'],
          active: true,
        },
      ];

      const res = evaluateDiscounts({ lines: testLines }, rules);
      expect(res.lineDiscounts).toHaveLength(0);
      expect(res.totalDiscountAmount).toBe(0);
    });

    it('17. enforces Stacking Rule A-4: two product discounts on same line -> highest saving wins', () => {
      const rules: DiscountRuleDefinition[] = [
        {
          id: 'd_erp_10',
          code: 'ERP10',
          type: 'PERCENTAGE',
          value: 1000, // 10% of 200,000 = 20,000 paise (200 INR)
          scope: 'PRODUCTS',
          targetIds: ['prod_erp'],
          active: true,
        },
        {
          id: 'd_erp_flat300',
          code: 'ERP300',
          type: 'FIXED',
          value: 30000, // 300 INR (30,000 paise) -> HIGHER!
          scope: 'PRODUCTS',
          targetIds: ['prod_erp'],
          active: true,
        },
      ];

      const res = evaluateDiscounts({ lines: testLines }, rules);
      expect(res.lineDiscounts).toHaveLength(1);
      expect(res.lineDiscounts[0].discountCode).toBe('ERP300');
      expect(res.lineDiscounts[0].discountAmount).toBe(30000);
    });

    it('18. enforces Stacking Rule A-4: allows 1 product discount per line AND 1 subscription discount on invoice', () => {
      const rules: DiscountRuleDefinition[] = [
        {
          id: 'd_erp',
          code: 'ERP10',
          type: 'PERCENTAGE',
          value: 1000, // 10% on l1 = 20,000 paise
          scope: 'PRODUCTS',
          targetIds: ['prod_erp'],
          active: true,
        },
        {
          id: 'd_sub',
          code: 'SUB5',
          type: 'PERCENTAGE',
          value: 500, // 5% on remaining subtotal (500,000 - 20,000 = 480,000) = 24,000 paise
          scope: 'SUBSCRIPTIONS',
          active: true,
        },
      ];

      const res = evaluateDiscounts({ lines: testLines }, rules);
      expect(res.lineDiscounts).toHaveLength(1);
      expect(res.lineDiscounts[0].discountAmount).toBe(20000);
      expect(res.invoiceDiscount).toBeDefined();
      expect(res.invoiceDiscount!.discountAmount).toBe(24000);
      expect(res.totalDiscountAmount).toBe(44000); // 20,000 + 24,000
      expect(res.finalSubtotal).toBe(456000); // 500,000 - 44,000
    });

    it('19. enforces Stacking Rule A-4: two subscription discounts on invoice -> highest saving wins', () => {
      const rules: DiscountRuleDefinition[] = [
        {
          id: 'd_sub_5',
          code: 'SUB5',
          type: 'PERCENTAGE',
          value: 500, // 5% of 500,000 = 25,000 paise
          scope: 'SUBSCRIPTIONS',
          active: true,
        },
        {
          id: 'd_sub_flat400',
          code: 'FLAT400',
          type: 'FIXED',
          value: 40000, // 40,000 paise (400 INR) -> HIGHER!
          scope: 'SUBSCRIPTIONS',
          active: true,
        },
      ];

      const res = evaluateDiscounts({ lines: testLines }, rules);
      expect(res.invoiceDiscount).toBeDefined();
      expect(res.invoiceDiscount!.discountCode).toBe('FLAT400');
      expect(res.invoiceDiscount!.discountAmount).toBe(40000);
    });

    it('20. respects minPurchaseAmount threshold (fails when below threshold)', () => {
      const rules: DiscountRuleDefinition[] = [
        {
          id: 'd_big',
          code: 'BIGSPENDER',
          type: 'FIXED',
          value: 50000,
          minPurchaseAmount: 1000000, // Requires 10,000 INR (subtotal is 5,000 INR)
          scope: 'SUBSCRIPTIONS',
          active: true,
        },
      ];

      const res = evaluateDiscounts({ lines: testLines }, rules);
      expect(res.invoiceDiscount).toBeNull();
      expect(res.totalDiscountAmount).toBe(0);
    });

    it('21. respects minPurchaseAmount threshold (succeeds when met)', () => {
      const rules: DiscountRuleDefinition[] = [
        {
          id: 'd_big',
          code: 'BIGSPENDER',
          type: 'FIXED',
          value: 50000,
          minPurchaseAmount: 400000, // 400,000 paise (subtotal is 500,000 paise)
          scope: 'SUBSCRIPTIONS',
          active: true,
        },
      ];

      const res = evaluateDiscounts({ lines: testLines }, rules);
      expect(res.invoiceDiscount).toBeDefined();
      expect(res.invoiceDiscount!.discountAmount).toBe(50000);
    });

    it('22. respects minQuantity threshold on product line (fails when below quantity)', () => {
      const rules: DiscountRuleDefinition[] = [
        {
          id: 'd_bulk_erp',
          code: 'BULKERP',
          type: 'PERCENTAGE',
          value: 2000,
          minQuantity: 5, // line l1 has quantity 1
          scope: 'PRODUCTS',
          targetIds: ['prod_erp'],
          active: true,
        },
      ];

      const res = evaluateDiscounts({ lines: testLines }, rules);
      expect(res.lineDiscounts).toHaveLength(0);
    });

    it('23. respects minQuantity threshold on product line (succeeds when met)', () => {
      const bulkLines = [
        {
          lineId: 'l1',
          productId: 'prod_erp',
          unitPrice: 200000,
          quantity: 5,
          amount: 1000000,
        },
      ];
      const rules: DiscountRuleDefinition[] = [
        {
          id: 'd_bulk_erp',
          code: 'BULKERP',
          type: 'PERCENTAGE',
          value: 2000, // 20% of 1,000,000 = 200,000 paise
          minQuantity: 5,
          scope: 'PRODUCTS',
          targetIds: ['prod_erp'],
          active: true,
        },
      ];

      const res = evaluateDiscounts({ lines: bulkLines }, rules);
      expect(res.lineDiscounts).toHaveLength(1);
      expect(res.lineDiscounts[0].discountAmount).toBe(200000);
    });

    it('24. respects subscription-specific targetIds', () => {
      const rules: DiscountRuleDefinition[] = [
        {
          id: 'd_targeted_sub',
          code: 'VIP_SUB',
          type: 'FIXED',
          value: 100000,
          scope: 'SUBSCRIPTIONS',
          targetIds: ['sub_vip_123'],
          active: true,
        },
      ];

      const matchRes = evaluateDiscounts(
        { subscriptionId: 'sub_vip_123', lines: testLines },
        rules,
      );
      expect(matchRes.invoiceDiscount).toBeDefined();

      const mismatchRes = evaluateDiscounts(
        { subscriptionId: 'sub_standard_999', lines: testLines },
        rules,
      );
      expect(mismatchRes.invoiceDiscount).toBeNull();
    });

    it('25. handles empty line set gracefully', () => {
      const rules: DiscountRuleDefinition[] = [
        {
          id: 'd1',
          code: 'ALL10',
          type: 'PERCENTAGE',
          value: 1000,
          scope: 'SUBSCRIPTIONS',
          active: true,
        },
      ];

      const res = evaluateDiscounts({ lines: [] }, rules);
      expect(res.totalDiscountAmount).toBe(0);
      expect(res.originalSubtotal).toBe(0);
      expect(res.finalSubtotal).toBe(0);
    });

    it('26. bounds total discount so finalSubtotal never falls below zero', () => {
      const smallLine = [
        {
          lineId: 'l1',
          productId: 'prod_ip',
          unitPrice: 30000,
          quantity: 1,
          amount: 30000, // 300 INR
        },
      ];
      const bigDiscount: DiscountRuleDefinition[] = [
        {
          id: 'd_huge',
          code: 'FLAT1000',
          type: 'FIXED',
          value: 100000, // 1,000 INR
          scope: 'SUBSCRIPTIONS',
          active: true,
        },
      ];

      const res = evaluateDiscounts({ lines: smallLine }, bigDiscount);
      expect(res.totalDiscountAmount).toBe(30000); // capped at subtotal
      expect(res.finalSubtotal).toBe(0);
    });
  });
});
