import { NextRequest, NextResponse } from 'next/server'
import { getDb, products, stocks } from '@/lib/db'
import { authenticateUser } from '@/lib/auth/middleware'
import { eq, and, ne } from 'drizzle-orm'

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
    const [product] = await db
      .select()
      .from(products)
      .where(eq(products.id, id))

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    return NextResponse.json(product)
  } catch (error) {
    console.error('Error fetching product:', error)
    return NextResponse.json({ error: 'Failed to fetch product' }, { status: 500 })
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

  // Only managers can update products
  if (user.role !== 'Manager') {
    return NextResponse.json({ error: 'Forbidden: Manager access required' }, { status: 403 })
  }

  try {
    const db = getDb()
    const body = await request.json()
    const { name, variant, price, isActive } = body

    // Validate input
    if (!name || !variant || !price) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Check if product variant already exists (excluding current product)
    const existing = await db
      .select()
      .from(products)
      .where(and(
        eq(products.name, name),
        eq(products.variant, variant),
        ne(products.id, id)
      ))

    if (existing.length > 0) {
      return NextResponse.json({ error: 'Produk dengan varian ini sudah ada' }, { status: 409 })
    }

    // Get the old product name for stock update
    const [oldProduct] = await db
      .select()
      .from(products)
      .where(eq(products.id, id))

    if (!oldProduct) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    // Update product
    const [updatedProduct] = await db
      .update(products)
      .set({
        name,
        variant,
        price: String(price),
        isActive,
        updatedAt: new Date()
      })
      .where(eq(products.id, id))
      .returning()

    if (!updatedProduct) {
      return NextResponse.json({ error: 'Failed to update product' }, { status: 500 })
    }

    // Update corresponding stock entry if name or variant changed
    const oldStockName = `${oldProduct.name} - ${oldProduct.variant}`
    const newStockName = `${name} - ${variant}`
    
    if (oldStockName !== newStockName || oldProduct.price !== String(price)) {
      await db
        .update(stocks)
        .set({
          name: newStockName,
          costPerUnit: String(price),
          updatedAt: new Date()
        })
        .where(eq(stocks.name, oldStockName))
    }

    return NextResponse.json(updatedProduct)
  } catch (error) {
    console.error('Error updating product:', error)
    return NextResponse.json({ error: 'Failed to update product' }, { status: 500 })
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

  // Only managers can delete products
  if (user.role !== 'Manager') {
    return NextResponse.json({ error: 'Forbidden: Manager access required' }, { status: 403 })
  }

  try {
    const db = getDb()
    
    // Get product details first
    const [productToDelete] = await db
      .select()
      .from(products)
      .where(eq(products.id, id))

    if (!productToDelete) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    // Instead of deleting, we'll set isActive to false
    await db
      .update(products)
      .set({
        isActive: false,
        updatedAt: new Date()
      })
      .where(eq(products.id, id))

    // Also delete the corresponding stock entry
    const stockName = `${productToDelete.name} - ${productToDelete.variant}`
    await db
      .delete(stocks)
      .where(eq(stocks.name, stockName))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting product:', error)
    return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 })
  }
}