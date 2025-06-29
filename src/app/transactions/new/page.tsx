"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AppLayout } from '@/components/layout/app-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { ArrowLeft, Plus, Minus, Trash2 } from 'lucide-react'
import { formatCurrency } from '@/lib/utils/format'
import { useToast } from '@/hooks/use-toast'

interface TransactionItem {
  productId: string
  name: string
  variant: string
  quantity: number
  price?: number
}

const productVariants = [
  { id: '1', name: 'Risol', variant: 'Keju', defaultPrice: 5000 },
  { id: '2', name: 'Risol', variant: 'Sosis', defaultPrice: 5000 },
  { id: '3', name: 'Risol', variant: 'Ayam', defaultPrice: 5000 },
  { id: '4', name: 'Risol', variant: 'Beef', defaultPrice: 6000 },
  { id: '5', name: 'Risol', variant: 'Mozarella', defaultPrice: 7000 },
]

export default function NewTransactionPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [type, setType] = useState<'sales' | 'damaged' | 'bonus' | 'disposal'>('sales')
  const [items, setItems] = useState<TransactionItem[]>([])
  const [notes, setNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const addItem = (product: typeof productVariants[0]) => {
    const existingItem = items.find(
      item => item.productId === product.id && item.variant === product.variant
    )

    if (existingItem) {
      updateQuantity(items.indexOf(existingItem), 1)
    } else {
      setItems([...items, {
        productId: product.id,
        name: product.name,
        variant: product.variant,
        quantity: 1,
        price: type === 'sales' ? product.defaultPrice : undefined
      }])
    }
  }

  const updateQuantity = (index: number, change: number) => {
    const newItems = [...items]
    newItems[index].quantity = Math.max(0, newItems[index].quantity + change)
    
    if (newItems[index].quantity === 0) {
      newItems.splice(index, 1)
    }
    
    setItems(newItems)
  }

  const updatePrice = (index: number, price: number) => {
    const newItems = [...items]
    newItems[index].price = price
    setItems(newItems)
  }

  const removeItem = (index: number) => {
    const newItems = [...items]
    newItems.splice(index, 1)
    setItems(newItems)
  }

  const getTotalAmount = () => {
    if (type !== 'sales') return 0
    return items.reduce((sum, item) => sum + (item.price || 0) * item.quantity, 0)
  }

  const handleSubmit = async () => {
    if (items.length === 0) {
      toast({
        title: "Error",
        description: "Tambahkan minimal 1 item",
        variant: "destructive"
      })
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          type,
          items,
          totalAmount: type === 'sales' ? getTotalAmount() : null,
          notes
        })
      })

      if (!response.ok) throw new Error('Failed to create transaction')

      toast({
        title: "Berhasil",
        description: "Transaksi berhasil ditambahkan"
      })
      
      router.push('/transactions')
    } catch (error) {
      toast({
        title: "Error",
        description: "Gagal menambahkan transaksi",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AppLayout>
      <div className="p-4 pb-24">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-semibold">Tambah Transaksi</h1>
        </div>

        {/* Transaction Type */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-base">Tipe Transaksi</CardTitle>
          </CardHeader>
          <CardContent>
            <RadioGroup value={type} onValueChange={(value) => setType(value as any)}>
              <div className="grid grid-cols-2 gap-3">
                <Label className="flex items-center space-x-2 border rounded-lg p-3 cursor-pointer hover:bg-gray-50">
                  <RadioGroupItem value="sales" />
                  <span>Penjualan</span>
                </Label>
                <Label className="flex items-center space-x-2 border rounded-lg p-3 cursor-pointer hover:bg-gray-50">
                  <RadioGroupItem value="damaged" />
                  <span>Rusak</span>
                </Label>
                <Label className="flex items-center space-x-2 border rounded-lg p-3 cursor-pointer hover:bg-gray-50">
                  <RadioGroupItem value="bonus" />
                  <span>Bonus</span>
                </Label>
                <Label className="flex items-center space-x-2 border rounded-lg p-3 cursor-pointer hover:bg-gray-50">
                  <RadioGroupItem value="disposal" />
                  <span>Buang</span>
                </Label>
              </div>
            </RadioGroup>
          </CardContent>
        </Card>

        {/* Product Selection */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-base">Pilih Produk</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2">
              {productVariants.map((product) => (
                <Button
                  key={product.id}
                  variant="outline"
                  size="sm"
                  onClick={() => addItem(product)}
                  className="justify-start"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  {product.name} {product.variant}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Selected Items */}
        {items.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-base">Item Terpilih</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {items.map((item, index) => (
                  <div key={index} className="border rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">{item.name} {item.variant}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => removeItem(index)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => updateQuantity(index, -1)}
                        >
                          <Minus className="w-4 h-4" />
                        </Button>
                        <span className="w-12 text-center font-medium">{item.quantity}</span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => updateQuantity(index, 1)}
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                      
                      {type === 'sales' && (
                        <div className="flex-1 flex items-center gap-2">
                          <span className="text-sm text-gray-600">@</span>
                          <Input
                            type="number"
                            value={item.price || ''}
                            onChange={(e) => updatePrice(index, Number(e.target.value))}
                            className="h-8"
                            placeholder="Harga"
                          />
                        </div>
                      )}
                    </div>
                    
                    {type === 'sales' && item.price && (
                      <p className="text-sm text-gray-600 mt-2">
                        Subtotal: {formatCurrency(item.price * item.quantity)}
                      </p>
                    )}
                  </div>
                ))}
              </div>
              
              {type === 'sales' && (
                <div className="mt-4 pt-4 border-t">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold">Total</span>
                    <span className="font-semibold text-lg">{formatCurrency(getTotalAmount())}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Notes */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-base">Catatan</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Tambahkan catatan (opsional)"
              rows={3}
            />
          </CardContent>
        </Card>

        {/* Submit Button */}
        <Button
          className="w-full bg-orange-500 hover:bg-orange-600"
          onClick={handleSubmit}
          disabled={isSubmitting || items.length === 0}
        >
          {isSubmitting ? 'Menyimpan...' : 'Simpan Transaksi'}
        </Button>
      </div>
    </AppLayout>
  )
}