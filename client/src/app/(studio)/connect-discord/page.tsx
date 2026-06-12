"use client";

import StudioLayout from "@/components/studio/StudioLayout";
import ConnectDiscord from "../_components/ConnectDiscord";
import { useStudioLogout } from "../_lib/useStudioLogout";

export default function Page() {
  const handleLogout = useStudioLogout();
  return (
    <StudioLayout title="Connect Discord" onLogout={handleLogout}>
      <ConnectDiscord />
    </StudioLayout>
  );
}
