"use client";

import { useState, useEffect } from "react";
import { useUserManagementStore } from "@/stores/user-management-store";
import useAuthStore from "@/stores/auth-store";
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
import { Phone, Mail, Briefcase, DollarSign, Shield, User, Wifi, Package2, Save, X } from "lucide-react";

export function UserDetailDialog() {
  const { role } = useAuthStore();
  const {
    userDetail,
    showUserDetailDialog,
    setShowUserDetailDialog,
    loadingUserDetail,
    updatingUserDetail,
    updateUserDetail,
  } = useUserManagementStore();

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    nama: "",
    kontak: "",
    posisi: "",
    gajiAmount: 0,
    gajiFrequency: "monthly" as "daily" | "weekly" | "monthly",
    status: "active" as "active" | "inactive" | "suspended",
    limitInternet: 0,
    limitLainnya: 0,
  });

  useEffect(() => {
    if (userDetail) {
      setFormData({
        nama: userDetail.nama || "",
        kontak: userDetail.kontak || "",
        posisi: userDetail.posisi || "",
        gajiAmount: userDetail.gaji?.amount || 0,
        gajiFrequency: userDetail.gaji?.frequency || "monthly",
        status: userDetail.status || "active",
        limitInternet: userDetail.limitReimbursement?.internet?.limit || 0,
        limitLainnya: userDetail.limitReimbursement?.lainnya?.limit || 0,
      });
    }
  }, [userDetail]);

  const calculateSalaryBreakdown = (amount: number, frequency: "daily" | "weekly" | "monthly") => {
    let perHari: number, perMinggu: number, perBulan: number;
    
    switch (frequency) {
      case 'daily':
        perHari = amount;
        perMinggu = Math.round(amount * 7);
        perBulan = Math.round(amount * 30);
        break;
      case 'weekly':
        perHari = Math.round(amount / 7);
        perMinggu = amount;
        perBulan = Math.round(amount * 4);
        break;
      case 'monthly':
        perHari = Math.round(amount / 30);
        perMinggu = Math.round(amount / 4);
        perBulan = amount;
        break;
      default:
        perHari = 0;
        perMinggu = 0;
        perBulan = 0;
    }
    
    return { perHari, perMinggu, perBulan };
  };

  const handleSave = async () => {
    if (!userDetail) return;

    const { perHari, perMinggu, perBulan } = calculateSalaryBreakdown(
      formData.gajiAmount,
      formData.gajiFrequency
    );

    const updates = {
      nama: formData.nama,
      kontak: formData.kontak,
      posisi: formData.posisi,
      gaji: {
        amount: formData.gajiAmount,
        frequency: formData.gajiFrequency,
        perBulan,
        perMinggu,
        perHari,
      },
      status: formData.status,
      limitReimbursement: {
        internet: {
          limit: formData.limitInternet,
          usage: userDetail.limitReimbursement?.internet?.usage || 0,
          lastReset: userDetail.limitReimbursement?.internet?.lastReset || new Date().toISOString(),
        },
        lainnya: {
          limit: formData.limitLainnya,
          usage: userDetail.limitReimbursement?.lainnya?.usage || 0,
          lastReset: userDetail.limitReimbursement?.lainnya?.lastReset || new Date().toISOString(),
        },
      },
    };

    await updateUserDetail(userDetail.uid, updates);
    setIsEditing(false);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(value);
  };

  const getUsageDisplay = (reimbursementType: string) => {
    const data = userDetail?.limitReimbursement?.[reimbursementType];
    if (!data) return { usage: 0, limit: 0, displayText: "Rp 0 / Rp 0" };

    // Check if usage should be reset (if last reset was more than 1 month ago)
    const lastReset = new Date(data.lastReset);
    const now = new Date();
    const monthsDiff = (now.getFullYear() - lastReset.getFullYear()) * 12 + 
                      (now.getMonth() - lastReset.getMonth());
    
    const usage = monthsDiff >= 1 ? 0 : data.usage;
    const limit = data.limit;
    
    return {
      usage,
      limit,
      displayText: `${formatCurrency(usage)} / ${formatCurrency(limit)}`,
      isOverLimit: usage > limit
    };
  };

  if (!userDetail) return null;

  return (
    <Dialog open={showUserDetailDialog} onOpenChange={setShowUserDetailDialog}>
      <DialogContent className="w-full max-w-[95vw] sm:max-w-md md:max-w-lg lg:max-w-2xl max-h-[90vh] bg-gray-50 p-0 m-4 flex flex-col overflow-hidden">
        <DialogHeader className="bg-gradient-to-r from-orange-500 to-orange-600 p-6 text-white flex-shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
              <User className="w-6 h-6 text-white" />
            </div>
            <div>
              <DialogTitle className="text-xl font-semibold text-white">
                User Details
              </DialogTitle>
              <p className="text-white/80 text-sm mt-1">
                {userDetail?.email}
              </p>
            </div>
          </div>
        </DialogHeader>

        <div 
          className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar" 
          style={{
            scrollbarWidth: 'thin',
            scrollbarColor: '#d1d5db #f3f4f6',
          }}
        >
          {loadingUserDetail ? (
            <Card className="shadow-md border-0">
              <CardContent className="p-8 text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
                <p className="mt-4 text-gray-500 font-medium">Loading user details...</p>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Basic Information Card */}
              <Card className="shadow-md border-0">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-gray-900">Basic Information</h3>
                    {role === "Manager" && !isEditing && (
                      <Button
                        size="sm"
                        className="bg-orange-500 hover:bg-orange-600 text-white shadow-md"
                        onClick={() => setIsEditing(true)}
                      >
                        Edit
                      </Button>
                    )}
                  </div>

                  <div className="space-y-4 md:grid md:grid-cols-2 md:gap-4 md:space-y-0">
                    <div className="flex items-center gap-3 md:col-span-2">
                      <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                        <Mail className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <Label className="text-sm text-gray-600">Email</Label>
                        <p className="font-medium text-gray-900">{userDetail?.email}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                        <User className="w-5 h-5 text-green-600" />
                      </div>
                      <div className="flex-1">
                        <Label htmlFor="nama" className="text-sm text-gray-600">Nama</Label>
                        {isEditing ? (
                          <Input
                            id="nama"
                            value={formData.nama}
                            onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                            className="mt-1 border-gray-200 focus:border-orange-500"
                            placeholder="Enter name"
                          />
                        ) : (
                          <p className="font-medium text-gray-900">{formData.nama || "Not set"}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                        <Phone className="w-5 h-5 text-purple-600" />
                      </div>
                      <div className="flex-1">
                        <Label htmlFor="kontak" className="text-sm text-gray-600">Kontak</Label>
                        {isEditing ? (
                          <Input
                            id="kontak"
                            value={formData.kontak}
                            onChange={(e) => setFormData({ ...formData, kontak: e.target.value })}
                            className="mt-1 border-gray-200 focus:border-orange-500"
                            placeholder="Enter contact"
                          />
                        ) : (
                          <p className="font-medium text-gray-900">{formData.kontak || "Not set"}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
                        <Briefcase className="w-5 h-5 text-orange-600" />
                      </div>
                      <div className="flex-1">
                        <Label htmlFor="posisi" className="text-sm text-gray-600">Posisi</Label>
                        {isEditing ? (
                          <Input
                            id="posisi"
                            value={formData.posisi}
                            onChange={(e) => setFormData({ ...formData, posisi: e.target.value })}
                            className="mt-1 border-gray-200 focus:border-orange-500"
                            placeholder="Enter position"
                          />
                        ) : (
                          <p className="font-medium text-gray-900">{formData.posisi || "Not set"}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 md:col-span-1">
                      <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
                        <Shield className="w-5 h-5 text-red-600" />
                      </div>
                      <div className="flex-1">
                        <Label className="text-sm text-gray-600">Role</Label>
                        <p className="font-medium text-gray-900">{userDetail?.role}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 md:col-span-1">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        formData.status === 'active' ? 'bg-green-100' : 
                        formData.status === 'inactive' ? 'bg-gray-100' : 'bg-red-100'
                      }`}>
                        <div className={`w-3 h-3 rounded-full ${
                          formData.status === 'active' ? 'bg-green-500' : 
                          formData.status === 'inactive' ? 'bg-gray-500' : 'bg-red-500'
                        }`} />
                      </div>
                      <div className="flex-1">
                        <Label htmlFor="status" className="text-sm text-gray-600">Status</Label>
                        {isEditing ? (
                          <Select
                            value={formData.status}
                            onValueChange={(value: "active" | "inactive" | "suspended") =>
                              setFormData({ ...formData, status: value })
                            }
                          >
                            <SelectTrigger className="mt-1 border-gray-200 focus:border-orange-500">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="active">Active</SelectItem>
                              <SelectItem value="inactive">Inactive</SelectItem>
                              <SelectItem value="suspended">Suspended</SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
                          <p className="font-medium text-gray-900 capitalize">{formData.status}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Salary Information Card */}
              <Card className="shadow-md border-0">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-6">Salary Information</h3>
                  
                  <div className="space-y-4">
                    {/* Salary Amount */}
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                        <DollarSign className="w-5 h-5 text-green-600" />
                      </div>
                      <div className="flex-1">
                        <Label htmlFor="gajiAmount" className="text-sm text-gray-600">
                          Gaji ({formData.gajiFrequency === 'daily' ? 'per Hari' : 
                                 formData.gajiFrequency === 'weekly' ? 'per Minggu' : 'per Bulan'})
                        </Label>
                        {isEditing ? (
                          <Input
                            id="gajiAmount"
                            type="number"
                            value={formData.gajiAmount}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                gajiAmount: parseInt(e.target.value) || 0,
                              })
                            }
                            className="mt-1 border-gray-200 focus:border-orange-500"
                            placeholder="Enter salary amount"
                          />
                        ) : (
                          <p className="font-medium text-gray-900">
                            {formatCurrency(formData.gajiAmount)}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Payment Frequency */}
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                        <DollarSign className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <Label htmlFor="gajiFrequency" className="text-sm text-gray-600">Payment Frequency</Label>
                        {isEditing ? (
                          <Select
                            value={formData.gajiFrequency}
                            onValueChange={(value: "daily" | "weekly" | "monthly") =>
                              setFormData({ ...formData, gajiFrequency: value })
                            }
                          >
                            <SelectTrigger className="mt-1 border-gray-200 focus:border-orange-500">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="daily">Daily</SelectItem>
                              <SelectItem value="weekly">Weekly</SelectItem>
                              <SelectItem value="monthly">Monthly</SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
                          <p className="font-medium text-gray-900 capitalize">{formData.gajiFrequency}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Salary Breakdown */}
                  <div className="grid grid-cols-3 gap-4 pt-6 border-t border-gray-100 mt-6">
                    <div className="text-center">
                      <p className="text-sm text-gray-600 mb-1">Per Hari</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {formatCurrency(calculateSalaryBreakdown(formData.gajiAmount, formData.gajiFrequency).perHari)}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-600 mb-1">Per Minggu</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {formatCurrency(calculateSalaryBreakdown(formData.gajiAmount, formData.gajiFrequency).perMinggu)}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-600 mb-1">Per Bulan</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {formatCurrency(calculateSalaryBreakdown(formData.gajiAmount, formData.gajiFrequency).perBulan)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Reimbursement Limits Card */}
              <Card className="shadow-md border-0">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-6">Reimbursement Limits</h3>
                  
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                        <Wifi className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <Label htmlFor="limitInternet" className="text-sm text-gray-600">Internet</Label>
                        {isEditing ? (
                          <Input
                            id="limitInternet"
                            type="number"
                            value={formData.limitInternet}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                limitInternet: parseInt(e.target.value) || 0,
                              })
                            }
                            className="mt-1 border-gray-200 focus:border-orange-500"
                            placeholder="0"
                          />
                        ) : (
                          <div>
                            <p className="font-medium text-gray-900">
                              {getUsageDisplay('internet').displayText}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              Limit: {formatCurrency(formData.limitInternet)}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
                        <Package2 className="w-5 h-5 text-gray-600" />
                      </div>
                      <div className="flex-1">
                        <Label htmlFor="limitLainnya" className="text-sm text-gray-600">Lainnya</Label>
                        {isEditing ? (
                          <Input
                            id="limitLainnya"
                            type="number"
                            value={formData.limitLainnya}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                limitLainnya: parseInt(e.target.value) || 0,
                              })
                            }
                            className="mt-1 border-gray-200 focus:border-orange-500"
                            placeholder="0"
                          />
                        ) : (
                          <div>
                            <p className="font-medium text-gray-900">
                              {getUsageDisplay('lainnya').displayText}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              Limit: {formatCurrency(formData.limitLainnya)}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Action Buttons */}
              {isEditing && (
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <Button
                    variant="outline"
                    onClick={() => setIsEditing(false)}
                    disabled={updatingUserDetail}
                    className="border-gray-300 hover:bg-gray-50"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSave}
                    disabled={updatingUserDetail}
                    className="bg-orange-500 hover:bg-orange-600 text-white shadow-md"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {updatingUserDetail ? "Saving..." : "Save"}
                  </Button>
                </div>
              )}

              {!isEditing && (
                <Button
                  variant="outline"
                  onClick={() => setShowUserDetailDialog(false)}
                  className="w-full border-gray-300 hover:bg-gray-50"
                >
                  Close
                </Button>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}