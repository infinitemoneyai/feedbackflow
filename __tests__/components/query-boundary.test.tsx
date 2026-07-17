/**
 * Tests for the query loading boundary at its interface.
 * @see components/ui/query-boundary.tsx
 */

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import {
  QueryBoundary,
  SettingsSectionSkeleton,
} from "@/components/ui/query-boundary";

describe("QueryBoundary", () => {
  it("renders the skeleton while the query is loading (undefined)", () => {
    render(
      <QueryBoundary data={undefined} skeleton={<SettingsSectionSkeleton />}>
        {() => <div>content</div>}
      </QueryBoundary>
    );

    expect(screen.getByTestId("settings-section-skeleton")).toBeDefined();
    expect(screen.queryByText("content")).toBeNull();
  });

  it("renders children with the loaded value — including null (loaded-but-empty)", () => {
    render(
      <QueryBoundary data={null} skeleton={<SettingsSectionSkeleton />}>
        {(value) => <div>loaded: {String(value)}</div>}
      </QueryBoundary>
    );

    expect(screen.getByText("loaded: null")).toBeDefined();
    expect(screen.queryByTestId("settings-section-skeleton")).toBeNull();
  });
});
