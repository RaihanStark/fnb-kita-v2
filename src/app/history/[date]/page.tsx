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
  Loader2,
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
    discrepancies: Array<{
      name: string;
      type: string;
      unit: string;
      missingCount: number;
      excessCount: number;
      notes: string;
      discrepancyType: "missing" | "excess";
      discrepancyAmount: number;
    }>;
    generalNotes: string;
    hasDiscrepancies: boolean;
    totalDiscrepancies: number;
  } | null;
  closingData: {
    time: string;
    user: string;
    closingCash: number;
    expectedCash: number;
    cashDiscrepancy: number;
    note?: string;
  } | null;
  transactions: Array<{
    id: string;
    time: string;
    type: string;
    items: Array<{
      name: string;
      variant?: string;
      quantity: number;
      price?: number;
    }>;
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
    disposal: number;
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
      const response = await fetch(`/api/history/${date}`, {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to fetch day detail");
      }

      const result = await response.json();

      if (result.success) {
        setDayDetail(result.data);
      } else {
        throw new Error(result.error || "Failed to fetch day detail");
      }
    } catch (error) {
      console.error("Error fetching day detail:", error);
      toast({
        title: "Error",
        description: "Gagal memuat detail hari",
        variant: "destructive",
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

  console.log("Day Detail:", dayDetail);
  console.log("Opening Data:", dayDetail.openingData);
  if (dayDetail.openingData) {
    console.log("Has Discrepancies:", dayDetail.openingData.hasDiscrepancies);
    console.log("Discrepancies:", dayDetail.openingData.discrepancies);
  }

  return (
    <AppLayout>
      <div className="container max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/history")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Kembali
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Calendar className="h-6 w-6" />
              {dayDetail.dayName},{" "}
              {formatDateUTC7(new Date(date), "d MMMM yyyy")}
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
                Rata-rata:{" "}
                {formatCurrency(dayDetail.summary.averageTransactionValue)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Risol Terjual
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
              {dayDetail.closingData ? (
                <>
                  <div
                    className={`text-2xl font-bold ${
                      dayDetail.closingData.cashDiscrepancy >= 0
                        ? "text-blue-600"
                        : "text-red-600"
                    }`}
                  >
                    {dayDetail.closingData.cashDiscrepancy >= 0 ? "+" : ""}
                    {formatCurrency(dayDetail.closingData.cashDiscrepancy)}
                  </div>
                  {dayDetail.closingData.note && (
                    <div className="text-xs text-muted-foreground mt-1">
                      {dayDetail.closingData.note}
                    </div>
                  )}
                </>
              ) : (
                <div className="text-2xl font-bold text-gray-400">-</div>
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
            <CardContent className="space-y-3">
              {dayDetail.openingData ? (
                <>
                  <div className="space-y-2">
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
                      <span>
                        Kas: {formatCurrency(dayDetail.openingData.openingCash)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Package className="h-4 w-4 text-muted-foreground" />
                      <span>Stok: {dayDetail.openingData.stockCount} pcs</span>
                    </div>
                  </div>

                  {/* Discrepancy Information */}
                  {dayDetail.openingData.hasDiscrepancies && (
                    <div className="border-t pt-3">
                      <div className="flex items-center gap-2 mb-3">
                        <AlertCircle className="h-4 w-4 text-amber-600" />
                        <span className="text-sm font-medium text-amber-800">
                          Selisih Stok (
                          {dayDetail.openingData.totalDiscrepancies} item)
                        </span>
                      </div>

                      {/* Summary of discrepancies */}
                      <div className="mb-3 p-2 bg-amber-100 border border-amber-300 rounded text-xs">
                        <div className="font-medium text-amber-800 mb-1">
                          Ringkasan Selisih:
                        </div>
                        <div className="space-y-1">
                          {(() => {
                            const missingItems =
                              dayDetail.openingData.discrepancies.filter(
                                (d) => d.discrepancyType === "missing"
                              );
                            const excessItems =
                              dayDetail.openingData.discrepancies.filter(
                                (d) => d.discrepancyType === "excess"
                              );

                            return (
                              <>
                                {missingItems.length > 0 && (
                                  <div className="text-red-700">
                                    • {missingItems.length} item hilang
                                  </div>
                                )}
                                {excessItems.length > 0 && (
                                  <div className="text-blue-700">
                                    • {excessItems.length} item kelebihan
                                  </div>
                                )}
                              </>
                            );
                          })()}
                        </div>
                      </div>

                      {/* Detailed discrepancy items */}
                      <div className="space-y-2">
                        {dayDetail.openingData.discrepancies.map(
                          (item, index) => (
                            <div
                              key={index}
                              className="text-xs bg-amber-50 border border-amber-200 rounded p-2"
                            >
                              <div className="flex items-center gap-1 mb-1">
                                <span className="font-medium">{item.name}</span>
                                <Badge
                                  variant={
                                    item.discrepancyType === "missing"
                                      ? "destructive"
                                      : "secondary"
                                  }
                                  className="text-xs"
                                >
                                  {item.discrepancyType === "missing"
                                    ? "Hilang"
                                    : "Kelebihan"}
                                </Badge>
                              </div>
                              <div className="text-amber-700">
                                {item.discrepancyType === "missing"
                                  ? `Hilang: ${item.discrepancyAmount} ${item.unit}`
                                  : `Kelebihan: ${item.discrepancyAmount} ${item.unit}`}
                              </div>
                              {item.notes && (
                                <div className="text-amber-600 mt-1 italic">
                                  <span className="font-medium">Catatan:</span>{" "}
                                  "{item.notes}"
                                </div>
                              )}
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  )}

                  {/* No Discrepancies Message */}
                  {!dayDetail.openingData.hasDiscrepancies && (
                    <div className="border-t pt-3">
                      <div className="flex items-center gap-2 text-sm text-green-700">
                        <CheckCircle className="h-4 w-4" />
                        <span>Tidak ada selisih stok</span>
                      </div>
                    </div>
                  )}

                  {/* General Notes */}
                  {dayDetail.openingData.generalNotes && (
                    <div className="border-t pt-3">
                      <div className="text-xs text-muted-foreground">
                        <span className="font-medium">Catatan:</span>{" "}
                        {dayDetail.openingData.generalNotes}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Tidak ada data pembukaan
                </p>
              )}
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
              {dayDetail.closingData ? (
                <>
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>{dayDetail.closingData.time}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <span>
                      Kas Aktual:{" "}
                      {formatCurrency(dayDetail.closingData.closingCash)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    <span>
                      Kas Expected:{" "}
                      {formatCurrency(dayDetail.closingData.expectedCash)}
                    </span>
                  </div>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Belum ada penutupan
                </p>
              )}
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
                          <TableCell className="font-medium">
                            {trans.time}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                trans.type === "sales"
                                  ? "default"
                                  : trans.type === "damaged"
                                  ? "destructive"
                                  : trans.type === "bonus"
                                  ? "secondary"
                                  : "outline"
                              }
                            >
                              {trans.type === "sales"
                                ? "Penjualan"
                                : trans.type === "damaged"
                                ? "Rusak"
                                : trans.type === "bonus"
                                ? "Bonus"
                                : trans.type === "disposal"
                                ? "Buang"
                                : trans.type}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {trans.items.map((item, idx) => (
                              <div key={idx} className="text-sm">
                                {item.name}{" "}
                                {item.variant ? `- ${item.variant}` : ""} ×{" "}
                                {item.quantity}
                              </div>
                            ))}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {trans.totalAmount
                              ? formatCurrency(trans.totalAmount)
                              : "-"}
                          </TableCell>
                          <TableCell>
                            {trans.paymentMethod && (
                              <Badge variant="outline">
                                {trans.paymentMethod === "cash"
                                  ? "Tunai"
                                  : "QRIS"}
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {trans.notes || "-"}
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
                        <TableHead className="text-center">Buang</TableHead>
                        <TableHead className="text-center">Closing</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {dayDetail.stockMovements.map((stock, idx) => (
                        <TableRow key={idx}>
                          <TableCell className="font-medium">
                            {stock.product}
                          </TableCell>
                          <TableCell className="text-center">
                            {stock.opening}
                          </TableCell>
                          <TableCell className="text-center text-green-600">
                            {stock.purchased > 0 ? `+${stock.purchased}` : "-"}
                          </TableCell>
                          <TableCell className="text-center text-red-600">
                            {stock.sold > 0 ? `-${stock.sold}` : "-"}
                          </TableCell>
                          <TableCell className="text-center text-orange-600">
                            {stock.damaged > 0 ? `-${stock.damaged}` : "-"}
                          </TableCell>
                          <TableCell className="text-center text-blue-600">
                            {stock.bonus > 0 ? `-${stock.bonus}` : "-"}
                          </TableCell>
                          <TableCell className="text-center text-gray-600">
                            {stock.disposal > 0 ? `-${stock.disposal}` : "-"}
                          </TableCell>
                          <TableCell className="text-center font-medium">
                            {stock.closing}
                          </TableCell>
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
                    <div
                      key={idx}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div>
                        <h4 className="font-medium">{product.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {product.quantity} pcs terjual
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-green-600">
                          {formatCurrency(product.revenue)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {(
                            (product.revenue / dayDetail.summary.totalSales) *
                            100
                          ).toFixed(1)}
                          % dari total
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
