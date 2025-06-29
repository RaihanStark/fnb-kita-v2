import { NextRequest, NextResponse } from 'next/server'
import { getDb, purchases, purchaseItems, stocks } from '@/lib/db'
import { authenticateUser } from '@/lib/auth/middleware'
import { eq } from 'drizzle-orm'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const user = await authenticateUser(request)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const db = getDb()
    
    // Get purchase
    const [purchase] = await db
      .select()
      .from(purchases)
      .where(eq(purchases.id, id))

    if (!purchase) {
      return NextResponse.json({ error: 'Purchase not found' }, { status: 404 })
    }

    // Get purchase items
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
      .where(eq(purchaseItems.purchaseId, id))

    return NextResponse.json({
      ...purchase,
      items
    })
  } catch (error) {
    console.error('Error fetching purchase:', error)
    return NextResponse.json({ error: 'Failed to fetch purchase' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const user = await authenticateUser(request)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Only managers can delete purchases
  if (user.role !== 'Manager') {
    return NextResponse.json({ error: 'Forbidden: Manager access required' }, { status: 403 })
  }

  try {
    const db = getDb()
    
    // Get purchase items first to revert stock
    const items = await db
      .select()
      .from(purchaseItems)
      .where(eq(purchaseItems.purchaseId, id))

    // Revert stock quantities
    for (const item of items) {
      const [currentStock] = await db
        .select()
        .from(stocks)
        .where(eq(stocks.id, item.stockId))

      if (currentStock) {
        const newQuantity = Math.max(0, parseFloat(currentStock.currentStock) - parseFloat(item.quantity))
        await db
          .update(stocks)
          .set({
            currentStock: String(newQuantity),
            updatedAt: new Date()
          })
          .where(eq(stocks.id, item.stockId))
      }
    }

    // Delete purchase (items will be cascade deleted)
    await db
      .delete(purchases)
      .where(eq(purchases.id, id))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting purchase:', error)
    return NextResponse.json({ error: 'Failed to delete purchase' }, { status: 500 })
  }
}