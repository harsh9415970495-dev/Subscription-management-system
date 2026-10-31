import { describe, it, expect, beforeEach } from 'vitest';
import { CatalogService } from '../src/modules/catalog/application/catalog.service';
import { TaxationService } from '../src/modules/taxation/application/taxation.service';
import { CatalogFacade } from '../src/modules/catalog/application/catalog.facade';
import { TaxationFacade } from '../src/modules/taxation/application/taxation.facade';

describe('Catalog & Taxation Integration & Permissions Spec', () => {
  let catalogService: CatalogService;
  let catalogFacade: CatalogFacade;
  let taxationService: TaxationService;
  let taxationFacade: TaxationFacade;

  const mockDb = {
    select: () => {
      throw new Error('Database offline');
    },
    insert: () => {
      throw new Error('Database offline');
    },
    update: () => {
      throw new Error('Database offline');
    },
  };

  beforeEach(() => {
    catalogService = new CatalogService(mockDb);
    catalogFacade = new CatalogFacade(catalogService);
    taxationService = new TaxationService(mockDb);
    taxationFacade = new TaxationFacade(taxationService);
  });

  describe('Catalog & Variant Pricing', () => {
    it('lists seeded products with variants', async () => {
      const products = await catalogService.listProducts();
      expect(products.length).toBeGreaterThanOrEqual(4);

      const erp = products.find((p) => p.name.includes('Cloud ERP'));
      expect(erp).toBeDefined();
      expect(erp!.salesPrice).toBe(200000); // 2000 INR
      expect(erp!.variants).toHaveLength(2);

      const odoo = erp!.variants.find((v) => v.value === 'Odoo');
      expect(odoo).toBeDefined();
      expect(odoo!.extraPrice).toBe(56000); // +560 INR
    });

    it('calculates effective price: Base + Odoo variant (+560 INR) = 2560 INR exactly', async () => {
      const products = await catalogService.listProducts();
      const erp = products.find((p) => p.name.includes('Cloud ERP'))!;
      const odoo = erp.variants.find((v) => v.value === 'Odoo')!;

      const effective = await catalogFacade.getEffectivePrice(erp.id, odoo.id, 1);
      expect(effective.basePrice).toBe(200000);
      expect(effective.extraPrice).toBe(56000);
      expect(effective.effectiveUnitPrice).toBe(256000); // 2560.00 INR
      expect(effective.subtotal).toBe(256000);
    });

    it('creates a new product and adds a variant', async () => {
      const newProd = await catalogService.createProduct({
        name: 'Database Backup Storage (100GB)',
        type: 'SERVICE',
        salesPrice: 45000, // 450 INR
      });
      expect(newProd.id).toBeDefined();
      expect(newProd.salesPrice).toBe(45000);

      const newVar = await catalogService.createVariant(newProd.id, {
        attribute: 'Region',
        value: 'Mumbai (ap-south-1)',
        extraPrice: 5000, // +50 INR
      });
      expect(newVar.id).toBeDefined();

      const effective = await catalogFacade.getEffectivePrice(newProd.id, newVar.id);
      expect(effective.effectiveUnitPrice).toBe(50000); // 500 INR
    });
  });

  describe('Taxation & Multi-line Calculations', () => {
    it('lists seeded tax rules including Standard GST 18%', async () => {
      const rules = await taxationService.listTaxRules();
      expect(rules.length).toBeGreaterThanOrEqual(3);

      const gst18 = rules.find((r) => r.rateBp === 1800);
      expect(gst18).toBeDefined();
      expect(gst18!.name).toContain('18%');
    });

    it('calculates single-line tax using TaxationFacade', async () => {
      // 100,000 paise (1000 INR) at 18% GST -> 18000 paise (180 INR) tax
      const res = await taxationFacade.calculateTaxForLine(100000, undefined, 'SERVICE');
      expect(res.baseAmount).toBe(100000);
      expect(res.totalTax).toBe(18000);
      expect(res.totalWithTax).toBe(118000);
    });

    it('calculates multi-line tax preview with exact integer half-up rounding', async () => {
      const multi = await taxationFacade.calculateTaxesForMultipleLines([
        { amount: 200000, productType: 'SOFTWARE' }, // 200,000 * 18% = 36000 paise
        { amount: 50000, productType: 'PHYSICAL' },  // 50000 * (18% + 5%) = 9000 + 2500 = 11500 paise
      ]);

      expect(multi.grandSubtotal).toBe(250000);
      expect(multi.lines[0].totalTax).toBe(36000);
      expect(multi.lines[1].totalTax).toBe(11500);
      expect(multi.grandTax).toBe(47500);
      expect(multi.grandTotal).toBe(297500);
    });

    it('creates a new tax rule with custom basis points', async () => {
      const rule = await taxationService.createTaxRule({
        name: 'Municipal Surcharge 2%',
        rateBp: 200, // 2.00%
        appliesTo: 'ALL',
      });
      expect(rule.id).toBeDefined();
      expect(rule.rateBp).toBe(200);
    });
  });
});
