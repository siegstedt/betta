'use client';

import { Activity, ActivityLap } from '@/lib/definitions';
import { useMemo, useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Brush,
  ReferenceLine,
  ReferenceArea,
} from 'recharts';
import {
  Button,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui';

interface ActivityChartProps {
  activity: Activity;
}

// Define colors for each data series
const COLORS = {
  power: 'var(--chart-color-6)',
  heart_rate: 'var(--chart-color-8)',
  cadence: 'var(--chart-color-9)',
  altitude: 'var(--chart-color-10)',
  speed: 'var(--chart-color-4)',
};

const seriesConfig = [
  {
    key: 'power',
    name: 'Power',
    color: COLORS.power,
    unit: 'W',
    domain: [0, 'dataMax + 50'],
  },
  {
    key: 'heart_rate',
    name: 'HR',
    color: COLORS.heart_rate,
    unit: 'bpm',
    domain: [0, 'dataMax + 20'],
  },
  {
    key: 'cadence',
    name: 'Cadence',
    color: COLORS.cadence,
    unit: 'rpm',
    domain: [0, 'dataMax + 20'],
  },
  {
    key: 'altitude',
    name: 'Altitude',
    color: COLORS.altitude,
    unit: 'm',
    domain: ['auto', 'auto'],
  },
  {
    key: 'speed',
    name: 'Speed',
    color: COLORS.speed,
    unit: 'km/h',
    domain: [0, 'dataMax + 10'],
  },
] as const;

// Define a type for the processed chart data
type ChartDataPoint = {
  time: number;
  distance: number;
  power: number | null;
  heart_rate: number | null;
  cadence: number | null;
  altitude: number | null;
  speed: number | null;
};

// Define a type for the processed lap data
type LapWithStartEnd = ActivityLap & {
  start: number;
  end: number;
  start_distance: number;
  end_distance: number;
};

export default function ActivityChart({ activity }: ActivityChartProps) {
  const [xAxisType, setXAxisType] = useState<'time' | 'distance'>('time');
  const [visibleSeries, setVisibleSeries] = useState({
    power: true,
    heart_rate: false,
    cadence: false,
    altitude: true,
    speed: true,
  });
  // State now holds the full lap object, or null
  const [highlightedLap, setHighlightedLap] = useState<LapWithStartEnd | null>(
    null
  );

  const records = activity?.records;
  const start_time = activity?.start_time;
  const laps = activity?.laps;

  const chartData: ChartDataPoint[] = useMemo(() => {
    if (!records || !start_time || records.length === 0) return [];

    const startDate = new Date(start_time);

    let cumulativeDistance = 0;

    return records.map((record, index) => {
      const recordDate = new Date(record.timestamp);
      const elapsedSeconds =
        (recordDate.getTime() - startDate.getTime()) / 1000;

      // Calculate cumulative distance from speed data
      if (record.speed && index > 0) {
        const prevRecordDate = new Date(records[index - 1].timestamp);
        const timeDelta =
          (recordDate.getTime() - prevRecordDate.getTime()) / 1000;
        // Ensure timeDelta is reasonable (e.g., not a pause)
        if (timeDelta > 0 && timeDelta < 10) {
          cumulativeDistance += record.speed * timeDelta;
        }
      }

      return {
        time: elapsedSeconds,
        distance: cumulativeDistance / 1000, // convert to km
        power: record.power ?? null,
        heart_rate: record.heart_rate ?? null,
        cadence: record.cadence ?? null,
        altitude: record.altitude ?? null,
        speed: record.speed ? record.speed * 3.6 : null, // convert m/s to km/h
      };
    });
  }, [records, start_time]);

  // This memo must come *after* chartData
  const lapsWithStartEnd: LapWithStartEnd[] = useMemo(() => {
    if (!chartData || chartData.length === 0 || !laps) return [];

    let cumulativeTime = 0;
    return laps.map((lap) => {
      const start = cumulativeTime;
      const end = cumulativeTime + (lap.duration || 0);
      cumulativeTime = end;

      // Find the corresponding distance from chartData
      // Find closest index, not exact match
      const findClosestDistance = (time: number) => {
        const dataPoint = chartData.reduce((prev, curr) =>
          Math.abs(curr.time - time) < Math.abs(prev.time - time) ? curr : prev
        );
        return dataPoint.distance;
      };

      const start_distance = findClosestDistance(start);
      const end_distance = findClosestDistance(end);

      return { ...lap, start, end, start_distance, end_distance };
    });
  }, [laps, chartData]);

  // This memo determines the bounds for ReferenceArea
  const highlightedBounds = useMemo(() => {
    if (!highlightedLap) return null;

    if (xAxisType === 'time') {
      return { x1: highlightedLap.start, x2: highlightedLap.end };
    } else {
      return {
        x1: highlightedLap.start_distance,
        x2: highlightedLap.end_distance,
      };
    }
  }, [highlightedLap, xAxisType]);

  if (!activity || !activity.start_time) {
    return (
      <div className="flex h-[400px] w-full items-center justify-center rounded-md border border-dashed">
        <p className="text-muted-foreground">Loading chart data...</p>
      </div>
    );
  }

  const handleLapSelection = (lapNumber: string) => {
    if (lapNumber === 'none') {
      setHighlightedLap(null);
      return;
    }
    const selectedLap = lapsWithStartEnd.find(
      (l) => l.lap_number.toString() === lapNumber
    );
    if (selectedLap) {
      setHighlightedLap(selectedLap);
    }
  };

  const toggleSeries = (dataKey: keyof typeof visibleSeries) => {
    setVisibleSeries((prev) => ({
      ...prev,
      [dataKey]: !prev[dataKey],
    }));
  };

  const formatXAxisTime = (tickItem: number) => {
    const h = Math.floor(tickItem / 3600)
      .toString()
      .padStart(2, '0');
    const m = Math.floor((tickItem % 3600) / 60)
      .toString()
      .padStart(2, '0');
    const s = Math.floor(tickItem % 60)
      .toString()
      .padStart(2, '0');
    return `${h}:${m}:${s}`;
  };
  const formatXAxisDistance = (tickItem: number) => `${tickItem.toFixed(1)} km`;

  const visibleSeriesKeys = seriesConfig.filter((s) => visibleSeries[s.key]);

  const averageValues: { [key: string]: number | undefined } = {
    power: activity.average_power,
    heart_rate: activity.average_heart_rate,
    cadence: activity.average_cadence,
    speed: activity.average_speed ? activity.average_speed * 3.6 : undefined,
    altitude: undefined, // No average for altitude
  };

  if (!records || records.length === 0) {
    return (
      <div className="flex h-[400px] w-full items-center justify-center rounded-md border border-dashed">
        <p className="text-muted-foreground">
          No time-series data found for this activity.
        </p>
      </div>
    );
  }

  return (
    <div className="h-full w-full flex flex-col">
      {/* Controls */}
      <div className="flex justify-between items-center mb-2 flex-wrap gap-2">
        <div className="flex items-center space-x-2 flex-wrap gap-y-2">
          {seriesConfig.map((series) => (
            <Button
              key={series.key}
              variant={visibleSeries[series.key] ? 'default' : 'outline'}
              size="sm"
              onClick={() => toggleSeries(series.key)}
              className="h-auto px-2 py-1 text-xs"
              style={{
                backgroundColor: visibleSeries[series.key]
                  ? series.color
                  : undefined,
                borderColor: visibleSeries[series.key]
                  ? series.color
                  : undefined,
                color: visibleSeries[series.key] ? 'white' : undefined,
              }}
            >
              {series.name}
            </Button>
          ))}
        </div>
        <div className="flex items-center space-x-4">
          {laps && laps.length > 0 && (
            <div className="flex items-center space-x-2">
              <span className="font-small text-xs text-muted-foreground">
                Highlight:
              </span>
              <Select onValueChange={handleLapSelection}>
                <SelectTrigger className="w-[120px] h-auto px-2 py-1 text-xs">
                  <SelectValue placeholder="Select Lap" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {lapsWithStartEnd.map((lap) => (
                    <SelectItem
                      key={lap.lap_id}
                      value={lap.lap_number.toString()}
                    >
                      Lap {lap.lap_number}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="text-sm">
            <span className="font-small text-xs mr-2 text-muted-foreground">
              X-Axis:
            </span>
            <Button
              variant={xAxisType === 'time' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setXAxisType('time')}
              className="h-auto px-2 py-1 text-xs"
            >
              Time
            </Button>
            <Button
              variant={xAxisType === 'distance' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setXAxisType('distance')}
              className="ml-1 h-auto px-2 py-1 text-xs"
            >
              Distance
            </Button>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="flex-grow">
        <ResponsiveContainer width="100%" height={400}>
          <LineChart
            data={chartData}
            syncId="activityChart"
            margin={{ top: 5, right: 10, left: 10, bottom: 10 }}
          >
            <CartesianGrid
              stroke="hsl(var(--chart-grid))"
              strokeDasharray="3 3"
            />
            <XAxis
              dataKey={xAxisType}
              tickFormatter={
                xAxisType === 'time' ? formatXAxisTime : formatXAxisDistance
              }
              type="number"
              domain={['dataMin', 'dataMax']}
              height={30}
              allowDataOverflow={true}
            />
            {visibleSeriesKeys.map((series) => (
              <YAxis
                key={series.key}
                yAxisId={series.key}
                hide={true}
                domain={series.domain}
              />
            ))}
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--popover))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '0.5rem',
              }}
              labelFormatter={(label) =>
                xAxisType === 'time'
                  ? `Time: ${formatXAxisTime(label as number)}`
                  : `Distance: ${formatXAxisDistance(label as number)}`
              }
              formatter={(value, name, props) => [
                `${(value as number).toFixed(0)} ${props.unit || ''}`,
                name,
              ]}
            />

            {/* Render Reference Lines */}
            {visibleSeriesKeys.map((series) => {
              const avg = averageValues[series.key];
              if (avg === undefined || avg === null) return null;
              return (
                <ReferenceLine
                  key={`avg-${series.key}`}
                  y={avg}
                  yAxisId={series.key}
                  stroke={series.color}
                  strokeDasharray="3 3"
                  strokeOpacity={0.7}
                />
              );
            })}

            {/* Render Lines */}
            {visibleSeriesKeys.map((series) => (
              <Line
                key={series.key}
                type="monotone"
                dataKey={series.key}
                name={series.name}
                unit={series.unit}
                stroke={series.color}
                yAxisId={series.key}
                dot={false}
                activeDot={{ r: 6 }}
              />
            ))}

            {/* Render ReferenceArea for highlight */}
            {highlightedBounds && (
              <ReferenceArea
                x1={highlightedBounds.x1}
                x2={highlightedBounds.x2}
                stroke="none"
                fill="var(--chart-color-20)"
                fillOpacity={0.2}
                ifOverflow="hidden"
              />
            )}

            {/* Brush must be last */}
            <Brush
              dataKey={xAxisType}
              height={20}
              stroke="var(--chart-color-7)"
              tickFormatter={
                xAxisType === 'time' ? formatXAxisTime : formatXAxisDistance
              }
              //y={350} // Adjust this Y value as needed
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
