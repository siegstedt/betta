'use client';

import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { RechartsTickProps } from '@/lib/definitions';

interface MmpCurveChartProps {
  data: { duration: number; power: number }[];
}

const formatDuration = (seconds: number): string => {
  if (seconds < 60) return `${seconds}s`;
  return `${seconds / 60}m`;
};

const CustomizedMMPTick: React.FC<RechartsTickProps> = (props) => {
  const { x, y, payload } = props;
  const duration = payload.value as number;

  const tickLabels: Record<number, string> = {
    5: '5s',
    60: '1m',
    300: '5m',
    600: '10m',
    1200: '20m',
    3600: '60m',
  };

  const label = tickLabels[duration];

  if (!label) {
    return null; // Don't render a label for other ticks
  }

  return (
    <g transform={`translate(${x},${y})`}>
      <text
        x={0}
        y={0}
        dy={16}
        textAnchor="middle"
        fill="currentColor"
        className="text-xs text-gray-500 dark:text-gray-400"
      >
        {label}
      </text>
    </g>
  );
};

export default function MmpCurveChart({ data }: MmpCurveChartProps) {
  if (!data || data.length === 0) {
    return (
      <p className="text-sm text-gray-500">
        Not enough data to generate power curve.
      </p>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart
        data={data}
        margin={{ top: 5, right: 30, left: 0, bottom: 20 }}
      >
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="hsl(var(--chart-grid))"
          strokeOpacity={0.2}
        />
        <XAxis
          dataKey="duration"
          type="category"
          // @ts-expect-error Recharts provides tick props at runtime
          tick={<CustomizedMMPTick />}
          interval={0}
          height={40}
        />
        <YAxis
          domain={['dataMin - 20', 'dataMax + 20']}
          label={{ value: 'Watts', angle: -90, position: 'insideLeft' }}
        />
        <Tooltip
          labelFormatter={(label) => `Duration: ${formatDuration(label)}`}
          formatter={(value) => [`${value} W`, 'Max Power']}
        />
        <Line
          type="monotone"
          dataKey="power"
          stroke="var(--chart-color-6)"
          strokeWidth={2}
          dot={{ r: 4 }}
          activeDot={{ r: 8 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
