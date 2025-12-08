import React from 'react';
import { formatDuration } from '@/lib/formatters';

interface DailyActivity {
  activity_id: number;
  name: string;
  time: string;
}

interface ChartDataPoint {
  day: string;
  stack_index: number;
  metric_value: number;
  color: string;
  daily_activities: DailyActivity[];
}

interface WeeklyActivityData {
  week_start_date: string;
  week_end_date: string;
  total_metric: number;
  total_time: number;
  total_distance: number;
  total_load: number;
  chart_data: ChartDataPoint[];
}

interface WeeklyRowProps {
  weekData: WeeklyActivityData;
  metric: string;
}

export function WeeklyRow({ weekData, metric }: WeeklyRowProps) {
  const formatWeekHeader = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);

    const startStr = start.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
    const endStr = end.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });

    return `${startStr} – ${endStr}`;
  };

  const formatTotals = (weekData: WeeklyActivityData) => {
    return (
      <>
        <div>Total Time: {formatDuration(weekData.total_time)}</div>
        <div>
          Total Distance: {(weekData.total_distance / 1000).toFixed(1)}km
        </div>
        <div>Total Load: {Math.round(weekData.total_load)}</div>
      </>
    );
  };

  // Prepare data for ScatterChart - group by day and stack index
  const chartData = weekData.chart_data || [];

  if (!chartData.length) {
    return (
      <div className="bg-card p-6 rounded-lg shadow-md mb-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-card-foreground">
            {formatWeekHeader(weekData.week_start_date, weekData.week_end_date)}
          </h3>
          <div className="text-sm text-muted-foreground">
            No activities this week
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card pl-6 pr-6 pt-6 pb-2 rounded-lg shadow-md">
      <div className="grid grid-cols-4 gap-1">
        {/* Left column - Week header info */}
        <div className="flex flex-col">
          <h3 className="text-md font-semibold text-card-foreground">
            {formatWeekHeader(weekData.week_start_date, weekData.week_end_date)}
          </h3>
          <div className="text-sm text-muted-foreground mt-2 space-y-1">
            {formatTotals(weekData)}
          </div>
        </div>

        {/* Right column - Chart area */}
        <div className="col-span-3 h-48 w-full relative">
          <svg
            width="100%"
            height="100%"
            viewBox="0 0 700 180"
            className="overflow-visible"
          >
            {/* Day labels */}
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(
              (day, index) => (
                <text
                  key={day}
                  x={50 + index * 100}
                  y={170}
                  textAnchor="middle"
                  className="text-xs fill-gray-600 dark:fill-gray-400"
                >
                  {day}
                </text>
              )
            )}

            {/* Bubbles */}
            {chartData.map((point, index) => {
              const x =
                50 +
                ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].indexOf(
                  point.day
                ) *
                  100;
              const y = 130 - point.stack_index * 30; // Stack vertically
              const scale = metric === 'unified_training_load' ? 1 : 2; // Smaller scale for load to make bubbles larger
              const radius = Math.max(
                5,
                Math.min(25, Math.sqrt(point.metric_value) / scale)
              ); // Size based on metric

              return (
                <circle
                  key={index}
                  cx={x}
                  cy={y}
                  r={radius}
                  fill={point.color}
                  className="cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() => {
                    if (point.daily_activities.length > 0) {
                      // Show tooltip or navigate
                      const activity = point.daily_activities[0];
                      window.location.href = `/activity/${activity.activity_id}/overview`;
                    }
                  }}
                />
              );
            })}
          </svg>
        </div>
      </div>
    </div>
  );
}
