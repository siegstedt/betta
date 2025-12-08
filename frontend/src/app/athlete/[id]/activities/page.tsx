'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import {
  Activity,
  ActivitySummary,
  WeeklyWorkload,
  VisualActivityLogResponse,
} from '@/lib/definitions';
import { config } from '@/lib/config';
import { WeeklyWorkloadChart } from '@/components/charts';
import { ControlBar } from '@/components/ui/control-bar';
import { WeeklyRow } from '@/components/ui/weekly-row';

const API_URL = config.apiUrl;

export default function ActivityLogPage() {
  const params = useParams();
  const athleteId = params.id as string; // Note: In Next.js 15, params is a Promise, but useParams returns resolved params

  const [activities, setActivities] = useState<Activity[]>([]);

  // State for visual activity log
  const [visualActivityLog, setVisualActivityLog] =
    useState<VisualActivityLogResponse | null>(null);
  const [loadingVisualLog, setLoadingVisualLog] = useState(true);
  const [errorVisualLog, setErrorVisualLog] = useState<string | null>(null);

  // State for weekly workload chart
  const [weeklyWorkload, setWeeklyWorkload] = useState<WeeklyWorkload | null>(
    null
  );
  const [loadingWeeklyWorkload, setLoadingWeeklyWorkload] = useState(true);
  const [errorWeeklyWorkload, setErrorWeeklyWorkload] = useState<string | null>(
    null
  );

  // Filter states
  const [metric, setMetric] = useState('unified_training_load');
  const [sportFilter, setSportFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  // Available filter options
  const [availableSports, setAvailableSports] = useState<string[]>([]);
  const [availableTypes, setAvailableTypes] = useState<string[]>([]);

  // Effect to populate available filter options from activities
  useEffect(() => {
    if (activities.length > 0) {
      const sports = [
        ...new Set(
          activities.map((a) => a.sport).filter((s): s is string => Boolean(s))
        ),
      ];
      const types = [
        ...new Set(
          activities
            .map((a) => a.ride_type)
            .filter((t): t is string => Boolean(t))
        ),
      ];
      setAvailableSports(sports);
      setAvailableTypes(types);
    }
  }, [activities]);

  const fetchActivities = useCallback(async () => {
    console.log('Fetching activities for athleteId:', athleteId);
    if (!athleteId) return;

    const query = new URLSearchParams({
      limit: '1000', // Fetch a large number for now, pagination can be added later
    });
    if (dateRange.start) query.append('start_date', dateRange.start);
    if (dateRange.end) query.append('end_date', dateRange.end);

    try {
      const response = await fetch(
        `${API_URL}/athlete/${athleteId}/activities?${query.toString()}`
      );
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Athlete not found or no activities available.');
        } else if (response.status >= 500) {
          throw new Error('Server error. Please try again later.');
        } else {
          throw new Error('Failed to load activities. Check your connection.');
        }
      }
      const activitiesData = await response.json();
      // Filter out activities with invalid IDs
      const validActivities = activitiesData.filter(
        (activity: ActivitySummary) =>
          activity.activity_id != null && activity.activity_id > 0
      );
      if (validActivities.length !== activitiesData.length) {
        console.warn(
          `Filtered out ${activitiesData.length - validActivities.length} activities with invalid IDs`
        );
      }
      setActivities(validActivities);
    } catch (err) {
      console.error('Error fetching activities:', err);
    }
  }, [athleteId, dateRange]);

  const fetchVisualActivityLog = useCallback(async () => {
    if (!athleteId) return;
    setLoadingVisualLog(true);
    setErrorVisualLog(null);

    const query = new URLSearchParams({
      metric,
      ...(sportFilter && { sport: sportFilter }),
      ...(typeFilter && { ride_type: typeFilter }),
      ...(dateRange.start && { start_date: dateRange.start }),
      ...(dateRange.end && { end_date: dateRange.end }),
    });

    try {
      const response = await fetch(
        `${API_URL}/athlete/${athleteId}/visual-activity-log?${query.toString()}`
      );
      if (!response.ok) {
        throw new Error('Failed to fetch visual activity log data.');
      }
      const data: VisualActivityLogResponse = await response.json();
      setVisualActivityLog(data);
    } catch (err) {
      setErrorVisualLog(
        err instanceof Error ? err.message : 'An unknown error occurred.'
      );
    } finally {
      setLoadingVisualLog(false);
    }
  }, [athleteId, metric, sportFilter, typeFilter, dateRange]);

  const fetchWeeklyWorkload = useCallback(async () => {
    if (!athleteId) return;
    setLoadingWeeklyWorkload(true);
    setErrorWeeklyWorkload(null);

    // Use endDate from filter if available, otherwise today. This sets the 'end' of the 12-week view.
    const activityDate =
      dateRange.end || new Date().toISOString().split('T')[0];
    const metric = 'utl'; // Use Unified Training Load for the log view

    try {
      const response = await fetch(
        `${API_URL}/athlete/${athleteId}/weekly-workload?metric=${metric}&activity_date=${activityDate}`
      );
      if (!response.ok) {
        throw new Error('Failed to fetch weekly workload data.');
      }
      const data: WeeklyWorkload = await response.json();
      setWeeklyWorkload(data);
    } catch (err) {
      setErrorWeeklyWorkload(
        err instanceof Error ? err.message : 'An unknown error occurred.'
      );
    } finally {
      setLoadingWeeklyWorkload(false);
    }
  }, [athleteId, dateRange.end]);

  useEffect(() => {
    fetchActivities();
    fetchVisualActivityLog();
    fetchWeeklyWorkload();
  }, [fetchActivities, fetchVisualActivityLog, fetchWeeklyWorkload]);

  const clearFilters = () => {
    setMetric('unified_training_load');
    setSportFilter('');
    setTypeFilter('');
    setDateRange({ start: '', end: '' });
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Control Bar */}
        <ControlBar
          metric={metric}
          onMetricChange={setMetric}
          sportFilter={sportFilter}
          onSportFilterChange={setSportFilter}
          typeFilter={typeFilter}
          onTypeFilterChange={setTypeFilter}
          dateRange={dateRange}
          onDateRangeChange={setDateRange}
          onClearFilters={clearFilters}
          availableSports={availableSports}
          availableTypes={availableTypes}
        />

        {/* Weekly Workload Chart */}
        <div className="bg-card p-6 rounded-lg shadow-md mb-6">
          <h2 className="text-md font-semibold mb-4 text-card-foreground">
            Training Load
          </h2>
          {loadingWeeklyWorkload && (
            <div className="h-72 flex items-center justify-center">
              <p className="text-muted-foreground">
                Loading weekly workload...
              </p>
            </div>
          )}
          {errorWeeklyWorkload && (
            <div className="h-72 flex items-center justify-center text-destructive">
              Error: {errorWeeklyWorkload}
            </div>
          )}
          {weeklyWorkload && weeklyWorkload.weeks.length > 0 ? (
            <WeeklyWorkloadChart
              data={weeklyWorkload.weeks}
              metricLabel="Unified Training Load"
            />
          ) : (
            !loadingWeeklyWorkload && (
              <div className="h-72 flex items-center justify-center">
                <p className="text-muted-foreground">
                  No weekly workload data to display for the selected period.
                </p>
              </div>
            )
          )}
        </div>

        {/* Visual Activity Log */}
        {loadingVisualLog && (
          <div className="bg-card p-6 rounded-lg shadow-md">
            <div className="h-72 flex items-center justify-center">
              <p className="text-muted-foreground">
                Loading visual activity log...
              </p>
            </div>
          </div>
        )}
        {errorVisualLog && (
          <div className="bg-card p-6 rounded-lg shadow-md">
            <div className="h-72 flex items-center justify-center text-destructive">
              Error: {errorVisualLog}
            </div>
          </div>
        )}
        {visualActivityLog && visualActivityLog.weeks.length > 0 ? (
          <div className="space-y-6">
            {visualActivityLog.weeks.map((week, index) => (
              <WeeklyRow
                key={`${week.week_start_date}-${index}`}
                weekData={week}
                metric={metric}
              />
            ))}
          </div>
        ) : (
          !loadingVisualLog && (
            <div className="bg-card p-6 rounded-lg shadow-md">
              <div className="h-72 flex items-center justify-center">
                <p className="text-muted-foreground">
                  No activities found for the selected filters.
                </p>
              </div>
            </div>
          )
        )}

        {/* Legend */}
        <div className="flex flex-wrap justify-center gap-4 mt-6 text-sm">
          {Object.entries({
            cycling: '#22c55e',
            run: '#f59e0b',
            gym: '#8b5cf6',
            yoga: '#ec4899',
            meditation: '#ec4899',
            walk: '#06b6d4',
            hike: '#10b981',
            swim: '#3b82f6',
            other: '#6b7280',
          }).map(([sport, color]) => (
            <div key={sport} className="flex items-center gap-1">
              <span
                className="inline-block w-3 h-3 rounded-full"
                style={{ backgroundColor: color }}
              />
              <span className="text-gray-700 dark:text-gray-300 capitalize">
                {sport}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
