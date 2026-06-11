"use client";

import UserLayout from "@/components/studio/UserLayout";
import QuestCreate from "../../_components/QuestCreate";
import { useStudioLogout } from "../../_lib/useStudioLogout";

export default function Page() {
  const handleLogout = useStudioLogout();
  return (
    <UserLayout title="Create Quest" onLogout={handleLogout}>
      <QuestCreate />
    </UserLayout>
  );
}
