'use client';

import React, { useMemo } from 'react';
import {
  ZoneAnalysisData,
  Activity,
  RechartsTooltipProps,
  RechartsTickProps,
  RechartsBarLabelProps,
  ZoneDetails,
} from '@/lib/definitions';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { formatDuration } from '@/lib/formatters';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui';

const POWER_ZONE_DETAILS: Record<
  string,
  { name: string; range: string; purpose: string }
> = {
  'Zone 1: Active Recovery': {
    name: 'Active Recovery',
    range: '< 55% of FTP',
    purpose: 'Promotes blood flow and aids recovery with minimal stress.',
  },
  'Zone 2: Endurance': {
    name: 'Endurance',
    range: '56-75% of FTP',
    purpose: 'The "all-day" pace. Builds aerobic base and fatigue resistance.',
  },
  'Zone 3: Tempo': {
    name: 'Tempo',
    range: '76-90% of FTP',
    purpose: 'A challenging aerobic pace that improves cruising speed.',
  },
  'Zone 4: Threshold': {
    name: 'Lactate Threshold',
    range: '91-105% of FTP',
    purpose:
      'The "sweet spot" of training. Directly stresses and raises your FTP.',
  },
  'Zone 5: VO2 Max': {
    name: 'VO2 Max',
    range: '106-120% of FTP',
    purpose: 'Improves maximal oxygen uptake; for short, intense intervals.',
  },
  'Zone 6: Anaerobic': {
    name: 'Anaerobic Capacity',
    range: '121-150% of FTP',
    purpose: 'Develops ability to handle very high-intensity, short efforts.',
  },
  'Zone 7: Neuromuscular': {
    name: 'Neuromuscular',
    range: '> 150% of FTP',
    purpose: 'For very short, maximal sprints to improve top-end power.',
  },
};
const HR_ZONE_DETAILS: Record<
  string,
  { name: string; range: string; purpose: string }
> = {
  'Zone 1: Recovery': {
    name: 'Recovery',
    range: '< 85% of LTHR',
    purpose:
      'Very light effort, for recovery between hard intervals or easy days.',
  },
  'Zone 2: Aerobic': {
    name: 'Aerobic',
    range: '85-89% of LTHR',
    purpose:
      'Builds aerobic endurance and base fitness. Your main endurance zone.',
  },
  'Zone 3: Tempo': {
    name: 'Tempo',
    range: '90-93% of LTHR',
    purpose: 'A sustained, challenging effort that improves aerobic fitness.',
  },
  'Zone 4: Sub-Threshold': {
    name: 'Sub-Threshold',
    range: '94-99% of LTHR',
    purpose: 'Corresponds to threshold training, directly improving your LTHR.',
  },
  'Zone 5: Super-Threshold (VO2 Max)': {
    name: 'Super-Threshold (VO2 Max)',
    range: '100-106% of LTHR',
    purpose: 'Corresponds to VO2 Max efforts to increase aerobic power.',
  },
  'Zone 6: Anaerobic Capacity': {
    name: 'Anaerobic Capacity',
    range: '> 106% of LTHR',
    purpose:
      'For short, maximal efforts (30s to 2min). HR is not a good guide for intensity during the interval due to lag.',
  },
};
const POWER_ZONE_DEFINITIONS = {
  'Zone 1: Active Recovery': 0.55,
  'Zone 2: Endurance': 0.76,
  'Zone 3: Tempo': 0.91,
  'Zone 4: Threshold': 1.06,
  'Zone 5: VO2 Max': 1.21,
  'Zone 6: Anaerobic': 1.51,
  'Zone 7: Neuromuscular': Infinity,
};
const HR_ZONE_DEFINITIONS = {
  'Zone 1: Recovery': 0.85,
  'Zone 2: Aerobic': 0.9,
  'Zone 3: Tempo': 0.94,
  'Zone 4: Sub-Threshold': 1,
  'Zone 5: Super-Threshold (VO2 Max)': 1.06,
  'Zone 6: Anaerobic Capacity': Infinity,
};
const CustomZoneTooltip = ({
  active,
  payload,
  details,
}: RechartsTooltipProps & { details: ZoneDetails }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload as {
      name: string;
      fullName: string;
      time: number;
    };
    const zoneDetails = details[data.fullName];
    return (
      <div
        className="p-3 rounded-lg shadow-lg border"
        style={{
          minWidth: '250px',
          backgroundColor: 'hsl(var(--chart-tooltip-bg))',
          borderColor: 'hsl(var(--chart-tooltip-border))',
          color: 'hsl(var(--chart-tooltip-text))',
        }}
      >
        <p className="font-bold">{data.fullName}</p>
        <p className="text-sm text-gray-300">{zoneDetails?.range}</p>
        <p className="mt-2 text-xs">{zoneDetails?.purpose}</p>
      </div>
    );
  }
  return null;
};
const ZONE_COLORS = [
  'var(--chart-color-11)',
  'var(--chart-color-10)',
  'var(--chart-color-12)',
  'var(--chart-color-13)',
  'var(--chart-color-14)',
  'var(--chart-color-15)',
  'var(--chart-color-16)',
];
const CustomizedYAxisTick: React.FC<
  RechartsTickProps & {
    threshold?: number | null;
    definitions: Record<string, number>;
  }
> = (props) => {
  const { x, y, payload, threshold, definitions } = props;
  const zoneName = payload.value as string;
  const zoneKey = Object.keys(definitions).find((key) =>
    key.startsWith(zoneName)
  );
  let rangeText = '';
  if (zoneKey && threshold) {
    const zoneIndex = Object.keys(definitions).indexOf(zoneKey);
    const lowerBoundPct =
      zoneIndex > 0
        ? (Object.values(definitions) as number[])[zoneIndex - 1]
        : 0;
    const upperBoundPct = (Object.values(definitions) as number[])[zoneIndex];
    const lowerAbs = Math.round(lowerBoundPct * threshold);
    const upperAbs = Math.round(upperBoundPct * threshold);
    if (upperBoundPct === Infinity) {
      rangeText = `(> ${lowerAbs})`;
    } else {
      rangeText = `(${lowerAbs} - ${upperAbs})`;
    }
  }
  return (
    <g
      transform={`translate(${x},${y})`}
      className="text-gray-500 dark:text-gray-400"
    >
      <text
        x={0}
        y={0}
        dy={4}
        textAnchor="end"
        fill="currentColor"
        className="text-xs"
      >
        {`${zoneName.replace('Zone ', 'Z')} ${rangeText}`}
      </text>
    </g>
  );
};
const CustomizedBarLabel: React.FC<
  RechartsBarLabelProps & { totalTime: number }
> = (props) => {
  const { x, y, width, value, totalTime } = props;
  const percentage = totalTime > 0 ? ((value / totalTime) * 100).toFixed(0) : 0;
  const formattedTime = formatDuration(value);
  const labelText = `${percentage}% (${formattedTime})`;
  if (width < 80) {
    return (
      <text
        x={x + width + 5}
        y={y + 18}
        textAnchor="start"
        className="text-xs font-bold text-gray-600 dark:text-gray-400"
        fill="currentColor"
      >
        {labelText}
      </text>
    );
  }
  return (
    <text
      x={x + width - 5}
      y={y + 18}
      fill="white"
      textAnchor="end"
      className="text-xs font-bold"
    >
      {labelText}
    </text>
  );
};
const ZoneChart = ({
  data,
  totalTime,
  details,
  threshold,
  definitions,
}: {
  data: Record<string, number> | null;
  totalTime: number;
  details: ZoneDetails;
  threshold: number | null;
  definitions: Record<string, number>;
}) => {
  const chartData = useMemo(() => {
    if (!data) return [];
    return Object.entries(data)
      .map(([name, time]) => ({
        name: name.split(':')[0],
        fullName: name,
        time: time,
      }))
      .filter((d) => d.time > 0);
  }, [data]);
  if (!data || chartData.length === 0)
    return <p className="text-gray-500 text-sm">No time spent in any zones.</p>;
  return (
    <ResponsiveContainer width="100%" height={250}>
      <BarChart
        data={chartData}
        layout="vertical"
        margin={{ top: 5, right: 20, left: 30, bottom: 5 }}
      >
        <XAxis type="number" tickFormatter={(time) => formatDuration(time)} />
        <YAxis
          // @ts-expect-error Recharts provides tick props at runtime
          tick={
            <CustomizedYAxisTick
              threshold={threshold}
              definitions={definitions}
            />
          }
        />
        <Tooltip
          cursor={{ fill: 'rgba(100, 116, 139, 0.1)' }}
          content={<CustomZoneTooltip details={details} />}
        />
        <Bar dataKey="time">
          {chartData.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={ZONE_COLORS[index % ZONE_COLORS.length]}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
};

interface ZoneChartsProps {
  zones: ZoneAnalysisData | null;
  activity: Activity;
}

export default function ZoneCharts({ zones, activity }: ZoneChartsProps) {
  if (!zones)
    return (
      <p className="text-gray-500">
        Zone data is not available. Ensure FTP and LTHR are set for the athlete.
      </p>
    );
  const totalTime = activity.records.length;
  return (
    <div className="space-y-8">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Power Zones: Based on FTP ⚡️
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground mb-4">
            Power zones, as defined by Dr. Andrew Coggan, are the standard for
            power-based training. They are calculated as a percentage of your
            FTP. Functional Threshold Power (FTP) is the highest average power,
            measured in watts, that a cyclist can sustain for approximately one
            hour.{' '}
          </p>
          {zones.power_zones ? (
            <ZoneChart
              data={zones.power_zones}
              totalTime={totalTime}
              details={POWER_ZONE_DETAILS}
              threshold={zones.ftp}
              definitions={POWER_ZONE_DEFINITIONS}
            />
          ) : (
            <p className="text-muted-foreground text-sm">
              Not enough data to calculate power zones. Ensure FTP is set for
              the athlete.
            </p>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Heart Rate Zones: Based on LTHR ❤️‍🩹
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground mb-4">
            LTHR, or Lactate Threshold Heart Rate, is the heart rate at which
            lactate begins to accumulate in your bloodstream faster than your
            body can clear it. Using LTHR, as popularized by coach Joe Friel,
            provides a much more accurate reflection of physiological stress
            than using a percentage of a theoretical Max HR.
          </p>
          {zones.hr_zones ? (
            <ZoneChart
              data={zones.hr_zones}
              totalTime={totalTime}
              details={HR_ZONE_DETAILS}
              threshold={zones.lthr}
              definitions={HR_ZONE_DEFINITIONS}
            />
          ) : (
            <p className="text-muted-foreground text-sm">
              Not enough data to calculate heart rate zones. Ensure LTHR is set
              for the athlete.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
