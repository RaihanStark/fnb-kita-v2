import { NextRequest, NextResponse } from 'next/server'
import { getDb, purchases, purchaseItems, stocks } from '@/lib/db'
import { authenticateUser } from '@/lib/auth/middleware'
import { desc, eq, and, gte, lt } from 'drizzle-orm'

export async function GET(request: NextRequest) {
  const user = await authenticateUser(request)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const db = getDb()
    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date')

    if (!date) {
      return NextResponse.json({ error: 'Date parameter is required' }, { status: 400 })
    }

    // Create date range for the specified date
    const startDate = new Date(date)
    startDate.setHours(0, 0, 0, 0)
    
    const endDate = new Date(date)
    endDate.setDate(endDate.getDate() + 1)
    endDate.setHours(0, 0, 0, 0)
    
    // Fetch purchases for the specified date
    const datePurchases = await db
      .select()
      .from(purchases)
      .where(
        and(
          gte(purchases.purchaseDate, startDate),
          lt(purchases.purchaseDate, endDate)
        )
      )
      .orderBy(desc(purchases.purchaseDate))

    // For each purchase, get the items
    const purchasesWithItems = await Promise.all(
      datePurchases.map(async (purchase) => {
        const items = await db
          .select({
            id: purchaseItems.id,
            quantity: purchaseItems.quantity,
            pricePerUnit: purchaseItems.pricePerUnit,
            subtotal: purchaseItems.subtotal,
            stockId: purchaseItems.stockId,
            stockName: stocks.name,
            stockUnit: stocks.unit
          })
          .from(purchaseItems)
          .leftJoin(stocks, eq(purchaseItems.stockId, stocks.id))
          .where(eq(purchaseItems.purchaseId, purchase.id))

        return {
          ...purchase,
          items
        }
      })
    )

    return NextResponse.json(purchasesWithItems)
  } catch (error) {
    console.error('Error fetching purchases by date:', error)
    return NextResponse.json({ error: 'Failed to fetch purchases' }, { status: 500 })
  }
}