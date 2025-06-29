import { NextRequest, NextResponse } from "next/server";
import { getDb, closingProcedures } from "@/lib/db";
import { authenticateUser } from "@/lib/auth/middleware";
import { and, eq, gte, lte } from "drizzle-orm";
import { getDateInUTC7 } from "@/lib/utils/timezone";

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

    // Get today's date in YYYY-MM-DD format in UTC+7 timezone
    const todayStr = getDateInUTC7();

    // Check if there's a closing procedure for today
    const existingClosing = await db
      .select()
      .from(closingProcedures)
      .where(eq(closingProcedures.date, todayStr))
      .limit(1);

    if (existingClosing.length > 0) {
      return NextResponse.json({
        success: true,
        hasClosing: true,
        closing: existingClosing[0],
      });
    }

    return NextResponse.json({
      success: true,
      hasClosing: false,
    });
  } catch (error) {
    console.error("Error checking closing procedure:", error);
    return NextResponse.json(
      { success: false, error: "Failed to check closing procedure" },
      { status: 500 }
    );
  }
}
