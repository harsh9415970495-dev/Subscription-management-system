import { Module } from '@nestjs/common';
import { BillingFacade } from './application/billing.facade';

@Module({
  providers: [BillingFacade],
  exports: [BillingFacade],
})
export class BillingModule {}
