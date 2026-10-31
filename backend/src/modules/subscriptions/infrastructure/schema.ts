import { pgSchema, text, integer, boolean, timestamp, uuid } from 'drizzle-orm/pg-core';

export const subscriptionsSchema = pgSchema('subscriptions');

export const paymentTerms = subscriptionsSchema.table('payment_terms', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(), // e.g. 'Immediate', 'Net 15', 'Net 30'
  days: integer('days').notNull().default(0), // days until due
  isDefault: boolean('is_default').notNull().default(false),
  active: boolean('active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export type PaymentTerm = typeof paymentTerms.$inferSelect;
export type NewPaymentTerm = typeof paymentTerms.$inferInsert;
