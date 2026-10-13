"use client";

import StudioLayout from "@/components/studio/StudioLayout";
import CampaignStudio from "@/components/studio/campaign-flow/CampaignStudio";
import { useStudioLogout } from "../../_lib/useStudioLogout";

export default function CampaignsFlowPage() {
  const handleLogout = useStudioLogout();
  return (
    <StudioLayout title="New Campaigns" onLogout={handleLogout} bleed>
      <CampaignStudio />
    </StudioLayout>
  );
}
