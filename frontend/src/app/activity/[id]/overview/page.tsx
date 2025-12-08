'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Activity } from '@/lib/definitions';
import { config } from '@/lib/config';
import { LatLngExpression } from 'leaflet';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui';
import dynamic from 'next/dynamic';
import {
  ActivityOverviewSummary,
  ActivityEffort,
  ActivityEquipment,
} from '@/components/activity';

const API_URL = config.apiUrl;

const ActivityMap = dynamic(
  () => import('@/components/activity/activity-map'),
  {
    ssr: false,
    loading: () => (
      <div className="h-96 bg-muted rounded-lg flex items-center justify-center text-muted-foreground">
        Loading Map...
      </div>
    ),
  }
);

const ActivityChart = dynamic(
  () => import('@/components/activity/activity-chart'),
  {
    ssr: false,
    loading: () => (
      <div className="h-96 bg-card rounded-lg flex items-center justify-center">
        <p>Loading Chart...</p>
      </div>
    ),
  }
);

export default function OverviewPage() {
  const params = useParams();
  const activityId = params.id as string;
  const [activity, setActivity] = useState<Activity | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!activityId) return;
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_URL}/activity/${activityId}`);
        if (!res.ok) throw new Error('Failed to fetch activity data');
        setActivity(await res.json());
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [activityId]);

  if (loading)
    return (
      <div className="p-8 text-center text-muted-foreground">
        Loading Overview...
      </div>
    );
  if (error)
    return (
      <div className="p-8 text-center text-destructive">Error: {error}</div>
    );
  if (!activity)
    return <div className="p-8 text-center">Activity data not found.</div>;

  const gpsTrack: LatLngExpression[] = activity.records
    .filter((r) => r.latitude != null && r.longitude != null)
    .map((r) => [r.latitude!, r.longitude!]);

  const hasGpsData = gpsTrack.length > 0;

  return (
    <div className="space-y-8">
      {/* Top section: Map and Summary/Effort column */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column: Map */}
        <div className="min-h-[400px]">
          {hasGpsData ? (
            <div className="h-full rounded-lg overflow-hidden shadow-lg">
              <ActivityMap activityId={activityId} track={gpsTrack} />
            </div>
          ) : (
            <div className="h-full rounded-lg bg-muted flex items-center justify-center text-muted-foreground">
              No GPS data available for this activity.
            </div>
          )}
        </div>
        {/* Right Column: Summary and Effort */}
        <Card className="flex flex-col">
          <ActivityOverviewSummary activity={activity} />
          <hr className="mx-6 border-border" />
          <ActivityEquipment activity={activity} />
          <hr className="mx-6 border-border" />
          <ActivityEffort activity={activity} />
        </Card>
      </div>
      {/* Bottom section: Analysis Chart */}
      <Card id="analysis-chart" className="scroll-mt-20">
        <CardHeader className="pb-2">
          <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Activity Analysis
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <ActivityChart activity={activity} />
        </CardContent>
      </Card>
    </div>
  );
}
