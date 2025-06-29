import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCircle2, Package, Banknote, Clock, Download, RotateCcw } from 'lucide-react'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'
import { formatDateUTC7, formatTimeWIB } from '@/lib/utils/format-date'

interface OpeningSummaryProps {
  data: Record<number, any>
  onRestart: () => void
}

export function OpeningSummary({ data, onRestart }: OpeningSummaryProps) {
  const startTime = data[1]?.completedAt ? new Date(data[1].completedAt) : new Date()
  const endTime = data[5]?.completedAt ? new Date(data[5].completedAt) : new Date()
  const duration = Math.round((endTime.getTime() - startTime.getTime()) / 1000 / 60)

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  const getTotalStock = () => {
    const stockData = data[2]?.stockItems || []
    return stockData.reduce((total: number, item: any) => 
      total + item.frozenCount + item.readyCount, 0
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 pb-32 md:px-6 md:pb-8">
      <div className="py-8 text-center">
        <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-green-100 mb-6">
          <CheckCircle2 className="h-10 w-10 text-green-600" />
        </div>
        <h1 className="text-2xl font-semibold text-gray-900 mb-2">Pembukaan Selesai!</h1>
        <p className="text-gray-600">
          Prosedur pembukaan telah berhasil diselesaikan
        </p>
      </div>

      <div className="grid gap-4 mb-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Waktu Penyelesaian
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tanggal</span>
                <span className="font-medium">
                  {formatDateUTC7(endTime, 'EEEE, d MMMM yyyy')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Waktu Selesai</span>
                <span className="font-medium">{formatTimeWIB(endTime)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Durasi</span>
                <span className="font-medium">{duration} menit</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Stok Awal
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="text-2xl font-bold">{getTotalStock()} pcs</div>
              {data[2]?.stockItems?.map((item: any) => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    {item.name} {item.variant}
                  </span>
                  <span>
                    {item.frozenCount + item.readyCount} pcs
                    {item.damagedCount > 0 && (
                      <span className="text-red-600 ml-2">
                        ({item.damagedCount} rusak)
                      </span>
                    )}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Banknote className="h-5 w-5" />
              Modal Awal
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold mb-3">
              {formatCurrency(data[4]?.totalCash || 0)}
            </div>
            <div className="space-y-1">
              {data[4]?.denominations?.filter((d: any) => d.count > 0).map((denom: any) => (
                <div key={denom.value} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{denom.label}</span>
                  <span>{denom.count} lembar</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Status Checklist</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {[
                { step: 1, name: 'Kebersihan', icon: '🧼' },
                { step: 2, name: 'Stok', icon: '📦' },
                { step: 3, name: 'Display', icon: '🏪' },
                { step: 4, name: 'Modal', icon: '💵' },
                { step: 5, name: 'Final', icon: '✅' },
              ].map(({ step, name, icon }) => (
                <div key={step} className="flex items-center gap-2">
                  <span>{icon}</span>
                  <span className="flex-1">
                    {name}
                    {data[step]?.completedBy && (
                      <span className="text-xs text-muted-foreground ml-2">
                        ({data[step].completedBy.userName})
                      </span>
                    )}
                  </span>
                  {data[step]?.completedAt && (
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <Button className="flex-1">
          <Download className="mr-2 h-4 w-4" />
          Download Laporan
        </Button>
        <Button variant="outline" onClick={onRestart}>
          <RotateCcw className="mr-2 h-4 w-4" />
          Pembukaan Baru
        </Button>
      </div>

      <div className="mt-6 text-center text-sm text-muted-foreground">
        <p>Selamat berjualan! Semoga hari ini lancar dan berkah.</p>
      </div>
    </div>
  )
}