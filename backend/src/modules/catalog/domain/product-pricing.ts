export interface ProductPricingEntity {
  id: string;
  name: string;
  salesPrice: number; // in minor units / paise
  costPrice?: number;
}

export interface VariantPricingEntity {
  id: string;
  productId: string;
  attribute: string;
  value: string;
  extraPrice: number; // in minor units / paise
}

export interface EffectivePriceResult {
  productId: string;
  variantId?: string | null;
  basePrice: number; // in minor units / paise
  extraPrice: number; // in minor units / paise
  effectiveUnitPrice: number; // in minor units / paise
  quantity: number;
  subtotal: number; // in minor units / paise
}

/**
 * Calculates effective unit price and subtotal for a product and optional variant.
 * Invariant: integer minor units only, zero floats.
 */
export function calculateEffectiveProductPrice(
  product: ProductPricingEntity,
  variant?: VariantPricingEntity | null,
  quantity: number = 1,
): EffectivePriceResult {
  if (quantity < 0) {
    throw new Error('Quantity cannot be negative');
  }

  const basePrice = product.salesPrice;
  const extraPrice = variant ? variant.extraPrice : 0;
  const effectiveUnitPrice = basePrice + extraPrice;
  const subtotal = effectiveUnitPrice * quantity;

  return {
    productId: product.id,
    variantId: variant ? variant.id : null,
    basePrice,
    extraPrice,
    effectiveUnitPrice,
    quantity,
    subtotal,
  };
}
