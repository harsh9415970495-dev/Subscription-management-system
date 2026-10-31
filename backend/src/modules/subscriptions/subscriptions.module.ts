import { Module } from '@nestjs/common';
import { SubscriptionsFacade } from './application/subscriptions.facade';
import { PaymentTermsService } from './application/payment-terms.service';
import { PaymentTermsController } from './api/payment-terms.controller';

@Module({
  controllers: [PaymentTermsController],
  providers: [SubscriptionsFacade, PaymentTermsService],
  exports: [SubscriptionsFacade, PaymentTermsService],
})
export class SubscriptionsModule {}
