'use client';

import Link from 'next/link';
import { Equipment } from '@/lib/definitions';
import { Button, Label } from '@/components/ui';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface GearSelectProps {
  label: string;
  value: string;
  onValueChange: (value: string) => void;
  items: Equipment[];
  athleteId: number;
}

export function GearSelect({
  label,
  value,
  onValueChange,
  items,
  athleteId,
}: GearSelectProps) {
  return (
    <div>
      <div className="flex justify-between items-center">
        <Label htmlFor={label}>{label}</Label>
        <Button variant="link" size="sm" asChild className="h-auto p-0 text-xs">
          <Link href={`/athlete/${athleteId}/equipment`}>
            + add {label.toLowerCase()}
          </Link>
        </Button>
      </div>
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger id={label} className="mt-1">
          <SelectValue placeholder="None" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">None</SelectItem>
          {items.map((item) => (
            <SelectItem
              key={item.equipment_id}
              value={item.equipment_id.toString()}
            >
              {item.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
