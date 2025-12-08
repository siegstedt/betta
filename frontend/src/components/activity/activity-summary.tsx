'use client';

import { Activity } from '@/lib/definitions';
import Link from 'next/link';
import { formatDuration } from '@/lib/formatters';
import { CardContent, CardHeader, CardTitle } from '@/components/ui';

// Helper function to format distance from meters to kilometers
const formatDistance = (meters: number | null | undefined) => {
  if (meters === null || meters === undefined) return null;
  return `${(meters / 1000).toFixed(2)} km`;
};

// Helper function to format elevation
const formatElevation = (meters: number | null | undefined) => {
  if (meters === null || meters === undefined) return null;
  return `${Math.round(meters)} m`;
};

// Helper function to format speed from m/s to km/h
const formatSpeed = (speed_ms: number | null | undefined) => {
  if (speed_ms === null || speed_ms === undefined) return null;
  return `${(speed_ms * 3.6).toFixed(1)} km/h`;
};

// Helper function to format work from kcal to kJ.
const formatWork = (kcal: number | null | undefined) => {
  if (kcal === null || kcal === undefined) return null;
  // In exercise physiology, the term "Calories" (kcal) on devices is often numerically
  // similar to the work done in kJ due to human metabolic efficiency (~20-25%).
  // For convention, we display the value as kJ.
  return `${Math.round(kcal)} kJ`;
};

interface StatCardProps {
  label: string;
  value: string | number | null;
  href?: string;
}

const SummaryStat = ({ label, value, href }: StatCardProps) => {
  if (value === null || value === undefined) {
    return null;
  }

  const content = (
    <div className="p-2 rounded-lg transition-colors group-hover:bg-accent">
      <p className="text-xs font-small text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-sm font-medium tracking-tight text-foreground">
        {value}
      </p>
    </div>
  );

  if (href) {
    // The group class on the Link allows the inner div to change style on hover
    return (
      <Link href={href} className="group block -m-2">
        {content}
      </Link>
    );
  }
  // Render with a wrapper for consistent spacing even when not linked
  return <div className="-m-2">{content}</div>;
};

export default function ActivityOverviewSummary({
  activity,
}: {
  activity: Activity;
}) {
  const {
    activity_id,
    total_moving_time,
    total_distance,
    total_elevation_gain,
    average_speed,
    average_power,
    total_calories,
    average_heart_rate,
  } = activity;

  const adjustedAverageSpeed = average_speed ?? null;
  const adjustedAveragePower = average_power ?? null;

  const zonesUrl = `/activity/${activity_id}/zones`;
  const analysisUrl = `/activity/${activity_id}/overview#analysis-chart`;

  return (
    <>
      <CardHeader className="pb-2">
        <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Summary
        </CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-x-4 gap-y-4">
        <SummaryStat
          href={analysisUrl}
          label="Time"
          value={total_moving_time ? formatDuration(total_moving_time) : null}
        />
        <SummaryStat
          href={analysisUrl}
          label="Distance"
          value={formatDistance(total_distance)}
        />
        <SummaryStat
          href={analysisUrl}
          label="Elevation"
          value={formatElevation(total_elevation_gain)}
        />
        <SummaryStat
          href={analysisUrl}
          label="Avg Speed"
          value={
            adjustedAverageSpeed ? formatSpeed(adjustedAverageSpeed) : null
          }
        />
        <SummaryStat
          href={zonesUrl}
          label="Avg Power"
          value={adjustedAveragePower ? `${adjustedAveragePower} W` : null}
        />
        <SummaryStat
          href={zonesUrl}
          label="Work"
          value={formatWork(total_calories)}
        />
        <SummaryStat
          href={zonesUrl}
          label="Avg HR"
          value={average_heart_rate ? `${average_heart_rate} bpm` : null}
        />
      </CardContent>
    </>
  );
}
