"use client"

import { ReimbursementList } from "@/components/reimbursement/reimbursement-list";
import { AppLayout } from "@/components/layout/app-layout";
import { FAB } from "@/components/ui/fab";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";

export default function ReimbursementsPage() {
  const router = useRouter();

  return (
    <AppLayout title="Reimbursements">
      <div className="relative">
        <ReimbursementList />
        
        {/* Material Design 3 FAB */}
        <div className="fixed bottom-20 right-4 z-40">
          <div className="relative group">
            <FAB
              variant="primary"
              size="medium"
              onClick={() => router.push("/reimbursements/new")}
              className="shadow-2xl"
            >
              <Plus className="h-6 w-6" />
            </FAB>
            
            {/* Material Design 3 Tooltip */}
            <div className="absolute bottom-full right-0 mb-2 px-3 py-2 bg-gray-800 text-white text-sm rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap pointer-events-none z-50">
              New Request
              <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}