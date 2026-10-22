"use client";

import { useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import StudioLayout from "../StudioLayout";
import { AuthHeader } from "../auth/AuthShell";
import { FONT } from "../auth/tokens";
import { useStudioProfile } from "./useStudioProfile";
import { ConnectedAccountsPanel, MyProfilePanel, ProjectPanel, StudioSetupPanel, type ProfileTab } from "./ProfilePanels";
import SecurityPanel from "./SecurityPanel";
import { useToast } from "@/hooks/use-toast";

const TABS: { id: ProfileTab; label: string }[] = [
  { id: "profile", label: "My Profile" },
  { id: "setup", label: "Studio setup" },
  { id: "accounts", label: "Connected accounts" },
  { id: "project", label: "Project" },
  { id: "security", label: "Security" },
];

const isTab = (v: string | null): v is ProfileTab => TABS.some(t => t.id === v);

export default function ProfilePage() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const { toast } = useToast();
  const p = useStudioProfile();
  const requested = params.get("tab");
  const tabs = TABS.filter(t => t.id !== "accounts" || p.canSeeAccounts);
  const tab: ProfileTab = isTab(requested) && tabs.some(t => t.id === requested) ? requested : "profile";

  const go = (t: ProfileTab) => router.replace(`${pathname}?tab=${t}`, { scroll: false });

  useEffect(() => {
    if (params.get("welcome")) toast({ title: "Your studio is ready", description: "Finish the setup steps to get the most out of Nexura Studio." });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const doneCount = p.steps.filter(s => s.done).length;

  return (
    <StudioLayout title="Profile" hideHeader>
      <div style={{ fontFamily: FONT }} className="min-h-full">
        <AuthHeader title="Profile" />
        <div className="px-4 pb-[40px] pt-[30px] md:px-[36px]">
          <h1 className="text-[26px] font-semibold leading-[40.3px] tracking-[-0.65px] text-[#1c2533]">Profile</h1>
          <p className="max-w-[620px] pt-[5px] text-[14px] leading-[21.7px] text-[#69728a]">Manage your account, studio setup and security.</p>

          <div className="mt-[24px] grid min-h-[560px] grid-cols-1 overflow-hidden rounded-[40px] border-[1.25px] border-[rgba(28,37,51,0.09)] bg-white md:grid-cols-[240px_1fr]">
            <nav aria-label="Profile sections" className="flex flex-row gap-[4px] overflow-x-auto border-b-[1.25px] border-[rgba(28,37,51,0.09)] px-[20px] py-[16px] md:flex-col md:border-b-0 md:border-r-[1.25px] md:py-[28px]">
              {tabs.map(t => {
                const active = tab === t.id;
                return (
                  <button
                    key={t.id} type="button" onClick={() => go(t.id)} aria-current={active ? "page" : undefined}
                    className={`flex shrink-0 items-center justify-between gap-3 whitespace-nowrap rounded-[999px] px-[16px] py-[10px] text-[14px] ${active ? "bg-[rgba(138,63,252,0.1)] font-semibold text-[#8a3ffc]" : "font-medium text-[#3d485c] hover:bg-[#f7f5ff]"}`}
                  >
                    {t.label}
                    {t.id === "setup" && !p.loading && doneCount < p.steps.length && (
                      <span className="rounded-[999px] bg-[#8a3ffc] px-[8px] py-px text-[11px] font-bold text-white">{doneCount}/{p.steps.length}</span>
                    )}
                  </button>
                );
              })}
            </nav>
            <section className="flex min-w-0 flex-col items-start px-[20px] pb-[40px] pt-[32px] md:px-[40px]">
              {p.loading ? (
                <p className="text-[14px] text-[#69728a]">Loading your profile…</p>
              ) : (
                <>
                  {tab === "profile" && <MyProfilePanel p={p} />}
                  {tab === "setup" && <StudioSetupPanel p={p} go={go} />}
                  {tab === "accounts" && <ConnectedAccountsPanel p={p} />}
                  {tab === "project" && <ProjectPanel p={p} />}
                  {tab === "security" && <SecurityPanel p={p} />}
                </>
              )}
            </section>
          </div>
        </div>
      </div>
    </StudioLayout>
  );
}
