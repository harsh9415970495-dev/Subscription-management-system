import { Module } from '@nestjs/common';
import { TaxationFacade } from './application/taxation.facade';
import { TaxationService } from './application/taxation.service';
import { TaxesController } from './api/taxes.controller';

@Module({
  controllers: [TaxesController],
  providers: [TaxationService, TaxationFacade],
  exports: [TaxationFacade],
})
export class TaxationModule {}
