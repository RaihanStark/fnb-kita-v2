import { NextRequest, NextResponse } from 'next/server'
import { getDb, transactions } from '@/lib/db'
import { authenticateUser } from '@/lib/auth/middleware'
import { eq } from 'drizzle-orm'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await authenticateUser(request)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const db = getDb()
    const [transaction] = await db
      .select()
      .from(transactions)
      .where(eq(transactions.id, params.id))

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
  { params }: { params: { id: string } }
) {
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

    // Update transaction
    const [transaction] = await db
      .update(transactions)
      .set({
        type,
        items,
        totalAmount: totalAmount ? String(totalAmount) : null,
        notes,
        updatedAt: new Date()
      })
      .where(eq(transactions.id, params.id))
      .returning()

    if (!transaction) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 })
    }

    return NextResponse.json(transaction)
  } catch (error) {
    console.error('Error updating transaction:', error)
    return NextResponse.json({ error: 'Failed to update transaction' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await authenticateUser(request)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const db = getDb()
    const [deleted] = await db
      .delete(transactions)
      .where(eq(transactions.id, params.id))
      .returning()

    if (!deleted) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting transaction:', error)
    return NextResponse.json({ error: 'Failed to delete transaction' }, { status: 500 })
  }
}