"use client"

import { ReimbursementDetails } from "@/components/reimbursement/reimbursement-details";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { LogoutButton } from "@/components/auth/logout-button";
import { BottomNavigation } from "@/components/ui/bottom-navigation";

export default function ReimbursementDetailPage({
  params,
}: {
  params: { id: string };
}) {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 flex flex-col">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 sticky top-0 z-10 safe-top">
          <div className="px-4 py-3 flex items-center justify-between">
            <h1 className="text-xl font-bold text-gray-900">FnB Kita</h1>
            <LogoutButton variant="ghost" size="sm" showIcon={false} />
          </div>
        </header>

        {/* Main Content */}
        <div className="flex-1">
          <ReimbursementDetails reimbursementId={params.id} />
        </div>
        
        {/* Bottom Navigation */}
        <BottomNavigation />
      </div>
    </ProtectedRoute>
  );
}