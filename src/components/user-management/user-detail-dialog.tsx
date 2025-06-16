"use client";

import { useState, useEffect } from "react";
import { useUserManagementStore } from "@/stores/user-management-store";
import useAuthStore from "@/stores/auth-store";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Phone, Mail, Briefcase, DollarSign, Shield } from "lucide-react";

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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            User Details
          </DialogTitle>
        </DialogHeader>

        {loadingUserDetail ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
            <p className="mt-4 text-gray-500">Loading user details...</p>
          </div>
        ) : (
          <div className="space-y-6">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Basic Information</h3>
                  {role === "Manager" && !isEditing && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setIsEditing(true)}
                    >
                      Edit
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="email" className="flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      Email
                    </Label>
                    <Input
                      id="email"
                      value={userDetail.email || ""}
                      disabled
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="nama" className="flex items-center gap-2">
                      Nama
                    </Label>
                    <Input
                      id="nama"
                      value={formData.nama}
                      onChange={(e) =>
                        setFormData({ ...formData, nama: e.target.value })
                      }
                      disabled={!isEditing}
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="kontak" className="flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      Kontak
                    </Label>
                    <Input
                      id="kontak"
                      value={formData.kontak}
                      onChange={(e) =>
                        setFormData({ ...formData, kontak: e.target.value })
                      }
                      disabled={!isEditing}
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="posisi" className="flex items-center gap-2">
                      <Briefcase className="w-4 h-4" />
                      Posisi
                    </Label>
                    <Input
                      id="posisi"
                      value={formData.posisi}
                      onChange={(e) =>
                        setFormData({ ...formData, posisi: e.target.value })
                      }
                      disabled={!isEditing}
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="role" className="flex items-center gap-2">
                      <Shield className="w-4 h-4" />
                      Role
                    </Label>
                    <Input
                      id="role"
                      value={userDetail.role}
                      disabled
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="status">Status</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value: "active" | "inactive" | "suspended") =>
                        setFormData({ ...formData, status: value })
                      }
                      disabled={!isEditing}
                    >
                      <SelectTrigger id="status" className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                        <SelectItem value="suspended">Suspended</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Tabs defaultValue="salary" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="salary">Salary Information</TabsTrigger>
                <TabsTrigger value="reimbursement">Reimbursement Limits</TabsTrigger>
              </TabsList>

              <TabsContent value="salary">
                <Card>
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      <div>
                        <Label
                          htmlFor="gajiPerBulan"
                          className="flex items-center gap-2"
                        >
                          <DollarSign className="w-4 h-4" />
                          Gaji per Bulan
                        </Label>
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
                          disabled={!isEditing}
                          className="mt-1"
                        />
                        {!isEditing && (
                          <p className="text-sm text-gray-500 mt-1">
                            {formatCurrency(formData.gajiPerBulan)}
                          </p>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Gaji per Minggu</Label>
                          <p className="text-lg font-medium mt-1">
                            {formatCurrency(Math.round(formData.gajiPerBulan / 4))}
                          </p>
                        </div>
                        <div>
                          <Label>Gaji per Hari</Label>
                          <p className="text-lg font-medium mt-1">
                            {formatCurrency(Math.round(formData.gajiPerBulan / 30))}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="reimbursement">
                <Card>
                  <CardContent className="pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="limitInternet">Limit Internet</Label>
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
                          disabled={!isEditing}
                          className="mt-1"
                        />
                        {!isEditing && (
                          <p className="text-sm text-gray-500 mt-1">
                            {formatCurrency(formData.limitInternet)}
                          </p>
                        )}
                      </div>

                      <div>
                        <Label htmlFor="limitTransport">Limit Transport</Label>
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
                          disabled={!isEditing}
                          className="mt-1"
                        />
                        {!isEditing && (
                          <p className="text-sm text-gray-500 mt-1">
                            {formatCurrency(formData.limitTransport)}
                          </p>
                        )}
                      </div>

                      <div>
                        <Label htmlFor="limitMakan">Limit Makan</Label>
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
                          disabled={!isEditing}
                          className="mt-1"
                        />
                        {!isEditing && (
                          <p className="text-sm text-gray-500 mt-1">
                            {formatCurrency(formData.limitMakan)}
                          </p>
                        )}
                      </div>

                      <div>
                        <Label htmlFor="limitLainnya">Limit Lainnya</Label>
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
                          disabled={!isEditing}
                          className="mt-1"
                        />
                        {!isEditing && (
                          <p className="text-sm text-gray-500 mt-1">
                            {formatCurrency(formData.limitLainnya)}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        )}

        <DialogFooter>
          {isEditing ? (
            <>
              <Button
                variant="outline"
                onClick={() => setIsEditing(false)}
                disabled={updatingUserDetail}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={updatingUserDetail}
                className="bg-orange-500 hover:bg-orange-600"
              >
                {updatingUserDetail ? "Saving..." : "Save Changes"}
              </Button>
            </>
          ) : (
            <Button
              variant="outline"
              onClick={() => setShowUserDetailDialog(false)}
            >
              Close
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}