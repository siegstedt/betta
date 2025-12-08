'use client';

import React, { useMemo } from 'react';
import { Activity, RechartsTickProps } from '@/lib/definitions';
import { calculatePowerDistribution, calculateMMP } from '@/lib/analysis';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  LineChart,
  Line,
  ReferenceLine,
  Label,
} from 'recharts';
import { formatDuration } from '@/lib/formatters';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui';

const CustomizedMMPTick: React.FC<RechartsTickProps> = (props) => {
  const { x, y, payload } = props;
  const duration = payload.value as number;
  const tickLabels: Record<
    number,
    { line1: string; line2: string; icon: string }
  > = {
    5: { line1: '5s', line2: 'N. Power', icon: '⚡️' },
    60: { line1: '1m', line2: 'Anaerobic', icon: '🔋' },
    300: { line1: '5m', line2: 'VO2 Max', icon: '🫁' },
    600: { line1: '10m', line2: 'Sustained', icon: '🧗' },
    1200: { line1: '20m', line2: 'Threshold', icon: '⏱️' },
    3600: { line1: '60m', line2: 'FTP', icon: '🗿' },
  };
  const tickInfo = tickLabels[duration];
  if (!tickInfo) return null;
  return (
    <g transform={`translate(${x},${y})`}>
      <text
        x={0}
        y={0}
        dy={16}
        textAnchor="middle"
        fill="currentColor"
        className="text-xs font-semibold text-gray-700 dark:text-gray-300"
      >
        {`${tickInfo.line1} ${tickInfo.icon}`}
      </text>
      <text
        x={0}
        y={0}
        dy={28}
        textAnchor="middle"
        fill="currentColor"
        className="text-[10px] text-gray-500 dark:text-gray-400"
      >
        {tickInfo.line2}
      </text>
    </g>
  );
};

interface PowerAnalysisProps {
  activity: Activity;
  currentFtp: number | null;
}

export default function PowerAnalysis({
  activity,
  currentFtp,
}: PowerAnalysisProps) {
  const binSize = 25;
  const mmpIntervals = [
    1, 5, 10, 15, 30, 60, 90, 120, 180, 240, 300, 360, 480, 600, 900, 1200,
    1800, 2700, 3600,
  ];
  const powerDistribution = useMemo(
    () => calculatePowerDistribution(activity.records, binSize),
    [activity.records]
  );
  const mmpCurve = useMemo(
    () => calculateMMP(activity.records, mmpIntervals),
    [activity.records]
  );
  if (
    !activity.records ||
    activity.records.filter((r) => r.power != null && r.power > 0).length === 0
  ) {
    return (
      <p className="text-gray-500">
        No power data available for this activity.
      </p>
    );
  }
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Power Distribution
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground mb-4">
            This histogram shows how many seconds were spent in {binSize}-watt
            increments. This is excellent for analyzing pacing strategy.
          </p>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={powerDistribution}
              margin={{ top: 5, right: 20, left: -10, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
              <XAxis dataKey="range" angle={-45} textAnchor="end" height={50} />
              <YAxis tickFormatter={(time) => formatDuration(time)} />
              <Tooltip
                formatter={(value) => [formatDuration(value as number), 'Time']}
                contentStyle={{
                  backgroundColor: 'rgba(31, 41, 55, 0.9)',
                  border: '1px solid #4B5563',
                  borderRadius: '0.5rem',
                }}
              />
              <Bar dataKey="time" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Power Curve (MMP)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground mb-4">
            An MMP curve plots the highest average power an athlete has achieved
            for every time duration. Key points on this curve define their Power
            Profile.
          </p>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart
              data={mmpCurve}
              margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
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
                contentStyle={{
                  backgroundColor: 'rgba(31, 41, 55, 0.9)',
                  border: '1px solid #4B5563',
                  borderRadius: '0.5rem',
                }}
              />
              {currentFtp && (
                <ReferenceLine
                  y={currentFtp}
                  stroke="lightblue"
                  strokeDasharray="3 3"
                >
                  <Label
                    value={`FTP: ${currentFtp}W`}
                    position="insideTopRight"
                    fill="lightblue"
                    fontSize={12}
                  />
                </ReferenceLine>
              )}
              <Line
                type="monotone"
                dataKey="power"
                stroke="#ff7300"
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 8 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
