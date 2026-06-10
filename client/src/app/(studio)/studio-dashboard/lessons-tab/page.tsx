"use client";

import StudioLayout from "@/components/studio/StudioLayout";
import Lessons from "../../_components/Lessons";
import { useStudioLogout } from "../../_lib/useStudioLogout";

export default function Page() {
  const handleLogout = useStudioLogout();
  return (
    <StudioLayout title="Manage Lessons" onLogout={handleLogout}>
      <Lessons />
    </StudioLayout>
  );
}
