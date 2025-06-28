"use client";

import { Card } from "@/components/ui/card";
import useReimbursementStore from "@/stores/reimbursement-store";
import { Loader2 } from "lucide-react";

export function ReimbursementStats() {
  const { stats, loadingStats } = useReimbursementStore();

  if (loadingStats) {
    return (
      <Card className="p-4 mb-6">
        <div className="flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      </Card>
    );
  }

  if (!stats) return null;

  const statItems = [
    { label: "Total", value: stats.total, color: "text-gray-600" },
    { label: "Pending", value: stats.pending, color: "text-yellow-600" },
    { label: "Approved", value: stats.approved, color: "text-green-600" },
    { label: "Denied", value: stats.denied, color: "text-red-600" },
    { label: "Paid", value: stats.paid, color: "text-blue-600" },
  ];

  return (
    <Card className="p-4 mb-6">
      <h2 className="text-lg font-semibold mb-4">Overview</h2>
      
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
        {statItems.map((item) => (
          <div key={item.label} className="text-center">
            <p className={`text-2xl font-bold ${item.color}`}>{item.value}</p>
            <p className="text-sm text-gray-500">{item.label}</p>
          </div>
        ))}
      </div>
      
      <div className="border-t pt-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500">Total Amount</p>
            <p className="text-xl font-semibold">
              IDR {stats.totalAmount.toLocaleString("id-ID")}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Paid Amount</p>
            <p className="text-xl font-semibold text-blue-600">
              IDR {stats.paidAmount.toLocaleString("id-ID")}
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
}