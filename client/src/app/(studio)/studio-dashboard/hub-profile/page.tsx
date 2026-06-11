"use client";

import StudioLayout from "@/components/studio/StudioLayout";
import HubProfile from "../../_components/HubProfile";
import { useStudioLogout } from "../../_lib/useStudioLogout";

export default function Page() {
  const handleLogout = useStudioLogout();
  return (
    <StudioLayout title="Project Profile" onLogout={handleLogout}>
      <HubProfile />
    </StudioLayout>
  );
}
