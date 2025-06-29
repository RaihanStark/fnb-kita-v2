'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCircle2, ClipboardCheck, AlertCircle } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Textarea } from '@/components/ui/textarea'

interface FinalChecklistStepProps {
  data: any
  onNext: (data: any) => void
}

export function FinalChecklistStep({ data, onNext }: FinalChecklistStepProps) {
  const [checklist, setChecklist] = useState({
    salesBookReady: data.salesBookReady || false,
    priceListVisible: data.priceListVisible || false,
    packagingReady: data.packagingReady || false,
    mobilePaymentReady: data.mobilePaymentReady || false,
    personalReady: data.personalReady || false,
  })
  const [additionalNotes, setAdditionalNotes] = useState(data.additionalNotes || '')

  const allChecked = Object.values(checklist).every(value => value)

  const handleSubmit = () => {
    onNext({
      ...checklist,
      additionalNotes,
      completedAt: new Date().toISOString(),
      allStepsCompleted: true,
    })
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold flex items-center gap-2 text-gray-900">
          <ClipboardCheck className="h-5 w-5 text-orange-500" />
          Checklist Akhir
        </h2>
        <p className="text-sm text-gray-600 mt-1">
          Pastikan semua siap sebelum mulai berjualan
        </p>
      </div>

      <Alert className="border-green-200 bg-green-50">
        <div className="flex gap-3">
          <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
          <div>
            <AlertTitle className="text-green-800 text-sm font-semibold">Hampir Selesai!</AlertTitle>
            <AlertDescription className="text-green-700 text-sm mt-1">
              Ini adalah langkah terakhir sebelum membuka dagangan.
            </AlertDescription>
          </div>
        </div>
      </Alert>

      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Checklist Final</CardTitle>
          <CardDescription className="text-sm">
            Pastikan semua perlengkapan siap
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-start space-x-3">
            <div className="mt-1">
              <Checkbox
              id="salesBookReady"
              checked={checklist.salesBookReady}
              onCheckedChange={(checked) => 
                setChecklist(prev => ({ ...prev, salesBookReady: checked as boolean }))
              }
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="salesBookReady" className="font-normal cursor-pointer leading-none">
                Buku catatan penjualan siap
              </Label>
              <p className="text-sm text-muted-foreground">
                Untuk mencatat setiap transaksi penjualan
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <div className="mt-1">
              <Checkbox
                id="priceListVisible"
                checked={checklist.priceListVisible}
                onCheckedChange={(checked) => 
                  setChecklist(prev => ({ ...prev, priceListVisible: checked as boolean }))
                }
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="priceListVisible" className="font-normal cursor-pointer leading-none">
                Daftar harga terpasang & terlihat jelas
              </Label>
              <p className="text-sm text-muted-foreground">
                Pembeli dapat melihat harga dengan mudah
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <div className="mt-1">
              <Checkbox
                id="packagingReady"
                checked={checklist.packagingReady}
                onCheckedChange={(checked) => 
                  setChecklist(prev => ({ ...prev, packagingReady: checked as boolean }))
                }
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="packagingReady" className="font-normal cursor-pointer leading-none">
                Plastik, tisu, dan alat saji tersedia
              </Label>
              <p className="text-sm text-muted-foreground">
                Stok cukup untuk satu hari jualan
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <div className="mt-1">
              <Checkbox
                id="mobilePaymentReady"
                checked={checklist.mobilePaymentReady}
                onCheckedChange={(checked) => 
                  setChecklist(prev => ({ ...prev, mobilePaymentReady: checked as boolean }))
                }
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="mobilePaymentReady" className="font-normal cursor-pointer leading-none">
                QRIS/pembayaran digital aktif
              </Label>
              <p className="text-sm text-muted-foreground">
                Pastikan saldo mencukupi dan koneksi stabil
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <div className="mt-1">
              <Checkbox
                id="personalReady"
                checked={checklist.personalReady}
                onCheckedChange={(checked) => 
                  setChecklist(prev => ({ ...prev, personalReady: checked as boolean }))
                }
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="personalReady" className="font-normal cursor-pointer leading-none">
                Penampilan rapi dan siap melayani
              </Label>
              <p className="text-sm text-muted-foreground">
                Pakaian bersih, masker jika perlu
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-2 pt-2">
        <Label htmlFor="additionalNotes" className="text-sm font-medium">Catatan Tambahan (opsional)</Label>
        <Textarea
          id="additionalNotes"
          placeholder="Hal-hal khusus yang perlu diperhatikan hari ini..."
          value={additionalNotes}
          onChange={(e) => setAdditionalNotes(e.target.value)}
          rows={3}
          className="text-sm"
        />
      </div>

      <Alert className="border-gray-200">
        <div className="flex gap-3">
          <AlertCircle className="h-4 w-4 text-gray-600 mt-0.5 flex-shrink-0" />
          <AlertDescription className="text-sm">
            Dengan menyelesaikan checklist ini, Anda menyatakan bahwa semua persiapan
            pembukaan telah dilakukan sesuai SOP.
          </AlertDescription>
        </div>
      </Alert>

      <div className="flex justify-end pt-4">
        <Button 
          onClick={handleSubmit}
          disabled={!allChecked}
          className="w-full md:w-auto"
        >
          {allChecked ? (
            <>
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Selesaikan Pembukaan
            </>
          ) : (
            'Lengkapi semua checklist'
          )}
        </Button>
      </div>
    </div>
  )
}