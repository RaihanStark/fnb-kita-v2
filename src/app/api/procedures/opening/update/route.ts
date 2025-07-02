import { NextRequest, NextResponse } from 'next/server';
import { getDb, openingProcedures, users } from '@/lib/db';
import { authenticateUser } from '@/lib/auth/middleware';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';
import type { StepData } from '@/lib/db/schema/opening-procedures';

const updateSchema = z.object({
  openingId: z.string().uuid(),
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

    const { openingId, stepNumber, stepData, completed } = validationResult.data;
    const db = getDb();
    
    // Get user info for tracking who completed the step
    const userInfo = await db
      .select({ id: users.id, name: users.name, email: users.email })
      .from(users)
      .where(eq(users.id, tokenPayload.userId))
      .limit(1);
    
    const currentUser = userInfo[0] || { id: tokenPayload.userId, name: 'Unknown', email: '' };

    // Get current opening procedure
    // Now any user can update the opening, not just the creator
    const currentOpening = await db
      .select()
      .from(openingProcedures)
      .where(eq(openingProcedures.id, openingId))
      .limit(1);

    if (currentOpening.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Opening procedure not found' },
        { status: 404 }
      );
    }

    const opening = currentOpening[0];
    
    // Check if procedure is already completed
    if (opening.completed) {
      return NextResponse.json(
        { success: false, error: 'Opening procedure already completed' },
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
      ...((opening.stepData as StepData) || {}),
      [`step${stepNumber}`]: stepDataWithUser
    };

    // Prepare update object (timestamps will be stored in UTC)
    const updateData: any = {
      stepData: updatedStepData,
      updatedAt: new Date(),
    };

    // Set step completion timestamp if marking as completed
    if (completed) {
      updateData[`step${stepNumber}CompletedAt`] = new Date();
      
      // Add completion timestamp to step data
      updatedStepData[`step${stepNumber}`].completedAt = new Date().toISOString();
    }

    // Check if all steps are completed (for non-sequential flow)
    let allStepsCompleted = true;
    for (let i = 1; i <= 5; i++) {
      const stepKey = `step${i}`;
      const isCurrentStep = i === stepNumber && completed;
      const hasCompletedData = updatedStepData[stepKey]?.completedAt;
      
      if (!isCurrentStep && !hasCompletedData) {
        allStepsCompleted = false;
        break;
      }
    }

    // If all steps are completed, mark the whole procedure as completed
    if (allStepsCompleted) {
      updateData.completed = true;
      updateData.completedAt = new Date();
      updateData.currentStep = 6; // Beyond the last step
    } else {
      // Keep current step for backward compatibility
      updateData.currentStep = stepNumber;
    }

    // Update the opening procedure
    const updated = await db
      .update(openingProcedures)
      .set(updateData)
      .where(eq(openingProcedures.id, openingId))
      .returning();

    return NextResponse.json({
      success: true,
      opening: updated[0]
    });

  } catch (error) {
    console.error('Error updating opening procedure:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update opening procedure' },
      { status: 500 }
    );
  }
}