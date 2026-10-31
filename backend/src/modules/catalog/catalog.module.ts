import { Module } from '@nestjs/common';
import { CatalogFacade } from './application/catalog.facade';
import { CatalogService } from './application/catalog.service';
import { ProductsController } from './api/products.controller';

@Module({
  controllers: [ProductsController],
  providers: [CatalogService, CatalogFacade],
  exports: [CatalogFacade],
})
export class CatalogModule {}
