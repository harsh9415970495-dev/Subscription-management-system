import { Injectable } from '@nestjs/common';
import { CatalogService } from './catalog.service';
import { Product, ProductVariant } from '../infrastructure/schema';
import { EffectivePriceResult } from '../domain/product-pricing';

export interface ProductPriceDto {
  productId: string;
  variantId?: string | null;
  basePrice: number;
  extraPrice: number;
  effectiveUnitPrice: number;
  name: string;
}

@Injectable()
export class CatalogFacade {
  constructor(private readonly catalogService: CatalogService) {}

  async getEffectivePrice(
    productId: string,
    variantId?: string,
    quantity: number = 1,
  ): Promise<EffectivePriceResult> {
    return this.catalogService.getEffectivePrice(productId, variantId, quantity);
  }

  async getProduct(id: string): Promise<Product & { variants: ProductVariant[] }> {
    return this.catalogService.getProductById(id);
  }

  async listActiveProducts(): Promise<(Product & { variants: ProductVariant[] })[]> {
    return this.catalogService.listProducts(true);
  }
}
