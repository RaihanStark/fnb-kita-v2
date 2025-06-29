import { NextRequest, NextResponse } from 'next/server'
import { getDb, products, stocks } from '@/lib/db'
import { authenticateUser } from '@/lib/auth/middleware'
import { eq } from 'drizzle-orm'

export async function POST(request: NextRequest) {
  const user = await authenticateUser(request)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Only managers can sync products
  if (user.role !== 'Manager') {
    return NextResponse.json({ error: 'Forbidden: Manager access required' }, { status: 403 })
  }

  try {
    const db = getDb()
    
    // Get all active products
    const allProducts = await db
      .select()
      .from(products)
      .where(eq(products.isActive, true))

    // Get all existing product stocks
    const existingStocks = await db
      .select()
      .from(stocks)
      .where(eq(stocks.type, 'product'))

    // Create a map of existing stock names for quick lookup
    const existingStockNames = new Set(existingStocks.map(s => s.name))

    // Find products that don't have corresponding stock entries
    const productsToSync = allProducts.filter(product => {
      const stockName = `${product.name} - ${product.variant}`
      return !existingStockNames.has(stockName)
    })

    // Create stock entries for missing products
    if (productsToSync.length > 0) {
      const stocksToCreate = productsToSync.map(product => ({
        name: `${product.name} - ${product.variant}`,
        type: 'product' as const,
        unit: 'pcs' as const,
        currentStock: '0',
        minStock: '10',
        costPerUnit: product.price,
        notes: `Auto-synced from product: ${product.name} ${product.variant}`
      }))

      await db.insert(stocks).values(stocksToCreate)
    }

    return NextResponse.json({ 
      success: true, 
      synced: productsToSync.length,
      message: `Synced ${productsToSync.length} products to stock` 
    })
  } catch (error) {
    console.error('Error syncing products to stocks:', error)
    return NextResponse.json({ error: 'Failed to sync products' }, { status: 500 })
  }
}