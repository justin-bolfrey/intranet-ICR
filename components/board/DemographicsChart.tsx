"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const ACCENT = "#a10102";
const GRID_STROKE = "#e4e4e7";

export type DemographicsItem = { name: string; count: number };

type Props = { data: DemographicsItem[] };

export function DemographicsChart({ data }: Props) {
  const display = data.slice(0, 12);

  return (
    <ResponsiveContainer width="100%" height={320}>
      <BarChart
        data={display}
        margin={{ top: 8, right: 8, left: 8, bottom: 8 }}
        layout="vertical"
      >
        <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} />
        <XAxis type="number" stroke="#71717a" fontSize={12} />
        <YAxis
          type="category"
          dataKey="name"
          width={120}
          stroke="#71717a"
          fontSize={11}
          tickLine={false}
        />
        <Tooltip
          formatter={(value: number) => [value, "Anzahl"]}
          contentStyle={{ borderRadius: 8, border: "1px solid #e4e4e7" }}
        />
        <Bar dataKey="count" fill={ACCENT} radius={[0, 4, 4, 0]} name="Anzahl" />
      </BarChart>
    </ResponsiveContainer>
  );
}
