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
import { Package, AlertCircle } from "lucide-react";
import { api } from "@/lib/api/client";
import { openingProcedureService } from "@/lib/services/opening-procedure";
import { getDateInUTC7 } from "@/lib/utils/timezone";

interface StockItem {
  id: string;
  name: string;
  type: string;
  unit: string;
  variant?: string;
  // For products (risol)
  frozenCount?: number;
  readyCount?: number;
  damagedCount?: number;
  // For other items
  currentCount?: number;
  // Common fields
  openingStock: number;
  purchasedCount: number;
  soldCount: number;
  notes: string;
}

interface FinalStockCountStepProps {
  data: any;
  onNext: (data: any) => void;
}

export function FinalStockCountStep({
  data,
  onNext,
}: FinalStockCountStepProps) {
  const [stockItems, setStockItems] = useState<StockItem[]>(
    data.stockItems || []
  );
  const [generalNotes, setGeneralNotes] = useState(data.generalNotes || "");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!data.stockItems) {
      fetchStockData();
    } else {
      setLoading(false);
    }
  }, []);

  const fetchStockData = async () => {
    try {
      // Get all stocks
      const response = await fetch("/api/stocks", {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch stocks");

      const stocks = await response.json();

      // Get opening procedure data for initial counts
      const openingResult = await openingProcedureService.checkTodayOpening();
      let openingStockData: Record<string, number> = {};

      if (openingResult.hasOpening && openingResult.opening?.stepData?.step2) {
        const openingStocks =
          openingResult.opening.stepData.step2.stockItems || [];
        openingStocks.forEach((item: any) => {
          // For risol products, sum up all counts
          if (item.frozenCount !== undefined) {
            openingStockData[item.id] =
              (item.frozenCount || 0) + (item.readyCount || 0);
          } else {
            openingStockData[item.id] = item.currentCount || 0;
          }
        });
      }

      // Get today's transactions to calculate sold/damaged
      const transResponse = await fetch("/api/transactions", {
        credentials: "include",
      });

      const transactionData: Record<string, { sold: number; damaged: number }> =
        {};

      if (transResponse.ok) {
        const transactions = await transResponse.json();

        // Calculate sold and damaged for each item
        transactions.forEach((trans: any) => {
          if (trans.items && Array.isArray(trans.items)) {
            trans.items.forEach((item: any) => {
              // Find stock ID by matching product name and variant
              const stockId = stocks.find((s: any) => {
                const stockName = s.name;
                const itemFullName = item.variant
                  ? `${item.name} - ${item.variant}`
                  : item.name;
                return stockName === itemFullName || stockName === item.name;
              })?.id;

              if (stockId) {
                if (!transactionData[stockId]) {
                  transactionData[stockId] = { sold: 0, damaged: 0 };
                }

                if (trans.type === "sales") {
                  transactionData[stockId].sold += item.quantity || 0;
                } else if (trans.type === "damaged") {
                  transactionData[stockId].damaged += item.quantity || 0;
                }
              }
            });
          }
        });
      }

      // Get today's purchases to calculate purchased amounts
      const todayStr = getDateInUTC7();
      const purchaseResponse = await fetch(`/api/purchases/by-date?date=${todayStr}`, {
        credentials: "include",
      });

      const purchaseData: Record<string, number> = {};

      if (purchaseResponse.ok) {
        const todayPurchases = await purchaseResponse.json();

        console.log("Today:", todayStr);
        console.log("Today purchases:", todayPurchases);

        // Process purchase items
        todayPurchases.forEach((purchase: any) => {
          if (purchase.items && Array.isArray(purchase.items)) {
            purchase.items.forEach((item: any) => {
              if (item.stockId) {
                purchaseData[item.stockId] =
                  (purchaseData[item.stockId] || 0) + (parseFloat(item.quantity) || 0);
              }
            });
          }
        });

        console.log("Purchase data by stock:", purchaseData);
      }

      // Initialize stock items - same format as opening
      const mappedItems: StockItem[] = stocks.map((stock: any) => {
        if (stock.type === "product") {
          // For products (risol), use the special format
          const variant = stock.name.includes(" - ")
            ? stock.name.split(" - ")[1]
            : "";
          return {
            id: stock.id,
            name: stock.name.split(" - ")[0], // Extract product name
            type: stock.type,
            unit: stock.unit,
            variant: variant,
            frozenCount: 0,
            readyCount: 0,
            damagedCount: 0,
            openingStock: openingStockData[stock.id] || 0,
            purchasedCount: purchaseData[stock.id] || 0,
            soldCount: transactionData[stock.id]?.sold || 0,
            notes: "",
          };
        } else {
          // For other items, just count current stock
          return {
            id: stock.id,
            name: stock.name,
            type: stock.type,
            unit: stock.unit,
            currentCount: 0,
            openingStock: openingStockData[stock.id] || 0,
            purchasedCount: purchaseData[stock.id] || 0,
            soldCount: transactionData[stock.id]?.sold || 0,
            notes: "",
          };
        }
      });

      setStockItems(mappedItems);
    } catch (error) {
      console.error("Error fetching stock data:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateStockItem = (id: string, field: keyof StockItem, value: any) => {
    setStockItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  const getExpectedStock = (item: StockItem) => {
    // Expected = Opening + Purchased - Sales
    return Math.max(
      0,
      item.openingStock + item.purchasedCount - item.soldCount
    );
  };

  const getCurrentTotal = (item: StockItem) => {
    if (item.type === "product") {
      return (item.frozenCount || 0) + (item.readyCount || 0);
    }
    return item.currentCount || 0;
  };

  const handleSubmit = () => {
    onNext({
      stockItems,
      generalNotes,
      completedAt: new Date().toISOString(),
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading stock data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Package className="h-5 w-5" />
          Hitung Stok Akhir
        </h2>
        <p className="text-muted-foreground mt-1">
          Catat stok fisik untuk setiap item
        </p>
      </div>

      <div className="space-y-4">
        {stockItems.map((item) => {
          const expectedStock = getExpectedStock(item);
          const currentTotal = getCurrentTotal(item);
          const difference = currentTotal - expectedStock;

          return (
            <Card key={item.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">
                    {item.name} {item.variant && `- ${item.variant}`}
                  </CardTitle>
                  <span className="text-sm text-muted-foreground">
                    {item.type === "product"
                      ? "Produk"
                      : item.type === "packaging"
                      ? "Kemasan"
                      : item.type === "utilities"
                      ? "Utilitas"
                      : "Bahan"}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                  <div>
                    <p className="text-muted-foreground">Stok Awal</p>
                    <p className="font-medium">
                      {item.openingStock} {item.unit}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Pembelian</p>
                    <p className="font-medium text-blue-600">
                      +{item.purchasedCount} {item.unit}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Terjual</p>
                    <p className="font-medium text-green-600">
                      -{item.soldCount} {item.unit}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Perkiraan</p>
                    <p className="font-medium">
                      {expectedStock} {item.unit}
                    </p>
                  </div>
                </div>

                {/* Count inputs based on type */}
                {item.type === "product" ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-3 gap-3">
                      <div className="space-y-2">
                        <Label className="text-sm">Mentah/Frozen</Label>
                        <Input
                          type="number"
                          min="0"
                          value={item.frozenCount || 0}
                          onChange={(e) =>
                            updateStockItem(
                              item.id,
                              "frozenCount",
                              parseInt(e.target.value) || 0
                            )
                          }
                          placeholder="0"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm">Siap Jual</Label>
                        <Input
                          type="number"
                          min="0"
                          value={item.readyCount || 0}
                          onChange={(e) =>
                            updateStockItem(
                              item.id,
                              "readyCount",
                              parseInt(e.target.value) || 0
                            )
                          }
                          placeholder="0"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm">Rusak/Gagal</Label>
                        <Input
                          type="number"
                          min="0"
                          value={item.damagedCount || 0}
                          onChange={(e) =>
                            updateStockItem(
                              item.id,
                              "damagedCount",
                              parseInt(e.target.value) || 0
                            )
                          }
                          placeholder="0"
                        />
                      </div>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">Total:</span>
                      <span className="font-bold">
                        {currentTotal} {item.unit}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <Label className="w-24">Stok Fisik:</Label>
                    <Input
                      type="number"
                      min="0"
                      value={item.currentCount || 0}
                      onChange={(e) =>
                        updateStockItem(
                          item.id,
                          "currentCount",
                          parseInt(e.target.value) || 0
                        )
                      }
                      className="w-32"
                      placeholder="0"
                    />
                    <span className="text-sm text-muted-foreground">
                      {item.unit}
                    </span>
                  </div>
                )}

                {currentTotal > 0 && difference !== 0 && (
                  <div className="flex items-center justify-between p-2 bg-amber-50 rounded-md">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-amber-600" />
                      <p className="text-xs text-amber-700">
                        Selisih dengan perkiraan: {difference > 0 ? "+" : ""}
                        {difference} {item.unit}
                      </p>
                    </div>
                  </div>
                )}

                <Input
                  type="text"
                  value={item.notes}
                  onChange={(e) =>
                    updateStockItem(item.id, "notes", e.target.value)
                  }
                  placeholder="Catatan untuk item ini (opsional)"
                  className="text-sm"
                />
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* General Notes */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Catatan Umum Stok</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={generalNotes}
            onChange={(e) => setGeneralNotes(e.target.value)}
            placeholder="Catatan umum tentang kondisi stok hari ini..."
            className="min-h-[100px]"
          />
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSubmit} className="w-full md:w-auto">
          Lanjut ke Laporan Harian
        </Button>
      </div>
    </div>
  );
}
