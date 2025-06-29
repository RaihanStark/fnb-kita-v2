"use client"

import { useState, useEffect } from 'react'
import { AppLayout } from '@/components/layout/app-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Plus, ShoppingCart, AlertCircle, Package, Gift, Trash2, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { formatDateUTC7, formatTimeWIB } from '@/lib/utils/format-date'
import { formatCurrency } from '@/lib/utils/format'
import { TransactionService } from '@/lib/services/transaction.service'
import { useToast } from '@/hooks/use-toast'

const typeConfig = {
  sales: { label: 'Penjualan', icon: ShoppingCart, color: 'text-green-600 bg-green-50' },
  damaged: { label: 'Rusak', icon: AlertCircle, color: 'text-red-600 bg-red-50' },
  bonus: { label: 'Bonus', icon: Gift, color: 'text-blue-600 bg-blue-50' },
  disposal: { label: 'Buang', icon: Trash2, color: 'text-gray-600 bg-gray-50' }
}

export default function TransactionsPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState('all')
  const [transactions, setTransactions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchTransactions()
  }, [])

  const fetchTransactions = async () => {
    try {
      const data = await TransactionService.getTransactions()
      setTransactions(data)
    } catch (error) {
      toast({
        title: "Error",
        description: "Gagal memuat transaksi",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const filteredTransactions = activeTab === 'all' 
    ? transactions 
    : transactions.filter(t => t.type === activeTab)

  const getTotalSales = () => {
    return transactions
      .filter(t => t.type === 'sales')
      .reduce((sum, t) => sum + (Number(t.totalAmount) || 0), 0)
  }

  const getTotalItems = (type?: string) => {
    const filtered = type ? transactions.filter(t => t.type === type) : transactions
    return filtered.reduce((sum, t) => 
      sum + t.items.reduce((itemSum: number, item: any) => itemSum + item.quantity, 0), 0
    )
  }

  return (
    <AppLayout>
      <div className="p-4 pb-24">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Transaksi</h1>
            <p className="text-sm text-gray-600">{formatDateUTC7(new Date(), 'EEEE, d MMMM yyyy')}</p>
          </div>
          <Button 
            onClick={() => router.push('/transactions/new')}
            className="bg-orange-500 hover:bg-orange-600"
          >
            <Plus className="w-4 h-4 mr-2" />
            Tambah
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Total Penjualan</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(getTotalSales())}</p>
              <p className="text-xs text-gray-500 mt-1">{getTotalItems('sales')} item terjual</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Non-Penjualan</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-gray-900">{getTotalItems() - getTotalItems('sales')}</p>
              <p className="text-xs text-gray-500 mt-1">Rusak/Bonus/Buang</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-4">
          <TabsList className="grid grid-cols-5 w-full">
            <TabsTrigger value="all">Semua</TabsTrigger>
            <TabsTrigger value="sales">Jual</TabsTrigger>
            <TabsTrigger value="damaged">Rusak</TabsTrigger>
            <TabsTrigger value="bonus">Bonus</TabsTrigger>
            <TabsTrigger value="disposal">Buang</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Transaction List */}
        <div className="space-y-3">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
            </div>
          ) : filteredTransactions.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <Package className="w-12 h-12 mx-auto text-gray-400 mb-3" />
                <p className="text-gray-500">Belum ada transaksi</p>
              </CardContent>
            </Card>
          ) : (
            filteredTransactions.map((transaction) => {
              const config = typeConfig[transaction.type as keyof typeof typeConfig]
              const Icon = config.icon
              
              return (
                <Card 
                  key={transaction.id}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => router.push(`/transactions/${transaction.id}/edit`)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg ${config.color}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium text-gray-900">{config.label}</span>
                          <span className="text-sm text-gray-500">{formatTimeWIB(transaction.createdAt)}</span>
                        </div>
                        
                        <div className="space-y-1">
                          {transaction.items.map((item, idx) => (
                            <div key={idx} className="text-sm text-gray-600">
                              {item.name} {item.variant} × {item.quantity}
                            </div>
                          ))}
                        </div>
                        
                        {transaction.notes && (
                          <p className="text-sm text-gray-500 mt-1 italic">"{transaction.notes}"</p>
                        )}
                        
                        {transaction.type === 'sales' && transaction.totalAmount && (
                          <p className="font-semibold text-gray-900 mt-2">
                            {formatCurrency(transaction.totalAmount)}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })
          )}
        </div>
      </div>
    </AppLayout>
  )
}