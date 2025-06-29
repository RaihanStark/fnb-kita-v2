import { pgTable, uuid, timestamp, varchar, decimal, text, jsonb, date, pgEnum } from 'drizzle-orm/pg-core';
import { users } from './users';

// Transaction type enum
export const transactionTypeEnum = pgEnum('transaction_type', ['sales', 'damaged', 'bonus', 'disposal']);

export const transactions = pgTable('transactions', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id),
  type: transactionTypeEnum('type').notNull(),
  items: jsonb('items').notNull().default([]), // Array of TransactionItem
  totalAmount: decimal('total_amount', { precision: 10, scale: 2 }), // NULL for non-sales
  notes: text('notes'),
  date: date('date').notNull(), // Transaction date in YYYY-MM-DD (UTC+7)
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Type definitions
export interface TransactionItem {
  productId: string;
  name: string;
  variant: string;
  quantity: number;
  price?: number; // Price per item (for sales only)
}

export interface Transaction {
  id: string;
  userId: string;
  type: 'sales' | 'damaged' | 'bonus' | 'disposal';
  items: TransactionItem[];
  totalAmount: string | null;
  notes: string | null;
  date: string;
  createdAt: Date;
  updatedAt: Date;
}