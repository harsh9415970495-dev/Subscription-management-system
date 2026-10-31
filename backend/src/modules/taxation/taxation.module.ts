import { Module } from '@nestjs/common';
import { TaxationFacade } from './application/taxation.facade';

@Module({
  providers: [TaxationFacade],
  exports: [TaxationFacade],
})
export class TaxationModule {}
