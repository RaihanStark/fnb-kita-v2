"use client"

import { use } from "react";
import { ReimbursementDetails } from "@/components/reimbursement/reimbursement-details";
import { AppLayout } from "@/components/layout/app-layout";

export default function ReimbursementDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  
  return (
    <AppLayout title="Reimbursement Details" showBackButton={true}>
      <ReimbursementDetails reimbursementId={id} />
    </AppLayout>
  );
}