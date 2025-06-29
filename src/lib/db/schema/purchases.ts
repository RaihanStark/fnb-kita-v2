import { pgTable, uuid, varchar, decimal, timestamp, text } from 'drizzle-orm/pg-core'
import { stocks } from './stocks'

export const purchases = pgTable('purchases', {
  id: uuid('id').defaultRandom().primaryKey(),
  purchaseDate: timestamp('purchase_date').notNull().defaultNow(),
  supplier: varchar('supplier', { length: 255 }).notNull(),
  totalAmount: decimal('total_amount', { precision: 10, scale: 2 }).notNull().default('0'),
  notes: text('notes'),
  createdBy: uuid('created_by').notNull(), // User ID who created this
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const purchaseItems = pgTable('purchase_items', {
  id: uuid('id').defaultRandom().primaryKey(),
  purchaseId: uuid('purchase_id').notNull().references(() => purchases.id, { onDelete: 'cascade' }),
  stockId: uuid('stock_id').notNull().references(() => stocks.id),
  quantity: decimal('quantity', { precision: 10, scale: 2 }).notNull(),
  pricePerUnit: decimal('price_per_unit', { precision: 10, scale: 2 }).notNull(),
  subtotal: decimal('subtotal', { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export type Purchase = typeof purchases.$inferSelect
export type NewPurchase = typeof purchases.$inferInsert
export type PurchaseItem = typeof purchaseItems.$inferSelect
export type NewPurchaseItem = typeof purchaseItems.$inferInsert