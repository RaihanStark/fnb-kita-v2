import { pgTable, uuid, timestamp, integer, text, jsonb, boolean, date, uniqueIndex } from 'drizzle-orm/pg-core';
import { users } from './users';

export const openingProcedures = pgTable('opening_procedures', {
  id: uuid('id').defaultRandom().primaryKey(),
  createdByUserId: uuid('created_by_user_id').references(() => users.id), // Who started it (nullable for migration)
  userId: uuid('user_id').references(() => users.id), // Keep for backward compatibility, will be removed later
  date: date('date').notNull(), // Date of the opening (YYYY-MM-DD)
  currentStep: integer('current_step').notNull().default(1),
  completed: boolean('completed').notNull().default(false),
  stepData: jsonb('step_data').notNull().default({}),
  
  // Step completion timestamps
  step1CompletedAt: timestamp('step1_completed_at'),
  step2CompletedAt: timestamp('step2_completed_at'),
  step3CompletedAt: timestamp('step3_completed_at'),
  step4CompletedAt: timestamp('step4_completed_at'),
  step5CompletedAt: timestamp('step5_completed_at'),
  
  completedAt: timestamp('completed_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => {
  return {
    // Changed: Now only one opening per day for the entire store
    dateUnique: uniqueIndex('opening_procedures_date_idx').on(table.date),
  };
});

// Type for step data
export type StepData = {
  // Step 1: Hygiene
  step1?: {
    handWashing: boolean;
    areaClean: boolean;
    utensilsClean: boolean;
    pestFree: boolean;
    notes: string;
    completedAt: string;
    completedBy?: { userId: string; userName: string; }; // Track who completed
  };
  
  // Step 2: Stock Count
  step2?: {
    stockItems: Array<{
      id: string;
      name: string;
      variant: string;
      frozenCount: number;
      readyCount: number;
      damagedCount: number;
      notes: string;
    }>;
    generalNotes: string;
    totalCount: number;
    completedAt: string;
    completedBy?: { userId: string; userName: string; };
  };
  
  // Step 3: Display Prep
  step3?: {
    arranged: boolean;
    labeled: boolean;
    temperatureChecked: boolean;
    coverReady: boolean;
    notes: string;
    completedAt: string;
    completedBy?: { userId: string; userName: string; };
  };
  
  // Step 4: Cash Setup
  step4?: {
    denominations: Array<{
      value: number;
      count: number;
      label: string;
    }>;
    totalCash: number;
    completedAt: string;
    completedBy?: { userId: string; userName: string; };
  };
  
  // Step 5: Final Checklist
  step5?: {
    salesBookReady: boolean;
    priceListVisible: boolean;
    packagingReady: boolean;
    mobilePaymentReady: boolean;
    personalReady: boolean;
    additionalNotes: string;
    completedAt: string;
    allStepsCompleted: boolean;
    completedBy?: { userId: string; userName: string; };
  };
};