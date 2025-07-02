"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  ArrowLeft,
  Calendar,
  DollarSign,
  ShoppingCart,
  Package,
  TrendingUp,
  TrendingDown,
  Clock,
  User,
  AlertCircle,
  CheckCircle,
  XCircle,
  Loader2
} from "lucide-react";
import { formatCurrency } from "@/lib/utils/format";
import { formatDateUTC7, formatTimeWIB } from "@/lib/utils/format-date";
import { useToast } from "@/hooks/use-toast";

interface DayDetail {
  date: string;
  dayName: string;
  openingData: {
    time: string;
    user: string;
    openingCash: number;
    stockCount: number;
    discrepancies: Array<{ product: string; expected: number; actual: number }>;
  };
  closingData: {
    time: string;
    user: string;
    closingCash: number;
    expectedCash: number;
    cashDiscrepancy: number;
    note?: string;
  };
  transactions: Array<{
    id: string;
    time: string;
    type: string;
    items: Array<{ name: string; quantity: number; price?: number }>;
    totalAmount?: number;
    paymentMethod?: string;
    notes?: string;
  }>;
  stockMovements: Array<{
    product: string;
    opening: number;
    purchased: number;
    sold: number;
    damaged: number;
    bonus: number;
    closing: number;
  }>;
  summary: {
    totalSales: number;
    totalCashSales: number;
    totalQrisSales: number;
    totalTransactions: number;
    totalItemsSold: number;
    averageTransactionValue: number;
    topProducts: Array<{ name: string; quantity: number; revenue: number }>;
  };
}

export default function HistoryDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [dayDetail, setDayDetail] = useState<DayDetail | null>(null);
  const [activeTab, setActiveTab] = useState("transactions");

  const date = params.date as string;

  useEffect(() => {
    fetchDayDetail();
  }, [date]);

  const fetchDayDetail = async () => {
    setLoading(true);
    try {
      // Mock data for now
      const mockDetail: DayDetail = {
        date: date,
        dayName: formatDateUTC7(new Date(date), 'EEEE'),
        openingData: {
          time: "07:45",
          user: "manager1",
          openingCash: 150000,
          stockCount: 250,
          discrepancies: [
            { product: "Risol Mayo", expected: 50, actual: 48 },
            { product: "Risol Beef", expected: 30, actual: 30 },
          ]
        },
        closingData: {
          time: "21:30",
          user: "manager1",
          closingCash: 485000,
          expectedCash: 480000,
          cashDiscrepancy: 5000,
          note: "Kelebihan dari tips pelanggan"
        },
        transactions: Array.from({ length: 15 }, (_, i) => ({
          id: `trans-${i}`,
          time: `${8 + Math.floor(i * 0.8)}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}`,
          type: i % 10 === 0 ? 'damaged' : 'sales',
          items: [
            { name: "Risol Mayo", quantity: Math.floor(Math.random() * 5) + 1, price: 8000 },
            { name: "Risol Beef", quantity: Math.floor(Math.random() * 3) + 1, price: 10000 },
          ],
          totalAmount: i % 10 === 0 ? undefined : (Math.floor(Math.random() * 50) + 20) * 1000,
          paymentMethod: i % 10 === 0 ? undefined : (Math.random() > 0.5 ? 'cash' : 'qris'),
          notes: i % 5 === 0 ? "Pelanggan reguler" : undefined
        })),
        stockMovements: [
          { product: "Risol Mayo", opening: 50, purchased: 0, sold: 35, damaged: 2, bonus: 0, closing: 13 },
          { product: "Risol Beef", opening: 30, purchased: 0, sold: 25, damaged: 0, bonus: 1, closing: 4 },
          { product: "Risol Cheese", opening: 20, purchased: 0, sold: 15, damaged: 0, bonus: 0, closing: 5 },
        ],
        summary: {
          totalSales: 380000,
          totalCashSales: 228000,
          totalQrisSales: 152000,
          totalTransactions: 14,
          totalItemsSold: 75,
          averageTransactionValue: 27143,
          topProducts: [
            { name: "Risol Mayo", quantity: 35, revenue: 280000 },
            { name: "Risol Beef", quantity: 25, revenue: 250000 },
            { name: "Risol Cheese", quantity: 15, revenue: 120000 },
          ]
        }
      };

      setDayDetail(mockDetail);
    } catch (error) {
      console.error("Error fetching day detail:", error);
      toast({
        title: "Error",
        description: "Gagal memuat detail hari",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-screen">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      </AppLayout>
    );
  }

  if (!dayDetail) {
    return (
      <AppLayout>
        <div className="p-6">
          <p>Data tidak ditemukan</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="container max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/history')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Kembali
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Calendar className="h-6 w-6" />
              {dayDetail.dayName}, {formatDateUTC7(new Date(date), 'd MMMM yyyy')}
            </h1>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Penjualan
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(dayDetail.summary.totalSales)}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                Tunai: {formatCurrency(dayDetail.summary.totalCashSales)}
              </div>
              <div className="text-xs text-muted-foreground">
                QRIS: {formatCurrency(dayDetail.summary.totalQrisSales)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Transaksi
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {dayDetail.summary.totalTransactions}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                Rata-rata: {formatCurrency(dayDetail.summary.averageTransactionValue)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Item Terjual
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {dayDetail.summary.totalItemsSold} pcs
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Selisih Kas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${dayDetail.closingData.cashDiscrepancy >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                {dayDetail.closingData.cashDiscrepancy >= 0 ? '+' : ''}{formatCurrency(dayDetail.closingData.cashDiscrepancy)}
              </div>
              {dayDetail.closingData.note && (
                <div className="text-xs text-muted-foreground mt-1">
                  {dayDetail.closingData.note}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Opening & Closing Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                Pembukaan
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span>{dayDetail.openingData.time}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <User className="h-4 w-4 text-muted-foreground" />
                <span>{dayDetail.openingData.user}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <span>Kas: {formatCurrency(dayDetail.openingData.openingCash)}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Package className="h-4 w-4 text-muted-foreground" />
                <span>Stok: {dayDetail.openingData.stockCount} pcs</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <XCircle className="h-5 w-5 text-red-600" />
                Penutupan
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span>{dayDetail.closingData.time}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <User className="h-4 w-4 text-muted-foreground" />
                <span>{dayDetail.closingData.user}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <span>Kas Aktual: {formatCurrency(dayDetail.closingData.closingCash)}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                <span>Kas Expected: {formatCurrency(dayDetail.closingData.expectedCash)}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="transactions">Transaksi</TabsTrigger>
            <TabsTrigger value="stock">Pergerakan Stok</TabsTrigger>
            <TabsTrigger value="products">Produk Terlaris</TabsTrigger>
          </TabsList>

          {/* Transactions Tab */}
          <TabsContent value="transactions">
            <Card>
              <CardHeader>
                <CardTitle>Daftar Transaksi</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Waktu</TableHead>
                        <TableHead>Tipe</TableHead>
                        <TableHead>Item</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                        <TableHead>Pembayaran</TableHead>
                        <TableHead>Catatan</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {dayDetail.transactions.map((trans) => (
                        <TableRow key={trans.id}>
                          <TableCell className="font-medium">{trans.time}</TableCell>
                          <TableCell>
                            <Badge variant={trans.type === 'sales' ? 'default' : 'destructive'}>
                              {trans.type === 'sales' ? 'Penjualan' : 'Rusak'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {trans.items.map((item, idx) => (
                              <div key={idx} className="text-sm">
                                {item.name} × {item.quantity}
                              </div>
                            ))}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {trans.totalAmount ? formatCurrency(trans.totalAmount) : '-'}
                          </TableCell>
                          <TableCell>
                            {trans.paymentMethod && (
                              <Badge variant="outline">
                                {trans.paymentMethod === 'cash' ? 'Tunai' : 'QRIS'}
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {trans.notes || '-'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Stock Movement Tab */}
          <TabsContent value="stock">
            <Card>
              <CardHeader>
                <CardTitle>Pergerakan Stok</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Produk</TableHead>
                        <TableHead className="text-center">Opening</TableHead>
                        <TableHead className="text-center">Beli</TableHead>
                        <TableHead className="text-center">Jual</TableHead>
                        <TableHead className="text-center">Rusak</TableHead>
                        <TableHead className="text-center">Bonus</TableHead>
                        <TableHead className="text-center">Closing</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {dayDetail.stockMovements.map((stock, idx) => (
                        <TableRow key={idx}>
                          <TableCell className="font-medium">{stock.product}</TableCell>
                          <TableCell className="text-center">{stock.opening}</TableCell>
                          <TableCell className="text-center text-green-600">
                            {stock.purchased > 0 ? `+${stock.purchased}` : '-'}
                          </TableCell>
                          <TableCell className="text-center text-red-600">
                            {stock.sold > 0 ? `-${stock.sold}` : '-'}
                          </TableCell>
                          <TableCell className="text-center text-orange-600">
                            {stock.damaged > 0 ? `-${stock.damaged}` : '-'}
                          </TableCell>
                          <TableCell className="text-center text-blue-600">
                            {stock.bonus > 0 ? `-${stock.bonus}` : '-'}
                          </TableCell>
                          <TableCell className="text-center font-medium">{stock.closing}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Top Products Tab */}
          <TabsContent value="products">
            <Card>
              <CardHeader>
                <CardTitle>Produk Terlaris</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {dayDetail.summary.topProducts.map((product, idx) => (
                    <div key={idx} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h4 className="font-medium">{product.name}</h4>
                        <p className="text-sm text-muted-foreground">{product.quantity} pcs terjual</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-green-600">{formatCurrency(product.revenue)}</p>
                        <p className="text-sm text-muted-foreground">
                          {((product.revenue / dayDetail.summary.totalSales) * 100).toFixed(1)}% dari total
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}