"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import useAuthStore from "@/stores/auth-store";
import useReimbursementStore from "@/stores/reimbursement-store";
import { ReimbursementActions } from "./reimbursement-actions";
import { ArrowLeft, Receipt, Loader2 } from "lucide-react";
import Image from "next/image";

interface ReimbursementDetailsProps {
  reimbursementId: string;
}

export function ReimbursementDetails({ reimbursementId }: ReimbursementDetailsProps) {
  const router = useRouter();
  const { user, role } = useAuthStore();
  const { selectedReimbursement, loading, error, fetchReimbursement } = useReimbursementStore();
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    fetchReimbursement(reimbursementId);
  }, [reimbursementId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error || !selectedReimbursement) {
    return (
      <div className="max-w-4xl mx-auto p-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
          className="mb-4"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="text-center py-8">
          <p className="text-red-600">{error || "Reimbursement not found"}</p>
        </div>
      </div>
    );
  }

  const statusColors = {
    pending: "bg-yellow-100 text-yellow-800",
    approved: "bg-green-100 text-green-800",
    denied: "bg-red-100 text-red-800",
    paid: "bg-blue-100 text-blue-800",
  };

  const categoryIcons = {
    meal: "🍽️",
    transport: "🚗",
    supplies: "📦",
    other: "📋",
  };

  return (
    <div className="max-w-4xl mx-auto p-4 pb-20">
      <div className="flex items-center gap-2 mb-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold">Reimbursement Details</h1>
      </div>

      <Card className="p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{categoryIcons[selectedReimbursement.category]}</span>
            <div>
              <h2 className="text-2xl font-bold">
                IDR {selectedReimbursement.amount.toLocaleString("id-ID")}
              </h2>
              <p className="text-gray-600 capitalize">{selectedReimbursement.category}</p>
            </div>
          </div>
          <Badge className={statusColors[selectedReimbursement.status]} variant="secondary">
            {selectedReimbursement.status}
          </Badge>
        </div>

        <div className="space-y-4">
          <div>
            <h3 className="font-semibold mb-1">Description</h3>
            <p className="text-gray-600">{selectedReimbursement.description}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="font-semibold mb-1">Submitted By</h3>
              <p className="text-gray-600">{selectedReimbursement.employeeName}</p>
              <p className="text-sm text-gray-500">{selectedReimbursement.employeeEmail}</p>
            </div>
            <div>
              <h3 className="font-semibold mb-1">Submitted Date</h3>
              <p className="text-gray-600">
                {format(selectedReimbursement.submittedDate, "dd MMMM yyyy")}
              </p>
              <p className="text-sm text-gray-500">
                {format(selectedReimbursement.submittedDate, "HH:mm")}
              </p>
            </div>
          </div>

          {selectedReimbursement.processedDate && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="font-semibold mb-1">Processed By</h3>
                <p className="text-gray-600">{selectedReimbursement.processedBy}</p>
              </div>
              <div>
                <h3 className="font-semibold mb-1">Processed Date</h3>
                <p className="text-gray-600">
                  {format(selectedReimbursement.processedDate, "dd MMMM yyyy HH:mm")}
                </p>
              </div>
            </div>
          )}

          {selectedReimbursement.paidDate && (
            <div>
              <h3 className="font-semibold mb-1">Paid Date</h3>
              <p className="text-gray-600">
                {format(selectedReimbursement.paidDate, "dd MMMM yyyy HH:mm")}
              </p>
            </div>
          )}

          {selectedReimbursement.managerComments && (
            <div>
              <h3 className="font-semibold mb-1">Manager Comments</h3>
              <p className="text-gray-600">{selectedReimbursement.managerComments}</p>
            </div>
          )}
        </div>
      </Card>

      {selectedReimbursement.receiptUrl && (
        <Card className="p-6 mb-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Receipt
          </h3>
          {!imageError ? (
            <div className="relative w-full h-64 md:h-96">
              <Image
                src={selectedReimbursement.receiptUrl}
                alt="Receipt"
                fill
                className="object-contain rounded-lg"
                onError={() => setImageError(true)}
              />
            </div>
          ) : (
            <div className="text-center py-8 bg-gray-50 rounded-lg">
              <p className="text-gray-500">Failed to load receipt image</p>
              <a
                href={selectedReimbursement.receiptUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline mt-2 inline-block"
              >
                Open receipt in new tab
              </a>
            </div>
          )}
        </Card>
      )}

      {role === "Manager" && user && (
        <ReimbursementActions
          reimbursement={selectedReimbursement}
          managerId={user.uid}
        />
      )}
    </div>
  );
}