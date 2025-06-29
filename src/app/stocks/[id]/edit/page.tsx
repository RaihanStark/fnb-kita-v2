"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { AppLayout } from '@/components/layout/app-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Loader2, Info } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { Alert, AlertDescription } from '@/components/ui/alert'

const stockTypes = [
  { value: 'product', label: 'Produk (Risol, dll)' },
  { value: 'packaging', label: 'Kemasan (Box, Plastik)' },
  { value: 'utilities', label: 'Utilitas (Gas, Minyak)' },
  { value: 'consumables', label: 'Habis Pakai (Tissue, Sambel)' }
]

const unitTypes = [
  { value: 'pcs', label: 'Pcs (Pieces)' },
  { value: 'box', label: 'Box' },
  { value: 'kg', label: 'Kg (Kilogram)' },
  { value: 'liter', label: 'Liter' },
  { value: 'pack', label: 'Pack' }
]

export default function EditStockPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [stockId, setStockId] = useState<string>('')
  const [formData, setFormData] = useState({
    name: '',
    type: '',
    unit: '',
    currentStock: '',
    minStock: '',
    costPerUnit: '',
    notes: ''
  })

  useEffect(() => {
    params.then(p => {
      setStockId(p.id)
      fetchStock(p.id)
    })
  }, [params])

  const fetchStock = async (id: string) => {
    try {
      const response = await fetch(`/api/stocks/${id}`, {
        credentials: 'include'
      })
      if (!response.ok) throw new Error('Failed to fetch stock')
      
      const data = await response.json()
      setFormData({
        name: data.name,
        type: data.type,
        unit: data.unit,
        currentStock: data.currentStock,
        minStock: data.minStock,
        costPerUnit: data.costPerUnit || '',
        notes: data.notes || ''
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Gagal memuat persediaan",
        variant: "destructive"
      })
      router.push('/stocks')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name || !formData.type || !formData.unit || !formData.minStock) {
      toast({
        title: "Error",
        description: "Semua field wajib harus diisi",
        variant: "destructive"
      })
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/stocks/${stockId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          ...formData,
          currentStock: formData.currentStock // Keep the original value
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update stock')
      }

      toast({
        title: "Berhasil",
        description: "Persediaan berhasil diperbarui"
      })
      
      router.push('/stocks')
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Gagal memperbarui persediaan",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Hapus persediaan ini?')) return

    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/stocks/${stockId}`, {
        method: 'DELETE',
        credentials: 'include'
      })

      if (!response.ok) throw new Error('Failed to delete stock')

      toast({
        title: "Berhasil",
        description: "Persediaan berhasil dihapus"
      })
      
      router.push('/stocks')
    } catch (error) {
      toast({
        title: "Error",
        description: "Gagal menghapus persediaan",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) {
    return (
      <AppLayout title="Edit Persediaan">
        <div className="flex items-center justify-center h-screen">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout
      title="Edit Persediaan"
      showBackButton
      trailingActions={
        <Button
          variant="destructive"
          size="sm"
          onClick={handleDelete}
          disabled={isSubmitting}
        >
          Hapus
        </Button>
      }
    >
      <div className="p-4 pb-24">
        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Informasi Persediaan</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nama Item *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Contoh: Risol Mentah, Gas 3kg, Minyak Goreng"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="type">Tipe *</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value) => setFormData({ ...formData, type: value })}
                    required
                  >
                    <SelectTrigger id="type">
                      <SelectValue placeholder="Pilih tipe" />
                    </SelectTrigger>
                    <SelectContent>
                      {stockTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="unit">Satuan *</Label>
                  <Select
                    value={formData.unit}
                    onValueChange={(value) => setFormData({ ...formData, unit: value })}
                    required
                  >
                    <SelectTrigger id="unit">
                      <SelectValue placeholder="Pilih satuan" />
                    </SelectTrigger>
                    <SelectContent>
                      {unitTypes.map((unit) => (
                        <SelectItem key={unit.value} value={unit.value}>
                          {unit.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Alert className="border-blue-200 bg-blue-50">
                <Info className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-800">
                  Stok saat ini tidak dapat diubah langsung. Gunakan fitur tambah persediaan untuk menambah stok.
                </AlertDescription>
              </Alert>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="currentStock">Stok Saat Ini</Label>
                  <Input
                    id="currentStock"
                    type="number"
                    step="0.01"
                    value={formData.currentStock}
                    disabled
                    className="bg-gray-100"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="minStock">Stok Minimum *</Label>
                  <Input
                    id="minStock"
                    type="number"
                    step="0.01"
                    value={formData.minStock}
                    onChange={(e) => setFormData({ ...formData, minStock: e.target.value })}
                    placeholder="0"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="costPerUnit">Harga per Satuan (Opsional)</Label>
                <Input
                  id="costPerUnit"
                  type="number"
                  value={formData.costPerUnit}
                  onChange={(e) => setFormData({ ...formData, costPerUnit: e.target.value })}
                  placeholder="Contoh: 5000"
                />
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