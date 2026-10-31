import { Injectable } from '@nestjs/common';
import { DiscountsService } from './discounts.service';
import { DiscountContext, DiscountEvaluationResult } from '../domain/discount-engine';
import { Discount } from '../infrastructure/schema';

export interface DiscountApplicationResult {
  discountId: string;
  name: string;
  amountPaise: number;
}

@Injectable()
export class DiscountsFacade {
  constructor(private readonly discountsService: DiscountsService) {}

  async evaluateDiscounts(context: DiscountContext): Promise<DiscountEvaluationResult> {
    return this.discountsService.evaluateDiscountsForContext(context);
  }

  async listActiveDiscounts(): Promise<(Discount & { targetIds: string[] })[]> {
    return this.discountsService.listDiscounts(true);
  }

  async getDiscountById(id: string): Promise<Discount & { targetIds: string[] }> {
    return this.discountsService.getDiscountById(id);
  }
}
