const COLORS = {
  primary: "rgba(131, 58, 253, 0.16)",
  secondary: "rgba(50, 0, 90, 0.14)",
  tertiary: "rgba(35, 0, 70, 0.12)",
  base: "#050507",
  baseEnd: "#000000",
};

export default function ReusableBackground({
  className = "",
}: ReusableBackgroundProps) {
  return (
    <div
      className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}
      style={{
        background: `
          radial-gradient(circle at 65% 25%, ${COLORS.primary} 0%, transparent 65%),
          radial-gradient(circle at 50% 55%, ${COLORS.secondary} 0%, transparent 70%),
          radial-gradient(circle at 35% 85%, ${COLORS.tertiary} 0%, transparent 75%),
          radial-gradient(circle at 50% 50%, rgba(131, 58, 253, 0.05) 0%, transparent 80%),
          linear-gradient(135deg, ${COLORS.base} 0%, ${COLORS.baseEnd} 100%)
        `,
        backgroundSize: "cover",
        backgroundRepeat: "no-repeat",
        backgroundPosition: "center",
        animation: "bg-pan 80s linear infinite",
      }}
    >
      {/* TOP RIGHT GLOW */}
      <div
        className="absolute rounded-full"
        style={{
          width: "560px",
          height: "560px",
          background: "#833AFD",
          top: "-200px",
          right: "-180px",
          filter: "blur(160px)",
          opacity: 0.12,
        }}
      />

      {/* CENTER FOG */}
      <div
        className="absolute rounded-full"
        style={{
          width: "700px",
          height: "700px",
          background: "rgba(131, 58, 253, 0.05)",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          filter: "blur(180px)",
          opacity: 0.25,
        }}
      />

      {/* NEW: BOTTOM LEFT BALANCE GLOW */}
      <div
        className="absolute rounded-full"
        style={{
          width: "600px",
          height: "600px",
          background: "#5B21B6",
          bottom: "-240px",
          left: "-220px",
          filter: "blur(170px)",
          opacity: 0.10,
        }}
      />

      {/* existing soft base glow (kept subtle) */}
      <div
        className="absolute rounded-full"
        style={{
          width: "480px",
          height: "480px",
          background: "#4C1D95",
          bottom: "-180px",
          left: "10%",
          filter: "blur(160px)",
          opacity: 0.08,
        }}
      />
    </div>
  );
}