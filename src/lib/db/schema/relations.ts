import { relations } from 'drizzle-orm';
import { users, sessions, invitations, reimbursements } from './index';

// User relations
export const usersRelations = relations(users, ({ many }) => ({
  sessions: many(sessions),
  sentInvitations: many(invitations),
  reimbursements: many(reimbursements),
  approvedReimbursements: many(reimbursements, { relationName: 'manager' }),
}));

// Session relations
export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
}));

// Invitation relations
export const invitationsRelations = relations(invitations, ({ one }) => ({
  invitedBy: one(users, {
    fields: [invitations.invitedById],
    references: [users.id],
  }),
}));

// Reimbursement relations
export const reimbursementsRelations = relations(reimbursements, ({ one }) => ({
  employee: one(users, {
    fields: [reimbursements.employeeId],
    references: [users.id],
  }),
  manager: one(users, {
    fields: [reimbursements.managerId],
    references: [users.id],
    relationName: 'manager',
  }),
}));