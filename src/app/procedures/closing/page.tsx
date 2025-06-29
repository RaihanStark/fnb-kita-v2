"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AppLayout } from "@/components/layout/app-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { closingProcedureService, openingProcedureService } from "@/lib/services";
import type { ClosingProcedure } from "@/lib/services/closing-procedure";
import { 
  CheckCircle2, 
  Circle, 
  Loader2, 
  AlertCircle,
  Banknote,
  Package,
  FileText,
  Shield,
  Calendar
} from "lucide-react";

// Import all step components
import { CashReconciliationStep } from "@/components/procedures/closing/steps/CashReconciliationStep";
import { FinalStockCountStep } from "@/components/procedures/closing/steps/FinalStockCountStep";
import { DailyReportStep } from "@/components/procedures/closing/steps/DailyReportStep";
import { CleaningSecurityStep } from "@/components/procedures/closing/steps/CleaningSecurityStep";
import { TomorrowPreparationStep } from "@/components/procedures/closing/steps/TomorrowPreparationStep";

const STEPS = [
  {
    number: 1,
    title: "Rekonsiliasi Kas",
    description: "Hitung uang fisik dan bandingkan dengan sistem",
    icon: Banknote,
    component: CashReconciliationStep,
  },
  {
    number: 2,
    title: "Hitung Stok Akhir",
    description: "Catat stok fisik semua barang",
    icon: Package,
    component: FinalStockCountStep,
  },
  {
    number: 3,
    title: "Laporan Harian",
    description: "Ringkasan penjualan dan aktivitas",
    icon: FileText,
    component: DailyReportStep,
  },
  {
    number: 4,
    title: "Pembersihan & Keamanan",
    description: "Bersihkan area dan amankan toko",
    icon: Shield,
    component: CleaningSecurityStep,
  },
  {
    number: 5,
    title: "Persiapan Besok",
    description: "Siapkan modal dan cek kebutuhan",
    icon: Calendar,
    component: TomorrowPreparationStep,
  },
];

export default function ClosingProcedurePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [currentClosing, setCurrentClosing] = useState<ClosingProcedure | null>(null);
  const [openingCompleted, setOpeningCompleted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkProcedureStatus();
  }, []);

  const checkProcedureStatus = async () => {
    try {
      // First check if opening was completed today
      const openingResult = await openingProcedureService.checkTodayOpening();
      if (!openingResult.hasOpening || !openingResult.opening?.completed) {
        setOpeningCompleted(false);
        setLoading(false);
        return;
      }
      
      setOpeningCompleted(true);

      // Then check for existing closing procedure
      const result = await closingProcedureService.checkTodayClosing();
      if (result.hasClosing && result.closing) {
        setCurrentClosing(result.closing);
      }
    } catch (error) {
      console.error("Error checking procedure status:", error);
      setError("Failed to check procedure status");
    } finally {
      setLoading(false);
    }
  };

  const startClosing = async () => {
    try {
      setLoading(true);
      const result = await closingProcedureService.startClosing();
      if (result.success) {
        setCurrentClosing(result.closing);
      } else {
        setError(result.error || "Failed to start closing procedure");
      }
    } catch (error) {
      console.error("Error starting closing:", error);
      setError("Failed to start closing procedure");
    } finally {
      setLoading(false);
    }
  };

  const handleStepComplete = async (stepNumber: number, stepData: any) => {
    if (!currentClosing) return;

    try {
      const result = await closingProcedureService.updateStep(
        currentClosing.id,
        stepNumber,
        stepData,
        true
      );

      if (result.success) {
        setCurrentClosing(result.closing);
        
        // If all steps completed, redirect to dashboard
        if (result.closing.completed) {
          router.push("/dashboard");
        }
      }
    } catch (error) {
      console.error("Error updating step:", error);
      setError("Failed to update step");
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  if (!openingCompleted) {
    return (
      <AppLayout>
        <div className="container max-w-4xl mx-auto p-6">
          <Alert className="border-amber-200 bg-amber-50">
            <AlertCircle className="h-4 w-4 text-amber-600" />
            <AlertTitle className="text-amber-800">Pembukaan Belum Selesai</AlertTitle>
            <AlertDescription className="text-amber-700">
              Anda harus menyelesaikan prosedur pembukaan hari ini sebelum dapat melakukan penutupan.
            </AlertDescription>
            <Button 
              className="mt-4" 
              onClick={() => router.push("/procedures/opening")}
            >
              Ke Prosedur Pembukaan
            </Button>
          </Alert>
        </div>
      </AppLayout>
    );
  }

  if (!currentClosing) {
    return (
      <AppLayout>
        <div className="container max-w-4xl mx-auto p-6">
          <Card>
            <CardHeader>
              <CardTitle>Prosedur Penutupan</CardTitle>
              <CardDescription>
                Mulai prosedur penutupan untuk hari ini
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Prosedur penutupan memastikan semua aktivitas hari ini tercatat dengan benar
                dan toko siap untuk besok.
              </p>
              
              <div className="space-y-2">
                <h3 className="font-medium">Langkah-langkah:</h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  <li>Rekonsiliasi kas (hitung uang fisik)</li>
                  <li>Hitung stok akhir semua barang</li>
                  <li>Review laporan penjualan harian</li>
                  <li>Bersihkan area dan amankan toko</li>
                  <li>Siapkan kebutuhan untuk besok</li>
                </ul>
              </div>

              <Button onClick={startClosing} className="w-full">
                Mulai Penutupan
              </Button>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }

  const currentStep = currentClosing.currentStep;
  const CurrentStepComponent = STEPS[currentStep - 1]?.component;
  const currentStepData = currentClosing.stepData?.[`step${currentStep}`] || {};

  return (
    <AppLayout>
      <div className="container max-w-4xl mx-auto p-6">
        {/* Progress Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold mb-2">Prosedur Penutupan</h1>
          <p className="text-muted-foreground">
            Langkah {currentStep} dari {STEPS.length}
          </p>
        </div>

        {/* Step Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {STEPS.map((step, index) => {
              const StepIcon = step.icon;
              const isCompleted = index + 1 < currentStep;
              const isCurrent = index + 1 === currentStep;
              
              return (
                <div key={step.number} className="flex items-center">
                  <div className="flex flex-col items-center">
                    <div
                      className={`
                        w-12 h-12 rounded-full flex items-center justify-center transition-colors
                        ${isCompleted 
                          ? "bg-primary text-primary-foreground" 
                          : isCurrent
                          ? "bg-primary/20 text-primary border-2 border-primary"
                          : "bg-muted text-muted-foreground"
                        }
                      `}
                    >
                      {isCompleted ? (
                        <CheckCircle2 className="h-6 w-6" />
                      ) : (
                        <StepIcon className="h-6 w-6" />
                      )}
                    </div>
                    <span className="text-xs mt-2 text-center max-w-[80px]">
                      {step.title}
                    </span>
                  </div>
                  {index < STEPS.length - 1 && (
                    <div
                      className={`
                        h-1 w-12 mx-2 transition-colors
                        ${isCompleted ? "bg-primary" : "bg-muted"}
                      `}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Current Step Content */}
        {CurrentStepComponent && (
          <CurrentStepComponent
            data={currentStepData}
            onNext={(data) => handleStepComplete(currentStep, data)}
          />
        )}

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive" className="mt-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </div>
    </AppLayout>
  );
}