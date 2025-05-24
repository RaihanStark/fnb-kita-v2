"use client"

import { ReimbursementForm } from "@/components/reimbursement/reimbursement-form";
import { AppLayout } from "@/components/layout/app-layout";

export default function NewReimbursementPage() {
  return (
    <AppLayout title="New Reimbursement">
      <ReimbursementForm />
    </AppLayout>
  );
}