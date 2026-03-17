"use client";

import { DashboardLayout, FeedbackList } from "@/components/dashboard";
import { ReviewPage } from "@/components/dashboard/site-review/review-page";
import { useDashboard } from "@/components/dashboard/dashboard-layout";

function DashboardContent() {
  const { currentView } = useDashboard();

  if (currentView === "review") {
    return <ReviewPage />;
  }

  return <FeedbackList />;
}

export default function DashboardPage() {
  return (
    <DashboardLayout>
      <DashboardContent />
    </DashboardLayout>
  );
}
