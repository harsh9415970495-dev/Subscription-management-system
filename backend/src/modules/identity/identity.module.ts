import { Module } from '@nestjs/common';
import { IdentityFacade } from './application/identity.facade';

@Module({
  providers: [IdentityFacade],
  exports: [IdentityFacade],
})
export class IdentityModule {}
