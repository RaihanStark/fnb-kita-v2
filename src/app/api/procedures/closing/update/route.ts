import { NextRequest, NextResponse } from 'next/server';
import { getDb, closingProcedures, users, stocks } from '@/lib/db';
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

    // Update the closing procedure
    const updated = await db
      .update(closingProcedures)
      .set(updateData)
      .where(eq(closingProcedures.id, closingId))
      .returning();

    // If step 2 (stock count) is completed, update stock levels
    if (stepNumber === 2 && completed && stepData.stockItems) {
      try {
        // Process each stock item
        for (const item of stepData.stockItems) {
          // Get current stock record
          const stockRecord = await db
            .select()
            .from(stocks)
            .where(eq(stocks.name, item.type === 'product' ? `${item.name} - ${item.variant}` : item.name))
            .limit(1);

          if (stockRecord.length > 0) {
            const currentStockRecord = stockRecord[0];
            
            // Calculate new stock based on item type
            let newStock: number;
            
            if (item.type === 'product') {
              // For products: frozenCount + readyCount
              newStock = (item.frozenCount || 0) + (item.readyCount || 0);
            } else {
              // For other items: currentCount
              newStock = item.currentCount || 0;
            }

            // Update the current stock
            await db
              .update(stocks)
              .set({
                currentStock: newStock.toString(),
                updatedAt: new Date(),
              })
              .where(eq(stocks.id, currentStockRecord.id));
          }
        }
      } catch (stockError) {
        console.error('Error updating stock levels:', stockError);
        // Note: We don't fail the whole operation if stock update fails
        // The closing procedure is still saved
      }
    }

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