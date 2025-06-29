"use client"

import { useState, useEffect } from 'react'
import { AppLayout } from '@/components/layout/app-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Plus, Search, Edit, Package, Droplet, Flame, AlertCircle, RefreshCw } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { formatCurrency } from '@/lib/utils/format'
import { useToast } from '@/hooks/use-toast'
import { Alert, AlertDescription } from '@/components/ui/alert'
import useAuthStore from '@/stores/auth-store'

interface Stock {
  id: string
  name: string
  type: 'product' | 'packaging' | 'utilities' | 'consumables'
  unit: 'pcs' | 'box' | 'kg' | 'liter' | 'pack'
  currentStock: string
  minStock: string
  costPerUnit: string | null
  notes: string | null
  createdAt: string
  updatedAt: string
}

const typeConfig = {
  product: { label: 'Produk', icon: Package, color: 'bg-blue-100 text-blue-700' },
  packaging: { label: 'Kemasan', icon: Package, color: 'bg-green-100 text-green-700' },
  utilities: { label: 'Utilitas', icon: Flame, color: 'bg-orange-100 text-orange-700' },
  consumables: { label: 'Habis Pakai', icon: Droplet, color: 'bg-purple-100 text-purple-700' }
}

export default function StocksPage() {
  const router = useRouter()
  const { toast } = useToast()
  const user = useAuthStore((state) => state.user)
  const [stocks, setStocks] = useState<Stock[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [activeTab, setActiveTab] = useState<'all' | Stock['type']>('all')
  const [syncing, setSyncing] = useState(false)

  useEffect(() => {
    fetchStocks()
  }, [])

  const fetchStocks = async () => {
    try {
      const response = await fetch('/api/stocks', {
        credentials: 'include'
      })
      if (!response.ok) throw new Error('Failed to fetch stocks')
      
      const data = await response.json()
      setStocks(data)
    } catch (error) {
      toast({
        title: "Error",
        description: "Gagal memuat persediaan",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const syncProductsToStock = async () => {
    setSyncing(true)
    try {
      const response = await fetch('/api/stocks/sync-products', {
        method: 'POST',
        credentials: 'include'
      })
      
      if (!response.ok) {
        throw new Error('Failed to sync products')
      }
      
      const result = await response.json()
      
      toast({
        title: "Sinkronisasi Berhasil",
        description: result.message,
      })
      
      // Refresh stocks list
      await fetchStocks()
    } catch (error) {
      toast({
        title: "Error",
        description: "Gagal melakukan sinkronisasi produk",
        variant: "destructive"
      })
    } finally {
      setSyncing(false)
    }
  }

  const filteredStocks = stocks
    .filter(stock => 
      stock.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
      (activeTab === 'all' || stock.type === activeTab)
    )

  const getLowStockItems = () => {
    return stocks.filter(stock => 
      Number(stock.currentStock) <= Number(stock.minStock)
    )
  }

  const lowStockCount = getLowStockItems().length

  return (
    <AppLayout title="Persediaan">
      <div className="p-4 pb-24">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex-1 mr-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                type="text"
                placeholder="Cari persediaan..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div className="flex gap-2">
            {user?.role === 'Manager' && (
              <Button 
                onClick={syncProductsToStock}
                variant="outline"
                disabled={syncing}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
                Sync Produk
              </Button>
            )}
            <Button 
              onClick={() => router.push('/stocks/new')}
              className="bg-orange-500 hover:bg-orange-600"
            >
              <Plus className="w-4 h-4 mr-2" />
              Tambah
            </Button>
          </div>
        </div>

        {/* Low Stock Alert */}
        {lowStockCount > 0 && (
          <Alert className="mb-4 border-orange-200 bg-orange-50">
            <AlertCircle className="h-4 w-4 text-orange-600" />
            <AlertDescription className="text-orange-800">
              <strong>{lowStockCount} item</strong> stok menipis atau habis. Segera lakukan pembelian.
            </AlertDescription>
          </Alert>
        )}

        {/* Type Filter */}
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)} className="mb-4">
          <TabsList className="grid grid-cols-5 w-full">
            <TabsTrigger value="all">Semua</TabsTrigger>
            <TabsTrigger value="product">Produk</TabsTrigger>
            <TabsTrigger value="packaging">Kemasan</TabsTrigger>
            <TabsTrigger value="utilities">Utilitas</TabsTrigger>
            <TabsTrigger value="consumables">Lainnya</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Stock List */}
        <div className="space-y-3">
          {loading ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          ) : filteredStocks.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <Package className="w-12 h-12 mx-auto text-gray-400 mb-3" />
                <p className="text-gray-500">
                  {searchTerm ? 'Persediaan tidak ditemukan' : 'Belum ada persediaan'}
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredStocks.map((stock) => {
              const config = typeConfig[stock.type]
              const Icon = config.icon
              const isLowStock = Number(stock.currentStock) <= Number(stock.minStock)
              
              return (
                <Card 
                  key={stock.id} 
                  className={`hover:shadow-md transition-shadow cursor-pointer ${
                    isLowStock ? 'border-orange-300 bg-orange-50' : ''
                  }`}
                  onClick={() => router.push(`/stocks/${stock.id}/edit`)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        <div className={`p-2 rounded-lg ${config.color}`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-gray-900">
                              {stock.name}
                            </h3>
                            <Badge variant="outline" className="text-xs">
                              {config.label}
                            </Badge>
                            {isLowStock && (
                              <Badge variant="destructive" className="text-xs">
                                Stok Menipis
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <span className="font-medium">
                              {Number(stock.currentStock).toLocaleString('id-ID')} {stock.unit}
                            </span>
                            <span className="text-gray-400">
                              Min: {Number(stock.minStock).toLocaleString('id-ID')} {stock.unit}
                            </span>
                            {stock.costPerUnit && (
                              <span className="text-gray-400">
                                @ {formatCurrency(Number(stock.costPerUnit))}
                              </span>
                            )}
                          </div>
                          {stock.notes && (
                            <p className="text-xs text-gray-500 mt-1">{stock.notes}</p>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation()
                          router.push(`/stocks/${stock.id}/edit`)
                        }}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
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