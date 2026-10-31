import { describe, it, expect } from 'vitest';
import {
  calculateEffectiveProductPrice,
  ProductPricingEntity,
  VariantPricingEntity,
} from '../product-pricing';

describe('ProductPricingCalculator Domain Logic', () => {
  const baseProduct: ProductPricingEntity = {
    id: 'prod_cloud_erp',
    name: 'Cloud ERP Software Suite',
    salesPrice: 200000, // 2000.00 INR (200,000 paise)
    costPrice: 80000,
  };

  it('calculates price without variant at base sales price', () => {
    const pricing = calculateEffectiveProductPrice(baseProduct);
    expect(pricing.basePrice).toBe(200000);
    expect(pricing.extraPrice).toBe(0);
    expect(pricing.effectiveUnitPrice).toBe(200000);
    expect(pricing.subtotal).toBe(200000);
  });

  it('verifies the Odoo +560 INR variant case: salesPrice + 560 exactly', () => {
    // Spec §8 Phase 2 requirement:
    // Variant "Brand = Odoo, +560" yields sales_price + 560 exactly
    const odooVariant: VariantPricingEntity = {
      id: 'var_odoo_001',
      productId: 'prod_cloud_erp',
      attribute: 'Brand',
      value: 'Odoo',
      extraPrice: 56000, // +560.00 INR (56,000 paise)
    };

    const pricing = calculateEffectiveProductPrice(baseProduct, odooVariant);
    expect(pricing.basePrice).toBe(200000);
    expect(pricing.extraPrice).toBe(56000);
    // 200,000 + 56,000 = 256,000 paise (2560.00 INR)
    expect(pricing.effectiveUnitPrice).toBe(256000);
    expect(pricing.subtotal).toBe(256000);
  });

  it('calculates subtotal for multiple quantity without floats', () => {
    const odooVariant: VariantPricingEntity = {
      id: 'var_odoo_001',
      productId: 'prod_cloud_erp',
      attribute: 'Brand',
      value: 'Odoo',
      extraPrice: 56000, // +560 INR
    };

    const pricing = calculateEffectiveProductPrice(baseProduct, odooVariant, 3);
    expect(pricing.quantity).toBe(3);
    expect(pricing.effectiveUnitPrice).toBe(256000);
    expect(pricing.subtotal).toBe(768000); // 256,000 * 3 = 768,000 paise (7680.00 INR)
  });

  it('throws an error for negative quantities', () => {
    expect(() => calculateEffectiveProductPrice(baseProduct, null, -1)).toThrow(
      'Quantity cannot be negative',
    );
  });
});
