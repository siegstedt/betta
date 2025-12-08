'use client';

import { useMemo } from 'react';
import {
  DailyPerformanceMetric,
  RechartsTooltipProps,
} from '@/lib/definitions';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';

const CustomPMCTooltip = ({ active, payload, label }: RechartsTooltipProps) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload as DailyPerformanceMetric;
    const date = new Date(label as number).toLocaleDateString();

    return (
      <div className="p-3 bg-popover text-popover-foreground rounded-lg shadow-lg border border-border text-sm">
        <p className="mb-2 font-semibold">{date}</p>
        {data.tss != null && (
          <p>
            <strong style={{ color: 'var(--chart-color-1)' }}>TSS:</strong>{' '}
            {Math.round(data.tss)}
          </p>
        )}
        {data.if_avg != null && (
          <p>
            <strong style={{ color: 'var(--chart-color-2)' }}>IF:</strong>{' '}
            {data.if_avg.toFixed(2)}
          </p>
        )}
        <p>
          <strong style={{ color: 'var(--chart-color-3)' }}>
            Fitness (CTL):
          </strong>{' '}
          {Math.round(data.ctl)}
        </p>
        <p>
          <strong style={{ color: 'var(--chart-color-4)' }}>
            Fatigue (ATL):
          </strong>{' '}
          {Math.round(data.atl)}
        </p>
        <p>
          <strong style={{ color: 'var(--chart-color-5)' }}>Form (TSB):</strong>{' '}
          {Math.round(data.tsb)}
        </p>
      </div>
    );
  }
  return null;
};

type ChartDataPoint = DailyPerformanceMetric & {
  date: number;
  tss_dot: number | null;
  if_dot: number | null;
};

const getXAxisTicks = (data: ChartDataPoint[]) => {
  if (!data || data.length <= 1) return data.map((d) => d.date);
  const dates = data.map((d) => d.date);
  const numDataPoints = dates.length;
  const maxLabels = 10;
  if (numDataPoints <= maxLabels) return dates;
  const ticks = new Set<number>();
  const step = (numDataPoints - 1) / (maxLabels - 1);
  for (let i = 0; i < maxLabels; i++) {
    ticks.add(dates[Math.round(i * step)]);
  }
  return Array.from(ticks);
};

interface PerformanceManagementChartProps {
  data: DailyPerformanceMetric[];
}

export default function PerformanceManagementChart({
  data,
}: PerformanceManagementChartProps) {
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return [];
    return data.map((metric) => ({
      ...metric,
      date: new Date(metric.date).getTime(),
      tss_dot: metric.tss,
      if_dot: metric.if_avg,
    }));
  }, [data]);

  const { yDomainForm, yDomainFit, yDomainTss, yDomainIf } = useMemo(() => {
    if (!chartData || chartData.length === 0) {
      return {
        yDomainForm: [-50, 50],
        yDomainFit: [0, 100],
        yDomainTss: [0, 200],
        yDomainIf: [0, 2],
      };
    }

    let minForm = 0,
      maxForm = 0;
    let minFit = 0,
      maxFit = 0;
    let maxTss = 0,
      maxIf = 0;

    chartData.forEach((d) => {
      // Domain for Form (TSB) and Fatigue (ATL)
      const currentMinForm = Math.min(d.tsb, d.atl);
      const currentMaxForm = Math.max(d.tsb, d.atl);
      if (currentMinForm < minForm) minForm = currentMinForm;
      if (currentMaxForm > maxForm) maxForm = currentMaxForm;

      // Domain for Fitness (CTL)
      if (d.ctl < minFit) minFit = d.ctl;
      if (d.ctl > maxFit) maxFit = d.ctl;

      // Domain for TSS
      if (d.tss_dot != null && d.tss_dot > maxTss) maxTss = d.tss_dot;

      // Domain for IF
      if (d.if_dot != null && d.if_dot > maxIf) maxIf = d.if_dot;
    });
    const domainForm = [
      minForm > 0 ? -10 : Math.floor(minForm / 5) * 5,
      maxForm < 0 ? 10 : Math.ceil(maxForm / 5) * 5,
    ];
    const domainFit = [
      minFit >= 0 ? 0 : Math.floor(minFit / 5) * 5,
      Math.ceil(maxFit / 1.25) * 1.25,
    ];
    const domainTss = [0, Math.ceil(maxTss / 10) * 10 + 5];
    const domainIf = [0, Math.max(1, Math.ceil(maxIf * 5) / 5)];

    return {
      yDomainForm: domainForm,
      yDomainFit: domainFit,
      yDomainTss: domainTss,
      yDomainIf: domainIf,
    };
  }, [chartData]);

  const xAxisTicks = useMemo(() => getXAxisTicks(chartData), [chartData]);

  if (!chartData || chartData.length === 0) {
    return (
      <p className="text-sm text-gray-500">
        Not enough data to generate Performance Management Chart.
      </p>
    );
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayTimestamp = today.getTime();

  return (
    <ResponsiveContainer width="100%" height={500}>
      <LineChart
        data={chartData}
        margin={{ top: 5, right: 30, left: 30, bottom: 5 }}
      >
        <CartesianGrid
          stroke="hsl(var(--chart-grid))"
          strokeOpacity={0.2}
          vertical={false}
          horizontal={true}
        />
        <XAxis
          dataKey="date"
          type="number"
          domain={['dataMin', 'dataMax']}
          tickFormatter={(unixTime) => new Date(unixTime).toLocaleDateString()}
          ticks={xAxisTicks}
          interval={0}
          tick={{ fontSize: '0.75rem' }}
        />

        <YAxis
          yAxisId="fitness"
          orientation="left"
          domain={yDomainFit}
          label={{
            angle: -90,
            position: 'insideLeft',
            style: { fontSize: '0.875rem', fill: 'currentColor' },
          }}
          tick={{ fontSize: '0.75rem' }}
        />
        <YAxis
          yAxisId="tss"
          orientation="left"
          domain={yDomainTss}
          stroke="var(--chart-color-1)"
          label={{
            value: 'TSS',
            angle: -90,
            position: 'insideLeft',
            style: { fontSize: '0.875rem', fill: 'var(--chart-color-1)' },
          }}
          tick={{ fontSize: '0.75rem' }}
        />
        <YAxis
          yAxisId="form"
          orientation="right"
          domain={yDomainForm}
          label={{
            angle: 90,
            position: 'insideRight',
            style: { fontSize: '0.875rem', fill: 'currentColor' },
          }}
          tick={{ fontSize: '0.75rem' }}
        />
        <YAxis
          yAxisId="if"
          orientation="right"
          domain={yDomainIf}
          stroke="var(--chart-color-2)"
          label={{
            value: 'IF',
            angle: 90,
            position: 'insideRight',
            style: { fontSize: '0.875rem', fill: 'var(--chart-color-2)' },
          }}
          tick={{ fontSize: '0.75rem' }}
        />

        <Tooltip content={<CustomPMCTooltip />} />

        <ReferenceLine
          yAxisId="form"
          x={todayTimestamp}
          stroke="hsl(var(--foreground))"
          strokeOpacity={0.5}
          strokeDasharray="3 3"
          label={{
            value: 'Today',
            position: 'insideTop',
            fill: 'hsl(var(--foreground))',
            fillOpacity: 0.7,
          }}
        />

        <Line
          yAxisId="if"
          type="monotone"
          dataKey="if_dot"
          name="IF"
          stroke="var(--chart-color-2)"
          strokeWidth={0}
          dot={{ r: 3 }}
          fill="var(--chart-color-2)"
        />
        <Line
          yAxisId="tss"
          type="monotone"
          dataKey="tss_dot"
          name="TSS"
          stroke="var(--chart-color-1)"
          strokeWidth={0}
          dot={{ r: 3 }}
          fill="var(--chart-color-1)"
        />

        <Line
          yAxisId="fitness"
          type="monotone"
          dataKey="ctl"
          name="Fitness (CTL)"
          stroke="var(--chart-color-3)"
          strokeWidth={2}
          dot={{ r: 1 }}
        />
        <Line
          yAxisId="form"
          type="monotone"
          dataKey="atl"
          name="Fatigue (ATL)"
          stroke="var(--chart-color-4)"
          strokeWidth={2}
          dot={{ r: 1 }}
        />
        <Line
          yAxisId="form"
          type="monotone"
          dataKey="tsb"
          name="Form (TSB)"
          stroke="var(--chart-color-5)"
          strokeWidth={2}
          dot={{ r: 1 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
