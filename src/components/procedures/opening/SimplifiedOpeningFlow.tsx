"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  AlertCircle,
  Loader2,
  CheckCircle2,
  ClipboardCheck,
  Package,
  DollarSign,
} from "lucide-react";
import { SimpleStockCountStep } from "./steps/SimpleStockCountStep";
import { CashSetupStep } from "./steps/CashSetupStep";
import { useRouter } from "next/navigation";
import { openingProcedureService } from "@/lib/services/opening-procedure";

const STEPS = [
  {
    id: 2,
    name: "Cek & Susun Stok",
    description: "Hitung total stok setiap produk",
    icon: Package,
    color: "bg-purple-100 text-purple-600",
    component: SimpleStockCountStep,
  },
  {
    id: 4,
    name: "Modal Awal",
    description: "Hitung dan catat modal kas",
    icon: DollarSign,
    color: "bg-green-100 text-green-600",
    component: CashSetupStep,
  },
];

export function SimplifiedOpeningFlow() {
  const [selectedStep, setSelectedStep] = useState<number | null>(null);
  const [stepData, setStepData] = useState<Record<number, any>>({});
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [isCompleted, setIsCompleted] = useState(false);
  const [isFinalized, setIsFinalized] = useState(false);
  const [openingId, setOpeningId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [alreadyCompletedToday, setAlreadyCompletedToday] = useState(false);
  const [saving, setSaving] = useState(false);
  const [finalizing, setFinalizing] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const router = useRouter();

  // Helper function to convert API step data format to component format
  const mapStepDataFromAPI = (apiStepData: any): Record<number, any> => {
    const mappedData: Record<number, any> = {};
    if (!apiStepData) return mappedData;

    // Map step2, step4 to 2, 4
    STEPS.forEach((step) => {
      const apiKey = `step${step.id}`;
      if (apiStepData[apiKey]) {
        mappedData[step.id] = apiStepData[apiKey];
      }
    });

    return mappedData;
  };

  // Helper function to convert component step data format to API format
  const mapStepDataToAPI = (componentStepData: Record<number, any>): any => {
    const apiData: any = {};

    Object.entries(componentStepData).forEach(([stepId, data]) => {
      const apiKey = `step${stepId}`;
      apiData[apiKey] = data;
    });

    return apiData;
  };

  // Check for existing opening or start new one
  useEffect(() => {
    if (!isInitialized) {
      checkOrStartOpening();
    }
  }, [isInitialized]);

  const checkOrStartOpening = async () => {
    try {
      setLoading(true);
      setError("");
      setIsInitialized(true);

      // Check if there's an existing opening for today
      const checkResult = await openingProcedureService.checkTodayOpening();

      if (checkResult.hasOpening && checkResult.opening) {
        if (checkResult.opening.completed) {
          // Opening already completed today
          setAlreadyCompletedToday(true);
          const mappedData = mapStepDataFromAPI(checkResult.opening.stepData);
          console.log("Loading completed opening data:", {
            original: checkResult.opening.stepData,
            mapped: mappedData,
          });
          setStepData(mappedData);
          setOpeningId(checkResult.opening.id);
        } else {
          // Continue existing opening
          setOpeningId(checkResult.opening.id);
          const mappedData = mapStepDataFromAPI(checkResult.opening.stepData);
          console.log("Loading existing opening data:", {
            original: checkResult.opening.stepData,
            mapped: mappedData,
          });
          setStepData(mappedData);

          // Determine which steps are completed
          const completed = new Set<number>();
          STEPS.forEach((step) => {
            const stepKey = `step${step.id}`;
            if (checkResult.opening?.stepData?.[stepKey]?.completedAt) {
              completed.add(step.id);
            }
          });
          setCompletedSteps(completed);
          setIsCompleted(false);
        }
      } else {
        // Don't automatically start - wait for user action
        setLoading(false);
      }
    } catch (err) {
      console.error("Error checking opening:", err);
      setError("Failed to load opening procedure. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleStartOpening = async () => {
    try {
      setLoading(true);
      setError("");

      // Start new opening
      const startResult = await openingProcedureService.startOpening();
      if (startResult.success) {
        setOpeningId(startResult.opening.id);
        setStepData({});
        setCompletedSteps(new Set());
        setIsCompleted(false);
        setIsFinalized(false);
      } else {
        // If opening already exists, refresh the page to load it
        if (startResult.error?.includes("already exists")) {
          await checkOrStartOpening();
        } else {
          setError(startResult.error || "Failed to start opening procedure");
        }
      }
    } catch (err: any) {
      console.error("Error starting opening:", err);
      // If it's a conflict error, refresh to check for existing opening
      if (err.status === 409) {
        await checkOrStartOpening();
      } else {
        setError("Failed to start opening procedure. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleStepComplete = async (stepId: number, data: any) => {
    if (!openingId) return;

    try {
      setSaving(true);

      // Update step data locally first
      const newStepData = { ...stepData, [stepId]: data };
      setStepData(newStepData);

      // Save to API - the API expects the raw data, not the mapped format
      const updateResult = await openingProcedureService.updateStep(
        openingId,
        stepId,
        data,
        true // Mark step as completed
      );

      if (updateResult.success) {
        const newCompletedSteps = new Set(completedSteps);
        newCompletedSteps.add(stepId);
        setCompletedSteps(newCompletedSteps);

        // Clear selected step
        setSelectedStep(null);
      } else {
        setError("Failed to save progress. Please try again.");
      }
    } catch (err) {
      console.error("Error saving step:", err);
      setError("Failed to save progress. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleStepUpdate = async (stepId: number, data: any) => {
    if (!openingId) return;

    try {
      setSaving(true);

      // Update step data locally first
      const newStepData = { ...stepData, [stepId]: data };
      setStepData(newStepData);

      // Save to API without marking as completed
      const updateResult = await openingProcedureService.saveProgress(
        openingId,
        stepId,
        data
      );

      if (!updateResult.success) {
        setError("Failed to save progress. Please try again.");
      }
    } catch (err) {
      console.error("Error saving step:", err);
      setError("Failed to save progress. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleFinalizeOpening = async () => {
    if (!openingId) return;

    try {
      setFinalizing(true);
      setError("");

      // Auto-complete missing steps
      const finalStepData = { ...stepData };

      // Auto-complete step 1 (Hygiene)
      if (!finalStepData[1]) {
        await openingProcedureService.updateStep(
          openingId,
          1,
          {
            handWashing: true,
            areaClean: true,
            utensilsClean: true,
            pestFree: true,
            notes: "Auto-completed",
            completedAt: new Date().toISOString(),
          },
          true
        );
      }

      // Auto-complete step 3 (Display)
      if (!finalStepData[3]) {
        await openingProcedureService.updateStep(
          openingId,
          3,
          {
            arranged: true,
            labeled: true,
            temperatureChecked: true,
            coverReady: true,
            notes: "Auto-completed",
            completedAt: new Date().toISOString(),
          },
          true
        );
      }

      // Auto-complete step 5 (Final Checklist)
      if (!finalStepData[5]) {
        await openingProcedureService.updateStep(
          openingId,
          5,
          {
            salesBookReady: true,
            priceListVisible: true,
            packagingReady: true,
            mobilePaymentReady: true,
            personalReady: true,
            additionalNotes: "Auto-completed",
            completedAt: new Date().toISOString(),
            allStepsCompleted: true,
          },
          true
        );
      }

      // The API will automatically mark the opening as completed when all steps are done
      setIsFinalized(true);
      setIsCompleted(true);
      setTimeout(() => {
        router.push("/dashboard");
      }, 2000);
    } catch (err) {
      console.error("Error finalizing opening:", err);
      setError("Failed to finalize opening. Please try again.");
    } finally {
      setFinalizing(false);
    }
  };

  const handleStepClick = (stepId: number) => {
    setSelectedStep(stepId);
  };

  const getStepStatus = (stepId: number) => {
    if (completedSteps.has(stepId)) return "completed";
    if (selectedStep === stepId) return "active";
    return "pending";
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Alert className="border-red-200 bg-red-50">
          <div className="flex gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
            <div>
              <AlertTitle className="text-red-800">Error</AlertTitle>
              <AlertDescription className="text-red-700">
                {error}
              </AlertDescription>
              <Button
                onClick={() => router.push("/dashboard")}
                className="mt-3"
                variant="outline"
              >
                Kembali ke Dashboard
              </Button>
            </div>
          </div>
        </Alert>
      </div>
    );
  }

  if (alreadyCompletedToday) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center py-12">
          <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-green-100 mb-6">
            <CheckCircle2 className="h-10 w-10 text-green-600" />
          </div>
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">
            Pembukaan Sudah Selesai
          </h1>
          <p className="text-gray-600 mb-8">
            Prosedur pembukaan hari ini sudah diselesaikan
          </p>
          <Button
            onClick={() => router.push("/dashboard")}
            className="bg-orange-500 hover:bg-orange-600"
          >
            Kembali ke Dashboard
          </Button>
        </div>
      </div>
    );
  }

  if (isCompleted) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center py-12">
          <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-green-100 mb-6">
            <CheckCircle2 className="h-10 w-10 text-green-600" />
          </div>
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">
            Pembukaan Selesai!
          </h1>
          <p className="text-gray-600 mb-8">
            Semua langkah pembukaan telah diselesaikan. Selamat berjualan!
          </p>
          <div className="text-sm text-gray-500">
            Mengalihkan ke dashboard...
          </div>
        </div>
      </div>
    );
  }

  // Show start screen if no opening exists
  if (!openingId && !loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center py-12">
          <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-orange-100 mb-6">
            <ClipboardCheck className="h-10 w-10 text-orange-600" />
          </div>
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">
            Mulai Prosedur Pembukaan
          </h1>
          <p className="text-gray-600 mb-8">
            Klik tombol di bawah untuk memulai prosedur pembukaan hari ini
          </p>
          <Button
            size="lg"
            onClick={handleStartOpening}
            disabled={loading}
            className="bg-orange-500 hover:bg-orange-600"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Memulai...
              </>
            ) : (
              <>
                <ClipboardCheck className="mr-2 h-5 w-5" />
                Mulai Pembukaan
              </>
            )}
          </Button>
        </div>
      </div>
    );
  }

  const CurrentStepComponent = selectedStep
    ? STEPS.find((s) => s.id === selectedStep)?.component
    : null;

  return (
    <div className="max-w-4xl mx-auto px-4 pb-32 md:px-6 md:pb-8">
      {/* Progress Summary */}
      <div className="mb-8 mt-6">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-gray-700">
            Progress: {completedSteps.size} dari {STEPS.length} langkah selesai
          </span>
          {completedSteps.size === STEPS.length && (
            <Badge className="bg-green-100 text-green-700">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Semua Selesai
            </Badge>
          )}
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-orange-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${(completedSteps.size / STEPS.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Step Cards or Active Step */}
      {selectedStep ? (
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl flex items-center gap-2">
                {React.createElement(
                  STEPS.find((s) => s.id === selectedStep)!.icon,
                  { className: "h-5 w-5" }
                )}
                {STEPS.find((s) => s.id === selectedStep)!.name}
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedStep(null)}
              >
                Batal
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {CurrentStepComponent && (
              <div className="relative">
                {saving && (
                  <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-10 rounded-lg">
                    <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
                  </div>
                )}
                {(() => {
                  console.log(
                    "Step data for",
                    selectedStep,
                    ":",
                    stepData[selectedStep] || {}
                  );
                  return null;
                })()}
                <CurrentStepComponent
                  data={stepData[selectedStep] || {}}
                  onNext={(data: any) => handleStepComplete(selectedStep, data)}
                />
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {STEPS.map((step) => {
            const Icon = step.icon;
            const status = getStepStatus(step.id);
            const isCompleted = status === "completed";

            return (
              <Card
                key={step.id}
                className={`cursor-pointer transition-all hover:shadow-md ${
                  isCompleted
                    ? "border-green-200 bg-green-50/50"
                    : "hover:border-orange-200"
                }`}
                onClick={() => handleStepClick(step.id)}
              >
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div
                      className={`p-3 rounded-lg ${
                        isCompleted ? "bg-green-100" : step.color
                      }`}
                    >
                      {isCompleted ? (
                        <CheckCircle2 className="h-6 w-6 text-green-600" />
                      ) : (
                        <Icon className="h-6 w-6" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-lg">{step.name}</h3>
                        {isCompleted && (
                          <Badge
                            variant="outline"
                            className="text-green-600 border-green-600"
                          >
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Selesai
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">
                        {step.description}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Finalize Opening Button */}
      {!selectedStep && !isFinalized && (
        <div className="text-center mt-8">
          <Button
            size="lg"
            onClick={handleFinalizeOpening}
            disabled={finalizing || completedSteps.size === 0}
            className="bg-orange-500 hover:bg-orange-600"
          >
            {finalizing ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Menyelesaikan...
              </>
            ) : (
              <>
                <CheckCircle2 className="mr-2 h-5 w-5" />
                Selesaikan Pembukaan
              </>
            )}
          </Button>
          {completedSteps.size === 0 && (
            <p className="text-sm text-gray-500 mt-2">
              Selesaikan setidaknya satu langkah terlebih dahulu
            </p>
          )}
        </div>
      )}
    </div>
  );
}
