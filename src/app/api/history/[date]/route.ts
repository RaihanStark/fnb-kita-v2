import { NextRequest, NextResponse } from "next/server";
import {
  getDb,
  openingProcedures,
  closingProcedures,
  transactions,
  stocks,
  users,
} from "@/lib/db";
import { authenticateUser } from "@/lib/auth/middleware";
import { and, eq, gte, lt, sql, asc } from "drizzle-orm";
import { startOfDayUTC7, endOfDayUTC7 } from "@/lib/utils/timezone";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ date: string }> }
) {
  try {
    // Verify authentication
    const tokenPayload = await authenticateUser(req);
    if (!tokenPayload) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { date } = await params; // Format: YYYY-MM-DD
    console.log("Fetching history for date:", date);

    const db = getDb();

    // Parse date and get day boundaries
    const targetDate = new Date(date);
    if (isNaN(targetDate.getTime())) {
      return NextResponse.json(
        { success: false, error: "Invalid date format" },
        { status: 400 }
      );
    }

    const dayStart = startOfDayUTC7(targetDate);
    const dayEnd = endOfDayUTC7(targetDate);
    console.log("Day boundaries:", { dayStart, dayEnd });

    // Get opening procedure with user info
    const openingResult = await db
      .select({
        procedure: openingProcedures,
        user: users,
      })
      .from(openingProcedures)
      .leftJoin(users, eq(openingProcedures.userId, users.id))
      .where(
        and(
          gte(openingProcedures.createdAt, dayStart),
          lt(openingProcedures.createdAt, dayEnd)
        )
      )
      .limit(1);

    // Get closing procedure with user info
    const closingResult = await db
      .select({
        procedure: closingProcedures,
        user: users,
      })
      .from(closingProcedures)
      .leftJoin(users, eq(closingProcedures.createdByUserId, users.id))
      .where(
        and(
          gte(closingProcedures.createdAt, dayStart),
          lt(closingProcedures.createdAt, dayEnd)
        )
      )
      .limit(1);

    // Get all transactions for the day
    const transactionsResult = await db
      .select()
      .from(transactions)
      .where(
        and(
          gte(transactions.createdAt, dayStart),
          lt(transactions.createdAt, dayEnd)
        )
      )
      .orderBy(asc(transactions.createdAt));

    // Process opening data
    let openingData = null;
    if (openingResult[0]) {
      const { procedure, user } = openingResult[0];
      const stepData = procedure.stepData as any;

      // Extract stock discrepancy information
      console.log("Full step data:", JSON.stringify(stepData, null, 2));
      const stockItems = stepData?.step2?.stockItems || [];

      // Debug logging
      console.log("Raw stock items:", JSON.stringify(stockItems, null, 2));

      const discrepancyItems = stockItems.filter((item: any) => {
        // Convert to numbers to handle string values
        const missingCount = Number(item.missingCount) || 0;
        const excessCount = Number(item.excessCount) || 0;
        const hasMissing = missingCount > 0;
        const hasExcess = excessCount > 0;

        console.log(
          `Item ${item.name} - ${item.variant}: missingCount=${
            item.missingCount
          } (${typeof item.missingCount}), excessCount=${
            item.excessCount
          } (${typeof item.excessCount}), hasMissing=${hasMissing}, hasExcess=${hasExcess}`
        );
        return hasMissing || hasExcess;
      });

      console.log("Discrepancy items found:", discrepancyItems.length);

      // Format discrepancy items for display
      const formattedDiscrepancies = discrepancyItems.map((item: any) => {
        const missingCount = Number(item.missingCount) || 0;
        const excessCount = Number(item.excessCount) || 0;

        return {
          name: item.variant ? `${item.name} - ${item.variant}` : item.name,
          type: item.type || "product",
          unit: item.unit || "pcs",
          missingCount: missingCount,
          excessCount: excessCount,
          notes: item.notes || "",
          discrepancyType: missingCount > 0 ? "missing" : "excess",
          discrepancyAmount: missingCount > 0 ? missingCount : excessCount,
        };
      });

      console.log("Formatted discrepancies:", formattedDiscrepancies);

      openingData = {
        time: procedure.createdAt.toLocaleTimeString("id-ID", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        user: user?.name || "Unknown",
        openingCash: stepData?.step4?.totalCash || 0,
        stockCount:
          stepData?.step2?.totalCount ||
          stepData?.step2?.stockItems?.reduce((sum: number, item: any) => {
            if (item.type === "product") {
              return sum + (item.frozenCount || 0) + (item.readyCount || 0);
            } else {
              return sum + (item.currentCount || 0);
            }
          }, 0) ||
          0,
        discrepancies: formattedDiscrepancies,
        generalNotes: stepData?.step2?.generalNotes || "",
        hasDiscrepancies: formattedDiscrepancies.length > 0,
        totalDiscrepancies: formattedDiscrepancies.length,
      };

      console.log("Final opening data:", {
        hasDiscrepancies: formattedDiscrepancies.length > 0,
        totalDiscrepancies: formattedDiscrepancies.length,
        discrepancies: formattedDiscrepancies,
      });
    }

    // Process closing data
    let closingData = null;
    if (closingResult[0]) {
      const { procedure, user } = closingResult[0];
      const stepData = procedure.stepData as any;

      closingData = {
        time: procedure.createdAt.toLocaleTimeString("id-ID", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        user: user?.name || "Unknown",
        closingCash:
          stepData?.totalClosingCash ||
          stepData?.step5?.totalClosingCash ||
          stepData?.[5]?.totalClosingCash ||
          stepData?.step1?.totalCash ||
          0,
        expectedCash:
          stepData?.expectedCash ||
          stepData?.step5?.expectedCash ||
          stepData?.[5]?.expectedCash ||
          stepData?.step1?.systemCash ||
          0,
        cashDiscrepancy:
          stepData?.discrepancy ||
          stepData?.step5?.discrepancy ||
          stepData?.[5]?.discrepancy ||
          stepData?.step1?.difference ||
          0,
        note:
          stepData?.discrepancyNote ||
          stepData?.step5?.discrepancyNote ||
          stepData?.[5]?.discrepancyNote ||
          stepData?.step1?.notes ||
          null,
      };
    }

    // Process transactions
    const processedTransactions = transactionsResult.map((trans) => ({
      id: trans.id,
      time: trans.createdAt.toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      type: trans.type,
      items: trans.items,
      totalAmount: trans.totalAmount ? Number(trans.totalAmount) : undefined,
      paymentMethod: trans.paymentMethod,
      notes: trans.notes,
    }));

    // Calculate stock movements
    const stockMovementMap = new Map<
      string,
      {
        opening: number;
        purchased: number;
        sold: number;
        damaged: number;
        bonus: number;
        disposal: number;
      }
    >();

    // Initialize with opening stock if available
    if (openingData && openingResult[0]) {
      const stepData = openingResult[0].procedure.stepData as any;
      const stockItems = stepData?.step2?.stockItems || [];

      for (const item of stockItems) {
        const key = item.variant ? `${item.name} - ${item.variant}` : item.name;
        // For risol products: use frozenCount + readyCount
        // For other items (packaging, etc): use currentCount
        const openingCount =
          item.currentCount !== undefined
            ? item.currentCount
            : (item.frozenCount || 0) + (item.readyCount || 0);

        stockMovementMap.set(key, {
          opening: openingCount,
          purchased: 0,
          sold: 0,
          damaged: 0,
          bonus: 0,
          disposal: 0,
        });
      }
    }

    // Track movements from transactions
    for (const trans of transactionsResult) {
      const items = trans.items as any[];
      for (const item of items) {
        // Use same key format as opening stock
        const key = item.variant ? `${item.name} - ${item.variant}` : item.name;
        const movement = stockMovementMap.get(key) || {
          opening: 0,
          purchased: 0,
          sold: 0,
          damaged: 0,
          bonus: 0,
          disposal: 0,
        };

        switch (trans.type) {
          case "sales":
            movement.sold += item.quantity;
            break;
          case "damaged":
            movement.damaged += item.quantity;
            break;
          case "bonus":
            movement.bonus += item.quantity;
            break;
          case "disposal":
            movement.disposal += item.quantity;
            break;
        }

        stockMovementMap.set(key, movement);
      }
    }

    // Add closing stock data if available
    if (closingResult[0]) {
      const closingStepData = closingResult[0].procedure.stepData as any;
      const closingStockItems =
        closingStepData?.step2?.stockItems ||
        closingStepData?.[2]?.stockItems ||
        [];

      for (const item of closingStockItems) {
        const key = item.variant ? `${item.name} - ${item.variant}` : item.name;
        const movement = stockMovementMap.get(key);
        if (movement) {
          // Use actual closing count if available
          const actualClosing =
            item.totalCount ||
            (item.currentStock ? parseFloat(item.currentStock) : null);
          if (actualClosing !== null && actualClosing !== undefined) {
            // We'll add this to the movement object for display
            (movement as any).actualClosing = actualClosing;
          }
        }
      }
    }

    // Convert to array and calculate closing
    const stockMovements = Array.from(stockMovementMap.entries()).map(
      ([product, movement]) => {
        const calculatedClosing =
          movement.opening +
          movement.purchased -
          movement.sold -
          movement.damaged -
          movement.bonus -
          movement.disposal;

        return {
          product,
          ...movement,
          closing:
            (movement as any).actualClosing !== undefined
              ? (movement as any).actualClosing
              : calculatedClosing,
        };
      }
    );

    // Calculate summary
    const salesTransactions = transactionsResult.filter(
      (t) => t.type === "sales"
    );
    const totalSales = salesTransactions.reduce(
      (sum, t) => sum + Number(t.totalAmount || 0),
      0
    );
    const totalCashSales = salesTransactions
      .filter((t) => t.paymentMethod === "cash")
      .reduce((sum, t) => sum + Number(t.totalAmount || 0), 0);
    const totalQrisSales = salesTransactions
      .filter((t) => t.paymentMethod === "qris")
      .reduce((sum, t) => sum + Number(t.totalAmount || 0), 0);

    // Calculate total items sold and top products (only risol, not packaging)
    let totalItemsSold = 0;
    const productSales = new Map<
      string,
      { quantity: number; revenue: number }
    >();

    for (const trans of salesTransactions) {
      const items = trans.items as any[];
      for (const item of items) {
        // Only count risol items, not packaging
        const itemNameLower = item.name.toLowerCase();
        if (itemNameLower.includes("risol")) {
          totalItemsSold += item.quantity;

          const key = `${item.name} - ${item.variant}`;
          const existing = productSales.get(key) || { quantity: 0, revenue: 0 };
          existing.quantity += item.quantity;
          existing.revenue += (item.price || 0) * item.quantity;
          productSales.set(key, existing);
        }
      }
    }

    const topProducts = Array.from(productSales.entries())
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.revenue - a.revenue);

    const summary = {
      totalSales,
      totalCashSales,
      totalQrisSales,
      totalTransactions: salesTransactions.length,
      totalItemsSold,
      averageTransactionValue:
        salesTransactions.length > 0
          ? Math.round(totalSales / salesTransactions.length)
          : 0,
      topProducts,
    };

    return NextResponse.json({
      success: true,
      data: {
        date,
        dayName: targetDate.toLocaleDateString("id-ID", { weekday: "long" }),
        openingData,
        closingData,
        transactions: processedTransactions,
        stockMovements,
        summary,
      },
    });
  } catch (error) {
    console.error("Error fetching day detail:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch day detail",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
