"use client";

import UserLayout from "@/components/studio/UserLayout";
import UserDashboard from "../_components/UserDashboard";
import { useStudioLogout } from "../_lib/useStudioLogout";

export default function Page() {
  const handleLogout = useStudioLogout();
  return (
    <UserLayout title="Dashboard" onLogout={handleLogout}>
      <UserDashboard />
    </UserLayout>
  );
}
