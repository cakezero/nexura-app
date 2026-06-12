"use client";

import StudioLayout from "@/components/studio/StudioLayout";
import AdminManagement from "@/components/admin/AdminManagement";
import { useStudioLogout } from "../../_lib/useStudioLogout";

export default function Page() {
  const handleLogout = useStudioLogout();
  return (
    <StudioLayout title="User Administration" onLogout={handleLogout}>
      <AdminManagement />
    </StudioLayout>
  );
}
