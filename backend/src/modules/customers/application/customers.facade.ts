import { Inject, Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { DB_CLIENT } from '../../../shared/database/database.provider';
import { BillingAddress, customers, CustomerRow } from '../infrastructure/schema';

export interface CustomerSummaryDto {
  id: string;
  name: string;
  companyName?: string | null;
  phone?: string | null;
  billingAddress?: BillingAddress | null;
  taxId?: string | null;
  userId?: string | null;
}

export interface CreateCustomerInput {
  name: string;
  companyName?: string;
  phone?: string;
  billingAddress?: BillingAddress;
  taxId?: string;
  userId?: string;
}

@Injectable()
export class CustomersFacade {
  constructor(
    @Inject(DB_CLIENT) private readonly db: PostgresJsDatabase,
  ) {}

  async createCustomer(
    input: CreateCustomerInput,
    tx?: PostgresJsDatabase,
  ): Promise<CustomerSummaryDto> {
    const client = tx || this.db;
    const [inserted] = await client
      .insert(customers)
      .values({
        name: input.name,
        companyName: input.companyName,
        phone: input.phone,
        billingAddress: input.billingAddress || {},
        taxId: input.taxId,
        userId: input.userId,
      })
      .returning();

    return this.mapToDto(inserted);
  }

  async getCustomerById(id: string): Promise<CustomerSummaryDto | null> {
    const [found] = await this.db
      .select()
      .from(customers)
      .where(eq(customers.id, id))
      .limit(1);

    return found ? this.mapToDto(found) : null;
  }

  async getCustomerByUserId(userId: string): Promise<CustomerSummaryDto | null> {
    const [found] = await this.db
      .select()
      .from(customers)
      .where(eq(customers.userId, userId))
      .limit(1);

    return found ? this.mapToDto(found) : null;
  }

  async linkUserToCustomer(
    customerId: string,
    userId: string,
    tx?: PostgresJsDatabase,
  ): Promise<void> {
    const client = tx || this.db;
    await client
      .update(customers)
      .set({ userId, updatedAt: new Date() })
      .where(eq(customers.id, customerId));
  }

  private mapToDto(row: CustomerRow): CustomerSummaryDto {
    return {
      id: row.id,
      name: row.name,
      companyName: row.companyName,
      phone: row.phone,
      billingAddress: row.billingAddress,
      taxId: row.taxId,
      userId: row.userId,
    };
  }
}
