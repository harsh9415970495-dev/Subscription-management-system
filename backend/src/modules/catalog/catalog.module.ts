import { Module } from '@nestjs/common';
import { CatalogFacade } from './application/catalog.facade';

@Module({
  providers: [CatalogFacade],
  exports: [CatalogFacade],
})
export class CatalogModule {}
