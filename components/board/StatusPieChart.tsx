"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";

const ACCENT = "#a10102";
const GRAYS = ["#71717a", "#a1a1aa", "#d4d4d8", "#52525b"];

export type StatusPieItem = { name: string; value: number };

type Props = { data: StatusPieItem[] };

export function StatusPieChart({ data }: Props) {
  const filtered = data.filter((d) => d.value > 0);
  const colors = [ACCENT, ...GRAYS].slice(0, filtered.length);

  return (
    <ResponsiveContainer width="100%" height={280}>
      <PieChart>
        <Pie
          data={filtered}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={90}
          paddingAngle={2}
          stroke="none"
        >
          {filtered.map((_, i) => (
            <Cell key={i} fill={colors[i % colors.length]} />
          ))}
        </Pie>
        <Tooltip
          formatter={(value: number) => [value, ""]}
          contentStyle={{ borderRadius: 8, border: "1px solid #e4e4e7" }}
        />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}
