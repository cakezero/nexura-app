// Leaderboard.tsx
"use client";

import { useEffect, useState } from "react";
import AnimatedBackground from "@/components/AnimatedBackground";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import gold from "/nexura-gold.png";
import silver from "/nexura-silver.png";
import bronze from "/nexura-bronze.png";
import xpIcon from "/nexura-xp.png";

type Entry = {
  id: string;
  username?: string;
  display_name?: string;
  avatar?: string;
  xp: number;
  level: number;
  quests_completed?: number;
  tasks_completed?: number;
};

const MOCK_LEADERBOARD: Entry[] = [
  { id: "1", username: "Rchris", xp: 1500, level: 10, quests_completed: 12, tasks_completed: 30 },
  { id: "2", username: "Nuel", xp: 1200, level: 8, quests_completed: 8, tasks_completed: 25 },
  { id: "3", username: "Unknown", xp: 900, level: 7, quests_completed: 5, tasks_completed: 20 },
  { id: "4", username: "Beardless", xp: 800, level: 6, quests_completed: 4, tasks_completed: 15 },
  { id: "5", username: "Promise", xp: 700, level: 5, quests_completed: 3, tasks_completed: 10 },
  { id: "6", username: "Orion", xp: 600, level: 5, quests_completed: 3, tasks_completed: 9 },
  { id: "7", username: "Shebah", xp: 500, level: 4, quests_completed: 2, tasks_completed: 8 },
  { id: "8", username: "David", xp: 400, level: 3, quests_completed: 1, tasks_completed: 7 },
  { id: "9", username: "Omotola", xp: 300, level: 2, quests_completed: 1, tasks_completed: 5 },
  { id: "10", username: "Fiyin", xp: 200, level: 1, quests_completed: 0, tasks_completed: 3 },
];

export default function Leaderboard() {
  const [list, setList] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        setList(MOCK_LEADERBOARD);
      } catch (err: any) {
        setError(err.message || "Failed to load leaderboard");
      } finally {
        setLoading(false);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  return (
  <div className="min-h-screen bg-black text-white p-6 relative overflow-auto">
    <AnimatedBackground />

    <div className="max-w-4xl mx-auto space-y-6 relative z-10">
<header className="flex items-center justify-between">
  {/* Left side: icon + title */}
  <div className="flex items-center gap-3">
    <img
      src="/nexura-gold.png"
      alt="Leaderboard"
      className="w-10 h-10"
    />
    <h1 className="text-3xl md:text-5xl font-bold">Leaderboard</h1>
  </div>

  {/* Right side: players badge */}
  {!loading && !error && (
    <Badge variant="outline" className="border-white/20 text-white">
      {list.length} Players
    </Badge>
  )}
</header>


{/* ------------------- PODIUM ------------------- */}
{!loading && !error && list.length > 0 && (
  <div className="relative mt-16">
    {/* Background gradient behind top 3 */}
<div className="absolute inset-x-0 top-0 h-64 
    bg-gradient-to-b 
    from-purple-500/20 
    via-purple-700/20 
    to-black/0 
    rounded-3xl -z-10">
</div>


    <div className="flex justify-center items-end gap-6 relative">
      {[1, 0, 2].map((userIndex, idx) => {
        const user = list[userIndex];
        const name = user.display_name || user.username || "Anonymous";
        const xp = user.xp;

        const heights = [130, 200, 110];
        const height = heights[idx];
        const width = idx === 1 ? 180 : 160;
        const topDepth = 26;

        const medals = [
          { img: silver, color: "#cfcfcf" },
          { img: gold, color: "#f5c542" },
          { img: bronze, color: "#cd7f32" },
        ];
        const medal = medals[idx];

        // New bounce order: middle → left → right
        const delayOrder = [0.3, 0, 0.6];
        const bounceDelay = `${delayOrder[idx]}s`;

        return (
          <div
            key={user.id}
            className="flex flex-col items-center text-center relative animate-bounce-slow"
            style={{ animationDelay: bounceDelay }}
          >
            {/* Avatar */}
            <Avatar className="w-24 h-24 mb-0 -translate-y-6 ring-2 ring-white/15">
              <AvatarImage
                src={
                  user.avatar ||
                  `https://api.dicebear.com/7.x/identicon/png?seed=${encodeURIComponent(name)}`
                }
              />
              <AvatarFallback className="bg-white/10 text-white font-bold text-2xl">
                {name.charAt(0)}
              </AvatarFallback>
            </Avatar>

            <h3 className="text-sm font-semibold mt-1">{name}</h3>

            {/* Podium SVG */}
<svg
  width={width}
  height={height + topDepth + 20}
  viewBox={`0 0 ${width} ${height + topDepth + 20}`}
>
  <defs>
    <linearGradient id={`material-${idx}`} x1="0" y1="0" x2="0" y2="1">
      {/* Darker purplish gradient for podium bars */}
      <stop offset="0%" stopColor="rgba(80,50,120,0.85)" />
      <stop offset="35%" stopColor="rgba(100,70,140,0.85)" />
      <stop offset="100%" stopColor="rgba(60,30,100,0.85)" />
    </linearGradient>

    <linearGradient id={`inner-${idx}`} x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor="rgba(0,0,0,0.25)" />
      <stop offset="40%" stopColor="rgba(0,0,0,0)" />
    </linearGradient>

    <filter id={`shadow-${idx}`} x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="10" />
    </filter>
  </defs>

  <ellipse
    cx={width / 2}
    cy={height + topDepth + 10}
    rx={width / 2 - 10}
    ry="6"
    fill="rgba(0,0,0,0.55)"
    filter={`url(#shadow-${idx})`}
  />

  <polygon
    points={`16,0 ${width - 16},0 ${width},${topDepth} 0,${topDepth}`}
    fill="rgba(255,255,255,0.22)"
  />

  <polygon
    points={`0,${topDepth} ${width},${topDepth} ${width},${
      height + topDepth
    } 0,${height + topDepth}`}
    fill={`url(#material-${idx})`}
  />

  <polygon
    points={`0,${topDepth} ${width},${topDepth} ${width},${
      height + topDepth
    } 0,${height + topDepth}`}
    fill={`url(#inner-${idx})`}
  />

  {/* Medal image */}
  <image
    href={medal.img}
    x={idx === 1 ? width / 2 - 60 : width / 2 - 50} // larger for middle
    y={topDepth + height / 2 - (idx === 1 ? 55 : 45)}
    width={idx === 1 ? 120 : 100}
    height={idx === 1 ? 84 : 70}
  />

  {/* XP */}
  <foreignObject x={width / 2 - 40} y={height + topDepth - 28} width="80" height="26">
    <div className="flex items-center justify-center gap-1 text-sm font-semibold text-white/90">
      <img src={xpIcon} className="w-5 h-5" />
      {xp}
    </div>
  </foreignObject>
</svg>

          </div>
        );
      })}
    </div>
  </div>
)}

{/* ------------------- REMAINING USERS ------------------- */}
{!loading && !error && list.length > 3 && (
  <div className="space-y-3">
    {list.slice(3).map((entry, idx) => {
      const name = entry.display_name || entry.username || "Anonymous";

      const gradients = [
        "from-purple-900/30 to-black/30",
        "from-blue-900/30 to-black/30",
        "from-pink-900/30 to-black/30",
        "from-green-900/30 to-black/30",
      ];

      return (
        <Card
  key={entry.id}
  className={`
    p-4 rounded-3xl
    border-2 border-[#d4af37] 
    bg-gradient-to-r ${gradients[idx % gradients.length]}
    relative
    before:absolute before:inset-0 before:rounded-3xl
    before:border before:border-[#d4af37] before:opacity-50
    before:shadow-[0_0_15px_rgba(212,175,55,0.6)]
    before:pointer-events-none
    hover:brightness-110 transition
  `}
>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* Rank */}
              <div className="w-12 h-12 rounded-full border border-[#d4af37]/50 flex items-center justify-center font-bold bg-white/5 text-[#f5e6b3]">
                {idx + 4}
              </div>

              {/* Avatar */}
              <Avatar className="w-12 h-12">
                <AvatarImage src={entry.avatar} />
                <AvatarFallback className="bg-white/20 text-white">
                  {name.charAt(0)}
                </AvatarFallback>
              </Avatar>

              <div>
                <h3 className="font-semibold text-lg">{name}</h3>
                <div className="text-sm text-white/50">
                  {entry.quests_completed || 0} quests ·{" "}
                  {entry.tasks_completed || 0} campaigns
                </div>
              </div>
            </div>

            {/* XP */}
            <div className="flex items-center gap-2 font-bold text-[#f5e6b3] text-lg">
              <img src={xpIcon} className="w-6 h-6" />
              {entry.xp}
            </div>
          </div>
        </Card>
      );
    })}
  </div>
)}

      </div>
    </div>
  );
}
