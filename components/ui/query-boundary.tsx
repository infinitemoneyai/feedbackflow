"use client";

import type { ReactNode } from "react";

interface QueryBoundaryProps<T> {
  /** A Convex useQuery result: undefined = loading, anything else = loaded. */
  data: T | undefined;
  /** Skeleton matching the shape of the loaded content (house rule: never a bare spinner). */
  skeleton: ReactNode;
  children: (data: T) => ReactNode;
}

/**
 * Loading boundary for query-backed sections: renders the content-shaped
 * skeleton until the query resolves, then hands the loaded value to children.
 */
export function QueryBoundary<T>({
  data,
  skeleton,
  children,
}: QueryBoundaryProps<T>): ReactNode {
  if (data === undefined) {
    return skeleton;
  }
  return children(data);
}

/**
 * Content-shaped placeholder for a settings section: header block plus a
 * few field-height bars, matching the retro card layout.
 */
export function SettingsSectionSkeleton({
  rows = 3,
}: {
  rows?: number;
}): ReactNode {
  return (
    <div
      className="space-y-6"
      role="status"
      aria-label="Loading section"
      data-testid="settings-section-skeleton"
    >
      <div className="rounded border-2 border-stone-200 bg-white p-6">
        <div className="flex items-start gap-4">
          <div className="h-12 w-12 flex-shrink-0 animate-pulse rounded-full bg-stone-200" />
          <div className="flex-1 space-y-2">
            <div className="h-5 w-48 animate-pulse rounded bg-stone-200" />
            <div className="h-4 w-72 animate-pulse rounded bg-stone-100" />
          </div>
        </div>
      </div>
      {Array.from({ length: rows }, (_, index) => (
        <div
          key={index}
          className="rounded border-2 border-stone-200 bg-white p-6"
        >
          <div className="mb-4 h-4 w-32 animate-pulse rounded bg-stone-200" />
          <div className="h-10 w-full animate-pulse rounded bg-stone-100" />
        </div>
      ))}
    </div>
  );
}
