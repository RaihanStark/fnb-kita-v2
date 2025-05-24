"use client";

import { format } from "date-fns";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Reimbursement } from "@/lib/firebase/reimbursement-service";
import { ChevronRight } from "lucide-react";

interface ReimbursementCardProps {
  reimbursement: Reimbursement;
  onClick: () => void;
}

export function ReimbursementCard({ reimbursement, onClick }: ReimbursementCardProps) {
  const statusColors = {
    pending: "bg-yellow-100 text-yellow-800",
    approved: "bg-green-100 text-green-800",
    denied: "bg-red-100 text-red-800",
    paid: "bg-blue-100 text-blue-800",
  };

  const categoryIcons = {
    meal: "🍽️",
    transport: "🚗",
    supplies: "📦",
    other: "📋",
  };

  return (
    <Card
      className="p-4 mb-3 cursor-pointer hover:shadow-md transition-shadow"
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xl">{categoryIcons[reimbursement.category]}</span>
            <div>
              <p className="font-semibold">
                IDR {reimbursement.amount.toLocaleString("id-ID")}
              </p>
              <p className="text-sm text-gray-600 capitalize">{reimbursement.category}</p>
            </div>
          </div>
          
          <p className="text-sm text-gray-600 line-clamp-2 mb-2">
            {reimbursement.description}
          </p>
          
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-500">
              {format(reimbursement.submittedDate, "dd MMM yyyy")}
            </p>
            <Badge className={statusColors[reimbursement.status]} variant="secondary">
              {reimbursement.status}
            </Badge>
          </div>
        </div>
        
        <ChevronRight className="h-5 w-5 text-gray-400 ml-2" />
      </div>
    </Card>
  );
}