import { NextRequest, NextResponse } from 'next/server'
import { getDb, transactions } from '@/lib/db'
import { authenticateUser } from '@/lib/auth/middleware'
import { eq, desc, and, gte, lte } from 'drizzle-orm'
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