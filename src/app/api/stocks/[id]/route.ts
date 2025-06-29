import { NextRequest, NextResponse } from 'next/server'
import { getDb, stocks } from '@/lib/db'
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
    const [stock] = await db
      .select()
      .from(stocks)
      .where(eq(stocks.id, id))

    if (!stock) {
      return NextResponse.json({ error: 'Stock not found' }, { status: 404 })
    }

    return NextResponse.json(stock)
  } catch (error) {
    console.error('Error fetching stock:', error)
    return NextResponse.json({ error: 'Failed to fetch stock' }, { status: 500 })
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
    const { name, type, unit, currentStock, minStock, costPerUnit, notes } = body

    // Validate input
    if (!name || !type || !unit || currentStock === undefined || minStock === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Update stock
    const [stock] = await db
      .update(stocks)
      .set({
        name,
        type,
        unit,
        currentStock: String(currentStock),
        minStock: String(minStock),
        costPerUnit: costPerUnit ? String(costPerUnit) : null,
        notes,
        updatedAt: new Date()
      })
      .where(eq(stocks.id, id))
      .returning()

    if (!stock) {
      return NextResponse.json({ error: 'Stock not found' }, { status: 404 })
    }

    return NextResponse.json(stock)
  } catch (error) {
    console.error('Error updating stock:', error)
    return NextResponse.json({ error: 'Failed to update stock' }, { status: 500 })
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
    const [deleted] = await db
      .delete(stocks)
      .where(eq(stocks.id, id))
      .returning()

    if (!deleted) {
      return NextResponse.json({ error: 'Stock not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting stock:', error)
    return NextResponse.json({ error: 'Failed to delete stock' }, { status: 500 })
  }
}