import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { DB_CLIENT } from '../../../shared/database/database.provider';
import { taxRules, TaxRule } from '../infrastructure/schema';
import {
  calculateLineTax,
  calculateMultipleLinesTax,
  LineTaxResult,
  TaxableLine,
  TaxRuleDefinition,
} from '../domain/tax-calculator';

export interface CreateTaxRuleDto {
  name: string;
  rateBp: number; // e.g. 1800 for 18.00%
  appliesTo: 'ALL' | 'PRODUCT_TYPE' | 'SPECIFIC_PRODUCTS';
  productTypes?: string[];
  productIds?: string[];
  validFrom?: Date | string;
  validTo?: Date | string;
  priority?: number;
  active?: boolean;
}

export interface UpdateTaxRuleDto {
  name?: string;
  rateBp?: number;
  appliesTo?: 'ALL' | 'PRODUCT_TYPE' | 'SPECIFIC_PRODUCTS';
  productTypes?: string[];
  productIds?: string[];
  validFrom?: Date | string;
  validTo?: Date | string;
  priority?: number;
  active?: boolean;
}

const INITIAL_TAX_RULES: TaxRule[] = [
  {
    id: 'tax_01jk9gst180000000000001',
    name: 'Standard GST 18%',
    rateBp: 1800, // 18.00%
    appliesTo: 'ALL',
    productTypes: null,
    productIds: null,
    validFrom: new Date('2026-01-01T00:00:00Z'),
    validTo: null,
    priority: 10,
    active: true,
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
  },
  {
    id: 'tax_01jk9gst050000000000002',
    name: 'Hardware Concessional GST 5%',
    rateBp: 500, // 5.00%
    appliesTo: 'PRODUCT_TYPE',
    productTypes: ['PHYSICAL'],
    productIds: null,
    validFrom: new Date('2026-01-01T00:00:00Z'),
    validTo: null,
    priority: 20,
    active: true,
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
  },
  {
    id: 'tax_01jk9zero00000000000003',
    name: 'Zero-Rated International Export 0%',
    rateBp: 0, // 0.00%
    appliesTo: 'ALL',
    productTypes: null,
    productIds: null,
    validFrom: new Date('2026-01-01T00:00:00Z'),
    validTo: null,
    priority: 5,
    active: false,
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
  },
];

@Injectable()
export class TaxationService {
  private inMemoryRules: TaxRule[] = [...INITIAL_TAX_RULES];

  constructor(
    @Inject(DB_CLIENT)
    private readonly db: any,
  ) {}

  async listTaxRules(activeOnly: boolean = false): Promise<TaxRule[]> {
    try {
      let query = this.db.select().from(taxRules);
      if (activeOnly) {
        query = query.where(eq(taxRules.active, true));
      }
      return await query;
    } catch {
      if (activeOnly) {
        return this.inMemoryRules.filter((r) => r.active);
      }
      return this.inMemoryRules;
    }
  }

  async getTaxRuleById(id: string): Promise<TaxRule> {
    try {
      const rows = await this.db.select().from(taxRules).where(eq(taxRules.id, id)).limit(1);
      if (!rows.length) {
        throw new NotFoundException(`Tax rule ${id} not found`);
      }
      return rows[0];
    } catch (err) {
      if (err instanceof NotFoundException) throw err;
      const found = this.inMemoryRules.find((r) => r.id === id);
      if (!found) {
        throw new NotFoundException(`Tax rule ${id} not found`);
      }
      return found;
    }
  }

  async createTaxRule(dto: CreateTaxRuleDto): Promise<TaxRule> {
    const newId = `tax_${Date.now()}`;
    const now = new Date();

    try {
      const [inserted] = await this.db
        .insert(taxRules)
        .values({
          name: dto.name,
          rateBp: dto.rateBp,
          appliesTo: dto.appliesTo,
          productTypes: dto.productTypes ?? null,
          productIds: dto.productIds ?? null,
          validFrom: dto.validFrom ? new Date(dto.validFrom) : null,
          validTo: dto.validTo ? new Date(dto.validTo) : null,
          priority: dto.priority ?? 10,
          active: dto.active ?? true,
        })
        .returning();
      return inserted;
    } catch {
      const rule: TaxRule = {
        id: newId,
        name: dto.name,
        rateBp: dto.rateBp,
        appliesTo: dto.appliesTo,
        productTypes: dto.productTypes ?? null,
        productIds: dto.productIds ?? null,
        validFrom: dto.validFrom ? new Date(dto.validFrom) : null,
        validTo: dto.validTo ? new Date(dto.validTo) : null,
        priority: dto.priority ?? 10,
        active: dto.active ?? true,
        createdAt: now,
        updatedAt: now,
      };
      this.inMemoryRules.push(rule);
      return rule;
    }
  }

  async updateTaxRule(id: string, dto: UpdateTaxRuleDto): Promise<TaxRule> {
    try {
      const [updated] = await this.db
        .update(taxRules)
        .set({
          ...dto,
          validFrom: dto.validFrom ? new Date(dto.validFrom) : undefined,
          validTo: dto.validTo ? new Date(dto.validTo) : undefined,
          updatedAt: new Date(),
        })
        .where(eq(taxRules.id, id))
        .returning();
      if (!updated) {
        throw new NotFoundException(`Tax rule ${id} not found`);
      }
      return updated;
    } catch (err) {
      if (err instanceof NotFoundException) throw err;
      const idx = this.inMemoryRules.findIndex((r) => r.id === id);
      if (idx === -1) {
        throw new NotFoundException(`Tax rule ${id} not found`);
      }
      this.inMemoryRules[idx] = {
        ...this.inMemoryRules[idx],
        ...dto,
        validFrom: dto.validFrom ? new Date(dto.validFrom) : this.inMemoryRules[idx].validFrom,
        validTo: dto.validTo ? new Date(dto.validTo) : this.inMemoryRules[idx].validTo,
        updatedAt: new Date(),
      };
      return this.inMemoryRules[idx];
    }
  }

  async calculateTaxForLine(line: TaxableLine, asOfDate: Date = new Date()): Promise<LineTaxResult> {
    const rules = await this.listTaxRules(true);
    const domainRules: TaxRuleDefinition[] = rules.map((r) => ({
      id: r.id,
      name: r.name,
      rateBp: r.rateBp,
      appliesTo: r.appliesTo,
      productTypes: r.productTypes,
      productIds: r.productIds,
      validFrom: r.validFrom,
      validTo: r.validTo,
      priority: r.priority,
      active: r.active,
    }));

    return calculateLineTax(line, domainRules, asOfDate);
  }

  async calculateTaxForMultipleLines(
    lines: TaxableLine[],
    asOfDate: Date = new Date(),
  ): Promise<{ lines: LineTaxResult[]; grandSubtotal: number; grandTax: number; grandTotal: number }> {
    const rules = await this.listTaxRules(true);
    const domainRules: TaxRuleDefinition[] = rules.map((r) => ({
      id: r.id,
      name: r.name,
      rateBp: r.rateBp,
      appliesTo: r.appliesTo,
      productTypes: r.productTypes,
      productIds: r.productIds,
      validFrom: r.validFrom,
      validTo: r.validTo,
      priority: r.priority,
      active: r.active,
    }));

    return calculateMultipleLinesTax(lines, domainRules, asOfDate);
  }
}
