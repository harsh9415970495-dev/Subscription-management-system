import { pgSchema, text, integer, boolean, timestamp, uuid, uniqueIndex } from 'drizzle-orm/pg-core';

export const catalogSchema = pgSchema('catalog');

export const products = catalogSchema.table('products', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  type: text('type').notNull(), // 'SERVICE' | 'SOFTWARE' | 'ADD_ON' | 'PHYSICAL'
  salesPrice: integer('sales_price').notNull(), // in paise / minor units
  costPrice: integer('cost_price').notNull().default(0),
  notes: text('notes'),
  active: boolean('active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const productVariants = catalogSchema.table(
  'product_variants',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    productId: uuid('product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'cascade' }),
    attribute: text('attribute').notNull(), // e.g. 'Brand'
    value: text('value').notNull(), // e.g. 'Odoo'
    extraPrice: integer('extra_price').notNull().default(0), // in paise / minor units
    active: boolean('active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('product_variants_unique_attr_val_idx').on(
      table.productId,
      table.attribute,
      table.value,
    ),
  ],
);

export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;
export type ProductVariant = typeof productVariants.$inferSelect;
export type NewProductVariant = typeof productVariants.$inferInsert;
