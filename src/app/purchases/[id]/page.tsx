"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { AppLayout } from '@/components/layout/app-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Loader2, Calendar, User, FileText, Package, Trash2 } from 'lucide-react'
import { formatCurrency } from '@/lib/utils/format'
import { format } from 'date-fns'
import { useToast } from '@/hooks/use-toast'
import useAuthStore from '@/stores/auth-store'

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

export default function PurchaseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const { toast } = useToast()
  const user = useAuthStore((state) => state.user)
  const [loading, setLoading] = useState(true)
  const [purchase, setPurchase] = useState<Purchase | null>(null)
  const [purchaseId, setPurchaseId] = useState<string>('')

  useEffect(() => {
    params.then(p => {
      setPurchaseId(p.id)
      fetchPurchase(p.id)
    })
  }, [params])

  const fetchPurchase = async (id: string) => {
    try {
      const response = await fetch(`/api/purchases/${id}`, {
        credentials: 'include'
      })
      if (!response.ok) throw new Error('Failed to fetch purchase')
      
      const data = await response.json()
      setPurchase(data)
    } catch (error) {
      toast({
        title: "Error",
        description: "Gagal memuat pembelian",
        variant: "destructive"
      })
      router.push('/purchases')
    } finally {
      setLoading(false)
    }
  }

  const deletePurchase = async () => {
    if (!confirm('Hapus pembelian ini? Stok akan dikurangi kembali.')) return

    try {
      const response = await fetch(`/api/purchases/${purchaseId}`, {
        method: 'DELETE',
        credentials: 'include'
      })

      if (!response.ok) throw new Error('Failed to delete purchase')

      toast({
        title: "Berhasil",
        description: "Pembelian berhasil dihapus"
      })
      
      router.push('/purchases')
    } catch (error) {
      toast({
        title: "Error",
        description: "Gagal menghapus pembelian",
        variant: "destructive"
      })
    }
  }

  if (loading) {
    return (
      <AppLayout title="Detail Pembelian">
        <div className="flex items-center justify-center h-screen">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      </AppLayout>
    )
  }

  if (!purchase) {
    return (
      <AppLayout title="Detail Pembelian">
        <div className="p-4 text-center">
          <p className="text-gray-500">Pembelian tidak ditemukan</p>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout 
      title="Detail Pembelian"
      showBackButton
      trailingActions={
        user?.role === 'Manager' && (
          <Button
            variant="destructive"
            size="sm"
            onClick={deletePurchase}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Hapus
          </Button>
        )
      }
    >
      <div className="p-4 pb-24">
        {/* Purchase Info */}
        <Card className="mb-4">
          <CardHeader>
            <CardTitle className="text-lg">Informasi Pembelian</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600 mb-1">Supplier</p>
                <p className="font-semibold">{purchase.supplier}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Tanggal Pembelian</p>
                <p className="font-semibold flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  {format(new Date(purchase.purchaseDate), 'dd MMM yyyy')}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Pembelian</p>
                <p className="font-bold text-lg text-orange-600">
                  {formatCurrency(Number(purchase.totalAmount))}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Jumlah Item</p>
                <p className="font-semibold">
                  {purchase.items.length} item
                </p>
              </div>
            </div>

            {purchase.notes && (
              <div>
                <p className="text-sm text-gray-600 mb-1 flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Catatan
                </p>
                <p className="text-gray-700">{purchase.notes}</p>
              </div>
            )}

            <div className="pt-2 border-t">
              <p className="text-xs text-gray-500">
                Dibuat pada {format(new Date(purchase.createdAt), 'dd MMM yyyy HH:mm')}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Purchase Items */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Item Pembelian</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {purchase.items.map((item, index) => (
                <div key={item.id} className="border rounded-lg p-4 bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Package className="w-4 h-4 text-gray-500" />
                        <h4 className="font-semibold">{item.stockName}</h4>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-gray-600">Jumlah</p>
                          <p className="font-medium">
                            {Number(item.quantity).toLocaleString('id-ID')} {item.stockUnit}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-600">Harga/Unit</p>
                          <p className="font-medium">
                            {formatCurrency(Number(item.pricePerUnit))}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-600">Subtotal</p>
                          <p className="font-medium text-orange-600">
                            {formatCurrency(Number(item.subtotal))}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Total Summary */}
            <div className="mt-4 pt-4 border-t">
              <div className="flex items-center justify-between text-lg">
                <span className="font-semibold">Total:</span>
                <span className="font-bold text-orange-600">
                  {formatCurrency(Number(purchase.totalAmount))}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  )
}