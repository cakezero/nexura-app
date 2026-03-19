import { useEffect, useState } from "react";
import { useLocation } from "wouter";
// import AnimatedBackground from "../components/AnimatedBackground";
import { Layers, Megaphone, BarChart3, Users, Zap, Shield, ArrowRight, ArrowLeft } from "lucide-react";
import { isProjectSignedIn } from "../lib/projectApi";
import { useWallet } from "../hooks/use-wallet";

const FEATURES = [
  { icon: Megaphone, title: "Campaign Builder", desc: "Launch targeted campaigns with custom tasks and reward tiers" },
  { icon: BarChart3, title: "Live Analytics", desc: "Track completions, wallet interactions, and growth in real-time" },
  { icon: Users, title: "Community Tools", desc: "Manage your audience, roles, and leaderboard from one place" },
  { icon: Zap, title: "On-Chain Actions", desc: "Reward participants automatically via smart contracts" },
  { icon: Shield, title: "Admin Controls", desc: "Set campaign rules, verify tasks, and manage admins" },
  { icon: Layers, title: "Multi-Campaign", desc: "Run several campaigns simultaneously with isolated analytics" },
];

export default function NexuraStudio() {
  const [, setLocation] = useLocation();
  const [redirecting] = useState(() => isProjectSignedIn());
  const { isConnected, address, connectWallet } = useWallet();
  const text = "Nexura Studio";
  const [toggle, setToggle] = useState(false);

  useEffect(() => {
  const interval = setInterval(() => setToggle(prev => !prev), 2500)
  return () => clearInterval(interval);
}, []);

  useEffect(() => {
    if (isProjectSignedIn()) {
      setLocation("/studio-dashboard");
    }
  }, []);

  if (redirecting) return null;

  return (
    <div className="min-h-screen bg-black text-white overflow-auto relative">
      <div className="relative flex flex-col min-h-screen overflow-hidden">
  {/* Video background */}
  <video
    className="absolute top-0 left-0 w-full h-screen object-cover z-0 opacity-30"
    src="/studio-animated.mp4"
    autoPlay
    loop
    muted
    playsInline
  />

      {/* Hero Section */}
<div className="relative flex flex-col min-h-screen overflow-hidden">
        <div className="w-full flex items-center justify-between px-4 sm:px-6 pt-4">
          <button
            onClick={() => setLocation("/discover")}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-full border border-white/30 bg-black/30 hover:bg-black/50 text-white text-xs sm:text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Explore
          </button>

          <button
            onClick={() => connectWallet({ noReload: true })}
            className="px-3 py-2 rounded-full border border-white/80 text-white bg-transparent hover:bg-purple-600 hover:border-purple-600 transition-all text-xs sm:text-sm"
          >
            {isConnected && address ? `${address.slice(0, 6)}...${address.slice(-4)}` : "Connect Wallet"}
          </button>
        </div>

        {/* Hero */}
        <div className="flex flex-col items-center justify-center text-center px-6 pt-6 pb-6">

          {/* Badge */}
          <div className="flex items-center gap-2 bg-purple-500/10 border border-purple-500/30 rounded-full px-3 py-1 mb-4">
            <div className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
            <span className="text-purple-300 text-[10px] font-semibold uppercase tracking-widest">
              ORGANIZATION PLATFORM
            </span>
          </div>

          {/* Icon */}
<div className="w-16 h-16">
  <img
    src="/studio-icon.png"
    alt="Studio Icon"
    className="w-full h-full object-cover"
  />
</div>


<h1 className="text-5xl sm:text-6xl md:text-7xl font-extrabold mb-4 leading-tight text-gray-100 flex justify-center">
  {text.split("").map((letter, index) => {
    const startX = Math.floor(Math.random() * 300 - 150);
    const startY = Math.floor(Math.random() * 300 - 150);
    const rotate = Math.floor(Math.random() * 720 - 360);
    const scale = Math.random() * 1.8 + 0.5;
    const delay = index * 0.05 + Math.random() * 0.1; // small stagger for natural effect

    return (
      <span
        key={index}
        className="inline-block text-white"
        style={{
          transform: `translate(${startX}px, ${startY}px) rotate(${rotate}deg) scale(${scale})`,
          opacity: 0,
          animation: `flyIn 0.8s forwards`,
          animationDelay: `${delay}s`,
        }}
      >
        {letter === " " ? "\u00A0" : letter}
      </span>
    );
  })}
</h1>

<p className="text-sm sm:text-base max-w-lg leading-relaxed mb-5 font-semibold">
  The all-in-one platform for builders to launch campaigns, distribute rewards,
  and grow their community on the Intuition network.
</p>

          {/* CTA */}
          <div className="flex flex-col items-center gap-2 mb-2">
            <button
              onClick={() => setLocation("/projects/create")}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-transparent border border-white text-white font-semibold text-xs transition-all duration-200 hover:bg-purple-600 hover:border-purple-600 hover:shadow-[0_0_20px_rgba(131,58,253,0.7)] hover:scale-[1.03] active:scale-[0.98]"
            >
              Enter Studio
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* <p className="text-white/30 text-[10px]">Reserved for project owners &amp; builders</p> */}
        </div>

        {/* Divider */}
        <div className="mx-6 sm:mx-auto sm:max-w-3xl border-t border-white/5" />

        {/* Studio Frame */}
        <div className="w-full flex justify-center mt-6">
          <img
            src="/frame-studio.png"
            alt="Studio Frame"
            className="w-[520px] max-w-full h-auto"
          />
        </div>

              {/* Powerful Features Section */}
      <div className="w-full flex justify-center py-16 px-6">
        <img
          src="/powerful-features.png"
          alt="Powerful Features"
          className="w-[900px] max-w-full h-auto"
        />
      </div>

      {/* How It Works Section */}
      <div className="w-full flex justify-center pb-4 px-6">
        <img
          src="/how-it-works.png"
          alt="How It Works"
          className="w-[900px] max-w-full h-auto"
        />
      </div>

{/* Enter Studio Button as Image */}
<div className="w-full flex justify-center pb-4">
  <img
    src="/enter-studio.png"
    alt="Enter Studio"
    className="cursor-pointer w-[200px] max-w-full h-auto transform transition-transform duration-200 hover:scale-105"
    onClick={() => setLocation("/projects/create")}
  />
</div>


        {/* Footer band */}
        <div className="mt-auto bg-white/[0.02] px-6 py-4 text-center">
          <p className="text-white/30 text-xs">
            Already have a project?{" "}
            <button
              onClick={() => setLocation("/projects/create/signin-to-hub")}
              className="text-purple-400 hover:underline"
            >
              Sign in
            </button>{" "}
            — no wallet reconnect needed.
          </p>
        </div>
      </div>

    </div>
    </div>
  );
}
