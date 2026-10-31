import { Injectable } from '@nestjs/common';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';

export interface InvoiceSummaryDto {
  id: string;
  invoiceNumber?: string | null;
  totalPaise: bigint;
  amountDuePaise: bigint;
  status: 'DRAFT' | 'CONFIRMED' | 'PAID' | 'CANCELLED';
}

@Injectable()
export class BillingFacade {
  async getInvoiceById(id: string): Promise<InvoiceSummaryDto | null> {
    return null;
  }

  async applyPayment(tx: PostgresJsDatabase, invoiceId: string, paymentAmountPaise: bigint): Promise<void> {
    // Scaffolded for Phase 6
  }
}
