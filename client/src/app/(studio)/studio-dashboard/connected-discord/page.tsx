"use client";

import { Suspense } from "react";
import StudioLayout from "@/components/studio/StudioLayout";
import ConnectedDiscord from "../../_components/ConnectedDiscord";
import { useStudioLogout } from "../../_lib/useStudioLogout";

export default function Page() {
  const handleLogout = useStudioLogout();
  return (
    <StudioLayout title="Connect Discord" onLogout={handleLogout}>
      <Suspense fallback={null}>
        <ConnectedDiscord />
      </Suspense>
    </StudioLayout>
  );
}
