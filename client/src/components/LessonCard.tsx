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
  };
};

export default function LessonCard({ lesson }: LessonCardProps) {
  const [, setLocation] = useLocation();

  const handleClick = () => {
    setLocation(`/learn/${lesson._id}`);
  };

  return (
    <div
      onClick={handleClick}
      className="cursor-pointer overflow-hidden rounded-2xl border border-white/10 bg-[#0B0B0B] hover:bg-[#0F0F0F] transition-all duration-300 group h-[320px] flex flex-col"
    >
      {/* IMAGE */}
      <div className="relative h-32 md:h-36 overflow-hidden shrink-0">
        <img
          src={lesson.coverImage || "/learn-image.png"}
          alt={lesson.title}
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
          {lesson.title}
        </h3>

        {/* DESCRIPTION */}
        <p className="text-xs text-white/60 line-clamp-2 flex-1">
          {lesson.description}
        </p>

        {/* META */}
        <div className="flex items-center justify-between pt-2 mt-auto">
          <span className="flex items-center gap-1 text-[10px] text-[#8A97B0] bg-[#111827] px-2 py-1 rounded-md">
            <img src="/xp-iconn.png" className="w-4 h-4" />
            {lesson.reward} XP
          </span>

          <button className="flex items-center gap-1 bg-[#8B3EFE] text-white text-[11px] px-3 py-1.5 rounded-full hover:opacity-90 transition">
            Start
            <img src="/arrow-right.png" className="w-3 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}