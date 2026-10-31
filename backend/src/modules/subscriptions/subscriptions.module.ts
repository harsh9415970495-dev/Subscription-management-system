import { Module } from '@nestjs/common';
import { SubscriptionsFacade } from './application/subscriptions.facade';

@Module({
  providers: [SubscriptionsFacade],
  exports: [SubscriptionsFacade],
})
export class SubscriptionsModule {}
