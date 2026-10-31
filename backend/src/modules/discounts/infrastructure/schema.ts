import { pgSchema, text, integer, boolean, timestamp, uuid, uniqueIndex } from 'drizzle-orm/pg-core';

export const discountsSchema = pgSchema('discounts');

export const discounts = discountsSchema.table('discounts', {
  id: uuid('id').defaultRandom().primaryKey(),
  code: text('code').notNull().unique(), // e.g. 'WELCOME10', 'FLAT500'
  type: text('type').notNull(), // 'PERCENTAGE' | 'FIXED'
  value: integer('value').notNull(), // Basis points for % (1000 = 10%) or minor units (paise) for FIXED
  minPurchaseAmount: integer('min_purchase_amount').notNull().default(0), // in paise
  minQuantity: integer('min_quantity').notNull().default(1),
  startDate: timestamp('start_date', { withTimezone: true }),
  endDate: timestamp('end_date', { withTimezone: true }),
  usageLimit: integer('usage_limit'),
  usedCount: integer('used_count').notNull().default(0),
  scope: text('scope').notNull().default('PRODUCTS'), // 'PRODUCTS' | 'SUBSCRIPTIONS'
  active: boolean('active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const discountTargets = discountsSchema.table('discount_targets', {
  id: uuid('id').defaultRandom().primaryKey(),
  discountId: uuid('discount_id')
    .notNull()
    .references(() => discounts.id, { onDelete: 'cascade' }),
  targetId: text('target_id').notNull(), // productId or subscriptionId
});

export const redemptions = discountsSchema.table(
  'redemptions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    discountId: uuid('discount_id')
      .notNull()
      .references(() => discounts.id, { onDelete: 'cascade' }),
    invoiceId: uuid('invoice_id').notNull(),
    amount: integer('amount').notNull(), // in paise
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('redemptions_discount_invoice_idx').on(table.discountId, table.invoiceId),
  ],
);

export type Discount = typeof discounts.$inferSelect;
export type NewDiscount = typeof discounts.$inferInsert;
export type DiscountTarget = typeof discountTargets.$inferSelect;
export type Redemption = typeof redemptions.$inferSelect;
