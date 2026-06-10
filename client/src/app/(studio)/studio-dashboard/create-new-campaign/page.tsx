"use client";

import StudioLayout from "@/components/studio/StudioLayout";
import CreateNewCampaigns from "@/components/admin/CreateNewCampaign";
import { useStudioLogout } from "../../_lib/useStudioLogout";

export default function Page() {
  const handleLogout = useStudioLogout();
  return (
    <StudioLayout title="Create Campaign" onLogout={handleLogout}>
      <CreateNewCampaigns />
    </StudioLayout>
  );
}
