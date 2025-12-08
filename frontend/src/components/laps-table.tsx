'use client';

import { ActivityLap } from '@/lib/definitions';
import { formatDuration } from '@/lib/formatters';
import { DataTable, TableCard, type Column } from '@/components/ui';

interface LapsTableProps {
  laps: ActivityLap[];
}

export default function LapsTable({ laps }: LapsTableProps) {
  const sortedLaps = [...(laps || [])].sort(
    (a, b) => a.lap_number - b.lap_number
  );

  const columns: Column<ActivityLap>[] = [
    {
      key: 'lap_number',
      header: 'Lap',
      className: 'font-medium',
    },
    {
      key: 'distance',
      header: 'Distance',
      render: (value) =>
        value ? `${((value as number) / 1000).toFixed(2)} km` : 'N/A',
    },
    {
      key: 'total_elevation_gain',
      header: 'Elevation',
      render: (value) => (value ? `${(value as number).toFixed(0)} m` : 'N/A'),
    },
    {
      key: 'duration',
      header: 'Time',
      render: (value) => formatDuration((value as number | null) ?? 0),
    },
    {
      key: 'average_power',
      header: 'Power',
      render: (value) => (value ? `${value} W` : 'N/A'),
    },
    {
      key: 'average_speed',
      header: 'Speed',
      render: (value) =>
        value ? `${((value as number) * 3.6).toFixed(1)} km/h` : 'N/A',
    },
    {
      key: 'average_cadence',
      header: 'Cadence',
      render: (value) => (value ? `${value} rpm` : 'N/A'),
    },
    {
      key: 'average_heart_rate',
      header: 'Heart Rate',
      render: (value) => (value ? `${value} bpm` : 'N/A'),
    },
  ];

  return (
    <TableCard title="Laps" contentClassName="p-0">
      <DataTable
        columns={columns}
        data={sortedLaps}
        keyExtractor={(row) => row.lap_id}
        emptyMessage="No lap data available for this activity."
      />
    </TableCard>
  );
}
