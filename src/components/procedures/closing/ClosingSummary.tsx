import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  CheckCircle2,
  Package,
  Banknote,
  Clock,
  TrendingUp,
  AlertTriangle,
  DollarSign,
  ShoppingCart,
} from "lucide-react";
import { formatDateUTC7, formatTimeWIB } from "@/lib/utils/format-date";
import { formatCurrency } from "@/lib/utils/format";

interface ClosingSummaryProps {
  data: Record<string, any>;
  onRestart: () => void;
}

export function ClosingSummary({ data, onRestart }: ClosingSummaryProps) {
  // Handle both formats: data[1] or data.step1
  const step1Data = data[1] || data.step1; // Cash Reconciliation
  const step2Data = data[2] || data.step2; // Final Stock Count
  const step3Data = data[3] || data.step3; // Daily Report
  const step4Data = data[4] || data.step4; // Cleaning & Security
  const step5Data = data[5] || data.step5; // Tomorrow Preparation

  const startTime = step1Data?.completedAt
    ? new Date(step1Data.completedAt)
    : new Date();
  const endTime = step5Data?.completedAt
    ? new Date(step5Data.completedAt)
    : new Date();
  const duration = Math.round(
    (endTime.getTime() - startTime.getTime()) / 1000 / 60
  );

  const getTotalProductStock = () => {
    const stockData = step2Data?.stockItems || [];
    return stockData
      .filter((item: any) => item.type === 'product')
      .reduce((total: number, item: any) => {
        return total + (item.frozenCount || 0) + (item.readyCount || 0);
      }, 0);
  };

  const getStockDiscrepancies = () => {
    const stockData = step2Data?.stockItems || [];
    return stockData.filter((item: any) => {
      const expected = item.openingStock + item.purchasedCount - item.soldCount;
      const actual = item.type === 'product' 
        ? (item.frozenCount || 0) + (item.readyCount || 0)
        : (item.currentCount || 0);
      return actual !== expected && actual > 0;
    });
  };

  return (
    <div className="max-w-4xl mx-auto px-4 pb-32 md:px-6 md:pb-8">
      <div className="py-8 text-center">
        <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-green-100 mb-6">
          <CheckCircle2 className="h-10 w-10 text-green-600" />
        </div>
        <h1 className="text-2xl font-semibold text-gray-900 mb-2">
          Penutupan Selesai!
        </h1>
        <p className="text-gray-600">
          Prosedur penutupan telah berhasil diselesaikan
        </p>
      </div>

      <div className="grid gap-4 mb-6">
        {/* Time Summary */}
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
                  {formatDateUTC7(endTime, "EEEE, d MMMM yyyy")}
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

        {/* Cash Reconciliation Summary */}
        <Card className={step1Data?.difference !== 0 ? "border-amber-200" : ""}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Banknote className="h-5 w-5" />
              Rekonsiliasi Kas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Total Kas</p>
                  <p className="text-xl font-bold">
                    {formatCurrency(step1Data?.totalCash || 0)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Fisik: {formatCurrency(step1Data?.physicalCash || 0)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Digital: {formatCurrency(step1Data?.digitalAmount || 0)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Kas Sistem</p>
                  <p className="text-xl font-bold">
                    {formatCurrency(step1Data?.systemCash || 0)}
                  </p>
                </div>
              </div>
              
              {step1Data?.difference !== 0 && (
                <div className="flex items-center gap-2 p-2 bg-amber-50 rounded-md">
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                  <span className="text-sm text-amber-700">
                    Selisih: {formatCurrency(step1Data?.difference || 0)}
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Sales Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Ringkasan Penjualan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Total Penjualan</span>
                <span className="text-2xl font-bold text-green-600">
                  {formatCurrency(step3Data?.totalSales || 0)}
                </span>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Transaksi</p>
                  <p className="font-medium">{step3Data?.totalTransactions || 0} kali</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Item Terjual</p>
                  <p className="font-medium">{step3Data?.totalItemsSold || 0} pcs</p>
                </div>
              </div>

              {step3Data?.bestSelling && (
                <div className="pt-2 border-t">
                  <p className="text-sm text-muted-foreground mb-1">Produk Terlaris</p>
                  <p className="font-medium">
                    {step3Data.bestSelling.name} ({step3Data.bestSelling.quantity} pcs)
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Final Stock Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Stok Akhir
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="text-xl font-bold">
                Total Produk: {getTotalProductStock()} pcs
              </div>
              
              {step2Data?.stockItems
                ?.filter((item: any) => item.type === 'product' && 
                  ((item.frozenCount || 0) + (item.readyCount || 0)) > 0)
                ?.map((item: any) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      {item.name} {item.variant && `- ${item.variant}`}
                    </span>
                    <span>
                      {(item.frozenCount || 0) + (item.readyCount || 0)} pcs
                      {item.damagedCount > 0 && (
                        <span className="text-red-600 ml-2">
                          ({item.damagedCount} rusak)
                        </span>
                      )}
                    </span>
                  </div>
                ))}

              {getStockDiscrepancies().length > 0 && (
                <div className="mt-3 p-2 bg-amber-50 rounded-md">
                  <p className="text-xs text-amber-700">
                    Ada {getStockDiscrepancies().length} item dengan selisih stok
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Tomorrow Preparation */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Persiapan Besok
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Modal Disiapkan</span>
                <span className="font-bold text-lg">
                  {formatCurrency(step5Data?.tomorrowCash || 0)}
                </span>
              </div>
              
              {step5Data?.needsItems && step5Data.needsItems.length > 0 && (
                <div className="pt-2 border-t">
                  <p className="text-sm font-medium mb-1">Kebutuhan Besok:</p>
                  <ul className="text-sm text-muted-foreground space-y-0.5">
                    {step5Data.needsItems.map((item: any, index: number) => (
                      <li key={index}>• {item}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Checklist Status */}
        <Card>
          <CardHeader>
            <CardTitle>Status Checklist</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {[
                { step: 1, name: "Rekonsiliasi Kas", icon: "💵", data: step1Data },
                { step: 2, name: "Hitung Stok", icon: "📦", data: step2Data },
                { step: 3, name: "Laporan Harian", icon: "📊", data: step3Data },
                { step: 4, name: "Bersih & Aman", icon: "🧹", data: step4Data },
                { step: 5, name: "Persiapan Besok", icon: "📅", data: step5Data },
              ].map(({ step, name, icon, data: stepData }) => (
                <div key={step} className="flex items-center gap-2">
                  <span>{icon}</span>
                  <span className="flex-1">{name}</span>
                  {stepData?.completedAt && (
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-center gap-4">
        <Button onClick={onRestart} className="w-full md:w-auto">
          Kembali ke Dashboard
        </Button>
      </div>

      <div className="mt-6 text-center text-sm text-muted-foreground">
        <p>Terima kasih atas kerja keras hari ini. Istirahat yang cukup!</p>
      </div>
    </div>
  );
}