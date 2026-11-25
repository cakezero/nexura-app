"use client";

import { useEffect, useState } from "react";
import { projectApiRequest } from "@/lib/projectApi";

const LEVELS = [100, 90, 80, 70, 50];
const atLeast = (h: number[], min: number) => h.slice(Math.max(0, Math.min(100, min))).reduce((a, b) => a + b, 0);

export function ScoreLevels({ value, onPick }: { value: number; onPick: (n: number) => void }) {
  const [data, setData] = useState<{ total: number; histogram: number[] } | null>(null);
  useEffect(() => {
    let live = true;
    projectApiRequest<{ total: number; histogram: number[] }>({ method: "GET", endpoint: "/hub/nexura-score-levels" })
      .then((d) => { if (live && Array.isArray(d?.histogram)) setData(d); })
      .catch(() => {});
    return () => { live = false; };
  }, []);
  if (!data) return null;
  const qualify = atLeast(data.histogram, value);
  return (
    <div className="mt-3">
      <p className="text-[13px] text-[#1c2533]">
        <b>{qualify.toLocaleString("en-US")}</b> of {data.total.toLocaleString("en-US")} Nexura members have {value}%+
      </p>
      <div className="mt-2 flex flex-wrap gap-2">
        {LEVELS.map((min) => (
          <button key={min} type="button" onClick={() => onPick(min)}
            className={`h-8 rounded-full border px-3 text-[12px] ${value === min ? "border-[#8A3FFC] bg-[#F4EEFF] font-semibold text-[#6E2BD8]" : "border-[#E7E1F4] text-[#3d485c] hover:border-[#8A3FFC]"}`}>
            {min === 100 ? "100%" : `${min}%+`} · {atLeast(data.histogram, min).toLocaleString("en-US")}
          </button>
        ))}
      </div>
    </div>
  );
}

export function RetentionLevels({ retention, joined }: { retention: { total: number; levels: { min: number; count: number }[] }; joined: number }) {
  const base = Math.max(joined, retention.total, 1);
  return (
    <div className="space-y-[8px]">
      {retention.levels.map((l) => (
        <div key={l.min} className="flex items-center gap-[10px] text-[13px]">
          <span className="w-[44px] shrink-0 text-[#69728a]">{l.min === 100 ? "100%" : `${l.min}%+`}</span>
          <div className="h-[8px] flex-1 overflow-hidden rounded-full bg-[#F4F1FC]"><div className="h-full rounded-full bg-[#8B3EFE]" style={{ width: `${(l.count / base) * 100}%` }} /></div>
          <span className="w-[90px] shrink-0 text-right font-semibold text-[#1c2533]">{l.count.toLocaleString("en-US")} <span className="font-normal text-[#98a0b4]">({Math.round((l.count / base) * 100)}%)</span></span>
        </div>
      ))}
    </div>
  );
}
