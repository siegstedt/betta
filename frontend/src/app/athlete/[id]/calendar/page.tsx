'use client';

import { useParams } from 'next/navigation';

export default function CalendarPage() {
  const params = useParams();
  const athleteId = params.id as string;

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold tracking-tight mb-6 text-foreground">
          Calendar
        </h1>

        <div className="bg-card p-6 rounded-lg shadow-md">
          <div className="h-96 flex items-center justify-center text-muted-foreground">
            [Calendar View Placeholder - Coming Soon]
          </div>
        </div>
      </div>
    </div>
  );
}
