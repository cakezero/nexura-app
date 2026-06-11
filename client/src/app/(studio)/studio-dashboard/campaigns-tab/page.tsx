"use client";

import StudioLayout from "@/components/studio/StudioLayout";
import CampaignsTab from "@/components/admin/CampaignsTab";
import { useStudioLogout } from "../../_lib/useStudioLogout";

export default function Page() {
  const handleLogout = useStudioLogout();
  return (
    <StudioLayout title="Campaigns" onLogout={handleLogout}>
      <CampaignsTab />
    </StudioLayout>
  );
}
