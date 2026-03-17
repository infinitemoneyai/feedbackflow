"use client";

interface ReviewStatusBarProps {
  connectionMethod: "iframe" | "proxy" | "loading" | "failed";
  feedbackCount: number;
}

export function ReviewStatusBar({
  connectionMethod,
  feedbackCount,
}: ReviewStatusBarProps): React.JSX.Element {
  const statusText = {
    iframe: "Loaded via iframe",
    proxy: "Loaded via proxy",
    loading: "Loading...",
    failed: "Failed to load",
  }[connectionMethod];

  const statusColor = {
    iframe: "text-green-500",
    proxy: "text-yellow-500",
    loading: "text-muted-foreground",
    failed: "text-red-500",
  }[connectionMethod];

  return (
    <div className="flex items-center justify-between px-3 py-1 border-t text-xs text-muted-foreground">
      <span className={statusColor}>
        {connectionMethod === "iframe" || connectionMethod === "proxy" ? "✓ " : ""}
        {statusText}
      </span>
      <span>
        {feedbackCount} feedback item{feedbackCount !== 1 ? "s" : ""} on this page
      </span>
    </div>
  );
}
