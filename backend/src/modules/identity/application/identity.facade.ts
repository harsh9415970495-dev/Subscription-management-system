import { Inject, Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { DB_CLIENT } from '../../../shared/database/database.provider';
import { users } from '../infrastructure/schema';

export interface UserSummaryDto {
  id: string;
  email: string;
  role: 'ADMIN' | 'STAFF' | 'CUSTOMER';
  status: string;
  customerId?: string | null;
}

@Injectable()
export class IdentityFacade {
  constructor(
    @Inject(DB_CLIENT) private readonly db: PostgresJsDatabase,
  ) {}

  async findUserById(userId: string): Promise<UserSummaryDto | null> {
    const [user] = await this.db
      .select({
        id: users.id,
        email: users.email,
        role: users.role,
        status: users.status,
        customerId: users.customerId,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) return null;
    return {
      id: user.id,
      email: user.email,
      role: user.role as 'ADMIN' | 'STAFF' | 'CUSTOMER',
      status: user.status,
      customerId: user.customerId,
    };
  }

  async findUserByEmail(email: string): Promise<UserSummaryDto | null> {
    const [user] = await this.db
      .select({
        id: users.id,
        email: users.email,
        role: users.role,
        status: users.status,
        customerId: users.customerId,
      })
      .from(users)
      .where(eq(users.email, email.trim().toLowerCase()))
      .limit(1);

    if (!user) return null;
    return {
      id: user.id,
      email: user.email,
      role: user.role as 'ADMIN' | 'STAFF' | 'CUSTOMER',
      status: user.status,
      customerId: user.customerId,
    };
  }
}
