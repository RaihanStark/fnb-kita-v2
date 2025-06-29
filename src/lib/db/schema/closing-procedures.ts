import { pgTable, uuid, timestamp, integer, text, jsonb, boolean, date, uniqueIndex } from 'drizzle-orm/pg-core';
import { users } from './users';

export const closingProcedures = pgTable('closing_procedures', {
  id: uuid('id').defaultRandom().primaryKey(),
  createdByUserId: uuid('created_by_user_id').references(() => users.id),
  date: date('date').notNull(), // Date of the closing (YYYY-MM-DD)
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
    // Only one closing per day for the entire store
    dateUnique: uniqueIndex('closing_procedures_date_idx').on(table.date),
  };
});

// Type for step data
export type ClosingStepData = {
  // Step 1: Cash Reconciliation
  step1?: {
    physicalCash: number;
    digitalAmount: number;
    totalCash: number;
    systemCash: number;
    difference: number;
    denominationCount: Array<{
      value: number;
      count: number;
      label: string;
    }>;
    cashSales: number;
    digitalSales: number;
    notes: string;
    completedAt: string;
    completedBy?: { userId: string; userName: string; };
  };
  
  // Step 2: Final Stock Count
  step2?: {
    stockItems: Array<{
      id: string;
      name: string;
      type: string;
      unit: string;
      openingStock: number;
      currentStock: number;
      soldCount: number;
      damagedCount: number;
      notes: string;
    }>;
    generalNotes: string;
    completedAt: string;
    completedBy?: { userId: string; userName: string; };
  };
  
  // Step 3: Daily Report
  step3?: {
    totalSales: number;
    totalTransactions: number;
    totalPurchases: number;
    totalDamaged: number;
    totalBonus: number;
    grossProfit: number;
    notes: string;
    issues: string;
    completedAt: string;
    completedBy?: { userId: string; userName: string; };
  };
  
  // Step 4: Cleaning & Security
  step4?: {
    equipmentCleaned: boolean;
    areaCleaned: boolean;
    stockStored: boolean;
    equipmentOff: boolean;
    doorLocked: boolean;
    notes: string;
    completedAt: string;
    completedBy?: { userId: string; userName: string; };
  };
  
  // Step 5: Tomorrow Preparation
  step5?: {
    modalPrepared: boolean;
    modalAmount: number;
    stockChecked: boolean;
    needToPurchase: string;
    specialNotes: string;
    completedAt: string;
    allStepsCompleted: boolean;
    completedBy?: { userId: string; userName: string; };
  };
};