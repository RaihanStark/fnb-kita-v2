"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import useAuthStore from "@/stores/auth-store";
import useReimbursementStore from "@/stores/reimbursement-store";
import { ReimbursementCard } from "./reimbursement-card";
import { ReimbursementFilters } from "./reimbursement-filters";
import { ReimbursementStats } from "./reimbursement-stats";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Plus, Loader2 } from "lucide-react";

export function ReimbursementList() {
  const router = useRouter();
  const { user, role } = useAuthStore();
  const {
    reimbursements,
    loading,
    error,
    hasMore,
    fetchReimbursements,
    fetchStats,
  } = useReimbursementStore();
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  useEffect(() => {
    if (user) {
      fetchReimbursements(role || "Employee", user.uid, true);
      fetchStats(role === "Manager" ? undefined : user.uid);
    }
  }, [user, role]);

  const handleLoadMore = async () => {
    if (!user || isLoadingMore || !hasMore) return;
    
    setIsLoadingMore(true);
    await fetchReimbursements(role || "Employee", user.uid);
    setIsLoadingMore(false);
  };

  const handleReimbursementClick = (id: string) => {
    router.push(`/reimbursements/${id}`);
  };

  if (loading && reimbursements.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-4 pb-20">
        
        <Card className="p-6">
          <div className="text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <p className="text-sm text-gray-600 mb-4">
              If this is your first time using the reimbursement module, the database might not be initialized yet.
            </p>
            <Button onClick={() => router.push("/reimbursements/new")} variant="outline">
              Create Your First Reimbursement
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 pb-20">

      {role === "Manager" && <ReimbursementStats />}
      
      <ReimbursementFilters />

      <div className="mt-6">
        {reimbursements.length === 0 ? (
          <Card className="shadow-md border-0">
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Plus className="h-8 w-8 text-gray-400" />
              </div>
              <p className="text-gray-500 text-lg font-medium mb-2">No reimbursements found</p>
              <p className="text-gray-400 text-sm">Create your first reimbursement request</p>
            </div>
          </Card>
        ) : (
          <div className="space-y-3">
            {reimbursements.map((reimbursement) => (
              <ReimbursementCard
                key={reimbursement.id}
                reimbursement={reimbursement}
                onClick={() => handleReimbursementClick(reimbursement.id)}
              />
            ))}
            
            {hasMore && (
              <div className="text-center mt-6">
                <Button
                  variant="outline"
                  onClick={handleLoadMore}
                  disabled={isLoadingMore}
                  className="shadow-sm"
                >
                  {isLoadingMore ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    "Load More"
                  )}
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}