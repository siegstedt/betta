'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Athlete, Equipment } from '@/lib/definitions';
import { config } from '@/lib/config';

const API_URL = config.apiUrl;

const getEquipmentIcon = (type: string) => {
  switch (type) {
    case 'bike':
      return '🚲';
    case 'shoes':
      return '👟';
    case 'trainer':
      return '🏠';
    case 'device':
      return '💻';
    default:
      return '🔧';
  }
};

export default function EquipmentPage() {
  const params = useParams();
  const athleteId = params.id as string;
  const [athlete, setAthlete] = useState<Athlete | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!athleteId) return;
    const fetchAthlete = async () => {
      setLoading(true);
      try {
        const response = await fetch(`${API_URL}/athlete/${athleteId}`);
        if (!response.ok) throw new Error('Failed to fetch athlete data.');
        const data: Athlete = await response.json();
        setAthlete(data);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'An unknown error occurred.'
        );
      } finally {
        setLoading(false);
      }
    };
    fetchAthlete();
  }, [athleteId]);

  if (loading)
    return <div className="p-8 text-center">Loading Equipment...</div>;
  if (error)
    return <div className="p-8 text-center text-red-500">Error: {error}</div>;
  if (!athlete)
    return <div className="p-8 text-center">Athlete not found.</div>;

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            My Gear
          </h1>
          <Link
            href={`/athlete/${athleteId}/equipment/new`}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md text-sm"
          >
            Add New Gear
          </Link>
        </div>
        <div className="bg-card p-6 rounded-lg shadow-md">
          <ul className="divide-y divide-border">
            {athlete.equipment.length > 0 ? (
              athlete.equipment.map((item: Equipment) => (
                <li
                  key={item.equipment_id}
                  className="py-4 flex items-center justify-between"
                >
                  <div className="flex items-center">
                    <span className="text-2xl mr-4">
                      {getEquipmentIcon(item.equipment_type)}
                    </span>
                    <div>
                      <p className="text-lg font-medium text-gray-900 dark:text-gray-100">
                        {item.name}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">
                        {item.brand} {item.model}
                      </p>
                    </div>
                  </div>
                  <Link
                    href={`/athlete/${athleteId}/equipment/${item.equipment_id}`}
                    className="text-sm font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
                  >
                    Edit
                  </Link>
                </li>
              ))
            ) : (
              <p className="text-center text-gray-500 py-4">
                No equipment has been added yet.
              </p>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}
