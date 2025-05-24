"use client";

import { useState } from "react";
import useAuthStore from "@/stores/auth-store";
import useReimbursementStore from "@/stores/reimbursement-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Filter, X } from "lucide-react";

export function ReimbursementFilters() {
  const { user, role } = useAuthStore();
  const { filters, setFilters, resetFilters, fetchReimbursements } = useReimbursementStore();
  const [showFilters, setShowFilters] = useState(false);
  const [localFilters, setLocalFilters] = useState({
    status: filters.status || "",
    employeeId: filters.employeeId || "",
    startDate: filters.startDate ? filters.startDate.toISOString().split("T")[0] : "",
    endDate: filters.endDate ? filters.endDate.toISOString().split("T")[0] : "",
  });

  const handleApplyFilters = () => {
    const newFilters: Record<string, any> = {};
    
    if (localFilters.status) newFilters.status = localFilters.status;
    if (localFilters.employeeId && role === "Manager") newFilters.employeeId = localFilters.employeeId;
    if (localFilters.startDate) newFilters.startDate = new Date(localFilters.startDate);
    if (localFilters.endDate) newFilters.endDate = new Date(localFilters.endDate);
    
    setFilters(newFilters);
    if (user) {
      fetchReimbursements(role || "Employee", user.uid, true);
    }
    setShowFilters(false);
  };

  const handleResetFilters = () => {
    setLocalFilters({
      status: "",
      employeeId: "",
      startDate: "",
      endDate: "",
    });
    resetFilters();
    if (user) {
      fetchReimbursements(role || "Employee", user.uid, true);
    }
    setShowFilters(false);
  };

  const hasActiveFilters = Object.values(filters).some((value) => value);

  return (
    <div className="mb-4">
      <Button
        variant={hasActiveFilters ? "default" : "outline"}
        size="sm"
        onClick={() => setShowFilters(!showFilters)}
      >
        <Filter className="h-4 w-4 mr-2" />
        Filters
        {hasActiveFilters && (
          <span className="ml-2 bg-white text-primary rounded-full px-2 py-0.5 text-xs">
            Active
          </span>
        )}
      </Button>

      {showFilters && (
        <Card className="mt-4 p-4">
          <div className="space-y-4">
            <div>
              <Label htmlFor="status">Status</Label>
              <Select
                value={localFilters.status}
                onValueChange={(value) =>
                  setLocalFilters({ ...localFilters, status: value })
                }
              >
                <SelectTrigger id="status">
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="denied">Denied</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {role === "Manager" && (
              <div>
                <Label htmlFor="employeeId">Employee ID</Label>
                <Input
                  id="employeeId"
                  type="text"
                  placeholder="Filter by employee ID"
                  value={localFilters.employeeId}
                  onChange={(e) =>
                    setLocalFilters({ ...localFilters, employeeId: e.target.value })
                  }
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={localFilters.startDate}
                  onChange={(e) =>
                    setLocalFilters({ ...localFilters, startDate: e.target.value })
                  }
                />
              </div>
              <div>
                <Label htmlFor="endDate">End Date</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={localFilters.endDate}
                  onChange={(e) =>
                    setLocalFilters({ ...localFilters, endDate: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleApplyFilters} className="flex-1">
                Apply Filters
              </Button>
              <Button
                variant="outline"
                onClick={handleResetFilters}
                className="flex-1"
              >
                <X className="h-4 w-4 mr-2" />
                Reset
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}