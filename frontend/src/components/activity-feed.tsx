import Link from 'next/link';
import { ActivityWithAthlete } from '@/lib/definitions';
import { formatDuration } from '@/lib/formatters';

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
          {activities.map((activity) => {
            const sportDetails = getSportDetails(activity.sport);
            return (
              <div
                key={activity.activity_id}
                className="bg-card text-card-foreground rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="grid grid-cols-[auto,1fr] items-start gap-x-4">
                  {/* Icon */}
                  <div className="flex flex-col items-center gap-y-1">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center ${sportDetails.color}`}
                    >
                      <span className="text-xl">{sportDetails.icon}</span>
                    </div>
                  </div>

                  {/* Main Content */}
                  <div className="flex-1">
                    <Link
                      href={`/activity/${activity.activity_id}/overview`}
                      className="text-lg font-medium hover:text-primary transition-colors"
                    >
                      {activity.name}
                    </Link>
                    <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                      <Link
                        href={`/athlete/${activity.athlete_id}/profile`}
                        className="hover:text-foreground transition-colors"
                      >
                        {activity.athlete_first_name}{' '}
                        {activity.athlete_last_name}
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
                        <span>
                          {formatDuration(activity.total_moving_time)}
                        </span>
                      )}
                      {activity.unified_training_load && (
                        <span>TL: {activity.unified_training_load}</span>
                      )}
                      {activity.sport && <span>{activity.sport}</span>}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
