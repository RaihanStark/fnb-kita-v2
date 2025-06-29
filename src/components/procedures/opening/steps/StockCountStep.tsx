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
import { Plus, Trash2, Package, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";

interface StockItem {
  id: string;
  name: string;
  variant: string;
  frozenCount: number;
  readyCount: number;
  damagedCount: number;
  notes: string;
}

interface StockCountStepProps {
  data: any;
  onNext: (data: any) => void;
}

export function StockCountStep({ data, onNext }: StockCountStepProps) {
  const { toast } = useToast();
  const [stockItems, setStockItems] = useState<StockItem[]>(
    data.stockItems || []
  );
  const [generalNotes, setGeneralNotes] = useState(data.generalNotes || "");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!data.stockItems || data.stockItems.length === 0) {
      fetchProducts();
    } else {
      setLoading(false);
    }
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/products', {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch products');
      
      const products = await response.json();
      
      // Only use active products
      const activeProducts = products.filter((p: any) => p.isActive);
      
      // Initialize stock items from products
      const initialStockItems = activeProducts.map((product: any) => ({
        id: product.id,
        name: product.name,
        variant: product.variant,
        frozenCount: 0,
        readyCount: 0,
        damagedCount: 0,
        notes: "",
      }));
      setStockItems(initialStockItems);
    } catch (error) {
      toast({
        title: "Error",
        description: "Gagal memuat produk",
        variant: "destructive"
      });
      // Fallback to empty array
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

  const getTotalCount = () => {
    return stockItems.reduce(
      (total, item) => total + item.frozenCount + item.readyCount,
      0
    );
  };

  const handleSubmit = () => {
    onNext({
      stockItems,
      generalNotes,
      totalCount: getTotalCount(),
      completedAt: new Date().toISOString(),
    });
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold flex items-center gap-2 text-gray-900">
          <Package className="h-5 w-5 text-orange-500" />
          Cek & Susun Stok
        </h2>
        <p className="text-sm text-gray-600 mt-1">
          Hitung stok awal dari kulkas/frozen box
        </p>
      </div>

      <Alert className="border-amber-200 bg-amber-50">
        <div className="flex gap-3">
          <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
          <AlertDescription className="text-sm">
            Catat dengan teliti. Stok yang rusak/gagal tetap dicatat dengan
            keterangan.
          </AlertDescription>
        </div>
      </Alert>

      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            <p className="text-sm text-gray-500 mt-2">Memuat produk...</p>
          </div>
        ) : stockItems.length === 0 ? (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Tidak ada produk aktif. Silakan tambahkan produk terlebih dahulu.
            </AlertDescription>
          </Alert>
        ) : (
          stockItems.map((item, index) => (
          <Card key={item.id}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">
                  {item.name} - {item.variant || "Varian Baru"}
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label htmlFor={`frozen-${item.id}`}>Frozen/Mentah</Label>
                  <Input
                    id={`frozen-${item.id}`}
                    type="number"
                    min="0"
                    value={item.frozenCount}
                    onChange={(e) =>
                      updateStockItem(
                        item.id,
                        "frozenCount",
                        parseInt(e.target.value) || 0
                      )
                    }
                  />
                </div>
                <div>
                  <Label htmlFor={`ready-${item.id}`}>Siap Jual</Label>
                  <Input
                    id={`ready-${item.id}`}
                    type="number"
                    min="0"
                    value={item.readyCount}
                    onChange={(e) =>
                      updateStockItem(
                        item.id,
                        "readyCount",
                        parseInt(e.target.value) || 0
                      )
                    }
                  />
                </div>
                <div>
                  <Label htmlFor={`damaged-${item.id}`}>Rusak/Gagal</Label>
                  <Input
                    id={`damaged-${item.id}`}
                    type="number"
                    min="0"
                    value={item.damagedCount}
                    onChange={(e) =>
                      updateStockItem(
                        item.id,
                        "damagedCount",
                        parseInt(e.target.value) || 0
                      )
                    }
                  />
                </div>
              </div>

              {item.damagedCount > 0 && (
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
            </CardContent>
          </Card>
        ))
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Ringkasan Stok</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">Total: {getTotalCount()} pcs</div>
          <div className="text-sm text-muted-foreground mt-1">
            {stockItems.filter((item) => item.frozenCount > 0).length > 0 &&
              `${stockItems.reduce(
                (sum, item) => sum + item.frozenCount,
                0
              )} frozen, `}
            {stockItems.reduce((sum, item) => sum + item.readyCount, 0)} siap
            jual
            {stockItems.reduce((sum, item) => sum + item.damagedCount, 0) > 0 &&
              `, ${stockItems.reduce(
                (sum, item) => sum + item.damagedCount,
                0
              )} rusak`}
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
