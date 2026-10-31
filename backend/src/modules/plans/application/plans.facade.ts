import { Injectable } from '@nestjs/common';

export interface PlanDto {
  id: string;
  name: string;
  pricePaise: bigint;
  billingPeriod: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';
  minQuantity: number;
  autoCloseOnEnd: boolean;
  closable: boolean;
  pausable: boolean;
  renewable: boolean;
}

@Injectable()
export class PlansFacade {
  async getPlanById(id: string): Promise<PlanDto | null> {
    return null;
  }
}
