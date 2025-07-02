"use client"

import { useState, useEffect } from 'react'
import { AppLayout } from '@/components/layout/app-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Plus, ShoppingCart, AlertCircle, Package, Gift, Trash2, Loader2, Lock } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { formatDateUTC7, formatTimeWIB } from '@/lib/utils/format-date'
import { formatCurrency } from '@/lib/utils/format'
import { TransactionService } from '@/lib/services/transaction.service'
import { openingProcedureService } from '@/lib/services/opening-procedure'
import { closingProcedureService } from '@/lib/services/closing-procedure'
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
  const [hasOpeningToday, setHasOpeningToday] = useState(false)
  const [checkingOpening, setCheckingOpening] = useState(true)
  const [hasClosingToday, setHasClosingToday] = useState(false)
  const [isClosingInProgress, setIsClosingInProgress] = useState(false)

  useEffect(() => {
    checkOpeningAndFetchTransactions()
  }, [])

  const checkOpeningAndFetchTransactions = async () => {
    try {
      // Check opening status first
      const openingResult = await openingProcedureService.checkTodayOpening()
      setHasOpeningToday(openingResult.hasOpening && openingResult.opening?.completed)
      
      // Check closing status
      const closingResult = await closingProcedureService.checkTodayClosing()
      setHasClosingToday(closingResult.hasClosing && closingResult.closing?.completed)
      setIsClosingInProgress(closingResult.hasClosing && !closingResult.closing?.completed)
      
      // Always fetch transactions to show history
      if (openingResult.hasOpening && openingResult.opening?.completed) {
        const data = await TransactionService.getTransactions()
        setTransactions(data)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Gagal memuat data",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
      setCheckingOpening(false)
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

  // Show loading state while checking opening status
  if (checkingOpening) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-screen">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      </AppLayout>
    )
  }

  // Show alert if no opening today
  if (!hasOpeningToday) {
    return (
      <AppLayout>
        <div className="p-4">
          <Alert className="border-orange-200 bg-orange-50">
            <Lock className="h-4 w-4 text-orange-600" />
            <AlertDescription className="text-orange-800">
              <strong>Transaksi tidak dapat dilakukan.</strong>
              <br />
              Silakan lakukan pembukaan toko terlebih dahulu untuk memulai transaksi hari ini.
              <br />
              <Button 
                variant="link" 
                className="p-0 h-auto mt-2 text-orange-700 hover:text-orange-800"
                onClick={() => router.push('/procedures/opening')}
              >
                Ke Pembukaan →
              </Button>
            </AlertDescription>
          </Alert>
        </div>
      </AppLayout>
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
            className="bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
            disabled={!hasOpeningToday || isClosingInProgress || hasClosingToday}
          >
            <Plus className="w-4 h-4 mr-2" />
            Tambah
          </Button>
        </div>

        {/* Show alerts for closing status */}
        {isClosingInProgress && (
          <Alert className="border-orange-200 bg-orange-50 mb-4">
            <AlertCircle className="h-4 w-4 text-orange-600" />
            <AlertDescription className="text-orange-800">
              Penutupan toko sedang berlangsung. Transaksi baru tidak dapat dilakukan.
            </AlertDescription>
          </Alert>
        )}

        {hasClosingToday && (
          <Alert className="border-red-200 bg-red-50 mb-4">
            <Lock className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              Toko sudah ditutup untuk hari ini. Transaksi baru dapat dilakukan setelah pembukaan esok hari.
            </AlertDescription>
          </Alert>
        )}

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
                  className={`transition-shadow ${
                    isClosingInProgress || hasClosingToday 
                      ? 'opacity-75' 
                      : 'cursor-pointer hover:shadow-md'
                  }`}
                  onClick={() => {
                    if (!isClosingInProgress && !hasClosingToday) {
                      router.push(`/transactions/${transaction.id}/edit`)
                    }
                  }}
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
                              {item.name} {item.variant} × {item.quantity} {item.unit && item.unit !== 'pcs' ? item.unit : ''}
                              {item.isPackaging && (
                                <span className="ml-1 text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">
                                  kemasan
                                </span>
                              )}
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