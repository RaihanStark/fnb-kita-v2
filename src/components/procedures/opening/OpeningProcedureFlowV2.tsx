"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { 
  AlertCircle, 
  Loader2, 
  CheckCircle2, 
  ClipboardCheck,
  Sparkles,
  Package,
  Store,
  DollarSign,
  ListChecks,
  Circle
} from "lucide-react";
import { HygieneStep } from "./steps/HygieneStep";
import { StockCountStep } from "./steps/StockCountStep";
import { DisplayPrepStep } from "./steps/DisplayPrepStep";
import { CashSetupStep } from "./steps/CashSetupStep";
import { FinalChecklistStep } from "./steps/FinalChecklistStep";
import { OpeningSummary } from "./OpeningSummary";
import { useRouter } from "next/navigation";
import { openingProcedureService } from "@/lib/services/opening-procedure";
import { Dialog, DialogContent } from "@/components/ui/dialog";

const STEPS = [
  { 
    id: 1, 
    name: "Kebersihan", 
    description: "Cek kebersihan area dan peralatan",
    icon: Sparkles,
    color: "bg-blue-100 text-blue-600",
    component: HygieneStep 
  },
  { 
    id: 2, 
    name: "Cek & Susun Stok", 
    description: "Hitung dan susun stok produk",
    icon: Package,
    color: "bg-purple-100 text-purple-600",
    component: StockCountStep 
  },
  { 
    id: 3, 
    name: "Siapkan Display", 
    description: "Atur display produk dan harga",
    icon: Store,
    color: "bg-green-100 text-green-600",
    component: DisplayPrepStep 
  },
  { 
    id: 4, 
    name: "Modal Awal", 
    description: "Hitung dan catat modal kas",
    icon: DollarSign,
    color: "bg-yellow-100 text-yellow-600",
    component: CashSetupStep 
  },
  { 
    id: 5, 
    name: "Checklist Akhir", 
    description: "Pastikan semua siap berjualan",
    icon: ListChecks,
    color: "bg-orange-100 text-orange-600",
    component: FinalChecklistStep 
  },
];

export function OpeningProcedureFlowV2() {
  const [selectedStep, setSelectedStep] = useState<number | null>(null);
  const [stepData, setStepData] = useState<Record<number, any>>({});
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [isCompleted, setIsCompleted] = useState(false);
  const [openingId, setOpeningId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [alreadyCompletedToday, setAlreadyCompletedToday] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const router = useRouter();

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
          setStepData(checkResult.opening.stepData || {});
          setOpeningId(checkResult.opening.id);
        } else {
          // Continue existing opening
          setOpeningId(checkResult.opening.id);
          setStepData(checkResult.opening.stepData || {});
          
          // Determine which steps are completed
          const completed = new Set<number>();
          for (let i = 1; i <= STEPS.length; i++) {
            const stepKey = `step${i}`;
            if (checkResult.opening.stepData?.[stepKey]?.completedAt) {
              completed.add(i);
            }
          }
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
      } else {
        // If opening already exists, refresh the page to load it
        if (startResult.error?.includes('already exists')) {
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

  const CurrentStepComponent = selectedStep ? STEPS[selectedStep - 1]?.component : null;

  const handleStepComplete = async (data: any) => {
    if (!openingId || !selectedStep) return;
    
    try {
      setSaving(true);
      
      // Update step data locally first
      const newStepData = { ...stepData, [selectedStep]: data };
      setStepData(newStepData);
      
      // Save to API
      const updateResult = await openingProcedureService.updateStep(
        openingId,
        selectedStep,
        data,
        true // Mark step as completed
      );
      
      if (updateResult.success) {
        const newCompletedSteps = new Set(completedSteps);
        newCompletedSteps.add(selectedStep);
        setCompletedSteps(newCompletedSteps);
        
        // Check if all steps are completed
        if (newCompletedSteps.size === STEPS.length) {
          setIsCompleted(true);
        }
        
        // Close the step dialog
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

  const handleStepClick = (stepId: number) => {
    setSelectedStep(stepId);
  };

  const handleCloseStep = () => {
    setSelectedStep(null);
  };

  const getStepStatus = (stepId: number) => {
    if (completedSteps.has(stepId)) return 'completed';
    return 'pending';
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
              <AlertDescription className="text-red-700">{error}</AlertDescription>
              <Button 
                onClick={() => router.push('/dashboard')} 
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
    // Show the summary of completed opening
    return <OpeningSummary data={stepData} onRestart={() => router.push('/dashboard')} />;
  }

  if (isCompleted) {
    return <OpeningSummary data={stepData} onRestart={() => router.push('/dashboard')} />;
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

  return (
    <div className="max-w-4xl mx-auto px-4 pb-32 md:px-6 md:pb-8">
      {/* Header */}
      <div className="py-6">
        <h1 className="text-2xl font-semibold text-gray-900 mb-1">
          Prosedur Pembukaan
        </h1>
        <p className="text-gray-600 text-sm">Pilih langkah yang ingin dikerjakan</p>
      </div>

      {/* Progress Summary */}
      <div className="mb-8">
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

      {/* Step Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {STEPS.map((step) => {
          const Icon = step.icon;
          const status = getStepStatus(step.id);
          const isCompleted = status === 'completed';
          
          return (
            <Card 
              key={step.id}
              className={`cursor-pointer transition-all hover:shadow-md ${
                isCompleted ? 'border-green-200 bg-green-50/50' : 'hover:border-orange-200'
              }`}
              onClick={() => handleStepClick(step.id)}
            >
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-lg ${isCompleted ? 'bg-green-100' : step.color}`}>
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
                        <Badge variant="outline" className="text-green-600 border-green-600">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Selesai
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">{step.description}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Complete All Button */}
      {completedSteps.size === STEPS.length && (
        <div className="text-center">
          <Button
            size="lg"
            className="bg-green-600 hover:bg-green-700"
            onClick={() => setIsCompleted(true)}
          >
            <CheckCircle2 className="mr-2 h-5 w-5" />
            Selesaikan Pembukaan
          </Button>
        </div>
      )}

      {/* Step Dialog */}
      <Dialog open={selectedStep !== null} onOpenChange={(open) => !open && handleCloseStep()}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          {CurrentStepComponent && selectedStep && (
            <div className="relative">
              {saving && (
                <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-10 rounded-lg">
                  <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
                </div>
              )}
              <div className="mb-4">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  {React.createElement(STEPS[selectedStep - 1].icon, { className: "h-5 w-5" })}
                  {STEPS[selectedStep - 1].name}
                </h2>
                <p className="text-sm text-gray-600">
                  {STEPS[selectedStep - 1].description}
                </p>
              </div>
              <CurrentStepComponent
                data={stepData[selectedStep] || {}}
                onNext={handleStepComplete}
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

import React from 'react';