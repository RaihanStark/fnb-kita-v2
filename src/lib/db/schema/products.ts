import { pgTable, uuid, varchar, decimal, boolean, timestamp, uniqueIndex } from 'drizzle-orm/pg-core'

export const products = pgTable('products', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  variant: varchar('variant', { length: 255 }).notNull(),
  price: decimal('price', { precision: 10, scale: 2 }).notNull(),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => {
  return {
    nameVariantUnique: uniqueIndex('products_name_variant_idx').on(table.name, table.variant),
  }
})

export type Product = typeof products.$inferSelect
export type NewProduct = typeof products.$inferInsert