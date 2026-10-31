import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { DB_CLIENT } from '../../../shared/database/database.provider';
import { discounts, discountTargets, redemptions, Discount, DiscountTarget, Redemption } from '../infrastructure/schema';
import {
  evaluateDiscounts,
  DiscountContext,
  DiscountEvaluationResult,
  DiscountRuleDefinition,
} from '../domain/discount-engine';

export interface CreateDiscountDto {
  code: string;
  type: 'PERCENTAGE' | 'FIXED';
  value: number;
  minPurchaseAmount?: number;
  minQuantity?: number;
  startDate?: Date | string;
  endDate?: Date | string;
  usageLimit?: number;
  scope: 'PRODUCTS' | 'SUBSCRIPTIONS';
  targetIds?: string[];
  active?: boolean;
}

export interface UpdateDiscountDto {
  code?: string;
  type?: 'PERCENTAGE' | 'FIXED';
  value?: number;
  minPurchaseAmount?: number;
  minQuantity?: number;
  startDate?: Date | string;
  endDate?: Date | string;
  usageLimit?: number;
  scope?: 'PRODUCTS' | 'SUBSCRIPTIONS';
  targetIds?: string[];
  active?: boolean;
}

const INITIAL_DISCOUNTS: (Discount & { targetIds: string[] })[] = [
  {
    id: 'disc_01jk9welcome100000000001',
    code: 'WELCOME10',
    type: 'PERCENTAGE',
    value: 1000, // 10.00%
    minPurchaseAmount: 0,
    minQuantity: 1,
    startDate: new Date('2026-01-01T00:00:00Z'),
    endDate: null,
    usageLimit: 100,
    usedCount: 12,
    scope: 'SUBSCRIPTIONS',
    active: true,
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
    targetIds: [],
  },
  {
    id: 'disc_01jk9flat500000000000002',
    code: 'FLAT500',
    type: 'FIXED',
    value: 50000, // ₹500.00
    minPurchaseAmount: 200000, // Minimum ₹2,000.00 purchase
    minQuantity: 1,
    startDate: new Date('2026-01-01T00:00:00Z'),
    endDate: null,
    usageLimit: 50,
    usedCount: 18,
    scope: 'SUBSCRIPTIONS',
    active: true,
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
    targetIds: [],
  },
  {
    id: 'disc_01jk9erp2000000000000003',
    code: 'ERP20',
    type: 'PERCENTAGE',
    value: 2000, // 20.00%
    minPurchaseAmount: 0,
    minQuantity: 1,
    startDate: new Date('2026-01-01T00:00:00Z'),
    endDate: null,
    usageLimit: 20,
    usedCount: 5,
    scope: 'PRODUCTS',
    active: true,
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
    targetIds: ['prod_01jk9erp000000000000001'],
  },
];

@Injectable()
export class DiscountsService {
  private inMemoryDiscounts: (Discount & { targetIds: string[] })[] = [...INITIAL_DISCOUNTS];

  constructor(
    @Inject(DB_CLIENT)
    private readonly db: any,
  ) {}

  async listDiscounts(activeOnly: boolean = false): Promise<(Discount & { targetIds: string[] })[]> {
    try {
      let query = this.db.select().from(discounts);
      if (activeOnly) {
        query = query.where(eq(discounts.active, true));
      }
      const dbDiscounts: Discount[] = await query;
      const dbTargets: DiscountTarget[] = await this.db.select().from(discountTargets);

      return dbDiscounts.map((d: Discount) => ({
        ...d,
        targetIds: dbTargets.filter((t: DiscountTarget) => t.discountId === d.id).map((t: DiscountTarget) => t.targetId),
      }));
    } catch {
      if (activeOnly) {
        return this.inMemoryDiscounts.filter((d) => d.active);
      }
      return this.inMemoryDiscounts;
    }
  }

  async getDiscountById(id: string): Promise<Discount & { targetIds: string[] }> {
    try {
      const rows = await this.db.select().from(discounts).where(eq(discounts.id, id)).limit(1);
      if (!rows.length) {
        throw new NotFoundException(`Discount ${id} not found`);
      }
      const targets = await this.db.select().from(discountTargets).where(eq(discountTargets.discountId, id));
      return {
        ...rows[0],
        targetIds: targets.map((t: DiscountTarget) => t.targetId),
      };
    } catch (err) {
      if (err instanceof NotFoundException) throw err;
      const found = this.inMemoryDiscounts.find((d) => d.id === id);
      if (!found) {
        throw new NotFoundException(`Discount ${id} not found`);
      }
      return found;
    }
  }

  async createDiscount(dto: CreateDiscountDto): Promise<Discount & { targetIds: string[] }> {
    const newId = `disc_${Date.now()}`;
    const now = new Date();

    try {
      const [inserted] = await this.db
        .insert(discounts)
        .values({
          code: dto.code.toUpperCase(),
          type: dto.type,
          value: dto.value,
          minPurchaseAmount: dto.minPurchaseAmount ?? 0,
          minQuantity: dto.minQuantity ?? 1,
          startDate: dto.startDate ? new Date(dto.startDate) : null,
          endDate: dto.endDate ? new Date(dto.endDate) : null,
          usageLimit: dto.usageLimit ?? null,
          usedCount: 0,
          scope: dto.scope,
          active: dto.active ?? true,
        })
        .returning();

      if (dto.targetIds && dto.targetIds.length > 0) {
        for (const targetId of dto.targetIds) {
          await this.db.insert(discountTargets).values({
            discountId: inserted.id,
            targetId,
          });
        }
      }

      return {
        ...inserted,
        targetIds: dto.targetIds || [],
      };
    } catch {
      const disc: Discount & { targetIds: string[] } = {
        id: newId,
        code: dto.code.toUpperCase(),
        type: dto.type,
        value: dto.value,
        minPurchaseAmount: dto.minPurchaseAmount ?? 0,
        minQuantity: dto.minQuantity ?? 1,
        startDate: dto.startDate ? new Date(dto.startDate) : null,
        endDate: dto.endDate ? new Date(dto.endDate) : null,
        usageLimit: dto.usageLimit ?? null,
        usedCount: 0,
        scope: dto.scope,
        active: dto.active ?? true,
        createdAt: now,
        updatedAt: now,
        targetIds: dto.targetIds || [],
      };
      this.inMemoryDiscounts.push(disc);
      return disc;
    }
  }

  async updateDiscount(id: string, dto: UpdateDiscountDto): Promise<Discount & { targetIds: string[] }> {
    try {
      const [updated] = await this.db
        .update(discounts)
        .set({
          ...dto,
          code: dto.code ? dto.code.toUpperCase() : undefined,
          startDate: dto.startDate ? new Date(dto.startDate) : undefined,
          endDate: dto.endDate ? new Date(dto.endDate) : undefined,
          updatedAt: new Date(),
        })
        .where(eq(discounts.id, id))
        .returning();
      if (!updated) {
        throw new NotFoundException(`Discount ${id} not found`);
      }
      return {
        ...updated,
        targetIds: dto.targetIds || [],
      };
    } catch (err) {
      if (err instanceof NotFoundException) throw err;
      const idx = this.inMemoryDiscounts.findIndex((d) => d.id === id);
      if (idx === -1) {
        throw new NotFoundException(`Discount ${id} not found`);
      }
      const current = this.inMemoryDiscounts[idx];
      this.inMemoryDiscounts[idx] = {
        ...current,
        ...dto,
        code: dto.code ? dto.code.toUpperCase() : current.code,
        startDate: dto.startDate !== undefined ? (dto.startDate ? new Date(dto.startDate) : null) : current.startDate,
        endDate: dto.endDate !== undefined ? (dto.endDate ? new Date(dto.endDate) : null) : current.endDate,
        targetIds: dto.targetIds !== undefined ? dto.targetIds : current.targetIds,
        updatedAt: new Date(),
      };
      return this.inMemoryDiscounts[idx];
    }
  }

  async evaluateDiscountsForContext(
    context: DiscountContext,
    couponCodes?: string[],
  ): Promise<DiscountEvaluationResult> {
    const allDiscounts = await this.listDiscounts(true);
    let filtered = allDiscounts;
    if (couponCodes && couponCodes.length > 0) {
      const upper = couponCodes.map((c) => c.toUpperCase());
      filtered = allDiscounts.filter((d) => upper.includes(d.code.toUpperCase()));
    }

    const domainRules: DiscountRuleDefinition[] = filtered.map((d) => ({
      id: d.id,
      code: d.code,
      type: d.type as any,
      value: d.value,
      minPurchaseAmount: d.minPurchaseAmount,
      minQuantity: d.minQuantity,
      startDate: d.startDate,
      endDate: d.endDate,
      usageLimit: d.usageLimit,
      usedCount: d.usedCount,
      scope: d.scope as any,
      targetIds: d.targetIds,
      active: d.active,
    }));

    return evaluateDiscounts(context, domainRules);
  }
}
