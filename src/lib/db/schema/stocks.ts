import { pgTable, uuid, varchar, decimal, integer, timestamp, pgEnum } from 'drizzle-orm/pg-core'

export const stockTypeEnum = pgEnum('stock_type', ['product', 'packaging', 'utilities', 'consumables'])
export const unitTypeEnum = pgEnum('unit_type', ['pcs', 'box', 'kg', 'liter', 'pack'])

export const stocks = pgTable('stocks', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  type: stockTypeEnum('type').notNull(),
  unit: unitTypeEnum('unit').notNull(),
  currentStock: decimal('current_stock', { precision: 10, scale: 2 }).notNull().default('0'),
  minStock: decimal('min_stock', { precision: 10, scale: 2 }).notNull().default('0'),
  costPerUnit: decimal('cost_per_unit', { precision: 10, scale: 2 }),
  notes: varchar('notes', { length: 500 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export type Stock = typeof stocks.$inferSelect
export type NewStock = typeof stocks.$inferInsert