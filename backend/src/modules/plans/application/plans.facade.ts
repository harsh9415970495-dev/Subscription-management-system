import { Injectable } from '@nestjs/common';
import { PlansService } from './plans.service';
import { Plan } from '../infrastructure/schema';

export interface PlanDto {
  id: string;
  name: string;
  pricePaise: number;
  billingPeriod: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';
  minQuantity: number;
  autoCloseOnEnd: boolean;
  closable: boolean;
  pausable: boolean;
  renewable: boolean;
}

@Injectable()
export class PlansFacade {
  constructor(private readonly plansService: PlansService) {}

  async getPlanById(id: string): Promise<Plan> {
    return this.plansService.getPlanById(id);
  }

  async isPlanAvailable(id: string, asOfDate?: Date): Promise<boolean> {
    return this.plansService.isPlanAvailable(id, asOfDate);
  }

  async listActivePlans(): Promise<Plan[]> {
    return this.plansService.listPlans(true);
  }
}
