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
import { Phone, Mail, Briefcase, DollarSign, Shield, User, Wifi, Car, UtensilsCrossed, Package2, Save, X } from "lucide-react";

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
    gajiPerBulan: 0,
    status: "active" as "active" | "inactive" | "suspended",
    limitInternet: 0,
    limitTransport: 0,
    limitMakan: 0,
    limitLainnya: 0,
  });

  useEffect(() => {
    if (userDetail) {
      setFormData({
        nama: userDetail.nama || "",
        kontak: userDetail.kontak || "",
        posisi: userDetail.posisi || "",
        gajiPerBulan: userDetail.gaji?.perBulan || 0,
        status: userDetail.status || "active",
        limitInternet: userDetail.limitReimbursement?.internet || 0,
        limitTransport: userDetail.limitReimbursement?.transport || 0,
        limitMakan: userDetail.limitReimbursement?.makan || 0,
        limitLainnya: userDetail.limitReimbursement?.lainnya || 0,
      });
    }
  }, [userDetail]);

  const handleSave = async () => {
    if (!userDetail) return;

    const gajiPerHari = Math.round(formData.gajiPerBulan / 30);
    const gajiPerMinggu = Math.round(formData.gajiPerBulan / 4);

    const updates = {
      nama: formData.nama,
      kontak: formData.kontak,
      posisi: formData.posisi,
      gaji: {
        perBulan: formData.gajiPerBulan,
        perMinggu: gajiPerMinggu,
        perHari: gajiPerHari,
      },
      status: formData.status,
      limitReimbursement: {
        internet: formData.limitInternet,
        transport: formData.limitTransport,
        makan: formData.limitMakan,
        lainnya: formData.limitLainnya,
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

  if (!userDetail) return null;

  return (
    <Dialog open={showUserDetailDialog} onOpenChange={setShowUserDetailDialog}>
      <DialogContent className="w-full max-w-[95vw] md:max-w-2xl max-h-[90vh] overflow-y-auto bg-gray-50 p-0 mx-4">
        <DialogHeader className="bg-gradient-to-r from-orange-500 to-orange-600 p-6 text-white">
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

        <div className="p-4 space-y-4">
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
                  
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                      <DollarSign className="w-5 h-5 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <Label htmlFor="gajiPerBulan" className="text-sm text-gray-600">Gaji per Bulan</Label>
                      {isEditing ? (
                        <Input
                          id="gajiPerBulan"
                          type="number"
                          value={formData.gajiPerBulan}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              gajiPerBulan: parseInt(e.target.value) || 0,
                            })
                          }
                          className="mt-1 border-gray-200 focus:border-orange-500"
                          placeholder="Enter monthly salary"
                        />
                      ) : (
                        <p className="font-medium text-gray-900">
                          {formatCurrency(formData.gajiPerBulan)}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
                    <div className="text-center">
                      <p className="text-sm text-gray-600 mb-1">Per Minggu</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {formatCurrency(Math.round(formData.gajiPerBulan / 4))}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-600 mb-1">Per Hari</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {formatCurrency(Math.round(formData.gajiPerBulan / 30))}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Reimbursement Limits Card */}
              <Card className="shadow-md border-0">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-6">Reimbursement Limits</h3>
                  
                  <div className="space-y-4 md:grid md:grid-cols-2 md:gap-4 md:space-y-0">
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
                          <p className="font-medium text-gray-900">
                            {formatCurrency(formData.limitInternet)}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                        <Car className="w-5 h-5 text-purple-600" />
                      </div>
                      <div className="flex-1">
                        <Label htmlFor="limitTransport" className="text-sm text-gray-600">Transport</Label>
                        {isEditing ? (
                          <Input
                            id="limitTransport"
                            type="number"
                            value={formData.limitTransport}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                limitTransport: parseInt(e.target.value) || 0,
                              })
                            }
                            className="mt-1 border-gray-200 focus:border-orange-500"
                            placeholder="0"
                          />
                        ) : (
                          <p className="font-medium text-gray-900">
                            {formatCurrency(formData.limitTransport)}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
                        <UtensilsCrossed className="w-5 h-5 text-orange-600" />
                      </div>
                      <div className="flex-1">
                        <Label htmlFor="limitMakan" className="text-sm text-gray-600">Makan</Label>
                        {isEditing ? (
                          <Input
                            id="limitMakan"
                            type="number"
                            value={formData.limitMakan}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                limitMakan: parseInt(e.target.value) || 0,
                              })
                            }
                            className="mt-1 border-gray-200 focus:border-orange-500"
                            placeholder="0"
                          />
                        ) : (
                          <p className="font-medium text-gray-900">
                            {formatCurrency(formData.limitMakan)}
                          </p>
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
                          <p className="font-medium text-gray-900">
                            {formatCurrency(formData.limitLainnya)}
                          </p>
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