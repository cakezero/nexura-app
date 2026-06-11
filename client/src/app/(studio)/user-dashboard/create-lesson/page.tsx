"use client";

import UserLayout from "@/components/studio/UserLayout";
import LessonCreate from "../../_components/LessonCreate";
import { useStudioLogout } from "../../_lib/useStudioLogout";

export default function Page() {
  const handleLogout = useStudioLogout();
  return (
    <UserLayout title="Create Lesson" onLogout={handleLogout}>
      <LessonCreate />
    </UserLayout>
  );
}
