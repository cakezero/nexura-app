import { useEffect, useState } from "react";
import AuthGuard from "@/components/AuthGuard";
import AnimatedBackground from "@/components/AnimatedBackground";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { buildUrl } from "@/lib/queryClient";

type Entry = {
  _id: string;
  username?: string;
  display_name?: string;
  avatar?: string;
  xp: number;
  level: number;
  questsCompleted?: number;
  campaignsCompleted?: number;
};

/* ------------------------------ mock data ---------------------------- */

const MOCK_LEADERBOARD: Entry[] = [
  { id: "1", username: "Alice", xp: 1500, level: 10, quests_completed: 12, tasks_completed: 30 },
  { id: "2", username: "Bob", xp: 1200, level: 8, quests_completed: 8, tasks_completed: 25 },
  { id: "3", username: "Charlie", xp: 900, level: 7, quests_completed: 5, tasks_completed: 20 },
  { id: "4", username: "Dev", xp: 800, level: 6, quests_completed: 4, tasks_completed: 15 },
];

/* ------------------------------ component ---------------------------- */

export default function Leaderboard() {
  const [list, setList] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    fetch(buildUrl("/api/leaderboard"))
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data: any) => {
        if (!mounted) return;
        // Data is already sorted by XP from backend
        setList(data.leaderboardInfo.leaderboardByXp);
        setLoading(false);
      })
      .catch((err) => {
        if (!mounted) return;
        setError(err.message || "Failed to load leaderboard");
        setLoading(false);
      }
    );

    return () => mounted = true;
  }, []);

  return (
    <AuthGuard>
      <div className="min-h-screen bg-black text-white p-6 relative overflow-auto">
        <AnimatedBackground />

        <div className="max-w-4xl mx-auto space-y-6 relative z-10">
          <header className="flex items-center justify-between">
            <h1 className="text-3xl md:text-5xl font-bold">Leaderboard</h1>
            {!loading && !error && (
              <Badge variant="outline" className="border-white/20 text-white">
                {list.length} Players
              </Badge>
            )}
          </header>

          {loading && (
            <div className="text-center py-10 text-white/60">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
              Loading leaderboard…
            </div>
          )}

          {error && (
            <div className="text-center py-10 text-red-400">
              Error loading leaderboard: {error}
            </div>
          )}

          {!loading && !error && list.length === 0 && (
            <div className="text-center py-10 text-white/60">
              No leaderboard data yet.
            </div>
          )}

          {!loading && !error && list.length > 0 && (
            <div className="space-y-3">
              {list.map((entry, idx) => {
                const name = entry.display_name || entry.username || "Anonymous";
                const top3 = idx < 3;
                const colors = ["#FFD700", "#C0C0C0", "#CD7F32"];

                return (
                  <Card
                    key={entry._id}
                    className={`p-4 glass glass-hover rounded-3xl ${top3 ? "border-2" : ""}`}
                    style={top3 ? { borderColor: colors[idx] } : {}}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div
                          className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg"
                          style={top3 ? { backgroundColor: colors[idx], color: "#fff" } : {}}
                        >
                          #{idx + 1}
                        </div>

                        <Avatar className="w-12 h-12">
                          {entry.avatar ? (
                            <AvatarImage src={entry.avatar} alt={name} />
                          ) : (
                            <AvatarFallback className="bg-white/10 text-white">
                              {entry.level || 1}
                            </AvatarFallback>
                          )}
                        </Avatar>

                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-lg">{name}</h3>
                            <Badge className="bg-gradient-to-r from-purple-700 via-blue-600 to-cyan-500 border-0">
                              Lvl {entry.level || 1}
                            </Badge>
                          </div>
                          <div className="text-sm text-white/50">
                            {entry.questsCompleted || 0} quests · {entry.campaignsCompleted || 0} campaigns
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-2xl font-bold">{entry.xp || 0}</div>
                        <div className="text-xs text-white/50">XP</div>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </AuthGuard>
  );
}
