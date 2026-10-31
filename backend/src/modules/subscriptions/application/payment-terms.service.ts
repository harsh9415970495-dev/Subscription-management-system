import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { DB_CLIENT } from '../../../shared/database/database.provider';
import { paymentTerms, PaymentTerm } from '../infrastructure/schema';

export interface CreatePaymentTermDto {
  name: string;
  days: number;
  isDefault?: boolean;
  active?: boolean;
}

export interface UpdatePaymentTermDto {
  name?: string;
  days?: number;
  isDefault?: boolean;
  active?: boolean;
}

const INITIAL_PAYMENT_TERMS: PaymentTerm[] = [
  {
    id: 'pt_01jk9immediate000000000001',
    name: 'Immediate (Due on receipt)',
    days: 0,
    isDefault: true,
    active: true,
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
  },
  {
    id: 'pt_01jk9net150000000000000002',
    name: 'Net 15 Days',
    days: 15,
    isDefault: false,
    active: true,
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
  },
  {
    id: 'pt_01jk9net300000000000000003',
    name: 'Net 30 Days',
    days: 30,
    isDefault: false,
    active: true,
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
  },
];

@Injectable()
export class PaymentTermsService {
  private inMemoryTerms: PaymentTerm[] = [...INITIAL_PAYMENT_TERMS];

  constructor(
    @Inject(DB_CLIENT)
    private readonly db: any,
  ) {}

  async listPaymentTerms(activeOnly: boolean = false): Promise<PaymentTerm[]> {
    try {
      let query = this.db.select().from(paymentTerms);
      if (activeOnly) {
        query = query.where(eq(paymentTerms.active, true));
      }
      return await query;
    } catch {
      if (activeOnly) {
        return this.inMemoryTerms.filter((pt) => pt.active);
      }
      return this.inMemoryTerms;
    }
  }

  async getPaymentTermById(id: string): Promise<PaymentTerm> {
    try {
      const rows = await this.db.select().from(paymentTerms).where(eq(paymentTerms.id, id)).limit(1);
      if (!rows.length) {
        throw new NotFoundException(`Payment term ${id} not found`);
      }
      return rows[0];
    } catch (err) {
      if (err instanceof NotFoundException) throw err;
      const found = this.inMemoryTerms.find((pt) => pt.id === id);
      if (!found) {
        throw new NotFoundException(`Payment term ${id} not found`);
      }
      return found;
    }
  }

  async createPaymentTerm(dto: CreatePaymentTermDto): Promise<PaymentTerm> {
    const newId = `pt_${Date.now()}`;
    const now = new Date();

    try {
      const [inserted] = await this.db
        .insert(paymentTerms)
        .values({
          name: dto.name,
          days: dto.days,
          isDefault: dto.isDefault ?? false,
          active: dto.active ?? true,
        })
        .returning();
      return inserted;
    } catch {
      const term: PaymentTerm = {
        id: newId,
        name: dto.name,
        days: dto.days,
        isDefault: dto.isDefault ?? false,
        active: dto.active ?? true,
        createdAt: now,
        updatedAt: now,
      };
      this.inMemoryTerms.push(term);
      return term;
    }
  }

  async updatePaymentTerm(id: string, dto: UpdatePaymentTermDto): Promise<PaymentTerm> {
    try {
      const [updated] = await this.db
        .update(paymentTerms)
        .set({
          ...dto,
          updatedAt: new Date(),
        })
        .where(eq(paymentTerms.id, id))
        .returning();
      if (!updated) {
        throw new NotFoundException(`Payment term ${id} not found`);
      }
      return updated;
    } catch (err) {
      if (err instanceof NotFoundException) throw err;
      const idx = this.inMemoryTerms.findIndex((pt) => pt.id === id);
      if (idx === -1) {
        throw new NotFoundException(`Payment term ${id} not found`);
      }
      this.inMemoryTerms[idx] = {
        ...this.inMemoryTerms[idx],
        ...dto,
        updatedAt: new Date(),
      };
      return this.inMemoryTerms[idx];
    }
  }
}
