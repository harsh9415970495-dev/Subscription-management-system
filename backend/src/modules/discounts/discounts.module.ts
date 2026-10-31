import { Module } from '@nestjs/common';
import { DiscountsFacade } from './application/discounts.facade';
import { DiscountsService } from './application/discounts.service';
import { DiscountsController } from './api/discounts.controller';

@Module({
  controllers: [DiscountsController],
  providers: [DiscountsService, DiscountsFacade],
  exports: [DiscountsFacade, DiscountsService],
})
export class DiscountsModule {}
