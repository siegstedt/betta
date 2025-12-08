'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Athlete, AthleteMetric } from '@/lib/definitions';
import { config } from '@/lib/config';
import { useError } from '@/contexts/ErrorContext';
import { ErrorMessage, LoadingSpinner } from '@/components/ui';
import { Header } from '@/components/layout';

const API_URL = config.apiUrl;

export default function Home() {
  const router = useRouter();
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { showError } = useError();

  const fetchAthletes = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_URL}/athletes`);
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Athlete roster not found. Please check the server.');
        } else if (response.status >= 500) {
          throw new Error('Server error. Please try again later.');
        } else {
          throw new Error('Failed to load athletes. Check your connection.');
        }
      }
      const data: Athlete[] = await response.json();
      setAthletes(data);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : 'An unexpected error occurred while loading athletes.';
      setError(message);
      showError(message, { label: 'Retry', onClick: fetchAthletes });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAthletes();
  }, []);

  return (
    <main className="min-h-screen">
      <Header />

      {/* Content */}
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold tracking-tight">
            Athlete Roster
          </h2>
          <Link
            href="/athlete/new"
            className="inline-block bg-primary text-primary-foreground hover:bg-primary/90 font-bold py-2 px-4 rounded-md"
          >
            Create New Athlete
          </Link>
        </div>
        {loading && (
          <LoadingSpinner text="Loading athletes..." className="py-8" />
        )}
        {error && (
          <ErrorMessage
            message={error}
            onRetry={fetchAthletes}
            className="mb-6"
          />
        )}

        {!loading && !error && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {athletes.length > 0 ? (
              athletes.map((athlete) => {
                // Extract latest metrics
                const latestMetrics = athlete.metrics
                  .sort(
                    (a, b) =>
                      new Date(b.date_established).getTime() -
                      new Date(a.date_established).getTime()
                  )
                  .reduce(
                    (acc, metric) => {
                      if (!acc[metric.metric_type])
                        acc[metric.metric_type] = metric;
                      return acc;
                    },
                    {} as Record<string, AthleteMetric>
                  );

                // Get last activity
                const lastActivity = athlete.activities.sort(
                  (a, b) =>
                    new Date(b.start_time).getTime() -
                    new Date(a.start_time).getTime()
                )[0];

                return (
                  <div
                    key={athlete.athlete_id}
                    className="bg-card text-card-foreground rounded-lg shadow-md hover:shadow-lg transition-shadow hover:ring-2 hover:ring-primary overflow-hidden"
                  >
                    {/* Upper: Profile Picture */}
                    <Link href={`/athlete/${athlete.athlete_id}/profile`}>
                      <div className="aspect-[3/2] bg-muted flex items-center justify-center cursor-pointer">
                        {athlete.profile_picture_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={`${API_URL}${athlete.profile_picture_url}`}
                            alt={`${athlete.first_name} ${athlete.last_name}`}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="text-2xl font-semibold text-primary">
                              {athlete.first_name?.[0]}
                              {athlete.last_name?.[0]}
                            </span>
                          </div>
                        )}
                      </div>
                    </Link>

                    {/* Lower: Athlete Info */}
                    <div className="p-4 space-y-3">
                      <Link href={`/athlete/${athlete.athlete_id}/profile`}>
                        <h3 className="text-lg font-semibold truncate cursor-pointer hover:text-primary">
                          {athlete.first_name} {athlete.last_name}
                        </h3>
                      </Link>

                      {/* Current Form Metrics */}
                      <div
                        className="space-y-1 cursor-pointer"
                        onClick={() =>
                          router.push(
                            `/athlete/${athlete.athlete_id}/performance`
                          )
                        }
                      >
                        {latestMetrics.ftp || latestMetrics.thr ? (
                          <div className="text-sm text-muted-foreground hover:text-foreground">
                            {latestMetrics.ftp && (
                              <span>
                                FTP: {Math.round(latestMetrics.ftp.value)}W
                              </span>
                            )}
                            {latestMetrics.ftp && latestMetrics.thr && (
                              <span> • </span>
                            )}
                            {latestMetrics.thr && (
                              <span>
                                LTHR: {Math.round(latestMetrics.thr.value)}bpm
                              </span>
                            )}
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground">
                            No metrics recorded
                          </p>
                        )}
                      </div>

                      {/* Last Activity */}
                      <div
                        className="cursor-pointer"
                        onClick={() =>
                          router.push(
                            `/athlete/${athlete.athlete_id}/activities`
                          )
                        }
                      >
                        {lastActivity ? (
                          <p className="text-sm text-muted-foreground hover:text-foreground">
                            Last: {lastActivity.sport || 'Activity'} on{' '}
                            {new Date(
                              lastActivity.start_time
                            ).toLocaleDateString()}
                          </p>
                        ) : (
                          <p className="text-sm text-muted-foreground">
                            No activities logged
                          </p>
                        )}
                      </div>

                      {/* Upcoming Goal Placeholder */}
                      <div className="flex items-center text-sm text-muted-foreground">
                        <span className="mr-2">🎯</span>
                        <span>No upcoming events</span>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="col-span-full text-center text-muted-foreground">
                No athletes found. Create one to get started.
              </p>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
