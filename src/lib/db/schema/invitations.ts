import { pgTable, uuid, varchar, timestamp } from 'drizzle-orm/pg-core';
import { users, userRoleEnum } from './users';

// Invitations table
export const invitations = pgTable('invitations', {
  id: uuid('id').defaultRandom().primaryKey(),
  token: varchar('token', { length: 255 }).unique().notNull(),
  email: varchar('email', { length: 255 }).notNull(),
  nama: varchar('nama', { length: 255 }).notNull(),
  role: userRoleEnum('role').notNull().default('Employee'),
  invitedById: uuid('invited_by_id').references(() => users.id).notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  usedAt: timestamp('used_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export type Invitation = typeof invitations.$inferSelect;
export type NewInvitation = typeof invitations.$inferInsert;