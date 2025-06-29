"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Shield, CheckCircle2, XCircle } from "lucide-react";

interface CleaningSecurityStepProps {
  data: any;
  onNext: (data: any) => void;
}

export function CleaningSecurityStep({ data, onNext }: CleaningSecurityStepProps) {
  const [equipmentCleaned, setEquipmentCleaned] = useState(data.equipmentCleaned ?? false);
  const [areaCleaned, setAreaCleaned] = useState(data.areaCleaned ?? false);
  const [stockStored, setStockStored] = useState(data.stockStored ?? false);
  const [equipmentOff, setEquipmentOff] = useState(data.equipmentOff ?? false);
  const [doorLocked, setDoorLocked] = useState(data.doorLocked ?? false);
  const [notes, setNotes] = useState(data.notes || "");

  const allChecked = equipmentCleaned && areaCleaned && stockStored && equipmentOff && doorLocked;

  const handleSubmit = () => {
    onNext({
      equipmentCleaned,
      areaCleaned,
      stockStored,
      equipmentOff,
      doorLocked,
      notes,
      completedAt: new Date().toISOString(),
    });
  };

  const checklistItems = [
    {
      id: "equipment",
      label: "Peralatan Masak Dibersihkan",
      description: "Kompor, wajan, dan alat masak lainnya sudah bersih",
      checked: equipmentCleaned,
      onChange: setEquipmentCleaned,
    },
    {
      id: "area",
      label: "Area Jualan Dibersihkan",
      description: "Meja, kursi, dan lantai sudah bersih",
      checked: areaCleaned,
      onChange: setAreaCleaned,
    },
    {
      id: "stock",
      label: "Stok Disimpan dengan Benar",
      description: "Risol masuk freezer, bahan lain tersimpan rapi",
      checked: stockStored,
      onChange: setStockStored,
    },
    {
      id: "equipment-off",
      label: "Peralatan Dimatikan",
      description: "Kompor, lampu, dan peralatan listrik sudah dimatikan",
      checked: equipmentOff,
      onChange: setEquipmentOff,
    },
    {
      id: "door",
      label: "Pintu Terkunci",
      description: "Semua pintu dan jendela sudah dikunci",
      checked: doorLocked,
      onChange: setDoorLocked,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Pembersihan & Keamanan
        </h2>
        <p className="text-muted-foreground mt-1">
          Pastikan semua area bersih dan aman
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Checklist Penutupan</CardTitle>
          <CardDescription>
            Centang semua item yang sudah dilakukan
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {checklistItems.map((item) => (
            <div
              key={item.id}
              className={`flex items-start space-x-3 p-3 rounded-lg transition-colors ${
                item.checked ? "bg-green-50" : "bg-gray-50"
              }`}
            >
              <Checkbox
                id={item.id}
                checked={item.checked}
                onCheckedChange={(checked) => item.onChange(checked as boolean)}
                className="mt-1"
              />
              <div className="flex-1">
                <label
                  htmlFor={item.id}
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  {item.label}
                </label>
                <p className="text-sm text-muted-foreground mt-1">
                  {item.description}
                </p>
              </div>
              <div className="ml-auto">
                {item.checked ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                ) : (
                  <XCircle className="h-5 w-5 text-gray-400" />
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Progress Indicator */}
      <Card className={allChecked ? "border-green-200 bg-green-50" : "border-amber-200 bg-amber-50"}>
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">
              Progress: {checklistItems.filter(item => item.checked).length} dari {checklistItems.length} selesai
            </span>
            <div className="flex gap-1">
              {checklistItems.map((item) => (
                <div
                  key={item.id}
                  className={`h-2 w-8 rounded-full ${
                    item.checked ? "bg-green-500" : "bg-gray-300"
                  }`}
                />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Additional Notes */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Catatan Tambahan</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Catatan khusus tentang pembersihan atau keamanan..."
            className="min-h-[80px]"
          />
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button 
          onClick={handleSubmit} 
          className="w-full md:w-auto"
          disabled={!allChecked}
        >
          Lanjut ke Persiapan Besok
        </Button>
      </div>
    </div>
  );
}