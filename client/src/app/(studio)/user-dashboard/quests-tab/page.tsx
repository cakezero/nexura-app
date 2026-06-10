"use client";

import UserLayout from "@/components/studio/UserLayout";
import QuestsTab from "@/components/admin/QuestsTab";
import { useStudioLogout } from "../../_lib/useStudioLogout";

export default function Page() {
  const handleLogout = useStudioLogout();
  return (
    <UserLayout title="Quests" onLogout={handleLogout}>
      <QuestsTab />
    </UserLayout>
  );
}
