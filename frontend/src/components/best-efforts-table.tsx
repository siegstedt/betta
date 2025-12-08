'use client';

import { useMemo } from 'react';
import { Activity } from '@/lib/definitions';
import { calculateBestEfforts } from '@/lib/analysis';
import { DataTable, TableCard, type Column } from '@/components/ui';

interface BestEffort {
  interval: number;
  power: number;
  wattsPerKg?: number;
  avgHr: number;
  elevationGain: number;
}

interface BestEffortsTableProps {
  activity: Activity;
  weight: number | null;
}

export default function BestEffortsTable({
  activity,
  weight,
}: BestEffortsTableProps) {
  const bestEfforts = useMemo(
    () => calculateBestEfforts(activity.records, weight),
    [activity.records, weight]
  );

  const formatInterval = (seconds: number) => {
    if (seconds < 60) return `${seconds} sec`;
    return `${seconds / 60} min`;
  };

  const columns: Column<BestEffort>[] = [
    {
      key: 'interval',
      header: 'Time',
      render: (value) => formatInterval(value as number),
      className: 'font-medium',
    },
    {
      key: 'power',
      header: 'Power',
      render: (value) => `${value} W`,
      className: 'font-bold',
    },
    {
      key: 'wattsPerKg',
      header: 'W/kg',
      render: (value) => (value ? `${(value as number).toFixed(2)}` : 'N/A'),
    },
    {
      key: 'avgHr',
      header: 'Heart Rate',
      render: (value) => `${value} bpm`,
    },
    {
      key: 'elevationGain',
      header: 'Elev Gain',
      render: (value) => `${value} m`,
    },
  ];

  return (
    <TableCard title="Best Efforts" contentClassName="p-0">
      <DataTable
        columns={columns}
        data={bestEfforts as BestEffort[]}
        keyExtractor={(row) => row.interval}
        emptyMessage="Not enough power data to calculate best efforts."
      />
      <p className="mt-4 px-4 text-xs text-muted-foreground">
        Note: W/kg is calculated using the athlete&apos;s weight at the time of
        the activity. If no weight is logged, it will show N/A.
      </p>
    </TableCard>
  );
}
