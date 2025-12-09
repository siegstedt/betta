'use client';

import { useState, useEffect } from 'react';
import { Athlete, ActivityWithAthlete } from '@/lib/definitions';
import { config } from '@/lib/config';
import { useError } from '@/contexts/ErrorContext';
import { ErrorMessage, LoadingSpinner } from '@/components/ui';
import { Header } from '@/components/layout';
import { ActivityFeed } from '@/components/activity-feed';
import { AthletePanel } from '@/components/athlete-panel';

const API_URL = config.apiUrl;

export default function Home() {
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [activities, setActivities] = useState<ActivityWithAthlete[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { showError } = useError();

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [athletesResponse, activitiesResponse] = await Promise.all([
        fetch(`${API_URL}/athletes`),
        fetch(`${API_URL}/activities/recent?limit=20`),
      ]);

      if (!athletesResponse.ok) {
        if (athletesResponse.status === 404) {
          throw new Error('Athlete roster not found. Please check the server.');
        } else if (athletesResponse.status >= 500) {
          throw new Error('Server error. Please try again later.');
        } else {
          throw new Error('Failed to load athletes. Check your connection.');
        }
      }

      if (!activitiesResponse.ok) {
        // Activities might fail if no data, but don't throw error
        console.warn('Failed to load recent activities');
      }

      const athletesData: Athlete[] = await athletesResponse.json();
      const activitiesData: ActivityWithAthlete[] = activitiesResponse.ok
        ? await activitiesResponse.json()
        : [];

      setAthletes(athletesData);
      setActivities(activitiesData);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : 'An unexpected error occurred while loading data.';
      setError(message);
      showError(message, { label: 'Retry', onClick: fetchData });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <main className="min-h-screen">
      <Header showAddAthlete />

      {/* Content */}
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {loading && (
            <LoadingSpinner text="Loading athletes..." className="py-8" />
          )}
          {error && (
            <ErrorMessage
              message={error}
              onRetry={fetchData}
              className="mb-6"
            />
          )}

          {!loading && !error && (
            <>
              {/* Activity Feed - Left Column */}
              <div className="lg:col-span-2">
                <ActivityFeed activities={activities} />
              </div>

              {/* Athlete Panel - Right Column */}
              <div className="lg:col-span-1">
                <AthletePanel
                  athletes={athletes.map((a) => ({
                    athlete_id: a.athlete_id,
                    first_name: a.first_name,
                    last_name: a.last_name,
                    profile_picture_url: a.profile_picture_url,
                  }))}
                />
              </div>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
