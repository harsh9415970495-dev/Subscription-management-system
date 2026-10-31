import { pgSchema, text, integer, boolean, timestamp, uuid } from 'drizzle-orm/pg-core';

export const plansSchema = pgSchema('plans');

export const plans = plansSchema.table('plans', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  price: integer('price').notNull().default(0), // in minor units / paise (base plan fee)
  billingPeriod: text('billing_period').notNull(), // 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY'
  minQuantity: integer('min_quantity').notNull().default(1),
  availableFrom: timestamp('available_from', { withTimezone: true }),
  availableTo: timestamp('available_to', { withTimezone: true }),
  autoCloseOnEnd: boolean('auto_close_on_end').notNull().default(true),
  closable: boolean('closable').notNull().default(true),
  pausable: boolean('pausable').notNull().default(false),
  renewable: boolean('renewable').notNull().default(true),
  active: boolean('active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export type Plan = typeof plans.$inferSelect;
export type NewPlan = typeof plans.$inferInsert;
