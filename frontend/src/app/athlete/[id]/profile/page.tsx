'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Athlete, PotentialPerformanceMarker } from '@/lib/definitions';
import { config } from '@/lib/config';
import Link from 'next/link';
import { Button, DataTable, TableCard } from '@/components/ui';

// The backend API URL from environment configuration
const API_URL = config.apiUrl;

export default function ProfilePage() {
  const params = useParams();
  const athleteId = params.id as string;
  const [athlete, setAthlete] = useState<Athlete | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [potentialMarkers, setPotentialMarkers] = useState<
    PotentialPerformanceMarker[]
  >([]);

  const fetchAthlete = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_URL}/athlete/${athleteId}`);
      if (response.ok) {
        const data: Athlete = await response.json();
        setAthlete(data);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to fetch athlete data.');
      }
      // Also fetch potential markers
      const markersRes = await fetch(
        `${API_URL}/athlete/${athleteId}/potential-markers`
      );
      if (markersRes.ok) {
        setPotentialMarkers(await markersRes.json());
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'An unknown error occurred.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (athleteId) {
      fetchAthlete();
    }
  }, [athleteId]);

  if (loading) {
    return <div className="p-8 text-center">Loading profile...</div>;
  }

  if (error) {
    return <div className="p-8 text-center text-red-500">Error: {error}</div>;
  }

  if (!athlete) {
    return <div className="p-8 text-center">Athlete not found.</div>;
  }

  const sortedMetrics =
    athlete.metrics.sort(
      (a, b) =>
        new Date(b.date_established).getTime() -
        new Date(a.date_established).getTime()
    ) || [];
  const sortedActivities = (athlete.activities || []).sort(
    (a, b) =>
      new Date(b.start_time).getTime() - new Date(a.start_time).getTime()
  );

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl font-semibold tracking-tight mb-6 text-foreground">
          Athlete Profile
        </h1>

        {/* Athlete Header */}
        <div className="bg-card rounded-lg p-6 mb-6 border">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center overflow-hidden">
              {athlete.profile_picture_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={`${API_URL}${athlete.profile_picture_url}`}
                  alt={`${athlete.first_name} ${athlete.last_name}`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-xl text-gray-500">
                  {athlete.first_name?.[0]}
                  {athlete.last_name?.[0]}
                </span>
              )}
            </div>
            <div>
              <h2 className="text-xl font-semibold">
                {athlete.first_name} {athlete.last_name}
              </h2>
              {athlete.date_of_birth && (
                <p className="text-muted-foreground">
                  Born {new Date(athlete.date_of_birth).toLocaleDateString()}
                </p>
              )}
            </div>
            <div className="ml-auto">
              <Link href={`/athlete/${athleteId}/settings`}>
                <Button variant="outline">Edit Profile</Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Potential Markers Notification */}
        {potentialMarkers.map((marker) => (
          <div
            key={marker.id}
            className="bg-yellow-100 dark:bg-yellow-900/50 border-l-4 border-yellow-500 text-yellow-800 dark:text-yellow-200 p-4 rounded-r-lg mb-6 shadow"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="font-bold">
                  💡 New {marker.metric_type.toUpperCase()} Detected!
                </p>
                <p className="text-sm">
                  Based on your activity on{' '}
                  {new Date(marker.date_detected).toLocaleDateString()}, we
                  estimate your {marker.metric_type.toUpperCase()} is now
                  <strong className="mx-1">{Math.round(marker.value)}</strong>
                  {marker.metric_type === 'ftp' ? 'W' : 'bpm'}.
                </p>
              </div>
              <div className="text-sm text-muted-foreground">
                Visit Settings to update your metrics.
              </div>
            </div>
          </div>
        ))}

        <div className="space-y-8">
          <TableCard title="Metrics History">
            <DataTable
              columns={[
                {
                  key: 'date_established',
                  header: 'Date',
                  className: 'font-medium',
                  render: (value) =>
                    new Date(value as string).toLocaleDateString(),
                },
                {
                  key: 'metric_type',
                  header: 'Type',
                  className: 'capitalize',
                },
                {
                  key: 'value',
                  header: 'Value',
                  render: (value, metric) => {
                    const ageInWeeks =
                      (new Date().getTime() -
                        new Date(metric.date_established).getTime()) /
                      (1000 * 60 * 60 * 24 * 7);
                    const isStale = ageInWeeks > 6;
                    return (
                      <div className="flex items-center">
                        {value as string}
                        {metric.metric_type === 'ftp' ? 'w' : ''}
                        {metric.metric_type === 'weight' ? ' kg' : ''}
                        {isStale && metric.metric_type !== 'weight' && (
                          <span
                            className="ml-2 text-orange-500"
                            title="This value is over 6 weeks old and may be stale."
                          >
                            ⚠️
                          </span>
                        )}
                      </div>
                    );
                  },
                },
              ]}
              data={sortedMetrics}
              keyExtractor={(metric) => metric.metric_id}
              emptyMessage="No metrics logged yet."
            />
          </TableCard>

          {/* Activity Log Card */}
          <TableCard
            title="Recent Activities"
            actions={
              <>
                <Button variant="link" asChild>
                  <Link href={`/athlete/${athleteId}/activities`}>
                    View All
                  </Link>
                </Button>
                <Button asChild>
                  <Link href={`/athlete/${athleteId}/activity/new`}>
                    Add Activity
                  </Link>
                </Button>
              </>
            }
          >
            <DataTable
              columns={[
                {
                  key: 'start_time',
                  header: 'Date',
                  className: 'font-medium',
                  render: (value) =>
                    new Date(value as string).toLocaleDateString(),
                },
                {
                  key: 'name',
                  header: 'Name',
                  className: 'font-medium',
                  render: (value, activity) => (
                    <Link
                      href={`/activity/${activity.activity_id}`}
                      className="text-indigo-600 hover:text-indigo-900"
                    >
                      {value as string}
                    </Link>
                  ),
                },
              ]}
              data={sortedActivities}
              keyExtractor={(activity) => activity.activity_id ?? 0}
              emptyMessage="No activities logged yet."
            />
          </TableCard>
        </div>
      </div>
    </div>
  );
}
