"use client"

import { ReimbursementList } from "@/components/reimbursement/reimbursement-list";
import { AppLayout } from "@/components/layout/app-layout";

export default function ReimbursementsPage() {
  return (
    <AppLayout title="Reimbursements">
      <ReimbursementList />
    </AppLayout>
  );
}