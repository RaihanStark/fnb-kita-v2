"use client";

import { useState, useEffect } from "react";
import useAuthStore from "@/stores/auth-store";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import {
  User,
  ChefHat,
  FileText,
  Package,
  Clock,
  Settings,
  ClipboardCheck,
  AlertCircle,
  CheckCircle2,
  Circle,
  Hourglass,
  ShoppingBag,
  PackageSearch,
  ShoppingCart,
  Wallet,
  TrendingUp,
  DollarSign,
} from "lucide-react";
import { openingProcedureService, closingProcedureService } from "@/lib/services";
import { formatCurrency } from "@/lib/utils/format";

export default function DashboardPage() {
  const user = useAuthStore((state) => state.user);
  const router = useRouter();
  const [hasOngoingOpening, setHasOngoingOpening] = useState(false);
  const [hasOngoingClosing, setHasOngoingClosing] = useState(false);
  const [openingStatus, setOpeningStatus] = useState<
    "pending" | "in_progress" | "completed"
  >("pending");
  const [closingStatus, setClosingStatus] = useState<
    "pending" | "in_progress" | "completed"
  >("pending");
  const [tradingActive, setTradingActive] = useState(false);
  const [financialData, setFinancialData] = useState({
    currentCash: 0,
    todaySales: 0,
    transactionCount: 0
  });

  useEffect(() => {
    // Check if there's an ongoing opening procedure from API
    checkOpeningStatus();
    fetchFinancialSummary();
  }, []);

  const checkOpeningStatus = async () => {
    try {
      // Check opening status
      const openingResult = await openingProcedureService.checkTodayOpening();
      if (openingResult.hasOpening && openingResult.opening) {
        if (openingResult.opening.completed) {
          setOpeningStatus("completed");
          setHasOngoingOpening(false);
          // If opening is completed, trading is active
          setTradingActive(true);
        } else {
          setOpeningStatus("in_progress");
          setHasOngoingOpening(true);
        }
      } else {
        setOpeningStatus("pending");
        setHasOngoingOpening(false);
      }

      // Check closing status
      const closingResult = await closingProcedureService.checkTodayClosing();
      if (closingResult.hasClosing && closingResult.closing) {
        if (closingResult.closing.completed) {
          setClosingStatus("completed");
          setHasOngoingClosing(false);
          setTradingActive(false); // Trading stops when closing is completed
        } else {
          setClosingStatus("in_progress");
          setHasOngoingClosing(true);
        }
      } else {
        setClosingStatus("pending");
        setHasOngoingClosing(false);
      }
    } catch (error) {
      console.error("Error checking procedure status:", error);
    }
  };

  const fetchFinancialSummary = async () => {
    try {
      // Fetch today's transactions
      const transResponse = await fetch('/api/transactions', {
        credentials: 'include'
      });
      
      if (transResponse.ok) {
        const transactions = await transResponse.json();
        
        // Calculate today's sales
        const salesTransactions = transactions.filter((t: any) => t.type === 'sales');
        const todaySales = salesTransactions.reduce((sum: number, t: any) => 
          sum + (Number(t.totalAmount) || 0), 0
        );
        
        // Get initial cash from today's opening if available
        let initialCash = 0;
        const openingResult = await openingProcedureService.checkTodayOpening();
        console.log('Opening result:', openingResult);
        
        if (openingResult.hasOpening && openingResult.opening?.stepData) {
          // Step 4 is the cash setup step
          const cashStep = openingResult.opening.stepData.step4;
          console.log('Cash step data:', cashStep);
          initialCash = cashStep?.totalCash || 0;
        }
        
        // Kas saat ini = Modal awal (dari pembukaan) + Penjualan hari ini
        const currentCash = initialCash + todaySales;
        
        setFinancialData({
          currentCash,
          todaySales,
          transactionCount: salesTransactions.length
        });
      }
    } catch (error) {
      console.error("Error fetching financial data:", error);
    }
  };

  const managerFeatures = [
    {
      icon: ClipboardCheck,
      label: "Pembukaan",
      color: "bg-green-100 text-green-600",
      href: "/procedures/opening",
    },
    {
      icon: ClipboardCheck,
      label: "Penutupan",
      color: "bg-red-100 text-red-600",
      href: "/procedures/closing",
    },
    {
      icon: ShoppingBag,
      label: "Produk",
      color: "bg-blue-100 text-blue-600",
      href: "/products",
    },
    {
      icon: PackageSearch,
      label: "Persediaan",
      color: "bg-purple-100 text-purple-600",
      href: "/stocks",
    },
    {
      icon: ShoppingCart,
      label: "Pembelian",
      color: "bg-green-100 text-green-600",
      href: "/purchases",
    },
  ];

  const employeeFeatures = [
    {
      icon: ClipboardCheck,
      label: "Opening",
      color: "bg-green-100 text-green-600",
      href: "/procedures/opening",
    },
    {
      icon: ClipboardCheck,
      label: "Penutupan",
      color: "bg-red-100 text-red-600",
      href: "/procedures/closing",
    },
    {
      icon: ShoppingBag,
      label: "Produk",
      color: "bg-blue-100 text-blue-600",
      href: "/products",
    },
    {
      icon: PackageSearch,
      label: "Persediaan",
      color: "bg-purple-100 text-purple-600",
      href: "/stocks",
    },
    {
      icon: ShoppingCart,
      label: "Pembelian",
      color: "bg-green-100 text-green-600",
      href: "/purchases",
    },
    {
      icon: Clock,
      label: "Clock In/Out",
      color: "bg-gray-100 text-gray-600",
      href: "",
    },
    {
      icon: Package,
      label: "Orders",
      color: "bg-orange-100 text-orange-600",
      href: "",
    },
    {
      icon: Settings,
      label: "Settings",
      color: "bg-orange-100 text-orange-600",
      href: "/settings",
    },
  ];

  const features =
    user?.role === "Manager" ? managerFeatures : employeeFeatures;

  return (
    <AppLayout>
      {/* Financial Summary Card */}
      <div className="p-4">
        <Card className="shadow-md border-0">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-orange-500" />
              Laporan Keuangan Hari Ini
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Wallet className="h-4 w-4" />
                  <span>Kas Saat Ini</span>
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(financialData.currentCash)}
                </p>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <TrendingUp className="h-4 w-4" />
                  <span>Penjualan Hari Ini</span>
                </div>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(financialData.todaySales)}
                </p>
                <p className="text-xs text-gray-500">
                  {financialData.transactionCount} transaksi
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Daily Trading Flow Indicator */}
        <Card className="mt-3 shadow-sm border-0 bg-gray-50">
          <CardContent className="py-3 px-4">
            <div className="flex items-center justify-between text-xs">
              {/* Opening */}
              <div className="flex items-center gap-1.5">
                {openingStatus === "completed" ? (
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                ) : openingStatus === "in_progress" ? (
                  <Hourglass className="h-4 w-4 text-amber-600" />
                ) : (
                  <Circle className="h-4 w-4 text-gray-400" />
                )}
                <span
                  className={`font-medium ${
                    openingStatus === "completed"
                      ? "text-green-700"
                      : openingStatus === "in_progress"
                      ? "text-amber-700"
                      : "text-gray-500"
                  }`}
                >
                  Pembukaan
                </span>
              </div>

              {/* Divider */}
              <div className="flex-1 mx-2">
                <div
                  className={`h-0.5 ${
                    openingStatus === "completed"
                      ? "bg-green-300"
                      : "bg-gray-300"
                  }`}
                ></div>
              </div>

              {/* Trading */}
              <div className="flex items-center gap-1.5">
                {tradingActive ? (
                  <Hourglass className="h-4 w-4 text-blue-600" />
                ) : (
                  <Circle className="h-4 w-4 text-gray-400" />
                )}
                <span
                  className={`font-medium ${
                    tradingActive ? "text-blue-700" : "text-gray-500"
                  }`}
                >
                  Transaksi
                </span>
              </div>

              {/* Divider */}
              <div className="flex-1 mx-2">
                <div
                  className={`h-0.5 ${
                    closingStatus !== "pending" || tradingActive
                      ? "bg-blue-300"
                      : "bg-gray-300"
                  }`}
                ></div>
              </div>

              {/* Closing */}
              <div className="flex items-center gap-1.5">
                {closingStatus === "completed" ? (
                  <CheckCircle2 className="h-4 w-4 text-red-600" />
                ) : closingStatus === "in_progress" ? (
                  <Hourglass className="h-4 w-4 text-amber-600" />
                ) : (
                  <Circle className="h-4 w-4 text-gray-400" />
                )}
                <span
                  className={`font-medium ${
                    closingStatus === "completed"
                      ? "text-red-700"
                      : closingStatus === "in_progress"
                      ? "text-amber-700"
                      : "text-gray-500"
                  }`}
                >
                  Penutupan
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Ongoing Opening Alert */}
      {hasOngoingOpening && (
        <div className="px-4 pb-4">
          <Alert className="border-amber-200 bg-amber-50">
            <div className="flex gap-3">
              <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <AlertTitle className="text-amber-800 font-semibold mb-1">
                  Prosedur Pembukaan Belum Selesai
                </AlertTitle>
                <AlertDescription className="text-amber-700 text-sm">
                  Anda memiliki prosedur pembukaan yang belum diselesaikan.
                  Lanjutkan untuk menyelesaikan proses pembukaan hari ini.
                </AlertDescription>
                <Button
                  size="sm"
                  className="mt-3 bg-amber-600 hover:bg-amber-700"
                  onClick={() => router.push("/procedures/opening")}
                >
                  Lanjutkan Pembukaan
                </Button>
              </div>
            </div>
          </Alert>
        </div>
      )}

      {/* Ongoing Closing Alert */}
      {hasOngoingClosing && (
        <div className="px-4 pb-4">
          <Alert className="border-red-200 bg-red-50">
            <div className="flex gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <AlertTitle className="text-red-800 font-semibold mb-1">
                  Prosedur Penutupan Sedang Berlangsung
                </AlertTitle>
                <AlertDescription className="text-red-700 text-sm">
                  Anda memiliki prosedur penutupan yang belum diselesaikan.
                  Lanjutkan untuk menyelesaikan proses penutupan hari ini.
                </AlertDescription>
                <Button
                  size="sm"
                  className="mt-3 bg-red-600 hover:bg-red-700"
                  onClick={() => router.push("/procedures/closing")}
                >
                  Lanjutkan Penutupan
                </Button>
              </div>
            </div>
          </Alert>
        </div>
      )}

      {/* Material Design Quick Actions */}
      <div className="px-4 pb-4">
        <h2 className="text-xl font-medium text-gray-900 mb-6">
          Quick Actions
        </h2>
        <div className="grid grid-cols-2 gap-4">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card
                key={index}
                className="shadow-md border-0 hover:shadow-lg transition-all duration-200 cursor-pointer active:scale-95"
                onClick={() => feature.href && router.push(feature.href)}
              >
                <CardContent className="p-6">
                  <div
                    className={`w-12 h-12 rounded-xl ${feature.color} flex items-center justify-center mb-4`}
                  >
                    <Icon className="w-6 h-6" />
                  </div>
                  <p className="font-medium text-gray-900 text-base">
                    {feature.label}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </AppLayout>
  );
}
