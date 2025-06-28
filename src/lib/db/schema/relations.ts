import { relations } from 'drizzle-orm';
import { users, sessions } from './index';

// User relations
export const usersRelations = relations(users, ({ many }) => ({
  sessions: many(sessions),
}));

// Session relations
export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
}));