const COLORS = {
  primary: "rgba(131, 58, 253, 0.25)",
  secondary: "rgba(50, 0, 90, 0.22)",
  tertiary: "rgba(35, 0, 70, 0.2)",
  base: "#050507",
  baseEnd: "#000000",
};

interface ReusableBackgroundProps {
  className?: string;
}

export default function ReusableBackground({
  className = "",
}: ReusableBackgroundProps) {
  return (
    <div
      className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}
      style={{
        background: `
          radial-gradient(circle at 80% 10%, ${COLORS.primary} 0%, transparent 45%),
          radial-gradient(circle at 50% 50%, ${COLORS.secondary} 0%, transparent 55%),
          radial-gradient(circle at 20% 90%, ${COLORS.tertiary} 0%, transparent 60%),
          linear-gradient(135deg, ${COLORS.base} 0%, ${COLORS.baseEnd} 100%)
        `,
        backgroundSize: "cover",
        backgroundRepeat: "no-repeat",
        backgroundPosition: "center",
        animation: "bg-pan 60s linear infinite",
      }}
    >
      {/* BG 1 (kept exact size) */}
      <div
        className="absolute rounded-full"
        style={{
          width: "420px",
          height: "420px",
          background: "#833AFD",
          top: "-180px",
          right: "-140px",
          filter: "blur(120px)",
          opacity: 0.22,
        }}
      />

      {/* BG 2 (kept exact size) */}
      <div
        className="absolute rounded-full"
        style={{
          width: "320px",
          height: "320px",
          background: "#5B21B6",
          bottom: "-140px",
          left: "-120px",
          filter: "blur(110px)",
          opacity: 0.18,
        }}
      />
    </div>
  );
}