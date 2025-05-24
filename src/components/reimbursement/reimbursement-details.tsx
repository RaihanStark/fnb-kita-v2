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
      <Card className="shadow-md border-0 m-4">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-orange-500 mx-auto mb-4" />
            <p className="text-gray-500 font-medium">Loading reimbursement...</p>
          </div>
        </div>
      </Card>
    );
  }

  if (error || !selectedReimbursement) {
    return (
      <Card className="shadow-md border-0 m-4">
        <div className="text-center py-12">
          <p className="text-red-500 font-medium mb-4">{error || "Reimbursement not found"}</p>
          <Button 
            onClick={() => router.back()}
            variant="outline"
            className="shadow-sm"
          >
            Go Back
          </Button>
        </div>
      </Card>
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
    <div className="p-4 pb-20">
      {/* Material Design Amount Card */}
      <Card className="shadow-md border-0 mb-6">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-orange-50 rounded-xl flex items-center justify-center">
                <span className="text-3xl">{categoryIcons[selectedReimbursement.category]}</span>
              </div>
              <div>
                <h2 className="text-2xl font-semibold text-gray-900">
                  IDR {selectedReimbursement.amount.toLocaleString("id-ID")}
                </h2>
                <p className="text-gray-600 capitalize font-medium">{selectedReimbursement.category}</p>
              </div>
            </div>
            <Badge 
              className={`${statusColors[selectedReimbursement.status]} border-0 font-medium px-3 py-1`} 
              variant="secondary"
            >
              {selectedReimbursement.status}
            </Badge>
          </div>

          <div className="space-y-6">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Description</h3>
              <p className="text-gray-600 leading-relaxed">{selectedReimbursement.description}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Submitted By</h3>
                <p className="text-gray-600 font-medium">{selectedReimbursement.employeeName}</p>
                <p className="text-sm text-gray-500">{selectedReimbursement.employeeEmail}</p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Submitted Date</h3>
                <p className="text-gray-600 font-medium">
                  {format(selectedReimbursement.submittedDate, "dd MMMM yyyy")}
                </p>
                <p className="text-sm text-gray-500">
                  {format(selectedReimbursement.submittedDate, "HH:mm")}
                </p>
              </div>
            </div>

            {selectedReimbursement.processedDate && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Processed By</h3>
                  <p className="text-gray-600 font-medium">{selectedReimbursement.processedBy}</p>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Processed Date</h3>
                  <p className="text-gray-600 font-medium">
                    {format(selectedReimbursement.processedDate, "dd MMMM yyyy HH:mm")}
                  </p>
                </div>
              </div>
            )}

            {selectedReimbursement.paidDate && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Paid Date</h3>
                <p className="text-gray-600 font-medium">
                  {format(selectedReimbursement.paidDate, "dd MMMM yyyy HH:mm")}
                </p>
              </div>
            )}

            {selectedReimbursement.managerComments && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Manager Comments</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-gray-600 leading-relaxed">{selectedReimbursement.managerComments}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Material Design Receipt Card */}
      {selectedReimbursement.receiptUrl && (
        <Card className="shadow-md border-0 mb-6">
          <div className="p-6">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              Receipt
            </h3>
            {!imageError ? (
              <div className="relative w-full h-64 md:h-96 rounded-lg overflow-hidden bg-gray-50">
                <Image
                  src={selectedReimbursement.receiptUrl}
                  alt="Receipt"
                  fill
                  className="object-contain"
                  onError={() => setImageError(true)}
                />
              </div>
            ) : (
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <Receipt className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 font-medium mb-2">Failed to load receipt image</p>
                <a
                  href={selectedReimbursement.receiptUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-orange-600 hover:text-orange-700 font-medium"
                >
                  Open receipt in new tab →
                </a>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Manager Actions */}
      {role === "Manager" && user && (
        <ReimbursementActions
          reimbursement={selectedReimbursement}
          managerId={user.uid}
        />
      )}
    </div>
  );
}