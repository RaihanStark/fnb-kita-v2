import { NextRequest, NextResponse } from 'next/server'
import { getDb, stocks } from '@/lib/db'
import { authenticateUser } from '@/lib/auth/middleware'
import { desc } from 'drizzle-orm'

export async function GET(request: NextRequest) {
  const user = await authenticateUser(request)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const db = getDb()
    
    // Fetch all stocks ordered by type and name
    const result = await db
      .select()
      .from(stocks)
      .orderBy(stocks.type, stocks.name)

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error fetching stocks:', error)
    return NextResponse.json({ error: 'Failed to fetch stocks' }, { status: 500 })
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
    const { name, type, unit, currentStock, minStock, costPerUnit, notes } = body

    // Validate input
    if (!name || !type || !unit || currentStock === undefined || minStock === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Create stock
    const [stock] = await db
      .insert(stocks)
      .values({
        name,
        type,
        unit,
        currentStock: String(currentStock),
        minStock: String(minStock),
        costPerUnit: costPerUnit ? String(costPerUnit) : null,
        notes
      })
      .returning()

    return NextResponse.json(stock)
  } catch (error) {
    console.error('Error creating stock:', error)
    return NextResponse.json({ error: 'Failed to create stock' }, { status: 500 })
  }
}