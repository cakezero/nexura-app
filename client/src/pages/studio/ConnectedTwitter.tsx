import { useEffect, useState } from "react";
import { Card } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { ArrowRight } from "lucide-react";
import { Link } from "wouter";
import AnimatedBackground from "../../components/AnimatedBackground";

export default function ConnectedTwitter() {
  const [twitterData, setTwitterData] = useState<{
    handle: string;
    avatar: string;
    verified: boolean;
  } | null>(null);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Track step so returning to /studio restores here — only during creation flow
    const hasFullSession =
      !!localStorage.getItem("nexura-project:token") ||
      !!localStorage.getItem("nexura:proj-token");
    if (!hasFullSession) {
      localStorage.setItem("nexura:studio-step", "/connected-discord");
    }

    const stored = localStorage.getItem("discordData");
    if (stored) {
      setTwitterData(JSON.parse(stored));
    } else {
      const fakeDiscord = {
        handle: "Nexura Official",
        avatar: "/discord-logo.png",
        verified: true,
      };
      localStorage.setItem("discordData", JSON.stringify(fakeDiscord));
      setTwitterData(fakeDiscord);
    }
    setLoading(false);
  }, []);

  // Guard render: wait until twitterData is ready
  if (loading || !twitterData) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white bg-black">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-black text-white space-y-8 relative">
      <AnimatedBackground />

      <Card className="bg-gray-900 border border-purple-500 rounded-2xl w-full max-w-xl p-6 space-y-6 relative z-10">

        <div className="flex justify-center">
          <img
            src="/connect-check.png"
            alt="Connected Check"
            className="w-16 h-16"
          />
        </div>

        <h1 className="text-2xl sm:text-3xl font-semibold text-white text-center">
          Discord Server Connected
        </h1>

        <p className="text-white/60 text-center sm:text-base max-w-sm mx-auto">
          Your Discord server has been successfully linked to Nexura Studio
        </p>

        <Card className="bg-gray-800 border border-purple-500 rounded-2xl p-4 flex items-center justify-between">

          <div className="border-2 border-purple-500 rounded-2xl p-2 flex items-center justify-center">
            <img
              src={twitterData.avatar || "/discord-logo.png"}
              alt="Discord avatar"
              className="w-10 h-10 rounded-full"
            />
          </div>

          <div className="flex items-center justify-between flex-1 px-4">
            <div className="flex flex-col">
              <span className="text-white font-semibold text-lg">
                {twitterData.handle || "@unknown"}
              </span>
              <span className="text-white/60 text-sm">
                Discord Server
              </span>
            </div>

            {twitterData.verified && (
              <img
                src="/verified-icon.png"
                alt="Verified"
                className="w-24 h-8"
              />
            )}
          </div>

        </Card>

        <Link href="/discord-channels" className="w-full">
          <Button className="w-full bg-purple-400 hover:bg-purple-600 hover:shadow-[0_0_28px_rgba(131,58,253,0.7)] hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2 mt-4">
            Save & Continue
            <ArrowRight className="h-5 w-5" />
          </Button>
        </Link>
      </Card>
    </div>
  );
}
