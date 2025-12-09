import Link from 'next/link';
import { ActivityWithAthlete } from '@/lib/definitions';
import { formatDuration } from '@/lib/formatters';

interface ActivityFeedProps {
  activities: ActivityWithAthlete[];
}

export function ActivityFeed({ activities }: ActivityFeedProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Recent Activities</h2>
      {activities.length === 0 ? (
        <p className="text-muted-foreground">No recent activities</p>
      ) : (
        <div className="space-y-3">
          {activities.map((activity) => (
            <div
              key={activity.activity_id}
              className="bg-card text-card-foreground rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <Link
                    href={`/activity/${activity.activity_id}/overview`}
                    className="text-lg font-medium hover:text-primary transition-colors"
                  >
                    {activity.name}
                  </Link>
                  <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                    <Link
                      href={`/athlete/${activity.athlete.athlete_id}/profile`}
                      className="hover:text-foreground transition-colors"
                    >
                      {activity.athlete.first_name} {activity.athlete.last_name}
                    </Link>
                    <span>•</span>
                    <span>
                      {new Date(activity.start_time).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex gap-4 mt-2 text-sm text-muted-foreground">
                    {activity.total_distance && (
                      <span>
                        {(activity.total_distance / 1000).toFixed(1)} km
                      </span>
                    )}
                    {activity.total_moving_time && (
                      <span>{formatDuration(activity.total_moving_time)}</span>
                    )}
                    {activity.sport && <span>{activity.sport}</span>}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
