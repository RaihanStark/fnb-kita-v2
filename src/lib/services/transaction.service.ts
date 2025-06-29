interface Transaction {
  id: string
  type: 'sales' | 'damaged' | 'bonus' | 'disposal'
  items: Array<{
    productId: string
    name: string
    variant: string
    quantity: number
    price?: number
  }>
  totalAmount: number | null
  notes?: string
  date: string
  createdAt: Date
}

interface CreateTransactionDto {
  type: 'sales' | 'damaged' | 'bonus' | 'disposal'
  items: Array<{
    productId: string
    name: string
    variant: string
    quantity: number
    price?: number
  }>
  totalAmount?: number | null
  notes?: string
}

export class TransactionService {
  static async getTransactions(date?: string, type?: string): Promise<Transaction[]> {
    const params = new URLSearchParams()
    if (date) params.append('date', date)
    if (type) params.append('type', type)

    const response = await fetch(`/api/transactions?${params}`, {
      credentials: 'include'
    })
    if (!response.ok) throw new Error('Failed to fetch transactions')
    
    return response.json()
  }

  static async getTransaction(id: string): Promise<Transaction> {
    const response = await fetch(`/api/transactions/${id}`, {
      credentials: 'include'
    })
    if (!response.ok) throw new Error('Failed to fetch transaction')
    
    return response.json()
  }

  static async createTransaction(data: CreateTransactionDto): Promise<Transaction> {
    const response = await fetch('/api/transactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
      credentials: 'include'
    })

    if (!response.ok) throw new Error('Failed to create transaction')
    
    return response.json()
  }

  static async updateTransaction(id: string, data: CreateTransactionDto): Promise<Transaction> {
    const response = await fetch(`/api/transactions/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
      credentials: 'include'
    })

    if (!response.ok) throw new Error('Failed to update transaction')
    
    return response.json()
  }

  static async deleteTransaction(id: string): Promise<void> {
    const response = await fetch(`/api/transactions/${id}`, {
      method: 'DELETE',
      credentials: 'include'
    })

    if (!response.ok) throw new Error('Failed to delete transaction')
  }

  static async getTransactionSummary(date?: string): Promise<{
    totalSales: number
    totalItems: number
    salesCount: number
    nonSalesCount: number
  }> {
    const transactions = await this.getTransactions(date)
    
    const totalSales = transactions
      .filter(t => t.type === 'sales')
      .reduce((sum, t) => sum + (Number(t.totalAmount) || 0), 0)

    const totalItems = transactions
      .reduce((sum, t) => 
        sum + t.items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0
      )

    const salesCount = transactions.filter(t => t.type === 'sales').length
    const nonSalesCount = transactions.filter(t => t.type !== 'sales').length

    return { totalSales, totalItems, salesCount, nonSalesCount }
  }
}