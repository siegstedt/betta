'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Activity } from '@/lib/definitions';
import { config } from '@/lib/config';
import { BestEffortsTable } from '@/components';

const API_URL = config.apiUrl;

export default function BestEffortsPage() {
  const params = useParams();
  const activityId = params.id as string;
  const [activity, setActivity] = useState<Activity | null>(null);
  const [athleteWeight, setAthleteWeight] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!activityId) return;
    const fetchData = async () => {
      setLoading(true);
      try {
        const activityRes = await fetch(`${API_URL}/activity/${activityId}`);
        if (!activityRes.ok) throw new Error('Failed to fetch activity data');
        const activityData: Activity = await activityRes.json();
        setActivity(activityData);

        const weightResponse = await fetch(
          `${API_URL}/athlete/${activityData.athlete_id}/weight-at-date?date=${activityData.start_time}`
        );
        if (weightResponse.ok) {
          setAthleteWeight(await weightResponse.json());
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
    return <div className="p-8 text-center">Loading Best Efforts...</div>;
  if (error)
    return <div className="p-8 text-center text-red-500">Error: {error}</div>;
  if (!activity)
    return <div className="p-8 text-center">Activity data not found.</div>;

  return <BestEffortsTable activity={activity} weight={athleteWeight} />;
}
