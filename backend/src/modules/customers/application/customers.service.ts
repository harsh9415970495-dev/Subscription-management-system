import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { eq, ilike, or } from 'drizzle-orm';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { DB_CLIENT } from '../../../shared/database/database.provider';
import { UpdateCustomerDto } from '../api/dto/customer.dto';
import { customers, CustomerRow } from '../infrastructure/schema';
import { CustomerScope } from './customer-scope';

@Injectable()
export class CustomersService {
  constructor(
    @Inject(DB_CLIENT) private readonly db: PostgresJsDatabase,
  ) {}

  async listCustomers(search?: string): Promise<CustomerRow[]> {
    if (search && search.trim()) {
      const q = `%${search.trim()}%`;
      return await this.db
        .select()
        .from(customers)
        .where(
          or(
            ilike(customers.name, q),
            ilike(customers.companyName, q),
            ilike(customers.phone, q),
          ),
        );
    }

    return await this.db.select().from(customers);
  }

  async getCustomerById(
    targetCustomerId: string,
    callerRole: string,
    callerCustomerId?: string | null,
  ): Promise<CustomerRow> {
    CustomerScope.assertAccess(callerRole, callerCustomerId, targetCustomerId);

    const [found] = await this.db
      .select()
      .from(customers)
      .where(eq(customers.id, targetCustomerId))
      .limit(1);

    if (!found) {
      throw new NotFoundException('Customer resource not found');
    }

    return found;
  }

  async updateCustomer(
    targetCustomerId: string,
    dto: UpdateCustomerDto,
    callerRole: string,
    callerCustomerId?: string | null,
  ): Promise<CustomerRow> {
    CustomerScope.assertAccess(callerRole, callerCustomerId, targetCustomerId);

    const [updated] = await this.db
      .update(customers)
      .set({
        ...dto,
        updatedAt: new Date(),
      })
      .where(eq(customers.id, targetCustomerId))
      .returning();

    if (!updated) {
      throw new NotFoundException('Customer resource not found');
    }

    return updated;
  }
}
