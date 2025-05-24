"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import useReimbursementStore from "@/stores/reimbursement-store";
import { Reimbursement } from "@/lib/firebase/reimbursement-service";
import { Check, X, DollarSign, Loader2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ReimbursementActionsProps {
  reimbursement: Reimbursement;
  managerId: string;
}

export function ReimbursementActions({ reimbursement, managerId }: ReimbursementActionsProps) {
  const router = useRouter();
  const { updateStatus } = useReimbursementStore();
  const [comments, setComments] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [pendingAction, setPendingAction] = useState<"approved" | "denied" | "paid" | null>(null);

  const canApproveOrDeny = reimbursement.status === "pending";
  const canMarkAsPaid = reimbursement.status === "approved";

  const handleAction = async (action: "approved" | "denied" | "paid") => {
    setPendingAction(action);
    setShowDialog(true);
  };

  const confirmAction = async () => {
    if (!pendingAction) return;

    try {
      setIsProcessing(true);
      await updateStatus(reimbursement.id, pendingAction, managerId, comments);
      setShowDialog(false);
      router.refresh();
    } catch (error) {
      console.error("Error updating status:", error);
      alert("Failed to update status. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  if (!canApproveOrDeny && !canMarkAsPaid) {
    return null;
  }

  const getActionMessage = () => {
    switch (pendingAction) {
      case "approved":
        return "Are you sure you want to approve this reimbursement?";
      case "denied":
        return "Are you sure you want to deny this reimbursement?";
      case "paid":
        return "Are you sure you want to mark this reimbursement as paid?";
      default:
        return "";
    }
  };

  return (
    <>
      <Card className="p-6">
        <h3 className="font-semibold mb-4">Manager Actions</h3>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="comments">Comments (Optional)</Label>
            <Textarea
              id="comments"
              placeholder="Add any comments..."
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              className="mt-1"
            />
          </div>

          <div className="flex gap-2">
            {canApproveOrDeny && (
              <>
                <Button
                  onClick={() => handleAction("approved")}
                  className="flex-1"
                  variant="default"
                >
                  <Check className="h-4 w-4 mr-2" />
                  Approve
                </Button>
                <Button
                  onClick={() => handleAction("denied")}
                  className="flex-1"
                  variant="destructive"
                >
                  <X className="h-4 w-4 mr-2" />
                  Deny
                </Button>
              </>
            )}
            
            {canMarkAsPaid && (
              <Button
                onClick={() => handleAction("paid")}
                className="w-full"
                variant="default"
              >
                <DollarSign className="h-4 w-4 mr-2" />
                Mark as Paid
              </Button>
            )}
          </div>
        </div>
      </Card>

      <AlertDialog open={showDialog} onOpenChange={setShowDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Action</AlertDialogTitle>
            <AlertDialogDescription>
              {getActionMessage()}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessing}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmAction} disabled={isProcessing}>
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                "Confirm"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}