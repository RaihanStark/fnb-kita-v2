import { NextRequest, NextResponse } from "next/server";
import {
  getDb,
  openingProcedures,
  closingProcedures,
  transactions,
} from "@/lib/db";
import { authenticateUser } from "@/lib/auth/middleware";
import { and, eq, gte, lt, sql, desc } from "drizzle-orm";
import {
  getDateInUTC7,
  startOfDayUTC7,
  endOfDayUTC7,
} from "@/lib/utils/timezone";

export async function GET(req: NextRequest) {
  try {
    // Verify authentication
    const tokenPayload = await authenticateUser(req);
    if (!tokenPayload) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const db = getDb();

    // Get month parameter from query string
    const searchParams = req.nextUrl.searchParams;
    const monthParam = searchParams.get("month"); // Format: YYYY-MM

    let startDate: Date;
    let endDate: Date;

    if (monthParam) {
      const [year, month] = monthParam.split("-").map(Number);
      startDate = new Date(year, month - 1, 1);
      endDate = new Date(year, month, 0, 23, 59, 59, 999);
    } else {
      // Default to current month
      const now = new Date();
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date(
        now.getFullYear(),
        now.getMonth() + 1,
        0,
        23,
        59,
        59,
        999
      );
    }

    // Get all days in the month
    const days = [];
    const currentDate = new Date(startDate);
    const today = new Date();

    while (currentDate <= endDate && currentDate <= today) {
      const dayStart = startOfDayUTC7(new Date(currentDate));
      const dayEnd = endOfDayUTC7(new Date(currentDate));

      // Get opening procedure for the day
      const [opening] = await db
        .select()
        .from(openingProcedures)
        .where(
          and(
            gte(openingProcedures.createdAt, dayStart),
            lt(openingProcedures.createdAt, dayEnd)
          )
        )
        .limit(1);

      // Get closing procedure for the day
      const [closing] = await db
        .select()
        .from(closingProcedures)
        .where(
          and(
            gte(closingProcedures.createdAt, dayStart),
            lt(closingProcedures.createdAt, dayEnd)
          )
        )
        .limit(1);

      // Get transaction summary for the day
      const salesData = await db
        .select({
          totalSales: sql<number>`COALESCE(SUM(CASE WHEN ${transactions.type} = 'sales' THEN ${transactions.totalAmount} ELSE 0 END), 0)`,
          totalCashSales: sql<number>`COALESCE(SUM(CASE WHEN ${transactions.type} = 'sales' AND ${transactions.paymentMethod} = 'cash' THEN ${transactions.totalAmount} ELSE 0 END), 0)`,
          totalQrisSales: sql<number>`COALESCE(SUM(CASE WHEN ${transactions.type} = 'sales' AND ${transactions.paymentMethod} = 'qris' THEN ${transactions.totalAmount} ELSE 0 END), 0)`,
          totalTransactions: sql<number>`COUNT(CASE WHEN ${transactions.type} = 'sales' THEN 1 END)`,
          totalDamaged: sql<number>`COUNT(CASE WHEN ${transactions.type} = 'damaged' THEN 1 END)`,
          totalBonus: sql<number>`COUNT(CASE WHEN ${transactions.type} = 'bonus' THEN 1 END)`,
          totalDisposal: sql<number>`COUNT(CASE WHEN ${transactions.type} = 'disposal' THEN 1 END)`,
        })
        .from(transactions)
        .where(
          and(
            gte(transactions.createdAt, dayStart),
            lt(transactions.createdAt, dayEnd)
          )
        );

      // Get total items sold
      const itemsSoldResult = await db
        .select({
          items: transactions.items,
        })
        .from(transactions)
        .where(
          and(
            gte(transactions.createdAt, dayStart),
            lt(transactions.createdAt, dayEnd),
            eq(transactions.type, "sales")
          )
        );

      let totalItemsSold = 0;
      let topProducts = new Map<
        string,
        { quantity: number; revenue: number }
      >();

      for (const trans of itemsSoldResult) {
        const items = trans.items as any[];
        for (const item of items) {
          // Only count risol items, not packaging
          const itemNameLower = item.name.toLowerCase();
          if (itemNameLower.includes("risol")) {
            totalItemsSold += item.quantity;

            const key = `${item.name} - ${item.variant}`;
            const existing = topProducts.get(key) || {
              quantity: 0,
              revenue: 0,
            };
            existing.quantity += item.quantity;
            existing.revenue += (item.price || 0) * item.quantity;
            topProducts.set(key, existing);
          }
        }
      }

      // Sort and get top 3 products
      const topProductsArray = Array.from(topProducts.entries())
        .map(([name, data]) => ({ name, ...data }))
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 3);

      // Extract data from procedures
      let openingCash = 0;
      let closingCash = 0;
      let cashDiscrepancy = 0;

      if (opening?.stepData) {
        const stepData = opening.stepData as any;
        openingCash = stepData?.step4?.totalCash || 0;
      }

      if (closing?.stepData) {
        const stepData = closing.stepData as any;
        closingCash = stepData?.totalClosingCash || 0;
        cashDiscrepancy = stepData?.discrepancy || 0;
      }

      const totalSales = Number(salesData[0]?.totalSales || 0);
      const totalTransactions = Number(salesData[0]?.totalTransactions || 0);

      days.push({
        date: getDateInUTC7(currentDate),
        dayName: currentDate.toLocaleDateString("id-ID", { weekday: "long" }),
        hasOpening: !!opening,
        hasClosing: !!closing,
        openingCash,
        closingCash,
        totalSales,
        totalCashSales: Number(salesData[0]?.totalCashSales || 0),
        totalQrisSales: Number(salesData[0]?.totalQrisSales || 0),
        totalTransactions,
        totalItemsSold,
        averageTransactionValue:
          totalTransactions > 0
            ? Math.round(totalSales / totalTransactions)
            : 0,
        stockDamaged: Number(salesData[0]?.totalDamaged || 0),
        stockBonus: Number(salesData[0]?.totalBonus || 0),
        cashDiscrepancy,
        topProducts: topProductsArray,
      });

      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Sort by date descending
    days.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    return NextResponse.json({
      success: true,
      data: days,
    });
  } catch (error) {
    console.error("Error fetching history data:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch history data" },
      { status: 500 }
    );
  }
}
