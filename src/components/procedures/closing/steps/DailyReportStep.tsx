"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FileText, TrendingUp, ShoppingCart, AlertTriangle, Gift } from "lucide-react";
import { formatCurrency } from "@/lib/utils/format";

interface DailyReportStepProps {
  data: any;
  onNext: (data: any) => void;
}

export function DailyReportStep({ data, onNext }: DailyReportStepProps) {
  const [notes, setNotes] = useState(data.notes || "");
  const [issues, setIssues] = useState(data.issues || "");
  const [reportData, setReportData] = useState({
    totalSales: 0,
    totalTransactions: 0,
    totalPurchases: 0,
    totalDamaged: 0,
    totalBonus: 0,
    grossProfit: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDailyData();
  }, []);

  const fetchDailyData = async () => {
    try {
      // Fetch today's transactions
      const transResponse = await fetch('/api/transactions', {
        credentials: 'include'
      });
      
      if (transResponse.ok) {
        const transactions = await transResponse.json();
        
        let salesTotal = 0;
        let salesCount = 0;
        let damagedTotal = 0;
        let bonusTotal = 0;
        
        transactions.forEach((trans: any) => {
          if (trans.type === 'sales') {
            salesTotal += Number(trans.totalAmount) || 0;
            salesCount++;
          } else if (trans.type === 'damaged') {
            // Calculate damaged value based on items
            if (trans.items && Array.isArray(trans.items)) {
              trans.items.forEach((item: any) => {
                damagedTotal += (item.quantity || 0) * (item.price || 0);
              });
            }
          } else if (trans.type === 'bonus') {
            // Calculate bonus value based on items
            if (trans.items && Array.isArray(trans.items)) {
              trans.items.forEach((item: any) => {
                bonusTotal += (item.quantity || 0) * (item.price || 0);
              });
            }
          }
        });

        // Fetch today's purchases
        const purchaseResponse = await fetch('/api/purchases', {
          credentials: 'include'
        });
        
        let purchasesTotal = 0;
        if (purchaseResponse.ok) {
          const purchases = await purchaseResponse.json();
          // Filter today's purchases
          const today = new Date().toISOString().split('T')[0];
          const todayPurchases = purchases.filter((p: any) => 
            p.purchaseDate.split('T')[0] === today
          );
          
          purchasesTotal = todayPurchases.reduce((sum: number, p: any) => 
            sum + (Number(p.totalAmount) || 0), 0
          );
        }

        // Calculate gross profit (very simplified)
        // In reality, you'd need to calculate based on actual COGS
        const estimatedCOGS = salesTotal * 0.4; // Assume 40% COGS
        const grossProfit = salesTotal - estimatedCOGS;

        setReportData({
          totalSales: salesTotal,
          totalTransactions: salesCount,
          totalPurchases: purchasesTotal,
          totalDamaged: damagedTotal,
          totalBonus: bonusTotal,
          grossProfit: grossProfit,
        });
      }
    } catch (error) {
      console.error("Error fetching daily data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = () => {
    onNext({
      ...reportData,
      notes,
      issues,
      completedAt: new Date().toISOString(),
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Menyiapkan laporan harian...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Laporan Harian
        </h2>
        <p className="text-muted-foreground mt-1">
          Ringkasan aktivitas dan performa hari ini
        </p>
      </div>

      {/* Sales Summary */}
      <Card className="border-green-200 bg-green-50">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-green-600" />
            Penjualan
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Total Penjualan</p>
              <p className="text-2xl font-bold text-green-700">
                {formatCurrency(reportData.totalSales)}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Jumlah Transaksi</p>
              <p className="text-2xl font-bold text-green-700">
                {reportData.totalTransactions}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Other Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <ShoppingCart className="h-4 w-4 text-blue-600" />
              Pembelian
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-bold text-blue-600">
              {formatCurrency(reportData.totalPurchases)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              Rusak/Gagal
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-bold text-red-600">
              {formatCurrency(reportData.totalDamaged)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Gift className="h-4 w-4 text-purple-600" />
              Bonus
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-bold text-purple-600">
              {formatCurrency(reportData.totalBonus)}
            </p>
          </CardContent>
        </Card>

        <Card className="border-orange-200 bg-orange-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Laba Kotor (Estimasi)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-bold text-orange-700">
              {formatCurrency(reportData.grossProfit)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              ±60% dari penjualan
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Notes Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Catatan Operasional</CardTitle>
          <CardDescription>
            Hal-hal penting yang terjadi hari ini
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Contoh: Pelanggan komplain tentang..., Stok X hampir habis, dll"
            className="min-h-[100px]"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Masalah & Tindak Lanjut</CardTitle>
          <CardDescription>
            Masalah yang perlu ditindaklanjuti besok
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            value={issues}
            onChange={(e) => setIssues(e.target.value)}
            placeholder="Contoh: Perlu beli gas, Freezer kurang dingin, dll"
            className="min-h-[100px]"
          />
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSubmit} className="w-full md:w-auto">
          Lanjut ke Pembersihan & Keamanan
        </Button>
      </div>
    </div>
  );
}