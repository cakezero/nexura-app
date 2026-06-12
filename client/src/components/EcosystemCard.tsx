"use client";

import { useRouter } from "next/navigation";

interface EcosystemCardProps {
  dapp: {
    _id: string;
    name: string;
    description: string;
    category: string;
    logo: string;
    websiteUrl?: string;
  };

  index: number;
}

const categoryStyles = [
  {
    text: "#8B5CF6",
    bg: "#8B5CF633",
    border: "#8B5CF64D",
  },
  {
    text: "#B65FC8",
    bg: "#B65FC833",
    border: "#B65FC84D",
  },
  {
    text: "#00E1A2",
    bg: "#00E1A233",
    border: "#00F5B24D",
  },
  {
    text: "#00E1A2",
    bg: "#00E1A233",
    border: "#00E1A24D",
  },
];

export default function EcosystemCard({
  dapp,
  index,
}: EcosystemCardProps) {
  const router = useRouter();

  const style =
    categoryStyles[index % categoryStyles.length];

  return (
    <div
      onClick={() => router.push("/ecosystem-dapps")}
      className="group cursor-pointer overflow-hidden rounded-2xl border border-white/10 bg-[#080808] transition-all duration-300 hover:border-white/20 hover:bg-[#0d0d0d] h-[260px] flex flex-col"
    >
      {/* IMAGE */}
      <div className="relative h-[120px] overflow-hidden flex-shrink-0">
        <img
          src={dapp.logo}
          alt={dapp.name}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
      </div>

      {/* CONTENT */}
      <div
  className="relative overflow-hidden flex flex-col justify-between flex-1 p-3 rounded-b-2xl"
  style={{
    background: "#170F1F",
    borderTop: "1px solid rgba(131, 58, 253, 0.12)",
    backdropFilter: "blur(8px)",
    WebkitBackdropFilter: "blur(8px)",
    boxShadow: "inset 0 0 22px rgba(131, 58, 253, 0.10)",
  }}
>
  {/* BACKGROUND GLOW */}
  <div
    className="absolute w-52 h-52 rounded-full pointer-events-none"
    style={{
      background: "#833AFD",
      top: "-80px",
      right: "-80px",
      filter: "blur(70px)",
      opacity: 0.32,
    }}
  />

  {/* CONTENT */}
  <div className="relative z-10 flex flex-col justify-between flex-1">
        <div className="space-y-1">
          <h3 className="text-sm md:text-base font-semibold text-white line-clamp-1">
            {dapp.name}
          </h3>

          <p className="text-[11px] md:text-xs leading-relaxed text-white/60 line-clamp-3">
            {dapp.description}
          </p>
        </div>

        {/* CATEGORY */}
        <div className="mt-3">
          <span
  className="inline-flex items-center rounded-full px-2 py-[4px] text-[10px] font-medium uppercase"
  style={{
    color: style.text,
    background: style.bg,
    border: `1px solid ${style.border}`,
  }}
>
  {String(dapp.category).toUpperCase()}
</span>
        </div>
      </div>
      </div>
    </div>
  );
}