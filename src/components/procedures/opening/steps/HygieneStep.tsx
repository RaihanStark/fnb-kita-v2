'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle, CheckCircle2, Sparkles } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface HygieneStepProps {
  data: any
  onNext: (data: any) => void
}

export function HygieneStep({ data, onNext }: HygieneStepProps) {
  const [checklist, setChecklist] = useState({
    handWashing: data.handWashing || false,
    areaClean: data.areaClean || false,
    utensilsClean: data.utensilsClean || false,
    pestFree: data.pestFree || false,
  })
  const [notes, setNotes] = useState(data.notes || '')

  const allChecked = Object.values(checklist).every(value => value)

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
          <Sparkles className="h-5 w-5 text-orange-500" />
          Kebersihan & Sanitasi
        </h2>
        <p className="text-sm text-gray-600 mt-1">
          Pastikan kebersihan area dan diri sebelum memulai
        </p>
      </div>

      <Alert className="border-blue-200 bg-blue-50">
        <div className="flex gap-3">
          <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
          <AlertDescription className="text-sm">
            Kebersihan adalah kunci utama keamanan pangan. Pastikan semua item tercentang.
          </AlertDescription>
        </div>
      </Alert>

      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Checklist Kebersihan</CardTitle>
          <CardDescription className="text-sm">
            Centang semua yang sudah dilakukan
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-start space-x-3">
            <div className="mt-1">
              <Checkbox
                id="handWashing"
                checked={checklist.handWashing}
                onCheckedChange={(checked) => 
                  setChecklist(prev => ({ ...prev, handWashing: checked as boolean }))
                }
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="handWashing" className="font-normal cursor-pointer leading-none">
                Cuci tangan dengan sabun (minimal 20 detik)
              </Label>
              <p className="text-sm text-muted-foreground">
                Gunakan sabun dan air mengalir, gosok semua bagian tangan
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <div className="mt-1">
              <Checkbox
                id="areaClean"
                checked={checklist.areaClean}
                onCheckedChange={(checked) => 
                  setChecklist(prev => ({ ...prev, areaClean: checked as boolean }))
                }
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="areaClean" className="font-normal cursor-pointer leading-none">
                Bersihkan meja/lapak dagangan
              </Label>
              <p className="text-sm text-muted-foreground">
                Lap dengan kain bersih dan disinfektan food grade
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <div className="mt-1">
              <Checkbox
                id="utensilsClean"
                checked={checklist.utensilsClean}
                onCheckedChange={(checked) => 
                  setChecklist(prev => ({ ...prev, utensilsClean: checked as boolean }))
                }
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="utensilsClean" className="font-normal cursor-pointer leading-none">
                Bersihkan alat saji dan wadah display
              </Label>
              <p className="text-sm text-muted-foreground">
                Pastikan semua alat dalam kondisi bersih dan kering
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <div className="mt-1">
              <Checkbox
                id="pestFree"
                checked={checklist.pestFree}
                onCheckedChange={(checked) => 
                  setChecklist(prev => ({ ...prev, pestFree: checked as boolean }))
                }
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="pestFree" className="font-normal cursor-pointer leading-none">
                Area bebas dari lalat, debu, dan hama
              </Label>
              <p className="text-sm text-muted-foreground">
                Pasang penutup makanan jika diperlukan
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-2 pt-2">
        <Label htmlFor="notes" className="text-sm font-medium">Catatan (opsional)</Label>
        <Textarea
          id="notes"
          placeholder="Tambahkan catatan jika ada kendala atau hal yang perlu diperhatikan..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          className="text-sm"
        />
      </div>

      <div className="flex justify-end pt-4">
        <Button 
          onClick={handleSubmit}
          disabled={!allChecked}
          className="w-full md:w-auto"
        >
          {allChecked ? (
            <>
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Lanjut ke Cek Stok
            </>
          ) : (
            'Lengkapi semua checklist'
          )}
        </Button>
      </div>
    </div>
  )
}