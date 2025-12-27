'use client';

import { Activity } from '@/lib/definitions';
import Link from 'next/link';
import { CardContent, CardHeader, CardTitle } from '@/components/ui';

interface EquipmentCardProps {
  label: string;
  name: string | null | undefined;
}

const EquipmentItem = ({ label, name }: EquipmentCardProps) => {
  if (!name) return null;

  return (
    <div className="p-2 -m-2">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p
        className="mt-0.5 text-sm font-medium text-foreground truncate"
        title={name}
      >
        {name}
      </p>
    </div>
  );
};

export default function ActivityEquipment({
  activity,
}: {
  activity: Activity;
}) {
  const { device, bike, shoe, trainer, source } = activity;

  return (
    <>
      <CardHeader className="pt-6 pb-2">
        <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Equipment
        </CardTitle>
      </CardHeader>

      <CardContent className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-4">
        <EquipmentItem label="Device" name={device?.name} />
        <EquipmentItem label="Bike" name={bike?.name} />
        <EquipmentItem label="Shoes" name={shoe?.name} />
        <EquipmentItem label="Trainer" name={trainer?.name} />
        {source === 'strava' && (
          <div className="p-2 -m-2">
            <p className="text-xs font-medium text-muted-foreground">Source</p>
            <div className="mt-0.5 flex items-center space-x-1">
              <div className="w-6 h-6 bg-orange-500 rounded flex items-center justify-center">
                <span className="text-white font-bold text-xs">S</span>
              </div>
              <p className="text-sm font-medium text-foreground">Strava</p>
            </div>
          </div>
        )}
        <Link href={`/activity/${activity.activity_id}/edit`}>
          <div className="p-2 rounded-lg border border-dashed border-muted-foreground/50 text-center transition-colors hover:bg-accent">
            <p className="mt-0.5 text-xs font-medium text-muted-foreground">
              add
            </p>
          </div>
        </Link>
      </CardContent>
    </>
  );
}
