import { Module } from '@nestjs/common';
import { AuditFacade } from './application/audit.facade';

@Module({
  providers: [AuditFacade],
  exports: [AuditFacade],
})
export class AuditModule {}
