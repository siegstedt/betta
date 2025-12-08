'use client';

import Link from 'next/link';
import { Activity, Athlete } from '@/lib/definitions';
import { useState, useEffect } from 'react';
import ActivityMenu from './activity-menu';

const getSportDetails = (sport?: string) => {
  const type = sport?.toLowerCase() || 'cycling';
  if (type.includes('run')) return { icon: '🏃', color: 'bg-sky-500' };
  if (type.includes('strength') || type.includes('training'))
    return { icon: '🏋️', color: 'bg-orange-500' };
  if (type.includes('yoga')) return { icon: '🧘', color: 'bg-purple-500' };
  if (type.includes('walk')) return { icon: '🚶', color: 'bg-green-500' };
  // Default to cycling
  return { icon: '🚴', color: 'bg-amber-500' };
};

interface ActivityHeaderProps {
  activity: Activity;
  athlete: Athlete | null;
}

export default function ActivityHeader({
  activity,
  athlete,
}: ActivityHeaderProps) {
  const sportDetails = getSportDetails(activity.sport);
  const [formattedDate, setFormattedDate] = useState('');

  // Format date on the client to avoid hydration mismatch from toLocaleString()
  useEffect(() => {
    setFormattedDate(new Date(activity.start_time).toLocaleString());
  }, [activity.start_time]);

  return (
    <div className="grid grid-cols-[auto,1fr,auto] items-center gap-x-4">
      {/* Column 1: Icon */}
      <div className="flex flex-col items-center gap-y-1">
        <div
          className={`w-10 h-10 rounded-full flex items-center justify-center ${sportDetails.color}`}
        >
          <span className="text-xl">{sportDetails.icon}</span>
        </div>
        {activity.sub_sport && (
          <span className="text-xs text-muted-foreground capitalize">
            {activity.sub_sport.replace(/_/g, ' ')}
          </span>
        )}
      </div>

      {/* Column 2: Info */}
      <div>
        {athlete && (
          <Link
            href={`/athlete/${athlete.athlete_id}/profile`}
            className="text-sm text-primary hover:underline"
          >
            {athlete.first_name} {athlete.last_name}
          </Link>
        )}
        <h1 className="text-xl font-semibold tracking-tight">
          {activity.name}
        </h1>
        <p className="text-xs text-muted-foreground">{formattedDate}</p>
      </div>

      {/* Column 3: Menu */}
      <div className="justify-self-end">
        <ActivityMenu
          activityId={activity.activity_id!.toString()}
          athleteId={activity.athlete_id}
        />
      </div>
    </div>
  );
}
