"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ChevronLeft, ChevronRight, AlertCircle, Loader2, CheckCircle2, ClipboardCheck } from "lucide-react";
import { OpeningProgressBar } from "./OpeningProgressBar";
import { HygieneStep } from "./steps/HygieneStep";
import { StockCountStep } from "./steps/StockCountStep";
import { DisplayPrepStep } from "./steps/DisplayPrepStep";
import { CashSetupStep } from "./steps/CashSetupStep";
import { FinalChecklistStep } from "./steps/FinalChecklistStep";
import { OpeningSummary } from "./OpeningSummary";
import { useRouter } from "next/navigation";
import { openingProcedureService } from "@/lib/services/opening-procedure";

const STEPS = [
  { id: 1, name: "Kebersihan", component: HygieneStep },
  { id: 2, name: "Cek & Susun Stok", component: StockCountStep },
  { id: 3, name: "Siapkan Display", component: DisplayPrepStep },
  { id: 4, name: "Modal Awal", component: CashSetupStep },
  { id: 5, name: "Checklist Akhir", component: FinalChecklistStep },
];

export function OpeningProcedureFlow() {
  const [currentStep, setCurrentStep] = useState(1);
  const [stepData, setStepData] = useState<Record<number, any>>({});
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
          // Also load the data to show summary
          setStepData(checkResult.opening.stepData || {});
          setOpeningId(checkResult.opening.id);
        } else {
          // Continue existing opening
          setOpeningId(checkResult.opening.id);
          setCurrentStep(checkResult.opening.currentStep);
          setStepData(checkResult.opening.stepData || {});
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
        setCurrentStep(1);
        setStepData({});
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

  const CurrentStepComponent = STEPS[currentStep - 1]?.component;

  const handleNext = async (data: any) => {
    if (!openingId) return;
    
    try {
      setSaving(true);
      
      // Update step data locally first
      const newStepData = { ...stepData, [currentStep]: data };
      setStepData(newStepData);
      
      // Save to API
      const updateResult = await openingProcedureService.updateStep(
        openingId,
        currentStep,
        data,
        true // Mark step as completed
      );
      
      if (updateResult.success) {
        if (currentStep === STEPS.length) {
          setIsCompleted(true);
        } else {
          setCurrentStep((prev) => prev + 1);
        }
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

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleSaveAndExit = async () => {
    if (!openingId || !CurrentStepComponent) return;
    
    try {
      setSaving(true);
      
      // Save current progress without completing the step
      await openingProcedureService.saveProgress(
        openingId,
        currentStep,
        stepData[currentStep] || {}
      );
      
      // Navigate back to dashboard
      router.push('/dashboard');
    } catch (err) {
      console.error("Error saving progress:", err);
      setError("Failed to save progress. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleRestart = () => {
    // This should only be used after completion
    // Redirect to dashboard to start fresh tomorrow
    router.push('/dashboard');
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
    return <OpeningSummary data={stepData} onRestart={handleRestart} />;
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
        <p className="text-gray-600 text-sm">SOP Pembukaan Dagangan Risol</p>
      </div>

      {/* Progress */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-gray-700">
            Langkah {currentStep} dari {STEPS.length}
          </span>
          <span className="text-sm text-gray-500">
            {STEPS[currentStep - 1].name}
          </span>
        </div>
        <OpeningProgressBar
          currentStep={currentStep}
          totalSteps={STEPS.length}
        />
      </div>

      {/* Step Content */}
      <Card className="p-4 md:p-6 mb-6 shadow-sm relative">
        {saving && (
          <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-10 rounded-lg">
            <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
          </div>
        )}
        <CurrentStepComponent
          data={stepData[currentStep] || {}}
          onNext={handleNext}
        />
      </Card>

      {/* Desktop Navigation */}
      <div className="hidden md:flex justify-between mb-4">
        <Button
          variant="outline"
          onClick={handleBack}
          disabled={currentStep === 1}
        >
          <ChevronLeft className="mr-2 h-4 w-4" />
          Kembali
        </Button>

        <div className="flex gap-2">
          <Button 
            variant="outline"
            onClick={handleSaveAndExit}
            disabled={saving}
          >
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Menyimpan...
              </>
            ) : (
              'Simpan & Keluar'
            )}
          </Button>
        </div>
      </div>

      {/* Mobile Floating Action Buttons */}
      <div className="fixed bottom-16 left-0 right-0 px-4 py-3 bg-white border-t shadow-lg md:hidden">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleBack}
            disabled={currentStep === 1}
            className="flex-1"
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="ml-1">Kembali</span>
          </Button>
          <div className="flex items-center justify-center px-4 py-2 bg-gray-100 rounded-md min-w-[60px]">
            <span className="text-sm font-medium">
              {currentStep}/{STEPS.length}
            </span>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1"
            onClick={handleSaveAndExit}
            disabled={saving}
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Simpan'}
          </Button>
        </div>
      </div>
    </div>
  );
}
