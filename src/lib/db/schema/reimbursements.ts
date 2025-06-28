import { pgTable, uuid, varchar, timestamp, decimal, pgEnum } from 'drizzle-orm/pg-core';
import { users } from './users';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';

// Enums
export const expenseTypeEnum = pgEnum('expense_type', ['personal', 'business']);
export const reimbursementStatusEnum = pgEnum('reimbursement_status', ['pending', 'approved', 'denied', 'paid']);

// Reimbursements table
export const reimbursements = pgTable('reimbursements', {
  id: uuid('id').defaultRandom().primaryKey(),
  employeeId: uuid('employee_id').references(() => users.id).notNull(),
  employeeName: varchar('employee_name', { length: 255 }).notNull(),
  amount: decimal('amount', { precision: 12, scale: 2 }).notNull(),
  expenseType: expenseTypeEnum('expense_type').notNull(),
  category: varchar('category', { length: 100 }).notNull(),
  description: varchar('description', { length: 500 }).notNull(),
  receiptUrl: varchar('receipt_url', { length: 500 }),
  status: reimbursementStatusEnum('status').notNull().default('pending'),
  submittedDate: timestamp('submitted_date').defaultNow().notNull(),
  
  // Manager action fields
  managerId: uuid('manager_id').references(() => users.id),
  managerComments: varchar('manager_comments', { length: 500 }),
  managerActionDate: timestamp('manager_action_date'),
  
  // Timestamps
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Type exports
export type Reimbursement = typeof reimbursements.$inferSelect;
export type NewReimbursement = typeof reimbursements.$inferInsert;

// Zod schemas for validation
export const insertReimbursementSchema = createInsertSchema(reimbursements, {
  amount: z.string().transform((val) => parseFloat(val)),
  description: z.string().min(10),
  category: z.string().min(1),
});

export const selectReimbursementSchema = createSelectSchema(reimbursements);