import { NextRequest, NextResponse } from 'next/server'
import { getDb, transactions, stocks } from '@/lib/db'
import { authenticateUser } from '@/lib/auth/middleware'
import { eq, desc, and, gte, lte, sql } from 'drizzle-orm'
import { getDateInUTC7 } from '@/lib/utils/timezone'

export async function GET(request: NextRequest) {
  const user = await authenticateUser(request)
  if (!user) {
    console.error('Auth failed - no user from authenticateUser')
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const db = getDb()
    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date') || getDateInUTC7()
    const type = searchParams.get('type')

    // Build query conditions
    const conditions = [eq(transactions.date, date)]
    if (type && type !== 'all') {
      conditions.push(eq(transactions.type, type as any))
    }

    // Fetch transactions
    const result = await db
      .select()
      .from(transactions)
      .where(and(...conditions))
      .orderBy(desc(transactions.createdAt))

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error fetching transactions:', error)
    return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const user = await authenticateUser(request)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const db = getDb()
    const body = await request.json()
    const { type, items, totalAmount, notes } = body

    // Validate input
    if (!type || !items || items.length === 0) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
    }

    console.log('User from auth:', user)

    // First, validate stock availability for all items
    const stockValidationErrors = [];
    
    for (const item of items) {
      // For products, find the stock by product name and variant
      let stockId: string;
      
      if (item.isPackaging) {
        // For packaging, the productId is actually the stock ID
        stockId = item.productId;
      } else {
        // For products, find the stock entry by name
        const stockName = `${item.name} - ${item.variant}`;
        const [stockEntry] = await db
          .select()
          .from(stocks)
          .where(eq(stocks.name, stockName))
          .limit(1);
        
        if (!stockEntry) {
          console.warn(`Stock entry not found for product: ${stockName}`);
          continue;
        }
        stockId = stockEntry.id;
      }

      // Check stock availability
      const [currentStock] = await db
        .select()
        .from(stocks)
        .where(eq(stocks.id, stockId));

      if (!currentStock) {
        stockValidationErrors.push(`Stock tidak ditemukan untuk ${item.name}`);
        continue;
      }

      const availableStock = parseFloat(currentStock.currentStock);
      if (availableStock < item.quantity) {
        stockValidationErrors.push(
          `Stok ${item.name} tidak mencukupi. ` +
          `Tersedia: ${availableStock} ${currentStock.unit}, ` +
          `Diminta: ${item.quantity} ${currentStock.unit}`
        );
      }
    }

    // If there are validation errors, return them
    if (stockValidationErrors.length > 0) {
      return NextResponse.json(
        { 
          error: 'Stok tidak mencukupi', 
          details: stockValidationErrors 
        }, 
        { status: 400 }
      );
    }

    // Now deduct stock quantities (we know they're all valid)
    for (const item of items) {
      let stockId: string;
      
      if (item.isPackaging) {
        stockId = item.productId;
      } else {
        const stockName = `${item.name} - ${item.variant}`;
        const [stockEntry] = await db
          .select()
          .from(stocks)
          .where(eq(stocks.name, stockName))
          .limit(1);
        
        if (!stockEntry) continue;
        stockId = stockEntry.id;
      }

      const [currentStock] = await db
        .select()
        .from(stocks)
        .where(eq(stocks.id, stockId));

      if (currentStock) {
        const newQuantity = parseFloat(currentStock.currentStock) - item.quantity;
        
        await db
          .update(stocks)
          .set({
            currentStock: String(newQuantity),
            updatedAt: new Date()
          })
          .where(eq(stocks.id, stockId));
      }
    }

    // Create transaction
    const [transaction] = await db
      .insert(transactions)
      .values({
        userId: user.userId,
        type,
        items,
        totalAmount: totalAmount ? String(totalAmount) : null,
        notes,
        date: getDateInUTC7()
      })
      .returning()

    return NextResponse.json(transaction)
  } catch (error) {
    console.error('Error creating transaction:', error)
    return NextResponse.json({ error: 'Failed to create transaction' }, { status: 500 })
  }
}