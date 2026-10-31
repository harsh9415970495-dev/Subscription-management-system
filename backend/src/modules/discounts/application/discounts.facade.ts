import { Injectable } from '@nestjs/common';

export interface DiscountApplicationResult {
  discountId: string;
  name: string;
  amountPaise: bigint;
}

@Injectable()
export class DiscountsFacade {
  async evaluateDiscounts(context: unknown): Promise<DiscountApplicationResult[]> {
    return [];
  }
}
