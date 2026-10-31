import { Injectable } from '@nestjs/common';
import { TaxationService } from './taxation.service';
import { LineTaxResult, TaxableLine } from '../domain/tax-calculator';
import { TaxRule } from '../infrastructure/schema';

export interface TaxCalculationResult {
  taxName: string;
  rateBp: number;
  amountPaise: number;
}

@Injectable()
export class TaxationFacade {
  constructor(private readonly taxationService: TaxationService) {}

  async calculateTaxForLine(
    amountPaise: number,
    productId?: string,
    productType?: string,
    asOfDate?: Date,
  ): Promise<LineTaxResult> {
    const line: TaxableLine = {
      amount: amountPaise,
      productId,
      productType,
    };
    return this.taxationService.calculateTaxForLine(line, asOfDate);
  }

  async calculateTaxesForMultipleLines(
    lines: TaxableLine[],
    asOfDate?: Date,
  ): Promise<{ lines: LineTaxResult[]; grandSubtotal: number; grandTax: number; grandTotal: number }> {
    return this.taxationService.calculateTaxForMultipleLines(lines, asOfDate);
  }

  async listActiveRules(): Promise<TaxRule[]> {
    return this.taxationService.listTaxRules(true);
  }
}
