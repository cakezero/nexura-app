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
    if (onView) {
      onView(questId);
    } else {
      setLocation(`/quest/${questId}`);
    }
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

        {/* LOCK */}
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
        <h3 className="text-sm font-semibold text-white truncate">
          {title}
        </h3>

        <p className="text-xs text-white/60 line-clamp-2 mt-1 flex-1">
          {description}
        </p>

        {/* META */}
        <div className="text-[10px] text-white/60 space-y-1 mt-2">
          <div className="flex justify-between">
            <span>PROJECT</span>
            <span className="text-white">{projectName}</span>
          </div>

          <div className="flex justify-between">
            <span>DURATION</span>
            <span className="text-white">{duration}</span>
          </div>

          <div className="flex justify-between">
            <span>REWARD</span>
            <span className="text-white">{rewards}</span>
          </div>
        </div>

        {/* CTA */}
        <button className="mt-3 w-full bg-[#8B3EFE] text-white text-xs py-2 rounded-xl hover:opacity-90 transition">
          View Quest
        </button>
      </div>
    </div>
  );
}