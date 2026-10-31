import { Injectable } from '@nestjs/common';

export interface PaymentRecordDto {
  id: string;
  invoiceId: string;
  amountPaise: bigint;
  method: 'CASH' | 'BANK_TRANSFER' | 'CARD' | 'UPI' | 'CHEQUE' | 'OTHER';
  paidOn: Date;
}

@Injectable()
export class PaymentsFacade {
  async getPaymentsByInvoiceId(invoiceId: string): Promise<PaymentRecordDto[]> {
    return [];
  }
}
