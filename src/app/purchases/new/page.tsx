"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { AppLayout } from '@/components/layout/app-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { NumberInput } from '@/components/ui/number-input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import { Plus, Trash2, Package } from 'lucide-react'
import { formatCurrency } from '@/lib/utils/format'
import { format } from 'date-fns'

interface Stock {
  id: string
  name: string
  type: string
  unit: string
  currentStock: string
  minStock: string
  costPerUnit: string | null
}

interface PurchaseItem {
  stockId: string
  quantity: string
  pricePerUnit: string
}

export default function NewPurchasePage() {
  const router = useRouter()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [stocks, setStocks] = useState<Stock[]>([])
  const [formData, setFormData] = useState({
    purchaseDate: format(new Date(), 'yyyy-MM-dd'),
    supplier: '',
    notes: ''
  })
  const [items, setItems] = useState<PurchaseItem[]>([
    { stockId: '', quantity: '', pricePerUnit: '' }
  ])

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
    }
  }

  const addItem = () => {
    setItems([...items, { stockId: '', quantity: '', pricePerUnit: '' }])
  }

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index))
    }
  }

  const updateItem = (index: number, field: keyof PurchaseItem, value: string) => {
    const newItems = [...items]
    newItems[index] = { ...newItems[index], [field]: value }
    setItems(newItems)
  }

  const calculateTotal = () => {
    return items.reduce((sum, item) => {
      if (item.quantity && item.pricePerUnit) {
        return sum + (parseFloat(item.quantity) * parseFloat(item.pricePerUnit))
      }
      return sum
    }, 0)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate form
    if (!formData.purchaseDate || !formData.supplier) {
      toast({
        title: "Error",
        description: "Tanggal dan supplier harus diisi",
        variant: "destructive"
      })
      return
    }

    // Validate items
    const validItems = items.filter(item => item.stockId && item.quantity && item.pricePerUnit)
    if (validItems.length === 0) {
      toast({
        title: "Error",
        description: "Minimal harus ada 1 item pembelian",
        variant: "destructive"
      })
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch('/api/purchases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          ...formData,
          items: validItems
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create purchase')
      }

      toast({
        title: "Berhasil",
        description: "Pembelian berhasil ditambahkan"
      })
      
      router.push('/purchases')
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Gagal menambahkan pembelian",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AppLayout
      title="Tambah Pembelian"
      showBackButton
    >
      <div className="p-4 pb-24">
        <form onSubmit={handleSubmit}>
          {/* Basic Info */}
          <Card className="mb-4">
            <CardHeader>
              <CardTitle className="text-lg">Informasi Pembelian</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="purchaseDate">Tanggal Pembelian *</Label>
                  <Input
                    id="purchaseDate"
                    type="date"
                    value={formData.purchaseDate}
                    onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="supplier">Supplier *</Label>
                  <Input
                    id="supplier"
                    value={formData.supplier}
                    onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                    placeholder="Nama supplier"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Catatan (Opsional)</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Tambahkan catatan jika diperlukan"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Purchase Items */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Item Pembelian</CardTitle>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={addItem}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Tambah Item
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {items.map((item, index) => (
                <div key={index} className="border rounded-lg p-4 space-y-4 bg-gray-50">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Package className="w-4 h-4 text-gray-500" />
                      <span className="font-medium text-sm">Item #{index + 1}</span>
                    </div>
                    {items.length > 1 && (
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => removeItem(index)}
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    )}
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Pilih Item *</Label>
                      <Select
                        value={item.stockId}
                        onValueChange={(value) => updateItem(index, 'stockId', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih item" />
                        </SelectTrigger>
                        <SelectContent>
                          {stocks.map((stock) => (
                            <SelectItem key={stock.id} value={stock.id}>
                              {stock.name} (Stok: {Number(stock.currentStock).toLocaleString('id-ID')} {stock.unit})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Jumlah *</Label>
                        <NumberInput
                          value={item.quantity ? parseFloat(item.quantity) : undefined}
                          onChange={(value) => updateItem(index, 'quantity', value?.toString() || '')}
                          placeholder="0"
                          min={0}
                          allowDecimals={true}
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Harga per Unit *</Label>
                        <NumberInput
                          value={item.pricePerUnit ? parseFloat(item.pricePerUnit) : undefined}
                          onChange={(value) => updateItem(index, 'pricePerUnit', value?.toString() || '')}
                          placeholder="0"
                          min={0}
                          allowDecimals={true}
                          required
                        />
                      </div>
                    </div>

                    {item.quantity && item.pricePerUnit && (
                      <div className="text-right text-sm">
                        Subtotal: <span className="font-semibold">
                          {formatCurrency(parseFloat(item.quantity) * parseFloat(item.pricePerUnit))}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {/* Total */}
              <div className="border-t pt-4">
                <div className="flex items-center justify-between text-lg">
                  <span className="font-semibold">Total Pembelian:</span>
                  <span className="font-bold text-orange-600">
                    {formatCurrency(calculateTotal())}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="mt-6 flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              className="flex-1"
            >
              Batal
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-orange-500 hover:bg-orange-600"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </div>
        </form>
      </div>
    </AppLayout>
  )
}