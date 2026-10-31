import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { eq, and } from 'drizzle-orm';
import { DB_CLIENT } from '../../../shared/database/database.provider';
import { products, productVariants, Product, ProductVariant } from '../infrastructure/schema';
import { calculateEffectiveProductPrice, EffectivePriceResult } from '../domain/product-pricing';

export interface CreateProductDto {
  name: string;
  type: 'SERVICE' | 'SOFTWARE' | 'ADD_ON' | 'PHYSICAL';
  salesPrice: number; // in paise
  costPrice?: number;
  notes?: string;
  active?: boolean;
}

export interface UpdateProductDto {
  name?: string;
  type?: 'SERVICE' | 'SOFTWARE' | 'ADD_ON' | 'PHYSICAL';
  salesPrice?: number;
  costPrice?: number;
  notes?: string;
  active?: boolean;
}

export interface CreateVariantDto {
  attribute: string;
  value: string;
  extraPrice: number; // in paise
  active?: boolean;
}

export interface UpdateVariantDto {
  attribute?: string;
  value?: string;
  extraPrice?: number;
  active?: boolean;
}

// In-memory seed store for local development / testing
const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'prod_01jk9erp000000000000001',
    name: 'Cloud ERP Software Suite',
    type: 'SOFTWARE',
    salesPrice: 200000, // 2000 INR
    costPrice: 80000,
    notes: 'Primary modular cloud ERP license',
    active: true,
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
  },
  {
    id: 'prod_01jk9sup000000000000002',
    name: '24/7 Priority SLA Technical Support',
    type: 'SERVICE',
    salesPrice: 150000, // 1500 INR
    costPrice: 50000,
    notes: 'Guaranteed 1-hour response time SLA',
    active: true,
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
  },
  {
    id: 'prod_01jk9addon0000000000003',
    name: 'Dedicated IPv4 & Managed SSL Certificate',
    type: 'ADD_ON',
    salesPrice: 30000, // 300 INR
    costPrice: 10000,
    notes: 'Static dedicated network allocation',
    active: true,
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
  },
  {
    id: 'prod_01jk9hw0000000000000004',
    name: 'Hardware FIDO2 Security Token',
    type: 'PHYSICAL',
    salesPrice: 250000, // 2500 INR
    costPrice: 120000,
    notes: 'Physical cryptographic USB-C authentication key',
    active: true,
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
  },
];

const INITIAL_VARIANTS: ProductVariant[] = [
  {
    id: 'var_01jk9odoo00000000000001',
    productId: 'prod_01jk9erp000000000000001',
    attribute: 'Brand',
    value: 'Odoo',
    extraPrice: 56000, // +560 INR (2000 + 560 = 2560 INR)
    active: true,
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
  },
  {
    id: 'var_01jk9custom0000000000002',
    productId: 'prod_01jk9erp000000000000001',
    attribute: 'Brand',
    value: 'BrightCustom',
    extraPrice: 0,
    active: true,
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
  },
];

@Injectable()
export class CatalogService {
  private inMemoryProducts = [...INITIAL_PRODUCTS];
  private inMemoryVariants = [...INITIAL_VARIANTS];

  constructor(
    @Inject(DB_CLIENT)
    private readonly db: any,
  ) {}

  async listProducts(activeOnly: boolean = false, type?: string): Promise<(Product & { variants: ProductVariant[] })[]> {
    try {
      let query = this.db.select().from(products);
      if (activeOnly) {
        query = query.where(eq(products.active, true));
      }
      const dbProducts: Product[] = await query;
      const dbVariants: ProductVariant[] = await this.db.select().from(productVariants);

      let result = dbProducts.map((p: Product) => ({
        ...p,
        variants: dbVariants.filter((v: ProductVariant) => v.productId === p.id),
      }));

      if (type) {
        result = result.filter((p: Product) => p.type === type);
      }
      return result;
    } catch {
      let res = this.inMemoryProducts.map((p) => ({
        ...p,
        variants: this.inMemoryVariants.filter((v) => v.productId === p.id),
      }));
      if (activeOnly) {
        res = res.filter((p) => p.active);
      }
      if (type) {
        res = res.filter((p) => p.type === type);
      }
      return res;
    }
  }

  async getProductById(id: string): Promise<Product & { variants: ProductVariant[] }> {
    try {
      const rows = await this.db.select().from(products).where(eq(products.id, id)).limit(1);
      if (!rows.length) {
        throw new NotFoundException(`Product ${id} not found`);
      }
      const vars = await this.db.select().from(productVariants).where(eq(productVariants.productId, id));
      return { ...rows[0], variants: vars };
    } catch (err) {
      if (err instanceof NotFoundException) throw err;
      const found = this.inMemoryProducts.find((p) => p.id === id);
      if (!found) {
        throw new NotFoundException(`Product ${id} not found`);
      }
      return {
        ...found,
        variants: this.inMemoryVariants.filter((v) => v.productId === id),
      };
    }
  }

  async createProduct(dto: CreateProductDto): Promise<Product> {
    const newId = `prod_${Date.now()}`;
    const now = new Date();

    try {
      const [inserted] = await this.db
        .insert(products)
        .values({
          name: dto.name,
          type: dto.type,
          salesPrice: dto.salesPrice,
          costPrice: dto.costPrice ?? 0,
          notes: dto.notes,
          active: dto.active ?? true,
        })
        .returning();
      return inserted;
    } catch {
      const item: Product = {
        id: newId,
        name: dto.name,
        type: dto.type,
        salesPrice: dto.salesPrice,
        costPrice: dto.costPrice ?? 0,
        notes: dto.notes ?? null,
        active: dto.active ?? true,
        createdAt: now,
        updatedAt: now,
      };
      this.inMemoryProducts.push(item);
      return item;
    }
  }

  async updateProduct(id: string, dto: UpdateProductDto): Promise<Product> {
    try {
      const [updated] = await this.db
        .update(products)
        .set({
          ...dto,
          updatedAt: new Date(),
        })
        .where(eq(products.id, id))
        .returning();
      if (!updated) {
        throw new NotFoundException(`Product ${id} not found`);
      }
      return updated;
    } catch (err) {
      if (err instanceof NotFoundException) throw err;
      const index = this.inMemoryProducts.findIndex((p) => p.id === id);
      if (index === -1) {
        throw new NotFoundException(`Product ${id} not found`);
      }
      this.inMemoryProducts[index] = {
        ...this.inMemoryProducts[index],
        ...dto,
        updatedAt: new Date(),
      };
      return this.inMemoryProducts[index];
    }
  }

  async createVariant(productId: string, dto: CreateVariantDto): Promise<ProductVariant> {
    await this.getProductById(productId);
    const newId = `var_${Date.now()}`;
    const now = new Date();

    try {
      const [inserted] = await this.db
        .insert(productVariants)
        .values({
          productId,
          attribute: dto.attribute,
          value: dto.value,
          extraPrice: dto.extraPrice,
          active: dto.active ?? true,
        })
        .returning();
      return inserted;
    } catch {
      const item: ProductVariant = {
        id: newId,
        productId,
        attribute: dto.attribute,
        value: dto.value,
        extraPrice: dto.extraPrice,
        active: dto.active ?? true,
        createdAt: now,
        updatedAt: now,
      };
      this.inMemoryVariants.push(item);
      return item;
    }
  }

  async getEffectivePrice(
    productId: string,
    variantId?: string,
    quantity: number = 1,
  ): Promise<EffectivePriceResult> {
    const product = await this.getProductById(productId);
    let variant: ProductVariant | null = null;

    if (variantId) {
      variant = product.variants.find((v) => v.id === variantId) || null;
      if (!variant) {
        throw new NotFoundException(`Variant ${variantId} not found on product ${productId}`);
      }
    }

    return calculateEffectiveProductPrice(product, variant, quantity);
  }
}
