import { NextRequest, NextResponse } from 'next/server'
import { getDb, transactions, openingProcedures, closingProcedures, stocks, purchases, purchaseItems } from '@/lib/db'
import { authenticateUser } from '@/lib/auth/middleware'
import { desc, eq, gte, lt, lte, and } from 'drizzle-orm'
import { getDateInUTC7 } from '@/lib/utils/timezone'

export async function GET(request: NextRequest) {
  const user = await authenticateUser(request)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const db = getDb()
    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || 'last30Days'
    
    // Calculate date range based on period
    const today = new Date()
    let startDate = new Date()
    let endDate = new Date()
    
    switch (period) {
      case 'last30Days':
        // Start from 30 days ago
        startDate.setDate(today.getDate() - 29) // -29 to include today as the 30th day
        startDate.setHours(0, 0, 0, 0)
        // End date is tomorrow to include today's data
        endDate.setDate(today.getDate() + 1)
        endDate.setHours(0, 0, 0, 0)
        break
      case 'last60Days':
        // Start from 60 days ago
        startDate.setDate(today.getDate() - 59) // -59 to include today as the 60th day
        startDate.setHours(0, 0, 0, 0)
        // End date is tomorrow to include today's data
        endDate.setDate(today.getDate() + 1)
        endDate.setHours(0, 0, 0, 0)
        break
      case 'last90Days':
        // Start from 90 days ago
        startDate.setDate(today.getDate() - 89) // -89 to include today as the 90th day
        startDate.setHours(0, 0, 0, 0)
        // End date is tomorrow to include today's data
        endDate.setDate(today.getDate() + 1)
        endDate.setHours(0, 0, 0, 0)
        break
    }

    // Format dates for comparison
    const formatDate = (date: Date) => date.toISOString().split('T')[0]
    const startDateStr = formatDate(startDate)
    const endDateStr = formatDate(endDate)

    // Fetch transactions for the period - use lte to include end date
    const allTransactions = await db
      .select()
      .from(transactions)
      .where(
        and(
          gte(transactions.date, startDateStr),
          lte(transactions.date, formatDate(today))
        )
      )
      .orderBy(transactions.date)

    console.log('Date range:', startDateStr, 'to', endDateStr)
    console.log('Today:', formatDate(today))
    console.log('Found transactions:', allTransactions.length)
    allTransactions.forEach(t => console.log('Transaction:', t.date, t.totalAmount))

    // Fetch opening procedures for the period
    const openingProcs = await db
      .select()
      .from(openingProcedures)
      .where(
        and(
          gte(openingProcedures.date, startDateStr),
          lt(openingProcedures.date, endDateStr)
        )
      )
      .orderBy(openingProcedures.date)

    // Fetch closing procedures for the period
    const closingProcs = await db
      .select()
      .from(closingProcedures)
      .where(
        and(
          gte(closingProcedures.date, startDateStr),
          lt(closingProcedures.date, endDateStr)
        )
      )
      .orderBy(closingProcedures.date)

    // Fetch purchases for the period
    const allPurchases = await db
      .select()
      .from(purchases)
      .where(
        and(
          gte(purchases.purchaseDate, new Date(startDateStr)),
          lt(purchases.purchaseDate, new Date(endDateStr + 'T23:59:59'))
        )
      )
      .orderBy(purchases.purchaseDate)

    // Generate daily data
    const dailyData = []
    const currentDate = new Date(startDate)

    // Calculate the number of days to loop through
    const daysDifference = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
    
    // Loop through all days in the period
    for (let i = 0; i < daysDifference; i++) {
      const dateStr = formatDate(currentDate)
      const dayName = currentDate.toLocaleDateString('id-ID', { weekday: 'short' })
      const displayDate = currentDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
      
      console.log('Processing date:', dateStr)

      // Sales data for this day
      const dayTransactions = allTransactions.filter(t => t.date === dateStr)
      const salesTransactions = dayTransactions.filter(t => t.type === 'sales')
      const damagedTransactions = dayTransactions.filter(t => t.type === 'damaged')
      
      const dailySales = salesTransactions.reduce((sum, t) => sum + (Number(t.totalAmount) || 0), 0)
      const dailyTransactionCount = salesTransactions.length
      
      // Calculate items sold and risol sales
      let itemsSold = 0
      let itemsDamaged = 0
      let risolSold = 0
      
      salesTransactions.forEach(trans => {
        if (trans.items && Array.isArray(trans.items)) {
          trans.items.forEach((item: any) => {
            itemsSold += item.quantity || 0
            // Count risol sales (excluding kresek and similar items)
            if (item.name && item.name.toLowerCase().includes('risol') && 
                !item.name.toLowerCase().includes('kresek')) {
              risolSold += item.quantity || 0
            }
          })
        }
      })
      
      damagedTransactions.forEach(trans => {
        if (trans.items && Array.isArray(trans.items)) {
          trans.items.forEach((item: any) => {
            itemsDamaged += item.quantity || 0
          })
        }
      })

      // Cash data for this day
      const dayOpening = openingProcs.find(op => op.date === dateStr)
      const dayClosing = closingProcs.find(cp => cp.date === dateStr)
      
      const openingCash = dayOpening?.stepData?.step4?.totalCash || 0
      const closingCash = dayClosing?.stepData?.step1?.totalCash || openingCash + dailySales

      // Purchase data for this day
      const dayPurchases = allPurchases.filter(p => 
        formatDate(new Date(p.purchaseDate)) === dateStr
      )
      const dailyPurchaseAmount = dayPurchases.reduce((sum, p) => sum + (Number(p.totalAmount) || 0), 0)

      // Stock data - get from opening/closing procedures if available
      let openingStock = 0
      let purchasedItems = 0
      
      // Get opening stock from opening procedure
      if (dayOpening?.stepData?.step2?.stockItems) {
        const stockItems = dayOpening.stepData.step2.stockItems
        openingStock = stockItems
          .filter((item: any) => item.type === 'product')
          .reduce((sum: number, item: any) => 
            sum + (item.frozenCount || 0) + (item.readyCount || 0), 0
          )
      }
      
      // Get purchased items from purchase records
      for (const purchase of dayPurchases) {
        try {
          const purchaseItemsResponse = await db
            .select()
            .from(purchaseItems)
            .where(eq(purchaseItems.purchaseId, purchase.id))
          
          purchasedItems += purchaseItemsResponse.reduce((sum, item) => 
            sum + (parseFloat(item.quantity) || 0), 0
          )
        } catch (error) {
          console.error('Error fetching purchase items:', error)
        }
      }
      
      // Calculate closing stock
      const closingStock = Math.max(0, openingStock + purchasedItems - itemsSold - itemsDamaged)

      dailyData.push({
        date: dateStr,
        day: dayName,
        displayDate,
        // Sales data
        sales: dailySales,
        transactions: dailyTransactionCount,
        items: itemsSold,
        risolSold, // Add risol sales count
        // Cash data
        openingCash,
        closingCash,
        purchases: dailyPurchaseAmount,
        // Stock data
        openingStock,
        purchased: purchasedItems,
        sold: itemsSold,
        damaged: itemsDamaged,
        closingStock,
        // Best selling (would need more complex analysis)
        bestSelling: itemsSold > 0 ? { name: 'Risol - ABCrr', quantity: itemsSold } : null
      })

      currentDate.setDate(currentDate.getDate() + 1)
    }

    // Calculate risol sales by variant
    const risolSalesByVariant: { [key: string]: number } = {}
    
    // Filter only sales transactions
    const salesTransactions = allTransactions.filter(t => t.type === 'sales')
    
    salesTransactions.forEach(trans => {
      if (trans.items && Array.isArray(trans.items)) {
        trans.items.forEach((item: any) => {
          // Only count items with "Risol" in the name
          if (item.name && item.name.toLowerCase().includes('risol')) {
            const variant = item.variant || 'Unknown'
            risolSalesByVariant[variant] = (risolSalesByVariant[variant] || 0) + (item.quantity || 0)
          }
        })
      }
    })
    
    // Convert to array format for the pie chart
    const risolSales = Object.entries(risolSalesByVariant).map(([variant, quantity]) => ({
      variant,
      quantity
    })).sort((a, b) => b.quantity - a.quantity) // Sort by quantity descending

    // Calculate summary statistics
    const summary = {
      totalSales: dailyData.reduce((sum, day) => sum + day.sales, 0),
      totalTransactions: dailyData.reduce((sum, day) => sum + day.transactions, 0),
      averageDailySales: dailyData.length > 0 ? 
        dailyData.reduce((sum, day) => sum + day.sales, 0) / dailyData.length : 0,
      currentCash: dailyData[dailyData.length - 1]?.closingCash || 0,
      totalStock: dailyData[dailyData.length - 1]?.closingStock || 0,
      totalItemsSold: dailyData.reduce((sum, day) => sum + day.items, 0),
      totalPurchases: dailyData.reduce((sum, day) => sum + day.purchases, 0),
    }

    return NextResponse.json({
      success: true,
      period,
      startDate: startDateStr,
      endDate: endDateStr,
      dailyData,
      summary,
      risolSales
    })
  } catch (error) {
    console.error('Error fetching reports:', error)
    return NextResponse.json({ error: 'Failed to fetch reports' }, { status: 500 })
  }
}