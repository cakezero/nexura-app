"use client";

import UserLayout from "@/components/studio/UserLayout";
import Lessons from "../../_components/Lessons";
import { useStudioLogout } from "../../_lib/useStudioLogout";

export default function Page() {
  const handleLogout = useStudioLogout();
  return (
    <UserLayout title="Lessons" onLogout={handleLogout}>
      <Lessons />
    </UserLayout>
  );
}
