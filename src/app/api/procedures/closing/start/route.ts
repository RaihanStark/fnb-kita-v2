import { NextRequest, NextResponse } from "next/server";
import { getDb, closingProcedures, openingProcedures } from "@/lib/db";
import { authenticateUser } from "@/lib/auth/middleware";
import { eq } from "drizzle-orm";
import { getDateInUTC7 } from "@/lib/utils/timezone";

export async function POST(req: NextRequest) {
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

    console.log("Closing start - Today date:", todayStr);

    // Check if opening procedure was completed today
    const todayOpening = await db
      .select()
      .from(openingProcedures)
      .where(eq(openingProcedures.date, todayStr))
      .limit(1);

    console.log("Opening found:", todayOpening.length > 0 ? "Yes" : "No");
    if (todayOpening.length > 0) {
      console.log("Opening completed:", todayOpening[0].completed);
      console.log("Opening date:", todayOpening[0].date);
    }

    if (todayOpening.length === 0 || !todayOpening[0].completed) {
      return NextResponse.json(
        {
          success: false,
          error: "Prosedur pembukaan hari ini belum diselesaikan",
        },
        { status: 400 }
      );
    }

    // Check if there's already a closing procedure for today
    const existingClosing = await db
      .select()
      .from(closingProcedures)
      .where(eq(closingProcedures.date, todayStr))
      .limit(1);

    if (existingClosing.length > 0) {
      return NextResponse.json(
        { success: false, error: "Closing procedure already exists for today" },
        { status: 400 }
      );
    }

    // Create new closing procedure
    const newClosing = await db
      .insert(closingProcedures)
      .values({
        createdByUserId: tokenPayload.userId,
        date: todayStr,
        currentStep: 1,
        completed: false,
        stepData: {},
      })
      .returning();

    return NextResponse.json({
      success: true,
      closing: newClosing[0],
    });
  } catch (error) {
    console.error("Error starting closing procedure:", error);
    return NextResponse.json(
      { success: false, error: "Failed to start closing procedure" },
      { status: 500 }
    );
  }
}
