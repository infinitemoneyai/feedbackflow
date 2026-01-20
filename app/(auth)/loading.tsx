import { Loader2 } from "lucide-react";

export default function DashboardLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-retro-paper">
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center border-2 border-retro-black bg-retro-yellow shadow-[4px_4px_0px_0px_rgba(26,26,26,1)]">
          <Loader2 className="h-8 w-8 animate-spin text-retro-black" />
        </div>
        <p className="font-mono text-sm text-stone-500">Loading dashboard...</p>
      </div>
    </div>
  );
}
