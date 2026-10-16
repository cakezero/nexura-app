"use client";

/** Centered loading state for Studio pages: a spinning purple ring with a message under it. */
export default function StudioLoader({ message, error }: { message: string; error?: string }) {
  return (
    <div className="flex flex-1 min-h-[60vh] w-full flex-col items-center justify-center gap-4 px-4 text-center" role="status" aria-live="polite">
      {error ? (
        <p className="text-sm font-medium text-[#e4545b]">{error}</p>
      ) : (
        <>
          <div className="h-12 w-12 rounded-full border-4 border-[rgba(138,63,252,0.15)] border-t-[#8B3EFE] animate-spin" />
          <p className="text-sm font-medium text-[#69728a]">{message}</p>
        </>
      )}
    </div>
  );
}
