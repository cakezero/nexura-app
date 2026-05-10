import { useLocation } from "wouter";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Card } from "../components/ui/card";
import { ExternalLink, Clock } from "lucide-react";
import { motion } from "framer-motion";

interface QuestCardProps {
  questId: string;
  title?: string;
  description?: string;
  subTitle?: string;
  projectName?: string;
  projectLogo?: string;
  heroImage?: string;
  rewards?: string;
  starts_at?: string;
  ends_at?: string;
  joined?: boolean;
  status?: string;
  isActive?: boolean;
  index?: number;
  onClick?: (id: string) => void;
}

export default function QuestCard({
  questId,
  title,
  description,
  subTitle,
  projectName,
  projectLogo,
  heroImage,
  rewards,
  starts_at,
  ends_at,
  joined,
  status,
  isActive = true,
  index = 0,
  onClick,
}: QuestCardProps) {
  const [, setLocation] = useLocation();

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);

    const day = d.getDate();
    const suffix =
      day % 10 === 1 && day !== 11
        ? "st"
        : day % 10 === 2 && day !== 12
        ? "nd"
        : day % 10 === 3 && day !== 13
        ? "rd"
        : "th";

    const month = d.toLocaleDateString("en-US", { month: "long" });
    const year = d.getFullYear();

    return `${day}${suffix} ${month} ${year}`;
  };

  const duration =
    starts_at && ends_at
      ? `${formatDate(starts_at)} - ${formatDate(ends_at)}`
      : "Ongoing";

  const badge =
    status?.toLowerCase() === "upcoming"
      ? "SOON"
      : isActive
      ? "ACTIVE"
      : "ACTIVE";

  const handleClick = () => {
    if (onClick) return onClick(questId);
    setLocation(`/quest/${questId}`);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.05 }}
    >
      <Card className="bg-[#170F1F] border border-white/10 rounded-xl overflow-hidden flex flex-col hover:shadow-md transition">

        {/* IMAGE */}
        <div className="relative w-full h-36 flex-shrink-0">
          <img
            src={heroImage || "/quest-1.png"}
            className="w-full h-full object-cover"
          />

          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />

          <div className="absolute top-2 right-2">
            <Badge className="text-[10px] bg-[#00E1A24D] text-[#00E1A2]">{badge}</Badge>
          </div>


        </div>

        {/* CONTENT */}
        <div className="p-3 pt-6 flex flex-col gap-2 flex-1">

          <h2 className="text-sm font-semibold text-white line-clamp-1">
            {title || "Untitled Quest"}
          </h2>

          <p className="text-xs text-white/70 line-clamp-2">
            {description || subTitle || "No description available"}
          </p>

          {/* CREATED BY */}
          <div className="flex justify-between text-[11px]">
            <span className="text-white/50">Created by</span>
            <span className="text-white text-[11px]">
              {projectName || "Intuition Ecosystem"}
            </span>
          </div>

          {/* REWARD */}
          {rewards && (
            <div className="flex justify-between text-[11px]">
              <span className="text-white/50">Reward</span>
              <span className="text-white font-medium">{rewards}</span>
            </div>
          )}

          {/* DURATION */}
<div className="flex justify-between text-[11px]">
  <span className="text-white/50">Duration</span>

  <span className="text-[#8A97B0] bg-[#8B3EFE33] px-2 py-1 rounded-md font-semibold flex items-center gap-2">
    <img src="/calendar.png" className="w-3 h-3" />
    {starts_at && ends_at
      ? `${formatDate(starts_at)} - ${formatDate(ends_at)}`
      : "Ongoing"}
  </span>
</div>

          {/* BUTTON */}
          <Button
            className="mt-2 w-full bg-[#8B3EFE] hover:bg-[#7a2fe0] text-white text-xs py-2 rounded-lg"
            onClick={handleClick}
          >
            {isActive ? (
              <>
                <ExternalLink className="w-3.5 h-3.5 mr-2" />
                {joined ? "Continue" : "Start"}
              </>
            ) : (
              <>
                <Clock className="w-3.5 h-3.5 mr-2" />
                Coming Soon
              </>
            )}
          </Button>

        </div>
      </Card>
    </motion.div>
  );
}