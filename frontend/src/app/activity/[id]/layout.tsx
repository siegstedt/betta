import { ActivityHeader } from '@/components/activity';
import { Header } from '@/components/layout';
import { Activity, Athlete } from '@/lib/definitions';
import { config } from '@/lib/config';

// API URL from environment configuration
const API_URL = config.apiUrl;

async function getActivityData(
  activityId: string
): Promise<{ activity: Activity | null; athlete: Athlete | null }> {
  try {
    const activityRes = await fetch(`${API_URL}/activity/${activityId}`, {
      cache: 'no-store',
    });
    if (!activityRes.ok) {
      console.error(
        `Failed to fetch activity ${activityId}: ${activityRes.statusText}`
      );
      return { activity: null, athlete: null };
    }
    const activity: Activity = await activityRes.json();

    const athleteRes = await fetch(
      `${API_URL}/athlete/${activity.athlete_id}`,
      { cache: 'no-store' }
    );
    if (!athleteRes.ok) {
      console.error(
        `Failed to fetch athlete ${activity.athlete_id}: ${athleteRes.statusText}`
      );
      return { activity, athlete: null };
    }
    const athlete: Athlete = await athleteRes.json();

    return { activity, athlete };
  } catch (error) {
    console.error('Failed to fetch layout data:', error);
    return { activity: null, athlete: null };
  }
}

export default async function ActivityLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { activity, athlete } = await getActivityData(id);

  if (!activity) {
    return (
      <div className="p-8 text-center">
        Activity not found or failed to load.
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header athlete={athlete} activity={activity} />
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 scroll-smooth">
        <div className="max-w-7xl mx-auto space-y-8">
          <ActivityHeader activity={activity} athlete={athlete} />
          {children}
        </div>
      </main>
    </div>
  );
}
