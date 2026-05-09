import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { useLocation } from "wouter";

interface CampaignCardProps {
  title: string;
  description?: string;
  project_name: string;
  projectLogo: string;
  projectCoverImage: string;
  participants: number;
  maxParticipants?: number;
  starts_at: string;
  ends_at: string;
  isLive?: boolean;
  reward?: {
    xp: string | number;
    trustTokens?: string | number;
    trust?: string | number;
    pool?: string | number;
  };
  totalTrustAvailable?: number;
  _id?: string;
  from?: string;
}

export default function CampaignCard({
  title,
  description,
  project_name,
  projectCoverImage,
  participants,
  maxParticipants,
  starts_at,
  ends_at,
  isLive = true,
  reward,
  totalTrustAvailable,
  _id,
  from
}: CampaignCardProps) {
  const [, setLocation] = useLocation();

  const formatParticipants = (count: number) => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const handleClick = () => {
    if (_id && isLive) {
      const url = from
        ? `/campaign/${_id}?from=${from}`
        : `/campaign/${_id}`;
      setLocation(url);
    }
  };

  const allowedParticipants =
    maxParticipants && maxParticipants > 0
      ? maxParticipants
      : participants;

  const trustReward = reward
    ? Number(reward.trustTokens) > 0
      ? Number(reward.trustTokens)
      : Number(reward.trust) > 0
      ? Number(reward.trust)
      : Number(reward.pool) > 0 && allowedParticipants > 0
      ? Number((Number(reward.pool) / allowedParticipants).toFixed(2))
      : totalTrustAvailable && totalTrustAvailable > 0 && allowedParticipants > 0
      ? Number((totalTrustAvailable / allowedParticipants).toFixed(2))
      : 0
    : 0;

  return (
    <Card
      onClick={handleClick}
      className="overflow-hidden cursor-pointer group relative rounded-2xl border border-white/10 bg-[#0B0B0B] hover:bg-[#0F0F0F] transition-all duration-300"
    >
      {/* Image */}
      <div className="relative h-36 md:h-40 overflow-hidden">
        <img
          src={projectCoverImage}
          alt={title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />

        {/* Active Badge */}
        <div className="absolute top-3 right-3 px-2 py-1 rounded-2xl text-[10px] font-semibold text-[#00E1A2] bg-[#00E1A24D]">
          {isLive ? "ACTIVE" : "ENDED"}
        </div>

        {/* Participants */}
        <div className="absolute bottom-3 right-3 text-xs text-white bg-black/40 px-2 py-1 rounded-md">
          {formatParticipants(participants ?? 0)}
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-3 bg-[#170F1F]">
        {/* Title */}
        <h3 className="text-base font-semibold text-white truncate">
          {title}
        </h3>

        {/* Description */}
<div className="min-h-[32px]">
  {description ? (
    <p className="text-xs text-white/60 line-clamp-2">
      {description}
    </p>
  ) : (
    <p className="text-xs opacity-0">
      placeholder text
    </p>
  )}
</div>

        {/* Duration */}
        <div className="flex items-center gap-2 text-[10px] text-[#8A97B0] bg-[#111827] px-2 py-1 rounded-md w-fit">
          <img src="/calendar.png" className="w-3 h-3" />
          {formatDate(starts_at)} - {formatDate(ends_at)}
        </div>

        {/* Bottom Row */}
        <div className="flex items-center justify-between pt-2">
          {/* Rewards */}
          <div className="flex items-center gap-1 text-[11px] px-2 py-1 rounded-md border border-[#D4BBFF33] bg-[#D4BBFF1A]">
            <img src="/xp-iconn.png" className="w-6 h-6" />
            {reward?.xp && Number(reward.xp) > 0 && (
              <span className="text-[#D4BBFF] font-semibold">
                {reward.xp} XP
              </span>
            )}

            {trustReward > 0 && (
              <span className="text-white font-semibold">
                + {trustReward} TRUST
              </span>
            )}
          </div>

          {/* Start Button */}
          <button className="flex items-center gap-1 bg-[#8B3EFE] text-white text-[11px] px-3 py-1.5 rounded-full hover:opacity-90 transition">
            START
            <img src="/arrow-right.png" className="w-3 h-4" />
          </button>
        </div>
      </div>
    </Card>
  );
}