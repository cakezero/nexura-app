import { useState, useEffect } from "react";
import { Card, CardTitle, CardDescription } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { ArrowRight, Hash, Volume2, Check, Loader2 } from "lucide-react";
import { useLocation } from "wouter";
import AnimatedBackground from "../../../components/AnimatedBackground";
import { projectApiRequest } from "../../../lib/projectApi";
import { useToast } from "../../../hooks/use-toast";

interface DiscordServer {
  id: string;
  name: string;
  icon: string;
  memberCount?: number;
}

interface DiscordChannel {
  id: string;
  name: string;
  type: number;
}

export default function DiscordChannels() {
  const [selected, setSelected] = useState<string[]>([]);
  const [server, setServer] = useState<DiscordServer | null>(null);
  const [channels, setChannels] = useState<DiscordChannel[]>([]);
  const [loading, setLoading] = useState(true);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const discordSessionId = params.get("id");

    if (!discordSessionId) {
      toast({ title: "Error", description: "Discord session not found.", variant: "destructive" });
      setLocation("/studio-dashboard/connect-discord");
      return;
    }

    (async () => {
      try {
        setLoading(true);
        // Fetch servers (usually just one after OAuth)
        const serversRes = await projectApiRequest<{ servers: any[] }>({
          method: "GET",
          endpoint: "/hub/get-servers",
          params: { id: discordSessionId },
        });

        const connectedServer = serversRes.servers?.[0];
        if (!connectedServer) {
          throw new Error("No Discord server found.");
        }

        setServer({
          id: connectedServer.id,
          name: connectedServer.name,
          icon: connectedServer.icon ? `https://cdn.discordapp.com/icons/${connectedServer.id}/${connectedServer.icon}.png` : "/discord-logo.png",
        });

        // Fetch channels for this server
        const channelsRes = await projectApiRequest<{ channels: any[] }>({
          method: "GET",
          endpoint: "/hub/get-channels",
          params: { id: discordSessionId, serverId: connectedServer.id },
        });

        setChannels(channelsRes.channels ?? []);
      } catch (err: any) {
        toast({ title: "Fetch failed", description: err.message, variant: "destructive" });
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const toggle = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  };

  const handleContinue = async () => {
    if (!server) return;
    try {
      setLoading(true);
      await projectApiRequest({
        method: "PATCH",
        endpoint: "/hub/update-hub-ids",
        data: { guildId: server.id },
      });
      
      localStorage.setItem("discordChannels", JSON.stringify(selected));
      window.location.href = "/studio-dashboard";
    } catch (err: any) {
      toast({ title: "Update failed", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  if (loading && !server) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white overflow-auto relative">
      <AnimatedBackground />

      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 py-10">
        <div className="w-full max-w-xl space-y-6">

          {/* Header */}
          <div className="text-center space-y-2">
            <div className="flex justify-center mb-4">
              <img src="/discord-logo.png" alt="Discord" className="w-12 h-12" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold">Select Channels</h1>
            <p className="text-white/60 text-sm sm:text-base max-w-sm mx-auto">
              Choose which channels the Nexura Guide Bot should be installed on. The bot will post campaign updates and quest notifications there.
            </p>
          </div>

          {/* Server info */}
          {server && (
            <Card className="bg-gray-900 border border-purple-500 rounded-2xl p-4 flex items-center gap-4">
              <div className="border-2 border-purple-500 rounded-xl p-1.5">
                <img src={server.icon} alt="Server" className="w-10 h-10 rounded-lg" />
              </div>
              <div>
                <p className="text-white font-semibold">{server.name}</p>
                <p className="text-white/50 text-xs">Connected</p>
              </div>
              <span className="ml-auto text-xs text-purple-400 bg-purple-500/10 border border-purple-500/30 rounded-full px-3 py-1">
                Connected
              </span>
            </Card>
          )}

          {/* Channel list */}
          <Card className="bg-gray-900 border border-purple-500 rounded-2xl p-4 space-y-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Available Channels</CardTitle>
              <CardDescription className="text-xs text-white/40">
                {selected.length} selected
              </CardDescription>
            </div>

            <div className="space-y-4 max-h-72 overflow-y-auto pr-1 custom-scrollbar">
              <div className="space-y-1">
                {channels.filter(c => c.type === 0).map((ch) => {
                  const isSelected = selected.includes(ch.id);
                  return (
                    <button
                      key={ch.id}
                      onClick={() => toggle(ch.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-all duration-150 ${
                        isSelected
                          ? "bg-purple-500/20 border border-purple-500/50"
                          : "bg-white/5 border border-transparent hover:bg-white/10"
                      }`}
                    >
                      <Hash className="w-4 h-4 text-white/40 flex-shrink-0" />
                      <span className={`text-sm flex-1 text-left ${isSelected ? "text-white" : "text-white/70"}`}>
                        {ch.name}
                      </span>
                      {isSelected && (
                        <span className="w-5 h-5 rounded-full bg-[#8B3EFE] flex items-center justify-center flex-shrink-0">
                          <Check className="w-3 h-3 text-white" />
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </Card>

          {/* Hint */}
          <p className="text-center text-white/30 text-xs">
            You can change channel permissions anytime from your Studio dashboard.
          </p>

          {/* CTA */}
          <Button
            onClick={handleContinue}
            disabled={selected.length === 0 || loading}
            className="w-full bg-[#8B3EFE] hover:bg-[#8B3EFE] hover:shadow-[0_0_28px_rgba(131,58,253,0.7)] hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-none"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Install Bot & Continue"}
            <ArrowRight className="h-5 w-5" />
          </Button>

        </div>
      </div>
    </div>
  );
}
