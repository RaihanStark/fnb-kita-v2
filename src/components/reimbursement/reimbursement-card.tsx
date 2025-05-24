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
      className="shadow-md border-0 cursor-pointer hover:shadow-lg transition-all duration-200 active:scale-98"
      onClick={onClick}
    >
      <div className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center">
                <span className="text-2xl">{categoryIcons[reimbursement.category]}</span>
              </div>
              <div>
                <p className="font-semibold text-lg text-gray-900">
                  IDR {reimbursement.amount.toLocaleString("id-ID")}
                </p>
                <p className="text-sm text-gray-600 capitalize font-medium">{reimbursement.category}</p>
              </div>
            </div>
            
            <p className="text-sm text-gray-600 line-clamp-2 mb-3 leading-relaxed">
              {reimbursement.description}
            </p>
            
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-500 font-medium">
                {format(reimbursement.submittedDate, "dd MMM yyyy")}
              </p>
              <Badge 
                className={`${statusColors[reimbursement.status]} border-0 font-medium`} 
                variant="secondary"
              >
                {reimbursement.status}
              </Badge>
            </div>
          </div>
          
          <ChevronRight className="h-5 w-5 text-gray-400 ml-3" />
        </div>
      </div>
    </Card>
  );
}