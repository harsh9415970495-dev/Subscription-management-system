import { Module } from '@nestjs/common';
import { PaymentsFacade } from './application/payments.facade';

@Module({
  providers: [PaymentsFacade],
  exports: [PaymentsFacade],
})
export class PaymentsModule {}
