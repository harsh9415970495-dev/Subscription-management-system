import { Injectable } from '@nestjs/common';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';

export interface DueSubscriptionDto {
  id: string;
  customerId: string;
  planId: string;
  nextBillingDate: Date;
  lines: Array<{
    productId: string;
    variantId?: string;
    quantity: number;
    unitPricePaise: bigint;
  }>;
}

@Injectable()
export class SubscriptionsFacade {
  async getDueSubscriptions(asOfDate: Date, limit: number): Promise<DueSubscriptionDto[]> {
    return [];
  }

  async advanceBillingDate(tx: PostgresJsDatabase, subscriptionId: string, nextDate: Date): Promise<void> {
    // Scaffolded for Phase 5
  }
}
