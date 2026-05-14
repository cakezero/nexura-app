const COLORS = {
  primary: "rgba(131, 58, 253, 0.20)",
  secondary: "rgba(50, 0, 90, 0.18)",
  tertiary: "rgba(35, 0, 70, 0.16)",
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
          radial-gradient(circle at 70% 20%, ${COLORS.primary} 0%, transparent 65%),
          radial-gradient(circle at 50% 55%, ${COLORS.secondary} 0%, transparent 70%),
          radial-gradient(circle at 30% 85%, ${COLORS.tertiary} 0%, transparent 75%),
          radial-gradient(circle at 50% 50%, rgba(131, 58, 253, 0.06) 0%, transparent 80%),
          linear-gradient(135deg, ${COLORS.base} 0%, ${COLORS.baseEnd} 100%)
        `,
        backgroundSize: "cover",
        backgroundRepeat: "no-repeat",
        backgroundPosition: "center",
        animation: "bg-pan 80s linear infinite",
      }}
    >
      {/* TOP RIGHT */}
      <div
        className="absolute rounded-full"
        style={{
          width: "580px",
          height: "580px",
          background: "#833AFD",
          top: "-200px",
          right: "-180px",
          filter: "blur(150px)",
          opacity: 0.16,
        }}
      />

      {/* CENTER */}
      <div
        className="absolute rounded-full"
        style={{
          width: "750px",
          height: "750px",
          background: "rgba(131, 58, 253, 0.06)",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          filter: "blur(180px)",
          opacity: 0.22,
        }}
      />

      {/* BOTTOM LEFT */}
      <div
        className="absolute rounded-full"
        style={{
          width: "620px",
          height: "620px",
          background: "#5B21B6",
          bottom: "-240px",
          left: "-220px",
          filter: "blur(170px)",
          opacity: 0.14,
        }}
      />

      {/* BOTTOM RIGHT (FIXED VISIBILITY) */}
      <div
        className="absolute rounded-full"
        style={{
          width: "640px",
          height: "640px",
          background: "#7C3AED",
          bottom: "-240px",
          right: "-220px",
          filter: "blur(170px)",
          opacity: 0.14,
        }}
      />
    </div>
  );
}