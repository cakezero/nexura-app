import { useLocation } from "wouter";
import {
  Trash2,
  Calendar,
  XCircle,
  ArrowDownToLine,
  Loader2,
} from "lucide-react";

interface QuestCardProps {
  title: string;
  description?: string;
  projectName: string;
  projectLogo: string;
  heroImage: string;
  participants?: number;
  rewards?: string;
  tags?: string[];
  isLocked?: boolean;
  lockLevel?: number;
  questId?: string;
  from?: string;
  duration?: string;
  onDelete?: (id: string) => void;
  onClose?: (id: string) => void;
  onWithdraw?: (id: string) => void;
  showDelete?: boolean;
  showClose?: boolean;
  showWithdraw?: boolean;
  isDeleting?: boolean;
  isClosing?: boolean;
  isWithdrawing?: boolean;
  status?: string;
  statusColor?: string;
  rewardPoolLabel?: string;
}

export default function QuestCard({
  title,
  description,
  projectName,
  projectLogo,
  heroImage,
  participants,
  rewards,
  isLocked = false,
  lockLevel,
  questId,
  from,
  duration = "Mar 1 - Mar 30",
  onDelete,
  onClose,
  onWithdraw,
  showDelete = false,
  showClose = false,
  showWithdraw = false,
  isDeleting = false,
  isClosing = false,
  isWithdrawing = false,
  status,
  statusColor,
  rewardPoolLabel = "REWARD POOL:",
}: QuestCardProps) {
  const [, setLocation] = useLocation();

  const handleClick = () => {
    if (!questId || isLocked) return;
    const url = from
      ? `/quest/${questId}?from=${from}`
      : `/quest/${questId}`;
    setLocation(url);
  };

  return (
    <div
      onClick={handleClick}
      className="relative w-full h-[320px] rounded-2xl overflow-hidden border border-white/10 bg-[#080808] transition-all duration-300 hover:-translate-y-1 hover:border-white/20 cursor-pointer group"
    >
      {/* HERO */}
      <div className="relative h-[110px] w-full overflow-hidden">
        <img
          src={heroImage}
          alt=""
          className="w-full h-full object-cover opacity-70 group-hover:scale-105 transition-transform duration-500"
        />

        {/* logo */}
        <div className="absolute bottom-[-20px] left-3">
          <div className="w-[44px] h-[44px] rounded-xl bg-white p-[2px]">
            <img
              src={projectLogo}
              alt={projectName}
              className="w-full h-full object-cover rounded-xl"
            />
          </div>
        </div>

        {/* lock */}
        {isLocked && (
          <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
            <div className="text-center text-white">
              <div className="text-lg">🔒</div>
              <div className="text-[10px] uppercase">
                Level {lockLevel}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* BODY */}
      <div className="p-3 pt-8 space-y-2">
        <h3 className="text-sm font-semibold text-white truncate">
          {title}
        </h3>

        <p className="text-xs text-white/60 line-clamp-2">
          {description || "Onboarding Campaign"}
        </p>

        {/* stats */}
        <div className="pt-2 space-y-2 text-[10px] text-white/70">
          <div className="flex justify-between">
            <span>DURATION</span>
            <span className="flex items-center gap-1 text-white">
              <Calendar size={12} />
              {duration}
            </span>
          </div>

          <div className="flex justify-between">
            <span>{rewardPoolLabel}</span>
            <span className="text-white truncate max-w-[140px]">
              {rewards || "500 XP"}
            </span>
          </div>

          <div className="flex justify-between">
            <span>
              {participants !== undefined
                ? "PARTICIPANTS"
                : "PROJECT"}
            </span>
            <span className="text-white truncate max-w-[140px]">
              {participants !== undefined
                ? participants.toLocaleString()
                : projectName}
            </span>
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <div className="absolute bottom-3 left-3 right-3 flex gap-2">
        <button className="flex-1 h-9 rounded-xl bg-gradient-to-r from-[#8a3ffc] to-[#522696] text-white text-xs font-semibold">
          {status === "Draft" ? "Edit" : "View"}
        </button>

        {showDelete && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              questId && onDelete?.(questId);
            }}
            className="w-9 h-9 rounded-lg bg-red-500/20 flex items-center justify-center"
          >
            {isDeleting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Trash2 className="w-4 h-4 text-red-400" />
            )}
          </button>
        )}

        {showClose && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              questId && onClose?.(questId);
            }}
            className="w-9 h-9 rounded-lg bg-yellow-500/20 flex items-center justify-center"
          >
            {isClosing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <XCircle className="w-4 h-4 text-yellow-400" />
            )}
          </button>
        )}

        {showWithdraw && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              questId && onWithdraw?.(questId);
            }}
            className="w-9 h-9 rounded-lg bg-green-500/20 flex items-center justify-center"
          >
            {isWithdrawing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <ArrowDownToLine className="w-4 h-4 text-green-400" />
            )}
          </button>
        )}
      </div>
    </div>
  );
}