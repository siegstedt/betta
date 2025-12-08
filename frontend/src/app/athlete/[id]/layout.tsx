import { Header } from '@/components/layout';
import { Athlete } from '@/lib/definitions';
import { config } from '@/lib/config';

// API URL from environment configuration
const API_URL = config.apiUrl;

async function getAthlete(athleteId: string): Promise<Athlete | null> {
  try {
    // Use { cache: 'no-store' } to ensure we always get the latest athlete data
    const response = await fetch(`${API_URL}/athlete/${athleteId}`, {
      cache: 'no-store',
    });
    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch athlete:', error);
    return null;
  }
}

export default async function AthleteLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const athlete = await getAthlete(id);

  return (
    <div className="min-h-screen flex flex-col">
      <Header athlete={athlete} />
      <main className="flex-1 overflow-y-auto scroll-smooth">{children}</main>
    </div>
  );
}
