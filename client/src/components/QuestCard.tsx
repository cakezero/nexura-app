import { useLocation } from "wouter";

interface QuestCardProps {
  title: string;
  description?: string;
  projectName: string;
  projectLogo: string;
  heroImage: string;
  rewards?: string;
  duration?: string;
  questId?: string;
  isLocked?: boolean;
  lockLevel?: number;
  onView?: (questId: string) => void;
}

export default function QuestCard({
  title,
  description,
  projectName,
  projectLogo,
  heroImage,
  rewards,
  duration,
  questId,
  isLocked = false,
  lockLevel,
  onView,
}: QuestCardProps) {
  const [, setLocation] = useLocation();

  const handleClick = () => {
    if (!questId || isLocked) return;

    if (onView) onView(questId);
    else setLocation(`/quest/${questId}`);
  };

  return (
    <div
      onClick={handleClick}
      className="w-[260px] h-[320px] shrink-0 cursor-pointer rounded-2xl overflow-hidden border border-white/10 bg-[#080808] hover:bg-[#0F0F0F] transition-all duration-300 flex flex-col"
    >
      {/* IMAGE */}
      <div className="relative h-[120px] w-full overflow-hidden shrink-0">
        <img
          src={heroImage}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />

        {isLocked && (
          <div className="absolute inset-0 bg-black/70 flex items-center justify-center text-white text-xs">
            Locked - Level {lockLevel}
          </div>
        )}

        {/* LOGO */}
        <div className="absolute bottom-[-18px] left-3">
          <img
            src={projectLogo}
            className="w-9 h-9 rounded-xl border border-white/10"
          />
        </div>
      </div>

      {/* CONTENT */}
      <div className="p-3 pt-7 flex flex-col flex-1 bg-[#170F1F]">
        {/* TITLE + REWARD */}
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-sm font-semibold text-white truncate">
            {title}
          </h3>

          {rewards && (
            <span className="text-[10px] font-semibold text-[#D4BBFF] whitespace-nowrap">
              {rewards}
            </span>
          )}
        </div>

        {/* DURATION (date style under title) */}
        <div className="text-[10px] text-[#8A97B0] mt-1">
          {duration}
        </div>

        {/* DESCRIPTION */}
        <p className="text-xs text-white/60 line-clamp-2 mt-2">
          {description}
        </p>

        {/* PROJECT ROW */}
        <div className="flex justify-between items-center text-[10px] text-white/60 mt-3">
          <span>PROJECT</span>
          <span className="text-white">{projectName}</span>
        </div>

        {/* CTA */}
        <button className="mt-auto flex items-center justify-center gap-2 bg-[#8B3EFE] text-white text-xs py-2 rounded-xl hover:opacity-90 transition">
          Start Quest
          <img src="/arrow-right.png" className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}