"use client";

import StudioLayout from "@/components/studio/StudioLayout";
import LessonCreate from "../../_components/LessonCreate";
import { useStudioLogout } from "../../_lib/useStudioLogout";

export default function Page() {
  const handleLogout = useStudioLogout();
  return (
    <StudioLayout title="Create Lesson" onLogout={handleLogout}>
      <LessonCreate />
    </StudioLayout>
  );
}
