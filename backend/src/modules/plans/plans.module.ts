import { Module } from '@nestjs/common';
import { PlansFacade } from './application/plans.facade';

@Module({
  providers: [PlansFacade],
  exports: [PlansFacade],
})
export class PlansModule {}
