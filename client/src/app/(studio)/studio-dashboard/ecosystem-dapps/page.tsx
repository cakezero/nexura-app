"use client";

import StudioLayout from "@/components/studio/StudioLayout";
import EcosystemDappsAdmin from "./_EcosystemDappsAdmin";
import { useStudioLogout } from "../../_lib/useStudioLogout";

export default function Page() {
  const handleLogout = useStudioLogout();
  return (
    <StudioLayout title="Ecosystem Dapps" onLogout={handleLogout}>
      <EcosystemDappsAdmin />
    </StudioLayout>
  );
}
