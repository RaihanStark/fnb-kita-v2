"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Plus, Trash2, Package, AlertCircle, Droplet, Flame, PackageSearch } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

interface StockItem {
  id: string;
  name: string;
  type: 'product' | 'packaging' | 'utilities' | 'consumables';
  unit: string;
  // For products (risol)
  variant?: string;
  frozenCount?: number;
  readyCount?: number;
  damagedCount?: number;
  // For other items
  currentCount?: number;
  notes: string;
}

interface StockCountStepProps {
  data: any;
  onNext: (data: any) => void;
}

const typeConfig = {
  product: { label: 'Produk', icon: Package, color: 'bg-blue-100 text-blue-700' },
  packaging: { label: 'Kemasan', icon: Package, color: 'bg-green-100 text-green-700' },
  utilities: { label: 'Utilitas', icon: Flame, color: 'bg-orange-100 text-orange-700' },
  consumables: { label: 'Habis Pakai', icon: Droplet, color: 'bg-purple-100 text-purple-700' }
};

export function StockCountStep({ data, onNext }: StockCountStepProps) {
  const { toast } = useToast();
  const [stockItems, setStockItems] = useState<StockItem[]>(
    data.stockItems || []
  );
  const [generalNotes, setGeneralNotes] = useState(data.generalNotes || "");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!data.stockItems || data.stockItems.length === 0) {
      fetchAllStocks();
    } else {
      setLoading(false);
    }
  }, []);

  const fetchAllStocks = async () => {
    try {
      // Fetch all stocks
      const response = await fetch('/api/stocks', {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch stocks');
      
      const stocks = await response.json();
      
      // Initialize stock items
      const initialStockItems = stocks.map((stock: any) => {
        if (stock.type === 'product') {
          // For products (risol), use the special format
          const variant = stock.name.includes(' - ') ? stock.name.split(' - ')[1] : '';
          return {
            id: stock.id,
            name: stock.name.split(' - ')[0], // Extract product name
            type: stock.type,
            unit: stock.unit,
            variant: variant,
            frozenCount: 0,
            readyCount: 0,
            damagedCount: 0,
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
            notes: "",
          };
        }
      });
      setStockItems(initialStockItems);
    } catch (error) {
      toast({
        title: "Error",
        description: "Gagal memuat persediaan",
        variant: "destructive"
      });
      setStockItems([]);
    } finally {
      setLoading(false);
    }
  };

  const updateStockItem = (id: string, field: keyof StockItem, value: any) => {
    setStockItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  const getTotalProductCount = () => {
    return stockItems
      .filter(item => item.type === 'product')
      .reduce((total, item) => total + (item.frozenCount || 0) + (item.readyCount || 0), 0);
  };

  const handleSubmit = () => {
    onNext({
      stockItems,
      generalNotes,
      totalProductCount: getTotalProductCount(),
      completedAt: new Date().toISOString(),
    });
  };

  const groupedItems = {
    product: stockItems.filter(item => item.type === 'product'),
    packaging: stockItems.filter(item => item.type === 'packaging'),
    utilities: stockItems.filter(item => item.type === 'utilities'),
    consumables: stockItems.filter(item => item.type === 'consumables'),
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold flex items-center gap-2 text-gray-900">
          <Package className="h-5 w-5 text-orange-500" />
          Cek & Susun Stok
        </h2>
        <p className="text-sm text-gray-600 mt-1">
          Hitung semua persediaan yang ada
        </p>
      </div>

      <Alert className="border-amber-200 bg-amber-50">
        <div className="flex gap-3">
          <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
          <AlertDescription className="text-sm">
            Catat dengan teliti. Untuk produk risol, pisahkan antara frozen/mentah, siap jual, dan rusak.
          </AlertDescription>
        </div>
      </Alert>

      <div className="space-y-6">
        {loading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            <p className="text-sm text-gray-500 mt-2">Memuat persediaan...</p>
          </div>
        ) : stockItems.length === 0 ? (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Tidak ada persediaan. Silakan tambahkan persediaan terlebih dahulu.
            </AlertDescription>
          </Alert>
        ) : (
          Object.entries(groupedItems).map(([type, items]) => {
            if (items.length === 0) return null;
            const config = typeConfig[type as keyof typeof typeConfig];
            const Icon = config.icon;

            return (
              <div key={type} className="space-y-3">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <Icon className="h-4 w-4" />
                  {config.label}
                </h3>
                
                {items.map((item) => (
                  <Card key={item.id}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base">
                          {item.name} {item.variant && `- ${item.variant}`}
                        </CardTitle>
                        <Badge variant="outline" className="text-xs">
                          {item.unit}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {item.type === 'product' ? (
                        // Special format for products (risol)
                        <>
                          <div className="grid grid-cols-3 gap-3">
                            <div>
                              <Label htmlFor={`frozen-${item.id}`}>Frozen/Mentah</Label>
                              <NumberInput
                                id={`frozen-${item.id}`}
                                min={0}
                                value={item.frozenCount || 0}
                                onChange={(value) =>
                                  updateStockItem(
                                    item.id,
                                    "frozenCount",
                                    value || 0
                                  )
                                }
                                allowDecimals={false}
                              />
                            </div>
                            <div>
                              <Label htmlFor={`ready-${item.id}`}>Siap Jual</Label>
                              <NumberInput
                                id={`ready-${item.id}`}
                                min={0}
                                value={item.readyCount || 0}
                                onChange={(value) =>
                                  updateStockItem(
                                    item.id,
                                    "readyCount",
                                    value || 0
                                  )
                                }
                                allowDecimals={false}
                              />
                            </div>
                            <div>
                              <Label htmlFor={`damaged-${item.id}`}>Rusak/Gagal</Label>
                              <NumberInput
                                id={`damaged-${item.id}`}
                                min={0}
                                value={item.damagedCount || 0}
                                onChange={(value) =>
                                  updateStockItem(
                                    item.id,
                                    "damagedCount",
                                    value || 0
                                  )
                                }
                                allowDecimals={false}
                              />
                            </div>
                          </div>

                          {(item.damagedCount || 0) > 0 && (
                            <div>
                              <Label htmlFor={`notes-${item.id}`}>
                                Keterangan Kerusakan
                              </Label>
                              <Input
                                id={`notes-${item.id}`}
                                placeholder="Sobek, hangus, dll..."
                                value={item.notes}
                                onChange={(e) =>
                                  updateStockItem(item.id, "notes", e.target.value)
                                }
                              />
                            </div>
                          )}
                        </>
                      ) : (
                        // Simple format for other items
                        <>
                          <div>
                            <Label htmlFor={`current-${item.id}`}>Jumlah Saat Ini</Label>
                            <NumberInput
                              id={`current-${item.id}`}
                              min={0}
                              step={0.01}
                              value={item.currentCount || 0}
                              onChange={(value) =>
                                updateStockItem(
                                  item.id,
                                  "currentCount",
                                  value || 0
                                )
                              }
                              placeholder="0"
                              allowDecimals={true}
                            />
                          </div>
                          <div>
                            <Label htmlFor={`notes-${item.id}`}>
                              Catatan (opsional)
                            </Label>
                            <Input
                              id={`notes-${item.id}`}
                              placeholder="Catatan jika diperlukan..."
                              value={item.notes}
                              onChange={(e) =>
                                updateStockItem(item.id, "notes", e.target.value)
                              }
                            />
                          </div>
                        </>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            );
          })
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Ringkasan Stok</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div>
              <div className="text-lg font-bold">
                Total Produk: {getTotalProductCount()} pcs
              </div>
              <div className="text-sm text-muted-foreground">
                {stockItems.filter((item) => item.type === 'product' && (item.frozenCount || 0) > 0).length > 0 &&
                  `${stockItems
                    .filter(item => item.type === 'product')
                    .reduce((sum, item) => sum + (item.frozenCount || 0), 0)} frozen, `}
                {stockItems
                  .filter(item => item.type === 'product')
                  .reduce((sum, item) => sum + (item.readyCount || 0), 0)} siap jual
                {stockItems
                  .filter(item => item.type === 'product')
                  .reduce((sum, item) => sum + (item.damagedCount || 0), 0) > 0 &&
                  `, ${stockItems
                    .filter(item => item.type === 'product')
                    .reduce((sum, item) => sum + (item.damagedCount || 0), 0)} rusak`}
              </div>
            </div>

            {/* Summary for other items */}
            {Object.entries(groupedItems).map(([type, items]) => {
              if (type === 'product' || items.length === 0) return null;
              const config = typeConfig[type as keyof typeof typeConfig];
              const hasCount = items.some(item => (item.currentCount || 0) > 0);
              
              if (!hasCount) return null;

              return (
                <div key={type} className="pt-2 border-t">
                  <div className="font-medium">{config.label}:</div>
                  <div className="text-sm text-gray-600 space-y-1">
                    {items
                      .filter(item => (item.currentCount || 0) > 0)
                      .map(item => (
                        <div key={item.id}>
                          {item.name}: {item.currentCount} {item.unit}
                        </div>
                      ))}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <div className="space-y-2">
        <Label htmlFor="generalNotes">Catatan Umum (opsional)</Label>
        <Textarea
          id="generalNotes"
          placeholder="Catatan tambahan terkait stok..."
          value={generalNotes}
          onChange={(e) => setGeneralNotes(e.target.value)}
          rows={3}
        />
      </div>

      <div className="flex justify-end">
        <Button 
          onClick={handleSubmit} 
          className="w-full md:w-auto"
          disabled={loading || stockItems.length === 0}
        >
          Lanjut ke Persiapan Display
        </Button>
      </div>
    </div>
  );
}