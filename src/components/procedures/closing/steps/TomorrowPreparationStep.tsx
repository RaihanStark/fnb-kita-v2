"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Calendar, CheckCircle, AlertCircle } from "lucide-react";
import { formatCurrency } from "@/lib/utils/format";

interface TomorrowPreparationStepProps {
  data: any;
  onNext: (data: any) => void;
}

export function TomorrowPreparationStep({ data, onNext }: TomorrowPreparationStepProps) {
  const [modalPrepared, setModalPrepared] = useState(data.modalPrepared ?? false);
  const [modalAmount, setModalAmount] = useState(data.modalAmount || 50000);
  const [stockChecked, setStockChecked] = useState(data.stockChecked ?? false);
  const [needToPurchase, setNeedToPurchase] = useState(data.needToPurchase || "");
  const [specialNotes, setSpecialNotes] = useState(data.specialNotes || "");

  const handleSubmit = () => {
    onNext({
      modalPrepared,
      modalAmount,
      stockChecked,
      needToPurchase,
      specialNotes,
      completedAt: new Date().toISOString(),
      allStepsCompleted: true,
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Persiapan Besok
        </h2>
        <p className="text-muted-foreground mt-1">
          Pastikan semua siap untuk buka besok
        </p>
      </div>

      {/* Modal Preparation */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Modal Kembalian</CardTitle>
          <CardDescription>
            Siapkan uang kembalian untuk besok
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-3">
            <Checkbox
              id="modal"
              checked={modalPrepared}
              onCheckedChange={(checked) => setModalPrepared(checked as boolean)}
            />
            <label
              htmlFor="modal"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
            >
              Modal kembalian sudah disiapkan
            </label>
          </div>
          
          <div className="flex items-center gap-3">
            <Label htmlFor="modal-amount">Jumlah Modal:</Label>
            <NumberInput
              id="modal-amount"
              min={0}
              step={10000}
              value={modalAmount}
              onChange={(value) => setModalAmount(value || 0)}
              className="w-40"
              allowDecimals={false}
            />
            <span className="text-sm text-muted-foreground">
              {formatCurrency(modalAmount)}
            </span>
          </div>
          
          {modalAmount < 50000 && (
            <div className="flex items-start gap-2 p-3 bg-amber-50 rounded-md">
              <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5" />
              <p className="text-sm text-amber-700">
                Modal kurang dari minimum yang disarankan (Rp 50.000)
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stock Check */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Cek Stok</CardTitle>
          <CardDescription>
            Pastikan stok cukup untuk besok
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-3">
            <Checkbox
              id="stock"
              checked={stockChecked}
              onCheckedChange={(checked) => setStockChecked(checked as boolean)}
            />
            <label
              htmlFor="stock"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
            >
              Stok sudah dicek untuk kebutuhan besok
            </label>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="purchase">Barang yang perlu dibeli:</Label>
            <Textarea
              id="purchase"
              value={needToPurchase}
              onChange={(e) => setNeedToPurchase(e.target.value)}
              placeholder="Contoh: Gas 1 tabung, Minyak 5 liter, Kemasan 100 pcs..."
              className="min-h-[80px]"
            />
          </div>
        </CardContent>
      </Card>

      {/* Special Notes */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Catatan Khusus untuk Besok</CardTitle>
          <CardDescription>
            Informasi penting untuk pembuka besok
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            value={specialNotes}
            onChange={(e) => setSpecialNotes(e.target.value)}
            placeholder="Contoh: Ada pesanan 50 pcs jam 10 pagi, Pelanggan X minta diberi tahu jika risol keju ready..."
            className="min-h-[100px]"
          />
        </CardContent>
      </Card>

      {/* Final Summary */}
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-primary" />
            Siap Tutup Toko
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Setelah ini, prosedur penutupan akan selesai. Pastikan semua sudah benar sebelum melanjutkan.
          </p>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button 
          onClick={handleSubmit} 
          className="w-full md:w-auto"
          disabled={!modalPrepared || !stockChecked}
        >
          Selesaikan Penutupan
        </Button>
      </div>
    </div>
  );
}