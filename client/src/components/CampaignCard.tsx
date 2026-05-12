import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { Clock, ExternalLink, Users } from "lucide-react";
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
  from,
}: CampaignCardProps) {
  const [, setLocation] = useLocation();

  const handleClick = () => {
    if (_id && isLive) {
      const url = from
        ? `/campaign/${_id}?from=${from}`
        : `/campaign/${_id}`;

      setLocation(url);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);

    return date.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
    });
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
      ? Number(
          (Number(reward.pool) / allowedParticipants).toFixed(2)
        )
      : totalTrustAvailable &&
        totalTrustAvailable > 0 &&
        allowedParticipants > 0
      ? Number(
          (totalTrustAvailable / allowedParticipants).toFixed(2)
        )
      : 0
    : 0;

  const hasTrustReward =
    Number(reward?.pool ?? totalTrustAvailable ?? 0) > 0;

  return (
    <Card
      onClick={handleClick}
      className="bg-[#170F1F] h-full border border-white/5 rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition cursor-pointer flex flex-col"
    >
      {/* Campaign Banner */}
      <div className="relative h-36 bg-black w-full overflow-hidden">
        <img
          src={projectCoverImage}
          alt={title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />

        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

        {/* Status */}
        <div className="absolute top-2 right-2">
          {isLive ? (
            <Badge className="bg-[#00E1A24D] text-[#00E1A2] rounded-2xl text-xs sm:text-xs">
              ACTIVE 
            </Badge>
          ) : (
            <Badge className="bg-gray-500/20 text-gray-200 border border-gray-500/30 text-[0.65rem] sm:text-xs">
              Ended
            </Badge>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-3 sm:p-4 flex flex-1 flex-col space-y-2">
        {/* Title */}
        <h2
          className="text-sm font-semibold text-white leading-snug line-clamp-2 min-h-[2.25rem] break-words"
          title={title}
        >
          {title}
        </h2>

        {/* Description */}
<div className="h-[40px]">
  {description ? (
    <p className="text-xs text-white/60 line-clamp-2 leading-relaxed">
      {description}
    </p>
  ) : (
    <p className="text-xs opacity-0">
      placeholder
    </p>
  )}
</div>

        {/* Project */}
        <div className="flex flex-row justify-between text-xs gap-1 items-center">
          <span className="text-gray-500">
            Project:
          </span>

          <span
            className="text-white line-clamp-1 break-all max-w-[65%] text-right"
            title={project_name}
          >
            {project_name}
          </span>
        </div>

        {/* Participants */}
        <div className="flex flex-row justify-between text-xs gap-1 items-center">
          <span className="text-gray-500">
            Participants:
          </span>

          <span className="text-white flex items-center gap-1">
            <Users className="w-3 h-3" />
            {allowedParticipants.toLocaleString()}
          </span>
        </div>

        {/* Rewards */}
        {(Number(reward?.xp) > 0 || hasTrustReward) && (
          <div className="flex flex-row justify-between text-xs items-center">
            <span className="text-gray-500">
              Reward:
            </span>

            <span className="text-white flex items-center gap-1 text-right">
              {hasTrustReward &&
              Number(reward?.xp) > 0
                ? `${trustReward} TRUST + ${reward?.xp} XP`
                : hasTrustReward
                ? `${trustReward} TRUST`
                : `${reward?.xp} XP`}
            </span>
          </div>
        )}

        {/* Duration */}
        <div className="flex flex-row justify-between text-xs items-center">
          <span className="text-gray-500">
            Duration:
          </span>

          <span className="text-white flex items-center gap-1 text-right">
            <Clock className="w-3 h-3" />
            {formatDate(starts_at)} –{" "}
            {formatDate(ends_at)}
          </span>
        </div>

        {/* Button */}
        <button
          className={`w-full mt-auto pt-2 py-2 text-xs font-medium rounded-xl transition ${
            isLive
              ? "bg-[#8B3EFE] hover:bg-[#B65FC8] text-white"
              : "bg-gray-600 cursor-not-allowed text-gray-300"
          }`}
          disabled={!isLive}
        >
          {isLive ? (
            <span className="flex items-center justify-center">
              <ExternalLink className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
              Start Campaign
            </span>
          ) : (
            <span className="flex items-center justify-center">
              <Clock className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
              Campaign Ended
            </span>
          )}
        </button>
      </div>
    </Card>
  );
}