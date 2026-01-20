"use client";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { cn } from "@/lib/utils";

// Retro design colors
const CHART_COLORS = {
  bug: "#E85D52", // retro-red
  feature: "#6B9AC4", // retro-blue
  total: "#1a1a1a", // retro-black
  new: "#6B9AC4", // retro-blue
  triaging: "#F3C952", // retro-yellow
  drafted: "#D4C4E8", // retro-lavender
  exported: "#a8a29e", // stone-400
  resolved: "#22c55e", // green
  critical: "#E85D52", // retro-red
  high: "#F4A261", // retro-peach
  medium: "#F3C952", // retro-yellow
  low: "#d6d3d1", // stone-300
};

interface VolumeChartProps {
  data: Array<{ date: string; total: number; bugs: number; features: number }>;
  granularity: "daily" | "weekly" | "monthly";
}

export function VolumeChart({ data, granularity }: VolumeChartProps) {
  // Format date label based on granularity
  const formatDate = (date: string) => {
    if (granularity === "daily") {
      const d = new Date(date);
      return `${d.getMonth() + 1}/${d.getDate()}`;
    } else if (granularity === "weekly") {
      return date.replace("Week of ", "W: ");
    } else {
      return date;
    }
  };

  const formattedData = data.map((d) => ({
    ...d,
    displayDate: formatDate(d.date),
  }));

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={formattedData}
          margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
          <XAxis
            dataKey="displayDate"
            tick={{ fontSize: 11, fontFamily: "JetBrains Mono, monospace" }}
            stroke="#78716c"
          />
          <YAxis
            tick={{ fontSize: 11, fontFamily: "JetBrains Mono, monospace" }}
            stroke="#78716c"
            allowDecimals={false}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#fff",
              border: "2px solid #1a1a1a",
              boxShadow: "4px 4px 0px 0px rgba(26,26,26,1)",
              borderRadius: 0,
              fontFamily: "Inter, sans-serif",
              fontSize: 12,
            }}
            labelStyle={{ fontWeight: 500, marginBottom: 4 }}
          />
          <Legend
            wrapperStyle={{
              fontFamily: "Inter, sans-serif",
              fontSize: 12,
            }}
          />
          <Line
            type="monotone"
            dataKey="total"
            name="Total"
            stroke={CHART_COLORS.total}
            strokeWidth={2}
            dot={{ fill: CHART_COLORS.total, strokeWidth: 0, r: 3 }}
            activeDot={{ r: 5, strokeWidth: 2, stroke: "#fff" }}
          />
          <Line
            type="monotone"
            dataKey="bugs"
            name="Bugs"
            stroke={CHART_COLORS.bug}
            strokeWidth={2}
            dot={{ fill: CHART_COLORS.bug, strokeWidth: 0, r: 3 }}
            activeDot={{ r: 5, strokeWidth: 2, stroke: "#fff" }}
          />
          <Line
            type="monotone"
            dataKey="features"
            name="Features"
            stroke={CHART_COLORS.feature}
            strokeWidth={2}
            dot={{ fill: CHART_COLORS.feature, strokeWidth: 0, r: 3 }}
            activeDot={{ r: 5, strokeWidth: 2, stroke: "#fff" }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

interface TypeBreakdownProps {
  data: { bugs: number; features: number };
}

export function TypeBreakdownChart({ data }: TypeBreakdownProps) {
  const chartData = [
    { name: "Bugs", value: data.bugs, color: CHART_COLORS.bug },
    { name: "Features", value: data.features, color: CHART_COLORS.feature },
  ];

  const total = data.bugs + data.features;

  return (
    <div className="h-[250px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={50}
            outerRadius={80}
            paddingAngle={2}
            dataKey="value"
            label={({ name, percent }) =>
              `${name ?? ""} (${((percent ?? 0) * 100).toFixed(0)}%)`
            }
            labelLine={{ stroke: "#78716c", strokeWidth: 1 }}
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} stroke="#1a1a1a" strokeWidth={1} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: "#fff",
              border: "2px solid #1a1a1a",
              boxShadow: "4px 4px 0px 0px rgba(26,26,26,1)",
              borderRadius: 0,
              fontFamily: "Inter, sans-serif",
              fontSize: 12,
            }}
            formatter={(value, name) => {
              const numValue = typeof value === "number" ? value : 0;
              return [
                `${numValue} (${((numValue / total) * 100).toFixed(1)}%)`,
                name,
              ];
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

interface StatusBreakdownProps {
  data: {
    new: number;
    triaging: number;
    drafted: number;
    exported: number;
    resolved: number;
  };
}

export function StatusBreakdownChart({ data }: StatusBreakdownProps) {
  const chartData = [
    { name: "New", value: data.new, color: CHART_COLORS.new },
    { name: "Triaging", value: data.triaging, color: CHART_COLORS.triaging },
    { name: "Drafted", value: data.drafted, color: CHART_COLORS.drafted },
    { name: "Exported", value: data.exported, color: CHART_COLORS.exported },
    { name: "Resolved", value: data.resolved, color: CHART_COLORS.resolved },
  ];

  return (
    <div className="h-[250px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 5, right: 30, left: 60, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" horizontal={false} />
          <XAxis
            type="number"
            tick={{ fontSize: 11, fontFamily: "JetBrains Mono, monospace" }}
            stroke="#78716c"
            allowDecimals={false}
          />
          <YAxis
            type="category"
            dataKey="name"
            tick={{ fontSize: 11, fontFamily: "Inter, sans-serif" }}
            stroke="#78716c"
            width={60}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#fff",
              border: "2px solid #1a1a1a",
              boxShadow: "4px 4px 0px 0px rgba(26,26,26,1)",
              borderRadius: 0,
              fontFamily: "Inter, sans-serif",
              fontSize: 12,
            }}
          />
          <Bar dataKey="value" name="Count">
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} stroke="#1a1a1a" strokeWidth={1} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

interface TopTagsChartProps {
  data: Array<{ tag: string; count: number }>;
}

export function TopTagsChart({ data }: TopTagsChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex h-[250px] items-center justify-center text-stone-500">
        No tags found in this date range
      </div>
    );
  }

  return (
    <div className="h-[250px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 5, right: 30, left: 60, bottom: 5 }}
          layout="vertical"
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" horizontal={false} />
          <XAxis
            type="number"
            tick={{ fontSize: 11, fontFamily: "JetBrains Mono, monospace" }}
            stroke="#78716c"
            allowDecimals={false}
          />
          <YAxis
            type="category"
            dataKey="tag"
            tick={{ fontSize: 11, fontFamily: "Inter, sans-serif" }}
            stroke="#78716c"
            width={80}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#fff",
              border: "2px solid #1a1a1a",
              boxShadow: "4px 4px 0px 0px rgba(26,26,26,1)",
              borderRadius: 0,
              fontFamily: "Inter, sans-serif",
              fontSize: 12,
            }}
          />
          <Bar
            dataKey="count"
            name="Count"
            fill={CHART_COLORS.feature}
            stroke="#1a1a1a"
            strokeWidth={1}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

interface MetricCardProps {
  label: string;
  value: string | number;
  subtitle?: string;
  color?: "default" | "blue" | "red" | "yellow" | "green";
}

export function MetricCard({
  label,
  value,
  subtitle,
  color = "default",
}: MetricCardProps) {
  const colorClasses = {
    default: "bg-white",
    blue: "bg-retro-blue/10 border-retro-blue/30",
    red: "bg-retro-red/10 border-retro-red/30",
    yellow: "bg-retro-yellow/10 border-retro-yellow/30",
    green: "bg-green-50 border-green-200",
  };

  return (
    <div
      className={cn(
        "border-2 border-retro-black p-4 shadow-[4px_4px_0px_0px_rgba(26,26,26,1)]",
        colorClasses[color]
      )}
    >
      <p className="font-mono text-xs uppercase tracking-wider text-stone-500">
        {label}
      </p>
      <p className="mt-1 text-3xl font-medium tracking-tight text-retro-black">
        {value}
      </p>
      {subtitle && (
        <p className="mt-1 text-sm text-stone-600">{subtitle}</p>
      )}
    </div>
  );
}

interface ChartCardProps {
  title: string;
  children: React.ReactNode;
  className?: string;
}

export function ChartCard({ title, children, className }: ChartCardProps) {
  return (
    <div
      className={cn(
        "border-2 border-retro-black bg-white p-4 shadow-[4px_4px_0px_0px_rgba(26,26,26,1)]",
        className
      )}
    >
      <h3 className="mb-4 font-medium tracking-tight text-retro-black">{title}</h3>
      {children}
    </div>
  );
}
