import { useLocation } from "wouter";

interface QuestCardProps {
  title: string;
  description?: string;
  projectName: string;
  projectLogo: string;
  heroImage: string;
  rewards?: string;
  starts_at?: string;
  ends_at?: string;
  duration?: string;
  questId?: string;
  isLocked?: boolean;
  lockLevel?: number;
  onView?: (questId: string) => void;
  status?: string;
  statusColor?: string;
  showClose?: boolean;
  showDelete?: boolean;
  showWithdraw?: boolean;
  isClosing?: boolean;
  isDeleting?: boolean;
  isWithdrawing?: boolean;
  participants?: number;
  onClose?: (questId: string) => void;
  onDelete?: (questId: string) => void;
  onWithdraw?: (questId: string) => void;
  from?: string;
  rewardPoolLabel?: string;
  tags?: string[];
}

export default function QuestCard({
  title,
  description,
  projectName,
  projectLogo,
  heroImage,
  rewards,
  starts_at,
  ends_at,
  questId,
  isLocked = false,
  lockLevel,
  onView,
  status,
  statusColor,
  showClose,
  showDelete,
  showWithdraw,
  isClosing,
  isDeleting,
  isWithdrawing,
  participants,
  onClose,
  onDelete,
  onWithdraw,
  from,
}: QuestCardProps) {
  const [, setLocation] = useLocation();

  const handleClick = () => {
    if (!questId || isLocked) return;
    if (onView) onView(questId);
    else setLocation(`/quest/${questId}`);
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);

    return date.toLocaleDateString("en-US", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const hasValidDates = starts_at && ends_at;

  const duration = hasValidDates
    ? `${formatDate(starts_at)} - ${formatDate(ends_at)}`
    : null;

  return (
    <div
      onClick={handleClick}
      className="w-[260px] h-[320px] shrink-0 cursor-pointer rounded-2xl overflow-hidden border border-white/10 bg-[#080808] hover:bg-[#0F0F0F] transition-all duration-300 flex flex-col"
    >
      {/* IMAGE */}
      <div className="relative h-[120px] w-full overflow-hidden shrink-0">
        <img
          src={heroImage}
          className="w-full h-full object-cover transition-transform duration-500"
        />

        {/* ACTIONS BAR (Close / Delete / Withdraw) */}
        {(showClose || showDelete || showWithdraw) && (
          <div className="absolute top-2 right-2 flex items-center gap-1.5">
            {showClose && (
              <button
                onClick={(e) => { e.stopPropagation(); onClose?.(questId!); }}
                className="w-6 h-6 flex items-center justify-center rounded-full bg-white/10 hover:bg-red-500/80 text-white/70 hover:text-white text-xs transition"
                disabled={isClosing}
              >
                {isClosing ? (
                  <span className="inline-block w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  "x"
                )}
              </button>
            )}
            {showDelete && (
              <button
                onClick={(e) => { e.stopPropagation(); onDelete?.(questId!); }}
                className="w-6 h-6 flex items-center justify-center rounded-full bg-white/10 hover:bg-red-600/80 text-white/70 hover:text-white text-xs transition"
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <span className="inline-block w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                )}
              </button>
            )}
            {showWithdraw && (
              <button
                onClick={(e) => { e.stopPropagation(); onWithdraw?.(questId!); }}
                className="w-6 h-6 flex items-center justify-center rounded-full bg-white/10 hover:bg-amber-600/80 text-white/70 hover:text-white text-xs transition"
                disabled={isWithdrawing}
              >
                {isWithdrawing ? (
                  <span className="inline-block w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                )}
              </button>
            )}
          </div>
        )}

        {/* ACTIVE BADGE */}
        <div className="absolute top-3 right-3 px-2 py-1 rounded-full text-[10px] font-semibold text-[#00E1A2] bg-[#00E1A24D]">
          ACTIVE
        </div>

        {isLocked && (
          <div className="absolute inset-0 bg-black/70 flex items-center justify-center text-white text-xs">
            Locked - Level {lockLevel}
          </div>
        )}

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

        {/* DURATION (STRICT - NO FALLBACK TEXT) */}
        {duration && (
          <div className="text-[10px] text-[#8A97B0] mt-1">
            {duration}
          </div>
        )}

        <p className="text-xs text-white/60 line-clamp-2 mt-2">
          {description}
        </p>

        <div className="flex justify-between items-center text-[10px] text-white/60 mt-3">
          <span>PROJECT</span>
          <span className="text-white">{projectName}</span>
        </div>

        <button className="mt-auto flex items-center justify-center gap-2 bg-[#8B3EFE] text-white text-xs py-2 rounded-xl hover:opacity-90 transition">
          Start Quest
          <img src="/arrow-right.png" className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
