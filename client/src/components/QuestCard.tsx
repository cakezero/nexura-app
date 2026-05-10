import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { useLocation } from "wouter";
import userAvatar from "../assets/generated_images/User_avatar_Web3_0f8d9459.png";

interface QuestCardProps {
  title: string;
  description?: string;
  projectName: string;
  projectLogo: string;
  heroImage: string;
  rewards?: string;
  starts_at?: string;
  ends_at?: string;
  questId?: string;
  tags?: string[];
  isLocked?: boolean;
  lockLevel?: number;
  onView?: (id: string) => void;
  duration?: string;
  status?: string;
  statusColor?: string;
  showClose?: boolean;
  showDelete?: boolean;
  showWithdraw?: boolean;
  isClosing?: boolean;
  isDeleting?: boolean;
  isWithdrawing?: boolean;
  participants?: number;
  onClose?: (id: string) => void;
  onDelete?: (id: string) => void;
  onWithdraw?: (id: string) => void;
  from?: string;
  rewardPoolLabel?: string;
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
  duration,
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
  rewardPoolLabel = "PROJECT:",
}: QuestCardProps) {
  const [, setLocation] = useLocation();

  const formatParticipants = (count: number) => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    } else if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  };

  const handleClick = () => {
    if (!questId || isLocked) return;
    if (onView) onView(questId);
    else {
      const url = from ? `/quest/${questId}?from=${from}` : `/quest/${questId}`;
      setLocation(url);
    }
  };

  const safeParticipants = Number.isFinite(Number(participants))
  ? Number(participants)
  : 0;

  return (
    <Card
      className="overflow-hidden glass glass-hover cursor-pointer group relative rounded-3xl hover:-translate-y-1 transition-all duration-300 h-full flex flex-col"
      onClick={handleClick}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
      
      {/* Hero Image */}
      <div className="relative h-48 overflow-hidden">
        <img
          src={heroImage}
          alt={title}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

        {/* Administration Buttons (Only visible in Studio/Dashboard) */}
        {(showClose || showDelete || showWithdraw) && (
          <div className="absolute top-2 right-2 flex items-center gap-1.5 z-10">
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

        {/* Status Badge */}
        {status && (
          <div className={`absolute top-4 right-4 px-2 py-0.5 rounded text-[10px] font-bold uppercase ${statusColor || "bg-green-500 text-white"}`}>
            {status}
          </div>
        )}

        {/* Project Logo */}
        <div className="absolute top-4 left-4 animate-float">
          <img
            src={projectLogo}
            alt={projectName}
            className="w-12 h-12 rounded-full border-2 border-white/30 shadow-xl bg-black"
          />
        </div>

        {/* Lock Overlay */}
        {isLocked && (
          <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
            <div className="text-center text-white">
              <div className="text-2xl mb-2">🔒</div>
              <div className="text-sm font-medium">Level {lockLevel}</div>
              <div className="text-xs opacity-75">Level Locked</div>
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-6 flex flex-col flex-1">
        <div className="flex items-center space-x-2 mb-2">
          <span className="text-sm text-muted-foreground">{rewardPoolLabel} {projectName}</span>
        </div>

        <h3 className="text-lg font-bold text-card-foreground mb-2 line-clamp-2">{title}</h3>

        {description && (
          <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{description}</p>
        )}

        {duration && (
          <div className="text-xs text-white/40 mb-4 font-mono">
            {duration}
          </div>
        )}

        {/* Participants and Rewards */}
        <div className="flex items-center justify-between mt-auto">
          <div className="flex items-center space-x-3">
            <div className="flex -space-x-2">
              {[...Array(Math.min(3, Math.ceil(safeParticipants / 1000) || 1))].map((_, i) => (
                <img
                  key={i}
                  src={userAvatar}
                  alt="Participant"
                  className="w-6 h-6 rounded-full border-2 border-card"
                />
              ))}
            </div>
            <div className="text-sm">
              <span className="font-medium text-card-foreground">{formatParticipants(safeParticipants)}</span>
              <span className="text-muted-foreground ml-1">Participants</span>
            </div>
          </div>

          {rewards && (
            <div className="text-right">
              <div className="text-sm font-medium text-card-foreground">
                <span className="text-[#8B3EFE] font-bold">5XP</span>
                <span className="text-muted-foreground mx-1">+</span>
                <span>{rewards}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
