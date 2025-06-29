"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Banknote, Calculator, AlertTriangle } from "lucide-react";
import { formatCurrency } from "@/lib/utils/format";
import { openingProcedureService } from "@/lib/services/opening-procedure";
import { getDateInUTC7 } from "@/lib/utils/timezone";

interface Denomination {
  value: number;
  count: number;
  label: string;
}

interface CashReconciliationStepProps {
  data: any;
  onNext: (data: any) => void;
}

export function CashReconciliationStep({ data, onNext }: CashReconciliationStepProps) {
  const [denominations, setDenominations] = useState<Denomination[]>(
    data.denominationCount || [
      { value: 100000, count: 0, label: "Rp 100.000" },
      { value: 50000, count: 0, label: "Rp 50.000" },
      { value: 20000, count: 0, label: "Rp 20.000" },
      { value: 10000, count: 0, label: "Rp 10.000" },
      { value: 5000, count: 0, label: "Rp 5.000" },
      { value: 2000, count: 0, label: "Rp 2.000" },
      { value: 1000, count: 0, label: "Rp 1.000" },
      { value: 500, count: 0, label: "Rp 500" },
    ]
  );
  const [notes, setNotes] = useState(data.notes || "");
  const [systemCash, setSystemCash] = useState(0);
  const [cashSales, setCashSales] = useState(0);
  const [digitalSales, setDigitalSales] = useState(0);
  const [digitalAmount, setDigitalAmount] = useState(data.digitalAmount || 0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSystemCash();
  }, []);

  const fetchSystemCash = async () => {
    try {
      // Get initial cash from opening
      let initialCash = 0;
      const openingResult = await openingProcedureService.checkTodayOpening();
      if (openingResult.hasOpening && openingResult.opening?.stepData?.step4) {
        initialCash = openingResult.opening.stepData.step4.totalCash || 0;
      }

      // Get today's transactions
      const transResponse = await fetch('/api/transactions', {
        credentials: 'include'
      });
      
      if (transResponse.ok) {
        const transactions = await transResponse.json();
        
        // Calculate today's sales - same logic as dashboard
        const salesTransactions = transactions.filter((t: any) => t.type === 'sales');
        const todaySales = salesTransactions.reduce((sum: number, t: any) => 
          sum + (Number(t.totalAmount) || 0), 0
        );
        
        // For now, assume all sales are cash since payment method is not in schema
        setCashSales(todaySales);
        setDigitalSales(0);
        
        // System cash = Modal awal + Total Penjualan (same as dashboard)
        setSystemCash(initialCash + todaySales);
      }
    } catch (error) {
      console.error("Error fetching system cash:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateDenomination = (index: number, count: number) => {
    setDenominations((prev) =>
      prev.map((denom, i) => (i === index ? { ...denom, count } : denom))
    );
  };

  const calculatePhysicalCash = () => {
    return denominations.reduce(
      (total, denom) => total + denom.value * denom.count,
      0
    );
  };

  const calculateDifference = () => {
    return calculatePhysicalCash() - systemCash;
  };

  const calculateTotalCash = () => {
    return calculatePhysicalCash() + digitalAmount;
  };

  const calculateOverallDifference = () => {
    return calculateTotalCash() - systemCash;
  };

  const handleSubmit = () => {
    onNext({
      physicalCash: calculatePhysicalCash(),
      digitalAmount,
      totalCash: calculateTotalCash(),
      systemCash,
      difference: calculateOverallDifference(),
      denominationCount: denominations,
      cashSales,
      digitalSales,
      notes,
      completedAt: new Date().toISOString(),
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Banknote className="h-5 w-5" />
          Rekonsiliasi Kas
        </h2>
        <p className="text-muted-foreground mt-1">
          Hitung uang fisik dan bandingkan dengan sistem
        </p>
      </div>

      {/* System Cash Info */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-lg">Kas Menurut Sistem</CardTitle>
          <CardDescription>
            Modal awal + Total Penjualan (Cash + QRIS)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-700">
            {loading ? "Loading..." : formatCurrency(systemCash)}
          </div>
          <div className="mt-3 pt-3 border-t border-blue-200 space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Modal Awal:</span>
              <span className="font-medium">{formatCurrency(systemCash - cashSales - digitalSales)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Penjualan:</span>
              <span className="font-medium text-green-600">+{formatCurrency(cashSales + digitalSales)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Physical Cash Count */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Hitung Uang Fisik</CardTitle>
          <CardDescription>
            Masukkan jumlah lembar untuk setiap pecahan
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {denominations.map((denom, index) => (
              <div key={denom.value} className="flex items-center gap-3">
                <Label className="w-24 text-right">{denom.label}</Label>
                <Input
                  type="number"
                  min="0"
                  value={denom.count}
                  onChange={(e) =>
                    updateDenomination(index, parseInt(e.target.value) || 0)
                  }
                  className="w-24"
                  placeholder="0"
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

      {/* Digital Money Count */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Hitung Uang Digital (QRIS)</CardTitle>
          <CardDescription>
            Masukkan total uang yang diterima melalui QRIS/transfer
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Label htmlFor="digital-amount">Total QRIS/Transfer:</Label>
              <Input
                id="digital-amount"
                type="number"
                min="0"
                value={digitalAmount}
                onChange={(e) => setDigitalAmount(parseInt(e.target.value) || 0)}
                className="w-40"
                placeholder="0"
              />
              <span className="ml-auto font-medium">
                {formatCurrency(digitalAmount)}
              </span>
            </div>
            {digitalSales > 0 && (
              <div className="text-sm text-muted-foreground">
                <p>Penjualan QRIS hari ini: {formatCurrency(digitalSales)}</p>
                {digitalAmount !== digitalSales && (
                  <p className="text-amber-600 mt-1">
                    Ada selisih {formatCurrency(Math.abs(digitalAmount - digitalSales))}
                  </p>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Reconciliation Summary */}
      <Card className={calculateOverallDifference() !== 0 ? "border-amber-200 bg-amber-50" : "border-green-200 bg-green-50"}>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Hasil Rekonsiliasi
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="space-y-3">
              <div>
                <p className="text-muted-foreground">Total Kas (Fisik + Digital)</p>
                <p className="text-xl font-bold">{formatCurrency(calculateTotalCash())}</p>
                <div className="text-xs text-muted-foreground mt-1 space-y-0.5">
                  <p>• Uang Fisik: {formatCurrency(calculatePhysicalCash())}</p>
                  <p>• Uang Digital: {formatCurrency(digitalAmount)}</p>
                </div>
              </div>
            </div>
            <div>
              <p className="text-muted-foreground">Kas Sistem</p>
              <p className="text-xl font-bold">{formatCurrency(systemCash)}</p>
              <div className="text-xs text-muted-foreground mt-1 space-y-0.5">
                <p>• Modal: {formatCurrency(systemCash - cashSales - digitalSales)}</p>
                <p>• Penjualan: {formatCurrency(cashSales + digitalSales)}</p>
              </div>
            </div>
          </div>
          
          <div className="pt-3 border-t">
            <div className="flex items-center justify-between">
              <span className="font-medium">Selisih Total</span>
              <span className={`text-xl font-bold ${
                calculateOverallDifference() === 0 ? "text-green-600" : 
                calculateOverallDifference() > 0 ? "text-blue-600" : "text-red-600"
              }`}>
                {calculateOverallDifference() > 0 && "+"}
                {formatCurrency(calculateOverallDifference())}
              </span>
            </div>
          </div>

          {calculateOverallDifference() !== 0 && (
            <div className="flex items-start gap-2 mt-3 p-3 bg-amber-100 rounded-md">
              <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
              <p className="text-sm text-amber-800">
                {calculateOverallDifference() > 0 
                  ? "Total kas lebih banyak dari sistem. Periksa kemungkinan transaksi yang belum tercatat." 
                  : "Total kas lebih sedikit dari sistem. Periksa kemungkinan kesalahan pengembalian atau transaksi yang salah input."}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Notes */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Catatan Rekonsiliasi</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Jelaskan penyebab selisih jika ada..."
            className="min-h-[100px]"
            required={calculateOverallDifference() !== 0}
          />
          {calculateOverallDifference() !== 0 && notes.trim() === "" && (
            <p className="text-sm text-red-500 mt-1">
              Catatan wajib diisi jika ada selisih kas
            </p>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button 
          onClick={handleSubmit} 
          className="w-full md:w-auto"
          disabled={calculateOverallDifference() !== 0 && notes.trim() === ""}
        >
          Lanjut ke Hitung Stok Akhir
        </Button>
      </div>
    </div>
  );
}