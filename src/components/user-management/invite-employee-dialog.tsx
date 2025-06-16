"use client";

import { useState } from "react";
import { useUserManagementStore } from "@/stores/user-management-store";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Card, CardContent } from "@/components/ui/card";
import { Mail, UserPlus, Send, X, User } from "lucide-react";

interface InviteEmployeeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function InviteEmployeeDialog({ open, onOpenChange }: InviteEmployeeDialogProps) {
  const { loading, inviteEmployee } = useUserManagementStore();
  
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    role: "Employee" as "Manager" | "Employee",
  });
  
  const [errors, setErrors] = useState<{ fullName?: string; email?: string }>({});

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    const newErrors: { fullName?: string; email?: string } = {};
    
    if (!formData.fullName.trim()) {
      newErrors.fullName = "Full name is required";
    }
    
    if (!formData.email) {
      newErrors.email = "Email is required";
    } else if (!validateEmail(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    try {
      await inviteEmployee(formData.email, formData.role, formData.fullName);
      
      // Reset form and close dialog
      setFormData({ fullName: "", email: "", role: "Employee" });
      setErrors({});
      onOpenChange(false);
    } catch (error) {
      // Error is handled in the store
      console.error("Failed to invite employee:", error);
    }
  };

  const handleCancel = () => {
    setFormData({ fullName: "", email: "", role: "Employee" });
    setErrors({});
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-[95vw] sm:max-w-md bg-gray-50 p-0 m-4 flex flex-col overflow-hidden">
        <DialogHeader className="bg-gradient-to-r from-orange-500 to-orange-600 p-6 text-white flex-shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
              <UserPlus className="w-6 h-6 text-white" />
            </div>
            <div>
              <DialogTitle className="text-xl font-semibold text-white">
                Invite Employee
              </DialogTitle>
              <p className="text-white/80 text-sm mt-1">
                Send an invitation to join the team
              </p>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 p-6">
          <Card className="shadow-md border-0">
            <CardContent className="p-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Full Name Input */}
                <div className="space-y-2">
                  <Label htmlFor="fullName" className="text-sm font-medium text-gray-700">
                    Full Name
                  </Label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-gray-400" />
                    </div>
                    <Input
                      id="fullName"
                      type="text"
                      value={formData.fullName}
                      onChange={(e) => {
                        setFormData({ ...formData, fullName: e.target.value });
                        if (errors.fullName) {
                          setErrors({ ...errors, fullName: undefined });
                        }
                      }}
                      className={`pl-10 border-gray-200 focus:border-orange-500 ${
                        errors.fullName ? 'border-red-300' : ''
                      }`}
                      placeholder="John Doe"
                      disabled={loading}
                    />
                  </div>
                  {errors.fullName && (
                    <p className="text-sm text-red-600">{errors.fullName}</p>
                  )}
                </div>

                {/* Email Input */}
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                    Email Address
                  </Label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-gray-400" />
                    </div>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => {
                        setFormData({ ...formData, email: e.target.value });
                        if (errors.email) {
                          setErrors({ ...errors, email: undefined });
                        }
                      }}
                      className={`pl-10 border-gray-200 focus:border-orange-500 ${
                        errors.email ? 'border-red-300' : ''
                      }`}
                      placeholder="employee@company.com"
                      disabled={loading}
                    />
                  </div>
                  {errors.email && (
                    <p className="text-sm text-red-600">{errors.email}</p>
                  )}
                </div>

                {/* Role Selection */}
                <div className="space-y-2">
                  <Label htmlFor="role" className="text-sm font-medium text-gray-700">
                    Role
                  </Label>
                  <Select
                    value={formData.role}
                    onValueChange={(value: "Manager" | "Employee") =>
                      setFormData({ ...formData, role: value })
                    }
                    disabled={loading}
                  >
                    <SelectTrigger className="border-gray-200 focus:border-orange-500">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Employee">Employee</SelectItem>
                      <SelectItem value="Manager">Manager</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCancel}
                    disabled={loading}
                    className="flex-1 border-gray-300 hover:bg-gray-50"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-orange-500 hover:bg-orange-600 text-white shadow-md"
                  >
                    <Send className="w-4 h-4 mr-2" />
                    {loading ? "Sending..." : "Send Invitation"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Information Card */}
          <Card className="shadow-md border-0 mt-4">
            <CardContent className="p-4">
              <div className="text-sm text-gray-600">
                <p className="font-medium text-gray-700 mb-2">What happens next:</p>
                <ul className="space-y-1 text-sm">
                  <li>• The employee will receive an invitation email</li>
                  <li>• They can set their password and complete registration</li>
                  <li>• Their account will be activated upon first login</li>
                  <li>• You can resend or cancel invitations anytime</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}