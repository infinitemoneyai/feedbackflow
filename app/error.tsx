"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCcw, Home } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Application error:", error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg-page px-4">
      <div className="max-w-md text-center">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full border-2 border-retro-red bg-retro-red/10">
          <AlertTriangle className="h-10 w-10 text-retro-red" />
        </div>

        <h1 className="mb-2 text-3xl font-medium tracking-tight text-retro-black">
          Something went wrong
        </h1>

        <p className="mb-6 text-stone-600">
          We encountered an unexpected error. Don&apos;t worry, your data is safe.
          Try refreshing the page or go back to the homepage.
        </p>

        {error.digest && (
          <p className="mb-6 font-mono text-xs text-stone-400">
            Error ID: {error.digest}
          </p>
        )}

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button
            onClick={reset}
            className="border-2 border-retro-black bg-retro-black px-6 py-3 text-white shadow-[4px_4px_0px_0px_#888] transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#888]"
          >
            <RefreshCcw className="mr-2 h-4 w-4" />
            Try Again
          </Button>

          <Link href="/">
            <Button
              variant="outline"
              className="w-full border-2 border-retro-black bg-white px-6 py-3 text-retro-black hover:bg-stone-50 sm:w-auto"
            >
              <Home className="mr-2 h-4 w-4" />
              Go Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
