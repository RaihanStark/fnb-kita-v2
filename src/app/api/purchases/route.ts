import { NextRequest, NextResponse } from 'next/server'
import { getDb, purchases, purchaseItems, stocks } from '@/lib/db'
import { authenticateUser } from '@/lib/auth/middleware'
import { desc, eq } from 'drizzle-orm'

export async function GET(request: NextRequest) {
  const user = await authenticateUser(request)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const db = getDb()
    
    // Fetch all purchases with their items
    const allPurchases = await db
      .select()
      .from(purchases)
      .orderBy(desc(purchases.purchaseDate))

    // For each purchase, get the items
    const purchasesWithItems = await Promise.all(
      allPurchases.map(async (purchase) => {
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
    console.error('Error fetching purchases:', error)
    return NextResponse.json({ error: 'Failed to fetch purchases' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const user = await authenticateUser(request)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Only managers can create purchases
  if (user.role !== 'Manager') {
    return NextResponse.json({ error: 'Forbidden: Manager access required' }, { status: 403 })
  }

  try {
    const db = getDb()
    const body = await request.json()
    const { purchaseDate, supplier, notes, items } = body

    // Validate input
    if (!purchaseDate || !supplier || !items || items.length === 0) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Calculate total amount
    const totalAmount = items.reduce((sum: number, item: any) => {
      return sum + (parseFloat(item.quantity) * parseFloat(item.pricePerUnit))
    }, 0)

    // Create purchase
    const [purchase] = await db
      .insert(purchases)
      .values({
        purchaseDate: new Date(purchaseDate),
        supplier,
        totalAmount: String(totalAmount),
        notes: notes || null,
        createdBy: user.userId
      })
      .returning()

    // Create purchase items and update stock
    for (const item of items) {
      // Insert purchase item
      await db
        .insert(purchaseItems)
        .values({
          purchaseId: purchase.id,
          stockId: item.stockId,
          quantity: String(item.quantity),
          pricePerUnit: String(item.pricePerUnit),
          subtotal: String(parseFloat(item.quantity) * parseFloat(item.pricePerUnit))
        })

      // Update stock quantity
      const [currentStock] = await db
        .select()
        .from(stocks)
        .where(eq(stocks.id, item.stockId))

      if (currentStock) {
        const newQuantity = parseFloat(currentStock.currentStock) + parseFloat(item.quantity)
        await db
          .update(stocks)
          .set({
            currentStock: String(newQuantity),
            updatedAt: new Date()
          })
          .where(eq(stocks.id, item.stockId))
      }
    }

    return NextResponse.json(purchase)
  } catch (error) {
    console.error('Error creating purchase:', error)
    return NextResponse.json({ error: 'Failed to create purchase' }, { status: 500 })
  }
}