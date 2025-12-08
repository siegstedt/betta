'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Activity, DailyAggregate } from '@/lib/definitions';
import { DailyWorkloadChart } from '@/components/charts';
import { CardContent, CardHeader, CardTitle, Button } from '@/components/ui';
import Link from 'next/link';

export default function ActivityEffort({ activity }: { activity: Activity }) {
  const [chartError, setChartError] = useState<string | null>(null);
  const [dailyWorkloadData, setDailyWorkloadData] = useState<
    DailyAggregate[] | null
  >(null);
  const [isLoadingDailyChart, setIsLoadingDailyChart] = useState(false);

  useEffect(() => {
    if (!activity || !activity.unified_training_load) return;
    const metric = 'utl'; // Always use Unified Training Load

    const fetchDailyWorkloadData = async () => {
      setIsLoadingDailyChart(true);
      setChartError(null);
      try {
        const activityDate = new Date(activity.start_time);
        const dayOfWeek = activityDate.getDay(); // 0 for Sunday, 1 for Monday
        const diff =
          activityDate.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); // Adjust for Sunday
        const weekStartDate = new Date(activityDate.setDate(diff));
        const formattedWeekStartDate = format(weekStartDate, 'yyyy-MM-dd');

        const response = await fetch(
          `http://localhost:8000/athlete/${activity.athlete_id}/daily-workload-for-week?metric=${metric}&week_start_date=${formattedWeekStartDate}`
        );
        if (!response.ok) {
          throw new Error('Failed to load daily breakdown data.');
        }
        const data = await response.json();
        setDailyWorkloadData(data);
      } catch (err) {
        setChartError(
          err instanceof Error ? err.message : 'An unknown error occurred.'
        );
      } finally {
        setIsLoadingDailyChart(false);
      }
    };

    fetchDailyWorkloadData();
  }, [activity]);

  if (!activity.unified_training_load) {
    return null; // Don't render the component if there's no effort data
  }

  // Determine the week start date for the current activity
  const activityDate = new Date(activity.start_time);
  const dayOfWeek = activityDate.getDay(); // 0 for Sunday, 1 for Monday
  const diff = activityDate.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); // Adjust for Sunday
  const activityWeekStartDate = format(
    new Date(activityDate.setDate(diff)),
    'yyyy-MM-dd'
  );
  const activityWeekEndDate = format(
    new Date(activityDate.setDate(diff + 6)),
    'yyyy-MM-dd'
  );

  // Determine the day of the week for the current activity (for highlighting)
  const highlightedDay = format(new Date(activity.start_time), 'yyyy-MM-dd');

  return (
    <>
      <CardHeader className="pb-2">
        <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Training Load: {format(new Date(activityWeekStartDate), 'MMM dd')} -{' '}
          {format(new Date(activityWeekEndDate), 'MMM dd')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="pt-2 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          {/* Left Column: Chart */}
          <div>
            <div className="space-y-6">
              {/* Daily Breakdown Chart */}
              <div>
                {isLoadingDailyChart && (
                  <div className="h-48 flex items-center justify-center bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground">
                      Loading Daily Breakdown...
                    </p>
                  </div>
                )}
                {chartError && (
                  <div className="h-48 flex items-center justify-center bg-destructive/10 rounded-lg">
                    <p className="text-sm text-destructive">{chartError}</p>
                  </div>
                )}
                {dailyWorkloadData ? (
                  <DailyWorkloadChart
                    data={dailyWorkloadData}
                    metricLabel="Training Load"
                    weekStartDate={activityWeekStartDate}
                    highlightedDate={highlightedDay}
                  />
                ) : (
                  !isLoadingDailyChart && (
                    <div className="h-48 flex items-center justify-center bg-muted rounded-lg">
                      <p className="text-sm text-muted-foreground">
                        No daily data for this week.
                      </p>
                    </div>
                  )
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Text Info */}
          <div className="space-y-4 text-center md:text-left">
            <div>
              <p className="text-xl font-medium tracking-tight">
                {Math.round(activity.unified_training_load)}
              </p>
              <p className="mt-1 text-xs font-small text-muted-foreground">
                Today&apos;s Training Load
              </p>
              <Button
                variant="link"
                size="sm"
                asChild
                className="h-auto p-0 text-xs"
              >
                <Link href={`/athlete/${activity.athlete_id}/activities`}>
                  View the full training log.
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </>
  );
}
