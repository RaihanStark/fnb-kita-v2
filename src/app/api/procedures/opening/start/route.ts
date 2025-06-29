import { NextRequest, NextResponse } from 'next/server';
import { getDb, openingProcedures } from '@/lib/db';
import { authenticateUser } from '@/lib/auth/middleware';
import { eq, and } from 'drizzle-orm';
import { getDateInUTC7 } from '@/lib/utils/timezone';

export async function POST(req: NextRequest) {
  try {
    // Verify authentication
    const tokenPayload = await authenticateUser(req);
    if (!tokenPayload) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const db = getDb();
    const today = getDateInUTC7(); // Get YYYY-MM-DD format in UTC+7

    // Check if there's already an opening procedure for today (UTC+7 timezone)
    // Now checking for ANY opening today, not user-specific
    const existingOpening = await db
      .select()
      .from(openingProcedures)
      .where(eq(openingProcedures.date, today))
      .limit(1);

    if (existingOpening.length > 0) {
      return NextResponse.json({
        success: false,
        error: 'Opening procedure already exists for today',
        opening: existingOpening[0]
      }, { status: 400 });
    }

    // Create new opening procedure
    const newOpening = await db
      .insert(openingProcedures)
      .values({
        userId: tokenPayload.userId, // Keep for backward compatibility
        createdByUserId: tokenPayload.userId, // Track who created it
        date: today,
        currentStep: 1,
        completed: false,
        stepData: {}
      })
      .returning();

    return NextResponse.json({
      success: true,
      opening: newOpening[0]
    });

  } catch (error: any) {
    console.error('Error starting opening procedure:', error);
    
    // Check for unique constraint violation
    if (error.code === '23505' || error.message?.includes('duplicate key')) {
      // Double-check if opening exists
      const db = getDb();
      const today = getDateInUTC7();
      const existingOpening = await db
        .select()
        .from(openingProcedures)
        .where(eq(openingProcedures.date, today))
        .limit(1);
      
      if (existingOpening.length > 0) {
        return NextResponse.json({
          success: false,
          error: 'Opening procedure already exists for today',
          opening: existingOpening[0]
        }, { status: 409 }); // Conflict
      }
    }
    
    return NextResponse.json(
      { success: false, error: 'Failed to start opening procedure' },
      { status: 500 }
    );
  }
}