'use client';
import {
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface WeeklyWorkloadDataPoint {
  week_start_date: string;
  weekly_total: number;
  rolling_avg: number;
  rolling_std_upper: number;
  rolling_std_lower: number;
}

interface WeeklyWorkloadChartProps {
  data: WeeklyWorkloadDataPoint[];
  metricLabel: string;
  highlightedWeekStartDate?: string; // Optional prop to highlight a specific week
  onWeekClick?: (weekStartDate: string) => void; // Optional callback for week clicks
  compact?: boolean; // Optional prop for a smaller, simpler chart
}

// Function to get ISO week number
const getWeekNumber = (d: Date) => {
  d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(
    ((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7
  );
  return weekNo;
};

const weekFormatter = (dateStr: string) => {
  const date = new Date(dateStr);
  return `Wk ${getWeekNumber(date)}`;
};

export default function WeeklyWorkloadChart({
  data,
  metricLabel,
  highlightedWeekStartDate,
  onWeekClick,
  compact = false,
}: WeeklyWorkloadChartProps) {
  const processedData = data
    .map((d) => ({
      ...d,
      normal_range: [
        Math.max(0, d.rolling_std_lower),
        Math.max(d.rolling_std_upper, Math.max(0, d.rolling_std_lower)),
      ],
    }))
    .sort(
      (a, b) =>
        new Date(a.week_start_date).getTime() -
        new Date(b.week_start_date).getTime()
    );

  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart
          data={processedData}
          margin={{ top: 5, right: 20, left: -20, bottom: 5 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            vertical={false}
            stroke="hsl(var(--chart-grid))"
          />
          <XAxis
            dataKey="week_start_date"
            tickFormatter={weekFormatter}
            tick={{ fontSize: compact ? 8 : 10 }}
          />
          <YAxis tick={{ fontSize: 10 }} />
          <Tooltip
            contentStyle={{
              backgroundColor: 'hsl(var(--chart-tooltip-bg))',
              borderColor: 'hsl(var(--chart-tooltip-border))',
              borderRadius: '0.5rem',
              padding: '8px 12px',
            }}
            itemStyle={{
              color: 'hsl(var(--chart-tooltip-text))',
              fontSize: '10px',
            }}
            labelStyle={{
              color: 'hsl(var(--chart-tooltip-label))',
              fontWeight: 'bold',
              marginBottom: '4px',
              fontSize: '10px',
            }}
            formatter={(value: number | number[], name: string) => {
              // Custom format the "Normal Range" item to show the full range
              if (name === 'Normal Range' && Array.isArray(value)) {
                const lower = Math.round(value[0]);
                const upper = Math.round(value[1]);
                return [`${lower} - ${upper}`, name];
              }

              // Default formatting for other items
              if (typeof value === 'number') {
                return [Math.round(value), name];
              }

              // Fallback for any other case
              return [value, name];
            }}
            labelFormatter={(label) =>
              `Week of ${new Date(label).toLocaleDateString()}`
            }
          />

          {/* Draw the Scatter points for weekly total */}
          <Line
            type="monotone"
            dataKey="weekly_total"
            name={`Weekly ${metricLabel}`}
            stroke="var(--chart-color-18)"
            strokeWidth={0} // Hide the line
            dot={({ cx, cy, payload }) => {
              const isHighlighted =
                payload.week_start_date === highlightedWeekStartDate;
              return (
                <circle
                  key={payload.week_start_date}
                  cx={cx}
                  cy={cy}
                  r={isHighlighted ? 6 : 4}
                  fill={
                    isHighlighted
                      ? 'var(--chart-color-14)'
                      : 'var(--chart-color-18)'
                  }
                  stroke="#fff"
                  strokeWidth={1}
                  onClick={() =>
                    onWeekClick && onWeekClick(payload.week_start_date)
                  }
                  style={{ cursor: onWeekClick ? 'pointer' : 'default' }}
                />
              );
            }}
          />

          {/* Draw the Standard Deviation Band using two stacked Areas */}
          <Area
            dataKey="normal_range"
            type="monotone"
            fill="var(--chart-color-7)"
            stroke="none"
            fillOpacity={0.4}
            name="Normal Range"
            activeDot={false}
          />

          {/* Draw the Average Line on top */}
          <Line
            name="4-Week Avg"
            dataKey="rolling_avg"
            type="monotone"
            stroke="var(--chart-color-19)"
            dot={false}
            strokeWidth={2}
            activeDot={{ r: 4 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
