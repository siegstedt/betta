'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Athlete, AthleteMetric } from '@/lib/definitions';
import { config } from '@/lib/config';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui';
import { FormField, FormSelect } from '@/components/forms';
import { ThemeToggle } from '@/components/ui/theme-toggle';

// The backend API URL from environment configuration
const API_URL = config.apiUrl;

export default function SettingsPage() {
  const params = useParams();
  const router = useRouter();
  const athleteId = params.id as string;
  const [athlete, setAthlete] = useState<Athlete | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Profile form state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [dob, setDob] = useState('');
  const [weight, setWeight] = useState('');

  // Metric form state
  const [metricType, setMetricType] = useState<'weight' | 'ftp' | 'thr'>('ftp');
  const [metricValue, setMetricValue] = useState('');
  const [metricDate, setMetricDate] = useState(
    new Date().toISOString().split('T')[0]
  );

  // Profile picture state
  const [profilePicture, setProfilePicture] = useState<File | null>(null);
  const [profilePicturePreview, setProfilePicturePreview] = useState<
    string | null
  >(null);

  // Delete account state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [confirmationName, setConfirmationName] = useState('');
  const [deleting, setDeleting] = useState(false);

  // Strava state
  const [stravaConnecting, setStravaConnecting] = useState(false);

  const fetchAthlete = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_URL}/athlete/${athleteId}`);
      if (response.ok) {
        const athleteData = await response.json();
        setAthlete(athleteData);

        // Initialize form values
        setFirstName(athleteData.first_name || '');
        setLastName(athleteData.last_name || '');
        setDob(athleteData.date_of_birth || '');

        // Get latest weight from metrics
        const latestWeight = athleteData.metrics
          .filter((m: AthleteMetric) => m.metric_type === 'weight')
          .sort(
            (a: AthleteMetric, b: AthleteMetric) =>
              new Date(b.date_established).getTime() -
              new Date(a.date_established).getTime()
          )[0];
        if (latestWeight) {
          setWeight(latestWeight.value.toString());
        }
      } else {
        throw new Error('Failed to load athlete data');
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'An unknown error occurred.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAthlete();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [athleteId]);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const error = urlParams.get('error');
    if (code && athleteId) {
      // Call callback
      fetch(`${API_URL}/strava/callback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, athlete_id: parseInt(athleteId) }),
      })
        .then(() => {
          // Clear URL
          window.history.replaceState(
            {},
            document.title,
            window.location.pathname
          );
          fetchAthlete();
        })
        .catch(() => setError('Failed to connect Strava'));
    } else if (error) {
      setError('Strava connection failed: ' + error);
      // Clear URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [athleteId]);

  const handleProfileSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!athlete) return;

    const payload = {
      first_name: firstName,
      last_name: lastName,
      date_of_birth: dob || null,
    };

    try {
      const response = await fetch(`${API_URL}/athlete/${athlete.athlete_id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error('Failed to update profile.');

      // Refresh data after successful submission
      await fetchAthlete();
      setError(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'An unknown error occurred.'
      );
    }
  };

  const handleWeightSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!athlete || !weight) return;

    const payload = {
      metric_type: 'weight',
      value: parseFloat(weight),
      date_established: new Date().toISOString().split('T')[0],
    };

    try {
      const response = await fetch(
        `${API_URL}/athlete/${athlete.athlete_id}/metrics`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) throw new Error('Failed to update weight.');

      // Refresh data after successful submission
      await fetchAthlete();
      setError(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'An unknown error occurred.'
      );
    }
  };

  const handleMetricSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!athlete) return;

    const payload = {
      metric_type: metricType,
      value: parseFloat(metricValue),
      date_established: metricDate,
    };

    try {
      const response = await fetch(
        `${API_URL}/athlete/${athlete.athlete_id}/metrics`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) throw new Error('Failed to add metric.');

      // Clear form and refresh data
      setMetricValue('');
      await fetchAthlete();
      setError(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'An unknown error occurred.'
      );
    }
  };

  const handleProfilePictureChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Please select a valid image file.');
        return;
      }

      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        setError('File size must be less than 5MB.');
        return;
      }

      setProfilePicture(file);

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setProfilePicturePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleProfilePictureUpload = async () => {
    if (!profilePicture || !athlete) return;

    const formData = new FormData();
    formData.append('profile_picture', profilePicture);

    try {
      const response = await fetch(
        `${API_URL}/athlete/${athlete.athlete_id}/profile-picture`,
        {
          method: 'POST',
          body: formData,
        }
      );

      if (!response.ok) throw new Error('Failed to upload profile picture.');

      // Refresh data after successful upload
      await fetchAthlete();
      setProfilePicture(null);
      setProfilePicturePreview(null);
      setError(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'An unknown error occurred.'
      );
    }
  };

  const handleStravaConnect = async () => {
    if (!athlete) return;

    setStravaConnecting(true);
    try {
      if (athlete.is_strava_connected) {
        // Disconnect
        const response = await fetch(
          `${API_URL}/strava/disconnect/${athlete.athlete_id}`,
          {
            method: 'DELETE',
          }
        );
        if (!response.ok) throw new Error('Failed to disconnect Strava.');
      } else {
        // Connect: get auth url and redirect
        const response = await fetch(`${API_URL}/strava/auth`);
        if (response.ok) {
          const data = await response.json();
          window.location.href = data.auth_url;
          return;
        } else {
          throw new Error('Failed to get Strava auth URL.');
        }
      }
      // Refresh athlete data
      await fetchAthlete();
      setError(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'An unknown error occurred.'
      );
    } finally {
      setStravaConnecting(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!athlete || confirmationName !== athlete.first_name) return;

    setDeleting(true);
    try {
      const response = await fetch(`${API_URL}/athlete/${athlete.athlete_id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to delete account.');
      }

      // Redirect to home page after successful deletion
      router.push('/');
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'An unknown error occurred.'
      );
      setDeleting(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center">Loading settings...</div>;
  }

  if (error && !athlete) {
    return <div className="p-8 text-center text-red-500">Error: {error}</div>;
  }

  if (!athlete) {
    return <div className="p-8 text-center">Athlete not found.</div>;
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-semibold tracking-tight mb-6 text-foreground">
          Settings
        </h1>

        {error && (
          <div className="bg-red-100 dark:bg-red-900/50 border-l-4 border-red-500 text-red-800 dark:text-red-200 p-4 rounded-r-lg mb-6">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Profile Information & Picture */}
          <div className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Profile Information</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleProfileSubmit} className="space-y-4">
                  <FormField label="First Name" required>
                    <Input
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      required
                    />
                  </FormField>
                  <FormField label="Last Name" required>
                    <Input
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      required
                    />
                  </FormField>
                  <FormField label="Date of Birth">
                    <Input
                      type="date"
                      value={dob}
                      onChange={(e) => setDob(e.target.value)}
                    />
                  </FormField>
                  <Button type="submit" className="w-full">
                    Save Profile
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Profile Picture</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-4">
                  <div className="w-20 h-20 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center overflow-hidden">
                    {profilePicturePreview ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={profilePicturePreview}
                        alt="Profile preview"
                        className="w-full h-full object-cover"
                      />
                    ) : athlete.profile_picture_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={`${API_URL}${athlete.profile_picture_url}`}
                        alt="Profile picture"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-2xl text-gray-500">
                        {athlete.first_name?.[0]}
                        {athlete.last_name?.[0]}
                      </span>
                    )}
                  </div>
                  <div className="flex-1">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleProfilePictureChange}
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      PNG, JPG up to 5MB
                    </p>
                  </div>
                </div>
                {profilePicture && (
                  <Button
                    onClick={handleProfilePictureUpload}
                    className="w-full"
                  >
                    Upload Picture
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Performance Metrics & Weight */}
          <div className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Performance Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleMetricSubmit} className="space-y-4">
                  <FormSelect
                    label="Metric Type"
                    value={metricType}
                    onValueChange={(value) =>
                      setMetricType(value as 'weight' | 'ftp' | 'thr')
                    }
                    options={[
                      { value: 'ftp', label: 'FTP (Watts)' },
                      { value: 'thr', label: 'LTHR (bpm)' },
                    ]}
                    placeholder="Select metric type"
                    required
                  />
                  <FormField label="Value" required>
                    <Input
                      type="number"
                      value={metricValue}
                      onChange={(e) => setMetricValue(e.target.value)}
                      required
                    />
                  </FormField>
                  <FormField label="Date Established" required>
                    <Input
                      type="date"
                      value={metricDate}
                      onChange={(e) => setMetricDate(e.target.value)}
                      required
                    />
                  </FormField>
                  <Button type="submit" className="w-full">
                    Add Metric
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Weight</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleWeightSubmit} className="space-y-4">
                  <FormField label="Current Weight (kg)">
                    <Input
                      type="number"
                      step="0.1"
                      value={weight}
                      onChange={(e) => setWeight(e.target.value)}
                      placeholder="Enter your weight"
                    />
                  </FormField>
                  <Button type="submit" className="w-full">
                    Update Weight
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Connected Apps */}
        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Connected Apps</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-orange-500 rounded flex items-center justify-center">
                      <span className="text-white font-bold text-sm">S</span>
                    </div>
                    <div>
                      <p className="font-medium">Strava</p>
                      <p className="text-sm text-muted-foreground">
                        Sync activities automatically
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    onClick={handleStravaConnect}
                    disabled={stravaConnecting}
                  >
                    {stravaConnecting
                      ? 'Processing...'
                      : athlete?.is_strava_connected
                        ? 'Disconnect'
                        : 'Connect'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Theme Settings */}
        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Theme</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Choose your preferred theme
                </span>
                <ThemeToggle />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Danger Zone */}
        <div className="mt-8">
          <Card className="border-destructive">
            <CardHeader>
              <CardTitle className="text-lg text-destructive">
                Danger Zone
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-destructive">
                    Delete Account
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Permanently delete your account and all associated data.
                    This action cannot be undone.
                  </p>
                </div>
                <Dialog
                  open={deleteDialogOpen}
                  onOpenChange={setDeleteDialogOpen}
                >
                  <DialogTrigger asChild>
                    <Button variant="destructive">Delete Account</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Delete Account</DialogTitle>
                      <DialogDescription>
                        This action cannot be undone. This will permanently
                        delete your account and remove all your data from our
                        servers.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <label
                          htmlFor="confirmation-name"
                          className="text-sm font-medium"
                        >
                          Please type <strong>{athlete?.first_name}</strong> to
                          confirm:
                        </label>
                        <Input
                          id="confirmation-name"
                          type="text"
                          value={confirmationName}
                          onChange={(e) => setConfirmationName(e.target.value)}
                          placeholder={`Type ${athlete?.first_name} here`}
                          className="mt-2"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setDeleteDialogOpen(false);
                          setConfirmationName('');
                        }}
                        disabled={deleting}
                      >
                        Cancel
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={handleDeleteAccount}
                        disabled={
                          confirmationName !== athlete?.first_name || deleting
                        }
                      >
                        {deleting ? 'Deleting...' : 'Delete Account'}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
