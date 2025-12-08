'use client';

import { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { format, addDays } from 'date-fns';
import { DailyAggregate } from '@/lib/definitions';

interface DailyWorkloadChartProps {
  data: DailyAggregate[];
  metricLabel: string;
  weekStartDate: string;
  highlightedDate?: string;
}

const dayFormatter = (dateStr: string) => {
  return format(new Date(`${dateStr}T00:00:00`), 'EEEEE');
};

export default function DailyWorkloadChart({
  data,
  metricLabel,
  weekStartDate,
  highlightedDate,
}: DailyWorkloadChartProps) {
  const fullWeekData = useMemo(() => {
    const weekDataMap = new Map(data.map((d) => [d.date, d.total_value]));
    const week = [];
    const start = new Date(`${weekStartDate}T00:00:00`);

    for (let i = 0; i < 7; i++) {
      const currentDate = addDays(start, i);
      const formattedDate = format(currentDate, 'yyyy-MM-dd');
      week.push({
        date: formattedDate,
        total_value: weekDataMap.get(formattedDate) || 0,
      });
    }
    return week;
  }, [data, weekStartDate]);

  return (
    <div className="h-32">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={fullWeekData}
          margin={{ top: 0, right: 20, left: -30, bottom: 0 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            vertical={false}
            stroke="hsl(var(--chart-grid))"
          />
          <XAxis
            dataKey="date"
            tickFormatter={dayFormatter}
            tick={{ fontSize: 10, fill: 'hsl(var(--chart-axis))' }}
          />
          <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--chart-axis))' }} />
          <Tooltip
            contentStyle={{
              backgroundColor: 'hsl(var(--chart-tooltip-bg))',
              borderColor: 'hsl(var(--chart-tooltip-border))',
              borderRadius: '0.5rem',
            }}
            itemStyle={{ color: 'hsl(var(--chart-tooltip-text))' }}
            labelStyle={{
              color: 'hsl(var(--chart-tooltip-label))',
              fontWeight: 'bold',
            }}
            formatter={(value: number) => [Math.round(value), metricLabel]}
            labelFormatter={(label) =>
              format(new Date(`${label}T00:00:00`), 'EEEE, MMM d')
            }
          />
          <Bar dataKey="total_value" name={metricLabel} barSize={12}>
            {fullWeekData.map((entry) => (
              <Cell
                key={`cell-${entry.date}`}
                fill={
                  entry.date === highlightedDate
                    ? 'var(--chart-color-7)'
                    : 'hsl(var(--chart-axis))'
                }
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
