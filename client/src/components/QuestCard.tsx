import { useLocation } from "wouter";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Card } from "../components/ui/card";
import { ExternalLink, Clock, Users } from "lucide-react";
import { motion } from "framer-motion";

interface QuestCardProps {
  questId?: string;
  title?: string;
  description?: string;
  subTitle?: string;
  creatorName?: string;
  creatorLogo?: string;
  heroImage?: string;
  rewards?: string;
  starts_at?: string;
 ends_at?: string;
  joined?: boolean;
  status?: string;
  isActive?: boolean;
  index?: number;
  participants?: number;
  tags?: string[];
  isLocked?: boolean;
  lockLevel?: number;
  onClick?: (id: string) => void;
}

export default function QuestCard({
  questId = "",
  title,
  description,
  subTitle,
  creatorName,
  creatorLogo,
  heroImage,
  rewards,
  starts_at,
  ends_at,
  joined,
  status,
  isActive = true,
  index = 0,
  participants = 0,
  onClick,
}: QuestCardProps) {
  const [, setLocation] = useLocation();

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "";

    return new Date(dateStr).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
    });
  };

  const duration =
    starts_at && ends_at
      ? `${formatDate(starts_at)} – ${formatDate(ends_at)}`
      : "Ongoing";

  const badge =
    status?.toLowerCase() === "upcoming"
      ? "SOON"
      : isActive
      ? "ACTIVE"
      : "ENDED";

  const handleClick = () => {
    if (onClick) return onClick(questId);
    setLocation(`/quest/${questId}`);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.05 }}
      className="h-full"
    >
      <Card className="bg-[#170F1F] h-full border border-white/5 rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition cursor-pointer flex flex-col">

        {/* IMAGE */}
        <div className="relative h-36 bg-black w-full overflow-hidden">
          <img
            src={heroImage || "/quest-1.png"}
            className="w-full h-full object-cover"
            alt={title || "Quest"}
          />

          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

          {/* STATUS */}
<div className="absolute top-2 right-2">
  {isActive ? (
    <Badge className="bg-[#00E1A24D] text-[#00E1A2] rounded-2xl text-xs sm:text-xs">
      {badge}
    </Badge>
  ) : (
    <Badge className="bg-gray-500/20 text-gray-200 border border-gray-500/30 text-[0.65rem] sm:text-xs">
      {badge}
    </Badge>
  )}
</div>

{/* CREATOR LOGO */}
<div className="absolute bottom-3 left-3">
  <div className="w-14 h-14 rounded-2xl overflow-hidden border border-white/10 bg-[#1D1526] backdrop-blur-md shadow-lg">
    <img
      src={creatorLogo || "/quest-1.png"}
      alt={creatorName || "Creator"}
      className="w-full h-full object-cover"
    />
  </div>
</div>
        </div>

        {/* CONTENT */}
        <div className="p-3 sm:p-4 flex flex-1 flex-col space-y-1.5">

          {/* TITLE */}
          <h2
            className="text-sm font-semibold text-white leading-snug line-clamp-2 min-h-[2.25rem] break-words"
            title={title}
          >
            {title || "Untitled Quest"}
          </h2>

          {/* DESCRIPTION */}
          <div className="h-[32px]">
            <p className="text-xs text-white/60 line-clamp-2 leading-relaxed">
              {description || subTitle || "No description available"}
            </p>
          </div>

          {/* CREATOR */}
          <div className="flex flex-row justify-between text-xs gap-1 items-center">
            <span className="text-gray-500">
              Creator:
            </span>

            <span
              className="text-white line-clamp-1 break-all max-w-[65%] text-right"
              title={creatorName}
            >
              {creatorName || "Jeremiah"}
            </span>
          </div>

          {/* PARTICIPANTS */}
          <div className="flex flex-row justify-between text-xs gap-1 items-center">
            <span className="text-gray-500">
              Participants:
            </span>

            <span className="text-white flex items-center gap-1">
              <Users className="w-3 h-3" />
              {participants.toLocaleString()}
            </span>
          </div>

          {/* REWARDS */}
          {rewards && (
            <div className="flex flex-row justify-between text-xs items-center">
              <span className="text-gray-500">
                Reward:
              </span>

              <span className="text-white flex items-center gap-1 text-right">
                {rewards}
              </span>
            </div>
          )}

          {/* DURATION */}
          <div className="flex flex-row justify-between text-xs items-center">
            <span className="text-gray-500">
              Duration:
            </span>

            <span className="text-white flex items-center gap-1 text-right">
              <Clock className="w-3 h-3" />
              {duration}
            </span>
          </div>

          {/* BUTTON */}
          <Button
            className={`w-full mt-auto pt-2 py-2 text-xs font-medium rounded-xl transition ${
              isActive
                ? "bg-[#8B3EFE] hover:bg-[#B65FC8] text-white"
                : "bg-gray-600 cursor-not-allowed text-gray-300"
            }`}
            onClick={handleClick}
            disabled={!isActive}
          >
            {isActive ? (
              <span className="flex items-center justify-center">
                <ExternalLink className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                {joined ? "Continue Quest" : "Start Quest"}
              </span>
            ) : (
              <span className="flex items-center justify-center">
                <Clock className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                Coming Soon
              </span>
            )}
          </Button>
        </div>
      </Card>
    </motion.div>
  );
}