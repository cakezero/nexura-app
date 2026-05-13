import React from "react";

export default function StudioBackground({ className }: { className?: string }) {
  return (
    <div
      className={`inset-0 pointer-events-none bg-black ${className || "fixed z-0"}`}
      style={{
        background: `
          radial-gradient(circle at 100% 0%, rgba(139, 62, 254, 0.15) 0%, transparent 80%),
          radial-gradient(circle at 100% 100%, rgba(131, 59, 251, 0.12) 0%, transparent 75%),
          radial-gradient(circle at 85% 50%, rgba(139, 62, 254, 0.08) 0%, transparent 60%),
          linear-gradient(135deg, #050507 0%, #000000 100%)
        `,
        backgroundSize: "cover",
      }}
    />
  );
}
