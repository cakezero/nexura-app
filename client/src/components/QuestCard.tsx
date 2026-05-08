import { useLocation } from "wouter";
import { Trash2, Calendar, XCircle, ArrowDownToLine, Loader2 } from "lucide-react";

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
  tags = [],
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
  rewardPoolLabel = "REWARD POOL:"
}: QuestCardProps) {
  const [, setLocation] = useLocation();

  const handleClick = () => {
    if (questId && !isLocked) {
      const url = from ? `/quest/${questId}?from=${from}` : `/quest/${questId}`;
      setLocation(url);
    }
  };

  return (
    <div 
      className="bg-white/8 border border-white/50 rounded-[10px] overflow-hidden relative w-full h-[320px] transition-all duration-300 hover:-translate-y-1 group"
      data-node-id="3276:2980"
    >
      {/* Header / Hero Image Section */}
      <div className="relative h-[109px] w-full overflow-hidden" data-node-id="3276:2981">
        <div className="absolute inset-0 opacity-50 pointer-events-none">
          <img 
            src={heroImage} 
            alt="" 
            className="w-full h-full object-cover" 
          />
        </div>
        
        {/* Project Logo Overlay */}
        <div className="absolute bottom-[0px] left-[14px] translate-y-1/2 z-10" data-node-id="3583:2079">
          <div className="w-[51px] h-[49px] rounded-[16px] bg-white p-[1px]">
            <img 
              src={projectLogo} 
              alt={projectName} 
              className="w-full h-full object-cover rounded-[16px]" 
            />
          </div>
        </div>

        {/* Lock Overlay */}
        {isLocked && (
          <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-20">
            <div className="text-center text-white">
              <div className="text-xl mb-1">🔒</div>
              <div className="text-[10px] font-medium uppercase tracking-wider">Level {lockLevel}</div>
            </div>
          </div>
        )}
      </div>

      {/* Content Section */}
      <div className="px-[11px] pt-[30px] space-y-[6px]">
        {/* Title */}
        <div data-node-id="3276:2982">
          <h3 className="text-[16px] font-bold text-white font-['Geist',sans-serif] truncate leading-[17px]">
            {title}
          </h3>
        </div>

        {/* Campaign Label / Description */}
        <div data-node-id="3276:2983">
          <p className="text-[12px] font-bold text-white/72 font-['Geist',sans-serif] truncate leading-[17px]">
            {description || "Onboarding Campaign"}
          </p>
        </div>

        {/* Stats Grid */}
        <div className="pt-[10px] space-y-[7px]" data-node-id="3583:2078">
          {/* Duration */}
          <div className="flex items-center justify-between" data-node-id="3583:2063">
            <span className="text-[10px] font-medium text-white/70 uppercase leading-[17px]">DURATION:</span>
            <div className="flex items-center gap-[8px]">
              <Calendar className="w-[14px] h-[14px] text-white" />
              <span className="text-[10px] font-semibold text-white leading-[18.2px]">{duration}</span>
            </div>
          </div>

          {/* Reward Pool */}
          <div className="flex items-center justify-between" data-node-id="3583:2064">
            <span className="text-[10px] font-medium text-white/70 uppercase leading-[17px]">{rewardPoolLabel}</span>
            <span className="text-[10px] font-semibold text-white leading-[18.2px] truncate max-w-[150px]">{rewards || "500 XP"}</span>
          </div>

          {/* Project / Participants */}
          <div className="flex items-center justify-between" data-node-id="3583:2074">
            <span className="text-[10px] font-medium text-white/70 uppercase leading-[17px]">
              {participants !== undefined ? "PARTICIPANTS:" : "PROJECT:"}
            </span>
            <span className="text-[10px] font-semibold text-white leading-[18.2px] truncate max-w-[150px]">
              {participants !== undefined ? participants.toLocaleString() : projectName}
            </span>
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="absolute bottom-[15px] left-[11px] right-[11px] flex flex-col gap-2">
        <div className="flex items-center gap-[6px]">
          {/* View Details Button */}
          <button
            onClick={handleClick}
            disabled={isLocked}
            className={`flex-1 h-[35px] rounded-[12px] bg-gradient-to-r from-[#8a3ffc] to-[#522696] flex items-center justify-center transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed`}
            data-node-id="3276:2992"
          >
            <span className="text-[12px] font-semibold text-white font-['Geist',sans-serif] leading-[18.2px]">
              {status === "Draft" ? "Edit" : "View Details"}
            </span>
          </button>

          <div className="flex gap-1.5">
            {showClose && (
              <button
                onClick={(e) => { e.stopPropagation(); if (questId && onClose) onClose(questId); }}
                disabled={isClosing || isDeleting}
                className="w-[35px] h-[35px] bg-yellow-600/20 rounded-[10px] flex items-center justify-center transition-colors hover:bg-yellow-600/40 text-yellow-400"
              >
                {isClosing ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
              </button>
            )}

            {showWithdraw && (
              <button
                onClick={(e) => { e.stopPropagation(); if (questId && onWithdraw) onWithdraw(questId); }}
                disabled={isWithdrawing || isDeleting || isClosing}
                className="w-[35px] h-[35px] bg-emerald-600/20 rounded-[10px] flex items-center justify-center transition-colors hover:bg-emerald-600/40 text-emerald-300"
              >
                {isWithdrawing ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowDownToLine className="w-4 h-4" />}
              </button>
            )}

            {showDelete && (
              <button
                onClick={(e) => { e.stopPropagation(); if (questId && onDelete) onDelete(questId); }}
                disabled={isDeleting || isClosing}
                className="w-[35px] h-[35px] bg-[#e84a4a]/20 rounded-[10px] flex items-center justify-center transition-colors hover:bg-[#e84a4a]/40"
              >
                {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-[20px] h-[20px] text-[#e84a4a]" />}
              </button>
            )}
          </div>
        </div>

        {/* Status indicator (if needed) */}
        {status && !isLocked && (
          <div className="flex items-center gap-1">
             <span className={`px-2 py-0.5 text-[8px] rounded uppercase font-bold tracking-wider ${statusColor || "bg-purple-500"}`}>
               {status}
             </span>
          </div>
        )}
      </div>
    </div>
  );
}