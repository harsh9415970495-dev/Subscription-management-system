import { Module } from '@nestjs/common';
import { CustomersController } from './api/customers.controller';
import { CustomersFacade } from './application/customers.facade';
import { CustomersService } from './application/customers.service';

@Module({
  controllers: [CustomersController],
  providers: [CustomersService, CustomersFacade],
  exports: [CustomersFacade],
})
export class CustomersModule {}
