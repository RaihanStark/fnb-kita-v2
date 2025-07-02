"use client";

import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  History, 
  Calendar,
  TrendingUp,
  TrendingDown,
  Package,
  DollarSign,
  Users,
  Search,
  ChevronLeft,
  ChevronRight,
  Eye,
  Download,
  Loader2
} from "lucide-react";
import { formatCurrency } from "@/lib/utils/format";
import { formatDateUTC7 } from "@/lib/utils/format-date";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";

interface DailyHistory {
  date: string;
  dayName: string;
  openingCash: number;
  closingCash: number;
  totalSales: number;
  totalCashSales: number;
  totalQrisSales: number;
  totalTransactions: number;
  totalItemsSold: number;
  averageTransactionValue: number;
  stockDamaged: number;
  stockBonus: number;
  hasOpening: boolean;
  hasClosing: boolean;
  cashDiscrepancy: number;
  topProducts: Array<{ name: string; quantity: number; revenue: number }>;
}

export default function HistoryPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [historyData, setHistoryData] = useState<DailyHistory[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchHistoryData();
  }, [selectedMonth]);

  const fetchHistoryData = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/history?month=${selectedMonth}`, {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to fetch history data');
      }

      const result = await response.json();
      
      if (result.success) {
        setHistoryData(result.data);
      } else {
        throw new Error(result.error || 'Failed to fetch history data');
      }
    } catch (error) {
      console.error("Error fetching history data:", error);
      toast({
        title: "Error",
        description: "Gagal memuat data riwayat",
        variant: "destructive"
      });
      setHistoryData([]);
    } finally {
      setLoading(false);
    }
  };

  // Filter data based on search term
  const filteredData = historyData.filter(item => {
    const searchLower = searchTerm.toLowerCase();
    return (
      item.dayName.toLowerCase().includes(searchLower) ||
      item.date.includes(searchTerm) ||
      item.topProducts.some(p => p.name.toLowerCase().includes(searchLower))
    );
  });

  // Paginate data
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const getStatusBadge = (hasOpening: boolean, hasClosing: boolean) => {
    if (!hasOpening) {
      return <Badge variant="secondary">Tidak Buka</Badge>;
    }
    if (hasOpening && !hasClosing) {
      return <Badge variant="outline" className="border-orange-500 text-orange-600">Belum Tutup</Badge>;
    }
    return <Badge variant="default" className="bg-green-500">Selesai</Badge>;
  };

  const getCashDiscrepancyBadge = (discrepancy: number) => {
    if (discrepancy === 0) return null;
    
    if (discrepancy > 0) {
      return (
        <Badge variant="outline" className="border-blue-500 text-blue-600">
          <TrendingUp className="w-3 h-3 mr-1" />
          +{formatCurrency(discrepancy)}
        </Badge>
      );
    }
    
    return (
      <Badge variant="outline" className="border-red-500 text-red-600">
        <TrendingDown className="w-3 h-3 mr-1" />
        {formatCurrency(discrepancy)}
      </Badge>
    );
  };

  return (
    <AppLayout>
      <div className="container max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <History className="h-6 w-6" />
              Riwayat
            </h1>
            <p className="text-muted-foreground">
              Riwayat performa harian toko
            </p>
          </div>
          
          <Button variant="outline" onClick={() => console.log("Export")}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Cari berdasarkan hari, tanggal, atau produk..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger className="w-[200px]">
                  <Calendar className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {/* Generate last 6 months */}
                  {Array.from({ length: 6 }, (_, i) => {
                    const date = new Date();
                    date.setMonth(date.getMonth() - i);
                    const value = date.toISOString().slice(0, 7);
                    const label = date.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
                    return (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Penjualan Bulan Ini
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(historyData.reduce((sum, item) => sum + item.totalSales, 0))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Rata-rata Harian
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {formatCurrency(
                  historyData.length > 0 
                    ? historyData.reduce((sum, item) => sum + item.totalSales, 0) / historyData.length
                    : 0
                )}
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
                {historyData.reduce((sum, item) => sum + item.totalTransactions, 0)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Hari Operasional
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {historyData.filter(item => item.hasOpening).length} hari
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Table */}
        <Card>
          <CardHeader>
            <CardTitle>Riwayat Harian</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tanggal</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Penjualan</TableHead>
                        <TableHead className="text-right">Tunai/QRIS</TableHead>
                        <TableHead className="text-center">Transaksi</TableHead>
                        <TableHead className="text-center">Risol Terjual</TableHead>
                        <TableHead>Selisih Kas</TableHead>
                        <TableHead>Produk Terlaris</TableHead>
                        <TableHead className="text-center">Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedData.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                            Tidak ada data untuk periode ini
                          </TableCell>
                        </TableRow>
                      ) : (
                        paginatedData.map((item) => (
                          <TableRow key={item.date}>
                            <TableCell>
                              <div>
                                <div className="font-medium">{item.dayName}</div>
                                <div className="text-sm text-muted-foreground">
                                  {formatDateUTC7(new Date(item.date), 'd MMM yyyy')}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              {getStatusBadge(item.hasOpening, item.hasClosing)}
                            </TableCell>
                            <TableCell className="text-right font-medium">
                              {item.totalSales > 0 ? formatCurrency(item.totalSales) : '-'}
                            </TableCell>
                            <TableCell className="text-right">
                              {item.totalSales > 0 ? (
                                <div className="text-sm">
                                  <div>{formatCurrency(item.totalCashSales)}</div>
                                  <div className="text-muted-foreground">{formatCurrency(item.totalQrisSales)}</div>
                                </div>
                              ) : '-'}
                            </TableCell>
                            <TableCell className="text-center">
                              {item.totalTransactions > 0 ? item.totalTransactions : '-'}
                            </TableCell>
                            <TableCell className="text-center">
                              {item.totalItemsSold > 0 ? `${item.totalItemsSold} pcs` : '-'}
                            </TableCell>
                            <TableCell>
                              {item.hasClosing && getCashDiscrepancyBadge(item.cashDiscrepancy)}
                            </TableCell>
                            <TableCell>
                              {item.topProducts.length > 0 && (
                                <div className="text-sm">
                                  <div>{item.topProducts[0].name} ({item.topProducts[0].quantity})</div>
                                </div>
                              )}
                            </TableCell>
                            <TableCell className="text-center">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => router.push(`/history/${item.date}`)}
                                disabled={!item.hasOpening}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-4">
                    <div className="text-sm text-muted-foreground">
                      Menampilkan {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, filteredData.length)} dari {filteredData.length} data
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(currentPage - 1)}
                        disabled={currentPage === 1}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <div className="text-sm">
                        Halaman {currentPage} dari {totalPages}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(currentPage + 1)}
                        disabled={currentPage === totalPages}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}