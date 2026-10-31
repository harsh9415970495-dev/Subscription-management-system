import { Module } from '@nestjs/common';
import { CustomersFacade } from './application/customers.facade';

@Module({
  providers: [CustomersFacade],
  exports: [CustomersFacade],
})
export class CustomersModule {}
