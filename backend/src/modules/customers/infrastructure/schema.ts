import { jsonb, pgSchema, text, timestamp, uuid } from 'drizzle-orm/pg-core';

export const customersSchema = pgSchema('customers');

export interface BillingAddress {
  street?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
}

export const customers = customersSchema.table('customers', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  companyName: text('company_name'),
  phone: text('phone'),
  billingAddress: jsonb('billing_address').$type<BillingAddress>().notNull().default({}),
  taxId: text('tax_id'),
  userId: uuid('user_id'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export type CustomerRow = typeof customers.$inferSelect;
export type NewCustomerRow = typeof customers.$inferInsert;
