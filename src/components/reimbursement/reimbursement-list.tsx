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
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Reimbursements</h1>
          <Button onClick={() => router.push("/reimbursements/new")}>
            <Plus className="h-4 w-4 mr-2" />
            New Request
          </Button>
        </div>
        
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
    <div className="max-w-4xl mx-auto p-4 pb-20">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Reimbursements</h1>
        <Button onClick={() => router.push("/reimbursements/new")}>
          <Plus className="h-4 w-4 mr-2" />
          New Request
        </Button>
      </div>

      {role === "Manager" && <ReimbursementStats />}
      
      <ReimbursementFilters />

      <div className="mt-6">
        {reimbursements.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">No reimbursements found</p>
          </div>
        ) : (
          <>
            {reimbursements.map((reimbursement) => (
              <ReimbursementCard
                key={reimbursement.id}
                reimbursement={reimbursement}
                onClick={() => handleReimbursementClick(reimbursement.id)}
              />
            ))}
            
            {hasMore && (
              <div className="text-center mt-4">
                <Button
                  variant="outline"
                  onClick={handleLoadMore}
                  disabled={isLoadingMore}
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
          </>
        )}
      </div>
    </div>
  );
}