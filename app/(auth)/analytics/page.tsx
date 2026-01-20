"use client";

import { DashboardLayout } from "@/components/dashboard";
import { AnalyticsDashboard } from "@/components/dashboard/analytics-dashboard";

export default function AnalyticsPage() {
  return (
    <DashboardLayout>
      <AnalyticsDashboard />
    </DashboardLayout>
  );
}
