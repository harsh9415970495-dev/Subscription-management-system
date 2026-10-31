import { Module } from '@nestjs/common';
import { DiscountsFacade } from './application/discounts.facade';

@Module({
  providers: [DiscountsFacade],
  exports: [DiscountsFacade],
})
export class DiscountsModule {}
