"use client";

import { useState } from "react";
import { Bell, Check, CheckCheck, ChevronRight, PenLine } from "lucide-react";
import { timeAgo, type Proposal } from "@/lib/adminGovernance";

type Props = {
  items: Proposal[];
  unread: number;
  onOpen: (p: Proposal) => void;
  onMarkRead: (refs?: string[]) => void;
  onViewAll: () => void;
};

/** Dropdown under the header bell: proposals waiting for my signature, with read state. */
export default function NotificationsPanel({ items, unread, onOpen, onMarkRead, onViewAll }: Props) {
  const [tab, setTab] = useState<"unread" | "all">(unread > 0 ? "unread" : "all");
  const shown = tab === "unread" ? items.filter(p => !p.readByMe) : items;

  return (
    <div role="dialog" aria-label="Notifications"
      className="absolute right-0 top-[calc(100%+10px)] z-[200] w-[380px] max-w-[calc(100vw-24px)] overflow-hidden rounded-2xl border border-[rgba(28,37,51,0.09)] bg-white shadow-[0_16px_40px_rgba(28,37,51,0.16)]">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 px-4 pt-4 pb-3">
        <div className="flex items-center gap-2">
          <span className="text-[15px] font-semibold text-[#1c2533]">Notifications</span>
          {unread > 0 && <span className="rounded-full bg-[#8B3EFE] px-2 py-0.5 text-[11px] font-semibold text-white">{unread} new</span>}
        </div>
        {unread > 0 && (
          <button onClick={() => onMarkRead()} className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-[12.5px] font-semibold text-[#6e2bd8] hover:bg-[#f7f4fe]">
            <CheckCheck className="h-4 w-4" />Mark all as read
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-[rgba(28,37,51,0.08)] px-4">
        {([["unread", `Unread${unread ? ` (${unread})` : ""}`], ["all", `All (${items.length})`]] as const).map(([t, label]) => (
          <button key={t} onClick={() => setTab(t)}
            className={`-mb-px border-b-2 px-2 pb-2 text-[13px] font-semibold transition ${tab === t ? "border-[#8B3EFE] text-[#1c2533]" : "border-transparent text-[#69728a] hover:text-[#1c2533]"}`}>
            {label}
          </button>
        ))}
      </div>

      {/* List */}
      {shown.length === 0 ? (
        <div className="flex flex-col items-center gap-2 px-6 py-10 text-center">
          <span className="grid h-11 w-11 place-items-center rounded-full bg-[#f7f4fe] text-[#8a3ffc]"><Bell className="h-5 w-5" /></span>
          <span className="text-[14px] font-semibold text-[#1c2533]">You&apos;re all caught up</span>
          <span className="text-[12.5px] leading-[18px] text-[#69728a]">
            {tab === "unread" && items.length ? "You've read everything. Switch to All to see proposals still waiting for your signature." : "When a proposal needs your signature, it shows up here."}
          </span>
        </div>
      ) : (
        <ul className="max-h-[380px] overflow-y-auto py-1">
          {shown.map(p => (
            <li key={p.id} className={`group relative flex gap-3 px-4 py-3 transition hover:bg-[#faf8ff] ${p.readByMe ? "" : "bg-[rgba(138,63,252,0.04)]"}`}>
              <button onClick={() => { if (!p.readByMe) onMarkRead([p.id]); onOpen(p); }} className="flex min-w-0 flex-1 gap-3 text-left">
                <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-full ${p.readByMe ? "bg-[#f1eff6] text-[#98a0b4]" : "bg-[rgba(138,63,252,0.12)] text-[#8a3ffc]"}`}>
                  <PenLine className="h-4 w-4" />
                </span>
                <span className="flex min-w-0 flex-col gap-0.5 pr-6">
                  <span className={`text-[13px] leading-[18px] ${p.readByMe ? "font-medium text-[#3d485c]" : "font-semibold text-[#1c2533]"}`}>Your signature is needed</span>
                  <span className="text-[12.5px] leading-[18px] text-[#3d485c] line-clamp-2">
                    <span className="font-semibold">{p.proposedBy.name}</span> proposed: {p.title}
                  </span>
                  <span className="text-[11.5px] text-[#98a0b4]">{timeAgo(p.createdAt)}</span>
                </span>
              </button>
              {/* Unread dot, swapped for a "mark as read" button on hover */}
              {!p.readByMe && (
                <>
                  <span className="absolute right-4 top-4 h-2 w-2 rounded-full bg-[#8B3EFE] group-hover:hidden" />
                  <button onClick={() => onMarkRead([p.id])} title="Mark as read" aria-label="Mark as read"
                    className="absolute right-3 top-3 hidden h-7 w-7 place-items-center rounded-full text-[#6e2bd8] hover:bg-[rgba(138,63,252,0.1)] group-hover:grid">
                    <Check className="h-4 w-4" />
                  </button>
                </>
              )}
            </li>
          ))}
        </ul>
      )}

      {/* Footer */}
      <button onClick={onViewAll} className="flex w-full items-center justify-center gap-1 border-t border-[rgba(28,37,51,0.08)] py-3 text-[13px] font-semibold text-[#6e2bd8] hover:bg-[#faf8ff]">
        View all proposals<ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}
