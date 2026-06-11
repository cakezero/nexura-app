"use client";

import StudioDashboard from "./_StudioDashboard";
import { useStudioLogout } from "../_lib/useStudioLogout";

export default function Page() {
  const handleLogout = useStudioLogout();
  return <StudioDashboard onLogout={handleLogout} />;
}
