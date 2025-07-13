"use client";

import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  BarChart3, 
  TrendingUp, 
  Package, 
  Calendar,
  Download,
  RefreshCw,
  PieChart,
  AlertTriangle
} from "lucide-react";
import { SalesChart } from "@/components/reports/SalesChart";
import { CashChart } from "@/components/reports/CashChart";
import { StockChart } from "@/components/reports/StockChart";
import { RisolSalesPieChart } from "@/components/reports/RisolSalesPieChart";
import { formatCurrency } from "@/lib/utils/format";

export default function ReportsPage() {
  const [selectedPeriod, setSelectedPeriod] = useState("last30Days");
  const [loading, setLoading] = useState(false);
  const [summaryData, setSummaryData] = useState({
    totalSales: 0,
    totalTransactions: 0,
    averageDailySales: 0,
    currentCash: 0,
    totalStock: 0,
    averageRisolWasteRate: 0,
  });

  useEffect(() => {
    fetchSummaryData();
  }, [selectedPeriod]);

  const fetchSummaryData = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/reports/monthly?period=${selectedPeriod}`, {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch summary data');
      }
      
      const result = await response.json();
      
      if (result.success) {
        setSummaryData({
          totalSales: result.summary.totalSales,
          totalTransactions: result.summary.totalTransactions,
          averageDailySales: Math.round(result.summary.averageDailySales),
          currentCash: result.summary.currentCash,
          totalStock: result.summary.totalStock,
          averageRisolWasteRate: result.summary.averageRisolWasteRate || 0,
        });
      } else {
        throw new Error(result.error || 'Failed to fetch summary data');
      }
    } catch (error) {
      console.error("Error fetching summary data:", error);
      // Keep existing data or set to zeros
      setSummaryData({
        totalSales: 0,
        totalTransactions: 0,
        averageDailySales: 0,
        currentCash: 0,
        totalStock: 0,
        averageRisolWasteRate: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    fetchSummaryData();
  };

  const handleExport = () => {
    // TODO: Implement export functionality
    console.log("Exporting reports...");
  };

  return (
    <AppLayout>
      <div className="container max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <BarChart3 className="h-6 w-6" />
              Laporan
            </h1>
            <p className="text-muted-foreground">
              Analisis penjualan, kas, dan stok
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Pilih periode" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="last30Days">30 Hari Terakhir</SelectItem>
                <SelectItem value="last60Days">60 Hari Terakhir</SelectItem>
                <SelectItem value="last90Days">90 Hari Terakhir</SelectItem>
              </SelectContent>
            </Select>
            
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleRefresh}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            
            <Button size="sm" onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Penjualan
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {loading ? "..." : formatCurrency(summaryData.totalSales)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Transaksi
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loading ? "..." : summaryData.totalTransactions}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Tingkat Reject Risol
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {loading ? "..." : `${summaryData.averageRisolWasteRate.toFixed(1)}%`}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Rata-rata {selectedPeriod === "last30Days" ? "30 hari" : selectedPeriod === "last60Days" ? "60 hari" : "90 hari"}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="space-y-6">
          {/* Sales Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Grafik Penjualan
              </CardTitle>
            </CardHeader>
            <CardContent>
              <SalesChart period={selectedPeriod} />
            </CardContent>
          </Card>

          {/* Cash Flow Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Grafik Aliran Kas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CashChart period={selectedPeriod} />
            </CardContent>
          </Card>

          {/* Stock Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Grafik Pergerakan Stok
              </CardTitle>
            </CardHeader>
            <CardContent>
              <StockChart period={selectedPeriod} />
            </CardContent>
          </Card>

          {/* Risol Sales Pie Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="h-5 w-5" />
                Proporsi Penjualan Risol per Varian
              </CardTitle>
            </CardHeader>
            <CardContent>
              <RisolSalesPieChart period={selectedPeriod} />
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}