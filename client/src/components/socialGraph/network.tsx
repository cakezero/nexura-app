"use client";

import { useId, useMemo, useState } from "react";
import type { Person } from "@/lib/socialGraph/graph";
import { displayName } from "./kit";

type Node = { address: string; label?: string; image?: string };
type Placed = Node & { x: number; y: number; r: number; tie: "out" | "in" | "mutual" | "suggested" | "center"; via?: string[] };

const W = 400, H = 300, CX = W / 2, CY = H / 2;
const COLOR = { out: "#8b3efe", in: "#5aa8ff", mutual: "#6e2bd8", suggested: "#b7bdcc", center: "#8b3efe" };
const ipfs = (u?: string) => u?.replace(/^ipfs:\/\//, "https://ipfs.io/ipfs/");
const palette = ["#8b3efe", "#5aa8ff", "#0fb38a", "#f59e0b", "#e4545b", "#7c5cfc"];
const tint = (seed: string) => palette[[...seed].reduce((a, c) => a + c.charCodeAt(0), 0) % palette.length]!;

export function NetworkGraph({ center, trusts, trustedBy, suggested = [], onOpen, me }: {
  center: Node; trusts: Person[]; trustedBy: Person[]; suggested?: (Node & { via: string[] })[]; onOpen: (address: string) => void; me?: string | null;
}) {
  const [hover, setHover] = useState<string | null>(null);
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const nodes = useMemo(() => {
    const outSet = new Set(trusts.map((p) => p.address));
    const inSet = new Set(trustedBy.map((p) => p.address));
    const ring = new Map<string, Node & { tie: Placed["tie"]; w: number }>();
    for (const p of [...trusts, ...trustedBy]) {
      if (p.address === center.address || ring.has(p.address)) continue;
      const tie = outSet.has(p.address) && inSet.has(p.address) ? "mutual" : outSet.has(p.address) ? "out" : "in";
      ring.set(p.address, { address: p.address, label: p.label, image: p.image, tie, w: (tie === "mutual" ? 1e9 : 0) + p.staked });
    }
    const inner = [...ring.values()].sort((a, b) => b.w - a.w).slice(0, 14);
    const placed: Placed[] = [{ ...center, x: CX, y: CY, r: 24, tie: "center" }];
    const R1 = inner.length > 8 ? 100 : 88;
    inner.forEach((n, i) => {
      const a = (i / inner.length) * Math.PI * 2 - Math.PI / 2;
      placed.push({ ...n, x: CX + Math.cos(a) * R1 * 1.25, y: CY + Math.sin(a) * R1 * 0.95, r: 15 });
    });
    const at = new Map(placed.map((p) => [p.address, p]));
    const outer = suggested.filter((s) => !at.has(s.address)).slice(0, 10);
    outer.forEach((s, i) => {
      const from = s.via.map((v) => at.get(v)).find(Boolean);
      const base = from ? Math.atan2((from.y - CY) / 0.95, (from.x - CX) / 1.25) : (i / outer.length) * Math.PI * 2;
      const a = base + ((i % 3) - 1) * 0.28;
      placed.push({ ...s, x: CX + Math.cos(a) * 168, y: CY + Math.sin(a) * 128, r: 10, tie: "suggested", via: s.via });
    });
    return placed;
  }, [center, trusts, trustedBy, suggested]);

  const at = new Map(nodes.map((n) => [n.address, n]));
  const lit = (a: string) => !hover || hover === a || hover === center.address || at.get(hover)?.via?.includes(a) || at.get(a)?.via?.includes(hover);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="block h-auto w-full select-none" role="img" aria-label={`Trust network of ${displayName(center.address, center.label)}`}>
      <defs>
        <pattern id={`${uid}d`} width="16" height="16" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r="1" fill="rgba(28,37,51,0.07)" /></pattern>
        <radialGradient id={`${uid}g`}><stop offset="0%" stopColor="rgba(139,62,254,0.18)" /><stop offset="100%" stopColor="rgba(139,62,254,0)" /></radialGradient>
        {(["out", "in", "mutual"] as const).map((t) => (
          <marker key={t} id={`${uid}a${t}`} viewBox="0 0 10 10" refX="10" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill={COLOR[t]} /></marker>
        ))}
        {nodes.map((n) => <clipPath key={n.address} id={`${uid}c${n.address}`}><circle cx={n.x} cy={n.y} r={n.r} /></clipPath>)}
      </defs>
      <rect width={W} height={H} fill={`url(#${uid}d)`} />
      <circle cx={CX} cy={CY} r={70} fill={`url(#${uid}g)`} />

      {nodes.filter((n) => n.tie === "suggested").flatMap((n) => (n.via ?? []).filter((v) => at.has(v)).map((v) => {
        const f = at.get(v)!;
        return <line key={`${v}-${n.address}`} x1={f.x} y1={f.y} x2={n.x} y2={n.y} stroke={COLOR.suggested} strokeDasharray="3 4" strokeWidth={1} opacity={lit(n.address) ? 0.9 : 0.15} />;
      }))}
      {nodes.filter((n) => n.tie === "out" || n.tie === "in" || n.tie === "mutual").map((n) => {
        const dx = n.x - CX, dy = n.y - CY, d = Math.hypot(dx, dy) || 1;
        const s = { x: CX + (dx / d) * 27, y: CY + (dy / d) * 27 }, e = { x: n.x - (dx / d) * (n.r + 3), y: n.y - (dy / d) * (n.r + 3) };
        const [a, b] = n.tie === "in" ? [e, s] : [s, e];
        return (
          <line key={`e-${n.address}`} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={COLOR[n.tie]} strokeWidth={n.tie === "mutual" ? 2.2 : 1.4}
            markerEnd={`url(#${uid}a${n.tie})`} markerStart={n.tie === "mutual" ? `url(#${uid}amutual)` : undefined} opacity={lit(n.address) ? 0.85 : 0.12} />
        );
      })}

      {nodes.map((n) => (
        <g key={n.address} className="cursor-pointer" onClick={() => onOpen(n.address)} onMouseEnter={() => setHover(n.address)} onMouseLeave={() => setHover(null)} opacity={lit(n.address) ? 1 : 0.3}>
          <title>{n.address === me ? "You" : displayName(n.address, n.label)}</title>
          <circle cx={n.x} cy={n.y} r={n.r + 2.5} fill="white" stroke={COLOR[n.tie]} strokeWidth={n.tie === "center" ? 2.5 : 1.5} strokeDasharray={n.tie === "suggested" ? "2 2" : undefined} />
          {n.image
            ? <image href={ipfs(n.image)} x={n.x - n.r} y={n.y - n.r} width={n.r * 2} height={n.r * 2} clipPath={`url(#${uid}c${n.address})`} preserveAspectRatio="xMidYMid slice" />
            : <>
                <circle cx={n.x} cy={n.y} r={n.r} fill={`${tint(n.address)}22`} />
                <text x={n.x} y={n.y} dy="0.35em" textAnchor="middle" fontSize={n.r * 0.85} fontWeight={700} fill={tint(n.address)}>{((n.label || n.address).replace(/^0x/i, "")[0] ?? "?").toUpperCase()}</text>
              </>}
          {(n.tie === "center" || hover === n.address) && (
            <text x={n.x} y={n.y + n.r + 14} textAnchor="middle" fontSize={11} fontWeight={600} fill="#1c2533" stroke="white" strokeWidth={3} paintOrder="stroke">
              {n.address === me ? "You" : displayName(n.address, n.label)}
            </text>
          )}
        </g>
      ))}
    </svg>
  );
}

export function NetworkLegend({ suggested }: { suggested?: boolean }) {
  const items: [string, string, boolean?][] = [["Trusts", COLOR.out], ["Trusted by", COLOR.in], ["Mutual", COLOR.mutual], ...(suggested ? [["Suggested", COLOR.suggested, true] as [string, string, boolean]] : [])];
  return (
    <div className="flex flex-wrap gap-x-[12px] gap-y-[4px] text-[11px] text-[#69728a]">
      {items.map(([l, c, dashed]) => <span key={l} className="inline-flex items-center gap-[5px]"><span className="inline-block h-0 w-[14px] border-t-[2px]" style={{ borderColor: c, borderStyle: dashed ? "dashed" : "solid" }} />{l}</span>)}
    </div>
  );
}
