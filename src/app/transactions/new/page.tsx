"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ArrowLeft, Plus, Minus, Trash2, Loader2, Lock } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { formatCurrency } from "@/lib/utils/format";
import { useToast } from "@/hooks/use-toast";
import { openingProcedureService } from "@/lib/services/opening-procedure";

interface TransactionItem {
  productId: string;
  name: string;
  variant: string;
  quantity: number;
  price?: number;
  isPackaging?: boolean;
  unit?: string;
}

interface Product {
  id: string;
  name: string;
  variant: string;
  price: string;
  isActive: boolean;
}

interface Stock {
  id: string;
  name: string;
  type: string;
  unit: string;
  currentStock: string;
}

export default function NewTransactionPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [type, setType] = useState<"sales" | "damaged" | "bonus" | "disposal">(
    "sales"
  );
  const [items, setItems] = useState<TransactionItem[]>([]);
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [packagingStocks, setPackagingStocks] = useState<Stock[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [loadingPackaging, setLoadingPackaging] = useState(true);
  const [hasOpeningToday, setHasOpeningToday] = useState(false);
  const [checkingOpening, setCheckingOpening] = useState(true);

  useEffect(() => {
    checkOpeningAndFetchProducts();
  }, []);

  const checkOpeningAndFetchProducts = async () => {
    try {
      // Check opening status first
      const openingResult = await openingProcedureService.checkTodayOpening();
      setHasOpeningToday(
        openingResult.hasOpening && openingResult.opening?.completed
      );

      // Only fetch products and packaging if opening is completed
      if (openingResult.hasOpening && openingResult.opening?.completed) {
        await Promise.all([fetchProducts(), fetchPackaging()]);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Gagal memuat data",
        variant: "destructive",
      });
    } finally {
      setCheckingOpening(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await fetch("/api/products", {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch products");

      const data = await response.json();
      setProducts(data.filter((p: Product) => p.isActive));
    } catch (error) {
      toast({
        title: "Error",
        description: "Gagal memuat produk",
        variant: "destructive",
      });
    } finally {
      setLoadingProducts(false);
    }
  };

  const fetchPackaging = async () => {
    try {
      const response = await fetch("/api/stocks", {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch stocks");

      const data = await response.json();
      // Filter only packaging type stocks
      setPackagingStocks(data.filter((s: Stock) => s.type === "packaging"));
    } catch (error) {
      toast({
        title: "Error",
        description: "Gagal memuat kemasan",
        variant: "destructive",
      });
    } finally {
      setLoadingPackaging(false);
    }
  };

  const addItem = (product: Product) => {
    const existingItem = items.find(
      (item) =>
        item.productId === product.id && item.variant === product.variant
    );

    if (existingItem) {
      updateQuantity(items.indexOf(existingItem), 1);
    } else {
      setItems([
        ...items,
        {
          productId: product.id,
          name: product.name,
          variant: product.variant,
          quantity: 1,
          price: type === "sales" ? Number(product.price) : undefined,
        },
      ]);
    }
  };

  const addPackagingItem = (packaging: Stock) => {
    const existingItem = items.find(
      (item) => item.productId === packaging.id && item.isPackaging
    );

    if (existingItem) {
      updateQuantity(items.indexOf(existingItem), 1);
    } else {
      setItems([
        ...items,
        {
          productId: packaging.id,
          name: packaging.name,
          variant: "",
          quantity: 1,
          isPackaging: true,
          unit: packaging.unit,
        },
      ]);
    }
  };

  const updateQuantity = (index: number, change: number) => {
    const newItems = [...items];
    newItems[index].quantity = Math.max(0, newItems[index].quantity + change);

    if (newItems[index].quantity === 0) {
      newItems.splice(index, 1);
    }

    setItems(newItems);
  };

  const updatePrice = (index: number, price: number) => {
    const newItems = [...items];
    newItems[index].price = price;
    setItems(newItems);
  };

  const removeItem = (index: number) => {
    const newItems = [...items];
    newItems.splice(index, 1);
    setItems(newItems);
  };

  const getTotalAmount = () => {
    if (type !== "sales") return 0;
    return items.reduce(
      (sum, item) => sum + (item.price || 0) * item.quantity,
      0
    );
  };

  const handleSubmit = async () => {
    if (items.length === 0) {
      toast({
        title: "Error",
        description: "Tambahkan minimal 1 item",
        variant: "destructive",
      });
      return;
    }

    // Check if notes is required and filled
    if (type !== "sales" && notes.trim() === "") {
      toast({
        title: "Error",
        description: "Catatan wajib diisi untuk tipe transaksi ini",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          type,
          items,
          totalAmount: type === "sales" ? getTotalAmount() : null,
          notes,
        }),
      });

      if (!response.ok) throw new Error("Failed to create transaction");

      toast({
        title: "Berhasil",
        description: "Transaksi berhasil ditambahkan",
      });

      router.push("/transactions");
    } catch (error) {
      toast({
        title: "Error",
        description: "Gagal menambahkan transaksi",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Show loading state while checking opening status
  if (checkingOpening) {
    return (
      <AppLayout title="Tambah Transaksi" showBackButton>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      </AppLayout>
    );
  }

  // Show alert if no opening today
  if (!hasOpeningToday) {
    return (
      <AppLayout title="Tambah Transaksi" showBackButton>
        <div className="p-4">
          <Alert className="border-orange-200 bg-orange-50">
            <Lock className="h-4 w-4 text-orange-600" />
            <AlertDescription className="text-orange-800">
              <strong>Transaksi tidak dapat dilakukan.</strong>
              <br />
              Silakan lakukan pembukaan toko terlebih dahulu untuk memulai
              transaksi hari ini.
              <br />
              <Button
                variant="link"
                className="p-0 h-auto mt-2 text-orange-700 hover:text-orange-800"
                onClick={() => router.push("/procedures/opening")}
              >
                Ke Pembukaan →
              </Button>
            </AlertDescription>
          </Alert>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Tambah Transaksi" showBackButton>
      <div className="p-4 pb-24">
        {/* Transaction Type */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-base">Tipe Transaksi</CardTitle>
          </CardHeader>
          <CardContent>
            <RadioGroup
              value={type}
              onValueChange={(value) => setType(value as any)}
            >
              <div className="grid grid-cols-2 gap-3">
                <Label className="flex items-center space-x-2 border rounded-lg p-3 cursor-pointer hover:bg-gray-50">
                  <RadioGroupItem value="sales" />
                  <span>Penjualan</span>
                </Label>
                <Label className="flex items-center space-x-2 border rounded-lg p-3 cursor-pointer hover:bg-gray-50">
                  <RadioGroupItem value="damaged" />
                  <span>Rusak</span>
                </Label>
                <Label className="flex items-center space-x-2 border rounded-lg p-3 cursor-pointer hover:bg-gray-50">
                  <RadioGroupItem value="bonus" />
                  <span>Bonus</span>
                </Label>
                <Label className="flex items-center space-x-2 border rounded-lg p-3 cursor-pointer hover:bg-gray-50">
                  <RadioGroupItem value="disposal" />
                  <span>Buang</span>
                </Label>
              </div>
            </RadioGroup>
          </CardContent>
        </Card>

        {/* Product Selection */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-base">Pilih Produk</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingProducts ? (
              <div className="text-center py-4">
                <Loader2 className="w-6 h-6 animate-spin mx-auto" />
                <p className="text-sm text-gray-500 mt-2">Memuat produk...</p>
              </div>
            ) : products.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">
                Tidak ada produk aktif. Silakan tambahkan produk terlebih
                dahulu.
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {products.map((product) => (
                  <Button
                    key={product.id}
                    variant="outline"
                    size="sm"
                    onClick={() => addItem(product)}
                    className="justify-start"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    {product.name} {product.variant}
                  </Button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Packaging Selection */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              Pilih Kemasan
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingPackaging ? (
              <div className="text-center py-4">
                <Loader2 className="w-6 h-6 animate-spin mx-auto" />
                <p className="text-sm text-gray-500 mt-2">Memuat kemasan...</p>
              </div>
            ) : packagingStocks.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">
                Tidak ada kemasan tersedia.
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {packagingStocks.map((packaging) => (
                  <Button
                    key={packaging.id}
                    variant="outline"
                    size="sm"
                    onClick={() => addPackagingItem(packaging)}
                    className="justify-start"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    {packaging.name}
                  </Button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Selected Items */}
        {items.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-base">Item Terpilih</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {items.map((item, index) => (
                  <div key={index} className="border rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <span className="font-medium">
                          {item.name} {item.variant}
                        </span>
                        {item.isPackaging && (
                          <span className="ml-2 text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                            Kemasan
                          </span>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => removeItem(index)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => updateQuantity(index, -1)}
                        >
                          <Minus className="w-4 h-4" />
                        </Button>
                        <span className="w-12 text-center font-medium">
                          {item.quantity}{" "}
                          {item.unit && item.unit !== "pcs" ? item.unit : ""}
                        </span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => updateQuantity(index, 1)}
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>

                      {type === "sales" && !item.isPackaging && (
                        <div className="flex-1 flex items-center gap-2">
                          <span className="text-sm text-gray-600">@</span>
                          <Input
                            type="number"
                            value={item.price || ""}
                            onChange={(e) =>
                              updatePrice(index, Number(e.target.value))
                            }
                            className="h-8"
                            placeholder="Harga"
                          />
                        </div>
                      )}
                    </div>

                    {type === "sales" && item.price && !item.isPackaging && (
                      <p className="text-sm text-gray-600 mt-2">
                        Subtotal: {formatCurrency(item.price * item.quantity)}
                      </p>
                    )}
                  </div>
                ))}
              </div>

              {type === "sales" && (
                <div className="mt-4 pt-4 border-t">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold">Total</span>
                    <span className="font-semibold text-lg">
                      {formatCurrency(getTotalAmount())}
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Notes */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-base">
              Catatan{" "}
              {type !== "sales" && <span className="text-red-500">*</span>}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={
                type !== "sales"
                  ? "Catatan wajib diisi untuk tipe transaksi ini"
                  : "Tambahkan catatan (opsional)"
              }
              rows={3}
              required={type !== "sales"}
            />
            {type !== "sales" && notes.trim() === "" && (
              <p className="text-sm text-red-500 mt-1">
                Catatan wajib diisi untuk transaksi{" "}
                {type === "damaged"
                  ? "rusak"
                  : type === "bonus"
                  ? "bonus"
                  : "buang"}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Submit Button */}
        <Button
          className="w-full bg-orange-500 hover:bg-orange-600"
          onClick={handleSubmit}
          disabled={isSubmitting || items.length === 0}
        >
          {isSubmitting ? "Menyimpan..." : "Simpan Transaksi"}
        </Button>
      </div>
    </AppLayout>
  );
}
