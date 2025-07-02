"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { NumberInput } from "@/components/ui/number-input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Package, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";

interface StockItem {
  id: string;
  name: string;
  variant: string;
  totalCount: number;
  currentStock: number;
}

interface OtherItem {
  id: string;
  name: string;
  type: "packaging" | "utilities" | "consumables";
  unit: string;
  count: number;
  currentStock: number;
}

interface SimpleStockCountStepProps {
  data: any;
  onNext: (data: any) => void;
}

export function SimpleStockCountStep({
  data,
  onNext,
}: SimpleStockCountStepProps) {
  const { toast } = useToast();
  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const [otherItems, setOtherItems] = useState<OtherItem[]>([]);
  const [generalNotes, setGeneralNotes] = useState(data.generalNotes || "");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (data.stockItems && data.stockItems.length > 0) {
      // Load existing data with current stock
      loadExistingDataWithCurrentStock();
    } else {
      fetchProducts();
    }
  }, []);

  const loadExistingDataWithCurrentStock = async () => {
    try {
      // Convert existing data to simple format first
      const simpleProductItems = data.stockItems
        .filter((item: any) => item.type === "product")
        .map((item: any) => ({
          id: item.id,
          name: item.name,
          variant: item.variant || "",
          totalCount: (item.frozenCount || 0) + (item.readyCount || 0),
          currentStock: 0, // Will be updated with actual current stock
        }));

      const simpleOtherItems = data.stockItems
        .filter((item: any) => item.type !== "product")
        .map((item: any) => ({
          id: item.id,
          name: item.name,
          type: item.type,
          unit: item.unit,
          count: item.currentCount || 0,
          currentStock: 0, // Will be updated with actual current stock
        }));

      // Fetch current stock data
      const stocksResponse = await fetch("/api/stocks", {
        credentials: "include",
      });

      if (stocksResponse.ok) {
        const stocks = await stocksResponse.json();

        // Create maps for current stock lookup
        const productStocksMap = new Map();
        const otherStocksMap = new Map();

        stocks.forEach((stock: any) => {
          if (stock.type === "product") {
            productStocksMap.set(stock.name, stock.currentStock || 0);
          } else {
            otherStocksMap.set(stock.name, stock.currentStock || 0);
          }
        });

        // Update product items with current stock
        const updatedProductItems = simpleProductItems.map(
          (item: StockItem) => {
            const stockKey = `${item.name} - ${item.variant}`;
            return {
              ...item,
              currentStock: productStocksMap.get(stockKey) || 0,
            };
          }
        );

        // Update other items with current stock
        const updatedOtherItems = simpleOtherItems.map((item: OtherItem) => ({
          ...item,
          currentStock: otherStocksMap.get(item.name) || 0,
        }));

        setStockItems(updatedProductItems);
        setOtherItems(updatedOtherItems);
      } else {
        // If stocks API fails, use the data without current stock
        setStockItems(simpleProductItems);
        setOtherItems(simpleOtherItems);
      }

      // Load discrepancy notes
      const notes: Record<string, string> = {};
      data.stockItems.forEach((item: any) => {
        if (item.notes) {
          notes[item.id] = item.notes;
        }
      });
      setDiscrepancyNotes(notes);
    } catch (error) {
      console.error("Error loading existing data with current stock:", error);
      // Fallback to loading without current stock
      const simpleProductItems = data.stockItems
        .filter((item: any) => item.type === "product")
        .map((item: any) => ({
          id: item.id,
          name: item.name,
          variant: item.variant || "",
          totalCount: (item.frozenCount || 0) + (item.readyCount || 0),
          currentStock: 0,
        }));

      const simpleOtherItems = data.stockItems
        .filter((item: any) => item.type !== "product")
        .map((item: any) => ({
          id: item.id,
          name: item.name,
          type: item.type,
          unit: item.unit,
          count: item.currentCount || 0,
          currentStock: 0,
        }));

      setStockItems(simpleProductItems);
      setOtherItems(simpleOtherItems);

      // Load discrepancy notes
      const notes: Record<string, string> = {};
      data.stockItems.forEach((item: any) => {
        if (item.notes) {
          notes[item.id] = item.notes;
        }
      });
      setDiscrepancyNotes(notes);
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      // Fetch products
      const productsResponse = await fetch("/api/products", {
        credentials: "include",
      });
      if (!productsResponse.ok) throw new Error("Failed to fetch products");
      const products = await productsResponse.json();

      // Fetch stocks to get current stock info and other items
      const stocksResponse = await fetch("/api/stocks", {
        credentials: "include",
      });

      if (stocksResponse.ok) {
        const stocks = await stocksResponse.json();

        // Separate products and other items
        const productStocksMap = new Map();
        const otherStocksList: OtherItem[] = [];

        stocks.forEach((stock: any) => {
          if (stock.type === "product") {
            productStocksMap.set(stock.name, stock.currentStock || 0);
          } else {
            // It's packaging, utilities, or consumables
            otherStocksList.push({
              id: stock.id,
              name: stock.name,
              type: stock.type,
              unit: stock.unit,
              count: 0,
              currentStock: stock.currentStock || 0,
            });
          }
        });

        // Initialize stock items with products and current stock
        const initialStockItems = products.map((product: any) => {
          const stockKey = `${product.name} - ${product.variant}`;
          return {
            id: product.id,
            name: product.name,
            variant: product.variant,
            totalCount: 0,
            currentStock: productStocksMap.get(stockKey) || 0,
          };
        });

        setStockItems(initialStockItems);
        setOtherItems(otherStocksList);
      } else {
        // Just set products if stocks API fails
        const initialStockItems = products.map((product: any) => ({
          id: product.id,
          name: product.name,
          variant: product.variant,
          totalCount: 0,
          currentStock: 0,
        }));

        setStockItems(initialStockItems);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Gagal memuat data",
        variant: "destructive",
      });
      setStockItems([]);
      setOtherItems([]);
    } finally {
      setLoading(false);
    }
  };

  const updateStockCount = (id: string, count: number) => {
    setStockItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, totalCount: count } : item
      )
    );
  };

  const updateOtherItemCount = (id: string, count: number) => {
    setOtherItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, count: count } : item))
    );
  };

  const getTotalCount = () => {
    return stockItems.reduce((total, item) => total + item.totalCount, 0);
  };

  // Get items with stock discrepancies (both missing and excess)
  const getDiscrepancyItems = () => {
    const productDiscrepancies = stockItems
      .filter((item) => {
        const diff = item.currentStock - item.totalCount;
        return diff !== 0; // Only show if there's an actual discrepancy
      })
      .map((item) => ({
        ...item,
        type: "product" as const,
        unit: "pcs" as const, // Add unit for products
        discrepancy: item.currentStock - item.totalCount,
        discrepancyType:
          item.totalCount > item.currentStock
            ? "excess"
            : ("missing" as "excess" | "missing"),
      }));

    const otherDiscrepancies = otherItems
      .filter((item) => {
        const diff = item.currentStock - item.count;
        return diff !== 0; // Only show if there's an actual discrepancy
      })
      .map((item) => ({
        ...item,
        type: item.type,
        discrepancy: item.currentStock - item.count,
        discrepancyType:
          item.count > item.currentStock
            ? "excess"
            : ("missing" as "excess" | "missing"),
      }));

    return [...productDiscrepancies, ...otherDiscrepancies];
  };

  const [discrepancyNotes, setDiscrepancyNotes] = useState<
    Record<string, string>
  >({});

  const updateDiscrepancyNote = (itemId: string, note: string) => {
    setDiscrepancyNotes((prev) => ({
      ...prev,
      [itemId]: note,
    }));
  };

  const handleSubmit = () => {
    // Check if all discrepancies have notes
    const discrepancies = getDiscrepancyItems();
    const missingNotes = discrepancies.filter(
      (item) =>
        !discrepancyNotes[item.id] || discrepancyNotes[item.id].trim() === ""
    );

    if (missingNotes.length > 0) {
      toast({
        title: "Catatan Diperlukan",
        description: "Harap jelaskan semua selisih stok sebelum menyimpan",
        variant: "destructive",
      });
      return;
    }
    // Convert simple format back to expected format for compatibility
    const convertedProductItems = stockItems.map((item) => {
      const discrepancy = item.currentStock - item.totalCount;

      return {
        id: item.id,
        name: item.name,
        type: "product",
        unit: "pcs",
        variant: item.variant,
        frozenCount: 0,
        readyCount: item.totalCount,
        damagedCount: 0,
        missingCount: discrepancy > 0 ? discrepancy : 0,
        excessCount: discrepancy < 0 ? Math.abs(discrepancy) : 0,
        notes: discrepancyNotes[item.id] || "",
      };
    });

    // Convert other items to expected format
    const convertedOtherItems = otherItems.map((item) => {
      const discrepancy = item.currentStock - item.count;

      return {
        id: item.id,
        name: item.name,
        type: item.type,
        unit: item.unit,
        currentCount: item.count,
        missingCount: discrepancy > 0 ? discrepancy : 0,
        excessCount: discrepancy < 0 ? Math.abs(discrepancy) : 0,
        notes: discrepancyNotes[item.id] || "",
      };
    });

    // Combine all items
    const allItems = [...convertedProductItems, ...convertedOtherItems];

    onNext({
      stockItems: allItems,
      generalNotes,
      totalCount: getTotalCount(),
      totalProductCount: getTotalCount(),
      completedAt: new Date().toISOString(),
      discrepancyNotes: discrepancyNotes,
    });
  };

  return (
    <div className="space-y-4">
      <Alert className="border-amber-200 bg-amber-50">
        <div className="flex gap-3">
          <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
          <AlertDescription className="text-sm">
            Hitung stok akhir untuk setiap produk setelah penjualan hari ini
          </AlertDescription>
        </div>
      </Alert>

      {loading ? (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          <p className="text-sm text-gray-500 mt-2">Memuat data...</p>
        </div>
      ) : (
        <>
          {/* Products Section */}
          <div className="space-y-3">
            <div>
              <h3 className="text-base font-semibold text-gray-900">
                Produk Risol
              </h3>
              <p className="text-sm text-gray-600">
                Hitung sisa stok setiap varian produk
              </p>
            </div>

            {stockItems.length === 0 ? (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Tidak ada produk. Silakan tambahkan produk terlebih dahulu.
                </AlertDescription>
              </Alert>
            ) : (
              <div className="bg-white rounded-lg border">
                <div className="grid grid-cols-[1fr_120px] gap-4 p-3 border-b bg-gray-50">
                  <div className="text-sm font-medium text-gray-700">
                    Produk
                  </div>
                  <div className="text-sm font-medium text-gray-700 text-center">
                    Stok Akhir
                  </div>
                </div>
                {stockItems.map((item, index) => (
                  <div
                    key={item.id}
                    className={`grid grid-cols-[1fr_120px] gap-4 p-3 ${
                      index < stockItems.length - 1 ? "border-b" : ""
                    }`}
                  >
                    <div>
                      <div className="font-medium text-sm">
                        {item.name} - {item.variant}
                      </div>
                      <div className="text-xs text-gray-500">
                        Stok saat ini: {item.currentStock} pcs
                      </div>
                    </div>
                    <div>
                      <NumberInput
                        id={`stock-${item.id}`}
                        min={0}
                        value={item.totalCount}
                        onChange={(value) =>
                          updateStockCount(item.id, value || 0)
                        }
                        allowDecimals={false}
                        className="text-center"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Product Summary */}
          <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
            <div className="text-lg font-bold text-center text-orange-900">
              Total Stok Akhir: {getTotalCount()} pcs
            </div>
          </div>
        </>
      )}

      {/* Other Items Section */}
      {!loading && otherItems.length > 0 && (
        <div className="space-y-3">
          <div>
            <h3 className="text-base font-semibold text-gray-900">
              Barang Pendukung
            </h3>
            <p className="text-sm text-gray-600">
              Hitung sisa stok minyak, gas, kemasan, dan lainnya
            </p>
          </div>

          {["utilities", "packaging", "consumables"].map((type) => {
            const items = otherItems.filter((item) => item.type === type);
            if (items.length === 0) return null;

            const typeLabels = {
              utilities: "Utilitas (Gas, Minyak)",
              packaging: "Kemasan",
              consumables: "Habis Pakai",
            };

            const typeColors = {
              utilities: "bg-blue-50 border-blue-200",
              packaging: "bg-green-50 border-green-200",
              consumables: "bg-purple-50 border-purple-200",
            };

            return (
              <div key={type} className="space-y-2">
                <div className="text-sm font-semibold text-gray-700">
                  {typeLabels[type as keyof typeof typeLabels]}
                </div>
                <div className="bg-white rounded-lg border">
                  <div className="grid grid-cols-[1fr_100px_50px] gap-4 p-3 border-b bg-gray-50">
                    <div className="text-sm font-medium text-gray-700">
                      Item
                    </div>
                    <div className="text-sm font-medium text-gray-700 text-center">
                      Jumlah
                    </div>
                    <div className="text-sm font-medium text-gray-700 text-center">
                      Unit
                    </div>
                  </div>
                  {items.map((item, index) => (
                    <div
                      key={item.id}
                      className={`grid grid-cols-[1fr_100px_50px] gap-4 p-3 ${
                        index < items.length - 1 ? "border-b" : ""
                      }`}
                    >
                      <div>
                        <div className="font-medium text-sm">{item.name}</div>
                        <div className="text-xs text-gray-500">
                          Stok saat ini: {item.currentStock} {item.unit}
                        </div>
                      </div>
                      <div>
                        <NumberInput
                          id={`other-${item.id}`}
                          min={0}
                          step={item.unit === "pcs" ? 1 : 0.01}
                          value={item.count}
                          onChange={(value) =>
                            updateOtherItemCount(item.id, value || 0)
                          }
                          allowDecimals={item.unit !== "pcs"}
                          className="text-center"
                        />
                      </div>
                      <div className="text-sm text-gray-600 text-center">
                        {item.unit}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="generalNotes">Catatan (opsional)</Label>
        <Textarea
          id="generalNotes"
          placeholder="Catatan tambahan..."
          value={generalNotes}
          onChange={(e) => setGeneralNotes(e.target.value)}
          rows={3}
        />
      </div>

      {/* Discrepancy Clarification Section */}
      {!loading && getDiscrepancyItems().length > 0 && (
        <div className="space-y-3">
          <Alert className="border-amber-200 bg-amber-50">
            <div className="flex gap-3">
              <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <AlertDescription className="text-sm font-medium text-amber-800">
                  Ada selisih stok yang perlu dijelaskan
                </AlertDescription>
                <p className="text-xs text-amber-700 mt-1">
                  Harap jelaskan alasan selisih stok untuk setiap item di bawah
                  ini
                </p>
              </div>
            </div>
          </Alert>

          <div className="space-y-3">
            {getDiscrepancyItems().map((item) => {
              const isExcess = item.discrepancyType === "excess";
              const borderColor = isExcess
                ? "border-blue-200"
                : "border-red-200";
              const bgColor = isExcess ? "bg-blue-50" : "bg-red-50";

              return (
                <div
                  key={item.id}
                  className={`bg-white rounded-lg border ${borderColor} p-4`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <p className="font-medium text-sm">
                        {item.name}{" "}
                        {"variant" in item &&
                          item.variant &&
                          `- ${item.variant}`}
                      </p>
                      <p className="text-xs text-gray-600 mt-0.5">
                        Stok sistem:{" "}
                        {"totalCount" in item
                          ? item.currentStock
                          : item.currentStock}{" "}
                        {item.unit} | Terhitung:{" "}
                        {"totalCount" in item ? item.totalCount : item.count}{" "}
                        {item.unit} |
                        {isExcess ? (
                          <span className="text-blue-600 font-medium">
                            {" "}
                            Kelebihan: {Math.abs(item.discrepancy)} {item.unit}
                          </span>
                        ) : (
                          <span className="text-red-600 font-medium">
                            {" "}
                            Hilang: {Math.abs(item.discrepancy)} {item.unit}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  <div>
                    <Label
                      htmlFor={`discrepancy-${item.id}`}
                      className="text-xs"
                    >
                      {isExcess ? "Alasan kelebihan" : "Alasan hilang"}{" "}
                      <span className="text-red-500">*</span>
                    </Label>
                    <Textarea
                      id={`discrepancy-${item.id}`}
                      placeholder={
                        isExcess
                          ? "Contoh: Salah hitung saat pembukaan, ada stok tambahan, dll..."
                          : "Contoh: Terjual tapi belum tercatat, rusak, dll..."
                      }
                      value={discrepancyNotes[item.id] || ""}
                      onChange={(e) =>
                        updateDiscrepancyNote(item.id, e.target.value)
                      }
                      rows={2}
                      className="mt-1 text-sm"
                      required
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="flex justify-end">
        <Button
          onClick={handleSubmit}
          className="w-full md:w-auto"
          disabled={loading || stockItems.length === 0}
        >
          Simpan
        </Button>
      </div>
    </div>
  );
}
