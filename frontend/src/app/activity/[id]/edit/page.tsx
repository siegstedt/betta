'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import {
  Activity,
  Athlete,
  Equipment,
  ActivityUpdatePayload,
} from '@/lib/definitions';
import { config } from '@/lib/config';
import { RpeSelector } from '@/components';
import { GearSelect } from '@/components';
import {
  Button,
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
} from '@/components/ui';

const API_URL = config.apiUrl;

// Updated list of activity types
const ACTIVITY_TYPES = [
  'Commute',
  'Endurance',
  'Workout',
  'Race',
  'Group',
  'Threshold',
  'Active Recovery',
];

// New constants for sport and sub-sport options
const SPORT_OPTIONS = ['cycling', 'run', 'gym', 'yoga', 'meditation', 'other'];
const SUB_SPORT_OPTIONS: { [key: string]: string[] } = {
  cycling: ['road', 'gravel', 'indoor', 'track', 'mtb'],
  run: ['road', 'trail', 'track', 'indoor', 'hike', 'walk'],
  gym: ['gymnastics', 'crossfit', 'cardio', 'strength'],
};

export default function EditActivityPage() {
  const router = useRouter();
  const params = useParams();
  const activityId = params.id as string;

  const [activity, setActivity] = useState<Activity | null>(null);
  const [athlete, setAthlete] = useState<Athlete | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [sport, setSport] = useState('');
  const [subSport, setSubSport] = useState('');
  const [rideType, setRideType] = useState('');
  const [perceivedExertion, setPerceivedExertion] = useState<number | string>(
    5
  );
  const [bikeId, setBikeId] = useState<string>('none');
  const [shoeId, setShoeId] = useState<string>('none');
  const [deviceId, setDeviceId] = useState<string>('none');
  const [trainerId, setTrainerId] = useState<string>('none');
  const [trainerSetting, setTrainerSetting] = useState<number>(1);

  useEffect(() => {
    if (!activityId) return;

    const fetchActivity = async () => {
      setLoading(true);
      try {
        const activityRes = await fetch(`${API_URL}/activity/${activityId}`);
        if (!activityRes.ok) {
          const errorData = await activityRes.json();
          throw new Error(errorData.detail || 'Failed to fetch activity data.');
        }
        const data: Activity = await activityRes.json();
        setActivity(data);

        // Fetch the athlete to get their equipment list
        const athleteRes = await fetch(`${API_URL}/athlete/${data.athlete_id}`);
        if (!athleteRes.ok) {
          throw new Error('Failed to fetch athlete data for equipment.');
        }
        const athleteData: Athlete = await athleteRes.json();
        setAthlete(athleteData);

        // Initialize form state
        setName(data.name);
        setDescription(data.description || '');
        setSport(data.sport || '');
        setSubSport(data.sub_sport || '');
        setRideType(data.ride_type || '');
        setPerceivedExertion(data.perceived_exertion || 5);
        setBikeId(data.bike_id?.toString() || 'none');
        setShoeId(data.shoe_id?.toString() || 'none');
        setDeviceId(data.device_id?.toString() || 'none');
        setTrainerId(data.trainer_id?.toString() || 'none');
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'An unknown error occurred.'
        );
      } finally {
        setLoading(false);
      }
    };

    fetchActivity();
  }, [activityId]);

  const handleSaveChanges = async (e: FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);

    // Conditionally add trainer_setting to the payload for virtual power calculation
    const hasNoPower = !activity?.average_power || activity.average_power === 0;
    const trainerSettingValue =
      selectedTrainer?.name.includes('Tacx Blue Motion') && hasNoPower
        ? trainerSetting
        : undefined;

    const payload: ActivityUpdatePayload = {
      name,
      description,
      sport,
      sub_sport: subSport,
      ride_type: rideType,
      perceived_exertion: Number(perceivedExertion),
      bike_id: bikeId !== 'none' ? Number(bikeId) : null,
      shoe_id: shoeId !== 'none' ? Number(shoeId) : null,
      device_id: deviceId !== 'none' ? Number(deviceId) : null,
      trainer_id: trainerId !== 'none' ? Number(trainerId) : null,
      ...(trainerSettingValue !== undefined && {
        trainer_setting: trainerSettingValue,
      }),
    };

    try {
      const response = await fetch(`${API_URL}/activity/${activityId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to save changes.');
      }

      // On success, redirect to the single activity view
      router.push(`/activity/${activityId}/overview`);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'An unknown error occurred.'
      );
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center">Loading activity details...</div>;
  }

  if (error) {
    return <div className="p-8 text-center text-red-500">Error: {error}</div>;
  }

  if (!activity) {
    return <div className="p-8 text-center">Activity not found.</div>;
  }

  const equipment = athlete?.equipment || [];
  const bikes = equipment.filter((e: Equipment) => e.equipment_type === 'bike');
  const shoes = equipment.filter(
    (e: Equipment) => e.equipment_type === 'shoes'
  );
  const trainers = equipment.filter(
    (e: Equipment) => e.equipment_type === 'trainer'
  );
  const devices = equipment.filter(
    (e: Equipment) => e.equipment_type === 'device'
  );

  const isCycling = sport.toLowerCase().includes('cycling');
  const isVirtual = subSport.toLowerCase().includes('indoor');
  const isRunning = sport.toLowerCase().includes('run');
  const selectedTrainer = trainers.find(
    (t: Equipment) => t.equipment_id.toString() === trainerId
  );
  const hasNoPower = !activity?.average_power || activity.average_power === 0;
  const showTrainerSettingSlider =
    selectedTrainer?.name.includes('Tacx Blue Motion') && hasNoPower;

  // Gracefully handle sub-sport options
  const getSubSportOptions = () => {
    const options = SUB_SPORT_OPTIONS[sport] || [];
    // If the originally loaded activity's sport is the currently selected one,
    // and its sub-sport isn't in the standard list, add it as a temporary option.
    if (
      activity &&
      sport === activity.sport &&
      activity.sub_sport &&
      !options.includes(activity.sub_sport)
    ) {
      return [...options, activity.sub_sport];
    }
    return options;
  };
  const subSportOptions = getSubSportOptions();

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Edit Activity</CardTitle>
      </CardHeader>
      <form onSubmit={handleSaveChanges}>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-7 gap-x-8 gap-y-6">
            {/* Left Column */}
            <div className="md:col-span-4 space-y-6">
              <div>
                <Label htmlFor="name">Title</Label>
                <Input
                  type="text"
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="description">Description / Notes</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  className="mt-1"
                />
              </div>

              <RpeSelector
                value={Number(perceivedExertion)}
                onChange={(v) => setPerceivedExertion(v)}
              />

              <div>
                <Label htmlFor="trainingPlan">Training Plan</Label>
                <Select disabled>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Coming soon..." />
                  </SelectTrigger>
                </Select>
              </div>
            </div>

            {/* Right Column */}
            <div className="md:col-span-3 space-y-6">
              <div>
                <Label htmlFor="sport">Sport</Label>
                <Select
                  value={sport}
                  onValueChange={(newSport) => {
                    setSport(newSport);
                    setSubSport('');
                  }}
                >
                  <SelectTrigger id="sport" className="mt-1">
                    <SelectValue placeholder="Select a sport..." />
                  </SelectTrigger>
                  <SelectContent>
                    {SPORT_OPTIONS.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s
                          .replace(/_/g, ' ')
                          .replace(/\b\w/g, (l) => l.toUpperCase())}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {subSportOptions.length > 0 && (
                <div>
                  <Label htmlFor="subSport">Sub-Sport</Label>
                  <Select value={subSport} onValueChange={setSubSport}>
                    <SelectTrigger id="subSport" className="mt-1">
                      <SelectValue placeholder="Select a sub-sport..." />
                    </SelectTrigger>
                    <SelectContent>
                      {subSportOptions.map((ss) => (
                        <SelectItem key={ss} value={ss}>
                          {ss
                            .replace(/_/g, ' ')
                            .replace(/\b\w/g, (l) => l.toUpperCase())}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div>
                <Label htmlFor="rideType">Type</Label>
                <Select value={rideType} onValueChange={setRideType}>
                  <SelectTrigger id="rideType" className="mt-1">
                    <SelectValue placeholder="Select a type..." />
                  </SelectTrigger>
                  <SelectContent>
                    {ACTIVITY_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Gear Section */}
              <div className="space-y-4 pt-4 border-t">
                {isCycling && (
                  <GearSelect
                    label="Bike"
                    value={bikeId}
                    onValueChange={setBikeId}
                    items={bikes}
                    athleteId={activity.athlete_id}
                  />
                )}
                {isCycling && isVirtual && (
                  <GearSelect
                    label="Trainer"
                    value={trainerId}
                    onValueChange={setTrainerId}
                    items={trainers}
                    athleteId={activity.athlete_id}
                  />
                )}
                {showTrainerSettingSlider && (
                  <div>
                    <Label htmlFor="trainer-setting">
                      Trainer Setting: {trainerSetting}
                    </Label>
                    <Input
                      type="range"
                      id="trainer-setting"
                      min="1"
                      max="10"
                      step="1"
                      value={trainerSetting}
                      onChange={(e) =>
                        setTrainerSetting(Number(e.target.value))
                      }
                      className="mt-1 w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>1</span>
                      <span>10</span>
                    </div>
                  </div>
                )}
                <GearSelect
                  label="Device"
                  value={deviceId}
                  onValueChange={setDeviceId}
                  items={devices}
                  athleteId={activity.athlete_id}
                />
                {isRunning && (
                  <GearSelect
                    label="Shoes"
                    value={shoeId}
                    onValueChange={setShoeId}
                    items={shoes}
                    athleteId={activity.athlete_id}
                  />
                )}
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex-col items-stretch">
          {error && (
            <p className="text-sm text-destructive text-center mb-4">{error}</p>
          )}
          <div className="flex items-center justify-between">
            <Button variant="ghost" asChild>
              <Link href={`/activity/${activityId}/overview`}>Cancel</Link>
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </CardFooter>
      </form>
    </Card>
  );
}
