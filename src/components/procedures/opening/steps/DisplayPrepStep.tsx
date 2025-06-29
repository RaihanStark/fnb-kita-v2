'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Store } from 'lucide-react'

interface DisplayPrepStepProps {
  data: any
  onNext: (data: any) => void
}

export function DisplayPrepStep({ data, onNext }: DisplayPrepStepProps) {
  const [checklist, setChecklist] = useState({
    arranged: data.arranged || false,
    labeled: data.labeled || false,
    temperatureChecked: data.temperatureChecked || false,
    coverReady: data.coverReady || false,
  })
  const [notes, setNotes] = useState(data.notes || '')

  const requiredChecks = Object.values(checklist).every(value => value)

  const handleSubmit = () => {
    onNext({
      ...checklist,
      notes,
      completedAt: new Date().toISOString(),
    })
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold flex items-center gap-2 text-gray-900">
          <Store className="h-5 w-5 text-orange-500" />
          Siapkan untuk Display
        </h2>
        <p className="text-sm text-gray-600 mt-1">
          Susun produk dengan rapi dan siap untuk dijual
        </p>
      </div>

      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Persiapan Display</CardTitle>
          <CardDescription className="text-sm">
            Pastikan produk tersusun dengan baik
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-start space-x-3">
            <div className="mt-1">
              <Checkbox
                id="arranged"
                checked={checklist.arranged}
                onCheckedChange={(checked) => 
                  setChecklist(prev => ({ ...prev, arranged: checked as boolean }))
                }
              />
            </div>
            <div className="space-y-1 flex-1">
              <Label htmlFor="arranged" className="font-normal cursor-pointer leading-none">
                Risol tersusun rapi di tempat saji
              </Label>
              <p className="text-sm text-muted-foreground">
                Susun dengan jenis yang sama berkelompok
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <div className="mt-1">
              <Checkbox
                id="labeled"
                checked={checklist.labeled}
                onCheckedChange={(checked) => 
                  setChecklist(prev => ({ ...prev, labeled: checked as boolean }))
                }
              />
            </div>
            <div className="space-y-1 flex-1">
              <Label htmlFor="labeled" className="font-normal cursor-pointer leading-none">
                Label untuk setiap jenis risol
              </Label>
              <p className="text-sm text-muted-foreground">
                Pastikan label jelas terbaca (Ayam, Mayo, Sayur, dll)
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <div className="mt-1">
              <Checkbox
                id="temperatureChecked"
                checked={checklist.temperatureChecked}
                onCheckedChange={(checked) => 
                  setChecklist(prev => ({ ...prev, temperatureChecked: checked as boolean }))
                }
              />
            </div>
            <div className="space-y-1 flex-1">
              <Label htmlFor="temperatureChecked" className="font-normal cursor-pointer leading-none">
                Suhu makanan aman
              </Label>
              <p className="text-sm text-muted-foreground">
                Tidak terlalu panas atau dingin, suhu ruang yang aman
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <div className="mt-1">
              <Checkbox
                id="coverReady"
                checked={checklist.coverReady}
                onCheckedChange={(checked) => 
                  setChecklist(prev => ({ ...prev, coverReady: checked as boolean }))
                }
              />
            </div>
            <div className="space-y-1 flex-1">
              <Label htmlFor="coverReady" className="font-normal cursor-pointer leading-none">
                Penutup makanan siap digunakan
              </Label>
              <p className="text-sm text-muted-foreground">
                Untuk melindungi dari debu dan lalat
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-2 pt-2">
        <Label htmlFor="notes" className="text-sm font-medium">Catatan (opsional)</Label>
        <Textarea
          id="notes"
          placeholder="Catatan tambahan..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          className="text-sm"
        />
      </div>

      <div className="flex justify-end pt-4">
        <Button 
          onClick={handleSubmit}
          disabled={!requiredChecks}
          className="w-full md:w-auto"
        >
          {requiredChecks ? 'Lanjut ke Modal Awal' : 'Lengkapi checklist'}
        </Button>
      </div>
    </div>
  )
}