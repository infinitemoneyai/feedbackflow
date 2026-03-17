"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useDashboard } from "@/components/dashboard/dashboard-layout";
import { ReviewViewer } from "./review-viewer";
import { ShareReviewModal } from "./share-review-modal";
import { Skeleton } from "@/components/ui/skeleton";

export function ReviewPage(): JSX.Element {
  const { selectedProjectId, selectedTeamId } = useDashboard();
  const [showShareModal, setShowShareModal] = useState(false);

  const project = useQuery(
    api.projects.getProject,
    selectedProjectId ? { projectId: selectedProjectId } : "skip"
  );

  if (!selectedProjectId || !selectedTeamId) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        Select a project to start reviewing
      </div>
    );
  }

  if (project === undefined) {
    return (
      <div className="flex flex-col h-full gap-2 p-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="flex-1 w-full" />
        <Skeleton className="h-6 w-full" />
      </div>
    );
  }

  if (!project?.siteUrl) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <div className="text-center space-y-2">
          <p>No site URL set for this project.</p>
          <p className="text-sm">Add a site URL in project settings to use the reviewer.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <ReviewViewer
        projectId={selectedProjectId}
        teamId={selectedTeamId}
        initialUrl={project.siteUrl}
        onShare={() => setShowShareModal(true)}
      />
      <ShareReviewModal
        projectId={selectedProjectId}
        siteUrl={project.siteUrl}
        open={showShareModal}
        onOpenChange={setShowShareModal}
      />
    </>
  );
}
