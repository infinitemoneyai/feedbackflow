"use client";

import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";
import { DashboardLayout } from "@/components/dashboard";

// Dynamic import for heavy analytics dashboard with recharts
const AnalyticsDashboard = dynamic(
  () => import("@/components/dashboard/analytics-dashboard").then((mod) => ({ default: mod.AnalyticsDashboard })),
  {
    loading: () => (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-stone-400" />
          <p className="mt-2 font-mono text-sm text-stone-500">Loading analytics...</p>
        </div>
      </div>
    ),
    ssr: false,
  }
);

export default function AnalyticsPage() {
  return (
    <DashboardLayout>
      <AnalyticsDashboard />
    </DashboardLayout>
  );
}
