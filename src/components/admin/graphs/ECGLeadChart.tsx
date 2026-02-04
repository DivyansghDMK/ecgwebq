import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export interface ECGPoint {
  t: number;
  value: number;
}

interface ECGLeadChartProps {
  leadName: string;
  data: ECGPoint[];
  color?: string;
}

export const ECGLeadChart: React.FC<ECGLeadChartProps> = ({
  leadName,
  data,
  color = "#f97316",
}) => {
  return (
    <div className="flex flex-col rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
      <div
        className="mb-1 text-xs font-semibold tracking-wide text-center"
        style={{ color }}
      >
        {leadName}
      </div>
      <div className="h-40 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{ top: 4, right: 8, left: 24, bottom: 16 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#e5e7eb"
              horizontal={false}
            />
            <XAxis
              dataKey="t"
              type="number"
              domain={[0, 6]}
              ticks={[0, 2, 4, 6]}
              tick={{ fontSize: 10, fill: "#9ca3af" }}
              tickLine={false}
              axisLine={false}
              label={{
                value: "Time (s)",
                position: "insideBottom",
                offset: -4,
                style: { fontSize: 10, fill: "#9ca3af" },
              }}
            />
            <YAxis
              dataKey="value"
              domain={[-4096, 4096]}
              tick={{ fontSize: 9, fill: "#9ca3af" }}
              tickLine={false}
              axisLine={false}
              label={{
                value: "Amplitude",
                angle: -90,
                position: "insideLeft",
                offset: 10,
                style: { fontSize: 10, fill: "#9ca3af" },
              }}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke={color}
              strokeWidth={1.5}
              dot={false}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};


