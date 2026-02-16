"use client";

import { useState, useEffect } from "react";
import { Card } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { RefreshCw, Shield, X } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { ManageAdminModal } from "../../components/ManageAdminModal";
import { AddAdminModal } from "../../components/AddAdminModal";
import { apiRequest, getStoredAdminInfo } from "../../lib/config";
import { cn } from "../../lib/utils";

export type AdminType = {
  _id: string;
  username: string;
  email?: string;
  role: "Super Admin" | "Admin" | "Moderator";
  status: "active" | "inactive";
  lastActivity: string;
};

interface AdminManagementProps {
  onAdminsUpdated?: () => void;
}

export default function AdminManagement({ onAdminsUpdated }: AdminManagementProps) {
  const [admins, setAdmins] = useState<AdminType[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchAdmins = async () => {
    try {
      setLoading(true);
      const res = await apiRequest<{ admins?: AdminType[] }>({ method: "GET", endpoint: "/api/admin/get-admins" });
      setAdmins(res?.admins ?? []);
      onAdminsUpdated?.();
    } catch (err) {
      console.error("Failed to fetch admins:", err);
      setAdmins([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdmins();
  }, []);

  const currentAdmin = getStoredAdminInfo();

  if (!currentAdmin) {
    return (
      <div className="text-white/60 flex justify-center py-12">
        <Shield className="w-12 h-12 mr-2 opacity-50" />
        <span>Please log in to view admin management</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white">Administrator Management</h2>
        <AddAdminModal onSuccess={fetchAdmins}>
          <Button
            variant="outline"
            className="border-[#8a3ffc] text-[#8a3ffc] hover:bg-[#8a3ffc] hover:text-white gap-2"
          >
            Add Admin
          </Button>
        </AddAdminModal>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12 text-white/60">
          <RefreshCw className="w-5 h-5 animate-spin mr-2" />
          Loading administrators...
        </div>
      ) : (
        <Card className="bg-white/5 border-white/10 backdrop-blur-[125px] overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-white/10 hover:bg-white/5">
                <TableHead className="text-white/70">Administrator</TableHead>
                <TableHead className="text-white/70">Role</TableHead>
                <TableHead className="text-white/70">Last Activity</TableHead>
                <TableHead className="text-white/70">Status</TableHead>
                <TableHead className="text-white/70 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[currentAdmin, ...admins].map((admin) => (
                <TableRow key={admin._id} className="border-white/10 hover:bg-white/5">
                  <TableCell className="font-medium text-white">
                    <div>{admin.username}</div>
                    {admin.email && <div className="text-white/60 text-sm">{admin.email}</div>}
                  </TableCell>
                  <TableCell className="text-white/80">{admin.role}</TableCell>
                  <TableCell className="text-white/80">{admin.lastActivity}</TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={
                        admin.status === "active"
                          ? "bg-green-500/20 text-green-300 border-green-500/30"
                          : "bg-gray-500/20 text-gray-300 border-gray-500/30"
                      }
                    >
                      {admin.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {admin._id !== currentAdmin._id && currentAdmin.role === "Super Admin" && (
                      <ManageAdminModal name={admin.username} role={admin.role} onSuccess={fetchAdmins}>
                        <Button size="sm" variant="outline" className="border-white/20 text-white hover:bg-white/10">
                          Manage
                        </Button>
                      </ManageAdminModal>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
