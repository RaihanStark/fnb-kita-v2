"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NumberInput } from "@/components/ui/number-input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Banknote, Calculator } from "lucide-react";
import { formatCurrency } from "@/lib/utils/format";

interface Denomination {
  value: number;
  count: number;
  label: string;
}

interface CashSetupStepProps {
  data: any;
  onNext: (data: any) => void;
}

export function CashSetupStep({ data, onNext }: CashSetupStepProps) {
  const [denominations, setDenominations] = useState<Denomination[]>(
    data.denominations || [
      { value: 100000, count: 0, label: "Rp 100.000" },
      { value: 50000, count: 0, label: "Rp 50.000" },
      { value: 20000, count: 0, label: "Rp 20.000" },
      { value: 10000, count: 0, label: "Rp 10.000" },
      { value: 5000, count: 0, label: "Rp 5.000" },
      { value: 2000, count: 0, label: "Rp 2.000" },
      { value: 1000, count: 0, label: "Rp 1.000" },
    ]
  );

  const updateDenomination = (index: number, count: number) => {
    setDenominations((prev) =>
      prev.map((denom, i) => (i === index ? { ...denom, count } : denom))
    );
  };

  const calculateTotal = () => {
    return denominations.reduce(
      (total, denom) => total + denom.value * denom.count,
      0
    );
  };

  const handleSubmit = () => {
    onNext({
      denominations,
      totalCash: calculateTotal(),
      completedAt: new Date().toISOString(),
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Pecahan Uang</CardTitle>
          <CardDescription>
            Masukkan jumlah lembar untuk setiap pecahan
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {denominations.map((denom, index) => (
              <div key={denom.value} className="flex items-center gap-3">
                <Label className="w-24 text-right">{denom.label}</Label>
                <NumberInput
                  min={0}
                  value={denom.count}
                  onChange={(value) => updateDenomination(index, value || 0)}
                  className="w-24"
                  placeholder="0"
                  allowDecimals={false}
                />
                <span className="text-sm text-muted-foreground">lembar</span>
                <span className="ml-auto font-medium">
                  {formatCurrency(denom.value * denom.count)}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-primary/5 border-primary/20">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Total Modal
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-primary">
            {formatCurrency(calculateTotal())}
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            Pastikan jumlah ini sesuai dengan catatan keuangan
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Tips Persiapan Kembalian</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-1 text-sm text-muted-foreground">
            <li>• Siapkan pecahan kecil lebih banyak (Rp 1.000 - Rp 5.000)</li>
            <li>• Minimal modal Rp 50.000 untuk kembalian</li>
          </ul>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSubmit} className="w-full md:w-auto">
          Lanjut ke Checklist Akhir
        </Button>
      </div>
    </div>
  );
}
