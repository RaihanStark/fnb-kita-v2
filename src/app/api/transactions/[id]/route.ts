import { NextRequest, NextResponse } from 'next/server'
import { getDb, transactions, stocks } from '@/lib/db'
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
    const [transaction] = await db
      .select()
      .from(transactions)
      .where(eq(transactions.id, id))

    if (!transaction) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 })
    }

    return NextResponse.json(transaction)
  } catch (error) {
    console.error('Error fetching transaction:', error)
    return NextResponse.json({ error: 'Failed to fetch transaction' }, { status: 500 })
  }
}

export async function PUT(
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
    const body = await request.json()
    const { type, items, totalAmount, paymentMethod, notes } = body

    // Validate input
    if (!type || !items || items.length === 0) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
    }

    // Get the old transaction to restore stock quantities
    const [oldTransaction] = await db
      .select()
      .from(transactions)
      .where(eq(transactions.id, id))

    if (!oldTransaction) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 })
    }

    // First validate that new quantities won't exceed available stock
    // We need to calculate the net change for each item
    const stockChanges = new Map<string, number>();
    const stockValidationErrors = [];
    
    // Calculate stock that will be restored from old transaction
    const oldItems = oldTransaction.items as any[]
    for (const item of oldItems) {
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
        stockChanges.set(stockId, (stockChanges.get(stockId) || 0) + item.quantity);
      }
    }

    // Calculate stock that will be deducted for new items
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

      stockChanges.set(stockId, (stockChanges.get(stockId) || 0) - item.quantity);
    }

    // Validate all stock changes
    for (const [stockId, netChange] of stockChanges.entries()) {
      const [currentStock] = await db
        .select()
        .from(stocks)
        .where(eq(stocks.id, stockId));

      if (currentStock) {
        const projectedStock = parseFloat(currentStock.currentStock) + netChange;
        if (projectedStock < 0) {
          // Find the item name for better error message
          const item = items.find(i => {
            if (i.isPackaging) return i.productId === stockId;
            return false; // We'll handle product lookup if needed
          });
          const itemName = item?.name || currentStock.name;
          
          stockValidationErrors.push(
            `Stok ${itemName} tidak mencukupi. ` +
            `Tersedia: ${currentStock.currentStock} ${currentStock.unit}, ` +
            `Dibutuhkan: ${Math.abs(netChange)} ${currentStock.unit}`
          );
        }
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

    // Now apply all stock changes
    for (const [stockId, netChange] of stockChanges.entries()) {
      const [currentStock] = await db
        .select()
        .from(stocks)
        .where(eq(stocks.id, stockId));

      if (currentStock) {
        const newQuantity = parseFloat(currentStock.currentStock) + netChange;
        await db
          .update(stocks)
          .set({
            currentStock: String(newQuantity),
            updatedAt: new Date()
          })
          .where(eq(stocks.id, stockId));
      }
    }

    // Update transaction
    const [transaction] = await db
      .update(transactions)
      .set({
        type,
        items,
        totalAmount: totalAmount ? String(totalAmount) : null,
        paymentMethod: type === 'sales' ? (paymentMethod || 'cash') : null,
        notes,
        updatedAt: new Date()
      })
      .where(eq(transactions.id, id))
      .returning()

    return NextResponse.json(transaction)
  } catch (error) {
    console.error('Error updating transaction:', error)
    return NextResponse.json({ error: 'Failed to update transaction' }, { status: 500 })
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

  try {
    const db = getDb()
    
    // Get the transaction first to restore stock
    const [transactionToDelete] = await db
      .select()
      .from(transactions)
      .where(eq(transactions.id, id))

    if (!transactionToDelete) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 })
    }

    // Restore stock quantities
    const items = transactionToDelete.items as any[]
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
        
        if (!stockEntry) {
          console.warn(`Stock entry not found for product: ${stockName}`);
          continue;
        }
        stockId = stockEntry.id;
      }

      const [currentStock] = await db
        .select()
        .from(stocks)
        .where(eq(stocks.id, stockId));

      if (currentStock) {
        const restoredQuantity = parseFloat(currentStock.currentStock) + item.quantity;
        
        await db
          .update(stocks)
          .set({
            currentStock: String(restoredQuantity),
            updatedAt: new Date()
          })
          .where(eq(stocks.id, stockId));
      }
    }

    // Delete the transaction
    await db
      .delete(transactions)
      .where(eq(transactions.id, id))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting transaction:', error)
    return NextResponse.json({ error: 'Failed to delete transaction' }, { status: 500 })
  }
}