import { Injectable } from '@nestjs/common';

export interface TaxCalculationResult {
  taxName: string;
  rateBp: number;
  amountPaise: bigint;
}

@Injectable()
export class TaxationFacade {
  async calculateTaxes(amountPaise: bigint, productId: string): Promise<TaxCalculationResult[]> {
    return [];
  }
}
