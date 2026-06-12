"use client";

import StudioLayout from "@/components/studio/StudioLayout";
import MyCampaign from "@/components/admin/MyCampaign";
import { useStudioLogout } from "../../_lib/useStudioLogout";

export default function Page() {
  const handleLogout = useStudioLogout();
  return (
    <StudioLayout title="My Campaign" onLogout={handleLogout}>
      <MyCampaign />
    </StudioLayout>
  );
}
