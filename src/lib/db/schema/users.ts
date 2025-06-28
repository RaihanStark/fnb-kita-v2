import { pgTable, uuid, varchar, timestamp, decimal, jsonb, pgEnum } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';

// Enums
export const userRoleEnum = pgEnum('user_role', ['Manager', 'Employee']);
export const userStatusEnum = pgEnum('user_status', ['active', 'inactive', 'suspended']);
export const salaryFrequencyEnum = pgEnum('salary_frequency', ['daily', 'weekly', 'monthly']);
export const registrationStatusEnum = pgEnum('registration_status', ['invited', 'registered']);

// Users table
export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: varchar('email', { length: 255 }).unique().notNull(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  displayName: varchar('display_name', { length: 255 }),
  
  // Profile fields (from Firebase extended profile)
  nama: varchar('nama', { length: 255 }),
  kontak: varchar('kontak', { length: 50 }),
  posisi: varchar('posisi', { length: 100 }),
  departemen: varchar('departemen', { length: 100 }),
  
  // Role and status
  role: userRoleEnum('role').notNull().default('Employee'),
  status: userStatusEnum('status').notNull().default('active'),
  tanggalMasuk: timestamp('tanggal_masuk'),
  registrationStatus: registrationStatusEnum('registration_status').notNull().default('registered'),
  
  // Salary information
  salaryAmount: decimal('salary_amount', { precision: 12, scale: 2 }),
  salaryFrequency: salaryFrequencyEnum('salary_frequency').default('monthly'),
  
  // Reimbursement limits (stored as JSONB)
  // Format: { makan: { limit: 500000, digunakan: 100000 }, transport: { limit: 300000, digunakan: 50000 } }
  limitReimbursement: jsonb('limit_reimbursement').$type<Record<string, { limit: number; digunakan: number }>>(),
  
  // Timestamps
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Type exports
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

// Zod schemas for validation
export const insertUserSchema = createInsertSchema(users, {
  email: z.string().email(),
  passwordHash: z.string().min(6),
  nama: z.string().min(2).optional(),
  kontak: z.string().optional(),
  salaryAmount: z.string().transform((val) => parseFloat(val)).optional(),
});

export const selectUserSchema = createSelectSchema(users);

// Helper type for limit reimbursement
export type LimitReimbursement = Record<string, {
  limit: number;
  digunakan: number;
}>;