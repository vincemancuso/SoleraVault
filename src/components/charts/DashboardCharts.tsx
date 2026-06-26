"use client";

import { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { flavorDimensions, type FlavorProfile } from "@/lib/flavorModel";
import { formatMlAsOz } from "@/lib/units";
import type { CategoryBreakdown, ComponentBreakdown } from "@/lib/blendMath";

type SnapshotJson = {
  snapshotTime: Date;
  totalVolumeMl: number;
  proof: number;
  categoryBreakdownJson: unknown;
};

export function FlavorRadar({ profile }: { profile: FlavorProfile }) {
  const data = flavorDimensions.map((dimension) => ({
    dimension: dimension[0].toUpperCase() + dimension.slice(1),
    value: Number(profile[dimension].toFixed(2))
  }));

  return (
    <ResponsiveContainer width="100%" height={320}>
      <RadarChart data={data} outerRadius={112}>
        <PolarGrid stroke="#D7C2A4" />
        <PolarAngleAxis dataKey="dimension" tick={{ fill: "#3B2417", fontSize: 12, fontWeight: 700 }} />
        <Radar name="Estimated flavor" dataKey="value" stroke="#A85D32" fill="#C47A2C" fillOpacity={0.38} />
        <Tooltip />
      </RadarChart>
    </ResponsiveContainer>
  );
}

export function ContributorBars({ components }: { components: ComponentBreakdown[] }) {
  const data = components.map((component) => ({
    name: component.displayName,
    pct: Number(component.sharePct.toFixed(1)),
    volume: formatMlAsOz(component.remainingVolumeMl)
  }));

  return (
    <ResponsiveContainer width="100%" height={Math.max(260, data.length * 44)}>
      <BarChart data={data} layout="vertical" margin={{ left: 18, right: 28 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#E2CCAA" />
        <XAxis type="number" unit="%" stroke="#6F6258" />
        <YAxis type="category" dataKey="name" width={132} stroke="#3B2417" tick={{ fontSize: 12, fontWeight: 700 }} />
        <Tooltip formatter={(value, name, item) => [`${value}% (${item.payload.volume})`, "Share"]} />
        <Bar dataKey="pct" fill="#B86B2B" radius={[0, 8, 8, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function HistoryCharts({ snapshots }: { snapshots: SnapshotJson[] }) {
  const [mode, setMode] = useState<"proof" | "volume" | "category">("proof");
  const data = useMemo(
    () =>
      snapshots.map((snapshot) => ({
        date: new Date(snapshot.snapshotTime).toLocaleDateString(),
        proof: Number(snapshot.proof.toFixed(1)),
        volumeOz: Number((snapshot.totalVolumeMl / 29.5735295625).toFixed(1)),
        categories: snapshot.categoryBreakdownJson as CategoryBreakdown[]
      })),
    [snapshots]
  );
  const categories = [...new Set(data.flatMap((point) => point.categories.map((category) => category.category)))];
  const categoryData = data.map((point) => ({
    date: point.date,
    ...Object.fromEntries(point.categories.map((category) => [category.category, Number(category.sharePct.toFixed(1))]))
  }));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {(["proof", "volume", "category"] as const).map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setMode(item)}
            className={mode === item ? "button-primary" : "button-secondary"}
          >
            {item === "proof" ? "Proof" : item === "volume" ? "Volume" : "Category mix"}
          </button>
        ))}
      </div>
      <ResponsiveContainer width="100%" height={320}>
        {mode === "proof" ? (
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E2CCAA" />
            <XAxis dataKey="date" stroke="#6F6258" />
            <YAxis stroke="#6F6258" />
            <Tooltip />
            <Line type="monotone" dataKey="proof" stroke="#A85D32" strokeWidth={3} dot={{ fill: "#C47A2C" }} />
          </LineChart>
        ) : mode === "volume" ? (
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E2CCAA" />
            <XAxis dataKey="date" stroke="#6F6258" />
            <YAxis stroke="#6F6258" />
            <Tooltip />
            <Line type="monotone" dataKey="volumeOz" stroke="#2A1810" strokeWidth={3} dot={{ fill: "#D8A24A" }} />
          </LineChart>
        ) : (
          <AreaChart data={categoryData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E2CCAA" />
            <XAxis dataKey="date" stroke="#6F6258" />
            <YAxis stroke="#6F6258" unit="%" />
            <Tooltip />
            {categories.map((category, index) => (
              <Area
                key={category}
                type="monotone"
                dataKey={category}
                stackId="1"
                stroke={["#C47A2C", "#D8A24A", "#A85D32", "#6F6258"][index % 4]}
                fill={["#C47A2C", "#D8A24A", "#A85D32", "#6F6258"][index % 4]}
              />
            ))}
          </AreaChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}
