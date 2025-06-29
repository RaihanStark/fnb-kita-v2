import { NextRequest, NextResponse } from 'next/server';
import { getDb, openingProcedures } from '@/lib/db';
import { authenticateUser } from '@/lib/auth/middleware';
import { eq, and } from 'drizzle-orm';
import { getDateInUTC7 } from '@/lib/utils/timezone';

export async function GET(req: NextRequest) {
  try {
    // Verify authentication
    const tokenPayload = await authenticateUser(req);
    if (!tokenPayload) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const db = getDb();
    const today = getDateInUTC7(); // Get YYYY-MM-DD format in UTC+7

    // Check if there's an opening procedure for today (UTC+7 timezone)
    // Now checking for ANY opening today, not user-specific
    const existingOpening = await db
      .select()
      .from(openingProcedures)
      .where(eq(openingProcedures.date, today))
      .limit(1);

    if (existingOpening.length > 0) {
      const opening = existingOpening[0];
      return NextResponse.json({
        success: true,
        hasOpening: true,
        opening: {
          id: opening.id,
          currentStep: opening.currentStep,
          completed: opening.completed,
          stepData: opening.stepData,
          createdAt: opening.createdAt,
        }
      });
    }

    return NextResponse.json({
      success: true,
      hasOpening: false
    });

  } catch (error) {
    console.error('Error checking opening procedure:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to check opening procedure' },
      { status: 500 }
    );
  }
}