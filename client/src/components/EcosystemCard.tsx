import { useLocation } from "wouter";

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
  const [, setLocation] = useLocation();

  const style =
    categoryStyles[index % categoryStyles.length];

  return (
    <div
      onClick={() => setLocation("/ecosystem-dapps")}
      className="group cursor-pointer overflow-hidden rounded-2xl border border-white/10 bg-[#080808] transition-all duration-300 hover:border-white/20 hover:bg-[#0d0d0d]"
    >
      {/* IMAGE */}
      <div className="relative h-[110px] md:h-[120px] overflow-hidden">
        <img
          src={dapp.logo}
          alt={dapp.name}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
      </div>

      {/* CONTENT */}
      <div className="flex flex-col justify-between p-3 bg-[#170F1F]">
        <div>
          <h3 className="text-sm md:text-base font-semibold text-white line-clamp-1">
            {dapp.name}
          </h3>

          <p className="mt-1 text-[11px] md:text-xs leading-relaxed text-white/60 line-clamp-2">
            {dapp.description}
          </p>
        </div>

        {/* CATEGORY */}
        <div className="mt-3">
          <span
            className="inline-flex items-center rounded-full px-2 py-[4px] text-[10px] font-medium"
            style={{
              color: style.text,
              background: style.bg,
              border: `1px solid ${style.border}`,
            }}
          >
            {dapp.category}
          </span>
        </div>
      </div>
    </div>
  );
}