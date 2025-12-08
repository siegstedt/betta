'use client';

import { AthleteMetric } from '@/lib/definitions';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface WeightTrendChartProps {
  data: AthleteMetric[];
}

export default function WeightTrendChart({ data }: WeightTrendChartProps) {
  if (!data || data.length === 0) {
    return (
      <p className="text-sm text-gray-500">No weight history available.</p>
    );
  }

  const chartData = data.map((metric) => ({
    date: new Date(metric.date_established).getTime(),
    weight: metric.value,
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart
        data={chartData}
        margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
      >
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="hsl(var(--chart-grid))"
          strokeOpacity={0.2}
        />
        <XAxis
          dataKey="date"
          type="number"
          domain={['dataMin', 'dataMax']}
          tickFormatter={(unixTime) => new Date(unixTime).toLocaleDateString()}
        />
        <YAxis
          domain={['dataMin - 2', 'dataMax + 2']}
          label={{ value: 'Weight (kg)', angle: -90, position: 'insideLeft' }}
        />
        <Tooltip
          labelFormatter={(unixTime) => new Date(unixTime).toLocaleDateString()}
          formatter={(value) => [`${value} kg`, 'Weight']}
        />
        <Line
          type="monotone"
          dataKey="weight"
          stroke="var(--chart-color-17)"
          strokeWidth={2}
          dot={{ r: 4 }}
          activeDot={{ r: 8 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
