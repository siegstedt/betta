'use client';

import { useState, FormEvent, ChangeEvent, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Activity, Athlete, Equipment } from '@/lib/definitions';
import { config } from '@/lib/config';
import { RpeSelector, GearSelect } from '@/components';
import {
  Button,
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Textarea,
} from '@/components/ui';
import { FormField, FormError, FormSelect } from '@/components/forms';

const API_URL = config.apiUrl;

const ACTIVITY_TYPES = [
  'Commute',
  'Endurance',
  'Workout',
  'Race',
  'Group',
  'Threshold',
  'Active Recovery',
];
const SPORT_OPTIONS = ['cycling', 'run', 'gym', 'yoga', 'meditation', 'other'];
const SUB_SPORT_OPTIONS: { [key: string]: string[] } = {
  cycling: ['road', 'gravel', 'indoor', 'track', 'mtb'],
  run: ['road', 'trail', 'track', 'indoor', 'hike', 'walk'],
  gym: ['gymnastics', 'crossfit', 'cardio', 'strength'],
};

export default function NewActivityPage() {
  const router = useRouter();
  const params = useParams();
  const athleteId = params.id as string;

  const [activeTab, setActiveTab] = useState('upload'); // 'upload' or 'manual'
  const [athlete, setAthlete] = useState<Athlete | null>(null);
  const [loadingAthlete, setLoadingAthlete] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Upload state
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Manual entry state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [sport, setSport] = useState('');
  const [subSport, setSubSport] = useState('');
  const [rideType, setRideType] = useState('');
  const [perceivedExertion, setPerceivedExertion] = useState<number | string>(
    5
  );
  const [activityDate, setActivityDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [activityTime, setActivityTime] = useState(
    new Date().toTimeString().split(' ')[0].substring(0, 5)
  );
  const [durationHours, setDurationHours] = useState(0);
  const [durationMinutes, setDurationMinutes] = useState(0);
  const [durationSeconds, setDurationSeconds] = useState(0);
  const [distance, setDistance] = useState<number | ''>('');
  const [averagePower, setAveragePower] = useState<number | ''>('');
  const [averageHeartRate, setAverageHeartRate] = useState<number | ''>('');
  const [averageCadence, setAverageCadence] = useState<number | ''>('');
  const [averageSpeed, setAverageSpeed] = useState<number | ''>('');
  const [bikeId, setBikeId] = useState<string>('none');
  const [shoeId, setShoeId] = useState<string>('none');
  const [deviceId, setDeviceId] = useState<string>('none');
  const [trainerId, setTrainerId] = useState<string>('none');
  const [isSavingManual, setIsSavingManual] = useState(false);

  useEffect(() => {
    if (!athleteId) return;

    const fetchAthlete = async () => {
      setLoadingAthlete(true);
      try {
        const response = await fetch(`${API_URL}/athlete/${athleteId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch athlete data.');
        }
        const data: Athlete = await response.json();
        setAthlete(data);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Could not load athlete data.'
        );
      } finally {
        setLoadingAthlete(false);
      }
    };
    fetchAthlete();
  }, [athleteId]);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.name.toLowerCase().endsWith('.fit')) {
        setFile(selectedFile);
        setError(null);
      } else {
        setFile(null);
        setError('Invalid file type. Please select a .fit file.');
      }
    }
  };

  const handleUploadSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError('Please select a file to upload.');
      return;
    }

    setIsUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(`${API_URL}/activity/upload/${athleteId}`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to upload activity.');
      }

      const newActivity: Activity = await response.json();
      router.push(`/activity/${newActivity.activity_id}/overview`);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'An unknown error occurred.'
      );
    } finally {
      setIsUploading(false);
    }
  };

  const handleManualSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSavingManual(true);
    setError(null);

    const start_time = new Date(
      `${activityDate}T${activityTime}:00`
    ).toISOString();
    const duration_seconds =
      durationHours * 3600 + durationMinutes * 60 + durationSeconds;

    const payload = {
      name,
      description,
      sport,
      sub_sport: subSport,
      ride_type: rideType,
      perceived_exertion: Number(perceivedExertion),
      start_time,
      duration: duration_seconds,
      distance: distance !== '' ? Number(distance) : null,
      average_power: averagePower !== '' ? Number(averagePower) : null,
      average_heart_rate:
        averageHeartRate !== '' ? Number(averageHeartRate) : null,
      average_cadence: averageCadence !== '' ? Number(averageCadence) : null,
      average_speed: averageSpeed !== '' ? Number(averageSpeed) : null,
      bike_id: bikeId !== 'none' ? Number(bikeId) : null,
      shoe_id: shoeId !== 'none' ? Number(shoeId) : null,
      device_id: deviceId !== 'none' ? Number(deviceId) : null,
      trainer_id: trainerId !== 'none' ? Number(trainerId) : null,
    };

    try {
      const response = await fetch(`${API_URL}/activity/manual/${athleteId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.detail || 'Failed to create manual activity.'
        );
      }

      const newActivity: Activity = await response.json();
      router.push(`/activity/${newActivity.activity_id}/overview`);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'An unknown error occurred.'
      );
    } finally {
      setIsSavingManual(false);
    }
  };

  if (loadingAthlete) {
    return <div className="p-8 text-center">Loading athlete data...</div>;
  }

  if (error) {
    return <div className="p-8 text-center text-red-500">Error: {error}</div>;
  }

  if (!athlete) {
    return <div className="p-8 text-center">Athlete not found.</div>;
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
  const isRunning = sport.toLowerCase().includes('run');

  const subSportOptions = SUB_SPORT_OPTIONS[sport] || [];

  return (
    <Card className="w-full max-w-5xl mx-auto my-8">
      <CardHeader>
        <CardTitle>Add New Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex border-b mb-6">
          <button
            className={`py-2 px-4 text-sm font-medium ${activeTab === 'upload' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground'}`}
            onClick={() => setActiveTab('upload')}
          >
            Upload FIT File
          </button>
          <button
            className={`py-2 px-4 text-sm font-medium ${activeTab === 'manual' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground'}`}
            onClick={() => setActiveTab('manual')}
          >
            Manual Entry
          </button>
        </div>

        {activeTab === 'upload' && (
          <form onSubmit={handleUploadSubmit} className="space-y-6">
            <div>
              <Label htmlFor="file-upload">FIT File</Label>
              <div className="mt-1 flex justify-center rounded-md border border-dashed border-input px-6 py-5">
                <div className="space-y-1 text-center">
                  <svg
                    className="mx-auto h-12 w-12 text-muted-foreground"
                    stroke="currentColor"
                    fill="none"
                    viewBox="0 0 48 48"
                    aria-hidden="true"
                  >
                    <path
                      d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <div className="flex text-sm text-muted-foreground">
                    <Label
                      htmlFor="file-upload"
                      className="relative cursor-pointer rounded-md font-medium text-primary hover:text-primary-foreground focus-within:outline-none focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2"
                    >
                      <span>Upload a file</span>
                      <Input
                        id="file-upload"
                        name="file-upload"
                        type="file"
                        className="sr-only"
                        accept=".fit"
                        onChange={handleFileChange}
                      />
                    </Label>
                    <p className="pl-1">or drag and drop</p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {file ? file.name : 'FIT files only'}
                  </p>
                </div>
              </div>
            </div>
            {error && (
              <p className="text-sm text-destructive text-center">{error}</p>
            )}
            <div className="flex justify-end">
              <Button type="submit" disabled={isUploading || !file}>
                {isUploading ? 'Uploading...' : 'Upload & Continue'}
              </Button>
            </div>
          </form>
        )}

        {activeTab === 'manual' && (
          <form onSubmit={handleManualSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
              {/* Left Column */}
              <div className="space-y-6">
                <FormField label="Title" required>
                  <Input
                    type="text"
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </FormField>
                <FormField label="Description / Notes">
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={4}
                  />
                </FormField>
                <RpeSelector
                  value={Number(perceivedExertion)}
                  onChange={(v) => setPerceivedExertion(v)}
                />
                <FormField label="Date" required>
                  <Input
                    type="date"
                    id="activityDate"
                    value={activityDate}
                    onChange={(e) => setActivityDate(e.target.value)}
                    required
                  />
                </FormField>
                <FormField label="Time" required>
                  <Input
                    type="time"
                    id="activityTime"
                    value={activityTime}
                    onChange={(e) => setActivityTime(e.target.value)}
                    required
                  />
                </FormField>
                <div className="grid grid-cols-3 gap-4">
                  <FormField label="Duration (H)">
                    <Input
                      type="number"
                      id="durationHours"
                      value={durationHours}
                      onChange={(e) => setDurationHours(Number(e.target.value))}
                      min="0"
                    />
                  </FormField>
                  <FormField label="Duration (M)">
                    <Input
                      type="number"
                      id="durationMinutes"
                      value={durationMinutes}
                      onChange={(e) =>
                        setDurationMinutes(Number(e.target.value))
                      }
                      min="0"
                      max="59"
                    />
                  </FormField>
                  <FormField label="Duration (S)">
                    <Input
                      type="number"
                      id="durationSeconds"
                      value={durationSeconds}
                      onChange={(e) =>
                        setDurationSeconds(Number(e.target.value))
                      }
                      min="0"
                      max="59"
                    />
                  </FormField>
                </div>
                <FormField label="Distance (km)">
                  <Input
                    type="number"
                    id="distance"
                    value={distance}
                    onChange={(e) => setDistance(Number(e.target.value))}
                    step="0.01"
                    min="0"
                  />
                </FormField>
              </div>

              {/* Right Column */}
              <div className="space-y-6">
                <FormSelect
                  label="Sport"
                  value={sport}
                  onValueChange={(newSport) => {
                    setSport(newSport);
                    setSubSport('');
                  }}
                  options={SPORT_OPTIONS.map((s) => ({
                    value: s,
                    label: s
                      .replace(/_/g, ' ')
                      .replace(/\b\w/g, (l) => l.toUpperCase()),
                  }))}
                  placeholder="Select a sport..."
                  required
                />

                {subSportOptions.length > 0 && (
                  <FormSelect
                    label="Sub-Sport"
                    value={subSport}
                    onValueChange={setSubSport}
                    options={subSportOptions.map((ss) => ({
                      value: ss,
                      label: ss
                        .replace(/_/g, ' ')
                        .replace(/\b\w/g, (l) => l.toUpperCase()),
                    }))}
                    placeholder="Select a sub-sport..."
                  />
                )}

                <FormSelect
                  label="Type"
                  value={rideType}
                  onValueChange={setRideType}
                  options={ACTIVITY_TYPES.map((type) => ({
                    value: type,
                    label: type,
                  }))}
                  placeholder="Select a type..."
                />

                <div className="space-y-4 pt-4 border-t">
                  <Label className="text-lg font-semibold">
                    Optional Metrics
                  </Label>
                  <FormField label="Average Power (W)">
                    <Input
                      type="number"
                      id="averagePower"
                      value={averagePower}
                      onChange={(e) => setAveragePower(Number(e.target.value))}
                      min="0"
                    />
                  </FormField>
                  <FormField label="Average Heart Rate (bpm)">
                    <Input
                      type="number"
                      id="averageHeartRate"
                      value={averageHeartRate}
                      onChange={(e) =>
                        setAverageHeartRate(Number(e.target.value))
                      }
                      min="0"
                    />
                  </FormField>
                  <FormField label="Average Cadence (rpm)">
                    <Input
                      type="number"
                      id="averageCadence"
                      value={averageCadence}
                      onChange={(e) =>
                        setAverageCadence(Number(e.target.value))
                      }
                      min="0"
                    />
                  </FormField>
                  <FormField label="Average Speed (km/h)">
                    <Input
                      type="number"
                      id="averageSpeed"
                      value={averageSpeed}
                      onChange={(e) => setAverageSpeed(Number(e.target.value))}
                      step="0.01"
                      min="0"
                    />
                  </FormField>
                </div>

                {/* Gear Section */}
                <div className="space-y-4 pt-4 border-t">
                  <Label className="text-lg font-semibold">Equipment</Label>
                  {isCycling && (
                    <GearSelect
                      label="Bike"
                      value={bikeId}
                      onValueChange={setBikeId}
                      items={bikes}
                      athleteId={Number(athleteId)}
                    />
                  )}
                  {isCycling && (
                    <GearSelect
                      label="Trainer"
                      value={trainerId}
                      onValueChange={setTrainerId}
                      items={trainers}
                      athleteId={Number(athleteId)}
                    />
                  )}
                  <GearSelect
                    label="Device"
                    value={deviceId}
                    onValueChange={setDeviceId}
                    items={devices}
                    athleteId={Number(athleteId)}
                  />
                  {isRunning && (
                    <GearSelect
                      label="Shoes"
                      value={shoeId}
                      onValueChange={setShoeId}
                      items={shoes}
                      athleteId={Number(athleteId)}
                    />
                  )}
                </div>
              </div>
            </div>
            {error && <FormError>{error}</FormError>}
            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={
                  isSavingManual ||
                  !name ||
                  !sport ||
                  !activityDate ||
                  !activityTime ||
                  (durationHours === 0 &&
                    durationMinutes === 0 &&
                    durationSeconds === 0)
                }
              >
                {isSavingManual ? 'Saving...' : 'Create Activity'}
              </Button>
            </div>
          </form>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="ghost" asChild>
          <Link href={`/athlete/${athleteId}/activities`}>Cancel</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
