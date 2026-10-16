"use client";

import { useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import AnimatedBackground from "@/components/AnimatedBackground";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[error-boundary]", error);
  }, [error]);

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-black text-white relative">
      <AnimatedBackground />
      <Card className="w-full max-w-md mx-4 glass rounded-3xl relative z-10">
        <CardContent className="pt-6">
          <div className="flex mb-4 gap-2">
            <AlertCircle className="h-8 w-8 text-red-500" />
            <h1 className="text-2xl font-bold text-gray-900">
              Something went wrong
            </h1>
          </div>

          <p className="mt-4 text-sm text-gray-600">
            An unexpected error occurred. Please try again.
          </p>

          <button
            onClick={() => reset()}
            className="mt-6 w-full px-4 py-2.5 rounded-xl bg-white text-black font-semibold text-sm hover:bg-gray-200 transition-colors"
          >
            Try again
          </button>
        </CardContent>
      </Card>
    </div>
  );
}
