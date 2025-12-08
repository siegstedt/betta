'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Activity, ZoneAnalysisData } from '@/lib/definitions';
import { config } from '@/lib/config';
import { ZoneCharts } from '@/components/charts';

const API_URL = config.apiUrl;

export default function ZonesPage() {
  const params = useParams();
  const activityId = params.id as string;
  const [activity, setActivity] = useState<Activity | null>(null);
  const [zoneData, setZoneData] = useState<ZoneAnalysisData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!activityId) return;
    const fetchData = async () => {
      setLoading(true);
      try {
        const activityRes = await fetch(`${API_URL}/activity/${activityId}`);
        if (!activityRes.ok) throw new Error('Failed to fetch activity data');
        setActivity(await activityRes.json());

        const zoneResponse = await fetch(
          `${API_URL}/activity/${activityId}/zone-analysis`
        );
        if (zoneResponse.ok) {
          setZoneData(await zoneResponse.json());
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [activityId]);

  if (loading)
    return <div className="p-8 text-center">Loading Zone Analysis...</div>;
  if (error)
    return <div className="p-8 text-center text-red-500">Error: {error}</div>;
  if (!activity)
    return <div className="p-8 text-center">Activity data not found.</div>;

  return <ZoneCharts zones={zoneData} activity={activity} />;
}
