import { Module } from '@nestjs/common';
import { ReportingFacade } from './application/reporting.facade';

@Module({
  providers: [ReportingFacade],
  exports: [ReportingFacade],
})
export class ReportingModule {}
