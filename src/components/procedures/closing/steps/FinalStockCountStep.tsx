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

interface StockItem {
  id: string;
  name: string;
  type: string;
  unit: string;
  openingStock: number;
  currentStock: number;
  soldCount: number;
  damagedCount: number;
  notes: string;
}

interface FinalStockCountStepProps {
  data: any;
  onNext: (data: any) => void;
}

export function FinalStockCountStep({ data, onNext }: FinalStockCountStepProps) {
  const [stockItems, setStockItems] = useState<StockItem[]>(data.stockItems || []);
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
      const stocksResponse = await api.get("/api/stocks");
      const stocks = stocksResponse.data || [];

      // Get opening procedure data for initial counts
      const openingResult = await openingProcedureService.checkTodayOpening();
      let openingStockData: Record<string, number> = {};
      
      if (openingResult.hasOpening && openingResult.opening?.stepData?.step2) {
        const openingStocks = openingResult.opening.stepData.step2.stockItems || [];
        openingStocks.forEach((item: any) => {
          // For risol products, sum up all counts
          if (item.frozenCount !== undefined) {
            openingStockData[item.id] = (item.frozenCount || 0) + (item.readyCount || 0);
          } else {
            openingStockData[item.id] = item.currentCount || 0;
          }
        });
      }

      // Get today's transactions to calculate sold/damaged
      const transResponse = await fetch('/api/transactions', {
        credentials: 'include'
      });
      
      const transactionData: Record<string, { sold: number; damaged: number }> = {};
      
      if (transResponse.ok) {
        const transactions = await transResponse.json();
        
        // Calculate sold and damaged for each item
        transactions.forEach((trans: any) => {
          if (trans.items && Array.isArray(trans.items)) {
            trans.items.forEach((item: any) => {
              const stockId = item.stockId || item.id;
              if (!transactionData[stockId]) {
                transactionData[stockId] = { sold: 0, damaged: 0 };
              }
              
              if (trans.type === 'sales') {
                transactionData[stockId].sold += item.quantity || 0;
              } else if (trans.type === 'damaged') {
                transactionData[stockId].damaged += item.quantity || 0;
              }
            });
          }
        });
      }

      // Map stocks to stock items with all calculations
      const mappedItems: StockItem[] = stocks.map((stock: any) => ({
        id: stock.id,
        name: stock.name,
        type: stock.type,
        unit: stock.unit,
        openingStock: openingStockData[stock.id] || 0,
        currentStock: 0, // User will count this
        soldCount: transactionData[stock.id]?.sold || 0,
        damagedCount: transactionData[stock.id]?.damaged || 0,
        notes: "",
      }));

      setStockItems(mappedItems);
    } catch (error) {
      console.error("Error fetching stock data:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateStockItem = (id: string, field: keyof StockItem, value: any) => {
    setStockItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, [field]: value } : item
      )
    );
  };

  const getExpectedStock = (item: StockItem) => {
    // Expected = Opening + Purchases - Sales - Damaged - Bonus
    // For now: Expected = Opening - Sales - Damaged
    return Math.max(0, item.openingStock - item.soldCount - item.damagedCount);
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
          const difference = item.currentStock - expectedStock;
          
          return (
            <Card key={item.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{item.name}</CardTitle>
                  <span className="text-sm text-muted-foreground">
                    {item.type === "product" ? "Produk" : 
                     item.type === "packaging" ? "Kemasan" :
                     item.type === "utilities" ? "Utilitas" : "Bahan"}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                  <div>
                    <p className="text-muted-foreground">Stok Awal</p>
                    <p className="font-medium">{item.openingStock} {item.unit}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Terjual</p>
                    <p className="font-medium text-green-600">{item.soldCount} {item.unit}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Rusak</p>
                    <p className="font-medium text-red-600">{item.damagedCount} {item.unit}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Perkiraan</p>
                    <p className="font-medium">{expectedStock} {item.unit}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Label className="w-24">Stok Fisik:</Label>
                  <Input
                    type="number"
                    min="0"
                    value={item.currentStock}
                    onChange={(e) =>
                      updateStockItem(item.id, "currentStock", parseInt(e.target.value) || 0)
                    }
                    className="w-32"
                    placeholder="0"
                  />
                  <span className="text-sm text-muted-foreground">{item.unit}</span>
                  
                  {item.currentStock > 0 && difference !== 0 && (
                    <span className={`ml-auto text-sm font-medium ${
                      difference > 0 ? "text-blue-600" : "text-red-600"
                    }`}>
                      {difference > 0 && "+"}{difference} {item.unit}
                    </span>
                  )}
                </div>

                {difference !== 0 && item.currentStock > 0 && (
                  <div className="flex items-start gap-2 p-2 bg-amber-50 rounded-md">
                    <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5" />
                    <p className="text-xs text-amber-700">
                      Ada selisih dengan perkiraan sistem. Mohon berikan catatan.
                    </p>
                  </div>
                )}

                <Input
                  type="text"
                  value={item.notes}
                  onChange={(e) => updateStockItem(item.id, "notes", e.target.value)}
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