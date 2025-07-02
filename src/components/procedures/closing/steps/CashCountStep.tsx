"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { NumberInput } from "@/components/ui/number-input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Banknote, Calculator, AlertCircle } from "lucide-react";
import { formatCurrency } from "@/lib/utils/format";
import { useToast } from "@/hooks/use-toast";

interface Denomination {
  value: number;
  count: number;
  label: string;
}

interface CashCountStepProps {
  data: any;
  onNext: (data: any) => void;
}

export function CashCountStep({ data, onNext }: CashCountStepProps) {
  const { toast } = useToast();
  const [denominations, setDenominations] = useState<Denomination[]>(
    data.denominations || [
      { value: 100000, count: 0, label: "Rp 100.000" },
      { value: 50000, count: 0, label: "Rp 50.000" },
      { value: 20000, count: 0, label: "Rp 20.000" },
      { value: 10000, count: 0, label: "Rp 10.000" },
      { value: 5000, count: 0, label: "Rp 5.000" },
      { value: 2000, count: 0, label: "Rp 2.000" },
      { value: 1000, count: 0, label: "Rp 1.000" },
    ]
  );
  const [expectedCash, setExpectedCash] = useState<number | null>(null);
  const [openingCash, setOpeningCash] = useState<number | null>(null);
  const [totalSales, setTotalSales] = useState<number | null>(null);
  const [totalCashSales, setTotalCashSales] = useState<number | null>(null);
  const [totalQrisSales, setTotalQrisSales] = useState<number | null>(null);
  const [discrepancyNote, setDiscrepancyNote] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchExpectedCash();
  }, []);

  const fetchExpectedCash = async () => {
    try {
      // Get today's opening cash and sales
      const response = await fetch(`/api/procedures/closing/expected-cash`, {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        if (data.openingCash !== null) {
          setOpeningCash(data.openingCash);
          setTotalSales(data.totalSales || 0);
          setTotalCashSales(data.totalCashSales || 0);
          setTotalQrisSales(data.totalQrisSales || 0);
          setExpectedCash(data.expectedCash);
        }
      }
    } catch (error) {
      console.error('Error fetching expected cash:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateDenomination = (index: number, count: number) => {
    setDenominations((prev) =>
      prev.map((denom, i) => (i === index ? { ...denom, count } : denom))
    );
  };

  const calculateTotal = () => {
    return denominations.reduce(
      (total, denom) => total + denom.value * denom.count,
      0
    );
  };

  const handleSubmit = () => {
    const currentTotal = calculateTotal();
    const hasDiscrepancy = expectedCash !== null && currentTotal !== expectedCash;
    
    // Check if discrepancy needs explanation
    if (hasDiscrepancy && !discrepancyNote.trim()) {
      toast({
        title: "Catatan Diperlukan",
        description: "Harap jelaskan perbedaan jumlah kas dengan yang diharapkan",
        variant: "destructive"
      });
      return;
    }

    onNext({
      denominations,
      totalClosingCash: currentTotal,
      expectedCash,
      openingCash,
      totalSales,
      totalCashSales,
      totalQrisSales,
      discrepancy: expectedCash !== null ? currentTotal - expectedCash : 0,
      discrepancyNote: discrepancyNote || null,
      completedAt: new Date().toISOString(),
    });
  };

  const getDiscrepancyInfo = () => {
    if (expectedCash === null || loading) return null;
    
    const currentTotal = calculateTotal();
    const difference = currentTotal - expectedCash;
    
    if (difference === 0) return null;
    
    return {
      difference,
      isExcess: difference > 0,
      message: difference > 0 
        ? `Kelebihan ${formatCurrency(Math.abs(difference))} dari yang diharapkan`
        : `Kurang ${formatCurrency(Math.abs(difference))} dari yang diharapkan`
    };
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Pecahan Uang</CardTitle>
          <CardDescription>
            Hitung jumlah uang kas akhir hari
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {denominations.map((denom, index) => (
              <div key={denom.value} className="flex items-center gap-3">
                <Label className="w-24 text-right">{denom.label}</Label>
                <NumberInput
                  min={0}
                  value={denom.count}
                  onChange={(value) => updateDenomination(index, value || 0)}
                  className="w-24"
                  placeholder="0"
                  allowDecimals={false}
                />
                <span className="text-sm text-muted-foreground">lembar</span>
                <span className="ml-auto font-medium">
                  {formatCurrency(denom.value * denom.count)}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-primary/5 border-primary/20">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Total Kas Penutupan
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-primary">
            {formatCurrency(calculateTotal())}
          </div>
          {expectedCash !== null && (
            <div className="mt-4 pt-4 border-t space-y-2">
              {openingCash !== null && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Kas Pembukaan:</span>
                  <span className="font-medium">{formatCurrency(openingCash)}</span>
                </div>
              )}
              {totalCashSales !== null && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Penjualan Tunai:</span>
                  <span className="font-medium">{formatCurrency(totalCashSales)}</span>
                </div>
              )}
              {totalQrisSales !== null && totalQrisSales > 0 && (
                <div className="flex justify-between text-sm text-gray-500">
                  <span className="text-muted-foreground">Penjualan QRIS:</span>
                  <span className="font-medium">{formatCurrency(totalQrisSales)}</span>
                </div>
              )}
              {totalSales !== null && (
                <div className="flex justify-between text-sm pt-1">
                  <span className="text-muted-foreground">Total Penjualan:</span>
                  <span className="font-medium">{formatCurrency(totalSales)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-semibold border-t pt-2">
                <span className="text-muted-foreground">Kas yang Diharapkan:</span>
                <span className="font-medium">{formatCurrency(expectedCash)}</span>
              </div>
              {getDiscrepancyInfo() && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Selisih:</span>
                  <span className={`font-medium ${getDiscrepancyInfo()!.isExcess ? 'text-blue-600' : 'text-red-600'}`}>
                    {getDiscrepancyInfo()!.isExcess ? '+' : '-'}{formatCurrency(Math.abs(getDiscrepancyInfo()!.difference))}
                  </span>
                </div>
              )}
            </div>
          )}
          {!expectedCash && !loading && (
            <p className="text-sm text-amber-600 mt-2">
              Tidak ada data pembukaan hari ini
            </p>
          )}
        </CardContent>
      </Card>

      {/* Discrepancy Clarification */}
      {getDiscrepancyInfo() && (
        <Alert className={getDiscrepancyInfo()!.isExcess ? "border-blue-200 bg-blue-50" : "border-red-200 bg-red-50"}>
          <div className="flex gap-3">
            <AlertCircle className={`h-4 w-4 mt-0.5 flex-shrink-0 ${getDiscrepancyInfo()!.isExcess ? 'text-blue-600' : 'text-red-600'}`} />
            <div className="flex-1">
              <AlertDescription className={`text-sm font-medium ${getDiscrepancyInfo()!.isExcess ? 'text-blue-800' : 'text-red-800'}`}>
                {getDiscrepancyInfo()!.message}
              </AlertDescription>
              <div className="mt-3">
                <Label htmlFor="discrepancy-note" className="text-xs">
                  Jelaskan alasan perbedaan <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="discrepancy-note"
                  placeholder={getDiscrepancyInfo()!.isExcess 
                    ? "Contoh: Ada penjualan tidak tercatat, tip dari pelanggan, dll..."
                    : "Contoh: Ada pengeluaran untuk belanja, kembalian salah, dll..."}
                  value={discrepancyNote}
                  onChange={(e) => setDiscrepancyNote(e.target.value)}
                  rows={2}
                  className="mt-1 text-sm"
                  required
                />
              </div>
            </div>
          </div>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Catatan Penting</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-1 text-sm text-muted-foreground">
            <li>• Pastikan semua transaksi hari ini sudah tercatat</li>
            <li>• Hitung dengan teliti setiap pecahan uang</li>
            <li>• Simpan uang kas di tempat yang aman</li>
          </ul>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSubmit} className="w-full md:w-auto">
          Simpan
        </Button>
      </div>
    </div>
  );
}