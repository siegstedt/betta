import Link from 'next/link';
import { AthleteSummary } from '@/lib/definitions';
import { config } from '@/lib/config';

const API_URL = config.apiUrl;

interface AthletePanelProps {
  athletes: AthleteSummary[];
}

export function AthletePanel({ athletes }: AthletePanelProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Athletes</h2>
        <Link
          href="/athlete/new"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          + add new
        </Link>
      </div>
      {athletes.length === 0 ? (
        <p className="text-muted-foreground">No athletes</p>
      ) : (
        <div className="space-y-3">
          {athletes.map((athlete) => (
            <Link
              key={athlete.athlete_id}
              href={`/athlete/${athlete.athlete_id}/profile`}
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors"
            >
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden flex-shrink-0">
                {athlete.profile_picture_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={`${API_URL}${athlete.profile_picture_url}`}
                    alt={`${athlete.first_name} ${athlete.last_name}`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-sm font-medium text-primary">
                    {athlete.first_name?.[0]}
                    {athlete.last_name?.[0]}
                  </span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium truncate">
                  {athlete.first_name} {athlete.last_name}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
