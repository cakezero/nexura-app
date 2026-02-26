import { useEffect, useState } from "react";
import { Card } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { ArrowRight } from "lucide-react";
import { Link } from "wouter";
import AnimatedBackground from "../../components/AnimatedBackground";

export default function ConnectedDiscord() {
  const [discordData, setDiscordData] = useState<{
    handle: string;
    avatar: string;
    verified: boolean;
  } | null>(null);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const hasFullSession =
      !!localStorage.getItem("nexura-project:token") ||
      !!localStorage.getItem("nexura:proj-token");
    if (!hasFullSession) {
      localStorage.setItem("nexura:studio-step", "/connected-discord");
    }

    const stored = localStorage.getItem("discordData");
    if (stored) {
      setDiscordData(JSON.parse(stored));
    } else {
      // Fake data for now
      const fakeDiscord = {
        handle: "@realproject_handle",
        avatar: "/original-discord.png",
        verified: true,
      };
      localStorage.setItem("discordData", JSON.stringify(fakeDiscord));
      setDiscordData(fakeDiscord);
    }
    setLoading(false);
  }, []);

  // Guard render: wait until discordData is ready
  if (loading || !discordData) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white bg-black">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-black text-white space-y-8 relative">
      <AnimatedBackground />

      <Card className="bg-[#060210] border border-purple-500 rounded-2xl w-full max-w-xl p-6 space-y-6 relative z-10">

        <div className="flex justify-center">
          <img
            src="/connect-check.png"
            alt="Connected Check"
            className="w-16 h-16"
          />
        </div>

        <h1 className="text-2xl sm:text-3xl font-semibold text-white text-center">
          Discord Account Connected
        </h1>

        <p className="text-white/60 text-center sm:text-base max-w-sm mx-auto">
          Finalize your server and role synchronization to start managing your hub
        </p>

        <Card className="rounded-2xl p-4 flex flex-col space-y-4" style={{ backgroundColor: "#8B3EFE1A", border: "2px solid #8A3EFE" }}>

  {/* Title & Subheading */}
  <div className="flex flex-col">
    <span className="text-white font-semibold text-lg">Select Server</span>
    <span className="text-white/60 text-sm mt-1">Active Server</span>
  </div>

  {/* Input with dropdown */}
  <div className="relative w-full">
    <input
      type="text"
      placeholder="Choose an Active Server"
      className="w-full bg-gray-900 border border-purple-500 rounded-2xl px-4 py-2 text-white pr-10 focus:outline-none"
    />
    <button
      type="button"
      className="absolute right-2 top-1/2 -translate-y-1/2 text-white/60 hover:text-white"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-5 w-5"
        viewBox="0 0 20 20"
        fill="currentColor"
      >
        <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 011.08 1.04l-4.25 4.25a.75.75 0 01-1.08 0L5.21 8.27a.75.75 0 01.02-1.06z" clipRule="evenodd" />
      </svg>
    </button>
  </div>
</Card>

<Card className="rounded-2xl p-4 flex flex-col space-y-4" style={{ backgroundColor: "#8B3EFE1A", border: "2px solid #8A3EFE" }}>

  {/* Title */}
  <div className="flex flex-col">
    <span className="text-white font-semibold text-lg">Select Roles for Verification</span>
  </div>

  {/* Role Selections */}
  <div className="flex flex-col space-y-3">
    {[
      { name: "Verified Member", color: "#FFD700" },
      { name: "Founder", color: "#FF9D00" }, 
      { name: "OG Supporter", color: "#FF00C8" },
      { name: "OG Supporter", color: "#FF00C8" }, 
    ].map((role, idx) => (
      <div key={idx} className="flex items-center justify-between bg-gray-900 px-4 py-2 rounded-2xl border border-purple-500">
        {/* Left colored dot and role name */}
        <div className="flex items-center gap-3">
          <span className="w-3 h-3 rounded-full block" style={{ backgroundColor: role.color }}></span>
          <span className="text-white">{role.name}</span>
        </div>

        {/* Checkbox */}
        <input type="checkbox" className="w-5 h-5 accent-purple-500" />
      </div>
    ))}
  </div>
</Card>

        <Link href="/studio-dashboard" className="w-full">
          <Button className="w-full text-white bg-purple-500 hover:bg-purple-600 flex items-center justify-center gap-2 mt-4">
            Continue to Dashboard 
            <ArrowRight className="h-5 w-5" />
          </Button>
        </Link>
      </Card>
    </div>
  );
}