"use client";

type AnalyticsCardProps = {
  title: string;
  value: number | string;
  icon?: string;
};

export default function AnalyticsCard({ title, value, icon }: AnalyticsCardProps) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#0B0B0B] p-4 flex items-center justify-between">
      {/* LEFT: VALUE */}
      <div className="flex flex-col">
        <span className="text-lg md:text-xl font-bold text-white">
          {value}
        </span>

        <span className="text-[11px] text-white/60 mt-1">
          {title}
        </span>
      </div>

      {/* RIGHT: ICON */}
      {icon && (
        <img
          src={`/${icon}`}
          alt={title}
          className="w-6 h-6 object-contain opacity-80"
        />
      )}
    </div>
  );
}
