import { NextRequest, NextResponse } from 'next/server'
import { getDb, products } from '@/lib/db'
import { authenticateUser } from '@/lib/auth/middleware'
import { eq, desc } from 'drizzle-orm'

export async function GET(request: NextRequest) {
  const user = await authenticateUser(request)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const db = getDb()
    
    // Fetch all products ordered by name and variant
    const result = await db
      .select()
      .from(products)
      .orderBy(products.name, products.variant)

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error fetching products:', error)
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const user = await authenticateUser(request)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Only managers can create products
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

    // Check if product variant already exists
    const existing = await db
      .select()
      .from(products)
      .where(eq(products.name, name))
      .where(eq(products.variant, variant))

    if (existing.length > 0) {
      return NextResponse.json({ error: 'Produk dengan varian ini sudah ada' }, { status: 409 })
    }

    // Create product
    const [product] = await db
      .insert(products)
      .values({
        name,
        variant,
        price: String(price),
        isActive: isActive ?? true
      })
      .returning()

    return NextResponse.json(product)
  } catch (error) {
    console.error('Error creating product:', error)
    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 })
  }
}