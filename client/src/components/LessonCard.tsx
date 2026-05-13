import { useLocation } from "wouter";

type LessonCardProps = {
  lesson: {
  _id: string;
  title: string;
  description: string;
  reward: number;
  noOfQuestions: number;
  coverImage?: string;
  profileImage?: string;
  done?: boolean;
  creatorName?: string;
  creatorLogo?: string;
};
  title?: string;
  description?: string;
  projectName?: string;
  projectLogo?: string;
  heroImage?: string;
};

export default function LessonCard({ 
  lesson,
  title,
  description,
  heroImage
}: LessonCardProps) {
  const [, setLocation] = useLocation();

  const handleClick = () => {
    setLocation(`/learn/${lesson._id}`);
  };

  const displayTitle = title || lesson.title;
  const displayDescription = description || lesson.description;
  const displayImage = heroImage || lesson.coverImage || "/learn-image.png";
  const creatorName = lesson.creatorName || "Jeremiah";
  const creatorLogo = lesson.creatorLogo || "/quest-1.png";

  return (
    <div
      onClick={handleClick}
      className="cursor-pointer overflow-hidden rounded-2xl border border-white/10 bg-[#0B0B0B] hover:bg-[#0F0F0F] transition-all duration-300 group h-[320px] flex flex-col"
    >
      {/* IMAGE */}
      <div className="relative h-32 md:h-36 overflow-hidden shrink-0">
        <img
          src={displayImage}
          alt={displayTitle}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />

        {/* ACTIVE Badge */}
        <div className="absolute top-3 right-3 px-2 py-1 rounded-full text-[10px] font-semibold text-[#00E1A2] bg-[#00E1A24D] border border-[#00E1A233]">
          ACTIVE
        </div>
      </div>

      {/* CONTENT */}
      <div className="p-4 space-y-3 bg-[#170F1F] flex flex-col flex-1">
        {/* TITLE */}
        <h3 className="text-sm md:text-base font-semibold text-white truncate">
          {displayTitle}
        </h3>

        {/* DESCRIPTION */}
        <p className="text-xs text-white/60 line-clamp-2 flex-1">
          {displayDescription}
        </p>

        {/* CREATOR */}
<div className="flex items-center justify-between text-sm text-white">
  <span>Creator:</span>
    <span className="text-white/80">{creatorName}</span>
</div>

        {/* META */}
        <div className="flex items-center justify-between pt-2 mt-auto">
          <span className="flex items-center gap-1 text-[10px] text-[#D4BBFF] bg-[#D4BBFF1A] border border-[#D4BBFF33] px-2 py-1 rounded-md">
  <img src="/xp-iconn.png" className="w-4 h-4" />
  {lesson.reward} XP
</span>

          <button
  className="group relative flex items-center gap-2 px-4 py-2 rounded-full 
  bg-gradient-to-r from-[#8B3EFE] to-[#5B21B6] 
  text-white text-[11px] font-semibold 
  shadow-[0_0_20px_rgba(139,62,254,0.35)]
  hover:shadow-[0_0_28px_rgba(139,62,254,0.55)]
  transition-all duration-300 active:scale-95 overflow-hidden"
>
  <span className="relative z-10 tracking-wide">Start</span>

  <img
    src="/arrow-right.png"
    className="w-3.5 h-3.5 relative z-10 transform group-hover:translate-x-0.5 transition"
  />

  {/* subtle glow sweep */}
  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition bg-gradient-to-r from-white/10 via-white/5 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] duration-700" />
</button>
        </div>
      </div>
    </div>
  );
}