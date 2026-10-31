import { Module } from '@nestjs/common';
import { PlansFacade } from './application/plans.facade';
import { PlansService } from './application/plans.service';
import { PlansController } from './api/plans.controller';

@Module({
  controllers: [PlansController],
  providers: [PlansService, PlansFacade],
  exports: [PlansFacade, PlansService],
})
export class PlansModule {}
