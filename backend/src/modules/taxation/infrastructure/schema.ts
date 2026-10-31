import { pgSchema, text, integer, boolean, timestamp, uuid, jsonb } from 'drizzle-orm/pg-core';

export const taxationSchema = pgSchema('taxation');

export const taxRules = taxationSchema.table('tax_rules', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(), // e.g. 'GST 18%', 'Zero Tax'
  rateBp: integer('rate_bp').notNull(), // Basis points: 1800 bp = 18.00%, 500 = 5.00%
  appliesTo: text('applies_to').notNull().default('ALL'), // 'ALL' | 'PRODUCT_TYPE' | 'SPECIFIC_PRODUCTS'
  productTypes: jsonb('product_types').$type<string[]>(), // e.g. ['SERVICE', 'SOFTWARE']
  productIds: jsonb('product_ids').$type<string[]>(), // e.g. ['uuid1', 'uuid2']
  validFrom: timestamp('valid_from', { withTimezone: true }),
  validTo: timestamp('valid_to', { withTimezone: true }),
  priority: integer('priority').notNull().default(10),
  active: boolean('active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export type TaxRule = typeof taxRules.$inferSelect;
export type NewTaxRule = typeof taxRules.$inferInsert;
