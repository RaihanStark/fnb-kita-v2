import { NextRequest, NextResponse } from 'next/server';
import { getDb, openingProcedures, transactions } from '@/lib/db';
import { authenticateUser } from '@/lib/auth/middleware';
import { and, eq, gte, lt, sql } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  try {
    // Verify authentication
    const tokenPayload = await authenticateUser(req);
    if (!tokenPayload) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const db = getDb();
    
    // Get today's date range
    const today = new Date();
    const startOfDay = new Date(today);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(today);
    endOfDay.setHours(23, 59, 59, 999);

    // Get today's opening procedure to find opening cash
    const todayOpening = await db
      .select()
      .from(openingProcedures)
      .where(
        and(
          gte(openingProcedures.createdAt, startOfDay),
          lt(openingProcedures.createdAt, endOfDay)
        )
      )
      .limit(1);

    let openingCash = 0;
    if (todayOpening.length > 0 && todayOpening[0].stepData) {
      const stepData = todayOpening[0].stepData as any;
      openingCash = stepData?.step4?.totalCash || 0;
    }

    // Get today's total CASH sales only (not QRIS)
    const cashSalesResult = await db
      .select({
        totalCashSales: sql<number>`COALESCE(SUM(${transactions.totalAmount}), 0)`
      })
      .from(transactions)
      .where(
        and(
          gte(transactions.createdAt, startOfDay),
          lt(transactions.createdAt, endOfDay),
          eq(transactions.type, 'sales'),
          eq(transactions.paymentMethod, 'cash')
        )
      );

    // Get today's total QRIS sales for information
    const qrisSalesResult = await db
      .select({
        totalQrisSales: sql<number>`COALESCE(SUM(${transactions.totalAmount}), 0)`
      })
      .from(transactions)
      .where(
        and(
          gte(transactions.createdAt, startOfDay),
          lt(transactions.createdAt, endOfDay),
          eq(transactions.type, 'sales'),
          eq(transactions.paymentMethod, 'qris')
        )
      );

    const totalCashSales = Number(cashSalesResult[0]?.totalCashSales || 0);
    const totalQrisSales = Number(qrisSalesResult[0]?.totalQrisSales || 0);
    const totalSales = totalCashSales + totalQrisSales;
    const expectedCash = openingCash + totalCashSales; // Only cash sales added to expected cash

    return NextResponse.json({
      success: true,
      openingCash,
      totalSales,
      totalCashSales,
      totalQrisSales,
      expectedCash
    });

  } catch (error) {
    console.error('Error calculating expected cash:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to calculate expected cash' },
      { status: 500 }
    );
  }
}