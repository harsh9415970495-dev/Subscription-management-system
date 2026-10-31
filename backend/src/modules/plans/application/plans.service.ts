import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { DB_CLIENT } from '../../../shared/database/database.provider';
import { plans, Plan } from '../infrastructure/schema';
import { isPlanAvailableOn } from '../domain/plan-availability';

export interface CreatePlanDto {
  name: string;
  price?: number; // base plan recurring fee in paise (default 0)
  billingPeriod: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';
  minQuantity?: number;
  availableFrom?: Date | string;
  availableTo?: Date | string;
  autoCloseOnEnd?: boolean;
  closable?: boolean;
  pausable?: boolean;
  renewable?: boolean;
  active?: boolean;
}

export interface UpdatePlanDto {
  name?: string;
  price?: number;
  billingPeriod?: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';
  minQuantity?: number;
  availableFrom?: Date | string;
  availableTo?: Date | string;
  autoCloseOnEnd?: boolean;
  closable?: boolean;
  pausable?: boolean;
  renewable?: boolean;
  active?: boolean;
}

const INITIAL_PLANS: Plan[] = [
  {
    id: 'plan_01jk9monthly000000000001',
    name: 'Startup Modular ERP Monthly',
    price: 0, // ₹0.00 base fee (line items only per Assumption A-2)
    billingPeriod: 'MONTHLY',
    minQuantity: 1,
    availableFrom: new Date('2026-01-01T00:00:00Z'),
    availableTo: null,
    autoCloseOnEnd: true,
    closable: true,
    pausable: true,
    renewable: true,
    active: true,
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
  },
  {
    id: 'plan_01jk9yearly0000000000002',
    name: 'Enterprise Scale Infrastructure Yearly',
    price: 120000, // ₹1,200.00 base platform fee
    billingPeriod: 'YEARLY',
    minQuantity: 3,
    availableFrom: new Date('2026-01-01T00:00:00Z'),
    availableTo: null,
    autoCloseOnEnd: false,
    closable: true,
    pausable: true,
    renewable: true,
    active: true,
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
  },
  {
    id: 'plan_01jk9weekly0000000000003',
    name: 'Weekly Sprint Dedicated Support',
    price: 25000, // ₹250.00 base fee
    billingPeriod: 'WEEKLY',
    minQuantity: 1,
    availableFrom: new Date('2026-01-01T00:00:00Z'),
    availableTo: null,
    autoCloseOnEnd: true,
    closable: true,
    pausable: false,
    renewable: true,
    active: true,
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
  },
  {
    id: 'plan_01jk9daily00000000000004',
    name: 'Daily Burst Compute Utility',
    price: 5000, // ₹50.00 / day
    billingPeriod: 'DAILY',
    minQuantity: 1,
    availableFrom: new Date('2026-01-01T00:00:00Z'),
    availableTo: null,
    autoCloseOnEnd: true,
    closable: true,
    pausable: false,
    renewable: false,
    active: true,
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
  },
];

@Injectable()
export class PlansService {
  private inMemoryPlans: Plan[] = [...INITIAL_PLANS];

  constructor(
    @Inject(DB_CLIENT)
    private readonly db: any,
  ) {}

  async listPlans(activeOnly: boolean = false): Promise<Plan[]> {
    try {
      let query = this.db.select().from(plans);
      if (activeOnly) {
        query = query.where(eq(plans.active, true));
      }
      return await query;
    } catch {
      if (activeOnly) {
        return this.inMemoryPlans.filter((p) => p.active);
      }
      return this.inMemoryPlans;
    }
  }

  async getPlanById(id: string): Promise<Plan> {
    try {
      const rows = await this.db.select().from(plans).where(eq(plans.id, id)).limit(1);
      if (!rows.length) {
        throw new NotFoundException(`Plan ${id} not found`);
      }
      return rows[0];
    } catch (err) {
      if (err instanceof NotFoundException) throw err;
      const found = this.inMemoryPlans.find((p) => p.id === id);
      if (!found) {
        throw new NotFoundException(`Plan ${id} not found`);
      }
      return found;
    }
  }

  async createPlan(dto: CreatePlanDto): Promise<Plan> {
    const newId = `plan_${Date.now()}`;
    const now = new Date();

    try {
      const [inserted] = await this.db
        .insert(plans)
        .values({
          name: dto.name,
          price: dto.price ?? 0,
          billingPeriod: dto.billingPeriod,
          minQuantity: dto.minQuantity ?? 1,
          availableFrom: dto.availableFrom ? new Date(dto.availableFrom) : null,
          availableTo: dto.availableTo ? new Date(dto.availableTo) : null,
          autoCloseOnEnd: dto.autoCloseOnEnd ?? true,
          closable: dto.closable ?? true,
          pausable: dto.pausable ?? false,
          renewable: dto.renewable ?? true,
          active: dto.active ?? true,
        })
        .returning();
      return inserted;
    } catch {
      const plan: Plan = {
        id: newId,
        name: dto.name,
        price: dto.price ?? 0,
        billingPeriod: dto.billingPeriod,
        minQuantity: dto.minQuantity ?? 1,
        availableFrom: dto.availableFrom ? new Date(dto.availableFrom) : null,
        availableTo: dto.availableTo ? new Date(dto.availableTo) : null,
        autoCloseOnEnd: dto.autoCloseOnEnd ?? true,
        closable: dto.closable ?? true,
        pausable: dto.pausable ?? false,
        renewable: dto.renewable ?? true,
        active: dto.active ?? true,
        createdAt: now,
        updatedAt: now,
      };
      this.inMemoryPlans.push(plan);
      return plan;
    }
  }

  async updatePlan(id: string, dto: UpdatePlanDto): Promise<Plan> {
    try {
      const [updated] = await this.db
        .update(plans)
        .set({
          ...dto,
          availableFrom: dto.availableFrom ? new Date(dto.availableFrom) : undefined,
          availableTo: dto.availableTo ? new Date(dto.availableTo) : undefined,
          updatedAt: new Date(),
        })
        .where(eq(plans.id, id))
        .returning();
      if (!updated) {
        throw new NotFoundException(`Plan ${id} not found`);
      }
      return updated;
    } catch (err) {
      if (err instanceof NotFoundException) throw err;
      const idx = this.inMemoryPlans.findIndex((p) => p.id === id);
      if (idx === -1) {
        throw new NotFoundException(`Plan ${id} not found`);
      }
      this.inMemoryPlans[idx] = {
        ...this.inMemoryPlans[idx],
        ...dto,
        availableFrom: dto.availableFrom ? new Date(dto.availableFrom) : this.inMemoryPlans[idx].availableFrom,
        availableTo: dto.availableTo ? new Date(dto.availableTo) : this.inMemoryPlans[idx].availableTo,
        updatedAt: new Date(),
      };
      return this.inMemoryPlans[idx];
    }
  }

  async isPlanAvailable(id: string, asOfDate: Date = new Date()): Promise<boolean> {
    const plan = await this.getPlanById(id);
    return isPlanAvailableOn(plan, asOfDate);
  }
}
