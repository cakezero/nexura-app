import { useLocation } from "wouter";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Card } from "../components/ui/card";
import { ExternalLink, Clock } from "lucide-react";
import { motion } from "framer-motion";

interface QuestCardProps {
  questId?: string;
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
            <Badge className="text-[10px] bg-[#00E1A24D] text-[#00E1A2]">
              {badge}
            </Badge>
          </div>

          {/* PROJECT LOGO */}
          {projectLogo && (
            <img
              src={projectLogo}
              className="absolute bottom-2 left-2 w-8 h-8 rounded-md border border-white/10 object-cover"
            />
          )}
        </div>

        {/* CONTENT */}
        <div className="p-3 pt-4 flex flex-col gap-2 flex-1">

          {/* TITLE + REWARD */}
          <div className="flex items-start justify-between gap-2">
            <h2 className="text-sm font-semibold text-white line-clamp-1">
              {title || "Untitled Quest"}
            </h2>

            {rewards && (
              <span
                className="text-[11px] px-2 py-1 rounded-md border bg-[#D4BBFF1A] border-[#D4BBFF33] text-[#D4BBFF] font-semibold whitespace-nowrap"
              >
                +{rewards}
              </span>
            )}
          </div>

          {/* DESCRIPTION */}
          <p className="text-xs text-white/70 line-clamp-2">
            {description || subTitle || "No description available"}
          </p>

          {/* DURATION (VALUE ONLY LEFT SIDE STYLE) */}
          <div className="flex items-center gap-2 text-[11px] text-[#8A97B0] bg-[#8B3EFE33] px-2 py-1 rounded-md w-fit font-semibold">
            <img src="/calendar.png" className="w-3 h-3" />
            {duration}
          </div>

          {/* CREATOR */}
          <div className="flex justify-between text-[11px]">
            <span className="text-white text-sm">Creator:</span>
            <span className="text-white text-[11px]">
              {projectName || "Intuition Ecosystem"}
            </span>
          </div>

          {/* BUTTON */}
<Button
  className={`mt-2 w-full py-1 text-sm font-medium rounded-xl transition flex items-center justify-center gap-2 ${
    isActive
      ? "bg-[#8B3EFE] hover:bg-[#B65FC8] text-white"
      : "bg-gray-600 cursor-not-allowed text-gray-300"
  }`}
  onClick={handleClick}
  disabled={!isActive}
>
  {isActive ? (
    <>
      <ExternalLink className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
      {joined ? "Continue Quest" : "Start Quest"}
    </>
  ) : (
    <>
      <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
      Coming Soon
    </>
  )}
</Button>

        </div>
      </Card>
    </motion.div>
  );
}