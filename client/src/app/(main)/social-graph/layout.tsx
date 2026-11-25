"use client";

import { useEffect, useState, type ReactNode } from "react";
import { notFound } from "next/navigation";
import { isSocialGraphOn } from "@/lib/socialGraph/config";

export default function SocialGraphLayout({ children }: { children: ReactNode }) {
  const [on, setOn] = useState<boolean | null>(null);
  useEffect(() => setOn(isSocialGraphOn()), []);
  if (on === false) notFound();
  if (!on) return null;
  return <div className="relative min-h-full w-full bg-[#f7f5ff] px-4 pb-[40px] pt-[16px] [contain:inline-size] md:px-[28px]"><div className="mx-auto w-full max-w-[1240px]">{children}</div></div>;
}
