import { Injectable } from '@nestjs/common';

export interface ProductPriceDto {
  productId: string;
  variantId?: string;
  unitPricePaise: bigint;
  name: string;
}

@Injectable()
export class CatalogFacade {
  async getEffectivePrice(productId: string, variantId?: string): Promise<ProductPriceDto | null> {
    return null;
  }
}
