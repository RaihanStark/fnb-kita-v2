import { NextRequest, NextResponse } from 'next/server';
import { getDb, closingProcedures, users } from '@/lib/db';
import { authenticateUser } from '@/lib/auth/middleware';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import type { ClosingStepData } from '@/lib/db/schema/closing-procedures';

const updateSchema = z.object({
  closingId: z.string().uuid(),
  stepNumber: z.number().min(1).max(5),
  stepData: z.any(), // Step-specific data
  completed: z.boolean().optional()
});

export async function POST(req: NextRequest) {
  try {
    // Verify authentication
    const tokenPayload = await authenticateUser(req);
    if (!tokenPayload) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const validationResult = updateSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid request data', details: validationResult.error },
        { status: 400 }
      );
    }

    const { closingId, stepNumber, stepData, completed } = validationResult.data;
    const db = getDb();
    
    // Get user info for tracking who completed the step
    const userInfo = await db
      .select({ id: users.id, name: users.name, email: users.email })
      .from(users)
      .where(eq(users.id, tokenPayload.userId))
      .limit(1);
    
    const currentUser = userInfo[0] || { id: tokenPayload.userId, name: 'Unknown', email: '' };

    // Get current closing procedure
    const currentClosing = await db
      .select()
      .from(closingProcedures)
      .where(eq(closingProcedures.id, closingId))
      .limit(1);

    if (currentClosing.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Closing procedure not found' },
        { status: 404 }
      );
    }

    const closing = currentClosing[0];
    
    // Check if procedure is already completed
    if (closing.completed) {
      return NextResponse.json(
        { success: false, error: 'Closing procedure already completed' },
        { status: 400 }
      );
    }

    // Update step data with user info
    const stepDataWithUser = {
      ...stepData,
      completedBy: {
        userId: currentUser.id,
        userName: currentUser.name || currentUser.email
      }
    };
    
    const updatedStepData = {
      ...((closing.stepData as ClosingStepData) || {}),
      [`step${stepNumber}`]: stepDataWithUser
    };

    // Prepare update object
    const updateData: any = {
      stepData: updatedStepData,
      currentStep: completed ? stepNumber + 1 : stepNumber,
      updatedAt: new Date(),
    };

    // Set step completion timestamp
    updateData[`step${stepNumber}CompletedAt`] = completed ? new Date() : null;

    // If this is the last step and it's completed, mark the whole procedure as completed
    if (stepNumber === 5 && completed) {
      updateData.completed = true;
      updateData.completedAt = new Date();
    }

    // Update the closing procedure
    const updated = await db
      .update(closingProcedures)
      .set(updateData)
      .where(eq(closingProcedures.id, closingId))
      .returning();

    return NextResponse.json({
      success: true,
      closing: updated[0]
    });

  } catch (error) {
    console.error('Error updating closing procedure:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update closing procedure' },
      { status: 500 }
    );
  }
}