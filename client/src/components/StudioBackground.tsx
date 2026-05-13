import React from "react";

export default function StudioBackground({ className }: { className?: string }) {
  return (
    <div
      className={`inset-0 pointer-events-none bg-black ${className || "fixed z-0"}`}
      style={{
        background: `
          radial-gradient(circle at 100% 0%, rgba(139, 62, 254, 0.7) 0%, transparent 45%),
          radial-gradient(circle at 90% 10%, rgba(131, 59, 251, 0.4) 0%, transparent 30%),
          linear-gradient(135deg, #000000 0%, #050507 100%)
        `,
        backgroundSize: "cover",
      }}
    />
  );
}
