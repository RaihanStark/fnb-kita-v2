"use client"

import { ReimbursementDetails } from "@/components/reimbursement/reimbursement-details";
import { AppLayout } from "@/components/layout/app-layout";

export default function ReimbursementDetailPage({
  params,
}: {
  params: { id: string };
}) {
  return (
    <AppLayout title="Reimbursement Details">
      <ReimbursementDetails reimbursementId={params.id} />
    </AppLayout>
  );
}