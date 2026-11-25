"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { BadgeCheck, Check, ChevronsUpDown, LayoutGrid, List, Loader2, Search, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { isUserRejection } from "@/lib/socialGraph/actions";
import { short } from "@/lib/socialGraph/config";
import { apiRequestV2 } from "@/lib/queryClient";

export const FONT: React.CSSProperties = { fontFamily: "'Geist', 'Inter', sans-serif" };
export const MONO = "font-['Geist_Mono','ui-monospace',monospace]";
export const CARD = "bg-white border-[0.833px] border-solid border-[rgba(28,37,51,0.09)] rounded-[40px]";
export const INNER = "rounded-[24px] bg-[#f7f4fe] border-[0.833px] border-solid border-[rgba(28,37,51,0.06)]";
export const INPUT = "h-[44px] w-full px-[14px] rounded-[12px] bg-[#f4f1fc] border-[0.833px] border-solid border-[rgba(28,37,51,0.15)] text-[14px] text-[#1c2533] placeholder:text-[#98a0b4] outline-none focus:border-[#8a3ffc] focus:shadow-[0_0_0_3px_rgba(138,63,252,0.1)]";
export const H2 = "text-[16.38px] font-semibold tracking-[-0.33px] text-[#1c2533]";
export const MUTED = "text-[#69728a]";
const GRADIENT = "linear-gradient(150deg, #9b7cff 0%, #7c5cfc 45%, #5aa8ff 100%)";

export function SegmentedTabs<T extends string>({ items, value, onChange, label, size = "md" }: { items: { id: T; label: ReactNode }[]; value: T; onChange: (id: T) => void; label: string; size?: "md" | "sm" }) {
  return (
    <div role="tablist" aria-label={label} className="inline-flex max-w-full flex-wrap gap-[2px] p-[3px] rounded-[40px] bg-[#f4f1fc] border-[0.833px] border-solid border-[rgba(28,37,51,0.19)]">
      {items.map((it) => {
        const active = it.id === value;
        return (
          <button
            key={it.id} type="button" role="tab" aria-selected={active} onClick={() => onChange(it.id)}
            className={`inline-flex items-center gap-[6px] rounded-[40px] font-semibold whitespace-nowrap transition-colors ${size === "sm" ? "px-[12px] py-[5px] text-[12px]" : "px-[14px] py-[7px] text-[13px]"} ${active ? "text-white" : "text-[#69728a] hover:text-[#1c2533]"}`}
            style={active ? { backgroundImage: GRADIENT } : undefined}
          >
            {it.label}
          </button>
        );
      })}
    </div>
  );
}

type Btn = React.ButtonHTMLAttributes<HTMLButtonElement> & { busy?: boolean; small?: boolean };

export function PrimaryButton({ children, busy, small, className = "", ...rest }: Btn) {
  return (
    <button
      type="button" {...rest} disabled={busy || rest.disabled}
      className={`inline-flex items-center justify-center gap-[8px] rounded-[40px] bg-[#8b3efe] text-white font-semibold whitespace-nowrap hover:bg-[#7c2ff0] disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${small ? "min-h-[34px] px-[14px] py-[6px] text-[13px]" : "min-h-[40px] px-[16px] py-[10px] text-[14px]"} ${className}`}
    >
      {busy && <Loader2 className="size-[14px] animate-spin" />}
      {children}
    </button>
  );
}

export function GhostButton({ children, busy, small, danger, className = "", ...rest }: Btn & { danger?: boolean }) {
  return (
    <button
      type="button" {...rest} disabled={busy || rest.disabled}
      className={`inline-flex items-center justify-center gap-[8px] rounded-[40px] font-semibold whitespace-nowrap border-[0.833px] border-solid disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${small ? "min-h-[34px] px-[12px] py-[6px] text-[13px]" : "min-h-[40px] px-[16px] py-[10px] text-[14px]"} ${danger
        ? "bg-[rgba(248,113,113,0.12)] border-[rgba(228,84,91,0.5)] text-[#e4545b] hover:bg-[rgba(248,113,113,0.2)]"
        : "bg-[#f7f4fe] border-[rgba(28,37,51,0.15)] text-[#1c2533] hover:bg-[#efeafb]"} ${className}`}
    >
      {busy && <Loader2 className="size-[14px] animate-spin" />}
      {children}
    </button>
  );
}

export const LinkButton = ({ children, className = "", ...rest }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
  <button type="button" {...rest} className={`font-semibold text-[#8a3ffc] hover:underline ${className}`}>{children}</button>
);

export function Notice({ children, tone = "info" }: { children: ReactNode; tone?: "info" | "warn" }) {
  return (
    <div className={`rounded-[20px] px-[16px] py-[12px] text-[13px] leading-[20px] border-[0.833px] border-solid ${tone === "warn"
      ? "bg-[rgba(245,158,11,0.1)] border-[rgba(194,124,0,0.3)] text-[#8a5a00]"
      : "bg-[rgba(138,63,252,0.08)] border-[rgba(138,63,252,0.2)] text-[#6e2bd8]"}`}>
      {children}
    </div>
  );
}

export const CheckMark = ({ className = "size-[16px]" }: { className?: string }) => (
  <BadgeCheck className={`${className} shrink-0 fill-[#8b3efe] text-white`} aria-label="Checked by Nexura" />
);

const ipfs = (u: string) => u.replace(/^ipfs:\/\//, "https://ipfs.io/ipfs/");
const palette = ["#8b3efe", "#5aa8ff", "#0fb38a", "#f59e0b", "#e4545b", "#7c5cfc"];
const tint = (seed: string) => palette[[...seed].reduce((a, c) => a + c.charCodeAt(0), 0) % palette.length]!;

export function Avatar({ image, name, seed, size = 40, square }: { image?: string; name: string; seed: string; size?: number; square?: boolean }) {
  const [broken, setBroken] = useState(false);
  const radius = square ? Math.round(size * 0.3) : size;
  if (image && !broken) return <img src={ipfs(image)} alt={name} onError={() => setBroken(true)} style={{ width: size, height: size, borderRadius: radius }} className="shrink-0 object-cover bg-[#f4f1fc]" />;
  const letter = (name.replace(/^0x/i, "")[0] ?? "?").toUpperCase();
  return (
    <div style={{ width: size, height: size, borderRadius: radius, background: `${tint(seed)}1f`, color: tint(seed), fontSize: size * 0.4 }} className="flex shrink-0 items-center justify-center font-bold">
      {letter}
    </div>
  );
}

export function AvatarStack({ people, max = 4, size = 24 }: { people: { account: string; label?: string; image?: string }[]; max?: number; size?: number }) {
  return (
    <div className="flex -space-x-[8px]">
      {people.slice(0, max).map((p) => (
        <div key={p.account} className="rounded-full ring-2 ring-white"><Avatar image={p.image} name={p.label || p.account} seed={p.account} size={size} /></div>
      ))}
    </div>
  );
}

export const displayName = (address: string, label?: string) => label || short(address);
export { short };

export function ScoreChip({ score }: { score?: { nexuraScore: number | null; campaigns: number } | null }) {
  if (!score || score.nexuraScore == null) return null;
  return (
    <span className="inline-flex items-center gap-[4px] rounded-[40px] bg-[rgba(138,63,252,0.1)] px-[8px] py-[2px] text-[11px] font-semibold text-[#6e2bd8]" title="Nexura score: average campaign retention">
      {score.nexuraScore}% score
    </span>
  );
}

export function Stat({ label, value, hint }: { label: string; value: ReactNode; hint?: string }) {
  return (
    <div className={`${INNER} !rounded-[18px] px-[12px] py-[8px]`} title={hint}>
      <p className="text-[16px] font-semibold leading-[22px] tracking-[-0.3px] text-[#1c2533]">{value}</p>
      <p className="text-[11px] text-[#69728a]">{label}</p>
    </div>
  );
}

export function Empty({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className={`${CARD} flex flex-col items-center gap-[12px] px-[24px] py-[40px] text-center`}>
      <p className="max-w-[420px] text-[14px] text-[#69728a]">{children}</p>
      {action}
    </div>
  );
}

export const Loading = ({ label = "Loading…" }: { label?: string }) => (
  <div className="flex items-center justify-center gap-[8px] py-[40px] text-[13px] text-[#69728a]"><Loader2 className="size-[18px] animate-spin text-[#8b3efe]" />{label}</div>
);

export const SectionTitle = ({ children, right }: { children: ReactNode; right?: ReactNode }) => (
  <div className="mb-[12px] flex items-center justify-between gap-[12px]">
    <h3 className={H2}>{children}</h3>
    {right}
  </div>
);

export function SidePanel({ open, onClose, children, label, narrow }: { open: boolean; onClose: () => void; children: ReactNode; label: string; narrow?: boolean }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);
  if (!open || typeof document === "undefined") return null;
  return createPortal(
    <div className="fixed inset-0 z-[300] flex justify-end bg-[rgba(4,3,9,0.35)]" style={FONT} onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <aside role="dialog" aria-modal="true" aria-label={label} className={`relative flex h-full w-full ${narrow ? "max-w-[420px]" : "max-w-[560px]"} flex-col overflow-y-auto bg-[#f7f5ff] text-[#1c2533] shadow-[-16px_0_40px_rgba(28,37,51,0.18)]`}>
        <button type="button" onClick={onClose} aria-label="Close"
          className="absolute right-[20px] top-[20px] z-10 flex size-[34px] items-center justify-center rounded-full border-[1.25px] border-[rgba(28,37,51,0.2)] bg-white text-[#3d485c] hover:border-[#8a3ffc] hover:text-[#8a3ffc]">
          <X className="size-[16px]" />
        </button>
        {children}
      </aside>
    </div>,
    document.body,
  );
}

export function Modal({ title, onClose, children, footer, wide }: { title: string; onClose: () => void; children: ReactNode; footer?: ReactNode; wide?: boolean }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);
  return createPortal(
    <div className="fixed inset-0 z-[310] flex items-center justify-center bg-[rgba(16,14,27,0.55)] p-4" style={FONT} onMouseDown={onClose}>
      <div role="dialog" aria-modal="true" aria-label={title} onMouseDown={(e) => e.stopPropagation()}
        className={`flex max-h-[92vh] w-full flex-col rounded-[40px] border-[0.833px] border-solid border-[rgba(28,37,51,0.15)] bg-white text-[#1c2533] drop-shadow-[0px_22px_25px_rgba(28,37,51,0.28)] ${wide ? "max-w-[720px]" : "max-w-[480px]"}`}>
        <div className="flex items-center justify-between px-[28px] pt-[24px]">
          <h2 className="text-[22px] font-semibold tracking-[-0.5px]">{title}</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="flex size-[32px] items-center justify-center rounded-full border-[1.25px] border-[rgba(28,37,51,0.2)] text-[#3d485c] hover:border-[#8a3ffc] hover:text-[#8a3ffc]"><X className="size-[15px]" /></button>
        </div>
        <div className="overflow-y-auto px-[28px] py-[20px]">{children}</div>
        {footer && <div className="flex items-center justify-end gap-[10px] border-t-[0.833px] border-[rgba(28,37,51,0.09)] px-[28px] py-[16px]">{footer}</div>}
      </div>
    </div>,
    document.body,
  );
}

export const Field = ({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) => (
  <label className="block">
    <span className="mb-[6px] block text-[13px] font-medium text-[#3d485c]">{label}</span>
    {children}
    {hint && <span className="mt-[4px] block text-[12px] text-[#98a0b4]">{hint}</span>}
  </label>
);

export const trustAmount = (n: number) => (n >= 100 ? n.toFixed(0) : n >= 1 ? n.toFixed(2) : n >= 0.001 ? n.toFixed(3) : n > 0 ? "<0.001" : "0");

export const ago = (iso: string) => {
  const s = Math.max(1, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  for (const [n, u] of [[86400 * 365, "y"], [86400 * 30, "mo"], [86400, "d"], [3600, "h"], [60, "m"]] as const) if (s >= n) return `${Math.floor(s / n)}${u} ago`;
  return "just now";
};

export function useLoad<T>(fn: () => Promise<T>, deps: unknown[]) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const seq = useRef(0);
  const reload = useCallback(async () => {
    const n = ++seq.current;
    setLoading(true);
    setError(null);
    try {
      const d = await fn();
      if (n === seq.current) setData(d);
    } catch (e: any) {
      if (n === seq.current) setError(e?.message ?? "Couldn't load this");
    } finally {
      if (n === seq.current) setLoading(false);
    }
  }, deps);
  useEffect(() => { void reload(); }, [reload]);
  return { data, error, loading, reload };
}

export function useAction() {
  const { toast } = useToast();
  const [busy, setBusy] = useState<string | null>(null);
  const run = useCallback(async (key: string, fn: () => Promise<unknown>, done: string, after?: () => void) => {
    setBusy(key);
    try {
      await fn();
      toast({ title: done, description: "It can take a few seconds to show everywhere." });
      if (after) { setTimeout(after, 3500); setTimeout(after, 9000); }
      return true;
    } catch (e: any) {
      if (!isUserRejection(e)) toast({ title: "That didn't go through", description: e?.shortMessage ?? e?.message ?? String(e), variant: "destructive" });
      return false;
    } finally {
      setBusy(null);
    }
  }, [toast]);
  return { busy, run };
}

export type CampaignSummary = {
  _id: string; title: string; sub_title?: string; description?: string; project_name?: string; project_image?: string; projectCoverImage?: string;
  status?: string; stages?: { key: string; name: string; order?: number; returnDays?: number }[]; starts_at?: string; ends_at?: string; createdAt?: string;
  reward?: { pool?: number | string; trustTokens?: number | string; xp?: number | string }; totalTrustAvailable?: number; rewardAsset?: { token?: string };
  participants?: number; maxParticipants?: number; joined?: boolean;
  rewardsConfig?: { nexuraScoreRequirementPct?: number; retentionRequirementPct?: number; recipients?: number; budget?: number; token?: string; validationRewardsOn?: boolean; curatorRewardsOn?: boolean };
  rewardsDeployment?: { rewardPerParticipant?: number | string; maxClaimableParticipants?: number };
  hubInfo?: { name?: string; logo?: string; website?: string; xAccount?: string; discordServer?: string };
  coHosts?: { name: string }[];
};

let campaignCache: Promise<Map<string, CampaignSummary>> | null = null;
export function loadCampaigns() {
  campaignCache ??= apiRequestV2("GET", "/api/campaigns")
    .then((r) => new Map<string, CampaignSummary>((r?.campaigns ?? []).map((c: any) => [String(c._id), c])))
    .catch(() => { campaignCache = null; return new Map<string, CampaignSummary>(); });
  return campaignCache;
}

export const campaignReward = (c: CampaignSummary) => {
  const amount = Number(c.reward?.pool ?? c.totalTrustAvailable ?? c.reward?.trustTokens ?? 0);
  return amount > 0 ? `${amount.toLocaleString()} ${c.rewardAsset?.token ?? "TRUST"}` : "";
};

export type Score = { nexuraScore: number | null; retention?: number | null; trust?: number; campaigns: number };
const scoreCache = new Map<string, Score | null>();
export function useScores(addresses: string[]) {
  const [, force] = useState(0);
  const key = [...new Set(addresses.map((a) => a.toLowerCase()))].sort().join(",");
  useEffect(() => {
    const missing = key.split(",").filter((a) => a && !scoreCache.has(a));
    if (!missing.length) return;
    let live = true;
    (async () => {
      for (let i = 0; i < missing.length; i += 50) {
        const chunk = missing.slice(i, i + 50);
        try {
          const { scores } = await apiRequestV2("GET", `/api/graph/scores?addresses=${chunk.join(",")}`);
          for (const a of chunk) scoreCache.set(a, scores?.[a] ?? null);
        } catch {}
      }
      if (live) force((n) => n + 1);
    })();
    return () => { live = false; };
  }, [key]);
  return (address: string) => scoreCache.get(address.toLowerCase());
}

export const TILE = "bg-white border-[0.833px] border-solid border-[rgba(28,37,51,0.09)] rounded-[24px]";


export type Option<T extends string> = { id: T; label: string } | "divider";

export function Dropdown<T extends string>({ label, value, options, onChange }: { label: string; value: T; options: Option<T>[]; onChange: (v: T) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", esc);
    return () => { document.removeEventListener("mousedown", close); document.removeEventListener("keydown", esc); };
  }, [open]);
  const current = options.find((o): o is { id: T; label: string } => o !== "divider" && o.id === value);
  return (
    <div ref={ref} className="relative flex items-center gap-[8px]">
      <span className="hidden text-[13px] text-[#69728a] sm:inline">{label}:</span>
      <button type="button" onClick={() => setOpen((o) => !o)} aria-haspopup="listbox" aria-expanded={open} aria-label={label}
        className="inline-flex h-[42px] min-w-[120px] items-center justify-between gap-[10px] rounded-[14px] border-[0.833px] border-[rgba(28,37,51,0.15)] bg-white px-[14px] text-[13px] font-semibold text-[#1c2533] hover:border-[#8a3ffc]">
        <span className="truncate">{current?.label ?? "All"}</span>
        <ChevronsUpDown className="size-[14px] shrink-0 text-[#98a0b4]" />
      </button>
      {open && (
        <div role="listbox" className="absolute right-0 top-[48px] z-40 min-w-[200px] rounded-[16px] border-[0.833px] border-[rgba(28,37,51,0.12)] bg-white p-[6px] shadow-[0_16px_40px_rgba(28,37,51,0.16)]">
          {options.map((o, i) => o === "divider"
            ? <div key={`d${i}`} className="my-[4px] h-px bg-[rgba(28,37,51,0.08)]" />
            : (
              <button key={o.id} type="button" role="option" aria-selected={o.id === value} onClick={() => { onChange(o.id); setOpen(false); }}
                className={`flex w-full items-center gap-[8px] rounded-[10px] px-[10px] py-[8px] text-left text-[13px] ${o.id === value ? "bg-[#8b3efe] font-semibold text-white" : "text-[#1c2533] hover:bg-[#f4f1fc]"}`}>
                <Check className={`size-[13px] shrink-0 ${o.id === value ? "" : "invisible"}`} />{o.label}
              </button>
            ))}
        </div>
      )}
    </div>
  );
}

export type View = "list" | "grid";

export function ListBar<F extends string, S extends string>({ search, onSearch, placeholder, filter, filters, onFilter, sort, sorts, onSort, view, onView }: {
  search: string; onSearch: (v: string) => void; placeholder: string;
  filter: F; filters: Option<F>[]; onFilter: (v: F) => void;
  sort: S; sorts: Option<S>[]; onSort: (v: S) => void;
  view?: View; onView?: (v: View) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-[10px]">
      <div className="relative min-w-[200px] flex-1">
        <Search className="pointer-events-none absolute left-[14px] top-1/2 size-[15px] -translate-y-1/2 text-[#98a0b4]" />
        <input className={`${INPUT} !h-[42px] !rounded-[14px] !bg-white !pl-[38px]`} value={search} onChange={(e) => onSearch(e.target.value)} placeholder={placeholder} />
      </div>
      <Dropdown label="Filter" value={filter} options={filters} onChange={onFilter} />
      <Dropdown label="Sort" value={sort} options={sorts} onChange={onSort} />
      {view && onView && (
        <div className="flex h-[42px] items-center rounded-[14px] border-[0.833px] border-[rgba(28,37,51,0.15)] bg-white p-[3px]">
          {(["list", "grid"] as const).map((v) => (
            <button key={v} type="button" onClick={() => onView(v)} aria-label={v === "list" ? "List view" : "Grid view"} aria-pressed={view === v}
              className={`flex size-[34px] items-center justify-center rounded-[10px] ${view === v ? "bg-[#f4f1fc] text-[#8b3efe]" : "text-[#98a0b4] hover:text-[#1c2533]"}`}>
              {v === "list" ? <List className="size-[16px]" /> : <LayoutGrid className="size-[16px]" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function Table({ columns, children, footer, stacked }: { columns: { label: string; className?: string }[]; children: ReactNode; footer?: ReactNode; stacked?: boolean }) {
  return (
    <div className={`${TILE} overflow-hidden`}>
      <div className={`${stacked ? "!hidden" : ""} hidden items-center gap-[12px] border-b-[0.833px] border-[rgba(28,37,51,0.08)] bg-[#faf9fe] px-[16px] py-[10px] text-[12px] font-semibold text-[#69728a] md:flex`}>
        {columns.map((c) => <div key={c.label} className={c.className}>{c.label}</div>)}
      </div>
      <div className="divide-y-[0.833px] divide-[rgba(28,37,51,0.07)]">{children}</div>
      {footer}
    </div>
  );
}

export function usePaged<T>(load: (offset: number) => Promise<{ rows: T[]; total: number }>, deps: unknown[]) {
  const [rows, setRows] = useState<T[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const seq = useRef(0);
  const fetchPage = useCallback(async (offset: number, reset: boolean) => {
    const n = ++seq.current;
    setLoading(true);
    setError(null);
    try {
      const page = await load(offset);
      if (n !== seq.current) return;
      setTotal(page.total);
      setRows((r) => (reset ? page.rows : [...r, ...page.rows]));
    } catch (e: any) {
      if (n === seq.current) setError(e?.message ?? "Couldn't load this");
    } finally {
      if (n === seq.current) setLoading(false);
    }
  }, deps);
  useEffect(() => { setRows([]); void fetchPage(0, true); }, [fetchPage]);
  const more = rows.length < total;
  return { rows, total, loading, error, more, loadMore: () => { if (!loading && more) void fetchPage(rows.length, false); }, reload: () => fetchPage(0, true) };
}

export function PageEnd({ loading, more, onMore, count, total, noun }: { loading: boolean; more: boolean; onMore: () => void; count: number; total: number; noun: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!more || !ref.current) return;
    const io = new IntersectionObserver((e) => { if (e[0]?.isIntersecting) onMore(); }, { rootMargin: "200px" });
    io.observe(ref.current);
    return () => io.disconnect();
  }, [more, onMore]);
  return (
    <div ref={ref} className="flex items-center justify-center gap-[8px] px-[16px] py-[14px] text-[12px] text-[#98a0b4]">
      {loading ? <><Loader2 className="size-[14px] animate-spin text-[#8b3efe]" />Loading…</>
        : more ? <button type="button" onClick={onMore} className="font-semibold text-[#8a3ffc] hover:underline">Load more</button>
        : total > 0 ? `Showing all ${total.toLocaleString()} ${noun}` : null}
    </div>
  );
}

export const Chip = ({ children, tone = "plain", onClick }: { children: ReactNode; tone?: "plain" | "good" | "bad" | "brand"; onClick?: (e: React.MouseEvent) => void }) => {
  const cls = { plain: "bg-[#f4f1fc] text-[#1c2533]", good: "bg-[rgba(15,179,138,0.12)] text-[#0b8a6a]", bad: "bg-[rgba(228,84,91,0.12)] text-[#c2414a]", brand: "bg-[rgba(138,63,252,0.1)] text-[#6e2bd8]" }[tone];
  const Tag = onClick ? "button" : "span";
  return <Tag type={onClick ? "button" : undefined} onClick={onClick} className={`inline-flex max-w-full items-center gap-[6px] truncate rounded-[10px] px-[8px] py-[4px] text-[13px] font-medium ${cls} ${onClick ? "hover:ring-1 hover:ring-[#8a3ffc]" : ""}`}>{children}</Tag>;
};

export function ScoreBar({ score }: { score?: { nexuraScore: number | null } | null }) {
  if (score?.nexuraScore == null) return <span className="text-[12px] text-[#98a0b4]">No Nexura score</span>;
  return (
    <div className="flex items-center gap-[8px]" title="Nexura score: campaign retention, adjusted by trust from real Nexura members">
      <div className="h-[6px] w-[80px] overflow-hidden rounded-full bg-[#efeafb]"><div className="h-full rounded-full" style={{ width: `${score.nexuraScore}%`, backgroundImage: GRADIENT }} /></div>
      <span className="text-[12px] font-semibold text-[#3d485c]">{score.nexuraScore}%</span>
    </div>
  );
}
