"use client"

import { ReimbursementList } from "@/components/reimbursement/reimbursement-list";
import { AppLayout } from "@/components/layout/app-layout";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";

export default function ReimbursementsPage() {
  const router = useRouter();

  return (
    <AppLayout 
      title="Reimbursements"
      trailingActions={
        <Button
          onClick={() => router.push("/reimbursements/new")}
          size="sm"
          className="bg-orange-600 hover:bg-orange-700 text-white"
        >
          <Plus className="h-4 w-4 mr-1" />
          New Request
        </Button>
      }
    >
      <ReimbursementList />
    </AppLayout>
  );
}