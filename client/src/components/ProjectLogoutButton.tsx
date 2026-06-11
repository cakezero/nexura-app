"use client";

import { useAuth } from "../lib/auth";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { Button } from "./ui/button";

export default function ProjectLogoutButton() {
  const auth = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    try {
      auth.signOut();
    } catch (e) {
      // logout endpoint doesn't rely on cookies; call without credentials
      fetch('/auth/logout', { method: 'POST' }).catch(() => { });
    }
    router.push('/profile');
  };

  return (
    <Button
      onClick={handleLogout}
      variant="outline"
      size="sm"
      className="fixed bottom-4 left-4 z-50"
    >
      <LogOut className="mr-2 h-4 w-4" />
      Logout
    </Button>
  );
}
