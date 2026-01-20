"use client";

import { useState, useMemo, useCallback } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useDashboard } from "./dashboard-layout";
import {
  VolumeChart,
  TypeBreakdownChart,
  StatusBreakdownChart,
  TopTagsChart,
  MetricCard,
  ChartCard,
} from "./analytics-charts";
import {
  BarChart3,
  Calendar,
  Download,
  TrendingUp,
  Clock,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Granularity = "daily" | "weekly" | "monthly";
type DateRange = "7d" | "30d" | "90d" | "custom";

function formatDuration(ms: number): string {
  if (ms === 0) return "N/A";

  const hours = ms / (1000 * 60 * 60);
  if (hours < 1) {
    const minutes = Math.round(ms / (1000 * 60));
    return `${minutes}m`;
  }
  if (hours < 24) {
    return `${hours.toFixed(1)}h`;
  }
  const days = hours / 24;
  return `${days.toFixed(1)}d`;
}

// Helper to get current timestamp - called outside render
function getInitialTimestamp(): number {
  return Date.now();
}

export function AnalyticsDashboard() {
  const { selectedProjectId } = useDashboard();
  const [granularity, setGranularity] = useState<Granularity>("daily");
  const [dateRange, setDateRange] = useState<DateRange>("30d");
  const [customStartDate, setCustomStartDate] = useState<string>("");
  const [customEndDate, setCustomEndDate] = useState<string>("");
  // Store a stable timestamp that only gets set during state initialization
  const [baseTimestamp, setBaseTimestamp] = useState(getInitialTimestamp);

  // Handler to update timestamp when changing date range
  const handleDateRangeChange = useCallback((newRange: DateRange) => {
    setDateRange(newRange);
    if (newRange !== "custom") {
      setBaseTimestamp(getInitialTimestamp());
    }
  }, []);

  // Calculate date range
  const { startDate, endDate } = useMemo(() => {
    let start: number;
    let end = baseTimestamp;

    if (dateRange === "custom" && customStartDate && customEndDate) {
      start = new Date(customStartDate).getTime();
      end = new Date(customEndDate).getTime() + 24 * 60 * 60 * 1000 - 1; // End of day
    } else {
      const days = dateRange === "7d" ? 7 : dateRange === "30d" ? 30 : 90;
      start = baseTimestamp - days * 24 * 60 * 60 * 1000;
    }

    return { startDate: start, endDate: end };
  }, [dateRange, customStartDate, customEndDate, baseTimestamp]);

  // Fetch analytics data
  const analyticsData = useQuery(
    api.analytics.getAnalytics,
    selectedProjectId
      ? {
          projectId: selectedProjectId,
          startDate,
          endDate,
          granularity,
        }
      : "skip"
  );

  // Fetch export data
  const exportData = useQuery(
    api.analytics.exportAnalytics,
    selectedProjectId
      ? {
          projectId: selectedProjectId,
          startDate,
          endDate,
        }
      : "skip"
  );

  // Handle CSV download
  const handleExportCSV = () => {
    if (!exportData || !exportData.data || exportData.data.length === 0) {
      return;
    }

    // Build CSV content
    const headers = [
      "ID",
      "Title",
      "Type",
      "Status",
      "Priority",
      "Tags",
      "Submitter Email",
      "Submitter Name",
      "Browser",
      "OS",
      "URL",
      "Created At",
      "Resolved At",
      "Time to Resolution (hours)",
    ];

    type ExportRow = (typeof exportData.data)[number];
    const rows = exportData.data.map((row: ExportRow) => [
      row.id,
      `"${(row.title || "").replace(/"/g, '""')}"`,
      row.type,
      row.status,
      row.priority,
      `"${(row.tags || "").replace(/"/g, '""')}"`,
      row.submitterEmail,
      `"${(row.submitterName || "").replace(/"/g, '""')}"`,
      row.browser,
      row.os,
      row.url,
      row.createdAt,
      row.resolvedAt,
      row.timeToResolution,
    ]);

    const csvContent =
      [headers.join(","), ...rows.map((r: (string | number)[]) => r.join(","))].join("\n");

    // Download file
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `feedbackflow-analytics-${exportData.projectName}-${new Date().toISOString().split("T")[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (!selectedProjectId) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <BarChart3 className="mx-auto h-12 w-12 text-stone-300" />
          <h2 className="mt-4 text-lg font-medium text-retro-black">
            Select a project
          </h2>
          <p className="mt-1 text-sm text-stone-500">
            Choose a project from the sidebar to view analytics
          </p>
        </div>
      </div>
    );
  }

  if (analyticsData === undefined) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-retro-blue" />
      </div>
    );
  }

  if (analyticsData === null) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <BarChart3 className="mx-auto h-12 w-12 text-stone-300" />
          <h2 className="mt-4 text-lg font-medium text-retro-black">
            Unable to load analytics
          </h2>
          <p className="mt-1 text-sm text-stone-500">
            You may not have access to this project
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-medium tracking-tight text-retro-black">
            Analytics
          </h1>
          <p className="mt-1 text-sm text-stone-500">
            Insights and metrics for your feedback
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Date range selector */}
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-stone-400" />
            <select
              value={dateRange}
              onChange={(e) => handleDateRangeChange(e.target.value as DateRange)}
              className="rounded border-2 border-stone-200 bg-stone-50 px-3 py-1.5 text-sm outline-none transition-colors focus:border-retro-black"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
              <option value="custom">Custom range</option>
            </select>
          </div>

          {/* Custom date inputs */}
          {dateRange === "custom" && (
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="rounded border-2 border-stone-200 bg-stone-50 px-2 py-1.5 text-sm outline-none transition-colors focus:border-retro-black"
              />
              <span className="text-stone-400">to</span>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="rounded border-2 border-stone-200 bg-stone-50 px-2 py-1.5 text-sm outline-none transition-colors focus:border-retro-black"
              />
            </div>
          )}

          {/* Granularity selector */}
          <select
            value={granularity}
            onChange={(e) => setGranularity(e.target.value as Granularity)}
            className="rounded border-2 border-stone-200 bg-stone-50 px-3 py-1.5 text-sm outline-none transition-colors focus:border-retro-black"
          >
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>

          {/* Export button */}
          <button
            onClick={handleExportCSV}
            disabled={!exportData || !exportData.data || exportData.data.length === 0}
            className={cn(
              "flex items-center gap-2 rounded border-2 border-retro-black bg-white px-3 py-1.5 text-sm font-medium shadow-[2px_2px_0px_0px_rgba(26,26,26,1)] transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_rgba(26,26,26,1)]",
              (!exportData || !exportData.data || exportData.data.length === 0) &&
                "cursor-not-allowed opacity-50"
            )}
          >
            <Download className="h-4 w-4" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Summary metrics */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <MetricCard
          label="Total Feedback"
          value={analyticsData.summary.totalFeedback}
          color="default"
        />
        <MetricCard
          label="Bugs"
          value={analyticsData.summary.totalBugs}
          subtitle={
            analyticsData.summary.totalFeedback > 0
              ? `${((analyticsData.summary.totalBugs / analyticsData.summary.totalFeedback) * 100).toFixed(0)}% of total`
              : undefined
          }
          color="red"
        />
        <MetricCard
          label="Features"
          value={analyticsData.summary.totalFeatures}
          subtitle={
            analyticsData.summary.totalFeedback > 0
              ? `${((analyticsData.summary.totalFeatures / analyticsData.summary.totalFeedback) * 100).toFixed(0)}% of total`
              : undefined
          }
          color="blue"
        />
        <MetricCard
          label="Avg Resolution Time"
          value={formatDuration(analyticsData.summary.avgTimeToResolution)}
          color="green"
        />
      </div>

      {/* Time metrics row */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="flex items-center gap-4 border-2 border-retro-black bg-white p-4 shadow-[4px_4px_0px_0px_rgba(26,26,26,1)]">
          <div className="flex h-12 w-12 items-center justify-center rounded-full border border-retro-blue/30 bg-retro-blue/10">
            <Clock className="h-6 w-6 text-retro-blue" />
          </div>
          <div>
            <p className="font-mono text-xs uppercase tracking-wider text-stone-500">
              Avg Time to First Response
            </p>
            <p className="text-2xl font-medium tracking-tight text-retro-black">
              {formatDuration(analyticsData.summary.avgTimeToFirstResponse)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4 border-2 border-retro-black bg-white p-4 shadow-[4px_4px_0px_0px_rgba(26,26,26,1)]">
          <div className="flex h-12 w-12 items-center justify-center rounded-full border border-green-200 bg-green-50">
            <TrendingUp className="h-6 w-6 text-green-600" />
          </div>
          <div>
            <p className="font-mono text-xs uppercase tracking-wider text-stone-500">
              Avg Time to Resolution
            </p>
            <p className="text-2xl font-medium tracking-tight text-retro-black">
              {formatDuration(analyticsData.summary.avgTimeToResolution)}
            </p>
          </div>
        </div>
      </div>

      {/* Volume chart */}
      <ChartCard title="Feedback Volume Over Time">
        {analyticsData.volumeData.length > 0 ? (
          <VolumeChart
            data={analyticsData.volumeData}
            granularity={granularity}
          />
        ) : (
          <div className="flex h-[300px] items-center justify-center text-stone-500">
            No data available for this date range
          </div>
        )}
      </ChartCard>

      {/* Breakdown charts row */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartCard title="Feedback by Type">
          {analyticsData.summary.totalFeedback > 0 ? (
            <TypeBreakdownChart data={analyticsData.typeBreakdown} />
          ) : (
            <div className="flex h-[250px] items-center justify-center text-stone-500">
              No data available
            </div>
          )}
        </ChartCard>

        <ChartCard title="Feedback by Status">
          {analyticsData.summary.totalFeedback > 0 ? (
            <StatusBreakdownChart data={analyticsData.statusBreakdown} />
          ) : (
            <div className="flex h-[250px] items-center justify-center text-stone-500">
              No data available
            </div>
          )}
        </ChartCard>
      </div>

      {/* Top tags */}
      <ChartCard title="Top Tags">
        <TopTagsChart data={analyticsData.topTags} />
      </ChartCard>
    </div>
  );
}
