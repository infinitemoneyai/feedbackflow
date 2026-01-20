"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCcw, Home, ArrowLeft } from "lucide-react";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Dashboard error:", error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-retro-paper px-4">
      <div className="max-w-md text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center border-2 border-retro-red bg-retro-red/10 shadow-[4px_4px_0px_0px_rgba(232,93,82,0.3)]">
          <AlertTriangle className="h-8 w-8 text-retro-red" />
        </div>

        <h1 className="mb-2 text-2xl font-medium tracking-tight text-retro-black">
          Dashboard Error
        </h1>

        <p className="mb-4 text-stone-600">
          Something went wrong while loading the dashboard. Your feedback data is
          safe.
        </p>

        {error.message && (
          <div className="mb-6 rounded border border-stone-200 bg-stone-50 p-3">
            <p className="font-mono text-xs text-stone-500">
              {error.message.slice(0, 200)}
            </p>
          </div>
        )}

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
            Reload Dashboard
          </Button>

          <Link href="/">
            <Button
              variant="outline"
              className="w-full border-2 border-retro-black bg-white px-6 py-3 text-retro-black hover:bg-stone-50 sm:w-auto"
            >
              <Home className="mr-2 h-4 w-4" />
              Homepage
            </Button>
          </Link>
        </div>

        <div className="mt-6">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1 text-sm text-stone-500 hover:text-retro-black"
          >
            <ArrowLeft className="h-3 w-3" />
            Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
