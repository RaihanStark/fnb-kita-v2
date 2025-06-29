"use client"

import { useState, useEffect } from 'react'
import { AppLayout } from '@/components/layout/app-layout'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Plus, Search, Calendar, Package2, User, FileText } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { formatCurrency } from '@/lib/utils/format'
import { useToast } from '@/hooks/use-toast'
import { format } from 'date-fns'

interface PurchaseItem {
  id: string
  quantity: string
  pricePerUnit: string
  subtotal: string
  stockId: string
  stockName: string
  stockUnit: string
}

interface Purchase {
  id: string
  purchaseDate: string
  supplier: string
  totalAmount: string
  notes: string | null
  createdBy: string
  createdAt: string
  updatedAt: string
  items: PurchaseItem[]
}

export default function PurchasesPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [purchases, setPurchases] = useState<Purchase[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    fetchPurchases()
  }, [])

  const fetchPurchases = async () => {
    try {
      const response = await fetch('/api/purchases', {
        credentials: 'include'
      })
      if (!response.ok) throw new Error('Failed to fetch purchases')
      
      const data = await response.json()
      setPurchases(data)
    } catch (error) {
      toast({
        title: "Error",
        description: "Gagal memuat pembelian",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const filteredPurchases = purchases.filter(purchase => 
    purchase.supplier.toLowerCase().includes(searchTerm.toLowerCase()) ||
    purchase.notes?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    purchase.items.some(item => 
      item.stockName.toLowerCase().includes(searchTerm.toLowerCase())
    )
  )

  const deletePurchase = async (id: string) => {
    if (!confirm('Hapus pembelian ini? Stok akan dikurangi kembali.')) return

    try {
      const response = await fetch(`/api/purchases/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      })

      if (!response.ok) throw new Error('Failed to delete purchase')

      toast({
        title: "Berhasil",
        description: "Pembelian berhasil dihapus"
      })
      
      fetchPurchases()
    } catch (error) {
      toast({
        title: "Error",
        description: "Gagal menghapus pembelian",
        variant: "destructive"
      })
    }
  }

  return (
    <AppLayout title="Pembelian">
      <div className="p-4 pb-24">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex-1 mr-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                type="text"
                placeholder="Cari pembelian..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <Button 
            onClick={() => router.push('/purchases/new')}
            className="bg-orange-500 hover:bg-orange-600"
          >
            <Plus className="w-4 h-4 mr-2" />
            Tambah
          </Button>
        </div>

        {/* Purchase List */}
        <div className="space-y-3">
          {loading ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          ) : filteredPurchases.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <Package2 className="w-12 h-12 mx-auto text-gray-400 mb-3" />
                <p className="text-gray-500">
                  {searchTerm ? 'Pembelian tidak ditemukan' : 'Belum ada pembelian'}
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredPurchases.map((purchase) => (
              <Card 
                key={purchase.id} 
                className="hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => router.push(`/purchases/${purchase.id}`)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-green-100 text-green-700">
                        <Package2 className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {purchase.supplier}
                        </h3>
                        <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                          <Calendar className="w-4 h-4" />
                          <span>{format(new Date(purchase.purchaseDate), 'dd MMM yyyy')}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-lg text-gray-900">
                        {formatCurrency(Number(purchase.totalAmount))}
                      </div>
                      <Badge variant="outline" className="text-xs mt-1">
                        {purchase.items.length} item
                      </Badge>
                    </div>
                  </div>

                  {/* Item Preview */}
                  <div className="mt-3 space-y-1">
                    {purchase.items.slice(0, 2).map((item) => (
                      <div key={item.id} className="flex items-center justify-between text-sm text-gray-600">
                        <span className="flex-1 truncate">{item.stockName}</span>
                        <span className="ml-2">
                          {Number(item.quantity).toLocaleString('id-ID')} {item.stockUnit}
                        </span>
                      </div>
                    ))}
                    {purchase.items.length > 2 && (
                      <div className="text-sm text-gray-500">
                        +{purchase.items.length - 2} item lainnya
                      </div>
                    )}
                  </div>

                  {purchase.notes && (
                    <div className="mt-3 flex items-start gap-2">
                      <FileText className="w-4 h-4 text-gray-400 mt-0.5" />
                      <p className="text-xs text-gray-500 line-clamp-2">{purchase.notes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </AppLayout>
  )
}