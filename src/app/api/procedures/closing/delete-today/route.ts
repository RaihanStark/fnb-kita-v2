import { NextRequest, NextResponse } from "next/server";
import { getDb, closingProcedures } from "@/lib/db";
import { authenticateUser } from "@/lib/auth/middleware";
import { eq } from "drizzle-orm";
import { getDateInUTC7 } from "@/lib/utils/timezone";

export async function DELETE(req: NextRequest) {
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

    // Find today's closing procedure
    const todayClosing = await db
      .select()
      .from(closingProcedures)
      .where(eq(closingProcedures.date, todayStr))
      .limit(1);

    if (todayClosing.length === 0) {
      return NextResponse.json(
        { success: false, error: "No closing procedure found for today" },
        { status: 404 }
      );
    }

    const closing = todayClosing[0];

    // Check if already completed
    if (closing.completed) {
      return NextResponse.json(
        {
          success: false,
          error: "Cannot cancel a completed closing procedure",
        },
        { status: 400 }
      );
    }

    // Delete the closing procedure
    await db
      .delete(closingProcedures)
      .where(eq(closingProcedures.id, closing.id));

    return NextResponse.json({
      success: true,
      message: "Closing procedure cancelled successfully",
    });
  } catch (error) {
    console.error("Error cancelling closing procedure:", error);
    return NextResponse.json(
      { success: false, error: "Failed to cancel closing procedure" },
      { status: 500 }
    );
  }
}
