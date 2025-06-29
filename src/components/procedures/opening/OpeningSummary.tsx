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
  Download,
  RotateCcw,
} from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { formatDateUTC7, formatTimeWIB } from "@/lib/utils/format-date";

interface OpeningSummaryProps {
  data: Record<number, any>;
  onRestart: () => void;
}

export function OpeningSummary({ data, onRestart }: OpeningSummaryProps) {
  // Handle both formats: data[1] or data.step1
  const step1Data = data[1] || data.step1;
  const step2Data = data[2] || data.step2;
  const step3Data = data[3] || data.step3;
  const step4Data = data[4] || data.step4;
  const step5Data = data[5] || data.step5;

  const startTime = step1Data?.completedAt
    ? new Date(step1Data.completedAt)
    : new Date();
  const endTime = step5Data?.completedAt
    ? new Date(step5Data.completedAt)
    : new Date();
  const duration = Math.round(
    (endTime.getTime() - startTime.getTime()) / 1000 / 60
  );

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getTotalStock = () => {
    const stockData = step2Data?.stockItems || [];
    return stockData.reduce((total: number, item: any) => {
      if (item.frozenCount !== undefined) {
        // Old format
        return total + (item.frozenCount || 0) + (item.readyCount || 0);
      } else {
        // Should not happen with current format, but just in case
        return total + (item.count || 0);
      }
    }, 0);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 pb-32 md:px-6 md:pb-8">
      <div className="py-8 text-center">
        <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-green-100 mb-6">
          <CheckCircle2 className="h-10 w-10 text-green-600" />
        </div>
        <h1 className="text-2xl font-semibold text-gray-900 mb-2">
          Pembukaan Selesai!
        </h1>
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
              {step2Data?.stockItems
                ?.map((item: any) => {
                  const count =
                    (item.frozenCount || 0) + (item.readyCount || 0);
                  if (count === 0) return null;

                  return (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        {item.name} {item.variant && `- ${item.variant}`}
                      </span>
                      <span>
                        {count} pcs
                        {item.damagedCount > 0 && (
                          <span className="text-red-600 ml-2">
                            ({item.damagedCount} rusak)
                          </span>
                        )}
                      </span>
                    </div>
                  );
                })
                .filter(Boolean)}
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
              {formatCurrency(step4Data?.totalCash || 0)}
            </div>
            <div className="space-y-1">
              {step4Data?.denominations
                ?.filter((d: any) => d.count > 0)
                .map((denom: any) => (
                  <div
                    key={denom.value}
                    className="flex justify-between text-sm"
                  >
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
                { step: 1, name: "Kebersihan", icon: "🧼", data: step1Data },
                { step: 2, name: "Stok", icon: "📦", data: step2Data },
                { step: 3, name: "Display", icon: "🏪", data: step3Data },
                { step: 4, name: "Modal", icon: "💵", data: step4Data },
                { step: 5, name: "Final", icon: "✅", data: step5Data },
              ].map(({ step, name, icon, data: stepData }) => (
                <div key={step} className="flex items-center gap-2">
                  <span>{icon}</span>
                  <span className="flex-1">
                    {name}
                    {stepData?.completedBy && (
                      <span className="text-xs text-muted-foreground ml-2">
                        ({stepData.completedBy.userName})
                      </span>
                    )}
                  </span>
                  {stepData?.completedAt && (
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 text-center text-sm text-muted-foreground">
        <p>Selamat berjualan! Semoga hari ini lancar dan berkah.</p>
      </div>
    </div>
  );
}
